// Simple export script that won't get stuck
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== PDFRedact Simple Static Export ===');

try {
  // Clean out directory if it exists
  console.log('\n1. Cleaning output directory...');
  if (fs.existsSync('out')) {
    fs.rmSync('out', { recursive: true, force: true });
  }

  // Run Next.js build
  console.log('\n2. Building Next.js app...');
  execSync('npx next build', { stdio: 'inherit' });
  
  console.log('\n3. Copying PDF.js worker files...');
  // Copy PDF.js worker file if it exists
  if (fs.existsSync('public/pdf.worker.min.js')) {
    fs.copyFileSync('public/pdf.worker.min.js', 'out/pdf.worker.min.js');
    console.log('  Copied pdf.worker.min.js');
  }
  
  // Copy cmaps if they exist
  if (fs.existsSync('public/cmaps')) {
    const cmapFiles = fs.readdirSync('public/cmaps');
    
    if (!fs.existsSync('out/cmaps')) {
      fs.mkdirSync('out/cmaps', { recursive: true });
    }
    
    for (const file of cmapFiles) {
      fs.copyFileSync(`public/cmaps/${file}`, `out/cmaps/${file}`);
    }
    console.log(`  Copied ${cmapFiles.length} CMap files`);
  }

  console.log('\n=== Export Completed Successfully ===');
  console.log('The "out" directory contains all files needed for IIS deployment.');
  console.log('To deploy:');
  console.log('1. Copy all files from the "out" directory to your IIS website folder');
  console.log('2. Configure your IIS application pool to use "No Managed Code"');
  console.log('3. Ensure the URL Rewrite module is installed on your IIS server');

} catch (error) {
  console.error('\nExport failed:', error.message);
  process.exit(1);
} 