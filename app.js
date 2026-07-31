import express from 'express';
import cors from 'cors';
import { createClient } from '@libsql/client';

const app = express();
app.use(cors());
app.use(express.json());

// Turso Veritabanı Bağlantısı
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
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

    // 2. Renkler Tablosu (Krem, Koyu Lacivert, Yeşil, Kırmızı Paleti)
    await db.execute(`
      CREATE TABLE IF NOT EXISTS renkler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT,
        kod TEXT,
        kategori TEXT
      )
    `);

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

    console.log("Veritabanı kurulumu ve veri aktarımı başarıyla tamamlandı.");
  } catch (hata) {
    console.error("Veritabanı kurulum hatası:", hata);
  }
}

// Kurulumu başlat
veritabaniKurulumu();

// --- API ROTALARI (Endpoints) ---

// Renkleri Getir
app.get('/api/renkler', async (req, res) => {
    try {
        const sonuc = await db.execute("SELECT * FROM renkler");
        res.json(sonuc.rows);
    } catch (hata) {
        res.status(500).json({ hata: hata.message });
    }
});

// Etkinlikleri Getir
app.get('/api/etkinlikler', async (req, res) => {
    try {
        const sonuc = await db.execute("SELECT * FROM etkinlikler");
        res.json(sonuc.rows);
    } catch (hata) {
        res.status(500).json({ hata: hata.message });
    }
});

// Takvim Etkinlikleri İçin Alternatif Rota (Frontend uyumluluğu için)
app.get('/api/takvim-etkinlikleri', async (req, res) => {
    try {
        const sonuc = await db.execute("SELECT * FROM etkinlikler");
        res.json(sonuc.rows);
    } catch (hata) {
        res.status(500).json({ hata: hata.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
