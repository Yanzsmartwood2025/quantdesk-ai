"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "../src");
const read = relative => fs.readFileSync(path.join(root, relative), "utf8");

const dashboard = read("components/dashboard/Dashboard.tsx");
const css = read("app/globals.css");
const selector = read("components/dashboard/InstrumentSelector.tsx");
const chart = read("components/dashboard/ChartWidget.tsx");
const cards = read("components/dashboard/AgentStatusCard.tsx");
const feed = read("components/dashboard/ReasoningFeed.tsx");
const footer = read("components/Footer.tsx");
const metadata = read("app/layout.tsx");
const empty = read("components/dashboard/EmptyState.tsx");
const theme = read("components/ThemeToggle.tsx");
const files = [dashboard, css, selector, chart, cards, feed, footer, metadata, empty, theme];

test("branding is Beat throughout the main public interface", () => {
  assert.match(dashboard, />Beat</);
  assert.match(dashboard, /Bienvenido a Beat/);
  assert.match(footer, /Beat es una plataforma experimental/);
  assert.match(metadata, /Beat \| Estudio de datos/);
  assert.doesNotMatch(dashboard + footer + metadata, /QuantDesk AI|Create Next App/);
});

test("screens and chart use neutral monochrome tokens only", () => {
  assert.match(css, /\.beat-glass\s*\{/);
  assert.match(css, /\.beat-glass-button\s*\{/);
  assert.match(css, /backdrop-filter:\s*blur/);
  for (const code of files) {
    assert.doesNotMatch(code, /(?:text|bg|border|ring|from|to)-(?:blue|purple|green|red|orange|yellow|cyan|teal|pink|emerald|indigo)-\d{2,3}/);
  }
  for (const color of (chart + css).match(/#[0-9a-fA-F]{6}\b/g) || []) {
    const [r,g,b] = [1,3,5].map(i => parseInt(color.slice(i,i+2),16));
    assert.equal(r,g,"not neutral: "+color);
    assert.equal(g,b,"not neutral: "+color);
  }
});

test("mobile header provides readable category and asset selectors", () => {
  assert.match(dashboard, /aria-label="Categorías de datos"/);
  assert.match(dashboard, /Instrumento a visualizar/);
  assert.match(dashboard, /overflow-x-auto/);
  assert.match(selector, /min-h-11/);
  assert.match(dashboard, /order-1 lg:order-2/);
  assert.match(dashboard, /order-2 lg:order-1/);
});

test("dashboard no longer exposes an unauthenticated activation action", () => {
  assert.doesNotMatch(dashboard, /toggleInstrumentActive|\.update\(\{ is_active:/);
  assert.match(dashboard, /Pausado · Solo lectura/);
  assert.match(dashboard, /Cambiar de vista no activa procesos/);
});

test("diagnostics are development-only and do not appear in the main screenshot", () => {
  assert.match(dashboard, /process\.env\.NODE_ENV === "development"/);
  assert.doesNotMatch(dashboard, /text-green-400/);
});

test("accessible keyboard focus and reduced motion", () => {
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /forced-colors: active/);
  assert.match(theme, /aria-label=\{isDark/);
});

test("business logic and external API files are not part of this UI change", () => {
  assert.match(dashboard, /from\('active_instruments'\)/);
  assert.match(dashboard, /from\('market_candles'\)/);
  assert.match(dashboard, /from\('agent_traces'\)/);
});
