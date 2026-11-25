import app from '../src/app.js';
import { pool } from '../src/db/pool.js';

export async function startServer() {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const port = server.address().port;
      const baseUrl = `http://localhost:${port}/api`;
      resolve({
        baseUrl,
        close: async () => {
          if (typeof server.closeAllConnections === 'function') {
            server.closeAllConnections();
          }
          await new Promise((res) => server.close(res));
          await pool.end();
        }
      });
    });
  });
}

export async function api(baseUrl, method, path, { token, body } = {}) {
  const headers = {
    Connection: 'close'
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  let json = null;
  const text = await res.text();
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = text;
    }
  }

  return { status: res.status, json };
}

export async function loginAs(baseUrl, email) {
  const { status, json } = await api(baseUrl, 'POST', '/auth/login', {
    body: { identifier: email, password: 'Password@123' }
  });

  if (status !== 200 || !json?.data?.token) {
    throw new Error(`loginAs failed for ${email}: status ${status}`);
  }

  return json.data.token;
}

export default {
  startServer,
  api,
  loginAs
};
