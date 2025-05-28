import { NextRequest, NextResponse } from 'next/server';
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
    // Получаем параметры из запроса
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const profileId = searchParams.get('profileId');
    const lessonId = searchParams.get('lessonId');
    
    console.log(`API priority-sentences: action=${action}, profileId=${profileId}, lessonId=${lessonId}`);
    
    if (!profileId) {
      return NextResponse.json({ error: 'Не указан profileId' }, { status: 400 });
    }
    
    // Используем переданный profileId напрямую
    const activeProfileId = profileId;
    
    console.log(`Используем profileId: ${activeProfileId}`);
    
    // Обновляем аналитику для поддержки приоритетных предложений
    updateAnalyticsForPrioritySentences(activeProfileId);
    
    console.log(`Получен запрос на приоритетные предложения: profileId=${profileId}, lessonId=${lessonId}, action=${action}`);
    
    // Если указан lessonId и action=due-for-review, то получаем предложения для повторения этого урока
    if (lessonId && action === 'due-for-review') {
      try {
        // Используем getSentencesDueForReview для получения предложений для повторения
        console.log(`Вызываем getSentencesDueForReview для урока ${lessonId}`);
        const sentences = getSentencesDueForReview(activeProfileId, lessonId);
        console.log(`Получено ${sentences.length} предложений для повторения`);
        return NextResponse.json({ sentences });
      } catch (err) {
        const error = err as Error;
        console.error(`Ошибка при получении предложений для урока ${lessonId}:`, error);
        return NextResponse.json({ error: `Ошибка при получении предложений: ${error.message}` }, { status: 500 });
      }
    }
    
    // Если указан lessonId и action=get, то получаем все предложения урока
    if (lessonId && action === 'get') {
      try {
        console.log(`Вызываем getPrioritySentences для урока ${lessonId}`);
        const sentences = getPrioritySentences(lessonId, activeProfileId);
        console.log(`Получено ${sentences.length} приоритетных предложений`);
        return NextResponse.json({ sentences });
      } catch (err) {
        const error = err as Error;
        console.error(`Ошибка при получении приоритетных предложений для урока ${lessonId}:`, error);
        return NextResponse.json({ error: `Ошибка при получении приоритетных предложений: ${error.message}` }, { status: 500 });
      }
    }
    
    // Обрабатываем запрос в зависимости от действия
    switch (action) {
      case 'get':
        // Если не указан ID урока, возвращаем ошибку
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
        // Если не указан ID урока, возвращаем ошибку
        return NextResponse.json(
          { error: 'Lesson ID is required for this action' },
          { status: 400 }
        );
        
      case 'due-for-review':
        // Получаем все предложения, которые нужно повторить сегодня
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
