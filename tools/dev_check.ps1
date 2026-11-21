[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $repoRoot

$venvPython = Join-Path $repoRoot ".venv\Scripts\python.exe"
if (Test-Path -LiteralPath $venvPython) {
    $pythonExe = $venvPython
} else {
    $pythonExe = (Get-Command python -ErrorAction Stop).Source
}

$env:PYTHONUTF8 = "1"
$env:PYTHONIOENCODING = "utf-8"

function Invoke-PythonStep {
    param(
        [Parameter(Mandatory)]
        [string]$Label,
        [Parameter(Mandatory)]
        [string[]]$Arguments
    )

    Write-Host "==> $Label"
    & $script:pythonExe @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Label failed with exit code $LASTEXITCODE"
    }
}

# tools/check_links.py needs the pinned Markdown parser; pip leaves satisfied
# requirements alone, so this is a no-op once the environment is current.
Invoke-PythonStep -Label "Install dev requirements" -Arguments @(
    "-m", "pip", "install", "--quiet", "--disable-pip-version-check",
    "-r", "requirements-dev.txt"
)

Invoke-PythonStep -Label "Compile fork Python" -Arguments @(
    "-m", "compileall", "-q", "tools", "tests"
)
Invoke-PythonStep -Label "Ruff (E9 + F)" -Arguments @(
    "-m", "ruff", "check", "--select", "E9,F", "tools", "tests"
)
Invoke-PythonStep -Label "Pytest" -Arguments @("-m", "pytest", "tests", "-q")
Invoke-PythonStep -Label "Check fork Markdown links" -Arguments @(
    "tools\check_links.py"
)

Write-Host "WINDOWS DEV CHECK GREEN"
