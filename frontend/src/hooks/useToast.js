import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success', duration = 3000) => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, duration);
    return () => clearTimeout(timer);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Standard JS React.createElement to keep this file purely JavaScript (no JSX compile needed)
  return React.createElement(
    ToastContext.Provider,
    { value: { showToast, hideToast, toast } },
    children
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
