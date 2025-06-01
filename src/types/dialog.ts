import { LessonLevel } from './lesson';

export interface DialogLine {
  name: 'A' | 'B';
  russian: string;
  english: string;
  voiceover: string;
}

export interface Dialog {
  id?: string;
  title?: string;
  lines: DialogLine[];
}

export type DialogArray = DialogLine[];

export enum DialogDifficulty {
  Easy = 'easy',
  Medium = 'medium',
  Hard = 'hard'
}

export interface DialogSet {
  lessonId: string;
  level: LessonLevel;
  dialogues: {
    level: DialogDifficulty;
    dialogues: DialogArray[];
  }[];
}

export interface DialogFile {
  fileName: string;
  dialogData: string;
  lessonId: string;
  level: LessonLevel;
}

export interface UploadDialogResult {
  fileName: string;
  success: boolean;
  message: string;
}
