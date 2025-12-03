# Power BI Report Publisher

**Single-purpose automation for publishing Power BI (.pbix) files to Power BI Service**

## What This Does

This automation handles ONE job extremely well: **publishing a completed Power BI project to the Power BI Service**.

No manual clicking, no UI navigation - just reliable, repeatable publishing.

## Quick Start

### 1. Choose Your Method

**PowerShell** (Windows, easiest for interactive use):
```powershell
# Install module
Install-Module -Name MicrosoftPowerBIMgmt -Scope CurrentUser

# Publish (will prompt for login)
.\Publish-PowerBIReport.ps1 -PbixPath "C:\Reports\Sales.pbix" -WorkspaceName "Production"
```

**Python** (Cross-platform, best for automation):
```bash
# Install packages
pip install requests msal

# Set credentials (see setup guide)
export PBI_CLIENT_ID="your-client-id"
export PBI_CLIENT_SECRET="your-secret"
export PBI_TENANT_ID="your-tenant-id"

# Publish
python publish_powerbi_report.py --file "report.pbix" --workspace "Production"
```

### 2. Test Your Setup

```bash
# Validates all prerequisites and credentials
python test_powerbi_setup.py
```

### 3. Configure for Easy Use

Edit the simple wrapper scripts with your settings:
- **PowerShell**: `publish_simple.ps1`
- **Python**: `publish_simple.py`

Then just run:
```bash
python publish_simple.py  # or .\publish_simple.ps1
```

## Files Included

### Core Scripts
- **Publish-PowerBIReport.ps1** - PowerShell publisher (620 lines, production-ready)
- **publish_powerbi_report.py** - Python publisher (450 lines, production-ready)

### Helpers
- **publish_simple.ps1** - Simple config wrapper (PowerShell)
- **publish_simple.py** - Simple config wrapper (Python)
- **test_powerbi_setup.py** - Setup validator

### Documentation
- **POWERBI_PUBLISHER_GUIDE.md** - Complete setup and troubleshooting guide (800+ lines)
- **powerbi_config.example.env** - Environment variable template
- **POWERBI_PUBLISHER_README.md** - This file

## Features

### Reliability
- Comprehensive error handling for all failure modes
- Retry logic for transient failures
- Automatic timeout handling for large files
- Import status polling with progress updates

### Security
- No hardcoded credentials
- Environment variable-based configuration
- Credential masking in logs
- Support for both interactive and service principal auth

### Observability
- Detailed logging to timestamped files
- Color-coded console output
- Step-by-step progress tracking
- Helpful error messages with resolution hints

### Flexibility
- Works with any workspace you have access to
- Supports both user and service principal authentication
- Handles files of any size (up to Power BI limits)
- Automatic conflict resolution (CreateOrOverwrite)

## Authentication Options

### Option 1: Interactive (Easiest)
User prompted for Microsoft login. Great for:
- Initial testing
- Manual publishing
- Personal workspaces

**No setup required** - just run the script!

### Option 2: Service Principal (Automated)
App-based authentication. Required for:
- Scheduled tasks
- CI/CD pipelines
- Headless servers

**Requires setup** - see POWERBI_PUBLISHER_GUIDE.md for complete instructions.

## Common Use Cases

### Manual Publishing
```powershell
# PowerShell - interactive auth
.\Publish-PowerBIReport.ps1 -PbixPath "report.pbix" -WorkspaceName "My Workspace"
```

### Scheduled Publishing
```bash
# Add to cron (Linux/macOS)
0 6 * * * cd /path/to/scripts && python publish_powerbi_report.py --file "report.pbix" --workspace "Production"
```

```powershell
# Windows Task Scheduler
# Program: powershell.exe
# Arguments: -File "C:\Scripts\publish_simple.ps1"
```

### Batch Publishing
```powershell
# Publish multiple reports
$reports = @("Sales.pbix", "Finance.pbix", "Marketing.pbix")
foreach ($report in $reports) {
    .\Publish-PowerBIReport.ps1 -PbixPath $report -WorkspaceName "Production"
}
```

### CI/CD Integration
```yaml
# GitHub Actions
- name: Publish to Power BI
  env:
    PBI_CLIENT_ID: ${{ secrets.PBI_CLIENT_ID }}
    PBI_CLIENT_SECRET: ${{ secrets.PBI_CLIENT_SECRET }}
    PBI_TENANT_ID: ${{ secrets.PBI_TENANT_ID }}
  run: python publish_powerbi_report.py --file "report.pbix" --workspace "Production"
```

## Error Handling

The scripts handle:
- Authentication failures (clear error messages)
- Workspace not found (lists available workspaces)
- File not found (path validation)
- Permission denied (checks workspace access)
- Network timeouts (automatic retry)
- Rate limiting (respects Retry-After headers)
- Large file uploads (extended timeouts)
- Dataset refresh errors (helpful hints)

Every error includes:
1. Clear description of what failed
2. Specific resolution steps
3. Relevant context (workspace list, permissions, etc.)

## Logs

Every run generates a timestamped log file:
- `powerbi_publish_YYYYMMDD_HHMMSS.log`

Logs include:
- Authentication details (masked credentials)
- Workspace resolution
- File upload progress
- Import status checks
- Success/failure details
- Error stack traces

## Prerequisites

### Software
- **PowerShell**: Windows PowerShell 5.1+ or PowerShell Core 7+
- **Python**: Python 3.8+

### Licenses
- Power BI Pro or Premium Per User license

### Permissions
- Workspace: Admin or Member role in target workspace

### For Service Principal (Python/Automated)
- Azure AD App Registration
- API permissions granted
- Service principal added to workspace

**Full setup instructions in POWERBI_PUBLISHER_GUIDE.md**

## Troubleshooting

### Quick Diagnostics
```bash
# Python - validates everything
python test_powerbi_setup.py
```

### Check Logs
```bash
# View latest log
cat powerbi_publish_*.log | tail -50
```

### Common Issues

**"Module not found"**
```powershell
# PowerShell
Install-Module -Name MicrosoftPowerBIMgmt -Force
```
```bash
# Python
pip install requests msal
```

**"Authentication failed"**
- Check environment variables are set correctly
- Verify client secret hasn't expired
- Ensure admin consent granted for API permissions

**"Workspace not found"**
- Check spelling (case-insensitive)
- Verify you have access to the workspace
- Run test script to list available workspaces

**See POWERBI_PUBLISHER_GUIDE.md for complete troubleshooting**

## Support

### Documentation
- **Full Setup Guide**: POWERBI_PUBLISHER_GUIDE.md
- **Microsoft Docs**: https://learn.microsoft.com/en-us/rest/api/power-bi/

### Testing
```bash
# Validate setup
python test_powerbi_setup.py

# List available workspaces (Python)
python -c "from publish_powerbi_report import *; auth = PowerBIAuthenticator(); token = auth.authenticate(); pub = PowerBIPublisher(token); import requests; print([w['name'] for w in requests.get('https://api.powerbi.com/v1.0/myorg/groups', headers={'Authorization': f'Bearer {token}'}).json()['value']])"
```

## Performance

### Typical Publish Times
- Small report (<10 MB): 10-30 seconds
- Medium report (10-100 MB): 30-120 seconds
- Large report (100-500 MB): 2-5 minutes
- Very large (500 MB - 1 GB): 5-15 minutes

Times include:
- Authentication
- File upload
- Import processing
- Dataset creation

### Optimization Tips
1. Publish during off-peak hours
2. Optimize .pbix file size (remove unused data)
3. Use incremental refresh for large datasets
4. Add delays between batch publishes (avoid rate limits)

## Architecture

### PowerShell Approach
```
Script → MicrosoftPowerBIMgmt Module → Power BI Service
```
- Uses official Microsoft cmdlets
- Most reliable and maintained
- Best for Windows environments

### Python Approach
```
Script → MSAL (Auth) → Power BI REST API
```
- Direct API calls
- Cross-platform compatible
- Best for automation/CI-CD

Both approaches:
- Handle authentication
- Resolve workspace by name
- Upload PBIX file
- Poll import status
- Return results

## Security Notes

### What We Do
- Store credentials in environment variables
- Mask secrets in logs
- Use secure token-based auth
- Support OAuth flows
- No credential caching

### What You Should Do
- Rotate secrets regularly (12-24 months)
- Use least-privilege permissions
- Enable audit logging
- Review access regularly
- Use Azure Key Vault for production

## Version Requirements

### PowerShell
- Windows PowerShell 5.1+ or PowerShell Core 7+
- MicrosoftPowerBIMgmt 1.0.0+

### Python
- Python 3.8+
- requests 2.25.0+
- msal 1.20.0+

### Power BI
- Power BI Pro or Premium Per User
- API version: v1.0 (current stable)

## License

These scripts are provided as-is for automation purposes. Use at your own risk.

Power BI and Azure AD are Microsoft products with their own licensing requirements.

## File Locations

All files are in: `/Users/Morpheous/`

### Scripts
- Publish-PowerBIReport.ps1
- publish_powerbi_report.py
- publish_simple.ps1
- publish_simple.py
- test_powerbi_setup.py

### Documentation
- POWERBI_PUBLISHER_README.md (this file)
- POWERBI_PUBLISHER_GUIDE.md (detailed guide)
- powerbi_config.example.env (config template)

## Next Steps

1. **Run the test script**: `python test_powerbi_setup.py`
2. **Review setup guide**: POWERBI_PUBLISHER_GUIDE.md
3. **Configure simple wrapper**: Edit publish_simple.ps1 or publish_simple.py
4. **Test publish**: Run with a test report to non-production workspace
5. **Automate**: Set up scheduled task or CI/CD integration

## Summary

This is a **focused, production-ready solution** for one job:
**Publishing Power BI reports reliably and securely.**

- No UI automation (brittle)
- No browser control (unreliable)
- No manual steps (error-prone)

Just clean, tested code that handles authentication, uploads, and error recovery.

**Ready to use. Ready to automate. Ready for production.**

---

**Questions?** Consult POWERBI_PUBLISHER_GUIDE.md or check the logs.
