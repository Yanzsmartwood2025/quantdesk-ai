import {categories, inventory, snapshot} from "./catalog.js";
import {budget, createViewerState, generatedCandles, getAgentMessages, describeItem} from "./engine.js";

const state=createViewerState();
const el=id=>document.getElementById(id);
const counts=Object.fromEntries(categories.map(name=>[name,inventory.filter(item=>item.group===name).length]));
const ranges=["1H","1D","1S","1M"];

const node=(tag,cls,txt)=>{
 const e=document.createElement(tag);
 if(cls)e.className=cls;
 if(txt!==undefined)e.textContent=txt;
 return e;
};
function renderTabs(){
 const root=el("tabs");root.replaceChildren();
 const {category}=state.snapshot();
 categories.forEach(group=>{
  const b=node("button","tab"+(group===category?" active":""),group+"  ");
  b.type="button";b.role="tab";b.setAttribute("aria-selected",String(group===category));
  b.append(node("span","count",String(counts[group])));
  b.addEventListener("click",()=>{
    if(group===state.snapshot().category)return;
    stopVoice();state.category(group);el("search").value="";
    el("catalog").hidden=true;el("chooser").setAttribute("aria-expanded","false");render();
  });
  root.append(b);
 });
}
function renderCatalog(){
 const root=el("catalog");root.replaceChildren();
 const {category,query,selected}=state.snapshot();
 const needle=query.toLocaleLowerCase("es");
 const items=inventory.filter(i=>i.group===category&&(i.code+" "+i.subcategory).toLocaleLowerCase("es").includes(needle));
 if(!items.length)root.append(node("div","empty-msg",counts[category]===0?"Esta categoría todavía no tiene registros guardados. No se inventaron instrumentos.":"Sin coincidencias en esta categoría."));
 else{
  const grid=node("div","records");
  items.forEach(item=>{
   const button=node("button","record"+(selected?.code===item.code?" active":""),undefined);
   button.type="button";button.setAttribute("aria-pressed",String(selected?.code===item.code));
   button.append(node("strong","",item.code.replaceAll("_","/")));
   button.append(node("small","",item.subcategory));
   button.addEventListener("click",()=>{
    stopVoice();state.select(item);el("catalog").hidden=true;
    el("chooser").setAttribute("aria-expanded","false");render();
   });
   grid.append(button);
  });
  root.append(grid);
 }
}
function renderRanges(){
 const root=el("ranges");root.replaceChildren();
 const active=state.snapshot().range;
 for(const range of ranges){
  const b=node("button","range-btn"+(range===active?" active":""),range);
  b.type="button";b.setAttribute("aria-pressed",String(range===active));
  b.addEventListener("click",()=>{state.range(range);render()});
  root.append(b);
 }
}
function renderChart(){
 const {selected,range}=state.snapshot();
 const svg=el("chart");
 if(!selected){svg.replaceChildren();el("chart-empty").hidden=false;el("status").textContent="SIN ACTIVIDAD";return;}
 el("chart-empty").hidden=true;el("status").textContent="48 MUESTRAS LOCALES · 0 CONSULTAS";
 // These are deterministic invented coordinates, NEVER quotes or historical prices.
 const points=generatedCandles(selected.code,range,48);
 const mapY=n=>370-n*3.14;
 const grid=[10,28,46,64,82].map(n=>`<line x1="35" y1="${mapY(n)}" x2="888" y2="${mapY(n)}" stroke="#323232" stroke-width="1"/>`).join("");
 const candles=points.map((c,i)=>{
  const x=40+i*17.6, up=c.close>=c.open;
  const color=up?"#22c55e":"#ef4444";
  const y1=mapY(c.high),y2=mapY(c.low);
  const top=mapY(Math.max(c.open,c.close)),bottom=mapY(Math.min(c.open,c.close));
  return `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="${color}" stroke-width="2"/><rect x="${x-5.4}" y="${top}" width="10.8" height="${Math.max(1.5,bottom-top)}" rx="1.2" fill="${color}"/>`;
 }).join("");
 svg.innerHTML=`<rect width="920" height="420" fill="#111"/>${grid}<g opacity=".27">${[160,320,480,640,800].map(x=>`<line x1="${x}" y1="40" x2="${x}" y2="375" stroke="#333"/>`).join("")}</g>${candles}<text x="42" y="404" font-size="13" fill="#aaa">SIMULACIÓN MATEMÁTICA · NO ES UNA COTIZACIÓN</text>`;
}
function renderAgents(){
 const {selected}=state.snapshot(),root=el("agents");root.replaceChildren();
 const icons=["◌","◇","◎"];
 getAgentMessages(selected).forEach((agent,index)=>{
  const card=node("article","agent-card");
  const top=node("div","agent-top");
  top.append(node("div","agent-icon",icons[index]));
  const meta=node("div");meta.append(node("h4","",agent.name),node("small","",agent.role));
  top.append(meta);card.append(top,node("p","",agent.message));root.append(card);
 });
}
function render(){
 const {selected,category}=state.snapshot();
 renderTabs();renderCatalog();renderRanges();renderChart();renderAgents();
 el("selected-name").textContent=selected?selected.code.replaceAll("_","/"):"Selecciona una serie";
 el("selected-details").textContent=selected?selected.subcategory+" · "+selected.group+" · instantánea histórica":counts[category]?"Elige uno de los "+counts[category]+" registros de "+category:"Categoría sin registros históricos";
 el("close").hidden=!selected;el("open-count").textContent=(selected?"1":"0")+" / 1";
 el("fact-name").textContent=selected?selected.code:"Ningún registro";
 const facts=el("facts");facts.replaceChildren();
 const entries=selected?[["Grupo",selected.group],["Subcategoría",selected.subcategory],["Origen","Instantánea histórica"],["Disponibilidad hoy","No verificada"],["Conexiones en curso","0"]]:[["Fuente",snapshot.source],["Registros en esta categoría",String(counts[category])],["Conexiones en curso","0"]];
 for(const [key,value] of entries){
  const row=node("div");row.append(node("dt","",key),node("dd","",value));facts.append(row);
 }
}
function stopVoice(){
 if("speechSynthesis" in window){window.speechSynthesis.cancel()}
 el("voice-status").textContent="Voz detenida · ninguna petición de IA";
}
el("chooser").addEventListener("click",()=>{
 const root=el("catalog"),opening=root.hidden;root.hidden=!opening;
 el("chooser").setAttribute("aria-expanded",String(opening));
 if(opening)renderCatalog();
});
el("search").addEventListener("input",event=>{
 state.query(event.target.value);
 el("catalog").hidden=false;el("chooser").setAttribute("aria-expanded","true");renderCatalog();
});
el("close").addEventListener("click",()=>{stopVoice();state.clear();render()});
el("reset").addEventListener("click",()=>{
 stopVoice();state.category("Forex");state.range("1D");el("search").value="";el("catalog").hidden=true;
 el("chooser").setAttribute("aria-expanded","false");render();
});
el("speak").addEventListener("click",()=>{
 if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){
  el("voice-status").textContent="Este navegador no ofrece síntesis de voz local.";return;
 }
 stopVoice();
 const selected=state.snapshot().selected;
 const summary=describeItem(selected)+" "+getAgentMessages(selected).map(x=>x.name+": "+x.message).join(" ");
 const u=new SpeechSynthesisUtterance(summary);
 u.lang="es-ES";u.rate=1;u.pitch=1;
 u.onend=()=>{el("voice-status").textContent="Lectura terminada";};
 u.onerror=()=>{el("voice-status").textContent="La voz del navegador no pudo reproducirse.";};
 el("voice-status").textContent="Hablando con voz del navegador · sin IA externa";
 window.speechSynthesis.speak(u);
});
el("stop").addEventListener("click",stopVoice);
window.addEventListener("pagehide",stopVoice);
if(budget.flags.remoteData||budget.flags.remoteAI||budget.flags.trading||budget.flags.autoPolling)throw Error("Safety budget misconfigured");
render();
