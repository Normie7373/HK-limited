import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { Lock, User, Mail, Shield, UserPlus } from 'lucide-react';
import './Login.css'; // Share login styling rules

const Register = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      return showToast('All fields are required', 'error');
    }

    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password.trim());
      showToast('Registration successful', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-sq" style={{ margin: '0 auto 16px auto', width: '48px', height: '48px', fontSize: '20px', borderRadius: '12px' }}>HK</div>
          <h2>Create Account</h2>
          <p>Join the HK Shipping Performance Rating Console</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <div className="input-wrapper">
              <User className="input-icon" size={16} />
              <input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={16} />
              <input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={16} />
              <input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Shield size={20} style={{ color: '#1d4ed8', flexShrink: 0 }} />
            <p style={{ fontSize: '11px', color: '#4b5563', margin: 0, lineHeight: '1.4' }}>
              <strong>Notice:</strong> Your user role is pre-authorized by your administrator. Registration requires a whitelisted company email address.
            </p>
          </div>

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            <UserPlus size={16} style={{ marginRight: '6px' }} />
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="login-footer">
          <p>Already have an account? <Link to="/login">Sign in here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
