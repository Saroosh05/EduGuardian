# EduGuardian Uninstaller Script
# This script removes the native messaging host for the EduGuardian Chrome extension

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Please run this script as Administrator"
    Write-Host "Right-click the script and select 'Run as Administrator'"
    exit 1
}

# Define paths
$nativeHostDir = "$env:ProgramFiles\EduGuardian"

# Registry paths for both 32-bit and 64-bit Chrome
$registryPaths = @(
    "HKLM:\SOFTWARE\Google\Chrome\NativeMessagingHosts\eduguardianhost",
    "HKLM:\SOFTWARE\WOW6432Node\Google\Chrome\NativeMessagingHosts\eduguardianhost"
)

# Remove registry entries
foreach ($path in $registryPaths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Force
    }
}

# Remove the native messaging host directory
if (Test-Path $nativeHostDir) {
    Remove-Item -Path $nativeHostDir -Recurse -Force
}

Write-Host "EduGuardian uninstallation completed successfully!" 