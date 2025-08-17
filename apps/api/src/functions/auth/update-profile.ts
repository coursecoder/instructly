import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '../../middleware/auth';
import { authService } from '../../services/auth';
import { updateProfileSchema } from '../../../../../packages/shared/src/schemas';

export const runtime = 'edge';

export default async function handler(req: NextRequest) {
  if (req.method !== 'PUT') {
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
        { error: authResult.error },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validatedData = updateProfileSchema.parse(body);

    const result = await authService.updateProfile(authResult.user.id, validatedData);

    return NextResponse.json({
      success: true,
      data: { user: result },
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Profile update failed',
        timestamp: new Date()
      },
      { status: 400 }
    );
  }
}