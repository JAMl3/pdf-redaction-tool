const { execSync } = require('child_process');

console.log('Building PDF Redaction Tool for IIS deployment...');

try {
  // Step 1: Clean up any existing build files
  console.log('\n1. Cleaning up previous build files...');
  try {
    execSync('npx rimraf .next out', { stdio: 'inherit' });
  } catch (e) {
    console.log('  Warning: Clean up failed, but continuing build...');
  }
  
  // Step 2: Install dependencies if needed
  console.log('\n2. Checking dependencies...');
  try {
    execSync('npm install --no-audit --no-fund', { stdio: 'inherit' });
  } catch (e) {
    console.log('  Warning: Dependency check failed, but continuing build...');
  }
  
  // Step 3: Temporarily modify next.config.mjs for static export
  console.log('\n3. Preparing configuration...');
  const fs = require('fs');
  const path = require('path');
  
  // Backup the original next.config.mjs
  const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
  const nextConfigBackupPath = path.join(process.cwd(), 'next.config.mjs.bak');
  
  if (fs.existsSync(nextConfigPath)) {
    fs.copyFileSync(nextConfigPath, nextConfigBackupPath);
    console.log('  Created backup of next.config.mjs');
    
    // Read the current config
    let configContent = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Ensure output is set to 'export'
    if (!configContent.includes("output: 'export'")) {
      configContent = configContent.replace(
        /const nextConfig = {/,
        "const nextConfig = {\n  output: 'export',"
      );
      fs.writeFileSync(nextConfigPath, configContent);
      console.log('  Added static export configuration');
    }
  }
  
  // Step 4: Build the application
  console.log('\n4. Building application...');
  try {
    execSync('npx next build', { stdio: 'inherit' });
    console.log('  Build completed successfully!');
  } catch (error) {
    console.error('  Build failed:', error.message);
    throw new Error('Failed to build the application');
  } finally {
    // Restore the original next.config.mjs
    if (fs.existsSync(nextConfigBackupPath)) {
      fs.copyFileSync(nextConfigBackupPath, nextConfigPath);
      fs.unlinkSync(nextConfigBackupPath);
      console.log('  Restored original next.config.mjs');
    }
  }
  
  // Step 5: Copy required files for IIS
  console.log('\n5. Preparing for IIS deployment...');
  try {
    // Make sure we have an 'out' directory
    if (!fs.existsSync('out')) {
      fs.mkdirSync('out', { recursive: true });
    }
    
    // Copy the PDF.js worker file
    const workerSrc = path.join(process.cwd(), 'public', 'pdf.worker.min.js');
    const workerDest = path.join(process.cwd(), 'out', 'pdf.worker.min.js');
    
    if (fs.existsSync(workerSrc)) {
      fs.copyFileSync(workerSrc, workerDest);
      console.log('  Copied PDF.js worker file');
    } else {
      console.log('  Warning: PDF.js worker file not found');
    }
    
    // Copy web.config
    const webConfigSrc = path.join(process.cwd(), 'web.config');
    const webConfigDest = path.join(process.cwd(), 'out', 'web.config');
    
    if (fs.existsSync(webConfigSrc)) {
      fs.copyFileSync(webConfigSrc, webConfigDest);
      console.log('  Copied web.config');
    } else {
      console.log('  Warning: web.config file not found');
    }
  } catch (e) {
    console.log('  Warning: Some files could not be copied, please check manually.');
  }
  
  console.log('\nBuild completed successfully! The "out" directory contains files ready for IIS deployment.');
  console.log('Copy these files to your IIS website directory to deploy the application.');
  
} catch (error) {
  console.error('\nBuild failed with error:', error.message);
  process.exit(1);
}
