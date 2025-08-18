import { NextRequest, NextResponse } from 'next/server';
import { getAuthService } from '../../services/auth';
import { signInSchema } from '../../../../../packages/shared/src/schemas';

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
    const validatedData = signInSchema.parse(body);

    const result = await getAuthService().signIn(validatedData);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Login error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
        timestamp: new Date()
      },
      { status: 401 }
    );
  }
}