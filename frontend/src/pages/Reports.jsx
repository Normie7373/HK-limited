import React, { useEffect, useState } from 'react';
import { Download, Calendar, Users, ClipboardList, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import useApi from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { useTheme } from '../context/ThemeContext';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';

const MOCK_PARTNERS = [
  { id: 1, name: 'Highway Pioneers' },
  { id: 2, name: 'Skyline Freight Co.' },
  { id: 3, name: 'DesertLine Carriers' },
  { id: 4, name: 'Coastal Cargo Movers' },
  { id: 5, name: 'Eastern Express Cargo' }
];

const MOCK_SUMMARY = {
  partners: 5,
  records: 35,
  avgScore: 82.4,
  alerts: 3,
  partnerComparison: [
    { name: 'Highway Pioneers', score: 97.5 },
    { name: 'Skyline Freight Co.', score: 94.2 },
    { name: 'Eastern Express Cargo', score: 82.1 },
    { name: 'DesertLine Carriers', score: 79.5 },
    { name: 'Coastal Cargo Movers', score: 75.3 }
  ],
  monthlyTrend: [
    { month: '2026-02', avgScore: 79.8 },
    { month: '2026-03', avgScore: 79.4 },
    { month: '2026-04', avgScore: 79.2 },
    { month: '2026-05', avgScore: 78.9 },
    { month: '2026-06', avgScore: 82.4 }
  ]
};

const Reports = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isAdmin = user?.role === 'ADMIN';

  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#1f2d44' : '#e5e7eb';
  const axisTickColor = isDark ? '#9ca3af' : '#6b7280';
  const lineStrokeColor = isDark ? '#3b82f6' : '#1d4ed8';
  const dotFillColor = isDark ? '#151f32' : '#ffffff';

  // Filters state
  const [partnerId, setPartnerId] = useState('');
  const [fromMonth, setFromMonth] = useState('2025-12');
  const [toMonth, setToMonth] = useState('2026-06');

  // Fetch partners list
  const partnersApi = useApi(() => api.get('/api/transporters'));

  // Fetch report summary
  const summaryApi = useApi(() => 
    api.get('/api/reports/summary', {
      params: {
        from: fromMonth || undefined,
        to: toMonth || undefined,
        transporter_id: partnerId || undefined
      }
    })
  );

  const loadData = () => {
    summaryApi.execute().catch(err => {
      showToast(err.response?.data?.message || 'Failed to fetch report summary', 'error');
    });
  };

  useEffect(() => {
    partnersApi.execute().catch(err => console.error(err));
  }, []);

  useEffect(() => {
    loadData();
  }, [partnerId, fromMonth, toMonth]);

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/api/reports/export', {
        params: {
          from: fromMonth || undefined,
          to: toMonth || undefined,
          transporter_id: partnerId || undefined
        },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `performance_report_${fromMonth}_to_${toMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast('CSV report exported successfully', 'success');
    } catch (err) {
      showToast('Failed to export CSV report', 'error');
    }
  };

  const isError = summaryApi.error || partnersApi.error;

  const partners = (partnersApi.data && partnersApi.data.length > 0) ? partnersApi.data : (isError ? MOCK_PARTNERS : []);
  const summary = (summaryApi.data && Object.keys(summaryApi.data).length > 0) ? summaryApi.data : (isError ? MOCK_SUMMARY : {});
  const partnerComparison = (summary.partnerComparison && summary.partnerComparison.length > 0) ? summary.partnerComparison : (isError ? MOCK_SUMMARY.partnerComparison : []);
  const monthlyTrend = (summary.monthlyTrend && summary.monthlyTrend.length > 0) ? summary.monthlyTrend : (isError ? MOCK_SUMMARY.monthlyTrend : []);

  const isLoading = (summaryApi.loading || partnersApi.loading) && !isError;

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <span className="page-label">Analytics & Insights</span>
          <h1 className="page-title">Reports & Insights</h1>
        </div>
        {isAdmin && (
          <button 
            className="btn-primary" 
            onClick={handleExportCSV} 
            disabled={isLoading || partnerComparison.length === 0}
          >
            <Download size={14} />
            Export CSV
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {/* Partner Selector */}
          <div className="form-group">
            <label className="page-label" style={{ fontSize: '10px', marginBottom: '6px' }}>Partner</label>
            <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
              <option value="">All partners</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* From Month */}
          <div className="form-group">
            <label className="page-label" style={{ fontSize: '10px', marginBottom: '6px' }}>From (YYYY-MM)</label>
            <input 
              type="text" 
              placeholder="e.g. 2025-12"
              value={fromMonth}
              onChange={(e) => setFromMonth(e.target.value)}
            />
          </div>

          {/* To Month */}
          <div className="form-group">
            <label className="page-label" style={{ fontSize: '10px', marginBottom: '6px' }}>To (YYYY-MM)</label>
            <input 
              type="text" 
              placeholder="e.g. 2026-06"
              value={toMonth}
              onChange={(e) => setToMonth(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isLoading && <LoadingSpinner />}

      {isError && (
        <div className="error-banner">
          Offline Mode: Displaying local mock performance analytics. (Connection Error: {summaryApi.error || partnersApi.error})
        </div>
      )}

      {!isLoading && (
        <>
          {/* Report Stats Row */}
          <div className="stats-grid">
            <StatCard 
              label="Partners"
              value={summary.partners || 0}
              subtext="Rated in period"
              icon={Users}
              type="blue"
            />
            <StatCard 
              label="Records"
              value={summary.records || 0}
              subtext="Rating logs count"
              icon={ClipboardList}
              type="green"
            />
            <StatCard 
              label="Avg Score"
              value={summary.avgScore !== undefined ? summary.avgScore : '0.0'}
              subtext="Across period"
              icon={RefreshCw}
              type="amber"
            />
            <StatCard 
              label="Alerts"
              value={summary.alerts || 0}
              subtext="Fired in period"
              icon={AlertTriangle}
              type="red"
            />
          </div>

          {/* Reports Charts Area */}
          {partnerComparison.length === 0 ? (
            <EmptyState message="No ratings available during the selected date range. Try broadening the From/To month filters." />
          ) : (
            <div className="charts-row" style={{ gridTemplateColumns: '6fr 4fr' }}>
              
              {/* Horizontal Bar Chart (Partner Score Comparison) */}
              <div className="chart-card">
                <span className="section-label">Comparison</span>
                <h3 className="section-title">Partner Score Comparison</h3>
                <div style={{ marginTop: '16px', overflowY: 'auto', maxHeight: '380px' }}>
                  <ResponsiveContainer width="100%" height={Math.max(260, partnerComparison.length * 32)}>
                    <BarChart 
                      layout="vertical" 
                      data={partnerComparison} 
                      margin={{ top: 5, right: 10, left: 35, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: axisTickColor, fontSize: 10 }} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        tick={{ fill: axisTickColor, fontSize: 10, fontWeight: '500' }} 
                        width={110}
                        axisLine={false}
                        tickLine={false}
                      />
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
                      <Bar dataKey="score" fill={lineStrokeColor} radius={[0, 4, 4, 0]} barSize={14} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Line Chart (Monthly Trend) */}
              <div className="chart-card">
                <span className="section-label">Trend</span>
                <h3 className="section-title">Monthly Trend</h3>
                <div style={{ marginTop: '16px' }}>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                </div>
              </div>

            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Reports;
