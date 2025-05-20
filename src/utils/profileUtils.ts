import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Profile, ProfilesList } from '@/types/lesson';

const profilesDirectory = path.join(process.cwd(), 'data', 'profiles');
const profilesFile = path.join(profilesDirectory, 'profiles.json');
const analyticsDirectory = path.join(process.cwd(), 'data', 'analytics');

// Ensure directories exist
export const ensureDirectoriesExist = () => {
  if (!fs.existsSync(profilesDirectory)) {
    fs.mkdirSync(profilesDirectory, { recursive: true });
  }
  if (!fs.existsSync(analyticsDirectory)) {
    fs.mkdirSync(analyticsDirectory, { recursive: true });
  }
  
  // Ensure profiles.json exists
  if (!fs.existsSync(profilesFile)) {
    fs.writeFileSync(profilesFile, JSON.stringify({ profiles: [] }, null, 2));
  }
};

// Get all profiles
export const getProfiles = (): ProfilesList => {
  ensureDirectoriesExist();
  
  try {
    const fileContents = fs.readFileSync(profilesFile, 'utf8');
    return JSON.parse(fileContents);
  } catch (error) {
    console.error('Error reading profiles:', error);
    return { profiles: [] };
  }
};

// Get a specific profile
export const getProfile = (profileId: string): Profile | null => {
  const { profiles } = getProfiles();
  return profiles.find(profile => profile.id === profileId) || null;
};

// Create a new profile
export const createProfile = (name: string): Profile => {
  const { profiles } = getProfiles();
  
  // Первый созданный профиль автоматически становится администратором
  const isFirstProfile = profiles.length === 0;
  
  const newProfile: Profile = {
    id: uuidv4(),
    name,
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    isAdmin: isFirstProfile, // Первый профиль - администратор
    settings: {
      timerEnabled: false,
      timerDuration: 30,
      darkMode: false,
      exerciseMode: 'ru-to-en-typing',
      exercisesPerSession: 10
    }
  };
  
  profiles.push(newProfile);
  
  fs.writeFileSync(profilesFile, JSON.stringify({ profiles }, null, 2));
  
  // Create analytics file for the new profile
  const profileAnalyticsFile = path.join(analyticsDirectory, `${newProfile.id}.json`);
  const defaultAnalytics = {
    errors: [],
    completedLessons: [],
    loadedLessons: [],
    totalExercisesCompleted: 0,
    lastPracticeDate: 0
  };
  
  fs.writeFileSync(profileAnalyticsFile, JSON.stringify(defaultAnalytics, null, 2));
  
  return newProfile;
};

// Update a profile
export const updateProfile = (profile: Profile): Profile => {
  const { profiles } = getProfiles();
  
  const index = profiles.findIndex(p => p.id === profile.id);
  if (index === -1) {
    throw new Error(`Profile with ID ${profile.id} not found`);
  }
  
  // Update the profile
  profiles[index] = {
    ...profiles[index],
    ...profile,
    lastActiveAt: Date.now(),
  };
  
  // Save profiles
  fs.writeFileSync(profilesFile, JSON.stringify({ profiles }, null, 2));
  
  return profiles[index];
};

// Update profile settings
export const updateProfileSettings = (profileId: string, settings: any): Profile => {
  const { profiles } = getProfiles();
  
  const index = profiles.findIndex(p => p.id === profileId);
  if (index === -1) {
    throw new Error(`Profile with ID ${profileId} not found`);
  }
  
  // Update the settings
  profiles[index].settings = {
    ...profiles[index].settings,
    ...settings
  };
  
  // Save profiles
  fs.writeFileSync(profilesFile, JSON.stringify({ profiles }, null, 2));
  
  return profiles[index];
};

// Check if a profile has admin rights
export const isAdmin = (profileId: string): boolean => {
  const profile = getProfile(profileId);
  return profile?.isAdmin === true;
};

// Delete a profile
export const deleteProfile = (profileId: string, requestingProfileId: string): { success: boolean, message: string } => {
  // Проверяем, что запрашивающий профиль является администратором
  if (!isAdmin(requestingProfileId)) {
    return { success: false, message: 'Только администратор может удалять профили' };
  }
  
  // Не позволяем удалить свой собственный профиль
  if (profileId === requestingProfileId) {
    return { success: false, message: 'Вы не можете удалить свой собственный профиль' };
  }
  
  const { profiles } = getProfiles();
  
  const index = profiles.findIndex(p => p.id === profileId);
  
  if (index !== -1) {
    // Не позволяем удалить другого администратора
    if (profiles[index].isAdmin) {
      return { success: false, message: 'Вы не можете удалить профиль администратора' };
    }
    
    // Remove the profile
    profiles.splice(index, 1);
    
    // Save profiles
    fs.writeFileSync(profilesFile, JSON.stringify({ profiles }, null, 2));
    
    // Delete profile analytics file if it exists
    const analyticsFile = path.join(analyticsDirectory, `${profileId}.json`);
    if (fs.existsSync(analyticsFile)) {
      fs.unlinkSync(analyticsFile);
    }
    
    return { success: true, message: 'Профиль успешно удален' };
  }
  
  return { success: false, message: 'Профиль не найден' };
};

// Set active profile
export const setActiveProfile = (profileId: string): void => {
  const profilesList = getProfiles();
  profilesList.activeProfileId = profileId;
  
  fs.writeFileSync(profilesFile, JSON.stringify(profilesList, null, 2));
  
  // Update last active time
  const profile = getProfile(profileId);
  if (profile) {
    updateProfile({
      ...profile,
      lastActiveAt: Date.now()
    });
  }
};

// Get active profile
export const getActiveProfile = (): Profile | null => {
  const { profiles, activeProfileId } = getProfiles();
  
  if (!activeProfileId || !profiles.length) {
    return null;
  }
  
  return profiles.find(profile => profile.id === activeProfileId) || null;
};
