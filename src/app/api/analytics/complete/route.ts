import { NextRequest, NextResponse } from 'next/server';
import { markLessonCompleted, toggleLessonVisibility, getLessonSpacedRepetitionInfo } from '@/utils/serverUtils';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { lessonId, profileId, action, isHidden } = data;
    
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Missing required field: lessonId' },
        { status: 400 }
      );
    }
    
    // Обработка различных действий
    if (action === 'toggle-visibility' && isHidden !== undefined) {
      // Изменение видимости урока
      console.log(`Toggling visibility for lesson ${lessonId}, isHidden: ${isHidden}`);
      const repetitionInfo = toggleLessonVisibility(lessonId, isHidden, profileId);
      
      if (!repetitionInfo) {
        return NextResponse.json(
          { error: 'Failed to toggle lesson visibility' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        repetitionInfo 
      });
    } else {
      // По умолчанию отмечаем урок как завершенный
      console.log(`Marking lesson ${lessonId} as completed for profile ${profileId}`);
      markLessonCompleted(lessonId, profileId);
      
      // Получаем обновленную информацию о повторении
      const repetitionInfo = getLessonSpacedRepetitionInfo(lessonId, profileId);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Lesson marked as completed successfully',
        repetitionInfo
      });
    }
  } catch (error) {
    console.error('Error processing lesson action:', error);
    return NextResponse.json(
      { error: 'Failed to process lesson action' },
      { status: 500 }
    );
  }
}
