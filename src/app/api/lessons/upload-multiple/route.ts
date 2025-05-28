import { NextRequest, NextResponse } from 'next/server';
import { saveLesson } from '@/utils/serverUtils';
import { LessonFile, LessonLevel } from '@/types/lesson';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.files || !Array.isArray(data.files) || data.files.length === 0) {
      return NextResponse.json(
        { error: 'Необходимо предоставить массив файлов для загрузки' },
        { status: 400 }
      );
    }
    
    const results = [];
    let successCount = 0;
    
    for (const file of data.files) {
      if (!file.fileName || !file.lessonData) {
        results.push({
          fileName: file.fileName || 'Неизвестный файл',
          success: false,
          message: 'Отсутствуют обязательные поля: fileName и lessonData'
        });
        continue;
      }
      
      // Проверка JSON
      try {
        JSON.parse(file.lessonData);
      } catch (error) {
        results.push({
          fileName: file.fileName,
          success: false,
          message: 'Неверный формат JSON'
        });
        continue;
      }
      
      // Проверка уровня CEFR, если он указан
      let level = file.level;
      if (level && !Object.values(LessonLevel).includes(level)) {
        results.push({
          fileName: file.fileName,
          success: false,
          message: `Неверный уровень CEFR. Допустимые значения: ${Object.values(LessonLevel).join(', ')}`
        });
        continue;
      }
      
      // Сохранение урока
      const result = await saveLesson(file.fileName, file.lessonData, level);
      
      results.push({
        fileName: file.fileName,
        success: result.success,
        message: result.message
      });
      
      if (result.success) {
        successCount++;
      }
    }
    
    return NextResponse.json({
      success: successCount > 0,
      results,
      message: successCount > 0
        ? `Успешно загружено ${successCount} из ${data.files.length} уроков`
        : 'Не удалось загрузить ни один урок'
    });
  } catch (error) {
    console.error('Error uploading multiple lessons:', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить уроки' },
      { status: 500 }
    );
  }
}
