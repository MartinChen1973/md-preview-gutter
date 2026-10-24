$ErrorActionPreference = 'Stop'
$package = Get-Content (Join-Path $PSScriptRoot 'package.json') | ConvertFrom-Json
$vsix = Join-Path $PSScriptRoot ('{0}-{1}.vsix' -f $package.name, $package.version)
if (-not (Test-Path $vsix)) {
    Write-Error "Missing $vsix. Run: npx --yes @vscode/vsce@2.26.1 package --allow-missing-repository"
}

if ($env:OVSX_PAT) {
    npx --yes ovsx publish $vsix -p $env:OVSX_PAT
    exit $LASTEXITCODE
}

if ($env:VSCE_PAT) {
    npx --yes @vscode/vsce@2.26.1 publish --packagePath $vsix -p $env:VSCE_PAT
    exit $LASTEXITCODE
}

Write-Host 'Set OVSX_PAT (Open VSX / Cursor) or VSCE_PAT (VS Code Marketplace), then run this script again.'
Write-Host 'Do not commit or chat the token.'
exit 1
