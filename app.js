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

// Veritabanı Tablolarını ve Örnek Verileri Otomatik Oluşturma
async function veritabaniKurulumu() {
  try {
    // 1. Etkinlikler Tablosu
    await db.execute(`
      CREATE TABLE IF NOT EXISTS etkinlikler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        baslik TEXT,
        aciklama TEXT,
        tarih TEXT,
        saat TEXT,
        konum TEXT,
        tur TEXT
      )
    `);

    try {
      await db.execute(`ALTER TABLE etkinlikler ADD COLUMN tur TEXT`);
    } catch (e) {}

    // 2. Renkler Tablosu
    await db.execute(`
      CREATE TABLE IF NOT EXISTS renkler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT,
        kod TEXT,
        kategori TEXT
      )
    `);

    try {
      await db.execute(`ALTER TABLE renkler ADD COLUMN kategori TEXT`);
    } catch (e) {}

    // 3. Etkinlikler Tablosu Boşsa Örnek Veri Ekle
    const etkinlikKontrol = await db.execute("SELECT COUNT(*) as sayi FROM etkinlikler");
    if (etkinlikKontrol.rows[0].sayi === 0) {
      await db.execute(`
        INSERT INTO etkinlikler (baslik, aciklama, tarih, saat, konum, tur) 
        VALUES 
        ('Ahmet & Zeynep Düğün', 'Kır düğünü ve nikah merasimi', '2026-06-15', '19:00', 'Ankara Kır Bahçesi', 'Düğün'),
        ('Merve & Can Nişan', 'Aile arası nişan töreni', '2026-06-22', '14:00', 'Çankaya Salonu', 'Nişan')
      `);
      console.log("Örnek düğün ve nişan etkinlikleri eklendi.");
    }

    // 4. Renkler Tablosu Boşsa Örnek Veri Ekle
    const renkKontrol = await db.execute("SELECT COUNT(*) as sayi FROM renkler");
    if (renkKontrol.rows[0].sayi === 0) {
      await db.execute(`
        INSERT INTO renkler (ad, kod, kategori) 
        VALUES 
        ('Koyu Lacivert', '#1b263b', 'Genel Tasarım'),
        ('Krem', '#fdfbf7', 'Arka Plan'),
        ('Yeşil', '#27ae60', 'Nişan Etkinlikleri'),
        ('Kırmızı', '#c0392b', 'Düğün Etkinlikleri')
      `);
      console.log("Örnek renk paleti eklendi.");
    }

    console.log("Veritabanı kurulumu başarıyla tamamlandı.");
  } catch (hata) {
    console.error("Veritabanı kurulum hatası:", hata);
  }
}

// Kurulumu başlat
veritabaniKurulumu();

// --- API ROTALARI ---

app.get('/api/renkler', async (req, res) => {
    try {
        const sonuc = await db.execute("SELECT * FROM renkler");
        res.json(sonuc.rows);
    } catch (hata) {
        res.status(500).json({ hata: hata.message });
    }
});

app.get('/api/etkinlikler', async (req, res) => {
    try {
        const sonuc = await db.execute("SELECT * FROM etkinlikler");
        res.json(sonuc.rows);
    } catch (hata) {
        res.status(500).json({ hata: hata.message });
    }
});

app.get('/api/takvim-etkinlikleri', async (req, res) => {
    try {
        const sonuc = await db.execute("SELECT * FROM etkinlikler");
        res.json(sonuc.rows);
    } catch (hata) {
        res.status(500).json({ hata: hata.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
