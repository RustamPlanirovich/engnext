import { NextRequest, NextResponse } from 'next/server';
import { 
  getLessonSpacedRepetitionInfo, 
  toggleLessonVisibility, 
  getLessonsDueForReview, 
  getHiddenLessons, 
  getAnalytics,
  updateLessonStatuses
} from '@/utils/serverUtils';
import { getActiveProfile } from '@/utils/profileUtils';

// Единый API-эндпоинт для всех операций с системой интервального повторения
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const lessonId = searchParams.get('lessonId');
    const profileId = searchParams.get('profileId') || undefined;
    
    // Проверка доступа
    let activeProfileId = profileId;
    if (!activeProfileId) {
      const activeProfile = getActiveProfile();
      if (!activeProfile) {
        return NextResponse.json(
          { error: 'Unauthorized: No active profile' },
          { status: 401 }
        );
      }
      activeProfileId = activeProfile.id;
    }
    
    // Обновляем статусы уроков (проверяем, не пора ли повторить какие-то уроки)
    updateLessonStatuses(activeProfileId);
    
    // Выполняем действие в зависимости от параметра action
    switch (action) {
      case 'info':
        // Получаем информацию о повторении конкретного урока
        if (!lessonId) {
          return NextResponse.json(
            { error: 'Lesson ID is required' },
            { status: 400 }
          );
        }
        const repetitionInfo = getLessonSpacedRepetitionInfo(lessonId, activeProfileId);
        return NextResponse.json({ 
          success: true, 
          repetitionInfo 
        });
        
      case 'due-for-review':
        // Получаем список уроков для повторения
        const dueForReview = getLessonsDueForReview(activeProfileId);
        return NextResponse.json({ 
          success: true, 
          lessons: dueForReview 
        });
        
      case 'hidden':
        // Получаем список скрытых уроков
        const hiddenLessons = getHiddenLessons(activeProfileId);
        return NextResponse.json({ 
          success: true, 
          lessons: hiddenLessons 
        });
        
      case 'all':
        // Получаем все уроки с информацией о повторении
        const analytics = getAnalytics(activeProfileId);
        const allLessons = analytics.spacedRepetition || [];
        return NextResponse.json({ 
          success: true, 
          lessons: allLessons 
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in spaced repetition API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// API-эндпоинт для изменения видимости урока
export async function POST(request: NextRequest) {
  try {
    const { action, lessonId, isHidden, profileId } = await request.json();
    
    // Проверка необходимых параметров
    if (!action || !lessonId) {
      return NextResponse.json(
        { error: 'Action and Lesson ID are required' },
        { status: 400 }
      );
    }
    
    // Проверка доступа
    let activeProfileId = profileId;
    if (!activeProfileId) {
      const activeProfile = getActiveProfile();
      if (!activeProfile) {
        return NextResponse.json(
          { error: 'Unauthorized: No active profile' },
          { status: 401 }
        );
      }
      activeProfileId = activeProfile.id;
    }
    
    // Выполняем действие в зависимости от параметра action
    switch (action) {
      case 'toggle-visibility':
        // Изменяем видимость урока
        if (isHidden === undefined) {
          return NextResponse.json(
            { error: 'isHidden parameter is required' },
            { status: 400 }
          );
        }
        
        const repetitionInfo = toggleLessonVisibility(lessonId, isHidden, activeProfileId);
        
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
        
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in spaced repetition API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
