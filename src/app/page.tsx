'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  Activity, ArrowRight, BadgeCheck, Bot, Building2, Check, ChevronRight, CircleUserRound,
  Clock3, Database, DoorOpen, FileSpreadsheet, FileText, Fingerprint, Gauge, HardDrive,
  KeyRound, LifeBuoy, Link2, LockKeyhole, MessageSquareText, Network, Plus, Search, Send,
  Settings, Shield, ShieldAlert, ShieldCheck, Sparkles, Upload, UserCheck, UserCog, UserPlus,
  UsersRound, WalletCards, X,
} from 'lucide-react';

type Role = 'EMPLOYEE' | 'HR_ADMIN' | 'SYSTEM_ADMIN';
type User = { id:string; name:string; firstName:string; role:Role; title:string; department:string; initials:string };
type CheckItem = { label:string; detail:string; status:'passed'|'blocked'|'masked' };
type Message = { id:string; role:'assistant'|'user'; content:string; time:string; verdict?:'allowed'|'blocked'|'masked'; layer?:string; checks?:CheckItem[]; auditId?:string };

const USERS = [
  { id:'emp-1001', name:'Priya Sharma', role:'Employee', detail:'Product Design · EMP-1001', initials:'PS' },
  { id:'emp-1002', name:'Arjun Mehta', role:'Employee', detail:'Engineering · EMP-1002', initials:'AM' },
  { id:'hr-2001', name:'Neha Kapoor', role:'HR', detail:'People Operations · HR-2001', initials:'NK' },
  { id:'adm-3001', name:'Karthik Menon', role:'Admin', detail:'IT & Security · ADM-3001', initials:'KM' },
];
const WELCOME:Message = { id:'welcome', role:'assistant', content:'Hi! I’m your secure HR assistant. I only access information permitted for your signed-in role.', time:'Just now' };
const EMPLOYEES = [
  { id:'EMP-1001', name:'Priya Sharma', dept:'Product Design', status:'Active', leave:12 },
  { id:'EMP-1002', name:'Arjun Mehta', dept:'Engineering', status:'Active', leave:8 },
  { id:'EMP-1048', name:'Rahul Verma', dept:'Engineering', status:'Pending', leave:0 },
  { id:'EMP-1053', name:'Divya Nair', dept:'Finance', status:'Active', leave:14 },
];

function time(){ return new Intl.DateTimeFormat('en',{hour:'numeric',minute:'2-digit'}).format(new Date()); }
function roleName(role:Role){ return role==='EMPLOYEE'?'Employee':role==='HR_ADMIN'?'HR':'Administrator'; }

export default function Home(){
  const [user,setUser]=useState<User|null>(null);
  const [loading,setLoading]=useState(true);
  const [selected,setSelected]=useState(USERS[0].id);
  const [view,setView]=useState('overview');
  const [messages,setMessages]=useState<Message[]>([WELCOME]);
  const [input,setInput]=useState('');
  const [sending,setSending]=useState(false);
  const [trace,setTrace]=useState<Message>(WELCOME);
  const [tutorial,setTutorial]=useState(false);
  const [step,setStep]=useState(0);
  const [source,setSource]=useState('none');
  const scroll=useRef<HTMLDivElement>(null);

  useEffect(()=>{ fetch('/api/session').then(r=>r.ok?r.json():null).then(d=>setUser(d?.user??null)).finally(()=>setLoading(false)); },[]);
  useEffect(()=>{ scroll.current?.scrollTo({top:scroll.current.scrollHeight,behavior:'smooth'}); },[messages,sending]);
  useEffect(()=>{
    if(user?.role==='SYSTEM_ADMIN' && !localStorage.getItem('peopleguard_admin_tour_done')) setTutorial(true);
  },[user]);

  async function signIn(){
    const r=await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:selected})});
    if(!r.ok)return; const d=await r.json(); setUser(d.user); setView('overview');
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
  function finishTour(){ localStorage.setItem('peopleguard_admin_tour_done','1'); setTutorial(false); setStep(0); }

  if(loading) return <div className="loading-screen"><ShieldCheck size={28}/><p>Opening secure workspace…</p></div>;
  if(!user){
    const chosen=USERS.find(u=>u.id===selected)!;
    return <main className="login-page">
      <header className="login-nav"><Brand/><span className="konsole-chip"><Shield size={14}/> Protected by Konsole</span></header>
      <section className="login-shell">
        <div className="login-story"><span className="eyebrow"><Sparkles size={14}/> Secure HR, one trusted workspace</span><h1>Your people data.<br/><em>Guarded by design.</em></h1><p>One login identifies every user. Role-based access then opens the correct Employee, HR, or Admin workspace.</p>
          <div className="security-path"><Path icon={<Fingerprint/>} title="Authenticate" text="Who are you?"/><i/><Path icon={<LockKeyhole/>} title="Authorize" text="What can you access?"/><i/><Path icon={<ShieldCheck/>} title="Protect AI" text="Konsole security"/></div>
        </div>
        <div className="login-card"><div className="login-card-icon"><KeyRound/></div><h2>Sign in to ABC People</h2><p>Select a role-based demo account. Production deployment can connect SSO or your identity provider.</p>
          <label>Demo account</label><div className="account-list">{USERS.map(u=><button key={u.id} className={selected===u.id?'selected':''} onClick={()=>setSelected(u.id)}><span className="avatar small">{u.initials}</span><span><b>{u.name}</b><small>{u.detail}</small></span><em>{u.role}</em>{selected===u.id&&<Check size={15}/>}</button>)}</div>
          <button className="primary-button" onClick={signIn}>Continue as {chosen.role}<ArrowRight size={17}/></button>
          <div className="login-note"><LockKeyhole size={12}/> Secure demo identities · server-signed session</div>
        </div>
      </section>
    </main>;
  }

  const nav=user.role==='EMPLOYEE'
    ? [['overview','My overview',Gauge],['assistant','AI assistant',MessageSquareText],['profile','My profile',CircleUserRound],['documents','Payslips & documents',FileText],['requests','My requests',Clock3]]
    : user.role==='HR_ADMIN'
    ? [['overview','HR overview',Gauge],['people','People directory',UsersRound],['approvals','Registrations & approvals',UserCheck],['leave','Leave management',Clock3],['policies','Policies & documents',FileText],['assistant','AI assistant',MessageSquareText],['security','Security reviews',ShieldAlert]]
    : [['overview','Admin overview',Gauge],['users','Users & roles',UserCog],['sources','Employee data sources',Database],['integrations','Konsole & LLM',Network],['audit','Audit & security',Activity],['settings','System settings',Settings]];

  return <main className="app-shell">
    <aside className="sidebar"><div className="sidebar-brand"><Brand/></div><nav className="side-nav"><span className="nav-label">{roleName(user.role)} workspace</span>{nav.map(([id,label,Icon])=><button key={id as string} className={view===id?'active':''} onClick={()=>setView(id as string)}><Icon size={17}/>{label as string}</button>)}</nav>
      <div className="protection-card"><ShieldCheck size={20}/><div><b>Konsole Shield</b><span>Security profile active</span></div><i/></div>
      <div className="user-panel"><span className="avatar">{user.initials}</span><span><b>{user.name}</b><small>{roleName(user.role)} · {user.department}</small></span><button onClick={signOut} aria-label="Sign out"><DoorOpen size={17}/></button></div>
    </aside>
    <section className="workspace"><header className="topbar"><div><h1>{nav.find(x=>x[0]===view)?.[1] as string}</h1><span className="status"><i/> Secure session</span></div><div className="role-pill"><ShieldCheck size={14}/>{roleName(user.role)} access</div></header>
      <div className="page-body">
        {view==='assistant'?<Assistant user={user} messages={messages} input={input} sending={sending} trace={trace} scroll={scroll} setInput={setInput} send={send} setTrace={setTrace}/>:
         user.role==='EMPLOYEE'?<EmployeeView view={view} user={user} openAssistant={()=>setView('assistant')}/>:
         user.role==='HR_ADMIN'?<HRView view={view} openAssistant={()=>setView('assistant')}/>:
         <AdminView view={view} source={source} setSource={setSource} startTour={()=>{setStep(0);setTutorial(true)}}/>}
      </div>
    </section>
    {tutorial&&<AdminTour step={step} setStep={setStep} finish={finishTour} close={()=>setTutorial(false)} goSources={()=>{setView('sources');setTutorial(false)}}/>}
  </main>;
}

function Brand(){return <div className="brand"><div className="brand-mark"><ShieldCheck size={22}/></div><div><strong>PeopleGuard</strong><span>ABC Pvt Ltd</span></div></div>}
function Path({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div>{icon}<span><b>{title}</b><small>{text}</small></span></div>}

function EmployeeView({view,user,openAssistant}:{view:string;user:User;openAssistant:()=>void}){
  if(view==='profile') return <StandardPage title="My profile" subtitle="Only fields you are permitted to update are editable."><div className="profile-card"><span className="avatar xl">{user.initials}</span><div><h3>{user.name}</h3><p>{user.title} · {user.department}</p><button className="secondary">Edit permitted fields</button></div></div></StandardPage>;
  if(view==='documents') return <StandardPage title="Payslips & documents" subtitle="Protected documents linked to your employee account."><List rows={['June 2026 payslip','FY 2025–26 tax statement','Health insurance e-card']}/></StandardPage>;
  if(view==='requests') return <StandardPage title="My requests" subtitle="Track leave and HR service requests."><List rows={['Casual leave · 2 Aug · Pending manager approval','Address update · Completed','Employment letter · Ready to download']}/></StandardPage>;
  return <StandardPage title={`Good ${new Date().getHours()<12?'morning':'afternoon'}, ${user.firstName}`} subtitle="Your personal HR information, securely in one place.">
    <div className="metric-grid"><Metric label="Leave available" value="12 days" hint="4 requests used"/><Metric label="Next payday" value="31 Jul" hint="Payslip after processing"/><Metric label="Open requests" value="1" hint="Awaiting approval"/></div>
    <div className="split"><Panel title="Quick actions"><Action icon={<MessageSquareText/>} title="Ask PeopleGuard" text="Secure answers using only your data" onClick={openAssistant}/><Action icon={<FileText/>} title="View latest payslip" text="June 2026"/><Action icon={<Clock3/>} title="Request leave" text="Submit a new leave request"/></Panel><Panel title="Access boundary"><div className="boundary-box"><LockKeyhole/><div><b>Employee self-service</b><p>You can view your own HR information. Other employee records are denied before Konsole or an LLM is called.</p></div></div></Panel></div>
  </StandardPage>;
}

function HRView({view,openAssistant}:{view:string;openAssistant:()=>void}){
  if(view==='people') return <PeopleTable/>;
  if(view==='approvals') return <StandardPage title="Registrations & approvals" subtitle="Verify new employees before granting portal access."><div className="approval-card"><span className="avatar">RV</span><div><b>Rahul Verma</b><p>Engineering · EMP-1048 · Submitted 28 Jul</p></div><button className="secondary">Review</button><button className="approve">Approve</button></div></StandardPage>;
  if(view==='leave') return <StandardPage title="Leave management" subtitle="Review balances and pending leave for permitted departments."><List rows={['Rahul Verma · 3 days · Pending','Priya Sharma · 1 day · Manager approved','Arjun Mehta · Balance correction requested']}/></StandardPage>;
  if(view==='policies') return <StandardPage title="Policies & documents" subtitle="Publish trusted content used by the HR assistant."><button className="primary-inline"><Upload size={16}/> Upload HR policy</button><List rows={['Hybrid work policy · v3.2','Leave policy · v5.0','Benefits handbook · 2026']}/></StandardPage>;
  if(view==='security') return <StandardPage title="Security reviews" subtitle="Requests requiring HR review—without exposing unauthorized data."><List rows={['Blocked bulk salary request · KSL-42AF91','Prompt injection detected · KSL-19C7D0','PII masked in response · KSL-82BD31']}/></StandardPage>;
  return <StandardPage title="HR operations" subtitle="Manage people processes within your authorized scope."><div className="metric-grid"><Metric label="Employees in scope" value="184" hint="3 departments"/><Metric label="Pending approvals" value="7" hint="2 need attention"/><Metric label="Open leave requests" value="12" hint="5 due today"/></div><div className="split"><Panel title="Needs attention"><Action icon={<UserCheck/>} title="3 registrations need review" text="Validate identity and department"/><Action icon={<Clock3/>} title="5 leave requests due today" text="Review manager decisions"/><Action icon={<ShieldAlert/>} title="2 security escalations" text="Inspect denied AI requests"/></Panel><Panel title="HR assistant"><div className="boundary-box"><Bot/><div><b>Authorized HR questions</b><p>Ask across only the departments and employee fields assigned to you.</p><button className="text-button" onClick={openAssistant}>Open assistant <ArrowRight size={14}/></button></div></div></Panel></div></StandardPage>;
}

function AdminView({view,source,setSource,startTour}:{view:string;source:string;setSource:(s:string)=>void;startTour:()=>void}){
  if(view==='sources') return <StandardPage title="Employee data sources" subtitle="Connect one approved source. PeopleGuard retrieves only authorized fields for each request."><div className="source-grid"><Source id="database" selected={source} set={setSource} icon={<Database/>} title="Database" text="PostgreSQL or MySQL" detail="Secure read-only connection"/><Source id="api" selected={source} set={setSource} icon={<Link2/>} title="HR system API" text="Workday, BambooHR, Zoho" detail="OAuth or service account"/><Source id="file" selected={source} set={setSource} icon={<FileSpreadsheet/>} title="CSV / Excel import" text="Fastest for a demo" detail="Validate columns before import"/></div>{source!=='none'&&<div className="config-banner"><Check/><div><b>{source==='database'?'Database':source==='api'?'HR API':'File import'} selected</b><p>Continue to configure and test this source. Secrets are stored server-side and never shown to employees.</p></div><button className="approve">Configure source</button></div>}</StandardPage>;
  if(view==='users') return <StandardPage title="Users & roles" subtitle="Create accounts and apply least-privilege role assignments."><button className="primary-inline"><UserPlus size={16}/> Add user</button><div className="role-table"><div><b>Neha Kapoor</b><span>HR · Engineering & Product</span><em>Active</em></div><div><b>Karthik Menon</b><span>Admin · System configuration</span><em>Active</em></div><div><b>Rahul Verma</b><span>Employee · Registration pending</span><em className="pending">Pending</em></div></div></StandardPage>;
  if(view==='integrations') return <StandardPage title="Konsole & LLM" subtitle="Configure the protected AI gateway and approved model routing."><div className="integration-card"><ShieldCheck/><div><b>Konsole Enterprise profile</b><p>PII detection · prompt injection defense · jailbreak detection · encrypted routing</p></div><span>Connected</span></div><div className="integration-card"><Network/><div><b>Approved model route</b><p>Gemini / Qwen / DeepSeek / MiniMax through Konsole</p></div><button className="secondary">Configure</button></div></StandardPage>;
  if(view==='audit') return <StandardPage title="Audit & security" subtitle="Monitor access, configuration changes, and blocked attacks."><List rows={['09:42 · ADMIN · Data source settings viewed','09:31 · KONSOLE · Prompt injection blocked','09:15 · HR · Employee EMP-1048 registration reviewed','08:57 · AUTH · Failed login blocked']}/></StandardPage>;
  if(view==='settings') return <StandardPage title="System settings" subtitle="Departments, retention, backups, and tutorial preferences."><List rows={['Departments & locations','Permission policies','Backup & retention','Security notifications']}/><button className="secondary restart" onClick={startTour}><LifeBuoy size={15}/> Restart setup tutorial</button></StandardPage>;
  return <StandardPage title="Administration" subtitle="Configure access, integrations, and security—without automatic access to employee salaries."><div className="metric-grid"><Metric label="Active users" value="186" hint="4 roles pending"/><Metric label="Data source" value="Not connected" hint="Setup required"/><Metric label="Security events" value="2" hint="Last 24 hours"/></div><div className="setup-callout"><div><span><Sparkles/></span><div><b>Finish PeopleGuard setup</b><p>Connect employee data, confirm roles, configure Konsole, and run a safe test.</p></div></div><button onClick={startTour}>Continue guided setup <ArrowRight size={15}/></button></div><div className="split"><Panel title="System health"><Action icon={<Database/>} title="Employee source" text="Connection required"/><Action icon={<ShieldCheck/>} title="Konsole gateway" text="Security profile active"/><Action icon={<HardDrive/>} title="Backups" text="Daily retention configured"/></Panel><Panel title="Admin boundary"><div className="boundary-box"><LockKeyhole/><div><b>Configuration access only</b><p>Admin manages users, permissions, integrations, and logs. Salary visibility is not granted automatically.</p></div></div></Panel></div></StandardPage>;
}

function Assistant({user,messages,input,sending,trace,scroll,setInput,send,setTrace}:{user:User;messages:Message[];input:string;sending:boolean;trace:Message;scroll:React.RefObject<HTMLDivElement|null>;setInput:(s:string)=>void;send:(e?:FormEvent,p?:string)=>void;setTrace:(m:Message)=>void}){
 const prompts=user.role==='HR_ADMIN'?['How many leave days does Arjun have?','Show Rahul’s profile','Explain the hybrid work policy']:['How many leave days do I have?','What is my salary?','Explain the hybrid work policy'];
 const checks=trace.checks??[{label:'Authentication',detail:'Session identity verified',status:'passed' as const},{label:'Authorization',detail:'Waiting for request',status:'passed' as const},{label:'Konsole security',detail:'Protection active',status:'passed' as const}];
 return <div className="assistant-grid"><section className="chat-panel"><div className="chat-scroll" ref={scroll}><div className="chat-heading"><div className="bot-orb"><Bot/></div><h2>Secure HR assistant</h2><p>Authorization happens before employee data reaches Konsole.</p></div><div className="prompt-row">{prompts.map(p=><button key={p} onClick={()=>send(undefined,p)}>{p}<ChevronRight size={14}/></button>)}</div><div className="conversation">{messages.map(m=><div className={`message-row ${m.role}`} key={m.id} onClick={()=>m.checks&&setTrace(m)}>{m.role==='assistant'&&<span className="message-avatar"><Bot size={16}/></span>}<div><div className={`message-bubble ${m.verdict==='blocked'?'blocked':''}`}>{m.content}</div><small>{m.time}{m.layer&&` · ${m.layer}`}</small></div></div>)}{sending&&<div className="message-row"><span className="message-avatar"><Bot size={16}/></span><div className="message-bubble">Checking access and security…</div></div>}</div></div><form className="composer-wrap" onSubmit={send}><div className="composer"><textarea rows={1} value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask an HR question…"/><button disabled={!input.trim()||sending}><Send size={17}/></button></div><p><LockKeyhole size={11}/> Minimum authorized data only</p></form></section><aside className="security-panel"><h3><ShieldCheck/> Security trace</h3><div className={`decision-card ${trace.verdict==='blocked'?'blocked':''}`}><BadgeCheck/><div><small>Latest decision</small><b>{trace.verdict==='blocked'?'Request blocked':'Secure pipeline ready'}</b><span>{trace.layer??'Waiting for request'}</span></div></div>{checks.map(c=><div className="check-row" key={c.label}><span className={`check-icon ${c.status}`}><Check size={13}/></span><div><b>{c.label}</b><small>{c.detail}</small></div></div>)}<div className="boundary-box compact"><LockKeyhole/><div><b>Data boundary</b><p>Only approved fields enter AI context.</p></div></div><code>{trace.auditId??'No audit event yet'}</code></aside></div>
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
function PeopleTable(){return <StandardPage title="People directory" subtitle="Only employees inside your assigned HR scope are shown."><div className="table-tools"><div><Search size={15}/> Search authorized employees</div><button className="primary-inline"><Plus size={15}/> Add employee</button></div><div className="people-table"><header><span>Employee</span><span>Department</span><span>Leave</span><span>Status</span></header>{EMPLOYEES.map(e=><div key={e.id}><span><b>{e.name}</b><small>{e.id}</small></span><span>{e.dept}</span><span>{e.leave||'—'} days</span><span><em className={e.status==='Pending'?'pending':''}>{e.status}</em></span></div>)}</div></StandardPage>}
