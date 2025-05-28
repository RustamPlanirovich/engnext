import { NextRequest, NextResponse } from 'next/server';
import { markLessonRepeated } from '@/utils/serverUtils';

export async function POST(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { lessonId } = params;
    const data = await request.json();
    const { profileId, errorCount = 0 } = data;
    
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing required parameter: lessonId' },
        { status: 400 }
      );
    }
    
    console.log(`API: Marking lesson ${lessonId} as repeated for profile ${profileId || 'default'}, errorCount: ${errorCount}`);
    
    // Отмечаем урок как повторенный и получаем информацию о следующем повторении
    const result = await markLessonRepeated(lessonId, errorCount, profileId);
    
    return NextResponse.json({ 
      success: true, 
      message: result.isComplete 
        ? 'Цикл повторений завершен' 
        : 'Lesson marked as repeated successfully',
      nextReviewDate: result.nextReviewDate,
      isComplete: result.isComplete
    });
  } catch (error) {
    console.error('Error marking lesson as repeated:', error);
    return NextResponse.json(
      { error: 'Failed to mark lesson as repeated' },
      { status: 500 }
    );
  }
}
