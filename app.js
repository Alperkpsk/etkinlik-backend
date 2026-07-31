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

    // Tablo daha önceden var ve 'tur' sütunu eksikse ekle
    try {
      await db.execute(`ALTER TABLE etkinlikler ADD COLUMN tur TEXT`);
    } catch (e) {
      // Sütun zaten varsa hata verir, burası hatayı yakalayıp sessizce geçer
    }

    // 2. Renkler Tablosu
    await db.execute(`
      CREATE TABLE IF NOT EXISTS renkler (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ad TEXT,
        kod TEXT,
        kategori TEXT
      )
    `);

    // Tablo daha önceden var ve 'kategori' sütunu eksikse ekle
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
