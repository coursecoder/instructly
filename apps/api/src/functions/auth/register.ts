import { NextRequest, NextResponse } from 'next/server';
import { authService } from '../../services/auth';
import { signUpSchema } from '../../../../../packages/shared/src/schemas';

export const runtime = 'edge';

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json(
      { error: 'Method not allowed' },
      { status: 405 }
    );
  }

  try {
    const body = await req.json();
    const validatedData = signUpSchema.parse(body);

    const result = await authService.signUp(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
        timestamp: new Date()
      },
      { status: 400 }
    );
  }
}