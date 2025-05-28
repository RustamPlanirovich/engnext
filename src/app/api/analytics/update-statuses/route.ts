import { NextRequest, NextResponse } from 'next/server';
import { updateLessonStatuses } from '@/utils/serverUtils';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { profileId } = data;
    
    console.log(`API: Updating lesson statuses for profile ${profileId || 'default'}`);
    
    // Обновляем статусы уроков
    const updatedLessons = updateLessonStatuses(profileId || undefined);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Lesson statuses updated successfully',
      updatedLessons
    });
  } catch (error) {
    console.error('Error updating lesson statuses:', error);
    return NextResponse.json(
      { error: 'Failed to update lesson statuses' },
      { status: 500 }
    );
  }
}
