import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics, updateLessonStatuses } from '@/utils/serverUtils';
import { getActiveProfile } from '@/utils/profileUtils';

// API-эндпоинт для получения всех уроков с информацией о повторении
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
    
    // Получаем аналитику, которая содержит информацию о повторении
    const analytics = getAnalytics(profileId);
    const lessons = analytics.spacedRepetition || [];
    
    return NextResponse.json({ 
      success: true, 
      lessons 
    });
  } catch (error) {
    console.error('Error fetching all lessons with repetition info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lessons with repetition info' },
      { status: 500 }
    );
  }
}
