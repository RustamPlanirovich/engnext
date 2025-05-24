import { Analytics, Example, Lesson, LessonStatus, SpacedRepetitionInfo } from '@/types/lesson';
import { getAnalytics, saveAnalytics, extractExamples, getLesson } from './serverUtils';

/**
 * Интерфейс для хранения приоритетных предложений для повторения
 */
interface PrioritySentence {
  id: string;           // Уникальный идентификатор предложения
  russian: string;      // Русский текст
  english: string;      // Английский текст
  priority: number;     // Приоритет (чем выше, тем важнее)
  errorCount: number;   // Количество ошибок при изучении
  source: string;       // Источник предложения
}

/**
 * Выбирает 20% наиболее важных предложений из урока для повторения
 * 
 * @param lessonId - ID урока
 * @param profileId - ID профиля пользователя
 * @returns Массив приоритетных предложений
 */
export const selectPrioritySentences = (lessonId: string, profileId?: string): PrioritySentence[] => {
  // Получаем урок
  const lesson = getLesson(lessonId);
  if (!lesson) {
    return [];
  }
  
  // Получаем все примеры из урока
  const allExamples = extractExamples(lesson);
  
  // Получаем аналитику пользователя
  const analytics = getAnalytics(profileId);
  
  // Создаем массив предложений с приоритетами
  const sentences: PrioritySentence[] = allExamples.map(example => {
    // Генерируем уникальный ID для предложения
    const sentenceId = `${lessonId}_${example.russian}_${example.english}`;
    
    // Находим количество ошибок для этого предложения
    const errorCount = analytics.errors.filter(error => 
      error.lessonId === lessonId && 
      error.sentence.russian === example.russian && 
      error.sentence.english === example.english
    ).length;
    
    // Базовый приоритет
    let priority = 1;
    
    // Увеличиваем приоритет на основе ошибок (чем больше ошибок, тем выше приоритет)
    if (errorCount > 0) {
      priority += Math.min(errorCount * 2, 10); // Максимум +10 к приоритету за ошибки
    }
    
    // Увеличиваем приоритет для ключевых конструкций (если в примечании или источнике есть ключевые слова)
    if (example.note && (
      example.note.includes('ключев') || 
      example.note.includes('важн') || 
      example.note.includes('основн')
    )) {
      priority += 5;
    }
    
    // Увеличиваем приоритет для частотных фраз (если в примечании или источнике есть указание на частотность)
    if (example.note && (
      example.note.includes('част') || 
      example.note.includes('распростран') || 
      example.note.includes('популярн')
    )) {
      priority += 3;
    }
    
    return {
      id: sentenceId,
      russian: example.russian,
      english: example.english,
      priority,
      errorCount,
      source: example.source
    };
  });
  
  // Сортируем предложения по приоритету (от высокого к низкому)
  sentences.sort((a, b) => b.priority - a.priority);
  
  // Выбираем 20% предложений с наивысшим приоритетом
  const totalCount = sentences.length;
  const selectedCount = Math.max(Math.ceil(totalCount * 0.2), 5); // Минимум 5 предложений или 20%
  
  return sentences.slice(0, selectedCount);
};

/**
 * Сохраняет приоритетные предложения для повторения в аналитике пользователя
 * 
 * @param lessonId - ID урока
 * @param profileId - ID профиля пользователя
 * @returns Массив сохраненных приоритетных предложений
 */
export const savePrioritySentences = (lessonId: string, profileId?: string): PrioritySentence[] => {
  const analytics = getAnalytics(profileId);
  
  // Инициализируем хранилище приоритетных предложений, если оно не существует
  if (!analytics.prioritySentences) {
    analytics.prioritySentences = {};
  }
  
  // Получаем приоритетные предложения
  const prioritySentences = selectPrioritySentences(lessonId, profileId);
  
  // Сохраняем их в аналитике
  analytics.prioritySentences[lessonId] = prioritySentences;
  
  // Сохраняем аналитику
  saveAnalytics(analytics, profileId);
  
  return prioritySentences;
};

/**
 * Получает приоритетные предложения для повторения из аналитики пользователя
 * 
 * @param lessonId - ID урока
 * @param profileId - ID профиля пользователя
 * @returns Массив приоритетных предложений
 */
export const getPrioritySentences = (lessonId: string, profileId?: string): PrioritySentence[] => {
  const analytics = getAnalytics(profileId);
  
  // Если хранилище не существует или нет данных для этого урока, создаем и сохраняем их
  if (!analytics.prioritySentences || !analytics.prioritySentences[lessonId]) {
    return savePrioritySentences(lessonId, profileId);
  }
  
  return analytics.prioritySentences[lessonId];
};

/**
 * Получает все приоритетные предложения для повторения из всех уроков
 * 
 * @param profileId - ID профиля пользователя
 * @returns Объект с приоритетными предложениями по урокам
 */
export const getAllPrioritySentences = (profileId?: string): { [lessonId: string]: PrioritySentence[] } => {
  const analytics = getAnalytics(profileId);
  return analytics.prioritySentences || {};
};

/**
 * Получает приоритетные предложения для повторения на текущий день
 * в соответствии с графиком интервального повторения
 * 
 * @param profileId - ID профиля пользователя
 * @returns Массив приоритетных предложений для повторения сегодня
 */
export const getSentencesDueForReview = (profileId?: string): PrioritySentence[] => {
  const analytics = getAnalytics(profileId);
  const now = Date.now();
  
  // Получаем уроки, которые нужно повторить
  if (!analytics.spacedRepetition) {
    return [];
  }
  
  // Фильтруем уроки, которые нужно повторить
  const lessonsDueForReview = analytics.spacedRepetition.filter(info => 
    !info.isHidden && 
    info.status === LessonStatus.DueForReview || 
    (info.status === LessonStatus.Completed && info.nextReviewDate > 0 && info.nextReviewDate <= now)
  );
  
  // Собираем приоритетные предложения из этих уроков
  const sentencesDueForReview: PrioritySentence[] = [];
  
  lessonsDueForReview.forEach(lessonInfo => {
    const lessonSentences = getPrioritySentences(lessonInfo.lessonId, profileId);
    sentencesDueForReview.push(...lessonSentences);
  });
  
  // Сортируем по приоритету
  sentencesDueForReview.sort((a, b) => b.priority - a.priority);
  
  return sentencesDueForReview;
};

/**
 * Обновляет аналитику для поддержки приоритетных предложений
 * 
 * @param profileId - ID профиля пользователя
 */
export const updateAnalyticsForPrioritySentences = (profileId?: string): void => {
  const analytics = getAnalytics(profileId);
  
  // Добавляем поле для хранения приоритетных предложений, если его нет
  if (!analytics.prioritySentences) {
    analytics.prioritySentences = {};
    saveAnalytics(analytics, profileId);
  }
};
