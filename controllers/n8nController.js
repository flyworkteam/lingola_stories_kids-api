// Harf bazlı ElevenLabs alignment verisini, kelime bazlı (word_timestamps) formata çeviren yardımcı fonksiyon
const convertToWords = (alignment) => {
  if (!alignment) return null;

  // N8N'den gelen json yapısına göre anahtarları alıyoruz
  const chars = alignment.characters || [];
  const starts = alignment.character_start_times_seconds || alignment.start_times || [];
  const ends = alignment.character_end_times_seconds || alignment.end_times || [];

  if (!chars.length || !starts.length || !ends.length) return null;

  const n = Math.min(chars.length, starts.length, ends.length);
  const words = [];
  const word_starts = [];
  const word_ends = [];

  let current_word = "";
  let current_word_start = null;
  let current_word_end = null;

  for (let i = 0; i < n; i++) {
    const char = chars[i];
    const start = starts[i];
    const end = ends[i];

    if (char === " ") { // Boşluk görünce kelimeyi bitirip listeye ekliyoruz
      if (current_word) {
        words.push(current_word);
        word_starts.push(Number(current_word_start.toFixed(3)));
        word_ends.push(Number(current_word_end.toFixed(3)));
        current_word = "";
        current_word_start = null;
      }
    } else {
      if (current_word_start === null) {
        current_word_start = start;
      }
      current_word += char;
      current_word_end = end;
    }
  }

  // Döngü bitince son kelimeyi de ekliyoruz
  if (current_word) {
    words.push(current_word);
    word_starts.push(Number(current_word_start.toFixed(3)));
    word_ends.push(Number(current_word_end.toFixed(3)));
  }

  return JSON.stringify({
    words: words,
    start_times: word_starts,
    end_times: word_ends
  });
};


// Ana Webhook Controller Fonksiyonu
exports.createStoryFromWebhook = async (req, res, next) => {
  // N8N'den gelen tüm JSON verisini alıyoruz (category ve language dahil)
  const { title, introduction, cover_image_url, pages, category, language } = req.body;

  if (!title || !introduction || !pages || !pages.length) {
    const error = new Error('Eksik veri gönderildi. Title, introduction ve pages zorunludur.');
    error.statusCode = 400;
    return next(error);
  }

  // İşlemlerin yarım kalmaması için Transaction başlatıyoruz
  // (pool değişkeninin dosyanın üst kısmında tanımlandığını varsayıyoruz)
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Ana Hikayeyi 'stories' tablosuna ekle
    const totalPages = pages.length;
    const insertStoryQuery = `
      INSERT INTO stories (title, introduction, cover_image_url, total_pages,  is_popular) 
      VALUES (?, ?, ?, ?, 0)
    `;

    const [storyResult] = await connection.query(insertStoryQuery, [
      title,
      introduction,
      cover_image_url || null,
      totalPages
    ]);

    const newStoryId = storyResult.insertId;

    // 2. Sayfaları (Sections) ve Ses/Karaoke verilerini 'story_sections' tablosuna ekle
    const insertSectionQuery = `
      INSERT INTO story_sections 
      (story_id, title, content, page_number, elevenlabs_audio_url, word_timestamps)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    // 3. Kategoriyi 'story_categories' tablosuna ekle
    const insertCategoryQuery = `
      INSERT INTO story_categories 
      (story_id, category_name)
      VALUES (?, ?)
    `;

    await connection.query(insertCategoryQuery, [newStoryId, category]);

    for (const page of pages) {
      // N8N'den gelen ham 'alignment' verisini kelime bazlı JSON string'e çeviriyoruz
      const wordTimestampsJson = convertToWords(page.alignment) || null;

      await connection.query(insertSectionQuery, [
        newStoryId,
        `Page ${page.page_number}`,
        page.content,
        page.page_number,
        page.audio_url || page.elevenlabs_audio_url || null,
        wordTimestampsJson
      ]);
    }

    // Her şey başarılıysa veritabanına kalıcı olarak yaz (Commit)
    await connection.commit();
    res.status(201).json({ success: true, message: 'Hikaye başarıyla oluşturuldu', story_id: newStoryId });

  } catch (error) {
    // Hata çıkarsa hiçbir şeyi kaydetme (Rollback)
    await connection.rollback();
    next(error);
  } finally {
    connection.release(); // Bağlantıyı havuza geri bırak
  }
};