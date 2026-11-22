"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const src = fs.readFileSync(path.join(__dirname, "../src/app/laboratorio/page.tsx"), "utf8");

test("the educational workspace has a top selector and main chart", () => {
  assert.match(src, /aria-label="Elegir serie de ejemplo"/);
  assert.match(src, /aria-label="Gráfico central de demostración"/);
  assert.match(src, /aria-controls="lab-asset-chooser"/);
  assert.match(src, /id="lab-search"/);
  assert.match(src, /aria-label="Historial ficticio"/);
});

test("the sample series are fictional and all records are selectable", () => {
  const assets = [...src.matchAll(/\{ id: "LAB-[A-C]\d\d"/g)];
  assert.equal(assets.length, 8);
  assert.match(src, /filtered\.map\(item =>/);
  assert.match(src, /onClick=\{\(\) => choose\(item\)\}/);
});

test("selecting an item only updates local React state", () => {
  assert.match(src, /setSelectedId\(item\.id\)/);
  assert.match(src, /setRange\(item\)/);
  assert.doesNotMatch(src, /\bfetch\s*\(/);
  assert.doesNotMatch(src, /\bWebSocket\s*\(/);
  assert.doesNotMatch(src, /\.from\(\s*['"]active_instruments/);
  assert.doesNotMatch(src, /\.update\(\s*\{\s*is_active/);
});

test("the charts are generated deterministically without external data", () => {
  assert.match(src, /function pointsFor\(/);
  assert.match(src, /Math\.sin\(/);
  assert.match(src, /Math\.cos\(/);
  assert.match(src, /Array\.from\(\{ length: 96 \}/);
});

test("the interface identifies itself as an isolated demonstration", () => {
  assert.match(src, /Solo demostración/);
  assert.match(src, /sin conexión a plataformas/);
  assert.match(src, /Sin procesos automáticos/);
  assert.match(src, /sin APIs, sin órdenes, sin predicciones/);
});
