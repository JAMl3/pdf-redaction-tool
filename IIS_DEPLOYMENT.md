# IIS Deployment Guide for PDF Redaction Tool

This guide provides step-by-step instructions for deploying the PDF Redaction Tool to Microsoft Internet Information Services (IIS).

## Prerequisites

- Windows Server or Windows 10/11 with IIS installed
- Administrator access to the server
- URL Rewrite Module for IIS

## Step 1: Installing IIS (if not already installed)

1. **Install IIS on your Windows machine**:
   - Open Control Panel
   - Go to "Programs and Features"
   - Click "Turn Windows features on or off"
   - Check "Internet Information Services" and expand it
   - Make sure the following are checked:
     - Web Management Tools → IIS Management Console
     - World Wide Web Services → Common HTTP Features (all)
     - World Wide Web Services → Application Development Features → .NET Extensibility, ASP.NET, ISAPI Extensions, ISAPI Filters
   - Click OK and wait for the installation to complete

## Step 2: Install URL Rewrite Module

1. **Download the URL Rewrite Module**:

   - Go to https://www.iis.net/downloads/microsoft/url-rewrite
   - Click "Install this extension"
   - Download the appropriate version (x86 or x64) for your server

2. **Install the module**:
   - Run the downloaded installer
   - Follow the installation wizard
   - Restart IIS after installation (open Command Prompt as admin and run `iisreset`)

## Step 3: Build the Application for IIS

1. **Build the static version**:
   - In the project directory, run:
     ```
     npm run ps-build
     ```
   - This will create an `out` directory with all the files needed for deployment

## Step 4: Creating a Website in IIS

1. **Open IIS Manager**:

   - Press Win+R, type `inetmgr`, and press Enter
   - Or search for "Internet Information Services (IIS) Manager" in the Start menu

2. **Create a new Application Pool**:

   - In the left panel, click on your server name
   - Open "Application Pools"
   - Right-click in the main panel and select "Add Application Pool"
   - Name: `PDFRedactPool`
   - .NET CLR version: "No Managed Code"
   - Managed pipeline mode: "Integrated"
   - Click OK

3. **Create a new Website**:
   - In the left panel, right-click on "Sites"
   - Select "Add Website"
   - Site name: `PDFRedaction`
   - Application pool: Select `PDFRedactPool` from the dropdown
   - Physical path: Choose a directory where you'll place your files (e.g., `C:\inetpub\wwwroot\PDFRedaction`)
   - Binding:
     - Type: `http`
     - IP address: `All Unassigned`
     - Port: `80` (or another port if 80 is in use)
     - Host name: Leave blank for local testing or enter your domain
   - Click OK

## Step 5: Deploying Application Files

1. **Create the website directory** (if it doesn't already exist):

   - Open File Explorer
   - Navigate to the physical path you specified (e.g., `C:\inetpub\wwwroot\PDFRedaction`)
   - Create this folder if it doesn't exist

2. **Copy your application files**:

   - Copy all contents from the `out` folder of your project
   - Paste them into the website directory you created

3. **Verify web.config exists**:
   - Make sure the `web.config` file is in the root of your website directory
   - If it's not present, copy it from the project directory or create it as described in the README

## Step 6: Configure Application Pool Settings

1. **Set correct permissions**:

   - Right-click on your website directory in File Explorer
   - Select "Properties"
   - Go to the "Security" tab
   - Click "Edit"
   - Click "Add"
   - Type "IIS_IUSRS" and click "Check Names"
   - Click OK
   - Check "Read & execute", "List folder contents", and "Read"
   - Click Apply and OK

2. **Configure Application Pool**:
   - In IIS Manager, go to "Application Pools"
   - Right-click on `PDFRedactPool`
   - Select "Advanced Settings"
   - Make sure the following settings are set:
     - Enable 32-Bit Applications: `False` (unless you specifically need 32-bit)
     - Managed Pipeline Mode: `Integrated`
     - .NET CLR Version: `No Managed Code`
   - Click OK

## Step 7: Testing Your Application

1. **Start your website**:

   - In IIS Manager, select your website from the list
   - In the right panel, click "Start" if it's not already running

2. **Test your application**:
   - Open a web browser
   - Navigate to `http://localhost` (or the port you specified)
   - You should see your PDF Redaction Tool application
   - Try uploading a PDF and testing the redaction functionality

## Troubleshooting Common Issues

### PDF.js Worker Not Loading

If PDF files aren't displaying properly:

1. **Check if the worker file exists**:

   - Verify that `pdf.worker.min.js` exists in the root directory of your website
   - If missing, copy it from `public/pdf.worker.min.js` in your project

2. **Check network requests**:
   - Open browser dev tools (F12)
   - Look for 404 errors related to PDF.js
   - Make sure the URL Rewrite rules are working correctly

### CMap Files Not Loading

If you see issues with certain PDFs displaying properly:

1. **Verify the CMap directory**:

   - Check that the `cmaps` folder exists in the root of your website
   - Ensure it contains all the CMap files (about 195 files)

2. **Check permissions**:
   - Make sure IIS_IUSRS has read access to the cmaps directory

### 404 Errors on Page Refresh

If you get 404 errors when refreshing the page:

1. **Check URL Rewrite Module**:

   - Verify the URL Rewrite Module is installed
   - Check the web.config file has the correct rewrite rules

2. **Test the rewrite rules**:
   - In IIS Manager, select your website
   - Double-click on "URL Rewrite"
   - Verify your rules are listed and enabled

### Static Content Not Loading

If JavaScript, CSS, or other static files aren't loading:

1. **Check MIME types**:
   - Verify that proper MIME types are set in the web.config
   - Make sure `.js`, `.json`, and other file types have appropriate mappings

## Setting up HTTPS (Recommended for Production)

For a production environment, you should secure your site with HTTPS:

1. **Install a certificate**:

   - In IIS Manager, select your server
   - Double-click on "Server Certificates"
   - In the right panel, click "Create Self-Signed Certificate" (for testing) or "Complete Certificate Request" (for a certificate from a CA)
   - Follow the wizard to create or import your certificate

2. **Add HTTPS binding**:
   - In IIS Manager, select your website
   - In the right panel, click "Bindings"
   - Click "Add"
   - Type: select "https"
   - IP address: "All Unassigned"
   - Port: "443"
   - SSL certificate: select your certificate
   - Click OK

## Additional Resources

- [IIS Documentation](https://docs.microsoft.com/en-us/iis/get-started/introduction-to-iis/iis-introduction)
- [URL Rewrite Module Documentation](https://docs.microsoft.com/en-us/iis/extensions/url-rewrite-module/using-the-url-rewrite-module)
- [Setting up HTTPS in IIS](https://docs.microsoft.com/en-us/iis/manage/configuring-security/how-to-set-up-ssl-on-iis)
