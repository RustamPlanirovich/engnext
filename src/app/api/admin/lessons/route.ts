import { NextRequest, NextResponse } from 'next/server';
import { saveLesson, deleteLesson } from '@/utils/serverUtils';
import { isAdmin } from '@/utils/profileUtils';

// POST /api/admin/lessons - Create or update a lesson (admin only)
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    
    // Проверяем, что запрашивающий пользователь является администратором
    if (!profileId || !isAdmin(profileId)) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Требуются права администратора.' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    
    // Проверяем, есть ли несколько файлов или один
    if (data.files && Array.isArray(data.files)) {
      // Обработка нескольких файлов
      if (data.files.length === 0) {
        return NextResponse.json(
          { error: 'Не переданы файлы для загрузки' },
          { status: 400 }
        );
      }
      
      const results = [];
      let hasErrors = false;
      
      // Обрабатываем каждый файл
      for (const file of data.files) {
        if (!file.fileName || !file.lessonData) {
          results.push({
            fileName: file.fileName || 'Неизвестный файл',
            success: false,
            message: 'Отсутствуют обязательные поля: fileName, lessonData'
          });
          hasErrors = true;
          continue;
        }
        
        try {
          // Используем уровень CEFR, если он указан
          const result = await saveLesson(file.fileName, file.lessonData, file.level);
          results.push({
            fileName: file.fileName,
            success: result.success,
            message: result.message
          });
          
          if (!result.success) {
            hasErrors = true;
          }
        } catch (error) {
          results.push({
            fileName: file.fileName,
            success: false,
            message: 'Ошибка при сохранении файла'
          });
          hasErrors = true;
        }
      }
      
      return NextResponse.json({ 
        success: !hasErrors,
        results,
        message: hasErrors ? 'Некоторые файлы не были загружены' : 'Все файлы успешно загружены'
      });
    } else {
      // Обработка одного файла (старый формат для обратной совместимости)
      if (!data.fileName || !data.lessonData) {
        return NextResponse.json(
          { error: 'Отсутствуют обязательные поля: fileName, lessonData' },
          { status: 400 }
        );
      }
      
      // Используем уровень CEFR, если он указан
      const result = await saveLesson(data.fileName, data.lessonData, data.level);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ 
        success: true,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error saving lesson:', error);
    return NextResponse.json(
      { error: 'Не удалось сохранить урок' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/lessons - Delete a lesson (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lessonId');
    const profileId = searchParams.get('profileId');
    
    // Проверяем, что запрашивающий пользователь является администратором
    if (!profileId || !isAdmin(profileId)) {
      return NextResponse.json(
        { error: 'Доступ запрещен. Требуются права администратора.' },
        { status: 403 }
      );
    }
    
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Отсутствует обязательное поле: lessonId' },
        { status: 400 }
      );
    }
    
    const result = deleteLesson(lessonId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return NextResponse.json(
      { error: 'Не удалось удалить урок' },
      { status: 500 }
    );
  }
}
