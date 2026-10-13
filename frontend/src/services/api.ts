/**
 * Centralized API Service for PulseDev MERN Stack
 * Features automatic Bearer JWT header injection, credentialed cookies, and standardized error extraction.
 */

const getAuthToken = (): string | null => {
  return localStorage.getItem('pulsedev_jwt_token');
};

const request = async <T = any>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    credentials: 'include',
    headers,
  });

  const data = await response.json().catch(() => ({ success: false, message: 'Invalid server JSON response' }));

  if (!response.ok) {
    throw new Error(data.message || `HTTP Error ${response.status}: ${response.statusText}`);
  }

  return data as T;
};

export const api = {
  // Auth & Users
  auth: {
    getPersonas: () => request('/api/users/personas'),

    login: (email: string, password: string) =>
      request('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    changePassword: (currentPassword: string, newPassword: string) =>
      request('/api/users/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      }),

    forgotPassword: (email: string, newPassword: string) =>
      request('/api/users/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email, newPassword }),
      }),

    register: (userData: {
      name: string;
      email: string;
      password: string;
      role?: string;
      department?: string;
      title?: string;
    }) =>
      request('/api/users/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),

    logout: () =>
      request('/api/users/logout', {
        method: 'POST',
      }),

    getProfile: () => request('/api/users/profile'),

    getUsers: () => request('/api/users'),

    getTeamMembers: () => request('/api/team-members'),

    getTeamMemberProfile: (userId: string) => request(`/api/users/${userId}`),

    updateProfile: (
      userId: string,
      updates: Partial<{ name: string; title: string; department: string; status: string }>
    ) =>
      request(`/api/users/${userId}/profile`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),

    updateUserRole: (userId: string, role: string) =>
      request(`/api/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      }),

    impersonateUser: (userId: string, reason: string) =>
      request(`/api/users/${userId}/impersonate`, {
        method: 'POST',
        body: JSON.stringify({ confirmed: true, reason }),
      }),

    exitImpersonation: () =>
      request('/api/users/exit-impersonation', {
        method: 'POST',
      }),

    getAuditLogs: () => request('/api/users/audit-logs'),

    inspectToken: (token?: string) =>
      request('/api/users/token-inspect', {
        method: 'POST',
        body: JSON.stringify({ token }),
      }),
  },

  // Projects & Kanban Tasks
  projects: {
    getAll: () => request('/api/projects'),

    create: (data: { title: string; key: string; description: string; category?: string; tags?: string[] }) =>
      request('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getTasks: (projectId: string) => request(`/api/projects/${projectId}/tasks`),

    getAnalytics: () => request('/api/projects/analytics'),
  },

  tasks: {
    create: (data: {
      projectId: string;
      title: string;
      description?: string;
      column?: string;
      priority?: string;
      assigneeId?: string;
      estimateHours?: number;
      tags?: string[];
    }) =>
      request('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (
      id: string,
      updates: Partial<{ column: string; priority: string; title: string; description: string; assigneeId: string }>
    ) =>
      request(`/api/tasks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      }),

    delete: (id: string) =>
      request(`/api/tasks/${id}`, {
        method: 'DELETE',
      }),

    addComment: (id: string, text: string) =>
      request(`/api/tasks/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
  },

  // Live Database Inspector
  database: {
    query: (collection: string, operation: string, filter: any = {}, pipeline: any[] = []) =>
      request('/api/database/query', {
        method: 'POST',
        body: JSON.stringify({ collection, operation, filter, pipeline }),
      }),

    getStats: () => request('/api/database/stats'),

    seed: () =>
      request('/api/database/seed', {
        method: 'POST',
      }),
  },

  // Gemini AI Intelligence (Thinking Mode)
  ai: {
    deepAudit: (topic: string, prompt?: string, codeSnippet?: string) =>
      request('/api/ai/audit', {
        method: 'POST',
        body: JSON.stringify({ topic, prompt, codeSnippet }),
      }),

    generateSprint: (projectTitle: string, projectDescription: string) =>
      request('/api/ai/generate-sprint', {
        method: 'POST',
        body: JSON.stringify({ projectTitle, projectDescription }),
      }),

    interviewQA: (category: string) =>
      request('/api/ai/interview-qa', {
        method: 'POST',
        body: JSON.stringify({ category }),
      }),
  },

  // Real-time System Metrics
  system: {
    getHealth: () => request('/api/system/health'),
    getMetrics: () => request('/api/system/metrics'),
  },

  // Team Notifications
  notifications: {
    getAll: () => request('/api/notifications'),
    markRead: (id: string) =>
      request(`/api/notifications/${id}/read`, {
        method: 'PUT',
      }),
    markAllRead: () =>
      request('/api/notifications/read-all', {
        method: 'PUT',
      }),
  },

  // Engineer Team Chat & Copilot Messages
  messages: {
    getAll: () => request('/api/messages'),
    send: (text: string, channel = 'engineering-sync', attachments: any[] = []) =>
      request('/api/messages', {
        method: 'POST',
        body: JSON.stringify({ text, channel, attachments }),
      }),
  },
};

export default api;
