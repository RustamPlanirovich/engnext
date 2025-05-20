import { NextRequest, NextResponse } from 'next/server';
import { getProfiles, createProfile, setActiveProfile } from '@/utils/profileUtils';

// GET /api/profiles - Get all profiles
export async function GET() {
  try {
    const profiles = getProfiles();
    return NextResponse.json(profiles);
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profiles' },
      { status: 500 }
    );
  }
}

// POST /api/profiles - Create a new profile
export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Profile name is required' },
        { status: 400 }
      );
    }
    
    const newProfile = createProfile(name);
    return NextResponse.json({ profile: newProfile });
  } catch (error) {
    console.error('Error creating profile:', error);
    return NextResponse.json(
      { error: 'Failed to create profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/profiles - Set active profile
export async function PATCH(request: NextRequest) {
  try {
    const { profileId } = await request.json();
    
    if (!profileId) {
      return NextResponse.json(
        { error: 'Profile ID is required' },
        { status: 400 }
      );
    }
    
    setActiveProfile(profileId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting active profile:', error);
    return NextResponse.json(
      { error: 'Failed to set active profile' },
      { status: 500 }
    );
  }
}
