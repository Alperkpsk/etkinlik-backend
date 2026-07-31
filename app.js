const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// SQLite veritabanı dosyası bağlantısı
const dbPath = path.join(__dirname, 'etkinlikcalendar.db');
const db = new sqlite3.Database(dbPath);

// Tabloları ve varsayılan verileri otomatik oluştur
db.serialize(() => {
    // 1. Takvim Etkinlikleri Tablosu
    db.run(`
        CREATE TABLE IF NOT EXISTS takvim_etkinlikleri (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            tarih TEXT,
            baslangic INTEGER,
            bitis INTEGER,
            etkinlik_id INTEGER,
            person TEXT,
            renk_id INTEGER
        )
    `);

    // 2. Etkinlik Türleri Tablosu
    db.run(`
        CREATE TABLE IF NOT EXISTS etkinlik (
            etkinlik_id INTEGER PRIMARY KEY AUTOINCREMENT,
            ad TEXT
        )
    `, () => {
        // Tablo boşsa varsayılan etkinlik türlerini ekle
        db.get("SELECT COUNT(*) as count FROM etkinlik", (err, row) => {
            if (row && row.count === 0) {
                db.run("INSERT INTO etkinlik (ad) VALUES ('Düğün'), ('Kına'), ('Nişan'), ('Sünnet'), ('Toplantı')");
            }
        });
    });

    // 3. Renkler Tablosu
    db.run(`
        CREATE TABLE IF NOT EXISTS renkler (
            renk_id INTEGER PRIMARY KEY AUTOINCREMENT,
            renkAdi TEXT,
            renkKodu TEXT,
            etkinlik_id INTEGER
        )
    `, () => {
        // Tablo boşsa varsayılan renkleri ekle
        db.get("SELECT COUNT(*) as count FROM renkler", (err, row) => {
            if (row && row.count === 0) {
                db.run("INSERT INTO renkler (renkAdi, renkKodu, etkinlik_id) VALUES ('Kırmızı', '#ff4d4f', 1), ('Yeşil', '#52c41a', 2), ('Mavi', '#1890ff', 3), ('Sarı', '#fadb14', 4), ('Mor', '#722ed1', 5)");
            }
        });
    });
});

// --- ROTALAR (API ENDPOINTS) ---

// ETKİNLİK TÜRLERİNİ GETİR
app.get('/api/etkinlikler', (req, res) => {
    db.all('SELECT * FROM etkinlik', [], (err, rows) => {
        if (err) return res.status(500).json({ mesaj: "Etkinlikler çekilemedi." });
        res.json(rows);
    });
});

// RENKLERİ GETİR
app.get('/api/renkler', (req, res) => {
    db.all('SELECT * FROM renkler', [], (err, rows) => {
        if (err) return res.status(500).json({ mesaj: "Renkler çekilemedi." });
        res.json(rows);
    });
});

// TAKVİM ETKİNLİKLERİNİ GETİR
app.get('/api/takvim-etkinlikleri', (req, res) => {
    db.all('SELECT * FROM takvim_etkinlikleri', [], (err, rows) => {
        if (err) return res.status(500).json({ mesaj: "Takvim etkinlikleri alınamadı." });
        res.json(rows);
    });
});

// YENİ ETKİNLİK KAYDET
app.post('/api/takvim-etkinlik-kaydet', (req, res) => {
    const { tarih, baslangic, bitis, etkinlik_id, person, renk_id } = req.body;
    const sql = `INSERT INTO takvim_etkinlikleri (tarih, baslangic, bitis, etkinlik_id, person, renk_id) VALUES (?, ?, ?, ?, ?, ?)`;
    
    db.run(sql, [tarih, baslangic, bitis, etkinlik_id, person || "", renk_id], function(err) {
        if (err) return res.status(500).json({ basarili: false, mesaj: "Etkinlik kaydedilemedi." });
        res.json({ basarili: true, id: this.lastID, mesaj: "Etkinlik başarıyla kaydedildi!" });
    });
});

// ETKİNLİK GÜNCELLE
app.put('/api/takvim-etkinlik-guncelle/:id', (req, res) => {
    const id = req.params.id;
    const { tarih, baslangic, bitis, etkinlik_id, person, renk_id } = req.body;
    const sql = `UPDATE takvim_etkinlikleri SET tarih = ?, baslangic = ?, bitis = ?, etkinlik_id = ?, person = ?, renk_id = ? WHERE id = ?`;

    db.run(sql, [tarih, baslangic, bitis, etkinlik_id, person || "", renk_id, id], function(err) {
        if (err) return res.status(500).json({ basarili: false, mesaj: "Etkinlik güncellenemedi." });
        res.json({ basarili: true, mesaj: "Etkinlik başarıyla güncellendi!" });
    });
});

// ETKİNLİK SİL
app.delete('/api/takvim-etkinlik-sil/:id', (req, res) => {
    const id = req.params.id;
    db.run(`DELETE FROM takvim_etkinlikleri WHERE id = ?`, [id], function(err) {
        if (err) return res.status(500).json({ basarili: false, mesaj: "Etkinlik silinemedi." });
        res.json({ basarili: true, mesaj: "Etkinlik silindi." });
    });
});

// Sunucuyu başlat (Render ortam değişkenindeki PORT'u otomatik kullanır)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Sunucu aktif! Port: ${PORT}`);
});