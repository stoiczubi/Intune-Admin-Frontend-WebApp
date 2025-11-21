# Intune Admin Web Application

A comprehensive web application for managing Microsoft Intune devices with automation capabilities and custom dashboard.

## Features

- **Authentication**: Connect to Microsoft Graph using Azure App Registration credentials
- **Bulk Operations**: Perform bulk actions on devices via CSV upload
  - Bulk Sync
  - Bulk Retire
  - Bulk Delete
  - Bulk Update Group Tag
  - Get BitLocker Recovery Keys
- **Single Device Operations**: Perform actions on individual devices by hostname, serial number, or device ID
- **Live Status Tracking**: Real-time monitoring of script execution via WebSocket
- **Device Dashboard**: Comprehensive view of Intune environment with:
  - Device overview statistics
  - Compliance status charts
  - Platform distribution
  - Top OS versions and manufacturers
  - Searchable device inventory table

## Quick Start

See [QUICKSTART.md](QUICKSTART.md) for a quick start guide.

## Setup

See [SETUP.md](SETUP.md) for detailed setup instructions.

## PowerShell Script Integration

If you have existing PowerShell scripts, see [POWERSHELL_INTEGRATION.md](POWERSHELL_INTEGRATION.md) for integration instructions.

## Azure App Registration Requirements

Your Azure App Registration needs the following Microsoft Graph API permissions (Application permissions):
- `DeviceManagementManagedDevices.ReadWrite.All`
- `Device.ReadWrite.All`
- `DeviceManagementConfiguration.ReadWrite.All`

**Important**: Admin consent must be granted for these permissions.

## Sample CSV Files

Sample CSV files are available in the `samples/` directory for each bulk operation. You can also download sample CSVs directly from the Automation Tool interface.

## Project Structure

```
Intune-Admin-Frontend-WebApp/
├── client/                 # React frontend application
│   ├── public/
│   └── src/
│       └── components/    # React components (Auth, Dashboard, Automation)
├── server/                # Node.js/Express backend
│   ├── scripts/          # PowerShell automation scripts
│   ├── uploads/          # Temporary CSV uploads
│   └── temp/             # Temporary CSV files for scripts
├── samples/               # Sample CSV files
└── docs/                  # Documentation files
```

## Technology Stack

- **Frontend**: React, Material-UI, Recharts
- **Backend**: Node.js, Express, WebSocket
- **Authentication**: Azure Identity (@azure/identity)
- **API**: Microsoft Graph API
- **Automation**: PowerShell scripts with Microsoft Graph PowerShell modules

## Development

```bash
# Install all dependencies
npm run install-all

# Start development servers (frontend + backend)
npm run dev

# Start backend only
npm run server

# Start frontend only (from client directory)
cd client && npm start

# Build for production
npm run build
```

## Security Notes

⚠️ **Important**: This application is designed for internal use. For production deployment:

1. Implement proper session management and secure credential storage
2. Use HTTPS
3. Add authentication and authorization layers
4. Implement rate limiting
5. Add audit logging
6. Consider using Azure Key Vault for secrets

## License

MIT
