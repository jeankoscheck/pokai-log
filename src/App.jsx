import { useState, useEffect, useMemo } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

const FONTS=`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400&display=swap');`;
const BG='#060606',SURF='#0F0F0F',SURF2='#181818',BDR='#272727',ACC='#8DC63F',TEXT='#F2F2F0',MUTED='#666660',WARN='#E8A020',DANGER='#E05050';
const SB_URL='https://xvyvqmvcjwvedfkdygco.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2eXZxbXZjand2ZWRma2R5Z2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNjI1MDQsImV4cCI6MjA5MjYzODUwNH0.WYunV6-RzcxuVGjrp5jMLo5Lsyi1OHxYVRXC7ktvJfY';
const HDR={'apikey':SB_KEY,'Authorization':`Bearer ${SB_KEY}`,'Content-Type':'application/json'};

const sb={
  async get(t,q=''){try{const r=await fetch(`${SB_URL}/rest/v1/${t}?${q}`,{headers:HDR});if(!r.ok)throw new Error(await r.text());return r.json();}catch(e){console.error(e);return null;}},
  async upsert(t,d){try{const r=await fetch(`${SB_URL}/rest/v1/${t}`,{method:'POST',headers:{...HDR,'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify(d)});if(!r.ok)throw new Error(await r.text());return r.json();}catch(e){console.error(e);return null;}},
  async del(t,q){try{const r=await fetch(`${SB_URL}/rest/v1/${t}?${q}`,{method:'DELETE',headers:HDR});return r.ok;}catch(e){console.error(e);return false;}},
};

const PAIN_WORDS=['dor','dói','doendo','machucou','machucar','lesão','ardendo','inflamado','travado','travei','torci','torção','queimou','incômodo','desconforto'];
const hasPain=l=>[l.notes||'',...(l.exercises||[]).flatMap(e=>(e.sets||[]).map(s=>s.notes||''))].join(' ').toLowerCase().split(/\s+/).some(w=>PAIN_WORDS.some(p=>w.includes(p)));
const totalReps=l=>(l.exercises||[]).reduce((a,e)=>a+(e.sets||[]).filter(s=>s.completed).reduce((b,s)=>b+(parseFloat(s.reps)||0),0),0);
const todayStr=()=>new Date().toISOString().slice(0,10);

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
const MONTHS=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

const st={
  app:{fontFamily:"'Outfit',sans-serif",background:BG,color:TEXT,minHeight:'100vh'},
  nav:{display:'flex',alignItems:'center',padding:'0 16px',height:52,borderBottom:`1px solid ${BDR}`,background:BG,position:'sticky',top:0,zIndex:100,gap:5,flexWrap:'wrap'},
  logo:{fontFamily:"'Bebas Neue'",fontSize:19,letterSpacing:3,color:ACC,marginRight:'auto'},
  main:{maxWidth:900,margin:'0 auto',padding:'20px 14px'},
  btnP:{padding:'9px 20px',background:ACC,color:'#000',border:'none',borderRadius:5,cursor:'pointer',fontSize:13,fontFamily:"'Outfit',sans-serif",fontWeight:700},
  btnS:{padding:'8px 16px',background:SURF2,color:TEXT,border:`1px solid ${BDR}`,borderRadius:5,cursor:'pointer',fontSize:13,fontFamily:"'Outfit',sans-serif"},
  btnG:{padding:'6px 12px',background:'none',color:MUTED,border:'none',cursor:'pointer',fontSize:13,fontFamily:"'Outfit',sans-serif"},
  btnD:{padding:'5px 10px',background:'#1A0000',color:DANGER,border:`1px solid #330000`,borderRadius:4,cursor:'pointer',fontSize:11},
  card:{background:SURF,border:`1px solid ${BDR}`,borderRadius:10,padding:'16px 20px',marginBottom:12},
  sect:{background:SURF,border:`1px solid ${BDR}`,borderRadius:10,padding:'18px 20px',marginBottom:14},
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

const F=({label,children})=><div style={st.fld}><label style={st.lbl}>{label}</label>{children}</div>;
const Inp=({value,onChange,type='text',placeholder='',sx={}})=><input type={type} placeholder={placeholder} style={{...st.inp,...sx}} value={value} onChange={onChange}/>;
const Sel=({value,onChange,opts})=><select style={st.inp} value={value} onChange={onChange}>{opts.map(o=><option key={o}>{o}</option>)}</select>;
const NavTab=({active,onClick,children})=>(
  <button onClick={onClick} style={{padding:'6px 11px',border:`1px solid ${active?ACC:BDR}`,background:active?'rgba(141,198,63,0.08)':'transparent',color:active?ACC:MUTED,borderRadius:5,cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:"'Outfit',sans-serif"}}>{children}</button>
);
const Spin=()=>(
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'60px 0',flexDirection:'column',gap:12}}>
    <div style={{width:32,height:32,border:`3px solid ${BDR}`,borderTop:`3px solid ${ACC}`,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

// ── CALENDAR COMPONENT ───────────────────────────────────────────────────────
function Cal({year,month,onDayClick,selDate,getDayInfo}){
  const fd=new Date(year,month,1).getDay();
  const dim=new Date(year,month+1,0).getDate();
  const tod=todayStr();
  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3,marginBottom:4}}>
        {['D','S','T','Q','Q','S','S'].map((d,i)=><div key={i} style={{textAlign:'center',fontSize:9,color:MUTED,fontWeight:700,padding:'2px 0'}}>{d}</div>)}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:3}}>
        {Array(fd).fill(null).map((_,i)=><div key={`b${i}`}/>)}
        {Array.from({length:dim},(_,i)=>i+1).map(d=>{
          const key=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const {hasLog,hasTpl,painFlag,label,color}=getDayInfo(key);
          const isTod=key===tod;const isSel=key===selDate;
          const hasDot=hasLog||hasTpl;
          return(
            <div key={d} onClick={()=>onDayClick(key)}
              style={{background:isSel?'rgba(141,198,63,0.15)':hasLog?'rgba(141,198,63,0.07)':hasTpl?'rgba(232,160,32,0.06)':'rgba(255,255,255,0.02)',
                border:`1px solid ${isSel?ACC:isTod?`${ACC}99`:hasLog?(painFlag?'rgba(224,80,80,0.5)':'rgba(141,198,63,0.35)'):hasTpl?'rgba(232,160,32,0.35)':BDR}`,
                borderRadius:6,padding:'5px 3px',textAlign:'center',cursor:'pointer',minHeight:44,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:2}}>
              <span style={{fontSize:11,fontWeight:isTod||isSel?700:400,color:isSel?ACC:isTod?ACC:hasDot?TEXT:MUTED}}>{d}</span>
              {label&&<div style={{fontSize:8,color:color||ACC,fontWeight:600,lineHeight:1,maxWidth:28,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</div>}
              {hasDot&&<div style={{width:5,height:5,background:painFlag?DANGER:(hasLog?ACC:WARN),borderRadius:'50%'}}/>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalNav({year,month,setYear,setMonth,title}){
  const prev=()=>{if(month===0){setYear(y=>y-1);setMonth(11);}else setMonth(m=>m-1);};
  const next=()=>{if(month===11){setYear(y=>y+1);setMonth(0);}else setMonth(m=>m+1);};
  return(
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
      <button style={st.btnG} onClick={prev}>←</button>
      <span style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2,color:ACC}}>{title||`${MONTHS[month]} ${year}`}</span>
      <button style={st.btnG} onClick={next}>→</button>
    </div>
  );
}

// ── LOG DETAIL ───────────────────────────────────────────────────────────────
function LogDetail({log,onEdit,onDelete,onClose}){
  const pain=hasPain(log);
  return(
    <div style={{background:SURF,border:`2px solid ${pain?DANGER:ACC}`,borderRadius:12,padding:'18px',marginTop:12}}>
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
      {(log.exercises||[]).filter(e=>e.name).map((ex,i)=>(
        <div key={i} style={{background:SURF2,borderRadius:8,padding:'10px 12px',marginBottom:7}}>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1,marginBottom:6}}>{ex.name}</div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            {(ex.sets||[]).map((s,j)=>(
              <div key={j} style={{background:s.completed?'rgba(141,198,63,0.07)':'transparent',border:`1px solid ${s.completed?'rgba(141,198,63,0.2)':BDR}`,borderRadius:5,padding:'4px 9px',textAlign:'center',minWidth:52}}>
                <div style={{fontSize:9,color:MUTED}}>S{j+1}</div>
                <div style={{fontSize:12,fontWeight:700,color:s.completed?ACC:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{s.reps||'—'}×{parseFloat(s.load)>0?s.load+'kg':'PC'}</div>
                {s.notes&&PAIN_WORDS.some(w=>s.notes.toLowerCase().includes(w))&&<div style={{fontSize:8,color:DANGER}}>⚠️</div>}
              </div>
            ))}
          </div>
          {ex.sets?.filter(s=>s.notes&&PAIN_WORDS.some(w=>s.notes.toLowerCase().includes(w))).map((s,j)=>(
            <div key={j} style={{marginTop:5,fontSize:11,color:DANGER}}>⚠️ S{ex.sets.indexOf(s)+1}: {s.notes}</div>
          ))}
        </div>
      ))}
      {log.highlights&&<div style={{marginTop:8,fontSize:13,color:ACC}}>✨ {log.highlights}</div>}
      {log.notes&&<div style={{marginTop:5,fontSize:12,color:'#999',fontStyle:'italic'}}>💬 {log.notes}</div>}
    </div>
  );
}

// ── LOG FORM ─────────────────────────────────────────────────────────────────
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

// ── TEMPLATE FORM ────────────────────────────────────────────────────────────
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
          <F label="Descrição"><input style={st.inp} value={form.description||''} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Ex: Semana 5 · Perna"/></F>
        </div>
        <F label="📅 Data agendada — aparece no calendário dos alunos">
          <input type="date" style={st.inp} value={form.scheduled_date} onChange={e=>setForm(p=>({...p,scheduled_date:e.target.value}))}/>
        </F>
        {form.scheduled_date&&<div style={{fontSize:12,color:ACC,marginTop:-8,marginBottom:10}}>✅ Aparecerá no calendário em {form.scheduled_date}</div>}
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

// ── MAIN ─────────────────────────────────────────────────────────────────────
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
  // calendar (student)
  const[calY,setCalY]=useState(()=>new Date().getFullYear());
  const[calM,setCalM]=useState(()=>new Date().getMonth());
  const[calSelDate,setCalSelDate]=useState(null);
  const[calPanel,setCalPanel]=useState(null); // 'log'|'picker'|'tpl'
  const[logData,setLogData]=useState(null);
  // perfil
  const[newWeight,setNewWeight]=useState('');
  const[newBF,setNewBF]=useState('');
  const[selEx,setSelEx]=useState('');
  // coach
  const[allStudents,setAllStudents]=useState([]);
  const[studData,setStudData]=useState({});
  const[studProfiles,setStudProfiles]=useState({});
  const[studWL,setStudWL]=useState({});
  const[coachTab,setCoachTab]=useState('calendario');
  const[expandedStudent,setExpandedStudent]=useState(null);
  const[editTpl,setEditTpl]=useState(null);
  const[showImport,setShowImport]=useState(false);
  const[importState,setImportState]=useState({loading:false,error:null,result:null});
  const[coachCalY,setCoachCalY]=useState(()=>new Date().getFullYear());
  const[coachCalM,setCoachCalM]=useState(()=>new Date().getMonth());
  const[coachCalSel,setCoachCalSel]=useState(null);
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

  const saveProfile=async(data)=>{setLoading(true);await sb.upsert('students',{id:student,name:student,...data});await loadProfile(student);setView('calendar');setLoading(false);};
  const addWeightLog=async()=>{
    if(!newWeight)return;setLoading(true);
    await sb.upsert('weight_logs',{id:String(Date.now()),student_id:student,date:todayStr(),weight:parseFloat(newWeight),body_fat:newBF?parseFloat(newBF):null});
    await sb.upsert('students',{id:student,name:student,weight:parseFloat(newWeight),...(newBF?{body_fat:parseFloat(newBF)}:{})});
    await loadWeightLogs(student);await loadProfile(student);setNewWeight('');setNewBF('');setLoading(false);
  };

  // ── Log ops ──
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
    await sb.del('logs',`id=eq.${id}`);
    setCalPanel(null);setCalSelDate(null);
    await loadLogs(student,true);
  };

  const saveLog=async()=>{
    if(!logData)return;setLoading(true);
    const id=logData.id||String(Date.now());
    await sb.upsert('logs',{id,student_id:student,date:logData.date,week:logData.week,template_id:logData.templateId,template_name:logData.templateName,exercises:logData.exercises,rpe:logData.rpe,energy:logData.energy,highlights:logData.highlights,notes:logData.notes});
    const updated=await loadLogs(student,true);
    setView('calendar');
    // re-open the detail
    const saved=updated.find(l=>l.id===id);
    if(saved){setCalSelDate(logData.date);setCalPanel('log');setLogData(saved);}
    setLoading(false);
  };

  // ── Student calendar day click ──
  const handleStudentDay=(dateKey)=>{
    if(calSelDate===dateKey){setCalSelDate(null);setCalPanel(null);return;}
    setCalSelDate(dateKey);
    const log=logMap[dateKey];
    const tpl=tplByDate[dateKey];
    if(log){setCalPanel('log');setLogData(log);}
    else if(tpl){setCalPanel('tpl');}
    else{setCalPanel('picker');}
  };

  // ── Coach ops ──
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

  // ── Derived ──
  const logMap=useMemo(()=>{const m={};logs.forEach(l=>{if(l.date)m[l.date]=l;});return m;},[logs]);
  const tplByDate=useMemo(()=>{const m={};templates.forEach(t=>{if(t.scheduled_date)m[t.scheduled_date]=t;});return m;},[templates]);

  const studentDayInfo=useMemo(()=>(key)=>{
    const log=logMap[key];const tpl=tplByDate[key];
    if(log)return{hasLog:true,hasTpl:false,painFlag:hasPain(log),label:log.template_name?.split(' ')[0]||'✓',color:hasPain(log)?DANGER:ACC};
    if(tpl)return{hasLog:false,hasTpl:true,painFlag:false,label:tpl.name?.split(' ')[0]||'📋',color:WARN};
    return{hasLog:false,hasTpl:false,painFlag:false,label:null,color:null};
  },[logMap,tplByDate]);

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

  // Coach calendar
  const coachDayInfo=useMemo(()=>(key)=>{
    const tpl=tplByDate[key];
    const studentsWhoLogged=Object.values(studData).filter(ls=>ls.some(l=>l.date===key)).length;
    if(tpl)return{hasLog:studentsWhoLogged>0,hasTpl:true,painFlag:false,label:tpl.name?.split(' ')[0]||'📋',color:studentsWhoLogged>0?ACC:WARN};
    if(studentsWhoLogged>0)return{hasLog:true,hasTpl:false,painFlag:false,label:`${studentsWhoLogged}`,color:ACC};
    return{hasLog:false,hasTpl:false,painFlag:false,label:null,color:null};
  },[tplByDate,studData]);

  const coachSelDayTpl=coachCalSel?tplByDate[coachCalSel]||null:null;
  const coachSelDayLogs=useMemo(()=>{
    if(!coachCalSel)return[];
    return Object.entries(studData).flatMap(([name,ls])=>ls.filter(l=>l.date===coachCalSel).map(l=>({...l,studentName:name})));
  },[coachCalSel,studData]);

  const enterCoach=async()=>{if(coachPass==='pokai2026'){await loadCoach();setView('coach');}else alert('Senha incorreta.');};

  const currentCalLog=calPanel==='log'?logData:null;
  const currentCalTpl=calPanel==='tpl'&&calSelDate?tplByDate[calSelDate]:null;

  return(
    <div style={st.app}>
      <style>{FONTS}</style>
      <nav style={st.nav}>
        <span style={st.logo}>PŌKAI <span style={{color:TEXT,fontWeight:300,fontSize:13,letterSpacing:4}}>MOVEMENT</span></span>
        {student&&<>
          <NavTab active={view==='dash'} onClick={()=>setView('dash')}>Dashboard</NavTab>
          <NavTab active={['calendar','newlog'].includes(view)} onClick={()=>{setView('calendar');}}>📅 Treinos</NavTab>
          <NavTab active={view==='history'} onClick={()=>setView('history')}>Histórico</NavTab>
          <NavTab active={view==='progress'} onClick={()=>setView('progress')}>Progresso</NavTab>
          <NavTab active={view==='perfil'} onClick={()=>setView('perfil')}>Perfil</NavTab>
          <span style={{fontSize:11,color:MUTED,marginLeft:'auto',borderLeft:`1px solid ${BDR}`,paddingLeft:10}}>👤 {student.split(' ')[0]}</span>
        </>}
      </nav>

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

        {/* PROFILE SETUP */}
        {view==='profile-setup'&&<ProfileSetup name={student} onSave={saveProfile} loading={loading} styles={{st,ACC,MUTED}}/>}

        {/* DASHBOARD */}
        {view==='dash'&&(loading?<Spin/>:
          <div>
            <h1 style={{fontFamily:"'Bebas Neue'",fontSize:32,letterSpacing:3,color:ACC,margin:'0 0 16px'}}>BEM-VINDO, {student.split(' ')[0].toUpperCase()} 🌿</h1>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
              {[['🏋️','Total',stats.total],['🔥','Essa semana',stats.lastWeek],['⭐','Favorito',stats.favEx]].map(([ic,k,v])=>(
                <div key={k} style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:10,padding:'12px',textAlign:'center'}}>
                  <div style={{fontSize:18,marginBottom:2}}>{ic}</div>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:ACC,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:9,color:MUTED,letterSpacing:1,textTransform:'uppercase',marginTop:2}}>{k}</div>
                </div>
              ))}
            </div>
            <button style={{...st.btnP,width:'100%',padding:'12px',fontSize:14,marginBottom:18}} onClick={()=>{setCalSelDate(todayStr());handleStudentDay(todayStr());setView('calendar');}}>
              + REGISTRAR TREINO DE HOJE
            </button>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:2,color:ACC,marginBottom:8}}>SESSÕES RECENTES</div>
            {logs.length===0&&<div style={{...st.card,textAlign:'center',padding:'28px',border:`2px dashed ${BDR}`}}><p style={{color:MUTED}}>Clique em 📅 Treinos para começar!</p></div>}
            {logs.slice(0,3).map(l=>(
              <div key={l.id} style={{...st.card,cursor:'pointer'}} onClick={()=>{setCalSelDate(l.date);setCalPanel('log');setLogData(l);setView('calendar');}}>
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
            <h1 style={{fontFamily:"'Bebas Neue'",fontSize:30,letterSpacing:3,color:ACC,marginBottom:14}}>MEUS TREINOS</h1>
            {/* Legend */}
            <div style={{display:'flex',gap:14,fontSize:11,color:MUTED,marginBottom:12,flexWrap:'wrap'}}>
              <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:7,height:7,background:ACC,borderRadius:'50%',display:'inline-block'}}/> Treino realizado</span>
              <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:7,height:7,background:WARN,borderRadius:'50%',display:'inline-block'}}/> Treino agendado</span>
              <span style={{display:'flex',alignItems:'center',gap:4}}><span style={{width:7,height:7,background:DANGER,borderRadius:'50%',display:'inline-block'}}/> Dor reportada</span>
            </div>
            <div style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:12,padding:'16px',marginBottom:12}}>
              <CalNav year={calY} month={calM} setYear={setCalY} setMonth={setCalM}/>
              <Cal year={calY} month={calM} onDayClick={handleStudentDay} selDate={calSelDate} getDayInfo={studentDayInfo}/>
            </div>

            {/* Panel: treino agendado (não realizado) */}
            {calPanel==='tpl'&&currentCalTpl&&(
              <div style={{background:SURF,border:`2px solid ${WARN}`,borderRadius:12,padding:'18px',marginBottom:12}}>
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
                <button style={{...st.btnP,width:'100%',padding:'12px',fontSize:15}} onClick={()=>startLog(currentCalTpl,calSelDate)}>
                  🏋️ INICIAR ESTE TREINO
                </button>
              </div>
            )}

            {/* Panel: picker (dia sem treino agendado) */}
            {calPanel==='picker'&&(
              <div style={{background:SURF,border:`1px solid ${ACC}`,borderRadius:12,padding:'18px',marginBottom:12}}>
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

            {/* Panel: log detail */}
            {calPanel==='log'&&currentCalLog&&(
              <LogDetail
                log={currentCalLog}
                onEdit={editLog}
                onDelete={deleteLog}
                onClose={()=>{setCalPanel(null);setCalSelDate(null);}}
              />
            )}
          </div>
        )}

        {/* NEW LOG */}
        {view==='newlog'&&logData&&(
          <LogForm logData={logData} setLogData={setLogData} onSave={saveLog} onCancel={()=>setView('calendar')} loading={loading}/>
        )}

        {/* HISTORY */}
        {view==='history'&&(loading?<Spin/>:
          <div>
            <h1 style={{fontFamily:"'Bebas Neue'",fontSize:30,letterSpacing:3,color:ACC,marginBottom:18}}>HISTÓRICO</h1>
            {logs.length===0&&<div style={{...st.card,textAlign:'center',padding:'40px',border:`2px dashed ${BDR}`}}><p style={{color:MUTED}}>Nenhum treino ainda.</p></div>}
            {logs.map(l=>(
              <div key={l.id} style={st.card}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:10,paddingBottom:10,borderBottom:`1px solid ${BDR}`,flexWrap:'wrap',gap:7}}>
                  <div>
                    <div style={{display:'flex',gap:7,alignItems:'center',flexWrap:'wrap'}}>
                      <span style={{fontFamily:"'Bebas Neue'",fontSize:17}}>{l.template_name||'Treino'}</span>
                      {l.week&&<span style={{...st.tag,background:'rgba(255,255,255,0.05)',color:MUTED,fontSize:10}}>{l.week}</span>}
                      <span style={{fontSize:11,color:MUTED}}>📅 {l.date}</span>
                      {hasPain(l)&&<span style={st.tagD}>⚠️ Dor</span>}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                    {l.rpe&&<span style={st.tag}>RPE {l.rpe}</span>}
                    <span style={st.tag}>{totalReps(l)} reps</span>
                    <button style={{...st.btnS,padding:'4px 10px',fontSize:11}} onClick={()=>editLog(l)}>✏️ Editar</button>
                    <button style={st.btnD} onClick={()=>deleteLog(l.id)}>🗑</button>
                  </div>
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:360}}>
                    <thead><tr>{['Exercício','Planejado','Séries','Carga','Reps'].map(h=><th key={h} style={st.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {l.exercises?.filter(e=>e.name).map((ex,i)=>{const{done,total,maxLoad,reps}=exSum(ex);return(
                        <tr key={i}><td style={{...st.td,fontWeight:600}}>{ex.name}</td><td style={{...st.td,fontSize:11,color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{ex.planned?.sets}x{ex.planned?.reps}</td><td style={{...st.td,color:done<total?WARN:ACC}}>{done}/{total}</td><td style={{...st.td,color:ACC,fontFamily:"'JetBrains Mono',monospace"}}>{maxLoad?maxLoad+' kg':'—'}</td><td style={{...st.td,fontFamily:"'JetBrains Mono',monospace"}}>{reps||'—'}</td></tr>
                      );})}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PROGRESS */}
        {view==='progress'&&(loading?<Spin/>:
          <div>
            <h1 style={{fontFamily:"'Bebas Neue'",fontSize:30,letterSpacing:3,color:ACC,marginBottom:18}}>EVOLUÇÃO</h1>
            {exNames.length===0?<div style={{...st.card,textAlign:'center',padding:'40px',border:`2px dashed ${BDR}`}}><p style={{color:MUTED}}>Registre treinos para ver evolução.</p></div>:(
              <>
                <div style={st.sect}>
                  <span style={st.sectT}>EXERCÍCIO</span>
                  <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{exNames.map(n=><NavTab key={n} active={selEx===n} onClick={()=>setSelEx(n)}>{n}</NavTab>)}</div>
                </div>
                {selEx&&progressData.length>0&&<>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:12}}>
                    {[['Carga máx',progressData[progressData.length-1]?.maxLoad?progressData[progressData.length-1].maxLoad+' kg':'—'],['Melhor sessão',Math.max(...progressData.map(d=>d.reps))+' reps'],['Sessões',progressData.length]].map(([k,v])=>(
                      <div key={k} style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:8,padding:'10px',textAlign:'center'}}><div style={{fontFamily:"'Bebas Neue'",fontSize:21,color:ACC}}>{v}</div><div style={{fontSize:9,color:MUTED,textTransform:'uppercase',marginTop:2}}>{k}</div></div>
                    ))}
                  </div>
                  <div style={st.sect}>
                    <span style={st.sectT}>CARGA MÁXIMA</span>
                    <ResponsiveContainer width="100%" height={180}><LineChart data={progressData} margin={{top:5,right:10,left:0,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke={BDR}/><XAxis dataKey="date" tick={{fill:MUTED,fontSize:10}}/><YAxis tick={{fill:MUTED,fontSize:10}} unit="kg" width={44}/><Tooltip contentStyle={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:6,color:TEXT,fontSize:12}}/><Line type="monotone" dataKey="maxLoad" stroke={ACC} strokeWidth={2.5} dot={{fill:ACC,r:3}} activeDot={{r:5}}/></LineChart></ResponsiveContainer>
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
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
              <h1 style={{fontFamily:"'Bebas Neue'",fontSize:30,letterSpacing:3,color:ACC,margin:0}}>MEU PERFIL</h1>
              <button style={st.btnS} onClick={()=>setView('profile-setup')}>✏️ Editar</button>
            </div>
            {/* FIFA Card */}
            <div style={{background:`linear-gradient(135deg,#0a1a00,#1a3300,#0a1a00)`,border:`2px solid ${ACC}`,borderRadius:16,padding:'22px',marginBottom:16,overflow:'hidden',position:'relative'}}>
              <div style={{position:'absolute',top:0,right:0,width:160,height:160,background:'rgba(141,198,63,0.04)',borderRadius:'50%',transform:'translate(40px,-40px)'}}/>
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
            {logs.length>0&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
              <div style={{background:SURF,border:`1px solid rgba(141,198,63,0.3)`,borderRadius:10,padding:'14px'}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:2,color:ACC,marginBottom:8}}>💪 FORTES</div>
                {Object.entries(valencias).filter(([,v])=>v>=70).sort((a,b)=>b[1]-a[1]).map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}><span style={{color:'#CCC'}}>{VL[k]}</span><span style={{color:ACC,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{v}</span></div>)}
                {!Object.entries(valencias).some(([,v])=>v>=70)&&<p style={{color:MUTED,fontSize:11}}>Continue treinando!</p>}
              </div>
              <div style={{background:SURF,border:`1px solid rgba(224,80,80,0.25)`,borderRadius:10,padding:'14px'}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:2,color:DANGER,marginBottom:8}}>📈 A MELHORAR</div>
                {Object.entries(valencias).filter(([,v])=>v<70).sort((a,b)=>a[1]-b[1]).map(([k,v])=><div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}><span style={{color:'#CCC'}}>{VL[k]}</span><span style={{color:v<50?DANGER:WARN,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{v}</span></div>)}
                {!Object.entries(valencias).some(([,v])=>v<70)&&<p style={{color:MUTED,fontSize:11}}>Excelente perfil!</p>}
              </div>
            </div>}
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
            {weightLogs.length>1&&<div style={st.sect}>
              <span style={st.sectT}>EVOLUÇÃO DO PESO</span>
              <ResponsiveContainer width="100%" height={160}><LineChart data={weightLogs} margin={{top:5,right:10,left:0,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke={BDR}/><XAxis dataKey="date" tick={{fill:MUTED,fontSize:9}} tickFormatter={d=>d.slice(5)}/><YAxis tick={{fill:MUTED,fontSize:10}} unit="kg" width:={44} domain={['auto','auto']}/><Tooltip contentStyle={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:6,color:TEXT,fontSize:12}}/><Line type="monotone" dataKey="weight" stroke={ACC} strokeWidth={2.5} dot={{fill:ACC,r:3}}/></LineChart></ResponsiveContainer>
            </div>}
            {weeklyRepsData.length>1&&<div style={st.sect}>
              <span style={st.sectT}>REPS POR SEMANA</span>
              <ResponsiveContainer width="100%" height={140}><BarChart data={weeklyRepsData} margin={{top:5,right:10,left:0,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke={BDR}/><XAxis dataKey="week" tick={{fill:MUTED,fontSize:9}}/><YAxis tick={{fill:MUTED,fontSize:10}}/><Tooltip contentStyle={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:6,color:TEXT,fontSize:12}} formatter={v=>[v+' reps','']}/><Bar dataKey="reps" fill={ACC} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
            </div>}
          </div>
        )}

        {/* ── COACH ── */}
        {view==='coach'&&(
          <div>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}>
              <h1 style={{fontFamily:"'Bebas Neue'",fontSize:24,letterSpacing:3,color:ACC,margin:0}}>PŌKAI — PROFESSOR</h1>
              <button style={{...st.btnS,marginLeft:'auto',padding:'5px 12px',fontSize:11}} onClick={loadCoach}>↻</button>
              <button style={st.btnG} onClick={()=>setView('login')}>← Sair</button>
            </div>
            <div style={{display:'flex',gap:7,marginBottom:18,flexWrap:'wrap'}}>
              <NavTab active={coachTab==='calendario'} onClick={()=>setCoachTab('calendario')}>📅 Calendário</NavTab>
              <NavTab active={coachTab==='alunos'} onClick={()=>setCoachTab('alunos')}>👥 Alunos ({allStudents.length})</NavTab>
              <NavTab active={coachTab==='templates'} onClick={()=>setCoachTab('templates')}>📋 Treinos ({templates.length})</NavTab>
            </div>

            {loading&&<Spin/>}

            {/* ── CALENDÁRIO PROFESSOR ── */}
            {!loading&&coachTab==='calendario'&&(
              <div>
                {/* Resumo rápido */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
                  {[
                    ['Alunos',allStudents.length,ACC],
                    ['Alertas dor',Object.values(studData).reduce((a,ls)=>a+ls.filter(l=>hasPain(l)).length,0),DANGER],
                    ['Treinos hoje',Object.values(studData).reduce((a,ls)=>a+ls.filter(l=>l.date===todayStr()).length,0),WARN],
                  ].map(([k,v,c])=>(
                    <div key={k} style={{background:SURF,border:`1px solid ${c===DANGER&&v>0?c:BDR}`,borderRadius:8,padding:'10px',textAlign:'center'}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:24,color:c===DANGER&&v>0?c:c}}>{v}</div>
                      <div style={{fontSize:9,color:MUTED,textTransform:'uppercase',marginTop:2}}>{k}</div>
                    </div>
                  ))}
                </div>

                <div style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:12,padding:'16px',marginBottom:12}}>
                  <CalNav year={coachCalY} month={coachCalM} setYear={setCoachCalY} setMonth={setCoachCalM}/>
                  <Cal year={coachCalY} month={coachCalM}
                    onDayClick={(key)=>setCoachCalSel(coachCalSel===key?null:key)}
                    selDate={coachCalSel}
                    getDayInfo={coachDayInfo}/>
                  <div style={{display:'flex',gap:12,fontSize:10,color:MUTED,marginTop:10,justifyContent:'center'}}>
                    <span style={{display:'flex',alignItems:'center',gap:3}}><span style={{width:6,height:6,background:ACC,borderRadius:'50%',display:'inline-block'}}/> Treino realizado</span>
                    <span style={{display:'flex',alignItems:'center',gap:3}}><span style={{width:6,height:6,background:WARN,borderRadius:'50%',display:'inline-block'}}/> Treino agendado</span>
                  </div>
                </div>

                {/* Painel do dia selecionado */}
                {coachCalSel&&(
                  <div style={{background:SURF,border:`1px solid ${coachSelDayTpl?ACC:BDR}`,borderRadius:12,padding:'18px',marginBottom:12}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14,flexWrap:'wrap',gap:8}}>
                      <div>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:2,color:coachSelDayTpl?ACC:MUTED}}>
                          {coachSelDayTpl?coachSelDayTpl.name:'SEM TREINO AGENDADO'}
                        </div>
                        <div style={{fontSize:12,color:MUTED}}>📅 {coachCalSel}</div>
                        {coachSelDayTpl?.description&&<div style={{fontSize:12,color:MUTED}}>{coachSelDayTpl.description}</div>}
                      </div>
                      <div style={{display:'flex',gap:7}}>
                        {coachSelDayTpl?(
                          <button style={{...st.btnS,padding:'5px 12px',fontSize:12}} onClick={()=>{setEditTpl({...coachSelDayTpl});setCoachTab('templates');}}>✏️ Editar treino</button>
                        ):(
                          <button style={{...st.btnP,padding:'7px 14px',fontSize:12}} onClick={()=>{setEditTpl({id:null,name:'',description:'',scheduled_date:coachCalSel,exercises:[]});setCoachTab('templates');}}>+ Criar treino aqui</button>
                        )}
                        <button style={st.btnG} onClick={()=>setCoachCalSel(null)}>✕</button>
                      </div>
                    </div>

                    {/* Alunos que fizeram vs não fizeram */}
                    {coachSelDayTpl&&(
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
                        <div style={{background:'rgba(141,198,63,0.06)',border:`1px solid rgba(141,198,63,0.25)`,borderRadius:8,padding:'12px'}}>
                          <div style={{fontSize:10,color:ACC,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>✅ Realizaram ({coachSelDayLogs.length})</div>
                          {coachSelDayLogs.length===0&&<p style={{color:MUTED,fontSize:12}}>Nenhum ainda</p>}
                          {coachSelDayLogs.map((l,i)=>(
                            <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:5,padding:'4px 0',borderBottom:`1px solid ${BDR}`,cursor:'pointer'}} onClick={()=>setCoachStudentSel(coachStudentSel===l.studentName?null:l.studentName)}>
                              <span style={{color:TEXT}}>{l.studentName}</span>
                              <div style={{display:'flex',gap:5}}>
                                {l.rpe&&<span style={st.tag}>RPE {l.rpe}</span>}
                                {hasPain(l)&&<span style={st.tagD}>⚠️</span>}
                                <span style={{color:MUTED,fontSize:11}}>{totalReps(l)} reps</span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div style={{background:'rgba(102,102,96,0.08)',border:`1px solid ${BDR}`,borderRadius:8,padding:'12px'}}>
                          <div style={{fontSize:10,color:MUTED,fontWeight:700,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>⏳ Pendentes ({allStudents.length-coachSelDayLogs.length})</div>
                          {allStudents.filter(n=>!coachSelDayLogs.some(l=>l.studentName===n)).map(n=>(
                            <div key={n} style={{fontSize:12,color:MUTED,marginBottom:4,padding:'3px 0',borderBottom:`1px solid ${BDR}`}}>{n}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Detalhe do log do aluno selecionado */}
                    {coachStudentSel&&(()=>{
                      const slog=coachSelDayLogs.find(l=>l.studentName===coachStudentSel);
                      if(!slog)return null;
                      return(
                        <div style={{background:SURF2,borderRadius:10,padding:'14px',marginTop:8}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:16,color:ACC}}>{coachStudentSel}</div>
                            <button style={st.btnG} onClick={()=>setCoachStudentSel(null)}>✕</button>
                          </div>
                          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:10}}>
                            {[['RPE',`${slog.rpe||'—'}/10`],['Reps',totalReps(slog)],['Energia',slog.energy||'—']].map(([k,v])=>(
                              <div key={k} style={{background:BG,borderRadius:6,padding:'7px',textAlign:'center'}}><div style={{fontFamily:"'Bebas Neue'",fontSize:17,color:ACC}}>{v}</div><div style={{fontSize:9,color:MUTED,textTransform:'uppercase'}}>{k}</div></div>
                            ))}
                          </div>
                          {(slog.exercises||[]).filter(e=>e.name).map((ex,i)=>{const{done,total,maxLoad,reps}=exSum(ex);return(
                            <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'5px 0',borderBottom:`1px solid ${BDR}`}}>
                              <span style={{color:'#CCC'}}>{ex.name}</span>
                              <span style={{color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{done}/{total} séries · {maxLoad?maxLoad+'kg':''} · {reps} reps</span>
                            </div>
                          );})}
                          {hasPain(slog)&&<div style={{marginTop:8,fontSize:12,color:DANGER}}>⚠️ {(slog.exercises||[]).flatMap(ex=>(ex.sets||[]).filter(s=>s.notes&&PAIN_WORDS.some(w=>s.notes.toLowerCase().includes(w))).map(s=>`${ex.name}: ${s.notes}`)).join(' | ')}</div>}
                          {slog.highlights&&<div style={{marginTop:6,fontSize:12,color:ACC}}>✨ {slog.highlights}</div>}
                          {slog.notes&&<div style={{marginTop:4,fontSize:12,color:'#888',fontStyle:'italic'}}>💬 {slog.notes}</div>}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* ── ALUNOS ── */}
            {!loading&&coachTab==='alunos'&&(
              <div>
                {/* Botão para ver aluno específico */}
                {coachStudentSel&&(()=>{
                  const sLogs=studData[coachStudentSel]||[];
                  const sProf=studProfiles[coachStudentSel]||{};
                  const sWL=studWL[coachStudentSel]||[];
                  const val=calcValencias(sLogs,sProf);
                  const sLogMap={};sLogs.forEach(l=>{if(l.date)sLogMap[l.date]=l;});
                  const sLogDayInfo=(key)=>{const log=sLogMap[key];return log?{hasLog:true,hasTpl:false,painFlag:hasPain(log),label:log.template_name?.split(' ')[0]||'✓',color:hasPain(log)?DANGER:ACC}:{hasLog:false,hasTpl:false,painFlag:false,label:null,color:null};};
                  const imc3=sProf.weight&&sProf.height?(sProf.weight/((sProf.height/100)**2)).toFixed(1):null;
                  const painLogs=sLogs.filter(l=>hasPain(l));
                  const prs={};sLogs.forEach(l=>l.exercises?.forEach(e=>{if(!e.name)return;const max=Math.max(...(e.sets||[]).filter(s=>s.completed&&s.load).map(s=>parseFloat(s.load)||0),0);if(!prs[e.name]||max>prs[e.name])prs[e.name]=max;}));
                  return(
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
                        <button style={st.btnG} onClick={()=>setCoachStudentSel(null)}>← Todos os alunos</button>
                        <span style={{fontFamily:"'Bebas Neue'",fontSize:20,color:ACC}}>{coachStudentSel}</span>
                        {sProf.age&&<span style={st.tag}>{sProf.age} anos</span>}
                        {imc3&&<span style={{...st.tag,background:'rgba(255,255,255,0.06)',color:MUTED}}>IMC {imc3}</span>}
                      </div>
                      {/* Stats do aluno */}
                      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:14}}>
                        {[['Treinos',sLogs.length],['Peso',sProf.weight?sProf.weight+' kg':'—'],['% Gord.',sProf.body_fat?sProf.body_fat+'%':'—'],['Alertas dor',painLogs.length]].map(([k,v])=>(
                          <div key={k} style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:8,padding:'10px',textAlign:'center'}}><div style={{fontFamily:"'Bebas Neue'",fontSize:19,color:ACC}}>{v}</div><div style={{fontSize:9,color:MUTED,textTransform:'uppercase',marginTop:2}}>{k}</div></div>
                        ))}
                      </div>
                      {/* Calendário do aluno */}
                      <div style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:12,padding:'14px',marginBottom:12}}>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:2,color:ACC,marginBottom:10}}>CALENDÁRIO DE TREINOS</div>
                        <CalNav year={coachCalY} month={coachCalM} setYear={setCoachCalY} setMonth={setCoachCalM}/>
                        <Cal year={coachCalY} month={coachCalM} onDayClick={()=>{}} selDate={null} getDayInfo={sLogDayInfo}/>
                      </div>
                      {/* Valências */}
                      <div style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:10,padding:'14px',marginBottom:12}}>
                        <div style={{fontFamily:"'Bebas Neue'",fontSize:13,letterSpacing:2,color:ACC,marginBottom:10}}>VALÊNCIAS</div>
                        <div style={{display:'flex',gap:18,flexWrap:'wrap',alignItems:'flex-start'}}>
                          <div style={{flex:1,minWidth:160,display:'flex',flexDirection:'column',gap:5}}>
                            {Object.entries(val).map(([k,v])=>(
                              <div key={k} style={{display:'flex',alignItems:'center',gap:8}}>
                                <span style={{fontSize:9,color:MUTED,width:82,textTransform:'uppercase'}}>{VL[k]}</span>
                                <div style={{flex:1,height:5,background:'rgba(255,255,255,0.07)',borderRadius:3,overflow:'hidden'}}><div style={{width:`${v}%`,height:'100%',background:vc(v),borderRadius:3}}/></div>
                                <span style={{fontSize:11,fontWeight:700,color:vc(v),width:22,textAlign:'right',fontFamily:"'JetBrains Mono',monospace"}}>{v}</span>
                              </div>
                            ))}
                          </div>
                          <div style={{width:160,height:160}}><ResponsiveContainer width="100%" height="100%"><RadarChart data={Object.entries(val).map(([k,v])=>({attr:VL[k].slice(0,4),value:v}))}><PolarGrid stroke="rgba(255,255,255,0.06)"/><PolarAngleAxis dataKey="attr" tick={{fill:MUTED,fontSize:8}}/><Radar dataKey="value" stroke={ACC} fill={ACC} fillOpacity={0.15} strokeWidth={1.5}/></RadarChart></ResponsiveContainer></div>
                        </div>
                      </div>
                      {/* Dores */}
                      {painLogs.length>0&&<div style={{background:'rgba(224,80,80,0.06)',border:`1px solid rgba(224,80,80,0.2)`,borderRadius:8,padding:'12px 14px',marginBottom:12}}>
                        <div style={{fontSize:10,color:DANGER,fontWeight:700,marginBottom:8}}>⚠️ HISTÓRICO DE DORES</div>
                        {painLogs.slice(0,5).map((l,i)=>(
                          <div key={i} style={{marginBottom:7,paddingBottom:7,borderBottom:i<Math.min(painLogs.length,5)-1?`1px solid rgba(224,80,80,0.15)`:'none'}}>
                            <div style={{fontSize:10,color:MUTED,marginBottom:3}}>{l.template_name} · {l.date}</div>
                            {l.exercises?.map((ex,ei)=>ex.sets?.filter(s=>s.notes&&PAIN_WORDS.some(w=>s.notes.toLowerCase().includes(w))).map((s,si)=><div key={`${ei}-${si}`} style={{fontSize:11,color:'#CCC'}}><span style={{color:MUTED}}>{ex.name}:</span> {s.notes}</div>))}
                          </div>
                        ))}
                      </div>}
                      {/* PRs */}
                      {Object.entries(prs).filter(([,v])=>v>0).length>0&&<div style={{marginBottom:12}}>
                        <div style={{fontSize:10,color:MUTED,letterSpacing:1.5,marginBottom:8,textTransform:'uppercase'}}>Recordes Pessoais</div>
                        <div style={{display:'flex',gap:7,flexWrap:'wrap'}}>{Object.entries(prs).filter(([,v])=>v>0).map(([k,v])=><div key={k} style={{background:'rgba(141,198,63,0.06)',border:'1px solid rgba(141,198,63,0.22)',borderRadius:6,padding:'5px 10px'}}><div style={{fontSize:10,color:MUTED}}>{k}</div><div style={{fontFamily:"'Bebas Neue'",fontSize:17,color:ACC}}>{v} kg</div></div>)}</div>
                      </div>}
                    </div>
                  );
                })()}

                {/* Lista de alunos */}
                {!coachStudentSel&&<>
                  {allStudents.length===0&&<div style={{...st.card,textAlign:'center',padding:'40px',border:`2px dashed ${BDR}`}}><p style={{color:MUTED}}>Nenhum aluno ainda.</p></div>}
                  {allStudents.map((name,si)=>{
                    const sLogs=studData[name]||[];const sProf=studProfiles[name]||{};
                    const cutoff=new Date();cutoff.setDate(cutoff.getDate()-7);
                    const lastWeek=sLogs.filter(l=>new Date(l.date)>=cutoff).length;
                    const recentPain=sLogs.slice(0,5).some(l=>hasPain(l));
                    const inactive=sLogs.length>0&&lastWeek===0;
                    const colors=[ACC,'#5BC8F5','#FF6B9D','#FFB347','#A78BFA','#34D399'];
                    const color=colors[si%colors.length];
                    const imc2=sProf.weight&&sProf.height?(sProf.weight/((sProf.height/100)**2)).toFixed(1):null;
                    return(
                      <div key={name} style={{...st.card,border:`1px solid ${recentPain?'rgba(224,80,80,0.4)':BDR}`,cursor:'pointer'}} onClick={()=>setCoachStudentSel(name)}>
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:7}}>
                          <div>
                            <div style={{display:'flex',alignItems:'center',gap:7,marginBottom:3,flexWrap:'wrap'}}>
                              <span style={{fontFamily:"'Bebas Neue'",fontSize:18,color:color}}>{name}</span>
                              {inactive&&<span style={st.tagD}>INATIVO</span>}
                              {lastWeek>0&&<span style={st.tag}>ATIVO</span>}
                              {recentPain&&<span style={st.tagD}>⚠️ DOR</span>}
                            </div>
                            <div style={{fontSize:11,color:MUTED,display:'flex',gap:10,flexWrap:'wrap'}}>
                              <span>🏋️ {sLogs.length} treinos</span>
                              {sProf.weight&&<span>⚖️ {sProf.weight}kg</span>}
                              {imc2&&<span>IMC {imc2}</span>}
                              {sLogs[0]&&<span>📅 {sLogs[0].date}</span>}
                            </div>
                          </div>
                          <span style={{color:ACC,fontSize:16}}>→</span>
                        </div>
                      </div>
                    );
                  })}
                </>}
              </div>
            )}

            {/* ── TREINOS ── */}
            {!loading&&coachTab==='templates'&&!editTpl&&(
              <div>
                <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
                  <button style={st.btnP} onClick={()=>setEditTpl({id:null,name:'',description:'',scheduled_date:'',exercises:[]})}>+ NOVO TREINO</button>
                  <button style={st.btnS} onClick={()=>{setShowImport(true);setImportState({loading:false,error:null,result:null});}}>📄 IMPORTAR PDF</button>
                </div>

                {/* PDF import */}
                {showImport&&(
                  <div style={{background:SURF,border:`1px solid ${ACC}`,borderRadius:12,padding:'18px',marginBottom:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                      <span style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,color:ACC}}>IMPORTAR VIA PDF</span>
                      <button style={st.btnG} onClick={()=>setShowImport(false)}>✕</button>
                    </div>
                    {!importState.loading&&!importState.result&&<label style={{display:'flex',flexDirection:'column',alignItems:'center',border:`2px dashed ${BDR}`,borderRadius:9,padding:'30px',cursor:'pointer',background:SURF2}}><span style={{fontSize:26,marginBottom:8}}>📄</span><span style={{color:ACC,fontWeight:700,marginBottom:2}}>Selecionar PDF</span><span style={{fontSize:11,color:MUTED}}>A IA extrai os exercícios e datas automaticamente</span><input type="file" accept=".pdf" style={{display:'none'}} onChange={e=>e.target.files[0]&&importFromPDF(e.target.files[0])}/></label>}
                    {importState.loading&&<div style={{textAlign:'center',padding:'30px'}}><div style={{width:36,height:36,border:`3px solid ${BDR}`,borderTop:`3px solid ${ACC}`,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 10px'}}/><p style={{color:MUTED}}>Analisando PDF...</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}
                    {importState.error&&<div style={{background:'#1A0000',border:`1px solid #330000`,borderRadius:7,padding:'12px',color:DANGER,fontSize:13}}>⚠️ {importState.error}<br/><button style={{...st.btnS,marginTop:8,fontSize:12}} onClick={()=>setImportState({loading:false,error:null,result:null})}>Tentar novamente</button></div>}
                    {importState.result&&<div>
                      <div style={{fontSize:13,color:ACC,marginBottom:10,fontWeight:700}}>✅ {importState.result.length} treino{importState.result.length!==1?'s':''} encontrado{importState.result.length!==1?'s':''}:</div>
                      {importState.result.map((t,i)=>(
                        <div key={i} style={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:8,padding:'12px',marginBottom:7}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:15,color:ACC}}>{t.name}</div>
                            {t.scheduled_date&&<span style={st.tag}>📅 {t.scheduled_date}</span>}
                          </div>
                          {t.description&&<div style={{fontSize:11,color:MUTED,marginBottom:5}}>{t.description}</div>}
                          {t.exercises.map((ex,j)=><div key={j} style={{display:'flex',justifyContent:'space-between',fontSize:11,padding:'2px 0',borderBottom:`1px solid ${BDR}`}}><span style={{color:'#CCC'}}>{ex.name}</span><span style={{fontFamily:"'JetBrains Mono',monospace",color:MUTED}}>{ex.plannedSets}x{ex.plannedReps}</span></div>)}
                        </div>
                      ))}
                      <div style={{display:'flex',gap:8,marginTop:10}}>
                        <button style={st.btnS} onClick={()=>setImportState({loading:false,error:null,result:null})}>↩ Reimportar</button>
                        <button style={st.btnP} onClick={()=>confirmImport(importState.result)}>💾 SALVAR TODOS</button>
                      </div>
                    </div>}
                  </div>
                )}

                {/* Lista de treinos agrupados por data */}
                {templates.filter(t=>t.scheduled_date).length>0&&(
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:10,color:ACC,letterSpacing:1.5,marginBottom:8,textTransform:'uppercase'}}>Com data agendada</div>
                    {[...templates].filter(t=>t.scheduled_date).sort((a,b)=>a.scheduled_date.localeCompare(b.scheduled_date)).map(tpl=>(
                      <div key={tpl.id} style={{...st.card,display:'flex',alignItems:'flex-start',gap:12}}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:3,flexWrap:'wrap'}}>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:17,letterSpacing:1,color:ACC}}>{tpl.name}</div>
                            <span style={st.tag}>📅 {tpl.scheduled_date}</span>
                          </div>
                          {tpl.description&&<div style={{fontSize:11,color:MUTED,marginBottom:4}}>{tpl.description}</div>}
                          <div style={{fontSize:11,color:'#888'}}>{tpl.exercises.slice(0,4).map((ex,i)=><span key={i} style={{marginRight:10}}>{ex.name}</span>)}</div>
                        </div>
                        <div style={{display:'flex',gap:6,flexShrink:0}}>
                          <button style={{...st.btnS,padding:'5px 10px',fontSize:11}} onClick={()=>setEditTpl(tpl)}>✏️</button>
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
                          <div style={{fontFamily:"'Bebas Neue'",fontSize:17,letterSpacing:1,color:MUTED,marginBottom:3}}>{tpl.name}</div>
                          {tpl.description&&<div style={{fontSize:11,color:MUTED,marginBottom:4}}>{tpl.description}</div>}
                          <div style={{fontSize:11,color:'#888'}}>{tpl.exercises.slice(0,3).map((ex,i)=><span key={i} style={{marginRight:10}}>{ex.name}</span>)}</div>
                        </div>
                        <div style={{display:'flex',gap:6,flexShrink:0}}>
                          <button style={{...st.btnS,padding:'5px 10px',fontSize:11}} onClick={()=>setEditTpl(tpl)}>✏️</button>
                          <button style={st.btnD} onClick={()=>deleteTpl(tpl.id)}>🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {templates.length===0&&<div style={{...st.card,textAlign:'center',padding:'40px',border:`2px dashed ${BDR}`}}><p style={{color:MUTED}}>Nenhum treino cadastrado ainda.</p></div>}
              </div>
            )}

            {!loading&&coachTab==='templates'&&editTpl&&(
              <TemplateForm tpl={editTpl} onSave={saveTpl} onCancel={()=>setEditTpl(null)}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileSetup({name,onSave,loading,styles}){
  const{st,ACC,MUTED}=styles;
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
          <div style={st.fld}><label style={st.lbl}>Idade</label><input type="number" min="10" max="80" placeholder="28" style={st.inp} value={form.age} onChange={e=>upd('age',e.target.value)}/></div>
          <div style={st.fld}><label style={st.lbl}>Altura (cm)</label><input type="number" placeholder="175" style={st.inp} value={form.height} onChange={e=>upd('height',e.target.value)}/></div>
          <div style={st.fld}><label style={st.lbl}>Peso (kg)</label><input type="number" step="0.1" placeholder="75.5" style={st.inp} value={form.weight} onChange={e=>upd('weight',e.target.value)}/></div>
          <div style={st.fld}><label style={st.lbl}>% Gordura</label><input type="number" step="0.1" placeholder="18.5 (opcional)" style={st.inp} value={form.body_fat} onChange={e=>upd('body_fat',e.target.value)}/></div>
        </div>
      </div>
      <button style={{...st.btnP,width:'100%',padding:'13px',fontSize:15}} onClick={()=>onSave({age:form.age?parseInt(form.age):null,height:form.height?parseFloat(form.height):null,weight:form.weight?parseFloat(form.weight):null,body_fat:form.body_fat?parseFloat(form.body_fat):null})} disabled={loading}>
        {loading?'SALVANDO...':'ENTRAR NA MATILHA 🐺'}
      </button>
    </div>
  );
                       }
