-- Seed 10 transporters (Already truncated or dropped from migrations.sql)
-- But let's insert them safely

-- Clean up any existing data if needed
TRUNCATE TABLE alerts RESTART IDENTITY CASCADE;
TRUNCATE TABLE performance_ratings RESTART IDENTITY CASCADE;
TRUNCATE TABLE transporters RESTART IDENTITY CASCADE;
TRUNCATE TABLE users RESTART IDENTITY CASCADE;
TRUNCATE TABLE system_settings RESTART IDENTITY CASCADE;
TRUNCATE TABLE authorized_emails RESTART IDENTITY CASCADE;
TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE;
TRUNCATE TABLE invoices RESTART IDENTITY CASCADE;

INSERT INTO transporters (name, contact_person, phone, email, city, status) VALUES
('Highway Pioneers', 'Ramesh Kumar', '9876543210', 'ramesh@highwaypioneers.com', 'Hyderabad', 'APPROVED'),
('Skyline Freight Co.', 'Suresh Reddy', '9876543211', 'suresh@skylinefreight.com', 'Bangalore', 'APPROVED'),
('DesertLine Carriers', 'Mahesh Rao', '9876543212', 'mahesh@desertline.com', 'Chennai', 'APPROVED'),
('Coastal Cargo Movers', 'Dinesh Sharma', '9876543213', 'dinesh@coastalcargo.com', 'Visakhapatnam', 'APPROVED'),
('Eastern Express Cargo', 'Rakesh Gupta', '9876543214', 'rakesh@easternexpress.com', 'Hyderabad', 'APPROVED'),
('Western Roadlines', 'Ganesh Nair', '9876543215', 'ganesh@westernroad.com', 'Pune', 'APPROVED'),
('Metro Quick Haul', 'Naresh Pillai', '9876543216', 'naresh@metroquick.com', 'Mumbai', 'APPROVED'),
('Greenfield Transport', 'Venkat Rao', '9876543217', 'venkat@greenfield.com', 'Hyderabad', 'APPROVED'),
('Sunrise Logistics', 'Prasad Iyer', '9876543218', 'prasad@sunriselogistics.com', 'Coimbatore', 'APPROVED'),
('IndiaRoad Express', 'Kiran Mehta', '9876543219', 'kiran@indiaroad.com', 'Delhi', 'APPROVED');

INSERT INTO users (username, email, password_hash, role) VALUES
('admin', 'admin@hkshipping.com', '$2b$10$wbu8WPu2qh5qn3yysNBpzu0v26NdiSqndU2I2/P6ubYBfkQoVFQge', 'ADMIN'),
('ops', 'ops@hkshipping.com', '$2b$10$wbu8WPu2qh5qn3yysNBpzu0v26NdiSqndU2I2/P6ubYBfkQoVFQge', 'OPERATIONS'),
('manager', 'manager@hkshipping.com', '$2b$10$wbu8WPu2qh5qn3yysNBpzu0v26NdiSqndU2I2/P6ubYBfkQoVFQge', 'MANAGER');

INSERT INTO system_settings (key, value) VALUES
('scoring_weights', '{"on_time": 0.40, "billing": 0.25, "feedback": 0.25, "damage": 0.10}'::jsonb);

INSERT INTO authorized_emails (email, role) VALUES
('admin@hkshipping.com', 'ADMIN'),
('ops@hkshipping.com', 'OPERATIONS'),
('manager@hkshipping.com', 'MANAGER');

INSERT INTO invoices (invoice_number, transporter_id, amount, paid_amount, payment_date, status, dispute_reason) VALUES
('INV-2026-001', 1, 150000.00, 150000.00, '2026-06-15', 'PAID', NULL),
('INV-2026-002', 2, 280000.00, 140000.00, '2026-06-20', 'PARTIALLY_PAID', NULL),
('INV-2026-003', 3, 95000.00, 0.00, NULL, 'PENDING', NULL),
('INV-2026-004', 5, 120000.00, 0.00, NULL, 'DISPUTED', 'Damage penalties dispute - pending fire inquiry review');

-- Ratings for Highway Pioneers (ID 1)
-- Avg score around 97.5 (EXCELLENT)
INSERT INTO performance_ratings (transporter_id, rating_month, on_time_delivery_rate, damage_incidents, billing_accuracy, client_feedback_score, performance_score, tier, notes) VALUES
(1, '2025-12', 98.5, 0, 99.0, 9.5, 97.9, 'EXCELLENT', 'Excellent startup month'),
(1, '2026-01', 99.0, 0, 98.5, 9.8, 98.7, 'EXCELLENT', 'Very reliable'),
(1, '2026-02', 97.0, 1, 99.0, 9.6, 97.4, 'EXCELLENT', 'Single minor damage incident'),
(1, '2026-03', 98.0, 0, 98.0, 9.5, 97.5, 'EXCELLENT', 'Consistent delivery times'),
(1, '2026-04', 99.0, 0, 99.5, 9.7, 98.7, 'EXCELLENT', 'Top-tier operations'),
(1, '2026-05', 96.5, 0, 98.0, 9.4, 96.6, 'EXCELLENT', 'Slightly slow but clean'),
(1, '2026-06', 97.5, 0, 98.5, 9.5, 97.4, 'EXCELLENT', 'Maintained excellent score');

-- Ratings for Skyline Freight Co. (ID 2)
-- Avg score around 92.3 (EXCELLENT)
INSERT INTO performance_ratings (transporter_id, rating_month, on_time_delivery_rate, damage_incidents, billing_accuracy, client_feedback_score, performance_score, tier, notes) VALUES
(2, '2025-12', 94.0, 0, 95.0, 9.0, 93.9, 'EXCELLENT', 'Good initial performance'),
(2, '2026-01', 95.0, 1, 94.0, 9.2, 94.3, 'EXCELLENT', 'Slight billing error but corrected'),
(2, '2026-02', 93.5, 0, 96.0, 9.1, 94.2, 'EXCELLENT', 'Clean delivery sheet'),
(2, '2026-03', 92.0, 2, 95.0, 8.8, 92.2, 'EXCELLENT', 'Two damage events noted'),
(2, '2026-04', 96.0, 0, 97.0, 9.4, 96.2, 'EXCELLENT', 'Solid operational recovery'),
(2, '2026-05', 93.0, 0, 94.0, 8.9, 92.5, 'EXCELLENT', 'Normal route operations'),
(2, '2026-06', 94.5, 1, 95.5, 9.2, 94.4, 'EXCELLENT', 'Excellent closing month');

-- Ratings for DesertLine Carriers (ID 3)
-- Avg score around 85.5 (GOOD)
INSERT INTO performance_ratings (transporter_id, rating_month, on_time_delivery_rate, damage_incidents, billing_accuracy, client_feedback_score, performance_score, tier, notes) VALUES
(3, '2025-12', 88.0, 1, 90.0, 8.5, 88.8, 'GOOD', 'Decent response time'),
(3, '2026-01', 89.0, 2, 88.0, 8.2, 87.7, 'GOOD', 'Double tire blowout caused delay'),
(3, '2026-02', 86.0, 0, 91.0, 8.4, 88.2, 'GOOD', 'No cargo complaints'),
(3, '2026-03', 85.0, 3, 89.0, 8.0, 85.9, 'GOOD', 'Multiple cargo adjustments'),
(3, '2026-04', 87.0, 1, 92.0, 8.6, 89.1, 'GOOD', 'Good feedback score improvement'),
(3, '2026-05', 84.0, 2, 88.5, 7.9, 84.8, 'GOOD', 'Delayed route arrivals'),
(3, '2026-06', 85.5, 1, 90.5, 8.3, 87.4, 'GOOD', 'Finished strong');

-- Ratings for Coastal Cargo Movers (ID 4)
-- Avg score around 82.4 (GOOD)
INSERT INTO performance_ratings (transporter_id, rating_month, on_time_delivery_rate, damage_incidents, billing_accuracy, client_feedback_score, performance_score, tier, notes) VALUES
(4, '2025-12', 85.0, 2, 88.0, 8.0, 85.6, 'GOOD', 'Starting solid'),
(4, '2026-01', 86.0, 1, 85.0, 7.8, 84.7, 'GOOD', 'Good custom clearances'),
(4, '2026-02', 84.0, 3, 86.0, 7.9, 82.6, 'GOOD', 'High transit damage'),
(4, '2026-03', 82.5, 2, 84.0, 7.6, 81.6, 'GOOD', 'Rain delays in South ports'),
(4, '2026-04', 85.0, 0, 87.0, 8.2, 86.3, 'GOOD', 'Excellent dry run performance'),
(4, '2026-05', 81.0, 4, 83.0, 7.5, 78.7, 'GOOD', 'Heavy penalties for delays'),
(4, '2026-06', 83.0, 2, 86.5, 8.1, 83.7, 'GOOD', 'Stabilized operations');

-- Ratings for Eastern Express Cargo (ID 5)
-- Avg score around 79.5 (GOOD)
-- triggers alert in 2026-06 due to high damage (5 incidents)
INSERT INTO performance_ratings (transporter_id, rating_month, on_time_delivery_rate, damage_incidents, billing_accuracy, client_feedback_score, performance_score, tier, notes) VALUES
(5, '2025-12', 82.0, 1, 85.0, 7.5, 82.6, 'GOOD', 'Good port handling'),
(5, '2026-01', 83.0, 2, 82.0, 7.6, 82.3, 'GOOD', 'Minor warehouse mixup'),
(5, '2026-02', 80.5, 3, 84.0, 7.8, 80.7, 'GOOD', 'Cargo sorting issues'),
(5, '2026-03', 79.0, 2, 81.0, 7.4, 78.5, 'GOOD', 'Driver shortages reported'),
(5, '2026-04', 84.0, 1, 86.0, 8.0, 84.9, 'GOOD', 'Route efficiency optimal'),
(5, '2026-05', 78.0, 4, 80.0, 7.0, 75.7, 'GOOD', 'Poor terminal response'),
(5, '2026-06', 81.0, 5, 83.0, 7.2, 77.0, 'GOOD', 'High damage incidents due to local warehouse fire');

-- Ratings for Western Roadlines (ID 6)
-- Avg score around 75.8 (GOOD)
INSERT INTO performance_ratings (transporter_id, rating_month, on_time_delivery_rate, damage_incidents, billing_accuracy, client_feedback_score, performance_score, tier, notes) VALUES
(6, '2025-12', 78.0, 2, 80.0, 7.2, 78.8, 'GOOD', 'Steady handling'),
(6, '2026-01', 79.0, 1, 78.5, 7.4, 78.7, 'GOOD', 'Good logistics support'),
(6, '2026-02', 76.0, 3, 81.0, 7.0, 75.6, 'GOOD', 'Billing dispute raised'),
(6, '2026-03', 75.0, 2, 77.0, 7.1, 74.6, 'AVERAGE', 'Fell slightly below Good threshold'),
(6, '2026-04', 80.0, 1, 82.0, 7.8, 81.3, 'GOOD', 'Strong feedback rebound'),
(6, '2026-05', 74.0, 3, 76.0, 6.9, 72.5, 'AVERAGE', 'Driver strike delays'),
(6, '2026-06', 77.5, 2, 80.0, 7.3, 78.1, 'GOOD', 'Returned to stable operational rating');

-- Ratings for Metro Quick Haul (ID 7)
-- Avg score around 75.2 (GOOD)
INSERT INTO performance_ratings (transporter_id, rating_month, on_time_delivery_rate, damage_incidents, billing_accuracy, client_feedback_score, performance_score, tier, notes) VALUES
(7, '2025-12', 76.5, 2, 81.0, 7.0, 77.8, 'GOOD', 'Fair performance'),
(7, '2026-01', 78.0, 1, 77.0, 7.2, 77.8, 'GOOD', 'Speedy deliveries'),
(7, '2026-02', 75.0, 3, 79.0, 6.8, 74.1, 'AVERAGE', 'Increased complaints'),
(7, '2026-03', 74.0, 2, 76.0, 7.1, 73.6, 'AVERAGE', 'Billing delay issues'),
(7, '2026-04', 79.0, 1, 80.5, 7.5, 79.5, 'GOOD', 'Improved sorting times'),
(7, '2026-05', 73.5, 4, 75.0, 6.7, 71.0, 'AVERAGE', 'Poor regional performance'),
(7, '2026-06', 76.0, 2, 79.5, 7.2, 76.7, 'GOOD', 'Decent closing month');

-- Ratings for Greenfield Transport (ID 8)
-- Avg score around 67.5 (AVERAGE)
INSERT INTO performance_ratings (transporter_id, rating_month, on_time_delivery_rate, damage_incidents, billing_accuracy, client_feedback_score, performance_score, tier, notes) VALUES
(8, '2025-12', 70.0, 3, 72.0, 6.2, 69.1, 'AVERAGE', 'Basic compliance maintained'),
(8, '2026-01', 72.0, 2, 70.0, 6.5, 69.9, 'AVERAGE', 'Minor billing errors'),
(8, '2026-02', 68.0, 4, 73.0, 6.0, 65.5, 'AVERAGE', 'Vehicle maintenance delays'),
(8, '2026-03', 67.0, 3, 71.0, 6.1, 65.6, 'AVERAGE', 'Low client feedback ratings'),
(8, '2026-04', 74.0, 2, 75.0, 6.8, 72.4, 'AVERAGE', 'Increased route supervision'),
(8, '2026-05', 65.0, 5, 69.0, 5.8, 61.9, 'AVERAGE', 'High damage rate during monsoons'),
(8, '2026-06', 69.0, 3, 72.5, 6.3, 67.6, 'AVERAGE', 'Average performance');

-- Ratings for Sunrise Logistics (ID 9)
-- Avg score around 64.2 (AVERAGE)
INSERT INTO performance_ratings (transporter_id, rating_month, on_time_delivery_rate, damage_incidents, billing_accuracy, client_feedback_score, performance_score, tier, notes) VALUES
(9, '2025-12', 66.0, 4, 68.0, 5.8, 63.9, 'AVERAGE', 'Border issues in entry point'),
(9, '2026-01', 68.0, 3, 65.0, 6.0, 64.6, 'AVERAGE', 'Delays in bill submissions'),
(9, '2026-02', 64.0, 5, 69.0, 5.5, 60.9, 'AVERAGE', 'Route closure issues'),
(9, '2026-03', 63.0, 4, 67.0, 5.6, 61.1, 'AVERAGE', 'Driver shortage issues'),
(9, '2026-04', 70.0, 3, 72.0, 6.4, 68.4, 'AVERAGE', 'Corrective layout implemented'),
(9, '2026-05', 61.0, 6, 64.0, 5.2, 56.4, 'POOR', 'Severe delays and damage penalties'),
(9, '2026-06', 65.0, 4, 68.5, 5.9, 63.5, 'AVERAGE', 'Under close monitoring');

-- Ratings for IndiaRoad Express (ID 10)
-- Avg score around 55.5 (POOR)
-- Triggers multiple active alerts in 2026-06:
-- low score (52.2 < 60), low on-time (58.0% < 70%), low feedback (4.2 < 5)
INSERT INTO performance_ratings (transporter_id, rating_month, on_time_delivery_rate, damage_incidents, billing_accuracy, client_feedback_score, performance_score, tier, notes) VALUES
(10, '2025-12', 62.0, 4, 65.0, 5.0, 58.7, 'POOR', 'Inadequate vehicle count'),
(10, '2026-01', 60.0, 5, 60.0, 4.8, 55.0, 'POOR', 'Multiple alerts triggered early'),
(10, '2026-02', 58.0, 6, 63.0, 4.5, 53.6, 'POOR', 'Billing inaccuracies combined with damage'),
(10, '2026-03', 55.0, 5, 59.0, 4.2, 50.3, 'POOR', 'Critical route failure'),
(10, '2026-04', 65.0, 3, 68.0, 5.5, 61.9, 'AVERAGE', 'Temporary improvement'),
(10, '2026-05', 52.0, 7, 55.0, 3.8, 45.1, 'POOR', 'Severe damage and operational delay'),
(10, '2026-06', 58.0, 4, 62.0, 4.2, 52.2, 'POOR', 'Fails multiple benchmarks. Review required.');

-- Seed ALERTS based on rules

-- Active / Unresolved Alerts for 2026-06 (or older)
-- Eastern Express Cargo (ID 5) - High damage (5 incidents) in 2026-06
INSERT INTO alerts (transporter_id, alert_type, severity, message, rating_month, is_resolved) VALUES
(5, 'HIGH_DAMAGE', 'MEDIUM', 'High damage in 2026-06: 5 incidents', '2026-06', false);

-- Sunrise Logistics (ID 9) - Poor score (56.4) and High damage (6 incidents) in 2026-05 (resolved)
INSERT INTO alerts (transporter_id, alert_type, severity, message, rating_month, is_resolved) VALUES
(9, 'POOR_PERFORMANCE', 'HIGH', 'Performance score critically low: 56.4/100', '2026-05', true),
(9, 'HIGH_DAMAGE', 'MEDIUM', 'High damage in 2026-05: 6 incidents', '2026-05', true),
(9, 'LOW_ON_TIME', 'HIGH', 'On-time delivery rate below threshold: 61%', '2026-05', true);

-- IndiaRoad Express (ID 10) - Active alerts for 2026-06:
-- Low score, low on-time rate, low client feedback
INSERT INTO alerts (transporter_id, alert_type, severity, message, rating_month, is_resolved) VALUES
(10, 'POOR_PERFORMANCE', 'HIGH', 'Performance score critically low: 52.2/100', '2026-06', false),
(10, 'LOW_ON_TIME', 'HIGH', 'On-time delivery rate below threshold: 58%', '2026-06', false),
(10, 'LOW_FEEDBACK', 'MEDIUM', 'Client feedback score low: 4.2/10', '2026-06', false);

-- IndiaRoad Express (ID 10) - Historical alerts for 2026-05 (resolved)
INSERT INTO alerts (transporter_id, alert_type, severity, message, rating_month, is_resolved) VALUES
(10, 'POOR_PERFORMANCE', 'HIGH', 'Performance score critically low: 45.1/100', '2026-05', true),
(10, 'LOW_ON_TIME', 'HIGH', 'On-time delivery rate below threshold: 52%', '2026-05', true),
(10, 'LOW_FEEDBACK', 'MEDIUM', 'Client feedback score low: 3.8/10', '2026-05', true),
(10, 'HIGH_DAMAGE', 'MEDIUM', 'High damage in 2026-05: 7 incidents', '2026-05', true);
