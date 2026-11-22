/* Estado y dibujo educativos: no hay imports de API, DB, broker, señales o tareas. */
export function createBudget() {
  const flags = Object.freeze({remoteData:false,remoteAI:false,autoPolling:false,autoSubscriptions:false,trading:false});
  return Object.freeze({flags,maxVisibleItems:1,maxSimultaneousAgentExercises:1,externalRequests:0,externalSpendUSD:0});
}
export const budget = createBudget();

export function createViewerState() {
  let category="Forex", selected=null, range="1D", query="";
  return {
    snapshot:()=>({category,selected,range,query}),
    category:(value)=>{category=value;selected=null;query="";return this;},
    select:(item)=>{selected=item??null;return selected;},
    clear:()=>{selected=null;return null;},
    range:(value)=>{range=value;return range;},
    query:(value)=>{query=value||"";return query;}
  };
}

export function generatedCandles(code,range="1D",length=48){
  const word=String(code)+":"+String(range);
  let hash=2166136261;
  for(const char of word){hash=Math.imul(hash^char.charCodeAt(0),16777619)>>>0;}
  const rnd=()=>{hash=(Math.imul(hash,1664525)+1013904223)>>>0;return hash/4294967296;};
  let last=50;
  return Array.from({length},(_,i)=>{
    const open=last,close=Math.max(8,Math.min(93,open+(rnd()-.49)*8));
    const high=Math.min(97,Math.max(open,close)+rnd()*5);
    const low=Math.max(4,Math.min(open,close)-rnd()*5);
    last=close;
    return {index:i,open,close,high,low};
  });
}

export function describeItem(item) {
 if(!item)return "Ningún instrumento seleccionado. Solo se muestra un registro a la vez.";
 return item.code+" · "+item.group+" · "+item.subcategory+". Datos del catálogo histórico; las velas son una demostración matemática.";
}
export function getAgentMessages(item){
 const common=item?.code??"la muestra seleccionada";
 return [
   {id:"observer",name:"Observador",role:"Lectura de evidencia",message:item?"Se encontró "+common+" en el catálogo histórico. No hay una cotización actual en esta vista.":"Selecciona un registro para consultar su ficha histórica."},
   {id:"critic",name:"Verificador",role:"Cuestiona afirmaciones",message:"La clasificación no garantiza disponibilidad actual. Un gráfico generado localmente no sirve para comprobar movimientos reales."},
   {id:"presenter",name:"Presentador",role:"Resumen y voz",message:"Vista didáctica: un elemento abierto, cero conexiones externas, cero llamadas a modelos y ninguna operación."}
 ];
}
