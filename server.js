const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

const db = new sqlite3.Database('./board.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the board database.');
});

db.run('CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT NOT NULL)');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/notes', (req, res) => {
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ error: 'Content cannot be empty' });
    }

    db.run(`INSERT INTO notes (content) VALUES (?)`, [content], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID, content: content });
    });
});

app.get('/api/notes', (req, res) => {
    db.all("SELECT * FROM notes ORDER BY id DESC LIMIT 10", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});