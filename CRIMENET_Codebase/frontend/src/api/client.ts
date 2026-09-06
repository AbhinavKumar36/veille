export class APIError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export async function tryRefreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
    });
    
    if (!response.ok) return false;
    
    const data = await response.json();
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('access_token');
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    } as Record<string, string>,
    credentials: 'include',
  };

  // If uploading a file, don't set Content-Type to application/json
  if (options.body instanceof FormData) {
    if (fetchOptions.headers) {
      delete (fetchOptions.headers as any)['Content-Type'];
    }
  }

  let response = await fetch(`${BASE_URL}${path}`, fetchOptions);

  if (response.status === 401 && path !== '/auth/login' && path !== '/auth/refresh') {
    const refreshed = await tryRefreshToken();
    if (!refreshed) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('veille_auth');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new APIError(401, 'Session expired');
    }
    
    // Retry with new token
    const newToken = localStorage.getItem('access_token');
    if (fetchOptions.headers) {
      (fetchOptions.headers as any)['Authorization'] = `Bearer ${newToken}`;
    }
    response = await fetch(`${BASE_URL}${path}`, fetchOptions);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new APIError(response.status, errorBody.detail || errorBody.message || 'Unknown error');
  }

  return response.json();
}

export const api = {
  get: (path: string, options?: RequestInit) => request(path, { ...options, method: 'GET' }),
  post: (path: string, body: any, options?: RequestInit) => {
    return request(path, { 
      ...options, 
      method: 'POST', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    });
  },
  patch: (path: string, body: any, options?: RequestInit) => {
    return request(path, { 
      ...options, 
      method: 'PATCH', 
      body: body instanceof FormData ? body : JSON.stringify(body) 
    });
  },
  delete: (path: string, options?: RequestInit) => request(path, { ...options, method: 'DELETE' }),
};
