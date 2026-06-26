DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS performance_ratings CASCADE;
DROP TABLE IF EXISTS transporters CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS authorized_emails CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;

CREATE TABLE transporters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  contact_person VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  city VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE performance_ratings (
  id SERIAL PRIMARY KEY,
  transporter_id INTEGER REFERENCES transporters(id) ON DELETE CASCADE,
  rating_month VARCHAR(7) NOT NULL, -- format: YYYY-MM
  on_time_delivery_rate DECIMAL(5,2) NOT NULL CHECK (on_time_delivery_rate >= 0 AND on_time_delivery_rate <= 100),
  damage_incidents INTEGER NOT NULL DEFAULT 0 CHECK (damage_incidents >= 0),
  billing_accuracy DECIMAL(5,2) NOT NULL CHECK (billing_accuracy >= 0 AND billing_accuracy <= 100),
  client_feedback_score DECIMAL(3,1) NOT NULL CHECK (client_feedback_score >= 0 AND client_feedback_score <= 10),
  performance_score DECIMAL(5,2),
  tier VARCHAR(20),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(transporter_id, rating_month)
);

CREATE TABLE alerts (
  id SERIAL PRIMARY KEY,
  transporter_id INTEGER REFERENCES transporters(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('HIGH', 'MEDIUM', 'LOW')),
  message TEXT NOT NULL,
  rating_month VARCHAR(7),
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'OPERATIONS', 'MANAGER')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE system_settings (
  key VARCHAR(50) PRIMARY KEY,
  value JSONB NOT NULL
);

CREATE TABLE authorized_emails (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'OPERATIONS', 'MANAGER')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  username VARCHAR(100),
  action_type VARCHAR(50) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  transporter_id INTEGER REFERENCES transporters(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  paid_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
  payment_date DATE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('PAID', 'PENDING', 'DISPUTED', 'PARTIALLY_PAID')),
  dispute_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
