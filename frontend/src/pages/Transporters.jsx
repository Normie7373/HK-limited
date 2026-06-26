import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Edit, Eye, X } from 'lucide-react';
import api from '../utils/api';
import useApi from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import TierBadge from '../components/TierBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatScore } from '../utils/formatters';

const Transporters = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransporter, setEditingTransporter] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    city: '',
    is_active: true
  });

  const transportersApi = useApi(() => api.get('/api/transporters'));

  const loadTransporters = () => {
    transportersApi.execute().catch(err => {
      showToast(err.response?.data?.message || 'Failed to fetch transporters', 'error');
    });
  };

  useEffect(() => {
    loadTransporters();
  }, []);

  const handleOpenAddModal = () => {
    setEditingTransporter(null);
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      city: '',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t, e) => {
    e.stopPropagation(); // Avoid row click navigate trigger
    setEditingTransporter(t);
    setFormData({
      name: t.name,
      contact_person: t.contact_person || '',
      phone: t.phone || '',
      email: t.email || '',
      city: t.city || '',
      is_active: t.is_active
    });
    setIsModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      return showToast('Transporter name is required', 'error');
    }

    try {
      if (editingTransporter) {
        // Edit API PUT /api/transporters/:id
        await api.put(`/api/transporters/${editingTransporter.id}`, formData);
        showToast('Transporter updated successfully', 'success');
      } else {
        // Add API POST /api/transporters
        await api.post('/api/transporters', formData);
        showToast('Transporter added successfully', 'success');
      }
      setIsModalOpen(false);
      loadTransporters();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save transporter', 'error');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to deactivate this transporter partner?')) return;
    try {
      await api.delete(`/api/transporters/${id}`);
      showToast('Transporter deactivated successfully', 'success');
      loadTransporters();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to deactivate transporter', 'error');
    }
  };

  const handleRowClick = (id) => {
    navigate(`/transporters/${id}`);
  };

  // Filter transporters list
  const list = transportersApi.data || [];
  const filteredList = list.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.city && t.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.contact_person && t.contact_person.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="transporters-page">
      <div className="page-header">
        <div>
          <span className="page-label">Management</span>
          <h1 className="page-title">Transporters</h1>
        </div>
        {user?.role === 'ADMIN' && (
          <button className="btn-primary" onClick={handleOpenAddModal}>
            <Plus size={14} />
            Add Transporter
          </button>
        )}
      </div>

      {/* Search Input Bar */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <input 
          type="text" 
          placeholder="Search transporters by name, city, or contact..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '38px' }}
        />
        <Search 
          size={16} 
          style={{ 
            position: 'absolute', 
            left: '12px', 
            top: '50%', 
            transform: 'translateY(-50%)', 
            color: '#9ca3af' 
          }} 
        />
      </div>

      {transportersApi.loading && <LoadingSpinner />}

      {!transportersApi.loading && transportersApi.error && (
        <div className="error-banner">
          Failed to load transporters: {transportersApi.error}
        </div>
      )}

      {!transportersApi.loading && !transportersApi.error && (
        <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
          {filteredList.length === 0 ? (
            <div style={{ padding: '24px' }}>
              <EmptyState message="No transporters found matching your criteria. Try adjusting your search term." />
            </div>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Partner Name</th>
                    <th>City</th>
                    <th>Contact</th>
                    <th>Latest Score</th>
                    <th>Tier</th>
                    <th>Records</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map(t => (
                    <tr 
                      key={t.id} 
                      onClick={() => handleRowClick(t.id)} 
                      className="clickable-row"
                    >
                      <td style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                        {t.name}
                      </td>
                      <td>{t.city || 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{t.contact_person || 'N/A'}</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-sub)' }}>{t.email || t.phone || ''}</span>
                        </div>
                      </td>
                      <td style={{ fontWeight: '700' }}>
                        {t.latest_score !== null ? formatScore(t.latest_score) : '—'}
                      </td>
                      <td>
                        {t.latest_tier ? <TierBadge tier={t.latest_tier} /> : <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No ratings</span>}
                      </td>
                      <td>{t.records_count}</td>
                      <td>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '600',
                          background: t.status === 'APPROVED' ? 'var(--badge-excellent-bg)' : (t.status === 'REJECTED' ? 'var(--badge-poor-bg)' : 'var(--badge-average-bg)'),
                          color: t.status === 'APPROVED' ? 'var(--badge-excellent-text)' : (t.status === 'REJECTED' ? 'var(--badge-poor-text)' : 'var(--badge-average-text)'),
                          textTransform: 'uppercase'
                        }}>
                          {t.status || 'PENDING'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
                          <button 
                            className="btn-secondary" 
                            style={{ padding: '6px 10px', fontSize: '12px' }}
                            onClick={() => handleRowClick(t.id)}
                          >
                            <Eye size={12} />
                            View
                          </button>
                          {user?.role === 'ADMIN' && (
                            <button 
                              className="btn-secondary" 
                              style={{ padding: '6px 10px', fontSize: '12px' }}
                              onClick={(e) => handleOpenEditModal(t, e)}
                            >
                              <Edit size={12} />
                              Edit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Transporter Modal Overlay */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTransporter ? 'Edit Transporter Partner' : 'Add Transporter Partner'}
              </h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Partner Name *</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="e.g. SpeedLines Logistics"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contact Person *</label>
                  <input 
                    type="text" 
                    name="contact_person" 
                    value={formData.contact_person} 
                    onChange={handleInputChange} 
                    required
                    placeholder="e.g. Anil Kumar"
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input 
                      type="text" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      required
                      placeholder="e.g. 9876543210"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleInputChange} 
                      required
                      placeholder="e.g. contact@speedlines.com"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input 
                    type="text" 
                    name="city" 
                    value={formData.city} 
                    onChange={handleInputChange} 
                    required
                    placeholder="e.g. Hyderabad"
                  />
                </div>

                {editingTransporter && (
                  <div className="form-group-checkbox">
                    <input 
                      type="checkbox" 
                      id="is_active" 
                      name="is_active" 
                      checked={formData.is_active} 
                      onChange={handleInputChange}
                      style={{ width: 'auto', marginRight: '8px' }}
                    />
                    <label htmlFor="is_active" style={{ fontSize: '13px', fontWeight: '500', color: '#374151', cursor: 'pointer' }}>
                      Partner Active Status (uncheck to mark as Inactive)
                    </label>
                  </div>
                )}
              </div>
              
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTransporter ? 'Update Partner' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
          
          <style>{`
            .modal-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(17, 24, 39, 0.4);
              backdrop-filter: blur(2px);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1000;
              animation: fadeIn 0.15s ease;
            }
            .modal-container {
              background: #ffffff;
              border-radius: 8px;
              width: 100%;
              max-width: 500px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.15);
              overflow: hidden;
              animation: slideUp 0.2s ease;
            }
            .modal-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 16px 20px;
              border-bottom: 1px solid #e5e7eb;
            }
            .modal-title {
              font-size: 16px;
              font-weight: 700;
              color: #111827;
            }
            .modal-close {
              background: none;
              border: none;
              color: #9ca3af;
              cursor: pointer;
              display: flex;
              align-items: center;
              padding: 4px;
            }
            .modal-body {
              padding: 20px;
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .form-group {
              display: flex;
              flex-direction: column;
              gap: 6px;
            }
            .form-group-checkbox {
              display: flex;
              align-items: center;
              margin-top: 4px;
            }
            .form-label {
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              color: #6b7280;
              letter-spacing: 0.5px;
            }
            .form-row-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }
            .modal-footer {
              padding: 14px 20px;
              background: #f9fafb;
              border-top: 1px solid #e5e7eb;
              display: flex;
              justify-content: flex-end;
              gap: 10px;
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { transform: translateY(12px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};

export default Transporters;
