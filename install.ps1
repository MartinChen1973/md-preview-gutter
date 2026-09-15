$ErrorActionPreference = 'Stop'

$source = $PSScriptRoot
$package = Get-Content (Join-Path $source 'package.json') | ConvertFrom-Json
$destinationRoot = Join-Path $env:USERPROFILE '.cursor\extensions'
$folderName = '{0}.{1}-{2}' -f $package.publisher, $package.name, $package.version
$destinations = @(
    Join-Path $destinationRoot $folderName
    Join-Path $destinationRoot ('{0}.{1}-0.1.1' -f $package.publisher, $package.name)
    Join-Path $destinationRoot ('{0}.{1}-0.1.2' -f $package.publisher, $package.name)
)

New-Item -ItemType Directory -Force -Path $destinationRoot | Out-Null

function Install-ToFolder([string]$destination) {
    if (Test-Path $destination) {
        Remove-Item -Recurse -Force $destination
    }
    Copy-Item -Path $source -Destination $destination -Recurse -Force
    Get-ChildItem -Path $destination -Recurse -Directory -Filter '.git' -ErrorAction SilentlyContinue |
        Remove-Item -Recurse -Force
}

foreach ($destination in $destinations) {
    Install-ToFolder $destination
    Write-Host "Installed to $destination"
}

Write-Host 'Reload Cursor (Developer: Reload Window), then close and reopen the .md tab.'
