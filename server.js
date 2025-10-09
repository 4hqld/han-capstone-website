const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

// 데이터베이스 연결
const db = new sqlite3.Database('./board.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the board database.');
});

// 테이블 생성
db.run('CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT NOT NULL)');

// 미들웨어 설정
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 새 메모 저장 API
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

// 메모 목록 불러오기 API (모든 메모)
app.get('/api/notes', (req, res) => {
    db.all("SELECT * FROM notes ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// 메모 삭제 API
app.delete('/api/notes/:id', (req, res) => {
    const { id } = req.params;

    db.run(`DELETE FROM notes WHERE id = ?`, id, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.status(200).json({ message: 'Note deleted successfully' });
    });
});


// 서버 시작
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});