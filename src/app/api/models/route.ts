import { NextRequest, NextResponse } from 'next/server';

const KONSOLE_BASE_URL = process.env.KONSOLE_BASE_URL || 'https://api.konsole.one/v1';
const DEFAULT_MODEL = process.env.KONSOLE_MODEL_ID || 'e30061c0dbd41052cc6f849b42e9ca8112170d9ef43ce7fde9f89faf86eee207';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const clientApiKey = authHeader ? authHeader.replace(/^Bearer\s+/i, '') : null;
  const apiKey = clientApiKey || process.env.KONSOLE_API_KEY;

  return NextResponse.json({
    status: 'online',
    baseUrl: KONSOLE_BASE_URL,
    defaultModel: DEFAULT_MODEL,
    hasApiKey: Boolean(apiKey && apiKey.trim() !== ''),
  });
}
