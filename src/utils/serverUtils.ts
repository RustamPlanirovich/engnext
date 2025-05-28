import fs from 'fs';
import path from 'path';
import { Analytics, AnalyticsItem, Example, Lesson, LessonStatus, SpacedRepetitionInfo } from '@/types/lesson';
import { getActiveProfile } from './profileUtils';

// Server-side utility functions that use Node.js modules
const DATA_DIR = path.join(process.cwd(), 'data');
const LESSONS_DIR = path.join(DATA_DIR, 'lessons');
const ANALYTICS_DIR = path.join(DATA_DIR, 'analytics');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

// Интервалы повторения по кривой забывания в днях
// Интервалы повторения по кривой забывания Эббингауза (в днях)
const REPETITION_INTERVALS = [
  1,    // Повторение 2: через 1 день после изучения
  3,    // Повторение 3: через 3 дня после изучения
  7,    // Повторение 4: через 7 дней (неделя)
  14,   // Повторение 5: через 14 дней (2 недели)
  30,   // Повторение 6: через 30 дней (месяц)
  60,   // Повторение 7: через 60 дней (2 месяца)
  120   // Повторение 8: через 120 дней (4 месяца)
];

// Ensure data directories exist
export const ensureDirectories = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(LESSONS_DIR)) {
    fs.mkdirSync(LESSONS_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(ANALYTICS_DIR)) {
    fs.mkdirSync(ANALYTICS_DIR, { recursive: true });
  }
};

// Get all available lessons
export const getLessons = (): string[] => {
  ensureDirectories();
  try {
    return fs.readdirSync(LESSONS_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  } catch (error) {
    console.error('Error reading lessons directory:', error);
    return [];
  }
};

// Get a specific lesson by ID
export const getLesson = (lessonId: string): Lesson | null => {
  try {
    // Все уроки находятся только в директории data/lessons
    const lessonPath = path.join(LESSONS_DIR, `${lessonId}.json`);
    console.log(`Ищем урок ${lessonId} по пути: ${lessonPath}`);
    
    if (!fs.existsSync(lessonPath)) {
      console.log(`Урок ${lessonId} не найден по пути: ${lessonPath}`);
      return null;
    }
    
    const lessonData = fs.readFileSync(lessonPath, 'utf8');
    console.log(`Урок ${lessonId} успешно загружен`);
    return JSON.parse(lessonData);
  } catch (error) {
    console.error(`Error reading lesson ${lessonId}:`, error);
    return null;
  }
};

// Extract all examples from a lesson for exercises
export const extractExamples = (lesson: Lesson): Example[] => {
  console.log(`extractExamples: Извлекаем примеры из урока`, lesson);
  const examples: Example[] = [];
  
  if (!lesson.subconcepts) {
    console.error(`Урок не содержит subconcepts:`, lesson);
    return [];
  }
  
  const processSubconcept = (subconcept: any) => {
    if (subconcept.examples) {
      console.log(`Найдено ${subconcept.examples.length} примеров в подконцепте`);
      examples.push(...subconcept.examples);
    }
    
    if (subconcept.subconcepts) {
      console.log(`Обрабатываем ${subconcept.subconcepts.length} вложенных подконцептов`);
      subconcept.subconcepts.forEach(processSubconcept);
    }
  };
  
  console.log(`Обрабатываем ${lesson.subconcepts.length} основных подконцептов`);
  lesson.subconcepts.forEach(processSubconcept);
  
  console.log(`Всего извлечено ${examples.length} примеров из урока`);
  return examples;
};

// Get analytics data
export const getAnalytics = (profileId?: string): Analytics => {
  // If profileId is not provided, try to get the active profile
  if (!profileId) {
    const activeProfile = getActiveProfile();
    profileId = activeProfile?.id;
  }
  
  // Если ID профиля не найден, возвращаем пустую аналитику без создания файла
  if (!profileId) {
    return {
      errors: [],
      completedLessons: [],
      loadedLessons: [],
      totalExercisesCompleted: 0,
      lastPracticeDate: 0
    };
  }
  
  // Используем ID профиля для пути к файлу аналитики
  const analyticsPath = path.join(ANALYTICS_DIR, `${profileId}.json`);
  
  if (!fs.existsSync(analyticsPath)) {
    const defaultAnalytics: Analytics = {
      errors: [],
      completedLessons: [],
      loadedLessons: [],
      totalExercisesCompleted: 0,
      lastPracticeDate: 0,
      lessonProgress: [],
      completedSentences: {},
      lessonCompletionCounts: {},
      spacedRepetition: [],
      prioritySentences: {}
    };
    
    // Ensure the directory exists
    const dir = path.dirname(analyticsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(analyticsPath, JSON.stringify(defaultAnalytics, null, 2));
    return defaultAnalytics;
  }
  
  const analyticsData = fs.readFileSync(analyticsPath, 'utf8');
  return JSON.parse(analyticsData);
};

// Save analytics data
export const saveAnalytics = (analytics: Analytics, profileId?: string): void => {
  try {
    // If profileId is not provided, try to get the active profile
    if (!profileId) {
      const activeProfile = getActiveProfile();
      profileId = activeProfile?.id;
    }
    
    // Если ID профиля не найден, не сохраняем аналитику
    if (!profileId) {
      console.warn('Попытка сохранить аналитику без ID профиля');
      return;
    }
    
    // Используем ID профиля для пути к файлу аналитики
    const analyticsPath = path.join(ANALYTICS_DIR, `${profileId}.json`);
    
    // Ensure the directory exists
    const dir = path.dirname(analyticsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2));
  } catch (error) {
    console.error('Error saving analytics:', error);
  }
};

// Generate a unique ID for an error entry
function generateErrorId(lessonId: string, sentence: { russian: string, english: string }, timestamp: number): string {
  return `${lessonId}_${sentence.russian}_${sentence.english}_${timestamp}`;
}

// Add an error to analytics
export const addError = (lessonId: string, sentence: { russian: string, english: string }, profileId?: string): void => {
  try {
    const analytics = getAnalytics(profileId);
    const timestamp = Date.now();
    
    // Add new error entry with unique ID
    const errorId = generateErrorId(lessonId, sentence, timestamp);
    
    analytics.errors.push({
      id: errorId,
      lessonId,
      sentence,
      errors: 1,
      timestamp
    });
    
    saveAnalytics(analytics, profileId);
  } catch (error) {
    console.error('Error adding error to analytics:', error);
  }
};

// Remove error from analytics when user correctly answers in practice mode
export const removeError = (lessonId: string, sentence: { russian: string, english: string }, errorId?: string, profileId?: string): void => {
  try {
    console.log(`Attempting to remove error: ${errorId || 'no ID'} for sentence "${sentence.english}"`);
    
    const analytics = getAnalytics(profileId);
    console.log(`Current errors count: ${analytics.errors.length}`);
    
    // Log all errors for debugging before removal
    console.log('Current errors before removal:');
    analytics.errors.forEach((error, index) => {
      console.log(`${index}: ${error.id || 'no ID'} - "${error.sentence.english}" (${error.lessonId})`);
    });
    
    // Normalize the input sentence for comparison
    const normalizedRussian = sentence.russian.trim().toLowerCase();
    const normalizedEnglish = sentence.english.trim().toLowerCase();
    
    let removed = false;
    
    if (errorId) {
      // If errorId is provided, find and remove by ID
      const index = analytics.errors.findIndex(error => error.id === errorId);
      if (index !== -1) {
        analytics.errors.splice(index, 1);
        console.log(`Removed error with ID ${errorId}`);
        removed = true;
      } else {
        console.log(`Error with ID ${errorId} not found, trying to find by content`);
      }
    }
    
    // If no errorId or errorId not found, try to find by sentence content
    if (!removed) {
      const filteredErrors = analytics.errors.filter(error => {
        const errorRussian = error.sentence.russian.trim().toLowerCase();
        const errorEnglish = error.sentence.english.trim().toLowerCase();
        
        const matchesRussian = errorRussian === normalizedRussian;
        const matchesEnglish = errorEnglish === normalizedEnglish;
        const matchesLesson = error.lessonId === lessonId || lessonId === 'practice';
        
        // Keep errors that don't match this sentence
        return !(matchesRussian && matchesEnglish && matchesLesson);
      });
      
      if (filteredErrors.length < analytics.errors.length) {
        console.log(`Removed ${analytics.errors.length - filteredErrors.length} errors matching "${sentence.english}"`);
        analytics.errors = filteredErrors;
        removed = true;
      } else {
        console.log(`No errors found matching "${sentence.english}"`);
      }
    }
    
    if (removed) {
      saveAnalytics(analytics, profileId);
      console.log(`Errors after removal: ${analytics.errors.length}`);
    }
  } catch (error) {
    console.error('Error removing error from analytics:', error);
  }
};

/**
 * Отметить урок как завершенный
 * 
 * @param lessonId - ID урока
 * @param profileId - ID профиля пользователя
 * @returns Объект с датой следующего повторения
 */
export const markLessonCompleted = async (lessonId: string, profileId?: string): Promise<{ nextReviewDate: number }> => {
  try {
    const analytics = getAnalytics(profileId);
    
    // Добавляем урок в список завершенных, если его там еще нет
    if (!analytics.completedLessons.includes(lessonId)) {
      analytics.completedLessons.push(lessonId);
    }
    
    // Initialize lessonCompletionCounts if it doesn't exist
    if (!analytics.lessonCompletionCounts) {
      analytics.lessonCompletionCounts = {};
    }
    
    // Initialize the array for this lesson if it doesn't exist
    if (!analytics.lessonCompletionCounts[lessonId]) {
      analytics.lessonCompletionCounts[lessonId] = [];
    }
    
    // Add the current timestamp to the completion counts
    const now = Date.now();
    analytics.lessonCompletionCounts[lessonId].push(now);
    
    // Update the last practice date
    analytics.lastPracticeDate = now;
    
    // Подсчитываем количество ошибок для этого урока
    const errorCount = analytics.errors.filter(error => error.lessonId === lessonId).length;
    
    // Инициализируем массив spacedRepetition, если он не существует
    if (!analytics.spacedRepetition) {
      analytics.spacedRepetition = [];
    }
    
    // Поиск существующей информации о повторении
    let repetitionInfo = analytics.spacedRepetition.find(info => info.lessonId === lessonId);
    
    if (!repetitionInfo) {
      // Создаем новую запись, если она не существует
      console.log(`Создаем новую запись о повторении для урока ${lessonId}`);
      
      // Рассчитываем дату следующего повторения (через 1 день)
      const nextReviewDate = now + REPETITION_INTERVALS[0] * 24 * 60 * 60 * 1000;
      
      repetitionInfo = {
        lessonId,
        status: LessonStatus.Completed,
        completionDates: [now],
        repetitionLevel: 0,
        nextReviewDate: nextReviewDate,
        isHidden: false,
        lastErrorCount: errorCount
      };
      
      analytics.spacedRepetition.push(repetitionInfo);
      console.log(`Создана новая запись для урока ${lessonId}: следующее повторение через ${REPETITION_INTERVALS[0]} дней (на ${new Date(nextReviewDate).toLocaleDateString()})`);
    } else {
      // Обновляем существующую запись
      console.log(`Обновляем существующую запись о повторении для урока ${lessonId}`);
      
      // Обновляем статус и счетчик ошибок
      repetitionInfo.status = LessonStatus.Completed;
      repetitionInfo.lastErrorCount = errorCount;
      repetitionInfo.isHidden = false;
      
      // Добавляем дату завершения
      if (!repetitionInfo.completionDates) {
        repetitionInfo.completionDates = [];
      }
      repetitionInfo.completionDates.push(now);
      
      // Рассчитываем дату следующего повторения
      const intervalDays = REPETITION_INTERVALS[repetitionInfo.repetitionLevel];
      repetitionInfo.nextReviewDate = now + intervalDays * 24 * 60 * 60 * 1000;
      
      console.log(`Урок ${lessonId} обновлен: уровень повторения ${repetitionInfo.repetitionLevel}, следующее повторение через ${intervalDays} дней (на ${new Date(repetitionInfo.nextReviewDate).toLocaleDateString()})`);
    }
    
    saveAnalytics(analytics, profileId);
    
    console.log(`Marked lesson ${lessonId} as completed. Next review date: ${new Date(repetitionInfo.nextReviewDate).toLocaleDateString()}`);
    
    return { nextReviewDate: repetitionInfo.nextReviewDate };
  } catch (error) {
    console.error('Error marking lesson as completed:', error);
    return { nextReviewDate: 0 };
  }
};

/**
 * Отметить урок как повторенный
 * 
 * @param lessonId - ID урока
 * @param errorCount - Количество ошибок при повторении
 * @param profileId - ID профиля пользователя
 * @returns Объект с датой следующего повторения и флагом завершения всех циклов
 */
export const markLessonRepeated = async (lessonId: string, errorCount: number = 0, profileId?: string): Promise<{ nextReviewDate: number, isComplete: boolean }> => {
  try {
    const analytics = getAnalytics(profileId);
    
    // Добавляем урок в список завершенных, если его там еще нет
    if (!analytics.completedLessons.includes(lessonId)) {
      analytics.completedLessons.push(lessonId);
    }
    
    // Initialize lessonCompletionCounts if it doesn't exist
    if (!analytics.lessonCompletionCounts) {
      analytics.lessonCompletionCounts = {};
    }
    
    // Initialize the array for this lesson if it doesn't exist
    if (!analytics.lessonCompletionCounts[lessonId]) {
      analytics.lessonCompletionCounts[lessonId] = [];
    }
    
    // Add the current timestamp to the completion counts
    const now = Date.now();
    analytics.lessonCompletionCounts[lessonId].push(now);
    
    // Update the last practice date
    analytics.lastPracticeDate = now;
    
    // Инициализируем массив spacedRepetition, если он не существует
    if (!analytics.spacedRepetition) {
      analytics.spacedRepetition = [];
    }
    
    // Получаем текущую информацию о повторении
    let repetitionInfo = analytics.spacedRepetition.find(info => info.lessonId === lessonId);
    
    if (!repetitionInfo) {
      // Если информации нет, создаем новую запись
      console.log(`Создаем новую запись о повторении для урока ${lessonId}`);
      repetitionInfo = {
        lessonId,
        status: LessonStatus.Completed,
        completionDates: [now],
        repetitionLevel: 0,
        nextReviewDate: now + REPETITION_INTERVALS[0] * 24 * 60 * 60 * 1000,
        isHidden: false,
        lastErrorCount: errorCount
      };
      
      analytics.spacedRepetition.push(repetitionInfo);
    } else {
      // Обновляем существующую запись
      console.log(`Обновляем существующую запись о повторении для урока ${lessonId}`);
      repetitionInfo.status = LessonStatus.Completed;
      repetitionInfo.lastErrorCount = errorCount;
      
      // Добавляем дату завершения
      if (!repetitionInfo.completionDates) {
        repetitionInfo.completionDates = [];
      }
      repetitionInfo.completionDates.push(now);
      
      // Увеличиваем уровень повторения
      if (repetitionInfo.repetitionLevel < REPETITION_INTERVALS.length - 1) {
        repetitionInfo.repetitionLevel++;
      }
      
      // Корректировка на основе ошибок
      if (errorCount > 5) {
        // Много ошибок - возвращаемся на предыдущий уровень
        if (repetitionInfo.repetitionLevel > 0) {
          repetitionInfo.repetitionLevel--;
        }
      }
      
      // Рассчитываем дату следующего повторения
      const intervalDays = REPETITION_INTERVALS[repetitionInfo.repetitionLevel];
      repetitionInfo.nextReviewDate = now + intervalDays * 24 * 60 * 60 * 1000;
      
      console.log(`Урок ${lessonId} обновлен: уровень повторения ${repetitionInfo.repetitionLevel}, следующее повторение через ${intervalDays} дней`);
    }
    
    // Проверяем, достиг ли урок максимального уровня повторения
    const isComplete = repetitionInfo.repetitionLevel >= REPETITION_INTERVALS.length - 1;
    
    // Если урок достиг максимального уровня повторения, помечаем его как полностью завершенный
    if (isComplete) {
      // Устанавливаем специальный статус для завершенных уроков
      repetitionInfo.status = LessonStatus.CompletedAllCycles;
      console.log(`Урок ${lessonId} завершил все циклы повторения!`);
    }
    
    // Обновляем информацию в аналитике
    const index = analytics.spacedRepetition.findIndex(info => info.lessonId === lessonId);
    if (index !== -1) {
      analytics.spacedRepetition[index] = repetitionInfo;
    } else {
      analytics.spacedRepetition.push(repetitionInfo);
    }
    
    saveAnalytics(analytics, profileId);
    
    console.log(`Marked lesson ${lessonId} as repeated. Next review date: ${new Date(repetitionInfo.nextReviewDate).toLocaleDateString()}`);
    
    return { 
      nextReviewDate: repetitionInfo.nextReviewDate,
      isComplete 
    };
  } catch (error) {
    console.error('Error marking lesson as repeated:', error);
    return { nextReviewDate: 0, isComplete: false };
  }
};

// Сохранить прогресс урока
export interface LessonProgress {
  lessonId: string;
  lastExerciseEnglish: string;
  timestamp: number;
  completedSentences?: string[];
}

export const saveLessonProgress = (lessonId: string, lastExerciseEnglish: string, profileId?: string, sentenceId?: string): void => {
  try {
    const analytics = getAnalytics(profileId);
    
    // Initialize lessonProgress if it doesn't exist
    if (!analytics.lessonProgress) {
      analytics.lessonProgress = [];
    }
    
    // Initialize completedSentences if it doesn't exist
    if (!analytics.completedSentences) {
      analytics.completedSentences = {};
    }
    
    // Initialize completedSentences for this lesson if it doesn't exist
    if (!analytics.completedSentences[lessonId]) {
      analytics.completedSentences[lessonId] = [];
    }
    
    // Add sentenceId to completedSentences if provided and not already there
    if (sentenceId && !analytics.completedSentences[lessonId].includes(sentenceId)) {
      analytics.completedSentences[lessonId].push(sentenceId);
    }
    
    // Find existing progress for this lesson
    const existingProgressIndex = analytics.lessonProgress.findIndex(
      progress => progress.lessonId === lessonId
    );
    
    const now = Date.now();
    
    if (existingProgressIndex !== -1) {
      // Update existing progress
      analytics.lessonProgress[existingProgressIndex].lastExerciseEnglish = lastExerciseEnglish;
      analytics.lessonProgress[existingProgressIndex].timestamp = now;
      
      // Update completedSentences if it exists
      if (analytics.lessonProgress[existingProgressIndex].completedSentences && sentenceId) {
        if (!analytics.lessonProgress[existingProgressIndex].completedSentences?.includes(sentenceId)) {
          analytics.lessonProgress[existingProgressIndex].completedSentences?.push(sentenceId);
        }
      } else if (sentenceId) {
        // Initialize completedSentences if it doesn't exist
        analytics.lessonProgress[existingProgressIndex].completedSentences = [sentenceId];
      }
    } else {
      // Create new progress entry
      const newProgress: LessonProgress = {
        lessonId,
        lastExerciseEnglish,
        timestamp: now
      };
      
      // Add completedSentences if sentenceId is provided
      if (sentenceId) {
        newProgress.completedSentences = [sentenceId];
      }
      
      analytics.lessonProgress.push(newProgress);
    }
    
    // Обновляем статус урока в системе интервального повторения
    // Если урок еще не завершен, устанавливаем статус "В процессе"
    const repetitionInfo = getLessonSpacedRepetitionInfo(lessonId, profileId);
    if (!repetitionInfo || repetitionInfo.status === LessonStatus.NotStarted) {
      updateLessonSpacedRepetitionInfo(lessonId, LessonStatus.InProgress, false, 0, profileId);
    }
    
    saveAnalytics(analytics, profileId);
  } catch (error) {
    console.error('Error saving lesson progress:', error);
  }
};

// Получить прогресс урока
export const getLessonProgress = (lessonId: string, profileId?: string): { lastExerciseEnglish: string | null, completedSentences: string[] } => {
  try {
    const analytics = getAnalytics(profileId);
    
    if (!analytics.lessonProgress) {
      return { lastExerciseEnglish: null, completedSentences: [] };
    }
    
    const progress = analytics.lessonProgress.find(p => p.lessonId === lessonId);
    
    if (!progress) {
      return { lastExerciseEnglish: null, completedSentences: [] };
    }
    
    // Get completedSentences from either the progress object or the analytics.completedSentences
    const completedSentences = progress.completedSentences || 
                              (analytics.completedSentences && analytics.completedSentences[lessonId]) || 
                              [];
    
    return {
      lastExerciseEnglish: progress.lastExerciseEnglish,
      completedSentences: completedSentences
    };
  } catch (error) {
    console.error('Error getting lesson progress:', error);
    return { lastExerciseEnglish: null, completedSentences: [] };
  }
};

// Get most problematic sentences for practice
export const getMostProblematicSentences = (limit: number = 10, profileId?: string): AnalyticsItem[] => {
  try {
    const analytics = getAnalytics(profileId);
    
    if (!analytics.errors || analytics.errors.length === 0) {
      return [];
    }
    
    // Group errors by sentence
    const errorGroups: { [key: string]: AnalyticsItem } = {};
    
    analytics.errors.forEach(error => {
      const key = `${error.lessonId}_${error.sentence.russian}_${error.sentence.english}`;
      
      if (!errorGroups[key]) {
        errorGroups[key] = { ...error, errors: 0 };
      }
      
      errorGroups[key].errors += 1;
    });
    
    // Convert to array and sort by error count (descending)
    return Object.values(errorGroups)
      .sort((a, b) => b.errors - a.errors)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting problematic sentences:', error);
    return [];
  }
};

// Save a new lesson file
export const saveLesson = async (fileName: string, lessonData: string, level?: string): Promise<{ success: boolean, message: string }> => {
  ensureDirectories();
  
  try {
    // Validate JSON
    let lessonObject = JSON.parse(lessonData);
    
    // Добавляем уровень CEFR, если он указан
    if (level) {
      lessonObject.level = level;
      lessonData = JSON.stringify(lessonObject, null, 2);
    }
    
    const lessonFileName = fileName.endsWith('.json') ? fileName : `${fileName}.json`;
    const lessonPath = path.join(LESSONS_DIR, lessonFileName);
    
    // Check if file already exists
    if (fs.existsSync(lessonPath)) {
      return { 
        success: false, 
        message: 'Файл с таким именем уже существует. Пожалуйста, выберите другое имя.' 
      };
    }
    
    fs.writeFileSync(lessonPath, lessonData);
    
    // Update loaded lessons in analytics
    const analytics = getAnalytics();
    const lessonId = lessonFileName.replace('.json', '');
    
    if (!analytics.loadedLessons.includes(lessonId)) {
      analytics.loadedLessons.push(lessonId);
      saveAnalytics(analytics);
    }
    
    return { success: true, message: `Урок успешно сохранен с уровнем ${level || 'A0 (по умолчанию)'}` };
  } catch (error) {
    console.error('Error saving lesson file:', error);
    return { 
      success: false, 
      message: 'Ошибка при сохранении файла. Проверьте формат JSON.' 
    };
  }
};

// Delete a lesson file
export const deleteLesson = (lessonId: string): { success: boolean, message: string } => {
  ensureDirectories();
  
  try {
    const lessonPath = path.join(LESSONS_DIR, `${lessonId}.json`);
    
    // Check if file exists
    if (!fs.existsSync(lessonPath)) {
      // Try to find the lesson in the root directory
      const rootLessonPath = path.join(process.cwd(), `${lessonId}.json`);
      if (fs.existsSync(rootLessonPath)) {
        // Don't delete lesson1.json from the root directory
        if (lessonId === 'lesson1') {
          return { 
            success: false, 
            message: 'Нельзя удалить основной урок (lesson1.json).' 
          };
        }
        
        fs.unlinkSync(rootLessonPath);
        
        // Update analytics
        const analytics = getAnalytics();
        analytics.loadedLessons = analytics.loadedLessons.filter(id => id !== lessonId);
        saveAnalytics(analytics);
        
        return { success: true, message: 'Урок успешно удален.' };
      }
      
      return { 
        success: false, 
        message: 'Файл урока не найден.' 
      };
    }
    
    // Don't delete lesson1.json
    if (lessonId === 'lesson1') {
      return { 
        success: false, 
        message: 'Нельзя удалить основной урок (lesson1.json).' 
      };
    }
    
    fs.unlinkSync(lessonPath);
    
    // Update analytics
    const analytics = getAnalytics();
    analytics.loadedLessons = analytics.loadedLessons.filter(id => id !== lessonId);
    saveAnalytics(analytics);
    
    return { success: true, message: 'Урок успешно удален.' };
  } catch (error) {
    console.error('Error deleting lesson file:', error);
    return { 
      success: false, 
      message: 'Ошибка при удалении файла урока.' 
    };
  }
};

// Create backup of analytics
export const createAnalyticsBackup = (profileId?: string): { success: boolean, message: string } => {
  try {
    // If profileId is not provided, try to get the active profile
    if (!profileId) {
      const activeProfile = getActiveProfile();
      profileId = activeProfile?.id;
    }
    
    // Если ID профиля не найден, не создаем бэкап
    if (!profileId) {
      return { 
        success: false, 
        message: 'Нет активного профиля для создания бэкапа.' 
      };
    }
    
    const analyticsPath = path.join(ANALYTICS_DIR, `${profileId}.json`);
    
    // Check if analytics file exists
    if (!fs.existsSync(analyticsPath)) {
      return { 
        success: false, 
        message: 'Файл аналитики не найден.' 
      };
    }
    
    // Create backup directory if it doesn't exist
    const backupDir = path.join(DATA_DIR, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Create timestamp for backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `analytics_${profileId}_${timestamp}.json`);
    
    // Copy analytics file to backup
    fs.copyFileSync(analyticsPath, backupPath);
    
    return { 
      success: true, 
      message: `Резервная копия аналитики создана: ${path.basename(backupPath)}` 
    };
  } catch (error) {
    console.error('Error creating analytics backup:', error);
    return { 
      success: false, 
      message: `Ошибка при создании резервной копии: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

// Copy lesson1.json to the lessons directory if it doesn't exist there
export const copyLesson1ToLessonsDir = (): void => {
  try {
    const rootLessonPath = path.join(process.cwd(), 'lesson1.json');
    const lessonsLessonPath = path.join(LESSONS_DIR, 'lesson1.json');
    
    // Check if lesson1.json exists in the root directory
    if (fs.existsSync(rootLessonPath)) {
      // Check if it doesn't exist in the lessons directory
      if (!fs.existsSync(lessonsLessonPath)) {
        // Ensure the lessons directory exists
        if (!fs.existsSync(LESSONS_DIR)) {
          fs.mkdirSync(LESSONS_DIR, { recursive: true });
        }
        
        // Copy the file
        fs.copyFileSync(rootLessonPath, lessonsLessonPath);
        console.log('Copied lesson1.json to lessons directory');
      }
    }
  } catch (error) {
    console.error('Error copying lesson1.json to lessons directory:', error);
  }
};


/**
 * Получить информацию о повторении урока
 * 
 * @param lessonId - ID урока
 * @param profileId - ID профиля пользователя
 * @returns Информация о повторении урока или null, если информация не найдена
 */
export const getLessonSpacedRepetitionInfo = (lessonId: string, profileId?: string): SpacedRepetitionInfo | null => {
  const analytics = getAnalytics(profileId);
  
  // Проверяем, что массив spacedRepetition существует
  if (!analytics.spacedRepetition) {
    analytics.spacedRepetition = [];
    saveAnalytics(analytics, profileId);
    return null;
  }
  
  // Поиск информации о повторении для данного урока
  const repetitionInfo = analytics.spacedRepetition.find(info => info.lessonId === lessonId);
  
  return repetitionInfo || null;
};

/**
 * Обновить статусы всех уроков в системе интервального повторения
 * Проверяет уровни повторения и устанавливает статус CompletedAllCycles для уроков, завершивших все циклы
 * 
 * @param profileId - ID профиля пользователя
 * @returns Массив ID уроков, статусы которых были обновлены
 */
export const updateLessonStatuses = (profileId?: string): string[] => {
  const analytics = getAnalytics(profileId);
  
  if (!analytics.spacedRepetition) {
    return [];
  }
  
  const now = Date.now();
  const updatedLessons: string[] = [];
  
  // Проверяем все уроки в системе интервального повторения
  for (let i = 0; i < analytics.spacedRepetition.length; i++) {
    const repetitionInfo = analytics.spacedRepetition[i];
    
    // Проверяем, достиг ли урок максимального уровня повторения
    const isComplete = repetitionInfo.repetitionLevel >= REPETITION_INTERVALS.length - 1;
    
    // Если урок достиг максимального уровня и его статус не CompletedAllCycles
    if (isComplete && repetitionInfo.status !== LessonStatus.CompletedAllCycles) {
      // Устанавливаем специальный статус для завершенных уроков
      repetitionInfo.status = LessonStatus.CompletedAllCycles;
      updatedLessons.push(repetitionInfo.lessonId);
      console.log(`Урок ${repetitionInfo.lessonId} обновлен: статус изменен на CompletedAllCycles`);
    }
    
    // Проверяем, наступило ли время для повторения
    if (!repetitionInfo.isHidden && repetitionInfo.status === LessonStatus.Completed && repetitionInfo.nextReviewDate > 0 && repetitionInfo.nextReviewDate <= now) {
      repetitionInfo.status = LessonStatus.DueForReview;
      updatedLessons.push(repetitionInfo.lessonId);
      console.log(`Урок ${repetitionInfo.lessonId} обновлен: статус изменен на DueForReview`);
    }
  }
  
  // Сохраняем обновленную аналитику
  saveAnalytics(analytics, profileId);
  
  return updatedLessons;
};

/**
 * Обновить статусы уроков для повторения
 * Устанавливает статус DueForReview для уроков, у которых наступила дата повторения
 * 
 * @param profileId - ID профиля пользователя
 */
export const updateLessonStatusesForReview = (profileId?: string): void => {
  const analytics = getAnalytics(profileId);
  
  if (!analytics.spacedRepetition) {
    return;
  }
  
  const now = Date.now();
  let updated = false;
  
  // Обновляем статусы уроков
  analytics.spacedRepetition.forEach(info => {
    if (!info.isHidden && info.status === LessonStatus.Completed && info.nextReviewDate > 0 && info.nextReviewDate <= now) {
      info.status = LessonStatus.DueForReview;
      updated = true;
    }
  });
  
  if (updated) {
    saveAnalytics(analytics, profileId);
  }
};

/**
 * Создать или обновить информацию о повторении урока по кривой забывания Эббингауза
 * 
 * @param lessonId - ID урока
 * @param status - Статус урока
 * @param isHidden - Скрыт ли урок
 * @param errorCount - Количество ошибок при прохождении
 * @param profileId - ID профиля пользователя
 * @param isRepeating - Флаг, указывающий, что это повторение урока, а не первое прохождение
 * @returns Обновленная информация о повторении
 */
export const updateLessonSpacedRepetitionInfo = (lessonId: string, status: LessonStatus, isHidden: boolean = false, errorCount: number = 0, profileId?: string, isRepeating: boolean = false): SpacedRepetitionInfo => {
  const analytics = getAnalytics(profileId);
  
  // Инициализируем массив spacedRepetition, если он не существует
  if (!analytics.spacedRepetition) {
    analytics.spacedRepetition = [];
  }
  
  // Поиск существующей информации о повторении
  let repetitionInfo = analytics.spacedRepetition.find(info => info.lessonId === lessonId);
  const now = Date.now();
  
  if (!repetitionInfo) {
    // Создаем новую запись, если она не существует
    repetitionInfo = {
      lessonId,
      status,
      completionDates: status === LessonStatus.Completed ? [now] : [],
      repetitionLevel: 0,
      nextReviewDate: status === LessonStatus.Completed ? now + REPETITION_INTERVALS[0] * 24 * 60 * 60 * 1000 : 0,
      isHidden,
      lastErrorCount: errorCount
    };
    
    analytics.spacedRepetition.push(repetitionInfo);
    console.log(`Создана новая запись для урока ${lessonId}: следующее повторение через ${REPETITION_INTERVALS[0]} дней`);
  } else {
    // Обновляем существующую запись
    repetitionInfo.status = status;
    repetitionInfo.isHidden = isHidden;
    repetitionInfo.lastErrorCount = errorCount;
    
    // Добавляем дату завершения в массив completionDates
    if (!repetitionInfo.completionDates) {
      repetitionInfo.completionDates = [];
    }
    
    if (status === LessonStatus.Completed) {
      // Добавляем дату завершения
      repetitionInfo.completionDates.push(now);
      
      // Определяем текущий уровень повторения
      if (isRepeating) {
        // Если это повторение урока, увеличиваем уровень повторения
        if (repetitionInfo.repetitionLevel < REPETITION_INTERVALS.length - 1) {
          repetitionInfo.repetitionLevel++;
        }
        
        // Корректировка на основе ошибок при повторении
        if (errorCount > 5) {
          // Много ошибок - возвращаемся на предыдущий уровень
          if (repetitionInfo.repetitionLevel > 0) {
            repetitionInfo.repetitionLevel--;
          }
        } else if (errorCount > 2) {
          // Средний уровень ошибок - оставляем текущий уровень
          // Не изменяем repetitionLevel
        }
        // При малом количестве ошибок (<=2) - стандартное продвижение
      } else {
        // Если это первое прохождение или обычное завершение
        const completionsCount = repetitionInfo.completionDates.length;
        
        // Адаптируем уровень повторения на основе ошибок
        if (completionsCount <= REPETITION_INTERVALS.length) {
          // Стандартное продвижение по уровням повторения
          repetitionInfo.repetitionLevel = completionsCount - 1;
          
          // Корректировка на основе ошибок
          if (errorCount > 5) {
            // Много ошибок - повторяем текущий уровень (не увеличиваем интервал)
            if (repetitionInfo.repetitionLevel > 0) {
              repetitionInfo.repetitionLevel--;
            }
          } else if (errorCount > 2) {
            // Средний уровень ошибок - оставляем текущий уровень
            // Не изменяем repetitionLevel
          }
          // При малом количестве ошибок (<=2) - стандартное продвижение
        } else {
          // Если все повторения пройдены, остаемся на максимальном уровне
          repetitionInfo.repetitionLevel = REPETITION_INTERVALS.length - 1;
        }
      }
      
      // Рассчитываем дату следующего повторения
      const intervalDays = REPETITION_INTERVALS[repetitionInfo.repetitionLevel];
      repetitionInfo.nextReviewDate = now + intervalDays * 24 * 60 * 60 * 1000;
      
      console.log(`Урок ${lessonId} обновлен: уровень повторения ${repetitionInfo.repetitionLevel}, следующее повторение через ${intervalDays} дней`);
    }
  }
  
  // Сохраняем обновленную аналитику
  saveAnalytics(analytics, profileId);
  
  return repetitionInfo;
};

/**
 * Изменить видимость урока
 * 
 * @param lessonId - ID урока
 * @param isHidden - Скрыть или показать урок
 * @param profileId - ID профиля пользователя
 * @returns Обновленная информация о повторении или null в случае ошибки
 */
// Получить список уроков, которые нужно повторить
// 
// @param profileId - ID профиля пользователя
// @returns Массив информации об уроках, которые нужно повторить
export const getLessonsDueForReview = (profileId?: string): SpacedRepetitionInfo[] => {
  try {
    // Обновляем статусы уроков перед получением списка
    updateLessonStatusesForReview(profileId);
    
    const analytics = getAnalytics(profileId);
    
    if (!analytics.spacedRepetition) {
      return [];
    }
    
    // Фильтруем уроки со статусом DueForReview и не скрытые
    return analytics.spacedRepetition.filter(item => 
      item.status === LessonStatus.DueForReview && !item.isHidden
    );
  } catch (error) {
    console.error('Error getting lessons due for review:', error);
    return [];
  }
};

// Получить список скрытых уроков
// 
// @param profileId - ID профиля пользователя
// @returns Массив информации о скрытых уроках
export const getHiddenLessons = (profileId?: string): SpacedRepetitionInfo[] => {
  try {
    const analytics = getAnalytics(profileId);
    
    if (!analytics.spacedRepetition) {
      return [];
    }
    
    // Фильтруем скрытые уроки
    return analytics.spacedRepetition.filter(item => item.isHidden);
  } catch (error) {
    console.error('Error getting hidden lessons:', error);
    return [];
  }
};

export const toggleLessonVisibility = (lessonId: string, isHidden: boolean, profileId?: string): SpacedRepetitionInfo | null => {
  try {
    console.log(`Сервер: Изменение видимости урока ${lessonId} на ${isHidden ? 'скрытый' : 'видимый'}`);
    
    // Получаем аналитику
    const analytics = getAnalytics(profileId);
    
    // Инициализируем массив spacedRepetition, если он не существует
    if (!analytics.spacedRepetition) {
      analytics.spacedRepetition = [];
    }
    
    // Находим информацию о повторении урока
    let repetitionInfo = analytics.spacedRepetition.find(info => info.lessonId === lessonId);
    
    if (!repetitionInfo) {
      // Если информация о повторении не найдена, создаем новую запись
      const status = analytics.completedLessons?.includes(lessonId) ? LessonStatus.Completed : LessonStatus.NotStarted;
      
      repetitionInfo = {
        lessonId,
        status,
        completionDates: [],
        repetitionLevel: 0,
        nextReviewDate: 0,
        isHidden,
        lastErrorCount: 0
      };
      
      analytics.spacedRepetition.push(repetitionInfo);
    } else {
      // Обновляем существующую информацию
      repetitionInfo.isHidden = isHidden;
    }
    
    // Сохраняем аналитику
    saveAnalytics(analytics, profileId);
    
    console.log(`Сервер: Видимость урока ${lessonId} успешно изменена на ${isHidden ? 'скрытый' : 'видимый'}`);
    return repetitionInfo;
  } catch (error) {
    console.error('Ошибка при изменении видимости урока:', error);
    return null;
  }
};

/**
 * Обработать завершение повторения урока
 * Обновляет статус урока на Completed и рассчитывает новую дату повторения
 * 
 * @param lessonId - ID урока
 * @param errorCount - Количество ошибок при повторении
 * @param profileId - ID профиля пользователя
 * @returns Обновленная информация о повторении
 */
export const completeReviewLesson = (lessonId: string, errorCount: number = 0, profileId?: string): SpacedRepetitionInfo | null => {
  try {
    const analytics = getAnalytics(profileId);
    
    if (!analytics.spacedRepetition) {
      return null;
    }
    
    // Поиск информации о повторении урока
    const repetitionInfo = analytics.spacedRepetition.find(info => info.lessonId === lessonId);
    
    if (!repetitionInfo) {
      console.error(`Не найдена информация о повторении для урока ${lessonId}`);
      return null;
    }
    
    // Обновляем статус урока и рассчитываем новую дату повторения
    // Передаем флаг isRepeating=true, чтобы указать, что это повторение
    const updatedInfo = updateLessonSpacedRepetitionInfo(
      lessonId, 
      LessonStatus.Completed, 
      repetitionInfo.isHidden, 
      errorCount, 
      profileId, 
      true // это повторение урока
    );
    
    console.log(`Урок ${lessonId} успешно повторен. Следующее повторение: ${new Date(updatedInfo.nextReviewDate).toLocaleDateString()}`);
    
    return updatedInfo;
  } catch (error) {
    console.error('Ошибка при завершении повторения урока:', error);
    return null;
  }
};
