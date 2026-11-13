const API_BASE = '/api';

const getHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('robo_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const demoUserId = localStorage.getItem('robo_demo_user_id');
  if (demoUserId) {
    headers['x-demo-user-id'] = demoUserId;
  }
  return headers;
};

export const api = {
  // Health Check
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  // Auth
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },

  async register(userData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  },

  async getProfile() {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async updateProfile(data) {
    const res = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updatePreferences(preferences) {
    const res = await fetch(`${API_BASE}/auth/preferences`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(preferences)
    });
    return res.json();
  },

  async changePassword(data) {
    const res = await fetch(`${API_BASE}/auth/password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getDemoAccounts() {
    const res = await fetch(`${API_BASE}/auth/demo-accounts`);
    return res.json();
  },

  // Components
  async getComponents(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.includeArchived) query.append('includeArchived', 'true');

    const res = await fetch(`${API_BASE}/components?${query.toString()}`);
    return res.json();
  },

  async getComponentById(id) {
    const res = await fetch(`${API_BASE}/components/${id}`);
    return res.json();
  },

  async createComponent(data) {
    const res = await fetch(`${API_BASE}/components`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async bulkCreateComponents(components) {
    const res = await fetch(`${API_BASE}/components/bulk`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ components })
    });
    return res.json();
  },

  async updateComponent(id, data) {
    const res = await fetch(`${API_BASE}/components/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async restoreComponent(id) {
    const res = await fetch(`${API_BASE}/components/${id}/restore`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return res.json();
  },

  async deleteComponent(id, permanent = false) {
    const query = permanent ? '?permanent=true' : '';
    const res = await fetch(`${API_BASE}/components/${id}${query}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // Requests
  async createRequest(data) {
    const res = await fetch(`${API_BASE}/requests`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getRequests(status = '') {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/requests${query}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getRequestById(id) {
    const res = await fetch(`${API_BASE}/requests/${id}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async reviewRequest(id, reviewData) {
    const res = await fetch(`${API_BASE}/requests/${id}/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(reviewData)
    });
    return res.json();
  },

  async cancelRequest(id) {
    const res = await fetch(`${API_BASE}/requests/${id}/cancel`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  // Inventory
  async issueRequest(id) {
    const res = await fetch(`${API_BASE}/inventory/issue/${id}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return res.json();
  },

  async processReturn(id, returnItems) {
    const res = await fetch(`${API_BASE}/inventory/return/${id}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ returnItems })
    });
    return res.json();
  },

  async adjustStock(data) {
    const res = await fetch(`${API_BASE}/inventory/adjust`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async getTransactions() {
    const res = await fetch(`${API_BASE}/inventory/transactions`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async exportInventoryCSV() {
    const res = await fetch(`${API_BASE}/inventory/export`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error(`Failed to export inventory CSV: ${res.statusText}`);
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robotics_club_inventory_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  // Projects
  async getProjects() {
    const res = await fetch(`${API_BASE}/projects`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async createProject(data) {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateProject(id, data) {
    const res = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Maintenance
  async getMaintenanceTickets() {
    const res = await fetch(`${API_BASE}/maintenance`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async createMaintenanceTicket(data) {
    const res = await fetch(`${API_BASE}/maintenance`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateMaintenanceTicket(id, data) {
    const res = await fetch(`${API_BASE}/maintenance/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  // Analytics
  async getAnalytics() {
    const res = await fetch(`${API_BASE}/analytics`, {
      headers: getHeaders()
    });
    return res.json();
  },

  // Seniors Management
  async getSeniors(search = '') {
    const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    const res = await fetch(`${API_BASE}/seniors${query}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async getSeniorById(id) {
    const res = await fetch(`${API_BASE}/seniors/${id}`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async createSenior(data) {
    const res = await fetch(`${API_BASE}/seniors`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async updateSenior(id, data) {
    const res = await fetch(`${API_BASE}/seniors/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteSenior(id) {
    const res = await fetch(`${API_BASE}/seniors/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  // Users
  async getUsers() {
    const res = await fetch(`${API_BASE}/users`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async createStudentUser(data) {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async deleteUser(id) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return res.json();
  },

  async updateUserRole(id, role) {
    const res = await fetch(`${API_BASE}/users/${id}/role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role })
    });
    return res.json();
  },

  async toggleUserStatus(id) {
    const res = await fetch(`${API_BASE}/users/${id}/status`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return res.json();
  },

  // Notifications
  async getNotifications() {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getHeaders()
    });
    return res.json();
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return res.json();
  },

  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/audit-logs`, {
      headers: getHeaders()
    });
    return res.json();
  }
};
