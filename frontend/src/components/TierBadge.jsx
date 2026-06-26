import React from 'react';

const TierBadge = ({ tier }) => {
  const normalized = (tier || '').toUpperCase();
  
  let key = 'default';
  if (normalized === 'EXCELLENT') key = 'excellent';
  else if (normalized === 'GOOD') key = 'good';
  else if (normalized === 'AVERAGE') key = 'average';
  else if (normalized === 'POOR') key = 'poor';

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
      {tier || 'N/A'}
    </span>
  );
};

export default TierBadge;
