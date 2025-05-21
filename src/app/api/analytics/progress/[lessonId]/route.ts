import { NextRequest, NextResponse } from 'next/server';
import { getLessonProgress } from '@/utils/serverUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { lessonId } = params;
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    
    // Получаем прогресс урока
    const progress = getLessonProgress(lessonId, profileId || undefined);
    
    return NextResponse.json({ 
      lastExerciseEnglish: progress.lastExerciseEnglish,
      completedSentences: progress.completedSentences 
    });
  } catch (error) {
    console.error('Error getting lesson progress:', error);
    return NextResponse.json(
      { error: 'Failed to get lesson progress' },
      { status: 500 }
    );
  }
}
