import type { Application, Category, PublicConfig, AdminStats } from '../types/index.ts';

const TOKEN_KEY = 'rm_auth_token';

export const authStorage = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setToken(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
  },
  clearToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
  },
};

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = authStorage.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Public APIs
  async getConfig(): Promise<PublicConfig> {
    const res = await fetch('/api/public/config');
    if (!res.ok) throw new Error('Gagal memuat pengaturan website');
    return res.json();
  },

  async getCategories(): Promise<Category[]> {
    const res = await fetch('/api/public/categories');
    if (!res.ok) throw new Error('Gagal memuat daftar kategori');
    return res.json();
  },

  async getApps(params: {
    q?: string;
    category?: string;
    sort?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ apps: Application[]; total: number; page: number; limit: number; totalPages: number }> {
    const sp = new URLSearchParams();
    if (params.q) sp.append('q', params.q);
    if (params.category) sp.append('category', params.category);
    if (params.sort) sp.append('sort', params.sort);
    if (params.featured) sp.append('featured', 'true');
    if (params.page) sp.append('page', params.page.toString());
    if (params.limit) sp.append('limit', params.limit.toString());

    const res = await fetch(`/api/public/apps?${sp.toString()}`);
    if (!res.ok) throw new Error('Gagal memuat aplikasi');
    return res.json();
  },

  async getAppBySlug(slug: string): Promise<Application> {
    const res = await fetch(`/api/public/apps/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error('Aplikasi tidak ditemukan');
      throw new Error('Gagal memuat detail aplikasi');
    }
    return res.json();
  },

  async downloadApp(id: string): Promise<{ downloadUrl: string; appName: string }> {
    const res = await fetch(`/api/public/apps/${encodeURIComponent(id)}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Gagal memulai unduhan');
    }
    return res.json();
  },

  // Admin Auth APIs
  async login(username: string, password: string): Promise<{ token: string; admin: { id: string; username: string } }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal login');
    }
    authStorage.setToken(data.token);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } finally {
      authStorage.clearToken();
    }
  },

  async checkAuth(): Promise<{ authenticated: boolean; admin?: { id: string; username: string } }> {
    const res = await fetch('/api/admin/me', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return { authenticated: false };
    return res.json();
  },

  // Admin Management APIs
  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch('/api/admin/stats', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Gagal memuat statistik admin');
    return res.json();
  },

  async getAdminApps(params: { status?: string; q?: string } = {}): Promise<Application[]> {
    const sp = new URLSearchParams();
    if (params.status) sp.append('status', params.status);
    if (params.q) sp.append('q', params.q);

    const res = await fetch(`/api/admin/apps?${sp.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Gagal memuat daftar aplikasi admin');
    return res.json();
  },

  async getAdminApp(id: string): Promise<Application> {
    const res = await fetch(`/api/admin/apps/${encodeURIComponent(id)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Gagal memuat detail aplikasi');
    return res.json();
  },

  async createAdminApp(data: any): Promise<{ success: boolean; id: string; slug: string }> {
    const res = await fetch('/api/admin/apps', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menambahkan aplikasi');
    return json;
  },

  async updateAdminApp(id: string, data: any): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`/api/admin/apps/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal memperbarui aplikasi');
    return json;
  },

  async deleteAdminApp(id: string): Promise<void> {
    const res = await fetch(`/api/admin/apps/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(json.error || 'Gagal menghapus aplikasi');
    }
  },

  async togglePublish(id: string): Promise<{ published: boolean }> {
    const res = await fetch(`/api/admin/apps/${encodeURIComponent(id)}/toggle-publish`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal mengubah status publikasi');
    return json;
  },

  async toggleFeatured(id: string): Promise<{ featured: boolean }> {
    const res = await fetch(`/api/admin/apps/${encodeURIComponent(id)}/toggle-featured`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal mengubah status featured');
    return json;
  },

  async getAdminCategories(): Promise<Category[]> {
    const res = await fetch('/api/admin/categories', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Gagal memuat kategori admin');
    return res.json();
  },

  async createCategory(data: { name: string; slug?: string; icon: string }): Promise<void> {
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal membuat kategori');
  },

  async updateCategory(id: string, data: { name: string; slug?: string; icon: string }): Promise<void> {
    const res = await fetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal memperbarui kategori');
  },

  async deleteCategory(id: string): Promise<string> {
    const res = await fetch(`/api/admin/categories/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menghapus kategori');
    return json.message;
  },

  async getAdminSettings(): Promise<{ settings: Record<string, string>; admin: { id: string; username: string } }> {
    const res = await fetch('/api/admin/settings', {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Gagal memuat pengaturan situs');
    return res.json();
  },

  async updateAdminSettings(data: any): Promise<void> {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Gagal menyimpan pengaturan');
  },
};
