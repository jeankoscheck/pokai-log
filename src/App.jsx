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

const PAIN_WORDS=['dor','dói','doendo','machucou','machucar','lesão','ardendo','inflamado','travado','travei','torci','torção','queimou','queimando','incômodo','incomoda','desconforto'];
const hasPain=l=>{const all=[l.notes||'',...(l.exercises||[]).flatMap(e=>(e.sets||[]).map(s=>s.notes||''))].join(' ').toLowerCase();return PAIN_WORDS.some(w=>all.includes(w));};
const totalReps=l=>(l.exercises||[]).reduce((a,e)=>a+(e.sets||[]).filter(s=>s.completed).reduce((b,s)=>b+(parseFloat(s.reps)||0),0),0);

const calcValencias=(logs,profile)=>{
  if(!logs||logs.length===0)return{forca:0,volume:0,consistencia:0,intensidade:0,recuperacao:0,tecnica:0};
  const recent=logs.slice(0,20);
  const allSets=recent.flatMap(l=>(l.exercises||[]).flatMap(e=>(e.sets||[]).map(s=>({...s,exName:e.name}))));
  const completedSets=allSets.filter(s=>s.completed);
  const tecnica=allSets.length>0?Math.round((completedSets.length/allSets.length)*100):0;
  const maxLoad=completedSets.length>0?Math.max(...completedSets.map(s=>parseFloat(s.load)||0)):0;
  const bw=profile?.weight||70;
  const forca=Math.min(100,Math.round((maxLoad/bw)*60));
  const weeklyRepsArr=[];
  for(let i=0;i<Math.min(4,Math.ceil(recent.length/5));i++){const w=recent.slice(i*5,(i+1)*5);weeklyRepsArr.push(w.reduce((a,l)=>a+totalReps(l),0));}
  const avgReps=weeklyRepsArr.length>0?weeklyRepsArr.reduce((a,b)=>a+b,0)/weeklyRepsArr.length:0;
  const volume=Math.min(100,Math.round(avgReps/8));
  const cutoff=new Date();cutoff.setDate(cutoff.getDate()-28);
  const recentLogs=logs.filter(l=>new Date(l.date)>=cutoff).length;
  const consistencia=Math.min(100,Math.round((recentLogs/16)*100));
  const avgRpe=recent.length>0?recent.reduce((a,l)=>a+(l.rpe||7),0)/recent.length:7;
  const intensidade=Math.min(100,Math.round((avgRpe/10)*100));
  const energyMap={'baixa':30,'média':65,'alta':100};
  const avgEnergy=recent.length>0?recent.reduce((a,l)=>a+(energyMap[l.energy]||65),0)/recent.length:65;
  const recuperacao=Math.min(100,Math.round(avgEnergy));
  return{forca,volume,consistencia,intensidade,recuperacao,tecnica};
};

const VALENCIA_LABELS={forca:'Força',volume:'Volume',consistencia:'Consistência',intensidade:'Intensidade',recuperacao:'Recuperação',tecnica:'Técnica'};
const valenciaColor=v=>v>=80?ACC:v>=60?WARN:DANGER;

const EMPTY_SET={reps:'',load:'',completed:true,notes:''};
const EMPTY_TPL_EX={name:'',plannedSets:3,plannedReps:'',plannedLoad:'',cues:''};

const st={
  app:{fontFamily:"'Outfit',sans-serif",background:BG,color:TEXT,minHeight:'100vh'},
  nav:{display:'flex',alignItems:'center',padding:'0 16px',height:52,borderBottom:`1px solid ${BDR}`,background:BG,position:'sticky',top:0,zIndex:100,gap:5,flexWrap:'wrap'},
  logo:{fontFamily:"'Bebas Neue'",fontSize:19,letterSpacing:3,color:ACC,marginRight:'auto'},
  main:{maxWidth:900,margin:'0 auto',padding:'24px 16px'},
  btnP:{padding:'9px 20px',background:ACC,color:'#000',border:'none',borderRadius:5,cursor:'pointer',fontSize:13,fontFamily:"'Outfit',sans-serif",fontWeight:700},
  btnS:{padding:'8px 16px',background:SURF2,color:TEXT,border:`1px solid ${BDR}`,borderRadius:5,cursor:'pointer',fontSize:13,fontFamily:"'Outfit',sans-serif",fontWeight:500},
  btnG:{padding:'6px 12px',background:'none',color:MUTED,border:'none',cursor:'pointer',fontSize:13,fontFamily:"'Outfit',sans-serif"},
  btnD:{padding:'5px 10px',background:'#1A0000',color:DANGER,border:`1px solid #330000`,borderRadius:4,cursor:'pointer',fontSize:11},
  card:{background:SURF,border:`1px solid ${BDR}`,borderRadius:10,padding:'16px 20px',marginBottom:12},
  sect:{background:SURF,border:`1px solid ${BDR}`,borderRadius:10,padding:'20px 22px',marginBottom:16},
  sectT:{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,color:ACC,display:'block',marginBottom:16,paddingBottom:10,borderBottom:`1px solid ${BDR}`},
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
const Tab=({active,onClick,children})=>(
  <button onClick={onClick} style={{padding:'6px 11px',border:`1px solid ${active?ACC:BDR}`,background:active?'rgba(141,198,63,0.08)':'transparent',color:active?ACC:MUTED,borderRadius:5,cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:"'Outfit',sans-serif"}}>{children}</button>
);
const Spin=()=>(
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'64px 0',flexDirection:'column',gap:16}}>
    <div style={{width:36,height:36,border:`3px solid ${BDR}`,borderTop:`3px solid ${ACC}`,borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
    <span style={{color:MUTED,fontSize:13}}>Carregando...</span>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

// ─── CALENDÁRIO ────────────────────────────────────────────────────────────────
function CalendarView({logs,student}){
  const today=new Date();
  const[calYear,setCalYear]=useState(today.getFullYear());
  const[calMonth,setCalMonth]=useState(today.getMonth());
  const[selLog,setSelLog]=useState(null);

  const monthNames=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const firstDay=new Date(calYear,calMonth,1).getDay();
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();

  const logMap=useMemo(()=>{
    const m={};
    logs.forEach(l=>{const d=l.date?.slice(0,10);if(d)m[d]=l;});
    return m;
  },[logs]);

  const dayKey=(d)=>`${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const prevMonth=()=>{if(calMonth===0){setCalYear(y=>y-1);setCalMonth(11);}else setCalMonth(m=>m-1);};
  const nextMonth=()=>{if(calMonth===11){setCalYear(y=>y+1);setCalMonth(0);}else setCalMonth(m=>m+1);};

  return(
    <div>
      {/* Header calendário */}
      <div style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:12,padding:'20px',marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <button style={st.btnG} onClick={prevMonth}>← </button>
          <div style={{fontFamily:"'Bebas Neue'",fontSize:22,letterSpacing:2,color:ACC}}>{monthNames[calMonth]} {calYear}</div>
          <button style={st.btnG} onClick={nextMonth}> →</button>
        </div>
        <div style={{display:'flex',gap:16,fontSize:11,marginBottom:16,justifyContent:'center'}}>
          <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:8,height:8,background:ACC,borderRadius:'50%',display:'inline-block'}}/> Treino</span>
          <span style={{display:'flex',alignItems:'center',gap:5}}><span style={{width:8,height:8,background:DANGER,borderRadius:'50%',display:'inline-block'}}/> Dor reportada</span>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4,marginBottom:6}}>
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=>(
            <div key={d} style={{textAlign:'center',fontSize:9,color:MUTED,fontWeight:700,letterSpacing:1,textTransform:'uppercase',padding:'3px 0'}}>{d}</div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:4}}>
          {Array(firstDay).fill(null).map((_,i)=><div key={`b${i}`}/>)}
          {Array.from({length:daysInMonth},(_,i)=>i+1).map(d=>{
            const key=dayKey(d);
            const log=logMap[key];
            const isToday=new Date().toISOString().slice(0,10)===key;
            return(
              <div key={d} onClick={()=>log&&setSelLog(selLog?.date===key?null:log)}
                style={{background:log?(log&&hasPain(log)?'rgba(224,80,80,0.12)':'rgba(141,198,63,0.1)'):'rgba(255,255,255,0.02)',border:isToday?`2px solid ${ACC}`:`1px solid ${log?(hasPain(log)?'rgba(224,80,80,0.35)':'rgba(141,198,63,0.25)'):BDR}`,borderRadius:7,padding:'6px 4px',textAlign:'center',cursor:log?'pointer':'default',minHeight:46}}>
                <div style={{fontSize:12,fontWeight:isToday?700:400,color:isToday?ACC:log?TEXT:MUTED}}>{d}</div>
                {log&&<div style={{fontSize:8,color:hasPain(log)?DANGER:ACC,marginTop:2,fontWeight:700,lineHeight:1.1}}>{log.template_name?.split(' ')[0]||'Treino'}</div>}
                {log&&<div style={{width:5,height:5,background:hasPain(log)?DANGER:ACC,borderRadius:'50%',margin:'2px auto 0'}}/>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detalhe do dia */}
      {selLog&&(
        <div style={{background:SURF,border:`1px solid ${hasPain(selLog)?DANGER:ACC}`,borderRadius:12,padding:'20px',marginBottom:16}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,flexWrap:'wrap',gap:8}}>
            <div>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:24,letterSpacing:2,color:hasPain(selLog)?DANGER:ACC}}>{selLog.template_name||'Treino'}</div>
              <div style={{fontSize:12,color:MUTED}}>📅 {selLog.date}{selLog.week&&` · ${selLog.week}`}</div>
            </div>
            <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
              {selLog.rpe&&<span style={st.tag}>RPE {selLog.rpe}/10</span>}
              <span style={{...st.tag,background:'rgba(255,255,255,0.05)',color:MUTED}}>⚡ {selLog.energy}</span>
              {hasPain(selLog)&&<span style={st.tagD}>⚠️ Dor reportada</span>}
            </div>
          </div>
          {/* Stats */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
            {[
              ['RPE', `${selLog.rpe||'—'}/10`],
              ['Total Reps', totalReps(selLog)],
              ['Séries', (selLog.exercises||[]).reduce((a,e)=>a+(e.sets||[]).filter(s=>s.completed).length,0)],
            ].map(([k,v])=>(
              <div key={k} style={{background:SURF2,borderRadius:8,padding:'10px',textAlign:'center'}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:ACC}}>{v}</div>
                <div style={{fontSize:10,color:MUTED,textTransform:'uppercase'}}>{k}</div>
              </div>
            ))}
          </div>
          {/* Exercícios */}
          {(selLog.exercises||[]).filter(e=>e.name).map((ex,i)=>(
            <div key={i} style={{background:SURF2,borderRadius:8,padding:'12px 14px',marginBottom:8}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:15,letterSpacing:1,marginBottom:8}}>{ex.name}</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {(ex.sets||[]).map((s,j)=>(
                  <div key={j} style={{background:s.completed?'rgba(141,198,63,0.07)':'rgba(255,255,255,0.02)',border:`1px solid ${s.completed?'rgba(141,198,63,0.2)':BDR}`,borderRadius:6,padding:'5px 10px',textAlign:'center',minWidth:56}}>
                    <div style={{fontSize:9,color:MUTED}}>S{j+1}</div>
                    <div style={{fontSize:12,fontWeight:700,color:s.completed?ACC:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{s.reps||'—'}×{parseFloat(s.load)>0?s.load+'kg':'PC'}</div>
                    {s.notes&&PAIN_WORDS.some(w=>s.notes.toLowerCase().includes(w))&&<div style={{fontSize:8,color:DANGER,marginTop:2}}>⚠️</div>}
                  </div>
                ))}
              </div>
              {ex.sets?.some(s=>s.notes&&PAIN_WORDS.some(w=>s.notes.toLowerCase().includes(w)))&&(
                <div style={{marginTop:8,fontSize:11,color:DANGER}}>
                  {ex.sets.filter(s=>s.notes&&PAIN_WORDS.some(w=>s.notes.toLowerCase().includes(w))).map((s,j)=>(
                    <div key={j}>⚠️ S{ex.sets.indexOf(s)+1}: {s.notes}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {selLog.highlights&&<div style={{marginTop:10,fontSize:13,color:ACC}}>✨ {selLog.highlights}</div>}
          {selLog.notes&&<div style={{marginTop:6,fontSize:12,color:'#999',fontStyle:'italic'}}>💬 {selLog.notes}</div>}
        </div>
      )}

      {/* Resumo do mês */}
      {(()=>{
        const mLogs=logs.filter(l=>l.date?.startsWith(`${calYear}-${String(calMonth+1).padStart(2,'0')}`));
        if(mLogs.length===0)return null;
        return(
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {[['Treinos',mLogs.length],['Total Reps',mLogs.reduce((a,l)=>a+totalReps(l),0)],['Com dor',mLogs.filter(l=>hasPain(l)).length],['RPE médio',(mLogs.reduce((a,l)=>a+(l.rpe||7),0)/mLogs.length).toFixed(1)]].map(([k,v])=>(
              <div key={k} style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:8,padding:'10px',textAlign:'center'}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:ACC}}>{v}</div>
                <div style={{fontSize:9,color:MUTED,textTransform:'uppercase',letterSpacing:1}}>{k}</div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

// ─── APP PRINCIPAL ──────────────────────────────────────────────────────────────
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
  const[allStudents,setAllStudents]=useState([]);
  const[studData,setStudData]=useState({});
  const[studProfiles,setStudProfiles]=useState({});
  const[studWeightLogs,setStudWeightLogs]=useState({});
  const[selWeek,setSelWeek]=useState('');
  const[logData,setLogData]=useState(null);
  const[coachTab,setCoachTab]=useState('alunos');
  const[editTpl,setEditTpl]=useState(null);
  const[expandedStudent,setExpandedStudent]=useState(null);
  const[selEx,setSelEx]=useState('');
  const[showImport,setShowImport]=useState(false);
  const[importState,setImportState]=useState({loading:false,error:null,result:null});
  const[newWeight,setNewWeight]=useState('');
  const[newBF,setNewBF]=useState('');

  useEffect(()=>{loadTemplates();},[]);
  useEffect(()=>{if(student){loadLogs(student);loadProfile(student);loadWeightLogs(student);}},[student]);

  const loadTemplates=async()=>{const d=await sb.get('templates','order=created_at.asc');setTemplates(d||[]);};
  const loadLogs=async(n)=>{setLoading(true);const d=await sb.get('logs',`student_id=eq.${encodeURIComponent(n)}&order=date.desc`);setLogs(d||[]);setLoading(false);};
  const loadProfile=async(n)=>{const d=await sb.get('students',`id=eq.${encodeURIComponent(n)}`);if(d?.[0])setProfile(d[0]);};
  const loadWeightLogs=async(n)=>{const d=await sb.get('weight_logs',`student_id=eq.${encodeURIComponent(n)}&order=date.asc`);setWeightLogs(d||[]);};

  const loadCoach=async()=>{
    setLoading(true);await loadTemplates();
    const students=await sb.get('students','order=name.asc')||[];
    const idx=students.map(s=>s.name);setAllStudents(idx);
    const allLogs=await sb.get('logs','order=date.desc')||[];
    const allWL=await sb.get('weight_logs','order=date.asc')||[];
    const data={},profs={},wls={};
    students.forEach(s=>{data[s.name]=(allLogs).filter(l=>l.student_id===s.name);profs[s.name]=s;wls[s.name]=(allWL).filter(l=>l.student_id===s.name);});
    setStudData(data);setStudProfiles(profs);setStudWeightLogs(wls);setLoading(false);
  };

  const login=async()=>{
    const name=nameInput.trim();if(!name)return;setLoading(true);
    await sb.upsert('students',{id:name,name});setStudent(name);
    const d=await sb.get('students',`id=eq.${encodeURIComponent(name)}`);
    const p=d?.[0];setProfile(p);setLoading(false);
    if(!p?.age||!p?.height){setView('profile-setup');}else{setView('dash');}
  };

  const saveProfile=async(data)=>{setLoading(true);await sb.upsert('students',{id:student,name:student,...data});await loadProfile(student);setView('dash');setLoading(false);};

  const addWeightLog=async()=>{
    if(!newWeight)return;setLoading(true);
    const id=String(Date.now());const date=new Date().toISOString().split('T')[0];
    await sb.upsert('weight_logs',{id,student_id:student,date,weight:parseFloat(newWeight),body_fat:newBF?parseFloat(newBF):null});
    await sb.upsert('students',{id:student,name:student,weight:parseFloat(newWeight),...(newBF?{body_fat:parseFloat(newBF)}:{})});
    await loadWeightLogs(student);await loadProfile(student);setNewWeight('');setNewBF('');setLoading(false);
  };

  const enterCoach=async()=>{if(coachPass==='pokai2026'){await loadCoach();setView('coach');}else alert('Senha incorreta.');};

  const startFromTemplate=(tpl)=>{
    setLogData({id:null,date:new Date().toISOString().split('T')[0],week:selWeek,templateId:tpl.id,templateName:tpl.name,
      exercises:tpl.exercises.map(ex=>({name:ex.name,cues:ex.cues,planned:{sets:ex.plannedSets,reps:ex.plannedReps,load:ex.plannedLoad},sets:Array.from({length:ex.plannedSets},()=>({...EMPTY_SET}))})),
      rpe:7,energy:'média',highlights:'',notes:''});setView('newlog');
  };

  const saveLog=async()=>{
    if(!logData)return;setLoading(true);const id=logData.id||String(Date.now());
    await sb.upsert('logs',{id,student_id:student,date:logData.date,week:logData.week,template_id:logData.templateId,template_name:logData.templateName,exercises:logData.exercises,rpe:logData.rpe,energy:logData.energy,highlights:logData.highlights,notes:logData.notes});
    await loadLogs(student);setView('dash');setLoading(false);
  };

  const updSet=(ei,si,f,v)=>setLogData(p=>({...p,exercises:p.exercises.map((e,i)=>i===ei?{...e,sets:e.sets.map((s,j)=>j===si?{...s,[f]:v}:s)}:e)}));
  const addSet=(ei)=>setLogData(p=>({...p,exercises:p.exercises.map((e,i)=>i===ei?{...e,sets:[...e.sets,{...EMPTY_SET}]}:e)}));
  const remSet=(ei,si)=>setLogData(p=>({...p,exercises:p.exercises.map((e,i)=>i===ei?{...e,sets:e.sets.filter((_,j)=>j!==si)}:e)}));
  const saveTpl=async(tpl)=>{const id=tpl.id||String(Date.now());await sb.upsert('templates',{...tpl,id});await loadTemplates();setEditTpl(null);};
  const deleteTpl=async(id)=>{if(!confirm('Remover?'))return;await sb.del('templates',`id=eq.${id}`);await loadTemplates();};

  const importFromPDF=async(file)=>{
    setImportState({loading:true,error:null,result:null});
    try{
      const pdfBase64=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result.split(',')[1]);r.onerror=()=>rej(new Error('Erro'));r.readAsDataURL(file);});
      const response=await fetch('/api/import-pdf',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pdfBase64})});
      const data=await response.json();if(!response.ok)throw new Error(data.error||'Erro');
      setImportState({loading:false,error:null,result:data.treinos});
    }catch(e){setImportState({loading:false,error:'Não foi possível extrair os treinos.',result:null});}
  };

  const confirmImport=async(treinos)=>{
    for(const t of treinos){const id=String(Date.now())+Math.random().toString(36).slice(2);await sb.upsert('templates',{...t,id});}
    await loadTemplates();setImportState({loading:false,error:null,result:null});setShowImport(false);
  };

  const exNames=useMemo(()=>{const n=new Set();logs.forEach(l=>l.exercises?.forEach(e=>e.name&&n.add(e.name)));return[...n];},[logs]);
  const progressData=useMemo(()=>{
    if(!selEx)return[];
    return[...logs].reverse().filter(l=>l.exercises?.some(e=>e.name===selEx)).map(l=>{
      const ex=l.exercises.find(e=>e.name===selEx);const done=ex.sets.filter(s=>s.completed);
      return{date:l.date.slice(5),maxLoad:done.length?Math.max(...done.map(s=>parseFloat(s.load)||0)):0,totalReps:done.reduce((a,s)=>a+(parseFloat(s.reps)||0),0)};
    });
  },[logs,selEx]);

  const stats=useMemo(()=>{
    const cutoff=new Date();cutoff.setDate(cutoff.getDate()-7);
    const freq={};logs.forEach(l=>l.exercises?.forEach(e=>{if(e.name)freq[e.name]=(freq[e.name]||0)+1;}));
    return{total:logs.length,lastWeek:logs.filter(l=>new Date(l.date)>=cutoff).length,favEx:Object.entries(freq).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—'};
  },[logs]);

  const exSum=(ex)=>{const done=ex.sets.filter(s=>s.completed);return{done:done.length,total:ex.sets.length,maxLoad:done.length?Math.max(...done.map(s=>parseFloat(s.load)||0)):0,reps:done.reduce((a,s)=>a+(parseFloat(s.reps)||0),0)};};
  const valencias=useMemo(()=>calcValencias(logs,profile),[logs,profile]);
  const radarData=Object.entries(valencias).map(([k,v])=>({attr:VALENCIA_LABELS[k],value:v,fullMark:100}));
  const imc=profile?.weight&&profile?.height?((profile.weight)/((profile.height/100)**2)).toFixed(1):null;

  // Weekly reps for chart
  const weeklyRepsData=useMemo(()=>{
    const weeks={};
    logs.forEach(l=>{if(l.week)weeks[l.week]=(weeks[l.week]||0)+totalReps(l);});
    return Object.entries(weeks).slice(-6).map(([week,reps])=>({week,reps}));
  },[logs]);

  return(
    <div style={st.app}>
      <style>{FONTS}</style>
      <nav style={st.nav}>
        <span style={st.logo}>PŌKAI <span style={{color:TEXT,fontWeight:300,fontSize:13,letterSpacing:4}}>MOVEMENT</span></span>
        {student&&<>
          <Tab active={view==='dash'} onClick={()=>setView('dash')}>Dashboard</Tab>
          <Tab active={view==='pick'} onClick={()=>setView('pick')}>Treino</Tab>
          <Tab active={view==='calendar'} onClick={()=>setView('calendar')}>📅</Tab>
          <Tab active={view==='history'} onClick={()=>setView('history')}>Histórico</Tab>
          <Tab active={view==='progress'} onClick={()=>setView('progress')}>Progresso</Tab>
          <Tab active={view==='perfil'} onClick={()=>setView('perfil')}>Perfil</Tab>
          <span style={{fontSize:11,color:MUTED,marginLeft:'auto',borderLeft:`1px solid ${BDR}`,paddingLeft:10}}>👤 {student.split(' ')[0]}</span>
        </>}
      </nav>

      <div style={st.main}>

        {/* LOGIN */}
        {view==='login'&&(
          <div style={{maxWidth:400,margin:'48px auto 0',textAlign:'center'}}>
            <div style={{marginBottom:32}}>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:56,letterSpacing:6,color:TEXT,lineHeight:1}}>PŌKAI</div>
              <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:8,color:ACC,marginBottom:8}}>MOVEMENT</div>
              <div style={{width:32,height:3,background:ACC,margin:'0 auto 16px'}}/>
              <p style={{color:MUTED,fontSize:13}}>Registre seus treinos. Acompanhe sua evolução.</p>
            </div>
            <div style={st.card}>
              <F label="Seu nome completo"><Inp value={nameInput} onChange={e=>setNameInput(e.target.value)} placeholder="Ex: João Silva" sx={{fontSize:15}}/></F>
              <button style={{...st.btnP,width:'100%',padding:'12px',fontSize:15}} onClick={login} disabled={loading}>{loading?'ENTRANDO...':'ENTRAR NA MATILHA →'}</button>
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

        {/* PROFILE SETUP */}
        {view==='profile-setup'&&<ProfileSetup name={student} onSave={saveProfile} loading={loading} styles={{st,ACC,MUTED,BDR,SURF,SURF2:SURF2,TEXT}}/>}

        {/* DASHBOARD */}
        {view==='dash'&&(loading?<Spin/>:
          <div>
            <h1 style={{fontFamily:"'Bebas Neue'",fontSize:34,letterSpacing:3,color:ACC,margin:'0 0 20px'}}>BEM-VINDO, {student.split(' ')[0].toUpperCase()} 🌿</h1>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:20}}>
              {[['🏋️','Treinos totais',stats.total],['🔥','Última semana',stats.lastWeek],['⭐','Exercício favorito',stats.favEx]].map(([ic,k,v])=>(
                <div key={k} style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:10,padding:'12px 14px',textAlign:'center'}}>
                  <div style={{fontSize:20,marginBottom:4}}>{ic}</div>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:ACC,lineHeight:1}}>{v}</div>
                  <div style={{fontSize:10,color:MUTED,letterSpacing:1,textTransform:'uppercase',marginTop:4}}>{k}</div>
                </div>
              ))}
            </div>
            <button style={{...st.btnP,width:'100%',padding:'13px',fontSize:15,marginBottom:22}} onClick={()=>setView('pick')}>+ REGISTRAR TREINO DE HOJE</button>
            <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,color:ACC,marginBottom:12}}>SESSÕES RECENTES</div>
            {logs.length===0&&<div style={{...st.card,textAlign:'center',padding:'36px',border:`2px dashed ${BDR}`}}><p style={{color:MUTED}}>Nenhum treino ainda. Comece agora!</p></div>}
            {logs.slice(0,4).map(l=>(
              <div key={l.id} style={st.card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                  <div>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4,flexWrap:'wrap'}}>
                      <span style={{fontFamily:"'Bebas Neue'",fontSize:17}}>{l.template_name||'Treino'}</span>
                      {l.week&&<span style={{...st.tag,background:'rgba(255,255,255,0.05)',color:MUTED}}>{l.week}</span>}
                      <span style={{fontSize:11,color:MUTED}}>📅 {l.date}</span>
                      {hasPain(l)&&<span style={st.tagD}>⚠️ Dor</span>}
                    </div>
                    <div style={{fontSize:12,color:MUTED}}>{l.exercises?.filter(e=>e.name).slice(0,5).map(e=>e.name).join(' · ')}</div>
                    {l.highlights&&<div style={{fontSize:12,color:'rgba(141,198,63,0.75)',marginTop:4}}>✨ {l.highlights}</div>}
                  </div>
                  <div style={{display:'flex',gap:6,flexShrink:0}}>{l.rpe&&<span style={st.tag}>RPE {l.rpe}</span>}<span style={{...st.tag,background:'rgba(255,255,255,0.05)',color:MUTED}}>⚡{l.energy}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CALENDÁRIO */}
        {view==='calendar'&&(
          <div>
            <h1 style={{fontFamily:"'Bebas Neue'",fontSize:34,letterSpacing:3,color:ACC,marginBottom:22}}>CALENDÁRIO DE TREINOS</h1>
            <CalendarView logs={logs} student={student}/>
          </div>
        )}

        {/* PERFIL */}
        {view==='perfil'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:22}}>
              <h1 style={{fontFamily:"'Bebas Neue'",fontSize:34,letterSpacing:3,color:ACC,margin:0}}>MEU PERFIL</h1>
              <button style={st.btnS} onClick={()=>setView('profile-setup')}>✏️ Editar</button>
            </div>

            {/* FIFA Card */}
            <div style={{background:`linear-gradient(135deg,#0a1a00,#1a3300,#0a1a00)`,border:`2px solid ${ACC}`,borderRadius:16,padding:'24px',marginBottom:20,position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:0,right:0,width:200,height:200,background:'rgba(141,198,63,0.04)',borderRadius:'50%',transform:'translate(50px,-50px)'}}/>
              <div style={{display:'flex',gap:20,flexWrap:'wrap',alignItems:'flex-start'}}>
                <div style={{flex:1,minWidth:200}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:10,letterSpacing:4,color:MUTED,marginBottom:2}}>PŌKAI MOVEMENT · ATLETA</div>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:34,letterSpacing:2,lineHeight:1,marginBottom:8}}>{student}</div>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
                    {profile?.age&&<span style={st.tag}>{profile.age} anos</span>}
                    {imc&&<span style={{...st.tag,background:'rgba(255,255,255,0.06)',color:MUTED}}>IMC {imc}</span>}
                    <span style={{...st.tag,background:'rgba(141,198,63,0.06)',color:ACC}}>🏋️ {stats.total} treinos</span>
                    {profile?.height&&<span style={{...st.tag,background:'rgba(255,255,255,0.04)',color:MUTED}}>{profile.height}cm</span>}
                  </div>
                  {/* Barras de valências */}
                  <div style={{display:'flex',flexDirection:'column',gap:6}}>
                    {Object.entries(valencias).map(([k,v])=>(
                      <div key={k} style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{fontSize:10,color:MUTED,width:88,textTransform:'uppercase',letterSpacing:1}}>{VALENCIA_LABELS[k]}</span>
                        <div style={{flex:1,height:6,background:'rgba(255,255,255,0.08)',borderRadius:3,overflow:'hidden'}}>
                          <div style={{width:`${v}%`,height:'100%',background:valenciaColor(v),borderRadius:3}}/>
                        </div>
                        <span style={{fontSize:13,fontWeight:700,color:valenciaColor(v),width:28,textAlign:'right',fontFamily:"'JetBrains Mono',monospace"}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Radar */}
                {logs.length>0&&<div style={{width:210,height:210}}>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(141,198,63,0.15)"/>
                      <PolarAngleAxis dataKey="attr" tick={{fill:MUTED,fontSize:9,fontFamily:"'Outfit',sans-serif"}}/>
                      <Radar dataKey="value" stroke={ACC} fill={ACC} fillOpacity={0.18} strokeWidth={2}/>
                    </RadarChart>
                  </ResponsiveContainer>
                </div>}
              </div>
            </div>

            {/* Pontos fortes / fracos */}
            {logs.length>0&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
              <div style={{background:SURF,border:`1px solid rgba(141,198,63,0.3)`,borderRadius:10,padding:'16px'}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:2,color:ACC,marginBottom:10}}>💪 PONTOS FORTES</div>
                {Object.entries(valencias).filter(([,v])=>v>=70).sort((a,b)=>b[1]-a[1]).map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:5}}>
                    <span style={{color:'#CCC'}}>{VALENCIA_LABELS[k]}</span>
                    <span style={{color:ACC,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{v}</span>
                  </div>
                ))}
                {Object.entries(valencias).filter(([,v])=>v>=70).length===0&&<p style={{color:MUTED,fontSize:12}}>Continue treinando!</p>}
              </div>
              <div style={{background:SURF,border:`1px solid rgba(224,80,80,0.25)`,borderRadius:10,padding:'16px'}}>
                <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:2,color:DANGER,marginBottom:10}}>📈 A MELHORAR</div>
                {Object.entries(valencias).filter(([,v])=>v<70).sort((a,b)=>a[1]-b[1]).map(([k,v])=>(
                  <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:5}}>
                    <span style={{color:'#CCC'}}>{VALENCIA_LABELS[k]}</span>
                    <span style={{color:v<50?DANGER:WARN,fontWeight:700,fontFamily:"'JetBrains Mono',monospace"}}>{v}</span>
                  </div>
                ))}
                {Object.entries(valencias).filter(([,v])=>v<70).length===0&&<p style={{color:MUTED,fontSize:12}}>Excelente perfil!</p>}
              </div>
            </div>}

            {/* Medidas */}
            <div style={st.sect}>
              <span style={st.sectT}>REGISTRAR MEDIDAS DE HOJE</span>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr auto',gap:12,alignItems:'flex-end'}}>
                <F label="Peso (kg)"><Inp value={newWeight} onChange={e=>setNewWeight(e.target.value)} type="number" placeholder="Ex: 75.5"/></F>
                <F label="% Gordura (opcional)"><Inp value={newBF} onChange={e=>setNewBF(e.target.value)} type="number" placeholder="Ex: 18.5"/></F>
                <button style={{...st.btnP,marginBottom:14}} onClick={addWeightLog} disabled={loading}>Registrar</button>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {[['Peso atual',profile?.weight?profile.weight+' kg':'—'],['% Gordura',profile?.body_fat?profile.body_fat+'%':'—'],['Altura',profile?.height?profile.height+' cm':'—']].map(([k,v])=>(
                  <div key={k} style={{background:SURF2,borderRadius:8,padding:'10px',textAlign:'center'}}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:22,color:ACC}}>{v}</div>
                    <div style={{fontSize:10,color:MUTED,textTransform:'uppercase'}}>{k}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráficos peso */}
            {weightLogs.length>1&&(
              <div style={st.sect}>
                <span style={st.sectT}>EVOLUÇÃO DO PESO</span>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={weightLogs} margin={{top:5,right:10,left:0,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BDR}/>
                    <XAxis dataKey="date" tick={{fill:MUTED,fontSize:10}} tickFormatter={d=>d.slice(5)}/>
                    <YAxis tick={{fill:MUTED,fontSize:11}} unit="kg" width={48} domain={['auto','auto']}/>
                    <Tooltip contentStyle={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:6,color:TEXT,fontSize:12}}/>
                    <Line type="monotone" dataKey="weight" name="Peso" stroke={ACC} strokeWidth={2.5} dot={{fill:ACC,r:4}} activeDot={{r:6}}/>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Volume semanal */}
            {weeklyRepsData.length>1&&(
              <div style={st.sect}>
                <span style={st.sectT}>TOTAL DE REPS POR SEMANA</span>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={weeklyRepsData} margin={{top:5,right:10,left:0,bottom:5}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={BDR}/>
                    <XAxis dataKey="week" tick={{fill:MUTED,fontSize:10}}/>
                    <YAxis tick={{fill:MUTED,fontSize:11}}/>
                    <Tooltip contentStyle={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:6,color:TEXT,fontSize:12}} formatter={(v)=>[v+' reps','']}/>
                    <Bar dataKey="reps" fill={ACC} radius={[4,4,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* PICK TEMPLATE */}
        {view==='pick'&&(
          <div>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:24}}>
              <button style={st.btnG} onClick={()=>setView('dash')}>← Voltar</button>
              <h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:3,color:ACC,margin:0}}>QUAL TREINO DE HOJE?</h1>
            </div>
            <div style={{...st.sect,marginBottom:20}}><F label="Semana atual"><Inp value={selWeek} onChange={e=>setSelWeek(e.target.value)} placeholder="Ex: Semana 3"/></F></div>
            {templates.length===0&&<div style={{...st.card,textAlign:'center',padding:'48px',border:`2px dashed ${BDR}`}}><p style={{color:MUTED}}>Nenhum treino cadastrado pelo professor ainda.</p></div>}
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))',gap:12}}>
              {templates.map(tpl=>(
                <div key={tpl.id} onClick={()=>startFromTemplate(tpl)} style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:12,padding:'20px',cursor:'pointer'}}>
                  <div style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,color:ACC,marginBottom:4}}>{tpl.name}</div>
                  {tpl.description&&<p style={{fontSize:12,color:MUTED,marginBottom:12}}>{tpl.description}</p>}
                  <div style={{fontSize:12,color:'#888',marginBottom:12}}>{tpl.exercises.length} exercício{tpl.exercises.length!==1?'s':''}</div>
                  <div style={{display:'flex',flexDirection:'column',gap:4}}>
                    {tpl.exercises.slice(0,4).map((ex,i)=>(
                      <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:12}}>
                        <span style={{color:'#CCC'}}>{ex.name}</span>
                        <span style={{color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{ex.plannedSets}x{ex.plannedReps}{ex.plannedLoad?' @ '+ex.plannedLoad:''}</span>
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
        {view==='newlog'&&logData&&(
          <div>
            <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:22}}>
              <button style={st.btnG} onClick={()=>setView('pick')}>← Voltar</button>
              <div><h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:3,color:ACC,margin:0}}>{logData.templateName}</h1>{logData.week&&<span style={{fontSize:12,color:MUTED}}>{logData.week} · {logData.date}</span>}</div>
            </div>
            {logData.exercises.map((ex,ei)=>(
              <div key={ei} style={st.sect}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <div>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:18,letterSpacing:1,marginBottom:6}}>{ex.name}</div>
                    <div style={{fontSize:11,color:MUTED,background:SURF2,padding:'4px 10px',borderRadius:4,display:'inline-flex',gap:8}}>
                      📋 <span style={{color:ACC,fontFamily:"'JetBrains Mono',monospace"}}>{ex.planned.sets}x{ex.planned.reps}{ex.planned.load?' @ '+ex.planned.load:''}</span>
                    </div>
                    {ex.cues&&<div style={{fontSize:11,color:MUTED,marginTop:6}}>💡 {ex.cues}</div>}
                  </div>
                  <span style={{fontSize:11,color:MUTED}}>{ex.sets.filter(s=>s.completed).length}/{ex.sets.length}</span>
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:360}}>
                    <thead><tr>{['#','Reps','Carga kg','✓','Obs',''].map(h=><th key={h} style={st.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {ex.sets.map((set,si)=>(
                        <tr key={si} style={{opacity:set.completed?1:0.5}}>
                          <td style={{...st.td,color:MUTED,fontWeight:700,fontSize:12}}>{si+1}</td>
                          <td style={st.td}><input type="number" placeholder={ex.planned.reps||'0'} min="0" style={{...st.inp,padding:'5px 8px',width:72,fontSize:13,textAlign:'center',borderColor:set.reps?ACC:undefined}} value={set.reps} onChange={e=>updSet(ei,si,'reps',e.target.value)}/></td>
                          <td style={st.td}><input type="number" placeholder="0" min="0" step="0.5" style={{...st.inp,padding:'5px 8px',width:80,fontSize:13,textAlign:'center',borderColor:set.load?ACC:undefined}} value={set.load} onChange={e=>updSet(ei,si,'load',e.target.value)}/></td>
                          <td style={{...st.td,textAlign:'center'}}><div onClick={()=>updSet(ei,si,'completed',!set.completed)} style={{width:24,height:24,borderRadius:5,cursor:'pointer',margin:'0 auto',border:`2px solid ${set.completed?ACC:'#444'}`,background:set.completed?ACC:'transparent',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'#000'}}>{set.completed?'✓':''}</div></td>
                          <td style={st.td}><input placeholder="dor, dificuldade..." style={{...st.inp,padding:'5px 8px',width:130,fontSize:12}} value={set.notes} onChange={e=>updSet(ei,si,'notes',e.target.value)}/></td>
                          <td style={st.td}>{ex.sets.length>1&&<button style={{background:'none',border:'none',color:DANGER,cursor:'pointer',fontSize:14}} onClick={()=>remSet(ei,si)}>✕</button>}</td>
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
                <F label={`RPE ${logData.rpe}/10`}><input type="range" min="1" max="10" value={logData.rpe} onChange={e=>setLogData(p=>({...p,rpe:Number(e.target.value)}))} style={{width:'100%',accentColor:ACC,marginTop:8}}/></F>
                <F label="Energia"><Sel value={logData.energy} onChange={e=>setLogData(p=>({...p,energy:e.target.value}))} opts={['baixa','média','alta']}/></F>
              </div>
              <F label="Destaques ✨"><Inp value={logData.highlights} onChange={e=>setLogData(p=>({...p,highlights:e.target.value}))} placeholder="Ex: bati PR no agachamento..."/></F>
              <F label="Obs / Dores para o professor"><textarea style={{...st.inp,minHeight:72,resize:'vertical'}} value={logData.notes} onChange={e=>setLogData(p=>({...p,notes:e.target.value}))} placeholder="Dores, dificuldades, dúvidas..."/></F>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:10}}>
              <button style={st.btnS} onClick={()=>setView('pick')}>Cancelar</button>
              <button style={st.btnP} onClick={saveLog} disabled={loading}>{loading?'SALVANDO...':'💾 SALVAR TREINO'}</button>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {view==='history'&&(loading?<Spin/>:
          <div>
            <h1 style={{fontFamily:"'Bebas Neue'",fontSize:34,letterSpacing:3,color:ACC,marginBottom:22}}>HISTÓRICO DE TREINOS</h1>
            {logs.length===0&&<div style={{...st.card,textAlign:'center',padding:'48px',border:`2px dashed ${BDR}`}}><p style={{color:MUTED,marginBottom:20}}>Nenhum treino ainda.</p><button style={st.btnP} onClick={()=>setView('pick')}>Começar agora</button></div>}
            {logs.map(l=>(
              <div key={l.id} style={st.card}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12,paddingBottom:12,borderBottom:`1px solid ${BDR}`,flexWrap:'wrap',gap:8}}>
                  <div>
                    <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
                      <span style={{fontFamily:"'Bebas Neue'",fontSize:18}}>{l.template_name||'Treino'}</span>
                      {l.week&&<span style={{...st.tag,background:'rgba(255,255,255,0.05)',color:MUTED}}>{l.week}</span>}
                      <span style={{fontSize:11,color:MUTED}}>📅 {l.date}</span>
                      {hasPain(l)&&<span style={st.tagD}>⚠️ Dor</span>}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:6}}>{l.rpe&&<span style={st.tag}>RPE {l.rpe}</span>}<span style={{...st.tag,background:'rgba(255,255,255,0.05)',color:MUTED}}>⚡{l.energy}</span><span style={st.tag}>{totalReps(l)} reps</span></div>
                </div>
                <div style={{overflowX:'auto'}}>
                  <table style={{width:'100%',borderCollapse:'collapse',minWidth:400}}>
                    <thead><tr>{['Exercício','Planejado','Séries ok','Melhor carga','Reps totais'].map(h=><th key={h} style={st.th}>{h}</th>)}</tr></thead>
                    <tbody>
                      {l.exercises?.filter(e=>e.name).map((ex,i)=>{const{done,total,maxLoad,reps}=exSum(ex);return(
                        <tr key={i}>
                          <td style={{...st.td,fontWeight:600}}>{ex.name}</td>
                          <td style={{...st.td,fontSize:11,color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{ex.planned?.sets}x{ex.planned?.reps}</td>
                          <td style={{...st.td,color:done<total?WARN:ACC}}>{done}/{total}{done<total?' ⚠️':''}</td>
                          <td style={{...st.td,color:ACC,fontFamily:"'JetBrains Mono',monospace"}}>{maxLoad?maxLoad+' kg':'—'}</td>
                          <td style={{...st.td,fontFamily:"'JetBrains Mono',monospace"}}>{reps||'—'}</td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                </div>
                {hasPain(l)&&(
                  <div style={{marginTop:10,background:'rgba(224,80,80,0.06)',border:`1px solid rgba(224,80,80,0.2)`,borderRadius:6,padding:'10px 14px'}}>
                    <div style={{fontSize:11,color:DANGER,fontWeight:700,marginBottom:6}}>⚠️ DORES REPORTADAS</div>
                    {l.exercises?.map((ex,i)=>ex.sets?.map((s,j)=>s.notes&&PAIN_WORDS.some(w=>s.notes.toLowerCase().includes(w))&&(
                      <div key={`${i}-${j}`} style={{fontSize:12,color:'#CCC',marginBottom:2}}><span style={{color:MUTED}}>{ex.name} S{j+1}:</span> {s.notes}</div>
                    )))}
                    {l.notes&&PAIN_WORDS.some(w=>l.notes.toLowerCase().includes(w))&&<div style={{fontSize:12,color:'#CCC'}}><span style={{color:MUTED}}>Obs:</span> {l.notes}</div>}
                  </div>
                )}
                {(l.highlights||l.notes)&&(
                  <div style={{marginTop:10,display:'flex',gap:10,flexWrap:'wrap'}}>
                    {l.highlights&&<div style={{flex:1,minWidth:180,background:'rgba(141,198,63,0.05)',padding:'10px 14px',borderRadius:6,borderLeft:`3px solid ${ACC}`,fontSize:13,color:'#CCC'}}><span style={{...st.lbl,marginBottom:4,color:ACC}}>Destaques</span>{l.highlights}</div>}
                    {l.notes&&<div style={{flex:1,minWidth:180,background:SURF2,padding:'10px 14px',borderRadius:6,fontSize:13,color:'#999'}}><span style={{...st.lbl,marginBottom:4}}>Obs</span>{l.notes}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* PROGRESS */}
        {view==='progress'&&(loading?<Spin/>:
          <div>
            <h1 style={{fontFamily:"'Bebas Neue'",fontSize:34,letterSpacing:3,color:ACC,marginBottom:22}}>MINHA EVOLUÇÃO</h1>
            {exNames.length===0?<div style={{...st.card,textAlign:'center',padding:'48px',border:`2px dashed ${BDR}`}}><p style={{color:MUTED}}>Registre treinos para ver evolução.</p></div>:(
              <>
                <div style={st.sect}>
                  <span style={st.sectT}>SELECIONAR EXERCÍCIO</span>
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{exNames.map(n=><Tab key={n} active={selEx===n} onClick={()=>setSelEx(n)}>{n}</Tab>)}</div>
                </div>
                {selEx&&progressData.length>0&&(
                  <>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
                      {[['Carga máxima',progressData[progressData.length-1]?.maxLoad?progressData[progressData.length-1].maxLoad+' kg':'—'],['Melhor sessão (reps)',Math.max(...progressData.map(d=>d.totalReps))],['Sessões',progressData.length]].map(([k,v])=>(
                        <div key={k} style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:8,padding:'12px 16px',textAlign:'center'}}><div style={{fontFamily:"'Bebas Neue'",fontSize:24,color:ACC}}>{v}</div><div style={{fontSize:10,color:MUTED,textTransform:'uppercase',letterSpacing:1,marginTop:4}}>{k}</div></div>
                      ))}
                    </div>
                    <div style={st.sect}>
                      <span style={st.sectT}>CARGA MÁXIMA</span>
                      <ResponsiveContainer width="100%" height={200}><LineChart data={progressData} margin={{top:5,right:10,left:0,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke={BDR}/><XAxis dataKey="date" tick={{fill:MUTED,fontSize:11}}/><YAxis tick={{fill:MUTED,fontSize:11}} unit="kg" width={48}/><Tooltip contentStyle={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:6,color:TEXT,fontSize:12}}/><Line type="monotone" dataKey="maxLoad" name="Carga máx" stroke={ACC} strokeWidth={2.5} dot={{fill:ACC,r:4}} activeDot={{r:6}}/></LineChart></ResponsiveContainer>
                    </div>
                    <div style={st.sect}>
                      <span style={st.sectT}>TOTAL DE REPS POR SESSÃO</span>
                      <ResponsiveContainer width="100%" height={180}><LineChart data={progressData} margin={{top:5,right:10,left:0,bottom:5}}><CartesianGrid strokeDasharray="3 3" stroke={BDR}/><XAxis dataKey="date" tick={{fill:MUTED,fontSize:11}}/><YAxis tick={{fill:MUTED,fontSize:11}} width={40}/><Tooltip contentStyle={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:6,color:TEXT,fontSize:12}} formatter={(v)=>[v+' reps','']}/><Line type="monotone" dataKey="totalReps" name="Reps" stroke={WARN} strokeWidth={2} dot={{fill:WARN,r:3}}/></LineChart></ResponsiveContainer>
                    </div>
                  </>
                )}
                {selEx&&!progressData.length&&<div style={{...st.card,textAlign:'center',padding:'28px'}}><p style={{color:MUTED}}>Sem dados para "{selEx}".</p></div>}
                {!selEx&&<div style={{...st.card,textAlign:'center',padding:'28px'}}><p style={{color:MUTED}}>Selecione um exercício acima.</p></div>}
              </>
            )}
          </div>
        )}

        {/* COACH */}
        {view==='coach'&&(
          <div>
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:22}}>
              <h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:3,color:ACC,margin:0}}>PŌKAI — PROFESSOR</h1>
              <button style={{...st.btnS,marginLeft:'auto'}} onClick={loadCoach}>↻</button>
              <button style={st.btnG} onClick={()=>setView('login')}>← Sair</button>
            </div>
            <div style={{display:'flex',gap:8,marginBottom:22}}>
              <Tab active={coachTab==='alunos'} onClick={()=>setCoachTab('alunos')}>👥 Alunos ({allStudents.length})</Tab>
              <Tab active={coachTab==='templates'} onClick={()=>setCoachTab('templates')}>📋 Treinos ({templates.length})</Tab>
            </div>

            {loading&&<Spin/>}

            {!loading&&coachTab==='alunos'&&(
              <>
                {/* Resumo geral */}
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
                  {[
                    ['Total alunos',allStudents.length,ACC],
                    ['Ativos/semana',Object.values(studData).filter(ls=>{const c=new Date();c.setDate(c.getDate()-7);return ls.some(l=>new Date(l.date)>=c);}).length,ACC],
                    ['Alertas dor',Object.values(studData).reduce((a,ls)=>a+ls.filter(l=>hasPain(l)).length,0),DANGER],
                    ['Treinos totais',Object.values(studData).reduce((a,ls)=>a+ls.length,0),MUTED],
                  ].map(([k,v,c])=>(
                    <div key={k} style={{background:SURF,border:`1px solid ${c===DANGER&&v>0?c:BDR}`,borderRadius:8,padding:'12px',textAlign:'center'}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:26,color:c===DANGER&&v>0?c:c}}>{v}</div>
                      <div style={{fontSize:9,color:MUTED,textTransform:'uppercase',letterSpacing:1,marginTop:4}}>{k}</div>
                    </div>
                  ))}
                </div>

                {/* Comparativo radar */}
                {allStudents.length>0&&(
                  <div style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:12,padding:'20px',marginBottom:16}}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,color:ACC,marginBottom:16}}>COMPARATIVO DE VALÊNCIAS</div>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:12}}>
                      {allStudents.map((name,si)=>{
                        const sLogs=studData[name]||[];
                        const sProf=studProfiles[name]||{};
                        const val=calcValencias(sLogs,sProf);
                        const rdata=Object.entries(val).map(([k,v])=>({attr:VALENCIA_LABELS[k].slice(0,4),value:v}));
                        const colors=[ACC,'#5BC8F5','#FF6B9D','#FFB347','#A78BFA','#34D399'];
                        const color=colors[si%colors.length];
                        return(
                          <div key={name} style={{background:SURF2,borderRadius:10,padding:'14px'}}>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:14,letterSpacing:1,color:color,marginBottom:4}}>{name.split(' ')[0]}</div>
                            <div style={{display:'flex',gap:6,marginBottom:6,flexWrap:'wrap'}}>
                              {sLogs.some(l=>hasPain(l))&&<span style={{fontSize:9,padding:'2px 6px',background:'rgba(224,80,80,0.12)',color:DANGER,borderRadius:3,fontWeight:700}}>⚠️ Dor</span>}
                              <span style={{fontSize:9,padding:'2px 6px',background:'rgba(255,255,255,0.05)',color:MUTED,borderRadius:3}}>{sLogs.length} treinos</span>
                            </div>
                            <ResponsiveContainer width="100%" height={130}>
                              <RadarChart data={rdata}>
                                <PolarGrid stroke="rgba(255,255,255,0.06)"/>
                                <PolarAngleAxis dataKey="attr" tick={{fill:MUTED,fontSize:8}}/>
                                <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={1.5}/>
                              </RadarChart>
                            </ResponsiveContainer>
                            <div style={{marginTop:6,fontSize:11}}>
                              <span style={{color:color}}>💪 {Object.entries(val).sort((a,b)=>b[1]-a[1])[0]?.[0]?VALENCIA_LABELS[Object.entries(val).sort((a,b)=>b[1]-a[1])[0][0]]:''}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Ranking total reps */}
                {allStudents.length>1&&(
                  <div style={{background:SURF,border:`1px solid ${BDR}`,borderRadius:12,padding:'20px',marginBottom:16}}>
                    <div style={{fontFamily:"'Bebas Neue'",fontSize:16,letterSpacing:2,color:ACC,marginBottom:16}}>RANKING — TOTAL DE REPS (ÚLTIMOS 7 DIAS)</div>
                    {[...allStudents].sort((a,b)=>{
                      const cutoff=new Date();cutoff.setDate(cutoff.getDate()-7);
                      const ra=(studData[a]||[]).filter(l=>new Date(l.date)>=cutoff).reduce((s,l)=>s+totalReps(l),0);
                      const rb=(studData[b]||[]).filter(l=>new Date(l.date)>=cutoff).reduce((s,l)=>s+totalReps(l),0);
                      return rb-ra;
                    }).map((name,i)=>{
                      const cutoff=new Date();cutoff.setDate(cutoff.getDate()-7);
                      const reps=(studData[name]||[]).filter(l=>new Date(l.date)>=cutoff).reduce((s,l)=>s+totalReps(l),0);
                      const max=Math.max(...allStudents.map(n=>(studData[n]||[]).filter(l=>new Date(l.date)>=cutoff).reduce((s,l)=>s+totalReps(l),0)));
                      return(
                        <div key={name} style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                          <span style={{fontFamily:"'Bebas Neue'",fontSize:20,color:i===0?ACC:MUTED,width:24}}>{i+1}</span>
                          <span style={{flex:1,fontSize:13}}>{name}</span>
                          <div style={{flex:2,height:8,background:'rgba(255,255,255,0.06)',borderRadius:4,overflow:'hidden'}}>
                            <div style={{width:`${max>0?(reps/max)*100:0}%`,height:'100%',background:i===0?ACC:i===1?WARN:MUTED,borderRadius:4}}/>
                          </div>
                          <span style={{fontSize:12,fontFamily:"'JetBrains Mono',monospace",color:i===0?ACC:TEXT,width:70,textAlign:'right'}}>{reps} reps</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Cards individuais */}
                {allStudents.length===0&&<div style={{...st.card,textAlign:'center',padding:'48px',border:`2px dashed ${BDR}`}}><p style={{color:MUTED}}>Nenhum aluno ainda.</p></div>}
                {allStudents.map((name,si)=>{
                  const sLogs=studData[name]||[];
                  const sProf=studProfiles[name]||{};
                  const sWL=studWeightLogs[name]||[];
                  const last=sLogs[0];
                  const cutoff=new Date();cutoff.setDate(cutoff.getDate()-7);
                  const lastWeek=sLogs.filter(l=>new Date(l.date)>=cutoff).length;
                  const recentPain=sLogs.slice(0,5).some(l=>hasPain(l));
                  const painLogs=sLogs.filter(l=>hasPain(l));
                  const inactive=sLogs.length>0&&lastWeek===0;
                  const open=expandedStudent===name;
                  const prs={};sLogs.forEach(l=>l.exercises?.forEach(e=>{if(!e.name)return;const max=Math.max(...(e.sets||[]).filter(s=>s.completed&&s.load).map(s=>parseFloat(s.load)||0),0);if(!prs[e.name]||max>prs[e.name])prs[e.name]=max;}));
                  const val=calcValencias(sLogs,sProf);
                  const rdata=Object.entries(val).map(([k,v])=>({attr:VALENCIA_LABELS[k].slice(0,4),value:v}));
                  const colors=[ACC,'#5BC8F5','#FF6B9D','#FFB347','#A78BFA','#34D399'];
                  const color=colors[si%colors.length];
                  const imc2=sProf.weight&&sProf.height?(sProf.weight/((sProf.height/100)**2)).toFixed(1):null;
                  return(
                    <div key={name} style={{...st.card,border:`1px solid ${recentPain?'rgba(224,80,80,0.4)':BDR}`}}>
                      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',cursor:'pointer',flexWrap:'wrap',gap:8}} onClick={()=>setExpandedStudent(open?null:name)}>
                        <div style={{flex:1}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4,flexWrap:'wrap'}}>
                            <span style={{fontFamily:"'Bebas Neue'",fontSize:20,color:color}}>{name}</span>
                            {inactive&&<span style={st.tagD}>INATIVO</span>}
                            {lastWeek>0&&<span style={st.tag}>ATIVO</span>}
                            {recentPain&&<span style={st.tagD}>⚠️ DOR RECENTE</span>}
                          </div>
                          <div style={{fontSize:12,color:MUTED,display:'flex',gap:12,flexWrap:'wrap'}}>
                            <span>🏋️ {sLogs.length} treinos</span>
                            <span>🔥 {lastWeek}/sem</span>
                            {sProf.weight&&<span>⚖️ {sProf.weight}kg</span>}
                            {sProf.body_fat&&<span>📊 {sProf.body_fat}%</span>}
                            {imc2&&<span>IMC {imc2}</span>}
                            {last&&<span>📅 {last.date}</span>}
                          </div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:12}}>
                          {sLogs.length>0&&<div style={{width:80,height:80}}>
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart data={rdata}>
                                <PolarGrid stroke="rgba(255,255,255,0.06)"/>
                                <PolarAngleAxis dataKey="attr" tick={{fill:MUTED,fontSize:7}}/>
                                <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={1.5}/>
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>}
                          <span style={{color:MUTED,fontSize:18}}>{open?'▲':'▼'}</span>
                        </div>
                      </div>

                      {open&&(
                        <div style={{marginTop:16,borderTop:`1px solid ${BDR}`,paddingTop:16}}>
                          {/* Alertas de dor */}
                          {painLogs.length>0&&(
                            <div style={{background:'rgba(224,80,80,0.06)',border:`1px solid rgba(224,80,80,0.2)`,borderRadius:8,padding:'14px 16px',marginBottom:14}}>
                              <div style={{fontSize:11,color:DANGER,fontWeight:700,marginBottom:10}}>⚠️ HISTÓRICO DE DORES ({painLogs.length} sessões)</div>
                              {painLogs.slice(0,3).map((l,i)=>(
                                <div key={i} style={{marginBottom:8,paddingBottom:8,borderBottom:i<Math.min(painLogs.length,3)-1?`1px solid rgba(224,80,80,0.15)`:'none'}}>
                                  <div style={{fontSize:11,color:MUTED,marginBottom:4}}>{l.template_name} · {l.date}</div>
                                  {l.exercises?.map((ex,ei)=>ex.sets?.map((s,si2)=>s.notes&&PAIN_WORDS.some(w=>s.notes.toLowerCase().includes(w))&&(
                                    <div key={`${ei}-${si2}`} style={{fontSize:12,color:'#CCC'}}><span style={{color:MUTED}}>{ex.name} S{si2+1}:</span> {s.notes}</div>
                                  )))}
                                  {l.notes&&PAIN_WORDS.some(w=>l.notes.toLowerCase().includes(w))&&<div style={{fontSize:12,color:'#CCC'}}><span style={{color:MUTED}}>Obs:</span> {l.notes}</div>}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Valências detalhadas */}
                          <div style={{background:SURF2,borderRadius:8,padding:'14px 16px',marginBottom:14}}>
                            <div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:10,textTransform:'uppercase'}}>Valências</div>
                            <div style={{display:'flex',flexDirection:'column',gap:5}}>
                              {Object.entries(val).map(([k,v])=>(
                                <div key={k} style={{display:'flex',alignItems:'center',gap:10}}>
                                  <span style={{fontSize:10,color:MUTED,width:80,textTransform:'uppercase'}}>{VALENCIA_LABELS[k]}</span>
                                  <div style={{flex:1,height:5,background:'rgba(255,255,255,0.07)',borderRadius:3,overflow:'hidden'}}><div style={{width:`${v}%`,height:'100%',background:valenciaColor(v),borderRadius:3}}/></div>
                                  <span style={{fontSize:12,fontWeight:700,color:valenciaColor(v),width:24,textAlign:'right',fontFamily:"'JetBrains Mono',monospace"}}>{v}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Gráfico peso */}
                          {sWL.length>1&&(
                            <div style={{background:SURF2,borderRadius:8,padding:'14px 16px',marginBottom:14}}>
                              <div style={{fontSize:11,color:MUTED,letterSpacing:1,marginBottom:8,textTransform:'uppercase'}}>Evolução do Peso</div>
                              <ResponsiveContainer width="100%" height={100}>
                                <LineChart data={sWL} margin={{top:2,right:8,left:0,bottom:2}}>
                                  <XAxis dataKey="date" tick={{fill:MUTED,fontSize:9}} tickFormatter={d=>d.slice(5)}/>
                                  <YAxis tick={{fill:MUTED,fontSize:9}} unit="kg" width={40} domain={['auto','auto']}/>
                                  <Tooltip contentStyle={{background:BG,border:`1px solid ${BDR}`,fontSize:11}}/>
                                  <Line type="monotone" dataKey="weight" stroke={color} strokeWidth={2} dot={{fill:color,r:2}}/>
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          )}

                          {/* Último treino */}
                          {last&&(
                            <div style={{background:SURF2,padding:'14px 16px',borderRadius:8,marginBottom:14}}>
                              <div style={{fontSize:11,color:MUTED,marginBottom:10}}>ÚLTIMO TREINO — {last.template_name||'Treino'} · {last.date}</div>
                              <table style={{width:'100%',borderCollapse:'collapse'}}>
                                <thead><tr>{['Exercício','Planejado','Séries','Melhor carga'].map(h=><th key={h} style={{...st.th,fontSize:10}}>{h}</th>)}</tr></thead>
                                <tbody>
                                  {last.exercises?.filter(e=>e.name).map((ex,i)=>{const{done,total,maxLoad}=exSum(ex);return(
                                    <tr key={i}><td style={st.td}>{ex.name}</td><td style={{...st.td,fontSize:11,color:MUTED,fontFamily:"'JetBrains Mono',monospace"}}>{ex.planned?.sets}x{ex.planned?.reps}</td><td style={{...st.td,color:done<total?WARN:ACC}}>{done}/{total}</td><td style={{...st.td,color:ACC,fontFamily:"'JetBrains Mono',monospace"}}>{maxLoad?maxLoad+' kg':'—'}</td></tr>
                                  );})}
                                </tbody>
                              </table>
                              {last.highlights&&<div style={{marginTop:8,fontSize:12,color:ACC}}>✨ {last.highlights}</div>}
                              {last.notes&&<div style={{marginTop:4,fontSize:12,color:'#888',fontStyle:'italic'}}>💬 {last.notes}</div>}
                            </div>
                          )}

                          {/* PRs */}
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

            {!loading&&coachTab==='templates'&&!editTpl&&(
              <div>
                <div style={{display:'flex',gap:10,marginBottom:20}}>
                  <button style={st.btnP} onClick={()=>setEditTpl({id:null,name:'',description:'',exercises:[]})}>+ CADASTRAR MANUAL</button>
                  <button style={st.btnS} onClick={()=>{setShowImport(true);setImportState({loading:false,error:null,result:null});}}>📄 IMPORTAR VIA PDF</button>
                </div>
                {showImport&&(
                  <div style={{background:SURF,border:`1px solid ${ACC}`,borderRadius:12,padding:'24px',marginBottom:20}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                      <span style={{fontFamily:"'Bebas Neue'",fontSize:20,letterSpacing:2,color:ACC}}>IMPORTAR TREINO VIA PDF</span>
                      <button style={st.btnG} onClick={()=>setShowImport(false)}>✕</button>
                    </div>
                    <p style={{fontSize:13,color:MUTED,marginBottom:16}}>Suba um PDF com seu mural de treino. A IA extrai e monta os templates automaticamente.</p>
                    {!importState.loading&&!importState.result&&(
                      <label style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',border:`2px dashed ${BDR}`,borderRadius:10,padding:'40px',cursor:'pointer',background:SURF2}}>
                        <span style={{fontSize:32,marginBottom:12}}>📄</span>
                        <span style={{color:ACC,fontWeight:700,marginBottom:4}}>Clique para selecionar o PDF</span>
                        <span style={{fontSize:12,color:MUTED}}>ou arraste o arquivo aqui</span>
                        <input type="file" accept=".pdf" style={{display:'none'}} onChange={e=>e.target.files[0]&&importFromPDF(e.target.files[0])}/>
                      </label>
                    )}
                    {importState.loading&&<div style={{textAlign:'center',padding:'40px'}}><div style={{width:40,height:40,border:`3px solid ${BDR}`,borderTop:`3px solid ${ACC}`,borderRadius:'50%',animation:'spin 0.8s linear infinite',margin:'0 auto 16px'}}/><p style={{color:MUTED}}>Analisando PDF com IA...</p><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>}
                    {importState.error&&<div style={{background:'#1A0000',border:`1px solid #330000`,borderRadius:8,padding:'16px',color:DANGER,fontSize:13}}>⚠️ {importState.error}<br/><button style={{...st.btnS,marginTop:10,fontSize:12}} onClick={()=>setImportState({loading:false,error:null,result:null})}>Tentar novamente</button></div>}
                    {importState.result&&(
                      <div>
                        <div style={{fontSize:13,color:ACC,marginBottom:14,fontWeight:700}}>✅ {importState.result.length} treino{importState.result.length!==1?'s':''} encontrado{importState.result.length!==1?'s':''}. Revise:</div>
                        {importState.result.map((t,i)=>(
                          <div key={i} style={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:8,padding:'16px',marginBottom:10}}>
                            <div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:ACC,marginBottom:4}}>{t.name}</div>
                            {t.description&&<div style={{fontSize:12,color:MUTED,marginBottom:8}}>{t.description}</div>}
                            {t.exercises.map((ex,j)=>(
                              <div key={j} style={{display:'flex',justifyContent:'space-between',fontSize:12,padding:'4px 0',borderBottom:`1px solid ${BDR}`}}>
                                <span style={{color:'#CCC'}}>{ex.name}</span>
                                <span style={{fontFamily:"'JetBrains Mono',monospace",color:MUTED}}>{ex.plannedSets}x{ex.plannedReps}{ex.plannedLoad?' @ '+ex.plannedLoad:''}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                        <div style={{display:'flex',gap:10,marginTop:16}}>
                          <button style={st.btnS} onClick={()=>setImportState({loading:false,error:null,result:null})}>↩ Reimportar</button>
                          <button style={st.btnP} onClick={()=>confirmImport(importState.result)}>💾 SALVAR TODOS</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {templates.length===0&&<div style={{...st.card,textAlign:'center',padding:'48px',border:`2px dashed ${BDR}`}}><p style={{color:MUTED}}>Nenhum treino. Crie o Treino A, B, C...</p></div>}
                {templates.map(tpl=>(
                  <div key={tpl.id} style={{...st.card,display:'flex',alignItems:'flex-start',gap:14}}>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"'Bebas Neue'",fontSize:22,letterSpacing:2,color:ACC,marginBottom:4}}>{tpl.name}</div>
                      {tpl.description&&<div style={{fontSize:12,color:MUTED,marginBottom:8}}>{tpl.description}</div>}
                      <div style={{fontSize:12,color:'#888'}}>{tpl.exercises.map((ex,i)=><span key={i} style={{marginRight:12}}>{ex.name} <span style={{fontFamily:"'JetBrains Mono',monospace",color:MUTED}}>{ex.plannedSets}x{ex.plannedReps}</span></span>)}</div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <button style={st.btnS} onClick={()=>setEditTpl(tpl)}>Editar</button>
                      <button style={st.btnD} onClick={()=>deleteTpl(tpl.id)}>Excluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!loading&&coachTab==='templates'&&editTpl&&(
              <TemplateForm tpl={editTpl} onSave={saveTpl} onCancel={()=>setEditTpl(null)} styles={{st,EMPTY_TPL_EX,ACC,BDR,SURF2,MUTED,DANGER}}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileSetup({name,onSave,loading,styles}){
  const{st,ACC,MUTED,BDR,SURF2}=styles;
  const[form,setForm]=useState({age:'',height:'',weight:'',body_fat:''});
  const upd=(f,v)=>setForm(p=>({...p,[f]:v}));
  return(
    <div style={{maxWidth:500,margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:32}}>
        <div style={{fontFamily:"'Bebas Neue'",fontSize:32,letterSpacing:3,color:ACC}}>CADASTRO DO ATLETA</div>
        <p style={{color:MUTED,fontSize:14}}>Olá, <strong style={{color:'#FFF'}}>{name}</strong>! Complete seu perfil.</p>
      </div>
      <div style={st.sect}>
        <span style={st.sectT}>DADOS PESSOAIS</span>
        <div style={st.g2}>
          <div style={st.fld}><label style={st.lbl}>Idade</label><input type="number" min="10" max="80" placeholder="Ex: 28" style={st.inp} value={form.age} onChange={e=>upd('age',e.target.value)}/></div>
          <div style={st.fld}><label style={st.lbl}>Altura (cm)</label><input type="number" placeholder="Ex: 175" style={st.inp} value={form.height} onChange={e=>upd('height',e.target.value)}/></div>
        </div>
        <div style={st.g2}>
          <div style={st.fld}><label style={st.lbl}>Peso atual (kg)</label><input type="number" step="0.1" placeholder="Ex: 75.5" style={st.inp} value={form.weight} onChange={e=>upd('weight',e.target.value)}/></div>
          <div style={st.fld}><label style={st.lbl}>% Gordura (opcional)</label><input type="number" step="0.1" placeholder="Ex: 18.5" style={st.inp} value={form.body_fat} onChange={e=>upd('body_fat',e.target.value)}/></div>
        </div>
      </div>
      <button style={{...st.btnP,width:'100%',padding:'14px',fontSize:16}} onClick={()=>onSave({age:form.age?parseInt(form.age):null,height:form.height?parseFloat(form.height):null,weight:form.weight?parseFloat(form.weight):null,body_fat:form.body_fat?parseFloat(form.body_fat):null})} disabled={loading}>
        {loading?'SALVANDO...':'ENTRAR NA MATILHA 🐺'}
      </button>
    </div>
  );
}

function TemplateForm({tpl,onSave,onCancel,styles}){
  const{st,EMPTY_TPL_EX,ACC,BDR,SURF2,MUTED,DANGER}=styles;
  const[form,setForm]=useState({...tpl});
  const addEx=()=>setForm(p=>({...p,exercises:[...p.exercises,{...EMPTY_TPL_EX}]}));
  const removeEx=i=>setForm(p=>({...p,exercises:p.exercises.filter((_,j)=>j!==i)}));
  const updEx=(i,f,v)=>setForm(p=>({...p,exercises:p.exercises.map((e,j)=>j===i?{...e,[f]:v}:e)}));
  const moveEx=(i,dir)=>{const exs=[...form.exercises];const to=i+dir;if(to<0||to>=exs.length)return;[exs[i],exs[to]]=[exs[to],exs[i]];setForm(p=>({...p,exercises:exs}));};
  return(
    <div>
      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:22}}>
        <button style={st.btnG} onClick={onCancel}>← Voltar</button>
        <h2 style={{fontFamily:"'Bebas Neue'",fontSize:24,letterSpacing:3,color:ACC,margin:0}}>{form.id?'EDITAR TREINO':'NOVO TREINO'}</h2>
      </div>
      <div style={st.sect}>
        <span style={st.sectT}>IDENTIFICAÇÃO</span>
        <div style={st.g2}>
          <div style={st.fld}><label style={st.lbl}>Nome</label><input style={st.inp} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Treino A"/></div>
          <div style={st.fld}><label style={st.lbl}>Descrição</label><input style={st.inp} value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} placeholder="Ex: Membros inferiores"/></div>
        </div>
      </div>
      <div style={st.sect}>
        <span style={st.sectT}>EXERCÍCIOS</span>
        {form.exercises.map((ex,i)=>(
          <div key={i} style={{background:SURF2,border:`1px solid ${BDR}`,borderRadius:8,padding:'16px',marginBottom:12}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
              <span style={{fontFamily:"'Bebas Neue'",fontSize:16,color:ACC,minWidth:24}}>{i+1}</span>
              <input placeholder="Nome do exercício" style={{...st.inp,flex:1,fontWeight:600}} value={ex.name} onChange={e=>updEx(i,'name',e.target.value)}/>
              <button style={{...st.btnG,padding:'4px 8px',fontSize:16}} onClick={()=>moveEx(i,-1)}>↑</button>
              <button style={{...st.btnG,padding:'4px 8px',fontSize:16}} onClick={()=>moveEx(i,1)}>↓</button>
              <button style={st.btnD} onClick={()=>removeEx(i)}>✕</button>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 2fr',gap:10}}>
              <div style={st.fld}><label style={st.lbl}>Séries</label><input type="number" min="1" max="10" style={st.inp} value={ex.plannedSets} onChange={e=>updEx(i,'plannedSets',Number(e.target.value))}/></div>
              <div style={st.fld}><label style={st.lbl}>Reps</label><input placeholder="8-10" style={st.inp} value={ex.plannedReps} onChange={e=>updEx(i,'plannedReps',e.target.value)}/></div>
              <div style={st.fld}><label style={st.lbl}>Carga ref.</label><input placeholder="60kg" style={st.inp} value={ex.plannedLoad} onChange={e=>updEx(i,'plannedLoad',e.target.value)}/></div>
              <div style={st.fld}><label style={st.lbl}>Dica técnica</label><input placeholder="Joelhos alinhados..." style={st.inp} value={ex.cues} onChange={e=>updEx(i,'cues',e.target.value)}/></div>
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
