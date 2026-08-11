export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  let token = localStorage.getItem('token');
  
  if (!token) {
    // Development auto-login
    const authRes = await fetch(`${API_BASE}/auth/dev-login`, { method: 'POST' });
    if (authRes.ok) {
      const data = await authRes.json();
      token = data.token;
      localStorage.setItem('token', token);
    }
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};
