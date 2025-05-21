import { NextRequest, NextResponse } from 'next/server';
import { removeError } from '@/utils/serverUtils';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data.lessonId || !data.sentence || !data.sentence.russian || !data.sentence.english) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    console.log("Rustam", JSON.stringify(data, null, 2));
    removeError(data.lessonId, {
      russian: data.sentence.russian,
      english: data.sentence.english
    }, data.id, data.profileId);
    
    return NextResponse.json({ message: 'Error removed successfully' });
  } catch (error) {
    console.error('Error removing exercise error:', error);
    return NextResponse.json(
      { error: 'Failed to remove error' },
      { status: 500 }
    );
  }
}
