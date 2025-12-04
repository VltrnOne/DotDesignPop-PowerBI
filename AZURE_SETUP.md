# Azure AD Setup for Power BI API

This guide walks you through setting up Azure AD authentication to use the Power BI REST API.

---

## Step 1: Register an Application in Azure AD

1. Go to **[Azure Portal](https://portal.azure.com)**
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **+ New registration**

### Registration Settings:
| Field | Value |
|-------|-------|
| Name | `PowerBI-Publisher` (or your choice) |
| Supported account types | `Accounts in this organizational directory only` |
| Redirect URI | Leave blank (not needed for service principal) |

4. Click **Register**

---

## Step 2: Note Your Application IDs

After registration, you'll see the **Overview** page. Copy these values:

| Value | Where to Find | Config Key |
|-------|---------------|------------|
| **Application (client) ID** | Overview page | `client_id` |
| **Directory (tenant) ID** | Overview page | `tenant_id` |

---

## Step 3: Create a Client Secret

1. Go to **Certificates & secrets** (left sidebar)
2. Click **+ New client secret**
3. Set description: `PowerBI API Access`
4. Set expiration: `24 months` (or your preference)
5. Click **Add**

**IMPORTANT:** Copy the secret **Value** immediately - it won't be shown again!

| Value | Config Key |
|-------|------------|
| Secret Value | `client_secret` |

---

## Step 4: Configure API Permissions

1. Go to **API permissions** (left sidebar)
2. Click **+ Add a permission**
3. Select **Power BI Service**
4. Choose **Delegated permissions** OR **Application permissions**

### For Service Principal (recommended for automation):
Select **Application permissions**:
- [x] `Tenant.Read.All`
- [x] `Tenant.ReadWrite.All`
- [x] `Dataset.ReadWrite.All`
- [x] `Report.ReadWrite.All`
- [x] `Workspace.ReadWrite.All`

5. Click **Add permissions**
6. Click **Grant admin consent for [Your Org]** (requires admin)

---

## Step 5: Enable Service Principal in Power BI Admin

**This step is required for service principal authentication!**

1. Go to **[Power BI Admin Portal](https://app.powerbi.com/admin-portal)**
2. Navigate to **Tenant settings**
3. Find **Developer settings** section
4. Enable **"Allow service principals to use Power BI APIs"**
5. Choose who can use this:
   - Specific security groups (recommended)
   - The entire organization

### Add Service Principal to Security Group (if using groups):
1. Go back to Azure Portal
2. Navigate to **Azure Active Directory** > **Groups**
3. Create or select a security group
4. Add your registered application as a member

---

## Step 6: Add Service Principal to Workspace

1. Go to **[Power BI Service](https://app.powerbi.com)**
2. Open the target workspace
3. Click **Access** (top right)
4. Click **+ Add people or groups**
5. Search for your app name (`PowerBI-Publisher`)
6. Set permission: **Admin** or **Member**
7. Click **Add**

---

## Step 7: Create Your Config File

Create `powerbi_config.json` in the project directory:

```json
{
  "tenant_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "client_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "client_secret": "your-secret-value-here"
}
```

**Or use environment variables:**
```bash
export POWERBI_TENANT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export POWERBI_CLIENT_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
export POWERBI_CLIENT_SECRET="your-secret-value-here"
```

---

## Step 8: Test the Connection

```bash
# Install requests if needed
pip install requests

# List workspaces (tests authentication)
python powerbi_publisher.py --pbix dummy.pbix --list-workspaces
```

You should see your workspaces listed.

---

## Troubleshooting

### "AADSTS700016: Application not found"
- Double-check your `client_id` and `tenant_id`
- Ensure the app is registered in the correct Azure AD tenant

### "Unauthorized" or "403 Forbidden"
- Service principal not added to workspace
- API permissions not granted admin consent
- Service principal not enabled in Power BI tenant settings

### "Resource not found"
- Workspace ID is incorrect
- Service principal doesn't have access to the workspace

### "Import failed"
- PBIX file is corrupted or too large
- Dataset name conflicts (use `--conflict Overwrite`)

---

## Security Best Practices

1. **Never commit `powerbi_config.json` to git** - add it to `.gitignore`
2. **Use environment variables in production**
3. **Rotate client secrets** before expiration
4. **Use the least privilege principle** - only grant necessary permissions
5. **Use security groups** to control API access

---

## Quick Reference

### CLI Commands

```bash
# List workspaces
python powerbi_publisher.py --pbix any.pbix --list-workspaces

# List reports in a workspace
python powerbi_publisher.py --pbix any.pbix --workspace "My Workspace" --list-reports

# Publish a report
python powerbi_publisher.py --pbix MyReport.pbix --workspace "My Workspace"

# Publish with overwrite
python powerbi_publisher.py --pbix MyReport.pbix --workspace "My Workspace" --conflict Overwrite

# Publish with custom name
python powerbi_publisher.py --pbix MyReport.pbix --name "Production Dashboard" --workspace "Analytics"
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `POWERBI_TENANT_ID` | Azure AD tenant ID |
| `POWERBI_CLIENT_ID` | Application (client) ID |
| `POWERBI_CLIENT_SECRET` | Client secret value |

---

## Links

- [Azure Portal](https://portal.azure.com)
- [Power BI Admin Portal](https://app.powerbi.com/admin-portal)
- [Power BI REST API Docs](https://learn.microsoft.com/en-us/rest/api/power-bi/)
- [Register Azure AD App](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
