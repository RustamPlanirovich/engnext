/**
 * Client-side API utilities for interacting with the backend
 */

// Helper function to get the base URL
const getBaseUrl = () => {
  // Check if we're running on the client
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // For server-side rendering, use an absolute URL
  return 'http://localhost:4010';
};

// Fetch all lessons
export const fetchLessons = async () => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/lessons`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch lessons');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching lessons:', error);
    throw error;
  }
};

// Fetch a specific lesson
export const fetchLesson = async (lessonId: string) => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/lessons/${lessonId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch lesson ${lessonId}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching lesson ${lessonId}:`, error);
    throw error;
  }
};

// Delete a lesson
export const deleteLesson = async (lessonId: string) => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || `Failed to delete lesson ${lessonId}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error deleting lesson ${lessonId}:`, error);
    throw error;
  }
};

// Upload a new lesson
export const uploadLesson = async (fileName: string, lessonData: string) => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/lessons/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName, lessonData }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to upload lesson');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error uploading lesson:', error);
    throw error;
  }
};

// Fetch analytics data
export const fetchAnalytics = async () => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};

// Create analytics backup
export const createAnalyticsBackup = async () => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'backup' }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to create analytics backup');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating analytics backup:', error);
    throw error;
  }
};

// Record an error
export const recordError = async (lessonId: string, sentence: { russian: string, english: string }) => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/analytics/error`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lessonId, sentence }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to record error');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error recording error:', error);
    throw error;
  }
};

// Mark lesson as completed
export const markLessonCompleted = async (lessonId: string) => {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/analytics/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lessonId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark lesson as completed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error marking lesson as completed:', error);
    throw error;
  }
};
