#!/usr/bin/env node

/**
 * Static Build Script for IIS Deployment
 * 
 * This script builds the Next.js application for static deployment on IIS.
 * Run with: node static-build.cjs
 */

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Helper function to run a command
function runCommand(command, args, options = {}) {
  console.log(`> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { 
    stdio: 'inherit', 
    shell: true,
    ...options 
  });
  if (result.status !== 0) {
    console.error(`Command failed with exit code ${result.status}`);
    process.exit(result.status);
  }
  return result;
}

// Helper function to copy a file
function copyFile(src, dest) {
  try {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${path.basename(src)} to ${dest}`);
  } catch (error) {
    console.error(`Failed to copy ${src} to ${dest}:`, error.message);
  }
}

// Start the build process
console.log('=== PDFRedact Static Build for IIS ===');

// 1. Clean previous builds
console.log('\n1. Cleaning previous builds...');
try {
  if (fs.existsSync('.next')) {
    fs.rmSync('.next', { recursive: true, force: true });
  }
  if (fs.existsSync('out')) {
    fs.rmSync('out', { recursive: true, force: true });
  }
} catch (error) {
  console.warn('  Warning: Could not clean directories:', error.message);
}

// 2. Install dependencies
console.log('\n2. Installing dependencies...');
runCommand('npm', ['install', '--no-audit', '--no-fund']);

// 3. Build the application
console.log('\n3. Building for static export...');
runCommand('npx', ['next', 'build']);

// 4. Copy necessary files
console.log('\n4. Copying required files...');

// Ensure the out directory exists
if (!fs.existsSync('out')) {
  console.log('  Creating out directory...');
  fs.mkdirSync('out', { recursive: true });
}

// Copy the PDF.js worker file
if (fs.existsSync('public/pdf.worker.min.js')) {
  copyFile('public/pdf.worker.min.js', 'out/pdf.worker.min.js');
}

// Copy web.config
if (fs.existsSync('web.config')) {
  copyFile('web.config', 'out/web.config');
} else {
  console.warn('  Warning: web.config not found, IIS may not serve the app correctly');
}

console.log('\nBuild completed! The "out" directory contains all files needed for IIS.');
console.log('To deploy:');
console.log('1. Copy all files from the "out" directory to your IIS website folder');
console.log('2. Configure IIS application pool to use "No Managed Code"');
console.log('3. Make sure the URL Rewrite module is installed on IIS');

// Remove the interactive prompt
// console.log('\nPress any key to exit...');
// process.stdin.setRawMode(true);
// process.stdin.resume();
// process.stdin.on('data', () => process.exit(0)); 