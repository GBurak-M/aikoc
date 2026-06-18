param(
  [Parameter(Mandatory = $true)]
  [string]$ApiKey
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

if (-not $ApiKey.Trim()) {
  throw 'API anahtarı boş olamaz.'
}

$envPath = Join-Path $root '.env.local'
$existing = @()
if (Test-Path $envPath) {
  $existing = Get-Content $envPath | Where-Object { $_ -notmatch '^\s*GROQ_API_KEY=' }
}
$lines = @($existing) + "GROQ_API_KEY=$ApiKey"
Set-Content -Path $envPath -Value ($lines -join "`n") -Encoding utf8
Write-Host 'OK: .env.local güncellendi'

foreach ($envName in @('production', 'preview', 'development')) {
  npx vercel env add GROQ_API_KEY $envName --value $ApiKey --yes --sensitive 2>$null
  if ($LASTEXITCODE -ne 0) {
    npx vercel env add GROQ_API_KEY $envName --value $ApiKey --yes --force --sensitive
  }
  Write-Host "OK: Vercel $envName ortamına GROQ_API_KEY eklendi"
}

Write-Host 'Yeniden deploy ediliyor...'
npx vercel deploy --prod --skip-domain --yes
Write-Host 'Tamam. https://rotaai.vercel.app/api/groq ve AI sekmelerini test edin.'
