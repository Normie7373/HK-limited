import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, ClipboardList } from 'lucide-react';
import api from '../utils/api';
import useApi from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import TierBadge from '../components/TierBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatMonth, formatPercent, formatScore } from '../utils/formatters';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';

const MOCK_TRANSPORTER = {
  id: 1,
  name: 'Highway Pioneers',
  contact_person: 'Ramesh Kumar',
  phone: '9876543210',
  email: 'ramesh@highwaypioneers.com',
  city: 'Hyderabad',
  ratings: [
    { id: 1, rating_month: '2026-06', on_time_delivery_rate: 97.5, damage_incidents: 0, billing_accuracy: 98.5, client_feedback_score: 9.5, performance_score: 97.4, tier: 'EXCELLENT' },
    { id: 2, rating_month: '2026-05', on_time_delivery_rate: 96.2, damage_incidents: 1, billing_accuracy: 97.1, client_feedback_score: 9.2, performance_score: 95.8, tier: 'EXCELLENT' },
    { id: 3, rating_month: '2026-04', on_time_delivery_rate: 95.0, damage_incidents: 0, billing_accuracy: 96.5, client_feedback_score: 9.0, performance_score: 94.7, tier: 'EXCELLENT' }
  ]
};

const TransporterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const gridStroke = isDark ? '#1f2d44' : '#e5e7eb';
  const axisTickColor = isDark ? '#9ca3af' : '#6b7280';
  const lineStrokeColor = isDark ? '#3b82f6' : '#1d4ed8';
  const dotFillColor = isDark ? '#151f32' : '#ffffff';

  const detailsApi = useApi(() => api.get(`/api/transporters/${id}`));

  useEffect(() => {
    detailsApi.execute().catch(err => {
      showToast(err.response?.data?.message || 'Failed to fetch transporter details', 'error');
    });
  }, [id]);

  const isError = !!detailsApi.error;
  const isLoading = detailsApi.loading && !isError;
  const transporter = detailsApi.data || (isError ? MOCK_TRANSPORTER : {});
  const ratings = transporter.ratings || [];

  const handleUpdateStatus = async (newStatus) => {
    try {
      await api.put(`/api/transporters/${id}/status`, { status: newStatus });
      showToast(`Transporter status updated to ${newStatus}`, 'success');
      detailsApi.execute();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status', 'error');
    }
  };

  // Recharts line chart needs chronological order (month ascending)
  const chartData = [...ratings]
    .sort((a, b) => a.rating_month.localeCompare(b.rating_month))
    .map(r => ({
      month: r.rating_month,
      score: parseFloat(r.performance_score)
    }));

  const latestRating = ratings[0] || {};

  return (
    <div className="transporter-detail-page">
      {/* Page Header with Back Link */}
      <div className="page-header" style={{ alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={() => navigate('/transporters')} 
            className="btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', minHeight: 'auto' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="page-label">Transporter Profile</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 className="page-title" style={{ margin: '0' }}>{transporter.name}</h1>
              {latestRating.tier && <TierBadge tier={latestRating.tier} />}
              <span style={{
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                background: transporter.status === 'APPROVED' ? 'var(--badge-excellent-bg)' : (transporter.status === 'REJECTED' ? 'var(--badge-poor-bg)' : 'var(--badge-average-bg)'),
                color: transporter.status === 'APPROVED' ? 'var(--badge-excellent-text)' : (transporter.status === 'REJECTED' ? 'var(--badge-poor-text)' : 'var(--badge-average-text)'),
                textTransform: 'uppercase'
              }}>
                {transporter.status || 'PENDING'}
              </span>
            </div>
          </div>
        </div>
        {user?.role === 'MANAGER' && transporter.status === 'PENDING' && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn-secondary" 
              style={{ borderColor: '#dc2626', color: '#dc2626', background: '#fff' }}
              onClick={() => handleUpdateStatus('REJECTED')}
            >
              Reject Partner
            </button>
            <button 
              className="btn-primary" 
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
              onClick={() => handleUpdateStatus('APPROVED')}
            >
              Approve Partner
            </button>
          </div>
        )}
      </div>

      {isLoading && <LoadingSpinner />}

      {isError && (
        <div className="error-banner">
          Offline Mode: Displaying local mock profile and ratings. (Connection Error: {detailsApi.error})
        </div>
      )}

      {!isLoading && (
        <>
          {/* Top Metadata Cards Grid */}
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
            <div className="card text-card">
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <User size={13} /> Contact Person
              </span>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
                {transporter.contact_person || '—'}
              </div>
            </div>
            <div className="card text-card">
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Phone size={13} /> Phone Number
              </span>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
                {transporter.phone || '—'}
              </div>
            </div>
            <div className="card text-card">
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <Mail size={13} /> Email Address
              </span>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)', wordBreak: 'break-all' }}>
                {transporter.email || '—'}
              </div>
            </div>
            <div className="card text-card">
              <span className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <MapPin size={13} /> Operational City
              </span>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>
                {transporter.city || '—'}
              </div>
            </div>
          </div>

          {/* Two Columns: Performance Chart (Left 50%) & Rating History (Right 50%) OR Stacked */}
          {ratings.length === 0 ? (
            <EmptyState message="No performance ratings recorded for this transporter. Add a new rating to see historical analytics." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Score Trend Chart */}
              <div className="card">
                <span className="section-label">Analytics</span>
                <h3 className="section-title">Performance Score Trend</h3>
                <div style={{ marginTop: '16px' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                        dataKey="score" 
                        stroke={lineStrokeColor} 
                        strokeWidth={2}
                        dot={{ r: 4, stroke: lineStrokeColor, strokeWidth: 2, fill: dotFillColor }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Performance History Table */}
              <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
                <div style={{ padding: '20px 20px 0 20px' }}>
                  <span className="section-label">Ratings Log</span>
                  <h3 className="section-title">Historical Ratings</h3>
                </div>
                <div className="table-responsive">
                  <table>
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>On-Time %</th>
                        <th>Damage Incidents</th>
                        <th>Billing %</th>
                        <th>Client Feedback</th>
                        <th>Performance Score</th>
                        <th>Tier</th>
                        <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ratings.map(r => (
                        <tr key={r.id}>
                          <td style={{ fontWeight: '600' }}>{formatMonth(r.rating_month)}</td>
                          <td>{formatPercent(r.on_time_delivery_rate)}</td>
                          <td>
                            <span style={{ 
                              color: r.damage_incidents >= 5 ? '#dc2626' : '#111827', 
                              fontWeight: r.damage_incidents >= 5 ? '700' : 'normal' 
                            }}>
                              {r.damage_incidents}
                            </span>
                          </td>
                          <td>{formatPercent(r.billing_accuracy)}</td>
                          <td>{formatScore(r.client_feedback_score)}/10</td>
                          <td style={{ fontWeight: '700', color: '#111827' }}>
                            {formatScore(r.performance_score)}
                          </td>
                          <td>
                            <TierBadge tier={r.tier} />
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {['ADMIN', 'OPERATIONS'].includes(user?.role) && (
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '11px' }}
                                onClick={() => navigate(`/new-rating?edit=${r.id}`)}
                              >
                                Edit Rating
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TransporterDetail;
