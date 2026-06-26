import React, { useEffect, useState } from 'react';
import { BellRing, Check, CheckSquare, Eye, EyeOff } from 'lucide-react';
import api from '../utils/api';
import useApi from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import AlertBadge from '../components/AlertBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const Alerts = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, HIGH, MEDIUM, LOW
  const [showResolved, setShowResolved] = useState(false);

  // Fetch alerts API (fetch all alerts, both active and resolved)
  const alertsApi = useApi(() => api.get('/api/alerts?include_resolved=true'));

  const loadAlerts = () => {
    alertsApi.execute().catch(err => {
      showToast(err.response?.data?.message || 'Failed to fetch alerts feed', 'error');
    });
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleResolveAlert = async (id, e) => {
    e.stopPropagation();
    try {
      await api.put(`/api/alerts/${id}/resolve`);
      showToast('Alert marked as resolved', 'success');
      loadAlerts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resolve alert', 'error');
    }
  };

  const handleResolveAll = async () => {
    if (!window.confirm('Are you sure you want to mark all active alerts as resolved?')) return;
    try {
      await api.put('/api/alerts/resolve-all');
      showToast('All active alerts marked as resolved', 'success');
      loadAlerts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to resolve all alerts', 'error');
    }
  };

  const list = alertsApi.data || [];

  // Filter alerts based on activeTab and showResolved
  const filteredList = list.filter(alert => {
    const tabMatch = activeTab === 'ALL' || alert.severity.toUpperCase() === activeTab;
    const resolvedMatch = showResolved ? true : !alert.is_resolved;
    return tabMatch && resolvedMatch;
  });

  const activeAlertsCount = list.filter(x => !x.is_resolved).length;

  return (
    <div className="alerts-page">
      <div className="page-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span className="page-label">System Notifications</span>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BellRing size={24} style={{ color: activeAlertsCount > 0 ? '#dc2626' : '#6b7280' }} />
            Alerts
            {activeAlertsCount > 0 && (
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                background: '#fee2e2',
                color: '#dc2626',
                padding: '2px 8px',
                borderRadius: '9999px'
              }}>
                {activeAlertsCount} active
              </span>
            )}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            className="btn-secondary"
            onClick={() => setShowResolved(prev => !prev)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {showResolved ? <EyeOff size={14} /> : <Eye size={14} />}
            {showResolved ? 'Hide Resolved' : 'Show Resolved'}
          </button>
          
          <button 
            className="btn-primary" 
            onClick={handleResolveAll}
            disabled={activeAlertsCount === 0 || alertsApi.loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <CheckSquare size={14} />
            Resolve All
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '24px',
        gap: '16px'
      }}>
        {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 8px',
              border: 'none',
              background: 'none',
              fontSize: '13px',
              fontWeight: activeTab === tab ? '700' : '500',
              color: activeTab === tab ? '#1d4ed8' : '#6b7280',
              borderBottom: activeTab === tab ? '3px solid #1d4ed8' : '3px solid transparent',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {tab.toLowerCase()}
          </button>
        ))}
      </div>

      {alertsApi.loading && <LoadingSpinner />}

      {!alertsApi.loading && alertsApi.error && (
        <div className="error-banner">
          Failed to load alerts feed: {alertsApi.error}
        </div>
      )}

      {!alertsApi.loading && !alertsApi.error && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredList.length === 0 ? (
            <EmptyState message="No alerts found matching your selected severity filters or visibility settings." />
          ) : (
            filteredList.map(alert => {
              const borderColors = {
                HIGH: '#dc2626',
                MEDIUM: '#d97706',
                LOW: '#16a34a'
              };
              
              return (
                <div 
                  key={alert.id}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderLeft: `5px solid ${borderColors[alert.severity.toUpperCase()] || '#9ca3af'}`,
                    borderRadius: '6px',
                    padding: '16px 20px',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '24px',
                    opacity: alert.is_resolved ? 0.65 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>
                        {alert.transporter_name}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>
                        {alert.rating_month}
                      </span>
                      <AlertBadge severity={alert.severity} />
                      {alert.is_resolved && (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          background: 'var(--border-light)',
                          color: 'var(--text-sub)',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          textTransform: 'uppercase'
                        }}>
                          Resolved
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-sub)', margin: '0', lineHeight: '1.4' }}>
                      {alert.message}
                    </p>
                  </div>
                  
                  {!alert.is_resolved && (
                    <button
                      className="btn-secondary"
                      style={{ 
                        padding: '6px 12px', 
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        flexShrink: 0
                      }}
                      onClick={(e) => handleResolveAlert(alert.id, e)}
                    >
                      <Check size={12} />
                      Resolve
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default Alerts;
