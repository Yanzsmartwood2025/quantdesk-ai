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
const catalog=moduleFrom("catalog.js",["categories","inventory","snapshot"]);
const engine=moduleFrom("engine.js",[
 "createViewerState","budget","generatedCandles","advanceDemoCandles","educationalIntervals"
]);
const app=source("app.js"),html=source("index.html"),css=source("styles.css");

test("five visible groups contain six invented examples each",()=>{
 assert.equal(catalog.categories.length,5);
 assert.equal(catalog.inventory.length,30);
 for(const name of catalog.categories){
  assert.equal(catalog.inventory.filter(e=>e.group===name).length,6);
 }
 assert.ok(catalog.inventory.every(e=>/^LAB-(FX|SY|CR|IX|CM)-\d{2}$/.test(e.code)));
 assert.equal(catalog.snapshot.externalRequests,0);
});
test("one selection is replaced and group change closes the previous",()=>{
 const state=engine.createViewerState();
 state.select(catalog.inventory[0]);
 assert.ok(state.snapshot().selected);
 state.select(catalog.inventory[1]);
 assert.equal(state.snapshot().selected.code,catalog.inventory[1].code);
 state.category("Cripto");
 assert.equal(state.snapshot().selected,null);
});
test("seven educational intervals do not change external budget",()=>{
 assert.deepEqual(Array.from(engine.educationalIntervals).map(x=>x.id),["1m","5m","15m","30m","1H","4H","1D"]);
 assert.equal(engine.budget.externalRequests,0);
 assert.equal(engine.budget.maxVisibleItems,1);
 assert.equal(engine.budget.flags.remoteData,false);
 assert.equal(engine.budget.flags.trading,false);
});
test("fictional candle moves in place then starts another",()=>{
 const start=engine.generatedCandles("LAB-FX-01","1m",48);
 assert.equal(start.length,48);
 const first=engine.advanceDemoCandles(start,1,"LAB-FX-01");
 assert.equal(first.length,48);
 assert.equal(first[47].index,start[47].index);
 const next=engine.advanceDemoCandles(first,5,"LAB-FX-01");
 assert.equal(next.length,48);
 assert.equal(next[47].index,start[47].index+1);
 assert.equal(start[47].index,47);
});
test("dialog opens from a group and search",()=>{
 assert.match(html,/<dialog id="catalog-dialog"/);
 assert.match(html,/id="drawer-tabs"/);
 assert.match(html,/id="drawer-query"/);
 assert.match(app,/function openDrawer\(/);
 assert.match(app,/if\(open\)openDrawer\(\)/);
 assert.match(app,/state\.query\(event\.target\.value\)/);
 assert.match(app,/dialog\.showModal\(\)/);
});
test("no external data or order commands in demo source",()=>{
 const code=["app.js","catalog.js","engine.js"].map(source).join("\n");
 assert.doesNotMatch(code,/\bfetch\s*\(|new\s+WebSocket\s*\(|XMLHttpRequest|sendBeacon|market_order|createOrder/);
 assert.doesNotMatch(code,/DERIV_TOKEN|service_role|NEXT_PUBLIC_SUPABASE|api_key/);
});
test("animation is opt-in and stopped on tab changes",()=>{
 assert.match(html,/id="play"[^>]*disabled/);
 assert.match(app,/el\("play"\)\.addEventListener\("click",startAnimation\)/);
 assert.match(app,/playbackTimer=setInterval\(/);
 assert.match(app,/clearInterval\(playbackTimer\)/);
 assert.match(app,/visibilitychange/);
 assert.match(app,/pagehide/);
});
test("black/white UI keeps green and red solely as fictional candle colors",()=>{
 assert.match(app,/#22c55e/);
 assert.match(app,/#ef4444/);
 assert.match(css,/\.catalog-dialog::backdrop/);
 assert.match(css,/max-height:calc\(100dvh - 18px\)/);
});
