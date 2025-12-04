#!/usr/bin/env python3
"""
Power BI Publisher - Automated PBIX Upload Script
DotDesignPop Dashboard Publisher

This script publishes .pbix files to Power BI Service using the REST API.
Supports both interactive and service principal authentication.

Usage:
    python powerbi_publisher.py --pbix report.pbix --workspace "My Workspace"
    python powerbi_publisher.py --pbix report.pbix --workspace-id abc-123-def
"""

import os
import sys
import json
import time
import argparse
import requests
from pathlib import Path
from typing import Optional, Dict, Any

# =============================================================================
# CONFIGURATION
# =============================================================================

# Power BI API endpoints
POWER_BI_API_BASE = "https://api.powerbi.com/v1.0/myorg"
AZURE_LOGIN_URL = "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
POWER_BI_SCOPE = "https://analysis.windows.net/powerbi/api/.default"

# =============================================================================
# AUTHENTICATION
# =============================================================================

class PowerBIAuth:
    """Handle Power BI authentication via Azure AD"""

    def __init__(self, tenant_id: str, client_id: str, client_secret: str):
        self.tenant_id = tenant_id
        self.client_id = client_id
        self.client_secret = client_secret
        self.access_token = None
        self.token_expiry = 0

    def get_token(self) -> str:
        """Get access token using client credentials flow"""
        if self.access_token and time.time() < self.token_expiry - 60:
            return self.access_token

        url = AZURE_LOGIN_URL.format(tenant_id=self.tenant_id)

        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "scope": POWER_BI_SCOPE
        }

        response = requests.post(url, data=data)

        if response.status_code != 200:
            raise Exception(f"Authentication failed: {response.text}")

        token_data = response.json()
        self.access_token = token_data["access_token"]
        self.token_expiry = time.time() + token_data.get("expires_in", 3600)

        return self.access_token

# =============================================================================
# POWER BI CLIENT
# =============================================================================

class PowerBIClient:
    """Power BI REST API Client"""

    def __init__(self, auth: PowerBIAuth):
        self.auth = auth

    def _headers(self) -> Dict[str, str]:
        """Get authorization headers"""
        return {
            "Authorization": f"Bearer {self.auth.get_token()}",
            "Content-Type": "application/json"
        }

    def _request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make authenticated request to Power BI API"""
        url = f"{POWER_BI_API_BASE}{endpoint}"
        headers = kwargs.pop("headers", {})
        headers.update({"Authorization": f"Bearer {self.auth.get_token()}"})

        response = requests.request(method, url, headers=headers, **kwargs)
        return response

    # -------------------------------------------------------------------------
    # Workspaces
    # -------------------------------------------------------------------------

    def list_workspaces(self) -> list:
        """List all workspaces the user has access to"""
        response = self._request("GET", "/groups")

        if response.status_code != 200:
            raise Exception(f"Failed to list workspaces: {response.text}")

        return response.json().get("value", [])

    def get_workspace_id(self, workspace_name: str) -> Optional[str]:
        """Get workspace ID by name"""
        workspaces = self.list_workspaces()

        for ws in workspaces:
            if ws["name"].lower() == workspace_name.lower():
                return ws["id"]

        return None

    # -------------------------------------------------------------------------
    # Reports
    # -------------------------------------------------------------------------

    def list_reports(self, workspace_id: Optional[str] = None) -> list:
        """List reports in a workspace"""
        if workspace_id:
            endpoint = f"/groups/{workspace_id}/reports"
        else:
            endpoint = "/reports"

        response = self._request("GET", endpoint)

        if response.status_code != 200:
            raise Exception(f"Failed to list reports: {response.text}")

        return response.json().get("value", [])

    def get_report(self, report_id: str, workspace_id: Optional[str] = None) -> Dict:
        """Get report details"""
        if workspace_id:
            endpoint = f"/groups/{workspace_id}/reports/{report_id}"
        else:
            endpoint = f"/reports/{report_id}"

        response = self._request("GET", endpoint)

        if response.status_code != 200:
            raise Exception(f"Failed to get report: {response.text}")

        return response.json()

    def delete_report(self, report_id: str, workspace_id: Optional[str] = None) -> bool:
        """Delete a report"""
        if workspace_id:
            endpoint = f"/groups/{workspace_id}/reports/{report_id}"
        else:
            endpoint = f"/reports/{report_id}"

        response = self._request("DELETE", endpoint)
        return response.status_code == 200

    # -------------------------------------------------------------------------
    # Import (Publish PBIX)
    # -------------------------------------------------------------------------

    def import_pbix(
        self,
        pbix_path: str,
        dataset_name: str,
        workspace_id: Optional[str] = None,
        name_conflict: str = "CreateOrOverwrite",
        skip_report: bool = False
    ) -> Dict[str, Any]:
        """
        Import a PBIX file to Power BI Service

        Args:
            pbix_path: Path to the .pbix file
            dataset_name: Display name for the dataset
            workspace_id: Target workspace ID (None for My Workspace)
            name_conflict: CreateOrOverwrite, Abort, Overwrite, Ignore
            skip_report: If True, only import dataset without report

        Returns:
            Import status dict with import ID
        """
        pbix_path = Path(pbix_path)

        if not pbix_path.exists():
            raise FileNotFoundError(f"PBIX file not found: {pbix_path}")

        if not pbix_path.suffix.lower() == ".pbix":
            raise ValueError("File must be a .pbix file")

        file_size = pbix_path.stat().st_size
        file_size_mb = file_size / (1024 * 1024)

        print(f"Uploading: {pbix_path.name} ({file_size_mb:.1f} MB)")

        # Build endpoint
        if workspace_id:
            endpoint = f"/groups/{workspace_id}/imports"
        else:
            endpoint = "/imports"

        # Query parameters
        params = {
            "datasetDisplayName": dataset_name,
            "nameConflict": name_conflict,
            "skipReport": str(skip_report).lower()
        }

        # For files > 1GB, need to use temporary upload location
        if file_size_mb > 1024:
            return self._import_large_pbix(pbix_path, dataset_name, workspace_id, name_conflict)

        # Standard upload for files < 1GB
        url = f"{POWER_BI_API_BASE}{endpoint}"

        headers = {
            "Authorization": f"Bearer {self.auth.get_token()}"
        }

        with open(pbix_path, "rb") as f:
            files = {"file": (pbix_path.name, f, "application/octet-stream")}
            response = requests.post(url, headers=headers, params=params, files=files)

        if response.status_code not in [200, 201, 202]:
            raise Exception(f"Import failed ({response.status_code}): {response.text}")

        import_info = response.json()
        print(f"Import started: {import_info.get('id', 'unknown')}")

        return import_info

    def _import_large_pbix(
        self,
        pbix_path: Path,
        dataset_name: str,
        workspace_id: Optional[str],
        name_conflict: str
    ) -> Dict[str, Any]:
        """Handle large PBIX files (> 1GB) using temporary upload location"""

        # Step 1: Create temporary upload location
        if workspace_id:
            endpoint = f"/groups/{workspace_id}/imports/createTemporaryUploadLocation"
        else:
            endpoint = "/imports/createTemporaryUploadLocation"

        response = self._request("POST", endpoint)

        if response.status_code != 200:
            raise Exception(f"Failed to create upload location: {response.text}")

        upload_url = response.json()["url"]

        # Step 2: Upload file to blob storage
        print("Uploading to temporary storage...")

        with open(pbix_path, "rb") as f:
            blob_response = requests.put(
                upload_url,
                data=f,
                headers={
                    "x-ms-blob-type": "BlockBlob",
                    "Content-Type": "application/octet-stream"
                }
            )

        if blob_response.status_code not in [200, 201]:
            raise Exception(f"Blob upload failed: {blob_response.text}")

        # Step 3: Start import from blob
        if workspace_id:
            endpoint = f"/groups/{workspace_id}/imports"
        else:
            endpoint = "/imports"

        params = {
            "datasetDisplayName": dataset_name,
            "nameConflict": name_conflict
        }

        body = {"fileUrl": upload_url}

        response = self._request("POST", endpoint, params=params, json=body)

        if response.status_code not in [200, 201, 202]:
            raise Exception(f"Import from blob failed: {response.text}")

        return response.json()

    def get_import_status(self, import_id: str, workspace_id: Optional[str] = None) -> Dict:
        """Check the status of an import operation"""
        if workspace_id:
            endpoint = f"/groups/{workspace_id}/imports/{import_id}"
        else:
            endpoint = f"/imports/{import_id}"

        response = self._request("GET", endpoint)

        if response.status_code != 200:
            raise Exception(f"Failed to get import status: {response.text}")

        return response.json()

    def wait_for_import(
        self,
        import_id: str,
        workspace_id: Optional[str] = None,
        timeout: int = 300,
        poll_interval: int = 5
    ) -> Dict:
        """Wait for import to complete"""
        start_time = time.time()

        while time.time() - start_time < timeout:
            status = self.get_import_status(import_id, workspace_id)
            import_state = status.get("importState", "Unknown")

            print(f"  Import status: {import_state}")

            if import_state == "Succeeded":
                return status
            elif import_state == "Failed":
                raise Exception(f"Import failed: {status}")

            time.sleep(poll_interval)

        raise TimeoutError(f"Import timed out after {timeout} seconds")

    # -------------------------------------------------------------------------
    # Datasets
    # -------------------------------------------------------------------------

    def list_datasets(self, workspace_id: Optional[str] = None) -> list:
        """List datasets in a workspace"""
        if workspace_id:
            endpoint = f"/groups/{workspace_id}/datasets"
        else:
            endpoint = "/datasets"

        response = self._request("GET", endpoint)

        if response.status_code != 200:
            raise Exception(f"Failed to list datasets: {response.text}")

        return response.json().get("value", [])

    def refresh_dataset(self, dataset_id: str, workspace_id: Optional[str] = None) -> bool:
        """Trigger a dataset refresh"""
        if workspace_id:
            endpoint = f"/groups/{workspace_id}/datasets/{dataset_id}/refreshes"
        else:
            endpoint = f"/datasets/{dataset_id}/refreshes"

        response = self._request("POST", endpoint)
        return response.status_code == 202

# =============================================================================
# CLI
# =============================================================================

def load_config(config_path: str = None) -> Dict[str, str]:
    """Load configuration from file or environment"""
    config = {
        "tenant_id": os.environ.get("POWERBI_TENANT_ID", ""),
        "client_id": os.environ.get("POWERBI_CLIENT_ID", ""),
        "client_secret": os.environ.get("POWERBI_CLIENT_SECRET", "")
    }

    # Try loading from config file
    if config_path and Path(config_path).exists():
        with open(config_path) as f:
            file_config = json.load(f)
            config.update(file_config)
    elif Path("powerbi_config.json").exists():
        with open("powerbi_config.json") as f:
            file_config = json.load(f)
            config.update(file_config)

    return config


def main():
    parser = argparse.ArgumentParser(
        description="Publish Power BI reports (.pbix) to Power BI Service"
    )

    parser.add_argument(
        "--pbix", "-p",
        required=True,
        help="Path to the .pbix file to publish"
    )

    parser.add_argument(
        "--name", "-n",
        help="Display name for the report/dataset (default: filename)"
    )

    parser.add_argument(
        "--workspace", "-w",
        help="Target workspace name"
    )

    parser.add_argument(
        "--workspace-id",
        help="Target workspace ID (alternative to --workspace)"
    )

    parser.add_argument(
        "--conflict",
        choices=["CreateOrOverwrite", "Abort", "Overwrite", "Ignore"],
        default="CreateOrOverwrite",
        help="How to handle naming conflicts (default: CreateOrOverwrite)"
    )

    parser.add_argument(
        "--config", "-c",
        help="Path to config JSON file"
    )

    parser.add_argument(
        "--list-workspaces",
        action="store_true",
        help="List available workspaces and exit"
    )

    parser.add_argument(
        "--list-reports",
        action="store_true",
        help="List reports in workspace and exit"
    )

    parser.add_argument(
        "--wait",
        action="store_true",
        default=True,
        help="Wait for import to complete (default: True)"
    )

    parser.add_argument(
        "--timeout",
        type=int,
        default=300,
        help="Timeout in seconds when waiting for import (default: 300)"
    )

    args = parser.parse_args()

    # Load configuration
    config = load_config(args.config)

    # Validate config
    missing = [k for k in ["tenant_id", "client_id", "client_secret"] if not config.get(k)]
    if missing:
        print(f"Error: Missing configuration: {', '.join(missing)}")
        print("\nSet environment variables or create powerbi_config.json:")
        print("  POWERBI_TENANT_ID")
        print("  POWERBI_CLIENT_ID")
        print("  POWERBI_CLIENT_SECRET")
        sys.exit(1)

    # Initialize client
    auth = PowerBIAuth(
        tenant_id=config["tenant_id"],
        client_id=config["client_id"],
        client_secret=config["client_secret"]
    )

    client = PowerBIClient(auth)

    # List workspaces mode
    if args.list_workspaces:
        print("\nAvailable Workspaces:")
        print("-" * 50)
        for ws in client.list_workspaces():
            print(f"  {ws['name']}")
            print(f"    ID: {ws['id']}")
        return

    # Resolve workspace ID
    workspace_id = args.workspace_id
    if args.workspace and not workspace_id:
        workspace_id = client.get_workspace_id(args.workspace)
        if not workspace_id:
            print(f"Error: Workspace '{args.workspace}' not found")
            print("\nAvailable workspaces:")
            for ws in client.list_workspaces():
                print(f"  - {ws['name']}")
            sys.exit(1)

    # List reports mode
    if args.list_reports:
        print(f"\nReports in workspace:")
        print("-" * 50)
        for report in client.list_reports(workspace_id):
            print(f"  {report['name']}")
            print(f"    ID: {report['id']}")
        return

    # Publish mode
    pbix_path = Path(args.pbix)
    dataset_name = args.name or pbix_path.stem

    print(f"\n{'='*60}")
    print(f"Power BI Publisher")
    print(f"{'='*60}")
    print(f"File: {pbix_path}")
    print(f"Name: {dataset_name}")
    print(f"Workspace: {args.workspace or 'My Workspace'}")
    print(f"Conflict: {args.conflict}")
    print(f"{'='*60}\n")

    try:
        # Import the PBIX
        import_result = client.import_pbix(
            pbix_path=str(pbix_path),
            dataset_name=dataset_name,
            workspace_id=workspace_id,
            name_conflict=args.conflict
        )

        import_id = import_result.get("id")

        if args.wait and import_id:
            print("\nWaiting for import to complete...")
            final_status = client.wait_for_import(
                import_id=import_id,
                workspace_id=workspace_id,
                timeout=args.timeout
            )

            print(f"\n{'='*60}")
            print("IMPORT SUCCESSFUL!")
            print(f"{'='*60}")

            # Print report info
            reports = final_status.get("reports", [])
            datasets = final_status.get("datasets", [])

            if reports:
                print(f"\nReport: {reports[0].get('name')}")
                print(f"  ID: {reports[0].get('id')}")
                report_id = reports[0].get('id')
                if workspace_id:
                    print(f"  URL: https://app.powerbi.com/groups/{workspace_id}/reports/{report_id}")
                else:
                    print(f"  URL: https://app.powerbi.com/reports/{report_id}")

            if datasets:
                print(f"\nDataset: {datasets[0].get('name')}")
                print(f"  ID: {datasets[0].get('id')}")

        else:
            print(f"\nImport started: {import_id}")
            print("Use --wait to wait for completion")

        print("\nDone!")

    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
