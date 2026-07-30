import { NextRequest, NextResponse } from 'next/server';

import { getEmployee, getPublicUser } from '@/lib/hr-data';
import { createSessionToken, sessionConfig, verifySessionToken } from '@/lib/session';

export async function GET(request: NextRequest) {
  const employee = verifySessionToken(request.cookies.get(sessionConfig.name)?.value);
  if (!employee) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  return NextResponse.json({ user: getPublicUser(employee) });
}

export async function POST(request: NextRequest) {
  const { userId } = (await request.json()) as { userId?: string };
  const employee = userId ? getEmployee(userId) : null;
  if (!employee) return NextResponse.json({ error: 'Invalid demo identity' }, { status: 400 });

  const response = NextResponse.json({ user: getPublicUser(employee) });
  response.cookies.set(sessionConfig.name, createSessionToken(employee.id), {
    httpOnly: true,
    sameSite: 'strict',
    secure: request.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: sessionConfig.maxAge,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionConfig.name, '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: request.nextUrl.protocol === 'https:',
    path: '/',
    maxAge: 0,
  });
  return response;
}
