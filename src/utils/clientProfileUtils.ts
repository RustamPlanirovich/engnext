import { Profile, ProfilesList, UserSettings } from '@/types/lesson';
import { getBaseUrl, getActiveProfileId } from './clientUtils';

// Fetch all profiles
export const fetchProfiles = async (): Promise<ProfilesList> => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/profiles`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch profiles');
  }
  
  return await response.json();
};

// Fetch a specific profile
export const fetchProfile = async (profileId: string): Promise<{ profile: Profile }> => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/profiles/${profileId}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch profile ${profileId}`);
  }
  
  return await response.json();
};

// Create a new profile
export const createProfile = async (name: string): Promise<{ profile: Profile }> => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/profiles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create profile');
  }
  
  return await response.json();
};

// Delete a profile
export const deleteProfile = async (profileId: string, requestingProfileId?: string): Promise<{ success: boolean, message: string }> => {
  const baseUrl = getBaseUrl();
  const activeProfileId = requestingProfileId || getActiveProfileId();
  
  if (!activeProfileId) {
    throw new Error('No active profile');
  }
  
  const response = await fetch(`${baseUrl}/api/profiles/${profileId}?requestingProfileId=${encodeURIComponent(activeProfileId)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to delete profile ${profileId}`);
  }
  
  return await response.json();
};

// Set active profile
export const setActiveProfile = async (profileId: string): Promise<{ success: boolean }> => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/profiles`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ profileId }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to set active profile');
  }
  
  return await response.json();
};

// Fetch profile settings
export const fetchProfileSettings = async (profileId?: string): Promise<{ settings: UserSettings }> => {
  const baseUrl = getBaseUrl();
  const activeProfileId = profileId || getActiveProfileId();
  
  if (!activeProfileId) {
    throw new Error('No active profile');
  }
  
  const response = await fetch(`${baseUrl}/api/profiles/${activeProfileId}/settings`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch profile settings`);
  }
  
  return await response.json();
};

// Update profile settings
export const updateProfileSettings = async (settings: Partial<UserSettings>, profileId?: string): Promise<{ settings: UserSettings }> => {
  const baseUrl = getBaseUrl();
  const activeProfileId = profileId || getActiveProfileId();
  
  if (!activeProfileId) {
    throw new Error('No active profile');
  }
  
  const response = await fetch(`${baseUrl}/api/profiles/${activeProfileId}/settings`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update profile settings');
  }
  
  return await response.json();
};

// Check if a profile is an admin
export const isAdmin = async (profileId?: string): Promise<boolean> => {
  const activeProfileId = profileId || getActiveProfileId();
  
  if (!activeProfileId) {
    return false;
  }
  
  try {
    const { profile } = await fetchProfile(activeProfileId);
    return profile.isAdmin === true;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};
