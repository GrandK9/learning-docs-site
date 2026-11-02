param(
  [Parameter(Mandatory = $true)]
  [int] $Port,
  [int] $TimeoutSec = 120
)

$url = "http://127.0.0.1:$Port/"
$deadline = (Get-Date).AddSeconds($TimeoutSec)

while ((Get-Date) -lt $deadline) {
  try {
    $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
    if ($resp.StatusCode -eq 200 -and $resp.Content -match 'id="app"') {
      Start-Sleep -Seconds 2
      Start-Process $url
      exit 0
    }
  } catch {
    # dev server still starting or optimizing deps
  }
  Start-Sleep -Milliseconds 500
}

Start-Process $url
exit 1
