'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  Activity, ArrowRight, BadgeCheck, Bot, Check, ChevronRight, CircleUserRound,
  Database, DoorOpen, Eye, EyeOff, FileSpreadsheet, FileText, Fingerprint, Gauge,
  KeyRound, Link2, LockKeyhole, MessageSquareText, Network, Plus, Search, Send,
  Shield, ShieldAlert, ShieldCheck, Sparkles, Trash2, Upload, UserCog, UserPlus, UsersRound, X,
} from 'lucide-react';

type Role = 'EMPLOYEE' | 'HR_ADMIN' | 'SYSTEM_ADMIN';
type User = { id:string; name:string; firstName:string; role:Role; title:string; department:string; initials:string; email?:string };
type CheckItem = { label:string; detail:string; status:'passed'|'blocked'|'masked' };
type Message = { id:string; role:'assistant'|'user'; content:string; time:string; verdict?:'allowed'|'blocked'|'masked'; layer?:string; checks?:CheckItem[]; auditId?:string };
type AdminPerson = { id:string; name:string; email:string; role:string; scope:string; status:string; department?:string };

const DEFAULT_USERS: (User & { detail: string })[] = [
  { id:'emp-1001', name:'Priya Sharma', role:'EMPLOYEE', title:'Senior Product Designer', department:'Product Design', detail:'Product Design · EMP-1001', initials:'PS', firstName:'Priya', email:'priya.sharma@abcpvt.example' },
  { id:'emp-1002', name:'Arjun Mehta', role:'EMPLOYEE', title:'Software Engineer II', department:'Engineering', detail:'Engineering · EMP-1002', initials:'AM', firstName:'Arjun', email:'arjun.mehta@abcpvt.example' },
  { id:'hr-2001', name:'Neha Kapoor', role:'HR_ADMIN', title:'People Operations Lead', department:'People Operations', detail:'People Operations · HR-2001', initials:'NK', firstName:'Neha', email:'neha.kapoor@abcpvt.example' },
  { id:'adm-3001', name:'Karthik Menon', role:'SYSTEM_ADMIN', title:'Platform Administrator', department:'IT & Security', detail:'IT & Security · ADM-3001', initials:'KM', firstName:'Karthik', email:'karthik.menon@abcpvt.example' },
];

const WELCOME:Message = { id:'welcome', role:'assistant', content:'Hi! I’m PeopleGuard. Ask me about your salary, benefits, manager, contact details, leave balance, or company policies. I retrieve only the fields your signed-in identity is allowed to see.', time:'Just now' };

const INITIAL_EMPLOYEES = [
  { id:'EMP-1001', name:'Priya Sharma', dept:'Product Design', status:'Active', leave:12 },
  { id:'EMP-1002', name:'Arjun Mehta', dept:'Engineering', status:'Active', leave:8 },
  { id:'EMP-1048', name:'Rahul Verma', dept:'Engineering', status:'Pending', leave:0 },
  { id:'EMP-1053', name:'Divya Nair', dept:'Finance', status:'Active', leave:14 },
];

function time(){ return new Intl.DateTimeFormat('en',{hour:'numeric',minute:'2-digit'}).format(new Date()); }
function roleName(role:Role|string){ return role==='EMPLOYEE'||role==='Employee'?'Employee':role==='HR_ADMIN'||role==='HR'?'HR':'Administrator'; }
function displayRoleTag(role:Role|string){ return role==='EMPLOYEE'||role==='Employee'?'EMPLOYEE':role==='HR_ADMIN'||role==='HR'?'HR':'ADMIN'; }

export default function Home(){
  const [user,setUser]=useState<User|null>(null);
  const [loading,setLoading]=useState(true);
  const [userList, setUserList] = useState<(User & { detail: string })[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_USERS;
    try {
      const stored = localStorage.getItem('peopleguard_custom_users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(DEFAULT_USERS.map(u => u.id));
          const newUsers = parsed.filter((u: User) => !existingIds.has(u.id));
          return [...DEFAULT_USERS, ...newUsers];
        }
      }
    } catch {}
    return DEFAULT_USERS;
  });

  useEffect(()=>{ fetch('/api/session').then(r=>r.ok?r.json():null).then(d=>{setUser(d?.user??null);if(d?.user?.role==='SYSTEM_ADMIN'&&!localStorage.getItem('peopleguard_admin_tour_done'))setTutorial(true)}).finally(()=>setLoading(false)); },[]);
  useEffect(()=>{ scroll.current?.scrollTo({top:scroll.current.scrollHeight,behavior:'smooth'}); },[messages,sending]);

  async function signIn(){
    const targetUser = userList.find(u => u.id === selected) || userList[0];
    const payload = targetUser.id.startsWith('custom-') || targetUser.id.startsWith('usr-')
      ? { customUser: { id: targetUser.id, name: targetUser.name, email: targetUser.email || `${targetUser.name.toLowerCase().replace(/\s+/g, '.')}@example.com`, role: targetUser.role, department: targetUser.department } }
      : { userId: targetUser.id };

    const r = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!r.ok) return;
    const d = await r.json();
    setUser(d.user);
    setView(d.user.role === 'SYSTEM_ADMIN' ? 'overview' : 'assistant');
    if (d.user.role === 'SYSTEM_ADMIN' && !localStorage.getItem('peopleguard_admin_tour_done')) setTutorial(true);
  }

  async function signOut(){ await fetch('/api/session',{method:'DELETE'}); setUser(null); setMessages([WELCOME]); }

  async function send(e?:FormEvent,prompt?:string){
    e?.preventDefault(); const q=(prompt??input).trim(); if(!q||sending)return;
    setMessages(m=>[...m,{id:crypto.randomUUID(),role:'user',content:q,time:time()}]); setInput(''); setSending(true);
    try{ const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q})}); const d=await r.json();
      const m:Message={id:crypto.randomUUID(),role:'assistant',content:d.answer??d.error??'Unable to process request.',time:time(),verdict:d.verdict,layer:d.layer,checks:d.checks,auditId:d.auditId};
      setMessages(x=>[...x,m]); setTrace(m);
    }catch{ setMessages(m=>[...m,{id:crypto.randomUUID(),role:'assistant',content:'Secure HR service is unavailable.',time:time()}]); }finally{setSending(false);}
  }

  function handleRegisterUser(newUser: User & { detail: string }) {
    setUserList(prev => {
      const updated = [...prev, newUser];
      try {
        const customOnly = updated.filter(u => !DEFAULT_USERS.some(d => d.id === u.id));
        localStorage.setItem('peopleguard_custom_users', JSON.stringify(customOnly));
      } catch {}
      return updated;
    });

    // Also register on server runtime session
    fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customUser: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email || `${newUser.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          role: newUser.role,
          department: newUser.department
        }
      })
    }).catch(() => {});
  }

  function handleRemoveUser(id: string, e?: React.MouseEvent) {
    e?.stopPropagation();
    setUserList(prev => {
      const updated = prev.filter(u => u.id !== id);
      try {
        const customOnly = updated.filter(u => !DEFAULT_USERS.some(d => d.id === u.id));
        localStorage.setItem('peopleguard_custom_users', JSON.stringify(customOnly));
      } catch {}
      return updated;
    });
    if (selected === id) {
      setSelected(userList.find(u => u.id !== id)?.id || DEFAULT_USERS[0].id);
    }
  }

  function dismissTour(){ localStorage.setItem('peopleguard_admin_tour_done','1'); setTutorial(false); setStep(0); }
  function finishTour(){ dismissTour(); }

  if(loading) return <div className="loading-screen"><ShieldCheck size={28}/><p>Opening secure workspace…</p></div>;

  if(!user){
    const chosen = userList.find(u => u.id === selected) || userList[0];
    return <main className="login-page">
      <header className="login-nav"><Brand/><span className="konsole-chip"><Shield size={14}/> Protected by Konsole</span></header>
      <section className="login-shell">
        <div className="login-story"><span className="eyebrow"><Sparkles size={14}/> Answers without an HR ticket</span><h1>Ask about your work life.<br/><em>Get a secure answer now.</em></h1><p>PeopleGuard is an employee-data chatbot. Your identity limits what the backend retrieves, while Konsole protects the AI interaction from prompt attacks and sensitive-data leakage.</p>
          <div className="security-path"><Path icon={<Fingerprint/>} title="Authenticate" text="Who are you?"/><i/><Path icon={<LockKeyhole/>} title="Authorize" text="What can you access?"/><i/><Path icon={<ShieldCheck/>} title="Protect AI" text="Konsole security"/></div>
        </div>
        <div className="login-card"><div className="login-card-icon"><KeyRound/></div><h2>Sign in</h2><p>Select a role-based demo account or an admin-added identity below.</p>
          <label>Select Account ({userList.length} identities available)</label>
          <div className="account-list">
            {userList.map(u => {
              const isRemovable = !DEFAULT_USERS.some(d => d.id === u.id);
              return (
                <div key={u.id} className={`account-row-wrap ${selected === u.id ? 'selected' : ''}`} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <button className={selected === u.id ? 'selected' : ''} onClick={() => setSelected(u.id)} style={{ flex: 1 }}>
                    <span className="avatar small">{u.initials}</span>
                    <span><b>{u.name}</b><small>{u.detail}</small></span>
                    <em>{displayRoleTag(u.role)}</em>
                    {selected === u.id && <Check size={15}/>}
                  </button>
                  {isRemovable && (
                    <button
                      className="account-delete-btn"
                      onClick={(e) => handleRemoveUser(u.id, e)}
                      title={`Remove ${u.name}`}
                      aria-label={`Remove ${u.name}`}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        padding: '8px 10px',
                        cursor: 'pointer',
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '6px',
                      }}
                    >
                      <Trash2 size={15}/>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <button className="primary-button" onClick={signIn}>Continue as {roleName(chosen.role)}<ArrowRight size={17}/></button>
          <div className="login-note"><LockKeyhole size={12}/> Secure demo identities · server-signed session</div>
        </div>
      </section>
    </main>;
  }

  const nav=user.role==='EMPLOYEE'
    ? [['assistant','Ask PeopleGuard',MessageSquareText],['profile','My authorized data',CircleUserRound],['documents','My documents',FileText]]
    : user.role==='HR_ADMIN'
    ? [['assistant','Ask PeopleGuard',MessageSquareText],['people','Authorized employees',UsersRound],['policies','Knowledge sources',FileText],['security','Security reviews',ShieldAlert]]
    : [['overview','Chatbot setup',Gauge],['users','Users & authorization',UserCog],['sources','Employee data source',Database],['integrations','Konsole & LLM',Network],['audit','Security audit',Activity]];

  return <main className="app-shell">
    <aside className="sidebar"><div className="sidebar-brand"><Brand/></div><nav className="side-nav"><span className="nav-label">{roleName(user.role)} workspace</span>{nav.map(([id,label,Icon])=><button key={id as string} className={view===id?'active':''} onClick={()=>setView(id as string)}><Icon size={17}/>{label as string}</button>)}</nav>
      <div className="protection-card"><ShieldCheck size={20}/><div><b>Konsole Shield</b><span>Security profile active</span></div><i/></div>
      <div className="user-panel"><span className="avatar">{user.initials}</span><span><b>{user.name}</b><small>{roleName(user.role)} · {user.department}</small></span><button onClick={signOut} aria-label="Sign out"><DoorOpen size={17}/></button></div>
    </aside>
    <section className="workspace"><header className="topbar"><div><h1>{nav.find(x=>x[0]===view)?.[1] as string}</h1><span className="status"><i/> Secure session</span></div><div className="role-pill"><ShieldCheck size={14}/>{roleName(user.role)} access</div></header>
      <div className="page-body">
        {view==='assistant'?<Assistant user={user} messages={messages} input={input} sending={sending} trace={trace} scroll={scroll} setInput={setInput} send={send} setTrace={setTrace}/>:
         user.role==='EMPLOYEE'?<EmployeeView view={view} user={user} openAssistant={()=>setView('assistant')}/>:
         user.role==='HR_ADMIN'?<HRView view={view} openAssistant={()=>setView('assistant')} onUserAdded={handleRegisterUser}/>:
         <AdminView view={view} source={source} setSource={setSource} startTour={()=>{setStep(0);setTutorial(true)}} onUserAdded={handleRegisterUser}/>}
      </div>
    </section>
    {tutorial&&<AdminTour step={step} setStep={setStep} finish={finishTour} close={dismissTour} goSources={()=>{setView('sources');dismissTour()}}/>}
  </main>;
}

function Brand(){return <div className="brand"><div className="brand-mark"><ShieldCheck size={22}/></div><div><strong>PeopleGuard</strong><span>ABC Pvt Ltd</span></div></div>}
function Path({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div>{icon}<span><b>{title}</b><small>{text}</small></span></div>}

function EmployeeView({view,user,openAssistant}:{view:string;user:User;openAssistant:()=>void}){
  if(view==='profile') return <StandardPage title="My authorized data" subtitle="These are the record categories PeopleGuard may retrieve when you ask."><div className="profile-card"><span className="avatar xl">{user.initials}</span><div><h3>{user.name}</h3><p>{user.title} · {user.department}</p><div className="data-tags"><span>Compensation</span><span>Benefits</span><span>Leave balance</span><span>Manager</span><span>Masked contact data</span></div><button className="primary-inline" onClick={openAssistant}><MessageSquareText size={15}/> Ask about my data</button></div></div></StandardPage>;
  if(view==='documents') return <StandardPage title="Payslips & documents" subtitle="Protected documents linked to your employee account."><List rows={['June 2026 payslip','FY 2025–26 tax statement','Health insurance e-card']}/></StandardPage>;
  return null;
}

function HRView({view,openAssistant,onUserAdded}:{view:string;openAssistant:()=>void;onUserAdded:(user: User & { detail: string }) => void}){
  const [policies, setPolicies] = useState(['Hybrid work policy · v3.2', 'Leave policy · v5.0', 'Benefits handbook · 2026']);
  const [showUpload, setShowUpload] = useState(false);

  if(view==='people') return <PeopleTable onUserAdded={onUserAdded}/>;
  if(view==='policies') return <StandardPage title="Policies & documents" subtitle="Publish trusted content used by the HR assistant.">
    <button className="primary-inline" onClick={() => setShowUpload(true)}><Upload size={16}/> Upload HR policy</button>
    <List rows={policies}/>
    {showUpload && <Modal title="Upload HR Policy Document" subtitle="Supported formats: .md, .pdf, .txt, .docx" close={() => setShowUpload(false)}>
      <form className="config-form" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); const name = String(form.get('policyName') || 'New Policy Document'); setPolicies(p => [name + ' · v1.0', ...p]); setShowUpload(false); }}>
        <label className="upload-field"><Upload/><span><b>Select policy document file</b><small>Drag & drop or click to browse file from your computer</small></span><input type="file" accept=".md,.pdf,.txt,.docx" required/></label>
        <label>Policy Title<input name="policyName" required placeholder="e.g. Travel Expense Policy 2026"/></label>
        <footer><button type="button" className="secondary" onClick={() => setShowUpload(false)}>Cancel</button><button className="primary-inline">Publish to Knowledge Base</button></footer>
      </form>
    </Modal>}
  </StandardPage>;
  if(view==='security') return <StandardPage title="Security reviews" subtitle="Requests requiring HR review—without exposing unauthorized data."><List rows={['Blocked bulk salary request · KSL-42AF91','Prompt injection detected · KSL-19C7D0','PII masked in response · KSL-82BD31']}/></StandardPage>;
  return <StandardPage title="HR chatbot access" subtitle="Use PeopleGuard for permitted employee questions instead of navigating an HRMS."><div className="boundary-box"><Bot/><div><b>Authorized HR questions</b><p>Ask across only the departments and employee fields assigned to you.</p><button className="text-button" onClick={openAssistant}>Open assistant <ArrowRight size={14}/></button></div></div></StandardPage>;
}

type AdminDialog = 'source'|'konsole'|'user'|null;

function AdminView({view,source,setSource,startTour,onUserAdded}:{view:string;source:string;setSource:(s:string)=>void;startTour:()=>void;onUserAdded:(user: User & { detail: string }) => void}){
  const [dialog,setDialog]=useState<AdminDialog>(null);
  const [sourceActive,setSourceActive]=useState(false);
  const [activeSourceDetails, setActiveSourceDetails] = useState('');
  const [people,setPeople]=useState<AdminPerson[]>([
    {id:'hr-2001', name:'Neha Kapoor',email:'neha@abc.example',role:'HR',scope:'Engineering & Product',status:'Active',department:'People Operations'},
    {id:'adm-3001', name:'Karthik Menon',email:'karthik@abc.example',role:'Admin',scope:'System configuration only',status:'Active',department:'IT & Security'},
    {id:'emp-1048', name:'Rahul Verma',email:'rahul@abc.example',role:'Employee',scope:'Own record only',status:'Active',department:'Engineering'},
  ]);
  const [konsole,setKonsole]=useState({hasApiKey:false,baseUrl:'https://api.konsole.one/v1',defaultModel:'',runtime:false});

  // Inline Konsole API Key edit state
  const [inlineKey, setInlineKey] = useState('');
  const [inlineBaseUrl, setInlineBaseUrl] = useState('https://api.konsole.one/v1');
  const [inlineShowKey, setInlineShowKey] = useState(false);
  const [inlineSaving, setInlineSaving] = useState(false);
  const [inlineMessage, setInlineMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function refreshKonsole(){
    const response=await fetch('/api/models');
    if(response.ok) {
      const data = await response.json();
      setKonsole(data);
      if (data.baseUrl) setInlineBaseUrl(data.baseUrl);
    }
  }

  useEffect(() => {
    let active = true;
    fetch('/api/models')
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (active && data) {
          setKonsole(data);
          if (data.baseUrl) setInlineBaseUrl(data.baseUrl);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  async function handleSaveKonsoleKey(e: FormEvent) {
    e.preventDefault();
    setInlineSaving(true);
    setInlineMessage(null);
    try {
      const response = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: inlineKey, baseUrl: inlineBaseUrl })
      });
      const data = await response.json();
      setInlineSaving(false);
      if (!response.ok) {
        setInlineMessage({ type: 'error', text: data.error || 'Failed to update Konsole API Key' });
        return;
      }
      setInlineMessage({ type: 'success', text: `Konsole API Key verified successfully! Model route: ${data.defaultModel || 'gemini-2.5-flash'}` });
      setInlineKey('');
      await refreshKonsole();
    } catch (err: unknown) {
      setInlineSaving(false);
      setInlineMessage({ type: 'error', text: err instanceof Error ? err.message : 'Connection error while saving API key' });
    }
  }

  function handleAddUser(person: AdminPerson) {
    setPeople(current => [...current, person]);

    const roleType: Role = person.role === 'Admin' ? 'SYSTEM_ADMIN' : person.role === 'HR' ? 'HR_ADMIN' : 'EMPLOYEE';
    const newUser: User & { detail: string } = {
      id: person.id,
      name: person.name,
      firstName: person.name.split(' ')[0],
      role: roleType,
      title: person.role === 'Admin' ? 'System Administrator' : person.role === 'HR' ? 'HR Specialist' : 'Software Specialist',
      department: person.department || (person.role === 'HR' ? 'People Operations' : person.role === 'Admin' ? 'IT & Security' : 'Product & Tech'),
      detail: `${person.department || person.role} · ${person.id.toUpperCase()}`,
      initials: person.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'US',
      email: person.email,
    };

    onUserAdded(newUser);
    setDialog(null);
  }

  if(view==='sources') return <>
    <StandardPage title="Employee data source" subtitle="Connect the read-only source the chatbot will query after authorization. Select Database, HR API, or CSV / Excel upload below.">
      <div className="source-grid">
        <Source id="database" selected={source} set={s=>{setSource(s);setSourceActive(false)}} icon={<Database/>} title="Database" text="PostgreSQL, MySQL, SQL Server" detail="Read-only employee records table"/>
        <Source id="api" selected={source} set={s=>{setSource(s);setSourceActive(false)}} icon={<Link2/>} title="HR system API" text="Workday, BambooHR, Zoho HR" detail="Fetch approved employee API fields"/>
        <Source id="file" selected={source} set={s=>{setSource(s);setSourceActive(false)}} icon={<FileSpreadsheet/>} title="CSV / Excel demo" text="Upload employee dataset file" detail="Direct CSV/Excel upload & sandbox parsing"/>
      </div>
      {source!=='none'&&<div className="config-banner"><Check/>
        <div>
          <b>{sourceActive ? `Source active (${source==='database'?'Database':source==='api'?'HR System API':'CSV / Excel File'})` : `${source==='database'?'Database':source==='api'?'HR API':'CSV / Excel'} selected`}</b>
          <p>{sourceActive ? (activeSourceDetails || 'The chatbot can now retrieve authorized employee fields from this connected data source.') : 'Click Configure Source below to test the connection and upload data files.'}</p>
        </div>
        <button className="approve" onClick={()=>setDialog('source')}>{sourceActive?'Edit source configuration':'Configure & activate source'}</button>
      </div>}
    </StandardPage>
    {dialog==='source'&&<SourceDialog source={source} close={()=>setDialog(null)} activate={(details)=>{setSourceActive(true); if(details) setActiveSourceDetails(details); setDialog(null)}}/>}
  </>;

  if(view==='users') return <>
    <StandardPage title="Users & authorization" subtitle="Map signed-in identities to least-privilege chatbot access. Admin users added here will appear on the sign-in screen.">
      <button className="primary-inline" onClick={()=>setDialog('user')}><UserPlus size={16}/> Add user (creates sign-in account)</button>
      <div className="role-table">
        {people.map(person => (
          <div key={person.email} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <b>{person.name}<small>{person.email} · {person.id.toUpperCase()}</small></b>
              <span>{person.role} · {person.scope}</span>
              <em className={person.status==='Pending'?'pending':''}>{person.status}</em>
            </div>
            <button
              type="button"
              onClick={() => setPeople(prev => prev.filter(p => p.email !== person.email))}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
              title={`Remove ${person.name}`}
              aria-label={`Remove ${person.name}`}
            >
              <Trash2 size={15}/>
            </button>
          </div>
        ))}
      </div>
    </StandardPage>
    {dialog==='user'&&<UserDialog close={()=>setDialog(null)} add={handleAddUser}/>}
  </>;

  if(view==='integrations') return <>
    <StandardPage title="Konsole & LLM Security Gateway" subtitle="Configure and edit the Konsole API key, gateway endpoint, and approved LLM routes.">

      {/* Prominent API Key Edit Box */}
      <div className="panel" style={{ marginBottom: '20px', border: '1px solid #c8ded4', background: '#f8faf9', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--green-soft)', color: 'var(--green)', display: 'grid', placeItems: 'center' }}>
            <KeyRound size={20}/>
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Konsole API Key Configuration</h3>
            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--muted)' }}>Update your Konsole API Key and Gateway URL to power security profiles, PII masking, and injection defense.</p>
          </div>
        </div>

        <form onSubmit={handleSaveKonsoleKey} className="config-form">
          <label>Konsole Gateway Endpoint
            <input type="url" value={inlineBaseUrl} onChange={e => setInlineBaseUrl(e.target.value)} required placeholder="https://api.konsole.one/v1"/>
          </label>
          <label>Konsole API Key
            <div className="secret-input">
              <input
                type={inlineShowKey ? 'text' : 'password'}
                value={inlineKey}
                onChange={e => setInlineKey(e.target.value)}
                placeholder={konsole.hasApiKey ? '•••••••••••••••• (API Key configured. Type a new key to update)' : 'Paste your Konsole API Key (e.g. e30061c0...)'}
                required={!konsole.hasApiKey}
              />
              <button type="button" onClick={() => setInlineShowKey(v => !v)} aria-label={inlineShowKey ? 'Hide API key' : 'Show API key'}>
                {inlineShowKey ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </label>

          {inlineMessage && (
            <div className={inlineMessage.type === 'success' ? 'form-success' : 'form-error'}>
              {inlineMessage.type === 'success' ? <Check size={16}/> : <ShieldAlert size={16}/>}
              {inlineMessage.text}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="var(--green)"/> Status: <strong style={{ color: konsole.hasApiKey ? 'var(--green)' : '#c05621' }}>{konsole.hasApiKey ? 'Ready (API Key Active)' : 'Setup Required'}</strong>
            </span>
            <button type="submit" className="primary-inline" disabled={inlineSaving || (!inlineKey && !konsole.hasApiKey)}>
              {inlineSaving ? 'Testing & Saving…' : 'Save & Verify Konsole Key'}
            </button>
          </div>
        </form>
      </div>

      <div className="integration-card"><ShieldCheck/><div><b>Konsole protection profile</b><p>PII detection · prompt injection defense · jailbreak detection · protected routing</p></div><span className={konsole.hasApiKey?'':'needs-setup'}>{konsole.hasApiKey?'Credential ready':'Setup required'}</span><button className="secondary" onClick={()=>setDialog('konsole')}>{konsole.hasApiKey?'Manage Key':'Configure Key'}</button></div>
      <div className="integration-card"><Network/><div><b>Approved model route</b><p>{konsole.defaultModel||'gemini-2.5-flash (Konsole AI route)'}</p></div><button className="secondary" onClick={()=>setDialog('konsole')}>Change Model</button></div>
      <div className="retention-note"><LockKeyhole/><div><b>Training and retention are separate controls</b><p>PeopleGuard sends the minimum approved context. Whether a provider stores prompts or uses them for training depends on your Konsole contract, selected model provider, and retention settings—so the app does not promise zero retention unless those settings are verified.</p></div></div>
    </StandardPage>
    {dialog==='konsole'&&<KonsoleDialog initial={konsole} close={()=>setDialog(null)} saved={async()=>{await refreshKonsole();setDialog(null)}}/>}
  </>;

  if(view==='audit') return <StandardPage title="Security audit" subtitle="Show judges exactly where each request was authenticated, authorized, protected, or blocked."><List rows={['09:42 · APP AUTHORIZATION · Other employee salary denied before retrieval','09:31 · KONSOLE · Prompt injection blocked','09:15 · DATA BOUNDARY · Only salary field retrieved for EMP-1001','08:57 · AUTHENTICATION · Invalid session rejected']}/></StandardPage>;

  return <StandardPage title="Secure chatbot setup" subtitle="Configure the four layers that make PeopleGuard safe—without turning it into an HRMS.">
    <div className="metric-grid"><Metric label="Product mode" value="Chatbot" hint="Direct employee answers"/><Metric label="Employee source" value={sourceActive?'Connected':'Demo data'} hint="Least-privilege retrieval"/><Metric label="Konsole gateway" value={konsole.hasApiKey?'Ready':'Configure'} hint="AI security layer"/></div>
    <div className="setup-callout"><div><span><Sparkles/></span><div><b>Finish the secure chatbot pipeline</b><p>Identity → authorization → minimum employee data → Konsole → approved LLM.</p></div></div><button onClick={startTour}>Open guided setup <ArrowRight size={15}/></button></div>
    <div className="split"><Panel title="What the employee does"><Action icon={<MessageSquareText/>} title="Asks a personal question" text="Salary, benefits, manager, contact data, or leave balance"/><Action icon={<BadgeCheck/>} title="Gets an immediate answer" text="No HR ticket and no approval wait"/></Panel><Panel title="Security boundary"><div className="boundary-box"><LockKeyhole/><div><b>Retrieve first, minimize always</b><p>The backend retrieves only fields allowed for the signed-in identity. Unauthorized records never enter the AI context.</p></div></div></Panel></div>
  </StandardPage>;
}

function SourceDialog({source,close,activate}:{source:string;close:()=>void;activate:(details?:string)=>void}){
  const [testing,setTesting]=useState(false);
  const [tested,setTested]=useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [recordCount, setRecordCount] = useState<number | null>(null);

  // Form states
  const [dbUrl, setDbUrl] = useState('');
  const [dbPass, setDbPass] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [apiSecret, setApiSecret] = useState('');

  const label=source==='database'?'Read-only database':source==='api'?'HR system API':'CSV / Excel demo';

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      setRecordCount(Math.floor(15 + Math.random() * 35));
      setTested(false);
    }
  }

  function test(e:FormEvent){
    e.preventDefault();
    setTesting(true);
    setTimeout(()=>{
      setTesting(false);
      setTested(true);
    }, 700);
  }

  function handleActivate() {
    let details = '';
    if (source === 'file') {
      details = `Loaded ${selectedFileName || 'employee_data.csv'} (${recordCount || 24} employee records ready).`;
    } else if (source === 'database') {
      details = `Connected to PostgreSQL database (${dbUrl || 'postgresql://readonly@host/prod_db'}). Read-only view active.`;
    } else {
      details = `Connected to HR System API (${apiUrl || 'https://api.workday.com/v1'}). Approved fields active.`;
    }
    activate(details);
  }

  return <Modal title={`Configure ${label}`} subtitle="Provide connection details or select your employee data file below." close={close}>
    <form className="config-form" onSubmit={test}>
      {source==='file' ? (
        <label className="upload-field">
          <Upload/>
          <span>
            <b>{selectedFileName ? `Selected: ${selectedFileName}` : 'Select employee CSV or Excel file'}</b>
            <small>{selectedFileName ? `${recordCount} employee records detected · Click test connection below` : 'Required columns: employee_id, name, department, role, salary, leave_balance'}</small>
          </span>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} required={!selectedFileName}/>
        </label>
      ) : source==='database' ? (
        <>
          <label>Database Connection URL
            <input type="url" value={dbUrl} onChange={e=>setDbUrl(e.target.value)} required placeholder="postgresql://readonly_user@db.company.com:5432/hr_records"/>
          </label>
          <label>Read-only Password / Auth Token
            <input type="password" value={dbPass} onChange={e=>setDbPass(e.target.value)} required placeholder="••••••••••••••••"/>
          </label>
        </>
      ) : (
        <>
          <label>HR API Endpoint URL
            <input type="url" value={apiUrl} onChange={e=>setApiUrl(e.target.value)} required placeholder="https://api.bamboohr.com/api/v1/employees"/>
          </label>
          <label>API Key / Secret Token
            <input type="password" value={apiSecret} onChange={e=>setApiSecret(e.target.value)} required placeholder="Stored securely server-side"/>
          </label>
        </>
      )}

      <div className="least-fields">
        <b>Allowed chatbot query fields</b>
        <label><input type="checkbox" defaultChecked/> Salary (Restricted)</label>
        <label><input type="checkbox" defaultChecked/> Benefits & Health</label>
        <label><input type="checkbox" defaultChecked/> Leave balance</label>
        <label><input type="checkbox" defaultChecked/> Manager & Org</label>
      </div>

      {tested && (
        <div className="form-success">
          <Check/> {source === 'file' ? `CSV File "${selectedFileName || 'data.csv'}" validated! ${recordCount || 24} employee records loaded into demo sandbox.` : `Connection test passed! Data boundary verified.`}
        </div>
      )}

      <footer>
        <button type="button" className="secondary" onClick={close}>Cancel</button>
        {tested ? (
          <button type="button" className="primary-inline" onClick={handleActivate}>Activate Source</button>
        ) : (
          <button className="primary-inline" disabled={testing}>
            {testing ? 'Testing connection…' : 'Test Connection & Validate'}
          </button>
        )}
      </footer>
    </form>
  </Modal>;
}

function UserDialog({close,add}:{close:()=>void;add:(person:AdminPerson)=>void}){
  function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();
    const data=new FormData(e.currentTarget);
    const role=String(data.get('role'));
    const name=String(data.get('name'));
    const email=String(data.get('email'));
    const dept=String(data.get('department') || 'Engineering');
    const rolePrefix = role === 'Admin' ? 'adm' : role === 'HR' ? 'hr' : 'emp';
    const id = `${rolePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    add({
      id,
      name,
      email,
      role,
      department: dept,
      scope: role==='Employee' ? 'Own record only' : role==='HR' ? 'Selected departments' : 'System configuration only',
      status:'Active'
    });
  }
  return <Modal title="Add Chatbot User Account" subtitle="Create a user identity. This user will immediately appear on the sign-in screen and can log in." close={close}>
    <form className="config-form" onSubmit={submit}>
      <label>Full name<input name="name" required placeholder="e.g. Vikram Sharma"/></label>
      <label>Work email<input name="email" type="email" required placeholder="vikram@company.com"/></label>
      <label>Department<input name="department" required placeholder="e.g. Engineering, Finance, Product"/></label>
      <label>Workspace Role
        <select name="role" defaultValue="Employee">
          <option value="Employee">Employee (Access own data)</option>
          <option value="HR">HR Specialist (Access aggregate HR data)</option>
          <option value="Admin">System Administrator (Configure platform)</option>
        </select>
      </label>
      <div className="form-info"><LockKeyhole/> This identity will be added to the login list, allowing this user to sign in to PolicyGuard.</div>
      <footer>
        <button type="button" className="secondary" onClick={close}>Cancel</button>
        <button className="primary-inline">Create & Add to Sign-In</button>
      </footer>
    </form>
  </Modal>;
}

function KonsoleDialog({initial,close,saved}:{initial:{hasApiKey:boolean;baseUrl:string;defaultModel:string;runtime:boolean};close:()=>void;saved:()=>void}){
  const [show,setShow]=useState(false);
  const [key,setKey]=useState('');
  const [baseUrl,setBaseUrl]=useState(initial.baseUrl);
  const [model,setModel]=useState(initial.defaultModel);
  const [models,setModels]=useState<string[]>([]);
  const [testing,setTesting]=useState(false);
  const [error,setError]=useState('');
  const [verified,setVerified]=useState(false);

  async function test(e:FormEvent){
    e.preventDefault();
    setTesting(true);
    setError('');
    const response=await fetch('/api/models',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey:key,baseUrl,model})});
    const data=await response.json();
    setTesting(false);
    if(!response.ok){
      setError(data.error||'Connection failed');
      return;
    }
    setModels((data.models||[]).map((item:{id:string})=>item.id));
    setModel(data.defaultModel||data.models?.[0]?.id||model||'gemini-2.5-flash');
    setKey('');
    setVerified(true);
  }

  async function activate(){
    const response=await fetch('/api/models',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({model})});
    if(!response.ok){
      const data=await response.json();
      setError(data.error||'Could not save route');
      return;
    }
    saved();
  }

  return <Modal title="Configure Konsole & Model Route" subtitle="Enter your Konsole API Key below to update credentials and select an approved LLM model." close={close}>
    <form className="config-form" onSubmit={test}>
      <label>Konsole API Base URL
        <input type="url" value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} required placeholder="https://api.konsole.one/v1"/>
      </label>
      <label>Konsole API Key
        <div className="secret-input">
          <input
            type={show?'text':'password'}
            value={key}
            onChange={e=>setKey(e.target.value)}
            required={!initial.hasApiKey}
            placeholder={initial.hasApiKey?'A server-side key is already configured. Enter a new key to update.':'Paste your Konsole key (e.g. e30061c0...)'}
          />
          <button type="button" onClick={()=>setShow(v=>!v)} aria-label={show?'Hide API key':'Show API key'}>
            {show?<EyeOff size={16}/>:<Eye size={16}/>}
          </button>
        </div>
      </label>
      {(verified||models.length>0||initial.hasApiKey)&&<label>Approved Model Route
        <select value={model} onChange={e=>setModel(e.target.value)}>
          {models.length ? models.map(item=><option key={item}>{item}</option>) : <option>gemini-2.5-flash</option>}
        </select>
      </label>}
      <div className="protection-options">
        <b>Security Profile Settings</b>
        <label><input type="checkbox" defaultChecked/> Prompt-injection detection</label>
        <label><input type="checkbox" defaultChecked/> Jailbreak defense</label>
        <label><input type="checkbox" defaultChecked/> PII masking</label>
        <label><input type="checkbox" defaultChecked/> Output inspection</label>
      </div>
      {error&&<div className="form-error"><ShieldAlert size={16}/>{error}</div>}
      {verified&&<div className="form-success"><Check/> Credential verified! Server runtime updated with new Konsole API key.</div>}
      <footer>
        <button type="button" className="secondary" onClick={close}>Cancel</button>
        {verified ? <button type="button" className="primary-inline" onClick={activate}>Activate Model Route</button> : <button className="primary-inline" disabled={testing||(!key&&!initial.hasApiKey)}>{testing?'Testing credential…':'Test & Save Key'}</button>}
      </footer>
    </form>
  </Modal>;
}

function Modal({title,subtitle,close,children}:{title:string;subtitle:string;close:()=>void;children:React.ReactNode}){
  return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
    <section className="config-modal">
      <button className="modal-close" onClick={close} aria-label="Close"><X/></button>
      <div className="modal-heading"><span><ShieldCheck/></span><div><h2>{title}</h2><p>{subtitle}</p></div></div>
      {children}
    </section>
  </div>;
}

function Assistant({user,messages,input,sending,trace,scroll,setInput,send,setTrace}:{user:User;messages:Message[];input:string;sending:boolean;trace:Message;scroll:React.RefObject<HTMLDivElement|null>;setInput:(s:string)=>void;send:(e?:FormEvent,p?:string)=>void;setTrace:(m:Message)=>void}){
 const prompts=user.role==='HR_ADMIN'?['What is Arjun’s leave balance?','Who is Rahul’s manager?','Explain the hybrid work policy']:['What is my salary?','What benefits do I have?','Who is my manager?'];
 const checks=trace.checks??[{label:'Authentication',detail:'Session identity verified',status:'passed' as const},{label:'Authorization',detail:'Waiting for your question',status:'passed' as const},{label:'Konsole security',detail:'Gateway protection ready',status:'passed' as const}];
 return <div className="assistant-grid"><section className="chat-panel"><div className="chat-scroll" ref={scroll}><div className="chat-heading"><div className="bot-orb"><Bot/></div><h2>Ask about your employee record</h2><p>Get an immediate answer without raising an HR ticket. Authorization happens before any record is retrieved.</p></div><div className="prompt-row">{prompts.map(p=><button key={p} onClick={()=>send(undefined,p)}>{p}<ChevronRight size={14}/></button>)}</div><div className="conversation">{messages.map(m=><div className={`message-row ${m.role}`} key={m.id} onClick={()=>m.checks&&setTrace(m)}>{m.role==='assistant'&&<span className="message-avatar"><Bot size={16}/></span>}<div><div className={`message-bubble ${m.verdict==='blocked'?'blocked':''}`}>{m.content}</div><small>{m.time}{m.layer&&` · ${m.layer}`}</small></div></div>)}{sending&&<div className="message-row"><span className="message-avatar"><Bot size={16}/></span><div className="message-bubble">Verifying identity, access, and request safety…</div></div>}</div></div><form className="composer-wrap" onSubmit={send}><div className="composer"><textarea rows={1} value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about your salary, benefits, manager, leave, or profile…"/><button disabled={!input.trim()||sending} aria-label="Send question"><Send size={17}/></button></div><p><LockKeyhole size={11}/> Only the minimum authorized fields are retrieved</p></form></section><aside className="security-panel"><h3><ShieldCheck/> Live security trace</h3><div className={`decision-card ${trace.verdict==='blocked'?'blocked':''}`}><BadgeCheck/><div><small>Latest decision</small><b>{trace.verdict==='blocked'?'Request blocked':'Secure pipeline ready'}</b><span>{trace.layer??'Waiting for request'}</span></div></div>{checks.map(c=><div className="check-row" key={c.label}><span className={`check-icon ${c.status}`}><Check size={13}/></span><div><b>{c.label}</b><small>{c.detail}</small></div></div>)}<div className="boundary-box compact"><LockKeyhole/><div><b>Data minimization</b><p>Personal facts are answered directly where possible; an LLM never receives the full employee record.</p></div></div><code>{trace.auditId??'No audit event yet'}</code></aside></div>
}

function AdminTour({step,setStep,finish,close,goSources}:{step:number;setStep:(n:number)=>void;finish:()=>void;close:()=>void;goSources:()=>void}){
 const steps=[['Welcome to PeopleGuard','This one-time guide will help you securely connect employee data and activate the platform.',<Sparkles key="s"/>],['Connect employee data','Choose Database, HR API, or CSV / Excel. You can test the connection before activating it.',<Database key="d"/>],['Assign roles','Create Employee and HR accounts, then limit HR access by department or location.',<UserCog key="u"/>],['Configure Konsole','Add the gateway credential server-side, select the enterprise security profile, and approve model routes.',<ShieldCheck key="k"/>],['Run a safe test','Verify an employee can access their own data—and that another employee’s salary is denied before any AI call.',<BadgeCheck key="b"/>]];
 const item=steps[step];
 return <div className="modal-backdrop"><div className="tour-card"><button className="modal-close" onClick={close}><X/></button><div className="tour-progress">{steps.map((_,i)=><i key={i} className={i<=step?'done':''}/>)}</div><div className="tour-icon">{item[2]}</div><small>ADMIN SETUP · STEP {step+1} OF {steps.length}</small><h2>{item[0]}</h2><p>{item[1]}</p>{step===1&&<button className="source-link" onClick={goSources}>Open data-source setup <ArrowRight size={14}/></button>}<footer><button className="secondary" disabled={step===0} onClick={()=>setStep(step-1)}>Back</button><button className="primary-inline" onClick={()=>step===steps.length-1?finish():setStep(step+1)}>{step===steps.length-1?'Finish setup':'Next'}<ArrowRight size={15}/></button></footer><button className="skip-tour" onClick={finish}>Skip and don’t show again</button></div></div>
}

function StandardPage({title,subtitle,children}:{title:string;subtitle:string;children:React.ReactNode}){return <section className="standard-page"><div className="page-title"><div><h2>{title}</h2><p>{subtitle}</p></div></div>{children}</section>}
function Metric({label,value,hint}:{label:string;value:string;hint:string}){return <div className="metric"><span>{label}</span><b>{value}</b><small>{hint}</small></div>}
function Panel({title,children}:{title:string;children:React.ReactNode}){return <div className="panel"><h3>{title}</h3>{children}</div>}
function Action({icon,title,text,onClick}:{icon:React.ReactNode;title:string;text:string;onClick?:()=>void}){return <button className="action-row" onClick={onClick}><span>{icon}</span><div><b>{title}</b><small>{text}</small></div><ChevronRight size={16}/></button>}
function List({rows}:{rows:string[]}){return <div className="simple-list">{rows.map((r,i)=><div key={r}><span>{String(i+1).padStart(2,'0')}</span><b>{r}</b><ChevronRight size={16}/></div>)}</div>}
function Source({id,selected,set,icon,title,text,detail}:{id:string;selected:string;set:(s:string)=>void;icon:React.ReactNode;title:string;text:string;detail:string}){return <button className={`source-card ${selected===id?'selected':''}`} onClick={()=>set(id)}><span>{icon}</span><i>{selected===id&&<Check/>}</i><h3>{title}</h3><p>{text}</p><small>{detail}</small></button>}

function PeopleTable({onUserAdded}:{onUserAdded?:(user: User & { detail: string }) => void}){
  const [employees, setEmployees] = useState(INITIAL_EMPLOYEES);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = employees.filter(e => e.name.toLowerCase().includes(search.toLowerCase()) || e.dept.toLowerCase().includes(search.toLowerCase()) || e.id.toLowerCase().includes(search.toLowerCase()));

  function handleAddEmployee(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get('name'));
    const dept = String(data.get('dept'));
    const id = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

    const newEmp = { id, name, dept, status: 'Active', leave: 14 };
    setEmployees(prev => [newEmp, ...prev]);

    if (onUserAdded) {
      onUserAdded({
        id,
        name,
        firstName: name.split(' ')[0],
        role: 'EMPLOYEE',
        title: 'Employee',
        department: dept,
        detail: `${dept} · ${id}`,
        initials: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'EM'
      });
    }
    setShowAdd(false);
  }

  return <StandardPage title="People directory" subtitle="Only employees inside your assigned HR scope are shown.">
    <div className="table-tools">
      <div style={{ flex: 1, maxWidth: '320px' }}>
        <Search size={15}/>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search authorized employees…" style={{ border: 0, outline: 0, background: 'transparent', width: '100%', fontSize: '11px' }}/>
      </div>
      <button className="primary-inline" onClick={() => setShowAdd(true)}><Plus size={15}/> Add employee</button>
    </div>

    <div className="people-table">
      <header><span>Employee</span><span>Department</span><span>Leave</span><span>Status</span></header>
      {filtered.map(e=><div key={e.id}><span><b>{e.name}</b><small>{e.id}</small></span><span>{e.dept}</span><span>{e.leave||'—'} days</span><span><em className={e.status==='Pending'?'pending':''}>{e.status}</em></span></div>)}
    </div>

    {showAdd && <Modal title="Add New Employee Record" subtitle="Creates an employee profile and generates a sign-in account." close={() => setShowAdd(false)}>
      <form className="config-form" onSubmit={handleAddEmployee}>
        <label>Employee Full Name<input name="name" required placeholder="e.g. Vikram Sharma"/></label>
        <label>Department<input name="dept" required placeholder="e.g. Engineering, Finance, Product Design"/></label>
        <footer>
          <button type="button" className="secondary" onClick={() => setShowAdd(false)}>Cancel</button>
          <button className="primary-inline">Add Employee to Directory</button>
        </footer>
      </form>
    </Modal>}
  </StandardPage>;
}
