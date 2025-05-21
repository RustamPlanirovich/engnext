import fs from 'fs';
import path from 'path';
import { Analytics, AnalyticsItem, Example, Lesson } from '@/types/lesson';
import { getActiveProfile } from './profileUtils';

// Server-side utility functions that use Node.js modules
const DATA_DIR = path.join(process.cwd(), 'data');
const LESSONS_DIR = path.join(DATA_DIR, 'lessons');
const ANALYTICS_DIR = path.join(DATA_DIR, 'analytics');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

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
    const lessonPath = path.join(LESSONS_DIR, `${lessonId}.json`);
    if (!fs.existsSync(lessonPath)) {
      // Check if the lesson exists in the root directory (for lesson1.json)
      const rootLessonPath = path.join(process.cwd(), `${lessonId}.json`);
      if (fs.existsSync(rootLessonPath)) {
        const lessonData = fs.readFileSync(rootLessonPath, 'utf8');
        return JSON.parse(lessonData);
      }
      return null;
    }
    const lessonData = fs.readFileSync(lessonPath, 'utf8');
    return JSON.parse(lessonData);
  } catch (error) {
    console.error(`Error reading lesson ${lessonId}:`, error);
    return null;
  }
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
      lessonCompletionCounts: {}
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
      console.log(`${index}: ${error.id} - "${error.sentence.english}" (${error.lessonId})`);
    });
    
    // Normalize the input sentence for comparison
    const normalizedRussian = sentence.russian.trim().toLowerCase();
    const normalizedEnglish = sentence.english.trim().toLowerCase();
    
    // Find all matching errors (there could be multiple entries for the same sentence)
    const matchingErrors = analytics.errors.filter(error => {
      // Match by ID if provided
      if (errorId && error.id === errorId) {
        return true;
      }
      
      // Normalize the error sentence for comparison
      const errorRussian = error.sentence.russian.trim().toLowerCase();
      const errorEnglish = error.sentence.english.trim().toLowerCase();
      
      // Если lessonId равен 'practice', игнорируем проверку lessonId
      // и ищем ошибки только по содержимому предложения
      if (lessonId === 'practice') {
        return errorRussian === normalizedRussian || errorEnglish === normalizedEnglish;
      }
      
      // В противном случае, проверяем и lessonId, и содержимое
      return error.lessonId === lessonId && 
             (errorRussian === normalizedRussian || errorEnglish === normalizedEnglish);
    });
    
    console.log(`Found ${matchingErrors.length} matching errors to remove`);
    
    if (matchingErrors.length > 0) {
      // Log the errors being removed
      matchingErrors.forEach(error => {
        console.log(`Removing error: ${JSON.stringify(error)}`);
      });
      
      // Get the IDs of errors to remove
      const errorIdsToRemove = matchingErrors.map(error => error.id);
      
      // Filter out all matching errors by ID
      analytics.errors = analytics.errors.filter(error => !errorIdsToRemove.includes(error.id));
      
      console.log(`Errors after removal: ${analytics.errors.length}`);
      
      // Save updated analytics
      saveAnalytics(analytics, profileId);
      console.log('Analytics saved successfully after error removal');
    } else {
      // Try a more lenient approach - match by just the English text
      const lenientMatches = analytics.errors.filter(error => {
        const errorEnglish = error.sentence.english.trim().toLowerCase();
        return error.lessonId === lessonId && errorEnglish === normalizedEnglish;
      });
      
      if (lenientMatches.length > 0) {
        console.log(`Found ${lenientMatches.length} lenient matches by English text only`);
        
        // Log the errors being removed
        lenientMatches.forEach(error => {
          console.log(`Removing error (lenient match): ${JSON.stringify(error)}`);
        });
        
        // Get the IDs of errors to remove
        const errorIdsToRemove = lenientMatches.map(error => error.id);
        
        // Filter out all matching errors by ID
        analytics.errors = analytics.errors.filter(error => !errorIdsToRemove.includes(error.id));
        
        console.log(`Errors after lenient removal: ${analytics.errors.length}`);
        
        // Save updated analytics
        saveAnalytics(analytics, profileId);
        console.log('Analytics saved successfully after lenient error removal');
      } else {
        console.log(`No matching error found to remove for "${sentence.english}"`);
        
        // Log all errors for debugging
        console.log('Current errors:');
        analytics.errors.forEach((error, index) => {
          console.log(`${index}: ${error.id} - "${error.sentence.english}" (${error.lessonId})`);
        });
      }
    }
  } catch (error) {
    console.error('Error removing error from analytics:', error);
  }
};

// Mark a lesson as completed
export const markLessonCompleted = (lessonId: string, profileId?: string): void => {
  try {
    const analytics = getAnalytics(profileId);
    
    // Получаем количество пройденных предложений в этом уроке
    const completedSentencesCount = analytics.completedSentences && 
                                   analytics.completedSentences[lessonId] ? 
                                   analytics.completedSentences[lessonId].length : 0;
    
    // Если урок уже отмечен как завершенный, увеличиваем счетчик прохождений
    if (analytics.completedLessons.includes(lessonId)) {
      // Инициализируем массив счетчиков прохождений, если он не существует
      if (!analytics.lessonCompletionCounts) {
        analytics.lessonCompletionCounts = {};
      }
      
      // Увеличиваем счетчик прохождений для этого урока
      if (!analytics.lessonCompletionCounts[lessonId]) {
        analytics.lessonCompletionCounts[lessonId] = [1];
      } else {
        const currentCount = analytics.lessonCompletionCounts[lessonId].length > 0 ?
          analytics.lessonCompletionCounts[lessonId][0] : 0;
        analytics.lessonCompletionCounts[lessonId] = [currentCount + 1];
      }
    } else {
      // Добавляем урок в список завершенных
      analytics.completedLessons.push(lessonId);
      console.log(`Added lesson ${lessonId} to completed lessons`);
      
      // Инициализируем массив счетчиков прохождений, если он не существует
      if (!analytics.lessonCompletionCounts) {
        analytics.lessonCompletionCounts = {};
      }
      
      // Устанавливаем счетчик прохождений для этого урока в 1
      analytics.lessonCompletionCounts[lessonId] = [1];
    }
    
    // Увеличиваем счетчик выполненных упражнений на количество пройденных предложений
    analytics.totalExercisesCompleted += completedSentencesCount;
    console.log(`Updated totalExercisesCompleted to ${analytics.totalExercisesCompleted}`);
    
    // Сбрасываем список пройденных предложений для этого урока при завершении урока
    // Это позволит начать новый цикл прохождения урока
    if (analytics.completedSentences && analytics.completedSentences[lessonId]) {
      analytics.completedSentences[lessonId] = [];
    }
    
    // Удалить прогресс для этого урока, так как он завершен
    if (analytics.lessonProgress) {
      analytics.lessonProgress = analytics.lessonProgress.filter(p => p.lessonId !== lessonId);
    }
    
    saveAnalytics(analytics, profileId);
    
    console.log(`Lesson ${lessonId} marked as completed. Completion count: ${analytics.lessonCompletionCounts[lessonId][0]}`);
  } catch (error) {
    console.error('Error marking lesson as completed:', error);
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
    
    // Если урок уже завершен, не сохраняем прогресс
    if (analytics.completedLessons.includes(lessonId)) {
      return;
    }
    
    // Инициализируем массив прогресса, если он не существует
    if (!analytics.lessonProgress) {
      analytics.lessonProgress = [];
    }
    
    // Инициализируем массив пройденных предложений, если он не существует
    if (!analytics.completedSentences) {
      analytics.completedSentences = {};
    }
    
    // Инициализируем массив пройденных предложений для текущего урока, если он не существует
    if (!analytics.completedSentences[lessonId]) {
      analytics.completedSentences[lessonId] = [];
    }
    
    // Добавляем ID предложения в список пройденных, если оно не уже там и ID был передан
    if (sentenceId && !analytics.completedSentences[lessonId].includes(sentenceId)) {
      analytics.completedSentences[lessonId].push(sentenceId);
    }
    
    // Проверяем, есть ли уже прогресс для этого урока
    const existingProgressIndex = analytics.lessonProgress.findIndex(p => p.lessonId === lessonId);
    
    if (existingProgressIndex !== -1) {
      // Обновляем существующий прогресс
      analytics.lessonProgress[existingProgressIndex] = {
        lessonId,
        lastExerciseEnglish,
        timestamp: Date.now(),
        completedSentences: analytics.completedSentences[lessonId] || []
      };
    } else {
      // Добавляем новый прогресс
      analytics.lessonProgress.push({
        lessonId,
        lastExerciseEnglish,
        timestamp: Date.now(),
        completedSentences: analytics.completedSentences[lessonId] || []
      });
    }
    
    // Обновляем дату последней практики
    analytics.lastPracticeDate = Date.now();
    
    // Сохраняем аналитику с обновленным прогрессом
    saveAnalytics(analytics, profileId);
    
    console.log(`Progress saved for lesson ${lessonId}: ${lastExerciseEnglish}, completed sentences: ${analytics.completedSentences[lessonId]?.length || 0}`);
  } catch (error) {
    console.error('Error saving lesson progress:', error);
  }
};

// Получить прогресс урока
export const getLessonProgress = (lessonId: string, profileId?: string): { lastExerciseEnglish: string | null, completedSentences: string[] } => {
  const analytics = getAnalytics(profileId);
  
  // Если урок уже завершен, возвращаем null для lastExerciseEnglish и пустой массив для completedSentences
  if (analytics.completedLessons.includes(lessonId)) {
    return { lastExerciseEnglish: null, completedSentences: [] };
  }
  
  // Инициализируем массив пройденных предложений, если он не существует
  if (!analytics.completedSentences) {
    analytics.completedSentences = {};
  }
  
  // Инициализируем массив пройденных предложений для текущего урока, если он не существует
  if (!analytics.completedSentences[lessonId]) {
    analytics.completedSentences[lessonId] = [];
  }
  
  // Если нет прогресса, возвращаем null для lastExerciseEnglish и текущий массив completedSentences
  if (!analytics.lessonProgress) {
    return { lastExerciseEnglish: null, completedSentences: analytics.completedSentences[lessonId] || [] };
  }
  
  // Находим прогресс для этого урока
  const progress = analytics.lessonProgress.find(p => p.lessonId === lessonId);
  
  return { 
    lastExerciseEnglish: progress ? progress.lastExerciseEnglish : null,
    completedSentences: analytics.completedSentences[lessonId] || []
  };
};

// Get most problematic sentences for practice
export const getMostProblematicSentences = (limit: number = 10, profileId?: string): AnalyticsItem[] => {
  const analytics = getAnalytics(profileId);
  
  return [...analytics.errors]
    .sort((a, b) => b.errors - a.errors)
    .slice(0, limit);
};

// Save a new lesson file
export const saveLesson = async (fileName: string, lessonData: string): Promise<{ success: boolean, message: string }> => {
  ensureDirectories();
  
  try {
    // Validate JSON
    JSON.parse(lessonData);
    
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
    
    return { success: true, message: 'Урок успешно сохранен.' };
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
    
    // Don't allow deleting lesson1.json from the root directory
    if (lessonId === 'lesson1') {
      return { 
        success: false, 
        message: 'Нельзя удалить базовый урок lesson1.json.' 
      };
    }
    
    // Check if file exists
    if (!fs.existsSync(lessonPath)) {
      return { 
        success: false, 
        message: 'Файл урока не найден.' 
      };
    }
    
    fs.unlinkSync(lessonPath);
    
    // Update loaded lessons in analytics
    const analytics = getAnalytics();
    analytics.loadedLessons = analytics.loadedLessons.filter(id => id !== lessonId);
    
    // Remove errors related to this lesson
    analytics.errors = analytics.errors.filter(error => error.lessonId !== lessonId);
    
    // Remove from completed lessons if present
    analytics.completedLessons = analytics.completedLessons.filter(id => id !== lessonId);
    
    saveAnalytics(analytics);
    
    return { success: true, message: 'Урок успешно удален.' };
  } catch (error) {
    console.error('Error deleting lesson file:', error);
    return { 
      success: false, 
      message: 'Ошибка при удалении файла.' 
    };
  }
};

// Create backup of analytics
export const createAnalyticsBackup = (profileId?: string): { success: boolean, message: string } => {
  try {
    // Create backup directory if it doesn't exist
    const backupDir = path.join(DATA_DIR, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Create timestamp for backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (profileId) {
      // Backup specific profile
      const analytics = getAnalytics(profileId);
      const backupFile = path.join(backupDir, `analytics-backup-${profileId}-${timestamp}.json`);
      fs.writeFileSync(backupFile, JSON.stringify(analytics, null, 2));
      
      return {
        success: true,
        message: `Backup created successfully for profile ${profileId}: ${path.basename(backupFile)}`
      };
    } else {
      // Backup all profiles
      const profilesDir = path.join(DATA_DIR, 'profiles');
      const profilesFile = path.join(profilesDir, 'profiles.json');
      
      if (fs.existsSync(profilesFile)) {
        const profilesData = JSON.parse(fs.readFileSync(profilesFile, 'utf8'));
        const backupProfilesFile = path.join(backupDir, `profiles-backup-${timestamp}.json`);
        fs.writeFileSync(backupProfilesFile, JSON.stringify(profilesData, null, 2));
      }
      
      // Backup default analytics file if it exists
      const defaultAnalyticsFile = path.join(DATA_DIR, 'analytics.json');
      if (fs.existsSync(defaultAnalyticsFile)) {
        const analytics = JSON.parse(fs.readFileSync(defaultAnalyticsFile, 'utf8'));
        const backupFile = path.join(backupDir, `analytics-backup-default-${timestamp}.json`);
        fs.writeFileSync(backupFile, JSON.stringify(analytics, null, 2));
      }
      
      // Backup all profile analytics files
      const analyticsDir = path.join(DATA_DIR, 'analytics');
      if (fs.existsSync(analyticsDir)) {
        const files = fs.readdirSync(analyticsDir);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(analyticsDir, file);
            const profileId = file.replace('.json', '');
            const backupFile = path.join(backupDir, `analytics-backup-${profileId}-${timestamp}.json`);
            fs.copyFileSync(filePath, backupFile);
          }
        }
      }
      
      return {
        success: true,
        message: `Backup created successfully for all profiles at ${timestamp}`
      };
    }
  } catch (error) {
    console.error('Error creating analytics backup:', error);
    return {
      success: false,
      message: `Failed to create backup: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

// Copy lesson1.json to the lessons directory if it doesn't exist there
export const copyLesson1ToLessonsDir = (): void => {
  ensureDirectories();
  
  const rootLesson1Path = path.join(process.cwd(), 'lesson1.json');
  const lessonsLesson1Path = path.join(LESSONS_DIR, 'lesson1.json');
  
  if (fs.existsSync(rootLesson1Path) && !fs.existsSync(lessonsLesson1Path)) {
    try {
      fs.copyFileSync(rootLesson1Path, lessonsLesson1Path);
      
      // Update loaded lessons in analytics
      const analytics = getAnalytics();
      if (!analytics.loadedLessons.includes('lesson1')) {
        analytics.loadedLessons.push('lesson1');
        saveAnalytics(analytics);
      }
    } catch (error) {
      console.error('Error copying lesson1.json to lessons directory:', error);
    }
  }
};
