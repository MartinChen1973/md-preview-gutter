@echo off
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0publish-md-preview-gutter.ps1"
exit /b %ERRORLEVEL%
