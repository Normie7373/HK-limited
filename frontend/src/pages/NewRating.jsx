import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, X } from 'lucide-react';
import api from '../utils/api';
import useApi from '../hooks/useApi';
import { useToast } from '../hooks/useToast';
import { calculatePerformanceScore, getTier } from '../utils/scoreCalculator';
import TierBadge from '../components/TierBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import './NewRating.css';

const NewRating = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  // Form states
  const [partnerId, setPartnerId] = useState('');
  const [month, setMonth] = useState('');
  const [onTime, setOnTime] = useState('');
  const [damage, setDamage] = useState('');
  const [billing, setBilling] = useState('');
  const [feedback, setFeedback] = useState('');
  const [notes, setNotes] = useState('');

  // Fetch partners (only active partners for dropdown)
  const partnersApi = useApi(() => api.get('/api/transporters'));

  // Load existing rating if editing
  const loadRatingApi = useApi((id) => api.get(`/api/ratings/${id}`));

  const [weights, setWeights] = useState({
    on_time: 0.40,
    billing: 0.25,
    feedback: 0.25,
    damage: 0.10
  });

  useEffect(() => {
    // Load active transporters
    partnersApi.execute().catch(err => {
      console.error('Failed to load partners', err);
    });

    // Load dynamic scoring weights
    api.get('/api/settings/scoring-weights')
      .then(res => {
        if (res.data && res.data.success) {
          setWeights(res.data.data);
        }
      })
      .catch(err => {
        console.error('Failed to load weights', err);
      });

    if (editId) {
      loadRatingApi.execute(editId)
        .then(data => {
          setPartnerId(data.transporter_id);
          setMonth(data.rating_month);
          setOnTime(data.on_time_delivery_rate);
          setDamage(data.damage_incidents);
          setBilling(data.billing_accuracy);
          setFeedback(data.client_feedback_score);
          setNotes(data.notes || '');
        })
        .catch(err => {
          showToast(err.response?.data?.message || 'Failed to load rating record', 'error');
        });
    }
  }, [editId]);

  // Calculate live score
  const liveScore = calculatePerformanceScore(onTime, damage, billing, feedback, weights);
  const liveTier = getTier(liveScore);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validations
    if (!partnerId) return showToast('Please select a Transporter Partner', 'error');
    if (!/^\d{4}-\d{2}$/.test(month)) return showToast('Rating Month must be in YYYY-MM format', 'error');
    
    const parsedOnTime = parseFloat(onTime);
    if (isNaN(parsedOnTime) || parsedOnTime < 0 || parsedOnTime > 100) {
      return showToast('On-Time Delivery Rate must be between 0 and 100%', 'error');
    }

    const parsedDamage = parseInt(damage);
    if (isNaN(parsedDamage) || parsedDamage < 0) {
      return showToast('Damage Incidents must be 0 or greater', 'error');
    }

    const parsedBilling = parseFloat(billing);
    if (isNaN(parsedBilling) || parsedBilling < 0 || parsedBilling > 100) {
      return showToast('Billing Accuracy must be between 0 and 100%', 'error');
    }

    const parsedFeedback = parseFloat(feedback);
    if (isNaN(parsedFeedback) || parsedFeedback < 0 || parsedFeedback > 10) {
      return showToast('Client Feedback Score must be between 0.0 and 10.0', 'error');
    }

    const payload = {
      transporter_id: parseInt(partnerId),
      rating_month: month,
      on_time_delivery_rate: parsedOnTime,
      damage_incidents: parsedDamage,
      billing_accuracy: parsedBilling,
      client_feedback_score: parsedFeedback,
      notes
    };

    try {
      if (editId) {
        await api.put(`/api/ratings/${editId}`, payload);
        showToast('Performance rating record updated successfully', 'success');
      } else {
        await api.post('/api/ratings', payload);
        showToast('Performance rating record added successfully', 'success');
      }
      navigate('/records');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save rating record', 'error');
    }
  };

  const handleCancel = () => {
    navigate('/records');
  };

  const activePartners = (partnersApi.data || []).filter(p => p.is_active || p.id === parseInt(partnerId));

  // Determine live preview styles based on tier
  let previewClass = 'preview-poor';
  if (liveTier === 'EXCELLENT') previewClass = 'preview-excellent';
  else if (liveTier === 'GOOD') previewClass = 'preview-good';
  else if (liveTier === 'AVERAGE') previewClass = 'preview-average';

  return (
    <div className="new-rating-page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            type="button"
            onClick={handleCancel} 
            className="btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', minHeight: 'auto' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="page-label">Rating Entry</span>
            <h1 className="page-title">
              {editId ? 'Edit Performance Rating' : 'Add Performance Rating'}
            </h1>
          </div>
        </div>
      </div>

      {loadRatingApi.loading && <LoadingSpinner />}

      {(!editId || !loadRatingApi.loading) && (
        <div className="card rating-form-card">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Form row 1: Transporter Dropdown & Month Input */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Transporter Partner *</label>
                <select 
                  value={partnerId} 
                  onChange={(e) => setPartnerId(e.target.value)} 
                  required
                  disabled={!!editId} // Disable editing partner once saved
                >
                  <option value="">Select transporter...</option>
                  {activePartners.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.city})</option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Rating Month (YYYY-MM) *</label>
                <input 
                  type="text" 
                  placeholder="e.g. 2026-06" 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)} 
                  required
                  disabled={!!editId} // Disable editing month once saved
                />
              </div>
            </div>

            {/* Form row 2: KPIs */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">On-Time Delivery Rate (%) *</label>
                <div className="input-suffix-wrapper">
                  <input 
                    type="number" 
                    step="0.01"
                    min="0" 
                    max="100" 
                    placeholder="0.00 - 100.00"
                    value={onTime} 
                    onChange={(e) => setOnTime(e.target.value)} 
                    required
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Damage Incidents (damaged shipments) *</label>
                <input 
                  type="number" 
                  min="0" 
                  placeholder="0 or greater"
                  value={damage} 
                  onChange={(e) => setDamage(e.target.value)} 
                  required
                />
              </div>
            </div>

            {/* Form row 3: KPIs */}
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Billing Accuracy (%) *</label>
                <div className="input-suffix-wrapper">
                  <input 
                    type="number" 
                    step="0.01"
                    min="0" 
                    max="100" 
                    placeholder="0.00 - 100.00"
                    value={billing} 
                    onChange={(e) => setBilling(e.target.value)} 
                    required
                  />
                  <span className="input-suffix">%</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Client Feedback Score (out of 10) *</label>
                <div className="input-suffix-wrapper">
                  <input 
                    type="number" 
                    step="0.1"
                    min="0" 
                    max="10" 
                    placeholder="0.0 - 10.0"
                    value={feedback} 
                    onChange={(e) => setFeedback(e.target.value)} 
                    required
                  />
                  <span className="input-suffix">/10</span>
                </div>
              </div>
            </div>

            {/* Form row 4: Notes */}
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea 
                rows="3" 
                placeholder="Optional notes or details about the partner's performance during this month..."
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {/* Live Score Preview Box */}
            <div className={`live-preview-box ${previewClass}`}>
              <div className="preview-label">Live Score Preview</div>
              <div className="preview-value-row">
                <span className="preview-score-text">
                  Estimated Performance Score: <strong>{liveScore.toFixed(1)}</strong>
                </span>
                <TierBadge tier={liveTier} />
              </div>
            </div>

            {/* Buttons */}
            <div className="form-actions-row">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={handleCancel}
              >
                <X size={14} />
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <Save size={14} />
                Save Rating
              </button>
            </div>

          </form>
        </div>
      )}
    </div>
  );
};

export default NewRating;
