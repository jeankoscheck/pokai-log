import { useState, useEffect, useMemo, useCallback } from "react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts";
import { supabase } from "./supabase.js";

// ─────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400&display=swap');`;
const BG     = '#060606';
const SURF   = '#0F0F0F';
const SURF2  = '#181818';
const BDR    = '#272727';
const ACC    = '#8DC63F';
const TEXT   = '#F2F2F0';
const MUTED  = '#666660';
const WARN   = '#E8A020';
const DANGER = '#E05050';
const GOLD   = '#FFD700';
const SILVER = '#C0C0C0';
const BRONZE = '#CD7F32';

// ─────────────────────────────────────────────────────────────────
// PROGRESSION TREES
// ─────────────────────────────────────────────────────────────────
const TREES = [
  { id:'empurrar', name:'EMPURRAR', icon:'🤜', nodes:[
    {id:'e1',name:'Flexão Inclinada',   level:1, keys:['inclinada','mãos no banco','parede']},
    {id:'e2',name:'Flexão Joelhos',     level:1, keys:['joelhos']},
    {id:'e3',name:'Flexão Tradicional', level:2, keys:['flexão','flexao','push-up','pushup','tradicional']},
    {id:'e4',name:'Flexão Diamante',    level:3, keys:['diamante','diamond']},
    {id:'e5',name:'Flexão Declinada',   level:3, keys:['declinada','pés elevados']},
    {id:'e6',name:'Pseudo-Planche',     level:4, keys:['pseudo','planche lean']},
    {id:'e7',name:'Tuck Planche',       level:5, keys:['tuck planche']},
    {id:'e8',name:'Planche',            level:5, keys:['planche']},
  ]},
  { id:'puxar', name:'PUXAR', icon:'💪', nodes:[
    {id:'p1',name:'Dead Hang',          level:1, keys:['dead hang','hang passivo','pendurar']},
    {id:'p2',name:'Remada Australiana', level:2, keys:['remada australiana','remada']},
    {id:'p3',name:'Pull-up Assistido',  level:2, keys:['assistido','elástico']},
    {id:'p4',name:'Pull-up Negativo',   level:3, keys:['negativo','excêntric']},
    {id:'p5',name:'Pull-up',            level:3, keys:['pull-up','pullup','barra fixa','chin-up']},
    {id:'p6',name:'Chest-to-Bar',       level:4, keys:['chest to bar','c2b']},
    {id:'p7',name:'Muscle-up',          level:5, keys:['muscle-up','muscle up']},
    {id:'p8',name:'One Arm Pull-up',    level:5, keys:['one arm','um braço']},
  ]},
  { id:'pernas', name:'PERNAS', icon:'🦵', nodes:[
    {id:'l1',name:'Agachamento Isométrico',level:1, keys:['isométrico','cadeira']},
    {id:'l2',name:'Agachamento Livre',     level:2, keys:['agachamento livre','agachamento']},
    {id:'l3',name:'Agachamento Goblet',    level:2, keys:['goblet','taça']},
    {id:'l4',name:'Afundo Búlgaro',        level:3, keys:['búlgaro','split squat']},
    {id:'l5',name:'Pistol Assistido',      level:3, keys:['pistol assistido','pistola assistida']},
    {id:'l6',name:'Pistol Livre',          level:4, keys:['pistol livre','pistola livre']},
    {id:'l7',name:'Dragon Squat',          level:5, keys:['dragon squat','agachamento dragão']},
  ]},
  { id:'essencial', name:'ESSENCIAL', icon:'🧘', nodes:[
    {id:'c1',name:'Prancha',        level:1, keys:['prancha','plank']},
    {id:'c2',name:'Hollow Body',    level:2, keys:['hollow','oco']},
    {id:'c3',name:'L-sit',          level:3, keys:['l-sit','l sit']},
    {id:'c4',name:'Front Lever Tuck',level:4,keys:['front lever tuck','alavanca tuck']},
    {id:'c5',name:'Front Lever',    level:4, keys:['front lever','alavanca frontal']},
    {id:'c6',name:'Human Flag',     level:5, keys:['human flag','bandeira humana']},
    {id:'c7',name:'V-sit',          level:5, keys:['v-sit','v sit']},
  ]},
  { id:'handstand', name:'HANDSTAND', icon:'🤸', nodes:[
    {id:'h1',name:'Pike Push-up',       level:2, keys:['pike push','pike']},
    {id:'h2',name:'Headstand',          level:2, keys:['headstand','parada de cabeça']},
    {id:'h3',name:'Wall Walk',          level:3, keys:['wall walk']},
    {id:'h4',name:'Handstand Hold',     level:4, keys:['handstand hold','parada de mãos']},
    {id:'h5',name:'Handstand Push-up',  level:4, keys:['handstand push','hspu']},
    {id:'h6',name:'Handstand Walk',     level:5, keys:['handstand walk']},
    {id:'h7',name:'One Arm Handstand',  level:5, keys:['one arm handstand']},
  ]},
  { id:'kettlebell', name:'KETTLEBELL', icon:'🏋️', nodes:[
    {id:'k1',name:'KB Deadlift', level:1, keys:['kb deadlift']},
    {id:'k2',name:'KB Swing',    level:2, keys:['kb swing','swing russo','swing americano','swing']},
    {id:'k3',name:'KB High Pull',level:3, keys:['high pull']},
    {id:'k4',name:'KB Clean',    level:3, keys:['kb clean','clean']},
    {id:'k5',name:'KB Press',    level:3, keys:['kb press']},
    {id:'k6',name:'KB Snatch',   level:4, keys:['snatch']},
    {id:'k7',name:'Double KB',   level:5, keys:['double swing','double clean','double snatch']},
  ]},
];

// ─────────────────────────────────────────────────────────────────
// ACHIEVEMENTS
// ─────────────────────────────────────────────────────────────────
const ACHIEVEMENTS = [
  {id:'first',  icon:'🌱', name:'Primeira Semente',  desc:'Registrou o primeiro treino',         check:(l)=>l.length>=1},
  {id:'five',   icon:'🔥', name:'Fogo na Matilha',   desc:'5 treinos registrados',               check:(l)=>l.length>=5},
  {id:'ten',    icon:'💪', name:'10 Movimentos',     desc:'10 treinos registrados',              check:(l)=>l.length>=10},
  {id:'twenty', icon:'🌟', name:'Mês em Movimento',  desc:'20 treinos registrados',              check:(l)=>l.length>=20},
  {id:'fifty',  icon:'👑', name:'Elite da Matilha',  desc:'50 treinos registrados',              check:(l)=>l.length>=50},
  {id:'week',   icon:'📅', name:'Semana Completa',   desc:'5 treinos em 7 dias',                 check:(l)=>{const c=new Date();c.setDate(c.getDate()-7);return l.filter(x=>new Date(x.date)>=c).length>=5;}},
  {id:'perfect',icon:'🎯', name:'Série Limpa',       desc:'100% séries concluídas numa sessão',  check:(l)=>l.some(s=>s.exercises?.length>0&&s.exercises.every(e=>e.sets.every(s=>s.completed)))},
  {id:'pr',     icon:'🏆', name:'Recorde Batido',    desc:'PR mencionado nos destaques',         check:(l)=>l.some(s=>s.highlights?.toLowerCase().includes('pr')||s.highlights?.toLowerCase().includes('record'))},
  {id:'rpe9',   icon:'⚡', name:'Limite Testado',    desc:'Sessão com RPE 9 ou 10',              check:(l)=>l.some(s=>s.rpe>=9)},
  {id:'adv',    icon:'🦅', name:'Nível Avançado',    desc:'Desbloqueou exercício nível 4',       check:(l,u)=>u.some(n=>n.level>=4)},
  {id:'elite',  icon:'🔱', name:'Movimento Puro',    desc:'Desbloqueou exercício nível 5',       check:(l,u)=>u.some(n=>n.level>=5)},
  {id:'all',    icon:'🌳', name:'Explorador Total',  desc:'Progressão nas 6 famílias',           check:(l,u)=>{const f=new Set(u.map(n=>n.treeId));return f.size>=6;}},
];

// ─────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────
const norm = s => s?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'') || '';

const getUnlocked = logs => {
  const names = [];
  logs.forEach(l => l.exercises?.forEach(e => { if (e.name) names.push(norm(e.name)); }));
  const result = [];
  TREES.forEach(tree => tree.nodes.forEach(node => {
    if (node.keys.some(k => names.some(n => n.includes(norm(k)))))
      result.push({ ...node, treeId: tree.id });
  }));
  return result;
};

const computeAttrs = (logs, unlocked) => {
  if (!logs.length) return { forca:0, controle:0, mobilidade:0, resistencia:0, consistencia:0, explosao:0, ovr:0 };
  const pp = unlocked.filter(n => n.treeId==='empurrar' || n.treeId==='puxar');
  const ch = unlocked.filter(n => n.treeId==='essencial' || n.treeId==='handstand');
  let ts=0, ds=0;
  logs.forEach(l => l.exercises?.forEach(e => { ts += e.sets.length; ds += e.sets.filter(s=>s.completed).length; }));
  const cr = ts > 0 ? ds/ts : 0;
  const dates = logs.map(l=>new Date(l.date)).sort((a,b)=>a-b);
  const sw = logs.length >= 2 ? logs.length / Math.max(1,(dates[dates.length-1]-dates[0])/(1000*60*60*24*7)) : 0.5;
  const cap = v => Math.min(99, Math.max(0, Math.round(v)));
  const forca       = cap(pp.length/16*65 + Math.min(20, logs.length/3));
  const controle    = cap(cr*85 + Math.min(14, unlocked.length));
  const mobilidade  = cap(ch.length/14*75 + Math.min(20, unlocked.filter(n=>n.treeId==='pernas').length/7*20));
  const resistencia = cap(Math.log(logs.length+1)/Math.log(55)*85 + Math.min(14, sw*3));
  const consistencia= cap(Math.min(sw,5)/5*80 + Math.min(19, logs.length/3));
  const explosao    = cap(unlocked.filter(n=>n.level>=4).length/8*60 + unlocked.filter(n=>n.level>=5).length/6*35 + Math.min(4, logs.filter(l=>l.rpe>=9).length*2));
  const ovr         = cap((forca+controle+mobilidade+resistencia+consistencia+explosao)/6);
  return { forca, controle, mobilidade, resistencia, consistencia, explosao, ovr };
};

const getTier = ovr => {
  if (ovr>=85) return { name:'ELITE',         color:'#FF6B35' };
  if (ovr>=70) return { name:'AVANÇADO',       color: ACC      };
  if (ovr>=55) return { name:'INTERMEDIÁRIO',  color: GOLD     };
  if (ovr>=35) return { name:'BÁSICO',         color: SILVER   };
  return               { name:'INICIANTE',      color: BRONZE   };
};

const barColor = v => v>=75 ? ACC : v>=50 ? GOLD : v>=30 ? SILVER : BRONZE;

const timeAgo = ts => {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60)    return 'agora';
  if (s < 3600)  return `${Math.floor(s/60)}min`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
};

const EMPTY_SET    = { reps:'', load:'', completed:true, notes:'' };
const EMPTY_TPL_EX = { name:'', plannedSets:3, plannedReps:'', plannedLoad:'', cues:'' };

// ─────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────
const st = {
  app:   { fontFamily:"'Outfit',sans-serif", background:BG, color:TEXT, minHeight:'100vh' },
  nav:   { display:'flex', alignItems:'center', padding:'0 14px', height:52, borderBottom:`1px solid ${BDR}`, background:BG, position:'sticky', top:0, zIndex:100, gap:4, overflowX:'auto' },
  logo:  { fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:3, color:ACC, marginRight:'auto', flexShrink:0 },
  main:  { maxWidth:900, margin:'0 auto', padding:'24px 16px' },
  btnP:  { padding:'9px 20px', background:ACC, color:'#000', border:'none', borderRadius:5, cursor:'pointer', fontSize:13, fontFamily:"'Outfit',sans-serif", fontWeight:700 },
  btnS:  { padding:'8px 16px', background:SURF2, color:TEXT, border:`1px solid ${BDR}`, borderRadius:5, cursor:'pointer', fontSize:13, fontFamily:"'Outfit',sans-serif", fontWeight:500 },
  btnG:  { padding:'6px 10px', background:'none', color:MUTED, border:'none', cursor:'pointer', fontSize:12, fontFamily:"'Outfit',sans-serif" },
  btnD:  { padding:'5px 10px', background:'#1A0000', color:DANGER, border:`1px solid #330000`, borderRadius:4, cursor:'pointer', fontSize:11 },
  card:  { background:SURF, border:`1px solid ${BDR}`, borderRadius:10, padding:'16px 20px', marginBottom:12 },
  sect:  { background:SURF, border:`1px solid ${BDR}`, borderRadius:10, padding:'20px 22px', marginBottom:16 },
  sectT: { fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2, color:ACC, display:'block', marginBottom:16, paddingBottom:10, borderBottom:`1px solid ${BDR}` },
  inp:   { width:'100%', background:SURF2, border:`1px solid #333`, color:TEXT, padding:'9px 12px', borderRadius:5, fontSize:14, fontFamily:"'Outfit',sans-serif", boxSizing:'border-box', outline:'none' },
  lbl:   { display:'block', fontSize:11, fontWeight:700, letterSpacing:1.5, color:MUTED, marginBottom:5, textTransform:'uppercase' },
  fld:   { marginBottom:14 },
  g2:    { display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 },
  tag:   { display:'inline-block', padding:'2px 8px', background:'rgba(141,198,63,0.12)', color:ACC, borderRadius:3, fontSize:11, fontWeight:700 },
  th:    { textAlign:'left', padding:'8px 10px', background:'rgba(141,198,63,0.07)', color:ACC, fontSize:10, fontWeight:700, letterSpacing:1 },
  td:    { padding:'7px 10px', borderBottom:`1px solid ${BDR}`, fontSize:13, color:'#CCC' },
  plan:  { fontSize:11, color:MUTED, background:SURF2, padding:'4px 10px', borderRadius:4, display:'inline-flex', gap:8, alignItems:'center' },
};

// ─────────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────────
const F   = ({label,children}) => <div style={st.fld}><label style={st.lbl}>{label}</label>{children}</div>;
const Inp = ({value,onChange,type='text',placeholder='',sx={}}) => <input type={type} placeholder={placeholder} style={{...st.inp,...sx}} value={value} onChange={onChange}/>;
const Sel = ({value,onChange,opts}) => <select style={st.inp} value={value} onChange={onChange}>{opts.map(o=><option key={o}>{o}</option>)}</select>;
const Tab = ({active,onClick,children}) => (
  <button onClick={onClick} style={{padding:'6px 11px',border:`1px solid ${active?ACC:BDR}`,background:active?'rgba(141,198,63,0.08)':'transparent',color:active?ACC:MUTED,borderRadius:5,cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:"'Outfit',sans-serif",flexShrink:0,whiteSpace:'nowrap'}}>
    {children}
  </button>
);
const Spinner = () => <div style={{textAlign:'center',padding:'60px',color:MUTED,fontSize:14}}>Carregando...</div>;

// ─────────────────────────────────────────────────────────────────
// ATHLETE CARD
// ─────────────────────────────────────────────────────────────────
function AthleteCard({ name, logs }) {
  const unlocked = useMemo(() => getUnlocked(logs), [logs]);
  const attrs    = useMemo(() => computeAttrs(logs, unlocked), [logs, unlocked]);
  const tier     = getTier(attrs.ovr);
  const earned   = ACHIEVEMENTS.filter(a => a.check(logs, unlocked));
  const attrList = [
    {label:'FORÇA',       val:attrs.forca},
    {label:'CONTROLE',    val:attrs.controle},
    {label:'MOBILIDADE',  val:attrs.mobilidade},
    {label:'RESISTÊNCIA', val:attrs.resistencia},
    {label:'CONSISTÊNCIA',val:attrs.consistencia},
    {label:'EXPLOSÃO',    val:attrs.explosao},
  ];
  const radarData = attrList.map(a => ({ subject:a.label.slice(0,4), A:a.val, fullMark:99 }));

  return (
    <div style={{background:'linear-gradient(145deg,#0A0A0A,#111,#0A0A0A)',border:`2px solid ${tier.color}`,borderRadius:16,padding:'24px 20px',marginBottom:20,position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',top:-40,right:-40,width:200,height:200,borderRadius:'50%',background:`radial-gradient(circle,${tier.color}18 0%,transparent 70%)`,pointerEvents:'none'}}/>
      {/* Header */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20}}>
        <div>
          <div style={{fontSize:10,letterSpacing:3,color:MUTED,marginBottom:2}}>PŌKAI MOVEMENT</div>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,lineHeight:1}}>{name.toUpperCase()}</div>
          <div style={{display:'inline-block',marginTop:6,padding:'3px 10px',background:tier.color+'22',border:`1px solid ${tier.color}`,borderRadius:4,fontSize:11,fontWeight:700,color:tier.color,letterSpacing:2}}>{tier.name}</div>
        </div>
        <div style={{textAlign:'center'}}>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:72,color:tier.color,lineHeight:1}}>{attrs.ovr}</div>
          <div style={{fontSize:10,color:MUTED,letterSpacing:2}}>OVR</div>
        </div>
      </div>
      {/* Attrs + Radar */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 180px',gap:20,alignItems:'center'}}>
        <div>
          {attrList.map(a => (
            <div key={a.label} style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:1,color:MUTED,width:82,textAlign:'right'}}>{a.label}</div>
              <div style={{flex:1,height:5,background:BDR,borderRadius:3,overflow:'hidden'}}>
                <div style={{width:`${a.val}%`,height:'100%',background:barColor(a.val),borderRadius:3}}/>
              </div>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:barColor(a.val),width:28,textAlign:'right'}}>{a.val}</div>
            </div>
          ))}
        </div>
        <div style={{height:160}}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{top:8,right:8,bottom:8,left:8}}>
              <PolarGrid stroke={BDR}/>
              <PolarAngleAxis dataKey="subject" tick={{fill:MUTED,fontSize:9}}/>
              <Radar dataKey="A" stroke={tier.color} fill={tier.color} fillOpacity={0.15} strokeWidth={1.5}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Stats */}
      <div style={{display:'flex',gap:16,marginTop:16,paddingTop:16,borderTop:`1px solid ${BDR}`}}>
        {[['Treinos',logs.length],['Desbloqueados',unlocked.length],['Conquistas',`${earned.length}/${ACHIEVEMENTS.length}`]].map(([k,v]) => (
          <div key={k} style={{textAlign:'center',flex:1}}>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:ACC}}>{v}</div>
            <div style={{fontSize:10,color:MUTED,letterSpacing:1}}>{k.toUpperCase()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ACHIEVEMENTS VIEW
// ─────────────────────────────────────────────────────────────────
function AchievementsView({ logs }) {
  const unlocked = useMemo(() => getUnlocked(logs), [logs]);
  const earned   = new Set(ACHIEVEMENTS.filter(a => a.check(logs, unlocked)).map(a => a.id));
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))',gap:12}}>
      {ACHIEVEMENTS.map(a => {
        const got = earned.has(a.id);
        return (
          <div key={a.id} style={{background:got?'rgba(141,198,63,0.06)':SURF,border:`1px solid ${got?ACC:BDR}`,borderRadius:10,padding:'16px 14px',textAlign:'center',opacity:got?1:0.4}}>
            <div style={{fontSize:28,marginBottom:8,filter:got?'none':'grayscale(1)'}}>{a.icon}</div>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:1,color:got?ACC:MUTED,marginBottom:4}}>{a.name}</div>
            <div style={{fontSize:11,color:MUTED,lineHeight:1.4}}>{a.desc}</div>
            {got && <div style={{marginTop:8,fontSize:10,color:ACC,fontWeight:700}}>✓ CONQUISTADO</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TREE VIEW
// ─────────────────────────────────────────────────────────────────
function TreeView({ logs }) {
  const unlocked = useMemo(() => getUnlocked(logs), [logs]);
  const uIds     = new Set(unlocked.map(n => n.id));
  const [selTree, setSelTree] = useState('empurrar');
  const tree = TREES.find(t => t.id === selTree);
  const LC = {1:BRONZE, 2:SILVER, 3:GOLD, 4:ACC, 5:'#FF6B35'};
  const LN = {1:'INICIANTE', 2:'BÁSICO', 3:'INTERMEDIÁRIO', 4:'AVANÇADO', 5:'ELITE'};
  const byLevel = {};
  tree.nodes.forEach(n => { if (!byLevel[n.level]) byLevel[n.level]=[]; byLevel[n.level].push(n); });
  const tU = unlocked.filter(n => n.treeId === selTree).length;

  return (
    <div>
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:20}}>
        {TREES.map(t => <Tab key={t.id} active={selTree===t.id} onClick={()=>setSelTree(t.id)}>{t.icon} {t.name}</Tab>)}
      </div>
      <div style={{...st.card,marginBottom:20}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}>
          <span style={{fontFamily:"'Bebas Neue'",fontSize:18,color:ACC}}>{tree.icon} {tree.name}</span>
          <span style={{fontSize:13,color:MUTED}}>{tU}/{tree.nodes.length}</span>
        </div>
        <div style={{height:6,background:BDR,borderRadius:3,overflow:'hidden'}}>
          <div style={{width:`${tU/tree.nodes.length*100}%`,height:'100%',background:ACC,borderRadius:3}}/>
        </div>
      </div>
      {[1,2,3,4,5].map(level => {
        const nodes = byLevel[level]; if (!nodes) return null;
        const lc = LC[level];
        return (
          <div key={level} style={{marginBottom:20}}>
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:lc,marginBottom:10}}>NV.{level} — {LN[level]}</div>
            <div style={{display:'flex',gap:10,overflowX:'auto',paddingBottom:8}}>
              {nodes.map((node,ni) => {
                const isU = uIds.has(node.id);
                const hp  = level===1 || unlocked.some(u => u.treeId===selTree && u.level<level);
                return (
                  <div key={node.id} style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
                    {ni > 0 && <div style={{width:24,height:2,background:isU?lc:BDR}}/>}
                    <div style={{width:112,padding:'12px 10px',textAlign:'center',background:isU?`${lc}15`:SURF2,border:`2px solid ${isU?lc:BDR}`,borderRadius:10,position:'relative',opacity:!hp&&!isU?0.3:1}}>
                      {isU && <div style={{position:'absolute',top:-8,right:-8,width:20,height:20,borderRadius:'50%',background:lc,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#000',fontWeight:700}}>✓</div>}
                      <div style={{fontSize:11,fontWeight:600,color:isU?TEXT:MUTED,lineHeight:1.3,marginBottom:6}}>{node.name}</div>
                      <div style={{fontSize:9,color:isU?lc:MUTED,letterSpacing:1,fontWeight:700}}>{isU?'✓ DESBLOQ.':'BLOQUEADO'}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div style={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:8,padding:'12px 16px',fontSize:12,color:MUTED}}>
        💡 Exercícios são desbloqueados automaticamente quando registrados nos treinos.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// FEED VIEW
// ─────────────────────────────────────────────────────────────────
function FeedView({ currentUser, isCoach }) {
  const [posts,     setPosts]     = useState([]);
  const [reactions, setReactions] = useState({});
  const [newPost,   setNewPost]   = useState('');
  const [loading,   setLoading]   = useState(true);
  const EMOJIS = ['🔥','💪','🌿','👏','❤️'];

  const load = useCallback(async () => {
    const { data: pData } = await supabase.from('feed_posts').select('*').order('created_at', {ascending:false}).limit(60);
    setPosts(pData || []);
    const { data: rData } = await supabase.from('feed_reactions').select('*');
    const map = {};
    (rData||[]).forEach(r => {
      if (!map[r.post_id]) map[r.post_id] = {};
      if (!map[r.post_id][r.emoji]) map[r.post_id][r.emoji] = [];
      map[r.post_id][r.emoji].push(r.student_name);
    });
    setReactions(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const post = async () => {
    if (!newPost.trim()) return;
    await supabase.from('feed_posts').insert({ author_name:currentUser, author_type:isCoach?'coach':'student', content:newPost.trim() });
    setNewPost('');
    load();
  };

  const react = async (postId, emoji) => {
    const already = reactions[postId]?.[emoji]?.includes(currentUser);
    if (already) {
      await supabase.from('feed_reactions').delete().eq('post_id',postId).eq('student_name',currentUser).eq('emoji',emoji);
    } else {
      await supabase.from('feed_reactions').insert({ post_id:postId, student_name:currentUser, emoji });
    }
    load();
  };

  const deletePost = async id => {
    if (!confirm('Remover post?')) return;
    await supabase.from('feed_posts').delete().eq('id',id);
    load();
  };

  return (
    <div>
      <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:3,color:ACC,marginBottom:20}}>📣 MURAL DA MATILHA</div>
      {/* Composer */}
      <div style={{...st.sect,marginBottom:20}}>
        <div style={{display:'flex',gap:12,alignItems:'flex-start'}}>
          <div style={{width:36,height:36,borderRadius:'50%',background:isCoach?ACC:SURF2,border:`2px solid ${isCoach?ACC:BDR}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:isCoach?'#000':TEXT,fontWeight:700,flexShrink:0}}>
            {currentUser[0].toUpperCase()}
          </div>
          <div style={{flex:1}}>
            <textarea
              placeholder={isCoach ? "Poste um aviso, motivação ou desafio para a matilha..." : "Compartilhe como foi seu treino, uma conquista, uma dúvida..."}
              style={{...st.inp,minHeight:80,resize:'vertical',marginBottom:10}}
              value={newPost} onChange={e=>setNewPost(e.target.value)}
            />
            <div style={{display:'flex',justifyContent:'flex-end'}}>
              <button style={st.btnP} onClick={post}>PUBLICAR →</button>
            </div>
          </div>
        </div>
      </div>
      {loading && <Spinner/>}
      {!loading && posts.length===0 && (
        <div style={{...st.card,textAlign:'center',padding:'48px',border:`2px dashed ${BDR}`}}>
          <p style={{color:MUTED}}>Nenhuma publicação ainda. Seja o primeiro!</p>
        </div>
      )}
      {posts.map(p => {
        const isCoachPost = p.author_type === 'coach';
        const isOwn       = p.author_name === currentUser;
        const pr          = reactions[p.id] || {};
        return (
          <div key={p.id} style={{...st.card,borderLeft:isCoachPost?`3px solid ${ACC}`:'3px solid transparent'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <div style={{width:34,height:34,borderRadius:'50%',background:isCoachPost?ACC:SURF2,border:`2px solid ${isCoachPost?ACC:BDR}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:isCoachPost?'#000':TEXT,fontWeight:700,flexShrink:0}}>
                  {p.author_name[0].toUpperCase()}
                </div>
                <div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontWeight:600,fontSize:14}}>{p.author_name}</span>
                    {isCoachPost && <span style={{fontSize:10,fontWeight:700,color:'#000',background:ACC,padding:'1px 6px',borderRadius:3,letterSpacing:1}}>PROFESSOR</span>}
                  </div>
                  <div style={{fontSize:11,color:MUTED}}>{timeAgo(p.created_at)}</div>
                </div>
              </div>
              {(isOwn||isCoach) && <button style={st.btnG} onClick={()=>deletePost(p.id)}>✕</button>}
            </div>
            <p style={{fontSize:14,lineHeight:1.6,color:'#DDD',margin:'0 0 12px',whiteSpace:'pre-wrap'}}>{p.content}</p>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {EMOJIS.map(emoji => {
                const who  = pr[emoji] || [];
                const mine = who.includes(currentUser);
                return (
                  <button key={emoji} onClick={()=>react(p.id,emoji)} style={{padding:'4px 10px',borderRadius:20,border:`1px solid ${mine?ACC:BDR}`,background:mine?'rgba(141,198,63,0.12)':'transparent',cursor:'pointer',fontSize:13,color:mine?ACC:MUTED,fontFamily:"'Outfit',sans-serif",display:'flex',alignItems:'center',gap:4}}>
                    {emoji} {who.length>0 && <span style={{fontSize:11}}>{who.length}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CHALLENGES VIEW
// ─────────────────────────────────────────────────────────────────
function ChallengesView({ currentUser, isCoach }) {
  const [challenges,  setChallenges]  = useState([]);
  const [completions, setCompletions] = useState({});
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [newC,        setNewC]        = useState({title:'',description:'',week:'',target:''});
  const [noteMap,     setNoteMap]     = useState({});

  const load = useCallback(async () => {
    const { data: cData } = await supabase.from('weekly_challenges').select('*').order('created_at',{ascending:false});
    setChallenges(cData || []);
    const { data: compData } = await supabase.from('challenge_completions').select('*');
    const map = {};
    (compData||[]).forEach(c => { if (!map[c.challenge_id]) map[c.challenge_id]=[]; map[c.challenge_id].push(c); });
    setCompletions(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createChallenge = async () => {
    if (!newC.title.trim()) return;
    await supabase.from('weekly_challenges').insert(newC);
    setNewC({title:'',description:'',week:'',target:''});
    setShowForm(false);
    load();
  };

  const deleteChallenge = async id => {
    if (!confirm('Remover desafio?')) return;
    await supabase.from('weekly_challenges').delete().eq('id',id);
    load();
  };

  const toggleComplete = async challengeId => {
    const done = completions[challengeId]?.find(c => c.student_name===currentUser);
    if (done) {
      await supabase.from('challenge_completions').delete().eq('id',done.id);
    } else {
      await supabase.from('challenge_completions').insert({ challenge_id:challengeId, student_name:currentUser, note:noteMap[challengeId]||null });
    }
    load();
  };

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:3,color:ACC}}>🏆 DESAFIOS DA SEMANA</div>
        {isCoach && <button style={{...st.btnP,marginLeft:'auto'}} onClick={()=>setShowForm(s=>!s)}>+ NOVO DESAFIO</button>}
      </div>
      {isCoach && showForm && (
        <div style={{...st.sect,border:`1px solid ${ACC}`,marginBottom:20}}>
          <span style={st.sectT}>CRIAR DESAFIO</span>
          <div style={st.g2}>
            <F label="Título"><Inp value={newC.title} onChange={e=>setNewC(p=>({...p,title:e.target.value}))} placeholder="Ex: 100 Pull-ups essa semana"/></F>
            <F label="Semana"><Inp value={newC.week} onChange={e=>setNewC(p=>({...p,week:e.target.value}))} placeholder="Ex: Semana 3"/></F>
          </div>
          <F label="Descrição / Regras">
            <textarea style={{...st.inp,minHeight:72,resize:'vertical'}} value={newC.description} onChange={e=>setNewC(p=>({...p,description:e.target.value}))} placeholder="Como funciona, regras, dicas..."/>
          </F>
          <F label="Meta (opcional)"><Inp value={newC.target} onChange={e=>setNewC(p=>({...p,target:e.target.value}))} placeholder="Ex: 100 reps, 5 treinos"/></F>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <button style={st.btnS} onClick={()=>setShowForm(false)}>Cancelar</button>
            <button style={st.btnP} onClick={createChallenge}>PUBLICAR DESAFIO</button>
          </div>
        </div>
      )}
      {loading && <Spinner/>}
      {!loading && challenges.length===0 && (
        <div style={{...st.card,textAlign:'center',padding:'48px',border:`2px dashed ${BDR}`}}>
          <p style={{color:MUTED}}>{isCoach ? 'Nenhum desafio ainda. Crie o primeiro!' : 'Nenhum desafio ativo. Aguarde o professor!'}</p>
        </div>
      )}
      {challenges.map(c => {
        const comps  = completions[c.id] || [];
        const myComp = comps.find(x => x.student_name===currentUser);
        const done   = !!myComp;
        return (
          <div key={c.id} style={{...st.card,border:`1px solid ${done?ACC:BDR}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
              <div>
                <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:4,flexWrap:'wrap'}}>
                  <span style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:1}}>{c.title}</span>
                  {c.week && <span style={{...st.tag,background:'rgba(255,255,255,0.05)',color:MUTED}}>{c.week}</span>}
                  {done   && <span style={st.tag}>✓ CONCLUÍDO</span>}
                </div>
                {c.target      && <div style={{fontSize:12,color:ACC,fontWeight:600,marginBottom:4}}>🎯 Meta: {c.target}</div>}
                {c.description && <p style={{fontSize:13,color:MUTED,lineHeight:1.5,margin:0}}>{c.description}</p>}
              </div>
              {isCoach && <button style={st.btnD} onClick={()=>deleteChallenge(c.id)}>Remover</button>}
            </div>
            <div style={{margin:'14px 0 10px'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontSize:11,color:MUTED,letterSpacing:1}}>PARTICIPANTES</span>
                <span style={{fontSize:12,color:ACC,fontWeight:700}}>{comps.length} {comps.length===1?'aluno':'alunos'}</span>
              </div>
              <div style={{height:6,background:BDR,borderRadius:3,overflow:'hidden'}}>
                <div style={{width:`${Math.min(100,comps.length*10)}%`,height:'100%',background:ACC,borderRadius:3}}/>
              </div>
            </div>
            {comps.length > 0 && (
              <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                {comps.map(cp => (
                  <div key={cp.id} title={cp.note||cp.student_name} style={{fontSize:11,padding:'3px 10px',background:'rgba(141,198,63,0.08)',border:`1px solid rgba(141,198,63,0.2)`,borderRadius:12,color:ACC}}>
                    ✓ {cp.student_name}
                  </div>
                ))}
              </div>
            )}
            {!isCoach && (
              <div>
                {!done && (
                  <div style={{marginBottom:8}}>
                    <Inp value={noteMap[c.id]||''} onChange={e=>setNoteMap(p=>({...p,[c.id]:e.target.value}))} placeholder="Conta como foi (opcional)..." sx={{fontSize:13,padding:'7px 10px'}}/>
                  </div>
                )}
                <button style={{...(done?st.btnS:st.btnP),width:'100%',padding:'10px'}} onClick={()=>toggleComplete(c.id)}>
                  {done ? '✓ Concluído — clique para desfazer' : 'MARCAR COMO CONCLUÍDO'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// PROFILE VIEW
// ─────────────────────────────────────────────────────────────────
function ProfileView({ student, profile, onSave }) {
  const EMPTY = { height:'', weight:'', birth_date:'', goal:'', goal_weight:'', notes:'', bioimpedance:null, bio_date:'' };
  const [form,     setForm]     = useState(profile || EMPTY);
  const [bioState, setBioState] = useState('idle');
  const [bioError, setBioError] = useState('');
  const [saved,    setSaved]    = useState(false);

  useEffect(() => { if (profile) setForm(profile); }, [profile]);

  const u = (f, v) => setForm(p => ({...p, [f]:v}));

  const parseBio = async file => {
    if (!file || file.type !== 'application/pdf') { setBioError('Selecione um PDF válido.'); setBioState('error'); return; }
    setBioState('loading'); setBioError('');
    try {
      const b64 = await new Promise((res,rej) => { const r=new FileReader(); r.onload=()=>res(r.result.split(',')[1]); r.onerror=()=>rej(); r.readAsDataURL(file); });
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:1500,
          messages:[{role:'user',content:[
            {type:'document',source:{type:'base64',media_type:'application/pdf',data:b64}},
            {type:'text',text:'Este é um laudo de bioimpedância. Extraia todos os dados numéricos relevantes: percentual de gordura, massa muscular, massa óssea, água corporal, gordura visceral, IMC, taxa metabólica basal, idade metabólica e qualquer outro indicador. Retorne APENAS JSON sem markdown, chaves em português: {"Gordura corporal":"22%","Massa muscular":"45.2 kg",...}. Se não for um laudo de bioimpedância, retorne {"erro":"Arquivo não reconhecido"}.'}
          ]}]
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || 'Erro API');
      const text   = data.content?.find(b=>b.type==='text')?.text || '';
      const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
      if (parsed.erro) throw new Error(parsed.erro);
      setForm(p => ({...p, bioimpedance:parsed, bio_date:new Date().toISOString().split('T')[0]}));
      setBioState('done');
    } catch(err) { setBioError(err.message || 'Erro ao processar PDF.'); setBioState('error'); }
  };

  const save = async () => {
    await onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const bmi = form.height && form.weight ? (form.weight / ((form.height/100)**2)).toFixed(1) : null;
  const bmiLabel = bmi ? (parseFloat(bmi)<18.5 ? 'Abaixo do peso' : parseFloat(bmi)<25 ? 'Peso saudável' : parseFloat(bmi)<30 ? 'Sobrepeso' : 'Obesidade') : '';
  const bmiColor = bmi ? (parseFloat(bmi)<18.5 ? WARN : parseFloat(bmi)<25 ? ACC : parseFloat(bmi)<30 ? GOLD : DANGER) : MUTED;

  return (
    <div>
      <h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:3,color:ACC,marginBottom:22}}>👤 MEU PERFIL</h1>

      {/* Personal data */}
      <div style={{...st.sect}}>
        <span style={st.sectT}>DADOS PESSOAIS</span>
        <div style={st.g2}>
          <F label="Nome"><div style={{...st.inp,color:MUTED,cursor:'default'}}>{student}</div></F>
          <F label="Data de nascimento"><input type="date" style={st.inp} value={form.birth_date||''} onChange={e=>u('birth_date',e.target.value)}/></F>
          <F label="Altura (cm)"><Inp type="number" value={form.height||''} onChange={e=>u('height',e.target.value)} placeholder="Ex: 172"/></F>
          <F label="Peso atual (kg)"><Inp type="number" value={form.weight||''} onChange={e=>u('weight',e.target.value)} placeholder="Ex: 75.5"/></F>
          <F label="Peso meta (kg)"><Inp type="number" value={form.goal_weight||''} onChange={e=>u('goal_weight',e.target.value)} placeholder="Ex: 70"/></F>
          {bmi && (
            <div style={st.fld}>
              <label style={st.lbl}>IMC calculado</label>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:32,color:bmiColor}}>
                {bmi}
                <span style={{fontFamily:"'Outfit'",fontSize:13,color:bmiColor,marginLeft:10}}>{bmiLabel}</span>
              </div>
            </div>
          )}
        </div>
        <F label="Objetivo principal">
          <textarea style={{...st.inp,minHeight:80,resize:'vertical'}} value={form.goal||''} onChange={e=>u('goal',e.target.value)} placeholder="Ex: Perder gordura, ganhar massa muscular, melhorar mobilidade, preparar para corrida..."/>
        </F>
        <F label="Observações para o professor (lesões, limitações, histórico)">
          <textarea style={{...st.inp,minHeight:72,resize:'vertical'}} value={form.notes||''} onChange={e=>u('notes',e.target.value)} placeholder="Lesões antigas, restrições médicas, medicamentos, histórico esportivo..."/>
        </F>
      </div>

      {/* Bioimpedance */}
      <div style={{...st.sect}}>
        <span style={st.sectT}>BIOIMPEDÂNCIA</span>
        <p style={{fontSize:13,color:MUTED,marginBottom:16}}>Envie o PDF do seu laudo e os dados serão extraídos automaticamente pela IA.</p>
        <label style={{...st.btnS,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8,marginBottom:12}}>
          📄 {bioState==='loading' ? 'ANALISANDO...' : 'ENVIAR PDF DA BIOIMPEDÂNCIA'}
          <input type="file" accept="application/pdf" style={{display:'none'}} disabled={bioState==='loading'} onChange={e=>{if(e.target.files[0])parseBio(e.target.files[0]);e.target.value='';}}/>
        </label>
        {bioState==='loading' && <p style={{fontSize:13,color:MUTED}}>⏳ Lendo o laudo, aguarde...</p>}
        {bioState==='error'   && <p style={{fontSize:13,color:DANGER}}>⚠️ {bioError}</p>}
        {bioState==='done'    && <p style={{fontSize:13,color:ACC}}>✓ Dados extraídos com sucesso!</p>}
        {form.bioimpedance && (
          <div style={{marginTop:16}}>
            <div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:10,display:'flex',alignItems:'center',gap:12}}>
              DADOS EXTRAÍDOS {form.bio_date && `· ${form.bio_date}`}
              <button style={st.btnG} onClick={()=>setForm(p=>({...p,bioimpedance:null,bio_date:''}))}>Remover</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:10}}>
              {Object.entries(form.bioimpedance).map(([k,v]) => (
                <div key={k} style={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:8,padding:'10px 12px'}}>
                  <div style={{fontSize:10,color:MUTED,marginBottom:4}}>{k}</div>
                  <div style={{fontSize:15,fontWeight:700,color:ACC}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button style={{...st.btnP,width:'100%',padding:'14px',fontSize:15}} onClick={save}>
        {saved ? '✓ SALVO!' : '💾 SALVAR PERFIL'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// TEMPLATE FORM
// ─────────────────────────────────────────────────────────────────
function TemplateForm({ tpl, onSave, onCancel }) {
  const [form, setForm] = useState({...tpl});
  const addEx    = () => setForm(p=>({...p,exercises:[...p.exercises,{...EMPTY_TPL_EX}]}));
  const removeEx = i  => setForm(p=>({...p,exercises:p.exercises.filter((_,j)=>j!==i)}));
  const updEx    = (i,f,v) => setForm(p=>({...p,exercises:p.exercises.map((e,j)=>j===i?{...e,[f]:v}:e)}));
  const moveEx   = (i,d) => {
    const exs=[...form.exercises]; const t=i+d;
    if(t<0||t>=exs.length)return;
    [exs[i],exs[t]]=[exs[t],exs[i]];
    setForm(p=>({...p,exercises:exs}));
  };
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:22}}>
        <button style={st.btnG} onClick={onCancel}>← Voltar</button>
        <h2 style={{fontFamily:"'Bebas Neue'",fontSize:24,letterSpacing:3,color:ACC,margin:0}}>{form.id?'EDITAR TREINO':'NOVO TREINO'}</h2>
      </div>
      <div style={st.sect}>
        <span style={st.sectT}>IDENTIFICAÇÃO</span>
        <div style={st.g2}>
          <F label="Nome"><input style={st.inp} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Treino A"/></F>
          <F label="Descrição"><input style={st.inp} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Foco do treino"/></F>
        </div>
      </div>
      <div style={st.sect}>
        <span style={st.sectT}>EXERCÍCIOS</span>
        {form.exercises.map((ex,i) => (
          <div key={i} style={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:8,padding:'14px',marginBottom:12}}>
            <div style={{display:'flex',gap:8,marginBottom:10,alignItems:'center'}}>
              <span style={{fontFamily:"'Bebas Neue'",fontSize:16,color:ACC,minWidth:20}}>{i+1}</span>
              <input placeholder="Nome do exercício" style={{...st.inp,flex:1,fontWeight:600}} value={ex.name} onChange={e=>updEx(i,'name',e.target.value)}/>
              <button style={st.btnG} onClick={()=>moveEx(i,-1)}>↑</button>
              <button style={st.btnG} onClick={()=>moveEx(i,1)}>↓</button>
              <button style={st.btnD} onClick={()=>removeEx(i)}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 2fr',gap:10}}>
              <F label="Séries"><input type="number" min="1" style={st.inp} value={ex.plannedSets} onChange={e=>updEx(i,'plannedSets',Number(e.target.value))}/></F>
              <F label="Reps/Tempo"><input placeholder="8-10" style={st.inp} value={ex.plannedReps} onChange={e=>updEx(i,'plannedReps',e.target.value)}/></F>
              <F label="Carga ref."><input placeholder="60kg" style={st.inp} value={ex.plannedLoad} onChange={e=>updEx(i,'plannedLoad',e.target.value)}/></F>
              <F label="Dica técnica"><input placeholder="Cue para o aluno..." style={st.inp} value={ex.cues} onChange={e=>updEx(i,'cues',e.target.value)}/></F>
            </div>
          </div>
        ))}
        <button style={{...st.btnS,width:'100%',padding:'11px'}} onClick={addEx}>+ Adicionar Exercício</button>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
        <button style={st.btnS} onClick={onCancel}>Cancelar</button>
        <button style={st.btnP} onClick={()=>onSave(form)}>💾 {form.id?'SALVAR':'PUBLICAR'}</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────────────
export default function App() {
  // Auth
  const [view,      setView]      = useState('login');
  const [student,   setStudent]   = useState('');
  const [nameInput, setNameInput] = useState('');
  const [coachPass, setCoachPass] = useState('');
  const [isCoach,   setIsCoach]   = useState(false);
  const [loading,   setLoading]   = useState(false);

  // Student data
  const [logs,        setLogs]        = useState([]);
  const [profile,     setProfile]     = useState(null);
  const [templates,   setTemplates]   = useState([]);

  // Coach data
  const [allStudents, setAllStudents] = useState([]);
  const [studData,    setStudData]    = useState({});
  const [studProfiles,setStudProfiles]= useState({});

  // Workout flow
  const [selWeek,  setSelWeek]  = useState('');
  const [logData,  setLogData]  = useState(null);

  // Coach UI
  const [coachTab,         setCoachTab]         = useState('alunos');
  const [editTpl,          setEditTpl]          = useState(null);
  const [expandedStudent,  setExpandedStudent]  = useState(null);
  const [expandedLog,      setExpandedLog]      = useState(null);

  // Card tabs
  const [cardTab, setCardTab] = useState('card');
  const [selEx,   setSelEx]   = useState('');

  // PDF import
  const [importState,   setImportState]   = useState('idle');
  const [importedTpls,  setImportedTpls]  = useState([]);
  const [importError,   setImportError]   = useState('');

  // ── Load functions ──────────────────────────────────────────────
  useEffect(() => { loadTemplates(); }, []);
  useEffect(() => { if (student && !isCoach) { loadLogs(student); loadProfile(student); } }, [student, isCoach]);

  const loadTemplates = async () => {
    const { data } = await supabase.from('templates').select('*').order('created_at');
    setTemplates(data || []);
  };

  const loadLogs = async name => {
    setLoading(true);
    const { data } = await supabase.from('student_logs').select('*').eq('student_name',name).order('date',{ascending:false});
    setLogs(data || []);
    setLoading(false);
  };

  const loadProfile = async name => {
    const { data } = await supabase.from('student_profiles').select('*').eq('student_name',name).single();
    setProfile(data || null);
  };

  const loadCoach = async () => {
    setLoading(true);
    await loadTemplates();
    const { data: logData } = await supabase.from('student_logs').select('*').order('created_at',{ascending:false});
    const map = {};
    (logData||[]).forEach(l => { if (!map[l.student_name]) map[l.student_name]=[]; map[l.student_name].push(l); });
    setAllStudents(Object.keys(map));
    setStudData(map);
    const { data: profData } = await supabase.from('student_profiles').select('*');
    const pm = {};
    (profData||[]).forEach(p => { pm[p.student_name]=p; });
    setStudProfiles(pm);
    setLoading(false);
  };

  // ── Auth ────────────────────────────────────────────────────────
  const login = async () => {
    const name = nameInput.trim();
    if (!name) return;
    setStudent(name);
    setIsCoach(false);
    setView('dash');
  };

  const enterCoach = async () => {
    if (coachPass === 'pokai2026') {
      setStudent('Professor');
      setIsCoach(true);
      await loadCoach();
      setView('coach');
    } else {
      alert('Senha incorreta. Use: pokai2026');
    }
  };

  // ── Workout flow ────────────────────────────────────────────────
  const startFromTemplate = tpl => {
    setLogData({
      id:null, date:new Date().toISOString().split('T')[0], week:selWeek,
      template_id:tpl.id, template_name:tpl.name,
      exercises: tpl.exercises.map(ex => ({
        name:ex.name, cues:ex.cues,
        planned:{sets:ex.plannedSets, reps:ex.plannedReps, load:ex.plannedLoad},
        sets: Array.from({length:ex.plannedSets}, ()=>({...EMPTY_SET})),
      })),
      rpe:7, energy:'média', highlights:'', notes:'',
    });
    setView('newlog');
  };

  const saveLog = async () => {
    if (!logData) return;
    setLoading(true);
    const record = {
      student_name:  student,
      date:          logData.date,
      week:          logData.week || null,
      template_id:   logData.template_id || null,
      template_name: logData.template_name || 'Treino Livre',
      exercises:     logData.exercises,
      rpe:           logData.rpe,
      energy:        logData.energy,
      highlights:    logData.highlights || null,
      notes:         logData.notes || null,
    };
    if (logData.id) {
      await supabase.from('student_logs').update(record).eq('id',logData.id);
    } else {
      await supabase.from('student_logs').insert(record);
    }
    await loadLogs(student);
    setView('dash');
    setLoading(false);
  };

  const updSet = (ei,si,f,v) => setLogData(p=>({...p,exercises:p.exercises.map((e,i)=>i===ei?{...e,sets:e.sets.map((s,j)=>j===si?{...s,[f]:v}:s)}:e)}));
  const addSet = ei => setLogData(p=>({...p,exercises:p.exercises.map((e,i)=>i===ei?{...e,sets:[...e.sets,{...EMPTY_SET}]}:e)}));
  const remSet = (ei,si) => setLogData(p=>({...p,exercises:p.exercises.map((e,i)=>i===ei?{...e,sets:e.sets.filter((_,j)=>j!==si)}:e)}));

  // ── Template CRUD ───────────────────────────────────────────────
  const saveTpl = async tpl => {
    if (tpl.id) {
      await supabase.from('templates').update(tpl).eq('id',tpl.id);
    } else {
      await supabase.from('templates').insert({...tpl, id:String(Date.now())});
    }
    await loadTemplates();
    setEditTpl(null);
  };

  const deleteTpl = async id => {
    if (!confirm('Remover esse treino?')) return;
    await supabase.from('templates').delete().eq('id',id);
    await loadTemplates();
  };

  // ── PDF import ──────────────────────────────────────────────────
  const importPDF = async file => {
    if (!file || file.type!=='application/pdf') { setImportError('Selecione um PDF válido.'); setImportState('error'); return; }
    setImportState('loading'); setImportError('');
    try {
      const b64 = await new Promise((res,rej) => { const r=new FileReader(); r.onload=()=>res(r.result.split(',')[1]); r.onerror=()=>rej(); r.readAsDataURL(file); });
      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          model:'claude-sonnet-4-20250514', max_tokens:4000,
          messages:[{role:'user',content:[
            {type:'document',source:{type:'base64',media_type:'application/pdf',data:b64}},
            {type:'text',text:'Analise este PDF e extraia todos os treinos (Treino A, B, C...). Retorne APENAS JSON sem markdown: {"templates":[{"name":"Treino A","description":"foco","exercises":[{"name":"exercício","plannedSets":3,"plannedReps":"8-10","plannedLoad":"","cues":""}]}]}'}
          ]}]
        })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error?.message || 'Erro API');
      const text   = data.content?.find(b=>b.type==='text')?.text || '';
      const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
      if (!parsed.templates) throw new Error('Estrutura não reconhecida');
      setImportedTpls(parsed.templates);
      setImportState('preview');
    } catch(err) { setImportError(err.message); setImportState('error'); }
  };

  const confirmImport = async () => {
    for (const t of importedTpls) {
      await supabase.from('templates').insert({...t, id:String(Date.now()+Math.random())});
    }
    await loadTemplates();
    setImportState('idle');
    setImportedTpls([]);
  };

  // ── Profile save ────────────────────────────────────────────────
  const saveProfile = async p => {
    const rec = {...p, student_name:student, updated_at:new Date().toISOString()};
    const { data: existing } = await supabase.from('student_profiles').select('student_name').eq('student_name',student).single();
    if (existing) {
      await supabase.from('student_profiles').update(rec).eq('student_name',student);
    } else {
      await supabase.from('student_profiles').insert(rec);
    }
    await loadProfile(student);
  };

  // ── Derived data ────────────────────────────────────────────────
  const exNames = useMemo(() => {
    const n = new Set();
    logs.forEach(l => l.exercises?.forEach(e => e.name && n.add(e.name)));
    return [...n];
  }, [logs]);

  const progressData = useMemo(() => {
    if (!selEx) return [];
    return [...logs].reverse()
      .filter(l => l.exercises?.some(e=>e.name===selEx))
      .map(l => {
        const ex   = l.exercises.find(e=>e.name===selEx);
        const done = ex.sets.filter(s=>s.completed);
        const maxLoad = done.length ? Math.max(...done.map(s=>parseFloat(s.load)||0)) : 0;
        return { date:l.date.slice(5), maxLoad };
      });
  }, [logs, selEx]);

  const stats = useMemo(() => {
    const c = new Date(); c.setDate(c.getDate()-7);
    const lw = logs.filter(l=>new Date(l.date)>=c).length;
    const freq = {};
    logs.forEach(l=>l.exercises?.forEach(e=>{if(e.name)freq[e.name]=(freq[e.name]||0)+1;}));
    const favEx = Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';
    return { total:logs.length, lw, favEx };
  }, [logs]);

  const exSum = ex => {
    const done = ex.sets.filter(s=>s.completed);
    const ml   = done.length ? Math.max(...done.map(s=>parseFloat(s.load)||0)) : 0;
    return { done:done.length, total:ex.sets.length, maxLoad:ml };
  };

  const attrs = useMemo(() => { const u=getUnlocked(logs); return computeAttrs(logs,u); }, [logs]);
  const tier  = getTier(attrs.ovr);

  // ── RENDER ──────────────────────────────────────────────────────
  return (
    <div style={st.app}>
      <style>{FONTS}</style>

      {/* ── NAV ── */}
      <nav style={st.nav}>
        <span style={st.logo}>PŌKAI</span>
        {student && !isCoach && <>
          <Tab active={view==='dash'}       onClick={()=>setView('dash')}>Dashboard</Tab>
          <Tab active={view==='pick'}       onClick={()=>setView('pick')}>Treinar</Tab>
          <Tab active={view==='card'}       onClick={()=>setView('card')}>🃏 Card</Tab>
          <Tab active={view==='feed'}       onClick={()=>setView('feed')}>📣 Mural</Tab>
          <Tab active={view==='challenges'} onClick={()=>setView('challenges')}>🏆 Desafios</Tab>
          <Tab active={view==='history'}    onClick={()=>setView('history')}>Histórico</Tab>
          <Tab active={view==='profile'}    onClick={()=>setView('profile')}>👤 Perfil</Tab>
          <span style={{fontSize:11,color:MUTED,marginLeft:'auto',borderLeft:`1px solid ${BDR}`,paddingLeft:10,flexShrink:0}}>
            {student.split(' ')[0]}
          </span>
        </>}
        {isCoach && <>
          <Tab active={coachTab==='alunos'}    onClick={()=>{setView('coach');setCoachTab('alunos');}}>👥 Alunos</Tab>
          <Tab active={coachTab==='templates'} onClick={()=>{setView('coach');setCoachTab('templates');}}>📋 Treinos</Tab>
          <Tab active={view==='feed'}          onClick={()=>setView('feed')}>📣 Mural</Tab>
          <Tab active={view==='challenges'}    onClick={()=>setView('challenges')}>🏆 Desafios</Tab>
          <span style={{fontSize:11,color:ACC,marginLeft:'auto',fontWeight:700,flexShrink:0}}>PROFESSOR</span>
          <button style={st.btnG} onClick={()=>{setStudent('');setIsCoach(false);setView('login');}}>Sair</button>
        </>}
      </nav>

      <div style={st.main}>
        {loading && <Spinner/>}
        {!loading && <>

        {/* ── LOGIN ── */}
        {view==='login' && (
          <div style={{maxWidth:400,margin:'56px auto 0',textAlign:'center'}}>
            <div style={{marginBottom:36}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:60,letterSpacing:6,color:TEXT,lineHeight:1}}>PŌKAI</div>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:8,color:ACC,marginBottom:10}}>MOVEMENT</div>
              <div style={{width:32,height:3,background:ACC,margin:'0 auto 16px'}}/>
              <p style={{color:MUTED,fontSize:13}}>Registre seus treinos. Acompanhe sua evolução.</p>
            </div>
            <div style={st.card}>
              <F label="Seu nome completo">
                <Inp value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="Ex: João Silva" sx={{fontSize:15}}/>
              </F>
              <button style={{...st.btnP,width:'100%',padding:'13px',fontSize:15}} onClick={login}>
                ENTRAR NA MATILHA →
              </button>
            </div>
            <div style={{marginTop:24,borderTop:`1px solid ${BDR}`,paddingTop:20}}>
              <p style={{fontSize:12,color:MUTED,marginBottom:10}}>Acesso para professores</p>
              <div style={{display:'flex',gap:8}}>
                <input type="password" placeholder="Senha do professor" value={coachPass} onChange={e=>setCoachPass(e.target.value)} style={{...st.inp,flex:1,padding:'8px 12px',fontSize:13}}/>
                <button style={st.btnS} onClick={enterCoach}>Acessar</button>
              </div>
            </div>
          </div>
        )}

        {/* ── DASHBOARD ── */}
        {view==='dash' && (
          <div>
            <div style={{marginBottom:20}}>
              <h1 style={{fontFamily:"'Bebas Neue'",fontSize:30,letterSpacing:3,color:ACC,margin:0}}>
                BEM-VINDO, {student.split(' ')[0].toUpperCase()}
              </h1>
              <span style={{fontSize:12,color:MUTED}}>Nível: </span>
              <span style={{fontSize:12,fontWeight:700,color:tier.color}}>{tier.name}</span>
              <span style={{fontFamily:"'Bebas Neue'",fontSize:18,color:tier.color,marginLeft:8}}>{attrs.ovr} OVR</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
              {[['🏋️','Treinos',stats.total],['🔥','Semana',stats.lw],['⭐','Favorito',stats.favEx]].map(([ic,k,v])=>(
                <div key={k} style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:10,padding:'12px',textAlign:'center'}}>
                  <div style={{fontSize:18,marginBottom:4}}>{ic}</div>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:ACC,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:10,color:MUTED,letterSpacing:1,textTransform:'uppercase',marginTop:4}}>{k}</div>
                </div>
              ))}
            </div>
            <button style={{...st.btnP,width:'100%',padding:'13px',fontSize:15,marginBottom:10}} onClick={()=>setView('pick')}>
              + REGISTRAR TREINO DE HOJE
            </button>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:22}}>
              <button style={{...st.btnS,padding:'11px'}} onClick={()=>setView('card')}>🃏 Meu Card</button>
              <button style={{...st.btnS,padding:'11px'}} onClick={()=>setView('feed')}>📣 Mural</button>
            </div>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,color:ACC,marginBottom:12}}>SESSÕES RECENTES</div>
            {logs.length===0 && (
              <div style={{...st.card,textAlign:'center',padding:'36px',border:`2px dashed ${BDR}`}}>
                <p style={{color:MUTED}}>Nenhum treino ainda. Comece agora!</p>
              </div>
            )}
            {logs.slice(0,5).map(l=>(
              <div key={l.id} style={st.card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4,flexWrap:'wrap'}}>
                      <span style={{fontFamily:"'Bebas Neue'",fontSize:17}}>{l.template_name||'Treino'}</span>
                      {l.week && <span style={{...st.tag,background:'rgba(255,255,255,0.05)',color:MUTED}}>{l.week}</span>}
                      <span style={{fontSize:11,color:MUTED}}>📅 {l.date}</span>
                    </div>
                    <div style={{fontSize:12,color:MUTED}}>{l.exercises?.filter(e=>e.name).slice(0,4).map(e=>e.name).join(' · ')}</div>
                    {l.highlights && <div style={{fontSize:12,color:'rgba(141,198,63,0.8)',marginTop:4}}>✨ {l.highlights}</div>}
                  </div>
                  {l.rpe && <span style={st.tag}>RPE {l.rpe}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── CARD ── */}
        {view==='card' && (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:22}}>
              <button style={st.btnG} onClick={()=>setView('dash')}>← Voltar</button>
              <h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:3,color:ACC,margin:0}}>MEU CARD</h1>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:22}}>
              <Tab active={cardTab==='card'}       onClick={()=>setCardTab('card')}>🃏 Card</Tab>
              <Tab active={cardTab==='conquistas'} onClick={()=>setCardTab('conquistas')}>🏆 Conquistas</Tab>
              <Tab active={cardTab==='arvore'}     onClick={()=>setCardTab('arvore')}>🌳 Progressão</Tab>
            </div>
            {cardTab==='card'       && <AthleteCard name={student} logs={logs}/>}
            {cardTab==='conquistas' && <AchievementsView logs={logs}/>}
            {cardTab==='arvore'     && <TreeView logs={logs}/>}
          </div>
        )}

        {/* ── FEED ── */}
        {view==='feed' && student && (
          <FeedView currentUser={isCoach?'Professor':student} isCoach={isCoach}/>
        )}

        {/* ── CHALLENGES ── */}
        {view==='challenges' && student && (
          <ChallengesView currentUser={isCoach?'Professor':student} isCoach={isCoach}/>
        )}

        {/* ── PROFILE ── */}
        {view==='profile' && student && !isCoach && (
          <ProfileView student={student} profile={profile} onSave={saveProfile}/>
        )}

        {/* ── PICK WORKOUT ── */}
        {view==='pick' && (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:24}}>
              <button style={st.btnG} onClick={()=>setView('dash')}>← Voltar</button>
              <h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:3,color:ACC,margin:0}}>QUAL TREINO DE HOJE?</h1>
            </div>
            <div style={{...st.sect,marginBottom:20}}>
              <F label="Semana atual (opcional)">
                <Inp value={selWeek} onChange={e=>setSelWeek(e.target.value)} placeholder="Ex: Semana 3"/>
              </F>
            </div>
            {/* Free workout */}
            <div style={{...st.card,borderRadius:12,padding:'20px',marginBottom:16}}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
                <span style={{fontSize:22}}>✏️</span>
                <div>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2}}>TREINO LIVRE</div>
                  <div style={{fontSize:12,color:MUTED}}>Adicione exercícios manualmente</div>
                </div>
              </div>
              <button style={{...st.btnS,width:'100%',padding:'10px',marginTop:8}} onClick={()=>{
                setLogData({id:null,date:new Date().toISOString().split('T')[0],week:selWeek,template_id:null,template_name:'Treino Livre',exercises:[{name:'',cues:'',planned:{sets:3,reps:'',load:''},sets:[{...EMPTY_SET},{...EMPTY_SET},{...EMPTY_SET}]}],rpe:7,energy:'média',highlights:'',notes:''});
                setView('newlog');
              }}>REGISTRAR TREINO LIVRE →</button>
            </div>
            {templates.length > 0 && <>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:2,color:MUTED,marginBottom:12}}>OU ESCOLHA UM TREINO DO PROFESSOR</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
                {templates.map(tpl => (
                  <div key={tpl.id} style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:12,padding:'20px'}}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,color:ACC,marginBottom:4}}>{tpl.name}</div>
                    {tpl.description && <p style={{fontSize:12,color:MUTED,marginBottom:12}}>{tpl.description}</p>}
                    <div style={{display:'flex',flexDirection:'column',gap:4,marginBottom:16}}>
                      {tpl.exercises.slice(0,5).map((ex,i)=>(
                        <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                          <span style={{color:'#CCC'}}>{ex.name}</span>
                          <span style={{color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{ex.plannedSets}x{ex.plannedReps}</span>
                        </div>
                      ))}
                      {tpl.exercises.length>5 && <div style={{fontSize:11,color:MUTED}}>+{tpl.exercises.length-5} mais...</div>}
                    </div>
                    <button style={{...st.btnP,width:'100%',padding:'10px'}} onClick={()=>startFromTemplate(tpl)}>FAZER ESSE TREINO →</button>
                  </div>
                ))}
              </div>
            </>}
          </div>
        )}

        {/* ── NEW LOG ── */}
        {view==='newlog' && logData && (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:22}}>
              <button style={st.btnG} onClick={()=>setView('pick')}>← Voltar</button>
              <div>
                <h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:3,color:ACC,margin:0}}>{logData.template_name}</h1>
                {logData.week && <span style={{fontSize:12,color:MUTED}}>{logData.week} · {logData.date}</span>}
              </div>
            </div>
            {logData.exercises.map((ex,ei) => (
              <div key={ei} style={st.sect}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <div style={{flex:1,marginRight:12}}>
                    {logData.template_id===null ? (
                      <input placeholder="Nome do exercício..." style={{...st.inp,fontFamily:"'Bebas Neue'",fontSize:18,marginBottom:8}}
                        value={ex.name} onChange={e=>setLogData(p=>({...p,exercises:p.exercises.map((x,i)=>i===ei?{...x,name:e.target.value}:x)}))}/>
                    ) : (
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:18,marginBottom:6}}>{ex.name}</div>
                    )}
                    {ex.planned?.sets && (
                      <div style={st.plan}>📋 <span style={{color:ACC,fontFamily:"'JetBrains Mono',monospace"}}>{ex.planned.sets}x{ex.planned.reps}{ex.planned.load?` @ ${ex.planned.load}`:''}</span></div>
                    )}
                    {ex.cues && <div style={{fontSize:11,color:MUTED,marginTop:6}}>💡 {ex.cues}</div>}
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
                    <span style={{fontSize:11,color:MUTED}}>{ex.sets.filter(s=>s.completed).length}/{ex.sets.length}</span>
                    {logData.template_id===null && logData.exercises.length>1 && (
                      <button style={st.btnD} onClick={()=>setLogData(p=>({...p,exercises:p.exercises.filter((_,i)=>i!==ei)}))}>✕</button>
                    )}
                  </div>
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:360}}>
                    <thead>
                      <tr>{['Série','Reps','Carga (kg)','OK?','Obs',''].map(h=><th key={h} style={st.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {ex.sets.map((set,si) => (
                        <tr key={si} style={{opacity:set.completed?1:0.5}}>
                          <td style={{...st.td,color:MUTED,fontWeight:700,fontSize:12}}>{si+1}</td>
                          <td style={st.td}>
                            <input type="number" placeholder="0" min="0" style={{...st.inp,padding:'5px 8px',width:72,fontSize:13,textAlign:'center',borderColor:set.reps?ACC:undefined}}
                              value={set.reps} onChange={e=>updSet(ei,si,'reps',e.target.value)}/>
                          </td>
                          <td style={st.td}>
                            <input type="number" placeholder="0" min="0" step="0.5" style={{...st.inp,padding:'5px 8px',width:80,fontSize:13,textAlign:'center',borderColor:set.load?ACC:undefined}}
                              value={set.load} onChange={e=>updSet(ei,si,'load',e.target.value)}/>
                          </td>
                          <td style={{...st.td,textAlign:'center'}}>
                            <div onClick={()=>updSet(ei,si,'completed',!set.completed)} style={{width:24,height:24,borderRadius:5,cursor:'pointer',margin:'0 auto',border:`2px solid ${set.completed?ACC:'#444'}`,background:set.completed?ACC:'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#000'}}>
                              {set.completed?'✓':''}
                            </div>
                          </td>
                          <td style={st.td}>
                            <input placeholder="obs..." style={{...st.inp,padding:'5px 8px',width:110,fontSize:12}}
                              value={set.notes} onChange={e=>updSet(ei,si,'notes',e.target.value)}/>
                          </td>
                          <td style={st.td}>
                            {ex.sets.length>1 && <button style={{background:'none',border:'none',color:DANGER,cursor:'pointer',fontSize:14}} onClick={()=>remSet(ei,si)}>✕</button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button style={{...st.btnS,fontSize:12,padding:'5px 12px',marginTop:10}} onClick={()=>addSet(ei)}>+ Série extra</button>
              </div>
            ))}
            {logData.template_id===null && (
              <button style={{...st.btnS,width:'100%',padding:'12px',marginBottom:16,borderStyle:'dashed'}}
                onClick={()=>setLogData(p=>({...p,exercises:[...p.exercises,{name:'',cues:'',planned:{sets:3,reps:'',load:''},sets:[{...EMPTY_SET},{...EMPTY_SET},{...EMPTY_SET}]}]}))}>
                + Adicionar Exercício
              </button>
            )}
            <div style={st.sect}>
              <span style={st.sectT}>AVALIAÇÃO DA SESSÃO</span>
              <div style={st.g2}>
                <F label={`Esforço — RPE ${logData.rpe}/10`}>
                  <input type="range" min="1" max="10" value={logData.rpe} onChange={e=>setLogData(p=>({...p,rpe:Number(e.target.value)}))} style={{width:'100%',accentColor:ACC,marginTop:8}}/>
                </F>
                <F label="Energia">
                  <Sel value={logData.energy} onChange={e=>setLogData(p=>({...p,energy:e.target.value}))} opts={['baixa','média','alta']}/>
                </F>
              </div>
              <F label="Destaques ✨">
                <Inp value={logData.highlights} onChange={e=>setLogData(p=>({...p,highlights:e.target.value}))} placeholder="PR batido, técnica melhorou, sensação boa..."/>
              </F>
              <F label="Dores, dificuldades ou recado para o professor">
                <textarea style={{...st.inp,minHeight:80,resize:'vertical'}} value={logData.notes}
                  onChange={e=>setLogData(p=>({...p,notes:e.target.value}))}
                  placeholder="Tudo que o professor precisa saber: dores, desconfortos, dúvidas, limitações..."/>
              </F>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
              <button style={st.btnS} onClick={()=>setView('pick')}>Cancelar</button>
              <button style={{...st.btnP,padding:'12px 32px',fontSize:15}} onClick={saveLog}>💾 SALVAR TREINO</button>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {view==='history' && (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:22}}>
              <button style={st.btnG} onClick={()=>setView('dash')}>← Voltar</button>
              <h1 style={{fontFamily:"'Bebas Neue'",fontSize:30,letterSpacing:3,color:ACC,margin:0}}>HISTÓRICO</h1>
            </div>
            {exNames.length > 0 && (
              <div style={{...st.sect,marginBottom:20}}>
                <span style={st.sectT}>EVOLUÇÃO POR EXERCÍCIO</span>
                <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
                  {exNames.map(n=><Tab key={n} active={selEx===n} onClick={()=>setSelEx(n)}>{n}</Tab>)}
                </div>
                {selEx && progressData.length > 0 && (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={progressData} margin={{top:5,right:10,left:0,bottom:5}}>
                      <CartesianGrid strokeDasharray="3 3" stroke={BDR}/>
                      <XAxis dataKey="date" tick={{fill:MUTED,fontSize:11}}/>
                      <YAxis tick={{fill:MUTED,fontSize:11}} unit="kg" width={48}/>
                      <Tooltip contentStyle={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:6,color:TEXT,fontSize:12}}/>
                      <Line type="monotone" dataKey="maxLoad" name="Carga máx" stroke={ACC} strokeWidth={2.5} dot={{fill:ACC,r:4}}/>
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            )}
            {logs.length===0 && <div style={{...st.card,textAlign:'center',padding:'48px',border:`2px dashed ${BDR}`}}><p style={{color:MUTED}}>Nenhum treino registrado ainda.</p></div>}
            {logs.map(l=>(
              <div key={l.id} style={st.card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:10}}>
                  <div>
                    <span style={{fontFamily:"'Bebas Neue'",fontSize:17}}>{l.template_name||'Treino'}</span>
                    {l.week && <span style={{...st.tag,background:'rgba(255,255,255,0.05)',color:MUTED,marginLeft:10}}>{l.week}</span>}
                    <span style={{fontSize:11,color:MUTED,marginLeft:10}}>📅 {l.date}</span>
                  </div>
                  {l.rpe && <span style={st.tag}>RPE {l.rpe}</span>}
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:340}}>
                    <thead><tr>{['Exercício','Séries','Melhor carga'].map(h=><th key={h} style={st.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {l.exercises?.filter(e=>e.name).map((ex,i)=>{const{done,total,maxLoad}=exSum(ex);return(
                        <tr key={i}>
                          <td style={{...st.td,fontWeight:600}}>{ex.name}</td>
                          <td style={{...st.td,color:done<total?WARN:ACC}}>{done}/{total}</td>
                          <td style={{...st.td,color:ACC,fontFamily:"'JetBrains Mono',monospace"}}>{maxLoad?maxLoad+' kg':'—'}</td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                </div>
                {(l.highlights||l.notes) && (
                  <div style={{marginTop:12,display:'flex',gap:10,flexWrap:'wrap'}}>
                    {l.highlights && <div style={{flex:1,minWidth:160,background:'rgba(141,198,63,0.05)',padding:'10px 14px',borderRadius:6,borderLeft:`3px solid ${ACC}`,fontSize:13,color:'#CCC'}}><span style={{...st.lbl,marginBottom:4,color:ACC}}>Destaques</span>{l.highlights}</div>}
                    {l.notes     && <div style={{flex:1,minWidth:160,background:SURF2,padding:'10px 14px',borderRadius:6,fontSize:13,color:'#999'}}><span style={{...st.lbl,marginBottom:4}}>Obs / Dores</span>{l.notes}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── COACH PANEL ── */}
        {view==='coach' && (
          <div>
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:22}}>
              <h1 style={{fontFamily:"'Bebas Neue'",fontSize:26,letterSpacing:3,color:ACC,margin:0}}>PŌKAI — PROFESSOR</h1>
              <button style={{...st.btnS,marginLeft:'auto'}} onClick={loadCoach}>↻ Atualizar</button>
            </div>

            {/* ── ALUNOS TAB ── */}
            {coachTab==='alunos' && (
              <div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
                  {[
                    ['Total de alunos', allStudents.length],
                    ['Ativos essa semana', Object.values(studData).filter(ls=>{const c=new Date();c.setDate(c.getDate()-7);return ls.some(l=>new Date(l.date)>=c);}).length],
                    ['Treinos registrados', Object.values(studData).reduce((a,ls)=>a+ls.length,0)],
                  ].map(([k,v])=>(
                    <div key={k} style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:8,padding:'12px',textAlign:'center'}}>
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
                {allStudents.map(name => {
                  const sLogs  = studData[name] || [];
                  const sProf  = studProfiles[name];
                  const last   = sLogs[0];
                  const cutoff = new Date(); cutoff.setDate(cutoff.getDate()-7);
                  const lw     = sLogs.filter(l=>new Date(l.date)>=cutoff).length;
                  const open   = expandedStudent===name;
                  const unlocked = getUnlocked(sLogs);
                  const sA       = computeAttrs(sLogs, unlocked);
                  const sTier    = getTier(sA.ovr);
                  const prs = {};
                  sLogs.forEach(l=>l.exercises?.forEach(e=>{if(!e.name)return;const mx=Math.max(...e.sets.filter(s=>s.completed&&s.load).map(s=>parseFloat(s.load)||0),0);if(!prs[e.name]||mx>prs[e.name])prs[e.name]=mx;}));

                  return (
                    <div key={name} style={st.card}>
                      {/* Student header */}
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',cursor:'pointer'}} onClick={()=>setExpandedStudent(open?null:name)}>
                        <div>
                          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4,flexWrap:'wrap'}}>
                            <span style={{fontFamily:"'Bebas Neue'",fontSize:20}}>{name}</span>
                            <span style={{padding:'2px 8px',background:sTier.color+'22',border:`1px solid ${sTier.color}`,borderRadius:3,fontSize:11,fontWeight:700,color:sTier.color}}>{sTier.name}</span>
                            <span style={{fontFamily:"'Bebas Neue'",fontSize:18,color:sTier.color}}>{sA.ovr} OVR</span>
                            {lw===0 && sLogs.length>0 && <span style={{...st.tag,background:'rgba(224,80,80,0.12)',color:DANGER}}>INATIVO</span>}
                          </div>
                          <div style={{fontSize:12,color:MUTED,display:'flex',gap:14,flexWrap:'wrap'}}>
                            <span>🏋️ {sLogs.length} treinos</span>
                            <span>🔥 {lw} essa semana</span>
                            <span>🔓 {unlocked.length} ex.</span>
                            {last && <span>📅 {last.date}</span>}
                            {sProf?.goal && <span>🎯 {sProf.goal.slice(0,40)}{sProf.goal.length>40?'...':''}</span>}
                          </div>
                        </div>
                        <span style={{color:MUTED,fontSize:18,flexShrink:0}}>{open?'▲':'▼'}</span>
                      </div>

                      {open && (
                        <div style={{marginTop:16,borderTop:`1px solid ${BDR}`,paddingTop:16}}>

                          {/* Profile block */}
                          {sProf ? (
                            <div style={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:8,padding:'14px 16px',marginBottom:16}}>
                              <div style={{fontSize:10,color:MUTED,letterSpacing:1.5,marginBottom:10,textTransform:'uppercase'}}>Dados do Aluno</div>
                              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(110px,1fr))',gap:10,marginBottom:sProf.goal?10:0}}>
                                {sProf.height     && <div><div style={{fontSize:10,color:MUTED}}>Altura</div><div style={{fontFamily:"'Bebas Neue'",fontSize:18}}>{sProf.height} cm</div></div>}
                                {sProf.weight     && <div><div style={{fontSize:10,color:MUTED}}>Peso</div><div style={{fontFamily:"'Bebas Neue'",fontSize:18}}>{sProf.weight} kg</div></div>}
                                {sProf.height&&sProf.weight && <div><div style={{fontSize:10,color:MUTED}}>IMC</div><div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:ACC}}>{(sProf.weight/((sProf.height/100)**2)).toFixed(1)}</div></div>}
                                {sProf.goal_weight && <div><div style={{fontSize:10,color:MUTED}}>Meta</div><div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:GOLD}}>{sProf.goal_weight} kg</div></div>}
                                {sProf.birth_date  && <div><div style={{fontSize:10,color:MUTED}}>Nascimento</div><div style={{fontSize:13}}>{sProf.birth_date}</div></div>}
                              </div>
                              {sProf.goal  && <div style={{fontSize:13,color:'#CCC',borderTop:`1px solid ${BDR}`,paddingTop:8,marginTop:8}}><span style={{fontSize:10,color:MUTED,display:'block',marginBottom:4}}>OBJETIVO</span>{sProf.goal}</div>}
                              {sProf.notes && <div style={{fontSize:13,color:WARN,borderTop:`1px solid ${BDR}`,paddingTop:8,marginTop:8}}><span style={{fontSize:10,color:MUTED,display:'block',marginBottom:4}}>⚠️ OBS / LIMITAÇÕES</span>{sProf.notes}</div>}
                              {sProf.bioimpedance && (
                                <div style={{marginTop:10,borderTop:`1px solid ${BDR}`,paddingTop:10}}>
                                  <div style={{fontSize:10,color:MUTED,letterSpacing:1,marginBottom:8}}>BIOIMPEDÂNCIA {sProf.bio_date&&`· ${sProf.bio_date}`}</div>
                                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8}}>
                                    {Object.entries(sProf.bioimpedance).map(([k,v])=>(
                                      <div key={k} style={{background:BG,padding:'6px 10px',borderRadius:6}}>
                                        <div style={{fontSize:9,color:MUTED}}>{k}</div>
                                        <div style={{fontSize:14,fontWeight:600,color:ACC}}>{v}</div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div style={{background:SURF2,border:`1px dashed ${BDR}`,borderRadius:8,padding:'10px 14px',marginBottom:16,fontSize:12,color:MUTED}}>
                              Aluno ainda não preencheu o perfil.
                            </div>
                          )}

                          {/* Attributes */}
                          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
                            {[['FORÇA',sA.forca],['CONTROLE',sA.controle],['MOBILIDADE',sA.mobilidade],['RESISTÊNCIA',sA.resistencia],['CONSISTÊNCIA',sA.consistencia],['EXPLOSÃO',sA.explosao]].map(([k,v])=>(
                              <div key={k} style={{background:SURF2,padding:'8px 10px',borderRadius:6}}>
                                <div style={{fontSize:9,color:MUTED,letterSpacing:1,marginBottom:4}}>{k}</div>
                                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                                  <div style={{flex:1,height:4,background:BDR,borderRadius:2}}>
                                    <div style={{width:`${v}%`,height:'100%',background:barColor(v),borderRadius:2}}/>
                                  </div>
                                  <span style={{fontFamily:"'Bebas Neue'",fontSize:16,color:barColor(v)}}>{v}</span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* PRs */}
                          {Object.entries(prs).filter(([,v])=>v>0).length > 0 && (
                            <div style={{marginBottom:16}}>
                              <div style={{fontSize:10,color:MUTED,letterSpacing:1.5,marginBottom:8,textTransform:'uppercase'}}>Recordes Pessoais</div>
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

                          {/* Full workout log */}
                          <div style={{fontSize:10,color:MUTED,letterSpacing:1.5,marginBottom:10,textTransform:'uppercase'}}>
                            Todos os treinos ({sLogs.length})
                          </div>
                          {sLogs.map(l => {
                            const logOpen = expandedLog===l.id;
                            const hasPain = l.notes && (
                              l.notes.toLowerCase().includes('dor') ||
                              l.notes.toLowerCase().includes('desconforto') ||
                              l.notes.toLowerCase().includes('lesão') ||
                              l.notes.toLowerCase().includes('cansad')
                            );
                            return (
                              <div key={l.id} style={{background:SURF2,border:`1px solid ${hasPain?DANGER:BDR}`,borderRadius:8,padding:'12px 14px',marginBottom:8}}>
                                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',cursor:'pointer'}} onClick={()=>setExpandedLog(logOpen?null:l.id)}>
                                  <div>
                                    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginBottom:4}}>
                                      <span style={{fontWeight:600,fontSize:13}}>{l.template_name||'Treino'}</span>
                                      <span style={{fontSize:11,color:MUTED}}>📅 {l.date}</span>
                                      {l.week    && <span style={{fontSize:10,color:MUTED,border:`1px solid ${BDR}`,borderRadius:3,padding:'1px 5px'}}>{l.week}</span>}
                                      {l.rpe     && <span style={{...st.tag,fontSize:10}}>RPE {l.rpe}</span>}
                                      {l.energy  && <span style={{fontSize:10,color:MUTED}}>⚡{l.energy}</span>}
                                      {hasPain   && <span style={{fontSize:10,color:DANGER,fontWeight:700}}>⚠️ DOR/DESCONFORTO</span>}
                                    </div>
                                    {l.highlights && <div style={{fontSize:12,color:ACC}}>✨ {l.highlights}</div>}
                                  </div>
                                  <span style={{color:MUTED,fontSize:14,flexShrink:0}}>{logOpen?'▲':'▼'}</span>
                                </div>
                                {logOpen && (
                                  <div style={{marginTop:12,borderTop:`1px solid ${BDR}`,paddingTop:12}}>
                                    {/* Notes / pain highlighted */}
                                    {l.notes && (
                                      <div style={{background:hasPain?'rgba(224,80,80,0.08)':'rgba(255,255,255,0.03)',border:`1px solid ${hasPain?DANGER:BDR}`,borderRadius:6,padding:'10px 14px',marginBottom:12}}>
                                        <div style={{fontSize:10,fontWeight:700,color:hasPain?DANGER:MUTED,letterSpacing:1,marginBottom:4}}>
                                          {hasPain ? '⚠️ DORES / LIMITAÇÕES' : '💬 OBSERVAÇÕES DO ALUNO'}
                                        </div>
                                        <p style={{fontSize:13,color:'#CCC',margin:0,lineHeight:1.6}}>{l.notes}</p>
                                      </div>
                                    )}
                                    {/* Exercise table */}
                                    <table style={{width:'100%',borderCollapse:'collapse'}}>
                                      <thead><tr>{['Exercício','Planej.','Séries OK','Melhor carga','Volume'].map(h=><th key={h} style={{...st.th,fontSize:9}}>{h}</th>)}</tr></thead>
                                      <tbody>
                                        {l.exercises?.filter(e=>e.name).map((ex,i)=>{
                                          const done  = ex.sets.filter(s=>s.completed);
                                          const ml    = done.length ? Math.max(...done.map(s=>parseFloat(s.load)||0)) : 0;
                                          const vol   = Math.round(done.reduce((a,s)=>a+(parseFloat(s.reps)||0)*(parseFloat(s.load)||0),0));
                                          const notOk = done.length < ex.sets.length;
                                          return (
                                            <tr key={i}>
                                              <td style={{...st.td,fontWeight:600,fontSize:12}}>{ex.name}</td>
                                              <td style={{...st.td,fontSize:11,color:MUTED}}>{ex.planned?.sets||'—'}x{ex.planned?.reps||'?'}</td>
                                              <td style={{...st.td,color:notOk?WARN:ACC,fontSize:12}}>{done.length}/{ex.sets.length}{notOk&&' ⚠️'}</td>
                                              <td style={{...st.td,color:ACC,fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>{ml?ml+' kg':'—'}</td>
                                              <td style={{...st.td,fontFamily:"'JetBrains Mono',monospace",fontSize:12}}>{vol?vol+' kg':'—'}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                    {/* Per-set notes */}
                                    {l.exercises?.some(e=>e.sets.some(s=>s.notes)) && (
                                      <div style={{marginTop:10}}>
                                        <div style={{fontSize:10,color:MUTED,letterSpacing:1,marginBottom:6}}>OBS POR SÉRIE</div>
                                        {l.exercises?.filter(e=>e.sets.some(s=>s.notes)).map((ex,i)=>(
                                          <div key={i} style={{marginBottom:6,fontSize:11,color:'#888'}}>
                                            <span style={{fontWeight:600,color:'#AAA'}}>{ex.name}: </span>
                                            {ex.sets.filter(s=>s.notes).map((s,j)=>(
                                              <span key={j}>Série {ex.sets.indexOf(s)+1}: {s.notes} · </span>
                                            ))}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── TEMPLATES TAB ── */}
            {coachTab==='templates' && !editTpl && (
              <div>
                <div style={{display:'flex',gap:10,marginBottom:20,flexWrap:'wrap'}}>
                  <button style={st.btnP} onClick={()=>setEditTpl({id:null,name:'',description:'',exercises:[]})}>+ CADASTRAR MANUALMENTE</button>
                  <label style={{...st.btnS,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8}}>
                    📄 IMPORTAR PDF
                    <input type="file" accept="application/pdf" style={{display:'none'}} onChange={e=>{if(e.target.files[0])importPDF(e.target.files[0]);e.target.value='';}}/>
                  </label>
                </div>
                {importState==='loading' && <div style={{...st.card,textAlign:'center',padding:'36px'}}><div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:ACC}}>ANALISANDO PDF...</div></div>}
                {importState==='error'   && <div style={{...st.card,padding:'16px',border:`1px solid ${DANGER}`,marginBottom:12}}><span style={{color:DANGER}}>⚠️ {importError}</span> <button style={{...st.btnG,marginLeft:8}} onClick={()=>setImportState('idle')}>Fechar</button></div>}
                {importState==='preview' && (
                  <div style={{...st.sect,border:`1px solid ${ACC}`,marginBottom:20}}>
                    <span style={st.sectT}>{importedTpls.length} TREINOS ENCONTRADOS NO PDF</span>
                    {importedTpls.map((t,i)=>(
                      <div key={i} style={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:8,padding:'14px',marginBottom:10}}>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:19,color:ACC,marginBottom:6}}>{t.name}</div>
                        {t.exercises.map((ex,j)=>(
                          <div key={j} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'3px 0',borderBottom:`1px solid ${BDR}`}}>
                            <span>{ex.name}</span>
                            <span style={{color:ACC,fontFamily:"'JetBrains Mono',monospace"}}>{ex.plannedSets}x{ex.plannedReps}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div style={{display:'flex',gap:10,marginTop:12}}>
                      <button style={{...st.btnP,flex:1,padding:'12px'}} onClick={confirmImport}>✓ CONFIRMAR E SALVAR TODOS</button>
                      <button style={st.btnS} onClick={()=>setImportState('idle')}>Cancelar</button>
                    </div>
                  </div>
                )}
                {templates.length===0 && importState==='idle' && (
                  <div style={{...st.card,textAlign:'center',padding:'48px',border:`2px dashed ${BDR}`}}>
                    <p style={{color:MUTED}}>Nenhum treino ainda. Importe o PDF ou cadastre manualmente.</p>
                  </div>
                )}
                {templates.map(tpl=>(
                  <div key={tpl.id} style={{...st.card,display:'flex',alignItems:'flex-start',gap:14}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:ACC,marginBottom:4}}>{tpl.name}</div>
                      {tpl.description && <div style={{fontSize:12,color:MUTED,marginBottom:8}}>{tpl.description}</div>}
                      <div style={{fontSize:12,color:'#888'}}>
                        {tpl.exercises.map((ex,i)=>(
                          <span key={i} style={{marginRight:12}}>{ex.name} <span style={{fontFamily:"'JetBrains Mono',monospace",color:MUTED}}>{ex.plannedSets}x{ex.plannedReps}</span></span>
                        ))}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <button style={st.btnS} onClick={()=>setEditTpl(tpl)}>Editar</button>
                      <button style={st.btnD} onClick={()=>deleteTpl(tpl.id)}>Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {coachTab==='templates' && editTpl && (
              <TemplateForm tpl={editTpl} onSave={saveTpl} onCancel={()=>setEditTpl(null)}/>
            )}
          </div>
        )}

        </>}
      </div>
    </div>
  );
}
