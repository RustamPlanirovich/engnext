import { NextRequest, NextResponse } from 'next/server';
import { saveDialogSet, getDialogSets } from '@/utils/dialogUtils';
import { DialogFile } from '@/types/dialog';
import { LessonLevel } from '@/types/lesson';

// Указываем Next.js не кэшировать этот маршрут
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.fileName || !data.dialogData || !data.lessonId || !data.level) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля: fileName, dialogData, lessonId и level' },
        { status: 400 }
      );
    }
    
    // Проверка уровня CEFR
    if (!Object.values(LessonLevel).includes(data.level)) {
      return NextResponse.json(
        { error: `Неверный уровень CEFR. Допустимые значения: ${Object.values(LessonLevel).join(', ')}` },
        { status: 400 }
      );
    }
    
    // Сохранение диалогов
    const result = await saveDialogSet(
      data.fileName, 
      data.dialogData, 
      data.lessonId,
      data.level
    );
    
    if (result.success) {
      console.log(`Dialog for lesson ${data.lessonId} uploaded successfully`);
      
      // Принудительно обновляем список диалогов для очистки кэша
      try {
        const dialogSets = getDialogSets();
        console.log(`Refreshed dialog sets after upload. Found ${dialogSets.length} sets including new upload.`);
        console.log('Dialog set IDs:', dialogSets.map(ds => ds.lessonId));
      } catch (refreshError) {
        console.error('Error refreshing dialog sets after upload:', refreshError);
      }
    }
    
    // Добавляем заголовки для предотвращения кэширования
    return new NextResponse(
      JSON.stringify({
        success: result.success,
        message: result.message,
        timestamp: Date.now()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '-1',
          'Surrogate-Control': 'no-store',
          'Vary': '*'
        }
      }
    );
  } catch (error) {
    console.error('Error uploading dialog set:', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить набор диалогов' },
      { status: 500 }
    );
  }
}
