import { useState, useEffect, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400&display=swap');`;

const BG='#060606', SURF='#0F0F0F', SURF2='#181818', BDR='#272727', ACC='#8DC63F', TEXT='#F2F2F0', MUTED='#666660';
const WARN='#E8A020', DANGER='#E05050';

// ── Supabase client ──────────────────────────────────────────────────────────
const SB_URL = 'https://xvyvqmvcjwvedfkdygco.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2eXZxbXZjand2ZWRma2R5Z2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNjI1MDQsImV4cCI6MjA5MjYzODUwNH0.WYunV6-RzcxuVGjrp5jMLo5Lsyi1OHxYVRXC7ktvJfY';
const HDR = { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

const sb = {
  async get(table, query = '') {
    try {
      const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { headers: HDR });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    } catch (e) { console.error('sb.get', e); return null; }
  },
  async upsert(table, data) {
    try {
      const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers: { ...HDR, 'Prefer': 'resolution=merge-duplicates,return=representation' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(await r.text());
      return r.json();
    } catch (e) { console.error('sb.upsert', e); return null; }
  },
  async del(table, query) {
    try {
      const r = await fetch(`${SB_URL}/rest/v1/${table}?${query}`, { method: 'DELETE', headers: HDR });
      return r.ok;
    } catch (e) { console.error('sb.del', e); return false; }
  },
};
// ────────────────────────────────────────────────────────────────────────────

const EMPTY_SET = { reps:'', load:'', completed:true, notes:'' };
const EMPTY_TPL_EX = { name:'', plannedSets:3, plannedReps:'', plannedLoad:'', cues:'' };

const st = {
  app: {fontFamily:"'Outfit',sans-serif",background:BG,color:TEXT,minHeight:'100vh'},
  nav: {display:'flex',alignItems:'center',padding:'0 18px',height:52,borderBottom:`1px solid ${BDR}`,background:BG,position:'sticky',top:0,zIndex:100,gap:6},
  logo: {fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:3,color:ACC,marginRight:'auto'},
  main: {maxWidth:900,margin:'0 auto',padding:'24px 16px'},
  btnP: {padding:'9px 20px',background:ACC,color:'#000',border:'none',borderRadius:5,cursor:'pointer',fontSize:13,fontFamily:"'Outfit',sans-serif",fontWeight:700},
  btnS: {padding:'8px 16px',background:SURF2,color:TEXT,border:`1px solid ${BDR}`,borderRadius:5,cursor:'pointer',fontSize:13,fontFamily:"'Outfit',sans-serif",fontWeight:500},
  btnG: {padding:'6px 12px',background:'none',color:MUTED,border:'none',cursor:'pointer',fontSize:13,fontFamily:"'Outfit',sans-serif"},
  btnD: {padding:'5px 10px',background:'#1A0000',color:DANGER,border:`1px solid #330000`,borderRadius:4,cursor:'pointer',fontSize:11},
  card: {background:SURF,border:`1px solid ${BDR}`,borderRadius:10,padding:'16px 20px',marginBottom:12},
  sect: {background:SURF,border:`1px solid ${BDR}`,borderRadius:10,padding:'20px 22px',marginBottom:16},
  sectT: {fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:2,color:ACC,display:'block',marginBottom:16,paddingBottom:10,borderBottom:`1px solid ${BDR}`},
  inp: {width:'100%',background:SURF2,border:`1px solid #333`,color:TEXT,padding:'9px 12px',borderRadius:5,fontSize:14,fontFamily:"'Outfit',sans-serif",boxSizing:'border-box',outline:'none'},
  lbl: {display:'block',fontSize:11,fontWeight:700,letterSpacing:1.5,color:MUTED,marginBottom:5,textTransform:'uppercase'},
  fld: {marginBottom:14},
  g2: {display:'grid',gridTemplateColumns:'1fr 1fr',gap:14},
  tag: {display:'inline-block',padding:'2px 8px',background:'rgba(141,198,63,0.12)',color:ACC,borderRadius:3,fontSize:11,fontWeight:700},
  th: {textAlign:'left',padding:'8px 10px',background:'rgba(141,198,63,0.07)',color:ACC,fontSize:10,fontWeight:700,letterSpacing:1},
  td: {padding:'7px 10px',borderBottom:`1px solid ${BDR}`,fontSize:13,color:'#CCC'},
  plan: {fontSize:11,color:MUTED,background:SURF2,padding:'4px 10px',borderRadius:4,display:'inline-flex',gap:8,alignItems:'center'},
};

const F = ({label,children}) => <div style={st.fld}><label style={st.lbl}>{label}</label>{children}</div>;
const Inp = ({value,onChange,type='text',placeholder='',sx={}}) => (
  <input type={type} placeholder={placeholder} style={{...st.inp,...sx}} value={value} onChange={onChange} />
);
const Sel = ({value,onChange,opts}) => (
  <select style={st.inp} value={value} onChange={onChange}>{opts.map(o=><option key={o}>{o}</option>)}</select>
);
const Tab = ({active,onClick,children}) => (
  <button onClick={onClick} style={{padding:'7px 13px',border:`1px solid ${active?ACC:BDR}`,background:active?'rgba(141,198,63,0.08)':'transparent',color:active?ACC:MUTED,borderRadius:5,cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:"'Outfit',sans-serif"}}>
    {children}
  </button>
);
const Spin = () => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'64px 0',flexDirection:'column',gap:16}}>
    <div style={{width:36,height:36,border:`3px solid ${BDR}`,borderTop:`3px solid ${ACC}`,borderRadius:'50%',animation:'spin 0.8s linear infinite'}} />
    <span style={{color:MUTED,fontSize:13}}>Carregando...</span>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default function App() {
  const [view, setView]       = useState('login');
  const [student, setStudent] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [coachPass, setCoachPass] = useState('');
  const [loading, setLoading] = useState(false);

  const [logs, setLogs]           = useState([]);
  const [templates, setTemplates] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [studData, setStudData]   = useState({});

  const [selWeek, setSelWeek]   = useState('');
  const [logData, setLogData]   = useState(null);

  const [coachTab, setCoachTab]         = useState('alunos');
  const [editTpl, setEditTpl]           = useState(null);
  const [expandedStudent, setExpandedStudent] = useState(null);
  const [selEx, setSelEx]               = useState('');
  const [showImport, setShowImport]     = useState(false);
  const [importState, setImportState]   = useState({ loading: false, error: null, result: null });

  useEffect(() => { loadTemplates(); }, []);
  useEffect(() => { if (student) loadLogs(student); }, [student]);

  const loadTemplates = async () => {
    const data = await sb.get('templates', 'order=created_at.asc');
    setTemplates(data || []);
  };

  const loadLogs = async (name) => {
    setLoading(true);
    const data = await sb.get('logs', `student_id=eq.${encodeURIComponent(name)}&order=date.desc`);
    setLogs(data || []);
    setLoading(false);
  };

  const loadCoach = async () => {
    setLoading(true);
    await loadTemplates();
    const students = await sb.get('students', 'order=name.asc');
    const idx = (students || []).map(s => s.name);
    setAllStudents(idx);
    const allLogs = await sb.get('logs', 'order=date.desc');
    const data = {};
    idx.forEach(n => { data[n] = (allLogs || []).filter(l => l.student_id === n); });
    setStudData(data);
    setLoading(false);
  };

  const login = async () => {
    const name = nameInput.trim(); if (!name) return;
    setLoading(true);
    await sb.upsert('students', { id: name, name });
    setStudent(name);
    setView('dash');
    setLoading(false);
  };

  const enterCoach = async () => {
    if (coachPass === 'pokai2026') { await loadCoach(); setView('coach'); }
    else alert('Senha incorreta. Use: pokai2026');
  };

  const startFromTemplate = (tpl) => {
    setLogData({
      id: null,
      date: new Date().toISOString().split('T')[0],
      week: selWeek,
      templateId: tpl.id,
      templateName: tpl.name,
      exercises: tpl.exercises.map(ex => ({
        name: ex.name, cues: ex.cues,
        planned: { sets: ex.plannedSets, reps: ex.plannedReps, load: ex.plannedLoad },
        sets: Array.from({ length: ex.plannedSets }, () => ({ ...EMPTY_SET })),
      })),
      rpe: 7, energy: 'média', highlights: '', notes: '',
    });
    setView('newlog');
  };

  const saveLog = async () => {
    if (!logData) return;
    setLoading(true);
    const id = logData.id || String(Date.now());
    await sb.upsert('logs', {
      id,
      student_id:    student,
      date:          logData.date,
      week:          logData.week,
      template_id:   logData.templateId,
      template_name: logData.templateName,
      exercises:     logData.exercises,
      rpe:           logData.rpe,
      energy:        logData.energy,
      highlights:    logData.highlights,
      notes:         logData.notes,
    });
    await loadLogs(student);
    setView('dash');
    setLoading(false);
  };

  const updSet = (ei,si,f,v) => setLogData(p=>({...p,exercises:p.exercises.map((e,i)=>i===ei?{...e,sets:e.sets.map((s,j)=>j===si?{...s,[f]:v}:s)}:e)}));
  const addSet = (ei)        => setLogData(p=>({...p,exercises:p.exercises.map((e,i)=>i===ei?{...e,sets:[...e.sets,{...EMPTY_SET}]}:e)}));
  const remSet = (ei,si)     => setLogData(p=>({...p,exercises:p.exercises.map((e,i)=>i===ei?{...e,sets:e.sets.filter((_,j)=>j!==si)}:e)}));

  const saveTpl = async (tpl) => {
    const id = tpl.id || String(Date.now());
    await sb.upsert('templates', { ...tpl, id });
    await loadTemplates();
    setEditTpl(null);
  };

  const deleteTpl = async (id) => {
    if (!confirm('Remover esse treino?')) return;
    await sb.del('templates', `id=eq.${id}`);
    await loadTemplates();
  };

  const importFromPDF = async (file) => {
    setImportState({ loading: true, error: null, result: null });
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(',')[1]);
        r.onerror = () => rej(new Error('Erro ao ler PDF'));
        r.readAsDataURL(file);
      });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: base64 },
              },
              {
                type: 'text',
                text: `Analise este PDF de treino e extraia os treinos presentes. Responda APENAS com um JSON válido, sem texto adicional, sem markdown, sem blocos de código. Formato exato:
[
  {
    "name": "Treino A",
    "description": "descrição breve",
    "exercises": [
      {
        "name": "nome do exercicio",
        "plannedSets": 3,
        "plannedReps": "8-10",
        "plannedLoad": "60kg",
        "cues": "dica técnica se houver"
      }
    ]
  }
]
Se houver múltiplos treinos (A, B, C...), retorne todos no array. plannedSets deve ser número inteiro.`,
              },
            ],
          }],
        }),
      });

      const data = await response.json();
      const text = data.content?.find(b => b.type === 'text')?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setImportState({ loading: false, error: null, result: parsed });
    } catch (e) {
      setImportState({ loading: false, error: 'Não foi possível extrair os treinos. Verifique se o PDF contém texto legível.', result: null });
    }
  };

  const confirmImport = async (treinos) => {
    for (const t of treinos) {
      const id = String(Date.now()) + Math.random().toString(36).slice(2);
      await sb.upsert('templates', { ...t, id });
    }
    await loadTemplates();
    setImportState({ loading: false, error: null, result: null });
    setShowImport(false);
  };

  const exNames = useMemo(() => {
    const n = new Set();
    logs.forEach(l => l.exercises?.forEach(e => e.name && n.add(e.name)));
    return [...n];
  }, [logs]);

  const progressData = useMemo(() => {
    if (!selEx) return [];
    return [...logs].reverse().filter(l => l.exercises?.some(e => e.name === selEx)).map(l => {
      const ex = l.exercises.find(e => e.name === selEx);
      const done = ex.sets.filter(s => s.completed);
      const maxLoad = done.length ? Math.max(...done.map(s => parseFloat(s.load) || 0)) : 0;
      const vol = Math.round(done.reduce((a, s) => a + (parseFloat(s.reps) || 0) * (parseFloat(s.load) || 0), 0));
      return { date: l.date.slice(5), maxLoad, volume: vol };
    });
  }, [logs, selEx]);

  const stats = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
    const lastWeek = logs.filter(l => new Date(l.date) >= cutoff).length;
    const freq = {};
    logs.forEach(l => l.exercises?.forEach(e => { if (e.name) freq[e.name] = (freq[e.name] || 0) + 1; }));
    const favEx = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    return { total: logs.length, lastWeek, favEx };
  }, [logs]);

  const exSum = (ex) => {
    const done = ex.sets.filter(s => s.completed);
    const maxLoad = done.length ? Math.max(...done.map(s => parseFloat(s.load) || 0)) : 0;
    const vol = Math.round(done.reduce((a, s) => a + (parseFloat(s.reps) || 0) * (parseFloat(s.load) || 0), 0));
    return { done: done.length, total: ex.sets.length, maxLoad, vol };
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={st.app}>
      <style>{FONTS}</style>
      <nav style={st.nav}>
        <span style={st.logo}>PŌKAI <span style={{color:TEXT,fontWeight:300,fontSize:14,letterSpacing:4}}>MOVEMENT</span></span>
        {student && <>
          <Tab active={view==='dash'}     onClick={()=>setView('dash')}>Dashboard</Tab>
          <Tab active={view==='pick'}     onClick={()=>setView('pick')}>Novo Treino</Tab>
          <Tab active={view==='history'}  onClick={()=>setView('history')}>Histórico</Tab>
          <Tab active={view==='progress'} onClick={()=>setView('progress')}>Progresso</Tab>
          <span style={{fontSize:12,color:MUTED,marginLeft:'auto',borderLeft:`1px solid ${BDR}`,paddingLeft:12}}>👤 {student}</span>
        </>}
      </nav>

      <div style={st.main}>

        {/* LOGIN */}
        {view==='login' && (
          <div style={{maxWidth:400,margin:'48px auto 0',textAlign:'center'}}>
            <div style={{marginBottom:32}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:56,letterSpacing:6,color:TEXT,lineHeight:1}}>PŌKAI</div>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:8,color:ACC,marginBottom:8}}>MOVEMENT</div>
              <div style={{width:32,height:3,background:ACC,margin:'0 auto 16px'}}/>
              <p style={{color:MUTED,fontSize:13}}>Registre seus treinos. Acompanhe sua evolução.</p>
            </div>
            <div style={st.card}>
              <F label="Seu nome completo">
                <Inp value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="Ex: João Silva" sx={{fontSize:15}} />
              </F>
              <button style={{...st.btnP,width:'100%',padding:'12px',fontSize:15}} onClick={login} disabled={loading}>
                {loading ? 'ENTRANDO...' : 'ENTRAR NA MATILHA →'}
              </button>
            </div>
            <div style={{marginTop:24,borderTop:`1px solid ${BDR}`,paddingTop:20}}>
              <p style={{fontSize:12,color:MUTED,marginBottom:10}}>Acesso exclusivo para professores</p>
              <div style={{display:'flex',gap:8}}>
                <input type="password" placeholder="Senha do professor" value={coachPass}
                  onChange={e=>setCoachPass(e.target.value)}
                  style={{...st.inp,flex:1,padding:'8px 12px',fontSize:13}} />
                <button style={st.btnS} onClick={enterCoach}>Acessar</button>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD */}
        {view==='dash' && (
          loading ? <Spin /> :
          <div>
            <h1 style={{fontFamily:"'Bebas Neue'",fontSize:34,letterSpacing:3,color:ACC,margin:'0 0 20px'}}>
              BEM-VINDO, {student.split(' ')[0].toUpperCase()} 🌿
            </h1>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
              {[['🏋️','Treinos totais',stats.total],['🔥','Última semana',stats.lastWeek],['⭐','Exercício favorito',stats.favEx]].map(([ic,k,v])=>(
                <div key={k} style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:10,padding:'12px 14px',textAlign:'center'}}>
                  <div style={{fontSize:20,marginBottom:4}}>{ic}</div>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:ACC,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:10,color:MUTED,letterSpacing:1,textTransform:'uppercase',marginTop:4}}>{k}</div>
                </div>
              ))}
            </div>
            <button style={{...st.btnP,width:'100%',padding:'13px',fontSize:15,marginBottom:22}} onClick={()=>setView('pick')}>
              + REGISTRAR TREINO DE HOJE
            </button>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,color:ACC,marginBottom:12}}>SESSÕES RECENTES</div>
            {logs.length===0 && (
              <div style={{...st.card,textAlign:'center',padding:'36px',border:`2px dashed ${BDR}`}}>
                <p style={{color:MUTED}}>Nenhum treino ainda. Selecione um treino acima para começar!</p>
              </div>
            )}
            {logs.slice(0,4).map(l=>(
              <div key={l.id} style={st.card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:4}}>
                      <span style={{fontFamily:"'Bebas Neue'",fontSize:17}}>{l.template_name||'Treino'}</span>
                      {l.week&&<span style={{...st.tag,background:'rgba(255,255,255,0.05)',color:MUTED}}>{l.week}</span>}
                      <span style={{fontSize:11,color:MUTED}}>📅 {l.date}</span>
                    </div>
                    <div style={{fontSize:12,color:MUTED}}>{l.exercises?.filter(e=>e.name).slice(0,5).map(e=>e.name).join(' · ')}</div>
                    {l.highlights&&<div style={{fontSize:12,color:'rgba(141,198,63,0.75)',marginTop:4}}>✨ {l.highlights}</div>}
                  </div>
                  <div style={{display:'flex',gap:6,flexShrink:0}}>
                    {l.rpe&&<span style={st.tag}>RPE {l.rpe}</span>}
                    <span style={{...st.tag,background:'rgba(255,255,255,0.05)',color:MUTED}}>⚡{l.energy}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PICK TEMPLATE */}
        {view==='pick' && (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:24}}>
              <button style={st.btnG} onClick={()=>setView('dash')}>← Voltar</button>
              <h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:3,color:ACC,margin:0}}>QUAL TREINO DE HOJE?</h1>
            </div>
            <div style={{...st.sect,marginBottom:20}}>
              <F label="Semana atual (ex: Semana 1, Semana 12)">
                <Inp value={selWeek} onChange={e=>setSelWeek(e.target.value)} placeholder="Ex: Semana 3" />
              </F>
            </div>
            {templates.length===0 && (
              <div style={{...st.card,textAlign:'center',padding:'48px',border:`2px dashed ${BDR}`}}>
                <p style={{color:MUTED}}>Nenhum treino cadastrado pelo professor ainda.</p>
              </div>
            )}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
              {templates.map(tpl=>(
                <div key={tpl.id} onClick={()=>startFromTemplate(tpl)}
                  style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:12,padding:'20px',cursor:'pointer'}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,color:ACC,marginBottom:4}}>{tpl.name}</div>
                  {tpl.description&&<p style={{fontSize:12,color:MUTED,marginBottom:12}}>{tpl.description}</p>}
                  <div style={{fontSize:12,color:'#888',marginBottom:12}}>{tpl.exercises.length} exercício{tpl.exercises.length!==1?'s':''}</div>
                  <div style={{display:'flex',flexDirection:'column',gap:4}}>
                    {tpl.exercises.slice(0,4).map((ex,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                        <span style={{color:'#CCC'}}>{ex.name}</span>
                        <span style={{color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>
                          {ex.plannedSets}x{ex.plannedReps}{ex.plannedLoad?' @ '+ex.plannedLoad:''}
                        </span>
                      </div>
                    ))}
                    {tpl.exercises.length>4&&<div style={{fontSize:11,color:MUTED}}>+{tpl.exercises.length-4} mais...</div>}
                  </div>
                  <button style={{...st.btnP,width:'100%',marginTop:16,padding:'10px'}}>FAZER ESSE TREINO →</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEW LOG */}
        {view==='newlog' && logData && (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:22}}>
              <button style={st.btnG} onClick={()=>setView('pick')}>← Voltar</button>
              <div>
                <h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:3,color:ACC,margin:0}}>{logData.templateName}</h1>
                {logData.week&&<span style={{fontSize:12,color:MUTED}}>{logData.week} · {logData.date}</span>}
              </div>
            </div>
            {logData.exercises.map((ex,ei)=>(
              <div key={ei} style={st.sect}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:1,marginBottom:6}}>{ex.name}</div>
                    <div style={st.plan}>
                      <span>📋 Planejado:</span>
                      <span style={{color:ACC,fontFamily:"'JetBrains Mono',monospace"}}>
                        {ex.planned.sets}x{ex.planned.reps}{ex.planned.load?' @ '+ex.planned.load:''}
                      </span>
                    </div>
                    {ex.cues&&<div style={{fontSize:11,color:MUTED,marginTop:6}}>💡 {ex.cues}</div>}
                  </div>
                  <span style={{fontSize:11,color:MUTED}}>{ex.sets.filter(s=>s.completed).length}/{ex.sets.length} séries</span>
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:360}}>
                    <thead>
                      <tr>{['Série','Reps realizadas','Carga (kg)','Concluiu?','Obs da série',''].map(h=><th key={h} style={st.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {ex.sets.map((set,si)=>(
                        <tr key={si} style={{opacity:set.completed?1:0.5}}>
                          <td style={{...st.td,color:MUTED,fontWeight:700,fontSize:12}}>{si+1}</td>
                          <td style={st.td}>
                            <input type="number" placeholder={ex.planned.reps||'0'} min="0"
                              style={{...st.inp,padding:'5px 8px',width:72,fontSize:13,textAlign:'center',borderColor:set.reps?ACC:undefined}}
                              value={set.reps} onChange={e=>updSet(ei,si,'reps',e.target.value)} />
                          </td>
                          <td style={st.td}>
                            <input type="number" placeholder="0" min="0" step="0.5"
                              style={{...st.inp,padding:'5px 8px',width:80,fontSize:13,textAlign:'center',borderColor:set.load?ACC:undefined}}
                              value={set.load} onChange={e=>updSet(ei,si,'load',e.target.value)} />
                          </td>
                          <td style={{...st.td,textAlign:'center'}}>
                            <div onClick={()=>updSet(ei,si,'completed',!set.completed)} style={{
                              width:24,height:24,borderRadius:5,cursor:'pointer',margin:'0 auto',
                              border:`2px solid ${set.completed?ACC:'#444'}`,background:set.completed?ACC:'transparent',
                              display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#000',
                            }}>{set.completed?'✓':''}</div>
                          </td>
                          <td style={st.td}>
                            <input placeholder="dor, dificuldade..."
                              style={{...st.inp,padding:'5px 8px',width:130,fontSize:12}}
                              value={set.notes} onChange={e=>updSet(ei,si,'notes',e.target.value)} />
                          </td>
                          <td style={st.td}>
                            {ex.sets.length>1&&(
                              <button style={{background:'none',border:'none',color:DANGER,cursor:'pointer',fontSize:14}} onClick={()=>remSet(ei,si)}>✕</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button style={{...st.btnS,fontSize:12,padding:'5px 12px',marginTop:10}} onClick={()=>addSet(ei)}>+ Série extra</button>
              </div>
            ))}
            <div style={st.sect}>
              <span style={st.sectT}>AVALIAÇÃO DA SESSÃO</span>
              <div style={st.g2}>
                <F label={`Esforço percebido — RPE ${logData.rpe}/10`}>
                  <input type="range" min="1" max="10" value={logData.rpe}
                    onChange={e=>setLogData(p=>({...p,rpe:Number(e.target.value)}))}
                    style={{width:'100%',accentColor:ACC,marginTop:8}} />
                </F>
                <F label="Energia no treino">
                  <Sel value={logData.energy} onChange={e=>setLogData(p=>({...p,energy:e.target.value}))} opts={['baixa','média','alta']} />
                </F>
              </div>
              <F label="Destaques — o que foi bem ✨">
                <Inp value={logData.highlights} onChange={e=>setLogData(p=>({...p,highlights:e.target.value}))}
                  placeholder="Ex: bati PR no agachamento, senti menos dor no joelho..." />
              </F>
              <F label="Dificuldades, dores ou dúvidas para o professor">
                <textarea style={{...st.inp,minHeight:72,resize:'vertical'}}
                  value={logData.notes} onChange={e=>setLogData(p=>({...p,notes:e.target.value}))}
                  placeholder="Tudo que o professor precisa saber sobre como foi esse treino..." />
              </F>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
              <button style={st.btnS} onClick={()=>setView('pick')}>Cancelar</button>
              <button style={st.btnP} onClick={saveLog} disabled={loading}>
                {loading ? 'SALVANDO...' : '💾 SALVAR TREINO'}
              </button>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {view==='history' && (
          loading ? <Spin /> :
          <div>
            <h1 style={{fontFamily:"'Bebas Neue'",fontSize:34,letterSpacing:3,color:ACC,marginBottom:22}}>HISTÓRICO DE TREINOS</h1>
            {logs.length===0 && (
              <div style={{...st.card,textAlign:'center',padding:'48px',border:`2px dashed ${BDR}`}}>
                <p style={{color:MUTED,marginBottom:20}}>Nenhum treino registrado ainda.</p>
                <button style={st.btnP} onClick={()=>setView('pick')}>Começar agora</button>
              </div>
            )}
            {logs.map(l=>(
              <div key={l.id} style={st.card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${BDR}`}}>
                  <div>
                    <div style={{display:'flex',gap:10,alignItems:'center'}}>
                      <span style={{fontFamily:"'Bebas Neue'",fontSize:18}}>{l.template_name||'Treino'}</span>
                      {l.week&&<span style={{...st.tag,background:'rgba(255,255,255,0.05)',color:MUTED}}>{l.week}</span>}
                      <span style={{fontSize:11,color:MUTED}}>📅 {l.date}</span>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    {l.rpe&&<span style={st.tag}>RPE {l.rpe}</span>}
                    <span style={{...st.tag,background:'rgba(255,255,255,0.05)',color:MUTED}}>⚡{l.energy}</span>
                  </div>
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:420}}>
                    <thead><tr>{['Exercício','Planejado','Séries ok','Melhor carga','Volume'].map(h=><th key={h} style={st.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {l.exercises?.filter(e=>e.name).map((ex,i)=>{
                        const {done,total,maxLoad,vol}=exSum(ex);
                        return (
                          <tr key={i}>
                            <td style={{...st.td,fontWeight:600}}>{ex.name}</td>
                            <td style={{...st.td,fontSize:11,color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{ex.planned?.sets}x{ex.planned?.reps}</td>
                            <td style={{...st.td,color:done<total?WARN:ACC}}>{done}/{total}{done<total?' ⚠️':''}</td>
                            <td style={{...st.td,color:ACC,fontFamily:"'JetBrains Mono',monospace"}}>{maxLoad?maxLoad+' kg':'—'}</td>
                            <td style={{...st.td,fontFamily:"'JetBrains Mono',monospace"}}>{vol?vol+' kg':'—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {(l.highlights||l.notes)&&(
                  <div style={{marginTop:12,display:'flex',gap:10,flexWrap:'wrap'}}>
                    {l.highlights&&<div style={{flex:1,minWidth:180,background:'rgba(141,198,63,0.05)',padding:'10px 14px',borderRadius:6,borderLeft:`3px solid ${ACC}`,fontSize:13,color:'#CCC'}}>
                      <span style={{...st.lbl,marginBottom:4,color:ACC}}>Destaques</span>{l.highlights}
                    </div>}
                    {l.notes&&<div style={{flex:1,minWidth:180,background:SURF2,padding:'10px 14px',borderRadius:6,fontSize:13,color:'#999'}}>
                      <span style={{...st.lbl,marginBottom:4}}>Obs</span>{l.notes}
                    </div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PROGRESS */}
        {view==='progress' && (
          loading ? <Spin /> :
          <div>
            <h1 style={{fontFamily:"'Bebas Neue'",fontSize:34,letterSpacing:3,color:ACC,marginBottom:22}}>MINHA EVOLUÇÃO</h1>
            {exNames.length===0 ? (
              <div style={{...st.card,textAlign:'center',padding:'48px',border:`2px dashed ${BDR}`}}>
                <p style={{color:MUTED}}>Registre treinos para ver sua evolução aqui.</p>
              </div>
            ) : (
              <>
                <div style={st.sect}>
                  <span style={st.sectT}>SELECIONAR EXERCÍCIO</span>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {exNames.map(n=><Tab key={n} active={selEx===n} onClick={()=>setSelEx(n)}>{n}</Tab>)}
                  </div>
                </div>
                {selEx&&progressData.length>0&&(
                  <>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
                      {[
                        ['Carga máxima atual', progressData[progressData.length-1]?.maxLoad ? progressData[progressData.length-1].maxLoad+' kg':'—'],
                        ['Melhor volume', Math.max(...progressData.map(d=>d.volume))+' kg'],
                        ['Sessões com esse exercício', progressData.length],
                      ].map(([k,v])=>(
                        <div key={k} style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:8,padding:'12px 16px',textAlign:'center'}}>
                          <div style={{fontFamily:"'Bebas Neue'",fontSize:24,color:ACC}}>{v}</div>
                          <div style={{fontSize:10,color:MUTED,textTransform:'uppercase',letterSpacing:1,marginTop:4}}>{k}</div>
                        </div>
                      ))}
                    </div>
                    <div style={st.sect}>
                      <span style={st.sectT}>CARGA MÁXIMA — {selEx.toUpperCase()}</span>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={progressData} margin={{top:5,right:10,left:0,bottom:5}}>
                          <CartesianGrid strokeDasharray="3 3" stroke={BDR} />
                          <XAxis dataKey="date" tick={{fill:MUTED,fontSize:11}} />
                          <YAxis tick={{fill:MUTED,fontSize:11}} unit="kg" width={48} />
                          <Tooltip contentStyle={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:6,color:TEXT,fontSize:12}} />
                          <Line type="monotone" dataKey="maxLoad" name="Carga máx" stroke={ACC} strokeWidth={2.5} dot={{fill:ACC,r:4}} activeDot={{r:6}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={st.sect}>
                      <span style={st.sectT}>VOLUME TOTAL — {selEx.toUpperCase()}</span>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={progressData} margin={{top:5,right:10,left:0,bottom:5}}>
                          <CartesianGrid strokeDasharray="3 3" stroke={BDR} />
                          <XAxis dataKey="date" tick={{fill:MUTED,fontSize:11}} />
                          <YAxis tick={{fill:MUTED,fontSize:11}} unit="kg" width={52} />
                          <Tooltip contentStyle={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:6,color:TEXT,fontSize:12}} />
                          <Line type="monotone" dataKey="volume" name="Volume" stroke={WARN} strokeWidth={2} dot={{fill:WARN,r:3}} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
                {selEx&&!progressData.length&&<div style={{...st.card,textAlign:'center',padding:'28px'}}><p style={{color:MUTED}}>Nenhum dado para "{selEx}" ainda.</p></div>}
                {!selEx&&<div style={{...st.card,textAlign:'center',padding:'28px'}}><p style={{color:MUTED}}>Selecione um exercício acima.</p></div>}
              </>
            )}
          </div>
        )}

        {/* COACH */}
        {view==='coach' && (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:22}}>
              <h1 style={{fontFamily:"'Bebas Neue'",fontSize:34,letterSpacing:3,color:ACC,margin:0}}>PŌKAI — PAINEL DO PROFESSOR</h1>
              <button style={{...st.btnS,marginLeft:'auto'}} onClick={loadCoach}>↻ Atualizar</button>
              <button style={st.btnG} onClick={()=>setView('login')}>← Sair</button>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:22}}>
              <Tab active={coachTab==='alunos'}    onClick={()=>setCoachTab('alunos')}>👥 Alunos ({allStudents.length})</Tab>
              <Tab active={coachTab==='templates'} onClick={()=>setCoachTab('templates')}>📋 Treinos ({templates.length})</Tab>
            </div>

            {loading && <Spin />}

            {!loading && coachTab==='alunos' && (
              <>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
                  {[
                    ['Total de alunos', allStudents.length],
                    ['Ativos essa semana', Object.values(studData).filter(ls=>{const c=new Date();c.setDate(c.getDate()-7);return ls.some(l=>new Date(l.date)>=c);}).length],
                    ['Treinos registrados', Object.values(studData).reduce((a,ls)=>a+ls.length,0)],
                  ].map(([k,v])=>(
                    <div key={k} style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:8,padding:'12px 16px',textAlign:'center'}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:28,color:ACC}}>{v}</div>
                      <div style={{fontSize:10,color:MUTED,textTransform:'uppercase',letterSpacing:1,marginTop:4}}>{k}</div>
                    </div>
                  ))}
                </div>
                {allStudents.length===0 && (
                  <div style={{...st.card,textAlign:'center',padding:'48px',border:`2px dashed ${BDR}`}}>
                    <p style={{color:MUTED}}>Nenhum aluno ainda. Compartilhe o link do app!</p>
                  </div>
                )}
                {allStudents.map(name=>{
                  const sLogs=studData[name]||[];
                  const last=sLogs[0];
                  const cutoff=new Date();cutoff.setDate(cutoff.getDate()-7);
                  const lastWeek=sLogs.filter(l=>new Date(l.date)>=cutoff).length;
                  const inactive=sLogs.length>0&&lastWeek===0;
                  const open=expandedStudent===name;
                  const prs={};
                  sLogs.forEach(l=>l.exercises?.forEach(e=>{
                    if(!e.name)return;
                    const max=Math.max(...e.sets.filter(s=>s.completed&&s.load).map(s=>parseFloat(s.load)||0),0);
                    if(!prs[e.name]||max>prs[e.name])prs[e.name]=max;
                  }));
                  return (
                    <div key={name} style={st.card}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',cursor:'pointer'}} onClick={()=>setExpandedStudent(open?null:name)}>
                        <div>
                          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                            <span style={{fontFamily:"'Bebas Neue'",fontSize:20}}>{name}</span>
                            {inactive&&<span style={{...st.tag,background:'rgba(255,96,96,0.12)',color:DANGER}}>INATIVO</span>}
                            {lastWeek>0&&<span style={st.tag}>ATIVO</span>}
                          </div>
                          <div style={{fontSize:12,color:MUTED,display:'flex',gap:16}}>
                            <span>🏋️ {sLogs.length} treinos</span>
                            <span>🔥 {lastWeek} essa semana</span>
                            {last&&<span>📅 Último: {last.date}</span>}
                            {last?.week&&<span>📍 {last.week}</span>}
                          </div>
                        </div>
                        <span style={{color:MUTED,fontSize:18}}>{open?'▲':'▼'}</span>
                      </div>
                      {open&&(
                        <div style={{marginTop:16,borderTop:`1px solid ${BDR}`,paddingTop:16}}>
                          {last&&(
                            <div style={{background:SURF2,padding:'14px 16px',borderRadius:8,marginBottom:14}}>
                              <div style={{fontSize:11,color:MUTED,marginBottom:10,letterSpacing:1}}>
                                ÚLTIMO TREINO — {last.template_name||'Treino'} · {last.date} {last.week&&`· ${last.week}`}
                              </div>
                              <table style={{width:'100%',borderCollapse:'collapse'}}>
                                <thead><tr>{['Exercício','Planejado','Séries','Melhor carga'].map(h=><th key={h} style={{...st.th,fontSize:10}}>{h}</th>)}</tr></thead>
                                <tbody>
                                  {last.exercises?.filter(e=>e.name).map((ex,i)=>{
                                    const {done,total,maxLoad}=exSum(ex);
                                    return (
                                      <tr key={i}>
                                        <td style={st.td}>{ex.name}</td>
                                        <td style={{...st.td,fontSize:11,color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{ex.planned?.sets}x{ex.planned?.reps}</td>
                                        <td style={{...st.td,color:done<total?WARN:ACC}}>{done}/{total}</td>
                                        <td style={{...st.td,color:ACC,fontFamily:"'JetBrains Mono',monospace"}}>{maxLoad?maxLoad+' kg':'—'}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              {last.highlights&&<div style={{marginTop:10,fontSize:12,color:ACC}}>✨ {last.highlights}</div>}
                              {last.notes&&<div style={{marginTop:6,fontSize:12,color:'#888',fontStyle:'italic'}}>💬 {last.notes}</div>}
                            </div>
                          )}
                          {Object.entries(prs).filter(([,v])=>v>0).length>0&&(
                            <div>
                              <div style={{fontSize:11,color:MUTED,letterSpacing:1.5,marginBottom:8,textTransform:'uppercase'}}>Recordes Pessoais</div>
                              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                                {Object.entries(prs).filter(([,v])=>v>0).map(([k,v])=>(
                                  <div key={k} style={{background:'rgba(141,198,63,0.06)',border:'1px solid rgba(141,198,63,0.22)',borderRadius:6,padding:'6px 12px'}}>
                                    <div style={{fontSize:11,color:MUTED}}>{k}</div>
                                    <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:ACC}}>{v} kg</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {!loading && coachTab==='templates' && !editTpl && (
              <div>
                <div style={{display:'flex',gap:10,marginBottom:20}}>
                  <button style={st.btnP} onClick={()=>setEditTpl({id:null,name:'',description:'',exercises:[]})}>
                    + CADASTRAR MANUAL
                  </button>
                  <button style={{...st.btnS,display:'flex',alignItems:'center',gap:8}} onClick={()=>{setShowImport(true);setImportState({loading:false,error:null,result:null});}}>
                    📄 IMPORTAR VIA PDF
                  </button>
                </div>

                {/* Modal importação PDF */}
                {showImport && (
                  <div style={{background:SURF,border:`1px solid ${ACC}`,borderRadius:12,padding:'24px',marginBottom:20}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                      <span style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2,color:ACC}}>IMPORTAR TREINO VIA PDF</span>
                      <button style={st.btnG} onClick={()=>setShowImport(false)}>✕ Fechar</button>
                    </div>
                    <p style={{fontSize:13,color:MUTED,marginBottom:16}}>
                      Suba um PDF com seu mural de treino, planilha ou qualquer documento com exercícios. A IA vai extrair e montar os templates automaticamente.
                    </p>

                    {!importState.loading && !importState.result && (
                      <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:`2px dashed ${BDR}`,borderRadius:10,padding:'40px',cursor:'pointer',background:SURF2}}>
                        <span style={{fontSize:32,marginBottom:12}}>📄</span>
                        <span style={{color:ACC,fontWeight:700,marginBottom:4}}>Clique para selecionar o PDF</span>
                        <span style={{fontSize:12,color:MUTED}}>ou arraste o arquivo aqui</span>
                        <input type="file" accept=".pdf" style={{display:'none'}}
                          onChange={e => e.target.files[0] && importFromPDF(e.target.files[0])} />
                      </label>
                    )}

                    {importState.loading && (
                      <div style={{textAlign:'center',padding:'40px'}}>
                        <div style={{width:40,height:40,border:`3px solid ${BDR}`,borderTop:`3px solid ${ACC}`,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 16px'}} />
                        <p style={{color:MUTED}}>Analisando PDF com IA...</p>
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                      </div>
                    )}

                    {importState.error && (
                      <div style={{background:'#1A0000',border:`1px solid #330000`,borderRadius:8,padding:'16px',color:DANGER,fontSize:13}}>
                        ⚠️ {importState.error}
                        <br/><button style={{...st.btnS,marginTop:10,fontSize:12}} onClick={()=>setImportState({loading:false,error:null,result:null})}>Tentar novamente</button>
                      </div>
                    )}

                    {importState.result && (
                      <div>
                        <div style={{fontSize:13,color:ACC,marginBottom:14,fontWeight:700}}>
                          ✅ {importState.result.length} treino{importState.result.length!==1?'s':''} encontrado{importState.result.length!==1?'s':''}. Revise antes de salvar:
                        </div>
                        {importState.result.map((t,i)=>(
                          <div key={i} style={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:8,padding:'16px',marginBottom:10}}>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:ACC,marginBottom:4}}>{t.name}</div>
                            {t.description&&<div style={{fontSize:12,color:MUTED,marginBottom:8}}>{t.description}</div>}
                            <div style={{display:'flex',flexDirection:'column',gap:4}}>
                              {t.exercises.map((ex,j)=>(
                                <div key={j} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'4px 0',borderBottom:`1px solid ${BDR}`}}>
                                  <span style={{color:'#CCC'}}>{ex.name}</span>
                                  <span style={{fontFamily:"'JetBrains Mono',monospace",color:MUTED}}>
                                    {ex.plannedSets}x{ex.plannedReps}{ex.plannedLoad?' @ '+ex.plannedLoad:''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                        <div style={{display:'flex',gap:10,marginTop:16}}>
                          <button style={st.btnS} onClick={()=>setImportState({loading:false,error:null,result:null})}>
                            ↩ Reimportar
                          </button>
                          <button style={st.btnP} onClick={()=>confirmImport(importState.result)}>
                            💾 SALVAR TODOS OS TREINOS
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {templates.length===0&&(
                  <div style={{...st.card,textAlign:'center',padding:'48px',border:`2px dashed ${BDR}`}}>
                    <p style={{color:MUTED}}>Nenhum treino cadastrado. Crie o Treino A, B, C...</p>
                  </div>
                )}
                {templates.map(tpl=>(
                  <div key={tpl.id} style={{...st.card,display:'flex',alignItems:'flex-start',gap:14}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:22,letterSpacing:2,color:ACC,marginBottom:4}}>{tpl.name}</div>
                      {tpl.description&&<div style={{fontSize:12,color:MUTED,marginBottom:8}}>{tpl.description}</div>}
                      <div style={{fontSize:12,color:'#888'}}>
                        {tpl.exercises.map((ex,i)=>(
                          <span key={i} style={{marginRight:14}}>
                            {ex.name} <span style={{fontFamily:"'JetBrains Mono',monospace",color:MUTED}}>{ex.plannedSets}x{ex.plannedReps}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      <button style={st.btnS} onClick={()=>setEditTpl(tpl)}>Editar</button>
                      <button style={st.btnD} onClick={()=>deleteTpl(tpl.id)}>Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && coachTab==='templates' && editTpl && (
              <TemplateForm tpl={editTpl} onSave={saveTpl} onCancel={()=>setEditTpl(null)}
                styles={{st, EMPTY_TPL_EX, ACC, BDR, SURF2, MUTED, TEXT, DANGER}} />
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function TemplateForm({ tpl, onSave, onCancel, styles }) {
  const {st, EMPTY_TPL_EX, ACC, BDR, SURF2, MUTED, DANGER} = styles;
  const [form, setForm] = useState({...tpl});

  const addEx    = ()      => setForm(p=>({...p, exercises:[...p.exercises, {...EMPTY_TPL_EX}]}));
  const removeEx = i       => setForm(p=>({...p, exercises:p.exercises.filter((_,j)=>j!==i)}));
  const updEx    = (i,f,v) => setForm(p=>({...p, exercises:p.exercises.map((e,j)=>j===i?{...e,[f]:v}:e)}));
  const moveEx   = (i,dir) => {
    const exs=[...form.exercises]; const to=i+dir;
    if(to<0||to>=exs.length)return;
    [exs[i],exs[to]]=[exs[to],exs[i]];
    setForm(p=>({...p,exercises:exs}));
  };

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:22}}>
        <button style={st.btnG} onClick={onCancel}>← Voltar</button>
        <h2 style={{fontFamily:"'Bebas Neue'",fontSize:24,letterSpacing:3,color:ACC,margin:0}}>
          {form.id?'EDITAR TREINO':'NOVO TREINO'}
        </h2>
      </div>
      <div style={st.sect}>
        <span style={st.sectT}>IDENTIFICAÇÃO</span>
        <div style={st.g2}>
          <div style={st.fld}>
            <label style={st.lbl}>Nome do Treino</label>
            <input style={st.inp} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Treino A" />
          </div>
          <div style={st.fld}>
            <label style={st.lbl}>Descrição (opcional)</label>
            <input style={st.inp} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Ex: Membros inferiores + core" />
          </div>
        </div>
      </div>
      <div style={st.sect}>
        <span style={st.sectT}>EXERCÍCIOS DO TREINO</span>
        {form.exercises.map((ex,i)=>(
          <div key={i} style={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:8,padding:'16px',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
              <span style={{fontFamily:"'Bebas Neue'",fontSize:16,color:ACC,minWidth:24}}>{i+1}</span>
              <input placeholder="Nome do exercício" style={{...st.inp,flex:1,fontWeight:600}}
                value={ex.name} onChange={e=>updEx(i,'name',e.target.value)} />
              <button style={{...st.btnG,padding:'4px 8px',fontSize:16}} onClick={()=>moveEx(i,-1)}>↑</button>
              <button style={{...st.btnG,padding:'4px 8px',fontSize:16}} onClick={()=>moveEx(i,1)}>↓</button>
              <button style={st.btnD} onClick={()=>removeEx(i)}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 2fr',gap:10}}>
              <div style={st.fld}>
                <label style={st.lbl}>Séries</label>
                <input type="number" min="1" max="10" style={st.inp} value={ex.plannedSets}
                  onChange={e=>updEx(i,'plannedSets',Number(e.target.value))} />
              </div>
              <div style={st.fld}>
                <label style={st.lbl}>Reps / Tempo</label>
                <input placeholder="8-10 / 30s" style={st.inp} value={ex.plannedReps}
                  onChange={e=>updEx(i,'plannedReps',e.target.value)} />
              </div>
              <div style={st.fld}>
                <label style={st.lbl}>Carga referência</label>
                <input placeholder="60kg / 70% 1RM" style={st.inp} value={ex.plannedLoad}
                  onChange={e=>updEx(i,'plannedLoad',e.target.value)} />
              </div>
              <div style={st.fld}>
                <label style={st.lbl}>Dica técnica</label>
                <input placeholder="Joelhos alinhados..." style={st.inp} value={ex.cues}
                  onChange={e=>updEx(i,'cues',e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        <button style={{...st.btnS,width:'100%',padding:'11px'}} onClick={addEx}>+ Adicionar Exercício</button>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
        <button style={st.btnS} onClick={onCancel}>Cancelar</button>
        <button style={st.btnP} onClick={()=>onSave(form)}>
          💾 {form.id?'SALVAR ALTERAÇÕES':'PUBLICAR TREINO'}
        </button>
      </div>
    </div>
  );
}
