import { NextRequest, NextResponse } from 'next/server';
import { getHiddenLessons } from '@/utils/serverUtils';
import { getActiveProfile } from '@/utils/profileUtils';

export const dynamic = 'force-dynamic';

// API-эндпоинт для получения списка скрытых уроков
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
    
    // Получаем список скрытых уроков
    const lessons = getHiddenLessons(profileId);
    
    return NextResponse.json({ 
      success: true, 
      lessons 
    });
  } catch (error) {
    console.error('Error fetching hidden lessons:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hidden lessons' },
      { status: 500 }
    );
  }
}
