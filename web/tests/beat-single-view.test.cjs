"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = file => fs.readFileSync(path.join(__dirname, "../src/", file), "utf8");
const dashboard = read("components/dashboard/Dashboard.tsx");
const chart = read("components/dashboard/ChartWidget.tsx");
const selector = read("components/dashboard/InstrumentSelector.tsx");

test("green rising candles and red falling candles, wicks included", () => {
  assert.match(chart, /upColor:\s*'#22c55e'/);
  assert.match(chart, /downColor:\s*'#ef4444'/);
  assert.match(chart, /wickUpColor:\s*'#22c55e'/);
  assert.match(chart, /wickDownColor:\s*'#ef4444'/);
});

test("only actual catalogue records are displayed, never made-up fallbacks", () => {
  assert.doesNotMatch(dashboard, /DEFAULT_FOREX|Fallback mock data|Mock for presentation/);
  assert.match(dashboard, /setInstrumentsByMarket\(\{\}\)/);
  assert.match(dashboard, /No se mostrarán ejemplos como datos reales/);
  for (const category of ["Forex","Sintéticos","Cripto","Índices","Commodities"]) {
    assert.ok(dashboard.includes(category), "Missing category " + category);
  }
});

test("only a single instrument can be selected, and close works", () => {
  assert.match(dashboard, /const selectInstrument = \(next: string\) =>/);
  assert.match(dashboard, /setInstrument\(next\)/);
  assert.match(dashboard, /clearSelectedView\(\)/);
  assert.match(dashboard, /onClick=\{\(\) => selectInstrument\(inst\)\}/);
  assert.match(dashboard, /onClick=\{\(\) => selectInstrument\(''\)\}/);
  assert.match(dashboard, /Cerrar vista/);
});

test("changing category clears the previous instrument", () => {
  assert.match(dashboard, /const selectCategory = \(nextCategory: string\) =>/);
  assert.match(dashboard, /setInstrument\(''\)/);
  assert.match(dashboard, /selectCategory\(cat\); setDrawerSearch\(''\);/);
});

test("old instrument data is dropped when switching quickly", () => {
  assert.match(dashboard, /let cancelled = false;/);
  assert.match(dashboard, /if \(cancelled\) return;/);
  assert.match(dashboard, /return \(\) => \{ cancelled = true; \};/);
  assert.match(dashboard, /key=\{instrument \+ ':' \+ selectedTimeframe\}/);
  assert.match(dashboard, /setCandlesQueryKey\(''\)/);
  assert.match(dashboard, /if \(cancelled\) return;/);
  assert.match(chart, /setData\(\[\]\)/);
  assert.match(dashboard, /if \(!instrument \|\| !selectedTimeframe\) return;/);
});

test("left drawer lists only local catalogue and closes after selection", () => {
  assert.match(dashboard, /const \[drawerSearch, setDrawerSearch\] = useState\(''\)/);
  assert.match(dashboard, /filteredDrawerInstruments/);
  assert.match(dashboard, /getInstrumentLabel\(inst\)/);
  assert.match(dashboard, /id="beat-drawer-search"/);
  assert.match(dashboard, /setDrawerOpen\(false\)/);
  assert.match(dashboard, /No hay instrumentos registrados que coincidan/);
  assert.match(dashboard, /event\.key === 'Escape'/);
  assert.match(dashboard, /drawerButtonRef\.current\?\.focus\(\)/);
});

test("no activation writes are reintroduced", () => {
  assert.doesNotMatch(dashboard + selector + chart, /\.update\(\{\s*is_active:/);
  assert.doesNotMatch(dashboard, /toggleInstrumentActive/);
});
