# PDF Redaction Tool

A modern web application for redacting sensitive information from PDF documents. Built with Next.js, TypeScript, and PDF.js.

![image](https://github.com/user-attachments/assets/3fdfa900-04c5-4421-ab20-1f4fc13b8047)
![image](https://github.com/user-attachments/assets/3b944a79-c3bf-4db3-b41a-24d2f55aea7c)
![image](https://github.com/user-attachments/assets/fe133c0c-1409-4e21-a450-a40039e8f54a)




## Features

- **Simple PDF Uploading**: Drag and drop or select PDF files for redaction
- **Interactive Redaction**: Draw redaction rectangles directly on PDF pages
- **Real-time Preview**: See redactions as you draw them
- **Multi-page Support**: Navigate through multi-page PDFs with ease
- **Zoom Controls**: Adjust zoom levels for precise redaction placement
- **Download Redacted PDFs**: Securely download redacted documents
- **Responsive Design**: Works on desktop and tablet devices

## Technology Stack

- **Next.js**: React framework for the frontend
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **PDF.js**: Mozilla's PDF viewer library
- **pdf-lib**: PDF manipulation library

## Setup and Installation

### Prerequisites

- Node.js 18.0 or higher
- npm or yarn

### Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/pdf-redaction-tool.git
   cd pdf-redaction-tool
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:3000`

### Production Build

```bash
npm run build
# or
yarn build
```

### IIS Deployment

For deploying to IIS, use the PowerShell script included in the project:

```bash
npm run ps-build
```

This will generate a static build in the `out` directory that can be deployed to IIS.

See the [IIS Deployment Guide](IIS_DEPLOYMENT.md) for detailed instructions.

## How to Use

1. **Upload a PDF**: Click the upload button or drag and drop a PDF file
2. **Navigate Pages**: Use the page navigation controls to move between pages
3. **Draw Redactions**: Click and drag on the PDF to create redaction rectangles
4. **Apply Redactions**: Click the "Apply Redactions" button to process and download the redacted PDF
5. **Manage Redactions**: View and delete redaction areas using the sidebar

## Project Structure

- `/src/app`: Main application code
  - `/components`: React components
    - `/pdf`: PDF-specific components
  - `/hooks`: Custom React hooks
  - `/utils`: Utility functions
  - `/types`: TypeScript types and interfaces
  - `/constants`: Application constants

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Mozilla PDF.js](https://mozilla.github.io/pdf.js/)
- [pdf-lib](https://pdf-lib.js.org/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
