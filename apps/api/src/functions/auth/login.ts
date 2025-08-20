import { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthService } from '../../services/auth';
import { signInSchema } from '../../types/shared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const validatedData = signInSchema.parse(req.body);

    const result = await getAuthService().signIn(validatedData);

    return res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Login error:', error);
    
    return res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
      timestamp: new Date()
    });
  }
}