import { NextRequest, NextResponse } from 'next/server';
import { saveDialogSet } from '@/utils/dialogUtils';
import { DialogFile } from '@/types/dialog';
import { LessonLevel } from '@/types/lesson';

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
    
    return NextResponse.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Error uploading dialog set:', error);
    return NextResponse.json(
      { error: 'Не удалось загрузить набор диалогов' },
      { status: 500 }
    );
  }
}
