import { NextRequest, NextResponse } from 'next/server';
import { saveLessonProgress } from '@/utils/serverUtils';

export async function POST(request: NextRequest) {
  try {
    // Получаем параметры из запроса
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    
    // Получаем данные из тела запроса
    const { lessonId, lastExerciseEnglish, sentenceId } = await request.json();
    
    if (!lessonId || !lastExerciseEnglish) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Сохраняем прогресс урока
    saveLessonProgress(lessonId, lastExerciseEnglish, profileId || undefined, sentenceId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving lesson progress:', error);
    return NextResponse.json(
      { error: 'Failed to save lesson progress' },
      { status: 500 }
    );
  }
}
