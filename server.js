require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static assets (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// Route: Home Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route: Admin Panel Clean URL
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Clean URLs for Services & Company Pages
const cleanRoutes = [
    'billing', 'crm', 'booking', 'inventory', 'whatsapp', 
    'hosting', 'design', 'web', 'software', 'saas', 
    'about', 'privacy', 'terms'
];

cleanRoutes.forEach(route => {
    app.get(`/${route}`, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'service-details.html'));
    });
});

// Initialize PostgreSQL database
const sslConfig = process.env.DATABASE_URL && !(process.env.DATABASE_URL.includes('localhost') || process.env.DATABASE_URL.includes('127.0.0.1'))
    ? { rejectUnauthorized: false }
    : false;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
});

app.set('trust proxy', 1);

pool.connect((err) => {
    if (err) {
        console.error('Error connecting to PostgreSQL:', err.stack);
    } else {
        console.log('Connected to the PostgreSQL database.');
        // Create contacts table if it doesn't exist
        pool.query(`CREATE TABLE IF NOT EXISTS contacts (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(50) NOT NULL,
            subject VARCHAR(255),
            message TEXT NOT NULL,
            is_contacted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.stack);
            } else {
                pool.query("ALTER TABLE contacts ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NOT NULL DEFAULT ''", () => { });
                pool.query("ALTER TABLE contacts ADD COLUMN IF NOT EXISTS is_contacted BOOLEAN DEFAULT FALSE", () => { });
            }
            pool.query(`
CREATE INDEX IF NOT EXISTS idx_contacts_created_at 
ON contacts(created_at DESC)
`);

            pool.query(`
CREATE INDEX IF NOT EXISTS idx_contacts_is_contacted 
ON contacts(is_contacted)
`);
        });
    }
});

app.post('/api/contact', (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !message) {
        return res.status(400).json({ error: 'Name, email, phone, and message are required.' });
    }

    const sql = `INSERT INTO contacts (name, email, phone, subject, message) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
    pool.query(sql, [name, email, phone, subject, message], (err, result) => {
        if (err) {
            console.error('Error inserting data:', err.stack);
            return res.status(500).json({ error: 'Failed to save your message.' });
        }
        res.status(201).json({ message: 'Message sent successfully!', id: result.rows[0].id });
    });
});

// API Endpoint for Admin Panel to get all contacts
// Note: Secured with a simple header check for demonstration purposes
app.get('/api/admin/contacts', (req, res) => {
    const authHeader = req.headers['authorization'];

    // Very simple password check: "admin123"
    // In a real app, use proper JWT or session-based authentication
    if (authHeader !== 'Bearer admin123') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const sql = `SELECT * FROM contacts ORDER BY created_at DESC`;
    pool.query(sql, [], (err, result) => {
        if (err) {
            console.error('Error fetching data:', err.stack);
            return res.status(500).json({ error: 'Failed to fetch messages.' });
        }
        res.json(result.rows);
    });
});

// API Endpoint to toggle contact status
app.put('/api/admin/contacts/:id', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (authHeader !== 'Bearer admin123') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { is_contacted } = req.body;

    const sql = `UPDATE contacts SET is_contacted = $1 WHERE id = $2`;
    pool.query(sql, [is_contacted ? true : false, id], (err, result) => {
        if (err) {
            console.error('Error updating data:', err.stack);
            return res.status(500).json({ error: 'Failed to update status.' });
        }
        res.json({ success: true });
    });
});

// API Endpoint to delete a single contact inquiry
app.delete('/api/admin/contacts/:id', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (authHeader !== 'Bearer admin123') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const sql = `DELETE FROM contacts WHERE id = $1`;
    pool.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error deleting data:', err.stack);
            return res.status(500).json({ error: 'Failed to delete record.' });
        }
        res.json({ success: true });
    });
});

// API Endpoint to delete all contact inquiries
app.delete('/api/admin/contacts', (req, res) => {
    const authHeader = req.headers['authorization'];
    if (authHeader !== 'Bearer admin123') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const sql = `DELETE FROM contacts`;
    pool.query(sql, [], (err, result) => {
        if (err) {
            console.error('Error clearing data:', err.stack);
            return res.status(500).json({ error: 'Failed to clear records.' });
        }
        res.json({ success: true });
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Admin panel available at http://localhost:${PORT}/admin.html`);
});
