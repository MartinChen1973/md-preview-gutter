$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $root

$envPath = Join-Path $root '.env'
if (-not (Test-Path -LiteralPath $envPath)) {
    throw "Missing .env in the repository root. Copy .env.example to .env and set OVSX_PAT."
}

$pat = $null
Get-Content -LiteralPath $envPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -match '^\s*#' -or $line -eq '') {
        return
    }
    if ($line -match '^\s*(OVSX_PAT|OVSX_TOKEN)\s*=\s*(.*)$') {
        $script:pat = $Matches[2].Trim().Trim([char]34).Trim([char]39)
    }
}

if (-not $pat) {
    throw 'OVSX_PAT (or OVSX_TOKEN) is not set in .env'
}

npx --yes @vscode/vsce@2.26.1 package --allow-missing-repository
if ($LASTEXITCODE -ne 0) {
    throw 'vsce package failed'
}

$vsix = Get-ChildItem -Filter 'md-preview-gutter-*.vsix' |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
if (-not $vsix) {
    throw 'VSIX was not created'
}

$manifest = Get-Content -LiteralPath (Join-Path $root 'package.json') | ConvertFrom-Json
Write-Host "Ensuring Open VSX namespace '$($manifest.publisher)' exists..."
npx --yes ovsx create-namespace $manifest.publisher -p $pat
if ($LASTEXITCODE -ne 0) {
    Write-Host 'create-namespace returned a non-zero exit (namespace may already exist). Continuing to publish.'
}

npx --yes ovsx publish $vsix.FullName -p $pat
if ($LASTEXITCODE -ne 0) {
    throw 'ovsx publish failed. Confirm the Eclipse Publisher Agreement is signed and the namespace matches package.json publisher.'
}

Write-Host "Published $($vsix.Name)"
