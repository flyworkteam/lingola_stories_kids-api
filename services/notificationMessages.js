/**
 * Lingola Kids Notification Messages
 *
 * Bildirim Kuralları:
 * - Çocuk dostu, baskısız, merak uyandıran ton
 * - Emir kipi kullanılmamalı
 * - Emoji kullanımı %5-10
 * - 3 Aktivite Katmanı:
 *     aktif      → bugün uygulamayı açmış (akşam, haftada 3-4 gün)
 *     yari_aktif → 24-48 saattir açılmamış (öğleden sonra + akşam)
 *     pasif      → 3-5 gündür açılmamış (sadece akşam, yumuşak ton)
 */

const notificationMessages = {

  // ============================================================
  // 1. AKTİF KULLANICI – Akşam Bildirimi (19:00–20:30)
  // Haftada 3-4 gün gönderilir (scheduler kontrolü)
  // ============================================================
  lingola_active_evening: {
    tr: [
      { title: "Lingola 📖", message: "Hadi minik bir hikâye zamanı." },
      { title: "Lingola 📄", message: "Bir sayfa daha ister misin?" },
      { title: "Lingola 🌙", message: "Hikâye bu akşam da burada." },
      { title: "Lingola 😊", message: "Kısacık bir okuma olur mu?" }
    ],
    en: [
      { title: "Lingola 📖", message: "Time for a little story?" },
      { title: "Lingola 📄", message: "How about one more page?" },
      { title: "Lingola 🌙", message: "The story is here again tonight." },
      { title: "Lingola 😊", message: "A tiny reading session, maybe?" }
    ],
    de: [
      { title: "Lingola 📖", message: "Zeit für eine kleine Geschichte." },
      { title: "Lingola 📄", message: "Noch eine Seite?" },
      { title: "Lingola 🌙", message: "Heute Abend ist die Geschichte wieder hier." },
      { title: "Lingola 😊", message: "Ein bisschen Lesen gefällig?" }
    ],
    es: [
      { title: "Lingola 📖", message: "¿Un momento para una pequeña historia?" },
      { title: "Lingola 📄", message: "¿Una página más?" },
      { title: "Lingola 🌙", message: "La historia sigue aquí esta tarde." },
      { title: "Lingola 😊", message: "¿Una lectura cortita?" }
    ],
    fr: [
      { title: "Lingola 📖", message: "Un moment pour une petite histoire ?" },
      { title: "Lingola 📄", message: "Encore une page ?" },
      { title: "Lingola 🌙", message: "L'histoire est là ce soir encore." },
      { title: "Lingola 😊", message: "Une petite lecture ce soir ?" }
    ],
    ja: [
      { title: "Lingola 📖", message: "ちょっとしたお話の時間はいかが？" },
      { title: "Lingola 📄", message: "あと一ページ読む？" },
      { title: "Lingola 🌙", message: "今夜もお話が待ってるよ。" },
      { title: "Lingola 😊", message: "少しだけ読んでみる？" }
    ],
    ko: [
      { title: "Lingola 📖", message: "잠깐 이야기 시간 어때요?" },
      { title: "Lingola 📄", message: "한 페이지 더 읽을래요?" },
      { title: "Lingola 🌙", message: "오늘 저녁도 이야기가 여기 있어요." },
      { title: "Lingola 😊", message: "짧게 읽어볼까요?" }
    ],
    pt: [
      { title: "Lingola 📖", message: "Que tal uma historinha?" },
      { title: "Lingola 📄", message: "Mais uma página?" },
      { title: "Lingola 🌙", message: "A história está aqui de novo esta noite." },
      { title: "Lingola 😊", message: "Uma leiturinha rápida?" }
    ],
    ru: [
      { title: "Lingola 📖", message: "Время для маленькой истории?" },
      { title: "Lingola 📄", message: "Ещё одну страницу?" },
      { title: "Lingola 🌙", message: "История снова здесь этим вечером." },
      { title: "Lingola 😊", message: "Немного почитать?" }
    ],
    hi: [
      { title: "Lingola 📖", message: "एक छोटी कहानी का समय?" },
      { title: "Lingola 📄", message: "एक पेज और पढ़ें?" },
      { title: "Lingola 🌙", message: "आज रात भी कहानी यहाँ है।" },
      { title: "Lingola 😊", message: "थोड़ा सा पढ़ना हो जाए?" }
    ],
    it: [
      { title: "Lingola 📖", message: "È l'ora di una piccola storia." },
      { title: "Lingola 📄", message: "Ancora una pagina?" },
      { title: "Lingola 🌙", message: "Anche stasera la storia è qui." },
      { title: "Lingola 😊", message: "Una lettura veloce?" }
    ]
  },

  // ============================================================
  // 2a. YARI-AKTİF KULLANICI – Öğleden Sonra Bildirimi (14:00–16:00)
  // 24-48 saattir açılmamış
  // ============================================================
  lingola_semi_active_afternoon: {
    tr: [
      { title: "Lingola", message: "Hikâye burada duruyor." },
      { title: "Lingola", message: "Kitap açık kaldı." }
    ],
    en: [
      { title: "Lingola", message: "The story is still waiting here." },
      { title: "Lingola", message: "The book is still open." }
    ],
    de: [
      { title: "Lingola", message: "Die Geschichte wartet noch hier." },
      { title: "Lingola", message: "Das Buch ist noch offen." }
    ],
    es: [
      { title: "Lingola", message: "La historia sigue aquí esperando." },
      { title: "Lingola", message: "El libro sigue abierto." }
    ],
    fr: [
      { title: "Lingola", message: "L'histoire attend encore ici." },
      { title: "Lingola", message: "Le livre est encore ouvert." }
    ],
    ja: [
      { title: "Lingola", message: "お話はまだここで待ってるよ。" },
      { title: "Lingola", message: "本はまだ開いてるよ。" }
    ],
    ko: [
      { title: "Lingola", message: "이야기는 아직 여기서 기다리고 있어요." },
      { title: "Lingola", message: "책이 아직 열려 있어요." }
    ],
    pt: [
      { title: "Lingola", message: "A história ainda está aqui esperando." },
      { title: "Lingola", message: "O livro ainda está aberto." }
    ],
    ru: [
      { title: "Lingola", message: "История всё ещё здесь, ждёт тебя." },
      { title: "Lingola", message: "Книга всё ещё открыта." }
    ],
    hi: [
      { title: "Lingola", message: "कहानी अभी भी यहाँ इंतज़ार कर रही है।" },
      { title: "Lingola", message: "किताब अभी भी खुली है।" }
    ],
    it: [
      { title: "Lingola", message: "La storia aspetta ancora qui." },
      { title: "Lingola", message: "Il libro è ancora aperto." }
    ]
  },

  // ============================================================
  // 2b. YARI-AKTİF KULLANICI – Akşam Bildirimi (19:00–20:30)
  // 24-48 saattir açılmamış
  // ============================================================
  lingola_semi_active_evening: {
    tr: [
      { title: "Lingola 😊", message: "Bir karakter sayfada kaldı." },
      { title: "Lingola", message: "Küçük bir bölüm yarım." }
    ],
    en: [
      { title: "Lingola 😊", message: "A character stayed on the page." },
      { title: "Lingola", message: "A little chapter is unfinished." }
    ],
    de: [
      { title: "Lingola 😊", message: "Eine Figur blieb auf der Seite." },
      { title: "Lingola", message: "Ein kleines Kapitel ist unfertig." }
    ],
    es: [
      { title: "Lingola 😊", message: "Un personaje se quedó en la página." },
      { title: "Lingola", message: "Un capítulo pequeño quedó a medias." }
    ],
    fr: [
      { title: "Lingola 😊", message: "Un personnage est resté sur la page." },
      { title: "Lingola", message: "Un petit chapitre est inachevé." }
    ],
    ja: [
      { title: "Lingola 😊", message: "あのキャラクターがページに残ってるよ。" },
      { title: "Lingola", message: "ちょっとしたチャプターが途中のまま。" }
    ],
    ko: [
      { title: "Lingola 😊", message: "한 캐릭터가 페이지에 남아 있어요." },
      { title: "Lingola", message: "작은 챕터가 아직 끝나지 않았어요." }
    ],
    pt: [
      { title: "Lingola 😊", message: "Um personagem ficou na página." },
      { title: "Lingola", message: "Um capítulo pequeno ficou pela metade." }
    ],
    ru: [
      { title: "Lingola 😊", message: "Один персонаж остался на странице." },
      { title: "Lingola", message: "Маленькая глава осталась незавершённой." }
    ],
    hi: [
      { title: "Lingola 😊", message: "एक किरदार पेज पर रह गया।" },
      { title: "Lingola", message: "एक छोटा अध्याय अधूरा रह गया।" }
    ],
    it: [
      { title: "Lingola 😊", message: "Un personaggio è rimasto sulla pagina." },
      { title: "Lingola", message: "Un piccolo capitolo è rimasto a metà." }
    ]
  },

  // ============================================================
  // 3. PASİF KULLANICI – Sadece Akşam Bildirimi (19:00–20:30)
  // 3-5 gündür açılmamış – merak azaltılır, güven artırılır
  // ============================================================
  lingola_passive_evening: {
    tr: [
      { title: "Lingola", message: "Hikâye seni beklemiyor, sadece duruyor." },
      { title: "Lingola", message: "Ara verdin, sorun değil." },
      { title: "Lingola", message: "Ne zaman istersen." }
    ],
    en: [
      { title: "Lingola", message: "The story isn't waiting, just staying." },
      { title: "Lingola", message: "You took a break, that's okay." },
      { title: "Lingola", message: "Whenever you feel like it." }
    ],
    de: [
      { title: "Lingola", message: "Die Geschichte wartet nicht, sie ist einfach da." },
      { title: "Lingola", message: "Du hast eine Pause gemacht, das ist okay." },
      { title: "Lingola", message: "Wann immer du möchtest." }
    ],
    es: [
      { title: "Lingola", message: "La historia no te espera, solo está ahí." },
      { title: "Lingola", message: "Te tomaste un descanso, está bien." },
      { title: "Lingola", message: "Cuando quieras." }
    ],
    fr: [
      { title: "Lingola", message: "L'histoire n'attend pas, elle est juste là." },
      { title: "Lingola", message: "Tu as fait une pause, c'est bien." },
      { title: "Lingola", message: "Quand tu veux." }
    ],
    ja: [
      { title: "Lingola", message: "お話は待ってないよ、ただそこにいるだけ。" },
      { title: "Lingola", message: "少し休憩したんだね、それでいい。" },
      { title: "Lingola", message: "いつでも好きな時に。" }
    ],
    ko: [
      { title: "Lingola", message: "이야기는 기다리지 않아요, 그냥 있을 뿐이에요." },
      { title: "Lingola", message: "잠깐 쉬었군요, 괜찮아요." },
      { title: "Lingola", message: "언제든지 원할 때." }
    ],
    pt: [
      { title: "Lingola", message: "A história não está esperando, só está aqui." },
      { title: "Lingola", message: "Você fez uma pausa, tudo bem." },
      { title: "Lingola", message: "Quando quiser." }
    ],
    ru: [
      { title: "Lingola", message: "История не ждёт, просто есть здесь." },
      { title: "Lingola", message: "Ты сделал паузу — всё хорошо." },
      { title: "Lingola", message: "Когда захочешь." }
    ],
    hi: [
      { title: "Lingola", message: "कहानी इंतज़ार नहीं कर रही, बस यहाँ है।" },
      { title: "Lingola", message: "ब्रेक लिया, कोई बात नहीं।" },
      { title: "Lingola", message: "जब मन हो।" }
    ],
    it: [
      { title: "Lingola", message: "La storia non aspetta, è solo qui." },
      { title: "Lingola", message: "Hai fatto una pausa, va bene." },
      { title: "Lingola", message: "Quando vuoi." }
    ]
  }
};

module.exports = notificationMessages;
