export interface Application {
  id: string;
  name: string;
  slug: string;
  iconUrl: string;
  description: string;
  version: string;
  size: string;
  categoryId: string;
  downloadUrl?: string;
  changelog?: string[] | string;
  features?: string[] | string;
  featured: number | boolean;
  published: number | boolean;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  categorySlug?: string;
  categoryIcon?: string;
  screenshots?: string[];
  screenshotCount?: number;
  relatedApps?: ApplicationSummary[];
}

export interface ApplicationSummary {
  id: string;
  name: string;
  slug: string;
  iconUrl: string;
  version: string;
  size: string;
  categoryName?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  createdAt?: string;
  updatedAt?: string;
  appCount?: number;
}

export interface PublicConfig {
  site_name: string;
  tagline: string;
  description: string;
  whatsapp_url: string;
  announcement_enabled: boolean;
  announcement_text: string;
  footer_text: string;
}

export interface AdminStats {
  totalApps: number;
  publishedApps: number;
  draftApps: number;
  featuredApps: number;
  totalCategories: number;
  totalDownloads: number;
  recentLogs: Array<{
    id: string;
    createdAt: string;
    userAgent: string;
    appName: string;
    version: string;
    iconUrl: string;
  }>;
  recentlyUpdated: Array<{
    id: string;
    name: string;
    version: string;
    slug: string;
    iconUrl: string;
    updatedAt: string;
    published: number;
    downloadCount: number;
  }>;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}
