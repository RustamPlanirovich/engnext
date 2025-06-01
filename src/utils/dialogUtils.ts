import fs from 'fs';
import path from 'path';
import { DialogSet, DialogDifficulty } from '@/types/dialog';
import { LessonLevel } from '@/types/lesson';

// Server-side utility functions for dialogs
const DATA_DIR = path.join(process.cwd(), 'data');
const DIALOGS_DIR = path.join(DATA_DIR, 'dialogs');

// Ensure dialogs directory exists
export const ensureDialogsDirectory = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(DIALOGS_DIR)) {
    fs.mkdirSync(DIALOGS_DIR, { recursive: true });
  }
};

// Get all available dialog sets
export const getDialogSets = (): DialogSet[] => {
  ensureDialogsDirectory();
  try {
    const files = fs.readdirSync(DIALOGS_DIR)
      .filter(file => file.endsWith('.json'));
    
    console.log(`Found ${files.length} dialog files in directory:`, files);
    
    const dialogSets: DialogSet[] = [];
    
    for (const file of files) {
      try {
        // Извлекаем lessonId из имени файла, удаляя расширение .json
        const fileBaseName = file.replace('.json', '');
        const filePath = path.join(DIALOGS_DIR, file);
        
        console.log(`Reading dialog file: ${filePath}`);
        
        // Читаем файл напрямую вместо использования getDialogSetByLessonId
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const dialogSet = JSON.parse(fileContent) as DialogSet;
        
        // Проверяем наличие обязательных полей и добавляем их при необходимости
        if (!dialogSet.lessonId) {
          // Извлекаем lessonId из имени файла
          const cleanLessonId = fileBaseName.replace('_dialogs', '');
          dialogSet.lessonId = cleanLessonId;
          console.log(`Added missing lessonId: ${cleanLessonId} to dialog set`);
        }
        
        if (!dialogSet.level) {
          dialogSet.level = 'A1' as LessonLevel; // Устанавливаем уровень по умолчанию
          console.log(`Added missing level: ${dialogSet.level} to dialog set for lesson ${dialogSet.lessonId}`);
        }
        
        // Проверяем структуру dialogues
        if (!dialogSet.dialogues || !Array.isArray(dialogSet.dialogues)) {
          console.error(`Invalid dialog structure for file ${file}: missing or invalid dialogues array`);
          continue;
        }
        
        console.log(`Successfully loaded dialog set for lesson ${dialogSet.lessonId} with level ${dialogSet.level}`);
        console.log(`Dialog set has ${dialogSet.dialogues.length} difficulty groups`);
        
        dialogSets.push(dialogSet);
      } catch (fileError) {
        console.error(`Error processing dialog file ${file}:`, fileError);
        // Continue with other files even if one fails
      }
    }
    
    console.log(`Total dialog sets loaded: ${dialogSets.length}`);
    return dialogSets;
  } catch (error) {
    console.error('Error reading dialogs directory:', error);
    return [];
  }
};

// Get a specific dialog set by lesson ID
export const getDialogSetByLessonId = (lessonId: string): DialogSet | null => {
  try {
    // Clean up the lessonId to handle different formats
    const cleanLessonId = lessonId.replace('_dialogs', '');
    const dialogPath = path.join(DIALOGS_DIR, `${cleanLessonId}_dialogs.json`);
    
    console.log(`Trying to load dialog file for lesson ${cleanLessonId} from: ${dialogPath}`);
    
    if (!fs.existsSync(dialogPath)) {
      console.warn(`Диалоги для урока ${cleanLessonId} не найдены по пути: ${dialogPath}`);
      return null;
    }
    
    const dialogData = fs.readFileSync(dialogPath, 'utf8');
    console.log(`Successfully read dialog file for lesson ${cleanLessonId}`);
    
    try {
      const parsedData = JSON.parse(dialogData);
      
      // Проверяем структуру данных и добавляем lessonId, если его нет
      if (!parsedData.lessonId) {
        parsedData.lessonId = cleanLessonId;
      }
      
      // Проверяем наличие уровня
      if (!parsedData.level) {
        parsedData.level = 'A1' as LessonLevel; // Устанавливаем уровень по умолчанию
      }
      
      // Проверяем структуру dialogues
      if (!parsedData.dialogues || !Array.isArray(parsedData.dialogues)) {
        console.error(`Invalid dialog structure for lesson ${cleanLessonId}: missing or invalid dialogues array`);
        return null;
      }
      
      console.log(`Successfully parsed dialog set for lesson ${cleanLessonId} with ${parsedData.dialogues.length} difficulty groups`);
      return parsedData;
    } catch (parseError) {
      console.error(`Error parsing JSON for lesson ${cleanLessonId}:`, parseError);
      return null;
    }
  } catch (error) {
    console.error(`Error reading dialogs for lesson ${lessonId}:`, error);
    return null;
  }
};

// Save a new dialog set file
export const saveDialogSet = async (
  fileName: string, 
  dialogData: string, 
  lessonId: string,
  level: LessonLevel
): Promise<{ success: boolean, message: string }> => {
  try {
    ensureDialogsDirectory();
    
    // Validate JSON
    let parsedData;
    try {
      parsedData = JSON.parse(dialogData);
    } catch (error) {
      return { success: false, message: 'Неверный формат JSON. Пожалуйста, проверьте файл.' };
    }
    
    // Initialize dialogues structure if it doesn't exist
    if (!parsedData.dialogues) {
      parsedData.dialogues = [];
    }
    
    // Validate that dialogs is an object with the right structure
    const validStructure = 
      Array.isArray(parsedData.dialogues);
    
    if (!validStructure) {
      return { 
        success: false, 
        message: 'Неверная структура файла диалогов. Должен быть массив dialogues.' 
      };
    }
    
    // Add lessonId and level to the data
    parsedData.lessonId = lessonId;
    parsedData.level = level;
    
    // Save to file with proper naming convention
    const safeFileName = `${lessonId}_dialogs.json`;
    const filePath = path.join(DIALOGS_DIR, safeFileName);
    fs.writeFileSync(filePath, JSON.stringify(parsedData, null, 2));
    
    return { 
      success: true, 
      message: `Диалоги для урока ${lessonId} успешно сохранены в файле ${safeFileName}` 
    };
  } catch (error) {
    console.error('Error saving dialog set:', error);
    return { 
      success: false, 
      message: `Ошибка при сохранении диалогов: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

// Delete a dialog set file
export const deleteDialogSet = (lessonId: string): { success: boolean, message: string } => {
  try {
    const dialogPath = path.join(DIALOGS_DIR, `${lessonId}_dialogs.json`);
    
    if (!fs.existsSync(dialogPath)) {
      return { 
        success: false, 
        message: `Диалоги для урока ${lessonId} не найдены` 
      };
    }
    
    fs.unlinkSync(dialogPath);
    
    return { 
      success: true, 
      message: `Диалоги для урока ${lessonId} успешно удалены` 
    };
  } catch (error) {
    console.error(`Error deleting dialogs for lesson ${lessonId}:`, error);
    return { 
      success: false, 
      message: `Ошибка при удалении диалогов: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};
