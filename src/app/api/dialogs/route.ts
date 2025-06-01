import { NextRequest, NextResponse } from 'next/server';
import { getDialogSets } from '@/utils/dialogUtils';

export async function GET(request: NextRequest) {
  try {
    const dialogSets = getDialogSets();
    return NextResponse.json({ success: true, dialogSets });
  } catch (error) {
    console.error('Error getting dialog sets:', error);
    return NextResponse.json(
      { error: 'Не удалось получить наборы диалогов' },
      { status: 500 }
    );
  }
}
