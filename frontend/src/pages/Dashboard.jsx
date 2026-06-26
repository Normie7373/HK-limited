import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Truck, 
  Gauge, 
  Star, 
  AlertTriangle, 
  Bell, 
  RefreshCw, 
  Plus, 
  ArrowRight 
} from 'lucide-react';

import api from '../utils/api';
import useApi from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../context/ThemeContext';
import StatCard from '../components/StatCard';
import TierBadge from '../components/TierBadge';
import AlertBadge from '../components/AlertBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatScore } from '../utils/formatters';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

import './Dashboard.css';

const TIER_COLORS = {
  Excellent: '#16a34a',
  Good: '#1d4ed8',
  Average: '#d97706',
  Poor: '#dc2626'
};

const MOCK_SUMMARY = {
  totalPartners: 10,
  avgScore: 79.7,
  totalRecords: 73,
  topPerformer: 'Highway Pioneers',
  topPerformerScore: 97.5,
  activeAlerts: 5
};

const MOCK_TREND = [
  { month: '2026-02', avgScore: 79.8 },
  { month: '2026-03', avgScore: 79.4 },
  { month: '2026-04', avgScore: 79.2 },
  { month: '2026-05', avgScore: 78.9 },
  { month: '2026-06', avgScore: 79.3 },
  { month: '2026-07', avgScore: 79.9 },
  { month: '2026-08', avgScore: 97.4 }
];

const MOCK_TIER_DIST = [
  { name: 'Excellent', value: 2 },
  { name: 'Good', value: 5 },
  { name: 'Average', value: 2 },
  { name: 'Poor', value: 1 }
];

const MOCK_LEADERBOARD = [
  { id: 1, partner: 'Highway Pioneers', records: 9, avg_score: 97.5, tier: 'EXCELLENT' },
  { id: 2, partner: 'Skyline Freight Co.', records: 9, avg_score: 94.2, tier: 'EXCELLENT' },
  { id: 3, partner: 'Eastern Express Cargo', records: 9, avg_score: 82.1, tier: 'GOOD' }
];

const MOCK_ALERTS = [
  { id: 1, transporter_name: 'Eastern Express Cargo', severity: 'MEDIUM', message: 'High damage in 2026-06: 5 incidents', rating_month: '2026-06' },
  { id: 2, transporter_name: 'IndiaRoad Express', severity: 'HIGH', message: 'Performance score critically low: 52.2/100', rating_month: '2026-06' }
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { theme } = useTheme();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#1f2d44' : '#e5e7eb';
  const axisTickColor = isDark ? '#9ca3af' : '#6b7280';
  const lineStrokeColor = isDark ? '#3b82f6' : '#1d4ed8';
  const dotFillColor = isDark ? '#151f32' : '#ffffff';

  // API Requests setup
  const summaryApi = useApi(() => api.get('/api/dashboard/summary'));
  const trendApi = useApi(() => api.get('/api/dashboard/trend'));
  const tierApi = useApi(() => api.get('/api/dashboard/tier-distribution'));
  const leaderboardApi = useApi(() => api.get('/api/dashboard/leaderboard'));
  const alertsApi = useApi(() => api.get('/api/alerts?include_resolved=false'));

  const loadData = async () => {
    try {
      await Promise.all([
        summaryApi.execute(),
        trendApi.execute(),
        tierApi.execute(),
        leaderboardApi.execute(),
        alertsApi.execute()
      ]);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load dashboard data', 'error');
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
    showToast('Dashboard stats refreshed', 'success');
  };

  const isLoading = summaryApi.loading || trendApi.loading || tierApi.loading || leaderboardApi.loading || alertsApi.loading;
  const isError = summaryApi.error || trendApi.error || tierApi.error || leaderboardApi.error || alertsApi.error;

  const summary = (summaryApi.data && Object.keys(summaryApi.data).length > 0) ? summaryApi.data : (isError ? MOCK_SUMMARY : {});
  const trend = (trendApi.data && trendApi.data.length > 0) ? trendApi.data : (isError ? MOCK_TREND : []);
  const tierDist = (tierApi.data && tierApi.data.length > 0) ? tierApi.data : (isError ? MOCK_TIER_DIST : []);
  const leaderboard = (leaderboardApi.data && leaderboardApi.data.length > 0) ? leaderboardApi.data : (isError ? MOCK_LEADERBOARD : []);
  const activeAlerts = (alertsApi.data && alertsApi.data.length > 0) ? alertsApi.data : (isError ? MOCK_ALERTS : []);

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <span className="page-label">Overview</span>
          <h1 className="page-title">Performance Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? 'spin-anim' : ''} />
            Refresh
          </button>
          <button className="btn-primary" onClick={() => navigate('/new-rating')}>
            <Plus size={14} />
            New Rating
          </button>
        </div>
      </div>

      {isError && (
        <div className="error-banner">
          Offline Mode: Displaying local mock performance statistics. (Connection Error: {summaryApi.error || trendApi.error || tierApi.error || leaderboardApi.error || alertsApi.error})
        </div>
      )}

      {isLoading && <LoadingSpinner />}

      {!isLoading && (
        <>
          {/* Stats Cards Row */}
          <div className="stats-grid">
            <StatCard 
              label="Total Partners"
              value={summary.totalPartners}
              subtext={`${summary.totalPartners} active`}
              icon={Truck}
              type="blue"
            />
            <StatCard 
              label="Average Score"
              value={summary.avgScore !== undefined ? summary.avgScore : '0.0'}
              subtext={`${summary.totalRecords} records`}
              icon={Gauge}
              type="green"
            />
            <StatCard 
              label="Top Performer"
              value={summary.topPerformer || 'N/A'}
              subtext={summary.topPerformerScore ? `${summary.topPerformerScore} Avg Score` : 'N/A'}
              icon={Star}
              type="amber"
            />
            <StatCard 
              label="Active Alerts"
              value={summary.activeAlerts}
              subtext="Partners needing attention"
              icon={AlertTriangle}
              type="red"
            />
          </div>

          {/* Charts Row */}
          <div className="charts-row">
            <div className="chart-card line-chart-container">
              <span className="section-label">Trend</span>
              <h3 className="section-title">Average Score Over Time</h3>
              <div className="chart-wrapper" style={{ height: 260, width: '100%' }}>
                {trend.length === 0 ? (
                  <EmptyState message="No trend data available." />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                      <XAxis dataKey="month" tick={{ fill: axisTickColor, fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: axisTickColor, fontSize: 11 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--bg-card)', 
                          borderColor: 'var(--border-color)', 
                          borderRadius: '6px',
                          color: 'var(--text-main)'
                        }}
                        labelStyle={{ color: 'var(--text-main)', fontWeight: 'bold' }}
                        itemStyle={{ color: 'var(--primary-color)' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgScore" 
                        stroke={lineStrokeColor} 
                        strokeWidth={2}
                        dot={{ r: 4, stroke: lineStrokeColor, strokeWidth: 2, fill: dotFillColor }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="chart-card donut-chart-container">
              <span className="section-label">Tier Distribution</span>
              <h3 className="section-title">Partner Tiers</h3>
              <div className="chart-wrapper donut-wrapper" style={{ height: 200, width: '100%' }}>
                {tierDist.length === 0 || tierDist.every(d => d.value === 0) ? (
                  <EmptyState message="No tier distribution data available." />
                ) : (
                  <>
                    <div style={{ width: '100%', height: 140 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={tierDist}
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {tierDist.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={TIER_COLORS[entry.name] || '#e5e7eb'} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'var(--bg-card)', 
                              borderColor: 'var(--border-color)', 
                              borderRadius: '6px',
                              color: 'var(--text-main)'
                            }}
                            itemStyle={{ color: 'var(--primary-color)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Horizontal Legend Below Donut */}
                    <div className="donut-legend">
                      {tierDist.map((entry, index) => (
                        <div key={`legend-${index}`} className="legend-item">
                          <span className="legend-dot" style={{ backgroundColor: TIER_COLORS[entry.name] }} />
                          <span className="legend-text">{entry.name} ({entry.value !== undefined ? entry.value : 0})</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Grid: Leaderboard + Action Items */}
          <div className="bottom-grid">
            <div className="leaderboard-card">
              <div className="section-header-row">
                <div>
                  <span className="section-label">Leaderboard</span>
                  <h3 className="section-title">Top Partners</h3>
                </div>
                <Link to="/transporters" className="view-all-link">
                  View all <ArrowRight size={14} />
                </Link>
              </div>

              {leaderboard.length === 0 ? (
                <EmptyState message="No ratings available yet to compute leaderboard." />
              ) : (
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '50px' }}>#</th>
                        <th>Partner</th>
                        <th>Records</th>
                        <th>Avg Score</th>
                        <th>Tier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.map((item, index) => (
                        <tr key={item.id} onClick={() => navigate(`/transporters/${item.id}`)} className="clickable-row">
                          <td className="rank-col">
                            {String(index + 1).padStart(2, '0')}
                          </td>
                          <td className="partner-name-col">
                            {item.partner}
                          </td>
                          <td>{item.records}</td>
                          <td className="score-col">{formatScore(item.avg_score)}</td>
                          <td>
                            <TierBadge tier={item.tier} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="action-items-card">
              <div className="section-header-row">
                <div>
                  <span className="section-label">Action Items</span>
                  <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bell size={16} /> Alerts
                  </h3>
                </div>
                {activeAlerts.length > 0 && (
                  <Link to="/alerts" className="view-all-link">
                    Resolve all <ArrowRight size={14} />
                  </Link>
                )}
              </div>

              <div className="alerts-list-sidebar">
                {activeAlerts.length === 0 ? (
                  <div className="empty-alerts-box">
                    <CheckCircle2Icon />
                    <span>All transporters are performing within thresholds. No active alerts.</span>
                  </div>
                ) : (
                  activeAlerts.map(alert => (
                    <div 
                      key={alert.id} 
                      className={`alert-sidebar-card severity-border-${alert.severity.toLowerCase()}`}
                      onClick={() => navigate('/alerts')}
                    >
                      <div className="alert-sidebar-header">
                        <span className="alert-partner-name">{alert.transporter_name}</span>
                        <AlertBadge severity={alert.severity} />
                      </div>
                      <p className="alert-sidebar-msg">{alert.message}</p>
                      <span className="alert-sidebar-month">{alert.rating_month}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

// Utility empty icons for sidebar alerts
function CheckCircle2Icon() {
  return (
    <svg 
      width="28" 
      height="28" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="#16a34a" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ marginBottom: '6px' }}
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}

export default Dashboard;
