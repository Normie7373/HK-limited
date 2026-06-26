import React, { useEffect, useState } from 'react';
import './Billing.css';
import { 
  Receipt, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Info,
  Calendar,
  AlertTriangle,
  Lock
} from 'lucide-react';
import api from '../utils/api';
import useApi from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../utils/formatters';

const Billing = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Permissions helper
  const canModify = ['ADMIN', 'OPERATIONS'].includes(user?.role);
  const canDelete = user?.role === 'ADMIN';

  // Filters State
  const [partnerFilter, setPartnerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    invoice_number: '',
    transporter_id: '',
    amount: '',
    paid_amount: '0',
    payment_date: '',
    status: 'PENDING',
    dispute_reason: ''
  });

  // Fetch API handlers
  const partnersApi = useApi(() => api.get('/api/transporters'));
  const invoicesApi = useApi(() => 
    api.get('/api/invoices', {
      params: {
        transporter_id: partnerFilter || undefined,
        status: statusFilter || undefined,
        search: searchFilter || undefined
      }
    })
  );

  const loadData = () => {
    invoicesApi.execute().catch(err => {
      showToast(err.response?.data?.message || 'Failed to fetch billing records', 'error');
    });
  };

  useEffect(() => {
    partnersApi.execute().catch(err => console.error('Failed to load transporters', err));
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [partnerFilter, statusFilter, searchFilter]);

  // Handle opening modal for CREATE
  const handleOpenAddModal = () => {
    if (!canModify) return;
    setEditingInvoice(null);
    setFormData({
      invoice_number: '',
      transporter_id: '',
      amount: '',
      paid_amount: '0',
      payment_date: '',
      status: 'PENDING',
      dispute_reason: ''
    });
    setIsModalOpen(true);
  };

  // Handle opening modal for EDIT
  const handleOpenEditModal = (invoice) => {
    if (!canModify) return;
    setEditingInvoice(invoice);
    setFormData({
      invoice_number: invoice.invoice_number,
      transporter_id: invoice.transporter_id,
      amount: invoice.amount.toString(),
      paid_amount: invoice.paid_amount.toString(),
      payment_date: invoice.payment_date ? invoice.payment_date.substring(0, 10) : '',
      status: invoice.status,
      dispute_reason: invoice.dispute_reason || ''
    });
    setIsModalOpen(true);
  };

  // Form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto logic based on status
      if (name === 'status') {
        if (value === 'PAID') {
          updated.paid_amount = updated.amount;
          if (!updated.payment_date) {
            updated.payment_date = new Date().toISOString().substring(0, 10);
          }
          updated.dispute_reason = '';
        } else if (value === 'PENDING' || value === 'DISPUTED') {
          updated.paid_amount = '0';
          updated.payment_date = '';
        }
      }

      // Auto update status if amounts change
      if (name === 'amount' || name === 'paid_amount') {
        const amt = parseFloat(updated.amount || 0);
        const paid = parseFloat(updated.paid_amount || 0);
        
        if (amt > 0) {
          if (paid >= amt) {
            updated.status = 'PAID';
            if (!updated.payment_date) {
              updated.payment_date = new Date().toISOString().substring(0, 10);
            }
            updated.dispute_reason = '';
          } else if (paid > 0 && paid < amt) {
            updated.status = 'PARTIALLY_PAID';
            if (!updated.payment_date) {
              updated.payment_date = new Date().toISOString().substring(0, 10);
            }
            updated.dispute_reason = '';
          } else {
            // paid === 0
            if (updated.status === 'PAID' || updated.status === 'PARTIALLY_PAID') {
              updated.status = 'PENDING';
              updated.payment_date = '';
            }
          }
        }
      }

      return updated;
    });
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canModify) return;

    const { invoice_number, transporter_id, amount, paid_amount, payment_date, status, dispute_reason } = formData;

    if (!invoice_number.trim()) {
      return showToast('Invoice number is required', 'error');
    }
    if (!transporter_id) {
      return showToast('Transporter partner is required', 'error');
    }
    
    const parsedAmount = parseFloat(amount);
    const parsedPaid = parseFloat(paid_amount || 0);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return showToast('Invoice amount must be a positive number', 'error');
    }
    if (isNaN(parsedPaid) || parsedPaid < 0) {
      return showToast('Paid amount cannot be negative', 'error');
    }
    if (parsedPaid > parsedAmount) {
      return showToast('Paid amount cannot exceed total invoice amount', 'error');
    }
    if (status === 'DISPUTED' && !dispute_reason.trim()) {
      return showToast('Please enter a dispute reason for DISPUTED status', 'error');
    }

    try {
      const payload = {
        invoice_number: invoice_number.trim(),
        transporter_id: parseInt(transporter_id),
        amount: parsedAmount,
        paid_amount: parsedPaid,
        payment_date: payment_date || null,
        status,
        dispute_reason: status === 'DISPUTED' ? dispute_reason.trim() : null
      };

      if (editingInvoice) {
        await api.put(`/api/invoices/${editingInvoice.id}`, payload);
        showToast('Invoice updated successfully', 'success');
      } else {
        await api.post('/api/invoices', payload);
        showToast('Invoice created successfully', 'success');
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save invoice record', 'error');
    }
  };

  // Delete Invoice Record
  const handleDeleteInvoice = async (id, invoiceNum) => {
    if (!canDelete) return;
    if (!window.confirm(`Are you sure you want to permanently delete invoice ${invoiceNum}? This action cannot be undone.`)) return;

    try {
      await api.delete(`/api/invoices/${id}`);
      showToast('Invoice record deleted successfully', 'success');
      loadData();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete invoice', 'error');
    }
  };

  // Calculate stats from loaded list (filtered or unfiltered)
  const invoices = invoicesApi.data || [];
  const partners = partnersApi.data || [];

  const totalInvoiced = invoices.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const totalSettled = invoices.reduce((sum, item) => sum + parseFloat(item.paid_amount || 0), 0);
  const totalOutstanding = invoices.reduce((sum, item) => sum + (parseFloat(item.amount || 0) - parseFloat(item.paid_amount || 0)), 0);
  const disputedCount = invoices.filter(item => item.status === 'DISPUTED').length;

  return (
    <div className="billing-page">
      <div className="page-header">
        <div>
          <span className="page-label">Financials Tracking</span>
          <h1 className="page-title">Payment & Billing Tracker</h1>
        </div>
        {canModify && (
          <button className="btn-primary" onClick={handleOpenAddModal}>
            <Plus size={14} />
            Log Invoice
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <StatCard 
          label="Total Invoiced" 
          value={formatCurrency(totalInvoiced)} 
          subtext="Total invoiced transporter fees" 
          icon={Receipt} 
          type="blue" 
        />
        <StatCard 
          label="Total Settled" 
          value={formatCurrency(totalSettled)} 
          subtext="Total amount paid to date" 
          icon={CheckCircle} 
          type="green" 
        />
        <StatCard 
          label="Outstanding Balance" 
          value={formatCurrency(totalOutstanding)} 
          subtext="Total unpaid pending amounts" 
          icon={TrendingUp} 
          type="amber" 
        />
        <StatCard 
          label="Disputed Invoices" 
          value={disputedCount.toString()} 
          subtext="Active payment disputes logged" 
          icon={AlertCircle} 
          type="red" 
        />
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
            <label className="page-label" style={{ fontSize: '10px', marginBottom: '6px' }}>Transporter</label>
            <select value={partnerFilter} onChange={(e) => setPartnerFilter(e.target.value)}>
              <option value="">All partners</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="page-label" style={{ fontSize: '10px', marginBottom: '6px' }}>Payment Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="PAID">Paid</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PENDING">Pending</option>
              <option value="DISPUTED">Disputed</option>
            </select>
          </div>

          {/* Search bar */}
          <div style={{ gridColumn: 'span 2' }}>
            <label className="page-label" style={{ fontSize: '10px', marginBottom: '6px' }}>Search</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="Search by invoice number..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{ paddingLeft: '32px' }}
              />
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
            </div>
          </div>
        </div>
      </div>

      {invoicesApi.loading && <LoadingSpinner />}

      {!invoicesApi.loading && invoicesApi.error && (
        <div className="error-banner">
          Failed to load invoices: {invoicesApi.error}
        </div>
      )}

      {!invoicesApi.loading && !invoicesApi.error && (
        <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
          {invoices.length === 0 ? (
            <div style={{ padding: '24px' }}>
              <EmptyState message="No billing logs found. Try modifying your filter conditions or log a new invoice." />
            </div>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Invoice Number</th>
                    <th>Transporter</th>
                    <th>Total Amount</th>
                    <th>Paid Amount</th>
                    <th>Pending</th>
                    <th>Payment Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(invoice => {
                    const pendingAmount = parseFloat(invoice.amount) - parseFloat(invoice.paid_amount);
                    
                    return (
                      <tr key={invoice.id}>
                        <td style={{ fontWeight: '700', color: '#111827' }}>
                          {invoice.invoice_number}
                        </td>
                        <td style={{ fontWeight: '600' }}>
                          {invoice.transporter_name}
                        </td>
                        <td>{formatCurrency(invoice.amount)}</td>
                        <td style={{ color: isDark ? '#4ade80' : '#16a34a' }}>{formatCurrency(invoice.paid_amount)}</td>
                        <td style={{ 
                          fontWeight: '600',
                          color: pendingAmount > 0 ? (isDark ? '#fbbf24' : '#d97706') : (isDark ? '#9ca3af' : '#6b7280')
                        }}>
                          {formatCurrency(pendingAmount)}
                        </td>
                        <td>
                          {invoice.payment_date ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={13} style={{ color: isDark ? '#9ca3af' : '#9ca3af' }} />
                              {new Date(invoice.payment_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          ) : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{
                              alignSelf: 'flex-start',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '600',
                              background: 
                                invoice.status === 'PAID' ? (isDark ? 'rgba(22, 163, 74, 0.2)' : '#dcfce7') : 
                                invoice.status === 'PARTIALLY_PAID' ? (isDark ? 'rgba(99, 102, 241, 0.2)' : '#e0e7ff') :
                                invoice.status === 'PENDING' ? (isDark ? 'rgba(217, 119, 6, 0.2)' : '#fef3c7') : (isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2'),
                              color: 
                                invoice.status === 'PAID' ? (isDark ? '#4ade80' : '#15803d') : 
                                invoice.status === 'PARTIALLY_PAID' ? (isDark ? '#818cf8' : '#4338ca') :
                                invoice.status === 'PENDING' ? (isDark ? '#fbbf24' : '#b45309') : (isDark ? '#f87171' : '#b91c1c'),
                              textTransform: 'uppercase'
                            }}>
                              {invoice.status}
                            </span>
                            {invoice.status === 'DISPUTED' && invoice.dispute_reason && (
                              <span style={{ 
                                fontSize: '11px', 
                                color: isDark ? '#f87171' : '#b91c1c', 
                                fontStyle: 'italic',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px',
                                maxWidth: '240px',
                                lineBreak: 'anywhere'
                              }}>
                                <AlertTriangle size={10} />
                                {invoice.dispute_reason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {canModify ? (
                              <button 
                                className="btn-secondary" 
                                style={{ padding: '6px 10px', fontSize: '12px' }}
                                onClick={() => handleOpenEditModal(invoice)}
                                title="Edit Invoice Details"
                              >
                                <Edit size={12} />
                                Edit
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Lock size={10} /> Read-only
                              </span>
                            )}
                            {canDelete && (
                              <button 
                                className="btn-secondary" 
                                style={{ 
                                  padding: '6px 10px', 
                                  fontSize: '12px',
                                  color: '#dc2626',
                                  borderColor: '#fee2e2'
                                }}
                                onClick={() => handleDeleteInvoice(invoice.id, invoice.invoice_number)}
                                title="Delete Invoice Record"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invoice Editor Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingInvoice ? 'Edit Transporter Invoice' : 'Log Transporter Invoice'}
              </h3>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                
                {/* Invoice Number */}
                <div className="form-group">
                  <label className="form-label">Invoice Number *</label>
                  <input 
                    type="text" 
                    name="invoice_number" 
                    value={formData.invoice_number} 
                    onChange={handleInputChange} 
                    required 
                    placeholder="e.g. INV-2026-042"
                    disabled={!!editingInvoice} // Disallow changing invoice number once created
                  />
                </div>

                {/* Transporter Select */}
                <div className="form-group">
                  <label className="form-label">Transporter Partner *</label>
                  <select
                    name="transporter_id"
                    value={formData.transporter_id}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingInvoice} // Disallow changing transporter once logged
                  >
                    <option value="">Select transporter...</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Amount Row */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Total Amount (₹) *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      name="amount" 
                      value={formData.amount} 
                      onChange={handleInputChange} 
                      required
                      placeholder="Total invoiced"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Paid Amount (₹) *</label>
                    <input 
                      type="number" 
                      step="0.01"
                      name="paid_amount" 
                      value={formData.paid_amount} 
                      onChange={handleInputChange} 
                      required
                      placeholder="Amount settled"
                    />
                  </div>
                </div>

                {/* Auto Pending Calculation Display */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#f9fafb',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb',
                  fontSize: '13px'
                }}>
                  <span style={{ fontWeight: '500', color: '#4b5563' }}>Computed Pending Balance:</span>
                  <span style={{ 
                    fontWeight: '700', 
                    color: (parseFloat(formData.amount || 0) - parseFloat(formData.paid_amount || 0)) > 0 ? '#d97706' : '#16a34a' 
                  }}>
                    {formatCurrency(parseFloat(formData.amount || 0) - parseFloat(formData.paid_amount || 0))}
                  </span>
                </div>

                {/* Payment Date & Status */}
                <div className="form-row-2">
                  <div className="form-group">
                    <label className="form-label">Payment Date</label>
                    <input 
                      type="date" 
                      name="payment_date" 
                      value={formData.payment_date} 
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Payment Status *</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PARTIALLY_PAID">Partially Paid</option>
                      <option value="PAID">Paid</option>
                      <option value="DISPUTED">Disputed</option>
                    </select>
                  </div>
                </div>

                {/* Dispute Reason */}
                {formData.status === 'DISPUTED' && (
                  <div className="form-group">
                    <label className="form-label">Dispute Reason *</label>
                    <textarea 
                      name="dispute_reason" 
                      value={formData.dispute_reason} 
                      onChange={handleInputChange} 
                      required 
                      rows={3}
                      placeholder="Explain the reason for payment hold or rate dispute..."
                    />
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
                  {editingInvoice ? 'Update Record' : 'Save Invoice'}
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
              background: var(--modal-overlay);
              backdrop-filter: blur(2px);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1000;
              animation: fadeIn 0.15s ease;
            }
            .modal-container {
              background: var(--modal-bg);
              border-radius: 8px;
              width: 100%;
              max-width: 500px;
              box-shadow: var(--shadow-md);
              overflow: hidden;
              animation: slideUp 0.2s ease;
            }
            .modal-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 16px 20px;
              border-bottom: 1px solid var(--border-color);
            }
            .modal-title {
              font-size: 16px;
              font-weight: 700;
              color: var(--text-main);
            }
            .modal-close {
              background: none;
              border: none;
              color: var(--text-muted);
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
            .form-label {
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              color: var(--text-sub);
              letter-spacing: 0.5px;
            }
            .form-row-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
            }
            .modal-footer {
              padding: 14px 20px;
              background: var(--modal-footer-bg);
              border-top: 1px solid var(--border-color);
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

export default Billing;
