import { NextResponse } from 'next/server';
import { deleteProfile, getProfile } from '@/utils/profileUtils';

// GET /api/profiles/[profileId] - Get a specific profile
export async function GET(
  request: Request,
  { params }: { params: { profileId: string } }
) {
  try {
    const { profileId } = params;
    const profile = getProfile(profileId);
    
    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ profile });
  } catch (error) {
    console.error(`Error fetching profile ${params.profileId}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// DELETE /api/profiles/[profileId] - Delete a profile
export async function DELETE(
  request: Request,
  { params }: { params: { profileId: string } }
) {
  try {
    const { profileId } = params;
    const { searchParams } = new URL(request.url);
    const requestingProfileId = searchParams.get('requestingProfileId');
    
    if (!requestingProfileId) {
      return NextResponse.json(
        { error: 'Необходимо указать идентификатор запрашивающего профиля' },
        { status: 400 }
      );
    }
    
    const result = deleteProfile(profileId, requestingProfileId);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ 
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error(`Error deleting profile ${params.profileId}:`, error);
    return NextResponse.json(
      { error: 'Failed to delete profile' },
      { status: 500 }
    );
  }
}
