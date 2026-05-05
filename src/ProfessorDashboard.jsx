import { useState, useEffect } from "react";

const SB_URL='https://xvyvqmvcjwvedfkdygco.supabase.co';
const SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2eXZxbXZjand2ZWRma2R5Z2NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwNjI1MDQsImV4cCI6MjA5MjYzODUwNH0.WYunV6-RzcxuVGjrp5jMLo5Lsyi1OHxYVRXC7ktvJfY';
const HDR={'apikey':SB_KEY,'Authorization':`Bearer ${SB_KEY}`,'Content-Type':'application/json'};

const sb={
  async get(t,q=''){try{const r=await fetch(`${SB_URL}/rest/v1/${t}?${q}`,{headers:HDR});if(!r.ok)return null;return r.json();}catch{return null;}},
  async upsert(t,d){try{const r=await fetch(`${SB_URL}/rest/v1/${t}`,{method:'POST',headers:{...HDR,'Prefer':'resolution=merge-duplicates,return=representation'},body:JSON.stringify(d)});return r.ok;}catch{return false;}},
};

const ACC='#8DC63F',BG='#060606',SURF2='#181818',BDR='#272727';
const TEXT='#F2F2F0',MUTED='#666660',WARN='#E8A020',DANGER='#E05050',INFO='#5BC8F5';
const MONTHS=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const HORARIOS=['07:00','08:00','09:00','10:00','18:00','19:00'];
const DIAS=['Segunda','Terça','Quarta','Quinta','Sexta'];
const CAP=12;
const TODAY=new Date();

const diffDays=v=>{if(!v||v==='—')return 999;return Math.floor((new Date(v)-TODAY)/(864e5));};
const getVencimento=a=>{
  if(!a.dia_venc)return'—';
  const y=TODAY.getFullYear(),m=TODAY.getMonth()+1;
  const dia=Math.min(a.dia_venc,new Date(y,m,0).getDate());
  return`${y}-${String(m).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
};
const getValor=(a,planos)=>planos.find(p=>p.id===a.plano)?.valor||0;
const gerarPix=(chave,valor,benef)=>{
  const v=parseFloat(valor).toFixed(2);
  return`00020126580014br.gov.bcb.pix0136${chave}5204000053039865406${v}5802BR5915${benef.slice(0,15).padEnd(15)}6009SAO PAULO62140510POKAI${Date.now().toString().slice(-6)}6304ABCD`;
};

const PLANOS_DEFAULT=[
  {id:'2x',nome:'2x na semana',valor:130},
  {id:'3x',nome:'3x na semana',valor:180},
  {id:'5x',nome:'5x na semana',valor:250},
];
const LANC_INIT=[
  {data:'2026-05-02',desc:'Mensalidade Rafael Torres',valor:250,tipo:'entrada'},
  {data:'2026-05-01',desc:'Aluguel da sala',valor:1200,tipo:'saida'},
  {data:'2026-05-03',desc:'Equipamentos',valor:350,tipo:'saida'},
  {data:'2026-04-25',desc:'Energia elétrica',valor:280,tipo:'saida'},
];

const s={
  card:{background:'rgba(15,15,15,0.9)',border:`1px solid ${BDR}`,borderRadius:12,padding:'14px 16px',marginBottom:10},
  tag: {display:'inline-block',padding:'2px 8px',background:'rgba(141,198,63,0.15)',color:ACC,borderRadius:3,fontSize:10,fontWeight:700},
  tagD:{display:'inline-block',padding:'2px 8px',background:'rgba(224,80,80,0.15)',color:DANGER,borderRadius:3,fontSize:10,fontWeight:700},
  tagW:{display:'inline-block',padding:'2px 8px',background:'rgba(232,160,32,0.15)',color:WARN,borderRadius:3,fontSize:10,fontWeight:700},
  tagI:{display:'inline-block',padding:'2px 8px',background:'rgba(91,200,245,0.15)',color:INFO,borderRadius:3,fontSize:10,fontWeight:700},
  btnP:{padding:'7px 16px',background:ACC,color:'#000',border:'none',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:700},
  btnS:{padding:'6px 12px',background:SURF2,color:TEXT,border:`1px solid ${BDR}`,borderRadius:6,cursor:'pointer',fontSize:11},
  btnD:{padding:'5px 10px',background:'#1A0000',color:DANGER,border:`1px solid #330000`,borderRadius:5,cursor:'pointer',fontSize:11},
  th:  {textAlign:'left',padding:'7px 10px',background:'rgba(141,198,63,0.07)',color:ACC,fontSize:9,fontWeight:700,letterSpacing:1},
  td:  {padding:'7px 10px',borderBottom:`1px solid ${BDR}`,fontSize:11,color:'#CCC'},
  inp: {width:'100%',background:SURF2,border:`1px solid #333`,color:TEXT,padding:'8px 10px',borderRadius:5,fontSize:13,outline:'none',boxSizing:'border-box'},
  lbl: {display:'block',fontSize:9,color:MUTED,marginBottom:4,textTransform:'uppercase',letterSpacing:1},
  hd:  {fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:2,color:ACC,marginBottom:8},
};

const TABS=['📊 Resumo','👥 Alunos','💰 Financeiro','📅 Agenda','⚙️ Config'];

// Aviso para criar a tabela no Supabase
function SetupBanner(){
  const[show,setShow]=useState(true);
  if(!show)return null;
  return(
    <div style={{...s.card,border:`1px solid ${WARN}`,marginBottom:14}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div style={{...s.hd,color:WARN,marginBottom:6}}>⚙️ CONFIGURAÇÃO NECESSÁRIA</div>
        <button onClick={()=>setShow(false)} style={{background:'none',border:'none',color:MUTED,cursor:'pointer',fontSize:16}}>✕</button>
      </div>
      <p style={{fontSize:11,color:MUTED,marginBottom:10,lineHeight:1.6}}>
        Para salvar dados de gestão (plano, vencimento, WhatsApp, turmas) crie a tabela <strong style={{color:WARN}}>gestao</strong> no Supabase.<br/>
        Acesse <strong style={{color:INFO}}>supabase.com → SQL Editor</strong> e execute o SQL abaixo:
      </p>
      <div style={{background:BG,borderRadius:8,padding:'10px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:'#aaa',lineHeight:1.8,marginBottom:8,overflow:'auto'}}>
        {`create table if not exists gestao (\n  student_id text primary key,\n  nasc text,\n  tel text,\n  plano text default '3x',\n  dia_venc integer default 10,\n  pago boolean default false,\n  ativo boolean default true,\n  turmas jsonb default '[]',\n  faltas jsonb default '{}'\n);`}
      </div>
      <button style={{...s.btnS,fontSize:10}} onClick={()=>{navigator.clipboard?.writeText(`create table if not exists gestao (\n  student_id text primary key,\n  nasc text,\n  tel text,\n  plano text default '3x',\n  dia_venc integer default 10,\n  pago boolean default false,\n  ativo boolean default true,\n  turmas jsonb default '[]',\n  faltas jsonb default '{}'\n);`);alert('SQL copiado!');}}>
        📋 Copiar SQL
      </button>
    </div>
  );
}

export default function ProfessorDashboard({allStudents=[],studProfiles={}}){
  const[tab,setTab]           =useState(0);
  const[gestao,setGestao]     =useState({});        // dados do Supabase por student_id
  const[tableExists,setTableExists]=useState(true);
  const[planos,setPlanos]     =useState(PLANOS_DEFAULT);
  const[lanc]                 =useState(LANC_INIT);
  const[selAluno,setSelAluno] =useState(null);
  const[agSel,setAgSel]       =useState(null);
  const[showPix,setShowPix]   =useState(null);
  const[expandIns,setExpandIns]=useState(false);
  const[editVenc,setEditVenc] =useState(null);
  const[addingFalta,setAddingFalta]=useState(null);
  const[faltaData,setFaltaData]=useState('');
  const[pixChave,setPixChave] =useState('pokai@ct.com.br');
  const[pixBenef,setPixBenef] =useState('Pōkai CT');
  const[showPixCfg,setShowPixCfg]=useState(false);
  const[showNovoAluno,setShowNovoAluno]=useState(false);
  const[showNovoPlan,setShowNovoPlan]=useState(false);
  const[editPlan,setEditPlan] =useState(null);
  const[novoPlan,setNovoPlan] =useState({nome:'',valor:''});
  const[novoAluno,setNovoAluno]=useState({nome:'',nasc:'',tel:'',plano:'3x',dia_venc:10,turmas:[]});
  const[vencInput,setVencInput]=useState('');
  const[saving,setSaving]     =useState(null);
  const[editingAluno,setEditingAluno]=useState(null); // id do aluno em edição
  const[editForm,setEditForm] =useState({});          // dados do form de edição
  const[confirmDel,setConfirmDel]=useState(null);     // id aguardando confirmação de exclusão

  // Carrega dados de gestão do Supabase
  useEffect(()=>{
    sb.get('gestao','order=student_id.asc').then(data=>{
      if(data===null){setTableExists(false);return;}
      const map={};
      (data||[]).forEach(g=>{map[g.student_id]=g;});
      setGestao(map);
    });
  },[]);

  // Alunos = lista real do Supabase + dados de gestão mesclados
  const alunos = allStudents.map(name=>({
    id:name,
    nome:name,
    nasc:gestao[name]?.nasc||'',
    tel:gestao[name]?.tel||'',
    plano:gestao[name]?.plano||'3x',
    dia_venc:gestao[name]?.dia_venc||10,
    pago:gestao[name]?.pago||false,
    ativo:gestao[name]?.ativo!==false,
    turmas:gestao[name]?.turmas||[],
    faltas:gestao[name]?.faltas||{},
    // dados de perfil do app
    peso:studProfiles[name]?.weight,
    altura:studProfiles[name]?.height,
  }));

  // Salva campo de gestão no Supabase
  const saveGestao=async(name,fields)=>{
    setSaving(name);
    const cur=gestao[name]||{student_id:name,plano:'3x',dia_venc:10,pago:false,ativo:true,turmas:[],faltas:{}};
    const updated={...cur,...fields,student_id:name};
    const ok=await sb.upsert('gestao',updated);
    if(ok){setGestao(p=>({...p,[name]:updated}));}
    setSaving(null);
    return ok;
  };

  const togglePago=async(a)=>{
    await saveGestao(a.id,{pago:!a.pago});
  };
  const saveVenc=async(id)=>{
    const v=parseInt(vencInput);
    if(v>=1&&v<=28)await saveGestao(id,{dia_venc:v});
    setEditVenc(null);
  };
  const addFalta=async(id,data)=>{
    if(!data)return;
    const a=alunos.find(x=>x.id===id);
    const f={...(a?.faltas||{}),[data]:true};
    await saveGestao(id,{faltas:f});
    setAddingFalta(null);setFaltaData('');
  };
  const remFalta=async(id,data)=>{
    const a=alunos.find(x=>x.id===id);
    const f={...(a?.faltas||{})};delete f[data];
    await saveGestao(id,{faltas:f});
  };
  const toggleTurma=(key)=>{
    setNovoAluno(p=>({...p,turmas:p.turmas.includes(key)?p.turmas.filter(t=>t!==key):[...p.turmas,key]}));
  };
  const salvarNovoAluno=async()=>{
    if(!novoAluno.nome.trim()) return;
    // Cria o aluno na tabela students (permite login no app)
    await sb.upsert('students',{id:novoAluno.nome.trim(),name:novoAluno.nome.trim()});
    // Salva os dados de gestão
    await saveGestao(novoAluno.nome.trim(),{nasc:novoAluno.nasc,tel:novoAluno.tel,plano:novoAluno.plano,dia_venc:novoAluno.dia_venc,turmas:novoAluno.turmas,ativo:true,pago:false,faltas:{}});
    setShowNovoAluno(false);
    setNovoAluno({nome:'',nasc:'',tel:'',plano:'3x',dia_venc:10,turmas:[]});
  };
  const salvarGestaoAluno=async(id,field,value)=>{
    await saveGestao(id,{[field]:value});
  };

  const abrirEdicao=(a)=>{
    setEditingAluno(a.id);
    setEditForm({tel:a.tel,nasc:a.nasc,plano:a.plano,dia_venc:a.dia_venc,ativo:a.ativo,turmas:[...a.turmas]});
    setSelAluno(a.id);
  };
  const toggleTurmaEdit=(key)=>{
    setEditForm(p=>({...p,turmas:p.turmas.includes(key)?p.turmas.filter(t=>t!==key):[...p.turmas,key]}));
  };
  const salvarEdicao=async(id)=>{
    await saveGestao(id,editForm);
    setEditingAluno(null);
  };
  const excluirAluno=async(id)=>{
    setSaving(id);
    // Remove da tabela gestao
    await fetch(`${SB_URL}/rest/v1/gestao?student_id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:HDR});
    // Remove da tabela students (cancela acesso ao app)
    await fetch(`${SB_URL}/rest/v1/students?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',headers:HDR});
    setGestao(p=>{const n={...p};delete n[id];return n;});
    setConfirmDel(null);setSelAluno(null);setSaving(null);
  };
  const salvarPlano=()=>{
    if(!novoPlan.nome||!novoPlan.valor)return;
    if(editPlan){setPlanos(p=>p.map(pl=>pl.id===editPlan?{...pl,...novoPlan}:pl));}
    else{setPlanos(p=>[...p,{id:novoPlan.nome.replace(/\s/g,'-').toLowerCase(),nome:novoPlan.nome,valor:parseFloat(novoPlan.valor)}]);}
    setShowNovoPlan(false);setEditPlan(null);setNovoPlan({nome:'',valor:''});
  };
  const waLink=(a,msg)=>`https://wa.me/${a.tel}?text=${encodeURIComponent(msg)}`;

  // Derivados
  const turmaMap={};
  alunos.forEach(a=>(a.turmas||[]).forEach(t=>{if(!turmaMap[t])turmaMap[t]=[];turmaMap[t].push(a);}));
  const ativos    =alunos.filter(a=>a.ativo);
  const atrasados =ativos.filter(a=>!a.pago&&diffDays(getVencimento(a))<0);
  const entradas  =lanc.filter(e=>e.tipo==='entrada').reduce((a,e)=>a+e.valor,0);
  const saidas    =lanc.filter(e=>e.tipo==='saida').reduce((a,e)=>a+e.valor,0);
  const potencial =ativos.reduce((a,al)=>a+getValor(al,planos),0);
  const inadimp   =ativos.filter(a=>!a.pago).reduce((a,al)=>a+getValor(al,planos),0);
  const ticket    =ativos.length?Math.round(potencial/ativos.length):0;
  const custo     =ativos.length?Math.round(saidas/ativos.length):0;
  const reserva   =3200;
  const totalVagas=(DIAS.length*HORARIOS.length+1)*CAP;
  const totalOcup =Object.values(turmaMap).reduce((a,v)=>a+v.filter(al=>al.ativo).length,0);
  const ocup      =totalVagas?Math.round((totalOcup/totalVagas)*100):0;
  const churnRisk =ativos.filter(a=>{const esp={'2x':8,'3x':12,'5x':20}[a.plano]||12;return Object.keys(a.faltas||{}).length>esp*0.5;});
  const aniver    =alunos.filter(a=>a.nasc&&parseInt(a.nasc.split('-')[1])===TODAY.getMonth()+1);

  const INSIGHTS=[
    {e:'💸',t:'Custo por aluno',d:`Despesas R$${saidas}/mês ÷ ${ativos.length} ativos = R$${custo}/aluno. Ticket médio R$${ticket}. Margem: R$${ticket-custo}/aluno/mês.`,c:INFO},
    {e:'⚠️',t:`Risco de churn (${churnRisk.length})`,d:churnRisk.length?`${churnRisk.map(a=>a.nome.split(' ')[0]).join(', ')} com muitas faltas. Contate-os esta semana.`:'Nenhum aluno em risco!',c:churnRisk.length?DANGER:ACC},
    {e:'📊',t:`Ocupação: ${ocup}%`,d:`${totalOcup} alunos em ${Object.keys(turmaMap).length} turmas. Cada vaga livre = R$${ticket} não capturado.`,c:ocup<50?DANGER:ocup<75?WARN:ACC},
    {e:'🎂',t:`Aniversariantes (${aniver.length})`,d:aniver.length?`${aniver.map(a=>a.nome.split(' ')[0]).join(', ')} fazem aniversário em ${MONTHS[TODAY.getMonth()]}.`:'Nenhum aniversariante este mês.',c:INFO},
    {e:'🎯',t:'Plano anual',d:`Desconto de 10% no anual = R$${Math.round(ticket*12*0.9)} garantidos/aluno. Converte inadimplentes em pagamento antecipado.`,c:WARN},
    {e:'🏦',t:'Meta de reserva',d:`Reserva R$${reserva} = ${saidas?Math.round((reserva/saidas)*100):0}% de 1 mês. Meta ideal: 3 meses = R$${(saidas*3).toLocaleString('pt-BR')}.`,c:reserva<saidas*3?WARN:ACC},
    {e:'📈',t:'Sazonalidade',d:'Janeiro/março: pico de matrículas. Julho/agosto: queda. Planeje promoção "Volta ao treino" em julho.',c:MUTED},
    {e:'🔄',t:'Retenção',d:`Cada cancelamento = R$${ticket*12}/ano perdido. Contate ausentes por 2 semanas antes de cancelarem.`,c:INFO},
  ];

  return(
    <div style={{fontFamily:"'Outfit',sans-serif",color:TEXT}}>

      {!tableExists&&<SetupBanner/>}

      {/* Sub-tabs */}
      <div style={{display:'flex',gap:3,background:SURF2,borderRadius:999,padding:3,border:`1px solid ${BDR}`,marginBottom:14}}>
        {TABS.map((t,i)=>(
          <button key={i} onClick={()=>setTab(i)} style={{flex:1,padding:'6px 2px',borderRadius:999,border:'none',cursor:'pointer',fontSize:10,fontWeight:700,background:tab===i?ACC:'transparent',color:tab===i?'#000':MUTED,transition:'all 0.2s'}}>
            {t}
          </button>
        ))}
      </div>

      {atrasados.length>0&&(
        <div style={{background:'rgba(224,80,80,0.08)',border:`1px solid rgba(224,80,80,0.3)`,borderRadius:8,padding:'8px 12px',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
          <span style={{fontSize:11,color:DANGER,fontWeight:700}}>⚠️ {atrasados.length} pagamento{atrasados.length>1?'s':''} atrasado{atrasados.length>1?'s':''}</span>
          <button style={{...s.btnS,fontSize:10,borderColor:DANGER,color:DANGER,padding:'3px 8px'}} onClick={()=>setTab(0)}>Ver</button>
        </div>
      )}

      {/* ── RESUMO ── */}
      {tab===0&&<div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
          {[['👥 Alunos ativos',ativos.length,ACC],['💰 Receita potencial',`R$${potencial}`,ACC],['⚠️ Inadimplência',`R$${inadimp}`,WARN],['🏦 Reserva',`R$${reserva.toLocaleString('pt-BR')}`,INFO]].map(([k,v,c])=>(
            <div key={k} style={{...s.card,textAlign:'center'}}>
              <div style={{fontSize:10,color:MUTED,marginBottom:3}}>{k}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:c}}>{v}</div>
            </div>
          ))}
        </div>

        <div style={s.card}>
          <div style={s.hd}>SAÚDE FINANCEIRA — {MONTHS[TODAY.getMonth()].toUpperCase()}</div>
          {[['Potencial',potencial,potencial,ACC],['Recebido',entradas,potencial,ACC],['Pendente',inadimp,potencial,WARN],['Despesas',saidas,potencial,DANGER]].map(([l,v,mx,c])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <span style={{fontSize:10,color:MUTED,width:62}}>{l}</span>
              <div style={{flex:1,height:7,background:'rgba(255,255,255,0.06)',borderRadius:4,overflow:'hidden'}}>
                <div style={{width:`${mx?Math.min(100,(v/mx)*100):0}%`,height:'100%',background:c,borderRadius:4}}/>
              </div>
              <span style={{fontSize:10,color:c,width:54,textAlign:'right',fontFamily:"'JetBrains Mono',monospace"}}>R${v}</span>
            </div>
          ))}
          <div style={{paddingTop:8,borderTop:`1px solid ${BDR}`,display:'flex',justifyContent:'space-between',fontSize:11}}>
            <span style={{color:MUTED}}>Saldo líquido</span>
            <span style={{color:entradas-saidas>=0?ACC:DANGER,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}>R${entradas-saidas}</span>
          </div>
        </div>

        {atrasados.length>0&&<div style={{...s.card,border:`1px solid rgba(224,80,80,0.3)`}}>
          <div style={{...s.hd,color:DANGER}}>⚠️ PAGAMENTOS ATRASADOS</div>
          {atrasados.map(a=>(
            <div key={a.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:`1px solid ${BDR}`,flexWrap:'wrap',gap:6}}>
              <div>
                <span style={{fontSize:12}}>{a.nome}</span>
                <span style={{fontSize:10,color:DANGER,marginLeft:6}}>{Math.abs(diffDays(getVencimento(a)))}d atraso</span>
              </div>
              <div style={{display:'flex',gap:5}}>
                <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:DANGER}}>R${getValor(a,planos)}</span>
                <button onClick={()=>setShowPix(a)} style={s.btnS}>💳 PIX</button>
                {a.tel&&<button onClick={()=>window.open(waLink(a,`Olá ${a.nome.split(' ')[0]}! 👋 Sua mensalidade Pōkai de R$${getValor(a,planos)} está em atraso há ${Math.abs(diffDays(getVencimento(a)))} dias. Qualquer dúvida, estamos aqui!`),'_blank')} style={{...s.btnS,borderColor:'#25D366',color:'#25D366'}}>📱 WA</button>}
                <button onClick={()=>togglePago(a)} style={{...s.btnS,borderColor:ACC,color:ACC,fontSize:10}}>✅ Marcar pago</button>
              </div>
            </div>
          ))}
        </div>}

        <div style={{...s.card,border:`1px solid rgba(91,200,245,0.2)`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10,cursor:'pointer'}} onClick={()=>setExpandIns(v=>!v)}>
            <span style={{...s.hd,marginBottom:0,color:INFO}}>💡 O QUE VOCÊ PODE ESTAR PERDENDO</span>
            <span style={{color:MUTED,fontSize:14}}>{expandIns?'▲':'▼'}</span>
          </div>
          {(expandIns?INSIGHTS:INSIGHTS.slice(0,3)).map((ins,i)=>(
            <div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${BDR}`}}>
              <div style={{fontSize:12,fontWeight:600,color:ins.c,marginBottom:2}}>{ins.e} {ins.t}</div>
              <div style={{fontSize:11,color:MUTED,lineHeight:1.5}}>{ins.d}</div>
            </div>
          ))}
          {!expandIns&&<button style={{...s.btnS,width:'100%',marginTop:8,fontSize:11}} onClick={()=>setExpandIns(true)}>Ver todos os {INSIGHTS.length} insights →</button>}
        </div>
      </div>}

      {/* ── ALUNOS ── */}
      {tab===1&&<div>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:2,color:ACC}}>
            ALUNOS ({allStudents.length})
            {allStudents.length===0&&<span style={{fontSize:11,color:MUTED,marginLeft:8,fontFamily:"'Outfit',sans-serif",letterSpacing:0}}>— nenhum aluno registrado ainda</span>}
          </div>
          <button style={s.btnP} onClick={()=>setShowNovoAluno(v=>!v)}>+ Adicionar dados</button>
        </div>

        {showNovoAluno&&<div style={{...s.card,border:`1px solid ${ACC}`,marginBottom:12}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:ACC,marginBottom:12}}>DADOS DE GESTÃO — ALUNO</div>
          <p style={{fontSize:11,color:MUTED,marginBottom:10}}>
            Digite o nome completo do aluno. Se ele ainda não existe no app, será criado e poderá entrar pelo nome.
            Se já existe, selecione abaixo para preencher automaticamente.
          </p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div style={{gridColumn:'1/-1'}}>
              <label style={s.lbl}>Nome completo do aluno</label>
              <input style={s.inp} value={novoAluno.nome} onChange={e=>setNovoAluno(p=>({...p,nome:e.target.value}))} placeholder="Nome completo (exato)"/>
              {allStudents.length>0&&<select style={{...s.inp,marginTop:6,fontSize:11,color:MUTED}} value="" onChange={e=>e.target.value&&setNovoAluno(p=>({...p,nome:e.target.value}))}>
                <option value="">↑ Ou selecione um já cadastrado no app...</option>
                {allStudents.map(n=><option key={n} value={n}>{n}</option>)}
              </select>}
            </div>
            <div><label style={s.lbl}>Data de nascimento</label><input type="date" style={s.inp} value={novoAluno.nasc} onChange={e=>setNovoAluno(p=>({...p,nasc:e.target.value}))}/></div>
            <div><label style={s.lbl}>WhatsApp (55+DDD+número)</label><input style={s.inp} value={novoAluno.tel} onChange={e=>setNovoAluno(p=>({...p,tel:e.target.value}))} placeholder="5563999990000"/></div>
            <div><label style={s.lbl}>Dia vencimento (1–28)</label><input type="number" min="1" max="28" style={s.inp} value={novoAluno.dia_venc} onChange={e=>setNovoAluno(p=>({...p,dia_venc:parseInt(e.target.value)}))}/></div>
            <div><label style={s.lbl}>Plano</label>
              <select style={s.inp} value={novoAluno.plano} onChange={e=>setNovoAluno(p=>({...p,plano:e.target.value}))}>
                {planos.map(p=><option key={p.id} value={p.id}>{p.nome} — R${p.valor}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:10}}>
            <label style={s.lbl}>Turmas fixas</label>
            {HORARIOS.map(h=>(
              <div key={h} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                <span style={{fontSize:10,color:ACC,fontFamily:"'JetBrains Mono',monospace",width:44,flexShrink:0}}>{h}</span>
                {DIAS.map(dia=>{const key=`${dia} ${h}`;const sel=novoAluno.turmas.includes(key);return(
                  <button key={dia} onClick={()=>toggleTurma(key)} style={{padding:'2px 7px',borderRadius:4,border:`1px solid ${sel?ACC:BDR}`,background:sel?'rgba(141,198,63,0.15)':'transparent',color:sel?ACC:MUTED,cursor:'pointer',fontSize:9}}>{dia.slice(0,3)}</button>
                );})}
              </div>
            ))}
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={s.btnS} onClick={()=>setShowNovoAluno(false)}>Cancelar</button>
            <button style={s.btnP} onClick={salvarNovoAluno} disabled={!novoAluno.nome||saving}>
              {saving?'Salvando...':'💾 Salvar'}
            </button>
          </div>
        </div>}

        {alunos.map(a=>{
          const venc=getVencimento(a);
          const d=diffDays(venc);
          const valor=getValor(a,planos);
          const nFaltas=Object.keys(a.faltas||{}).length;
          const open=selAluno===a.id;
          const isEditing=editingAluno===a.id;
          const isSaving=saving===a.id;
          const isConfirmDel=confirmDel===a.id;
          const status=a.pago
            ?<span style={s.tag}>✅ Pago</span>
            :d<0?<span style={s.tagD}>⚠️ {Math.abs(d)}d atraso</span>
            :d===0?<span style={s.tagW}>⏰ Vence hoje</span>
            :d<=7?<span style={s.tagW}>📅 {d}d</span>
            :<span style={s.tagI}>OK</span>;
          return(
            <div key={a.id} style={{...s.card,opacity:a.ativo?1:0.55,border:`1px solid ${isEditing?WARN:open?ACC:BDR}`}}>

              {/* Cabeçalho do card */}
              <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:6,cursor:'pointer'}} onClick={()=>{if(!isEditing){setSelAluno(open?null:a.id);setEditingAluno(null);}}}>
                <div>
                  <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:3,flexWrap:'wrap'}}>
                    <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16}}>{a.nome}</span>
                    <span style={s.tagI}>{planos.find(p=>p.id===a.plano)?.nome||'sem plano'}</span>
                    {status}
                    {!a.ativo&&<span style={s.tagD}>inativo</span>}
                    {a.peso&&<span style={{fontSize:10,color:MUTED}}>{a.peso}kg</span>}
                  </div>
                  <div style={{fontSize:10,color:MUTED}}>
                    {a.turmas.length>0?a.turmas.slice(0,3).join(' · ')+(a.turmas.length>3?` +${a.turmas.length-3}`:''):'Sem turmas definidas'}
                  </div>
                </div>
                <div style={{display:'flex',gap:5,alignItems:'center'}}>
                  {valor>0&&<span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:ACC}}>R${valor}</span>}
                  {!a.pago&&valor>0&&<button onClick={e=>{e.stopPropagation();setShowPix(a);}} style={s.btnS}>💳</button>}
                  {a.tel&&<button onClick={e=>{e.stopPropagation();window.open(waLink(a,`Olá ${a.nome.split(' ')[0]}! 👋`),'_blank');}} style={{...s.btnS,borderColor:'#25D366',color:'#25D366'}}>📱</button>}
                  <button onClick={e=>{e.stopPropagation();abrirEdicao(a);}} style={{...s.btnS,fontSize:10,padding:'4px 10px',borderColor:WARN,color:WARN}}>✏️ Editar</button>
                </div>
              </div>

              {/* MODO EDIÇÃO */}
              {open&&isEditing&&<div style={{marginTop:12,borderTop:`1px solid ${WARN}33`,paddingTop:12}}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:12,color:WARN,letterSpacing:2,marginBottom:10}}>EDITANDO PERFIL</div>

                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
                  <div>
                    <label style={s.lbl}>Plano</label>
                    <select style={s.inp} value={editForm.plano||'3x'} onChange={e=>setEditForm(p=>({...p,plano:e.target.value}))}>
                      {planos.map(p=><option key={p.id} value={p.id}>{p.nome} — R${p.valor}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={s.lbl}>Dia vencimento (1–28)</label>
                    <input type="number" min="1" max="28" style={s.inp} value={editForm.dia_venc||10} onChange={e=>setEditForm(p=>({...p,dia_venc:parseInt(e.target.value)||10}))}/>
                  </div>
                  <div>
                    <label style={s.lbl}>WhatsApp (55+DDD+número)</label>
                    <input style={s.inp} value={editForm.tel||''} onChange={e=>setEditForm(p=>({...p,tel:e.target.value}))} placeholder="5563999990000"/>
                  </div>
                  <div>
                    <label style={s.lbl}>Data de nascimento</label>
                    <input type="date" style={s.inp} value={editForm.nasc||''} onChange={e=>setEditForm(p=>({...p,nasc:e.target.value}))}/>
                  </div>
                  <div style={{gridColumn:'1/-1',display:'flex',alignItems:'center',gap:8,background:SURF2,borderRadius:8,padding:'8px 12px'}}>
                    <span style={{fontSize:10,color:MUTED,flex:1}}>Status do aluno</span>
                    <button onClick={()=>setEditForm(p=>({...p,ativo:!p.ativo}))} style={{...s.btnS,fontSize:10,borderColor:editForm.ativo?ACC:DANGER,color:editForm.ativo?ACC:DANGER}}>
                      {editForm.ativo?'✅ Ativo':'❌ Inativo'}
                    </button>
                  </div>
                </div>

                {/* Turmas */}
                <div style={{marginBottom:12}}>
                  <label style={s.lbl}>Turmas fixas</label>
                  {HORARIOS.map(h=>(
                    <div key={h} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                      <span style={{fontSize:10,color:ACC,fontFamily:"'JetBrains Mono',monospace",width:44,flexShrink:0}}>{h}</span>
                      {DIAS.map(dia=>{const key=`${dia} ${h}`;const sel=(editForm.turmas||[]).includes(key);return(
                        <button key={dia} onClick={()=>toggleTurmaEdit(key)} style={{padding:'2px 7px',borderRadius:4,border:`1px solid ${sel?ACC:BDR}`,background:sel?'rgba(141,198,63,0.15)':'transparent',color:sel?ACC:MUTED,cursor:'pointer',fontSize:9}}>{dia.slice(0,3)}</button>
                      );})}
                      {(()=>{const key=`Sábado ${h}`;const sel=(editForm.turmas||[]).includes(key);return h==='10:00'?<button onClick={()=>toggleTurmaEdit(key)} style={{padding:'2px 7px',borderRadius:4,border:`1px solid ${sel?WARN:BDR}`,background:sel?'rgba(232,160,32,0.15)':'transparent',color:sel?WARN:MUTED,cursor:'pointer',fontSize:9}}>Sáb</button>:null;})()}
                    </div>
                  ))}
                </div>

                {/* Ações */}
                <div style={{display:'flex',gap:8,justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    {!isConfirmDel?(
                      <button onClick={()=>setConfirmDel(a.id)} style={{...s.btnD,fontSize:10}}>🗑 Excluir aluno</button>
                    ):(
                      <div style={{display:'flex',gap:6,alignItems:'center'}}>
                        <span style={{fontSize:11,color:DANGER}}>Confirmar exclusão?</span>
                        <button onClick={()=>excluirAluno(a.id)} disabled={isSaving} style={{...s.btnD,fontSize:10}}>{isSaving?'..':'Sim, excluir'}</button>
                        <button onClick={()=>setConfirmDel(null)} style={s.btnS}>Não</button>
                      </div>
                    )}
                  </div>
                  <div style={{display:'flex',gap:7}}>
                    <button style={s.btnS} onClick={()=>{setEditingAluno(null);setConfirmDel(null);}}>Cancelar</button>
                    <button style={{...s.btnP,background:WARN}} onClick={()=>salvarEdicao(a.id)} disabled={isSaving}>
                      {isSaving?'Salvando...':'💾 Salvar alterações'}
                    </button>
                  </div>
                </div>
              </div>}

              {/* MODO VISUALIZAÇÃO */}
              {open&&!isEditing&&<div style={{marginTop:10,borderTop:`1px solid ${BDR}`,paddingTop:10}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:7,marginBottom:12}}>
                  {[['Faltas',nFaltas],['Vence dia',a.dia_venc||'—'],['WhatsApp',a.tel?'✅':'—']].map(([k,v])=>(
                    <div key={k} style={{background:SURF2,borderRadius:7,padding:'7px',textAlign:'center'}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:ACC}}>{v}</div>
                      <div style={{fontSize:9,color:MUTED,textTransform:'uppercase'}}>{k}</div>
                    </div>
                  ))}
                </div>

                {/* Pagamento */}
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,background:SURF2,borderRadius:8,padding:'8px 12px'}}>
                  <span style={{fontSize:10,color:MUTED,flex:1}}>Pagamento deste mês</span>
                  <button onClick={()=>togglePago(a)} disabled={isSaving} style={{...s.btnS,fontSize:10,borderColor:a.pago?ACC:DANGER,color:a.pago?ACC:DANGER}}>
                    {isSaving?'...':(a.pago?'✅ Pago — desfazer':'❌ Pendente — confirmar')}
                  </button>
                </div>

                {/* Turmas */}
                {a.turmas.length>0&&<>
                  <div style={{fontSize:9,color:MUTED,marginBottom:5,textTransform:'uppercase',letterSpacing:1}}>Turmas fixas</div>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:12}}>
                    {a.turmas.map(t=><span key={t} style={s.tagI}>{t}</span>)}
                  </div>
                </>}

                {/* Faltas */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <div style={{fontSize:9,color:MUTED,textTransform:'uppercase',letterSpacing:1}}>Faltas registradas</div>
                  <button onClick={()=>setAddingFalta(addingFalta===a.id?null:a.id)} style={{...s.btnS,fontSize:9,padding:'3px 8px',borderColor:WARN,color:WARN}}>+ Falta</button>
                </div>
                {addingFalta===a.id&&<div style={{display:'flex',gap:7,marginBottom:8,alignItems:'center'}}>
                  <input type="date" style={{...s.inp,flex:1,fontSize:12}} value={faltaData} onChange={e=>setFaltaData(e.target.value)}/>
                  <button style={s.btnP} onClick={()=>addFalta(a.id,faltaData)}>OK</button>
                  <button style={s.btnS} onClick={()=>setAddingFalta(null)}>✕</button>
                </div>}
                {Object.keys(a.faltas||{}).length>0?(
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {Object.keys(a.faltas).sort().map(dt=>(
                      <span key={dt} style={{...s.tagD,cursor:'pointer',display:'flex',alignItems:'center',gap:4}} onClick={()=>remFalta(a.id,dt)}>{dt} ✕</span>
                    ))}
                  </div>
                ):<div style={{fontSize:11,color:MUTED}}>Nenhuma falta registrada.</div>}
              </div>}
            </div>
          );
        })}

        {allStudents.length===0&&!tableExists&&(
          <div style={{...s.card,textAlign:'center',padding:'40px',border:`2px dashed ${BDR}`}}>
            <p style={{color:MUTED,fontSize:13}}>Crie a tabela <strong style={{color:WARN}}>gestao</strong> no Supabase (veja o aviso acima) e os alunos aparecerão aqui automaticamente.</p>
          </div>
        )}
      </div>}

      {/* ── FINANCEIRO ── */}
      {tab===2&&<div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
          {[['Entradas',`R$${entradas}`,ACC],['Saídas',`R$${saidas}`,DANGER],['Saldo',`R$${entradas-saidas}`,entradas-saidas>=0?ACC:DANGER]].map(([k,v,c])=>(
            <div key={k} style={{...s.card,textAlign:'center'}}>
              <div style={{fontSize:10,color:MUTED,marginBottom:2}}>{k}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:c}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
          <div style={{...s.card,border:`1px solid rgba(141,198,63,0.2)`}}>
            <div style={{...s.hd,color:ACC}}>RESERVA</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:ACC}}>R${reserva.toLocaleString('pt-BR')}</div>
            <div style={{fontSize:10,color:MUTED}}>Meta R$5.000 · {Math.round((reserva/5000)*100)}%</div>
            <div style={{height:5,background:'rgba(255,255,255,0.06)',borderRadius:3,marginTop:6,overflow:'hidden'}}>
              <div style={{width:`${(reserva/5000)*100}%`,height:'100%',background:ACC,borderRadius:3}}/>
            </div>
          </div>
          <div style={{...s.card,border:`1px solid rgba(232,160,32,0.2)`}}>
            <div style={{...s.hd,color:WARN}}>A RECEBER</div>
            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:WARN}}>R${inadimp}</div>
            <div style={{fontSize:10,color:MUTED}}>{ativos.filter(a=>!a.pago).length} pendentes</div>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.hd}>LANÇAMENTOS (EXEMPLO)</div>
          <p style={{fontSize:10,color:MUTED,marginBottom:10}}>Em breve: lançamentos salvos no Supabase. Por ora, dados de exemplo.</p>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr>{['Data','Descrição','Tipo','Valor'].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
            <tbody>{[...lanc].sort((a,b)=>b.data.localeCompare(a.data)).map((e,i)=>(
              <tr key={i}>
                <td style={{...s.td,fontSize:10}}>{e.data}</td>
                <td style={s.td}>{e.desc}</td>
                <td style={s.td}>{e.tipo==='entrada'?<span style={s.tag}>Entrada</span>:<span style={s.tagD}>Saída</span>}</td>
                <td style={{...s.td,color:e.tipo==='entrada'?ACC:DANGER,fontFamily:"'JetBrains Mono',monospace"}}>{e.tipo==='entrada'?'+':'-'}R${e.valor}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>}

      {/* ── AGENDA ── */}
      {tab===3&&<div>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:2,color:ACC,marginBottom:10}}>GRADE DE TURMAS</div>
        {Object.keys(turmaMap).length===0&&(
          <div style={{...s.card,textAlign:'center',padding:'30px',border:`2px dashed ${BDR}`,color:MUTED,fontSize:12}}>
            Nenhuma turma definida ainda. Adicione turmas fixas aos alunos na aba Alunos.
          </div>
        )}
        {Object.keys(turmaMap).length>0&&<div style={{...s.card,overflowX:'auto',marginBottom:10}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:400}}>
            <thead><tr><th style={s.th}>Hora</th>{DIAS.map(d=><th key={d} style={s.th}>{d.slice(0,3)}</th>)}</tr></thead>
            <tbody>
              {HORARIOS.map(h=>(
                <tr key={h}>
                  <td style={{...s.td,color:ACC,fontFamily:"'JetBrains Mono',monospace",fontSize:11,fontWeight:700}}>{h}</td>
                  {DIAS.map(dia=>{
                    const key=`${dia} ${h}`;
                    const al=(turmaMap[key]||[]).filter(a=>a.ativo);
                    const n=al.length;
                    const pct=Math.round((n/CAP)*100);
                    const c=pct>=80?DANGER:pct>=50?WARN:n>0?ACC:BDR;
                    const open=agSel===key;
                    return(
                      <td key={dia} style={{...s.td,padding:'5px 6px',cursor:n>0?'pointer':'default'}} onClick={()=>n>0&&setAgSel(open?null:key)}>
                        {n>0?(
                          <div style={{background:open?'rgba(141,198,63,0.1)':'transparent',border:`1px solid ${c}55`,borderRadius:6,padding:'4px',textAlign:'center'}}>
                            <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:c,lineHeight:1}}>{n}</div>
                            <div style={{fontSize:8,color:MUTED}}>{pct}%</div>
                          </div>
                        ):<div style={{textAlign:'center',color:BDR,fontSize:12}}>—</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>}

        {agSel&&(turmaMap[agSel]||[]).filter(a=>a.ativo).length>0&&(
          <div style={{...s.card,border:`1px solid ${ACC}`}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:ACC}}>{agSel}</div>
              <button onClick={()=>setAgSel(null)} style={{background:'none',border:'none',color:MUTED,cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
              {(turmaMap[agSel]||[]).filter(a=>a.ativo).map(a=>(
                <div key={a.id} style={{background:SURF2,border:`1px solid ${a.pago?BDR:'rgba(224,80,80,0.3)'}`,borderRadius:8,padding:'8px 12px',minWidth:110}}>
                  <div style={{fontSize:12,fontWeight:600}}>{a.nome.split(' ')[0]}</div>
                  <div style={{fontSize:9,color:MUTED,marginTop:2}}>{a.plano}</div>
                  {!a.pago&&<div style={{fontSize:9,color:DANGER,marginTop:2}}>⚠️ Pendente</div>}
                </div>
              ))}
            </div>
            <div style={{marginTop:8,fontSize:10,color:MUTED}}>{CAP-(turmaMap[agSel]||[]).filter(a=>a.ativo).length} vagas disponíveis</div>
          </div>
        )}
      </div>}

      {/* ── CONFIG ── */}
      {tab===4&&<div>
        <div style={s.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={s.hd}>PLANOS E VALORES</div>
            <button style={s.btnP} onClick={()=>{setNovoPlan({nome:'',valor:''});setEditPlan(null);setShowNovoPlan(v=>!v);}}>+ Novo</button>
          </div>
          {showNovoPlan&&<div style={{background:SURF2,borderRadius:8,padding:'12px',marginBottom:12,border:`1px solid ${ACC}`}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
              <div><label style={s.lbl}>Nome</label><input style={s.inp} value={novoPlan.nome} onChange={e=>setNovoPlan(p=>({...p,nome:e.target.value}))} placeholder="Ex: 4x na semana"/></div>
              <div><label style={s.lbl}>Valor (R$)</label><input type="number" style={s.inp} value={novoPlan.valor} onChange={e=>setNovoPlan(p=>({...p,valor:e.target.value}))} placeholder="200"/></div>
            </div>
            <div style={{display:'flex',gap:7}}>
              <button style={s.btnS} onClick={()=>{setShowNovoPlan(false);setEditPlan(null);}}>Cancelar</button>
              <button style={s.btnP} onClick={salvarPlano}>💾 {editPlan?'Atualizar':'Criar'}</button>
            </div>
          </div>}
          {planos.map(p=>(
            <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${BDR}`}}>
              <span style={{fontSize:13,fontWeight:600}}>{p.nome}</span>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,color:ACC}}>R${p.valor}</span>
                <button style={s.btnS} onClick={()=>{setNovoPlan({nome:p.nome,valor:p.valor});setEditPlan(p.id);setShowNovoPlan(true);}}>✏️</button>
                <button style={s.btnD} onClick={()=>setPlanos(prev=>prev.filter(pl=>pl.id!==p.id))}>🗑</button>
              </div>
            </div>
          ))}
        </div>

        <div style={s.card}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
            <div style={s.hd}>CONFIGURAÇÃO PIX</div>
            <button style={s.btnS} onClick={()=>setShowPixCfg(v=>!v)}>✏️ Editar</button>
          </div>
          {showPixCfg?(
            <div>
              <div style={{marginBottom:8}}><label style={s.lbl}>Chave PIX</label><input style={s.inp} value={pixChave} onChange={e=>setPixChave(e.target.value)}/></div>
              <div style={{marginBottom:10}}><label style={s.lbl}>Beneficiário</label><input style={s.inp} value={pixBenef} onChange={e=>setPixBenef(e.target.value)}/></div>
              <button style={s.btnP} onClick={()=>setShowPixCfg(false)}>💾 Salvar</button>
            </div>
          ):(
            <div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:5}}><span style={{color:MUTED}}>Chave</span><span style={{fontFamily:"'JetBrains Mono',monospace",color:ACC}}>{pixChave}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:MUTED}}>Beneficiário</span><span>{pixBenef}</span></div>
            </div>
          )}
        </div>

        <div style={{...s.card,border:`1px solid rgba(91,200,245,0.2)`}}>
          <div style={{...s.hd,color:INFO}}>📱 WHATSAPP</div>
          {[{t:'Link direto (wa.me) — GRÁTIS',d:'Já implementado. Botão abre o WhatsApp com mensagem pré-pronta.',c:ACC},{t:'Z-API — ~R$89/mês',d:'Envio automático. Ideal com 30+ alunos.',c:WARN},{t:'WhatsApp Business API',d:'Twilio/Zenvia. Mais caro, mais controle.',c:MUTED}].map((it,i)=>(
            <div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${BDR}`}}>
              <div style={{fontSize:12,fontWeight:600,color:it.c,marginBottom:2}}>{it.t}</div>
              <div style={{fontSize:11,color:MUTED}}>{it.d}</div>
            </div>
          ))}
        </div>
      </div>}

      {/* Modal PIX */}
      {showPix&&(()=>{
        const valor=getValor(showPix,planos);
        const pix=gerarPix(pixChave,valor,pixBenef);
        return(
          <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.85)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>setShowPix(null)}>
            <div style={{...s.card,border:`1px solid ${ACC}`,maxWidth:300,width:'90%',textAlign:'center'}} onClick={e=>e.stopPropagation()}>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:ACC,marginBottom:3}}>COBRANÇA VIA PIX</div>
              <div style={{fontSize:11,color:MUTED,marginBottom:12}}>{showPix.nome} · R${valor}</div>
              <div style={{background:SURF2,borderRadius:8,padding:'10px',marginBottom:10,textAlign:'left'}}>
                <div style={{fontSize:9,color:MUTED,marginBottom:3}}>CHAVE PIX</div>
                <div style={{fontSize:12,color:ACC,fontFamily:"'JetBrains Mono',monospace",marginBottom:6}}>{pixChave}</div>
                <div style={{fontSize:9,color:MUTED,marginBottom:3}}>VALOR</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:ACC,marginBottom:6}}>R$ {valor}</div>
                <div style={{fontSize:9,color:MUTED,marginBottom:3}}>PIX COPIA E COLA</div>
                <div style={{fontSize:8,color:MUTED,wordBreak:'break-all',fontFamily:"'JetBrains Mono',monospace",background:BG,padding:'6px',borderRadius:5,lineHeight:1.4}}>{pix.slice(0,80)}...</div>
                <button style={{...s.btnS,width:'100%',marginTop:8,fontSize:10}} onClick={()=>{navigator.clipboard?.writeText(pix);alert('PIX copiado! Valor R$'+valor+' incluído.');}}>📋 Copiar PIX com valor</button>
              </div>
              <div style={{display:'flex',gap:7}}>
                {showPix.tel&&<button style={{...s.btnS,flex:1,borderColor:'#25D366',color:'#25D366',fontSize:10}} onClick={()=>window.open(waLink(showPix,`Olá ${showPix.nome.split(' ')[0]}! 👋 PIX Pōkai (R$${valor}):\n\n${pix}\n\nCole no app do banco. Obrigado!`),'_blank')}>📱 Enviar WA</button>}
                <button style={{...s.btnP,flex:1,fontSize:11}} onClick={()=>setShowPix(null)}>Fechar</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
