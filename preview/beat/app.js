import {groups,labels,catalogNote} from "./catalog.js";
import {createViewerState,periods,resourcePolicy,agentSpaces} from "./engine.js";

const ui=createViewerState();
const el=id=>document.getElementById(id);
const navButton=el("nav-toggle");
const sidebar=el("sidebar");
const scrim=el("scrim");
let sidebarOpen=false;
const nodes=(tag,cls,text)=>{
  const element=document.createElement(tag);
  if(cls)element.className=cls;
  if(text!==undefined)element.textContent=text;
  return element;
};
function showSidebar(open){
  sidebarOpen=!!open;
  document.body.classList.toggle("sidebar-open",sidebarOpen);
  navButton.setAttribute("aria-expanded",String(sidebarOpen));
  navButton.setAttribute("aria-label",sidebarOpen?"Cerrar bandeja de activos":"Abrir bandeja de activos");
  sidebar.setAttribute("aria-hidden",String(!sidebarOpen));
  sidebar.inert=!sidebarOpen;
  scrim.hidden=!sidebarOpen;
  if(sidebarOpen)el("filter").focus();
  else navButton.focus();
}
function count(group){
  return labels.filter(item=>item.group===group).length;
}
function selectGroup(group){
  ui.chooseCategory(group);
  el("filter").value="";
  render();
}
function selectAsset(item){
  ui.chooseItem(item);
  el("filter").value="";
  showSidebar(false);
  render();
}
function renderGroups(){
  const current=ui.get().category;
  const root=el("categories");
  root.replaceChildren();
  for(const group of groups){
    const button=nodes("button","category"+(group.id===current?" active":""),undefined);
    button.type="button";
    button.setAttribute("aria-pressed",String(group.id===current));
    button.append(nodes("span","",group.label),nodes("span","cat-count",String(count(group.id))));
    button.addEventListener("click",()=>selectGroup(group.id));
    root.append(button);
  }
}
function renderAssets(){
  const group=ui.get().category;
  const query=el("filter").value.trim().toLocaleLowerCase("es");
  const results=labels.filter(item=>(!query?item.group===group:
    (item.name+" "+item.code+" "+item.group).toLocaleLowerCase("es").includes(query)));
  const root=el("asset-list");
  root.replaceChildren();
  el("group-label").textContent=query?"Resultados de búsqueda":
    (groups.find(item=>item.id===group)?.label??group);
  el("group-count").textContent=String(results.length);
  if(!results.length){
    root.append(nodes("p","no-results","No hay nombres de referencia que coincidan."));
    return;
  }
  for(const item of results){
    const button=nodes("button","asset-row"+(ui.get().item?.code===item.code?" chosen":""),undefined);
    button.type="button";
    button.setAttribute("aria-pressed",String(ui.get().item?.code===item.code));
    const avatar=nodes("span","asset-avatar",item.icon);
    const body=nodes("span","asset-label");
    body.append(nodes("strong","",item.name));
    body.append(nodes("small","",item.code+" · Nombre de referencia"));
    button.append(avatar,body);
    button.addEventListener("click",()=>selectAsset(item));
    root.append(button);
  }
}
function renderPeriods(){
  const root=el("timeframes");
  root.replaceChildren();
  for(const period of periods){
    const button=nodes("button","timeframe"+(ui.get().period===period?" active":""),period);
    button.type="button";
    button.setAttribute("aria-pressed",String(ui.get().period===period));
    button.addEventListener("click",()=>{
      ui.choosePeriod(period);render();
    });
    root.append(button);
  }
}
function renderMain(){
  const {item,period}=ui.get();
  el("selected-name").textContent=item?.name??"Selecciona un activo";
  el("selected-context").textContent=item?
    item.code+" · Nombre de referencia · Disponibilidad no verificada":
    "Abre el menú de la esquina superior izquierda para elegir un nombre.";
  el("clear").hidden=!item;
  el("open-count").textContent=(item?"1":"0")+" / 1";
  el("period-display").textContent="Período seleccionado: "+period;
  el("empty-title").textContent=item?"Sin datos en vivo de "+item.name:
    "No hay cotizaciones conectadas";
  el("empty-text").textContent=item?
    "Este nombre se muestra correctamente, pero esta pantalla no recibe cotizaciones ni crea velas en tiempo real. No se ha verificado su disponibilidad en Deriv.":
    "La bandeja permite explorar nombres conocidos; no hay consultas a mercados ni datos ficticios en movimiento.";
}
function render(){
  renderGroups();
  renderAssets();
  renderPeriods();
  renderMain();
}
navButton.addEventListener("click",()=>showSidebar(!sidebarOpen));
el("nav-close").addEventListener("click",()=>showSidebar(false));
scrim.addEventListener("click",()=>showSidebar(false));
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"&&sidebarOpen)showSidebar(false);
});
el("filter").addEventListener("input",renderAssets);
el("clear").addEventListener("click",()=>{ui.close();render()});
if(resourcePolicy.maxOpenViews!==1||
   resourcePolicy.remoteConnections!==0||
   resourcePolicy.realtimeSubscriptions!==0||
   resourcePolicy.apiRequests!==0||
   resourcePolicy.remoteAgentsEnabled||
   resourcePolicy.orderExecutionEnabled||
   agentSpaces.some(agent=>agent.mode!=="disabled"))throw Error("Beat UI resources disabled by policy");
document.querySelector(".sidebar-note").title=catalogNote;
render();
