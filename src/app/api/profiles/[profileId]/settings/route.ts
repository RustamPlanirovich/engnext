import { NextRequest, NextResponse } from 'next/server';
import { getProfile, updateProfileSettings } from '@/utils/profileUtils';

// GET /api/profiles/[profileId]/settings - Get profile settings
export async function GET(
  request: Request,
  { params }: { params: { profileId: string } }
) {
  try {
    const { profileId } = params;
    const profile = getProfile(profileId);
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Профиль не найден' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ settings: profile.settings || {} });
  } catch (error) {
    console.error(`Error fetching profile settings ${params.profileId}:`, error);
    return NextResponse.json(
      { error: 'Не удалось получить настройки профиля' },
      { status: 500 }
    );
  }
}

// PATCH /api/profiles/[profileId]/settings - Update profile settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: { profileId: string } }
) {
  try {
    const { profileId } = params;
    const data = await request.json();
    
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Неверный формат данных' },
        { status: 400 }
      );
    }
    
    const profile = updateProfileSettings(profileId, data);
    
    return NextResponse.json({ 
      success: true,
      message: 'Настройки профиля успешно обновлены',
      settings: profile.settings
    });
  } catch (error) {
    console.error(`Error updating profile settings ${params.profileId}:`, error);
    return NextResponse.json(
      { error: 'Не удалось обновить настройки профиля' },
      { status: 500 }
    );
  }
}
