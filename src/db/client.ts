import { createClient, type Client } from '@libsql/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const dbUrl = process.env.DATABASE_URL || 'file:rey_modder.db';

export const db: Client = createClient({
  url: dbUrl,
});

export async function initDatabase(): Promise<void> {
  // Create tables if they do not exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      icon TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      iconUrl TEXT NOT NULL,
      description TEXT NOT NULL,
      version TEXT NOT NULL,
      size TEXT NOT NULL,
      categoryId TEXT NOT NULL,
      downloadUrl TEXT NOT NULL,
      changelog TEXT NOT NULL,
      features TEXT NOT NULL,
      featured INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1,
      downloadCount INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE RESTRICT
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS screenshots (
      id TEXT PRIMARY KEY,
      applicationId TEXT NOT NULL,
      imageUrl TEXT NOT NULL,
      sortOrder INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS download_logs (
      id TEXT PRIMARY KEY,
      applicationId TEXT NOT NULL,
      ipHash TEXT,
      userAgent TEXT,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  // Indexes for high performance
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_apps_slug ON applications(slug);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_apps_categoryId ON applications(categoryId);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_apps_published ON applications(published);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_apps_featured ON applications(featured);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_apps_updatedAt ON applications(updatedAt);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_screenshots_appId ON screenshots(applicationId);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_download_logs_appId ON download_logs(applicationId);`);
}
