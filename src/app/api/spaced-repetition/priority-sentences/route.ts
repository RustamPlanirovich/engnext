import { NextRequest, NextResponse } from 'next/server';
import { getActiveProfile } from '@/utils/profileUtils';
import { 
  getPrioritySentences, 
  savePrioritySentences, 
  getSentencesDueForReview,
  updateAnalyticsForPrioritySentences
} from '@/utils/spacedRepetitionUtils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/spaced-repetition/priority-sentences
 * 
 * Получает приоритетные предложения для повторения
 * 
 * Query параметры:
 * - lessonId: ID урока (опционально)
 * - profileId: ID профиля (опционально)
 * - action: действие (get, save, due-for-review)
 */
export async function GET(request: NextRequest) {
  try {
    // Получаем параметры запроса
    const url = new URL(request.url);
    const lessonId = url.searchParams.get('lessonId');
    const profileId = url.searchParams.get('profileId');
    const action = url.searchParams.get('action') || 'get';
    
    // Получаем активный профиль
    const activeProfile = await getActiveProfile();
    const activeProfileId = profileId || activeProfile?.id;
    
    // Проверяем наличие активного профиля
    if (!activeProfileId) {
      return NextResponse.json(
        { error: 'No active profile' },
        { status: 400 }
      );
    }
    
    // Обновляем аналитику для поддержки приоритетных предложений
    updateAnalyticsForPrioritySentences(activeProfileId);
    
    // Обрабатываем запрос в зависимости от действия
    switch (action) {
      case 'get':
        // Если указан ID урока, получаем предложения для этого урока
        if (lessonId) {
          const sentences = getPrioritySentences(lessonId, activeProfileId);
          return NextResponse.json({ sentences });
        }
        // Иначе возвращаем ошибку
        return NextResponse.json(
          { error: 'Lesson ID is required for this action' },
          { status: 400 }
        );
        
      case 'save':
        // Если указан ID урока, сохраняем приоритетные предложения
        if (lessonId) {
          const sentences = savePrioritySentences(lessonId, activeProfileId);
          return NextResponse.json({ sentences });
        }
        // Иначе возвращаем ошибку
        return NextResponse.json(
          { error: 'Lesson ID is required for this action' },
          { status: 400 }
        );
        
      case 'due-for-review':
        // Получаем предложения, которые нужно повторить сегодня
        const sentencesDueForReview = getSentencesDueForReview(activeProfileId);
        return NextResponse.json({ sentences: sentencesDueForReview });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in priority sentences API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
