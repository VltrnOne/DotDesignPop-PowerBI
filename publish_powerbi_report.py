#!/usr/bin/env python3
"""
Power BI Report Publisher - Python Implementation

Single-purpose automation to publish .pbix files to Power BI Service using REST API.
Requires Azure AD App Registration with Power BI API permissions.

Usage:
    python publish_powerbi_report.py --file report.pbix --workspace "Production Reports"

Prerequisites:
    - Azure AD App with Power BI API permissions (Dataset.ReadWrite.All, Workspace.ReadWrite.All)
    - Environment variables: PBI_CLIENT_ID, PBI_CLIENT_SECRET, PBI_TENANT_ID
"""

import os
import sys
import argparse
import logging
import time
from pathlib import Path
from datetime import datetime
from typing import Optional, Dict

try:
    import requests
    from msal import ConfidentialClientApplication
except ImportError:
    print("ERROR: Required packages not installed.")
    print("Install with: pip install requests msal")
    sys.exit(1)

# ============================================================================
# CONFIGURATION
# ============================================================================

# Power BI API endpoints
POWER_BI_API_BASE = "https://api.powerbi.com/v1.0/myorg"
POWER_BI_SCOPE = ["https://analysis.windows.net/powerbi/api/.default"]

# Logging setup
LOG_FILE = f"powerbi_publish_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# ============================================================================
# AUTHENTICATION
# ============================================================================

class PowerBIAuthenticator:
    """Handles Azure AD authentication for Power BI Service"""

    def __init__(self):
        self.client_id = os.getenv('PBI_CLIENT_ID')
        self.client_secret = os.getenv('PBI_CLIENT_SECRET')
        self.tenant_id = os.getenv('PBI_TENANT_ID')
        self.token = None

        self._validate_credentials()

    def _validate_credentials(self):
        """Validate that all required credentials are present"""
        missing = []
        if not self.client_id:
            missing.append('PBI_CLIENT_ID')
        if not self.client_secret:
            missing.append('PBI_CLIENT_SECRET')
        if not self.tenant_id:
            missing.append('PBI_TENANT_ID')

        if missing:
            raise ValueError(
                f"Missing environment variables: {', '.join(missing)}\n"
                "Required for Service Principal authentication."
            )

    def authenticate(self) -> str:
        """Authenticate and return access token"""
        logger.info("Authenticating with Azure AD...")

        try:
            authority = f"https://login.microsoftonline.com/{self.tenant_id}"
            app = ConfidentialClientApplication(
                client_id=self.client_id,
                client_credential=self.client_secret,
                authority=authority
            )

            result = app.acquire_token_for_client(scopes=POWER_BI_SCOPE)

            if "access_token" not in result:
                error_msg = result.get("error_description", result.get("error", "Unknown error"))
                raise Exception(f"Authentication failed: {error_msg}")

            self.token = result["access_token"]
            logger.info(f"Authentication successful (Client ID: {self.client_id[:8]}...)")
            return self.token

        except Exception as e:
            logger.error(f"Authentication failed: {str(e)}")
            raise

# ============================================================================
# POWER BI OPERATIONS
# ============================================================================

class PowerBIPublisher:
    """Handles Power BI report publishing operations"""

    def __init__(self, access_token: str):
        self.access_token = access_token
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

    def _make_request(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Make authenticated API request with retry logic"""
        url = f"{POWER_BI_API_BASE}/{endpoint}"
        max_retries = 3
        retry_delay = 2

        for attempt in range(max_retries):
            try:
                response = requests.request(method, url, headers=self.headers, **kwargs)

                if response.status_code == 429:  # Rate limited
                    wait_time = int(response.headers.get('Retry-After', retry_delay * (attempt + 1)))
                    logger.warning(f"Rate limited. Waiting {wait_time} seconds...")
                    time.sleep(wait_time)
                    continue

                return response

            except requests.exceptions.RequestException as e:
                if attempt == max_retries - 1:
                    raise
                logger.warning(f"Request failed (attempt {attempt + 1}/{max_retries}): {str(e)}")
                time.sleep(retry_delay * (attempt + 1))

        raise Exception("Max retries exceeded")

    def get_workspace_id(self, workspace_name: str) -> str:
        """Find workspace by name and return its ID"""
        logger.info(f"Searching for workspace: {workspace_name}")

        response = self._make_request("GET", "groups")

        if response.status_code != 200:
            raise Exception(f"Failed to retrieve workspaces: {response.text}")

        workspaces = response.json().get("value", [])

        # Case-insensitive match
        for workspace in workspaces:
            if workspace["name"].lower() == workspace_name.lower():
                workspace_id = workspace["id"]
                logger.info(f"Found workspace: {workspace['name']} (ID: {workspace_id})")
                return workspace_id

        # List available workspaces
        logger.warning("Available workspaces:")
        for workspace in workspaces:
            logger.warning(f"  - {workspace['name']} (ID: {workspace['id']})")

        raise ValueError(f"Workspace '{workspace_name}' not found")

    def publish_report(self, pbix_path: Path, workspace_id: str, report_name: Optional[str] = None) -> Dict:
        """Publish PBIX file to Power BI workspace"""

        if not pbix_path.exists():
            raise FileNotFoundError(f"File not found: {pbix_path}")

        if pbix_path.suffix.lower() != '.pbix':
            raise ValueError(f"File must be a .pbix file: {pbix_path}")

        # Use filename as report name if not specified
        if not report_name:
            report_name = pbix_path.stem

        file_size_mb = pbix_path.stat().st_size / (1024 * 1024)
        logger.info(f"Publishing report...")
        logger.info(f"  File: {pbix_path}")
        logger.info(f"  Size: {file_size_mb:.2f} MB")
        logger.info(f"  Report Name: {report_name}")
        logger.info(f"  Workspace ID: {workspace_id}")

        # Prepare multipart upload
        with open(pbix_path, 'rb') as file:
            files = {'file': (pbix_path.name, file, 'application/octet-stream')}

            # Use import endpoint for PBIX upload
            endpoint = f"groups/{workspace_id}/imports?datasetDisplayName={report_name}&nameConflict=CreateOrOverwrite"

            # Override headers for multipart upload
            upload_headers = {
                "Authorization": f"Bearer {self.access_token}"
            }

            logger.info("Uploading file... (this may take several minutes for large files)")
            response = requests.post(
                f"{POWER_BI_API_BASE}/{endpoint}",
                headers=upload_headers,
                files=files,
                timeout=600  # 10 minute timeout for large files
            )

        if response.status_code not in [200, 202]:
            error_msg = response.json().get('error', {}).get('message', response.text)
            logger.error(f"Upload failed: {error_msg}")

            # Provide specific error guidance
            if "capacity" in error_msg.lower():
                logger.warning("Hint: Workspace may not have sufficient capacity")
            elif "permission" in error_msg.lower():
                logger.warning("Hint: Service principal may lack permissions. Required: Workspace Admin/Member")
            elif "dataset" in error_msg.lower():
                logger.warning("Hint: Dataset may have issues. Check data source configurations")

            raise Exception(f"Publish failed: {error_msg}")

        result = response.json()
        import_id = result.get('id')

        # Poll import status
        logger.info(f"Upload initiated (Import ID: {import_id})")
        logger.info("Waiting for import to complete...")

        status = self._wait_for_import(workspace_id, import_id)

        if status.get('importState') == 'Succeeded':
            logger.info("Report published successfully!")
            reports = status.get('reports', [])
            datasets = status.get('datasets', [])

            if reports:
                report_id = reports[0].get('id')
                report_web_url = f"https://app.powerbi.com/groups/{workspace_id}/reports/{report_id}"
                logger.info(f"  Report ID: {report_id}")
                logger.info(f"  Report Name: {reports[0].get('name')}")
                logger.info(f"  Web URL: {report_web_url}")

            if datasets:
                logger.info(f"  Dataset ID: {datasets[0].get('id')}")

            return status
        else:
            error = status.get('error', {}).get('message', 'Unknown error')
            raise Exception(f"Import failed: {error}")

    def _wait_for_import(self, workspace_id: str, import_id: str, timeout: int = 600) -> Dict:
        """Poll import status until completion"""
        start_time = time.time()
        check_interval = 5

        while time.time() - start_time < timeout:
            response = self._make_request("GET", f"groups/{workspace_id}/imports/{import_id}")

            if response.status_code != 200:
                raise Exception(f"Failed to check import status: {response.text}")

            status = response.json()
            state = status.get('importState')

            if state == 'Succeeded':
                return status
            elif state == 'Failed':
                error = status.get('error', {})
                raise Exception(f"Import failed: {error.get('message', 'Unknown error')}")

            logger.info(f"Import status: {state}... (elapsed: {int(time.time() - start_time)}s)")
            time.sleep(check_interval)

        raise TimeoutError(f"Import timed out after {timeout} seconds")

# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main execution function"""

    parser = argparse.ArgumentParser(
        description="Publish Power BI report to Power BI Service",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    parser.add_argument(
        '--file', '-f',
        required=True,
        help='Path to .pbix file'
    )

    parser.add_argument(
        '--workspace', '-w',
        required=True,
        help='Target workspace name'
    )

    parser.add_argument(
        '--name', '-n',
        required=False,
        help='Report name (defaults to filename)'
    )

    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("Power BI Report Publisher - Starting")
    logger.info("=" * 60)

    try:
        # Step 1: Validate file
        pbix_path = Path(args.file).resolve()
        if not pbix_path.exists():
            raise FileNotFoundError(f"File not found: {pbix_path}")

        # Step 2: Authenticate
        authenticator = PowerBIAuthenticator()
        token = authenticator.authenticate()

        # Step 3: Initialize publisher
        publisher = PowerBIPublisher(token)

        # Step 4: Get workspace ID
        workspace_id = publisher.get_workspace_id(args.workspace)

        # Step 5: Publish report
        result = publisher.publish_report(pbix_path, workspace_id, args.name)

        logger.info("=" * 60)
        logger.info("Publish operation completed successfully!")
        logger.info(f"Log file: {LOG_FILE}")
        logger.info("=" * 60)

        return 0

    except Exception as e:
        logger.error("=" * 60)
        logger.error("Publish operation FAILED")
        logger.error(f"Error: {str(e)}")
        logger.error(f"Log file: {LOG_FILE}")
        logger.error("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
