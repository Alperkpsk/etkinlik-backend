import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';

const app = express();
app.use(cors());
app.use(express.json());

// Ortam değişkenleri kontrolü
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error("HATA: TURSO_DATABASE_URL veya TURSO_AUTH_TOKEN çevre değişkenleri eksik!");
}

// Turso Veritabanı Bağlantısı
const db = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

// Veritabanı Tablolarını Otomatik Oluşturma (Verileri silmeden güvenli kurulum)
async function veritabaniKurulumu() {
  try {
    // 1. Tanımlı Etkinlik Türleri Tablosu
    await db.execute(`
      CREATE TABLE IF NOT EXISTS etkinlik_turleri (
        etkinlik_id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT
      )
    `);

    // 2. Renkler Tablosu
    await db.execute(`
      CREATE TABLE IF NOT EXISTS renkler (
        renk_id INTEGER PRIMARY KEY AUTOINCREMENT,
        renkAdi TEXT,
        renkKodu TEXT,
        etkinlik_id INTEGER
      )
    `);

    // 3. Takvime Eklenen Gerçek Etkinlikler Tablosu (Verileriniz burada saklanır)
    await db.execute(`
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

    // Etkinlik türleri tablosu boşsa örnek türleri ekle (Düğün, Nişan, Yemek, Söz, Sünnet)
    const turKontrol = await db.execute("SELECT COUNT(*) as sayi FROM etkinlik_turleri");
    if (turKontrol.rows[0].sayi === 0) {
      await db.execute(`
        INSERT INTO etkinlik_turleri (etkinlik_id, ad) VALUES 
        (1, 'Düğün'),
        (2, 'Nişan'),
        (3, 'Yemek'),
        (4, 'Söz'),
        (5, 'Sünnet')
      `);
      console.log("Örnek etkinlik türleri eklendi.");
    }

    // Renkler tablosu boşsa renkleri ekle
    const renkKontrol = await db.execute("SELECT COUNT(*) as sayi FROM renkler");
    if (renkKontrol.rows[0].sayi === 0) {
      await db.execute(`
        INSERT INTO renkler (renk_id, renkAdi, renkKodu, etkinlik_id) VALUES 
        (1, 'Kırmızı', '#c0392b', 1),
        (2, 'Yeşil', '#27ae60', 2),
        (3, 'Turuncu', '#e67e22', 3),
        (4, 'Mor', '#8e44ad', 4),
        (5, 'Mavi', '#2980b9', 5)
      `);
      console.log("Örnek renkler eklendi.");
    }

    console.log("Veritabanı kurulumu başarıyla tamamlandı.");
  } catch (hata) {
    console.error("Veritabanı kurulum hatası:", hata);
  }
}

// Kurulumu başlat
veritabaniKurulumu();

// --- API ROTALARI ---

// Etkinlik türlerini getir
app.get('/api/etkinlikler', async (req, res) => {
    try {
        const sonuc = await db.execute("SELECT * FROM etkinlik_turleri");
        res.json(sonuc.rows);
    } catch (hata) {
        res.status(500).json({ hata: hata.message });
    }
});

// Renkleri getir
app.get('/api/renkler', async (req, res) => {
    try {
        const sonuc = await db.execute("SELECT * FROM renkler");
        res.json(sonuc.rows);
    } catch (hata) {
        res.status(500).json({ hata: hata.message });
    }
});

// Takvime kaydedilmiş tüm etkinlikleri getir
app.get('/api/takvim-etkinlikleri', async (req, res) => {
    try {
        const sonuc = await db.execute("SELECT * FROM takvim_etkinlikleri");
        res.json(sonuc.rows);
    } catch (hata) {
        res.status(500).json({ hata: hata.message });
    }
});

// Yeni takvim etkinliği kaydet
app.post('/api/takvim-etkinlik-kaydet', async (req, res) => {
    try {
        const { tarih, baslangic, bitis, etkinlik_id, person, renk_id } = req.body;
        await db.execute({
            sql: `INSERT INTO takvim_etkinlikleri (tarih, baslangic, bitis, etkinlik_id, person, renk_id) VALUES (?, ?, ?, ?, ?, ?)`,
            args: [tarih, baslangic, bitis, etkinlik_id, person, renk_id]
        });
        res.status(200).json({ mesaj: "Etkinlik başarıyla kaydedildi." });
    } catch (hata) {
        res.status(500).json({ hata: hata.message });
    }
});

// Var olan takvim etkinliğini güncelle
app.put('/api/takvim-etkinlik-guncelle/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { tarih, baslangic, bitis, etkinlik_id, person, renk_id } = req.body;
        await db.execute({
            sql: `UPDATE takvim_etkinlikleri SET tarih = ?, baslangic = ?, bitis = ?, etkinlik_id = ?, person = ?, renk_id = ? WHERE id = ?`,
            args: [tarih, baslangic, bitis, etkinlik_id, person, renk_id, id]
        });
        res.status(200).json({ mesaj: "Etkinlik başarıyla güncellendi." });
    } catch (hata) {
        res.status(500).json({ hata: hata.message });
    }
});

// Takvim etkinliğini sil
app.delete('/api/takvim-etkinlik-sil/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.execute({
            sql: `DELETE FROM takvim_etkinlikleri WHERE id = ?`,
            args: [id]
        });
        res.status(200).json({ mesaj: "Etkinlik başarıyla silindi." });
    } catch (hata) {
        res.status(500).json({ hata: hata.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
