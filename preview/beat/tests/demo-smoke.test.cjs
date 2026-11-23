"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const source=name=>fs.readFileSync(path.join(__dirname,"..",name),"utf8");
function moduleFrom(name,names){
 const src=source(name).replace(/\bexport (const|function)\b/g,"$1");
 return vm.runInNewContext(src+"\n({"+names.join(",")+"})");
}
const catalog=moduleFrom("catalog.js",["groups","labels","catalogNote"]);
const engine=moduleFrom("engine.js",["createViewerState","periods","resourcePolicy","agentSpaces"]);
const app=source("app.js"),html=source("index.html"),css=source("styles.css");

test("name is Beat and sidebar is the only catalogue navigation",()=>{
 assert.match(html,/<title>Beat<\/title>/);
 assert.match(html,/<h1>Beat<\/h1>/);
 assert.doesNotMatch(html,/Beat Studio/);
 assert.match(html,/id="nav-toggle"/);
 assert.match(html,/aria-controls="sidebar"/);
 assert.match(html,/class="sliding-line"/);
 assert.match(css,/\.sidebar-open \.sliding-line/);
 assert.match(app,/showSidebar\(!sidebarOpen\)/);
});
test("Forex, Bitcoin, Oro and five categories appear with reference names",()=>{
 assert.equal(catalog.groups.length,5);
 assert.ok(catalog.labels.some(item=>item.name==="Bitcoin"&&item.group==="Cripto"));
 assert.ok(catalog.labels.some(item=>item.name==="Oro"&&item.group==="Commodities"));
 assert.ok(catalog.labels.some(item=>item.code==="EUR/USD"&&item.group==="Forex"));
 assert.match(catalog.catalogNote,/no|No/);
});
test("one selected item replaces the previous; category selection clears it",()=>{
 const state=engine.createViewerState();
 const euro=catalog.labels.find(item=>item.code==="EUR/USD");
 const btc=catalog.labels.find(item=>item.code==="BTC");
 state.chooseItem(euro);
 assert.equal(state.get().item.code,"EUR/USD");
 state.chooseItem(btc);
 assert.equal(state.get().item.code,"BTC");
 state.chooseCategory("Forex");
 assert.equal(state.get().item,null);
});
test("periods change only a label; there is no simulated or real-time motion",()=>{
 const state=engine.createViewerState();
 assert.deepEqual(Array.from(engine.periods),["1m","5m","15m","30m","1H","4H","1D"]);
 state.choosePeriod("1H");
 assert.equal(state.get().period,"1H");
 assert.doesNotMatch(app,/setInterval|requestAnimationFrame|generatedCandles|advanceDemoCandles/);
 assert.match(html,/No hay cotizaciones conectadas/);
});
test("no network requests, trades or remotely running agents",()=>{
 const scripts=["catalog.js","engine.js","app.js"].map(source).join("\n");
 assert.doesNotMatch(scripts,/\bfetch\s*\(|new WebSocket|XMLHttpRequest|EventSource|\bbuy\s*\(|\bsell\s*\(|market_order/);
 assert.equal(engine.resourcePolicy.remoteConnections,0);
 assert.equal(engine.resourcePolicy.realtimeSubscriptions,0);
 assert.equal(engine.resourcePolicy.apiRequests,0);
 assert.equal(engine.resourcePolicy.remoteAgentsEnabled,false);
 assert.ok(Array.from(engine.agentSpaces).every(agent=>agent.mode==="disabled"));
});
test("sidebar can close via backdrop, close button and Escape",()=>{
 assert.match(html,/id="scrim"/);
 assert.match(html,/id="nav-close"/);
 assert.match(app,/scrim\.addEventListener\("click",\(\)=>showSidebar\(false\)\)/);
 assert.match(app,/event\.key==="Escape"/);
 assert.match(app,/sidebar\.inert=!sidebarOpen/);
});
test("chart remains dominant with grayscale UI and directional color legend",()=>{
 assert.match(css,/height:clamp\(380px,65vh,750px\)/);
 assert.match(css,/\.chart-grid/);
 assert.match(css,/\.green-dot\{color:#22c55e\}/);
 assert.match(css,/\.red-dot\{color:#ef4444\}/);
 assert.doesNotMatch(html,/id="agents"|id="play"|id="speak"/);
});
