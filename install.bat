@echo off
echo EduGuardian Installation
echo ======================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running as administrator...
) else (
    echo Please run this installer as Administrator.
    echo Right-click and select "Run as Administrator"
    pause
    exit /b 1
)

echo Installing Native Messaging Host...
powershell -ExecutionPolicy Bypass -File "%~dp0Installer\installer.ps1"

echo.
echo Verifying registry entries...
reg query "HKLM\SOFTWARE\Google\Chrome\NativeMessagingHosts\eduguardianhost" >nul 2>&1
if %errorLevel% == 0 (
    echo Registry entry for 64-bit Chrome found.
) else (
    echo ERROR: Registry entry for 64-bit Chrome not found!
)

reg query "HKLM\SOFTWARE\WOW6432Node\Google\Chrome\NativeMessagingHosts\eduguardianhost" >nul 2>&1
if %errorLevel% == 0 (
    echo Registry entry for 32-bit Chrome found.
) else (
    echo ERROR: Registry entry for 32-bit Chrome not found!
)

echo Installation complete! You can now use EduGuardian.
echo.
pause 