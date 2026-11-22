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

const css = fs.readFileSync(path.join(__dirname, "../src/app/laboratorio/lab-glass.css"), "utf8");

test("top browser-like controls are interactive and accessible", () => {
  assert.match(src, /aria-label="Navegación de Quantum Lab"/);
  assert.match(src, /href="\/" aria-label="Volver al inicio de Quantum"/);
  assert.match(src, /onClick=\{resetWorkspace\}/);
  assert.match(src, /onClick=\{\(\) => setShowList\(v => !v\)\}/);
  assert.match(src, /aria-expanded=\{showList\}/);
  assert.match(src, /q-browserbar/);
  assert.match(src, /QUANTUM \/ LABORATORIO/);
});

test("monochrome space-glass styles are scoped and accessible", () => {
  assert.match(src, /import "\.\/lab-glass\.css";/);
  assert.match(css, /\.q-lab\s*\{/);
  assert.match(css, /\.q-glass\s*\{/);
  assert.match(css, /-webkit-backdrop-filter:\s*blur/);
  assert.match(css, /\.q-panel\s*\{/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /forced-colors:\s*active/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.doesNotMatch(src + css, /\b(cyan|purple|blue|emerald|amber|rose|teal|indigo|fuchsia|lime)-\d+/);
});

test("all explicit hex RGB colors in the laboratory are grayscale", () => {
  for (const color of (src + css).match(/#[0-9a-fA-F]{6}\b/g) ?? []) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    assert.equal(r, g, color);
    assert.equal(g, b, color);
  }
});

test("glass lives in controls and navigation, with opaque chart surfaces", () => {
  assert.match(src, /className="q-glass mb-4/);
  assert.match(src, /className=\{\x60\$\{surface\} min-w-0 overflow-hidden\x60\}/);
  assert.match(src, /const surface = "q-panel/);
  assert.match(css, /\.q-panel\s*\{\s*background:\s*#101010;/);
});

