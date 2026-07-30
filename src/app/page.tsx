'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  CircleUserRound,
  Clock3,
  DoorOpen,
  FileText,
  Fingerprint,
  House,
  KeyRound,
  LockKeyhole,
  MessageSquareText,
  MoreHorizontal,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  WalletCards,
} from 'lucide-react';

type Role = 'EMPLOYEE' | 'HR_ADMIN';

type User = {
  id: string;
  name: string;
  firstName: string;
  role: Role;
  title: string;
  department: string;
  initials: string;
};

type SecurityCheck = {
  label: string;
  detail: string;
  status: 'passed' | 'blocked' | 'masked';
};

type Message = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  time: string;
  verdict?: 'allowed' | 'blocked' | 'masked';
  layer?: string;
  checks?: SecurityCheck[];
  auditId?: string;
};

const DEMO_USERS = [
  { id: 'emp-1001', name: 'Priya Sharma', role: 'Employee', detail: 'Product Design · EMP-1001', initials: 'PS' },
  { id: 'emp-1002', name: 'Arjun Mehta', role: 'Employee', detail: 'Engineering · EMP-1002', initials: 'AM' },
  { id: 'hr-2001', name: 'Neha Kapoor', role: 'HR admin', detail: 'People Operations · HR-2001', initials: 'NK' },
];

const QUICK_ACTIONS = [
  { icon: WalletCards, label: 'View my salary', prompt: 'What is my current salary?' },
  { icon: Clock3, label: 'Check leave balance', prompt: 'How many leave days do I have?' },
  { icon: FileText, label: 'Benefits summary', prompt: 'Summarize my benefits and insurance coverage.' },
];

const INITIAL_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    "Hi! I’m your secure HR assistant. I can help with your salary, leave balance, benefits, and company policies. I’ll only access information your role permits.",
  time: 'Just now',
};

function now() {
  return new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' }).format(new Date());
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [selectedLogin, setSelectedLogin] = useState(DEMO_USERS[0].id);
  const [loginOpen, setLoginOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [activeTrace, setActiveTrace] = useState<Message>(INITIAL_MESSAGE);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/session')
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setUser(data?.user ?? null))
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    const chatPanel = chatScrollRef.current;
    if (!chatPanel) return;
    chatPanel.scrollTo({ top: chatPanel.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  function goHome() {
    setMessages([INITIAL_MESSAGE]);
    setActiveTrace(INITIAL_MESSAGE);
    setInput('');
  }

  async function signIn() {
    const response = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selectedLogin }),
    });
    if (!response.ok) return;
    const data = await response.json();
    setUser(data.user);
    setMessages([INITIAL_MESSAGE]);
    setLoginOpen(false);
  }

  async function signOut() {
    await fetch('/api/session', { method: 'DELETE' });
    setUser(null);
    setMessages([INITIAL_MESSAGE]);
  }

  async function sendMessage(event?: FormEvent, suggestedPrompt?: string) {
    event?.preventDefault();
    const question = (suggestedPrompt ?? input).trim();
    if (!question || sending || !user) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
      time: now(),
    };
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question }),
      });
      const data = await response.json();
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.answer ?? 'I could not process that request.',
        time: now(),
        verdict: data.verdict,
        layer: data.layer,
        checks: data.checks,
        auditId: data.auditId,
      };
      setMessages((current) => [...current, assistantMessage]);
      setActiveTrace(assistantMessage);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'The secure HR service is temporarily unavailable. Please try again.',
          time: now(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  if (checkingSession) {
    return (
      <div className="loading-screen">
        <div className="brand-mark"><ShieldCheck size={25} /></div>
        <p>Opening your secure workspace…</p>
      </div>
    );
  }

  if (!user) {
    const selected = DEMO_USERS.find((candidate) => candidate.id === selectedLogin) ?? DEMO_USERS[0];
    return (
      <main className="login-page">
        <div className="login-nav">
          <div className="brand">
            <div className="brand-mark"><ShieldCheck size={23} /></div>
            <div><strong>PeopleGuard</strong><span>Secure HR intelligence</span></div>
          </div>
          <span className="konsole-chip"><Shield size={14} /> Protected by Konsole</span>
        </div>

        <section className="login-shell">
          <div className="login-story">
            <span className="eyebrow"><Sparkles size={14} /> AI that respects every boundary</span>
            <h1>Your people data.<br /><em>Guarded by design.</em></h1>
            <p>Ask workplace questions naturally while role-based access and Konsole security protect every interaction.</p>
            <div className="security-path">
              <div><Fingerprint size={19} /><span><b>Identity verified</b><small>Signed, server-side sessions</small></span></div>
              <span className="path-line" />
              <div><LockKeyhole size={19} /><span><b>Access enforced</b><small>Least-privilege data retrieval</small></span></div>
              <span className="path-line" />
              <div><ShieldCheck size={19} /><span><b>AI protected</b><small>Konsole security policies</small></span></div>
            </div>
          </div>

          <div className="login-card">
            <div className="login-card-icon"><KeyRound size={24} /></div>
            <h2>Welcome to ABC People</h2>
            <p>Choose a demo identity to enter the secure HR workspace.</p>
            <label>Demo identity</label>
            <button className="identity-select" onClick={() => setLoginOpen((open) => !open)} aria-expanded={loginOpen}>
              <span className="avatar small">{selected.initials}</span>
              <span><b>{selected.name}</b><small>{selected.detail}</small></span>
              <ChevronDown size={17} />
            </button>
            {loginOpen && (
              <div className="identity-menu">
                {DEMO_USERS.map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => {
                      setSelectedLogin(candidate.id);
                      setLoginOpen(false);
                    }}
                  >
                    <span className="avatar small">{candidate.initials}</span>
                    <span><b>{candidate.name}</b><small>{candidate.detail}</small></span>
                    {candidate.id === selectedLogin && <Check size={16} />}
                  </button>
                ))}
              </div>
            )}
            <button className="primary-button" onClick={signIn}>
              Sign in securely <ArrowRight size={17} />
            </button>
            <div className="login-note"><LockKeyhole size={13} /> Demo credentials only · No password required</div>
          </div>
        </section>
        <div className="login-footer">ABC Pvt Ltd · Secure AI workplace demo</div>
      </main>
    );
  }

  const traceChecks = activeTrace.checks ?? [
    { label: 'Authentication', detail: 'Session identity verified', status: 'passed' as const },
    { label: 'Authorization', detail: 'Waiting for a request', status: 'passed' as const },
    { label: 'Konsole security', detail: 'Security profile active', status: 'passed' as const },
  ];

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand sidebar-brand">
          <div className="brand-mark"><ShieldCheck size={22} /></div>
          <div><strong>PeopleGuard</strong><span>ABC Pvt Ltd</span></div>
        </div>

        <nav className="side-nav">
          <span className="nav-label">Workspace</span>
          <button className={messages.length === 1 ? 'active' : ''} onClick={goHome}>
            <House size={18} /> Home
          </button>
          <button className={messages.length > 1 ? 'active' : ''}>
            <MessageSquareText size={18} /> AI assistant
          </button>
          <button><CircleUserRound size={18} /> My profile</button>
          <button><FileText size={18} /> Documents <span className="soon">Soon</span></button>
          {user.role === 'HR_ADMIN' && <button><UsersRound size={18} /> People directory</button>}
        </nav>

        <div className="protection-card">
          <div className="protection-icon"><ShieldCheck size={20} /></div>
          <div><b>Konsole Shield</b><span>Security profile active</span></div>
          <span className="pulse-dot" />
          <ul>
            <li><Check size={12} /> Prompt injection defense</li>
            <li><Check size={12} /> Jailbreak detection</li>
            <li><Check size={12} /> PII masking</li>
          </ul>
        </div>

        <div className="user-panel">
          <span className="avatar">{user.initials}</span>
          <span><b>{user.name}</b><small>{user.role === 'HR_ADMIN' ? 'HR administrator' : 'Employee'}</small></span>
          <button onClick={signOut} title="Sign out" aria-label="Sign out"><DoorOpen size={17} /></button>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="mobile-logo"><ShieldCheck size={20} /></span>
            <h1>HR Assistant</h1>
            <span className="status"><i /> Secure session</span>
          </div>
          <div className="role-pill">
            {user.role === 'HR_ADMIN' ? <BriefcaseBusiness size={15} /> : <UserRound size={15} />}
            {user.role === 'HR_ADMIN' ? 'HR admin access' : 'Employee access'}
          </div>
        </header>

        <div className="content-grid">
          <section className="chat-panel">
            <div className="chat-scroll" ref={chatScrollRef}>
              <div className="chat-heading">
                <div className="bot-orb"><Bot size={24} /></div>
                <h2>Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.firstName}</h2>
                <p>How can I help with your workday?</p>
              </div>

              <div className="quick-actions">
                {QUICK_ACTIONS.map(({ icon: Icon, label, prompt }) => (
                  <button key={label} onClick={() => sendMessage(undefined, prompt)}>
                    <Icon size={18} /><span>{label}</span><ArrowRight size={15} />
                  </button>
                ))}
              </div>

              <div className="conversation">
                {messages.map((message) => (
                  <div
                    className={`message-row ${message.role}`}
                    key={message.id}
                    onClick={() => message.checks && setActiveTrace(message)}
                  >
                    {message.role === 'assistant' && <div className="message-avatar"><Bot size={17} /></div>}
                    <div>
                      <div className={`message-bubble ${message.verdict === 'blocked' ? 'blocked' : ''}`}>
                        {message.verdict === 'blocked' && <span className="blocked-label"><Shield size={13} /> Request blocked</span>}
                        {message.content}
                      </div>
                      <span className="message-time">
                        {message.time}
                        {message.verdict && <><ShieldCheck size={12} /> {message.layer}</>}
                      </span>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="message-row assistant">
                    <div className="message-avatar"><Bot size={17} /></div>
                    <div className="message-bubble typing"><span /><span /><span /></div>
                  </div>
                )}
              </div>
            </div>

            <div className="composer-wrap">
              <form className="composer" onSubmit={(event) => sendMessage(event)}>
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Ask about your salary, leave, benefits, or HR policies…"
                  rows={1}
                  aria-label="Message HR assistant"
                />
                <button disabled={!input.trim() || sending} aria-label="Send message"><Send size={18} /></button>
              </form>
              <p><LockKeyhole size={11} /> Only data authorized for your identity is retrieved</p>
            </div>
          </section>

          <aside className="security-panel">
            <div className="security-title">
              <div><span className="shield-mini"><ShieldCheck size={17} /></span><h2>Security trace</h2></div>
              <button aria-label="More options"><MoreHorizontal size={18} /></button>
            </div>
            <p className="trace-intro">Every request passes through layered controls before any HR data reaches the AI.</p>

            <div className={`decision-card ${activeTrace.verdict ?? 'allowed'}`}>
              <span className="decision-icon">
                {activeTrace.verdict === 'blocked' ? <Shield size={20} /> : <BadgeCheck size={20} />}
              </span>
              <div>
                <small>Latest decision</small>
                <b>{activeTrace.verdict === 'blocked' ? 'Request blocked' : activeTrace.verdict === 'masked' ? 'Allowed with masking' : 'Request allowed'}</b>
                <span>{activeTrace.layer ?? 'Ready for secure requests'}</span>
              </div>
            </div>

            <div className="checks">
              {traceChecks.map((check, index) => (
                <div className="check-row" key={`${check.label}-${index}`}>
                  <span className={`check-icon ${check.status}`}>
                    {check.status === 'blocked' ? <Shield size={14} /> : check.status === 'masked' ? <Fingerprint size={14} /> : <Check size={14} />}
                  </span>
                  <div><b>{check.label}</b><span>{check.detail}</span></div>
                </div>
              ))}
            </div>

            <div className="data-boundary">
              <span className="boundary-icon"><LockKeyhole size={16} /></span>
              <div><b>Data boundary</b><p>The assistant receives only the minimum fields approved for this request.</p></div>
            </div>

            <div className="audit">
              <span>Audit event</span>
              <code>{activeTrace.auditId ?? 'Waiting for first request'}</code>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
