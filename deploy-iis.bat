@echo off
echo === PDF Redaction Tool - IIS Deployment ===

echo.
echo 1. Installing dependencies...
call npm install

echo.
echo 2. Building application for production...
call npm run build

echo.
echo 3. Copying PDF.js worker files to output...
if not exist "out\pdf.worker.min.js" (
  copy "public\pdf.worker.min.js" "out\"
  echo Copied pdf.worker.min.js
)

echo.
echo 4. Copying web.config to output...
copy "web.config" "out\"
echo Copied web.config

echo.
echo Build completed! The 'out' directory is ready for IIS deployment.
echo.
echo Deployment instructions:
echo 1. Copy all contents of the 'out' directory to your IIS website folder
echo 2. Configure IIS application pool to use .NET CLR version: "No Managed Code"
echo 3. Ensure URL Rewrite module is installed on your IIS server
echo 4. Ensure your website has proper permissions set
echo.
echo Visit http://your-server/your-site to access the PDF Redaction Tool
pause 