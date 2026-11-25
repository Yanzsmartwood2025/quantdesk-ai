/**
 * Beat UI state. No network adapters, prices, subscriptions or timers.
 * The state invariant is exactly one visible name at a time.
 */
export const resourcePolicy = Object.freeze({
  maxOpenViews:1,
  remoteConnections:0,
  realtimeSubscriptions:0,
  apiRequests:0,
  remoteAgentsEnabled:false,
  orderExecutionEnabled:false
});

export const agentSpaces = Object.freeze([
  Object.freeze({id:"research",name:"Documentador",mode:"disabled"}),
  Object.freeze({id:"quality",name:"Verificador",mode:"disabled"}),
  Object.freeze({id:"voice",name:"Narrador",mode:"disabled"})
]);

export const periods=Object.freeze(["1m","5m","15m","30m","1H","4H","1D"]);

export function createViewerState(){
  let activeCategory="Forex";
  let activeItem=null;
  let activePeriod="1m";
  return Object.freeze({
    get:()=>({category:activeCategory,item:activeItem,period:activePeriod}),
    chooseCategory:(next)=>{activeCategory=next;activeItem=null;return activeCategory;},
    chooseItem:(item)=>{activeItem=item??null;activeCategory=item?.group??activeCategory;return activeItem;},
    choosePeriod:(period)=>{if(!periods.includes(period))return activePeriod;activePeriod=period;return activePeriod;},
    close:()=>{activeItem=null;}
  });
}
