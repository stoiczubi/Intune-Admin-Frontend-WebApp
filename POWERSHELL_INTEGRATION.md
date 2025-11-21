# PowerShell Script Integration Guide

## Overview

The web application is designed to execute PowerShell scripts for Intune automation tasks. The scripts are located in the `server/scripts/` directory.

## Current Scripts

The following PowerShell scripts are included:

1. **sync.ps1** - Bulk sync devices
2. **retire.ps1** - Bulk retire devices
3. **delete.ps1** - Bulk delete devices
4. **updateGroupTag.ps1** - Bulk update group tags
5. **getBitlockerKeys.ps1** - Get BitLocker recovery keys

## Script Requirements

All PowerShell scripts must:

1. Accept the following parameters:
   - `-CsvPath` (string, mandatory) - Path to the CSV file containing device IDs
   - `-TenantId` (string, mandatory) - Azure AD Tenant ID
   - `-ClientId` (string, mandatory) - Azure App Registration Client ID
   - `-ClientSecret` (string, mandatory) - Azure App Registration Client Secret

2. Use Microsoft Graph PowerShell modules for authentication and operations

3. Output results in a readable format (console output will be captured)

## Integrating Your Existing Scripts

If you have existing PowerShell scripts, follow these steps:

### Step 1: Place Your Script

Copy your PowerShell script to `server/scripts/` directory with the appropriate name:
- `sync.ps1` for sync operations
- `retire.ps1` for retire operations
- `delete.ps1` for delete operations
- `updateGroupTag.ps1` for group tag updates
- `getBitlockerKeys.ps1` for BitLocker key retrieval

### Step 2: Update Script Parameters

Ensure your script accepts the required parameters:

```powershell
param(
    [Parameter(Mandatory=$true)]
    [string]$CsvPath,
    [Parameter(Mandatory=$true)]
    [string]$TenantId,
    [Parameter(Mandatory=$true)]
    [string]$ClientId,
    [Parameter(Mandatory=$true)]
    [string]$ClientSecret
)
```

### Step 3: Authenticate to Microsoft Graph

Use the provided credentials to authenticate:

```powershell
# Option 1: Using Microsoft.Graph modules
Import-Module Microsoft.Graph.DeviceManagement
$SecureSecret = ConvertTo-SecureString $ClientSecret -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($ClientId, $SecureSecret)
Connect-MgGraph -TenantId $TenantId -ClientSecretCredential $Credential -Scopes "DeviceManagementManagedDevices.ReadWrite.All"
```

### Step 4: Read CSV File

Parse the CSV file to get device IDs:

```powershell
$devices = Import-Csv -Path $CsvPath
foreach ($device in $devices) {
    $deviceId = $device.DeviceId
    # Perform your operation here
}
```

### Step 5: Handle Errors

Wrap operations in try-catch blocks:

```powershell
try {
    # Your operation
    Write-Host "Success message" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}
```

## Script Execution Flow

1. User uploads CSV file via web interface
2. Backend parses CSV and creates temporary file
3. Backend executes PowerShell script with parameters
4. Script output is captured via WebSocket
5. Real-time status updates are sent to the frontend
6. Results are displayed in the status dialog

## Testing Your Scripts

You can test your scripts manually:

```powershell
.\server\scripts\sync.ps1 -CsvPath "path\to\your\file.csv" -TenantId "your-tenant-id" -ClientId "your-client-id" -ClientSecret "your-client-secret"
```

## Notes

- Scripts run with `ExecutionPolicy Bypass` to avoid policy restrictions
- All console output (Write-Host, Write-Output) will be captured and sent to the frontend
- Ensure your scripts disconnect from Graph API at the end: `Disconnect-MgGraph`
- For single device operations, the backend uses Graph API directly (no PowerShell script)

## Required PowerShell Modules

Install the required modules:

```powershell
Install-Module Microsoft.Graph.DeviceManagement -Scope CurrentUser
Install-Module Microsoft.Graph.Authentication -Scope CurrentUser
```

