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

# Import required modules
Import-Module Microsoft.Graph.DeviceManagement -ErrorAction SilentlyContinue

# Authenticate to Microsoft Graph
$SecureSecret = ConvertTo-SecureString $ClientSecret -AsPlainText -Force
$Credential = New-Object System.Management.Automation.PSCredential($ClientId, $SecureSecret)

Connect-MgGraph -TenantId $TenantId -ClientSecretCredential $Credential -Scopes "DeviceManagementManagedDevices.ReadWrite.All"

# Read CSV file
$devices = Import-Csv -Path $CsvPath

$results = @()

foreach ($device in $devices) {
    try {
        $deviceId = $device.DeviceId
        
        # Sync device
        Invoke-MgSyncDeviceManagementManagedDevice -ManagedDeviceId $deviceId
        
        $results += [PSCustomObject]@{
            DeviceId = $deviceId
            Status = "Success"
            Message = "Device synced successfully"
        }
        
        Write-Host "Synced device: $deviceId" -ForegroundColor Green
    }
    catch {
        $results += [PSCustomObject]@{
            DeviceId = $device.DeviceId
            Status = "Failed"
            Message = $_.Exception.Message
        }
        
        Write-Host "Failed to sync device: $($device.DeviceId) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Output results
$results | Format-Table
Write-Host "`nTotal devices processed: $($results.Count)" -ForegroundColor Cyan
Write-Host "Successful: $(($results | Where-Object {$_.Status -eq 'Success'}).Count)" -ForegroundColor Green
Write-Host "Failed: $(($results | Where-Object {$_.Status -eq 'Failed'}).Count)" -ForegroundColor Red

Disconnect-MgGraph

