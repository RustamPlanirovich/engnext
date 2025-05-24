import { NextRequest, NextResponse } from 'next/server';
import { getLessonsDueForReview, updateLessonStatuses } from '@/utils/serverUtils';
import { getActiveProfile } from '@/utils/profileUtils';

// API-эндпоинт для получения списка уроков, которые нужно повторить
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const profileId = searchParams.get('profileId') || undefined;
    
    // Проверка доступа
    if (!profileId) {
      const activeProfile = getActiveProfile();
      if (!activeProfile) {
        return NextResponse.json(
          { error: 'Unauthorized: No active profile' },
          { status: 401 }
        );
      }
    }
    
    // Обновляем статусы уроков (проверяем, не пора ли повторить какие-то уроки)
    updateLessonStatuses(profileId);
    
    // Получаем список уроков для повторения
    const lessons = getLessonsDueForReview(profileId);
    
    return NextResponse.json({ 
      success: true, 
      lessons 
    });
  } catch (error) {
    console.error('Error fetching lessons due for review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons due for review' },
      { status: 500 }
    );
  }
}
