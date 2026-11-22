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
    category:(value)=>{category=value;selected=null;query="";return category;},
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

/** Durations are labels for simulated grouping, not a live clock or market feed. */
export const educationalIntervals=Object.freeze([
  {id:"1m",label:"1 min",minutes:1},
  {id:"5m",label:"5 min",minutes:5},
  {id:"15m",label:"15 min",minutes:15},
  {id:"30m",label:"30 min",minutes:30},
  {id:"1H",label:"1 hora",minutes:60},
  {id:"4H",label:"4 horas",minutes:240},
  {id:"1D",label:"1 día",minutes:1440},
]);

/**
 * Advance a single fictional OHLC series. Five simulation frames form a bar
 * at ANY selected interval. The "time" is intentionally accelerated for
 * learning: a 1D candle is not delayed 24 hours and is NOT a real quote.
 */
export function advanceDemoCandles(candles,frame,code="DEMO"){
  if(!Array.isArray(candles)||!candles.length)return [];
  const index=frame|0;
  const last=candles[candles.length-1];
  const salt=String(code).length*.27;
  const change=(Math.sin(index*1.43+salt)+Math.cos(index*.67+salt))*.83;
  const value=Math.max(8,Math.min(93,last.close+change));
  if(index>0&&index%5===0){
    const newBar={index:last.index+1,open:last.close,close:value,
      high:Math.max(last.close,value)+.25,
      low:Math.min(last.close,value)-.25};
    return [...candles.slice(1),newBar];
  }
  const revised={...last,close:value,high:Math.max(last.high,value),low:Math.min(last.low,value)};
  return [...candles.slice(0,-1),revised];
}

export function describeItem(item) {
 if(!item)return "Ningún instrumento seleccionado. Solo se muestra un registro a la vez.";
 return item.code+" · "+item.group+" · "+item.subcategory+". Es una muestra completamente inventada; las velas son una demostración matemática.";
}
export function getAgentMessages(item){
 const common=item?.code??"la muestra seleccionada";
 return [
   {id:"observer",name:"Observador",role:"Lectura de evidencia",message:item?"La muestra "+common+" es un ejemplo ficticio. No hay una cotización actual en esta vista.":"Selecciona un registro para consultar su ficha histórica."},
   {id:"critic",name:"Verificador",role:"Cuestiona afirmaciones",message:"Las categorías sirven para enseñar organización de datos. Un gráfico generado localmente no sirve para comprobar movimientos reales."},
   {id:"presenter",name:"Presentador",role:"Resumen y voz",message:"Vista didáctica: un elemento abierto, cero conexiones externas, cero llamadas a modelos y ninguna operación."}
 ];
}
