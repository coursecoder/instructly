import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '../../middleware/auth';
import { getAuthService } from '../../services/auth';

export const runtime = 'edge';

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    // Verify user is authenticated
    const authResult = await authMiddleware(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get access token from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 400 }
      );
    }

    const accessToken = authHeader.substring(7);
    const result = await getAuthService().signOut(accessToken);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Logout error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Logout failed',
        timestamp: new Date()
      },
      { status: 400 }
    );
  }
}