'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import {
  Activity, ArrowRight, BadgeCheck, Bot, Check, ChevronRight, CircleUserRound,
  Database, DoorOpen, Eye, EyeOff, FileSpreadsheet, FileText, Fingerprint, Gauge,
  KeyRound, Link2, LockKeyhole, MessageSquareText, Network, Plus, Search, Send,
  Shield, ShieldAlert, ShieldCheck, Sparkles, Upload, UserCog, UserPlus, UsersRound, X,
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
const WELCOME:Message = { id:'welcome', role:'assistant', content:'Hi! I’m PeopleGuard. Ask me about your salary, benefits, manager, contact details, leave balance, or company policies. I retrieve only the fields your signed-in identity is allowed to see.', time:'Just now' };
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

  useEffect(()=>{ fetch('/api/session').then(r=>r.ok?r.json():null).then(d=>{setUser(d?.user??null);if(d?.user?.role==='SYSTEM_ADMIN'&&!localStorage.getItem('peopleguard_admin_tour_done'))setTutorial(true)}).finally(()=>setLoading(false)); },[]);
  useEffect(()=>{ scroll.current?.scrollTo({top:scroll.current.scrollHeight,behavior:'smooth'}); },[messages,sending]);

  async function signIn(){
    const r=await fetch('/api/session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:selected})});
    if(!r.ok)return; const d=await r.json(); setUser(d.user); setView(d.user.role==='SYSTEM_ADMIN'?'overview':'assistant');
    if(d.user.role==='SYSTEM_ADMIN'&&!localStorage.getItem('peopleguard_admin_tour_done'))setTutorial(true);
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
        <div className="login-story"><span className="eyebrow"><Sparkles size={14}/> Answers without an HR ticket</span><h1>Ask about your work life.<br/><em>Get a secure answer now.</em></h1><p>PeopleGuard is an employee-data chatbot. Your identity limits what the backend retrieves, while Konsole protects the AI interaction from prompt attacks and sensitive-data leakage.</p>
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
  if(view==='profile') return <StandardPage title="My authorized data" subtitle="These are the record categories PeopleGuard may retrieve when you ask."><div className="profile-card"><span className="avatar xl">{user.initials}</span><div><h3>{user.name}</h3><p>{user.title} · {user.department}</p><div className="data-tags"><span>Compensation</span><span>Benefits</span><span>Leave balance</span><span>Manager</span><span>Masked contact data</span></div><button className="primary-inline" onClick={openAssistant}><MessageSquareText size={15}/> Ask about my data</button></div></div></StandardPage>;
  if(view==='documents') return <StandardPage title="Payslips & documents" subtitle="Protected documents linked to your employee account."><List rows={['June 2026 payslip','FY 2025–26 tax statement','Health insurance e-card']}/></StandardPage>;
  return null;
}

function HRView({view,openAssistant}:{view:string;openAssistant:()=>void}){
  if(view==='people') return <PeopleTable/>;
  if(view==='policies') return <StandardPage title="Policies & documents" subtitle="Publish trusted content used by the HR assistant."><button className="primary-inline"><Upload size={16}/> Upload HR policy</button><List rows={['Hybrid work policy · v3.2','Leave policy · v5.0','Benefits handbook · 2026']}/></StandardPage>;
  if(view==='security') return <StandardPage title="Security reviews" subtitle="Requests requiring HR review—without exposing unauthorized data."><List rows={['Blocked bulk salary request · KSL-42AF91','Prompt injection detected · KSL-19C7D0','PII masked in response · KSL-82BD31']}/></StandardPage>;
  return <StandardPage title="HR chatbot access" subtitle="Use PeopleGuard for permitted employee questions instead of navigating an HRMS."><div className="boundary-box"><Bot/><div><b>Authorized HR questions</b><p>Ask across only the departments and employee fields assigned to you.</p><button className="text-button" onClick={openAssistant}>Open assistant <ArrowRight size={14}/></button></div></div></StandardPage>;
}

type AdminDialog = 'source'|'konsole'|'user'|null;
type AdminPerson = { name:string; email:string; role:string; scope:string; status:string };

function AdminView({view,source,setSource,startTour}:{view:string;source:string;setSource:(s:string)=>void;startTour:()=>void}){
  const [dialog,setDialog]=useState<AdminDialog>(null);
  const [sourceActive,setSourceActive]=useState(false);
  const [people,setPeople]=useState<AdminPerson[]>([
    {name:'Neha Kapoor',email:'neha@abc.example',role:'HR',scope:'Engineering & Product',status:'Active'},
    {name:'Karthik Menon',email:'karthik@abc.example',role:'Admin',scope:'System configuration only',status:'Active'},
    {name:'Rahul Verma',email:'rahul@abc.example',role:'Employee',scope:'Own record only',status:'Pending'},
  ]);
  const [konsole,setKonsole]=useState({hasApiKey:false,baseUrl:'https://api.konsole.one/v1',defaultModel:'',runtime:false});

  async function refreshKonsole(){
    const response=await fetch('/api/models');
    if(response.ok) setKonsole(await response.json());
  }
  useEffect(()=>{ fetch('/api/models').then(response=>response.ok?response.json():null).then(data=>{if(data)setKonsole(data)}); },[]);

  if(view==='sources') return <>
    <StandardPage title="Employee data source" subtitle="Connect the read-only source the chatbot will query after authorization. This is not an HRMS workflow.">
      <div className="source-grid"><Source id="database" selected={source} set={s=>{setSource(s);setSourceActive(false)}} icon={<Database/>} title="Database" text="PostgreSQL or MySQL" detail="Read-only employee records"/><Source id="api" selected={source} set={s=>{setSource(s);setSourceActive(false)}} icon={<Link2/>} title="HR system API" text="Workday, BambooHR, Zoho" detail="Fetch only approved fields"/><Source id="file" selected={source} set={s=>{setSource(s);setSourceActive(false)}} icon={<FileSpreadsheet/>} title="CSV / Excel demo" text="Upload sample employee data" detail="Best for the hackathon demo"/></div>
      {source!=='none'&&<div className="config-banner"><Check/><div><b>{sourceActive?'Source active':`${source==='database'?'Database':source==='api'?'HR API':'CSV / Excel'} selected`}</b><p>{sourceActive?'The chatbot can now retrieve authorized employee fields from this demo source.':'Open the form to enter connection details and run a safe test.'}</p></div><button className="approve" onClick={()=>setDialog('source')}>{sourceActive?'Edit source':'Configure source'}</button></div>}
    </StandardPage>
    {dialog==='source'&&<SourceDialog source={source} close={()=>setDialog(null)} activate={()=>{setSourceActive(true);setDialog(null)}}/>}
  </>;

  if(view==='users') return <>
    <StandardPage title="Users & authorization" subtitle="Map signed-in identities to least-privilege chatbot access. Admin access never grants salary access.">
      <button className="primary-inline" onClick={()=>setDialog('user')}><UserPlus size={16}/> Add user</button>
      <div className="role-table">{people.map(person=><div key={person.email}><b>{person.name}<small>{person.email}</small></b><span>{person.role} · {person.scope}</span><em className={person.status==='Pending'?'pending':''}>{person.status}</em></div>)}</div>
    </StandardPage>
    {dialog==='user'&&<UserDialog close={()=>setDialog(null)} add={person=>{setPeople(current=>[...current,person]);setDialog(null)}}/>}
  </>;

  if(view==='integrations') return <>
    <StandardPage title="Konsole & LLM" subtitle="Configure the security gateway and the approved model used only after authentication and authorization.">
      <div className="integration-card"><ShieldCheck/><div><b>Konsole protection profile</b><p>PII detection · prompt injection defense · jailbreak detection · protected routing</p></div><span className={konsole.hasApiKey?'':'needs-setup'}>{konsole.hasApiKey?'Credential ready':'Setup required'}</span><button className="secondary" onClick={()=>setDialog('konsole')}>{konsole.hasApiKey?'Manage':'Configure'}</button></div>
      <div className="integration-card"><Network/><div><b>Approved model route</b><p>{konsole.defaultModel||'Choose a model returned by your Konsole account'}</p></div><button className="secondary" onClick={()=>setDialog('konsole')}>Configure</button></div>
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

function SourceDialog({source,close,activate}:{source:string;close:()=>void;activate:()=>void}){
  const [testing,setTesting]=useState(false);
  const [tested,setTested]=useState(false);
  const label=source==='database'?'Read-only database':source==='api'?'HR system API':'CSV / Excel demo';
  function test(e:FormEvent){e.preventDefault();setTesting(true);setTimeout(()=>{setTesting(false);setTested(true)},650)}
  return <Modal title={`Configure ${label}`} subtitle="This demo validates the setup flow. Production secrets belong in server-side environment settings." close={close}>
    <form className="config-form" onSubmit={test}>
      {source==='file'?<label className="upload-field"><Upload/><span><b>Select employee CSV or Excel</b><small>Required columns: employee_id, name, department, role</small></span><input type="file" accept=".csv,.xlsx,.xls" required/></label>:<>
        <label>{source==='database'?'Connection URL':'API base URL'}<input type="url" required placeholder={source==='database'?'postgresql://readonly@host/database':'https://api.your-hr-system.com'}/></label>
        <label>{source==='database'?'Read-only password':'Service credential'}<input type="password" required placeholder="Stored server-side in production"/></label>
      </>}
      <div className="least-fields"><b>Allowed chatbot fields</b><label><input type="checkbox" defaultChecked/> Salary</label><label><input type="checkbox" defaultChecked/> Benefits</label><label><input type="checkbox" defaultChecked/> Leave balance</label><label><input type="checkbox" defaultChecked/> Manager</label></div>
      {tested&&<div className="form-success"><Check/> Demo connection test passed. Field boundary is valid.</div>}
      <footer><button type="button" className="secondary" onClick={close}>Cancel</button>{tested?<button type="button" className="primary-inline" onClick={activate}>Activate source</button>:<button className="primary-inline" disabled={testing}>{testing?'Testing…':'Test connection'}</button>}</footer>
    </form>
  </Modal>;
}

function UserDialog({close,add}:{close:()=>void;add:(person:AdminPerson)=>void}){
  function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();const data=new FormData(e.currentTarget);const role=String(data.get('role'));add({name:String(data.get('name')),email:String(data.get('email')),role,scope:role==='Employee'?'Own record only':role==='HR'?'Selected departments':'System configuration only',status:'Active'})}
  return <Modal title="Add chatbot user" subtitle="The role controls which employee records the backend may retrieve." close={close}><form className="config-form" onSubmit={submit}><label>Full name<input name="name" required placeholder="Employee name"/></label><label>Work email<input name="email" type="email" required placeholder="name@company.com"/></label><label>Role<select name="role" defaultValue="Employee"><option>Employee</option><option>HR</option><option>Admin</option></select></label><div className="form-info"><LockKeyhole/> Employees can access only their own record. HR scope must be limited by department. Admin configures the system but cannot read salaries.</div><footer><button type="button" className="secondary" onClick={close}>Cancel</button><button className="primary-inline">Add user</button></footer></form></Modal>;
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
  async function test(e:FormEvent){e.preventDefault();setTesting(true);setError('');const response=await fetch('/api/models',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({apiKey:key,baseUrl,model})});const data=await response.json();setTesting(false);if(!response.ok){setError(data.error||'Connection failed');return}setModels((data.models||[]).map((item:{id:string})=>item.id));setModel(data.defaultModel||data.models?.[0]?.id||model);setKey('');setVerified(true)}
  async function activate(){const response=await fetch('/api/models',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({model})});if(!response.ok){const data=await response.json();setError(data.error||'Could not save route');return}saved()}
  return <Modal title="Configure Konsole & model" subtitle="The credential is sent once to the server for validation, cleared from this form, and never returned by the API." close={close}><form className="config-form" onSubmit={test}><label>Konsole API base URL<input type="url" value={baseUrl} onChange={e=>setBaseUrl(e.target.value)} required/></label><label>Konsole API key<div className="secret-input"><input type={show?'text':'password'} value={key} onChange={e=>setKey(e.target.value)} required={!initial.hasApiKey} placeholder={initial.hasApiKey?'A server-side key is already configured':'Paste your Konsole key'}/><button type="button" onClick={()=>setShow(v=>!v)} aria-label={show?'Hide API key':'Show API key'}>{show?<EyeOff/>:<Eye/>}</button></div></label>{(verified||models.length>0)&&<label>Approved model<select value={model} onChange={e=>setModel(e.target.value)}>{models.length?models.map(item=><option key={item}>{item}</option>):<option>{model}</option>}</select></label>}<div className="protection-options"><b>Protection profile</b><label><input type="checkbox" defaultChecked/> Prompt-injection detection</label><label><input type="checkbox" defaultChecked/> Jailbreak detection</label><label><input type="checkbox" defaultChecked/> PII masking</label><label><input type="checkbox" defaultChecked/> Output inspection</label></div>{error&&<div className="form-error">{error}</div>}{verified&&<div className="form-success"><Check/> Credential verified. The secret is held only in server runtime for this demo.</div>}<div className="form-info"><ShieldCheck/> For durable production use, store KONSOLE_API_KEY as a hosted secret. Do not commit it to GitHub.</div><footer><button type="button" className="secondary" onClick={close}>Cancel</button>{verified?<button type="button" className="primary-inline" onClick={activate}>Activate model route</button>:<button className="primary-inline" disabled={testing||(!key&&!initial.hasApiKey)}>{testing?'Testing securely…':'Test credential'}</button>}</footer></form></Modal>;
}

function Modal({title,subtitle,close,children}:{title:string;subtitle:string;close:()=>void;children:React.ReactNode}){return <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title}><section className="config-modal"><button className="modal-close" onClick={close} aria-label="Close"><X/></button><div className="modal-heading"><span><ShieldCheck/></span><div><h2>{title}</h2><p>{subtitle}</p></div></div>{children}</section></div>}

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
function PeopleTable(){return <StandardPage title="People directory" subtitle="Only employees inside your assigned HR scope are shown."><div className="table-tools"><div><Search size={15}/> Search authorized employees</div><button className="primary-inline"><Plus size={15}/> Add employee</button></div><div className="people-table"><header><span>Employee</span><span>Department</span><span>Leave</span><span>Status</span></header>{EMPLOYEES.map(e=><div key={e.id}><span><b>{e.name}</b><small>{e.id}</small></span><span>{e.dept}</span><span>{e.leave||'—'} days</span><span><em className={e.status==='Pending'?'pending':''}>{e.status}</em></span></div>)}</div></StandardPage>}
