import { NextRequest, NextResponse } from 'next/server';
import { getDialogSetByLessonId } from '@/utils/dialogUtils';

export async function GET(
  request: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { lessonId } = params;
    
    if (!lessonId) {
      return NextResponse.json(
        { error: 'ID урока не указан' },
        { status: 400 }
      );
    }
    
    // The getDialogSetByLessonId function now handles both formats
    const dialogSet = getDialogSetByLessonId(lessonId);
    
    if (!dialogSet) {
      return NextResponse.json(
        { error: `Диалоги для урока ${lessonId} не найдены` },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, dialogSet });
  } catch (error) {
    console.error('Error getting dialog set:', error);
    return NextResponse.json(
      { error: 'Не удалось получить набор диалогов' },
      { status: 500 }
    );
  }
}
