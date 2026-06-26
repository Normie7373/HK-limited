import React from 'react';
import { Database } from 'lucide-react';

const EmptyState = ({ message = 'No records found matching your filters' }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      border: '1px dashed #e5e7eb',
      borderRadius: '8px',
      background: '#ffffff',
      textAlign: 'center',
      gap: '12px'
    }}>
      <Database size={36} style={{ color: '#9ca3af' }} />
      <div style={{ fontWeight: '600', fontSize: '15px', color: '#374151' }}>No Data Available</div>
      <div style={{ fontSize: '13px', color: '#6b7280', maxWidth: '300px' }}>{message}</div>
    </div>
  );
};

export default EmptyState;
