"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, Check, Database, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";

/**
 * Independent educational workspace. All instrument names and observations are
 * invented. Never import real market clients, Supabase, API tokens, or order code.
 * Selection changes *only* in-memory state; it cannot activate background jobs.
 */
type Collection = "Todas" | "Colección A" | "Colección B" | "Colección C";
type Range = "1 H" | "1 D" | "1 S" | "1 M";
type Example = {
  id: string;
  name: string;
  collection: Exclude<Collection, "Todas">;
  detail: string;
  base: number;
  seed: number;
  notes: string;
};

const examples: readonly Example[] = [
  { id: "LAB-A01", name: "Serie Ámbar", collection: "Colección A", detail: "Variaciones regulares", base: 142, seed: 3, notes: "Ejemplo sintético con pequeños ciclos periódicos." },
  { id: "LAB-A02", name: "Serie Horizonte", collection: "Colección A", detail: "Evolución gradual", base: 98, seed: 8, notes: "Ejemplo ficticio para comparar intervalos." },
  { id: "LAB-A03", name: "Serie Brisa", collection: "Colección A", detail: "Oscilaciones suaves", base: 127, seed: 13, notes: "Datos de demostración creados matemáticamente." },
  { id: "LAB-B01", name: "Serie Bosque", collection: "Colección B", detail: "Ciclos alternos", base: 185, seed: 17, notes: "No representa ningún activo ni cotización." },
  { id: "LAB-B02", name: "Serie Aurora", collection: "Colección B", detail: "Rango variable", base: 75, seed: 21, notes: "Diseñada para practicar la lectura de gráficos." },
  { id: "LAB-B03", name: "Serie Índigo", collection: "Colección B", detail: "Patrones mixtos", base: 225, seed: 29, notes: "Ejemplo de valores generados localmente." },
  { id: "LAB-C01", name: "Serie Órbita", collection: "Colección C", detail: "Ciclos amplios", base: 113, seed: 31, notes: "Todas las series de esta página son inventadas." },
  { id: "LAB-C02", name: "Serie Prisma", collection: "Colección C", detail: "Cambios escalonados", base: 166, seed: 37, notes: "No hay predicciones ni recomendaciones." },
];
const collections: readonly Collection[] = ["Todas", "Colección A", "Colección B", "Colección C"];
const ranges: readonly Range[] = ["1 H", "1 D", "1 S", "1 M"];

// Fixed, deterministic classroom data. No network access or subscriptions.
function pointsFor(item: Example, range: Range): number[] {
  const scale = ranges.indexOf(range) + 1;
  return Array.from({ length: 96 }, (_, i) => {
    const wave = Math.sin((i + item.seed) / (7 + scale)) * (5 + scale);
    const second = Math.cos(i / (2.8 + scale) + item.seed) * 2.9;
    const drift = (i / 95) * Math.sin(item.seed * 0.7) * (3 + scale);
    return Number((item.base + wave + second + drift).toFixed(2));
  });
}
function coordsFor(values: number[]) {
  const min = Math.min(...values) - 5;
  const max = Math.max(...values) + 5;
  return {
    min, max,
    points: values.map((value, i) => ({
      x: 50 + i * (900 / (values.length - 1)),
      y: 375 - (value - min) * (310 / (max - min)),
    })),
  };
}

export default function EducationalWorkspace() {
  const [collection, setCollection] = useState<Collection>("Todas");
  const [selectedId, setSelectedId] = useState(examples[0].id);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState<Range>("1 D");
  const [showList, setShowList] = useState(false);

  const filtered = useMemo(() => examples.filter(item => {
    const matchesCollection = collection === "Todas" || item.collection === collection;
    const term = search.trim().toLocaleLowerCase("es");
    return matchesCollection && (
      !term || (item.name + " " + item.id + " " + item.detail).toLocaleLowerCase("es").includes(term)
    );
  }), [collection, search]);

  const selected = examples.find(item => item.id === selectedId) ?? examples[0];
  const values = useMemo(() => pointsFor(selected, range), [selected, range]);
  const diagram = useMemo(() => coordsFor(values), [values]);
  const line = diagram.points.map(point => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area = `50,375 ${line} 950,375`;
  const first = values[0];
  const last = values[values.length - 1];
  const difference = last - first;
  const labelClass = "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400";
  const surface = "rounded-2xl border border-white/10 bg-[#121b2b]";
  const choose = (item: Example) => { setSelectedId(item.id); setShowList(false); };

  return (
    <main className="min-h-screen bg-[#090f19] text-slate-100">
      <div className="mx-auto max-w-[1780px] px-3 pb-10 pt-4 sm:px-6 lg:px-8">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
              <Activity aria-hidden="true" className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Quantum <span className="text-cyan-300">Lab</span></h1>
              <p className="text-xs text-slate-400">Panel visual experimental · sin conexión a plataformas</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200">
              <ShieldCheck className="h-4 w-4" aria-hidden="true"/> Solo demostración
            </span>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-2 text-xs text-slate-300 hover:bg-white/10">
              <ArrowLeft className="h-4 w-4" aria-hidden="true"/> Volver
            </Link>
          </div>
        </header>

        <section aria-label="Elegir serie de ejemplo" className={`${surface} mb-4 p-3 sm:p-4`}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <span className={labelClass}>Colecciones y series · cambia sin activar procesos</span>
            <span className="flex items-center gap-2 text-xs text-slate-400"><Database className="h-4 w-4" aria-hidden="true"/> {examples.length} series ficticias · 0 consultas externas</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              {collections.map(name => (
                <button key={name} type="button" onClick={() => { setCollection(name); const first = examples.find(item => name === "Todas" || item.collection === name); if (first) setSelectedId(first.id); }}
                  aria-pressed={collection === name}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm transition-colors ${collection === name ? "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/30" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"}`}>
                  {name}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setShowList(value => !value)}
              aria-expanded={showList} aria-controls="lab-asset-chooser"
              className="ml-auto rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-[#0a1422] hover:bg-cyan-300">
              Cambiar serie
            </button>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Accesos rápidos">
            {examples.slice(0, 6).map(item => (
              <button type="button" key={item.id} onClick={() => choose(item)}
                aria-pressed={selected.id === item.id}
                className={`shrink-0 rounded-lg border px-3 py-2 text-xs ${selected.id === item.id ? "border-cyan-300 bg-cyan-400/10 text-cyan-200" : "border-white/10 text-slate-400 hover:border-white/30"}`}>
                {item.name}
              </button>
            ))}
          </div>
          {showList && (
            <div id="lab-asset-chooser" className="mt-4 rounded-xl border border-white/10 bg-[#0b1422] p-3">
              <label htmlFor="lab-search" className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-300">
                <Search className="h-4 w-4" aria-hidden="true"/> Buscar entre todas las series
              </label>
              <input id="lab-search" type="search" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Nombre o código..." className="mb-3 w-full rounded-lg border border-white/15 bg-[#142035] px-3 py-2 text-sm text-white outline-none focus:border-cyan-300" />
              <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-4">
                {filtered.map(item => (
                  <button key={item.id} onClick={() => choose(item)} type="button"
                    className="flex items-center justify-between gap-2 rounded-lg border border-white/10 p-3 text-left hover:border-cyan-400/60 hover:bg-white/5">
                    <span><strong className="block text-sm">{item.name}</strong><span className="mt-1 block text-xs text-slate-400">{item.id} · {item.collection}</span></span>
                    {selected.id === item.id && <Check aria-label="Seleccionada" className="h-4 w-4 text-cyan-300"/>}
                  </button>
                ))}
                {filtered.length === 0 && <p className="p-3 text-sm text-slate-400">No hay resultados en esta colección.</p>}
              </div>
            </div>
          )}
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <section aria-label="Gráfico central de demostración" className={`${surface} min-w-0 overflow-hidden`}>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 p-4 sm:p-5">
              <div>
                <p className={labelClass}>Pantalla central</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{selected.name}</h2>
                <p className="mt-1 text-xs text-slate-400">{selected.collection} · {selected.id} · Datos simulados</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl font-bold tabular-nums">{last.toFixed(2)} <span className="text-xs font-normal text-slate-400">unidades</span></p>
                <p className="text-xs text-slate-400">Cambio ficticio: {difference >= 0 ? "+" : ""}{difference.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-5">
              <span className={labelClass}>Evolución de la serie · ejemplos matemáticos</span>
              <div className="flex items-center gap-1 rounded-lg bg-[#0b1422] p-1">
                {ranges.map(item => (
                  <button type="button" key={item} onClick={() => setRange(item)} aria-pressed={range === item}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${range === item ? "bg-cyan-400 text-[#0b1422]" : "text-slate-400 hover:text-white"}`}>{item}</button>
                ))}
              </div>
            </div>
            <div className="min-h-[290px] px-2 py-3 sm:px-5">
              <svg viewBox="0 0 1000 410" className="h-auto w-full" role="img"
                aria-label={`Gráfico ficticio de ${selected.name}, 96 valores para el período ${range}. No son cotizaciones reales.`}>
                <defs>
                  <linearGradient id="lab-area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#24c9d8" stopOpacity="0.32"/>
                    <stop offset="100%" stopColor="#24c9d8" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                {[65,142,220,297,375].map(y => <line key={y} x1="50" y1={y} x2="950" y2={y} stroke="#2a3c50" strokeWidth="1"/>)}
                {[50,275,500,725,950].map(x => <line key={x} x1={x} y1="55" x2={x} y2="375" stroke="#1b3045" strokeWidth="1"/>)}
                {[0,1,2,3,4].map(n => (
                  <text key={n} x="946" y={69+n*77} textAnchor="end" fill="#91a2b5" fontSize="14">
                    {(diagram.max - n * (diagram.max - diagram.min)/4).toFixed(1)}
                  </text>
                ))}
                <polygon points={area} fill="url(#lab-area)"/>
                <polyline points={line} fill="none" stroke="#31d1dc" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx={diagram.points[95].x} cy={diagram.points[95].y} r="6" fill="#31d1dc" stroke="#102338" strokeWidth="3"/>
                <text x="50" y="400" fill="#8094ad" fontSize="13">Inicio del ejemplo</text>
                <text x="950" y="400" textAnchor="end" fill="#8094ad" fontSize="13">Fin del ejemplo</text>
              </svg>
            </div>
            <p className="border-t border-white/10 px-4 py-3 text-xs text-slate-400 sm:px-5">
              Estos gráficos son generados localmente para probar la interfaz. No representan mercados, predicciones ni información en tiempo real.
            </p>
          </section>

          <aside className="space-y-4" aria-label="Información complementaria">
            <section className={`${surface} p-5`}>
              <p className={labelClass}>Ficha de ejemplo</p>
              <h3 className="mt-2 text-lg font-semibold">{selected.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{selected.detail}</p>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-slate-400">Colección</dt><dd>{selected.collection}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-400">Código</dt><dd className="font-mono">{selected.id}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-400">Valores</dt><dd>{values.length}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-slate-400">Fuente</dt><dd>Datos inventados</dd></div>
              </dl>
              <p className="mt-5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-3 text-sm text-cyan-100">{selected.notes}</p>
            </section>
            <section className={`${surface} p-5`}>
              <p className={labelClass}>Estado de la demostración</p>
              <div className="mt-4 flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true"/>
                <div><p className="text-sm font-semibold">Sin procesos automáticos</p><p className="mt-1 text-xs leading-5 text-slate-400">Cambiar de serie no crea tareas, conexiones, llamadas a IA ni suscripciones.</p></div>
              </div>
              <div className="mt-4 flex items-start gap-3">
                <SlidersHorizontal className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" aria-hidden="true"/>
                <div><p className="text-sm font-semibold">Solo lectura</p><p className="mt-1 text-xs leading-5 text-slate-400">El laboratorio no modifica bases de datos ni otros proyectos.</p></div>
              </div>
            </section>
          </aside>
        </div>

        <section className={`${surface} mt-4 p-4 sm:p-5`} aria-label="Historial ficticio">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div><p className={labelClass}>Historial del ejemplo</p><h3 className="mt-1 text-lg font-semibold">Últimas observaciones</h3></div>
            <span className="text-xs text-slate-400">8 muestras · sin actualización externa</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[430px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wider text-slate-400"><tr><th className="pb-3">Muestra</th><th className="pb-3">Serie</th><th className="pb-3 text-right">Valor ficticio</th></tr></thead>
              <tbody>
                {values.slice(-8).reverse().map((value, index) => (
                  <tr key={index} className="border-b border-white/5"><td className="py-3 text-slate-400">{String(96-index).padStart(2,"0")}</td><td className="py-3">{selected.name}</td><td className="py-3 text-right font-mono tabular-nums">{value.toFixed(2)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <footer className="mt-6 text-center text-xs leading-5 text-slate-500">
          Quantum Lab · prototipo educativo separado del sistema existente · sin APIs, sin órdenes, sin predicciones
        </footer>
      </div>
    </main>
  );
}
