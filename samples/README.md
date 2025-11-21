# Sample CSV Files

This directory contains sample CSV files for each bulk operation type.

## File Formats

### Bulk Sync, Retire, Delete, Get BitLocker Keys
```
DeviceId
12345678-1234-1234-1234-123456789012
87654321-4321-4321-4321-210987654321
```

### Bulk Update Group Tag
```
DeviceId,GroupTag
12345678-1234-1234-1234-123456789012,IT-Department
87654321-4321-4321-4321-210987654321,HR-Department
```

## Notes

- Replace the DeviceId values with actual Intune Device IDs from your tenant
- Device IDs are typically in GUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
- You can export device IDs from the Intune portal or use the Dashboard to find them
- Ensure your CSV file has a header row matching the format shown above

