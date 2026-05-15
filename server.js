const express = require('express');
const sqlite3 = require('sqlite3').verbose();
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

// Initialize SQLite database
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        // Create contacts table if it doesn't exist
        db.run(`CREATE TABLE IF NOT EXISTS contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            subject TEXT,
            message TEXT NOT NULL,
            is_contacted BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, () => {
            // Attempt to add column to existing table (will silently fail if it already exists)
            db.run("ALTER TABLE contacts ADD COLUMN is_contacted BOOLEAN DEFAULT 0", () => {});
        });
    }
});

// API Endpoint to receive contact form submissions
app.post('/api/contact', (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const sql = `INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)`;
    db.run(sql, [name, email, subject, message], function(err) {
        if (err) {
            console.error('Error inserting data:', err.message);
            return res.status(500).json({ error: 'Failed to save your message.' });
        }
        res.status(201).json({ message: 'Message sent successfully!', id: this.lastID });
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
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching data:', err.message);
            return res.status(500).json({ error: 'Failed to fetch messages.' });
        }
        res.json(rows);
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

    const sql = `UPDATE contacts SET is_contacted = ? WHERE id = ?`;
    db.run(sql, [is_contacted ? 1 : 0, id], function(err) {
        if (err) {
            console.error('Error updating data:', err.message);
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
