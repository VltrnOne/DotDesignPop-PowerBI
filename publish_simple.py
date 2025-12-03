#!/usr/bin/env python3
"""
Power BI Publisher - Simple Configuration Wrapper
Edit the configuration below, then run this script.
No command-line parameters needed!
"""

import sys
from pathlib import Path
import subprocess

# ============================================================================
# CONFIGURATION - EDIT THESE VALUES
# ============================================================================

CONFIG = {
    # Path to your .pbix file (use full path)
    "pbix_file": "/path/to/your/report.pbix",

    # Target workspace name (exact name from Power BI Service)
    "workspace_name": "My Workspace",

    # Optional: Custom report name (leave None to use filename)
    "report_name": None,
}

# ============================================================================
# DO NOT EDIT BELOW THIS LINE
# ============================================================================

def main():
    script_dir = Path(__file__).parent
    publisher_script = script_dir / "publish_powerbi_report.py"

    if not publisher_script.exists():
        print("ERROR: publish_powerbi_report.py not found in same directory")
        return 1

    print("Power BI Publisher - Simple Launcher")
    print("=" * 40)
    print(f"File:      {CONFIG['pbix_file']}")
    print(f"Workspace: {CONFIG['workspace_name']}")
    print(f"Report:    {CONFIG['report_name'] or '(auto from filename)'}")
    print()

    # Build command
    cmd = [
        sys.executable,
        str(publisher_script),
        "--file", CONFIG["pbix_file"],
        "--workspace", CONFIG["workspace_name"]
    ]

    if CONFIG["report_name"]:
        cmd.extend(["--name", CONFIG["report_name"]])

    # Execute
    result = subprocess.run(cmd)
    return result.returncode


if __name__ == "__main__":
    sys.exit(main())
