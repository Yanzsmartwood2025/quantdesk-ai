import {categories, inventory, snapshot} from "./catalog.js";
import {budget, createViewerState, generatedCandles, advanceDemoCandles,
        educationalIntervals, getAgentMessages, describeItem} from "./engine.js";

/* Beat Studio is a fictional, offline UI exercise. No platform integrations. */
const state=createViewerState();
const el=id=>document.getElementById(id);
const counts=Object.fromEntries(categories.map(name=>[
  name, inventory.filter(item=>item.group===name).length
]));
const icons={Forex:"F",Sintéticos:"S",Cripto:"C",Índices:"I",Commodities:"M"};
const SAMPLE_COUNT=48;
let demoCandles=[];
let playbackTimer=null;
let demoStep=0;

function node(tag,cls,txt){
  const e=document.createElement(tag);
  if(cls)e.className=cls;
  if(txt!==undefined)e.textContent=txt;
  return e;
}
function stopVoice(){
  if("speechSynthesis" in window)window.speechSynthesis.cancel();
  el("voice-status").textContent="Voz detenida · ninguna petición a IA";
}
function stopAnimation(){
  if(playbackTimer!==null){
    clearInterval(playbackTimer);
    playbackTimer=null;
  }
  updatePlayButton();
}
function updatePlayButton(){
  const button=el("play");
  const selected=state.snapshot().selected;
  button.disabled=!selected;
  button.textContent=playbackTimer!==null?"Ⅱ Pausar simulación":"▶ Animar vela";
  button.setAttribute("aria-pressed",String(playbackTimer!==null));
}
function refreshSample(){
  const {selected,range}=state.snapshot();
  demoCandles=selected?generatedCandles(selected.code,range,SAMPLE_COUNT):[];
  demoStep=0;
}
function setCategory(group,open=true){
  stopVoice();stopAnimation();
  state.category(group);
  el("search").value="";
  el("drawer-query").value="";
  refreshSample();
  renderAll();
  if(open)openDrawer();
}
function chooseItem(item){
  stopVoice();stopAnimation();
  state.select(item);
  refreshSample();renderAll();closeDrawer();
}
function renderTabs(){
  const selectedGroup=state.snapshot().category;
  const top=el("tabs");
  const drawer=el("drawer-tabs");
  top.replaceChildren();drawer.replaceChildren();
  for(const category of categories){
    for(const [root,inDrawer] of [[top,false],[drawer,true]]){
      const b=node("button","tab"+(category===selectedGroup?" active":""),category+" ");
      b.type="button";
      if(!inDrawer)b.setAttribute("role","tab");
      b.setAttribute(inDrawer?"aria-pressed":"aria-selected",String(category===selectedGroup));
      b.append(node("span","count",String(counts[category])));
      b.addEventListener("click",()=>{
        if(category!==state.snapshot().category){
          setCategory(category,!inDrawer);
        }else if(!inDrawer){
          openDrawer();
        }
      });
      root.append(b);
    }
  }
}
function renderCatalog(){
  const root=el("catalog");
  root.replaceChildren();
  const {category,query,selected}=state.snapshot();
  const needle=query.trim().toLocaleLowerCase("es");
  const examples=inventory.filter(item=>
    item.group===category&&(item.code+" "+item.subcategory).toLocaleLowerCase("es").includes(needle)
  );
  if(!examples.length){
    root.append(node("div","empty-msg","No hay muestras ficticias que coincidan con la búsqueda."));
    return;
  }
  const grid=node("div","records");
  for(const item of examples){
    const b=node("button","record"+(selected?.code===item.code?" active":""));
    b.type="button";
    b.setAttribute("aria-pressed",String(selected?.code===item.code));
    b.append(node("span","record-glyph",icons[item.group]||"·"));
    const names=node("span","record-labels");
    names.append(node("strong","",item.code),node("small","",item.subcategory+" · Ficticio"));
    b.append(names);
    b.addEventListener("click",()=>chooseItem(item));
    grid.append(b);
  }
  root.append(grid);
}
function openDrawer(){
  const dialog=el("catalog-dialog");
  el("drawer-query").value=state.snapshot().query;
  renderTabs();renderCatalog();
  if(!dialog.open)dialog.showModal();
  el("drawer-query").focus();
}
function closeDrawer(){
  const dialog=el("catalog-dialog");
  if(dialog.open)dialog.close();
}
function renderRanges(){
  const root=el("ranges");
  root.replaceChildren();
  const {range}=state.snapshot();
  for(const interval of educationalIntervals){
    const button=node("button","range-btn"+(interval.id===range?" active":""),interval.id);
    button.type="button";
    button.title="Intervalo didáctico de "+interval.label;
    button.setAttribute("aria-pressed",String(interval.id===range));
    button.addEventListener("click",()=>{
      stopAnimation();state.range(interval.id);
      refreshSample();renderAll();
    });
    root.append(button);
  }
}
function renderChart(){
  const selected=state.snapshot().selected;
  const svg=el("chart");
  if(!selected){
    svg.replaceChildren();
    el("chart-empty").hidden=false;
    el("status").textContent="SIN ACTIVIDAD";
    return;
  }
  el("chart-empty").hidden=true;
  el("status").textContent=playbackTimer!==null
    ?"SIMULACIÓN LOCAL ACELERADA · NO ES TIEMPO REAL"
    :"48 VELAS FICTICIAS · 0 CONSULTAS";
  const points=demoCandles;
  const mapY=n=>370-n*3.14;
  const grid=[10,28,46,64,82].map(n=>
    '<line x1="35" y1="'+mapY(n)+'" x2="888" y2="'+mapY(n)+'" stroke="#323232" stroke-width="1"/>'
  ).join("");
  const bars=points.map((c,i)=>{
    const x=40+i*17.6;
    const color=c.close>=c.open?"#22c55e":"#ef4444";
    const top=mapY(Math.max(c.open,c.close));
    const bottom=mapY(Math.min(c.open,c.close));
    const topWick=mapY(c.high),bottomWick=mapY(c.low);
    return '<line x1="'+x+'" y1="'+topWick+'" x2="'+x+'" y2="'+bottomWick+
      '" stroke="'+color+'" stroke-width="2"/>'+
      '<rect x="'+(x-5.4)+'" y="'+top+'" width="10.8" height="'+
      Math.max(1.5,bottom-top)+'" rx="1.2" fill="'+color+'"/>';
  }).join("");
  svg.innerHTML='<rect width="920" height="420" fill="#111"/>'+grid+
    '<g opacity=".27">'+[160,320,480,640,800].map(x=>
      '<line x1="'+x+'" y1="40" x2="'+x+'" y2="375" stroke="#333"/>'
    ).join("")+'</g>'+bars+
    '<text x="42" y="404" font-size="13" fill="#aaa">'+
    'SIMULACIÓN FICTICIA · TIEMPO ACELERADO · SIN COTIZACIONES</text>';
}
function renderAgents(){
  const {selected}=state.snapshot();
  const root=el("agents");root.replaceChildren();
  const glyphs=["◌","◇","◎"];
  getAgentMessages(selected).forEach((agent,index)=>{
    const card=node("article","agent-card");
    const top=node("div","agent-top");
    top.append(node("div","agent-icon",glyphs[index]));
    const meta=node("div");
    meta.append(node("h4","",agent.name),node("small","",agent.role));
    top.append(meta);
    card.append(top,node("p","",agent.message));
    root.append(card);
  });
}
function renderInfo(){
  const {selected,category,range}=state.snapshot();
  const current=educationalIntervals.find(x=>x.id===range);
  el("selected-name").textContent=selected?selected.code:"Selecciona una muestra";
  el("selected-details").textContent=selected
    ?selected.subcategory+" · "+selected.group+" · "+(current?.label||range)+
      " (escala didáctica acelerada)"
    :counts[category]+" muestras ficticias disponibles en "+category;
  el("close").hidden=!selected;
  el("open-count").textContent=(selected?"1":"0")+" / 1";
  el("fact-name").textContent=selected?selected.code:"Ninguna muestra";
  const facts=el("facts");facts.replaceChildren();
  const entries=selected?[
    ["Categoría",selected.group],
    ["Muestra",selected.subcategory],
    ["Intervalo didáctico",current?.label||range],
    ["Fuente","Generación matemática local"],
    ["Conexiones en curso","0"]
  ]:[
    ["Fuente",snapshot.source],
    ["Muestras en la categoría",String(counts[category])],
    ["Conexiones en curso","0"]
  ];
  for(const [key,value] of entries){
    const row=node("div");
    row.append(node("dt","",key),node("dd","",value));
    facts.append(row);
  }
  updatePlayButton();
}
function renderAll(){
  renderTabs();renderCatalog();renderRanges();renderChart();renderAgents();renderInfo();
}
function startAnimation(){
  if(!state.snapshot().selected)return;
  if(playbackTimer!==null){stopAnimation();renderChart();return;}
  // Local animation only. One timer for the one visible fictional series.
  playbackTimer=setInterval(()=>{
    if(document.hidden||!state.snapshot().selected){stopAnimation();renderChart();return;}
    demoStep+=1;
    demoCandles=advanceDemoCandles(demoCandles,demoStep,state.snapshot().selected.code);
    renderChart();
  },1250);
  updatePlayButton();renderChart();
}

el("chooser").addEventListener("click",openDrawer);
el("drawer-close").addEventListener("click",closeDrawer);
el("catalog-dialog").addEventListener("click",event=>{
  if(event.target===el("catalog-dialog"))closeDrawer();
});
el("search").addEventListener("input",event=>{
  state.query(event.target.value);
  el("drawer-query").value=event.target.value;
  openDrawer();
});
el("drawer-query").addEventListener("input",event=>{
  state.query(event.target.value);
  el("search").value=event.target.value;
  renderCatalog();
});
el("close").addEventListener("click",()=>{
  stopAnimation();stopVoice();state.clear();refreshSample();renderAll();
});
el("reset").addEventListener("click",()=>{
  stopAnimation();stopVoice();closeDrawer();
  state.category("Forex");state.range("1D");
  el("search").value="";el("drawer-query").value="";
  refreshSample();renderAll();
});
el("play").addEventListener("click",startAnimation);
el("speak").addEventListener("click",()=>{
  if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){
    el("voice-status").textContent="Este navegador no ofrece síntesis de voz local.";
    return;
  }
  stopVoice();
  const selected=state.snapshot().selected;
  const summary=describeItem(selected)+" "+getAgentMessages(selected).map(x=>x.name+": "+x.message).join(" ");
  const utterance=new SpeechSynthesisUtterance(summary);
  utterance.lang="es-ES";utterance.rate=1;
  utterance.onend=()=>{el("voice-status").textContent="Lectura terminada";};
  utterance.onerror=()=>{el("voice-status").textContent="No fue posible reproducir la voz local.";};
  el("voice-status").textContent="Lectura local · ninguna llamada a IA";
  window.speechSynthesis.speak(utterance);
});
el("stop").addEventListener("click",stopVoice);
document.addEventListener("visibilitychange",()=>{
  if(document.hidden){stopAnimation();stopVoice();}
});
window.addEventListener("pagehide",()=>{stopAnimation();stopVoice();});
if(budget.flags.remoteData||budget.flags.remoteAI||budget.flags.trading||
   budget.flags.autoPolling||budget.flags.autoSubscriptions)throw Error("Safety budget misconfigured");
refreshSample();renderAll();
