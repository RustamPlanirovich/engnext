import { NextRequest, NextResponse } from 'next/server';
import { markLessonCompleted } from '@/utils/serverUtils';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.lessonId) {
      return NextResponse.json(
        { error: 'Missing required field: lessonId' },
        { status: 400 }
      );
    }
    console.log(data.lessonId, data.profileId);
    markLessonCompleted(data.lessonId, data.profileId);
    
    return NextResponse.json({ message: 'Lesson marked as completed successfully' });
  } catch (error) {
    console.error('Error marking lesson as completed:', error);
    return NextResponse.json(
      { error: 'Failed to mark lesson as completed' },
      { status: 500 }
    );
  }
}
