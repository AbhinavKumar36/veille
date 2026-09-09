"""
VEILLE — Secure Codebase Packaging Script
Creates sanitized zip archive excluding secret .env files, coverage caches, and pycache.
"""

import os
import zipfile

EXCLUDE_DIRS = {
    ".git", "__pycache__", ".pytest_cache", "node_modules", "dist", "build", ".devcontainer"
}
EXCLUDE_FILES = {
    ".env", ".env.local", ".env.production", ".coverage", "celerybeat-schedule.db"
}

def package_codebase():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    source_dir = os.path.join(base_dir, "CRIMENET_Codebase")
    output_zip = os.path.join(base_dir, "CRIMENET_Codebase.zip")

    print(f"[*] Packaging sanitized codebase from: {source_dir}")
    count = 0

    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for file in files:
                if file in EXCLUDE_FILES or file.endswith(".pyc") or file.endswith(".log"):
                    continue
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, source_dir)
                zipf.write(file_path, arcname)
                count += 1

    size_mb = round(os.path.getsize(output_zip) / (1024 * 1024), 2)
    print(f"[+] Successfully packaged {count} sanitized files into: {output_zip} ({size_mb} MB)")


if __name__ == "__main__":
    package_codebase()
