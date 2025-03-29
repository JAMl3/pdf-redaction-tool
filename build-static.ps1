# PDF Redaction Tool - Static Build Script
# This is a simplified build script that avoids interactive prompts

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$text)
    Write-Host "`n>> $text" -ForegroundColor Yellow
}

Write-Host "=== PDFRedact Simple Static Export ===" -ForegroundColor Cyan

try {
    # Clean output directories
    Write-Step "Cleaning output directories..."
    
    if (Test-Path ".next") {
        Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Cleaned .next directory" -ForegroundColor Green
    }
    
    if (Test-Path "out") {
        Remove-Item -Path "out" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  Cleaned out directory" -ForegroundColor Green
    }

    # Update next.config.js to enable static export
    Write-Step "Setting up Next.js for static export..."
    @"
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { 
    unoptimized: true 
  }
}

export default nextConfig;
"@ | Set-Content -Path "next.config.js" -Force
    Write-Host "  Updated next.config.js for static export" -ForegroundColor Green

    # Build the app
    Write-Step "Building Next.js app..."
    & npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed with exit code $LASTEXITCODE"
    }
    
    # Copy PDF.js worker files
    Write-Step "Copying PDF.js worker files..."
    
    # Copy PDF.js worker file
    if (Test-Path "public/pdf.worker.min.js") {
        if (-not (Test-Path "out")) {
            New-Item -Path "out" -ItemType Directory | Out-Null
        }
        Copy-Item -Path "public/pdf.worker.min.js" -Destination "out/pdf.worker.min.js" -Force
        Write-Host "  Copied pdf.worker.min.js" -ForegroundColor Green
    }
    else {
        Write-Host "  Warning: pdf.worker.min.js not found" -ForegroundColor Yellow
    }
    
    # Copy CMap files
    if (Test-Path "public/cmaps") {
        if (-not (Test-Path "out/cmaps")) {
            New-Item -Path "out/cmaps" -ItemType Directory -Force | Out-Null
        }
        
        $cmapFiles = Get-ChildItem -Path "public/cmaps" -File
        foreach ($file in $cmapFiles) {
            Copy-Item -Path $file.FullName -Destination "out/cmaps/$($file.Name)" -Force
        }
        Write-Host "  Copied $($cmapFiles.Count) CMap files" -ForegroundColor Green
    }
    else {
        Write-Host "  Warning: cmaps directory not found" -ForegroundColor Yellow
    }

    # Success message
    Write-Host "`n=== Export Completed Successfully ===" -ForegroundColor Green
    Write-Host "The 'out' directory contains all files needed for IIS deployment." -ForegroundColor White
    Write-Host "`nTo deploy:" -ForegroundColor White
    Write-Host "1. Copy all files from the 'out' directory to your IIS website folder" -ForegroundColor White
    Write-Host "2. Configure your IIS application pool to use 'No Managed Code'" -ForegroundColor White
    Write-Host "3. Ensure the URL Rewrite module is installed on your IIS server" -ForegroundColor White
}
catch {
    Write-Host "`nExport failed: $_" -ForegroundColor Red
    exit 1
} 