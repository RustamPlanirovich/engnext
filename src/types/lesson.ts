export interface Example {
  russian: string;
  english: string;
  source: string;
  note?: string;
}

export interface Subconcept {
  concept: string;
  explanation: string;
  formula?: string;
  source: string;
  examples?: Example[];
  subconcepts?: Subconcept[];
}

export interface Lesson {
  concept: string;
  explanation: string;
  source: string;
  subconcepts: Subconcept[];
}

export interface AnalyticsItem {
  id?: string; // Уникальный идентификатор ошибки
  lessonId: string;
  sentence: {
    russian: string;
    english: string;
  };
  errors: number;
  timestamp: number;
}

export interface LessonProgress {
  lessonId: string;
  lastExerciseEnglish: string; // Английский текст последнего упражнения
  timestamp: number;
  completedSentences?: string[]; // ID пройденных предложений в текущем уроке
}

// Статус урока в системе интервального повторения
export enum LessonStatus {
  NotStarted = 'not_started',   // Не начат
  InProgress = 'in_progress',   // В процессе изучения
  Completed = 'completed',      // Завершен
  Hidden = 'hidden',           // Скрыт пользователем
  DueForReview = 'due_review'   // Нужно повторить
}

// Информация о повторении урока по кривой забывания
export interface SpacedRepetitionInfo {
  lessonId: string;             // ID урока
  status: LessonStatus;         // Текущий статус
  completionDates: number[];    // Даты завершения (в миллисекундах)
  repetitionLevel: number;      // Текущий уровень повторения (0-5)
  nextReviewDate: number;       // Дата следующего повторения (в миллисекундах)
  isHidden: boolean;           // Скрыт ли урок
  lastErrorCount?: number;     // Количество ошибок при последнем прохождении
}

// Тип для загрузки файла урока
export interface LessonFile {
  fileName: string;            // Имя файла урока
  lessonData: string;          // Содержимое файла урока в формате JSON
}

// Результат загрузки файла урока
export interface UploadResult {
  fileName: string;            // Имя файла урока
  success: boolean;            // Успешна ли загрузка
  message: string;             // Сообщение о результате загрузки
}

/**
 * Интерфейс для хранения приоритетных предложений для повторения
 */
export interface PrioritySentence {
  id: string;           // Уникальный идентификатор предложения
  russian: string;      // Русский текст
  english: string;      // Английский текст
  priority: number;     // Приоритет (чем выше, тем важнее)
  errorCount: number;   // Количество ошибок при изучении
  source: string;       // Источник предложения
}

export interface Analytics {
  errors: AnalyticsItem[];
  completedLessons: string[];
  loadedLessons: string[];
  totalExercisesCompleted: number;
  lastPracticeDate: number;
  lessonProgress?: LessonProgress[]; // Прогресс по незавершенным урокам
  completedSentences?: { [lessonId: string]: string[] }; // ID пройденных предложений по урокам
  lessonCompletionCounts?: { [lessonId: string]: number[] }; // Счетчики прохождений уроков
  spacedRepetition?: SpacedRepetitionInfo[]; // Информация о повторении уроков
  prioritySentences?: { [lessonId: string]: PrioritySentence[] }; // Приоритетные предложения для повторения
}

export interface ExerciseType {
  id: number;
  name: string;
  description: string;
}

export interface ExerciseSettings {
  timerEnabled: boolean;
  timerSeconds: number;
}

export type ExerciseMode = 
  | 'en-to-ru-typing'  // English to Russian typing
  | 'ru-to-en-typing'  // Russian to English typing
  | 'en-to-ru-blocks'  // English to Russian blocks
  | 'ru-to-en-blocks'; // Russian to English blocks

export interface UserSettings {
  timerEnabled?: boolean;
  timerDuration?: number;
  darkMode?: boolean;
  exerciseMode?: ExerciseMode;
  exercisesPerSession?: number;
}

export interface Profile {
  id: string;
  name: string;
  avatar?: string;
  createdAt: number;
  lastActiveAt: number;
  isAdmin?: boolean;
  settings?: UserSettings;
}

export interface ProfilesList {
  profiles: Profile[];
  activeProfileId?: string;
}
