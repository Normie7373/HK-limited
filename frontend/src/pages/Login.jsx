import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/useToast';
import { Lock, User, LogIn, ShieldCheck } from 'lucide-react';
import './Login.css';

const Login = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      return showToast('Username and password are required', 'error');
    }

    setLoading(true);
    try {
      await login(username.trim(), password.trim());
      showToast('Logged in successfully', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.message || 'Invalid username or password', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-sq" style={{ margin: '0 auto 16px auto', width: '48px', height: '48px', fontSize: '20px', borderRadius: '12px' }}>HK</div>
          <h2>HK Shipping Console</h2>
          <p>Sign in to manage transporter performance and metrics</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username or Email</label>
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

          <button type="submit" className="btn-primary login-btn" disabled={loading}>
            <LogIn size={16} style={{ marginRight: '6px' }} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
          <div className="roles-hint">
            <ShieldCheck size={12} style={{ marginRight: '4px' }} />
            <span>Default logins: <strong>admin</strong> / <strong>ops</strong> / <strong>manager</strong> (password: <strong>password</strong>)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
