import { apiClient } from './client';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

/**
 * Raw API call — does NOT touch localStorage or the Zustand store.
 * The store's login() action calls this and then updates state itself.
 */
export async function login(credentials: { email: string; password: string }): Promise<AuthResponse> {
  return apiClient<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function register(userData: {
  name: string;
  email: string;
  password: string;
}): Promise<{ message: string; user: User }> {
  return apiClient<{ message: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}
