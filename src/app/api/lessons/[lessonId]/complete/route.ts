import { NextRequest, NextResponse } from 'next/server';
import { markLessonCompleted } from '@/utils/serverUtils';

export async function POST(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { lessonId } = params;
    const data = await request.json();
    const { profileId } = data;
    
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing required parameter: lessonId' },
        { status: 400 }
      );
    }
    
    console.log(`API: Marking lesson ${lessonId} as completed for profile ${profileId || 'default'}`);
    
    console.log(`Отмечаем урок ${lessonId} как завершенный для профиля ${profileId || 'default'}`);
    
    // Отмечаем урок как завершенный и получаем дату следующего повторения
    const result = await markLessonCompleted(lessonId, profileId);
    
    console.log(`Урок ${lessonId} отмечен как завершенный. Следующее повторение: ${new Date(result.nextReviewDate).toLocaleDateString()}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Lesson marked as completed successfully',
      nextReviewDate: result.nextReviewDate
    });
  } catch (error) {
    console.error('Error marking lesson as completed:', error);
    return NextResponse.json(
      { error: 'Failed to mark lesson as completed' },
      { status: 500 }
    );
  }
}
