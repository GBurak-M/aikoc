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
$content = @"
GEMINI_API_KEY=$ApiKey
"@
Set-Content -Path $envPath -Value $content -Encoding utf8
Write-Host "OK: .env.local oluşturuldu"

foreach ($envName in @('production', 'preview', 'development')) {
  npx vercel env add GEMINI_API_KEY $envName --value $ApiKey --yes --sensitive 2>$null
  if ($LASTEXITCODE -ne 0) {
    npx vercel env add GEMINI_API_KEY $envName --value $ApiKey --yes --force --sensitive
  }
  Write-Host "OK: Vercel $envName ortamına GEMINI_API_KEY eklendi"
}

Write-Host "Yeniden deploy ediliyor..."
npx vercel --prod --yes
Write-Host "Tamam. https://aikoc.vercel.app adresini test edin."
