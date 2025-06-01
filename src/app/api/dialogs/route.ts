import { NextRequest, NextResponse } from 'next/server';
import { getDialogSets } from '@/utils/dialogUtils';

// Указываем Next.js не кэшировать этот маршрут
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    console.log('GET /api/dialogs - Fetching dialog sets');
    console.log('Request URL:', request.url);
    
    // Добавляем случайный параметр для предотвращения кэширования
    const timestamp = Date.now();
    console.log('Timestamp for cache busting:', timestamp);
    
    // Получаем свежие данные диалогов
    const dialogSets = getDialogSets();
    console.log(`Returning ${dialogSets.length} dialog sets with IDs:`, dialogSets.map(ds => ds.lessonId));
    
    // Добавляем заголовки для предотвращения кэширования
    return new NextResponse(
      JSON.stringify({ success: true, dialogSets, timestamp }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '-1',
          'Surrogate-Control': 'no-store',
          'Vary': '*'
        }
      }
    );
  } catch (error) {
    console.error('Error getting dialog sets:', error);
    return NextResponse.json(
      { error: 'Не удалось получить наборы диалогов' },
      { status: 500 }
    );
  }
}
