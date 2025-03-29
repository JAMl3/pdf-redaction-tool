# PDF Redaction Tool - IIS Deployment Script
# Run this script as Administrator for best results

# Set error action preference
$ErrorActionPreference = "Stop"

function Write-Header {
  param([string]$text)
  Write-Host "`n==============================================" -ForegroundColor Cyan
  Write-Host $text -ForegroundColor Cyan
  Write-Host "==============================================" -ForegroundColor Cyan
}

function Write-Step {
  param([string]$text)
  Write-Host "`n>> $text" -ForegroundColor Yellow
}

function Check-Command {
  param([string]$name)
  if (Get-Command $name -ErrorAction SilentlyContinue) {
    return $true
  }
  return $false
}

# Start the deployment process
Write-Header "PDF Redaction Tool - IIS Deployment"

try {
  # Check dependencies
  Write-Step "Checking dependencies..."
  if (-not (Check-Command "npm")) {
    throw "Node.js and npm are required. Please install them first."
  }

  # Create output directory if it doesn't exist
  $outDir = Join-Path $PSScriptRoot "out"
  if (-not (Test-Path $outDir)) {
    New-Item -Path $outDir -ItemType Directory | Out-Null
  }

  # Install dependencies
  Write-Step "Installing dependencies..."
  npm install
  if ($LASTEXITCODE -ne 0) {
    throw "Failed to install dependencies."
  }

  # Create a static export build
  Write-Step "Creating optimized static build..."
    
  # Check if we need to clean up first to avoid permission issues
  if (Test-Path (Join-Path $PSScriptRoot ".next")) {
    Write-Host "  Cleaning .next directory to avoid permission issues..." -ForegroundColor Gray
    Remove-Item -Path (Join-Path $PSScriptRoot ".next") -Recurse -Force -ErrorAction SilentlyContinue
  }
    
  # Run the build command
  npm run build
  if ($LASTEXITCODE -ne 0) {
    # If running into permission issues, try alternate approach
    Write-Host "  Initial build failed. Trying alternative approach..." -ForegroundColor Yellow
        
    # Create a simple export script
    $exportScript = @"
const { execSync } = require('child_process');
try {
  console.log('Building Next.js application...');
  execSync('npx next build && npx next export -o out', { stdio: 'inherit' });
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}
"@
        
    Set-Content -Path "export-script.cjs" -Value $exportScript
        
    # Run the custom export script
    Write-Host "  Running custom export script..." -ForegroundColor Gray
    node export-script.cjs
        
    if ($LASTEXITCODE -ne 0) {
      throw "Failed to build the application using alternative method."
    }
  }

  # Copy PDF.js worker to output 
  Write-Step "Copying PDF.js worker files..."
  $workerSource = Join-Path $PSScriptRoot "public" "pdf.worker.min.js"
  $workerDest = Join-Path $outDir "pdf.worker.min.js"
    
  if (Test-Path $workerSource) {
    Copy-Item -Path $workerSource -Destination $workerDest -Force
    Write-Host "  Copied pdf.worker.min.js" -ForegroundColor Green
  }
  else {
    Write-Host "  Warning: pdf.worker.min.js not found in public directory." -ForegroundColor Red
  }

  # Copy web.config to output
  Write-Step "Copying web.config file..."
  $webConfigSource = Join-Path $PSScriptRoot "web.config"
  $webConfigDest = Join-Path $outDir "web.config"
    
  if (Test-Path $webConfigSource) {
    Copy-Item -Path $webConfigSource -Destination $webConfigDest -Force
    Write-Host "  Copied web.config" -ForegroundColor Green
  }
  else {
    Write-Host "  Warning: web.config not found. Creating default one..." -ForegroundColor Yellow
        
    # Create a basic web.config for IIS
    $webConfig = @"
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <staticContent>
      <remove fileExtension=".json" />
      <mimeMap fileExtension=".json" mimeType="application/json" />
      <remove fileExtension=".js" />
      <mimeMap fileExtension=".js" mimeType="application/javascript" />
    </staticContent>
    <rewrite>
      <rules>
        <rule name="PDFWorker" stopProcessing="true">
          <match url="^pdf.worker.min.js$" />
          <action type="Rewrite" url="pdf.worker.min.js" />
        </rule>
        <rule name="FallbackToIndex" stopProcessing="true">
          <match url=".*" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="/" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
"@
    Set-Content -Path $webConfigDest -Value $webConfig
    Write-Host "  Created default web.config" -ForegroundColor Green
  }

  # Deployment complete!
  Write-Header "Deployment Preparation Complete!"
  Write-Host "`nThe application has been built and prepared for IIS deployment." -ForegroundColor Green
  Write-Host "`nIIS Deployment Instructions:" -ForegroundColor White
  Write-Host "1. Copy all files from the 'out' directory to your IIS website folder" -ForegroundColor White
  Write-Host "2. Configure your IIS application pool to use 'No Managed Code'" -ForegroundColor White
  Write-Host "3. Ensure the URL Rewrite module is installed on your IIS server" -ForegroundColor White
  Write-Host "4. Make sure the website's application pool has proper permissions" -ForegroundColor White
  Write-Host "`nFor detailed instructions, refer to the README.md file." -ForegroundColor White
}
catch {
  Write-Host "`nError during deployment: $_" -ForegroundColor Red
  Write-Host "Deployment failed. Please check the error messages above." -ForegroundColor Red
  exit 1
}

# Ask user if they want to open the output directory
$response = Read-Host "`nDo you want to open the output directory? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
  Invoke-Item $outDir
} 