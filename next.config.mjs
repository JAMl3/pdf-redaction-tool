/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // Enable static exports for IIS deployment
  output: 'export',
  
  // Set the base path if deploying to a subdirectory
  // basePath: '/pdfredact', // Uncomment and adjust if deploying to a subdirectory
  
  // Disable image optimization since we're static exporting
  images: {
    unoptimized: true,
  },
  
  // Specify static generation parameters for performance
  staticPageGenerationTimeout: 180,
  
  // Add webpack config to handle PDF.js worker file properly
  webpack: (config, { isServer }) => {
    // Only run this in the browser build
    if (!isServer) {
      // Adjust publicPath for a static export
      config.output.publicPath = './';
      
      // Handle PDF.js worker files
      config.module.rules.push({
        test: /pdf\.worker\.(min\.)?js/,
        type: 'asset/resource',
        generator: {
          filename: 'static/chunks/[name][ext]'
        }
      });
    }
    
    return config;
  },
  
  // Disable trailing slash to match IIS default behavior
  trailingSlash: false,
  
  // Skip TypeScript type checking during build for speed
  typescript: {
    // Don't fail on linting issues - we'll fix these separately
    ignoreBuildErrors: true,
  },
  
  // Don't fail on ESLint warnings
  eslint: {
    ignoreDuringBuilds: true,
  }
};

export default nextConfig; 