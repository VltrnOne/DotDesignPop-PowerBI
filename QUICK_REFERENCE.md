# Power BI Publisher - Quick Reference Card

## Install (One-Time Setup)

### PowerShell
```powershell
Install-Module -Name MicrosoftPowerBIMgmt -Scope CurrentUser
```

### Python
```bash
pip install requests msal
```

---

## Publish Commands

### PowerShell - Interactive (Easiest)
```powershell
.\Publish-PowerBIReport.ps1 `
    -PbixPath "C:\Reports\report.pbix" `
    -WorkspaceName "My Workspace"
```

### PowerShell - Service Principal (Automated)
```powershell
$env:PBI_CLIENT_ID = "your-client-id"
$env:PBI_CLIENT_SECRET = "your-secret"
$env:PBI_TENANT_ID = "your-tenant-id"

.\Publish-PowerBIReport.ps1 `
    -PbixPath "C:\Reports\report.pbix" `
    -WorkspaceName "Production" `
    -UseServicePrincipal
```

### Python
```bash
export PBI_CLIENT_ID="your-client-id"
export PBI_CLIENT_SECRET="your-secret"
export PBI_TENANT_ID="your-tenant-id"

python publish_powerbi_report.py \
    --file "report.pbix" \
    --workspace "Production"
```

---

## Test Setup
```bash
python test_powerbi_setup.py
```

---

## Simple Mode (Edit Once, Run Many Times)

### PowerShell
1. Edit `publish_simple.ps1` (lines 10-22)
2. Run: `.\publish_simple.ps1`

### Python
1. Edit `publish_simple.py` (lines 13-23)
2. Run: `python publish_simple.py`

---

## Environment Variables

### Windows (PowerShell)
```powershell
$env:PBI_CLIENT_ID = "your-client-id"
$env:PBI_CLIENT_SECRET = "your-secret"
$env:PBI_TENANT_ID = "your-tenant-id"
```

### Windows (Permanent)
```cmd
setx PBI_CLIENT_ID "your-client-id"
setx PBI_CLIENT_SECRET "your-secret"
setx PBI_TENANT_ID "your-tenant-id"
```

### macOS/Linux
```bash
export PBI_CLIENT_ID="your-client-id"
export PBI_CLIENT_SECRET="your-secret"
export PBI_TENANT_ID="your-tenant-id"
```

Add to `~/.bashrc` or `~/.zshrc` for persistence.

---

## Common Tasks

### List Workspaces
```powershell
# PowerShell
Connect-PowerBIServiceAccount
Get-PowerBIWorkspace | Select-Object Name, Id
```

### Batch Publish
```powershell
# PowerShell
$reports = @("Sales.pbix", "Finance.pbix")
foreach ($r in $reports) {
    .\Publish-PowerBIReport.ps1 -PbixPath $r -WorkspaceName "Production"
}
```

```bash
# Bash
for file in reports/*.pbix; do
    python publish_powerbi_report.py --file "$file" --workspace "Production"
done
```

---

## Troubleshooting

### Check Logs
```bash
# Latest log
ls -t powerbi_publish_*.log | head -1

# View log
cat powerbi_publish_*.log
```

### Common Fixes

**Module not found:**
```powershell
Install-Module -Name MicrosoftPowerBIMgmt -Force
```

**Python packages missing:**
```bash
pip install --upgrade requests msal
```

**Auth failed:**
- Verify environment variables are set
- Check client secret hasn't expired
- Ensure admin consent granted

**Workspace not found:**
- Run test script to list workspaces
- Check spelling (case-insensitive)

---

## Azure AD Setup (Service Principal)

1. **Create App**: Azure Portal → Azure AD → App registrations → New
2. **Get IDs**: Copy Application ID, Tenant ID
3. **Create Secret**: Certificates & secrets → New client secret → Copy Value
4. **Grant Permissions**: API permissions → Power BI Service → Add:
   - Dataset.ReadWrite.All
   - Workspace.ReadWrite.All
   - Grant admin consent
5. **Add to Workspace**: Power BI Service → Workspace → Access → Add app as Admin/Member
6. **Enable in Tenant**: Admin Portal → Tenant settings → Allow service principals

---

## File Paths

All files in: `/Users/Morpheous/`

### Use These
- `Publish-PowerBIReport.ps1` - Main PowerShell script
- `publish_powerbi_report.py` - Main Python script
- `publish_simple.ps1` - Simple PowerShell wrapper
- `publish_simple.py` - Simple Python wrapper
- `test_powerbi_setup.py` - Setup validator

### Read These
- `POWERBI_PUBLISHER_README.md` - Overview
- `POWERBI_PUBLISHER_GUIDE.md` - Detailed guide
- `powerbi_config.example.env` - Config template
- `QUICK_REFERENCE.md` - This file

---

## Schedule Publishing

### Windows Task Scheduler
- Program: `powershell.exe`
- Arguments: `-File "C:\Scripts\publish_simple.ps1"`

### Cron (Linux/macOS)
```bash
# Daily at 6 AM
0 6 * * * cd /path/to/scripts && python publish_simple.py
```

### GitHub Actions
```yaml
- name: Publish Report
  env:
    PBI_CLIENT_ID: ${{ secrets.PBI_CLIENT_ID }}
    PBI_CLIENT_SECRET: ${{ secrets.PBI_CLIENT_SECRET }}
    PBI_TENANT_ID: ${{ secrets.PBI_TENANT_ID }}
  run: python publish_powerbi_report.py --file "report.pbix" --workspace "Production"
```

---

## API Endpoints Used

- `GET /groups` - List workspaces
- `POST /groups/{id}/imports` - Upload PBIX
- `GET /groups/{id}/imports/{id}` - Check status

Base: `https://api.powerbi.com/v1.0/myorg`

---

## Permissions Required

### User Auth
- Workspace: Admin or Member role

### Service Principal
- Azure AD: Application permissions granted with admin consent
- Power BI: Service principal added to workspace as Admin/Member
- Tenant: "Allow service principals to use APIs" enabled

---

## Error Codes

- **401 Unauthorized** - Check credentials/token
- **403 Forbidden** - Check workspace permissions
- **404 Not Found** - Workspace doesn't exist
- **429 Too Many Requests** - Rate limited (auto-retries)
- **500 Server Error** - Power BI service issue (retry)

---

## Performance

- **Small** (<10 MB): 10-30 sec
- **Medium** (10-100 MB): 30-120 sec
- **Large** (100-500 MB): 2-5 min
- **Max size**: 1 GB (Pro) / 10 GB (Premium)

---

## Support Resources

- **Detailed Guide**: POWERBI_PUBLISHER_GUIDE.md
- **Microsoft Docs**: https://learn.microsoft.com/en-us/rest/api/power-bi/
- **PowerShell Cmdlets**: https://learn.microsoft.com/en-us/powershell/power-bi/
- **Test Script**: `python test_powerbi_setup.py`

---

## One-Liner Tests

### PowerShell
```powershell
.\Publish-PowerBIReport.ps1 -PbixPath "test.pbix" -WorkspaceName "My Workspace"
```

### Python
```bash
python publish_powerbi_report.py --file "test.pbix" --workspace "My Workspace"
```

### Validate Setup
```bash
python test_powerbi_setup.py
```

---

**For detailed instructions, see POWERBI_PUBLISHER_GUIDE.md**

**For overview and use cases, see POWERBI_PUBLISHER_README.md**
