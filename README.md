# EduGuardian - Anti-Cheating Exam System (Extension)

## Installation Instructions

### 1. Extract Files
- Extract all files from the EduGuardian package to a folder on your computer.

### 2. Install the Chrome Extension
- Open Chrome and navigate to `chrome://extensions/`
- Enable **Developer mode** (toggle in the top right).
- Click **Load unpacked** and select the **extension** folder.
- Copy the **ID** shown under the extension name.
- Open `Eduguardian_Package\Installer\eduGuardianhost.json`.
- Paste the copied ID into the fields `"allowed_origins"` and `"allowed_extensions"`.

### 3. Run the Installer
- Right-click on `install.bat`.
- Select **Run as Administrator**.
- If a security warning appears, click **Run anyway**.
- Wait for the installation process to complete.
- After installation, EduGuardian will be ready for use.

## Uninstallation Instructions

- Right-click on `uninstaller.ps1`.
- Select **Run as Administrator**.
- Wait for the uninstallation process to complete.

## Requirements

- Windows 10 or later
- Google Chrome browser
- Administrator privileges for installation

---

> **Note:**  
> The Chrome extension will only work after running the installer with Administrator privileges.
