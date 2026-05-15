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
app.use(express.static(path.join(__dirname)));

// Route: Home Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route: Admin Panel Clean URL
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// Initialize PostgreSQL database
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

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
            subject VARCHAR(255),
            message TEXT NOT NULL,
            is_contacted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating table:', err.stack);
            } else {
                // Attempt to add column to existing table (will silently fail if it already exists)
                pool.query("ALTER TABLE contacts ADD COLUMN is_contacted BOOLEAN DEFAULT FALSE", () => {});
            }
        });
    }
});

// API Endpoint to receive contact form submissions
app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const sql = `INSERT INTO contacts (name, email, subject, message) VALUES ($1, $2, $3, $4) RETURNING id`;
    pool.query(sql, [name, email, subject, message], (err, result) => {
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Admin panel available at http://localhost:${PORT}/admin.html`);
});
