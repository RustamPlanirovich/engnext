import { NextRequest, NextResponse } from 'next/server';
import { getAnalytics, createAnalyticsBackup } from '@/utils/serverUtils';

export async function GET(request: NextRequest) {
  try {
    // Получаем profileId из URL параметров запроса
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    
    const analytics = getAnalytics(profileId || undefined);
    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error getting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, profileId } = await request.json();
    
    if (action === 'backup') {
      const result = createAnalyticsBackup(profileId);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.message },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ message: result.message });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing analytics action:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics action' },
      { status: 500 }
    );
  }
}
