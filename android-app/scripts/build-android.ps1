#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Orca Labs Pharma HRMS — Android Build Script
    Builds the web bundle and syncs it to the Android Capacitor project.

.USAGE
    From android-app/ directory:
      .\scripts\build-android.ps1              # Debug build + sync
      .\scripts\build-android.ps1 -Release     # Release build
      .\scripts\build-android.ps1 -Open        # Open Android Studio after sync

.NOTES
    Requires:
      - Node 20+
      - Java 17 (ANDROID_HOME set)
      - Capacitor CLI installed (npm i in android-app/)
#>

param(
    [switch]$Release,
    [switch]$Open,
    [switch]$Run
)

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot
$WEB_ROOT = Split-Path -Parent $ROOT

Write-Host "`n[1/4] Building web bundle from parent project..." -ForegroundColor Cyan
Set-Location $WEB_ROOT

if ($Release) {
    $env:CAPACITOR_BUILD = "true"
    npm run build
    Remove-Item Env:CAPACITOR_BUILD
} else {
    npm run build
}

Write-Host "`n[2/4] Syncing to Android project..." -ForegroundColor Cyan
Set-Location $ROOT
npx cap sync android

Write-Host "`n[3/4] Sync complete." -ForegroundColor Green

if ($Open) {
    Write-Host "`n[4/4] Opening Android Studio..." -ForegroundColor Cyan
    npx cap open android
}

if ($Run) {
    Write-Host "`n[4/4] Running on connected device/emulator..." -ForegroundColor Cyan
    npx cap run android
}

if (-not $Open -and -not $Run) {
    Write-Host "`n[4/4] Done. Run with -Open to launch Android Studio or -Run to deploy." -ForegroundColor Yellow
}
