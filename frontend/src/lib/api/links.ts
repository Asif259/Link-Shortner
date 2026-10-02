import { apiClient } from './client';

export type LinkStatus = 'active' | 'disabled' | 'expired';

export interface Link {
  id: string;
  userId?: string;
  shortCode: string;
  originalUrl: string;
  createdAt: string;
  updatedAt: string;
  clickCount?: number;
  status?: LinkStatus;
}

export interface GetLinksParams {
  search?: string;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
}

export interface CreateLinkInput {
  originalUrl: string;
  shortCode?: string;
}

export interface UpdateLinkInput {
  originalUrl?: string;
  shortCode?: string;
  status?: LinkStatus;
}

export async function getLinks(params?: GetLinksParams): Promise<Link[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.status && params.status !== 'all') query.append('status', params.status);
  if (params?.sort) query.append('sort', params.sort);
  if (params?.page) query.append('page', params.page.toString());
  if (params?.limit) query.append('limit', params.limit.toString());

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return apiClient<Link[]>(`/links${queryString}`);
}

export async function getLink(id: string): Promise<Link> {
  return apiClient<Link>(`/links/${id}`);
}

export async function createLink(data: CreateLinkInput): Promise<Link> {
  return apiClient<Link>('/links', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLink(id: string, data: UpdateLinkInput): Promise<Link> {
  return apiClient<Link>(`/links/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteLink(id: string): Promise<{ success: boolean; message?: string }> {
  return apiClient<{ success: boolean; message?: string }>(`/links/${id}`, {
    method: 'DELETE',
  });
}

export async function disableLink(id: string): Promise<Link> {
  return apiClient<Link>(`/links/${id}/disable`, {
    method: 'POST',
  });
}
