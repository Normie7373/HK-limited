import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import api from '../utils/api';
import useApi from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import TierBadge from '../components/TierBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatMonth, formatPercent, formatScore } from '../utils/formatters';

const Records = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Filters state
  const [partnerFilter, setPartnerFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Fetch lists
  const partnersApi = useApi(() => api.get('/api/transporters'));
  const ratingsApi = useApi(() => 
    api.get('/api/ratings', {
      params: {
        transporter_id: partnerFilter || undefined,
        month: monthFilter || undefined,
        tier: tierFilter || undefined,
        search: searchFilter || undefined,
        page,
        limit
      }
    })
  );

  const loadData = () => {
    ratingsApi.execute().catch(err => {
      showToast(err.response?.data?.message || 'Failed to fetch rating records', 'error');
    });
  };

  useEffect(() => {
    partnersApi.execute().catch(err => console.error(err));
  }, []);

  useEffect(() => {
    loadData();
  }, [partnerFilter, monthFilter, tierFilter, searchFilter, page]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this performance rating record? This will also remove any unresolved alerts for this period.')) return;
    
    try {
      await api.delete(`/api/ratings/${id}`);
      showToast('Performance rating record deleted successfully', 'success');
      // If deleting the last item on the page, go to previous page
      if (ratingsApi.data?.length === 1 && page > 1) {
        setPage(prev => prev - 1);
      } else {
        loadData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete record', 'error');
    }
  };

  const partners = partnersApi.data || [];
  const ratings = ratingsApi.data || [];
  const pagination = ratingsApi.pagination || { total: 0, pages: 1, page: 1 };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1); // Reset to page 1 on filter edit
  };

  return (
    <div className="records-page">
      <div className="page-header">
        <div>
          <span className="page-label">Historical Log</span>
          <h1 className="page-title">Performance Records</h1>
        </div>
        <button className="btn-primary" onClick={() => navigate('/new-rating')}>
          <Plus size={14} />
          New Rating
        </button>
      </div>

      {/* Filters Row */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {/* Partner Selector */}
          <div>
            <label className="page-label" style={{ fontSize: '10px', marginBottom: '6px' }}>Partner</label>
            <select value={partnerFilter} onChange={handleFilterChange(setPartnerFilter)}>
              <option value="">All partners</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Month input YYYY-MM */}
          <div>
            <label className="page-label" style={{ fontSize: '10px', marginBottom: '6px' }}>Month (YYYY-MM)</label>
            <input 
              type="text" 
              placeholder="e.g. 2026-06"
              value={monthFilter}
              onChange={handleFilterChange(setMonthFilter)}
            />
          </div>

          {/* Tier Dropdown */}
          <div>
            <label className="page-label" style={{ fontSize: '10px', marginBottom: '6px' }}>Tier</label>
            <select value={tierFilter} onChange={handleFilterChange(setTierFilter)}>
              <option value="">All tiers</option>
              <option value="EXCELLENT">Excellent</option>
              <option value="GOOD">Good</option>
              <option value="AVERAGE">Average</option>
              <option value="POOR">Poor</option>
            </select>
          </div>

          {/* Search bar */}
          <div>
            <label className="page-label" style={{ fontSize: '10px', marginBottom: '6px' }}>Search</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search notes..."
                value={searchFilter}
                onChange={handleFilterChange(setSearchFilter)}
                style={{ paddingLeft: '32px' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            </div>
          </div>
        </div>
      </div>

      {ratingsApi.loading && <LoadingSpinner />}

      {!ratingsApi.loading && ratingsApi.error && (
        <div className="error-banner">
          Failed to load records: {ratingsApi.error}
        </div>
      )}

      {!ratingsApi.loading && !ratingsApi.error && (
        <>
          <div className="card" style={{ padding: '0px', overflow: 'hidden', marginBottom: '20px' }}>
            {ratings.length === 0 ? (
              <div style={{ padding: '24px' }}>
                <EmptyState message="No ratings match your filters. Try selecting different filters or clearing search terms." />
              </div>
            ) : (
              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Partner</th>
                      <th>Month</th>
                      <th>On-Time %</th>
                      <th>Damage</th>
                      <th>Billing %</th>
                      <th>Feedback</th>
                      <th>Score</th>
                      <th>Tier</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratings.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                          {r.transporter_name}
                        </td>
                        <td style={{ fontWeight: '600' }}>{formatMonth(r.rating_month)}</td>
                        <td>{formatPercent(r.on_time_delivery_rate)}</td>
                        <td>
                          <span style={{ 
                            color: r.damage_incidents >= 5 ? '#ef4444' : 'var(--text-main)', 
                            fontWeight: r.damage_incidents >= 5 ? '700' : 'normal' 
                          }}>
                            {r.damage_incidents}
                          </span>
                        </td>
                        <td>{formatPercent(r.billing_accuracy)}</td>
                        <td>{formatScore(r.client_feedback_score)}/10</td>
                        <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                          {formatScore(r.performance_score)}
                        </td>
                        <td>
                          <TierBadge tier={r.tier} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '6px', minHeight: 'auto' }}
                              onClick={() => navigate(`/new-rating?edit=${r.id}`)}
                              title="Edit Record"
                            >
                              <Edit size={12} />
                            </button>
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '6px', minHeight: 'auto', border: '1px solid var(--border-color)', color: '#ef4444' }}
                              onClick={(e) => handleDelete(r.id, e)}
                              title="Delete Record"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {ratings.length > 0 && pagination.pages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 24px',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
            }}>
              <span style={{ fontSize: '13px', color: '#6b7280' }}>
                Showing page <strong style={{ color: '#111827' }}>{page}</strong> of <strong style={{ color: '#111827' }}>{pagination.pages}</strong> ({pagination.total} records total)
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft size={14} />
                  Prev
                </button>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '6px 10px', fontSize: '12px' }}
                  onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={page === pagination.pages}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Records;
