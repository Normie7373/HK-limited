import React from 'react';

const AlertBadge = ({ severity }) => {
  const normalized = (severity || '').toUpperCase();

  let key = 'default';
  if (normalized === 'HIGH') key = 'poor';
  else if (normalized === 'MEDIUM') key = 'average';
  else if (normalized === 'LOW') key = 'excellent';

  const styles = {
    borderRadius: '4px',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    display: 'inline-block',
    background: `var(--badge-${key}-bg)`,
    color: `var(--badge-${key}-text)`,
    transition: 'background 0.2s ease, color 0.2s ease'
  };

  return (
    <span style={styles}>
      {severity || 'N/A'}
    </span>
  );
};

export default AlertBadge;
