export class ApiError extends Error {
  constructor(status, code, details = null, message = '') {
    super(message || code || 'ApiError');
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

const STORAGE_KEY = 'medicap_token';

export function setToken(token) {
  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function getToken() {
  return localStorage.getItem(STORAGE_KEY);
}

export function clearToken() {
  localStorage.removeItem(STORAGE_KEY);
}

async function request(method, path, { query = null, body = null } = {}) {
  if (import.meta.env.VITE_USE_MOCKS === 'true') {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const { mockRouter } = await import('../mocks/router.js');
    const token = getToken();
    return await mockRouter(method, path, { query, body, token });
  }

  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  let url = `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;

  if (query && Object.keys(query).length > 0) {
    const params = new URLSearchParams();
    for (const [key, val] of Object.entries(query)) {
      if (val !== undefined && val !== null) {
        params.append(key, val);
      }
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError(0, 'NETWORK_ERROR', null, err.message || 'Cannot reach the server');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const errPayload = data?.error || {};
    const code = errPayload.code || 'INTERNAL_ERROR';
    const message = errPayload.message || 'Request failed';
    const details = errPayload.details || null;

    if (code === 'UNAUTHENTICATED' && path !== '/auth/login') {
      clearToken();
      window.dispatchEvent(new Event('medicap:logout'));
    }

    throw new ApiError(res.status, code, details, message);
  }

  return data ? data.data : null;
}

export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body) => request('POST', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  del: (path) => request('DELETE', path),

  download: async (path, query, filename) => {
    if (import.meta.env.VITE_USE_MOCKS === 'true') {
      await new Promise((resolve) => setTimeout(resolve, 300));
      const blob = new Blob(['mock report data'], { type: 'text/csv' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename || 'report.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      return;
    }

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    let url = `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;

    if (query && Object.keys(query).length > 0) {
      const params = new URLSearchParams();
      for (const [key, val] of Object.entries(query)) {
        if (val !== undefined && val !== null) {
          params.append(key, val);
        }
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers = {};
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let res;
    try {
      res = await fetch(url, { headers });
    } catch (err) {
      throw new ApiError(0, 'NETWORK_ERROR', null, err.message || 'Cannot reach the server');
    }

    if (!res.ok) {
      let errData = null;
      try { errData = await res.json(); } catch { /* ignore */ }
      const code = errData?.error?.code || 'INTERNAL_ERROR';
      const message = errData?.error?.message || 'Download failed';
      throw new ApiError(res.status, code, errData?.error?.details || null, message);
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'download.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  },
};
