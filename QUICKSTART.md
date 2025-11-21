# Quick Start Guide

## 1. Install Dependencies

```bash
npm run install-all
```

## 2. Install PowerShell Modules

Open PowerShell and run:

```powershell
Install-Module Microsoft.Graph.DeviceManagement -Scope CurrentUser -Force
Install-Module Microsoft.Graph.Authentication -Scope CurrentUser -Force
```

## 3. Start the Application

```bash
npm run dev
```

This starts:
- Backend on `http://localhost:5000`
- Frontend on `http://localhost:3000`

## 4. Connect to Microsoft Graph

1. Open `http://localhost:3000` in your browser
2. Enter your Azure App Registration credentials:
   - **Tenant ID**: Found in Azure Portal → Azure AD → Overview
   - **Client ID**: Found in Azure Portal → App Registrations → Your App → Overview
   - **Client Secret**: Found in Azure Portal → App Registrations → Your App → Certificates & secrets
3. Click **Connect**

## 5. Use the Application

### View Dashboard
- Navigate to **Dashboard** from the top menu
- View device statistics, compliance status, and inventory

### Perform Automation Tasks

#### Bulk Operations
1. Go to **Automation Tool**
2. Select **Bulk Operations** tab
3. Choose an operation (Sync, Retire, Delete, Update Group Tag, Get BitLocker Keys)
4. Click **Download Sample CSV** to see the format
5. Prepare your CSV file with device IDs
6. Click **Select CSV File** and upload your file
7. Click **Execute Bulk Operation**
8. Monitor progress in the status dialog

#### Single Device Operations
1. Go to **Automation Tool**
2. Select **Single Device Operations** tab
3. Choose an operation
4. Select identifier type (Hostname, Serial Number, or Device ID)
5. Enter the device identifier
6. If updating group tag, enter the new group tag value
7. Click **Execute Operation**

## Sample CSV Format

### For Sync, Retire, Delete, Get BitLocker Keys:
```csv
DeviceId
12345678-1234-1234-1234-123456789012
87654321-4321-4321-4321-210987654321
```

### For Update Group Tag:
```csv
DeviceId,GroupTag
12345678-1234-1234-1234-123456789012,IT-Department
87654321-4321-4321-4321-210987654321,HR-Department
```

## Getting Device IDs

You can get device IDs from:
1. **Dashboard**: View the device inventory table
2. **Intune Portal**: Go to Devices → All devices → Select device → Device ID
3. **Microsoft Graph API**: Query the `/deviceManagement/managedDevices` endpoint

## Troubleshooting

### "Not authenticated" error
- Make sure you've clicked "Connect" after entering credentials
- Verify your credentials are correct
- Check that admin consent has been granted for API permissions

### PowerShell script errors
- Ensure Microsoft Graph PowerShell modules are installed
- Check that your Azure App Registration has the required permissions
- Verify the CSV file format is correct

### WebSocket connection errors
- Ensure the backend server is running on port 5000
- Check firewall settings
- Try refreshing the page

## Next Steps

- Review `SETUP.md` for detailed setup instructions
- Check `POWERSHELL_INTEGRATION.md` to integrate your existing PowerShell scripts
- Customize the dashboard and automation tools as needed

