import { apiClient } from './client';
import type { User } from './auth';

export interface UpdateProfilePayload {
  name: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountPayload {
  password: string;
}

export interface StatusMessageResponse {
  message: string;
}

export async function getProfile(): Promise<User> {
  return apiClient<User>('/users/profile');
}

export async function updateProfile(data: UpdateProfilePayload): Promise<User> {
  return apiClient<User>('/users/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function changePassword(data: ChangePasswordPayload): Promise<StatusMessageResponse> {
  return apiClient<StatusMessageResponse>('/users/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteAccount(data: DeleteAccountPayload): Promise<StatusMessageResponse> {
  return apiClient<StatusMessageResponse>('/users/account', {
    method: 'DELETE',
    body: JSON.stringify(data),
  });
}
