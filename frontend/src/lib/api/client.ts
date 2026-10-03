const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

let isRedirecting = false;

/**
 * Handles 401 Unauthorized responses for protected endpoints.
 * Clears persistent credentials, resets Zustand auth state,
 * and routes the user back to the login page.
 */
async function handleUnauthorized(endpoint: string): Promise<void> {
  // Never intercept authentication attempts (invalid credentials legitimately return 401)
  if (endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/register')) {
    return;
  }

  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('linkly-auth');
  } catch {
    // Ignore storage access errors
  }

  try {
    const { useAuthStore } = await import('@/lib/stores/auth.store');
    useAuthStore.getState().logout();
  } catch {
    // Ignore dynamic import failure
  }

  if (!isRedirecting) {
    const currentPath = window.location.pathname;
    if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
      isRedirecting = true;
      window.location.href = '/login';
    }
  }
}

/**
 * Reads the JWT from the Zustand persist storage.
 * Works in both SSR and client contexts without importing the store
 * (which would create a circular dep since the store imports auth API).
 */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('linkly-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { accessToken?: string } };
    return parsed?.state?.accessToken ?? null;
  } catch {
    return null;
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      await handleUnauthorized(endpoint);
    }

    let errorMessage = `API error: ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) {
        errorMessage = Array.isArray(errorJson.message)
          ? errorJson.message.join(', ')
          : errorJson.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<T>;
}

