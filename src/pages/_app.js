import { initPdfWorker } from '../app/utils/pdfWorkerLoader';

// Initialize PDF.js worker as early as possible in the application lifecycle
if (typeof window !== 'undefined') {
  initPdfWorker().then(success => {
    if (success) {
      console.log('PDF.js worker initialized successfully at application level');
    } else {
      console.warn('PDF.js worker initialization may not be complete');
    }
  }).catch(error => {
    console.error('Error initializing PDF.js worker:', error);
  });
}

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp; 