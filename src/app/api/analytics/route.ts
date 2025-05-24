import { NextRequest, NextResponse } from 'next/server';
import { 
  getAnalytics, 
  createAnalyticsBackup, 
  getLessonSpacedRepetitionInfo, 
  toggleLessonVisibility, 
  getLessonsDueForReview, 
  getHiddenLessons,
  updateLessonStatuses
} from '@/utils/serverUtils';

export async function GET(request: NextRequest) {
  try {
    // Получаем параметры из URL
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const action = searchParams.get('action');
    const lessonId = searchParams.get('lessonId');
    
    // Если есть действие, связанное с системой интервального повторения
    if (action) {
      // Обновляем статусы уроков (проверяем, не пора ли повторить какие-то уроки)
      updateLessonStatuses(profileId || undefined);
      
      switch (action) {
        case 'spaced-repetition-info':
          // Получаем информацию о повторении конкретного урока
          if (!lessonId) {
            return NextResponse.json(
              { error: 'Lesson ID is required' },
              { status: 400 }
            );
          }
          const repetitionInfo = getLessonSpacedRepetitionInfo(lessonId, profileId || undefined);
          return NextResponse.json({ 
            success: true, 
            repetitionInfo 
          });
          
        case 'due-for-review':
          // Получаем список уроков для повторения
          const dueForReview = getLessonsDueForReview(profileId || undefined);
          return NextResponse.json({ 
            success: true, 
            lessons: dueForReview 
          });
          
        case 'hidden-lessons':
          // Получаем список скрытых уроков
          const hiddenLessons = getHiddenLessons(profileId || undefined);
          return NextResponse.json({ 
            success: true, 
            lessons: hiddenLessons 
          });
          
        case 'all-lessons-repetition':
          // Получаем все уроки с информацией о повторении
          const analytics = getAnalytics(profileId || undefined);
          const allLessons = analytics.spacedRepetition || [];
          return NextResponse.json({ 
            success: true, 
            lessons: allLessons 
          });
      }
    }
    
    // По умолчанию возвращаем всю аналитику
    const analytics = getAnalytics(profileId || undefined);
    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error getting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, profileId, lessonId, isHidden } = await request.json();
    
    if (action === 'backup') {
      const result = createAnalyticsBackup(profileId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ message: result.message });
    }
    
    // Обработка действий системы интервального повторения
    if (action === 'toggle-visibility') {
      // Проверка необходимых параметров
      if (!lessonId || isHidden === undefined) {
        return NextResponse.json(
          { error: 'Lesson ID and isHidden are required' },
          { status: 400 }
        );
      }
      
      // Изменяем видимость урока
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
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing analytics action:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics action' },
      { status: 500 }
    );
  }
}
