import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import useApi from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  Settings as SettingsIcon, 
  Save, 
  RefreshCw, 
  Info, 
  Scale, 
  MailCheck, 
  FileText, 
  Plus, 
  Trash2,
  Search,
  UserCheck
} from 'lucide-react';
import './Settings.css';

const Settings = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('weights');

  // Weights States
  const [onTime, setOnTime] = useState(40);
  const [billing, setBilling] = useState(25);
  const [feedback, setFeedback] = useState(25);
  const [damage, setDamage] = useState(10);
  const [savingWeights, setSavingWeights] = useState(false);

  // Whitelist States
  const [whitelist, setWhitelist] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('OPERATIONS');
  const [loadingWhitelist, setLoadingWhitelist] = useState(false);
  const [savingWhitelist, setSavingWhitelist] = useState(false);

  // Logs States
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Load Weights
  const getWeightsApi = useApi(() => api.get('/api/settings/scoring-weights'));

  const loadWeights = async () => {
    try {
      const data = await getWeightsApi.execute();
      setOnTime(Math.round(data.on_time * 100));
      setBilling(Math.round(data.billing * 100));
      setFeedback(Math.round(data.feedback * 100));
      setDamage(Math.round(data.damage * 100));
    } catch (err) {
      showToast('Failed to load scoring weights', 'error');
    }
  };

  // 2. Load Whitelist
  const loadWhitelist = async () => {
    setLoadingWhitelist(true);
    try {
      const response = await api.get('/api/admin/authorized-emails');
      setWhitelist(response.data.data);
    } catch (err) {
      showToast('Failed to load authorized emails whitelist', 'error');
    } finally {
      setLoadingWhitelist(false);
    }
  };

  // 3. Load Logs
  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await api.get('/api/admin/logs');
      setLogs(response.data.data);
    } catch (err) {
      showToast('Failed to load system audit logs', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  // Handle Tab Switch Effects
  useEffect(() => {
    if (activeTab === 'weights') {
      loadWeights();
    } else if (activeTab === 'whitelist') {
      loadWhitelist();
    } else if (activeTab === 'logs') {
      loadLogs();
    }
  }, [activeTab]);

  // Weights sum validation
  const total = parseFloat(onTime) + parseFloat(billing) + parseFloat(feedback) + parseFloat(damage);
  const isValid = Math.abs(total - 100) < 0.01;

  // Save Weights Handler
  const handleSaveWeights = async (e) => {
    e.preventDefault();
    if (!isValid) {
      return showToast(`Weights must sum to 100% (currently ${total}%)`, 'error');
    }

    setSavingWeights(true);
    try {
      await api.post('/api/settings/scoring-weights', {
        on_time: onTime / 100,
        billing: billing / 100,
        feedback: feedback / 100,
        damage: damage / 100
      });
      showToast('Scoring weights updated successfully', 'success');
      window.dispatchEvent(new Event('settings-updated'));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update scoring weights', 'error');
    } finally {
      setSavingWeights(false);
    }
  };

  // Add Authorized Email Handler
  const handleAddWhitelist = async (e) => {
    e.preventDefault();
    if (!newEmail) return showToast('Please enter an email address', 'error');

    setSavingWhitelist(true);
    try {
      await api.post('/api/admin/authorized-emails', {
        email: newEmail.trim().toLowerCase(),
        role: newRole
      });
      showToast('Email authorized successfully', 'success');
      setNewEmail('');
      loadWhitelist();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to authorize email', 'error');
    } finally {
      setSavingWhitelist(false);
    }
  };

  // Remove Authorized Email Handler
  const handleRemoveWhitelist = async (id, email) => {
    if (!window.confirm(`Are you sure you want to remove authorization for ${email}?`)) return;

    try {
      await api.delete(`/api/admin/authorized-emails/${id}`);
      showToast('Email deauthorized successfully', 'success');
      loadWhitelist();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to deauthorize email', 'error');
    }
  };

  // Timestamp Formatter for Logs
  const formatDateTime = (isoString) => {
    const d = new Date(isoString);
    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };

  // Filter logs based on search
  const filteredLogs = logs.filter(log => {
    const term = searchQuery.toLowerCase();
    return (
      (log.username && log.username.toLowerCase().includes(term)) ||
      (log.action_type && log.action_type.toLowerCase().includes(term)) ||
      (log.details && log.details.toLowerCase().includes(term))
    );
  });

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <span className="page-label">System Preferences</span>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SettingsIcon size={24} /> Settings & Admin Console
          </h1>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="settings-tabs">
        <button 
          className={`settings-tab-btn ${activeTab === 'weights' ? 'active' : ''}`}
          onClick={() => setActiveTab('weights')}
        >
          <Scale size={16} /> Scoring Weights
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'whitelist' ? 'active' : ''}`}
          onClick={() => setActiveTab('whitelist')}
        >
          <MailCheck size={16} /> Whitelisted Emails
        </button>
        <button 
          className={`settings-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <FileText size={16} /> Audit Logs
        </button>
      </div>

      {/* Content Render based on Active Tab */}
      
      {/* 1. SCORING WEIGHTS TAB */}
      {activeTab === 'weights' && (
        getWeightsApi.loading ? <LoadingSpinner /> : (
          <div className="card" style={{ maxWidth: '600px', padding: '28px' }}>
            <span className="section-label">Performance Metric Coefficients</span>
            <h3 className="section-title">Configure Scoring Weights</h3>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: '8px 0 24px 0', lineHeight: '1.4' }}>
              Modify the percentage coefficients used to evaluate transporter performance scores. All values must sum up to exactly 100%.
            </p>

            <form onSubmit={handleSaveWeights} className="settings-form">
              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">On-Time Delivery Rate Weight (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={onTime}
                    onChange={(e) => setOnTime(parseInt(e.target.value) || 0)}
                    disabled={savingWeights}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Billing Accuracy Weight (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={billing}
                    onChange={(e) => setBilling(parseInt(e.target.value) || 0)}
                    disabled={savingWeights}
                  />
                </div>
              </div>

              <div className="form-group-row">
                <div className="form-group">
                  <label className="form-label">Client Feedback Weight (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={feedback}
                    onChange={(e) => setFeedback(parseInt(e.target.value) || 0)}
                    disabled={savingWeights}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Damage Incidents Penalty Coefficient (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={damage}
                    onChange={(e) => setDamage(parseInt(e.target.value) || 0)}
                    disabled={savingWeights}
                  />
                </div>
              </div>

              <div className={`weights-summary-box ${isValid ? 'summary-success' : 'summary-danger'}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Info size={16} />
                  <span>
                    Total Sum of Coefficients: <strong>{total}%</strong>
                  </span>
                </div>
                {!isValid && (
                  <span className="summary-hint">Adjust values to equal exactly 100%.</span>
                )}
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={loadWeights} 
                  disabled={savingWeights}
                >
                  <RefreshCw size={14} /> Reset
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={savingWeights || !isValid}
                >
                  <Save size={14} /> {savingWeights ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        )
      )}

      {/* 2. WHITELISTED EMAILS TAB */}
      {activeTab === 'whitelist' && (
        <div style={{ display: 'grid', gridTemplateColumns: '4fr 8fr', gap: '24px', alignItems: 'start' }}>
          {/* Add whitelist form */}
          <div className="card" style={{ padding: '24px' }}>
            <span className="section-label">Access Control</span>
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={18} /> Whitelist Email
            </h3>
            <p style={{ fontSize: '12px', color: '#6b7280', margin: '8px 0 20px 0', lineHeight: '1.4' }}>
              Authorize a company email address to register. Pre-defining their user role prevents unauthorized role escalation.
            </p>

            <form onSubmit={handleAddWhitelist} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input 
                  type="email"
                  placeholder="e.g. employee@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  disabled={savingWhitelist}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pre-Authorized Role *</label>
                <select 
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  disabled={savingWhitelist}
                >
                  <option value="OPERATIONS">Operations Staff</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', marginTop: '8px' }}
                disabled={savingWhitelist || !newEmail}
              >
                <Plus size={14} /> {savingWhitelist ? 'Authorizing...' : 'Authorize Email'}
              </button>
            </form>
          </div>

          {/* Whitelist Table */}
          <div className="card" style={{ padding: '24px' }}>
            <span className="section-label">Registry Whitelist</span>
            <h3 className="section-title">Authorized Company Profiles</h3>
            
            {loadingWhitelist ? <LoadingSpinner /> : (
              <div className="table-responsive" style={{ marginTop: '16px', maxHeight: '450px' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Authorized Role</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {whitelist.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                          No whitelisted emails. Add one using the panel on the left.
                        </td>
                      </tr>
                    ) : (
                      whitelist.map(item => (
                        <tr key={item.id}>
                          <td style={{ fontWeight: '600', color: '#111827' }}>{item.email}</td>
                          <td>
                            <span className="user-role" style={{ fontSize: '11px', padding: '2px 6px', background: '#f3f4f6', borderRadius: '4px' }}>
                              {item.role.toLowerCase()}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button 
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '6px', border: '1px solid #fee2e2', color: '#dc2626', minHeight: 'auto' }}
                              onClick={() => handleRemoveWhitelist(item.id, item.email)}
                              title="Revoke Authorization"
                            >
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. AUDIT LOGS TAB */}
      {activeTab === 'logs' && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <span className="section-label">Security Logs</span>
              <h3 className="section-title">Console Audit Trail</h3>
            </div>
            {/* Log Search Filter */}
            <div style={{ position: 'relative', width: '250px' }}>
              <input 
                type="text" 
                placeholder="Search audit trail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', height: '36px', fontSize: '13px' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            </div>
          </div>

          {loadingLogs ? <LoadingSpinner /> : (
            <div className="table-responsive" style={{ maxHeight: '550px' }}>
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '180px' }}>Timestamp</th>
                    <th style={{ width: '120px' }}>User</th>
                    <th style={{ width: '180px' }}>Action Type</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                        No audit logs matching search term.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map(log => (
                      <tr key={log.id}>
                        <td style={{ fontSize: '12px', color: '#6b7280' }}>
                          {formatDateTime(log.created_at)}
                        </td>
                        <td style={{ fontWeight: '600', color: '#111827' }}>
                          {log.username || 'System'}
                        </td>
                        <td>
                          <span className="log-action-badge" style={{
                            padding: '3px 8px',
                            background: '#eff6ff',
                            border: '1px solid #dbeafe',
                            color: '#1d4ed8',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600'
                          }}>
                            {log.action_type}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: '#4b5563' }}>{log.details}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Settings;
