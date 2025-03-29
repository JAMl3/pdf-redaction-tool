// Script to download the PDF.js worker file and save it to the public directory
import fs from 'fs';
import path from 'path';
import https from 'https';
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

// Define the worker URLs
const workerUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.js`;
const outputPath = path.join(__dirname, '../public/pdf.worker.min.js');

// Create directory for CMap files
const cmapsDir = path.join(__dirname, '../public/cmaps');
if (!fs.existsSync(cmapsDir)) {
  fs.mkdirSync(cmapsDir, { recursive: true });
  console.log(`Created directory: ${cmapsDir}`);
}

// Essential CMap files to download
const cmapFiles = [
  'Adobe-CNS1-UCS2',
  'Adobe-GB1-UCS2',
  'Adobe-Japan1-UCS2',
  'Adobe-Korea1-UCS2',
  'B5pc-H',
  'B5pc-V',
  'CNS1-H',
  'CNS1-V',
  'ETen-B5-H',
  'ETen-B5-V',
  'GB-EUC-H',
  'GB-EUC-V',
  'GBK-EUC-H',
  'GBK-EUC-V',
  'GBpc-EUC-H',
  'GBpc-EUC-V',
  'Identity-H',
  'Identity-V',
  'UniCNS-UCS2-H',
  'UniCNS-UCS2-V',
  'UniGB-UCS2-H',
  'UniGB-UCS2-V',
  'UniJIS-UCS2-H',
  'UniJIS-UCS2-V',
  'UniKS-UCS2-H',
  'UniKS-UCS2-V'
];

console.log(`Downloading PDF.js worker from: ${workerUrl}`);
console.log(`Saving to: ${outputPath}`);

// Ensure the directory exists
const dir = path.dirname(outputPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Download a file from URL to destination
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); // Delete the file if there was an error
      reject(err);
    });
  });
}

// Main function to download worker and CMap files
async function downloadAllFiles() {
  try {
    // Download worker file
    await downloadFile(workerUrl, outputPath);
    console.log('PDF.js worker downloaded successfully!');
    
    // Download CMap files
    console.log(`Downloading ${cmapFiles.length} CMap files...`);
    
    for (const cmapFile of cmapFiles) {
      const cmapUrl = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsVersion}/cmaps/${cmapFile}`;
      const cmapPath = path.join(cmapsDir, cmapFile);
      
      try {
        await downloadFile(cmapUrl, cmapPath);
        process.stdout.write('.');
      } catch (error) {
        console.error(`\nError downloading ${cmapFile}: ${error.message}`);
      }
    }
    
    console.log('\nAll files downloaded successfully!');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the download
downloadAllFiles(); 