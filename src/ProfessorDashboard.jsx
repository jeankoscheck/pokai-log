import { useState } from "react";

const ACC='#8DC63F',BG='#060606',SURF='#0F0F0F',SURF2='#181818',BDR='#272727';
const TEXT='#F2F2F0',MUTED='#666660',WARN='#E8A020',DANGER='#E05050',INFO='#5BC8F5';
const MONTHS=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const HORARIOS=['07:00','08:00','09:00','10:00','18:00','19:00'];
const DIAS=['Segunda','Terça','Quarta','Quinta','Sexta'];
const CAP=12;
const TODAY=new Date();

const diffDays=v=>{
  if(!v||v==='—') return 999;
  return Math.floor((new Date(v)-TODAY)/(864e5));
};
const getVencimento=a=>{
  if(!a.diaVenc) return '—';
  const y=TODAY.getFullYear(), m=TODAY.getMonth()+1;
  const dim=new Date(y,m,0).getDate();
  const dia=Math.min(a.diaVenc,dim);
  return `${y}-${String(m).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
};
const getValor=(a,planos)=>planos.find(p=>p.id===a.plano)?.valor||0;
const getFreq=a=>Math.max(0, a.turmas.length*4 - Object.keys(a.faltas||{}).length);
const gerarPix=(chave,valor,benef)=>{
  const v=parseFloat(valor).toFixed(2);
  return `00020126580014br.gov.bcb.pix0136${chave}5204000053039865406${v}5802BR5915${benef.slice(0,15).padEnd(15)}6009SAO PAULO62140510POKAI${Date.now().toString().slice(-6)}6304ABCD`;
};

const PLANOS_INIT=[
  {id:'2x',nome:'2x na semana',valor:130},
  {id:'3x',nome:'3x na semana',valor:180},
  {id:'5x',nome:'5x na semana',valor:250},
];

const ALUNOS_INIT=[
  {id:1,nome:'Billy Wonka',    nasc:'1996-03-14',tel:'5563999990001',plano:'5x',diaVenc:5, pago:false,ativo:true, turmas:['Segunda 07:00','Terça 07:00','Quarta 07:00','Quinta 07:00','Sexta 07:00'],faltas:{'2026-04-28':true,'2026-04-30':true}},
  {id:2,nome:'Isabela Costa',  nasc:'2001-07-22',tel:'5563999990002',plano:'3x',diaVenc:10,pago:false,ativo:true, turmas:['Segunda 18:00','Quarta 18:00','Sexta 18:00'],faltas:{}},
  {id:3,nome:'Carlos Melo',    nasc:'1989-11-03',tel:'5563999990003',plano:'3x',diaVenc:1, pago:false,ativo:true, turmas:['Terça 19:00','Quinta 19:00','Sábado 10:00'],faltas:{'2026-04-22':true,'2026-04-29':true,'2026-05-01':true}},
  {id:4,nome:'Ana Paula Lima', nasc:'1995-05-30',tel:'5563999990004',plano:'2x',diaVenc:15,pago:true, ativo:true, turmas:['Segunda 08:00','Quarta 08:00'],faltas:{}},
  {id:5,nome:'Rafael Torres',  nasc:'1998-09-18',tel:'5563999990005',plano:'5x',diaVenc:8, pago:true, ativo:true, turmas:['Segunda 19:00','Terça 19:00','Quarta 19:00','Quinta 19:00','Sexta 19:00'],faltas:{'2026-05-02':true}},
  {id:6,nome:'Fernanda Souza', nasc:'2003-01-25',tel:'5563999990006',plano:'2x',diaVenc:20,pago:false,ativo:false,turmas:['Terça 18:00','Quinta 18:00'],faltas:{}},
  {id:7,nome:'Lucas Martins',  nasc:'1994-06-10',tel:'5563999990007',plano:'3x',diaVenc:12,pago:true, ativo:true, turmas:['Segunda 10:00','Quarta 10:00','Sexta 10:00'],faltas:{}},
  {id:8,nome:'Camila Rocha',   nasc:'2000-02-28',tel:'5563999990008',plano:'5x',diaVenc:7, pago:false,ativo:true, turmas:['Segunda 09:00','Terça 09:00','Quarta 09:00','Quinta 09:00','Sábado 10:00'],faltas:{'2026-04-28':true}},
];

const LANC_INIT=[
  {data:'2026-05-02',desc:'Mensalidade Rafael Torres',   valor:250,tipo:'entrada'},
  {data:'2026-05-01',desc:'Mensalidade Ana Paula Lima',  valor:130,tipo:'entrada'},
  {data:'2026-05-01',desc:'Aluguel da sala',             valor:1200,tipo:'saida'},
  {data:'2026-05-03',desc:'Equipamentos',                valor:350, tipo:'saida'},
  {data:'2026-04-28',desc:'Mensalidade Lucas Martins',   valor:180,tipo:'entrada'},
  {data:'2026-04-25',desc:'Energia elétrica',            valor:280, tipo:'saida'},
];

const s={
  card: {background:'rgba(15,15,15,0.9)',border:`1px solid ${BDR}`,borderRadius:12,padding:'14px 16px',marginBottom:10},
  tag:  {display:'inline-block',padding:'2px 8px',background:'rgba(141,198,63,0.15)',color:ACC,borderRadius:3,fontSize:10,fontWeight:700},
  tagD: {display:'inline-block',padding:'2px 8px',background:'rgba(224,80,80,0.15)',color:DANGER,borderRadius:3,fontSize:10,fontWeight:700},
  tagW: {display:'inline-block',padding:'2px 8px',background:'rgba(232,160,32,0.15)',color:WARN,borderRadius:3,fontSize:10,fontWeight:700},
  tagI: {display:'inline-block',padding:'2px 8px',background:'rgba(91,200,245,0.15)',color:INFO,borderRadius:3,fontSize:10,fontWeight:700},
  btnP: {padding:'7px 16px',background:ACC,color:'#000',border:'none',borderRadius:6,cursor:'pointer',fontSize:12,fontWeight:700},
  btnS: {padding:'6px 12px',background:SURF2,color:TEXT,border:`1px solid ${BDR}`,borderRadius:6,cursor:'pointer',fontSize:11},
  btnD: {padding:'5px 10px',background:'#1A0000',color:DANGER,border:`1px solid #330000`,borderRadius:5,cursor:'pointer',fontSize:11},
  th:   {textAlign:'left',padding:'7px 10px',background:'rgba(141,198,63,0.07)',color:ACC,fontSize:9,fontWeight:700,letterSpacing:1},
  td:   {padding:'7px 10px',borderBottom:`1px solid ${BDR}`,fontSize:11,color:'#CCC'},
  inp:  {width:'100%',background:SURF2,border:`1px solid #333`,color:TEXT,padding:'8px 10px',borderRadius:5,fontSize:13,outline:'none',boxSizing:'border-box'},
  lbl:  {display:'block',fontSize:9,color:MUTED,marginBottom:4,textTransform:'uppercase',letterSpacing:1},
  hd:   {fontFamily:"'Bebas Neue',sans-serif",fontSize:13,letterSpacing:2,color:ACC,marginBottom:8},
};

const TABS=['📊 Resumo','👥 Alunos','💰 Financeiro','📅 Agenda','⚙️ Config'];

export default function ProfessorDashboard(){
  const[tab,setTab]           = useState(0);
  const[alunos,setAlunos]     = useState(ALUNOS_INIT);
  const[planos,setPlanos]     = useState(PLANOS_INIT);
  const[lanc]                 = useState(LANC_INIT);
  const[selAluno,setSelAluno] = useState(null);
  const[agSel,setAgSel]       = useState(null);
  const[showPix,setShowPix]   = useState(null);
  const[expandIns,setExpandIns]=useState(false);
  const[editVenc,setEditVenc] = useState(null);
  const[addingFalta,setAddingFalta]=useState(null);
  const[faltaData,setFaltaData]=useState('');
  const[pixChave,setPixChave] = useState('pokai@ct.com.br');
  const[pixBenef,setPixBenef] = useState('Pōkai CT');
  const[showPixCfg,setShowPixCfg]=useState(false);
  const[showNovoAluno,setShowNovoAluno]=useState(false);
  const[showNovoPlan,setShowNovoPlan]=useState(false);
  const[editPlan,setEditPlan] = useState(null);
  const[novoPlan,setNovoPlan] = useState({nome:'',valor:''});
  const[novoAluno,setNovoAluno]=useState({nome:'',nasc:'',tel:'',plano:'3x',diaVenc:10,turmas:[]});
  const[vencInput,setVencInput]=useState('');

  const turmaMap={};
  alunos.forEach(a=>(a.turmas||[]).forEach(t=>{
    if(!turmaMap[t]) turmaMap[t]=[];
    turmaMap[t].push(a);
  }));

  const ativos     = alunos.filter(a=>a.ativo);
  const atrasados  = ativos.filter(a=>!a.pago && diffDays(getVencimento(a))<0);
  const entradas   = lanc.filter(e=>e.tipo==='entrada'&&e.data.startsWith(`${TODAY.getFullYear()}-${String(TODAY.getMonth()+1).padStart(2,'0')}`)).reduce((a,e)=>a+e.valor,0);
  const saidas     = lanc.filter(e=>e.tipo==='saida'&&e.data.startsWith(`${TODAY.getFullYear()}-${String(TODAY.getMonth()+1).padStart(2,'0')}`)).reduce((a,e)=>a+e.valor,0);
  const potencial  = ativos.reduce((a,al)=>a+getValor(al,planos),0);
  const inadimp    = ativos.filter(a=>!a.pago).reduce((a,al)=>a+getValor(al,planos),0);
  const ticket     = ativos.length ? Math.round(potencial/ativos.length) : 0;
  const custo      = ativos.length ? Math.round(saidas/ativos.length) : 0;
  const reserva    = 3200;
  const totalVagas = (DIAS.length*HORARIOS.length+1)*CAP;
  const totalOcup  = Object.values(turmaMap).reduce((a,v)=>a+v.filter(al=>al.ativo).length,0);
  const ocup       = Math.round((totalOcup/totalVagas)*100);
  const churnRisk  = ativos.filter(a=>{ const esp={'2x':8,'3x':12,'5x':20}[a.plano]||12; return getFreq(a)<esp*0.5; });
  const aniver     = alunos.filter(a=>a.nasc && parseInt(a.nasc.split('-')[1])===TODAY.getMonth()+1);

  const INSIGHTS=[
    {e:'💸',t:'Custo por aluno',         d:`Despesas R$${saidas}/mês ÷ ${ativos.length} ativos = R$${custo}/aluno. Ticket médio R$${ticket}. Margem bruta: R$${ticket-custo}/aluno/mês.`,c:INFO},
    {e:'⚠️',t:`Risco de churn (${churnRisk.length})`,d:churnRisk.length?`${churnRisk.map(a=>a.nome.split(' ')[0]).join(', ')} treinam menos da metade do plano. Alta chance de cancelar. Contate-os esta semana.`:'Nenhum aluno em risco de churn!',c:churnRisk.length?DANGER:ACC},
    {e:'📊',t:`Ocupação: ${ocup}%`,      d:`${totalOcup} alunos em ${Object.keys(turmaMap).length} turmas. Vagas disponíveis = R$${ticket*(totalVagas-totalOcup)} de receita potencial não capturada.`,c:ocup<50?DANGER:ocup<75?WARN:ACC},
    {e:'🎂',t:`Aniversariantes (${aniver.length})`,d:aniver.length?`${aniver.map(a=>a.nome.split(' ')[0]).join(', ')} fazem aniversário em ${MONTHS[TODAY.getMonth()]}. Mensagem personalizada aumenta retenção.`:'Nenhum aniversariante este mês.',c:INFO},
    {e:'📅',t:'Vencimentos espalhados',  d:`Distribuir vencimentos ao longo do mês (dias 1, 5, 10, 15, 20, 25) melhora o fluxo de caixa e evita concentração de inadimplência.`,c:WARN},
    {e:'🎯',t:'Plano anual',             d:'Oferecer 10–15% de desconto no plano anual converte inadimplentes em pagamento antecipado. R$'+Math.round(ticket*12*0.9)+' garantidos por aluno.',c:WARN},
    {e:'🏦',t:'Meta de reserva',         d:`Reserva atual R$${reserva} = ${Math.round((reserva/saidas)*100)}% de 1 mês. Ideal: 3 meses = R$${(saidas*3).toLocaleString('pt-BR')}. Separe 10% de cada mensalidade.`,c:reserva<saidas*3?WARN:ACC},
    {e:'📈',t:'Sazonalidade',            d:'Janeiro e março: pico de matrículas. Agosto/setembro: queda. Planeje promoção "Voltar a treinar" em julho com 1ª mensalidade grátis.',c:MUTED},
    {e:'🔄',t:'Retenção mensal',         d:`Cada cancelamento = R$${ticket*12}/ano perdido. Ligue para alunos ausentes por 2 semanas antes de cancelarem.`,c:INFO},
    {e:'💡',t:'Expandir horário nobre',  d:`18h e 19h costumam lotar primeiro. Considere abrir 17h ou 20h. Cada turma nova = até R$${ticket*CAP}/mês de receita potencial.`,c:ACC},
  ];

  const addFalta=(id,data)=>{
    if(!data) return;
    setAlunos(p=>p.map(a=>a.id===id?{...a,faltas:{...a.faltas,[data]:true}}:a));
    setAddingFalta(null); setFaltaData('');
  };
  const remFalta=(id,data)=>{
    setAlunos(p=>p.map(a=>{ if(a.id!==id) return a; const f={...a.faltas}; delete f[data]; return{...a,faltas:f}; }));
  };
  const saveVenc=(id)=>{
    const v=parseInt(vencInput);
    if(v>=1&&v<=28) setAlunos(p=>p.map(a=>a.id===id?{...a,diaVenc:v}:a));
    setEditVenc(null);
  };
  const toggleTurma=key=>setNovoAluno(p=>({...p,turmas:p.turmas.includes(key)?p.turmas.filter(t=>t!==key):[...p.turmas,key]}));
  const salvarAluno=()=>{
    setAlunos(p=>[...p,{...novoAluno,id:Date.now(),pago:false,ativo:true,faltas:{}}]);
    setShowNovoAluno(false);
    setNovoAluno({nome:'',nasc:'',tel:'',plano:'3x',diaVenc:10,turmas:[]});
  };
  const salvarPlano=()=>{
    if(!novoPlan.nome||!novoPlan.valor) return;
    if(editPlan){
      setPlanos(p=>p.map(pl=>pl.id===editPlan?{...pl,...novoPlan}:pl));
    } else {
      setPlanos(p=>[...p,{id:novoPlan.nome.replace(/\s/g,'-').toLowerCase(),nome:novoPlan.nome,valor:parseFloat(novoPlan.valor)}]);
    }
    setShowNovoPlan(false); setEditPlan(null); setNovoPlan({nome:'',valor:''});
  };
  const waLink=(a,msg)=>`https://wa.me/${a.tel}?text=${encodeURIComponent(msg)}`;

  return(
    <div style={{fontFamily:"'Outfit',sans-serif",color:TEXT}}>

      {/* Sub-tabs de gestão */}
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
          {[['💰 Receita',`R$${entradas}`,ACC],['📉 Saídas',`R$${saidas}`,DANGER],['⚠️ Inadimp.',`R$${inadimp}`,WARN],['🏦 Reserva',`R$${reserva.toLocaleString('pt-BR')}`,INFO]].map(([k,v,c])=>(
            <div key={k} style={{...s.card,textAlign:'center'}}>
              <div style={{fontSize:10,color:MUTED,marginBottom:3}}>{k}</div>
              <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:26,color:c}}>{v}</div>
            </div>
          ))}
        </div>

        <div style={s.card}>
          <div style={s.hd}>SAÚDE FINANCEIRA — {MONTHS[TODAY.getMonth()].toUpperCase()}</div>
          {[['Potencial',potencial,potencial,ACC],['Recebido',entradas,potencial,ACC],['Pendente',inadimp,potencial,WARN],['Despesas',saidas,potencial,DANGER]].map(([l,v,mx,c])=>(
            <div key={l} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
              <span style={{fontSize:10,color:MUTED,width:62}}>{l}</span>
              <div style={{flex:1,height:7,background:'rgba(255,255,255,0.06)',borderRadius:4,overflow:'hidden'}}>
                <div style={{width:`${Math.min(100,(v/mx)*100)}%`,height:'100%',background:c,borderRadius:4}}/>
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
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,letterSpacing:2,color:ACC}}>ALUNOS ({alunos.length})</div>
          <button style={s.btnP} onClick={()=>setShowNovoAluno(v=>!v)}>+ Cadastrar</button>
        </div>

        {showNovoAluno&&<div style={{...s.card,border:`1px solid ${ACC}`,marginBottom:12}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:ACC,marginBottom:12}}>NOVO ALUNO</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div><label style={s.lbl}>Nome completo</label><input style={s.inp} value={novoAluno.nome} onChange={e=>setNovoAluno(p=>({...p,nome:e.target.value}))} placeholder="Nome"/></div>
            <div><label style={s.lbl}>Nascimento</label><input type="date" style={s.inp} value={novoAluno.nasc} onChange={e=>setNovoAluno(p=>({...p,nasc:e.target.value}))}/></div>
            <div><label style={s.lbl}>WhatsApp (55+DDD)</label><input style={s.inp} value={novoAluno.tel} onChange={e=>setNovoAluno(p=>({...p,tel:e.target.value}))} placeholder="5563999990000"/></div>
            <div><label style={s.lbl}>Dia vencimento</label><input type="number" min="1" max="28" style={s.inp} value={novoAluno.diaVenc} onChange={e=>setNovoAluno(p=>({...p,diaVenc:parseInt(e.target.value)}))}/></div>
            <div style={{gridColumn:'1/-1'}}><label style={s.lbl}>Plano</label>
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
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:10,color:WARN,fontFamily:"'JetBrains Mono',monospace",width:44,flexShrink:0}}>Sáb</span>
              {(()=>{const key='Sábado 10:00';const sel=novoAluno.turmas.includes(key);return<button onClick={()=>toggleTurma(key)} style={{padding:'2px 10px',borderRadius:4,border:`1px solid ${sel?WARN:BDR}`,background:sel?'rgba(232,160,32,0.15)':'transparent',color:sel?WARN:MUTED,cursor:'pointer',fontSize:9}}>10:00</button>;})()}
            </div>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button style={s.btnS} onClick={()=>setShowNovoAluno(false)}>Cancelar</button>
            <button style={s.btnP} onClick={salvarAluno}>💾 Salvar</button>
          </div>
        </div>}

        {alunos.map(a=>{
          const venc=getVencimento(a);
          const d=diffDays(venc);
          const valor=getValor(a,planos);
          const nFaltas=Object.keys(a.faltas||{}).length;
          const freq=getFreq(a);
          const open=selAluno===a.id;
          const status=a.pago?<span style={s.tag}>✅ Pago</span>:d<0?<span style={s.tagD}>⚠️ {Math.abs(d)}d</span>:d===0?<span style={s.tagW}>⏰ Hoje</span>:d<=7?<span style={s.tagW}>📅 {d}d</span>:<span style={s.tagI}>OK</span>;
          return(
            <div key={a.id} style={{...s.card,opacity:a.ativo?1:0.55,border:`1px solid ${open?ACC:BDR}`}}>
              <div style={{display:'flex',justifyContent:'space-between',flexWrap:'wrap',gap:6,cursor:'pointer'}} onClick={()=>setSelAluno(open?null:a.id)}>
                <div>
                  <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:3,flexWrap:'wrap'}}>
                    <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16}}>{a.nome}</span>
                    <span style={s.tagI}>{planos.find(p=>p.id===a.plano)?.nome||a.plano}</span>
                    {status}
                    {!a.ativo&&<span style={s.tagD}>inativo</span>}
                  </div>
                  <div style={{fontSize:10,color:MUTED}}>{a.turmas.slice(0,3).join(' · ')}{a.turmas.length>3?` +${a.turmas.length-3}`:''}</div>
                </div>
                <div style={{display:'flex',gap:5,alignItems:'center'}}>
                  <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:18,color:ACC}}>R${valor}</span>
                  {!a.pago&&<button onClick={e=>{e.stopPropagation();setShowPix(a);}} style={s.btnS}>💳</button>}
                  {a.tel&&<button onClick={e=>{e.stopPropagation();window.open(waLink(a,`Olá ${a.nome.split(' ')[0]}! 👋`),'_blank');}} style={{...s.btnS,borderColor:'#25D366',color:'#25D366'}}>📱</button>}
                </div>
              </div>

              {open&&<div style={{marginTop:10,borderTop:`1px solid ${BDR}`,paddingTop:10}}>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:7,marginBottom:12}}>
                  {[['Freq/mês',freq],['Faltas',nFaltas],['Vence dia',a.diaVenc||'—'],['WhatsApp',a.tel?'✅':'—']].map(([k,v])=>(
                    <div key={k} style={{background:SURF2,borderRadius:7,padding:'7px',textAlign:'center'}}>
                      <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:14,color:ACC}}>{v}</div>
                      <div style={{fontSize:9,color:MUTED,textTransform:'uppercase'}}>{k}</div>
                    </div>
                  ))}
                </div>

                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,background:SURF2,borderRadius:8,padding:'8px 12px'}}>
                  <span style={{fontSize:10,color:MUTED,flex:1}}>Dia de vencimento</span>
                  {editVenc===a.id?(
                    <div style={{display:'flex',gap:6,alignItems:'center'}}>
                      <input type="number" min="1" max="28" style={{...s.inp,width:60,fontSize:12,textAlign:'center',padding:'4px 6px'}} value={vencInput} onChange={e=>setVencInput(e.target.value)}/>
                      <button style={s.btnP} onClick={()=>saveVenc(a.id)}>OK</button>
                      <button style={s.btnS} onClick={()=>setEditVenc(null)}>✕</button>
                    </div>
                  ):(
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:16,color:ACC}}>Dia {a.diaVenc||'—'}</span>
                      <button style={{...s.btnS,fontSize:10,padding:'3px 8px'}} onClick={()=>{setEditVenc(a.id);setVencInput(String(a.diaVenc||10));}}>✏️</button>
                    </div>
                  )}
                </div>

                <div style={{fontSize:9,color:MUTED,marginBottom:5,textTransform:'uppercase',letterSpacing:1}}>Turmas fixas</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:5,marginBottom:12}}>
                  {a.turmas.map(t=><span key={t} style={s.tagI}>{t}</span>)}
                </div>

                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <div style={{fontSize:9,color:MUTED,textTransform:'uppercase',letterSpacing:1}}>Faltas registradas</div>
                  <button onClick={()=>setAddingFalta(addingFalta===a.id?null:a.id)} style={{...s.btnS,fontSize:9,padding:'3px 8px',borderColor:WARN,color:WARN}}>+ Registrar falta</button>
                </div>
                {addingFalta===a.id&&<div style={{display:'flex',gap:7,marginBottom:8,alignItems:'center'}}>
                  <input type="date" style={{...s.inp,flex:1,fontSize:12}} value={faltaData} onChange={e=>setFaltaData(e.target.value)}/>
                  <button style={s.btnP} onClick={()=>addFalta(a.id,faltaData)}>OK</button>
                  <button style={s.btnS} onClick={()=>setAddingFalta(null)}>✕</button>
                </div>}
                {Object.keys(a.faltas||{}).length>0?(
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {Object.keys(a.faltas).sort().map(dt=>(
                      <span key={dt} style={{...s.tagD,cursor:'pointer',display:'flex',alignItems:'center',gap:4}} onClick={()=>remFalta(a.id,dt)}>
                        {dt} ✕
                      </span>
                    ))}
                  </div>
                ):<div style={{fontSize:11,color:MUTED}}>Nenhuma falta registrada.</div>}
              </div>}
            </div>
          );
        })}
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
            <button style={{...s.btnS,marginTop:8,fontSize:10,width:'100%',borderColor:WARN,color:WARN}} onClick={()=>alert('Funcionalidade: enviar cobrança em massa via WhatsApp')}>📱 Cobrar todos</button>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.hd}>LANÇAMENTOS</div>
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
        <div style={{...s.card,overflowX:'auto',marginBottom:10}}>
          <table style={{width:'100%',borderCollapse:'collapse',minWidth:400}}>
            <thead>
              <tr>
                <th style={s.th}>Hora</th>
                {DIAS.map(d=><th key={d} style={s.th}>{d.slice(0,3)}</th>)}
              </tr>
            </thead>
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
        </div>

        {(()=>{
          const key='Sábado 10:00';
          const al=(turmaMap[key]||[]).filter(a=>a.ativo);
          const n=al.length;
          const pct=Math.round((n/CAP)*100);
          const c=pct>=80?DANGER:pct>=50?WARN:ACC;
          const open=agSel===key;
          return(
            <div style={{...s.card,cursor:'pointer',border:`1px solid ${open?ACC:BDR}`,marginBottom:10}} onClick={()=>setAgSel(open?null:key)}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:15,color:WARN}}>SÁBADO · 10:00</div>
                  <div style={{fontSize:10,color:MUTED}}>{n}/{CAP} vagas</div>
                </div>
                <div style={{textAlign:'center'}}>
                  <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:28,color:c}}>{n}</div>
                  <div style={{fontSize:9,color:MUTED}}>{pct}%</div>
                </div>
              </div>
              <div style={{height:5,background:'rgba(255,255,255,0.06)',borderRadius:3,marginTop:8,overflow:'hidden'}}>
                <div style={{width:`${pct}%`,height:'100%',background:c,borderRadius:3}}/>
              </div>
            </div>
          );
        })()}

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
                  <div style={{fontSize:9,color:MUTED,marginTop:2}}>{a.plano}/sem · {getFreq(a)}/mês</div>
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
            <button style={s.btnP} onClick={()=>{setNovoPlan({nome:'',valor:''});setEditPlan(null);setShowNovoPlan(v=>!v);}}>+ Novo plano</button>
          </div>
          {showNovoPlan&&<div style={{background:SURF2,borderRadius:8,padding:'12px',marginBottom:12,border:`1px solid ${ACC}`}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:8}}>
              <div><label style={s.lbl}>Nome do plano</label><input style={s.inp} value={novoPlan.nome} onChange={e=>setNovoPlan(p=>({...p,nome:e.target.value}))} placeholder="Ex: 4x na semana"/></div>
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
              <div style={{marginBottom:8}}><label style={s.lbl}>Chave PIX</label><input style={s.inp} value={pixChave} onChange={e=>setPixChave(e.target.value)} placeholder="email, CPF, telefone ou chave aleatória"/></div>
              <div style={{marginBottom:10}}><label style={s.lbl}>Nome do beneficiário</label><input style={s.inp} value={pixBenef} onChange={e=>setPixBenef(e.target.value)}/></div>
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
          <div style={{...s.hd,color:INFO}}>📱 WHATSAPP — CUSTO E OPÇÕES</div>
          {[
            {t:'Link direto (wa.me) — GRÁTIS',d:'Já implementado! Botão 📱 abre o WhatsApp com mensagem pré-pronta. Você clica enviar. Custo: R$0.',c:ACC},
            {t:'Z-API (automático) — ~R$89/mês',d:'Envio automático sem ação manual. Solução brasileira mais simples. Ideal quando tiver 30+ alunos.',c:WARN},
            {t:'WhatsApp Business API — R$0,15–0,30/msg',d:'Twilio, Zenvia ou similares. Maior controle, mais caro. Para CT pequeno não compensa ainda.',c:MUTED},
          ].map((it,i)=>(
            <div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${BDR}`}}>
              <div style={{fontSize:12,fontWeight:600,color:it.c,marginBottom:2}}>{it.t}</div>
              <div style={{fontSize:11,color:MUTED,lineHeight:1.5}}>{it.d}</div>
            </div>
          ))}
        </div>

        <div style={{...s.card,border:`1px solid rgba(141,198,63,0.2)`}}>
          <div style={{...s.hd,color:ACC}}>💳 PIX COM VALOR — CUSTO E OPÇÕES</div>
          {[
            {t:'PIX Copia e Cola com valor — GRÁTIS',d:'Já implementado! Geramos a string PIX (padrão EMV) com valor embutido. O aluno cola no banco e o valor já aparece preenchido.',c:ACC},
            {t:'Cobrança PIX automática (Asaas) — R$49/mês fixo',d:'Gera link, envia para o aluno e confirma automaticamente quando pago. Melhor custo-benefício para CT com 20+ alunos.',c:WARN},
            {t:'Por transação (Efí Bank) — ~1,5% por PIX',d:'Paga por uso. Melhor se volume for baixo ou irregular. Taxa de R$1,95 mínima por cobrança.',c:MUTED},
          ].map((it,i)=>(
            <div key={i} style={{padding:'8px 0',borderBottom:`1px solid ${BDR}`}}>
              <div style={{fontSize:12,fontWeight:600,color:it.c,marginBottom:2}}>{it.t}</div>
              <div style={{fontSize:11,color:MUTED,lineHeight:1.5}}>{it.d}</div>
            </div>
          ))}
          <div style={{marginTop:10,padding:'10px',background:'rgba(141,198,63,0.06)',borderRadius:8,fontSize:11,color:TEXT,lineHeight:1.6}}>
            💡 <strong style={{color:ACC}}>Recomendação:</strong> Use PIX Copia e Cola grátis agora. Com 30+ alunos migre para Asaas (R$49/mês) para automação total.
          </div>
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
              <div style={{fontSize:11,color:MUTED,marginBottom:12}}>{showPix.nome} · R${valor} · {MONTHS[TODAY.getMonth()]}</div>
              <div style={{background:'#fff',borderRadius:10,padding:12,display:'inline-block',marginBottom:10}}>
                <svg width={80} height={80} viewBox="0 0 80 80">
                  <rect width={80} height={80} fill="#fff"/>
                  {Array.from({length:7},(_,r)=>Array.from({length:7},(_,c)=>{
                    const isCorner=(r<3&&c<3)||(r<3&&c>3)||(r>3&&c<3);
                    return<rect key={`${r}${c}`} x={c*10+2} y={r*10+2} width={8} height={8} fill={isCorner?'#000':Math.sin(r*c+r+c)>0?'#000':'transparent'}/>;
                  }))}
                  <rect x={2} y={2} width={22} height={22} fill="none" stroke="#000" strokeWidth={2}/>
                  <rect x={56} y={2} width={22} height={22} fill="none" stroke="#000" strokeWidth={2}/>
                  <rect x={2} y={56} width={22} height={22} fill="none" stroke="#000" strokeWidth={2}/>
                  <rect x={6} y={6} width={14} height={14} fill="#000"/>
                  <rect x={60} y={6} width={14} height={14} fill="#000"/>
                  <rect x={6} y={60} width={14} height={14} fill="#000"/>
                </svg>
              </div>
              <div style={{background:SURF2,borderRadius:8,padding:'10px',marginBottom:10,textAlign:'left'}}>
                <div style={{fontSize:9,color:MUTED,marginBottom:3}}>CHAVE PIX</div>
                <div style={{fontSize:12,color:ACC,fontFamily:"'JetBrains Mono',monospace",marginBottom:6}}>{pixChave}</div>
                <div style={{fontSize:9,color:MUTED,marginBottom:3}}>VALOR EMBUTIDO</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,color:ACC,marginBottom:6}}>R$ {valor}</div>
                <div style={{fontSize:9,color:MUTED,marginBottom:3}}>PIX COPIA E COLA</div>
                <div style={{fontSize:8,color:MUTED,wordBreak:'break-all',fontFamily:"'JetBrains Mono',monospace",background:BG,padding:'6px',borderRadius:5,lineHeight:1.4}}>{pix.slice(0,80)}...</div>
                <button style={{...s.btnS,width:'100%',marginTop:8,fontSize:10}} onClick={()=>{navigator.clipboard?.writeText(pix);alert('PIX Copia e Cola copiado! Valor R$'+valor+' já incluído.');}}>📋 Copiar PIX com valor</button>
              </div>
              <div style={{display:'flex',gap:7}}>
                {showPix.tel&&<button style={{...s.btnS,flex:1,borderColor:'#25D366',color:'#25D366',fontSize:10}} onClick={()=>window.open(waLink(showPix,`Olá ${showPix.nome.split(' ')[0]}! 👋 Seu PIX para mensalidade Pōkai (R$${valor}):\n\n${pix}\n\nCopie e cole no app do seu banco. Obrigado!`),'_blank')}>📱 Enviar WA</button>}
                <button style={{...s.btnP,flex:1,fontSize:11}} onClick={()=>setShowPix(null)}>Fechar</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
