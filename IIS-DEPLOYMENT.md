# Deploying the PDF Redaction Tool to IIS

This guide provides detailed instructions for deploying the PDF Redaction Tool to Internet Information Services (IIS) on Windows Server.

## Prerequisites

Before you begin, ensure you have the following:

1. **Windows Server** with IIS installed
2. **URL Rewrite Module** for IIS installed
   - [Download from Microsoft](https://www.iis.net/downloads/microsoft/url-rewrite)
3. **.NET Framework 4.5** or higher installed
4. **Administrator access** to the server
5. **Node.js and npm** (for building the application)

## Option 1: Building and Deploying with PowerShell Script

The simplest approach is to use the included PowerShell deployment script:

1. Right-click on `deploy-iis.ps1` and select "Run with PowerShell" (as Administrator if possible)
2. Follow the prompts in the script
3. Once completed, the script will generate the `out` directory with all deployment files
4. Copy the contents of the `out` directory to your IIS website folder

## Option 2: Manual Deployment Process

### Step 1: Build the Application

1. Open a command prompt or PowerShell window in the project directory
2. Run the following commands:
   ```
   npm install
   npm run build
   ```
3. If you encounter permission errors, try running the commands as Administrator

### Step 2: Prepare the Output Directory

1. Create a directory for your website in IIS (e.g., `C:\inetpub\wwwroot\pdf-redaction`)
2. Copy all files from the `out` directory to your website directory
3. Make sure `web.config` and `pdf.worker.min.js` are in the root of the website directory

### Step 3: Configure IIS

1. Open **Internet Information Services (IIS) Manager**
2. Create a new website or application:

   - Right-click on **Sites** and select **Add Website** or add an application to an existing site
   - Set the **Physical path** to your website directory (e.g., `C:\inetpub\wwwroot\pdf-redaction`)
   - Configure other settings as needed (port, hostname, etc.)

3. Configure the application pool:

   - Select the application pool used by your website
   - Right-click and select **Basic Settings**
   - Set **.NET CLR version** to **No Managed Code**
   - Set **Managed pipeline mode** to **Integrated**

4. Set proper permissions:
   - Right-click on your website directory in File Explorer
   - Select **Properties** → **Security** → **Edit**
   - Add the `IIS_IUSRS` group with **Read & execute** permissions
   - If using a custom application pool identity, add that account with appropriate permissions

### Step 4: Install URL Rewrite Module

1. Download the URL Rewrite Module from the [Microsoft website](https://www.iis.net/downloads/microsoft/url-rewrite)
2. Install the module following the installation wizard
3. Restart IIS after installation (in IIS Manager, right-click on the server and select **Restart**)

### Step 5: Test the Application

1. Open a web browser and navigate to your website URL
2. Verify that the PDF Redaction Tool loads correctly
3. Test the functionality by uploading and redacting a PDF

## Troubleshooting

### 404 Errors for JavaScript or CSS Files

If your application loads but appears unstyled or non-functional:

1. Check if the URL Rewrite module is installed properly
2. Verify that `web.config` is in the root directory of your website
3. Ensure MIME types are correctly configured in IIS:
   - In IIS Manager, select your website
   - Double-click on **MIME Types**
   - Add any missing MIME types (like .json, .js, .css)

### PDF.js Worker File Not Found

If you see errors related to the PDF.js worker file:

1. Verify that `pdf.worker.min.js` is in the root directory of your website
2. Check the console for the exact path that the application is trying to load
3. Update the `public/pdf.worker.min.js` file and redeploy if needed

### Application Pool Crashes

If your application pool crashes when accessing the site:

1. Check the Application Event Log for errors
2. Make sure you've set the application pool to use "No Managed Code"
3. Verify that the application pool user has sufficient permissions

## Advanced Configuration

### Setting Up HTTPS

For production environments, it's recommended to use HTTPS:

1. In IIS Manager, select your website
2. In the Actions panel, click **Bindings**
3. Click **Add** and select **https** from the Type dropdown
4. Select your SSL certificate and click **OK**

### URL Rewrite Rules for Subdirectories

If you're deploying to a subdirectory (e.g., `https://your-server/pdf-redaction`), update the `web.config` file to include the correct base path in the rewrite rules.

### Load Balancing

For high-traffic environments, you can set up multiple instances behind a load balancer:

1. Deploy the application to multiple servers
2. Configure a load balancer to distribute traffic
3. Ensure any shared resources are properly synchronized

## Additional Resources

- [IIS Documentation](https://docs.microsoft.com/en-us/iis/)
- [URL Rewrite Module Documentation](https://docs.microsoft.com/en-us/iis/extensions/url-rewrite-module/using-the-url-rewrite-module)
- [Next.js Static Export Documentation](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports)
