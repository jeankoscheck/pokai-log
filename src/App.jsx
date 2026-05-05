import { useState, useEffect, useMemo, useRef } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";
import { Home, Calendar, BarChart2, User, Users, ClipboardList, ChevronLeft, ChevronRight, Plus, Edit2, Settings } from "lucide-react";
import ProfessorDashboard from "./ProfessorDashboard.jsx";

const FONTS=`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400&display=swap');`;
const BG='#060606',SURF='#0F0F0F',SURF2='#181818',BDR='#272727',ACC='#8DC63F',TEXT='#F2F2F0',MUTED='#666660',WARN='#E8A020',DANGER='#E05050';
const SB_URL='https://xvyvqmvcjwvedfkdygco.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2eXZxbXZjand2ZWRma2R5Z2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNjI1MDQsImV4cCI6MjA5MjYzODUwNH0.WYunV6-RzcxuVGjrp5jMLo5Lsyi1OHxYVRXC7ktvJfY';
const HDR={'apikey':SB_KEY,'Authorization':`Bearer ${SB_KEY}`,'Content-Type':'application/json'};
const MONTHS=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAY_LETTERS=['D','S','T','Q','Q','S','S'];

const sb={
  async get(t,q=''){try{const r=await fetch(`${SB_URL}/rest/v1/${t}?${q}`,{headers:HDR});if(!r.ok)throw new Error(await r.text());return r.json();}catch(e){console.error(e);return null;}},
  async upsert(t,d){try{const r=await fetch(`${SB_URL}/rest/v1/${t}`,{method:'POST',headers:{...HDR,'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify(d)});if(!r.ok)throw new Error(await r.text());return r.json();}catch(e){console.error(e);return null;}},
  async del(t,q){try{const r=await fetch(`${SB_URL}/rest/v1/${t}?${q}`,{method:'DELETE',headers:HDR});return r.ok;}catch(e){console.error(e);return false;}},
};

const PAIN_WORDS=['dor','dói','doendo','machucou','machucar','lesão','ardendo','inflamado','travado','travei','torci','torção','queimou','incômodo','desconforto'];
const hasPain=l=>[l.notes||'',...(l.exercises||[]).flatMap(e=>(e.sets||[]).map(s=>s.notes||''))].join(' ').toLowerCase().split(/\s+/).some(w=>PAIN_WORDS.some(p=>w.includes(p)));
const totalReps=l=>(l.exercises||[]).reduce((a,e)=>a+(e.sets||[]).filter(s=>s.completed).reduce((b,s)=>b+(parseFloat(s.reps)||0),0),0);
const todayStr=()=>new Date().toISOString().slice(0,10);
const toDateKey=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const getDIM=(y,m)=>new Date(y,m+1,0).getDate();
const isSameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const isToday=d=>isSameDay(d,new Date());

const calcValencias=(logs,profile)=>{
  if(!logs?.length)return{forca:0,volume:0,consistencia:0,intensidade:0,recuperacao:0,tecnica:0};
  const r=logs.slice(0,20);
  const allSets=r.flatMap(l=>(l.exercises||[]).flatMap(e=>(e.sets||[])));
  const done=allSets.filter(s=>s.completed);
  const tecnica=allSets.length?Math.round((done.length/allSets.length)*100):0;
  const maxLoad=done.length?Math.max(...done.map(s=>parseFloat(s.load)||0)):0;
  const forca=Math.min(100,Math.round((maxLoad/(profile?.weight||70))*60));
  const avgReps=r.reduce((a,l)=>a+totalReps(l),0)/(r.length||1);
  const volume=Math.min(100,Math.round(avgReps/8));
  const cutoff=new Date();cutoff.setDate(cutoff.getDate()-28);
  const consistencia=Math.min(100,Math.round((logs.filter(l=>new Date(l.date)>=cutoff).length/16)*100));
  const avgRpe=r.reduce((a,l)=>a+(l.rpe||7),0)/(r.length||1);
  const intensidade=Math.min(100,Math.round((avgRpe/10)*100));
  const em={baixa:30,média:65,alta:100};
  const recuperacao=Math.min(100,Math.round(r.reduce((a,l)=>a+(em[l.energy]||65),0)/(r.length||1)));
  return{forca,volume,consistencia,intensidade,recuperacao,tecnica};
};
const VL={forca:'Força',volume:'Volume',consistencia:'Consistência',intensidade:'Intensidade',recuperacao:'Recuperação',tecnica:'Técnica'};
const vc=v=>v>=80?ACC:v>=60?WARN:DANGER;
const EMPTY_SET={reps:'',load:'',completed:true,notes:''};
const EMPTY_EX={name:'',plannedSets:3,plannedReps:'',plannedLoad:'',cues:''};

const st={
  app:{fontFamily:"'Outfit',sans-serif",background:BG,color:TEXT,minHeight:'100vh'},
  main:{maxWidth:900,margin:'0 auto',padding:'80px 14px 24px'},
  btnP:{padding:'9px 20px',background:ACC,color:'#000',border:'none',borderRadius:5,cursor:'pointer',fontSize:13,fontFamily:"'Outfit',sans-serif",fontWeight:700},
  btnS:{padding:'8px 16px',background:SURF2,color:TEXT,border:`1px solid ${BDR}`,borderRadius:5,cursor:'pointer',fontSize:13,fontFamily:"'Outfit',sans-serif"},
  btnG:{padding:'6px 12px',background:'none',color:MUTED,border:'none',cursor:'pointer',fontSize:13,fontFamily:"'Outfit',sans-serif"},
  btnD:{padding:'5px 10px',background:'#1A0000',color:DANGER,border:`1px solid #330000`,borderRadius:4,cursor:'pointer',fontSize:11},
  card:{background:'rgba(15,15,15,0.8)',border:`1px solid ${BDR}`,borderRadius:12,padding:'16px 20px',marginBottom:12,backdropFilter:'blur(8px)'},
  sect:{background:'rgba(15,15,15,0.8)',border:`1px solid ${BDR}`,borderRadius:12,padding:'18px 20px',marginBottom:14,backdropFilter:'blur(8px)'},
  sectT:{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:2,color:ACC,display:'block',marginBottom:14,paddingBottom:8,borderBottom:`1px solid ${BDR}`},
  inp:{width:'100%',background:SURF2,border:`1px solid #333`,color:TEXT,padding:'9px 12px',borderRadius:5,fontSize:14,fontFamily:"'Outfit',sans-serif",boxSizing:'border-box',outline:'none'},
  lbl:{display:'block',fontSize:11,fontWeight:700,letterSpacing:1.5,color:MUTED,marginBottom:5,textTransform:'uppercase'},
  fld:{marginBottom:14},
  g2:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14},
  tag:{display:'inline-block',padding:'2px 8px',background:'rgba(141,198,63,0.12)',color:ACC,borderRadius:3,fontSize:11,fontWeight:700},
  tagD:{display:'inline-block',padding:'2px 8px',background:'rgba(224,80,80,0.15)',color:DANGER,borderRadius:3,fontSize:11,fontWeight:700},
  tagW:{display:'inline-block',padding:'2px 8px',background:'rgba(232,160,32,0.15)',color:WARN,borderRadius:3,fontSize:11,fontWeight:700},
  th:{textAlign:'left',padding:'8px 10px',background:'rgba(141,198,63,0.07)',color:ACC,fontSize:10,fontWeight:700,letterSpacing:1},
  td:{padding:'7px 10px',borderBottom:`1px solid ${BDR}`,fontSize:13,color:'#CCC'},
};

// ── BGPattern dots + fade-center ─────────────────────────────────────────────
function BGPattern(){
  return(
    <div style={{position:'fixed',inset:0,zIndex:0,pointerEvents:'none',
      backgroundImage:`radial-gradient(rgba(141,198,63,0.15) 1px, transparent 1px)`,
      backgroundSize:'20px 20px',
      WebkitMaskImage:`radial-gradient(ellipse at center, transparent, ${BG})`,
      maskImage:`radial-gradient(ellipse at center, transparent, ${BG})`,
    }}/>
  );
}

// ── TopNav ───────────────────────────────────────────────────────────────────
function TopNav({items,active,setActive,rightSlot}){
  const conRef=useRef(null);
  const btnRefs=useRef([]);
  const[ind,setInd]=useState({width:0,left:0});
  useEffect(()=>{
    const update=()=>{
      const btn=btnRefs.current[active];const con=conRef.current;
      if(!btn||!con)return;
      const bR=btn.getBoundingClientRect();const cR=con.getBoundingClientRect();
      setInd({width:bR.width,left:bR.left-cR.left});
    };
    update();window.addEventListener('resize',update);return()=>window.removeEventListener('resize',update);
  },[active,items]);
  return(
    <div style={{position:'fixed',top:0,left:0,right:0,zIndex:100,padding:'10px 14px 0',background:`linear-gradient(to bottom, ${BG} 75%, transparent)`}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <span style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:3,color:ACC}}>
          PŌKAI <span style={{color:TEXT,fontWeight:300,fontSize:13,letterSpacing:4}}>MOVEMENT</span>
        </span>
        {rightSlot}
      </div>
      <div ref={conRef} style={{position:'relative',display:'flex',alignItems:'center',background:'rgba(8,8,8,0.9)',backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',border:`1px solid rgba(141,198,63,0.15)`,borderRadius:999,padding:'4px',boxShadow:'0 4px 24px rgba(0,0,0,0.5)'}}>
        <div style={{position:'absolute',top:4,bottom:4,left:ind.left,width:ind.width,borderRadius:999,background:'rgba(141,198,63,0.1)',border:'1px solid rgba(141,198,63,0.25)',boxShadow:'0 0 10px rgba(141,198,63,0.12)',transition:'left 0.32s cubic-bezier(.4,0,.2,1),width 0.32s cubic-bezier(.4,0,.2,1)'}}/>
        {items.map((item,i)=>{
          const Icon=item.icon;const isA=active===i;
          return(
            <button key={i} ref={el=>btnRefs.current[i]=el} onClick={()=>setActive(i)}
              style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'8px 10px',background:'none',border:'none',cursor:'pointer',color:isA?ACC:'#555',transition:'color 0.2s',zIndex:1,position:'relative',whiteSpace:'nowrap',fontFamily:"'Outfit',sans-serif"}}>
              <Icon size={15} strokeWidth={isA?2:1.5}/>
              <span style={{fontSize:11,fontWeight:isA?600:400}}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── GlassCalendar ─────────────────────────────────────────────────────────────
function GlassCalendar({logMap,tplMap,selDate,onDayClick,coachMode=false}){
  const today=new Date();
  const[year,setYear]=useState(today.getFullYear());
  const[month,setMonth]=useState(today.getMonth());
  const[calView,setCalView]=useState('Weekly');
  const scrollRef=useRef(null);

  const dim=getDIM(year,month);
  const days=useMemo(()=>Array.from({length:dim},(_,i)=>{
    const d=new Date(year,month,i+1);const key=toDateKey(d);
    const log=logMap?.[key];const tpl=tplMap?.[key];
    return{date:d,key,isToday:isToday(d),isSelected:selDate===key,
      hasLog:!!log,hasPain:log&&hasPain(log),hasTpl:!!tpl&&!log,
      studentsCount:coachMode?Object.values(logMap||{}).filter(l=>Array.isArray(l)?l.some(ll=>ll.date===key):l?.date===key).length:0};
  }),[year,month,selDate,logMap,tplMap]);

  const prevMonth=()=>{if(month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1);};
  const nextMonth=()=>{if(month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1);};

  useEffect(()=>{
    if(scrollRef.current){
      const idx=days.findIndex(d=>d.isSelected||(d.isToday&&!days.some(x=>x.isSelected)));
      if(idx>=0){const el=scrollRef.current.children[idx];el?.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});}
    }
  },[month,selDate]);

  const selDay=days.find(d=>d.isSelected);
  const selInfo=selDay?.hasPain?{text:'⚠️ Dor reportada neste treino',color:DANGER}:
    selDay?.hasLog?{text:'✅ Treino registrado',color:ACC}:
    selDay?.hasTpl?{text:'📋 Treino agendado para este dia',color:WARN}:
    {text:'— Sem treino neste dia',color:MUTED};

  return(
    <div style={{background:'rgba(8,8,8,0.75)',backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',border:'1px solid rgba(141,198,63,0.15)',borderRadius:24,padding:'18px 18px 14px',boxShadow:'0 16px 48px rgba(0,0,0,0.6)',marginBottom:16}}>
      {/* Header tabs */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div style={{display:'flex',gap:3,background:'rgba(0,0,0,0.4)',borderRadius:10,padding:3}}>
          {['Weekly','Monthly'].map(v=>(
            <button key={v} onClick={()=>setCalView(v)} style={{padding:'4px 14px',borderRadius:7,border:'none',cursor:'pointer',fontSize:10,fontWeight:700,fontFamily:"'Outfit',sans-serif",background:calView===v?ACC:'transparent',color:calView===v?'#000':'rgba(255,255,255,0.35)',transition:'all 0.2s'}}>
              {v}
            </button>
          ))}
        </div>
        <div style={{display:'flex',gap:4}}>
          <button onClick={prevMonth} style={{background:'rgba(255,255,255,0.06)',border:'none',borderRadius:'50%',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'rgba(255,255,255,0.5)'}}>
            <ChevronLeft size={14}/>
          </button>
          <button onClick={nextMonth} style={{background:'rgba(255,255,255,0.06)',border:'none',borderRadius:'50%',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'rgba(255,255,255,0.5)'}}>
            <ChevronRight size={14}/>
          </button>
        </div>
      </div>

      {/* Month name */}
      <div style={{fontFamily:"'Bebas Neue'",fontSize:32,letterSpacing:2,color:TEXT,lineHeight:1,marginBottom:16}}>
        {MONTHS[month]} <span style={{fontSize:16,color:MUTED,letterSpacing:1}}>{year}</span>
      </div>

      {/* Scrollable days */}
      <div style={{overflowX:'auto',margin:'0 -18px',padding:'0 18px',scrollbarWidth:'none',msOverflowStyle:'none'}}>
        <style>{`.gcal-scroll::-webkit-scrollbar{display:none}`}</style>
        <div ref={scrollRef} className="gcal-scroll" style={{display:'flex',gap:6,width:'max-content'}}>
          {days.map(day=>{
            const dotColor=day.hasPain?DANGER:day.hasLog?ACC:day.hasTpl?WARN:null;
            return(
              <div key={day.key} onClick={()=>onDayClick(day.key,day)}
                style={{display:'flex',flexDirection:'column',alignItems:'center',gap:5,cursor:'pointer',flexShrink:0}}>
                <span style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.3)',letterSpacing:0.5}}>
                  {DAY_LETTERS[day.date.getDay()]}
                </span>
                <div style={{width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,position:'relative',
                  background:day.isSelected?`linear-gradient(135deg,${ACC},#5a9e00)`:day.isToday?'rgba(141,198,63,0.1)':'transparent',
                  border:day.isSelected?'none':day.isToday?`1px solid rgba(141,198,63,0.35)`:'1px solid transparent',
                  color:day.isSelected?'#000':'#fff',
                  boxShadow:day.isSelected?`0 4px 12px rgba(141,198,63,0.3)`:'none',
                  transition:'all 0.2s'}}>
                  {day.date.getDate()}
                  {dotColor&&!day.isSelected&&<span style={{position:'absolute',bottom:2,width:4,height:4,borderRadius:'50%',background:dotColor}}/>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected day info */}
      {selDate&&<div style={{marginTop:12,padding:'10px 12px',background:'rgba(255,255,255,0.04)',borderRadius:10,border:'1px solid rgba(255,255,255,0.06)'}}>
        <div style={{fontSize:10,color:'rgba(255,255,255,0.25)',marginBottom:3}}>
          {selDay&&selDay.date.toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}
        </div>
        <div style={{fontSize:12,color:selInfo.color,fontWeight:600}}>{selInfo.text}</div>
      </div>}

      {/* Divider */}
      <div style={{height:1,background:'rgba(255,255,255,0.07)',margin:'12px 0'}}/>

      {/* Footer */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',gap:12,fontSize:9,color:'rgba(255,255,255,0.25)'}}>
          {[[ACC,'Realizado'],[DANGER,'Dor'],[WARN,'Agendado']].map(([c,l])=>(
            <span key={l} style={{display:'flex',alignItems:'center',gap:3}}>
              <span style={{width:5,height:5,borderRadius:'50%',background:c,display:'inline-block'}}/>
              {l}
            </span>
          ))}
        </div>
        <button onClick={()=>onDayClick(todayStr(),null,'new')} style={{display:'flex',alignItems:'center',gap:5,background:'rgba(141,198,63,0.1)',border:'1px solid rgba(141,198,63,0.2)',borderRadius:8,padding:'5px 12px',cursor:'pointer',color:ACC,fontSize:10,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>
          <Plus size={12}/> Novo treino
        </button>
      </div>
    </div>
  );
}

const F=({label,children})=><div style={st.fld}><label style={st.lbl}>{label}</label>{children}</div>;
const Inp=({value,onChange,type='text',placeholder='',sx={}})=><input type={type} placeholder={placeholder} style={{...st.inp,...sx}} value={value} onChange={onChange}/>;
const Sel=({value,onChange,opts})=><select style={st.inp} value={value} onChange={onChange}>{opts.map(o=><option key={o}>{o}</option>)}</select>;
const Spin=()=>(
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'60px 0',flexDirection:'column',gap:12}}>
    <div style={{width:32,height:32,border:`3px solid ${BDR}`,borderTop:`3px solid ${ACC}`,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

// ── LogDetail ────────────────────────────────────────────────────────────────
function LogDetail({log,onEdit,onDelete,onClose}){
  const pain=hasPain(log);
  const exSum=ex=>{const done=ex.sets.filter(s=>s.completed);return{done:done.length,total:ex.sets.length,maxLoad:done.length?Math.max(...done.map(s=>parseFloat(s.load)||0)):0,reps:done.reduce((a,s)=>a+(parseFloat(s.reps)||0),0)};};
  return(
    <div style={{...st.card,border:`2px solid ${pain?DANGER:ACC}`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12,flexWrap:'wrap',gap:8}}>
        <div>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:22,letterSpacing:2,color:pain?DANGER:ACC}}>{log.template_name||'Treino'}</div>
          <div style={{fontSize:12,color:MUTED}}>📅 {log.date}{log.week?` · ${log.week}`:''}</div>
        </div>
        <div style={{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
          {log.rpe&&<span style={st.tag}>RPE {log.rpe}</span>}
          {pain&&<span style={st.tagD}>⚠️ Dor</span>}
          <button style={{...st.btnP,padding:'6px 14px',fontSize:12}} onClick={()=>onEdit(log)}>✏️ Editar</button>
          <button style={{...st.btnD,padding:'6px 12px'}} onClick={()=>onDelete(log.id)}>🗑 Excluir</button>
          <button style={st.btnG} onClick={onClose}>✕</button>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:12}}>
        {[['RPE',`${log.rpe||'—'}/10`],['Total Reps',totalReps(log)],['Energia',log.energy||'—']].map(([k,v])=>(
          <div key={k} style={{background:SURF2,borderRadius:7,padding:'8px',textAlign:'center'}}>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:19,color:ACC}}>{v}</div>
            <div style={{fontSize:9,color:MUTED,textTransform:'uppercase'}}>{k}</div>
          </div>
        ))}
      </div>
      {(log.exercises||[]).filter(e=>e.name).map((ex,i)=>{
        const{done,total,maxLoad,reps}=exSum(ex);
        return(
          <div key={i} style={{background:SURF2,borderRadius:8,padding:'10px 12px',marginBottom:7}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1}}>{ex.name}</div>
              <span style={{fontSize:11,color:done<total?WARN:ACC}}>{done}/{total} · {maxLoad?maxLoad+'kg':''} · {reps} reps</span>
            </div>
            <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
              {(ex.sets||[]).map((s,j)=>(
                <div key={j} style={{background:s.completed?'rgba(141,198,63,0.07)':'transparent',border:`1px solid ${s.completed?'rgba(141,198,63,0.2)':BDR}`,borderRadius:5,padding:'4px 9px',textAlign:'center',minWidth:52}}>
                  <div style={{fontSize:9,color:MUTED}}>S{j+1}</div>
                  <div style={{fontSize:12,fontWeight:700,color:s.completed?ACC:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{s.reps||'—'}×{parseFloat(s.load)>0?s.load+'kg':'PC'}</div>
                  {s.notes&&PAIN_WORDS.some(w=>s.notes.toLowerCase().includes(w))&&<div style={{fontSize:8,color:DANGER}}>⚠️</div>}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {log.highlights&&<div style={{marginTop:8,fontSize:13,color:ACC}}>✨ {log.highlights}</div>}
      {log.notes&&<div style={{marginTop:5,fontSize:12,color:'#999',fontStyle:'italic'}}>💬 {log.notes}</div>}
    </div>
  );
}

// ── LogForm ───────────────────────────────────────────────────────────────────
function LogForm({logData,setLogData,onSave,onCancel,loading}){
  const updSet=(ei,si,f,v)=>setLogData(p=>({...p,exercises:p.exercises.map((e,i)=>i===ei?{...e,sets:e.sets.map((s,j)=>j===si?{...s,[f]:v}:s)}:e)}));
  const addSet=ei=>setLogData(p=>({...p,exercises:p.exercises.map((e,i)=>i===ei?{...e,sets:[...e.sets,{...EMPTY_SET}]}:e)}));
  const remSet=(ei,si)=>setLogData(p=>({...p,exercises:p.exercises.map((e,i)=>i===ei?{...e,sets:e.sets.filter((_,j)=>j!==si)}:e)}));
  return(
    <div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
        <button style={st.btnG} onClick={onCancel}>← Voltar</button>
        <div>
          <h2 style={{fontFamily:"'Bebas Neue'",fontSize:26,letterSpacing:2,color:ACC,margin:0}}>{logData.templateName}</h2>
          <span style={{fontSize:12,color:MUTED}}>📅 {logData.date}</span>
        </div>
      </div>
      {logData.exercises.map((ex,ei)=>(
        <div key={ei} style={st.sect}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
            <div>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:17,marginBottom:5}}>{ex.name}</div>
              <div style={{fontSize:11,color:MUTED,background:SURF2,padding:'3px 9px',borderRadius:4,display:'inline-flex',gap:6}}>
                📋 <span style={{color:ACC,fontFamily:"'JetBrains Mono',monospace"}}>{ex.planned?.sets}x{ex.planned?.reps}{ex.planned?.load?' @ '+ex.planned.load:''}</span>
              </div>
              {ex.cues&&<div style={{fontSize:11,color:MUTED,marginTop:5}}>💡 {ex.cues}</div>}
            </div>
            <span style={{fontSize:11,color:MUTED}}>{ex.sets.filter(s=>s.completed).length}/{ex.sets.length}</span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',minWidth:340}}>
              <thead><tr>{['#','Reps','Carga','✓','Obs',''].map(h=><th key={h} style={st.th}>{h}</th>)}</tr></thead>
              <tbody>
                {ex.sets.map((set,si)=>(
                  <tr key={si} style={{opacity:set.completed?1:0.55}}>
                    <td style={{...st.td,color:MUTED,fontSize:12,fontWeight:700}}>{si+1}</td>
                    <td style={st.td}><input type="number" placeholder={ex.planned?.reps||'0'} min="0" style={{...st.inp,padding:'4px 7px',width:66,fontSize:13,textAlign:'center',borderColor:set.reps?ACC:undefined}} value={set.reps} onChange={e=>updSet(ei,si,'reps',e.target.value)}/></td>
                    <td style={st.td}><input type="number" placeholder="0" min="0" step="0.5" style={{...st.inp,padding:'4px 7px',width:74,fontSize:13,textAlign:'center',borderColor:set.load?ACC:undefined}} value={set.load} onChange={e=>updSet(ei,si,'load',e.target.value)}/></td>
                    <td style={{...st.td,textAlign:'center'}}><div onClick={()=>updSet(ei,si,'completed',!set.completed)} style={{width:22,height:22,borderRadius:4,cursor:'pointer',margin:'0 auto',border:`2px solid ${set.completed?ACC:'#444'}`,background:set.completed?ACC:'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:'#000'}}>{set.completed?'✓':''}</div></td>
                    <td style={st.td}><input placeholder="dor, obs..." style={{...st.inp,padding:'4px 7px',width:118,fontSize:12}} value={set.notes} onChange={e=>updSet(ei,si,'notes',e.target.value)}/></td>
                    <td style={st.td}>{ex.sets.length>1&&<button style={{background:'none',border:'none',color:DANGER,cursor:'pointer',fontSize:13}} onClick={()=>remSet(ei,si)}>✕</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button style={{...st.btnS,fontSize:12,padding:'4px 11px',marginTop:8}} onClick={()=>addSet(ei)}>+ Série extra</button>
        </div>
      ))}
      <div style={st.sect}>
        <span style={st.sectT}>AVALIAÇÃO</span>
        <div style={st.g2}>
          <F label={`RPE ${logData.rpe}/10`}><input type="range" min="1" max="10" value={logData.rpe} onChange={e=>setLogData(p=>({...p,rpe:Number(e.target.value)}))} style={{width:'100%',accentColor:ACC,marginTop:8}}/></F>
          <F label="Energia"><Sel value={logData.energy} onChange={e=>setLogData(p=>({...p,energy:e.target.value}))} opts={['baixa','média','alta']}/></F>
        </div>
        <F label="Destaques ✨"><Inp value={logData.highlights} onChange={e=>setLogData(p=>({...p,highlights:e.target.value}))} placeholder="Ex: bati PR..."/></F>
        <F label="Obs / Dores"><textarea style={{...st.inp,minHeight:60,resize:'vertical'}} value={logData.notes} onChange={e=>setLogData(p=>({...p,notes:e.target.value}))} placeholder="Dores, dificuldades..."/></F>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginBottom:24}}>
        <button style={st.btnS} onClick={onCancel}>Cancelar</button>
        <button style={st.btnP} onClick={onSave} disabled={loading}>{loading?'SALVANDO...':'💾 SALVAR TREINO'}</button>
      </div>
    </div>
  );
}

// ── TemplateForm ─────────────────────────────────────────────────────────────
function TemplateForm({tpl,onSave,onCancel}){
  const[form,setForm]=useState({...tpl,scheduled_date:tpl.scheduled_date||''});
  const addEx=()=>setForm(p=>({...p,exercises:[...p.exercises,{...EMPTY_EX}]}));
  const removeEx=i=>setForm(p=>({...p,exercises:p.exercises.filter((_,j)=>j!==i)}));
  const updEx=(i,f,v)=>setForm(p=>({...p,exercises:p.exercises.map((e,j)=>j===i?{...e,[f]:v}:e)}));
  const moveEx=(i,dir)=>{const exs=[...form.exercises];const to=i+dir;if(to<0||to>=exs.length)return;[exs[i],exs[to]]=[exs[to],exs[i]];setForm(p=>({...p,exercises:exs}));};
  return(
    <div>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
        <button style={st.btnG} onClick={onCancel}>← Voltar</button>
        <h2 style={{fontFamily:"'Bebas Neue'",fontSize:22,letterSpacing:3,color:ACC,margin:0}}>{form.id?'EDITAR TREINO':'NOVO TREINO'}</h2>
      </div>
      <div style={st.sect}>
        <span style={st.sectT}>IDENTIFICAÇÃO</span>
        <div style={st.g2}>
          <F label="Nome"><input style={st.inp} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Treino A — Segunda"/></F>
          <F label="Descrição"><input style={st.inp} value={form.description||''} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Semana 5 · Perna"/></F>
        </div>
        <F label="📅 Data agendada">
          <input type="date" style={st.inp} value={form.scheduled_date} onChange={e=>setForm(p=>({...p,scheduled_date:e.target.value}))}/>
        </F>
        {form.scheduled_date&&<div style={{fontSize:12,color:ACC,marginTop:-8,marginBottom:8}}>✅ Aparecerá no calendário em {form.scheduled_date}</div>}
      </div>
      <div style={st.sect}>
        <span style={st.sectT}>EXERCÍCIOS</span>
        {form.exercises.map((ex,i)=>(
          <div key={i} style={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:8,padding:'14px',marginBottom:10}}>
            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:10}}>
              <span style={{fontFamily:"'Bebas Neue'",fontSize:15,color:ACC,minWidth:22}}>{i+1}</span>
              <input placeholder="Nome do exercício" style={{...st.inp,flex:1,fontWeight:600}} value={ex.name} onChange={e=>updEx(i,'name',e.target.value)}/>
              <button style={{...st.btnG,padding:'3px 7px',fontSize:15}} onClick={()=>moveEx(i,-1)}>↑</button>
              <button style={{...st.btnG,padding:'3px 7px',fontSize:15}} onClick={()=>moveEx(i,1)}>↓</button>
              <button style={st.btnD} onClick={()=>removeEx(i)}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 2fr',gap:8}}>
              <F label="Séries"><input type="number" min="1" max="10" style={st.inp} value={ex.plannedSets} onChange={e=>updEx(i,'plannedSets',Number(e.target.value))}/></F>
              <F label="Reps"><input placeholder="8-10" style={st.inp} value={ex.plannedReps} onChange={e=>updEx(i,'plannedReps',e.target.value)}/></F>
              <F label="Carga"><input placeholder="60kg" style={st.inp} value={ex.plannedLoad} onChange={e=>updEx(i,'plannedLoad',e.target.value)}/></F>
              <F label="Dica"><input placeholder="Joelhos alinhados..." style={st.inp} value={ex.cues} onChange={e=>updEx(i,'cues',e.target.value)}/></F>
            </div>
          </div>
        ))}
        <button style={{...st.btnS,width:'100%',padding:'10px'}} onClick={addEx}>+ Adicionar Exercício</button>
      </div>
      <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginBottom:24}}>
        <button style={st.btnS} onClick={onCancel}>Cancelar</button>
        <button style={st.btnP} onClick={()=>onSave(form)}>💾 {form.id?'SALVAR':'PUBLICAR'}</button>
      </div>
    </div>
  );
}

// ── ProfileSetup ─────────────────────────────────────────────────────────────
function ProfileSetup({name,onSave,loading}){
  const[form,setForm]=useState({age:'',height:'',weight:'',body_fat:''});
  const upd=(f,v)=>setForm(p=>({...p,[f]:v}));
  return(
    <div style={{maxWidth:500,margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:24}}>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:3,color:ACC}}>CADASTRO DO ATLETA</div>
        <p style={{color:MUTED,fontSize:14}}>Olá, <strong style={{color:'#FFF'}}>{name}</strong>! Complete seu perfil.</p>
      </div>
      <div style={st.sect}>
        <span style={st.sectT}>DADOS PESSOAIS</span>
        <div style={st.g2}>
          <div style={st.fld}><label style={st.lbl}>Idade</label><input type="number" placeholder="28" style={st.inp} value={form.age} onChange={e=>upd('age',e.target.value)}/></div>
          <div style={st.fld}><label style={st.lbl}>Altura (cm)</label><input type="number" placeholder="175" style={st.inp} value={form.height} onChange={e=>upd('height',e.target.value)}/></div>
          <div style={st.fld}><label style={st.lbl}>Peso (kg)</label><input type="number" step="0.1" placeholder="75.5" style={st.inp} value={form.weight} onChange={e=>upd('weight',e.target.value)}/></div>
          <div style={st.fld}><label style={st.lbl}>% Gordura</label><input type="number" step="0.1" placeholder="18.5" style={st.inp} value={form.body_fat} onChange={e=>upd('body_fat',e.target.value)}/></div>
        </div>
      </div>
      <button style={{...st.btnP,width:'100%',padding:'13px',fontSize:15}} onClick={()=>onSave({age:form.age?parseInt(form.age):null,height:form.height?parseFloat(form.height):null,weight:form.weight?parseFloat(form.weight):null,body_fat:form.body_fat?parseFloat(form.body_fat):null})} disabled={loading}>
        {loading?'SALVANDO...':'ENTRAR NA MATILHA 🐺'}
      </button>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App(){
  const[view,setView]=useState('login');
  const[student,setStudent]=useState('');
  const[profile,setProfile]=useState(null);
  const[nameInput,setNameInput]=useState('');
  const[coachPass,setCoachPass]=useState('');
  const[loading,setLoading]=useState(false);
  const[logs,setLogs]=useState([]);
  const[weightLogs,setWeightLogs]=useState([]);
  const[templates,setTemplates]=useState([]);
  const[studentTab,setStudentTab]=useState(0);
  const[calSelDate,setCalSelDate]=useState(todayStr());
  const[calPanel,setCalPanel]=useState(null);
  const[logData,setLogData]=useState(null);
  const[newWeight,setNewWeight]=useState('');
  const[newBF,setNewBF]=useState('');
  const[selEx,setSelEx]=useState('');
  const[allStudents,setAllStudents]=useState([]);
  const[studData,setStudData]=useState({});
  const[studProfiles,setStudProfiles]=useState({});
  const[studWL,setStudWL]=useState({});
  const[coachTab,setCoachTab]=useState(0);
  const[expandedStudent,setExpandedStudent]=useState(null);
  const[editTpl,setEditTpl]=useState(null);
  const[showImport,setShowImport]=useState(false);
  const[importState,setImportState]=useState({loading:false,error:null,result:null});
  const[coachCalSel,setCoachCalSel]=useState(todayStr());
  const[coachStudentSel,setCoachStudentSel]=useState(null);

  useEffect(()=>{loadTemplates();},[]);
  useEffect(()=>{if(student){loadLogs(student);loadProfile(student);loadWeightLogs(student);}},[student]);

  const loadTemplates=async()=>{const d=await sb.get('templates','order=created_at.asc');setTemplates(d||[]);};
  const loadLogs=async(n,silent=false)=>{if(!silent)setLoading(true);const d=await sb.get('logs',`student_id=eq.${encodeURIComponent(n)}&order=date.desc`);setLogs(d||[]);if(!silent)setLoading(false);return d||[];};
  const loadProfile=async(n)=>{const d=await sb.get('students',`id=eq.${encodeURIComponent(n)}`);if(d?.[0])setProfile(d[0]);};
  const loadWeightLogs=async(n)=>{const d=await sb.get('weight_logs',`student_id=eq.${encodeURIComponent(n)}&order=date.asc`);setWeightLogs(d||[]);};
  const loadCoach=async()=>{
    setLoading(true);await loadTemplates();
    const students=await sb.get('students','order=name.asc')||[];
    const idx=students.map(s=>s.name);setAllStudents(idx);
    const allLogs=await sb.get('logs','order=date.desc')||[];
    const allW=await sb.get('weight_logs','order=date.asc')||[];
    const data={},profs={},wls={};
    students.forEach(s=>{data[s.name]=(allLogs).filter(l=>l.student_id===s.name);profs[s.name]=s;wls[s.name]=(allW).filter(l=>l.student_id===s.name);});
    setStudData(data);setStudProfiles(profs);setStudWL(wls);setLoading(false);
  };

  const login=async()=>{
    const name=nameInput.trim();if(!name)return;setLoading(true);
    await sb.upsert('students',{id:name,name});setStudent(name);
    const d=await sb.get('students',`id=eq.${encodeURIComponent(name)}`);
    const p=d?.[0];setProfile(p);setLoading(false);
    if(!p?.age||!p?.height){setView('profile-setup');}else{setView('calendar');}
  };
  const enterCoach=async()=>{if(coachPass==='pokai2026'){await loadCoach();setView('coach');}else alert('Senha incorreta.');};
  const saveProfile=async(data)=>{setLoading(true);await sb.upsert('students',{id:student,name:student,...data});await loadProfile(student);setView('calendar');setLoading(false);};
  const addWeightLog=async()=>{
    if(!newWeight)return;setLoading(true);
    await sb.upsert('weight_logs',{id:String(Date.now()),student_id:student,date:todayStr(),weight:parseFloat(newWeight),body_fat:newBF?parseFloat(newBF):null});
    await sb.upsert('students',{id:student,name:student,weight:parseFloat(newWeight),...(newBF?{body_fat:parseFloat(newBF)}:{})});
    await loadWeightLogs(student);await loadProfile(student);setNewWeight('');setNewBF('');setLoading(false);
  };

  const startLog=(tpl,dateKey)=>{
    setLogData({id:null,date:dateKey,week:'',templateId:tpl.id,templateName:tpl.name,
      exercises:tpl.exercises.map(ex=>({name:ex.name,cues:ex.cues,planned:{sets:ex.plannedSets,reps:ex.plannedReps,load:ex.plannedLoad},sets:Array.from({length:ex.plannedSets},()=>({...EMPTY_SET}))})),
      rpe:7,energy:'média',highlights:'',notes:''});
    setCalPanel(null);setView('newlog');
  };
  const editLog=(log)=>{
    setLogData({id:log.id,date:log.date,week:log.week||'',templateId:log.template_id,templateName:log.template_name,
      exercises:log.exercises||[],rpe:log.rpe||7,energy:log.energy||'média',highlights:log.highlights||'',notes:log.notes||''});
    setCalPanel(null);setView('newlog');
  };
  const deleteLog=async(id)=>{
    if(!confirm('Excluir este treino?'))return;
    await sb.del('logs',`id=eq.${id}`);setCalPanel(null);setCalSelDate(null);
    await loadLogs(student,true);
  };
  const saveLog=async()=>{
    if(!logData)return;setLoading(true);
    const id=logData.id||String(Date.now());
    await sb.upsert('logs',{id,student_id:student,date:logData.date,week:logData.week,template_id:logData.templateId,template_name:logData.templateName,exercises:logData.exercises,rpe:logData.rpe,energy:logData.energy,highlights:logData.highlights,notes:logData.notes});
    const updated=await loadLogs(student,true);
    const saved=updated.find(l=>l.id===id);
    if(saved){setCalSelDate(logData.date);setCalPanel('log');setLogData(saved);}
    setView('calendar');setLoading(false);
  };

  const handleStudentDay=(dateKey,_,action)=>{
    if(action==='new'||calSelDate===dateKey&&!calPanel){
      setCalSelDate(dateKey);
      const log=logMap[dateKey];const tpl=tplByDate[dateKey];
      if(log){setCalPanel('log');setLogData(log);}
      else if(tpl){setCalPanel('tpl');}
      else{setCalPanel('picker');}
    } else if(calSelDate===dateKey){
      setCalSelDate(null);setCalPanel(null);
    } else {
      setCalSelDate(dateKey);
      const log=logMap[dateKey];const tpl=tplByDate[dateKey];
      if(log){setCalPanel('log');setLogData(log);}
      else if(tpl){setCalPanel('tpl');}
      else{setCalPanel('picker');}
    }
  };

  const saveTpl=async(tpl)=>{const id=tpl.id||String(Date.now());await sb.upsert('templates',{...tpl,id});await loadTemplates();setEditTpl(null);};
  const deleteTpl=async(id)=>{if(!confirm('Remover?'))return;await sb.del('templates',`id=eq.${id}`);await loadTemplates();};
  const importFromPDF=async(file)=>{
    setImportState({loading:true,error:null,result:null});
    try{
      const pdfBase64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(',')[1]);r.onerror=rej;r.readAsDataURL(file);});
      const response=await fetch('/api/import-pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pdfBase64})});
      const data=await response.json();if(!response.ok)throw new Error(data.error);
      setImportState({loading:false,error:null,result:data.treinos});
    }catch(e){setImportState({loading:false,error:'Não foi possível extrair os treinos.',result:null});}
  };
  const confirmImport=async(treinos)=>{
    for(const t of treinos){await sb.upsert('templates',{...t,id:String(Date.now())+Math.random().toString(36).slice(2)});}
    await loadTemplates();setImportState({loading:false,error:null,result:null});setShowImport(false);
  };

  const logMap=useMemo(()=>{const m={};logs.forEach(l=>{if(l.date)m[l.date]=l;});return m;},[logs]);
  const tplByDate=useMemo(()=>{const m={};templates.forEach(t=>{if(t.scheduled_date)m[t.scheduled_date]=t;});return m;},[templates]);
  const exNames=useMemo(()=>{const n=new Set();logs.forEach(l=>l.exercises?.forEach(e=>e.name&&n.add(e.name)));return[...n];},[logs]);
  const progressData=useMemo(()=>{
    if(!selEx)return[];
    return[...logs].reverse().filter(l=>l.exercises?.some(e=>e.name===selEx)).map(l=>{
      const ex=l.exercises.find(e=>e.name===selEx);const done=ex.sets.filter(s=>s.completed);
      return{date:l.date.slice(5),maxLoad:done.length?Math.max(...done.map(s=>parseFloat(s.load)||0)):0,reps:done.reduce((a,s)=>a+(parseFloat(s.reps)||0),0)};
    });
  },[logs,selEx]);
  const stats=useMemo(()=>{
    const cutoff=new Date();cutoff.setDate(cutoff.getDate()-7);
    const freq={};logs.forEach(l=>l.exercises?.forEach(e=>{if(e.name)freq[e.name]=(freq[e.name]||0)+1;}));
    return{total:logs.length,lastWeek:logs.filter(l=>new Date(l.date)>=cutoff).length,favEx:Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—'};
  },[logs]);
  const exSum=ex=>{const done=ex.sets.filter(s=>s.completed);return{done:done.length,total:ex.sets.length,maxLoad:done.length?Math.max(...done.map(s=>parseFloat(s.load)||0)):0,reps:done.reduce((a,s)=>a+(parseFloat(s.reps)||0),0)};};
  const valencias=useMemo(()=>calcValencias(logs,profile),[logs,profile]);
  const radarData=Object.entries(valencias).map(([k,v])=>({attr:VL[k],value:v,fullMark:100}));
  const imc=profile?.weight&&profile?.height?((profile.weight)/((profile.height/100)**2)).toFixed(1):null;
  const weeklyRepsData=useMemo(()=>{const w={};logs.forEach(l=>{if(l.week)w[l.week]=(w[l.week]||0)+totalReps(l);});return Object.entries(w).slice(-6).map(([week,reps])=>({week,reps}));},[logs]);

  const STUDENT_TABS=[{icon:Home,label:'Dashboard'},{icon:Calendar,label:'Treinos'},{icon:BarChart2,label:'Progresso'},{icon:User,label:'Perfil'}];
  const COACH_TABS=[{icon:Calendar,label:'Calendário'},{icon:Users,label:'Alunos'},{icon:ClipboardList,label:'Treinos'},{icon:Settings,label:'Gestão'}];

  const coachSelDayTpl=coachCalSel?tplByDate[coachCalSel]||null:null;
  const coachSelDayLogs=useMemo(()=>{
    if(!coachCalSel)return[];
    return Object.entries(studData).flatMap(([name,ls])=>ls.filter(l=>l.date===coachCalSel).map(l=>({...l,studentName:name})));
  },[coachCalSel,studData]);

  // Coach logMap for calendar (all students combined)
  const coachLogMap=useMemo(()=>{
    const m={};
    Object.values(studData).forEach(ls=>ls.forEach(l=>{if(l.date)m[l.date]=l;}));
    return m;
  },[studData]);

  const currentCalTpl=calPanel==='tpl'&&calSelDate?tplByDate[calSelDate]:null;
  const currentCalLog=calPanel==='log'?logData:null;

  // ── RENDER ──
  const isLoggedIn=student&&!['login','profile-setup'].includes(view);
  const isCoach=view==='coach';

  return(
    <div style={st.app}>
      <style>{FONTS+`@keyframes spin{to{transform:rotate(360deg)}} .gcal-scroll::-webkit-scrollbar{display:none} *{box-sizing:border-box}`}</style>
      <BGPattern/>

      {/* TopNav */}
      {isLoggedIn&&!isCoach&&(
        <TopNav items={STUDENT_TABS} active={studentTab} setActive={i=>{setStudentTab(i);if(i===1)setView('calendar');else if(i===0)setView('dash');else if(i===2)setView('progress');else if(i===3)setView('perfil');}}
          rightSlot={<span style={{fontSize:11,color:MUTED}}>👤 {student.split(' ')[0]}</span>}/>
      )}
      {isCoach&&(
        <TopNav items={COACH_TABS} active={coachTab} setActive={setCoachTab}
          rightSlot={<button style={st.btnG} onClick={()=>setView('login')}>← Sair</button>}/>
      )}

      <div style={st.main}>

        {/* LOGIN */}
        {view==='login'&&(
          <div style={{maxWidth:400,margin:'44px auto 0',textAlign:'center'}}>
            <div style={{marginBottom:28}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:52,letterSpacing:6,color:TEXT,lineHeight:1}}>PŌKAI</div>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:8,color:ACC,marginBottom:6}}>MOVEMENT</div>
              <div style={{width:30,height:3,background:ACC,margin:'0 auto 14px'}}/>
              <p style={{color:MUTED,fontSize:13}}>Registre seus treinos. Acompanhe sua evolução.</p>
            </div>
            <div style={st.card}>
              <F label="Seu nome completo"><Inp value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="Ex: João Silva" sx={{fontSize:15}}/></F>
              <button style={{...st.btnP,width:'100%',padding:'12px',fontSize:15}} onClick={login} disabled={loading}>{loading?'ENTRANDO...':'ENTRAR NA MATILHA →'}</button>
            </div>
            <div style={{marginTop:20,borderTop:`1px solid ${BDR}`,paddingTop:18}}>
              <p style={{fontSize:12,color:MUTED,marginBottom:8}}>Acesso para professores</p>
              <div style={{display:'flex',gap:8}}>
                <input type="password" placeholder="Senha" value={coachPass} onChange={e=>setCoachPass(e.target.value)} style={{...st.inp,flex:1,padding:'8px 12px',fontSize:13}}/>
                <button style={st.btnS} onClick={enterCoach}>Acessar</button>
              </div>
            </div>
          </div>
        )}

        {view==='profile-setup'&&<ProfileSetup name={student} onSave={saveProfile} loading={loading}/>}

        {/* DASHBOARD */}
        {view==='dash'&&(loading?<Spin/>:
          <div>
            <h1 style={{fontFamily:"'Bebas Neue'",fontSize:30,letterSpacing:3,color:ACC,margin:'0 0 14px'}}>BEM-VINDO, {student.split(' ')[0].toUpperCase()} 🌿</h1>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:14}}>
              {[['🏋️','Total',stats.total],['🔥','Semana',stats.lastWeek],['⭐','Favorito',stats.favEx]].map(([ic,k,v])=>(
                <div key={k} style={st.card}>
                  <div style={{fontSize:18,marginBottom:2,textAlign:'center'}}>{ic}</div>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:ACC,lineHeight:1,textAlign:'center'}}>{v}</div>
                  <div style={{fontSize:9,color:MUTED,letterSpacing:1,textTransform:'uppercase',marginTop:2,textAlign:'center'}}>{k}</div>
                </div>
              ))}
            </div>
            <GlassCalendar logMap={logMap} tplMap={tplByDate} selDate={calSelDate} onDayClick={(key)=>{setCalSelDate(key);setStudentTab(1);setView('calendar');handleStudentDay(key);}}/>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:2,color:ACC,marginBottom:8}}>SESSÕES RECENTES</div>
            {logs.slice(0,3).map(l=>(
              <div key={l.id} style={{...st.card,cursor:'pointer'}} onClick={()=>{setCalSelDate(l.date);setCalPanel('log');setLogData(l);setStudentTab(1);setView('calendar');}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{display:'flex',gap:7,alignItems:'center',marginBottom:3,flexWrap:'wrap'}}>
                      <span style={{fontFamily:"'Bebas Neue'",fontSize:15}}>{l.template_name||'Treino'}</span>
                      <span style={{fontSize:11,color:MUTED}}>📅 {l.date}</span>
                      {hasPain(l)&&<span style={st.tagD}>⚠️</span>}
                    </div>
                    <div style={{fontSize:11,color:MUTED}}>{l.exercises?.filter(e=>e.name).slice(0,4).map(e=>e.name).join(' · ')}</div>
                  </div>
                  {l.rpe&&<span style={st.tag}>RPE {l.rpe}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CALENDAR — student */}
        {view==='calendar'&&(
          <div>
            <GlassCalendar logMap={logMap} tplMap={tplByDate} selDate={calSelDate} onDayClick={handleStudentDay}/>

            {calPanel==='tpl'&&currentCalTpl&&(
              <div style={{...st.card,border:`2px solid ${WARN}`,marginTop:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12,flexWrap:'wrap',gap:8}}>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2,color:WARN}}>TREINO DO DIA</div>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:26,letterSpacing:1,color:TEXT}}>{currentCalTpl.name}</div>
                    <div style={{fontSize:12,color:MUTED}}>📅 {calSelDate}</div>
                    {currentCalTpl.description&&<div style={{fontSize:12,color:MUTED,marginTop:3}}>{currentCalTpl.description}</div>}
                  </div>
                  <button style={st.btnG} onClick={()=>{setCalPanel(null);setCalSelDate(null);}}>✕</button>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:14}}>
                  {currentCalTpl.exercises?.map((ex,i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:13,padding:'5px 0',borderBottom:`1px solid ${BDR}`}}>
                      <span style={{color:'#CCC'}}>{ex.name}</span>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",color:MUTED}}>{ex.plannedSets}x{ex.plannedReps}{ex.plannedLoad?' @ '+ex.plannedLoad:''}</span>
                    </div>
                  ))}
                </div>
                <button style={{...st.btnP,width:'100%',padding:'12px',fontSize:14}} onClick={()=>startLog(currentCalTpl,calSelDate)}>
                  🏋️ INICIAR ESTE TREINO
                </button>
              </div>
            )}

            {calPanel==='picker'&&(
              <div style={{...st.card,border:`1px solid ${ACC}`,marginTop:0}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2,color:ACC}}>REGISTRAR TREINO</div>
                    <div style={{fontSize:12,color:MUTED}}>📅 {calSelDate}</div>
                  </div>
                  <button style={st.btnG} onClick={()=>{setCalPanel(null);setCalSelDate(null);}}>✕</button>
                </div>
                {templates.length===0&&<p style={{color:MUTED,fontSize:13}}>Nenhum treino disponível ainda.</p>}
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {templates.map(tpl=>(
                    <div key={tpl.id} onClick={()=>startLog(tpl,calSelDate)} style={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:9,padding:'12px 16px',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:1,color:ACC}}>{tpl.name}</div>
                        {tpl.description&&<div style={{fontSize:11,color:MUTED}}>{tpl.description}</div>}
                        <div style={{fontSize:11,color:MUTED,marginTop:2}}>{tpl.exercises?.length} exercícios{tpl.scheduled_date?` · 📅 ${tpl.scheduled_date}`:''}</div>
                      </div>
                      <span style={{color:ACC,fontSize:18}}>→</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {calPanel==='log'&&currentCalLog&&(
              <LogDetail log={currentCalLog} onEdit={editLog} onDelete={deleteLog} onClose={()=>{setCalPanel(null);setCalSelDate(null);}}/>
            )}
          </div>
        )}

        {view==='newlog'&&logData&&(
          <LogForm logData={logData} setLogData={setLogData} onSave={saveLog} onCancel={()=>setView('calendar')} loading={loading}/>
        )}

        {/* PROGRESS */}
        {view==='progress'&&(loading?<Spin/>:
          <div>
            <h1 style={{fontFamily:"'Bebas Neue'",fontSize:30,letterSpacing:3,color:ACC,marginBottom:16}}>EVOLUÇÃO</h1>
            {exNames.length===0?<div style={{...st.card,textAlign:'center',padding:'40px',border:`2px dashed ${BDR}`}}><p style={{color:MUTED}}>Registre treinos para ver evolução.</p></div>:(
              <>
                <div style={st.sect}>
                  <span style={st.sectT}>EXERCÍCIO</span>
                  <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{exNames.map(n=><button key={n} onClick={()=>setSelEx(n)} style={{padding:'6px 12px',border:`1px solid ${selEx===n?ACC:BDR}`,background:selEx===n?'rgba(141,198,63,0.08)':'transparent',color:selEx===n?ACC:MUTED,borderRadius:5,cursor:'pointer',fontSize:11,fontFamily:"'Outfit',sans-serif"}}>{n}</button>)}</div>
                </div>
                {selEx&&progressData.length>0&&<>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:12}}>
                    {[['Carga máx',progressData[progressData.length-1]?.maxLoad?progressData[progressData.length-1].maxLoad+' kg':'—'],['Melhor sessão',Math.max(...progressData.map(d=>d.reps))+' reps'],['Sessões',progressData.length]].map(([k,v])=>(
                      <div key={k} style={st.card}><div style={{fontFamily:"'Bebas Neue'",fontSize:21,color:ACC,textAlign:'center'}}>{v}</div><div style={{fontSize:9,color:MUTED,textTransform:'uppercase',marginTop:2,textAlign:'center'}}>{k}</div></div>
                    ))}
                  </div>
                  <div style={st.sect}>
                    <span style={st.sectT}>CARGA MÁXIMA</span>
                    <ResponsiveContainer width="100%" height={180}><LineChart data={progressData} margin={{top:5,right:10,left:0,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke={BDR}/><XAxis dataKey="date" tick={{fill:MUTED,fontSize:10}}/><YAxis tick={{fill:MUTED,fontSize:10}} unit="kg" width={44}/><Tooltip contentStyle={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:6,color:TEXT,fontSize:12}}/><Line type="monotone" dataKey="maxLoad" stroke={ACC} strokeWidth={2.5} dot={{fill:ACC,r:3}}/></LineChart></ResponsiveContainer>
                  </div>
                  <div style={st.sect}>
                    <span style={st.sectT}>TOTAL DE REPS</span>
                    <ResponsiveContainer width="100%" height={160}><LineChart data={progressData} margin={{top:5,right:10,left:0,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke={BDR}/><XAxis dataKey="date" tick={{fill:MUTED,fontSize:10}}/><YAxis tick={{fill:MUTED,fontSize:10}} width={36}/><Tooltip contentStyle={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:6,color:TEXT,fontSize:12}} formatter={v=>[v+' reps','']}/><Line type="monotone" dataKey="reps" stroke={WARN} strokeWidth={2} dot={{fill:WARN,r:3}}/></LineChart></ResponsiveContainer>
                  </div>
                </>}
              </>
            )}
          </div>
        )}

        {/* PERFIL */}
        {view==='perfil'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <h1 style={{fontFamily:"'Bebas Neue'",fontSize:30,letterSpacing:3,color:ACC,margin:0}}>MEU PERFIL</h1>
              <button style={st.btnS} onClick={()=>setView('profile-setup')}>✏️ Editar</button>
            </div>
            <div style={{background:`linear-gradient(135deg,#0a1a00,#1a3300,#0a1a00)`,border:`2px solid ${ACC}`,borderRadius:16,padding:'22px',marginBottom:16,overflow:'hidden',position:'relative'}}>
              <div style={{display:'flex',gap:18,flexWrap:'wrap',alignItems:'flex-start'}}>
                <div style={{flex:1,minWidth:180}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:9,letterSpacing:4,color:MUTED,marginBottom:2}}>PŌKAI MOVEMENT · ATLETA</div>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:30,letterSpacing:2,lineHeight:1,marginBottom:7}}>{student}</div>
                  <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>
                    {profile?.age&&<span style={st.tag}>{profile.age} anos</span>}
                    {imc&&<span style={{...st.tag,background:'rgba(255,255,255,0.06)',color:MUTED}}>IMC {imc}</span>}
                    <span style={{...st.tag,background:'rgba(141,198,63,0.06)',color:ACC}}>🏋️ {stats.total}</span>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:5}}>
                    {Object.entries(valencias).map(([k,v])=>(
                      <div key={k} style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{fontSize:9,color:MUTED,width:82,textTransform:'uppercase',letterSpacing:1}}>{VL[k]}</span>
                        <div style={{flex:1,height:5,background:'rgba(255,255,255,0.08)',borderRadius:3,overflow:'hidden'}}><div style={{width:`${v}%`,height:'100%',background:vc(v),borderRadius:3}}/></div>
                        <span style={{fontSize:12,fontWeight:700,color:vc(v),width:24,textAlign:'right',fontFamily:"'JetBrains Mono',monospace"}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {logs.length>0&&<div style={{width:190,height:190}}><ResponsiveContainer width="100%" height="100%"><RadarChart data={radarData}><PolarGrid stroke="rgba(141,198,63,0.15)"/><PolarAngleAxis dataKey="attr" tick={{fill:MUTED,fontSize:9,fontFamily:"'Outfit',sans-serif"}}/><Radar dataKey="value" stroke={ACC} fill={ACC} fillOpacity={0.18} strokeWidth={2}/></RadarChart></ResponsiveContainer></div>}
              </div>
            </div>
            <div style={st.sect}>
              <span style={st.sectT}>REGISTRAR MEDIDAS</span>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:10,alignItems:'flex-end'}}>
                <F label="Peso (kg)"><Inp value={newWeight} onChange={e=>setNewWeight(e.target.value)} type="number" placeholder="75.5"/></F>
                <F label="% Gordura"><Inp value={newBF} onChange={e=>setNewBF(e.target.value)} type="number" placeholder="18.5"/></F>
                <button style={{...st.btnP,marginBottom:14}} onClick={addWeightLog} disabled={loading}>OK</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8}}>
                {[['Peso',profile?.weight?profile.weight+' kg':'—'],['% Gordura',profile?.body_fat?profile.body_fat+'%':'—'],['Altura',profile?.height?profile.height+' cm':'—']].map(([k,v])=>(
                  <div key={k} style={{background:SURF2,borderRadius:7,padding:'9px',textAlign:'center'}}><div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:ACC}}>{v}</div><div style={{fontSize:9,color:MUTED,textTransform:'uppercase'}}>{k}</div></div>
                ))}
              </div>
            </div>
            {weightLogs.length>1&&<div style={st.sect}><span style={st.sectT}>EVOLUÇÃO DO PESO</span><ResponsiveContainer width="100%" height={160}><LineChart data={weightLogs} margin={{top:5,right:10,left:0,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke={BDR}/><XAxis dataKey="date" tick={{fill:MUTED,fontSize:9}} tickFormatter={d=>d.slice(5)}/><YAxis tick={{fill:MUTED,fontSize:10}} unit="kg" width={44} domain={['auto','auto']}/><Tooltip contentStyle={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:6,color:TEXT,fontSize:12}}/><Line type="monotone" dataKey="weight" stroke={ACC} strokeWidth={2.5} dot={{fill:ACC,r:3}}/></LineChart></ResponsiveContainer></div>}
          </div>
        )}

        {/* COACH */}
        {view==='coach'&&(
          <div>
            {loading&&<Spin/>}

            {/* CALENDÁRIO PROFESSOR */}
            {!loading&&coachTab===0&&(
              <div>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:14}}>
                  {[['Alunos',allStudents.length,ACC],['Alertas dor',Object.values(studData).reduce((a,ls)=>a+ls.filter(l=>hasPain(l)).length,0),DANGER],['Treinos hoje',Object.values(studData).reduce((a,ls)=>a+ls.filter(l=>l.date===todayStr()).length,0),WARN]].map(([k,v,c])=>(
                    <div key={k} style={{...st.card,textAlign:'center'}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:24,color:c}}>{v}</div>
                      <div style={{fontSize:9,color:MUTED,textTransform:'uppercase',marginTop:2}}>{k}</div>
                    </div>
                  ))}
                </div>

                <GlassCalendar logMap={coachLogMap} tplMap={tplByDate} selDate={coachCalSel} onDayClick={(key)=>setCoachCalSel(coachCalSel===key?null:key)} coachMode/>

                {coachCalSel&&(
                  <div style={{...st.card,border:`1px solid ${coachSelDayTpl?ACC:BDR}`,marginTop:0}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12,flexWrap:'wrap',gap:8}}>
                      <div>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2,color:coachSelDayTpl?ACC:MUTED}}>{coachSelDayTpl?coachSelDayTpl.name:'SEM TREINO AGENDADO'}</div>
                        <div style={{fontSize:12,color:MUTED}}>📅 {coachCalSel}</div>
                      </div>
                      <div style={{display:'flex',gap:7}}>
                        {coachSelDayTpl?(
                          <button style={{...st.btnS,padding:'5px 12px',fontSize:12}} onClick={()=>{setEditTpl({...coachSelDayTpl});setCoachTab(2);}}>✏️ Editar</button>
                        ):(
                          <button style={{...st.btnP,padding:'7px 14px',fontSize:12}} onClick={()=>{setEditTpl({id:null,name:'',description:'',scheduled_date:coachCalSel,exercises:[]});setCoachTab(2);}}>+ Criar</button>
                        )}
                        <button style={st.btnG} onClick={()=>setCoachCalSel(null)}>✕</button>
                      </div>
                    </div>
                    {coachSelDayTpl&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
                      <div style={{background:'rgba(141,198,63,0.06)',border:`1px solid rgba(141,198,63,0.2)`,borderRadius:8,padding:'12px'}}>
                        <div style={{fontSize:10,color:ACC,fontWeight:700,marginBottom:8}}>✅ REALIZARAM ({coachSelDayLogs.length})</div>
                        {coachSelDayLogs.length===0&&<p style={{color:MUTED,fontSize:12}}>Nenhum ainda</p>}
                        {coachSelDayLogs.map((l,i)=>(
                          <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:5,padding:'4px 0',borderBottom:`1px solid ${BDR}`,cursor:'pointer'}} onClick={()=>setCoachStudentSel(coachStudentSel===l.studentName?null:l.studentName)}>
                            <span>{l.studentName}</span>
                            <div style={{display:'flex',gap:5}}>{l.rpe&&<span style={st.tag}>RPE {l.rpe}</span>}{hasPain(l)&&<span style={st.tagD}>⚠️</span>}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{background:'rgba(102,102,96,0.08)',border:`1px solid ${BDR}`,borderRadius:8,padding:'12px'}}>
                        <div style={{fontSize:10,color:MUTED,fontWeight:700,marginBottom:8}}>⏳ PENDENTES ({allStudents.length-coachSelDayLogs.length})</div>
                        {allStudents.filter(n=>!coachSelDayLogs.some(l=>l.studentName===n)).map(n=>(
                          <div key={n} style={{fontSize:12,color:MUTED,marginBottom:4,padding:'3px 0',borderBottom:`1px solid ${BDR}`}}>{n}</div>
                        ))}
                      </div>
                    </div>}
                    {coachStudentSel&&(()=>{
                      const slog=coachSelDayLogs.find(l=>l.studentName===coachStudentSel);
                      if(!slog)return null;
                      return(
                        <div style={{background:SURF2,borderRadius:10,padding:'14px',marginTop:8}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:ACC}}>{coachStudentSel}</div>
                            <button style={st.btnG} onClick={()=>setCoachStudentSel(null)}>✕</button>
                          </div>
                          {(slog.exercises||[]).filter(e=>e.name).map((ex,i)=>{const{done,total,maxLoad,reps}=exSum(ex);return(
                            <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${BDR}`}}>
                              <span style={{color:'#CCC'}}>{ex.name}</span>
                              <span style={{color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{done}/{total} · {maxLoad?maxLoad+'kg':''} · {reps}reps</span>
                            </div>
                          );})}
                          {hasPain(slog)&&<div style={{marginTop:8,fontSize:12,color:DANGER}}>⚠️ Dor reportada</div>}
                          {slog.highlights&&<div style={{marginTop:6,fontSize:12,color:ACC}}>✨ {slog.highlights}</div>}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* ALUNOS */}
            {!loading&&coachTab===1&&(
              <div>
                {coachStudentSel&&(()=>{
                  const sLogs=studData[coachStudentSel]||[];const sProf=studProfiles[coachStudentSel]||{};
                  const val=calcValencias(sLogs,sProf);
                  const sLogMap={};sLogs.forEach(l=>{if(l.date)sLogMap[l.date]=l;});
                  const painLogs=sLogs.filter(l=>hasPain(l));
                  const prs={};sLogs.forEach(l=>l.exercises?.forEach(e=>{if(!e.name)return;const max=Math.max(...(e.sets||[]).filter(s=>s.completed&&s.load).map(s=>parseFloat(s.load)||0),0);if(!prs[e.name]||max>prs[e.name])prs[e.name]=max;}));
                  return(
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                        <button style={st.btnG} onClick={()=>setCoachStudentSel(null)}>← Todos</button>
                        <span style={{fontFamily:"'Bebas Neue'",fontSize:20,color:ACC}}>{coachStudentSel}</span>
                      </div>
                      <GlassCalendar logMap={sLogMap} tplMap={tplByDate} selDate={null} onDayClick={()=>{}}/>
                      <div style={st.sect}>
                        <span style={st.sectT}>VALÊNCIAS</span>
                        <div style={{display:'flex',gap:18,flexWrap:'wrap'}}>
                          <div style={{flex:1,minWidth:160,display:'flex',flexDirection:'column',gap:5}}>
                            {Object.entries(val).map(([k,v])=>(
                              <div key={k} style={{display:'flex',alignItems:'center',gap:8}}>
                                <span style={{fontSize:9,color:MUTED,width:82,textTransform:'uppercase'}}>{VL[k]}</span>
                                <div style={{flex:1,height:5,background:'rgba(255,255,255,0.07)',borderRadius:3,overflow:'hidden'}}><div style={{width:`${v}%`,height:'100%',background:vc(v),borderRadius:3}}/></div>
                                <span style={{fontSize:11,fontWeight:700,color:vc(v),width:22,textAlign:'right',fontFamily:"'JetBrains Mono',monospace"}}>{v}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{width:150,height:150}}><ResponsiveContainer width="100%" height="100%"><RadarChart data={Object.entries(val).map(([k,v])=>({attr:VL[k].slice(0,4),value:v}))}><PolarGrid stroke="rgba(255,255,255,0.06)"/><PolarAngleAxis dataKey="attr" tick={{fill:MUTED,fontSize:8}}/><Radar dataKey="value" stroke={ACC} fill={ACC} fillOpacity={0.15} strokeWidth={1.5}/></RadarChart></ResponsiveContainer></div>
                        </div>
                      </div>
                      {painLogs.length>0&&<div style={{background:'rgba(224,80,80,0.06)',border:`1px solid rgba(224,80,80,0.2)`,borderRadius:8,padding:'12px 14px',marginBottom:12}}>
                        <div style={{fontSize:10,color:DANGER,fontWeight:700,marginBottom:8}}>⚠️ HISTÓRICO DE DORES</div>
                        {painLogs.slice(0,3).map((l,i)=>(
                          <div key={i} style={{marginBottom:6,paddingBottom:6,borderBottom:i<2?`1px solid rgba(224,80,80,0.15)`:'none'}}>
                            <div style={{fontSize:10,color:MUTED}}>{l.template_name} · {l.date}</div>
                            {l.exercises?.map((ex,ei)=>ex.sets?.filter(s=>s.notes&&PAIN_WORDS.some(w=>s.notes.toLowerCase().includes(w))).map((s,si)=><div key={`${ei}-${si}`} style={{fontSize:11,color:'#CCC'}}><span style={{color:MUTED}}>{ex.name}:</span> {s.notes}</div>))}
                          </div>
                        ))}
                      </div>}
                      {Object.entries(prs).filter(([,v])=>v>0).length>0&&<div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{Object.entries(prs).filter(([,v])=>v>0).map(([k,v])=><div key={k} style={{background:'rgba(141,198,63,0.06)',border:'1px solid rgba(141,198,63,0.22)',borderRadius:6,padding:'5px 10px'}}><div style={{fontSize:10,color:MUTED}}>{k}</div><div style={{fontFamily:"'Bebas Neue'",fontSize:17,color:ACC}}>{v} kg</div></div>)}</div>}
                    </div>
                  );
                })()}

                {!coachStudentSel&&<>
                  {allStudents.map((name,si)=>{
                    const sLogs=studData[name]||[];const sProf=studProfiles[name]||{};
                    const cutoff=new Date();cutoff.setDate(cutoff.getDate()-7);
                    const lastWeek=sLogs.filter(l=>new Date(l.date)>=cutoff).length;
                    const recentPain=sLogs.slice(0,5).some(l=>hasPain(l));
                    const colors=[ACC,'#5BC8F5','#FF6B9D','#FFB347','#A78BFA'];
                    const color=colors[si%colors.length];
                    return(
                      <div key={name} style={{...st.card,border:`1px solid ${recentPain?'rgba(224,80,80,0.4)':BDR}`,cursor:'pointer'}} onClick={()=>setCoachStudentSel(name)}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:7}}>
                          <div>
                            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3,flexWrap:'wrap'}}>
                              <span style={{fontFamily:"'Bebas Neue'",fontSize:18,color}}>{name}</span>
                              {lastWeek===0&&sLogs.length>0&&<span style={st.tagD}>INATIVO</span>}
                              {lastWeek>0&&<span style={st.tag}>ATIVO</span>}
                              {recentPain&&<span style={st.tagD}>⚠️ DOR</span>}
                            </div>
                            <div style={{fontSize:11,color:MUTED,display:'flex',gap:10,flexWrap:'wrap'}}>
                              <span>🏋️ {sLogs.length}</span>{sProf.weight&&<span>⚖️ {sProf.weight}kg</span>}{sLogs[0]&&<span>📅 {sLogs[0].date}</span>}
                            </div>
                          </div>
                          <span style={{color:ACC,fontSize:16}}>→</span>
                        </div>
                      </div>
                    );
                  })}
                  {allStudents.length===0&&<div style={{...st.card,textAlign:'center',padding:'40px',border:`2px dashed ${BDR}`}}><p style={{color:MUTED}}>Nenhum aluno ainda.</p></div>}
                </>}
              </div>
            )}

            {/* TREINOS */}
            {!loading&&coachTab===2&&!editTpl&&(
              <div>
                <div style={{display:'flex',gap:8,marginBottom:14,flexWrap:'wrap'}}>
                  <button style={st.btnP} onClick={()=>setEditTpl({id:null,name:'',description:'',scheduled_date:'',exercises:[]})}>+ NOVO TREINO</button>
                  <button style={st.btnS} onClick={()=>{setShowImport(true);setImportState({loading:false,error:null,result:null});}}>📄 IMPORTAR PDF</button>
                  <button style={{...st.btnS,marginLeft:'auto',padding:'5px 12px',fontSize:11}} onClick={loadCoach}>↻ Atualizar</button>
                </div>

                {showImport&&(
                  <div style={{...st.card,border:`1px solid ${ACC}`,marginBottom:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                      <span style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,color:ACC}}>IMPORTAR VIA PDF</span>
                      <button style={st.btnG} onClick={()=>setShowImport(false)}>✕</button>
                    </div>
                    {!importState.loading&&!importState.result&&<label style={{display:'flex',flexDirection:'column',alignItems:'center',border:`2px dashed ${BDR}`,borderRadius:9,padding:'28px',cursor:'pointer',background:SURF2}}><span style={{fontSize:24,marginBottom:8}}>📄</span><span style={{color:ACC,fontWeight:700,marginBottom:2}}>Selecionar PDF</span><span style={{fontSize:11,color:MUTED}}>A IA extrai exercícios e datas automaticamente</span><input type="file" accept=".pdf" style={{display:'none'}} onChange={e=>e.target.files[0]&&importFromPDF(e.target.files[0])}/></label>}
                    {importState.loading&&<div style={{textAlign:'center',padding:'28px'}}><div style={{width:34,height:34,border:`3px solid ${BDR}`,borderTop:`3px solid ${ACC}`,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 10px'}}/><p style={{color:MUTED}}>Analisando PDF...</p></div>}
                    {importState.error&&<div style={{background:'#1A0000',border:`1px solid #330000`,borderRadius:7,padding:'12px',color:DANGER,fontSize:13}}>⚠️ {importState.error}<br/><button style={{...st.btnS,marginTop:8,fontSize:12}} onClick={()=>setImportState({loading:false,error:null,result:null})}>Tentar novamente</button></div>}
                    {importState.result&&<div>
                      <div style={{fontSize:13,color:ACC,marginBottom:10,fontWeight:700}}>✅ {importState.result.length} treino{importState.result.length!==1?'s':''} encontrado{importState.result.length!==1?'s':''}:</div>
                      {importState.result.map((t,i)=>(
                        <div key={i} style={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:8,padding:'12px',marginBottom:7}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:15,color:ACC}}>{t.name}</div>
                            {t.scheduled_date&&<span style={st.tag}>📅 {t.scheduled_date}</span>}
                          </div>
                          {t.exercises.map((ex,j)=><div key={j} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'2px 0',borderBottom:`1px solid ${BDR}`}}><span style={{color:'#CCC'}}>{ex.name}</span><span style={{fontFamily:"'JetBrains Mono',monospace",color:MUTED}}>{ex.plannedSets}x{ex.plannedReps}</span></div>)}
                        </div>
                      ))}
                      <div style={{display:'flex',gap:8,marginTop:10}}>
                        <button style={st.btnS} onClick={()=>setImportState({loading:false,error:null,result:null})}>↩</button>
                        <button style={st.btnP} onClick={()=>confirmImport(importState.result)}>💾 SALVAR TODOS</button>
                      </div>
                    </div>}
                  </div>
                )}

                {[...templates].filter(t=>t.scheduled_date).sort((a,b)=>a.scheduled_date.localeCompare(b.scheduled_date)).length>0&&(
                  <div style={{marginBottom:12}}>
                    <div style={{fontSize:10,color:ACC,letterSpacing:1.5,marginBottom:8,textTransform:'uppercase'}}>Com data agendada</div>
                    {[...templates].filter(t=>t.scheduled_date).sort((a,b)=>a.scheduled_date.localeCompare(b.scheduled_date)).map(tpl=>(
                      <div key={tpl.id} style={{...st.card,display:'flex',alignItems:'flex-start',gap:12}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:3,flexWrap:'wrap'}}>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:ACC}}>{tpl.name}</div>
                            <span style={st.tag}>📅 {tpl.scheduled_date}</span>
                          </div>
                          {tpl.description&&<div style={{fontSize:11,color:MUTED}}>{tpl.description}</div>}
                        </div>
                        <div style={{display:'flex',gap:5}}>
                          <button style={{...st.btnS,padding:'4px 10px',fontSize:11}} onClick={()=>setEditTpl(tpl)}>✏️</button>
                          <button style={st.btnD} onClick={()=>deleteTpl(tpl.id)}>🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {templates.filter(t=>!t.scheduled_date).length>0&&(
                  <div>
                    <div style={{fontSize:10,color:MUTED,letterSpacing:1.5,marginBottom:8,textTransform:'uppercase'}}>Sem data agendada</div>
                    {templates.filter(t=>!t.scheduled_date).map(tpl=>(
                      <div key={tpl.id} style={{...st.card,display:'flex',alignItems:'flex-start',gap:12}}>
                        <div style={{flex:1}}>
                          <div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:MUTED,marginBottom:3}}>{tpl.name}</div>
                          {tpl.description&&<div style={{fontSize:11,color:MUTED}}>{tpl.description}</div>}
                        </div>
                        <div style={{display:'flex',gap:5}}>
                          <button style={{...st.btnS,padding:'4px 10px',fontSize:11}} onClick={()=>setEditTpl(tpl)}>✏️</button>
                          <button style={st.btnD} onClick={()=>deleteTpl(tpl.id)}>🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {templates.length===0&&<div style={{...st.card,textAlign:'center',padding:'40px',border:`2px dashed ${BDR}`}}><p style={{color:MUTED}}>Nenhum treino cadastrado ainda.</p></div>}
              </div>
            )}
            {!loading&&coachTab===2&&editTpl&&<TemplateForm tpl={editTpl} onSave={saveTpl} onCancel={()=>setEditTpl(null)}/>}
            {coachTab===3&&<ProfessorDashboard allStudents={allStudents} studProfiles={studProfiles}/>}
          </div>
        )}
      </div>
    </div>
  );
}
