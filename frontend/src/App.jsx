import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import { ToastProvider } from './hooks/useToast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages imports
import Dashboard from './pages/Dashboard';
import Transporters from './pages/Transporters';
import TransporterDetail from './pages/TransporterDetail';
import Records from './pages/Records';
import NewRating from './pages/NewRating';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import Login from './pages/Login';
import Register from './pages/Register';
import Settings from './pages/Settings';
import Billing from './pages/Billing';

import './App.css';

function AppContent() {
  const { token, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return null;
  }

  // If not logged in, only expose auth routes
  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-active' : ''}`}>
      {/* Mobile Top Bar Header */}
      <header className="mobile-header">
        <button 
          onClick={() => setSidebarOpen(true)} 
          className="mobile-menu-btn" 
          aria-label="Open navigation menu"
        >
          <Menu size={22} />
        </button>
        <div className="mobile-logo-text">HK Console</div>
        <div style={{ width: 34 }}></div> {/* Balance layout placeholder */}
      </header>

      {/* Responsive Overlay Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile Drawer Overlay Backdrop */}
      {sidebarOpen && (
        <div 
          className="mobile-sidebar-backdrop" 
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/transporters" element={<ProtectedRoute><Transporters /></ProtectedRoute>} />
          <Route path="/transporters/:id" element={<ProtectedRoute><TransporterDetail /></ProtectedRoute>} />
          <Route path="/records" element={<ProtectedRoute><Records /></ProtectedRoute>} />
          <Route path="/new-rating" element={<ProtectedRoute allowedRoles={['ADMIN', 'OPERATIONS']}><NewRating /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute allowedRoles={['ADMIN']}><Settings /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <AppContent />
            {/* Global Toast Alerts */}
            <Toast />
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
