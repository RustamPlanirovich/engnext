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
  console.log(`selectPrioritySentences: lessonId=${lessonId}, profileId=${profileId}`);
  
  // Получаем урок
  console.log(`Получаем урок ${lessonId}`);
  const lesson = getLesson(lessonId);
  if (!lesson) {
    console.error(`Урок ${lessonId} не найден`);
    return [];
  }
  
  console.log(`Урок ${lessonId} найден`, lesson);
  
  // Получаем все примеры из урока
  console.log(`Получаем все примеры из урока ${lessonId}`);
  const allExamples = extractExamples(lesson);
  
  // Если нет примеров, возвращаем пустой массив
  if (!allExamples || allExamples.length === 0) {
    console.error(`В уроке ${lessonId} нет примеров`);
    return [];
  }
  
  console.log(`Найдено ${allExamples.length} примеров в уроке ${lessonId}`);
  
  // Получаем аналитику пользователя
  console.log(`Получаем аналитику пользователя ${profileId}`);
  const analytics = getAnalytics(profileId);
  
  // Создаем массив предложений с приоритетами
  console.log(`Вычисляем приоритет для каждого предложения`);
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
  console.log(`savePrioritySentences: lessonId=${lessonId}, profileId=${profileId}`);
  const analytics = getAnalytics(profileId);
  
  // Инициализируем хранилище приоритетных предложений, если оно не существует
  if (!analytics.prioritySentences) {
    console.log(`Создаем хранилище приоритетных предложений`);
    analytics.prioritySentences = {};
  }
  
  // Получаем приоритетные предложения
  console.log(`Выбираем приоритетные предложения для урока ${lessonId}`);
  const prioritySentences = selectPrioritySentences(lessonId, profileId);
  console.log(`Выбрано ${prioritySentences.length} приоритетных предложений для урока ${lessonId}`);
  
  // Сохраняем их в аналитике
  analytics.prioritySentences[lessonId] = prioritySentences;
  
  // Сохраняем аналитику
  console.log(`Сохраняем приоритетные предложения в аналитике`);
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
  console.log(`getPrioritySentences: lessonId=${lessonId}, profileId=${profileId}`);
  const analytics = getAnalytics(profileId);
  
  // Если хранилище не существует или нет данных для этого урока, создаем и сохраняем их
  if (!analytics.prioritySentences || !analytics.prioritySentences[lessonId]) {
    console.log(`Нет приоритетных предложений для урока ${lessonId}, создаем их`);
    return savePrioritySentences(lessonId, profileId);
  }
  
  console.log(`Найдено ${analytics.prioritySentences[lessonId].length} приоритетных предложений для урока ${lessonId}`);
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
 * @param lessonId - ID конкретного урока (опционально)
 * @returns Массив приоритетных предложений для повторения сегодня
 */
export const getSentencesDueForReview = (profileId?: string, lessonId?: string): PrioritySentence[] => {
  const analytics = getAnalytics(profileId);
  const now = Date.now();
  
  console.log(`getSentencesDueForReview: profileId=${profileId}, lessonId=${lessonId}, now=${new Date(now).toISOString()}`);
  
  // Получаем уроки, которые нужно повторить
  if (!analytics.spacedRepetition) {
    return [];
  }
  
  // Если указан конкретный урок, берем его в любом случае
  let lessonsDueForReview;
  
  if (lessonId) {
    console.log(`Ищем урок ${lessonId} в spacedRepetition`);
    // Если указан конкретный урок, берем его в любом случае
    lessonsDueForReview = analytics.spacedRepetition.filter(info => 
      !info.isHidden && info.lessonId === lessonId
    );
    
    console.log(`Найдено ${lessonsDueForReview.length} записей для урока ${lessonId}`);
    
    // Если урок не найден, проверяем, есть ли такой урок в системе
    if (lessonsDueForReview.length === 0) {
      console.log(`Урок ${lessonId} не найден в spacedRepetition, проверяем его существование`);
      // Создаем временную запись для урока, чтобы получить предложения
      try {
        // Проверяем, существует ли урок
        const lesson = getLesson(lessonId);
        console.log(`Результат поиска урока ${lessonId}: ${lesson ? 'Найден' : 'Не найден'}`);
        if (lesson) {
          // Если урок существует, создаем временную запись
          console.log(`Создаем временную запись для урока ${lessonId}`);
          lessonsDueForReview = [{
            lessonId,
            status: LessonStatus.DueForReview, // Временно устанавливаем статус для повторения
            completionDates: [],
            repetitionLevel: 0,
            nextReviewDate: now,
            isHidden: false,
            lastErrorCount: 0
          }];
        } else {
          console.error(`Урок ${lessonId} не найден в системе`);
        }
      } catch (error) {
        console.error(`Ошибка при получении урока ${lessonId}:`, error);
      }
    }
  } else {
    // Если не указан конкретный урок, фильтруем уроки, которые нужно повторить
    lessonsDueForReview = analytics.spacedRepetition.filter(info => 
      !info.isHidden && (
        info.status === LessonStatus.DueForReview || 
        (info.status === LessonStatus.Completed && info.nextReviewDate > 0 && info.nextReviewDate <= now)
      )
    );
    console.log(`Найдено ${lessonsDueForReview.length} уроков для повторения`);
  }
  
  // Если нет уроков для повторения, возвращаем пустой массив
  if (lessonsDueForReview.length === 0) {
    return [];
  }
  
  // Собираем приоритетные предложения из этих уроков
  const sentencesDueForReview: PrioritySentence[] = [];
  
  lessonsDueForReview.forEach(lessonInfo => {
    // Получаем предложения для каждого урока и добавляем информацию о уроке
    const lessonSentences = getPrioritySentences(lessonInfo.lessonId, profileId);
    
    // Добавляем информацию о уроке к каждому предложению
    const enhancedSentences = lessonSentences.map(sentence => ({
      ...sentence,
      lessonId: lessonInfo.lessonId,
      // Обновляем приоритет на основе уровня повторения
      priority: calculatePriority(sentence.priority, lessonInfo.repetitionLevel)
    }));
    
    sentencesDueForReview.push(...enhancedSentences);
  });
  
  // Сортируем по приоритету
  sentencesDueForReview.sort((a, b) => b.priority - a.priority);
  
  return sentencesDueForReview;
};

/**
 * Рассчитывает приоритет предложения с учетом уровня повторения
 * Чем выше уровень повторения, тем выше приоритет
 * 
 * @param basePriority - Базовый приоритет предложения
 * @param repetitionLevel - Текущий уровень повторения
 * @returns Скорректированный приоритет
 */
const calculatePriority = (basePriority: number, repetitionLevel: number): number => {
  // Увеличиваем приоритет на основе уровня повторения
  // Чем выше уровень повторения, тем важнее закрепить материал
  const repetitionBonus = Math.min(repetitionLevel, 5); // Максимум +5 к приоритету
  
  return basePriority + repetitionBonus;
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
