import { NextRequest, NextResponse } from 'next/server';
import { getLesson, deleteLesson } from '@/utils/serverUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { lessonId } = params;
    const lesson = getLesson(lessonId);
    
    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ lesson });
  } catch (error) {
    console.error(`Error getting lesson ${params.lessonId}:`, error);
    return NextResponse.json(
      { error: 'Failed to get lesson' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { lessonId } = params;
    
    // Don't allow deleting lesson1.json
    if (lessonId === 'lesson1') {
      return NextResponse.json(
        { error: 'Cannot delete the base lesson' },
        { status: 403 }
      );
    }
    
    const result = deleteLesson(lessonId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error(`Error deleting lesson ${params.lessonId}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete lesson' },
      { status: 500 }
    );
  }
}
