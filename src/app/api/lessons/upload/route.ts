import { NextRequest, NextResponse } from 'next/server';
import { saveLesson } from '@/utils/serverUtils';
import { LessonLevel } from '@/types/lesson';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.fileName || !data.lessonData) {
      return NextResponse.json(
        { error: 'Missing required fields: fileName and lessonData' },
        { status: 400 }
      );
    }
    
    // Validate JSON
    try {
      JSON.parse(data.lessonData);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      );
    }
    
    // Проверка уровня CEFR, если он указан
    let level = data.level;
    if (level && !Object.values(LessonLevel).includes(level)) {
      return NextResponse.json(
        { error: `Неверный уровень CEFR. Допустимые значения: ${Object.values(LessonLevel).join(', ')}` },
        { status: 400 }
      );
    }
    
    const result = await saveLesson(data.fileName, data.lessonData, level);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('Error uploading lesson:', error);
    return NextResponse.json(
      { error: 'Failed to upload lesson' },
      { status: 500 }
    );
  }
}
