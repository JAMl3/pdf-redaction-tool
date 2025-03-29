import React from 'react';

interface PDFEncryptionAlertProps {
  isEncrypted: boolean;
  onUnlock: () => void;
  loading?: boolean;
}

/**
 * A component that displays when a PDF is encrypted and offers to unlock it
 */
export const PDFEncryptionAlert: React.FC<PDFEncryptionAlertProps> = ({
  isEncrypted,
  onUnlock,
  loading = false
}) => {
  if (!isEncrypted) return null;

  return (
    <div className="bg-yellow-100 text-yellow-800 p-3 mb-4 rounded-md border border-yellow-200 flex justify-between items-center">
      <div className="flex items-center">
        {/* Lock icon */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 mr-2" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" 
            clipRule="evenodd" 
          />
        </svg>
        <p>
          This PDF is encrypted or has security restrictions. You need to unlock it before applying redactions.
        </p>
      </div>
      <button
        onClick={onUnlock}
        disabled={loading}
        className={`ml-4 px-3 py-1 rounded text-sm font-medium inline-flex items-center ${
          loading 
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
            : 'bg-yellow-600 text-white hover:bg-yellow-700'
        }`}
      >
        {/* Unlock icon */}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 mr-1" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" 
          />
        </svg>
        {loading ? 'Unlocking...' : 'Unlock PDF'}
      </button>
    </div>
  );
};

export default PDFEncryptionAlert; 