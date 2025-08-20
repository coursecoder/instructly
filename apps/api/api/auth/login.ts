import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Temporary placeholder for deployment
  return res.status(200).json({
    success: true,
    message: 'Auth endpoint placeholder - implementation in progress',
    timestamp: new Date()
  });
}