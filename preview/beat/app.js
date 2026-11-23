import {groups,labels,catalogNote} from "./catalog.js";

const el=(id)=>document.getElementById(id);
const state={category:"Acciones",selected:labels.find(item=>item.code==="MSFT")||labels[0],period:"1",section:"chart",sidebarOpen:false};
const periods=[{value:"1",label:"1m"},{value:"5",label:"5m"},{value:"15",label:"15m"},{value:"60",label:"1h"},{value:"1D",label:"1D"},{value:"1W",label:"1S"}];
const tvChart=el("tv-chart");
const create=(tag,className,value)=>{
  const node=document.createElement(tag);
  if(className)node.className=className;
  if(value!==undefined)node.textContent=value;
  return node;
};

function showSidebar(open){
  state.sidebarOpen=!!open;
  document.body.classList.toggle("sidebar-open",state.sidebarOpen);
  el("nav-toggle").setAttribute("aria-expanded",String(state.sidebarOpen));
  el("sidebar").setAttribute("aria-hidden",String(!state.sidebarOpen));
  el("sidebar").inert=!state.sidebarOpen;
  el("scrim").hidden=!state.sidebarOpen;
  if(state.sidebarOpen)el("filter").focus();
  else el("nav-toggle").focus();
}
function listInCategory(){
  const needle=el("filter").value.trim().toLocaleLowerCase("es");
  return labels.filter(item=>needle
    ?(item.name+" "+item.code+" "+item.group).toLocaleLowerCase("es").includes(needle)
    :item.group===state.category);
}
function renderCategories(){
  const root=el("categories");root.replaceChildren();
  groups.forEach(group=>{
    const btn=create("button","category"+(state.category===group.id?" active":""));
    btn.type="button";
    btn.setAttribute("aria-pressed",String(state.category===group.id));
    btn.append(create("span","",group.label),create("span","cat-count",String(labels.filter(item=>item.group===group.id).length)));
    btn.addEventListener("click",()=>{
      state.category=group.id;
      el("filter").value="";
      renderCategories();renderAssets();
    });
    root.append(btn);
  });
}
function renderAssets(){
  const items=listInCategory(),root=el("asset-list");
  root.replaceChildren();
  const query=el("filter").value.trim();
  el("group-label").textContent=query?"Resultados de búsqueda":groups.find(g=>g.id===state.category)?.label||state.category;
  el("group-count").textContent=String(items.length);
  if(!items.length){root.append(create("p","no-results","No hay símbolos que coincidan con la búsqueda."));return;}
  items.forEach(item=>{
    const selected=state.selected?.code===item.code&&state.selected?.group===item.group;
    const btn=create("button","asset-row"+(selected?" chosen":""));
    btn.type="button";
    btn.setAttribute("aria-pressed",String(selected));
    const icon=create("span","asset-avatar",item.icon);
    icon.setAttribute("aria-hidden","true");
    const body=create("span","asset-body");
    body.append(create("strong","",item.name),create("small","",item.code+" · "+(item.tvSymbol?"Gráfico de referencia":"Sin fuente de gráfico")));
    btn.append(icon,body,create("span","asset-arrow","›"));
    btn.addEventListener("click",()=>choose(item));
    root.append(btn);
  });
}
function renderPeriodButtons(){
  const root=el("timeframes");root.replaceChildren();
  periods.forEach(period=>{
    const btn=create("button","timeframe"+(state.period===period.value?" active":""),period.label);
    btn.type="button";
    btn.setAttribute("aria-pressed",String(state.period===period.value));
    btn.addEventListener("click",()=>{
      state.period=period.value;
      if(state.selected?.tvSymbol)tvChart.setAttribute("interval",period.value);
      renderPeriodButtons();
    });
    root.append(btn);
  });
}
function choose(item){
  if(!item)return;
  state.selected=item;
  state.category=item.group;
  showSidebar(false);
  renderCategories();renderAssets();renderMarket();renderDetail();
  setSection("chart");
}
function renderMarket(){
  const item=state.selected;
  el("selected-avatar").textContent=item.icon;
  el("selected-category").textContent=item.group.toLocaleUpperCase("es")+" / "+item.source;
  el("selected-name").textContent=item.name;
  el("selected-context").textContent=item.code+" · Referencia de mercado, no símbolo garantizado de bróker";
  el("chart-title").textContent=item.name;
  const hasChart=!!item.tvSymbol;
  el("chart-widget").hidden=!hasChart;
  el("chart-unavailable").hidden=hasChart;
  el("source-title").textContent=hasChart?"Gráfico externo de TradingView":"Sin fuente de gráfico";
  el("source-note").textContent=hasChart?"Cotizaciones sujetas a cobertura y posible retraso":"Sin cotizaciones inventadas";
  el("graph-tool-status").textContent=hasChart?"Widget externo":"Sin fuente conectada";
  if(hasChart){
    tvChart.setAttribute("symbol",item.tvSymbol);
    tvChart.setAttribute("interval",state.period);
  }
}
function fact(label,value){
  const card=create("div","fact-card");
  card.append(create("small","",label),create("strong","",value));
  return card;
}
function makeInfo(){
  const item=state.selected;
  const wrap=create("div","fact-list");
  wrap.append(fact("Nombre",item.name),fact("Código local",item.code),fact("Mercado",item.group),fact("Fuente del gráfico",item.tvSymbol||"Sin configurar"),fact("Proveedor / referencia",item.source),fact("Estado de datos",item.tvSymbol?"Widget externo":"No disponible"));
  const note=create("div","fact-note",
    "Los valores, logotipos e indicadores del gráfico, cuando estén disponibles, los presenta TradingView. Esta ficha no incluye precios inventados ni compara directamente cotizaciones de distintos proveedores.");
  const frag=document.createDocumentFragment();
  frag.append(wrap,note);
  if(item.group==="Acciones"&&item.tvSymbol){
    const box=create("div","tv-profile-shell");
    box.append(create("div","eyebrow","PERFIL DE EMPRESA · TRADINGVIEW"));
    const widget=create("tv-company-profile","");
    widget.setAttribute("symbol",item.tvSymbol);
    box.append(widget);
    frag.append(box);
  }
  return frag;
}
function makeTools(){
  const root=create("div","utility-grid");
  const options=[
    {icon:"▥",title:"Gráfico y temporalidades",detail:"Abre el visor externo y sus herramientas disponibles.",action:"chart"},
    {icon:"ⓘ",title:"Ficha del símbolo",detail:"Nombre, fuente y perfil empresarial cuando exista.",action:"info"},
    {icon:"✧",title:"Actividad de IA",detail:"Ver eventos reales enviados por agentes autorizados.",action:"ai"},
    {icon:"⌕",title:"Buscar instrumento",detail:"Explorar referencias, acciones, divisas e índices.",action:"catalog"}
  ];
  options.forEach(o=>{
    const button=create("button","utility");
    button.type="button";
    const icon=create("span","utility-icon",o.icon);
    const text=create("span","");
    text.append(create("strong","",o.title),create("small","",o.detail));
    button.append(icon,text);
    button.addEventListener("click",()=>o.action==="catalog"?showSidebar(true):setSection(o.action));
    root.append(button);
  });
  const explanation=create("p","note-panel","Las herramientas de dibujo e indicadores dependen del gráfico de TradingView. Beat no simula su ejecución. Para incluir herramientas propias se necesitará desarrollarlas e integrar una fuente autorizada.");
  const frag=document.createDocumentFragment();frag.append(root,explanation);return frag;
}
function renderDetail(){
  const section=state.section;
  el("detail-eyebrow").textContent=section==="tools"?"HERRAMIENTAS DE CONSULTA":"FICHA DEL ACTIVO";
  el("detail-title").textContent=section==="tools"?"Utilidades disponibles":"Información";
  const root=el("detail-content");root.replaceChildren(section==="tools"?makeTools():makeInfo());
}
function setSection(section){
  if(!["chart","info","tools","ai"].includes(section))return;
  state.section=section;
  document.querySelectorAll("[data-section]").forEach(button=>{
    const current=button.getAttribute("data-section")===section;
    button.classList.toggle("active",current);
    button.setAttribute("aria-pressed",String(current));
  });
  if(section==="info"||section==="tools"){
    renderDetail();
    el("details-area").scrollIntoView({behavior:"smooth",block:"start"});
  }else{
    if(section==="ai")el("intelligence-panel").scrollIntoView({behavior:"smooth",block:"start"});
    else el("chart-container").scrollIntoView({behavior:"smooth",block:"center"});
  }
}
function clampText(value,max){
  return typeof value==="string"?value.trim().slice(0,max):"";
}
let acceptedEvents=0;
// Read-only bridge for authenticated backend messages. Does not execute agents,
// send orders, stream private prompts, or create fake agent history.
const BeatAudit=Object.freeze({
  push(raw){
    if(!raw||typeof raw!=="object")return false;
    const agent=clampText(raw.agent,60),tool=clampText(raw.tool,70),
      summary=clampText(raw.summary,180);
    const allowed=["queued","running","completed","error"];
    const status=allowed.includes(raw.status)?raw.status:"queued";
    if(!agent||!tool||!summary)return false;
    const when=raw.at&&Number.isFinite(Date.parse(raw.at))?new Date(raw.at):new Date();
    const item=create("article","event-item");
    item.append(create("h4","",agent+" · "+tool),create("p","",summary));
    const meta=create("div","event-meta");
    meta.append(create("span","",status),create("time","",when.toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})));
    item.append(meta);
    el("activity-empty").hidden=true;
    el("activity-feed").prepend(item);
    acceptedEvents++;
    el("event-count").textContent=String(acceptedEvents)+" evento"+(acceptedEvents===1?"":"s");
    el("ai-tool-status").textContent="Eventos recibidos";
    while(el("activity-feed").querySelectorAll(".event-item").length>20){
      el("activity-feed").lastElementChild.remove();
    }
    return true;
  },
  speaker(name,status){
    if(!["A","B"].includes(name)||!["speaking","idle","disconnected"].includes(status))return false;
    const output=el(name==="A"?"speaker-a-state":"speaker-b-state");
    const speaker=output.closest(".speaker");
    output.textContent={speaking:"Hablando",idle:"En espera",disconnected:"Desconectado"}[status];
    speaker.classList.toggle("speaking",status==="speaking");
    return true;
  }
});
Object.defineProperty(window,"BeatAudit",{value:BeatAudit,writable:false,configurable:false});
window.addEventListener("beat:agent-event",event=>{
  if(event instanceof CustomEvent)BeatAudit.push(event.detail);
});
document.querySelectorAll("[data-section]").forEach(button=>{
  button.addEventListener("click",()=>setSection(button.getAttribute("data-section")));
});
el("nav-toggle").addEventListener("click",()=>showSidebar(!state.sidebarOpen));
el("nav-close").addEventListener("click",()=>showSidebar(false));
el("scrim").addEventListener("click",()=>showSidebar(false));
el("change-asset").addEventListener("click",()=>showSidebar(true));
el("panel-toggle").addEventListener("click",()=>setSection("ai"));
el("filter").addEventListener("input",renderAssets);
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&state.sidebarOpen)showSidebar(false);
});
el("expand-chart").addEventListener("click",()=>{
  const panel=document.querySelector(".chart-panel");
  if(document.fullscreenElement)document.exitFullscreen();
  else if(panel?.requestFullscreen)panel.requestFullscreen();
});
renderCategories();renderAssets();renderPeriodButtons();renderMarket();renderDetail();
el("sidebar").title=catalogNote;
