#!/usr/bin/env python3
"""
Power BI Setup Validator
Tests that all prerequisites are met for Power BI publishing automation.
"""

import os
import sys
from typing import List, Tuple

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def check_python_version() -> Tuple[bool, str]:
    """Check Python version"""
    version = sys.version_info
    if version.major == 3 and version.minor >= 8:
        return True, f"Python {version.major}.{version.minor}.{version.micro}"
    return False, f"Python {version.major}.{version.minor}.{version.micro} (requires 3.8+)"

def check_package(package_name: str) -> Tuple[bool, str]:
    """Check if Python package is installed"""
    try:
        __import__(package_name)
        module = sys.modules[package_name]
        version = getattr(module, '__version__', 'unknown version')
        return True, f"{package_name} ({version})"
    except ImportError:
        return False, f"{package_name} not installed"

def check_env_var(var_name: str) -> Tuple[bool, str]:
    """Check if environment variable is set"""
    value = os.getenv(var_name)
    if value:
        # Mask sensitive values
        if 'SECRET' in var_name.upper() or 'PASSWORD' in var_name.upper():
            display = value[:4] + '*' * (len(value) - 4) if len(value) > 4 else '***'
        else:
            display = value[:20] + '...' if len(value) > 20 else value
        return True, f"{var_name} = {display}"
    return False, f"{var_name} not set"

def check_file_exists(file_path: str) -> Tuple[bool, str]:
    """Check if file exists"""
    from pathlib import Path
    path = Path(file_path)
    if path.exists():
        size = path.stat().st_size
        size_mb = size / (1024 * 1024)
        return True, f"{file_path} ({size_mb:.2f} MB)"
    return False, f"{file_path} not found"

def print_result(check_name: str, passed: bool, message: str):
    """Print check result with color"""
    status = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL{RESET}"
    print(f"  [{status}] {check_name}: {message}")

def print_section(title: str):
    """Print section header"""
    print(f"\n{YELLOW}{'=' * 60}{RESET}")
    print(f"{YELLOW}{title}{RESET}")
    print(f"{YELLOW}{'=' * 60}{RESET}")

def main():
    """Run all validation checks"""
    print(f"\n{GREEN}Power BI Publisher - Setup Validator{RESET}")
    print(f"{GREEN}{'=' * 60}{RESET}\n")

    all_checks = []

    # Python Environment
    print_section("Python Environment")
    checks = [
        ("Python Version", check_python_version()),
        ("requests package", check_package('requests')),
        ("msal package", check_package('msal')),
    ]

    for name, result in checks:
        passed, message = result
        print_result(name, passed, message)
        all_checks.append(passed)

    # Environment Variables (Service Principal)
    print_section("Environment Variables (for Service Principal auth)")
    env_checks = [
        ("Client ID", check_env_var('PBI_CLIENT_ID')),
        ("Client Secret", check_env_var('PBI_CLIENT_SECRET')),
        ("Tenant ID", check_env_var('PBI_TENANT_ID')),
    ]

    for name, result in env_checks:
        passed, message = result
        print_result(name, passed, message)
        # Don't fail overall if env vars not set (might use interactive auth)

    # Script Files
    print_section("Required Scripts")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    script_checks = [
        ("Python Publisher", check_file_exists(os.path.join(script_dir, 'publish_powerbi_report.py'))),
        ("PowerShell Publisher", check_file_exists(os.path.join(script_dir, 'Publish-PowerBIReport.ps1'))),
        ("Setup Guide", check_file_exists(os.path.join(script_dir, 'POWERBI_PUBLISHER_GUIDE.md'))),
    ]

    for name, result in script_checks:
        passed, message = result
        print_result(name, passed, message)
        all_checks.append(passed)

    # Test Authentication (if credentials present)
    if all(check_env_var(var)[0] for var in ['PBI_CLIENT_ID', 'PBI_CLIENT_SECRET', 'PBI_TENANT_ID']):
        print_section("Authentication Test")
        try:
            from msal import ConfidentialClientApplication

            client_id = os.getenv('PBI_CLIENT_ID')
            client_secret = os.getenv('PBI_CLIENT_SECRET')
            tenant_id = os.getenv('PBI_TENANT_ID')

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
                print_result("Azure AD Authentication", True, "Successfully acquired token")
                all_checks.append(True)

                # Test Power BI API
                import requests
                response = requests.get(
                    "https://api.powerbi.com/v1.0/myorg/groups",
                    headers={"Authorization": f"Bearer {result['access_token']}"}
                )

                if response.status_code == 200:
                    workspaces = response.json().get('value', [])
                    print_result("Power BI API Access", True, f"Found {len(workspaces)} workspace(s)")
                    if workspaces:
                        print(f"\n{YELLOW}Available Workspaces:{RESET}")
                        for ws in workspaces[:5]:  # Show first 5
                            print(f"    - {ws['name']}")
                        if len(workspaces) > 5:
                            print(f"    ... and {len(workspaces) - 5} more")
                    all_checks.append(True)
                else:
                    print_result("Power BI API Access", False, f"HTTP {response.status_code}: {response.text[:100]}")
                    all_checks.append(False)
            else:
                error = result.get('error_description', result.get('error', 'Unknown error'))
                print_result("Azure AD Authentication", False, error)
                all_checks.append(False)

        except Exception as e:
            print_result("Authentication Test", False, str(e))
            all_checks.append(False)

    # Summary
    print_section("Summary")
    passed_count = sum(all_checks)
    total_count = len(all_checks)
    pass_rate = (passed_count / total_count * 100) if total_count > 0 else 0

    if passed_count == total_count:
        print(f"\n{GREEN}All checks passed! ({passed_count}/{total_count}){RESET}")
        print(f"{GREEN}You're ready to publish Power BI reports.{RESET}\n")
        return 0
    else:
        print(f"\n{YELLOW}{passed_count}/{total_count} checks passed ({pass_rate:.0f}%){RESET}")
        print(f"{YELLOW}Review failed checks above and consult POWERBI_PUBLISHER_GUIDE.md{RESET}\n")
        return 1

if __name__ == "__main__":
    sys.exit(main())
