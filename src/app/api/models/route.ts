import { NextRequest, NextResponse } from 'next/server';

import { fetchKonsoleModels } from '@/lib/konsole';
import { getRuntimeKonsoleConfig, setRuntimeKonsoleCredential, setRuntimeKonsoleModel } from '@/lib/runtime-config';
import { sessionConfig, verifySessionToken } from '@/lib/session';

export async function GET(req: NextRequest) {
  const user = verifySessionToken(req.cookies.get(sessionConfig.name)?.value);
  if (!user || user.role !== 'SYSTEM_ADMIN') return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
  const config = getRuntimeKonsoleConfig();

  return NextResponse.json({
    status: config.apiKey ? 'configured' : 'setup_required',
    baseUrl: config.baseUrl,
    defaultModel: config.model,
    hasApiKey: Boolean(config.apiKey),
    runtime: config.runtime,
  });
}

export async function POST(req: NextRequest) {
  const user = verifySessionToken(req.cookies.get(sessionConfig.name)?.value);
  if (!user || user.role !== 'SYSTEM_ADMIN') return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });

  const body = (await req.json()) as { apiKey?: string; baseUrl?: string; model?: string };
  const current = getRuntimeKonsoleConfig();
  const apiKey = body.apiKey?.trim() || current.apiKey;
  const baseUrl = body.baseUrl?.trim() || current.baseUrl;
  if (!apiKey) return NextResponse.json({ error: 'Enter a Konsole API key.' }, { status: 400 });
  if (!/^https:\/\//i.test(baseUrl)) return NextResponse.json({ error: 'The Konsole base URL must use HTTPS.' }, { status: 400 });

  const result = await fetchKonsoleModels(apiKey, baseUrl);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 502 });

  const defaultModel = body.model || result.models?.[0]?.id || current.model;
  setRuntimeKonsoleCredential(apiKey, baseUrl, defaultModel);
  return NextResponse.json({ ok: true, models: result.models || [], defaultModel });
}

export async function PUT(req: NextRequest) {
  const user = verifySessionToken(req.cookies.get(sessionConfig.name)?.value);
  if (!user || user.role !== 'SYSTEM_ADMIN') return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
  const { model } = (await req.json()) as { model?: string };
  if (!model?.trim()) return NextResponse.json({ error: 'Choose an approved model.' }, { status: 400 });
  if (!getRuntimeKonsoleConfig().apiKey) return NextResponse.json({ error: 'Configure a Konsole credential first.' }, { status: 400 });
  setRuntimeKonsoleModel(model.trim());
  return NextResponse.json({ ok: true });
}
