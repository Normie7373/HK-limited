import React from 'react';
import './StatCard.css';

const StatCard = ({ label, value, subtext, icon: Icon, type }) => {
  // Types: blue, green, amber, red
  return (
    <div className={`stat-card border-top-${type}`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        {Icon && <Icon className="stat-card-icon" size={20} />}
      </div>
      <div className="stat-card-value">{value}</div>
      {subtext && <div className="stat-card-subtext">{subtext}</div>}
    </div>
  );
};

export default StatCard;
