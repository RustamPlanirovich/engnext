import fs from 'fs';
import path from 'path';
import { Analytics, AnalyticsItem, Example, Lesson } from '@/types/lesson';

const DATA_DIR = path.join(process.cwd(), 'data');
const LESSONS_DIR = path.join(DATA_DIR, 'lessons');
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json');

// Ensure data directories exist
export const ensureDirectories = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(LESSONS_DIR)) {
    fs.mkdirSync(LESSONS_DIR, { recursive: true });
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
export const getAnalytics = (): Analytics => {
  ensureDirectories();
  try {
    if (!fs.existsSync(ANALYTICS_FILE)) {
      const defaultAnalytics: Analytics = {
        errors: [],
        completedLessons: [],
        loadedLessons: [],
        totalExercisesCompleted: 0,
        lastPracticeDate: 0
      };
      fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(defaultAnalytics, null, 2));
      return defaultAnalytics;
    }
    
    const analyticsData = fs.readFileSync(ANALYTICS_FILE, 'utf8');
    return JSON.parse(analyticsData);
  } catch (error) {
    console.error('Error reading analytics file:', error);
    return {
      errors: [],
      completedLessons: [],
      loadedLessons: [],
      totalExercisesCompleted: 0,
      lastPracticeDate: 0
    };
  }
};

// Save analytics data
export const saveAnalytics = (analytics: Analytics): void => {
  ensureDirectories();
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(analytics, null, 2));
  } catch (error) {
    console.error('Error saving analytics file:', error);
  }
};

// Add an error to analytics
export const addError = (lessonId: string, sentence: { russian: string, english: string }): void => {
  const analytics = getAnalytics();
  
  // Check if this error already exists
  const existingErrorIndex = analytics.errors.findIndex(
    error => error.lessonId === lessonId && 
    error.sentence.english === sentence.english && 
    error.sentence.russian === sentence.russian
  );
  
  if (existingErrorIndex !== -1) {
    // Increment error count
    analytics.errors[existingErrorIndex].errors += 1;
    analytics.errors[existingErrorIndex].timestamp = Date.now();
  } else {
    // Add new error
    const newError: AnalyticsItem = {
      lessonId,
      sentence,
      errors: 1,
      timestamp: Date.now()
    };
    analytics.errors.push(newError);
  }
  
  saveAnalytics(analytics);
};

// Mark a lesson as completed
export const markLessonCompleted = (lessonId: string): void => {
  const analytics = getAnalytics();
  
  if (!analytics.completedLessons.includes(lessonId)) {
    analytics.completedLessons.push(lessonId);
  }
  
  analytics.lastPracticeDate = Date.now();
  analytics.totalExercisesCompleted += 1;
  
  saveAnalytics(analytics);
};

// Get most problematic sentences for practice
export const getMostProblematicSentences = (limit: number = 10): AnalyticsItem[] => {
  const analytics = getAnalytics();
  
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
export const createAnalyticsBackup = (): { success: boolean, message: string } => {
  ensureDirectories();
  
  try {
    if (!fs.existsSync(ANALYTICS_FILE)) {
      return { 
        success: false, 
        message: 'Файл аналитики не найден.' 
      };
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(DATA_DIR, `analytics-backup-${timestamp}.json`);
    
    fs.copyFileSync(ANALYTICS_FILE, backupPath);
    
    return { 
      success: true, 
      message: `Резервная копия создана: analytics-backup-${timestamp}.json` 
    };
  } catch (error) {
    console.error('Error creating analytics backup:', error);
    return { 
      success: false, 
      message: 'Ошибка при создании резервной копии.' 
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
