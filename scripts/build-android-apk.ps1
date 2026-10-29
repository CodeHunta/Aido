<#
  build-android-apk.ps1
  ---------------------
  Builds the signed Aido Android APK locally on Windows.

  Why a copy to C:\aido-build?
    Two native-toolchain limits make an in-repo build fail:
      1. The monorepo makes Metro treat the repo root as the project root, so the
         entry file cannot be resolved ("./index.js from C:\...\Aido/.").
      2. The pnpm store paths under C:\Users\<you>\Documents\...\node_modules\.pnpm\...
         exceed Windows' 260-char path limit during CMake/ninja compilation.
    Building from a short, standalone copy removes both.

  Usage:
    powershell -ExecutionPolicy Bypass -File scripts\build-android-apk.ps1
    powershell -ExecutionPolicy Bypass -File scripts\build-android-apk.ps1 -ApiUrl https://aido-intellisense.netlify.app/api/v1
#>

param(
  [string]$ApiUrl = "https://aido-intellisense.netlify.app/api/v1",
  [string]$BuildDir = "C:\aido-build",
  [string]$OutDir = "$PSScriptRoot\..\dist"
)

$ErrorActionPreference = "Stop"

$repoRoot   = (Resolve-Path "$PSScriptRoot\..").Path
$mobileDir  = Join-Path $repoRoot "apps\mobile"
$javaHome   = "$env:LOCALAPPDATA\Java\jdk17"
$androidSdk = "$env:LOCALAPPDATA\Android\Sdk"

if (-not (Test-Path $javaHome))   { throw "Java 17 not found at $javaHome" }
if (-not (Test-Path $androidSdk)) { throw "Android SDK not found at $androidSdk" }

$env:JAVA_HOME        = $javaHome
$env:ANDROID_HOME     = $androidSdk
$env:ANDROID_SDK_ROOT = $androidSdk
$env:PATH             = "$javaHome\bin;$env:PATH"
$env:EXPO_PUBLIC_API_URL = $ApiUrl
$env:EXPO_NO_TELEMETRY   = "1"
$env:CI                  = "1"

Write-Host "==> Preparing standalone build copy at $BuildDir" -ForegroundColor Cyan
if (Test-Path $BuildDir) { Remove-Item $BuildDir -Recurse -Force }
New-Item -ItemType Directory -Path $BuildDir | Out-Null
robocopy $mobileDir $BuildDir /E /XD node_modules android ios .expo /NFL /NDL /NJH /NJS /R:1 /W:1 | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed with code $LASTEXITCODE" }

# --- Standalone overrides -----------------------------------------------------
# 1. Metro: this folder is the project root; no workspace to walk up into.
@'
const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
config.projectRoot = __dirname;
config.watchFolders = [__dirname];
module.exports = config;
'@ | Set-Content -LiteralPath "$BuildDir\metro.config.js" -Encoding UTF8

# 2. TypeScript: the repo tsconfig extends ../../tsconfig.base.json, which does
#    not exist in the standalone copy and makes Metro's config load throw.
@'
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": { "jsx": "react-native", "esModuleInterop": true, "allowJs": true },
  "include": ["./*.ts", "./*.tsx", "./app/**/*", "./lib/**/*"]
}
'@ | Set-Content -LiteralPath "$BuildDir\tsconfig.json" -Encoding UTF8

# 3. package.json: drop monorepo-only bits (scope name, sharp) so npm installs flat.
$pkg = Get-Content "$BuildDir\package.json" -Raw | ConvertFrom-Json
$pkg.name = "aido-mobile-build"
if ($pkg.devDependencies -and $pkg.devDependencies.PSObject.Properties.Name -contains "sharp") {
  $pkg.devDependencies.PSObject.Properties.Remove("sharp")
}
if ($pkg.devDependencies -and $pkg.devDependencies.PSObject.Properties.Name -contains "@types/node") {
  $pkg.devDependencies.PSObject.Properties.Remove("@types/node")
}
$pkg | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath "$BuildDir\package.json" -Encoding UTF8

# 4. Keep the app live-backend regardless of build machine.
$appJsonPath = "$BuildDir\app.json"
$appJson = Get-Content $appJsonPath -Raw | ConvertFrom-Json
$appJson.expo.extra | Add-Member -NotePropertyName apiUrl -NotePropertyValue $ApiUrl -Force
$appJson | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $appJsonPath -Encoding UTF8

Write-Host "==> Installing dependencies (flat node_modules)" -ForegroundColor Cyan
Push-Location $BuildDir
try {
  npm install --no-audit --no-fund --loglevel=error
  if ($LASTEXITCODE -ne 0) { throw "npm install failed" }

  Write-Host "==> Generating native project" -ForegroundColor Cyan
  npx expo prebuild --platform android --clean --no-install
  if ($LASTEXITCODE -ne 0) { throw "expo prebuild failed" }

  Write-Host "==> Compiling release APK (this takes 10-20 min)" -ForegroundColor Cyan
  Push-Location "$BuildDir\android"
  try {
    .\gradlew.bat assembleRelease --console=plain --no-daemon
    if ($LASTEXITCODE -ne 0) { throw "gradle assembleRelease failed" }
  } finally { Pop-Location }
} finally { Pop-Location }

$apk = "$BuildDir\android\app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $apk)) { throw "APK was not produced at $apk" }

Write-Host "==> Verifying APK" -ForegroundColor Cyan
$buildTools = Get-ChildItem "$androidSdk\build-tools" -Directory |
  Sort-Object { [version]$_.Name } -Descending | Select-Object -First 1
& "$($buildTools.FullName)\apksigner.bat" verify --print-certs $apk
if ($LASTEXITCODE -ne 0) { throw "APK signature verification failed" }
& "$($buildTools.FullName)\aapt.exe" dump badging $apk |
  Select-String "^package:|sdkVersion|launchable-activity|native-code"

# A release APK must contain the Hermes bundle, otherwise the app opens blank.
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($apk)
try {
  $bundle = $zip.Entries | Where-Object { $_.FullName -eq "assets/index.android.bundle" }
  if (-not $bundle) { throw "APK has no assets/index.android.bundle - it would show a blank screen" }
  Write-Host ("    bundled JS: {0:N0} bytes" -f $bundle.Length)
} finally { $zip.Dispose() }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$target = Join-Path $OutDir "aido-v0.3.3.apk"
Copy-Item $apk $target -Force

$hash = (Get-FileHash $target -Algorithm SHA256).Hash
Write-Host ""
Write-Host "APK:    $target" -ForegroundColor Green
Write-Host "Size:   $([math]::Round((Get-Item $target).Length / 1MB, 1)) MB"
Write-Host "SHA256: $hash" -ForegroundColor Green
