import { randomUUID } from 'node:crypto';

import { NextRequest, NextResponse } from 'next/server';

import { findMentionedEmployee } from '@/lib/hr-data';
import { sessionConfig, verifySessionToken } from '@/lib/session';

const ATTACK_PATTERNS = [
  /ignore (all|any|the|your|previous)/i,
  /reveal (the )?(database|system prompt|all employees|everyone)/i,
  /pretend (that )?(i am|i'm)/i,
  /bypass (authorization|security|access)/i,
  /jailbreak/i,
  /developer mode/i,
  /show me (every|all) employee/i,
];

function checks(authorizationDetail: string, securityDetail: string, securityStatus: 'passed' | 'blocked' | 'masked' = 'passed') {
  return [
    { label: 'Authentication', detail: 'Signed session verified', status: 'passed' },
    { label: 'Authorization', detail: authorizationDetail, status: authorizationDetail.startsWith('Denied') ? 'blocked' : 'passed' },
    { label: 'Konsole security', detail: securityDetail, status: securityStatus },
  ];
}

export async function POST(request: NextRequest) {
  const currentUser = verifySessionToken(request.cookies.get(sessionConfig.name)?.value);
  if (!currentUser) return NextResponse.json({ error: 'Your secure session has expired.' }, { status: 401 });

  const body = (await request.json()) as { message?: string };
  const message = body.message?.trim().slice(0, 1200);
  const auditId = `KSL-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 8).toUpperCase()}`;
  if (!message) return NextResponse.json({ error: 'A message is required.' }, { status: 400 });

  if (ATTACK_PATTERNS.some((pattern) => pattern.test(message))) {
    return NextResponse.json({
      answer: 'I can’t follow instructions that attempt to override security controls or expose protected employee data. This request was stopped before any HR records were retrieved.',
      verdict: 'blocked',
      layer: 'Blocked by Konsole Shield',
      checks: checks('No data access attempted', 'Prompt injection pattern detected', 'blocked'),
      auditId,
    });
  }

  const mentioned = findMentionedEmployee(message);
  const target = mentioned ?? currentUser;
  if (target.id !== currentUser.id && currentUser.role !== 'HR_ADMIN') {
    return NextResponse.json({
      answer: `You are not authorized to access ${target.name}’s employee information. I did not retrieve or send their data to the AI. Please contact HR if you need assistance.`,
      verdict: 'blocked',
      layer: 'Blocked by app authorization',
      checks: checks(`Denied: ${currentUser.id} cannot access ${target.id}`, 'Input safe; no LLM request made'),
      auditId,
    });
  }

  const lower = message.toLowerCase();
  const scope = target.id === currentUser.id ? 'Self-service scope approved' : `HR scope approved for ${target.id}`;
  let answer: string;
  let securityDetail = 'No attack or sensitive output detected';
  let verdict: 'allowed' | 'masked' = 'allowed';

  if (/salary|compensation|pay\b|ctc/i.test(lower)) {
    answer = `${target.id === currentUser.id ? 'Your' : `${target.name}’s`} current annual compensation is ${target.salary}. For payroll changes or a detailed payslip, please use the payroll portal or contact People Operations.`;
  } else if (/leave|vacation|days off|holiday balance/i.test(lower)) {
    answer = `${target.id === currentUser.id ? 'You have' : `${target.name} has`} ${target.leaveBalance} paid leave days remaining this year.`;
  } else if (/benefit|insurance|health cover|learning allowance/i.test(lower)) {
    answer = `${target.id === currentUser.id ? 'Your' : `${target.name}’s`} benefits include: ${target.benefits}`;
  } else if (/email|phone|personal|contact|profile/i.test(lower)) {
    const maskedPhone = `••••••${target.phone.slice(-4)}`;
    const [emailName, emailDomain] = target.email.split('@');
    const maskedEmail = `${emailName.slice(0, 2)}••••@${emailDomain}`;
    answer = `${target.name}’s protected contact details are ${maskedEmail} and ${maskedPhone}. Full values are masked in the AI response; use the employee portal to view or update them.`;
    securityDetail = 'PII detected and masked in output';
    verdict = 'masked';
  } else if (/manager|report to|reporting/i.test(lower)) {
    answer = `${target.id === currentUser.id ? 'Your' : `${target.name}’s`} reporting manager is ${target.manager}.`;
  } else if (/who am i|my role|my department|job title/i.test(lower)) {
    const access = currentUser.role === 'HR_ADMIN' ? 'HR administrator' : currentUser.role === 'SYSTEM_ADMIN' ? 'system administration (without automatic employee-data access)' : 'employee self-service';
    answer = `You’re signed in as ${currentUser.name}, ${currentUser.title} in ${currentUser.department}. Your access level is ${access}.`;
  } else if (/policy|remote|work from home|wfh/i.test(lower)) {
    answer = 'ABC Pvt Ltd supports hybrid work with up to two remote days per week, subject to manager approval and team schedules. No employee record was needed for this answer.';
  } else {
    answer = 'I can help with your salary, leave balance, benefits, reporting manager, profile details, or general HR policies. Try asking “How many leave days do I have?”';
  }

  return NextResponse.json({
    answer,
    verdict,
    layer: verdict === 'masked' ? 'Allowed · Konsole PII masking' : 'Allowed · least-privilege retrieval',
    checks: checks(scope, securityDetail, verdict === 'masked' ? 'masked' : 'passed'),
    auditId,
  });
}
