# Power BI Report Publisher - Complete Setup Guide

## Overview

Two production-ready automation solutions for publishing Power BI (.pbix) files to Power BI Service:

1. **PowerShell Script** (Recommended for Windows) - Uses native Power BI cmdlets
2. **Python Script** (Cross-platform) - Uses Power BI REST API

Both scripts handle authentication, workspace resolution, publishing, and comprehensive error handling.

---

## Prerequisites

### General Requirements
- Power BI Pro or Premium Per User license
- Access to target Power BI workspace (Admin or Member role)
- Completed .pbix file ready to publish

### Option 1: PowerShell Requirements
- Windows PowerShell 5.1+ or PowerShell Core 7+
- Power BI Desktop installed (optional, but recommended)
- Admin rights to install PowerShell modules

### Option 2: Python Requirements
- Python 3.8 or higher
- pip package manager
- Azure AD App Registration

---

## Installation

### PowerShell Setup

#### Step 1: Install Power BI Management Module

```powershell
# Open PowerShell as Administrator
Install-Module -Name MicrosoftPowerBIMgmt -Scope CurrentUser -Force

# Verify installation
Get-Module -ListAvailable -Name MicrosoftPowerBIMgmt
```

#### Step 2: Test Authentication

```powershell
# Test interactive login
Connect-PowerBIServiceAccount
Get-PowerBIWorkspace
Disconnect-PowerBIServiceAccount
```

If successful, you're ready for interactive publishing.

---

### Python Setup

#### Step 1: Install Required Packages

```bash
# Install dependencies
pip install requests msal python-dotenv

# Verify installation
python -c "import msal; import requests; print('Dependencies installed successfully')"
```

#### Step 2: Set Up Azure AD App (Required for Python)

**Create App Registration:**

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
   - Name: `Power BI Publisher`
   - Supported account types: `Accounts in this organizational directory only`
   - Click **Register**

4. Note down:
   - **Application (client) ID** → This is your `PBI_CLIENT_ID`
   - **Directory (tenant) ID** → This is your `PBI_TENANT_ID`

**Create Client Secret:**

5. In your app, go to **Certificates & secrets**
6. Click **New client secret**
7. Description: `Publishing automation`
8. Expires: Choose duration (recommend 24 months)
9. Click **Add**
10. **IMPORTANT:** Copy the **Value** immediately (not Secret ID) → This is your `PBI_CLIENT_SECRET`

**Grant API Permissions:**

11. In your app, go to **API permissions**
12. Click **Add a permission** > **Power BI Service**
13. Select **Delegated permissions**:
    - `Dataset.ReadWrite.All`
    - `Workspace.ReadWrite.All`
14. Select **Application permissions**:
    - `Dataset.ReadWrite.All`
    - `Workspace.ReadWrite.All`
15. Click **Add permissions**
16. Click **Grant admin consent** (requires admin rights)

**Add Service Principal to Power BI Workspace:**

17. Go to [Power BI Service](https://app.powerbi.com)
18. Navigate to your target workspace
19. Click **Access** (or workspace settings icon)
20. Click **Add people or groups**
21. Search for your app name: `Power BI Publisher`
22. Assign role: **Admin** or **Member**
23. Click **Add**

**Enable Service Principal in Tenant (Admin Only):**

24. Go to [Power BI Admin Portal](https://app.powerbi.com/admin-portal/tenantSettings)
25. Find setting: **Allow service principals to use Power BI APIs**
26. Enable for your organization or specific security groups
27. Click **Apply**

#### Step 3: Configure Environment Variables

**Windows:**
```cmd
setx PBI_CLIENT_ID "your-client-id-here"
setx PBI_CLIENT_SECRET "your-client-secret-here"
setx PBI_TENANT_ID "your-tenant-id-here"
```

**macOS/Linux:**
```bash
# Add to ~/.bashrc or ~/.zshrc
export PBI_CLIENT_ID="your-client-id-here"
export PBI_CLIENT_SECRET="your-client-secret-here"
export PBI_TENANT_ID="your-tenant-id-here"

# Reload shell
source ~/.bashrc  # or source ~/.zshrc
```

**Or use .env file:**
```bash
# Copy template
cp powerbi_config.example.env .env

# Edit .env with your credentials
# Then load with: export $(cat .env | xargs)
```

---

## Usage

### PowerShell Script

**Interactive Authentication (User Login):**

```powershell
.\Publish-PowerBIReport.ps1 `
    -PbixPath "C:\Reports\SalesReport.pbix" `
    -WorkspaceName "Production Reports"
```

**Service Principal Authentication (Automated/Headless):**

```powershell
# Set environment variables first
$env:PBI_CLIENT_ID = "your-client-id"
$env:PBI_CLIENT_SECRET = "your-client-secret"
$env:PBI_TENANT_ID = "your-tenant-id"

# Run with -UseServicePrincipal flag
.\Publish-PowerBIReport.ps1 `
    -PbixPath "C:\Reports\SalesReport.pbix" `
    -WorkspaceName "Production Reports" `
    -UseServicePrincipal
```

**Advanced Examples:**

```powershell
# Publish multiple reports to same workspace
$reports = @("Sales.pbix", "Finance.pbix", "Marketing.pbix")
$workspace = "Production Reports"

foreach ($report in $reports) {
    .\Publish-PowerBIReport.ps1 -PbixPath "C:\Reports\$report" -WorkspaceName $workspace
}

# Use with error handling
try {
    $result = .\Publish-PowerBIReport.ps1 -PbixPath "C:\Reports\Sales.pbix" -WorkspaceName "Production"
    Write-Host "Success! Report ID: $($result.Id)"
} catch {
    Write-Host "Failed: $($_.Exception.Message)"
    exit 1
}
```

---

### Python Script

**Basic Usage:**

```bash
python publish_powerbi_report.py \
    --file "/path/to/report.pbix" \
    --workspace "Production Reports"
```

**With Custom Report Name:**

```bash
python publish_powerbi_report.py \
    --file "/path/to/SalesReport.pbix" \
    --workspace "Production Reports" \
    --name "Sales Dashboard Q4"
```

**Advanced Examples:**

```bash
# Batch publish multiple reports
for file in reports/*.pbix; do
    python publish_powerbi_report.py --file "$file" --workspace "Production"
done

# Publish with error handling (bash)
if python publish_powerbi_report.py --file "report.pbix" --workspace "Production"; then
    echo "Publish succeeded"
else
    echo "Publish failed"
    exit 1
fi
```

**In Python Code:**

```python
import subprocess
import sys

def publish_report(pbix_path, workspace):
    """Wrapper function for publishing"""
    result = subprocess.run([
        sys.executable,
        "publish_powerbi_report.py",
        "--file", pbix_path,
        "--workspace", workspace
    ], capture_output=True, text=True)

    if result.returncode == 0:
        print(f"Published: {pbix_path}")
        return True
    else:
        print(f"Failed: {result.stderr}")
        return False

# Usage
publish_report("/path/to/report.pbix", "Production Reports")
```

---

## Scheduling and Automation

### Windows Task Scheduler (PowerShell)

1. Open **Task Scheduler**
2. Create **New Task**
3. **General Tab:**
   - Name: `Power BI Report Publisher`
   - Run whether user is logged on or not
   - Run with highest privileges

4. **Triggers Tab:**
   - New trigger (e.g., Daily at 6 AM)

5. **Actions Tab:**
   - Program/script: `powershell.exe`
   - Arguments: `-ExecutionPolicy Bypass -File "C:\Scripts\Publish-PowerBIReport.ps1" -PbixPath "C:\Reports\Sales.pbix" -WorkspaceName "Production" -UseServicePrincipal`

6. **Conditions Tab:**
   - Configure as needed

7. Save and enter credentials

### Cron (Linux/macOS) - Python

```bash
# Edit crontab
crontab -e

# Add job (runs daily at 6 AM)
0 6 * * * cd /path/to/scripts && /usr/bin/python3 publish_powerbi_report.py --file "/path/to/report.pbix" --workspace "Production" >> /var/log/powerbi_publish.log 2>&1
```

### GitHub Actions

```yaml
name: Publish Power BI Report

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC
  workflow_dispatch:

jobs:
  publish:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: pip install requests msal

      - name: Publish Report
        env:
          PBI_CLIENT_ID: ${{ secrets.PBI_CLIENT_ID }}
          PBI_CLIENT_SECRET: ${{ secrets.PBI_CLIENT_SECRET }}
          PBI_TENANT_ID: ${{ secrets.PBI_TENANT_ID }}
        run: |
          python publish_powerbi_report.py \
            --file "reports/sales.pbix" \
            --workspace "Production Reports"
```

---

## Troubleshooting

### Common Errors and Solutions

#### Error: "Module not found"
**PowerShell:**
```powershell
Install-Module -Name MicrosoftPowerBIMgmt -Scope CurrentUser -Force -AllowClobber
```

**Python:**
```bash
pip install --upgrade requests msal
```

---

#### Error: "Authentication failed"

**Symptoms:**
- "AADSTS700016: Application not found"
- "AADSTS50020: User account from identity provider does not exist"
- "Invalid client secret"

**Solutions:**
1. Verify environment variables are set correctly
2. Check client secret hasn't expired (Azure Portal > App > Certificates & secrets)
3. Ensure Admin consent was granted for API permissions
4. Verify tenant ID matches your organization

**Test Authentication (Python):**
```python
import os
from msal import ConfidentialClientApplication

client_id = os.getenv('PBI_CLIENT_ID')
client_secret = os.getenv('PBI_CLIENT_SECRET')
tenant_id = os.getenv('PBI_TENANT_ID')

print(f"Client ID: {client_id[:8]}..." if client_id else "NOT SET")
print(f"Secret: {'SET' if client_secret else 'NOT SET'}")
print(f"Tenant: {tenant_id}" if tenant_id else "NOT SET")

authority = f"https://login.microsoftonline.com/{tenant_id}"
app = ConfidentialClientApplication(
    client_id=client_id,
    client_credential=client_secret,
    authority=authority
)

result = app.acquire_token_for_client(
    scopes=["https://analysis.windows.net/powerbi/api/.default"]
)

if "access_token" in result:
    print("Authentication successful!")
else:
    print(f"Authentication failed: {result.get('error_description')}")
```

---

#### Error: "Workspace not found"

**Symptoms:**
- "Workspace 'XYZ' not found"

**Solutions:**
1. Check workspace name spelling (case-insensitive)
2. Verify you have access to the workspace
3. List all workspaces you have access to:

**PowerShell:**
```powershell
Connect-PowerBIServiceAccount
Get-PowerBIWorkspace | Select-Object Name, Id
```

**Python:**
```python
# Add to script or run separately
response = requests.get(
    "https://api.powerbi.com/v1.0/myorg/groups",
    headers={"Authorization": f"Bearer {token}"}
)
for ws in response.json()["value"]:
    print(f"{ws['name']} ({ws['id']})")
```

---

#### Error: "Permission denied" or "Forbidden"

**Symptoms:**
- HTTP 403 Forbidden
- "User does not have permission"

**Solutions:**
1. Verify workspace role (Admin or Member required for publishing)
2. Check service principal is added to workspace:
   - Power BI Service > Workspace > Access > Add your app
3. Verify API permissions granted with admin consent
4. Check tenant setting: "Allow service principals to use Power BI APIs"

---

#### Error: "File not found"

**Solutions:**
1. Use absolute paths, not relative
2. Check file path escaping (use raw strings in Python: `r"C:\Path\file.pbix"`)
3. Verify file exists:

**PowerShell:**
```powershell
Test-Path "C:\Reports\Sales.pbix"
```

**Python:**
```python
from pathlib import Path
print(Path("report.pbix").resolve().exists())
```

---

#### Error: "Import failed" or "Dataset error"

**Symptoms:**
- Import completes but status shows "Failed"
- Dataset-related errors

**Solutions:**
1. Open .pbix in Power BI Desktop and verify:
   - No data source errors
   - All queries refresh successfully
   - No missing connections

2. Check data source credentials in Power BI Service after first publish:
   - Dataset settings > Data source credentials
   - Update with appropriate credentials

3. For scheduled refreshes:
   - Configure gateway if using on-premises data
   - Set up OAuth for cloud services

---

#### Error: "Timeout" or "Large file upload failed"

**Solutions:**
1. Increase timeout (Python script - line ~370):
```python
timeout=1200  # 20 minutes
```

2. Check file size limits:
   - Power BI Pro: 1 GB max
   - Power BI Premium: 10 GB max

3. Optimize .pbix file:
   - Remove unused tables/columns
   - Optimize data model
   - Use import mode instead of DirectQuery where possible

---

## Best Practices

### Security
1. **Never commit credentials** to version control
2. Use environment variables or Azure Key Vault for secrets
3. Rotate client secrets regularly (every 12-24 months)
4. Use least-privilege permissions (only required API permissions)
5. Monitor audit logs in Power BI Admin Portal

### Reliability
1. **Always test in non-production workspace first**
2. Keep backups of .pbix files before publishing
3. Use semantic versioning for report names (e.g., `Sales_v1.2.pbix`)
4. Implement retry logic for transient failures
5. Set up alerts for scheduled task failures

### Performance
1. Publish during off-peak hours to avoid rate limiting
2. For multiple reports, add delays between publishes (2-5 seconds)
3. Monitor import times and optimize large datasets
4. Use incremental refresh for large datasets

### Maintenance
1. Review logs regularly (`powerbi_publish_*.log`)
2. Update PowerShell modules monthly: `Update-Module MicrosoftPowerBIMgmt`
3. Update Python packages: `pip install --upgrade requests msal`
4. Test automation after Power BI Service updates

---

## API Reference

### PowerShell Cmdlets Used
- `Connect-PowerBIServiceAccount` - Authenticate to Power BI
- `Get-PowerBIWorkspace` - List/find workspaces
- `New-PowerBIReport` - Publish report
- `Disconnect-PowerBIServiceAccount` - Clean up session

### Power BI REST API Endpoints
- `GET /groups` - List workspaces
- `POST /groups/{groupId}/imports` - Import PBIX
- `GET /groups/{groupId}/imports/{importId}` - Check import status

Full API documentation: https://learn.microsoft.com/en-us/rest/api/power-bi/

---

## Support and Resources

### Official Documentation
- [Power BI REST API](https://learn.microsoft.com/en-us/rest/api/power-bi/)
- [Power BI PowerShell Cmdlets](https://learn.microsoft.com/en-us/powershell/power-bi/)
- [Service Principal Setup](https://learn.microsoft.com/en-us/power-bi/developer/embedded/embed-service-principal)

### Community
- [Power BI Community](https://community.powerbi.com/)
- [Stack Overflow - Power BI](https://stackoverflow.com/questions/tagged/powerbi)

### File Locations
- PowerShell Script: `/Users/Morpheous/Publish-PowerBIReport.ps1`
- Python Script: `/Users/Morpheous/publish_powerbi_report.py`
- Config Template: `/Users/Morpheous/powerbi_config.example.env`
- This Guide: `/Users/Morpheous/POWERBI_PUBLISHER_GUIDE.md`

---

## Quick Start Checklist

### PowerShell (Interactive - Fastest Setup)
- [ ] Install Power BI Management module
- [ ] Run script with `-PbixPath` and `-WorkspaceName`
- [ ] Login when prompted
- Done!

### Python (Automated - Most Flexible)
- [ ] Install Python packages (`pip install requests msal`)
- [ ] Create Azure AD App Registration
- [ ] Grant API permissions and admin consent
- [ ] Add service principal to workspace
- [ ] Set environment variables
- [ ] Run script with `--file` and `--workspace`
- Done!

---

## Version History

- **v1.0** - Initial release
  - PowerShell script with interactive and service principal auth
  - Python script with REST API implementation
  - Comprehensive error handling and logging
  - Complete setup guide

---

**For questions or issues, refer to the logs generated by each script (`powerbi_publish_*.log`) and consult the troubleshooting section above.**
