import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Truck, 
  ClipboardList, 
  PlusCircle, 
  BarChart3, 
  AlertTriangle,
  Settings,
  LogOut,
  Receipt,
  Sun,
  Moon,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../utils/api';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [weights, setWeights] = useState({
    on_time: 0.40,
    billing: 0.25,
    feedback: 0.25,
    damage: 0.10
  });

  const loadWeights = async () => {
    try {
      const response = await api.get('/api/settings/scoring-weights');
      setWeights(response.data.data);
    } catch (err) {
      console.error('Failed to load weights in sidebar', err);
    }
  };

  useEffect(() => {
    loadWeights();
    
    // Listen for system settings updates
    window.addEventListener('settings-updated', loadWeights);
    return () => {
      window.removeEventListener('settings-updated', loadWeights);
    };
  }, []);

  // Helper to handle link click (closes menu on mobile layout)
  const handleLinkClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="logo-block">
        <div className="logo-sq">HK</div>
        <div className="logo-text">
          <span className="logo-company">HK Shipping</span>
          <span className="logo-sub">PERFORMANCE CONSOLE</span>
        </div>
        {/* Mobile Close Button */}
        <button 
          className="sidebar-close-btn" 
          onClick={onClose} 
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <NavLink 
          to="/" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          end
          onClick={handleLinkClick}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink 
          to="/transporters" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <Truck size={18} />
          <span>Transporters</span>
        </NavLink>
        <NavLink 
          to="/records" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <ClipboardList size={18} />
          <span>Records</span>
        </NavLink>
        <NavLink 
          to="/billing" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <Receipt size={18} />
          <span>Billing</span>
        </NavLink>
        
        {/* Only Operations and Admin can add records */}
        {['ADMIN', 'OPERATIONS'].includes(user?.role) && (
          <NavLink 
            to="/new-rating" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <PlusCircle size={18} />
            <span>+ New Rating</span>
          </NavLink>
        )}
        
        <NavLink 
          to="/reports" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <BarChart3 size={18} />
          <span>Reports</span>
        </NavLink>
        <NavLink 
          to="/alerts" 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={handleLinkClick}
        >
          <AlertTriangle size={18} />
          <span>Alerts</span>
        </NavLink>

        {/* Admin Configuration link */}
        {user?.role === 'ADMIN' && (
          <NavLink 
            to="/settings" 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <Settings size={18} />
            <span>Settings</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="weights-label">Scoring weights</div>
        <div className="weights-values">
          On-Time {Math.round(weights.on_time * 100)}% · Billing {Math.round(weights.billing * 100)}% · Feedback {Math.round(weights.feedback * 100)}% · Damage {Math.round(weights.damage * 100)}%
        </div>
      </div>

      <div className="user-profile-section">
        <div className="user-profile-info">
          <span className="user-username">{user?.username}</span>
          <span className="user-role">{user?.role?.toLowerCase()}</span>
        </div>
        <div className="sidebar-actions-row">
          <button 
            onClick={toggleTheme} 
            className="theme-toggle-btn" 
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <button onClick={logout} className="logout-btn" title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
