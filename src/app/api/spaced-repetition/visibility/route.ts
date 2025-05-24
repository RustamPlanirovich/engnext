import { NextRequest, NextResponse } from 'next/server';
import { toggleLessonVisibility } from '@/utils/serverUtils';
import { getActiveProfile } from '@/utils/profileUtils';

// API-эндпоинт для изменения видимости урока
export async function POST(request: NextRequest) {
  try {
    const { lessonId, isHidden, profileId } = await request.json();
    
    // Проверка необходимых параметров
    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
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
    
    // Изменяем видимость урока
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
  } catch (error) {
    console.error('Error toggling lesson visibility:', error);
    return NextResponse.json(
      { error: 'Failed to toggle lesson visibility' },
      { status: 500 }
    );
  }
}
