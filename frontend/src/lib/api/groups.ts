import { apiClient } from './client';
import type { Link } from './links';

export interface GroupListItem {
  id: string;
  name: string;
  description: string | null;
  linkCount: number;
  totalClicks: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupDetailLink {
  id: string;
  shortCode: string;
  originalUrl: string;
  isActive: boolean;
  clickCount: number;
  createdAt: string;
}

export interface GroupDetailResponse {
  id: string;
  name: string;
  description: string | null;
  linkCount: number;
  totalClicks: number;
  createdAt: string;
  updatedAt: string;
  links: GroupDetailLink[];
}

export interface CreateGroupInput {
  name: string;
  description?: string;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
}

export async function getGroups(): Promise<GroupListItem[]> {
  return apiClient<GroupListItem[]>('/groups');
}

export async function getGroup(id: string): Promise<GroupDetailResponse> {
  return apiClient<GroupDetailResponse>(`/groups/${id}`);
}

export async function createGroup(data: CreateGroupInput): Promise<GroupListItem> {
  return apiClient<GroupListItem>('/groups', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateGroup(id: string, data: UpdateGroupInput): Promise<GroupListItem> {
  return apiClient<GroupListItem>(`/groups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteGroup(id: string): Promise<{ success: boolean; message: string }> {
  return apiClient<{ success: boolean; message: string }>(`/groups/${id}`, {
    method: 'DELETE',
  });
}

export async function addLinkToGroup(
  groupId: string,
  linkId: string,
): Promise<{ success: boolean; linkId: string }> {
  return apiClient<{ success: boolean; linkId: string }>(`/groups/${groupId}/links/${linkId}`, {
    method: 'POST',
  });
}

export async function removeLinkFromGroup(
  groupId: string,
  linkId: string,
): Promise<{ success: boolean; linkId: string }> {
  return apiClient<{ success: boolean; linkId: string }>(`/groups/${groupId}/links/${linkId}`, {
    method: 'DELETE',
  });
}
