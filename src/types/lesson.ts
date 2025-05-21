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

export interface Analytics {
  errors: AnalyticsItem[];
  completedLessons: string[];
  loadedLessons: string[];
  totalExercisesCompleted: number;
  lastPracticeDate: number;
  lessonProgress?: LessonProgress[]; // Прогресс по незавершенным урокам
  completedSentences?: { [lessonId: string]: string[] }; // ID пройденных предложений по урокам
  lessonCompletionCounts?: { [lessonId: string]: number[] }; // Счетчики прохождений уроков
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
