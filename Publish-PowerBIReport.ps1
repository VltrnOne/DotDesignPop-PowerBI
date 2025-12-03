<#
.SYNOPSIS
    Power BI Report Publisher - Automated PBIX Publishing to Power BI Service

.DESCRIPTION
    Single-purpose automation script to publish a Power BI .pbix file to a specified workspace.
    Handles authentication, workspace resolution, and publish operation with comprehensive error handling.

.PARAMETER PbixPath
    Full path to the .pbix file to publish

.PARAMETER WorkspaceName
    Name of the Power BI workspace to publish to (case-insensitive)

.PARAMETER UseServicePrincipal
    Switch to use Service Principal authentication instead of interactive login

.EXAMPLE
    .\Publish-PowerBIReport.ps1 -PbixPath "C:\Reports\SalesReport.pbix" -WorkspaceName "Production Reports"

.EXAMPLE
    .\Publish-PowerBIReport.ps1 -PbixPath "C:\Reports\SalesReport.pbix" -WorkspaceName "Production Reports" -UseServicePrincipal
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, HelpMessage = "Full path to the .pbix file")]
    [ValidateScript({
        if (-not (Test-Path $_)) {
            throw "File not found: $_"
        }
        if ($_ -notmatch '\.pbix$') {
            throw "File must be a .pbix file: $_"
        }
        return $true
    })]
    [string]$PbixPath,

    [Parameter(Mandatory = $true, HelpMessage = "Target workspace name")]
    [ValidateNotNullOrEmpty()]
    [string]$WorkspaceName,

    [Parameter(Mandatory = $false, HelpMessage = "Use Service Principal authentication")]
    [switch]$UseServicePrincipal
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Logging configuration
$LogFile = Join-Path $PSScriptRoot "powerbi_publish_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet('INFO', 'SUCCESS', 'WARNING', 'ERROR')]
        [string]$Level = 'INFO'
    )

    $timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $logMessage = "[$timestamp] [$Level] $Message"

    # Console output with color
    switch ($Level) {
        'SUCCESS' { Write-Host $logMessage -ForegroundColor Green }
        'WARNING' { Write-Host $logMessage -ForegroundColor Yellow }
        'ERROR'   { Write-Host $logMessage -ForegroundColor Red }
        default   { Write-Host $logMessage }
    }

    # File output
    Add-Content -Path $LogFile -Value $logMessage
}

function Test-PowerBIModule {
    Write-Log "Checking for Power BI Management module..."

    $module = Get-Module -ListAvailable -Name MicrosoftPowerBIMgmt

    if (-not $module) {
        Write-Log "Power BI Management module not found." -Level ERROR
        Write-Log "Please install: Install-Module -Name MicrosoftPowerBIMgmt -Scope CurrentUser" -Level ERROR
        throw "Required module not installed"
    }

    Write-Log "Power BI Management module found (Version: $($module.Version))" -Level SUCCESS
    Import-Module MicrosoftPowerBIMgmt -ErrorAction Stop
}

function Connect-ToPowerBI {
    param([bool]$UseServicePrincipal)

    Write-Log "Authenticating to Power BI Service..."

    try {
        if ($UseServicePrincipal) {
            # Service Principal authentication
            $clientId = $env:PBI_CLIENT_ID
            $clientSecret = $env:PBI_CLIENT_SECRET
            $tenantId = $env:PBI_TENANT_ID

            if (-not $clientId -or -not $clientSecret -or -not $tenantId) {
                throw "Service Principal credentials not found in environment variables. Required: PBI_CLIENT_ID, PBI_CLIENT_SECRET, PBI_TENANT_ID"
            }

            $password = ConvertTo-SecureString $clientSecret -AsPlainText -Force
            $credential = New-Object System.Management.Automation.PSCredential($clientId, $password)

            Connect-PowerBIServiceAccount -ServicePrincipal -Credential $credential -Tenant $tenantId | Out-Null
            Write-Log "Authenticated using Service Principal: $clientId" -Level SUCCESS
        }
        else {
            # Interactive user authentication
            Connect-PowerBIServiceAccount | Out-Null
            Write-Log "Authenticated using interactive login" -Level SUCCESS
        }
    }
    catch {
        Write-Log "Authentication failed: $($_.Exception.Message)" -Level ERROR
        throw
    }
}

function Get-TargetWorkspace {
    param([string]$Name)

    Write-Log "Searching for workspace: $Name"

    try {
        $workspaces = Get-PowerBIWorkspace -Scope Organization -All
        $targetWorkspace = $workspaces | Where-Object { $_.Name -eq $Name }

        if (-not $targetWorkspace) {
            # Try case-insensitive match
            $targetWorkspace = $workspaces | Where-Object { $_.Name -ieq $Name }
        }

        if (-not $targetWorkspace) {
            Write-Log "Available workspaces:" -Level WARNING
            $workspaces | ForEach-Object { Write-Log "  - $($_.Name) (ID: $($_.Id))" -Level WARNING }
            throw "Workspace '$Name' not found"
        }

        Write-Log "Found workspace: $($targetWorkspace.Name) (ID: $($targetWorkspace.Id))" -Level SUCCESS
        return $targetWorkspace
    }
    catch {
        Write-Log "Failed to retrieve workspace: $($_.Exception.Message)" -Level ERROR
        throw
    }
}

function Publish-Report {
    param(
        [string]$FilePath,
        [object]$Workspace
    )

    Write-Log "Starting publish operation..."
    Write-Log "  File: $FilePath"
    Write-Log "  Workspace: $($Workspace.Name)"
    Write-Log "  File Size: $([math]::Round((Get-Item $FilePath).Length / 1MB, 2)) MB"

    try {
        # New-PowerBIReport is the primary publish cmdlet
        $publishResult = New-PowerBIReport -Path $FilePath -WorkspaceId $Workspace.Id -ConflictAction CreateOrOverwrite

        Write-Log "Report published successfully!" -Level SUCCESS
        Write-Log "  Report ID: $($publishResult.Id)" -Level SUCCESS
        Write-Log "  Report Name: $($publishResult.Name)" -Level SUCCESS
        Write-Log "  Web URL: $($publishResult.WebUrl)" -Level SUCCESS

        return $publishResult
    }
    catch {
        Write-Log "Publish operation failed: $($_.Exception.Message)" -Level ERROR

        # Check for common errors
        if ($_.Exception.Message -match "dataset") {
            Write-Log "Hint: This may be a dataset refresh issue. Check your data source credentials in Power BI Service." -Level WARNING
        }
        elseif ($_.Exception.Message -match "capacity") {
            Write-Log "Hint: The workspace may not have sufficient capacity. Check workspace settings." -Level WARNING
        }
        elseif ($_.Exception.Message -match "permission") {
            Write-Log "Hint: You may not have publish permissions in this workspace. Required: Contributor or Admin role." -Level WARNING
        }

        throw
    }
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

Write-Log "================================================"
Write-Log "Power BI Report Publisher - Starting"
Write-Log "================================================"

try {
    # Step 1: Validate prerequisites
    Test-PowerBIModule

    # Step 2: Resolve full path
    $resolvedPath = (Resolve-Path $PbixPath).Path
    Write-Log "Resolved file path: $resolvedPath"

    # Step 3: Authenticate
    Connect-ToPowerBI -UseServicePrincipal $UseServicePrincipal.IsPresent

    # Step 4: Find target workspace
    $workspace = Get-TargetWorkspace -Name $WorkspaceName

    # Step 5: Publish report
    $result = Publish-Report -FilePath $resolvedPath -Workspace $workspace

    # Step 6: Cleanup
    Disconnect-PowerBIServiceAccount | Out-Null
    Write-Log "Disconnected from Power BI Service"

    Write-Log "================================================"
    Write-Log "Publish operation completed successfully!" -Level SUCCESS
    Write-Log "Log file: $LogFile"
    Write-Log "================================================"

    # Return result object for pipeline use
    return $result
}
catch {
    Write-Log "================================================" -Level ERROR
    Write-Log "Publish operation FAILED" -Level ERROR
    Write-Log "Error: $($_.Exception.Message)" -Level ERROR
    Write-Log "Log file: $LogFile" -Level ERROR
    Write-Log "================================================" -Level ERROR

    # Cleanup connection
    try { Disconnect-PowerBIServiceAccount | Out-Null } catch {}

    exit 1
}
