param(
  [Parameter(Mandatory = $true, Position = 0)]
  [string]$Message,

  [string]$Remote = "origin",

  [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

function Invoke-Git {
  param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
  )

  & git @Args
  if ($LASTEXITCODE -ne 0) {
    throw "git $($Args -join ' ') failed with exit code $LASTEXITCODE."
  }
}

try {
  $repoRoot = (& git rev-parse --show-toplevel 2>$null).Trim()
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repoRoot)) {
    throw "This folder is not a git repository."
  }

  $status = (& git status --porcelain).Trim()
  if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes to commit."
    exit 0
  }

  $currentBranch = (& git branch --show-current).Trim()
  if (-not [string]::IsNullOrWhiteSpace($currentBranch)) {
    $Branch = $currentBranch
  }

  Invoke-Git add -A
  Invoke-Git commit -m $Message
  Invoke-Git push -u $Remote $Branch

  Write-Host "Pushed to $Remote/$Branch"
}
catch {
  Write-Error $_
  exit 1
}
