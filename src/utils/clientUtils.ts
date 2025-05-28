import { Analytics, AnalyticsItem, Example, Lesson, LessonFile, UploadResult, SpacedRepetitionInfo } from '@/types/lesson';

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

export const markLessonCompleted = async (lessonId: string, profileId?: string): Promise<{ nextReviewDate: number }> => {
  try {
    const baseUrl = getBaseUrl();
    const activeProfileId = profileId || getActiveProfileId();
    
    const response = await fetch(`${baseUrl}/api/lessons/${lessonId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profileId: activeProfileId }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark lesson as completed');
    }
    
    const data = await response.json();
    console.log(`Marked lesson ${lessonId} as completed. Next review date: ${new Date(data.nextReviewDate).toLocaleDateString()}`);
    return data;
  } catch (error) {
    console.error('Error marking lesson as completed:', error);
    return { nextReviewDate: 0 };
  }
};

/**
 * Отметить урок как повторенный
 * Обновляет информацию о повторении и рассчитывает новую дату повторения
 * 
 * @param lessonId - ID урока
 * @param errorCount - Количество ошибок при повторении
 * @param profileId - ID профиля пользователя (опционально)
 * @returns Информация о следующем повторении или null, если все повторения завершены
 */
export const markLessonRepeated = async (lessonId: string, errorCount: number = 0, profileId?: string): Promise<{ nextReviewDate: number, isComplete: boolean }> => {
  try {
    const baseUrl = getBaseUrl();
    const activeProfileId = profileId || getActiveProfileId();
    
    const response = await fetch(`${baseUrl}/api/lessons/${lessonId}/repeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        profileId: activeProfileId,
        errorCount
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark lesson as repeated');
    }
    
    const data = await response.json();
    console.log(`Marked lesson ${lessonId} as repeated. Next review date: ${new Date(data.nextReviewDate).toLocaleDateString()}`);
    return data;
  } catch (error) {
    console.error('Error marking lesson as repeated:', error);
    return { nextReviewDate: 0, isComplete: false };
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
      
    const response = await fetch(url);
    
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

// Загрузка одного урока (для обратной совместимости)
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

// Загрузка нескольких уроков

export const uploadMultipleLessons = async (files: LessonFile[]): Promise<{ success: boolean, results: UploadResult[], message: string }> => {
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
    body: JSON.stringify({ files }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to upload lessons');
  }
  
  return await response.json();
};

// Функции для работы с системой интервального повторения

// Получить информацию о повторении урока
export const getLessonSpacedRepetitionInfo = async (lessonId: string, profileId?: string): Promise<SpacedRepetitionInfo | null> => {
  try {
    const baseUrl = getBaseUrl();
    const activeProfileId = profileId || getActiveProfileId();
    
    if (!activeProfileId) {
      return null;
    }
    
    const response = await fetch(`${baseUrl}/api/analytics?action=spaced-repetition-info&lessonId=${encodeURIComponent(lessonId)}&profileId=${encodeURIComponent(activeProfileId)}`);
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.repetitionInfo;
  } catch (error) {
    console.error('Error fetching lesson repetition info:', error);
    return null;
  }
};

// Изменить видимость урока
export const toggleLessonVisibility = async (lessonId: string, isHidden: boolean, profileId?: string): Promise<boolean> => {
  try {
    const baseUrl = getBaseUrl();
    const activeProfileId = profileId || getActiveProfileId();
    
    if (!activeProfileId) {
      return false;
    }
    
    // Используем API-эндпоинт для аналитики
    const response = await fetch(`${baseUrl}/api/analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        action: 'toggle-visibility',
        lessonId, 
        isHidden, 
        profileId: activeProfileId 
      }),
    });
    
    if (!response.ok) {
      console.error('Error response from toggle visibility API:', await response.text());
      return false;
    }
    
    const data = await response.json();
    return data.success || true;
  } catch (error) {
    console.error('Error toggling lesson visibility:', error);
    return false;
  }
};

// Получить список уроков, которые нужно повторить
export const getLessonsDueForReview = async (profileId?: string): Promise<SpacedRepetitionInfo[]> => {
  try {
    const baseUrl = getBaseUrl();
    const activeProfileId = profileId || getActiveProfileId();
    
    if (!activeProfileId) {
      return [];
    }
    
    const response = await fetch(`${baseUrl}/api/analytics?action=due-for-review&profileId=${encodeURIComponent(activeProfileId)}`);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.lessons || [];
  } catch (error) {
    console.error('Error fetching lessons due for review:', error);
    return [];
  }
};

/**
 * Завершить повторение урока
 * Обновляет статус урока и рассчитывает новую дату повторения
 * 
 * @param lessonId - ID урока
 * @param errorCount - Количество ошибок при повторении
 * @param profileId - ID профиля пользователя (опционально)
 * @returns Результат операции
 */
export const completeReviewLesson = async (lessonId: string, errorCount: number = 0, profileId?: string): Promise<{ success: boolean; message: string; nextReviewDate?: number }> => {
  try {
    const baseUrl = getBaseUrl();
    const activeProfileId = profileId || getActiveProfileId();
    
    if (!activeProfileId) {
      return { success: false, message: 'Не найден активный профиль' };
    }
    
    console.log(`Отправляем запрос на завершение повторения: lessonId=${lessonId}, errorCount=${errorCount}, profileId=${activeProfileId}`);
    
    const response = await fetch(`${baseUrl}/api/spaced-repetition/complete-review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ lessonId, errorCount, profileId: activeProfileId })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Ошибка при завершении повторения:', data);
      return { success: false, message: data.error || 'Ошибка при завершении повторения урока' };
    }
    
    console.log('Успешно завершено повторение урока:', data);
    
    return { 
      success: true, 
      message: data.message || 'Урок успешно повторен', 
      nextReviewDate: data.nextReviewDate 
    };
  } catch (error) {
    console.error('Error completing lesson review:', error);
    return { success: false, message: 'Ошибка при завершении повторения урока' };
  }
};

/**
 * Получить приоритетные предложения для урока
 * 
 * @param lessonId - ID урока
 * @param profileId - ID профиля пользователя (опционально)
 * @returns Массив приоритетных предложений
 */
export const getPrioritySentences = async (lessonId: string, profileId?: string): Promise<any[]> => {
  try {
    const baseUrl = getBaseUrl();
    const activeProfileId = profileId || getActiveProfileId();
    
    if (!activeProfileId) {
      return [];
    }
    
    const response = await fetch(
      `${baseUrl}/api/spaced-repetition/priority-sentences?action=get&lessonId=${encodeURIComponent(lessonId)}&profileId=${encodeURIComponent(activeProfileId)}`
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.sentences || [];
  } catch (error) {
    console.error('Error fetching priority sentences:', error);
    return [];
  }
};

/**
 * Сохранить приоритетные предложения для урока
 * 
 * @param lessonId - ID урока
 * @param profileId - ID профиля пользователя (опционально)
 * @returns Массив сохраненных приоритетных предложений
 */
export const savePrioritySentences = async (lessonId: string, profileId?: string): Promise<any[]> => {
  try {
    const baseUrl = getBaseUrl();
    const activeProfileId = profileId || getActiveProfileId();
    
    if (!activeProfileId) {
      return [];
    }
    
    const response = await fetch(
      `${baseUrl}/api/spaced-repetition/priority-sentences?action=save&lessonId=${encodeURIComponent(lessonId)}&profileId=${encodeURIComponent(activeProfileId)}`
    );
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.sentences || [];
  } catch (error) {
    console.error('Error saving priority sentences:', error);
    return [];
  }
};

/**
 * Получить предложения, которые нужно повторить сегодня
 * 
 * @param profileId - ID профиля пользователя (опционально)
 * @param lessonId - ID урока (опционально)
 * @returns Массив предложений для повторения
 */
export const getSentencesDueForReview = async (profileId?: string, lessonId?: string): Promise<any[]> => {
  try {
    const baseUrl = getBaseUrl();
    const activeProfileId = profileId || getActiveProfileId() || localStorage.getItem('activeProfileId');
    
    if (!activeProfileId) {
      console.error('Не найден активный профиль для получения предложений');
      return [];
    }
    
    console.log(`Получаем предложения для повторения: profileId=${activeProfileId}, lessonId=${lessonId || 'не указан'}`);
    
    // Добавляем параметры action и lessonId
    const url = lessonId
      ? `${baseUrl}/api/spaced-repetition/priority-sentences?action=due-for-review&profileId=${encodeURIComponent(activeProfileId)}&lessonId=${encodeURIComponent(lessonId)}`
      : `${baseUrl}/api/spaced-repetition/priority-sentences?action=due-for-review&profileId=${encodeURIComponent(activeProfileId)}`;
    
    console.log(`Отправляем запрос: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Ошибка при получении предложений (${response.status}):`, errorData);
      return [];
    }
    
    const data = await response.json();
    console.log(`Получено ${data.sentences ? data.sentences.length : 0} предложений для повторения`);
    return data.sentences || [];
  } catch (error) {
    console.error('Error fetching sentences due for review:', error);
    return [];
  }
};

// Получить список скрытых уроков
export const getHiddenLessons = async (profileId?: string): Promise<SpacedRepetitionInfo[]> => {
  try {
    const baseUrl = getBaseUrl();
    const activeProfileId = profileId || getActiveProfileId();
    
    if (!activeProfileId) {
      return [];
    }
    
    const response = await fetch(`${baseUrl}/api/analytics?action=hidden-lessons&profileId=${encodeURIComponent(activeProfileId)}`);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.lessons || [];
  } catch (error) {
    console.error('Error fetching hidden lessons:', error);
    return [];
  }
};

// Получить все уроки с информацией о повторении
export const getAllLessonsWithRepetitionInfo = async (profileId?: string): Promise<SpacedRepetitionInfo[]> => {
  try {
    const baseUrl = getBaseUrl();
    const activeProfileId = profileId || getActiveProfileId();
    
    if (!activeProfileId) {
      return [];
    }
    
    const response = await fetch(`${baseUrl}/api/analytics?action=all-lessons-repetition&profileId=${encodeURIComponent(activeProfileId)}`);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    return data.lessons || [];
  } catch (error) {
    console.error('Error fetching all lessons with repetition info:', error);
    return [];
  }
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

// Функция для получения содержимого урока для редактирования
export const fetchLessonForEditing = async (lessonId: string): Promise<{ success: boolean, lessonContent: string }> => {
  const baseUrl = getBaseUrl();
  const profileId = getActiveProfileId();
  
  if (!profileId) {
    throw new Error('No active profile');
  }
  
  // Обработка ID урока для API запроса
  // Если ID урока содержит только число, добавляем префикс 'lesson'
  const apiLessonId = lessonId.startsWith('lesson') ? lessonId : `lesson${lessonId}`;
  
  try {
    const response = await fetch(`${baseUrl}/api/admin/lessons/${apiLessonId}?profileId=${encodeURIComponent(profileId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Не удалось загрузить урок ${lessonId} для редактирования`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Ошибка при загрузке урока ${lessonId}:`, error);
    throw error;
  }
};

// Функция для обновления содержимого урока
export const updateLesson = async (lessonId: string, lessonContent: string): Promise<{ success: boolean, message: string }> => {
  const baseUrl = getBaseUrl();
  const profileId = getActiveProfileId();
  
  if (!profileId) {
    throw new Error('No active profile');
  }
  
  // Обработка ID урока для API запроса
  // Если ID урока содержит только число, добавляем префикс 'lesson'
  const apiLessonId = lessonId.startsWith('lesson') ? lessonId : `lesson${lessonId}`;
  
  try {
    const response = await fetch(`${baseUrl}/api/admin/lessons/${apiLessonId}?profileId=${encodeURIComponent(profileId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lessonContent }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Не удалось обновить урок ${lessonId}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Ошибка при обновлении урока ${lessonId}:`, error);
    throw error;
  }
};
