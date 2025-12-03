# ============================================================================
# Power BI Publisher - Simple Configuration Wrapper
# ============================================================================
# Edit the configuration below, then run this script
# No command-line parameters needed!

# CONFIGURATION - EDIT THESE VALUES
$CONFIG = @{
    # Path to your .pbix file (use full path)
    PbixFile = "C:\Reports\MySalesReport.pbix"

    # Target workspace name (exact name from Power BI Service)
    WorkspaceName = "My Workspace"

    # Authentication method:
    # "Interactive" = Login prompt (easiest for testing)
    # "ServicePrincipal" = Automated (requires env vars: PBI_CLIENT_ID, PBI_CLIENT_SECRET, PBI_TENANT_ID)
    AuthMode = "Interactive"
}

# ============================================================================
# DO NOT EDIT BELOW THIS LINE
# ============================================================================

$scriptPath = Join-Path $PSScriptRoot "Publish-PowerBIReport.ps1"

if (-not (Test-Path $scriptPath)) {
    Write-Host "ERROR: Publish-PowerBIReport.ps1 not found in same directory" -ForegroundColor Red
    exit 1
}

Write-Host "Power BI Publisher - Simple Launcher" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "File:      $($CONFIG.PbixFile)"
Write-Host "Workspace: $($CONFIG.WorkspaceName)"
Write-Host "Auth:      $($CONFIG.AuthMode)"
Write-Host ""

if ($CONFIG.AuthMode -eq "ServicePrincipal") {
    & $scriptPath -PbixPath $CONFIG.PbixFile -WorkspaceName $CONFIG.WorkspaceName -UseServicePrincipal
} else {
    & $scriptPath -PbixPath $CONFIG.PbixFile -WorkspaceName $CONFIG.WorkspaceName
}
