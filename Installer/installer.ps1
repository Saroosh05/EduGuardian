# EduGuardian Installer Script
# This script sets up the native messaging host for the EduGuardian Chrome extension

# Get the script's directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Define paths
$nativeHostPath = Join-Path $scriptDir "monitor.exe"
$manifestPath = Join-Path $scriptDir "eduGuardianHost.json"

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Please run this script as Administrator"
    Write-Host "Right-click the script and select 'Run as Administrator'"
    exit 1
}

# Create the native messaging host directory if it doesn't exist
$nativeHostDir = "$env:ProgramFiles\EduGuardian"
if (-not (Test-Path $nativeHostDir)) {
    New-Item -ItemType Directory -Path $nativeHostDir | Out-Null
}

# Copy the native messaging host files
Copy-Item -Path $nativeHostPath -Destination $nativeHostDir -Force
Copy-Item -Path $manifestPath -Destination $nativeHostDir -Force

# Update the manifest with the correct path
$manifestContent = Get-Content -Path $manifestPath -Raw | ConvertFrom-Json
$manifestContent.path = Join-Path $nativeHostDir "monitor.exe"
$manifestContent | ConvertTo-Json | Set-Content -Path (Join-Path $nativeHostDir "eduGuardianHost.json")

# Set proper permissions on the directory and files
$acl = Get-Acl $nativeHostDir
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Everyone", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($accessRule)
Set-Acl -Path $nativeHostDir -AclObject $acl

# Set permissions on the executable
$exePath = Join-Path $nativeHostDir "monitor.exe"
$acl = Get-Acl $exePath
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Everyone", "ReadAndExecute", "Allow")
$acl.SetAccessRule($accessRule)
Set-Acl -Path $exePath -AclObject $acl

# Set permissions on the manifest
$manifestPath = Join-Path $nativeHostDir "eduGuardianHost.json"
$acl = Get-Acl $manifestPath
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule("Everyone", "Read", "Allow")
$acl.SetAccessRule($accessRule)
Set-Acl -Path $manifestPath -AclObject $acl

# Registry paths for both 32-bit and 64-bit Chrome
$registryPaths = @(
    "HKLM:\SOFTWARE\Google\Chrome\NativeMessagingHosts\eduguardianhost",
    "HKLM:\SOFTWARE\WOW6432Node\Google\Chrome\NativeMessagingHosts\eduguardianhost"
)

# Create registry entries
foreach ($path in $registryPaths) {
    if (-not (Test-Path $path)) {
        New-Item -Path $path -Force | Out-Null
    }
    $manifestPath = Join-Path $nativeHostDir "eduGuardianHost.json"
    Set-ItemProperty -Path $path -Name "(Default)" -Value $manifestPath -Force
    
    # Set registry permissions
    $acl = Get-Acl $path
    $accessRule = New-Object System.Security.AccessControl.RegistryAccessRule("Everyone", "ReadKey", "Allow")
    $acl.SetAccessRule($accessRule)
    Set-Acl -Path $path -AclObject $acl
}

# Verify installation
Write-Host "Verifying installation..."
$manifestPath = Join-Path $nativeHostDir "eduGuardianHost.json"
if (Test-Path $manifestPath) {
    Write-Host "Native messaging host manifest found at: $manifestPath"
} else {
    Write-Host "ERROR: Native messaging host manifest not found!"
}

# Verify registry entries
foreach ($path in $registryPaths) {
    $value = Get-ItemProperty -Path $path -Name "(Default)" -ErrorAction SilentlyContinue
    if ($value) {
        Write-Host "Registry entry verified at: $path"
    } else {
        Write-Host "ERROR: Registry entry not found at: $path"
    }
}

Write-Host "EduGuardian installation completed successfully!"
Write-Host "Please restart Chrome for changes to take effect." 