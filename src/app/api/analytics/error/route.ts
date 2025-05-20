import { NextRequest, NextResponse } from 'next/server';
import { addError } from '@/utils/serverUtils';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.lessonId || !data.sentence || !data.sentence.russian || !data.sentence.english) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    addError(data.lessonId, {
      russian: data.sentence.russian,
      english: data.sentence.english
    }, data.profileId);
    
    return NextResponse.json({ message: 'Error recorded successfully' });
  } catch (error) {
    console.error('Error recording exercise error:', error);
    return NextResponse.json(
      { error: 'Failed to record error' },
      { status: 500 }
    );
  }
}
