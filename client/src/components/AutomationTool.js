import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  Button,
  TextField,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';

const operations = [
  { value: 'sync', label: 'Bulk Sync' },
  { value: 'retire', label: 'Bulk Retire' },
  { value: 'delete', label: 'Bulk Delete' },
  { value: 'updateGroupTag', label: 'Bulk Update Group Tag' },
  { value: 'getBitlockerKeys', label: 'Get BitLocker Recovery Keys' },
];

export default function AutomationTool() {
  const [tabValue, setTabValue] = useState(0);
  const [bulkOperation, setBulkOperation] = useState('sync');
  const [csvFile, setCsvFile] = useState(null);
  const [singleOperation, setSingleOperation] = useState('sync');
  const [deviceIdentifier, setDeviceIdentifier] = useState('');
  const [identifierType, setIdentifierType] = useState('hostname');
  const [groupTag, setGroupTag] = useState('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const [statusMessages, setStatusMessages] = useState([]);
  const [ws, setWs] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setError('');
    } else {
      setError('Please upload a valid CSV file');
    }
  };

  const downloadSampleCsv = (operation) => {
    const samples = {
      sync: 'DeviceId\n12345678-1234-1234-1234-123456789012\n',
      retire: 'DeviceId\n12345678-1234-1234-1234-123456789012\n',
      delete: 'DeviceId\n12345678-1234-1234-1234-123456789012\n',
      updateGroupTag: 'DeviceId,GroupTag\n12345678-1234-1234-1234-123456789012,IT-Department\n',
      getBitlockerKeys: 'DeviceId\n12345678-1234-1234-1234-123456789012\n',
    };

    const blob = new Blob([samples[operation] || samples.sync], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample_${operation}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openStatusDialog = (jobId) => {
    setCurrentJobId(jobId);
    setStatusMessages([]);
    setStatusDialogOpen(true);

    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = process.env.NODE_ENV === 'production' ? window.location.port : '5000';
    const wsUrl = `${protocol}//${host}:${port}/api/status/${jobId}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      setStatusMessages((prev) => [...prev, { type: 'info', message: 'Connected to status stream' }]);
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStatusMessages((prev) => [...prev, data]);
        if (data.type === 'complete' || data.type === 'error') {
          setTimeout(() => {
            websocket.close();
          }, 2000);
        }
      } catch (error) {
        setStatusMessages((prev) => [...prev, { type: 'info', message: event.data }]);
      }
    };

    websocket.onerror = (error) => {
      setStatusMessages((prev) => [...prev, { type: 'error', message: 'WebSocket connection error' }]);
    };

    websocket.onclose = () => {
      setStatusMessages((prev) => [...prev, { type: 'info', message: 'Connection closed' }]);
    };

    setWs(websocket);
  };

  const closeStatusDialog = () => {
    if (ws) {
      ws.close();
      setWs(null);
    }
    setStatusDialogOpen(false);
    setCurrentJobId(null);
    setStatusMessages([]);
  };

  const handleBulkOperation = async () => {
    if (!csvFile) {
      setError('Please select a CSV file');
      return;
    }

    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('csv', csvFile);
    formData.append('operation', bulkOperation);

    try {
      const response = await axios.post('/api/operations/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data.success) {
        setSuccess('Operation started successfully');
        openStatusDialog(response.data.jobId);
        setCsvFile(null);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleSingleOperation = async () => {
    if (!deviceIdentifier) {
      setError('Please enter device identifier');
      return;
    }

    if (singleOperation === 'updateGroupTag' && !groupTag) {
      setError('Please enter group tag');
      return;
    }

    setError('');
    setSuccess('');

    try {
      const payload = {
        operation: singleOperation,
        identifier: deviceIdentifier,
        identifierType: identifierType,
      };

      if (singleOperation === 'updateGroupTag') {
        payload.groupTag = groupTag;
      }

      const response = await axios.post('/api/operations/single', payload);

      if (response.data.success) {
        setSuccess('Operation completed successfully');
        setDeviceIdentifier('');
        setGroupTag('');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Automation Tool
      </Typography>

      <Paper sx={{ mt: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Bulk Operations" />
          <Tab label="Single Device Operations" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tabValue === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Select Operation
                </Typography>
                <Grid container spacing={2}>
                  {operations.map((op) => (
                    <Grid item key={op.value}>
                      <Button
                        variant={bulkOperation === op.value ? 'contained' : 'outlined'}
                        onClick={() => setBulkOperation(op.value)}
                      >
                        {op.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Upload CSV File
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadFileIcon />}
                      >
                        Select CSV File
                        <input
                          type="file"
                          hidden
                          accept=".csv"
                          onChange={handleFileChange}
                        />
                      </Button>
                      {csvFile && (
                        <Typography variant="body2" color="text.secondary">
                          {csvFile.name}
                        </Typography>
                      )}
                      <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={() => downloadSampleCsv(bulkOperation)}
                      >
                        Download Sample CSV
                      </Button>
                    </Box>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={handleBulkOperation}
                      disabled={!csvFile}
                    >
                      Execute Bulk Operation
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          )}

          {tabValue === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Select Operation
                </Typography>
                <Grid container spacing={2}>
                  {operations.map((op) => (
                    <Grid item key={op.value}>
                      <Button
                        variant={singleOperation === op.value ? 'contained' : 'outlined'}
                        onClick={() => setSingleOperation(op.value)}
                      >
                        {op.label}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <TextField
                          select
                          fullWidth
                          label="Identifier Type"
                          value={identifierType}
                          onChange={(e) => setIdentifierType(e.target.value)}
                          SelectProps={{ native: true }}
                        >
                          <option value="hostname">Hostname</option>
                          <option value="serial">Serial Number</option>
                          <option value="id">Intune Device ID</option>
                        </TextField>
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <TextField
                          fullWidth
                          label={`Device ${identifierType === 'hostname' ? 'Hostname' : identifierType === 'serial' ? 'Serial Number' : 'Device ID'}`}
                          value={deviceIdentifier}
                          onChange={(e) => setDeviceIdentifier(e.target.value)}
                        />
                      </Grid>
                      {singleOperation === 'updateGroupTag' && (
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Group Tag"
                            value={groupTag}
                            onChange={(e) => setGroupTag(e.target.value)}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </CardContent>
                  <CardActions>
                    <Button
                      variant="contained"
                      startIcon={<PlayArrowIcon />}
                      onClick={handleSingleOperation}
                      disabled={!deviceIdentifier}
                    >
                      Execute Operation
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Dialog
        open={statusDialogOpen}
        onClose={closeStatusDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Operation Status</Typography>
            <IconButton onClick={closeStatusDialog}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {statusMessages.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                Waiting for status updates...
              </Typography>
            )}
            {statusMessages.map((msg, index) => {
              const getColor = () => {
                switch (msg.type) {
                  case 'error':
                    return 'error';
                  case 'complete':
                    return 'success';
                  case 'info':
                    return 'info';
                  default:
                    return 'default';
                }
              };

              return (
                <Box
                  key={index}
                  sx={{
                    p: 1,
                    mb: 1,
                    borderLeft: `3px solid ${
                      msg.type === 'error' ? '#f44336' :
                      msg.type === 'complete' ? '#4caf50' :
                      msg.type === 'info' ? '#2196f3' : '#757575'
                    }`,
                    bgcolor: 'grey.50',
                  }}
                >
                  <Typography
                    variant="body2"
                    color={getColor()}
                    sx={{ fontWeight: msg.type === 'error' || msg.type === 'complete' ? 'bold' : 'normal' }}
                  >
                    {msg.message || msg.type}
                  </Typography>
                  {msg.output && (
                    <Typography variant="caption" color="text.secondary" component="pre" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                      {msg.output}
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeStatusDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

