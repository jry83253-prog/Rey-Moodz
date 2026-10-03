import bcrypt from 'bcryptjs';
import { db, initDatabase } from './client.ts';

export async function seedDatabase(): Promise<void> {
  await initDatabase();

  // 1. Seed Admin
  const adminUsername = process.env.ADMIN_USERNAME || 'adminrey';
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminreykece';

  const existingAdmin = await db.execute({
    sql: 'SELECT id, username FROM admins WHERE username = ? LIMIT 1',
    args: [adminUsername],
  });

  if (existingAdmin.rows.length === 0) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);
    const now = new Date().toISOString();
    await db.execute({
      sql: 'INSERT INTO admins (id, username, passwordHash, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      args: ['admin-1', adminUsername, passwordHash, now, now],
    });
    console.log(`[Seed] Created initial admin: ${adminUsername}`);
  }

  // 2. Seed Default Settings
  const defaultSettings: Record<string, string> = {
    site_name: 'REY MODDER',
    tagline: 'MOD • UPDATE • SHARE',
    description: 'Temukan aplikasi pilihan dalam satu tempat. Terupdate, cepat, dan aman.',
    whatsapp_url: 'https://whatsapp.com/channel/0029VbE5QaB9MF90lmAtrq39',
    announcement_enabled: '1',
    announcement_text: '🔥 Selamat datang di REY MODDER! Gabung saluran WhatsApp untuk update versi tercepat.',
    footer_text: '© 2026 REY MODDER. All rights reserved. Hak Cipta dilindungi undang-undang.',
  };

  for (const [key, value] of Object.entries(defaultSettings)) {
    const exist = await db.execute({
      sql: 'SELECT key FROM settings WHERE key = ? LIMIT 1',
      args: [key],
    });
    if (exist.rows.length === 0) {
      await db.execute({
        sql: 'INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)',
        args: [key, value, new Date().toISOString()],
      });
    }
  }

  // 3. Seed Categories
  const categories = [
    { id: 'cat-editing', name: 'Editing', slug: 'editing', icon: 'Scissors' },
    { id: 'cat-foto', name: 'Foto', slug: 'foto', icon: 'Camera' },
    { id: 'cat-video', name: 'Video', slug: 'video', icon: 'Video' },
    { id: 'cat-musik', name: 'Musik', slug: 'musik', icon: 'Music' },
    { id: 'cat-produktivitas', name: 'Produktivitas', slug: 'produktivitas', icon: 'CheckSquare' },
    { id: 'cat-ai', name: 'AI', slug: 'ai', icon: 'Cpu' },
    { id: 'cat-tools', name: 'Tools', slug: 'tools', icon: 'Wrench' },
    { id: 'cat-utility', name: 'Utility', slug: 'utility', icon: 'Sliders' },
    { id: 'cat-lainnya', name: 'Lainnya', slug: 'lainnya', icon: 'Folder' },
  ];

  for (const cat of categories) {
    const exist = await db.execute({
      sql: 'SELECT id FROM categories WHERE id = ? OR slug = ? LIMIT 1',
      args: [cat.id, cat.slug],
    });
    if (exist.rows.length === 0) {
      const now = new Date().toISOString();
      await db.execute({
        sql: 'INSERT INTO categories (id, name, slug, icon, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        args: [cat.id, cat.name, cat.slug, cat.icon, now, now],
      });
    }
  }

  // 4. Seed Initial Applications
  const initialApps = [
    {
      id: 'app-capcut-pro',
      name: 'CapCut Video Editor',
      slug: 'capcut-video-editor',
      iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
      description: 'Editor video all-in-one serbaguna dengan efek transisi sinematik, text-to-speech AI, keyframe animation, dan export kualitas tinggi hingga 4K 60fps tanpa watermark.',
      version: 'v12.4.0',
      size: '148 MB',
      categoryId: 'cat-video',
      downloadUrl: 'https://github.com/reymodder/demo-releases/releases/download/v12.4.0/CapCut_v12.4.0_Unlocked.apk',
      features: JSON.stringify([
        'Export hingga 4K 60 FPS tanpa watermark',
        'Semua filter dan efek Pro terbuka',
        'Auto Captions & AI Speech Recognition',
        'Chroma Key & Multi-layer Timeline',
        'Keyframe animation halus tanpa lag',
      ]),
      changelog: JSON.stringify([
        'Update ke base version 12.4.0',
        'Peningkatan stabilitas rendering 4K',
        'Penambahan 50+ efek AI Body Track',
        'Optimalisasi untuk Android 14 & 15',
      ]),
      featured: 1,
      published: 1,
      downloadCount: 1420,
      screenshots: [
        'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'app-lightroom-cc',
      name: 'Adobe Lightroom Mobile',
      slug: 'adobe-lightroom-mobile',
      iconUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=160&auto=format&fit=crop&q=80',
      description: 'Aplikasi fotografi profesional untuk color grading, kurva warna canggih, masking AI selektif, dan ratusan preset premium untuk hasil foto memukau.',
      version: 'v9.3.1',
      size: '115 MB',
      categoryId: 'cat-foto',
      downloadUrl: 'https://github.com/reymodder/demo-releases/releases/download/v9.3.1/Lightroom_v9.3.1_Pro.apk',
      features: JSON.stringify([
        'AI Masking: Subject, Sky, dan Background',
        'Preset Premium & Color Grading tak terbatas',
        'Healing Brush & Geometry tool aktif',
        'RAW HDR Photo Capture & Editing',
      ]),
      changelog: JSON.stringify([
        'Optimasi performa DNG rendering',
        'Perbaikan bug crash pada ekspor batch',
        'Dukungan kamera sensor terbaru',
      ]),
      featured: 1,
      published: 1,
      downloadCount: 980,
      screenshots: [
        'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'app-remini-ai',
      name: 'Remini AI Photo Enhancer',
      slug: 'remini-ai-photo-enhancer',
      iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
      description: 'Sulap foto buram, pecah, atau jadul menjadi sangat jernih berpiksel tajam dalam satu sentuhan menggunakan teknologi AI neural enhancer generasi terbaru.',
      version: 'v3.7.450',
      size: '86 MB',
      categoryId: 'cat-ai',
      downloadUrl: 'https://github.com/reymodder/demo-releases/releases/download/v3.7/Remini_v3.7_Pro.apk',
      features: JSON.stringify([
        'Unlimited AI Enhancements tanpa kuota harian',
        'Mode Ultra HD Face Clarity',
        'Colorize foto hitam putih secara akurat',
        'Tanpa iklan sponsor',
      ]),
      changelog: JSON.stringify([
        'Model AI Gen-4 dengan detail rambut lebih presisi',
        'Proses enhancemant 2x lebih cepat',
        'Mengurangi artefak pada foto low light',
      ]),
      featured: 1,
      published: 1,
      downloadCount: 2310,
      screenshots: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'app-spotify-music',
      name: 'Spotify SoundStream',
      slug: 'spotify-soundstream',
      iconUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=160&auto=format&fit=crop&q=80',
      description: 'Dengarkan jutaan lagu dan podcast favorit dengan kualitas audio Extreme 320kbps, skip lagu tak terbatas, dan antarmuka bebas gangguan iklan audio.',
      version: 'v8.9.18',
      size: '68 MB',
      categoryId: 'cat-musik',
      downloadUrl: 'https://github.com/reymodder/demo-releases/releases/download/v8.9/SpotifyStream_v8.9.apk',
      features: JSON.stringify([
        'Audio Extreme 320 kbps bit rate',
        'Unlimited Next & Previous track skips',
        'Bebas gangguan iklan audio dan banner',
        'Dukungan Canvas visualizer aktif',
      ]),
      changelog: JSON.stringify([
        'Sinkronisasi lirik real-time lebih responsif',
        'Pembaruan dark theme AMOLED',
        'Dukungan equalizer 10-band disempurnakan',
      ]),
      featured: 0,
      published: 1,
      downloadCount: 3120,
      screenshots: [
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'app-canva-graphic',
      name: 'Canva Pro Visual Studio',
      slug: 'canva-pro-visual-studio',
      iconUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=160&auto=format&fit=crop&q=80',
      description: 'Desain grafis instan untuk postingan media sosial, poster, banner, presentasi, dan thumbnail YouTube dengan ribuan template dan font eksklusif.',
      version: 'v2.240.0',
      size: '45 MB',
      categoryId: 'cat-editing',
      downloadUrl: 'https://github.com/reymodder/demo-releases/releases/download/v2.240/Canva_v2.240.apk',
      features: JSON.stringify([
        'Background Remover 1-klik',
        'Akses 100+ juta stok foto dan elemen grafik',
        'Magic Resize ke berbagai ukuran instan',
        'Ekspor SVG & PDF cetak resolusi tinggi',
      ]),
      changelog: JSON.stringify([
        'Integrasi Magic Studio AI Generative Fill',
        'Peningkatan manajemen folder aset',
      ]),
      featured: 0,
      published: 1,
      downloadCount: 890,
      screenshots: [
        'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'app-termux-terminal',
      name: 'Termux Terminal & Linux Env',
      slug: 'termux-terminal-linux',
      iconUrl: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=160&auto=format&fit=crop&q=80',
      description: 'Emulator terminal Linux lengkap dan lingkungan paket ekstensif langsung di Android tanpa memerlukan akses root perangkat.',
      version: 'v0.118.1',
      size: '95 MB',
      categoryId: 'cat-tools',
      downloadUrl: 'https://github.com/termux/termux-app/releases/download/v0.118.1/termux-app_v0.118.1+github-debug_universal.apk',
      features: JSON.stringify([
        'Bash dan Zsh shell mutakhir',
        'Manajemen paket via APT (Python, Node, Git, Clang)',
        'Dukungan SSH client dan server',
        'Kompatibel Android 7.0 hingga 15',
      ]),
      changelog: JSON.stringify([
        'Fix bootstrap mirror repositories',
        'Perbaikan dukungan layout keyboard tablet',
      ]),
      featured: 1,
      published: 1,
      downloadCount: 1670,
      screenshots: [
        'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'app-libretorrent',
      name: 'LibreTorrent Client',
      slug: 'libretorrent-client',
      iconUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=160&auto=format&fit=crop&q=80',
      description: 'Klien Torrent open-source modern untuk Android dengan dukungan DHT, PeX, enkripsi protokol, penjadwalan download, dan kontrol bandwidth akurat.',
      version: 'v3.5.0',
      size: '22 MB',
      categoryId: 'cat-utility',
      downloadUrl: 'https://github.com/proninyaroslav/libretorrent/releases/download/3.5.0/LibreTorrent-3.5.0.apk',
      features: JSON.stringify([
        'Material You Dark UI adaptif',
        'Mendukung file besar > 4GB',
        'Dukungan proxy SOCKS5 & HTTP',
        'Auto shutdown setelah unduhan selesai',
      ]),
      changelog: JSON.stringify([
        'Update libtorrent library v2.0.10',
        'Perbaikan manajemen penyimpanan scoped storage',
      ]),
      featured: 0,
      published: 1,
      downloadCount: 650,
      screenshots: [
        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'app-obsidian-notes',
      name: 'Obsidian Knowledge Vault',
      slug: 'obsidian-knowledge-vault',
      iconUrl: 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=160&auto=format&fit=crop&q=80',
      description: 'Catatan pribadi berbasis Markdown berkekuatan tinggi dengan graph network visualization, backlink otomatis, dan penyimpanan lokal privat.',
      version: 'v1.6.3',
      size: '38 MB',
      categoryId: 'cat-produktivitas',
      downloadUrl: 'https://github.com/obsidianmd/obsidian-releases/releases/download/v1.6.3/Obsidian-1.6.3.apk',
      features: JSON.stringify([
        'Penyimpanan lokal 100% offline dan aman',
        'Graph view relasi antar catatan',
        'Dukungan ekosistem plugin & custom theme',
        'Sinkronisasi aman multi-device',
      ]),
      changelog: JSON.stringify([
        'Perbaikan visual PDF viewer mobile',
        'Akselerasi rendering berkas markdown besar',
      ]),
      featured: 0,
      published: 1,
      downloadCount: 520,
      screenshots: [
        'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80',
      ],
    },
    {
      id: 'app-draft-test',
      name: 'PixelLab Pro Studio (Draft)',
      slug: 'pixellab-pro-studio',
      iconUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=160&auto=format&fit=crop&q=80',
      description: 'Aplikasi manipulasi teks 3D, tipografi bergaya, dan pembuatan logo poster di ponsel.',
      version: 'v2.1.2',
      size: '54 MB',
      categoryId: 'cat-foto',
      downloadUrl: 'https://github.com/reymodder/demo-releases/releases/download/v2.1.2/PixelLab_v2.1.2.apk',
      features: JSON.stringify(['500+ Font kaligrafi dan graffiti', 'Rendering teks 3D real-time']),
      changelog: JSON.stringify(['Initial beta build']),
      featured: 0,
      published: 0, // DRAFT application to test Draft/Publish state in admin
      downloadCount: 0,
      screenshots: [],
    },
  ];

  for (const app of initialApps) {
    const exist = await db.execute({
      sql: 'SELECT id FROM applications WHERE id = ? OR slug = ? LIMIT 1',
      args: [app.id, app.slug],
    });

    if (exist.rows.length === 0) {
      const now = new Date().toISOString();
      await db.execute({
        sql: `INSERT INTO applications (
          id, name, slug, iconUrl, description, version, size,
          categoryId, downloadUrl, changelog, features,
          featured, published, downloadCount, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          app.id,
          app.name,
          app.slug,
          app.iconUrl,
          app.description,
          app.version,
          app.size,
          app.categoryId,
          app.downloadUrl,
          app.changelog,
          app.features,
          app.featured,
          app.published,
          app.downloadCount,
          now,
          now,
        ],
      });

      // Insert screenshots
      if (app.screenshots && app.screenshots.length > 0) {
        for (let i = 0; i < app.screenshots.length; i++) {
          await db.execute({
            sql: 'INSERT INTO screenshots (id, applicationId, imageUrl, sortOrder) VALUES (?, ?, ?, ?)',
            args: [`ss-${app.id}-${i}`, app.id, app.screenshots[i], i],
          });
        }
      }
    }
  }

  // 5. Seed some initial download logs for realistic statistics
  const existingLogs = await db.execute('SELECT COUNT(*) as count FROM download_logs');
  const logCount = Number(existingLogs.rows[0]?.count || 0);
  if (logCount === 0) {
    const now = Date.now();
    const demoLogs = [
      { appId: 'app-capcut-pro', offset: 3600000 * 2 },
      { appId: 'app-remini-ai', offset: 3600000 * 5 },
      { appId: 'app-lightroom-cc', offset: 3600000 * 12 },
      { appId: 'app-spotify-music', offset: 3600000 * 24 },
      { appId: 'app-termux-terminal', offset: 3600000 * 30 },
      { appId: 'app-capcut-pro', offset: 3600000 * 48 },
    ];
    for (let i = 0; i < demoLogs.length; i++) {
      const item = demoLogs[i];
      const logDate = new Date(now - item.offset).toISOString();
      await db.execute({
        sql: 'INSERT INTO download_logs (id, applicationId, ipHash, userAgent, createdAt) VALUES (?, ?, ?, ?, ?)',
        args: [`log-${i}`, item.appId, 'hash-ip-seed', 'Mozilla/5.0 Android', logDate],
      });
    }
  }

  console.log('[Seed] Database initialization and seeding completed successfully.');
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().catch((err) => {
    console.error('[Seed Error]:', err);
    process.exit(1);
  });
}
