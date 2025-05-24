import { NextRequest, NextResponse } from 'next/server';
import { getLessonSpacedRepetitionInfo } from '@/utils/serverUtils';
import { getActiveProfile } from '@/utils/profileUtils';

// API-эндпоинт для получения информации о повторении урока
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
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
    
    // Получаем информацию о повторении урока
    const repetitionInfo = getLessonSpacedRepetitionInfo(id, profileId);
    
    return NextResponse.json({ 
      success: true, 
      repetitionInfo 
    });
  } catch (error) {
    console.error('Error fetching lesson repetition info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson repetition info' },
      { status: 500 }
    );
  }
}
