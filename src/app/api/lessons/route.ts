import { NextResponse } from 'next/server';
import { getLessons, getLesson, copyLesson1ToLessonsDir } from '@/utils/serverUtils';

// Prevent caching in production
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Ensure lesson1.json is copied to the lessons directory
    copyLesson1ToLessonsDir();
    
    const lessonIds = getLessons();
    
    // Add lesson1.json from root if it exists and not already in the list
    if (!lessonIds.includes('lesson1')) {
      lessonIds.unshift('lesson1');
    }
    
    // Преобразуем ID в объекты с дополнительным полем для сортировки
    const lessons = lessonIds.map(id => {
      const lessonData = getLesson(id);
      // Извлекаем числовой номер урока для правильной сортировки
      const lessonNumber = parseInt(id.replace(/\D/g, '')) || 0;
      
      return {
        id,
        title: lessonData?.concept || `Урок ${id}`,
        description: lessonData?.explanation?.substring(0, 150) + '...' || 'Описание отсутствует',
        sortOrder: lessonNumber // Добавляем поле для сортировки
      };
    })
    // Сортируем по числовому порядку
    .sort((a, b) => a.sortOrder - b.sortOrder)
    // Удаляем вспомогательное поле из результата
    .map(({ sortOrder, ...rest }) => rest);
    
    return NextResponse.json({ lessons }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error) {
    console.error('Error getting lessons:', error);
    return NextResponse.json(
      { error: 'Failed to get lessons' },
      { status: 500 }
    );
  }
}
