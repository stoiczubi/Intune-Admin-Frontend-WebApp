# Setup Instructions

## Prerequisites

1. **Node.js** (v16 or higher) and npm
2. **PowerShell** (v5.1 or higher, or PowerShell 7+)
3. **Azure App Registration** with the following permissions:
   - `DeviceManagementManagedDevices.ReadWrite.All`
   - `Device.ReadWrite.All`
   - `DeviceManagementConfiguration.ReadWrite.All`

## Installation Steps

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

Or use the convenience script:

```bash
npm run install-all
```

### 2. Install PowerShell Modules

Open PowerShell as Administrator and run:

```powershell
Install-Module Microsoft.Graph.DeviceManagement -Scope CurrentUser -Force
Install-Module Microsoft.Graph.Authentication -Scope CurrentUser -Force
```

### 3. Configure Azure App Registration

1. Go to Azure Portal → Azure Active Directory → App registrations
2. Create a new app registration or use an existing one
3. Note down:
   - **Tenant ID** (Directory ID)
   - **Application (Client) ID**
4. Create a **Client Secret**:
   - Go to "Certificates & secrets"
   - Click "New client secret"
   - Copy the secret value (you won't see it again!)
5. Add API Permissions:
   - Go to "API permissions"
   - Click "Add a permission"
   - Select "Microsoft Graph"
   - Select "Application permissions"
   - Add the required permissions listed above
   - Click "Grant admin consent"

### 4. Start the Application

#### Development Mode (Recommended)

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend React app on `http://localhost:3000`

#### Production Mode

```bash
# Build the frontend
npm run build

# Start the server
npm run server
```

The application will be available at `http://localhost:5000`

## Usage

1. Open your browser and navigate to `http://localhost:3000` (development) or `http://localhost:5000` (production)
2. Enter your Azure App Registration credentials:
   - Tenant ID
   - Client ID
   - Client Secret
3. Click "Connect"
4. Navigate to:
   - **Dashboard**: View device statistics and inventory
   - **Automation Tool**: Perform bulk or single device operations

## Troubleshooting

### PowerShell Script Execution Errors

- Ensure PowerShell execution policy allows script execution
- Verify Microsoft Graph PowerShell modules are installed
- Check that your Azure App Registration has the correct permissions

### Authentication Errors

- Verify your Tenant ID, Client ID, and Client Secret are correct
- Ensure admin consent has been granted for API permissions
- Check that the Client Secret hasn't expired

### Port Already in Use

If port 5000 or 3000 is already in use, you can change them:

- Backend: Set `PORT` environment variable or modify `server/index.js`
- Frontend: Create `.env` file in `client/` directory with `PORT=3001`

## File Structure

```
Intune-Admin-Frontend-WebApp/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   └── App.js
│   └── package.json
├── server/                # Node.js backend
│   ├── scripts/          # PowerShell scripts
│   ├── uploads/          # Temporary CSV uploads
│   ├── temp/             # Temporary CSV files for scripts
│   └── index.js
├── samples/               # Sample CSV files
├── package.json
└── README.md
```

## Security Notes

⚠️ **Important**: This application stores credentials in memory during the session. For production use:

1. Implement proper session management
2. Use secure storage for credentials (Azure Key Vault, etc.)
3. Enable HTTPS
4. Implement proper authentication and authorization
5. Add rate limiting and request validation
6. Log all operations for audit purposes

