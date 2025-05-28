import { NextRequest, NextResponse } from 'next/server';
import { completeReviewLesson } from '@/utils/serverUtils';

/**
 * API-эндпоинт для обработки завершения повторения урока
 * 
 * @param request - Запрос
 * @returns Ответ с обновленной информацией о повторении
 */
export async function POST(request: NextRequest) {
  try {
    // Получаем данные из запроса
    const data = await request.json();
    const { lessonId, errorCount = 0, profileId } = data;
    
    console.log(`Получен запрос на завершение повторения: lessonId=${lessonId}, errorCount=${errorCount}, profileId=${profileId}`);
    
    // Проверяем наличие обязательных параметров
    if (!lessonId) {
      return NextResponse.json({ error: 'Не указан ID урока' }, { status: 400 });
    }
    
    if (!profileId) {
      return NextResponse.json({ error: 'Не указан ID профиля' }, { status: 400 });
    }
    
    // Используем переданный profileId напрямую
    const activeProfileId = profileId;
    
    // Обрабатываем завершение повторения урока
    const updatedInfo = completeReviewLesson(lessonId, errorCount, activeProfileId);
    
    if (!updatedInfo) {
      return NextResponse.json({ error: 'Не удалось обновить информацию о повторении' }, { status: 500 });
    }
    
    // Возвращаем обновленную информацию
    return NextResponse.json({ 
      success: true, 
      message: `Урок успешно повторен. Следующее повторение: ${new Date(updatedInfo.nextReviewDate).toLocaleDateString()}`,
      nextReviewDate: updatedInfo.nextReviewDate
    });
  } catch (error) {
    console.error('Ошибка при обработке завершения повторения урока:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
