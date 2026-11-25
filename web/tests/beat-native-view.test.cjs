"use strict";
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "../src");
const page = fs.readFileSync(path.join(root, "app/beat/page.tsx"), "utf8");
const ui = fs.readFileSync(path.join(root, "components/beat/BeatNative.tsx"), "utf8");

test("Next.js /beat uses a native client-side React workbench", () => {
  assert.match(page, /import \{ BeatNative \}/);
  assert.match(page, /<BeatNative records=\{historicalCatalog\} \/>/);
  assert.match(ui, /'use client'/);
  assert.match(ui, /export function BeatNative/);
});
test("one mobile drawer, category controls and panels have callbacks", () => {
  assert.match(ui, /aria-controls="beat-native-drawer"/);
  assert.match(ui, /onClick=\{\(\) => setDrawerOpen/);
  assert.match(ui, /onClick=\{\(\) => changeCategory\(c\)\}/);
  assert.match(ui, /onClick=\{\(\) => selectRecord\(record\)\}/);
  assert.match(ui, /onClick=\{\(\) => setPanel\(p.id\)\}/);
  assert.match(ui, /onClick=\{\(\) => setShowGrid/);
});
test("catalogue is externally provided, not populated with fake symbols", () => {
  assert.match(ui, /records = \[\]/);
  assert.match(ui, /cleanRecords/);
  assert.match(ui, /No se mostrarán muestras inventadas/);
  assert.match(ui, /No hay series cargadas/);
  assert.doesNotMatch(ui, /LAB-FX-|Math\.random|faker|mockCandles/);
});
test("no embedded external chart and no trading operations", () => {
  assert.doesNotMatch(page + ui, /tv-advanced-chart|tradingview-widget|iframe|new WebSocket|market_order|place_market_order|\bbuy\(/);
  assert.doesNotMatch(page + ui, /api\.derivws|api\.binary|authorization:|Bearer /i);
  assert.match(ui, /Solo lectura/);
});
test("agent status is transparent instead of fabricated", () => {
  assert.match(ui, /Sin actividad recibida/);
  assert.match(ui, /Desconectado/);
  assert.match(ui, /no se inventarán intervenciones/);
});

test("history is selected on demand and cancelled when the selection changes", () => {
  const history = fs.readFileSync(path.join(root, "components/beat/beatHistorical.ts"), "utf8");
  assert.match(ui, /loadHistoricalSeries\(selectedCode,ctrl.signal\)/);
  assert.match(ui, /ctrl.abort\(\)/);
  assert.match(history, /MAX_POINTS = 366/);
  assert.match(history, /cache.size>=8/);
  assert.match(history, /date > now - MIN_AGE/);
  assert.doesNotMatch(history, /setInterval|WebSocket|supabase|api\.deriv/i);
});
