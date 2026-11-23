"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const src=name=>fs.readFileSync(path.join(__dirname,"..",name),"utf8");
const html=src("index.html"),css=src("styles.css"),app=src("app.js");
const catalogScript=src("catalog.js").replace(/\bexport const\b/g,"const");
const catalog=vm.runInNewContext(catalogScript+"\n({groups,labels,catalogNote})");

test("Beat has one chart, an accessible drawer and mobile navigation",()=>{
 assert.match(html,/<title>Beat · Explorador visual<\/title>/);
 assert.match(html,/id="nav-toggle"/);
 assert.match(html,/id="sidebar"/);
 assert.match(html,/id="filter"/);
 assert.match(html,/id="chart-container"/);
 assert.match(css,/@media \(max-width:950px\)/);
 assert.match(css,/@media \(max-width:580px\)/);
 assert.match(css,/\.mobile-nav/);
 assert.match(app,/showSidebar\(!state.sidebarOpen\)/);
});
test("real-world labels are references, not invented LAB instruments or broker assertions",()=>{
 assert.equal(catalog.groups.length,6);
 assert.ok(catalog.labels.some(x=>x.code==="MSFT"&&x.tvSymbol==="NASDAQ:MSFT"));
 assert.ok(catalog.labels.some(x=>x.name==="Bitcoin"&&x.tvSymbol==="BITSTAMP:BTCUSD"));
 assert.ok(catalog.labels.some(x=>x.code==="XAU/USD"&&x.tvSymbol));
 assert.ok(catalog.labels.some(x=>x.group==="Sintéticos"&&x.tvSymbol===null));
 assert.doesNotMatch(html+app+catalogScript,/LAB-FX|LAB-CR|Velas simuladas/);
 assert.match(catalog.catalogNote,/no certifica/i);
});
test("TradingView web component is embedded and provider attribution visible",()=>{
 assert.match(html,/widgets\.tradingview-widget\.com\/w\/en\/tv-advanced-chart\.js/);
 assert.match(html,/<tv-advanced-chart/);
 assert.match(html,/TradingView<\/a>/);
 assert.match(app,/tvChart.setAttribute\("symbol",item.tvSymbol\)/);
 assert.match(app,/tvChart.setAttribute\("interval",state.period\)/);
 assert.match(html,/id="chart-unavailable"/);
});
test("tools perform local actions without generating fake market prices",()=>{
 for(const section of ["chart","info","tools","ai"])assert.ok(html.includes('data-section="'+section+'"'));
 for(const id of ["nav-close","change-asset","expand-chart","panel-toggle"])assert.ok(html.includes('id="'+id+'"'));
 assert.match(app,/function makeTools\(\)/);
 assert.match(app,/function setSection\(section\)/);
 assert.doesNotMatch(app,/\bsetInterval\b|\bgeneratedCandles\b|Math\.random\(\)/);
});
test("agent monitor is event-driven, sanitized and initially inactive",()=>{
 assert.match(html,/id="activity-empty"/);
 assert.match(html,/Sin actividad recibida/);
 assert.match(app,/Object\.defineProperty\(window,"BeatAudit"/);
 assert.match(app,/window.addEventListener\("beat:agent-event"/);
 assert.match(app,/\.textContent=value/);
 assert.match(app,/allowed\.includes\(raw.status\)/);
 assert.match(app,/displayed\[displayed.length-1\]\.remove\(\)/);
 assert.doesNotMatch(app,/\bfetch\s*\(|new WebSocket|eval\s*\(|innerHTML/);
 assert.doesNotMatch(html+app,/buy\(|sell\(|market_order|place_order/);
});
test("no direct broker, private-key or execution integration",()=>{
 const files=["index.html","app.js","catalog.js","engine.js"].map(src).join("\n");
 assert.doesNotMatch(files,/NEXT_PUBLIC_SUPABASE|api\.derivws|api\.binary|client_secret|service_role/);
 assert.match(html,/Solo lectura/);
 assert.match(html,/Sin órdenes ni recomendaciones/);
});
