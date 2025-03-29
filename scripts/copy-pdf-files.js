// Script to copy PDF.js worker and CMap files from node_modules to public directory
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ES module equivalent of require
const require = createRequire(import.meta.url);
const packageJson = require('../package.json');

// Get the PDF.js version from package.json
const pdfjsVersion = packageJson.dependencies['pdfjs-dist'].replace('^', '');
console.log(`PDF.js version from package.json: ${pdfjsVersion}`);

// Source and destination paths
const nodeModulesPath = path.join(__dirname, '../node_modules/pdfjs-dist');
const workerSrc = path.join(nodeModulesPath, 'build/pdf.worker.min.js');
const cmapsSrc = path.join(nodeModulesPath, 'cmaps');

const publicDir = path.join(__dirname, '../public');
const workerDest = path.join(publicDir, 'pdf.worker.min.js');
const cmapsDir = path.join(publicDir, 'cmaps');

// Create the cmaps directory if it doesn't exist
if (!fs.existsSync(cmapsDir)) {
  fs.mkdirSync(cmapsDir, { recursive: true });
  console.log(`Created directory: ${cmapsDir}`);
}

// Copy a file from source to destination
function copyFile(src, dest) {
  try {
    if (!fs.existsSync(src)) {
      throw new Error(`Source file does not exist: ${src}`);
    }
    
    fs.copyFileSync(src, dest);
    return true;
  } catch (error) {
    console.error(`Error copying file ${src} to ${dest}:`, error.message);
    return false;
  }
}

// Copy a directory recursively
function copyDirectory(src, dest) {
  try {
    if (!fs.existsSync(src)) {
      throw new Error(`Source directory does not exist: ${src}`);
    }
    
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    let copied = 0;
    const files = fs.readdirSync(src);
    
    for (const file of files) {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      
      const stats = fs.statSync(srcPath);
      
      if (stats.isDirectory()) {
        const subCopied = copyDirectory(srcPath, destPath);
        copied += subCopied;
      } else {
        if (copyFile(srcPath, destPath)) {
          copied++;
        }
      }
    }
    
    return copied;
  } catch (error) {
    console.error(`Error copying directory ${src} to ${dest}:`, error.message);
    return 0;
  }
}

// Copy PDF.js worker file
console.log(`Copying PDF.js worker from: ${workerSrc}`);
console.log(`To: ${workerDest}`);

if (copyFile(workerSrc, workerDest)) {
  console.log('PDF.js worker copied successfully!');
} else {
  console.error('Failed to copy PDF.js worker.');
}

// Copy CMap files
console.log(`\nCopying CMap files from: ${cmapsSrc}`);
console.log(`To: ${cmapsDir}`);

const copiedFiles = copyDirectory(cmapsSrc, cmapsDir);
console.log(`${copiedFiles} CMap files copied successfully!`);

console.log('\nAll files copied successfully!'); 