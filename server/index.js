const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { exec } = require('child_process');
const { promisify } = require('util');
const expressWs = require('express-ws');
const axios = require('axios');

const execAsync = promisify(exec);

const app = express();
expressWs(app);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const upload = multer({ dest: uploadsDir });

// Store authentication state (in production, use proper session management)
let authState = {
  tenantId: null,
  clientId: null,
  clientSecret: null,
  accessToken: null,
  connected: false
};

// WebSocket connections for live status updates
const wsConnections = new Map();

// Microsoft Graph API endpoints
const GRAPH_API_BASE = 'https://graph.microsoft.com/v1.0';

// Helper function to get access token
async function getAccessToken(tenantId, clientId, clientSecret) {
  const { ClientSecretCredential } = require('@azure/identity');
  const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  
  // Request token for Microsoft Graph
  const tokenResponse = await credential.getToken(['https://graph.microsoft.com/.default']);
  return tokenResponse.token;
}

// Helper function to make Graph API calls
async function graphApiCall(endpoint, method = 'GET', body = null) {
  if (!authState.accessToken) {
    throw new Error('Not authenticated');
  }

  const config = {
    method,
    url: `${GRAPH_API_BASE}${endpoint}`,
    headers: {
      'Authorization': `Bearer ${authState.accessToken}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    config.data = body;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    throw new Error(`Graph API error: ${error.response?.status || 'Unknown'} - ${error.response?.data?.error?.message || error.message}`);
  }
}

// Authentication endpoints
app.post('/api/auth/connect', async (req, res) => {
  try {
    const { tenantId, clientId, clientSecret } = req.body;

    if (!tenantId || !clientId || !clientSecret) {
      return res.status(400).json({ error: 'Missing required credentials' });
    }

    const accessToken = await getAccessToken(tenantId, clientId, clientSecret);

    authState = {
      tenantId,
      clientId,
      clientSecret,
      accessToken,
      connected: true
    };

    res.json({ success: true, message: 'Connected successfully' });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

app.post('/api/auth/disconnect', (req, res) => {
  authState = {
    tenantId: null,
    clientId: null,
    clientSecret: null,
    accessToken: null,
    connected: false
  };
  res.json({ success: true, message: 'Disconnected successfully' });
});

app.get('/api/auth/status', (req, res) => {
  res.json({ connected: authState.connected });
});

// Device endpoints
app.get('/api/devices', async (req, res) => {
  try {
    let allDevices = [];
    let nextLink = '/deviceManagement/managedDevices?$top=50&$select=id,deviceName,userPrincipalName,osVersion,manufacturer,model,complianceState,enrollmentType,lastSyncDateTime,enrolledDateTime,managementAgent,azureADDeviceId,serialNumber,groupTag';

    while (nextLink) {
      const response = await graphApiCall(nextLink);
      allDevices = allDevices.concat(response.value || []);
      nextLink = response['@odata.nextLink'] ? response['@odata.nextLink'].replace(GRAPH_API_BASE, '') : null;
    }

    res.json(allDevices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get device by ID, hostname, or serial number
app.post('/api/devices/find', async (req, res) => {
  try {
    const { identifier, type } = req.body; // type: 'id', 'hostname', 'serial'
    
    let allDevices = [];
    let nextLink = '/deviceManagement/managedDevices?$top=50&$select=id,deviceName,userPrincipalName,osVersion,manufacturer,model,complianceState,enrollmentType,lastSyncDateTime,enrolledDateTime,managementAgent,azureADDeviceId,serialNumber,groupTag';

    while (nextLink) {
      const response = await graphApiCall(nextLink);
      allDevices = allDevices.concat(response.value || []);
      nextLink = response['@odata.nextLink'] ? response['@odata.nextLink'].replace(GRAPH_API_BASE, '') : null;
    }

    let device = null;
    if (type === 'id') {
      device = allDevices.find(d => d.id === identifier);
    } else if (type === 'hostname') {
      device = allDevices.find(d => d.deviceName && d.deviceName.toLowerCase() === identifier.toLowerCase());
    } else if (type === 'serial') {
      device = allDevices.find(d => d.serialNumber && d.serialNumber.toLowerCase() === identifier.toLowerCase());
    }

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json(device);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk operations endpoint
app.post('/api/operations/bulk', upload.single('csv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded' });
    }

    const { operation } = req.body;
    const csvData = [];

    // Parse CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => csvData.push(row))
        .on('end', resolve)
        .on('error', reject);
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    // Execute PowerShell script based on operation
    const scriptPath = path.join(__dirname, 'scripts', `${operation}.ps1`);
    
    if (!fs.existsSync(scriptPath)) {
      return res.status(400).json({ error: `Script for operation ${operation} not found` });
    }

    // Ensure temp directory exists
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Create temporary CSV for PowerShell script
    const tempCsvPath = path.join(tempDir, `bulk_${Date.now()}.csv`);
    const csvContent = Object.keys(csvData[0]).join(',') + '\n' + 
                       csvData.map(row => Object.values(row).join(',')).join('\n');
    fs.writeFileSync(tempCsvPath, csvContent);

    // Execute PowerShell script
    const psCommand = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" -CsvPath "${tempCsvPath}" -TenantId "${authState.tenantId}" -ClientId "${authState.clientId}" -ClientSecret "${authState.clientSecret}"`;
    
    const jobId = `job_${Date.now()}`;
    
    // Start execution in background and track via WebSocket
    const childProcess = exec(psCommand, { maxBuffer: 1024 * 1024 * 10 }); // 10MB buffer
    
    // Send initial message
    setTimeout(() => {
      const ws = wsConnections.get(jobId);
      if (ws) {
        ws.send(JSON.stringify({ type: 'info', message: 'PowerShell script execution started...' }));
      }
    }, 100);
    
    // Capture stdout in real-time
    childProcess.stdout.on('data', (data) => {
      const ws = wsConnections.get(jobId);
      if (ws) {
        ws.send(JSON.stringify({ type: 'output', message: data.toString() }));
      }
    });
    
    // Capture stderr in real-time
    childProcess.stderr.on('data', (data) => {
      const ws = wsConnections.get(jobId);
      if (ws) {
        ws.send(JSON.stringify({ type: 'error', message: data.toString() }));
      }
    });
    
    // Handle completion
    childProcess.on('close', (code) => {
      const ws = wsConnections.get(jobId);
      if (ws) {
        if (code === 0) {
          ws.send(JSON.stringify({ type: 'complete', message: 'Operation completed successfully', code }));
        } else {
          ws.send(JSON.stringify({ type: 'error', message: `Operation completed with exit code ${code}`, code }));
        }
        setTimeout(() => {
          ws.close();
          wsConnections.delete(jobId);
        }, 1000);
      }
      
      // Clean up temp CSV
      if (fs.existsSync(tempCsvPath)) {
        fs.unlinkSync(tempCsvPath);
      }
    });
    
    // Handle errors
    childProcess.on('error', (error) => {
      const ws = wsConnections.get(jobId);
      if (ws) {
        ws.send(JSON.stringify({ type: 'error', message: error.message }));
        ws.close();
        wsConnections.delete(jobId);
      }
      
      // Clean up temp CSV
      if (fs.existsSync(tempCsvPath)) {
        fs.unlinkSync(tempCsvPath);
      }
    });

    res.json({ success: true, jobId, message: 'Operation started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Single device operation endpoint
app.post('/api/operations/single', async (req, res) => {
  try {
    const { operation, deviceId, identifier, identifierType } = req.body;

    // If deviceId not provided, find device by identifier
    let targetDeviceId = deviceId;
    if (!targetDeviceId && identifier) {
      const device = await graphApiCall(`/deviceManagement/managedDevices?$filter=deviceName eq '${identifier}' or serialNumber eq '${identifier}'`);
      if (device.value && device.value.length > 0) {
        targetDeviceId = device.value[0].id;
      } else {
        return res.status(404).json({ error: 'Device not found' });
      }
    }

    if (!targetDeviceId) {
      return res.status(400).json({ error: 'Device ID or identifier required' });
    }

    // Execute operation based on type
    let result;
    switch (operation) {
      case 'sync':
        result = await graphApiCall(`/deviceManagement/managedDevices/${targetDeviceId}/syncDevice`, 'POST');
        break;
      case 'retire':
        result = await graphApiCall(`/deviceManagement/managedDevices/${targetDeviceId}/retire`, 'POST');
        break;
      case 'delete':
        result = await graphApiCall(`/deviceManagement/managedDevices/${targetDeviceId}`, 'DELETE');
        break;
      case 'updateGroupTag':
        const { groupTag } = req.body;
        result = await graphApiCall(`/deviceManagement/managedDevices/${targetDeviceId}`, 'PATCH', { groupTag });
        break;
      case 'getBitlockerKeys':
        // Get BitLocker keys requires different endpoint
        const keysResponse = await graphApiCall(`/deviceManagement/managedDevices/${targetDeviceId}?$expand=recoveryKeys`);
        result = keysResponse;
        break;
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }

    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WebSocket endpoint for live status updates
app.ws('/api/status/:jobId', (ws, req) => {
  const { jobId } = req.params;
  wsConnections.set(jobId, ws);

  ws.on('close', () => {
    wsConnections.delete(jobId);
  });

  ws.send(JSON.stringify({ type: 'connected', message: 'Connected to status stream' }));
});

// Dashboard statistics endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const devices = await graphApiCall('/deviceManagement/managedDevices?$top=999&$select=id,deviceName,userPrincipalName,osVersion,manufacturer,model,complianceState,enrollmentType,lastSyncDateTime,enrolledDateTime,managementAgent,azureADDeviceId,serialNumber,groupTag,osDescription');

    // Calculate statistics
    const stats = {
      totalDevices: devices.value.length,
      byPlatform: {},
      byCompliance: {},
      byManufacturer: {},
      inactiveDevices: 0,
      lowStorageDevices: 0,
      compliantDevices: 0,
      nonCompliantDevices: 0,
      topOsVersions: {},
      companyDevices: 0,
      personalDevices: 0
    };

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    devices.value.forEach(device => {
      // Platform distribution
      const platform = device.managementAgent === 'mdm' ? 'MDM' : device.managementAgent || 'Unknown';
      stats.byPlatform[platform] = (stats.byPlatform[platform] || 0) + 1;

      // Compliance
      const compliance = device.complianceState || 'Unknown';
      stats.byCompliance[compliance] = (stats.byCompliance[compliance] || 0) + 1;
      if (compliance === 'Compliant') stats.compliantDevices++;
      else stats.nonCompliantDevices++;

      // Manufacturer
      const manufacturer = device.manufacturer || 'Unknown';
      stats.byManufacturer[manufacturer] = (stats.byManufacturer[manufacturer] || 0) + 1;

      // OS Versions
      const osVersion = device.osVersion || 'Unknown';
      stats.topOsVersions[osVersion] = (stats.topOsVersions[osVersion] || 0) + 1;

      // Inactive devices
      if (device.lastSyncDateTime) {
        const lastSync = new Date(device.lastSyncDateTime);
        if (lastSync < thirtyDaysAgo) {
          stats.inactiveDevices++;
        }
      }

      // Enrollment type
      if (device.enrollmentType === 'userEnrollment') {
        stats.personalDevices++;
      } else {
        stats.companyDevices++;
      }
    });

    // Get top 10 OS versions
    stats.topOsVersions = Object.entries(stats.topOsVersions)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    // Get top 10 manufacturers
    stats.topManufacturers = Object.entries(stats.byManufacturer)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

