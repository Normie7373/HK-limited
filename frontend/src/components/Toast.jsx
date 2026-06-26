import React from 'react';
import { useToast } from '../hooks/useToast';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const Toast = () => {
  const { toast, hideToast } = useToast();

  if (!toast) return null;

  const isSuccess = toast.type === 'success';

  const containerStyle = {
    position: 'fixed',
    top: '24px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px',
    background: 'var(--bg-card)',
    border: `1px solid var(--border-color)`,
    borderLeft: `4px solid ${isSuccess ? '#16a34a' : '#dc2626'}`,
    borderRadius: '6px',
    boxShadow: 'var(--shadow-md)',
    zIndex: 1000,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    maxWidth: '360px',
    animation: 'slideIn 0.2s ease'
  };

  return (
    <div style={containerStyle}>
      {isSuccess ? (
        <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />
      ) : (
        <XCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
      )}
      <span style={{ fontSize: '13px', color: 'var(--text-main)', fontWeight: '500', flexGrow: 1 }}>
        {toast.message}
      </span>
      <button 
        onClick={hideToast}
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          padding: '2px',
          color: '#9ca3af',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <X size={14} />
      </button>

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Toast;
