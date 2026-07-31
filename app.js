const express = require('express');
const cors = require('cors');
const { createClient } = require('@libsql/client');

const app = express();
app.use(cors());
app.use(express.json());

// Turso Bulut Veritabanı Bağlantısı
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Tabloyu Oluşturma
async function initDb() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS etkinlikler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        baslik TEXT,
        aciklama TEXT,
        tarih TEXT,
        saat TEXT,
        konum TEXT
      )
    `);
    console.log('✅ Turso bulut veritabanı tablosu hazır!');
  } catch (err) {
    console.error('Veritabanı hatası:', err);
  }
}
initDb();

// Etkinlikleri Getir (GET)
app.get('/api/etkinlikler', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM etkinlikler');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Etkinlik Kaydet (POST)
app.post('/api/takvim-etkinlik-kaydet', async (req, res) => {
  const { baslik, aciklama, tarih, saat, konum } = req.body;
  try {
    await db.execute({
      sql: 'INSERT INTO etkinlikler (baslik, aciklama, tarih, saat, konum) VALUES (?, ?, ?, ?, ?)',
      args: [baslik || '', aciklama || '', tarih || '', saat || '', konum || '']
    });
    res.json({ message: 'Etkinlik başarıyla kaydedildi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Etkinlik Güncelle (PUT)
app.put('/api/takvim-etkinlik-guncelle/:id', async (req, res) => {
  const { id } = req.params;
  const { baslik, aciklama, tarih, saat, konum } = req.body;
  try {
    await db.execute({
      sql: 'UPDATE etkinlikler SET baslik = ?, aciklama = ?, tarih = ?, saat = ?, konum = ? WHERE id = ?',
      args: [baslik || '', aciklama || '', tarih || '', saat || '', konum || '', id]
    });
    res.json({ message: 'Etkinlik güncellendi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Etkinlik Sil (DELETE)
app.delete('/api/takvim-etkinlik-sil/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.execute({
      sql: 'DELETE FROM etkinlikler WHERE id = ?',
      args: [id]
    });
    res.json({ message: 'Etkinlik silindi' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Sunucu aktif! Port: ${PORT}`);
});
