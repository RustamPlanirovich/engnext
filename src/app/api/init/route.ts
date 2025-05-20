import { NextResponse } from 'next/server';
import { copyLesson1ToLessonsDir, ensureDirectories } from '@/utils/serverUtils';

export async function GET() {
  try {
    // Ensure data directories exist
    ensureDirectories();
    
    // Copy lesson1.json to lessons directory if it doesn't exist there
    copyLesson1ToLessonsDir();
    
    return NextResponse.json({ message: 'Initialization successful' });
  } catch (error) {
    console.error('Error during initialization:', error);
    return NextResponse.json(
      { error: 'Failed to initialize application' },
      { status: 500 }
    );
  }
}
