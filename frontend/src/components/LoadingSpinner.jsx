import React from 'react';

const LoadingSpinner = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '3px solid #e5e7eb',
        borderTopColor: '#1d4ed8',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: '500' }}>Loading data...</span>
      
      {/* Inline style for keyframes since standard CSS files aren't created for this simple component */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
