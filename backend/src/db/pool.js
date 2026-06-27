const { Pool: PgPool } = require('pg');
const path = require('path');
const fs = require('fs');

// Try loading .env from multiple possible locations (local dev vs serverless)
const envPaths = [
  path.resolve(__dirname, '../../../.env'),
  path.resolve(__dirname, '../../.env'),
  path.resolve(process.cwd(), '.env'),
];
for (const envPath of envPaths) {
  const result = require('dotenv').config({ path: envPath });
  if (!result.error) break;
}

const STORE_PATH = path.join(__dirname, 'db_store.json');

// Helper to load/save mock database state
function loadStore() {
  if (fs.existsSync(STORE_PATH)) {
    try {
      const store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
      let modified = false;
      if (!store.users) {
        store.users = [
          { id: 1, username: 'admin', email: 'admin@hkshipping.com', password_hash: '$2b$10$wbu8WPu2qh5qn3yysNBpzu0v26NdiSqndU2I2/P6ubYBfkQoVFQge', role: 'ADMIN', created_at: new Date().toISOString() },
          { id: 2, username: 'ops', email: 'ops@hkshipping.com', password_hash: '$2b$10$wbu8WPu2qh5qn3yysNBpzu0v26NdiSqndU2I2/P6ubYBfkQoVFQge', role: 'OPERATIONS', created_at: new Date().toISOString() },
          { id: 3, username: 'manager', email: 'manager@hkshipping.com', password_hash: '$2b$10$wbu8WPu2qh5qn3yysNBpzu0v26NdiSqndU2I2/P6ubYBfkQoVFQge', role: 'MANAGER', created_at: new Date().toISOString() }
        ];
        modified = true;
      }
      if (!store.system_settings) {
        store.system_settings = [
          { key: 'scoring_weights', value: { on_time: 0.40, billing: 0.25, feedback: 0.25, damage: 0.10 } }
        ];
        modified = true;
      }
      if (!store.authorized_emails) {
        store.authorized_emails = [
          { id: 1, email: 'admin@hkshipping.com', role: 'ADMIN', created_at: new Date().toISOString() },
          { id: 2, email: 'ops@hkshipping.com', role: 'OPERATIONS', created_at: new Date().toISOString() },
          { id: 3, email: 'manager@hkshipping.com', role: 'MANAGER', created_at: new Date().toISOString() }
        ];
        modified = true;
      }
      if (!store.audit_logs) {
        store.audit_logs = [];
        modified = true;
      }
      if (!store.invoices) {
        store.invoices = [
          { id: 1, invoice_number: 'INV-2026-001', transporter_id: 1, amount: 150000.00, paid_amount: 150000.00, payment_date: '2026-06-15', status: 'PAID', dispute_reason: null, created_at: new Date().toISOString() },
          { id: 2, invoice_number: 'INV-2026-002', transporter_id: 2, amount: 280000.00, paid_amount: 140000.00, payment_date: '2026-06-20', status: 'PARTIALLY_PAID', dispute_reason: null, created_at: new Date().toISOString() },
          { id: 3, invoice_number: 'INV-2026-003', transporter_id: 3, amount: 95000.00, paid_amount: 0.00, payment_date: null, status: 'PENDING', dispute_reason: null, created_at: new Date().toISOString() },
          { id: 4, invoice_number: 'INV-2026-004', transporter_id: 5, amount: 120000.00, paid_amount: 0.00, payment_date: null, status: 'DISPUTED', dispute_reason: 'Damage penalties dispute - pending fire inquiry review', created_at: new Date().toISOString() }
        ];
        modified = true;
      }
      store.transporters.forEach(t => {
        if (!t.status) {
          t.status = 'APPROVED';
          modified = true;
        }
      });
      if (modified) {
        fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
      }
      return store;
    } catch (e) {
      console.error('Failed to parse db_store.json, creating new store', e);
    }
  }

  // Pre-seeded database arrays
  const transporters = [
    { id: 1, name: 'Highway Pioneers', contact_person: 'Ramesh Kumar', phone: '9876543210', email: 'ramesh@highwaypioneers.com', city: 'Hyderabad', is_active: true, created_at: new Date().toISOString() },
    { id: 2, name: 'Skyline Freight Co.', contact_person: 'Suresh Reddy', phone: '9876543211', email: 'suresh@skylinefreight.com', city: 'Bangalore', is_active: true, created_at: new Date().toISOString() },
    { id: 3, name: 'DesertLine Carriers', contact_person: 'Mahesh Rao', phone: '9876543212', email: 'mahesh@desertline.com', city: 'Chennai', is_active: true, created_at: new Date().toISOString() },
    { id: 4, name: 'Coastal Cargo Movers', contact_person: 'Dinesh Sharma', phone: '9876543213', email: 'dinesh@coastalcargo.com', city: 'Visakhapatnam', is_active: true, created_at: new Date().toISOString() },
    { id: 5, name: 'Eastern Express Cargo', contact_person: 'Rakesh Gupta', phone: '9876543214', email: 'rakesh@easternexpress.com', city: 'Hyderabad', is_active: true, created_at: new Date().toISOString() },
    { id: 6, name: 'Western Roadlines', contact_person: 'Ganesh Nair', phone: '9876543215', email: 'ganesh@westernroad.com', city: 'Pune', is_active: true, created_at: new Date().toISOString() },
    { id: 7, name: 'Metro Quick Haul', contact_person: 'Naresh Pillai', phone: '9876543216', email: 'naresh@metroquick.com', city: 'Mumbai', is_active: true, created_at: new Date().toISOString() },
    { id: 8, name: 'Greenfield Transport', contact_person: 'Venkat Rao', phone: '9876543217', email: 'venkat@greenfield.com', city: 'Hyderabad', is_active: true, created_at: new Date().toISOString() },
    { id: 9, name: 'Sunrise Logistics', contact_person: 'Prasad Iyer', phone: '9876543218', email: 'prasad@sunriselogistics.com', city: 'Coimbatore', is_active: true, created_at: new Date().toISOString() },
    { id: 10, name: 'IndiaRoad Express', contact_person: 'Kiran Mehta', phone: '9876543219', email: 'kiran@indiaroad.com', city: 'Delhi', is_active: true, created_at: new Date().toISOString() }
  ];

  const ratings = [];
  const months = ['2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06'];

  // Seed ratings for all 10 transporters
  const profiles = {
    1: { onTime: 98, damage: 0, billing: 98.5, feedback: 9.6 },  // Excellent
    2: { onTime: 94, damage: 0.5, billing: 95, feedback: 9.1 },  // Excellent
    3: { onTime: 86.5, damage: 1.5, billing: 89.5, feedback: 8.3 }, // Good
    4: { onTime: 83.5, damage: 2, billing: 86, feedback: 7.9 },  // Good
    5: { onTime: 81, damage: 2.5, billing: 83.5, feedback: 7.5 }, // Good (high damage in 2026-06)
    6: { onTime: 77, damage: 2, billing: 79, feedback: 7.2 },    // Good/Avg
    7: { onTime: 76, damage: 2, billing: 78.5, feedback: 7.1 },  // Good/Avg
    8: { onTime: 69, damage: 3, billing: 72, feedback: 6.3 },    // Avg
    9: { onTime: 65, damage: 4, billing: 68, feedback: 5.8 },    // Avg/Poor
    10: { onTime: 58, damage: 5, billing: 61, feedback: 4.5 }    // Poor
  };

  let ratingId = 1;
  months.forEach(month => {
    transporters.forEach(t => {
      const p = profiles[t.id];
      // Add slight randomness per month to make charts interesting
      const var1 = (Math.random() - 0.5) * 4;
      const var2 = Math.random() > 0.7 ? 1 : 0;
      const var3 = (Math.random() - 0.5) * 3;
      const var4 = (Math.random() - 0.5) * 0.8;

      let onTime = Math.max(0, Math.min(100, p.onTime + var1));
      let damage = Math.max(0, Math.round(p.damage + var2));
      let billing = Math.max(0, Math.min(100, p.billing + var3));
      let feedback = Math.max(0, Math.min(10, p.feedback + var4));

      // Custom profiles adjustments
      if (t.id === 5 && month === '2026-06') {
        damage = 5; // Triggers alert
      }
      if (t.id === 9 && month === '2026-05') {
        onTime = 61;
        damage = 6;
        feedback = 5.2;
      }
      if (t.id === 10 && month === '2026-06') {
        onTime = 58;
        damage = 4;
        feedback = 4.2;
      }
      if (t.id === 10 && month === '2026-05') {
        onTime = 52;
        damage = 7;
        feedback = 3.8;
      }

      // Calculate score and tier using rules
      const onTimeScore = onTime * 0.40;
      const billingScore = billing * 0.25;
      const feedbackScore = (feedback / 10) * 100 * 0.25;
      const damagePenalty = Math.min(damage * 2, 10);
      const damageScore = (1 - damagePenalty / 100) * 100 * 0.10;
      const performance_score = Math.round((onTimeScore + billingScore + feedbackScore + damageScore) * 10) / 10;

      let tier = 'POOR';
      if (performance_score >= 90) tier = 'EXCELLENT';
      else if (performance_score >= 75) tier = 'GOOD';
      else if (performance_score >= 60) tier = 'AVERAGE';

      ratings.push({
        id: ratingId++,
        transporter_id: t.id,
        rating_month: month,
        on_time_delivery_rate: Math.round(onTime * 100) / 100,
        damage_incidents: damage,
        billing_accuracy: Math.round(billing * 100) / 100,
        client_feedback_score: Math.round(feedback * 10) / 10,
        performance_score,
        tier,
        notes: `Automated seeding for ${month}`,
        created_at: new Date().toISOString()
      });
    });
  });

  const alerts = [
    // Active / Unresolved
    { id: 1, transporter_id: 5, alert_type: 'HIGH_DAMAGE', severity: 'MEDIUM', message: 'High damage in 2026-06: 5 incidents', rating_month: '2026-06', is_resolved: false, created_at: new Date().toISOString() },
    { id: 2, transporter_id: 10, alert_type: 'POOR_PERFORMANCE', severity: 'HIGH', message: 'Performance score critically low: 52.2/100', rating_month: '2026-06', is_resolved: false, created_at: new Date().toISOString() },
    { id: 3, transporter_id: 10, alert_type: 'LOW_ON_TIME', severity: 'HIGH', message: 'On-time delivery rate below threshold: 58%', rating_month: '2026-06', is_resolved: false, created_at: new Date().toISOString() },
    { id: 4, transporter_id: 10, alert_type: 'LOW_FEEDBACK', severity: 'MEDIUM', message: 'Client feedback score low: 4.2/10', rating_month: '2026-06', is_resolved: false, created_at: new Date().toISOString() },
    
    // Resolved
    { id: 5, transporter_id: 9, alert_type: 'POOR_PERFORMANCE', severity: 'HIGH', message: 'Performance score critically low: 56.4/100', rating_month: '2026-05', is_resolved: true, created_at: new Date().toISOString() },
    { id: 6, transporter_id: 9, alert_type: 'HIGH_DAMAGE', severity: 'MEDIUM', message: 'High damage in 2026-05: 6 incidents', rating_month: '2026-05', is_resolved: true, created_at: new Date().toISOString() },
    { id: 7, transporter_id: 9, alert_type: 'LOW_ON_TIME', severity: 'HIGH', message: 'On-time delivery rate below threshold: 61%', rating_month: '2026-05', is_resolved: true, created_at: new Date().toISOString() },
    { id: 8, transporter_id: 10, alert_type: 'POOR_PERFORMANCE', severity: 'HIGH', message: 'Performance score critically low: 45.1/100', rating_month: '2026-05', is_resolved: true, created_at: new Date().toISOString() },
    { id: 9, transporter_id: 10, alert_type: 'LOW_ON_TIME', severity: 'HIGH', message: 'On-time delivery rate below threshold: 52%', rating_month: '2026-05', is_resolved: true, created_at: new Date().toISOString() },
    { id: 10, transporter_id: 10, alert_type: 'LOW_FEEDBACK', severity: 'MEDIUM', message: 'Client feedback score low: 3.8/10', rating_month: '2026-05', is_resolved: true, created_at: new Date().toISOString() },
    { id: 11, transporter_id: 10, alert_type: 'HIGH_DAMAGE', severity: 'MEDIUM', message: 'High damage in 2026-05: 7 incidents', rating_month: '2026-05', is_resolved: true, created_at: new Date().toISOString() }
  ];

  const users = [
    { id: 1, username: 'admin', email: 'admin@hkshipping.com', password_hash: '$2b$10$wbu8WPu2qh5qn3yysNBpzu0v26NdiSqndU2I2/P6ubYBfkQoVFQge', role: 'ADMIN', created_at: new Date().toISOString() },
    { id: 2, username: 'ops', email: 'ops@hkshipping.com', password_hash: '$2b$10$wbu8WPu2qh5qn3yysNBpzu0v26NdiSqndU2I2/P6ubYBfkQoVFQge', role: 'OPERATIONS', created_at: new Date().toISOString() },
    { id: 3, username: 'manager', email: 'manager@hkshipping.com', password_hash: '$2b$10$wbu8WPu2qh5qn3yysNBpzu0v26NdiSqndU2I2/P6ubYBfkQoVFQge', role: 'MANAGER', created_at: new Date().toISOString() }
  ];
  const system_settings = [
    { key: 'scoring_weights', value: { on_time: 0.40, billing: 0.25, feedback: 0.25, damage: 0.10 } }
  ];
  const authorized_emails = [
    { id: 1, email: 'admin@hkshipping.com', role: 'ADMIN', created_at: new Date().toISOString() },
    { id: 2, email: 'ops@hkshipping.com', role: 'OPERATIONS', created_at: new Date().toISOString() },
    { id: 3, email: 'manager@hkshipping.com', role: 'MANAGER', created_at: new Date().toISOString() }
  ];
  const audit_logs = [];
  const invoices = [
    { id: 1, invoice_number: 'INV-2026-001', transporter_id: 1, amount: 150000.00, paid_amount: 150000.00, payment_date: '2026-06-15', status: 'PAID', dispute_reason: null, created_at: new Date().toISOString() },
    { id: 2, invoice_number: 'INV-2026-002', transporter_id: 2, amount: 280000.00, paid_amount: 140000.00, payment_date: '2026-06-20', status: 'PARTIALLY_PAID', dispute_reason: null, created_at: new Date().toISOString() },
    { id: 3, invoice_number: 'INV-2026-003', transporter_id: 3, amount: 95000.00, paid_amount: 0.00, payment_date: null, status: 'PENDING', dispute_reason: null, created_at: new Date().toISOString() },
    { id: 4, invoice_number: 'INV-2026-004', transporter_id: 5, amount: 120000.00, paid_amount: 0.00, payment_date: null, status: 'DISPUTED', dispute_reason: 'Damage penalties dispute - pending fire inquiry review', created_at: new Date().toISOString() }
  ];

  const store = { transporters, ratings, alerts, users, system_settings, authorized_emails, audit_logs, invoices };
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
  return store;
}

function saveStore(store) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

// In-Memory Database Controller (SQL Parser Simulation)
class Pool {
  constructor() {
    this.store = loadStore();
    console.log('Mock PostgreSQL client loaded successfully. Store size: transporters:', this.store.transporters.length, 'ratings:', this.store.ratings.length);
  }

  on(event, callback) {
    if (event === 'connect') callback();
  }

  async connect() {
    return {
      query: async (text, params) => this.query(text, params),
      release: () => {}
    };
  }

  async query(text, params = []) {
    // Reload store to ensure sync across processes
    this.store = loadStore();
    
    const sql = text.replace(/\s+/g, ' ').trim();
    // console.log(`[MOCK SQL] ${sql} | Params:`, params);

    // 1. TRUNCATE TABLE
    if (sql.includes('TRUNCATE TABLE')) {
      this.store.alerts = [];
      this.store.ratings = [];
      this.store.transporters = [];
      this.store.users = [
        { id: 1, username: 'admin', email: 'admin@hkshipping.com', password_hash: '$2b$10$wbu8WPu2qh5qn3yysNBpzu0v26NdiSqndU2I2/P6ubYBfkQoVFQge', role: 'ADMIN', created_at: new Date().toISOString() },
        { id: 2, username: 'ops', email: 'ops@hkshipping.com', password_hash: '$2b$10$wbu8WPu2qh5qn3yysNBpzu0v26NdiSqndU2I2/P6ubYBfkQoVFQge', role: 'OPERATIONS', created_at: new Date().toISOString() },
        { id: 3, username: 'manager', email: 'manager@hkshipping.com', password_hash: '$2b$10$wbu8WPu2qh5qn3yysNBpzu0v26NdiSqndU2I2/P6ubYBfkQoVFQge', role: 'MANAGER', created_at: new Date().toISOString() }
      ];
      this.store.system_settings = [
        { key: 'scoring_weights', value: { on_time: 0.40, billing: 0.25, feedback: 0.25, damage: 0.10 } }
      ];
      this.store.authorized_emails = [
        { id: 1, email: 'admin@hkshipping.com', role: 'ADMIN', created_at: new Date().toISOString() },
        { id: 2, email: 'ops@hkshipping.com', role: 'OPERATIONS', created_at: new Date().toISOString() },
        { id: 3, email: 'manager@hkshipping.com', role: 'MANAGER', created_at: new Date().toISOString() }
      ];
      this.store.audit_logs = [];
      this.store.invoices = [];
      saveStore(this.store);
      return { rows: [] };
    }

    // 2. INSERT INTO transporters
    if (sql.startsWith('INSERT INTO transporters')) {
      const name = params[0];
      const contact = params[1];
      const phone = params[2];
      const email = params[3];
      const city = params[4];
      const id = this.store.transporters.length > 0 
        ? Math.max(...this.store.transporters.map(x => x.id)) + 1 
        : 1;

      const newT = {
        id,
        name,
        contact_person: contact,
        phone,
        email,
        city,
        is_active: true,
        status: 'PENDING',
        created_at: new Date().toISOString()
      };
      this.store.transporters.push(newT);
      saveStore(this.store);
      return { rows: [newT] };
    }

    // -- AUTHORIZED EMAILS QUERIES
    if (sql === 'SELECT * FROM authorized_emails ORDER BY created_at DESC') {
      const list = [...this.store.authorized_emails];
      list.sort((a, b) => b.created_at.localeCompare(a.created_at));
      return { rows: list };
    }

    if (sql === 'SELECT id FROM authorized_emails WHERE email = $1') {
      const email = params[0];
      const match = this.store.authorized_emails.find(e => e.email.toLowerCase() === email.toLowerCase());
      return { rows: match ? [{ id: match.id }] : [] };
    }

    if (sql === 'SELECT * FROM authorized_emails WHERE email = $1') {
      const email = params[0];
      const match = this.store.authorized_emails.find(e => e.email.toLowerCase() === email.toLowerCase());
      return { rows: match ? [match] : [] };
    }

    if (sql.startsWith('INSERT INTO authorized_emails')) {
      const email = params[0];
      const role = params[1];
      const id = this.store.authorized_emails.length > 0
        ? Math.max(...this.store.authorized_emails.map(x => x.id)) + 1
        : 1;

      const record = {
        id,
        email,
        role,
        created_at: new Date().toISOString()
      };
      this.store.authorized_emails.push(record);
      saveStore(this.store);
      return { rows: [record] };
    }

    if (sql === 'SELECT email FROM authorized_emails WHERE id = $1') {
      const id = parseInt(params[0]);
      const match = this.store.authorized_emails.find(e => e.id === id);
      return { rows: match ? [{ email: match.email }] : [] };
    }

    if (sql.startsWith('DELETE FROM authorized_emails WHERE id = $1')) {
      const id = parseInt(params[0]);
      const idx = this.store.authorized_emails.findIndex(e => e.id === id);
      if (idx === -1) return { rows: [] };
      const deleted = this.store.authorized_emails[idx];
      this.store.authorized_emails.splice(idx, 1);
      saveStore(this.store);
      return { rows: [deleted] };
    }

    // -- AUDIT LOGS QUERIES
    if (sql === 'SELECT * FROM audit_logs ORDER BY created_at DESC') {
      const list = [...this.store.audit_logs];
      list.sort((a, b) => b.created_at.localeCompare(a.created_at));
      return { rows: list };
    }

    if (sql.startsWith('INSERT INTO audit_logs')) {
      const user_id = params[0] ? parseInt(params[0]) : null;
      const username = params[1];
      const action_type = params[2];
      const details = params[3];
      const id = this.store.audit_logs.length > 0
        ? Math.max(...this.store.audit_logs.map(x => x.id)) + 1
        : 1;

      const log = {
        id,
        user_id,
        username,
        action_type,
        details,
        created_at: new Date().toISOString()
      };
      this.store.audit_logs.push(log);
      saveStore(this.store);
      return { rows: [log] };
    }

    // -- ADMIN USERS LIST
    if (sql === 'SELECT id, username, email, role, created_at FROM users ORDER BY username ASC') {
      const list = this.store.users.map(u => ({
        id: u.id,
        username: u.username,
        email: u.email,
        role: u.role,
        created_at: u.created_at
      }));
      list.sort((a, b) => a.username.localeCompare(b.username));
      return { rows: list };
    }

    // -- INVOICES MODULE MOCK QUERIES
    if (sql.includes('FROM invoices i JOIN transporters t') || sql.includes('FROM invoices i')) {
      let list = this.store.invoices.map(i => {
        const t = this.store.transporters.find(x => x.id === i.transporter_id) || {};
        return {
          ...i,
          transporter_name: t.name || 'Unknown'
        };
      });
      
      const transporter_id_match = sql.match(/i\.transporter_id = \$(\d)/);
      if (transporter_id_match) {
        const val = parseInt(params[parseInt(transporter_id_match[1]) - 1]);
        list = list.filter(i => i.transporter_id === val);
      }
      
      const status_match = sql.match(/i\.status = \$(\d)/);
      if (status_match) {
        const val = params[parseInt(status_match[1]) - 1];
        list = list.filter(i => i.status === val);
      }
      
      const search_match = sql.match(/i\.invoice_number ILIKE \$(\d)/);
      if (search_match) {
        const val = params[parseInt(search_match[1]) - 1].replace(/%/g, '').toLowerCase();
        list = list.filter(i => i.invoice_number.toLowerCase().includes(val));
      }
      
      list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      return { rows: list };
    }

    if (sql === 'SELECT id FROM invoices WHERE invoice_number = $1') {
      const num = params[0];
      const match = this.store.invoices.find(i => i.invoice_number.toLowerCase() === num.toLowerCase());
      return { rows: match ? [{ id: match.id }] : [] };
    }

    if (sql === 'SELECT id FROM invoices WHERE invoice_number = $1 AND id <> $2') {
      const num = params[0];
      const id = parseInt(params[1]);
      const match = this.store.invoices.find(i => i.invoice_number.toLowerCase() === num.toLowerCase() && i.id !== id);
      return { rows: match ? [{ id: match.id }] : [] };
    }

    if (sql.startsWith('INSERT INTO invoices')) {
      const num = params[0];
      const tId = parseInt(params[1]);
      const amt = parseFloat(params[2]);
      const paid = parseFloat(params[3]);
      const pDate = params[4];
      const stat = params[5];
      const reason = params[6];
      const id = this.store.invoices.length > 0
        ? Math.max(...this.store.invoices.map(x => x.id)) + 1
        : 1;
        
      const record = {
        id,
        invoice_number: num,
        transporter_id: tId,
        amount: amt,
        paid_amount: paid,
        payment_date: pDate,
        status: stat,
        dispute_reason: reason,
        created_at: new Date().toISOString()
      };
      this.store.invoices.push(record);
      saveStore(this.store);
      return { rows: [record] };
    }

    if (sql === 'SELECT * FROM invoices WHERE id = $1') {
      const id = parseInt(params[0]);
      const match = this.store.invoices.find(i => i.id === id);
      return { rows: match ? [match] : [] };
    }

    if (sql.startsWith('UPDATE invoices SET invoice_number = $1')) {
      const num = params[0];
      const tId = parseInt(params[1]);
      const amt = parseFloat(params[2]);
      const paid = parseFloat(params[3]);
      const pDate = params[4];
      const stat = params[5];
      const reason = params[6];
      const id = parseInt(params[7]);
      
      const idx = this.store.invoices.findIndex(i => i.id === id);
      if (idx === -1) return { rows: [] };
      
      this.store.invoices[idx] = {
        ...this.store.invoices[idx],
        invoice_number: num,
        transporter_id: tId,
        amount: amt,
        paid_amount: paid,
        payment_date: pDate,
        status: stat,
        dispute_reason: reason
      };
      saveStore(this.store);
      return { rows: [this.store.invoices[idx]] };
    }

    if (sql.startsWith('DELETE FROM invoices WHERE id = $1')) {
      const id = parseInt(params[0]);
      const idx = this.store.invoices.findIndex(i => i.id === id);
      if (idx === -1) return { rows: [] };
      const deleted = this.store.invoices[idx];
      this.store.invoices.splice(idx, 1);
      saveStore(this.store);
      return { rows: [deleted] };
    }

    // -- SYSTEM SETTINGS QUERIES
    if (sql.startsWith("SELECT value FROM system_settings WHERE key = 'scoring_weights'")) {
      const settings = this.store.system_settings.find(s => s.key === 'scoring_weights');
      return { rows: settings ? [{ value: settings.value }] : [] };
    }

    if (sql.startsWith("INSERT INTO system_settings") || sql.startsWith("UPDATE system_settings")) {
      const val = JSON.parse(params[0]);
      let settings = this.store.system_settings.find(s => s.key === 'scoring_weights');
      if (!settings) {
        settings = { key: 'scoring_weights', value: val };
        this.store.system_settings.push(settings);
      } else {
        settings.value = val;
      }
      saveStore(this.store);
      return { rows: [{ value: settings.value }] };
    }

    // -- USERS QUERIES
    if (sql === 'SELECT id FROM users WHERE username = $1 OR email = $2') {
      const username = params[0];
      const email = params[1];
      const user = this.store.users.find(u => u.username === username || u.email === email);
      return { rows: user ? [{ id: user.id }] : [] };
    }

    if (sql.startsWith('INSERT INTO users')) {
      const username = params[0];
      const email = params[1];
      const password_hash = params[2];
      const role = params[3];
      const id = this.store.users.length > 0 
        ? Math.max(...this.store.users.map(u => u.id)) + 1 
        : 1;

      const newUser = {
        id,
        username,
        email,
        password_hash,
        role,
        created_at: new Date().toISOString()
      };
      this.store.users.push(newUser);
      saveStore(this.store);
      return { rows: [newUser] };
    }

    if (sql === 'SELECT * FROM users WHERE username = $1 OR email = $1') {
      const identifier = params[0];
      const user = this.store.users.find(u => u.username === identifier || u.email === identifier);
      return { rows: user ? [user] : [] };
    }

    // -- TRANSPORTER STATUS UPDATE (MANAGER APPROVAL)
    if (sql.startsWith('UPDATE transporters SET status = $1, is_active = $2')) {
      const status = params[0];
      const is_active = params[1];
      const id = parseInt(params[2]);

      const idx = this.store.transporters.findIndex(t => t.id === id);
      if (idx === -1) return { rows: [] };

      this.store.transporters[idx].status = status;
      this.store.transporters[idx].is_active = is_active;

      saveStore(this.store);
      return { rows: [this.store.transporters[idx]] };
    }

    // 3. SELECT transporters list with score, tier, and counts
    if (sql.startsWith('SELECT t.id, t.name') && sql.includes('FROM transporters t') && !sql.includes('as partner')) {
      const list = this.store.transporters.map(t => {
        const tRatings = this.store.ratings
          .filter(r => r.transporter_id === t.id)
          .sort((a, b) => b.rating_month.localeCompare(a.rating_month));
        
        const latest = tRatings[0] || {};
        return {
          ...t,
          latest_score: latest.performance_score !== undefined ? parseFloat(latest.performance_score) : null,
          latest_tier: latest.tier || null,
          records_count: tRatings.length
        };
      });
      // Sort t.name ASC
      list.sort((a, b) => a.name.localeCompare(b.name));
      return { rows: list };
    }

    // 4. SELECT transporter detail
    if (sql === 'SELECT * FROM transporters WHERE id = $1') {
      const id = parseInt(params[0]);
      const t = this.store.transporters.find(x => x.id === id);
      return { rows: t ? [t] : [] };
    }

    // 5. SELECT ratings for single transporter
    if (sql === 'SELECT * FROM performance_ratings WHERE transporter_id = $1 ORDER BY rating_month DESC') {
      const tId = parseInt(params[0]);
      const list = this.store.ratings
        .filter(r => r.transporter_id === tId)
        .sort((a, b) => b.rating_month.localeCompare(a.rating_month));
      return { rows: list };
    }

    // 6. UPDATE transporter
    if (sql.startsWith('UPDATE transporters SET name = $1')) {
      const name = params[0];
      const contact = params[1];
      const phone = params[2];
      const email = params[3];
      const city = params[4];
      const is_active = params[5];
      const id = parseInt(params[6]);

      const tIdx = this.store.transporters.findIndex(x => x.id === id);
      if (tIdx === -1) return { rows: [] };

      this.store.transporters[tIdx].name = name;
      this.store.transporters[tIdx].contact_person = contact;
      this.store.transporters[tIdx].phone = phone;
      this.store.transporters[tIdx].email = email;
      this.store.transporters[tIdx].city = city;
      if (is_active !== null && is_active !== undefined) {
        this.store.transporters[tIdx].is_active = is_active;
      }
      saveStore(this.store);
      return { rows: [this.store.transporters[tIdx]] };
    }

    // 7. DELETE transporter (Soft Delete)
    if (sql.startsWith('UPDATE transporters SET is_active = false WHERE id = $1')) {
      const id = parseInt(params[0]);
      const tIdx = this.store.transporters.findIndex(x => x.id === id);
      if (tIdx === -1) return { rows: [] };
      this.store.transporters[tIdx].is_active = false;
      saveStore(this.store);
      return { rows: [this.store.transporters[tIdx]] };
    }

    // 8. SELECT transporter ID check
    if (sql === 'SELECT id FROM transporters WHERE name = $1') {
      const name = params[0];
      const t = this.store.transporters.find(x => x.name.toLowerCase() === name.toLowerCase());
      return { rows: t ? [{ id: t.id }] : [] };
    }
    if (sql === 'SELECT id FROM transporters WHERE name = $1 AND id <> $2') {
      const name = params[0];
      const id = parseInt(params[1]);
      const t = this.store.transporters.find(x => x.name.toLowerCase() === name.toLowerCase() && x.id !== id);
      return { rows: t ? [{ id: t.id }] : [] };
    }

    // 9. Ratings list count (SELECT COUNT(*)::int FROM performance_ratings)
    // 10. Ratings list queries
    if (sql.includes('performance_ratings r JOIN transporters t') && !sql.includes('>= $') && !sql.includes('AVG(') && !sql.includes('latest_tiers')) {
      // Find matching ratings
      let list = this.store.ratings.map(r => {
        const t = this.store.transporters.find(x => x.id === r.transporter_id) || {};
        return {
          ...r,
          transporter_name: t.name || 'Unknown'
        };
      });

      // Filter
      // We check parameter index from parameters dynamically
      const transporter_id_match = sql.match(/r\.transporter_id = \$(\d)/);
      if (transporter_id_match) {
        const val = parseInt(params[parseInt(transporter_id_match[1]) - 1]);
        list = list.filter(r => r.transporter_id === val);
      }
      const month_match = sql.match(/r\.rating_month = \$(\d)/);
      if (month_match) {
        const val = params[parseInt(month_match[1]) - 1];
        list = list.filter(r => r.rating_month === val);
      }
      const tier_match = sql.match(/r\.tier = \$(\d)/);
      if (tier_match) {
        const val = params[parseInt(tier_match[1]) - 1];
        list = list.filter(r => r.tier === val);
      }
      const search_match = sql.match(/\(t\.name ILIKE \$(\d) OR r\.notes ILIKE \$(\d)\)/);
      if (search_match) {
        const val = params[parseInt(search_match[1]) - 1].replace(/%/g, '').toLowerCase();
        list = list.filter(r => 
          r.transporter_name.toLowerCase().includes(val) || 
          (r.notes && r.notes.toLowerCase().includes(val))
        );
      }

      if (sql.includes('SELECT COUNT(*)::int')) {
        return { rows: [{ count: list.length }] };
      }

      // Sort
      list.sort((a, b) => {
        const monthCompare = b.rating_month.localeCompare(a.rating_month);
        if (monthCompare !== 0) return monthCompare;
        return a.transporter_name.localeCompare(b.transporter_name);
      });

      // Pagination
      const limit_match = sql.match(/LIMIT \$(\d+)/);
      const offset_match = sql.match(/OFFSET \$(\d+)/);
      if (limit_match && offset_match) {
        const limitVal = parseInt(params[parseInt(limit_match[1]) - 1]);
        const offsetVal = parseInt(params[parseInt(offset_match[1]) - 1]);
        list = list.slice(offsetVal, offsetVal + limitVal);
      }

      return { rows: list };
    }

    // 11. SELECT single rating details
    if (sql.startsWith('SELECT r.*, t.name as transporter_name FROM performance_ratings r JOIN transporters t ON r.transporter_id = t.id WHERE r.id = $1')) {
      const id = parseInt(params[0]);
      const r = this.store.ratings.find(x => x.id === id);
      if (!r) return { rows: [] };
      const t = this.store.transporters.find(x => x.id === r.transporter_id) || {};
      return { rows: [{ ...r, transporter_name: t.name }] };
    }

    // 12. Rating checks
    if (sql.startsWith('SELECT id FROM performance_ratings WHERE transporter_id = $1 AND rating_month = $2')) {
      const tId = parseInt(params[0]);
      const month = params[1];
      let r;
      if (sql.includes('AND id <> $3')) {
        const id = parseInt(params[2]);
        r = this.store.ratings.find(x => x.transporter_id === tId && x.rating_month === month && x.id !== id);
      } else {
        r = this.store.ratings.find(x => x.transporter_id === tId && x.rating_month === month);
      }
      return { rows: r ? [{ id: r.id }] : [] };
    }
    if (sql === 'SELECT is_active FROM transporters WHERE id = $1') {
      const id = parseInt(params[0]);
      const t = this.store.transporters.find(x => x.id === id);
      return { rows: t ? [{ is_active: t.is_active }] : [] };
    }

    // 13. INSERT INTO performance_ratings
    if (sql.startsWith('INSERT INTO performance_ratings')) {
      const tId = parseInt(params[0]);
      const month = params[1];
      const onTime = parseFloat(params[2]);
      const damage = parseInt(params[3]);
      const billing = parseFloat(params[4]);
      const feedback = parseFloat(params[5]);
      const score = parseFloat(params[6]);
      const tier = params[7];
      const notes = params[8];
      
      const id = this.store.ratings.length > 0 
        ? Math.max(...this.store.ratings.map(x => x.id)) + 1 
        : 1;

      const newR = {
        id,
        transporter_id: tId,
        rating_month: month,
        on_time_delivery_rate: onTime,
        damage_incidents: damage,
        billing_accuracy: billing,
        client_feedback_score: feedback,
        performance_score: score,
        tier,
        notes,
        created_at: new Date().toISOString()
      };
      this.store.ratings.push(newR);
      saveStore(this.store);
      return { rows: [newR] };
    }

    // 14. UPDATE performance_ratings
    if (sql.startsWith('UPDATE performance_ratings SET transporter_id = $1')) {
      const tId = parseInt(params[0]);
      const month = params[1];
      const onTime = parseFloat(params[2]);
      const damage = parseInt(params[3]);
      const billing = parseFloat(params[4]);
      const feedback = parseFloat(params[5]);
      const score = parseFloat(params[6]);
      const tier = params[7];
      const notes = params[8];
      const id = parseInt(params[9]);

      const rIdx = this.store.ratings.findIndex(x => x.id === id);
      if (rIdx === -1) return { rows: [] };

      this.store.ratings[rIdx] = {
        ...this.store.ratings[rIdx],
        transporter_id: tId,
        rating_month: month,
        on_time_delivery_rate: onTime,
        damage_incidents: damage,
        billing_accuracy: billing,
        client_feedback_score: feedback,
        performance_score: score,
        tier,
        notes
      };
      saveStore(this.store);
      return { rows: [this.store.ratings[rIdx]] };
    }

    // 15. DELETE single rating
    if (sql === 'DELETE FROM performance_ratings WHERE id = $1 RETURNING *') {
      const id = parseInt(params[0]);
      const rIdx = this.store.ratings.findIndex(x => x.id === id);
      if (rIdx === -1) return { rows: [] };
      const deleted = this.store.ratings[rIdx];
      this.store.ratings.splice(rIdx, 1);
      saveStore(this.store);
      return { rows: [deleted] };
    }
    if (sql === 'SELECT transporter_id, rating_month FROM performance_ratings WHERE id = $1') {
      const id = parseInt(params[0]);
      const r = this.store.ratings.find(x => x.id === id);
      return { rows: r ? [{ transporter_id: r.transporter_id, rating_month: r.rating_month }] : [] };
    }
    if (sql === 'SELECT * FROM performance_ratings WHERE id = $1') {
      const id = parseInt(params[0]);
      const r = this.store.ratings.find(x => x.id === id);
      return { rows: r ? [r] : [] };
    }

    // 16. DELETE alerts for transporter/month
    if (sql === 'DELETE FROM alerts WHERE transporter_id = $1 AND rating_month = $2 AND is_resolved = false') {
      const tId = parseInt(params[0]);
      const month = params[1];
      this.store.alerts = this.store.alerts.filter(a => 
        !(a.transporter_id === tId && a.rating_month === month && !a.is_resolved)
      );
      saveStore(this.store);
      return { rows: [] };
    }

    // 17. INSERT INTO alerts
    if (sql.startsWith('INSERT INTO alerts')) {
      const tId = parseInt(params[0]);
      const alert_type = params[1];
      const severity = params[2];
      const message = params[3];
      const month = params[4];
      const is_resolved = params[5] || false;
      const id = this.store.alerts.length > 0 
        ? Math.max(...this.store.alerts.map(x => x.id)) + 1 
        : 1;

      const newA = {
        id,
        transporter_id: tId,
        alert_type,
        severity,
        message,
        rating_month: month,
        is_resolved,
        created_at: new Date().toISOString()
      };
      this.store.alerts.push(newA);
      saveStore(this.store);
      return { rows: [newA] };
    }

    // 18. Dashboard stats
    if (sql === 'SELECT COUNT(*)::int FROM transporters WHERE is_active = true') {
      const activeTs = this.store.transporters.filter(x => x.is_active).length;
      return { rows: [{ count: activeTs }] };
    }
    if (sql === 'SELECT ROUND(AVG(performance_score), 1)::float as avg_score FROM performance_ratings') {
      if (this.store.ratings.length === 0) return { rows: [{ avg_score: 0 }] };
      const sum = this.store.ratings.reduce((acc, x) => acc + parseFloat(x.performance_score), 0);
      const avg = Math.round((sum / this.store.ratings.length) * 10) / 10;
      return { rows: [{ avg_score: avg }] };
    }
    if (sql === 'SELECT COUNT(*)::int FROM performance_ratings') {
      return { rows: [{ count: this.store.ratings.length }] };
    }
    if (sql === 'SELECT COUNT(*)::int FROM alerts WHERE is_resolved = false') {
      const count = this.store.alerts.filter(x => !x.is_resolved).length;
      return { rows: [{ count }] };
    }
    if (sql.startsWith('SELECT t.name, ROUND(AVG(r.performance_score), 1)::float as avg_score') && sql.includes('ORDER BY avg_score DESC')) {
      // Find top performer
      const activeTIds = new Set(this.store.transporters.filter(x => x.is_active).map(x => x.id));
      if (activeTIds.size === 0) return { rows: [] };

      const averages = [];
      activeTIds.forEach(tId => {
        const tRatings = this.store.ratings.filter(r => r.transporter_id === tId);
        if (tRatings.length > 0) {
          const sum = tRatings.reduce((acc, r) => acc + parseFloat(r.performance_score), 0);
          const avg = Math.round((sum / tRatings.length) * 10) / 10;
          const tName = (this.store.transporters.find(x => x.id === tId) || {}).name || '';
          averages.push({ name: tName, avg_score: avg });
        }
      });
      averages.sort((a, b) => {
        const sc = b.avg_score - a.avg_score;
        if (sc !== 0) return sc;
        return a.name.localeCompare(b.name);
      });
      return { rows: averages.slice(0, 1) };
    }

    // 19. Dashboard trend (Average score over time)
    if (sql.startsWith('SELECT rating_month, ROUND(AVG(performance_score)') && sql.includes('GROUP BY rating_month')) {
      const monthsMap = {};
      this.store.ratings.forEach(r => {
        if (!monthsMap[r.rating_month]) monthsMap[r.rating_month] = [];
        monthsMap[r.rating_month].push(parseFloat(r.performance_score));
      });

      const list = Object.keys(monthsMap).map(m => {
        const sum = monthsMap[m].reduce((a, b) => a + b, 0);
        const avg = Math.round((sum / monthsMap[m].length) * 10) / 10;
        return { rating_month: m, avg_score: avg };
      });
      list.sort((a, b) => b.rating_month.localeCompare(a.rating_month));
      return { rows: list.slice(0, 7) };
    }

    // 20. Dashboard tier distribution
    if (sql.includes('SELECT tier, COUNT(*)::int as count') && sql.includes('latest_tiers')) {
      const activeTIds = new Set(this.store.transporters.filter(x => x.is_active).map(x => x.id));
      const latestTiersMap = {};
      
      activeTIds.forEach(tId => {
        const tRatings = this.store.ratings
          .filter(r => r.transporter_id === tId)
          .sort((a, b) => b.rating_month.localeCompare(a.rating_month));
        
        if (tRatings.length > 0) {
          latestTiersMap[tId] = tRatings[0].tier;
        }
      });

      const counts = { EXCELLENT: 0, GOOD: 0, AVERAGE: 0, POOR: 0 };
      Object.values(latestTiersMap).forEach(tier => {
        if (tier in counts) counts[tier]++;
      });

      const list = Object.keys(counts).map(tier => ({
        tier,
        count: counts[tier]
      }));
      return { rows: list };
    }

    // 21. Dashboard leaderboard
    if (sql.includes('partner') && sql.includes('records') && sql.includes('avg_score')) {
      const activeTs = this.store.transporters.filter(x => x.is_active);
      const list = activeTs.map(t => {
        const tRatings = this.store.ratings.filter(r => r.transporter_id === t.id);
        const tRatingsSorted = [...tRatings].sort((a, b) => b.rating_month.localeCompare(a.rating_month));
        
        const sum = tRatings.reduce((acc, r) => acc + parseFloat(r.performance_score), 0);
        const avg = tRatings.length > 0 ? Math.round((sum / tRatings.length) * 10) / 10 : 0;
        
        return {
          id: t.id,
          partner: t.name,
          records: tRatings.length,
          avg_score: avg,
          tier: tRatingsSorted[0]?.tier || 'POOR'
        };
      });
      list.sort((a, b) => b.avg_score - a.avg_score);
      return { rows: list.slice(0, 10) };
    }

    // 22. SELECT Alerts list
    if (sql.includes('SELECT a.*, t.name as transporter_name FROM alerts a JOIN transporters t')) {
      let list = this.store.alerts.map(a => {
        const t = this.store.transporters.find(x => x.id === a.transporter_id) || {};
        return {
          ...a,
          transporter_name: t.name || 'Unknown'
        };
      });

      if (!sql.includes('include_resolved') && sql.includes('a.is_resolved = false')) {
        list = list.filter(x => !x.is_resolved);
      }

      list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
      return { rows: list };
    }

    // 23. PUT resolve specific alert
    if (sql.startsWith('UPDATE alerts SET is_resolved = true WHERE id = $1')) {
      const id = parseInt(params[0]);
      const idx = this.store.alerts.findIndex(x => x.id === id);
      if (idx === -1) return { rows: [] };
      this.store.alerts[idx].is_resolved = true;
      saveStore(this.store);
      return { rows: [this.store.alerts[idx]] };
    }

    // 24. PUT resolve all alerts
    if (sql.startsWith('UPDATE alerts SET is_resolved = true WHERE is_resolved = false')) {
      const updated = [];
      this.store.alerts = this.store.alerts.map(a => {
        if (!a.is_resolved) {
          a.is_resolved = true;
          updated.push(a);
        }
        return a;
      });
      saveStore(this.store);
      return { rows: updated };
    }

    // 25. Reports summary aggregations & CSV export
    if (sql.includes('FROM performance_ratings r') && sql.includes('r.rating_month >= $1')) {
      const fromMonth = params[0];
      const toMonth = params[1];
      const tId = params[2] ? parseInt(params[2]) : null;

      let list = this.store.ratings.filter(r => {
        const monthInRange = r.rating_month >= fromMonth && r.rating_month <= toMonth;
        const tIdMatch = tId === null || r.transporter_id === tId;
        return monthInRange && tIdMatch;
      });

      // Join
      let joinedList = list.map(r => {
        const t = this.store.transporters.find(x => x.id === r.transporter_id) || {};
        return {
          ...r,
          partner_name: t.name || 'Unknown'
        };
      });

      if (sql.includes('COUNT(DISTINCT r.transporter_id)')) {
        const uniquePartners = new Set(list.map(x => x.transporter_id)).size;
        return { rows: [{ count: uniquePartners }] };
      }
      if (sql.includes('COUNT(r.id)')) {
        return { rows: [{ count: list.length }] };
      }
      if (sql.includes('AVG(r.performance_score)') && !sql.includes('GROUP BY')) {
        if (list.length === 0) return { rows: [{ avg_score: 0 }] };
        const sum = list.reduce((a, b) => a + parseFloat(b.performance_score), 0);
        const avg = Math.round((sum / list.length) * 10) / 10;
        return { rows: [{ avg_score: avg }] };
      }
      
      // Horizontal bar comparison: partner name & average score
      if (sql.includes('t.name as partner') && sql.includes('GROUP BY t.id, t.name')) {
        const sums = {};
        const counts = {};
        joinedList.forEach(item => {
          if (!sums[item.partner_name]) {
            sums[item.partner_name] = 0;
            counts[item.partner_name] = 0;
          }
          sums[item.partner_name] += parseFloat(item.performance_score);
          counts[item.partner_name]++;
        });

        const comparison = Object.keys(sums).map(name => ({
          partner: name,
          avg_score: Math.round((sums[name] / counts[name]) * 10) / 10
        }));
        comparison.sort((a, b) => b.avg_score - a.avg_score);
        return { rows: comparison };
      }

      // Line chart trend: monthly averages
      if (sql.includes('r.rating_month as month') && sql.includes('GROUP BY r.rating_month')) {
        const sums = {};
        const counts = {};
        joinedList.forEach(item => {
          if (!sums[item.rating_month]) {
            sums[item.rating_month] = 0;
            counts[item.rating_month] = 0;
          }
          sums[item.rating_month] += parseFloat(item.performance_score);
          counts[item.rating_month]++;
        });

        const trend = Object.keys(sums).map(m => ({
          month: m,
          avg_score: Math.round((sums[m] / counts[m]) * 10) / 10
        }));
        trend.sort((a, b) => a.month.localeCompare(b.month));
        return { rows: trend };
      }

      // Default reports data select (for CSV)
      joinedList.sort((a, b) => {
        const monthCompare = b.rating_month.localeCompare(a.rating_month);
        if (monthCompare !== 0) return monthCompare;
        return a.partner_name.localeCompare(b.partner_name);
      });
      return { rows: joinedList };
    }

    // 26. Reports alerts count
    if (sql.includes('FROM alerts a') && sql.includes('a.rating_month >= $1')) {
      const fromMonth = params[0];
      const toMonth = params[1];
      const tId = params[2] ? parseInt(params[2]) : null;

      const filteredAlerts = this.store.alerts.filter(a => {
        const monthInRange = a.rating_month >= fromMonth && a.rating_month <= toMonth;
        const tIdMatch = tId === null || a.transporter_id === tId;
        return monthInRange && tIdMatch;
      });

      return { rows: [{ count: filteredAlerts.length }] };
    }

    // 27. Min/Max month bounds query
    if (sql.includes('MIN(rating_month) as min_month')) {
      if (this.store.ratings.length === 0) {
        return { rows: [{ min_month: '2025-12', max_month: '2026-06' }] };
      }
      const sortedMonths = this.store.ratings.map(r => r.rating_month).sort();
      return { 
        rows: [{ 
          min_month: sortedMonths[0], 
          max_month: sortedMonths[sortedMonths.length - 1] 
        }] 
      };
    }

    // Default return
    console.warn('Unhandled SQL query in mock client:', sql);
    return { rows: [] };
  }
}

let poolInstance;
if (process.env.DATABASE_URL) {
  console.log('Connecting to Supabase/PostgreSQL database...');
  poolInstance = new PgPool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1')
      ? false
      : { rejectUnauthorized: false }
  });
} else {
  // In serverless environments, the mock JSON store won't work (read-only filesystem)
  // Check if we're likely in a serverless environment
  const isServerless = !!(process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  if (isServerless) {
    console.error('FATAL: DATABASE_URL environment variable is not set in the serverless environment.');
    console.error('Please add DATABASE_URL to your Netlify/Vercel environment variables.');
    // Create a stub pool that returns meaningful errors
    poolInstance = {
      query: async () => { throw new Error('DATABASE_URL is not configured. Please set it in your deployment dashboard.'); },
      connect: async () => { throw new Error('DATABASE_URL is not configured.'); },
      on: () => {}
    };
  } else {
    console.log('DATABASE_URL is not set. Running on local mock JSON store.');
    poolInstance = new Pool();
  }
}

module.exports = poolInstance;
