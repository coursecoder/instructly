import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '../../middleware/auth';

export const runtime = 'edge';

export default async function handler(req: NextRequest) {
  if (req.method !== 'GET') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    // Verify user is authenticated and get user profile
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { user: authResult.user },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user profile',
        timestamp: new Date()
      },
      { status: 500 }
    );
  }
}