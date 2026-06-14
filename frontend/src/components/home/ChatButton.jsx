import { useState, useRef, useEffect } from 'react';
import styles from './ChatButton.module.css';

const knowledgeBase = [
  {
    id: 'spp',
    keywords: [
      'spp', 'biaya', 'harga', 'uang', 'bayar', 'bayaran',
      'fee', 'cost', 'tuition', 'mahal', 'murah', 'tarif',
      'tagihan', 'bulanan', 'nominal', 'berapaan',
    ],
    answer:
      '💰 *Rata-rata SPP Bimbel Grand 3 Sunggal:*\n\n' +
      '• SD (Kelas 1–6) Rp 200.000 – Rp 300.000 / bulan\n' +
      '• SMP (Kelas 7–9) Rp 300.000 – Rp 400.000 / bulan\n' +
      '• SMA (Kelas 10–12) Rp 400.000 – Rp 500.000 / bulan\n' +
      '• Program UTBK Rp 500.000 – Rp 600.000 / bulan\n\n' +
      'Harga bisa berbeda tergantung jumlah mapel yang diambil. ' +
      'Hubungi admin untuk info lebih lengkap! 📞',
  },
  {
    id: 'jenjang',
    keywords: [
      'jenjang', 'tingkat', 'sd', 'smp', 'sma', 'level',
      'pendidikan', 'sekolah', 'tk', 'paud',
    ],
    answer:
      '📚 *Jenjang pendidikan yang tersedia:*\n\n' +
      '🔹 **SD** — Kelas 1 sampai 6\n' +
      '🔹 **SMP** — Kelas 7 sampai 9\n' +
      '🔹 **SMA** — Kelas 10 sampai 12\n' +
      '🔹 **Program Khusus UTBK / Persiapan PTN**\n\n' +
      'Semua jenjang didampingi tutor profesional dan berpengalaman! ✨',
  },
  {
    id: 'kelas',
    keywords: [
      'kelas', 'program', 'mapel', 'mata pelajaran', 'pelajaran',
      'les', 'bimbel', 'kursus', 'belajar', 'privat', 'semiprivat',
      'semi privat', 'kelompok', 'mata pelajaran',
    ],
    answer:
      '📖 *Kelas & Program yang tersedia:*\n\n' +
      '📐 Matematika\n' +
      '📝 Bahasa Inggris\n' +
      '⚡ Fisika\n' +
      '🧪 Kimia\n' +
      '🌿 Biologi\n' +
      '🌍 IPS Terpadu\n' +
      '💻 Komputer & Programming\n\n' +
      'Kami juga menyediakan:\n' +
      '• **Privat** (1 tutor — 1 siswa)\n' +
      '• **Semi-privat** (1 tutor — 3–5 siswa)',
  },
  {
    id: 'daftar',
    keywords: [
      'daftar', 'pendaftaran', 'registrasi', 'mendaftar',
      'syarat', 'enroll', 'registration', 'daftar',
      'prosedur', 'cara', 'formulir',
    ],
    answer:
      '📋 *Cara Mendaftar di Bimbel Grand 3 Sunggal:*\n\n' +
      '1️⃣ Datang langsung ke lokasi bimbel\n' +
      '2️⃣ Mengisi formulir pendaftaran\n' +
      '3️⃣ Membawa foto 3×4 sebanyak 2 lembar\n' +
      '4️⃣ Membayar biaya pendaftaran\n\n' +
      'Atau bisa juga *mendaftar online* melalui website kami.\n\n' +
      '📞 Info lebih lanjut: **0812-3456-7890**',
  },
  {
    id: 'lokasi',
    keywords: [
      'lokasi', 'alamat', 'dimana', 'tempat', 'letak',
      'posisi', 'sunggal', 'jalan', 'gedung', 'lokasi',
      'maps', 'google maps',
    ],
    answer:
      '📍 *Alamat Bimbel Grand 3 Sunggal:*\n\n' +
      'Jl. Besar Sunggal No. 123, Kec. Sunggal,\n' +
      'Kab. Deli Serdang, Sumatera Utara 20351\n\n' +
      '_(Gedung 2 lantai, cat biru, dekat Simpang Pos)_\n\n' +
      '🕐 *Jam Operasional:*\n' +
      'Sen–Jum: 14.00 – 20.00 WIB\n' +
      'Sab: 09.00 – 17.00 WIB\n' +
      'Min: Libur',
  },
  {
    id: 'salam',
    keywords: [
      'hai', 'halo', 'hi', 'helo', 'hey', 'siang', 'pagi',
      'sore', 'malam', 'assalamualaikum', 'assalamu alaikum',
      'pagi', 'siang', 'sore',
    ],
    answer:
      'Halo! 👋 Selamat datang di **Bimbel Grand 3 Sunggal**.\n' +
      'Ada yang bisa saya bantu? Silakan tanya:\n\n' +
      '• 💰 Rata-rata SPP\n' +
      '• 📚 Jenjang pendidikan\n' +
      '• 📖 Kelas & program\n' +
      '• 📋 Cara pendaftaran\n' +
      '• 📍 Lokasi bimbel',
  },
  {
    id: 'tutor',
    keywords: [
      'tutor', 'guru', 'pengajar', 'instruktur', 'tenaga pengajar',
      'pengalaman', 'kualifikasi', 's1',
    ],
    answer:
      '👨‍🏫 Tutor di Bimbel Grand 3 Sunggal berasal dari lulusan S1 dari berbagai universitas ternama.\n\n' +
      'Mereka berpengalaman dan telah melewati seleksi ketat serta pelatihan mengajar.\n\n' +
      'Kami juga melakukan evaluasi rutin untuk menjaga kualitas pembelajaran! ✅',
  },
  {
    id: 'fasilitas',
    keywords: [
      'fasilitas', 'ruangan', 'ac', 'wifi', 'perpustakaan',
      'buku', 'belajar', 'nyaman',
    ],
    answer:
      '🏫 *Fasilitas Bimbel Grand 3 Sunggal:*\n\n' +
      '• Ruang belajar ber-AC 🌀\n' +
      '• Wi-Fi gratis 📶\n' +
      '• Perpustakaan mini 📚\n' +
      '• Ruang diskusi 🪑\n' +
      '• CCTV keamanan 📹\n' +
      '• Area parkir luas 🅿️',
  },
];

const fallbackMessages = [
  'Maaf, saya belum bisa menjawab pertanyaan itu. Coba tanya tentang biaya SPP, jenjang, kelas, pendaftaran, atau lokasi bimbel ya! 😊',
  'Mohon maaf, kurang paham nih. Ketik kata kunci seperti *spp*, *jenjang*, *kelas*, *daftar*, atau *lokasi* ya.',
];



function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}


function normalise(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}


function wordMatches(word, keyword) {
  if (keyword.includes(word)) return true; // exact substring
  if (word.length < 3) return word === keyword; // short words must match exactly
  const dist = levenshtein(word, keyword);

  const maxDist = word.length <= 5 ? 1 : 2;
  return dist <= maxDist;
}

function findAnswer(input) {
  const normalised = normalise(input);
  if (!normalised) return null;

  const words = normalised.split(/\s+/);

  let best = null;
  let bestScore = 0;

  for (const entry of knowledgeBase) {
    let score = 0;
    for (const keyword of entry.keywords) {
      const kw = normalise(keyword);
      if (normalised.includes(kw)) {
        score += 10;
        continue;
      }

      for (const word of words) {
        if (wordMatches(word, kw)) {
          score += 5;
          break;
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return best;
}

function ChatButton() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'init',
      sender: 'bot',
      text: 'Halo! 👋 Ada yang bisa saya bantu?\nKetik pertanyaan seputar bimbel ya!',
    },
  ]);
  const [input, setInput] = useState('');
  const [showNotif, setShowNotif] = useState(true);

  const chatRef = useRef(null);
  const inputRef = useRef(null);
  const msgIdRef = useRef(1);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  function handleToggle() {
    setOpen((v) => {
      if (!v) setShowNotif(false);
      return !v;
    });
  }

  function handleSend(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg = { id: `u${msgIdRef.current++}`, sender: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const match = findAnswer(trimmed);
      const botText = match
        ? match.answer
        : fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)];
      const botMsg = { id: `b${msgIdRef.current++}`, sender: 'bot', text: botText };
      setMessages((prev) => [...prev, botMsg]);
    }, 400 + Math.random() * 300);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  }

  return (
    <div className={styles.wrapper}>
      {}
      <div className={`${styles.panel} ${open ? styles.panelOpen : ''}`}>
        {}
        <div className={styles.panelHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>🤖</div>
            <div>
              <div className={styles.headerTitle}>Chat Bimbel</div>
              <div className={styles.headerStatus}>Online</div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={handleToggle} title="Tutup">
            ✕
          </button>
        </div>

        {}
        <div className={styles.messages} ref={chatRef}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.bubble} ${
                msg.sender === 'user' ? styles.bubbleUser : styles.bubbleBot
              }`}
            >
              <div className={styles.bubbleText}>{msg.text}</div>
            </div>
          ))}
        </div>

        {}
        <div className={styles.inputArea}>
          <textarea
            ref={inputRef}
            className={styles.input}
            rows={1}
            placeholder="Ketik pesan..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className={styles.sendBtn}
            onClick={() => handleSend(input)}
            disabled={!input.trim()}
          >
            ➤
          </button>
        </div>
      </div>

      {}
      <button className={styles.chatBtn} onClick={handleToggle}>
        <span className={styles.chatIcon}>{open ? '✕' : '💬'}</span>
        {!open && 'Chat Bimbel'}
        {showNotif && <span className={styles.notif}>1</span>}
      </button>
    </div>
  );
}

export default ChatButton;
