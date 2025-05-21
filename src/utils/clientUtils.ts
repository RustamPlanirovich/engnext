import { Analytics, AnalyticsItem, Example, Lesson } from '@/types/lesson';

// Client-side utility functions that don't use Node.js modules

// Mock data for initial client-side rendering
const defaultAnalytics: Analytics = {
  errors: [],
  completedLessons: [],
  loadedLessons: [],
  totalExercisesCompleted: 0,
  lastPracticeDate: 0
};

// Extract all examples from a lesson for exercises
export const extractExamples = (lesson: Lesson): Example[] => {
  const examples: Example[] = [];
  
  const processSubconcept = (subconcept: any) => {
    if (subconcept.examples) {
      examples.push(...subconcept.examples);
    }
    
    if (subconcept.subconcepts) {
      subconcept.subconcepts.forEach(processSubconcept);
    }
  };
  
  lesson.subconcepts.forEach(processSubconcept);
  
  return examples;
};

// Helper function to get the base URL
export const getBaseUrl = () => {
  // Check if we're running on the client
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // For server-side rendering, use an absolute URL
  return 'http://localhost:4010';
};

// Helper function to get active profile ID from localStorage
export const getActiveProfileId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('activeProfileId');
  }
  return null;
};

// Helper function to set active profile ID in localStorage
export const setActiveProfileIdLocal = (profileId: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('activeProfileId', profileId);
  }
};

// Client-side API functions
export const fetchLessons = async (): Promise<{ lessons: { id: string, title: string, description: string }[] }> => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/lessons`);
  if (!response.ok) {
    throw new Error('Failed to fetch lessons');
  }
  return await response.json();
};

export const fetchLesson = async (lessonId: string): Promise<{ lesson: Lesson }> => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/lessons/${lessonId}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch lesson ${lessonId}`);
  }
  return await response.json();
};

export const fetchAnalytics = async (profileId?: string): Promise<{ analytics: Analytics }> => {
  const baseUrl = getBaseUrl();
  const activeProfileId = profileId || getActiveProfileId();
  
  const url = activeProfileId 
    ? `${baseUrl}/api/analytics?profileId=${encodeURIComponent(activeProfileId)}`
    : `${baseUrl}/api/analytics`;
    
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch analytics');
  }
  return await response.json();
};

export const addError = async (lessonId: string, sentence: { russian: string, english: string }, errorId?: string, profileId?: string): Promise<void> => {
  try {
    const baseUrl = getBaseUrl();
    const activeProfileId = profileId || getActiveProfileId();
    
    const response = await fetch(`${baseUrl}/api/analytics/error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        lessonId, 
        sentence, 
        errorId, // Added errorId parameter to be passed to the API
        profileId: activeProfileId 
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to record error');
    }
  } catch (error) {
    console.error('Error adding error to analytics:', error);
  }
};

// Remove error from analytics when user correctly answers in practice mode
export const removeError = async (lessonId: string, sentence: { russian: string, english: string }, errorId?: string, profileId?: string): Promise<void> => {
  try {
    const baseUrl = getBaseUrl();
    const activeProfileId = profileId || getActiveProfileId();
    
    const response = await fetch(`${baseUrl}/api/analytics/remove-error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: JSON.stringify({ lessonId, sentence, errorId, profileId: activeProfileId }),
    });
    
    if (!response.ok) {
      console.error('Failed to remove error from analytics');
    }
  } catch (error) {
    console.error('Error removing error from analytics:', error);
  }
};

export const markLessonCompleted = async (lessonId: string, profileId?: string): Promise<void> => {
  try {
    const activeProfileId = profileId || getActiveProfileId();
    console.log(`Marking lesson ${lessonId} as completed for profile ${activeProfileId}`);
    
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/api/analytics/complete`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        lessonId, 
        profileId: activeProfileId 
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark lesson as completed');
    }
  } catch (error) {
    console.error('Error marking lesson as completed:', error);
  }
};

export const saveLessonProgress = async (lessonId: string, lastExerciseEnglish: string, sentenceId?: string, profileId?: string): Promise<void> => {
  try {
    const activeProfileId = profileId || getActiveProfileId();
    
    const baseUrl = getBaseUrl();
    const url = activeProfileId 
      ? `${baseUrl}/api/analytics/progress?profileId=${encodeURIComponent(activeProfileId)}`
      : `${baseUrl}/api/analytics/progress`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lessonId, lastExerciseEnglish, sentenceId })
    });
    
    if (!response.ok) {
      throw new Error('Failed to save lesson progress');
    }
  } catch (error) {
    console.error('Error saving lesson progress:', error);
  }
};

export const getLessonProgress = async (lessonId: string, profileId?: string): Promise<{ lastExerciseEnglish: string | null, completedSentences: string[] }> => {
  try {
    const activeProfileId = profileId || getActiveProfileId();
    
    const baseUrl = getBaseUrl();
    const url = activeProfileId 
      ? `${baseUrl}/api/analytics/progress/${encodeURIComponent(lessonId)}?profileId=${encodeURIComponent(activeProfileId)}`
      : `${baseUrl}/api/analytics/progress/${encodeURIComponent(lessonId)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to get lesson progress');
    }
    
    const data = await response.json();
    return {
      lastExerciseEnglish: data.lastExerciseEnglish || null,
      completedSentences: data.completedSentences || []
    };
  } catch (error) {
    console.error('Error getting lesson progress:', error);
    return { lastExerciseEnglish: null, completedSentences: [] };
  }
};

export const getMostProblematicSentences = async (limit: number = 10, profileId?: string): Promise<AnalyticsItem[]> => {
  try {
    // Получаем активный профиль, если не передан
    const activeProfileId = profileId || getActiveProfileId();
    
    // Запрашиваем аналитику с сервера напрямую
    const baseUrl = getBaseUrl();
    const url = activeProfileId 
      ? `${baseUrl}/api/analytics?profileId=${encodeURIComponent(activeProfileId)}`
      : `${baseUrl}/api/analytics`;
      
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      console.error('Failed to fetch analytics');
      return [];
    }
    
    const { analytics } = await response.json();
    
    // Проверяем, что analytics.errors существует и является массивом
    if (!analytics || !analytics.errors || !Array.isArray(analytics.errors)) {
      console.error('Analytics or errors array is missing or invalid', analytics);
      return [];
    }
    
    // Делаем глубокую копию массива ошибок и сортируем по количеству ошибок
    const sortedErrors = JSON.parse(JSON.stringify(analytics.errors))
      .filter((error: AnalyticsItem) => error && error.errors > 0 && error.sentence && error.sentence.english && error.sentence.russian)
      .sort((a: AnalyticsItem, b: AnalyticsItem) => b.errors - a.errors)
      .slice(0, limit);
    
    console.log(`Found ${sortedErrors.length} problematic sentences for profile ${activeProfileId || 'unknown'}`);
    return sortedErrors;
  } catch (error) {
    console.error('Error getting problematic sentences:', error);
    return [];
  }
};

export const uploadLesson = async (fileName: string, lessonData: string): Promise<{ success: boolean, message: string }> => {
  const baseUrl = getBaseUrl();
  const profileId = getActiveProfileId();
  
  if (!profileId) {
    throw new Error('No active profile');
  }
  
  const response = await fetch(`${baseUrl}/api/admin/lessons?profileId=${encodeURIComponent(profileId)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fileName, lessonData }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload lesson');
  }
  
  return await response.json();
};

export const deleteLesson = async (lessonId: string): Promise<{ success: boolean, message: string }> => {
  const baseUrl = getBaseUrl();
  const profileId = getActiveProfileId();
  
  if (!profileId) {
    throw new Error('No active profile');
  }
  
  const response = await fetch(`${baseUrl}/api/admin/lessons?lessonId=${encodeURIComponent(lessonId)}&profileId=${encodeURIComponent(profileId)}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Failed to delete lesson ${lessonId}`);
  }
  
  return await response.json();
};

export const createAnalyticsBackup = async (): Promise<{ success: boolean, message: string }> => {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/analytics`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'backup' }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create analytics backup');
  }
  
  return await response.json();
};
