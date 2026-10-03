import express, { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import crypto from 'crypto';
import { db } from '../db/client.ts';
import {
  requireAdminAuth,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  type AuthenticatedRequest,
} from './auth.ts';
import { securityHeadersMiddleware } from './security.ts';

export const apiRouter = Router();

// Inject standard security headers into all API responses
apiRouter.use(securityHeadersMiddleware);
apiRouter.use(express.json());

// Helper: Slugify string
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/* =========================================================
   PUBLIC API ENDPOINTS
   ========================================================= */

// 1. Get website public configuration
apiRouter.get('/public/config', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute('SELECT key, value FROM settings');
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      settings[row.key as string] = row.value as string;
    }

    res.json({
      site_name: settings.site_name || 'REY MODDER',
      tagline: settings.tagline || 'MOD • UPDATE • SHARE',
      description: settings.description || 'Temukan aplikasi pilihan dalam satu tempat.',
      whatsapp_url: settings.whatsapp_url || 'https://whatsapp.com/channel/0029VbE5QaB9MF90lmAtrq39',
      announcement_enabled: settings.announcement_enabled === '1',
      announcement_text: settings.announcement_text || '',
      footer_text: settings.footer_text || '© 2026 REY MODDER. All rights reserved.',
    });
  } catch (error) {
    console.error('Config fetch error:', error);
    res.status(500).json({ error: 'Gagal memuat konfigurasi situs' });
  }
});

// 2. Get categories with published app count
apiRouter.get('/public/categories', async (_req: Request, res: Response) => {
  try {
    const result = await db.execute(`
      SELECT c.id, c.name, c.slug, c.icon,
             COUNT(CASE WHEN a.published = 1 THEN a.id END) as appCount
      FROM categories c
      LEFT JOIN applications a ON a.categoryId = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({ error: 'Gagal memuat kategori' });
  }
});

// 3. Search and filter applications (Public)
apiRouter.get('/public/apps', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
    const category = (req.query.category as string || '').trim();
    const sort = (req.query.sort as string || 'latest').toLowerCase();
    const featuredOnly = req.query.featured === 'true';
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string || '12', 10)));
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE a.published = 1';
    const args: any[] = [];

    if (q) {
      whereClause += ` AND (
        a.name LIKE ? OR 
        a.description LIKE ? OR 
        a.version LIKE ? OR 
        c.name LIKE ?
      )`;
      const searchParam = `%${q}%`;
      args.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (category && category !== 'all' && category !== 'semua') {
      whereClause += ` AND (c.slug = ? OR a.categoryId = ?)`;
      args.push(category, category);
    }

    if (featuredOnly) {
      whereClause += ` AND a.featured = 1`;
    }

    // Determine sorting
    let orderBy = 'a.updatedAt DESC';
    if (sort === 'oldest') {
      orderBy = 'a.createdAt ASC';
    } else if (sort === 'az') {
      orderBy = 'a.name ASC';
    } else if (sort === 'za') {
      orderBy = 'a.name DESC';
    } else if (sort === 'popular') {
      orderBy = 'a.downloadCount DESC, a.updatedAt DESC';
    }

    // Count total query
    const countSql = `
      SELECT COUNT(a.id) as total
      FROM applications a
      LEFT JOIN categories c ON a.categoryId = c.id
      ${whereClause}
    `;
    const countRes = await db.execute({ sql: countSql, args });
    const total = Number(countRes.rows[0]?.total || 0);

    // Fetch applications
    const appsSql = `
      SELECT 
        a.id, a.name, a.slug, a.iconUrl, a.description, a.version, a.size,
        a.categoryId, a.featured, a.published, a.downloadCount, a.createdAt, a.updatedAt,
        c.name as categoryName, c.slug as categorySlug, c.icon as categoryIcon
      FROM applications a
      LEFT JOIN categories c ON a.categoryId = c.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const appsRes = await db.execute({ sql: appsSql, args: [...args, limit, offset] });

    res.json({
      apps: appsRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (error) {
    console.error('Apps query error:', error);
    res.status(500).json({ error: 'Gagal mengambil data aplikasi' });
  }
});

// 4. Get application detail by slug (Public)
apiRouter.get('/public/apps/:slug', async (req: Request, res: Response) => {
  try {
    const slug = req.params.slug;
    const appRes = await db.execute({
      sql: `
        SELECT 
          a.id, a.name, a.slug, a.iconUrl, a.description, a.version, a.size,
          a.categoryId, a.downloadUrl, a.changelog, a.features, a.featured, a.published,
          a.downloadCount, a.createdAt, a.updatedAt,
          c.name as categoryName, c.slug as categorySlug, c.icon as categoryIcon
        FROM applications a
        LEFT JOIN categories c ON a.categoryId = c.id
        WHERE a.slug = ? AND a.published = 1
        LIMIT 1
      `,
      args: [slug],
    });

    if (appRes.rows.length === 0) {
      res.status(404).json({ error: 'Aplikasi tidak ditemukan' });
      return;
    }

    const app = appRes.rows[0];

    // Parse features and changelog
    let features: string[] = [];
    try {
      features = JSON.parse(app.features as string);
    } catch {
      features = (app.features as string || '').split('\n').filter(Boolean);
    }

    let changelog: string[] = [];
    try {
      changelog = JSON.parse(app.changelog as string);
    } catch {
      changelog = (app.changelog as string || '').split('\n').filter(Boolean);
    }

    // Get screenshots
    const screenshotsRes = await db.execute({
      sql: 'SELECT id, imageUrl, sortOrder FROM screenshots WHERE applicationId = ? ORDER BY sortOrder ASC',
      args: [app.id as string],
    });

    // Related apps in same category
    const relatedRes = await db.execute({
      sql: `
        SELECT a.id, a.name, a.slug, a.iconUrl, a.version, a.size, c.name as categoryName
        FROM applications a
        LEFT JOIN categories c ON a.categoryId = c.id
        WHERE a.categoryId = ? AND a.id != ? AND a.published = 1
        ORDER BY a.downloadCount DESC
        LIMIT 4
      `,
      args: [app.categoryId as string, app.id as string],
    });

    res.json({
      ...app,
      features,
      changelog,
      screenshots: screenshotsRes.rows.map((s) => s.imageUrl),
      relatedApps: relatedRes.rows,
    });
  } catch (error) {
    console.error('App detail error:', error);
    res.status(500).json({ error: 'Gagal memuat detail aplikasi' });
  }
});

// 5. Track download & get verified download URL (Public)
apiRouter.post('/public/apps/:id/download', async (req: Request, res: Response) => {
  try {
    const appId = req.params.id;
    const appRes = await db.execute({
      sql: 'SELECT id, name, downloadUrl, published FROM applications WHERE id = ? LIMIT 1',
      args: [appId],
    });

    if (appRes.rows.length === 0 || !appRes.rows[0].published) {
      res.status(404).json({ error: 'Aplikasi tidak valid atau belum dipublikasikan' });
      return;
    }

    const app = appRes.rows[0];
    const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();
    const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex').substring(0, 16);
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const now = new Date().toISOString();

    // Increment download count and add log entry
    await db.execute({
      sql: 'UPDATE applications SET downloadCount = downloadCount + 1 WHERE id = ?',
      args: [appId],
    });

    await db.execute({
      sql: 'INSERT INTO download_logs (id, applicationId, ipHash, userAgent, createdAt) VALUES (?, ?, ?, ?, ?)',
      args: [`dl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`, appId, ipHash, userAgent, now],
    });

    // Validate downloadUrl format
    const downloadUrl = (app.downloadUrl as string).trim();
    if (!downloadUrl.startsWith('http://') && !downloadUrl.startsWith('https://')) {
      res.status(400).json({ error: 'Tautan unduhan tidak valid' });
      return;
    }

    res.json({
      downloadUrl,
      appName: app.name,
    });
  } catch (error) {
    console.error('Download handling error:', error);
    res.status(500).json({ error: 'Gagal memproses unduhan' });
  }
});

/* =========================================================
   ADMIN AUTHENTICATION ENDPOINTS
   ========================================================= */

// Admin Login
const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

apiRouter.post('/admin/login', async (req: Request, res: Response) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Input tidak valid' });
      return;
    }

    const { username, password } = parse.data;
    const clientIp = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim();

    // Check rate limit
    const rateCheck = checkLoginRateLimit(clientIp);
    if (!rateCheck.allowed) {
      res.status(429).json({
        error: `Terlalu banyak percobaan login gagal. Silakan coba kembali dalam ${rateCheck.retryAfterSeconds} detik.`,
      });
      return;
    }

    // Find admin
    const result = await db.execute({
      sql: 'SELECT id, username, passwordHash FROM admins WHERE username = ? LIMIT 1',
      args: [username],
    });

    if (result.rows.length === 0) {
      recordFailedLogin(clientIp);
      res.status(401).json({ error: 'Username atau password salah' });
      return;
    }

    const admin = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, admin.passwordHash as string);

    if (!passwordMatch) {
      recordFailedLogin(clientIp);
      res.status(401).json({ error: 'Username atau password salah' });
      return;
    }

    // Login successful
    clearLoginRateLimit(clientIp);
    const token = createSessionToken(admin.id as string, admin.username as string);
    setSessionCookie(res, token);

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Terjadi kesalahan sistem saat login' });
  }
});

// Admin Logout
apiRouter.post('/admin/logout', (_req: Request, res: Response) => {
  clearSessionCookie(res);
  res.json({ success: true, message: 'Berhasil keluar' });
});

// Verify current session
apiRouter.get('/admin/me', requireAdminAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({
    authenticated: true,
    admin: req.admin,
  });
});

/* =========================================================
   ADMIN DASHBOARD & MANAGEMENT (PROTECTED)
   ========================================================= */

// 1. Admin Stats
apiRouter.get('/admin/stats', requireAdminAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const totalAppsRes = await db.execute('SELECT COUNT(*) as count FROM applications');
    const publishedAppsRes = await db.execute('SELECT COUNT(*) as count FROM applications WHERE published = 1');
    const draftAppsRes = await db.execute('SELECT COUNT(*) as count FROM applications WHERE published = 0');
    const featuredAppsRes = await db.execute('SELECT COUNT(*) as count FROM applications WHERE featured = 1');
    const totalCatsRes = await db.execute('SELECT COUNT(*) as count FROM categories');
    const totalDownloadsRes = await db.execute('SELECT SUM(downloadCount) as total FROM applications');

    // Recent download logs
    const recentLogsRes = await db.execute(`
      SELECT dl.id, dl.createdAt, dl.userAgent, a.name as appName, a.version, a.iconUrl
      FROM download_logs dl
      JOIN applications a ON dl.applicationId = a.id
      ORDER BY dl.createdAt DESC
      LIMIT 6
    `);

    // Recently updated apps
    const recentUpdatedRes = await db.execute(`
      SELECT id, name, version, slug, iconUrl, updatedAt, published, downloadCount
      FROM applications
      ORDER BY updatedAt DESC
      LIMIT 5
    `);

    res.json({
      totalApps: Number(totalAppsRes.rows[0]?.count || 0),
      publishedApps: Number(publishedAppsRes.rows[0]?.count || 0),
      draftApps: Number(draftAppsRes.rows[0]?.count || 0),
      featuredApps: Number(featuredAppsRes.rows[0]?.count || 0),
      totalCategories: Number(totalCatsRes.rows[0]?.count || 0),
      totalDownloads: Number(totalDownloadsRes.rows[0]?.total || 0),
      recentLogs: recentLogsRes.rows,
      recentlyUpdated: recentUpdatedRes.rows,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: 'Gagal mengambil data statistik' });
  }
});

// 2. Admin List Applications
apiRouter.get('/admin/apps', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const status = (req.query.status as string || 'all').toLowerCase();
    const q = (req.query.q as string || '').trim();

    let whereSql = 'WHERE 1=1';
    const args: any[] = [];

    if (status === 'published') {
      whereSql += ' AND a.published = 1';
    } else if (status === 'draft') {
      whereSql += ' AND a.published = 0';
    } else if (status === 'featured') {
      whereSql += ' AND a.featured = 1';
    }

    if (q) {
      whereSql += ' AND (a.name LIKE ? OR a.version LIKE ? OR c.name LIKE ?)';
      const search = `%${q}%`;
      args.push(search, search, search);
    }

    const appsRes = await db.execute({
      sql: `
        SELECT 
          a.id, a.name, a.slug, a.iconUrl, a.version, a.size,
          a.categoryId, a.downloadUrl, a.featured, a.published,
          a.downloadCount, a.createdAt, a.updatedAt,
          c.name as categoryName,
          (SELECT COUNT(*) FROM screenshots s WHERE s.applicationId = a.id) as screenshotCount
        FROM applications a
        LEFT JOIN categories c ON a.categoryId = c.id
        ${whereSql}
        ORDER BY a.updatedAt DESC
      `,
      args,
    });

    res.json(appsRes.rows);
  } catch (error) {
    console.error('Admin apps error:', error);
    res.status(500).json({ error: 'Gagal mengambil daftar aplikasi' });
  }
});

// 3. Admin Get Single Application for Editing
apiRouter.get('/admin/apps/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    const appRes = await db.execute({
      sql: 'SELECT * FROM applications WHERE id = ? LIMIT 1',
      args: [id],
    });

    if (appRes.rows.length === 0) {
      res.status(404).json({ error: 'Aplikasi tidak ditemukan' });
      return;
    }

    const app = appRes.rows[0];
    const screenshotsRes = await db.execute({
      sql: 'SELECT imageUrl FROM screenshots WHERE applicationId = ? ORDER BY sortOrder ASC',
      args: [id],
    });

    let features: string[] = [];
    try {
      features = JSON.parse(app.features as string);
    } catch {
      features = (app.features as string || '').split('\n').filter(Boolean);
    }

    let changelog: string[] = [];
    try {
      changelog = JSON.parse(app.changelog as string);
    } catch {
      changelog = (app.changelog as string || '').split('\n').filter(Boolean);
    }

    res.json({
      ...app,
      features,
      changelog,
      screenshots: screenshotsRes.rows.map((s) => s.imageUrl),
    });
  } catch (error) {
    console.error('Admin get app error:', error);
    res.status(500).json({ error: 'Gagal mengambil detail aplikasi' });
  }
});

// 4. Admin Create Application
const applicationSchema = z.object({
  name: z.string().min(2, 'Nama aplikasi minimal 2 karakter'),
  slug: z.string().optional(),
  iconUrl: z.string().min(1, 'Icon URL wajib diisi'),
  description: z.string().min(5, 'Deskripsi minimal 5 karakter'),
  version: z.string().min(1, 'Versi wajib diisi'),
  size: z.string().min(1, 'Ukuran file wajib diisi'),
  categoryId: z.string().min(1, 'Kategori wajib dipilih'),
  downloadUrl: z.string().url('Tautan unduhan harus berupa URL yang valid (http/https)'),
  changelog: z.union([z.array(z.string()), z.string()]),
  features: z.union([z.array(z.string()), z.string()]),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  screenshots: z.array(z.string()).default([]),
});

apiRouter.post('/admin/apps', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = applicationSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Input tidak valid' });
      return;
    }

    const data = parse.data;
    const baseSlug = data.slug ? slugify(data.slug) : slugify(data.name);
    let finalSlug = baseSlug || `app-${Date.now()}`;

    // Ensure slug uniqueness
    const slugCheck = await db.execute({
      sql: 'SELECT id FROM applications WHERE slug = ? LIMIT 1',
      args: [finalSlug],
    });
    if (slugCheck.rows.length > 0) {
      finalSlug = `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    const appId = `app-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const featuresJson = typeof data.features === 'string'
      ? JSON.stringify(data.features.split('\n').map(s => s.trim()).filter(Boolean))
      : JSON.stringify(data.features);

    const changelogJson = typeof data.changelog === 'string'
      ? JSON.stringify(data.changelog.split('\n').map(s => s.trim()).filter(Boolean))
      : JSON.stringify(data.changelog);

    await db.execute({
      sql: `INSERT INTO applications (
        id, name, slug, iconUrl, description, version, size,
        categoryId, downloadUrl, changelog, features,
        featured, published, downloadCount, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        appId,
        data.name.trim(),
        finalSlug,
        data.iconUrl.trim(),
        data.description.trim(),
        data.version.trim(),
        data.size.trim(),
        data.categoryId,
        data.downloadUrl.trim(),
        changelogJson,
        featuresJson,
        data.featured ? 1 : 0,
        data.published ? 1 : 0,
        0,
        now,
        now,
      ],
    });

    // Save screenshots
    if (data.screenshots && data.screenshots.length > 0) {
      for (let i = 0; i < data.screenshots.length; i++) {
        const url = data.screenshots[i].trim();
        if (url) {
          await db.execute({
            sql: 'INSERT INTO screenshots (id, applicationId, imageUrl, sortOrder) VALUES (?, ?, ?, ?)',
            args: [`ss-${Date.now()}-${i}`, appId, url, i],
          });
        }
      }
    }

    res.status(201).json({ success: true, id: appId, slug: finalSlug, message: 'Aplikasi berhasil ditambahkan' });
  } catch (error) {
    console.error('Create app error:', error);
    res.status(500).json({ error: 'Gagal menambahkan aplikasi' });
  }
});

// 5. Admin Update Application
apiRouter.put('/admin/apps/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const appId = req.params.id;
    const parse = applicationSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Input tidak valid' });
      return;
    }

    const data = parse.data;
    const existing = await db.execute({
      sql: 'SELECT id, slug FROM applications WHERE id = ? LIMIT 1',
      args: [appId],
    });

    if (existing.rows.length === 0) {
      res.status(404).json({ error: 'Aplikasi tidak ditemukan' });
      return;
    }

    let finalSlug = data.slug ? slugify(data.slug) : (existing.rows[0].slug as string);
    // If slug changed, ensure new slug is unique
    if (finalSlug !== existing.rows[0].slug) {
      const slugCheck = await db.execute({
        sql: 'SELECT id FROM applications WHERE slug = ? AND id != ? LIMIT 1',
        args: [finalSlug, appId],
      });
      if (slugCheck.rows.length > 0) {
        finalSlug = `${finalSlug}-${Math.random().toString(36).substring(2, 6)}`;
      }
    }

    const now = new Date().toISOString();

    const featuresJson = typeof data.features === 'string'
      ? JSON.stringify(data.features.split('\n').map(s => s.trim()).filter(Boolean))
      : JSON.stringify(data.features);

    const changelogJson = typeof data.changelog === 'string'
      ? JSON.stringify(data.changelog.split('\n').map(s => s.trim()).filter(Boolean))
      : JSON.stringify(data.changelog);

    await db.execute({
      sql: `UPDATE applications SET 
        name = ?, slug = ?, iconUrl = ?, description = ?, version = ?,
        size = ?, categoryId = ?, downloadUrl = ?, changelog = ?,
        features = ?, featured = ?, published = ?, updatedAt = ?
      WHERE id = ?`,
      args: [
        data.name.trim(),
        finalSlug,
        data.iconUrl.trim(),
        data.description.trim(),
        data.version.trim(),
        data.size.trim(),
        data.categoryId,
        data.downloadUrl.trim(),
        changelogJson,
        featuresJson,
        data.featured ? 1 : 0,
        data.published ? 1 : 0,
        now,
        appId,
      ],
    });

    // Update screenshots
    await db.execute({
      sql: 'DELETE FROM screenshots WHERE applicationId = ?',
      args: [appId],
    });

    if (data.screenshots && data.screenshots.length > 0) {
      for (let i = 0; i < data.screenshots.length; i++) {
        const url = data.screenshots[i].trim();
        if (url) {
          await db.execute({
            sql: 'INSERT INTO screenshots (id, applicationId, imageUrl, sortOrder) VALUES (?, ?, ?, ?)',
            args: [`ss-${Date.now()}-${i}`, appId, url, i],
          });
        }
      }
    }

    res.json({ success: true, message: 'Aplikasi berhasil diperbarui', slug: finalSlug });
  } catch (error) {
    console.error('Update app error:', error);
    res.status(500).json({ error: 'Gagal memperbarui aplikasi' });
  }
});

// 6. Admin Delete Application
apiRouter.delete('/admin/apps/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const appId = req.params.id;
    await db.execute({
      sql: 'DELETE FROM applications WHERE id = ?',
      args: [appId],
    });

    res.json({ success: true, message: 'Aplikasi berhasil dihapus' });
  } catch (error) {
    console.error('Delete app error:', error);
    res.status(500).json({ error: 'Gagal menghapus aplikasi' });
  }
});

// 7. Toggle Publish
apiRouter.patch('/admin/apps/:id/toggle-publish', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const appId = req.params.id;
    const now = new Date().toISOString();
    await db.execute({
      sql: 'UPDATE applications SET published = CASE WHEN published = 1 THEN 0 ELSE 1 END, updatedAt = ? WHERE id = ?',
      args: [now, appId],
    });

    const updated = await db.execute({
      sql: 'SELECT published FROM applications WHERE id = ? LIMIT 1',
      args: [appId],
    });

    res.json({
      success: true,
      published: Boolean(updated.rows[0]?.published),
      message: updated.rows[0]?.published ? 'Aplikasi dipublikasikan' : 'Aplikasi ditarik ke draft',
    });
  } catch (error) {
    console.error('Toggle publish error:', error);
    res.status(500).json({ error: 'Gagal mengubah status publikasi' });
  }
});

// 8. Toggle Featured
apiRouter.patch('/admin/apps/:id/toggle-featured', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const appId = req.params.id;
    const now = new Date().toISOString();
    await db.execute({
      sql: 'UPDATE applications SET featured = CASE WHEN featured = 1 THEN 0 ELSE 1 END, updatedAt = ? WHERE id = ?',
      args: [now, appId],
    });

    const updated = await db.execute({
      sql: 'SELECT featured FROM applications WHERE id = ? LIMIT 1',
      args: [appId],
    });

    res.json({
      success: true,
      featured: Boolean(updated.rows[0]?.featured),
      message: updated.rows[0]?.featured ? 'Aplikasi ditandai sebagai featured' : 'Status featured dicabut',
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({ error: 'Gagal mengubah status featured' });
  }
});

/* =========================================================
   ADMIN CATEGORY MANAGEMENT
   ========================================================= */

// List all categories (Admin)
apiRouter.get('/admin/categories', requireAdminAuth, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await db.execute(`
      SELECT c.id, c.name, c.slug, c.icon, c.createdAt, c.updatedAt,
             COUNT(a.id) as appCount
      FROM categories c
      LEFT JOIN applications a ON a.categoryId = c.id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Admin categories error:', error);
    res.status(500).json({ error: 'Gagal mengambil kategori' });
  }
});

const categorySchema = z.object({
  name: z.string().min(2, 'Nama kategori minimal 2 karakter'),
  slug: z.string().optional(),
  icon: z.string().default('Folder'),
});

// Create category
apiRouter.post('/admin/categories', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = categorySchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Input tidak valid' });
      return;
    }

    const { name, icon } = parse.data;
    const slug = parse.data.slug ? slugify(parse.data.slug) : slugify(name);

    // Check duplicate slug
    const exist = await db.execute({
      sql: 'SELECT id FROM categories WHERE slug = ? OR name = ? LIMIT 1',
      args: [slug, name],
    });

    if (exist.rows.length > 0) {
      res.status(400).json({ error: 'Kategori dengan nama atau slug ini sudah ada' });
      return;
    }

    const id = `cat-${slug || Date.now()}`;
    const now = new Date().toISOString();

    await db.execute({
      sql: 'INSERT INTO categories (id, name, slug, icon, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, name.trim(), slug, icon, now, now],
    });

    res.status(201).json({ success: true, message: 'Kategori berhasil dibuat', id });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Gagal membuat kategori' });
  }
});

// Update category
apiRouter.put('/admin/categories/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    const parse = categorySchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Input tidak valid' });
      return;
    }

    const { name, icon } = parse.data;
    const slug = parse.data.slug ? slugify(parse.data.slug) : slugify(name);

    // Check duplicate slug on other categories
    const exist = await db.execute({
      sql: 'SELECT id FROM categories WHERE (slug = ? OR name = ?) AND id != ? LIMIT 1',
      args: [slug, name, id],
    });

    if (exist.rows.length > 0) {
      res.status(400).json({ error: 'Kategori dengan nama atau slug ini sudah digunakan' });
      return;
    }

    const now = new Date().toISOString();
    await db.execute({
      sql: 'UPDATE categories SET name = ?, slug = ?, icon = ?, updatedAt = ? WHERE id = ?',
      args: [name.trim(), slug, icon, now, id],
    });

    res.json({ success: true, message: 'Kategori berhasil diperbarui' });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Gagal memperbarui kategori' });
  }
});

// Delete category (Safe: reassigns apps to "Lainnya" so apps are not deleted or corrupted)
apiRouter.delete('/admin/categories/:id', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const catId = req.params.id;

    // Check default category "cat-lainnya"
    const fallbackCat = await db.execute({
      sql: "SELECT id FROM categories WHERE id = 'cat-lainnya' OR slug = 'lainnya' LIMIT 1",
    });

    const fallbackId = fallbackCat.rows[0]?.id as string || 'cat-lainnya';

    if (catId === fallbackId) {
      res.status(400).json({ error: 'Kategori default "Lainnya" tidak dapat dihapus' });
      return;
    }

    // Reassign any apps in this category to fallback category
    await db.execute({
      sql: 'UPDATE applications SET categoryId = ? WHERE categoryId = ?',
      args: [fallbackId, catId],
    });

    // Delete category
    await db.execute({
      sql: 'DELETE FROM categories WHERE id = ?',
      args: [catId],
    });

    res.json({ success: true, message: 'Kategori berhasil dihapus. Aplikasi terkait telah dipindahkan ke kategori "Lainnya".' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Gagal menghapus kategori' });
  }
});

/* =========================================================
   ADMIN SETTINGS & CREDENTIALS
   ========================================================= */

// Get all settings (Admin)
apiRouter.get('/admin/settings', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await db.execute('SELECT key, value FROM settings');
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      settings[row.key as string] = row.value as string;
    }

    res.json({
      settings,
      admin: {
        id: req.admin?.id,
        username: req.admin?.username,
      },
    });
  } catch (error) {
    console.error('Admin settings error:', error);
    res.status(500).json({ error: 'Gagal mengambil pengaturan' });
  }
});

// Update settings
const settingsUpdateSchema = z.object({
  site_name: z.string().min(1, 'Nama situs wajib diisi').optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  whatsapp_url: z.string().url('URL WhatsApp harus valid').optional(),
  announcement_enabled: z.enum(['0', '1']).optional(),
  announcement_text: z.string().optional(),
  footer_text: z.string().optional(),
  // Optional credential update
  newUsername: z.string().min(3, 'Username baru minimal 3 karakter').optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter').optional(),
});

apiRouter.put('/admin/settings', requireAdminAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parse = settingsUpdateSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Input tidak valid' });
      return;
    }

    const data = parse.data;
    const now = new Date().toISOString();

    // 1. Update text settings
    const settingKeys = ['site_name', 'tagline', 'description', 'whatsapp_url', 'announcement_enabled', 'announcement_text', 'footer_text'] as const;
    for (const key of settingKeys) {
      if (data[key] !== undefined) {
        await db.execute({
          sql: `INSERT INTO settings (key, value, updatedAt) VALUES (?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value, updatedAt = excluded.updatedAt`,
          args: [key, data[key] as string, now],
        });
      }
    }

    // 2. Handle admin credential updates if requested
    if (data.newPassword || data.newUsername) {
      const adminId = req.admin?.id;
      if (!adminId) {
        res.status(401).json({ error: 'Sesi admin tidak valid' });
        return;
      }

      const adminRes = await db.execute({
        sql: 'SELECT passwordHash FROM admins WHERE id = ? LIMIT 1',
        args: [adminId],
      });

      if (!data.currentPassword) {
        res.status(400).json({ error: 'Password saat ini wajib diisi untuk mengubah akun admin' });
        return;
      }

      const match = await bcrypt.compare(data.currentPassword, adminRes.rows[0].passwordHash as string);
      if (!match) {
        res.status(400).json({ error: 'Password saat ini tidak sesuai' });
        return;
      }

      if (data.newUsername) {
        await db.execute({
          sql: 'UPDATE admins SET username = ?, updatedAt = ? WHERE id = ?',
          args: [data.newUsername.trim(), now, adminId],
        });
      }

      if (data.newPassword) {
        const saltRounds = 10;
        const newHash = await bcrypt.hash(data.newPassword, saltRounds);
        await db.execute({
          sql: 'UPDATE admins SET passwordHash = ?, updatedAt = ? WHERE id = ?',
          args: [newHash, now, adminId],
        });
      }
    }

    res.json({ success: true, message: 'Pengaturan berhasil diperbarui' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Gagal memperbarui pengaturan' });
  }
});
