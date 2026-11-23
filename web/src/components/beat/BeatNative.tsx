'use client';

import { useMemo, useState } from 'react';

type Panel = 'grafico' | 'herramientas' | 'ficha' | 'ia';
type Category = 'Forex' | 'Criptomonedas' | 'Materias primas' | 'Índices' | 'Sintéticos' | 'Acciones';

export type BeatInstrumentRecord = {
  code: string;
  name: string;
  category: Category;
  logoUrl?: string;
  source?: string;
  updatedAt?: string;
};

const CATEGORIES: Category[] = [
  'Forex', 'Criptomonedas', 'Materias primas', 'Índices', 'Sintéticos', 'Acciones',
];
const PANELS: { id: Panel; name: string; symbol: string }[] = [
  { id: 'grafico', name: 'Gráfico', symbol: '▥' },
  { id: 'herramientas', name: 'Herramientas', symbol: '⌘' },
  { id: 'ficha', name: 'Ficha', symbol: 'ⓘ' },
  { id: 'ia', name: 'IA', symbol: '✧' },
];

/**
 * Componentes React propios. No emplea widgets remotos, cuentas de corretaje,
 * APIs de negociación ni valores de mercado inventados.
 *
 * El catálogo puede recibirse en el futuro de una fuente de lectura autorizada.
 * Sin esa fuente, se muestra un estado vacío explícito.
 */
export function BeatNative({ records = [] }: { records?: BeatInstrumentRecord[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [category, setCategory] = useState<Category>('Forex');
  const [search, setSearch] = useState('');
  const [panel, setPanel] = useState<Panel>('grafico');
  const [symbol, setSymbol] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  const cleanRecords = useMemo(
    () => records.filter(r => r.code && r.name && CATEGORIES.includes(r.category)),
    [records]
  );
  const selected = cleanRecords.find(r => r.code === symbol) ?? null;
  const visible = cleanRecords
    .filter(r => r.category === category)
    .filter(r => (r.name + ' ' + r.code).toLocaleLowerCase('es')
      .includes(search.trim().toLocaleLowerCase('es')))
    .sort((a, b) => a.name.localeCompare(b.name));

  function selectRecord(record: BeatInstrumentRecord) {
    setSymbol(record.code);
    setPanel('grafico');
    setDrawerOpen(false);
  }
  function changeCategory(next: Category) {
    setCategory(next);
    setSearch('');
    setSymbol(null);
  }
  function closeDrawer() {
    setDrawerOpen(false);
  }

  return (
    <div className="min-h-dvh bg-[#07080a] text-white pb-20 lg:pb-0">
      <header className="sticky top-0 z-40 flex h-[64px] items-center gap-3 border-b border-white/10 bg-[#08090b]/95 px-3 backdrop-blur-xl sm:px-5">
        <button type="button" aria-label="Abrir o cerrar bandeja" aria-expanded={drawerOpen}
          aria-controls="beat-native-drawer" onClick={() => setDrawerOpen(x => !x)}
          className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/20 text-2xl hover:bg-white/10">
          <span aria-hidden="true">{drawerOpen ? '×' : '☷'}</span>
        </button>
        <div className="flex size-9 items-center justify-center rounded-xl bg-white text-xl font-black text-black">B</div>
        <h1 className="text-2xl font-black tracking-tight">Beat</h1>
        <div className="ml-auto text-right text-[11px] text-zinc-400">
          <strong className="block text-zinc-200">Visor React propio</strong>
          Solo lectura
        </div>
      </header>

      {drawerOpen && (
        <button type="button" aria-label="Cerrar bandeja"
          className="fixed inset-0 z-40 bg-black/75"
          onClick={closeDrawer}/>
      )}
      <aside id="beat-native-drawer" aria-label="Catálogo de activos"
        className={`fixed bottom-0 left-0 top-[64px] z-50 flex w-[min(92vw,370px)] flex-col overflow-y-auto border-r border-white/15 bg-[#101216] p-4 shadow-2xl transition-transform ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-hidden={!drawerOpen} inert={!drawerOpen}>
        <div className="mb-4 flex items-center justify-between">
          <div><p className="text-[10px] font-bold tracking-[.2em] text-zinc-400">BIBLIOTECA</p>
            <h2 className="text-xl font-bold">Instrumentos</h2></div>
          <button type="button" onClick={closeDrawer} aria-label="Cerrar"
            className="size-10 rounded-lg border border-white/20 text-xl">×</button>
        </div>
        <label className="mb-3 block text-xs text-zinc-400" htmlFor="beat-native-search">Buscar instrumento</label>
        <input id="beat-native-search" type="search" value={search}
          onChange={e => setSearch(e.target.value)} placeholder="Nombre o símbolo"
          className="mb-4 min-h-11 rounded-xl border border-white/20 bg-[#060709] px-3 text-sm outline-offset-2"/>
        <nav aria-label="Mercados" className="mb-4 grid grid-cols-2 gap-2">
          {CATEGORIES.map(c => (
            <button key={c} type="button" onClick={() => changeCategory(c)}
              aria-pressed={c === category}
              className={`min-h-12 rounded-xl border p-2 text-left text-xs ${c === category ? 'border-white/65 bg-white/15' : 'border-white/10 bg-white/5 text-zinc-400'}`}>
              {c}<span className="ml-2 text-zinc-500">{cleanRecords.filter(r => r.category === c).length}</span>
            </button>
          ))}
        </nav>
        <p className="mb-3 text-xs text-zinc-400">{visible.length} registros en {category}</p>
        {visible.length ? (
          <div className="grid gap-2">
            {visible.map(record => (
              <button key={record.code} type="button" onClick={() => selectRecord(record)}
                className="flex min-h-14 items-center gap-3 rounded-xl border border-white/15 bg-white/5 p-3 text-left hover:bg-white/10">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/20 bg-[#282a2f] font-bold">{record.code[0]}</span>
                <span className="min-w-0"><strong className="block truncate text-sm">{record.name}</strong>
                  <small className="text-zinc-400">{record.code}</small></span>
              </button>
            ))}
          </div>
        ) : <p role="status" className="rounded-xl border border-dashed border-white/20 p-5 text-sm leading-6 text-zinc-400">No hay instrumentos de esta categoría disponibles en la fuente de consulta. No se mostrarán muestras inventadas.</p>}
      </aside>

      <div className="mx-auto grid max-w-[1700px] lg:grid-cols-[70px_minmax(0,1fr)_315px]">
        <nav aria-label="Secciones" className="hidden flex-col gap-2 border-r border-white/10 p-2 lg:flex">
          {PANELS.map(p => <button key={p.id} type="button" onClick={() => setPanel(p.id)}
            aria-pressed={panel === p.id} title={p.name}
            className={`flex min-h-[58px] flex-col items-center justify-center rounded-xl text-xs ${panel === p.id ? 'bg-white/15 text-white' : 'text-zinc-500 hover:bg-white/10'}`}>
            <span className="text-2xl">{p.symbol}</span><span>{p.name}</span></button>)}
        </nav>
        <main className="min-w-0 p-3 sm:p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 text-xl font-bold">
              {selected?.code[0] ?? '◈'}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400">{selected?.category ?? 'Beat'}</p>
              <h2 className="truncate text-xl font-semibold">{selected?.name ?? 'Selecciona un instrumento'}</h2>
              <p className="truncate text-xs text-zinc-400">{selected?.code ?? 'Catálogo pendiente de conexión verificada'}</p>
            </div>
            <button type="button" onClick={() => setDrawerOpen(true)} className="min-h-10 rounded-xl border border-white/20 px-3 text-xs hover:bg-white/10">Cambiar</button>
          </div>

          <section className="overflow-hidden rounded-2xl border border-white/15 bg-[#101218]" aria-label="Espacio gráfico">
            <div className="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 p-3">
              <strong className="text-sm">Gráfico Beat</strong>
              <span className="text-xs text-zinc-400">Sin datos inventados</span>
              <button type="button" onClick={() => setShowGrid(x => !x)}
                aria-pressed={showGrid}
                className="rounded-lg border border-white/20 px-3 py-2 text-xs">
                {showGrid ? 'Ocultar cuadrícula' : 'Mostrar cuadrícula'}
              </button>
            </div>
            <div className="relative grid h-[55vh] min-h-[340px] place-items-center px-5 text-center">
              {showGrid && <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-40"
                style={{backgroundImage:'linear-gradient(#ffffff12 1px, transparent 1px), linear-gradient(90deg, #ffffff12 1px, transparent 1px)',backgroundSize:'70px 70px'}}/>}
              <div className="relative max-w-md">
                <p className="mb-3 text-4xl text-zinc-500">◇</p>
                <h3 className="mb-2 text-lg font-semibold">No hay series cargadas</h3>
                <p className="text-sm leading-7 text-zinc-400">La interfaz es propia de React. Cuando exista una fuente de lectura autorizada, el gráfico podrá representar sus registros reales sin usar un widget externo.</p>
              </div>
            </div>
          </section>

          <section aria-label="Herramientas e información" className="mt-4 rounded-2xl border border-white/15 bg-[#111318] p-4">
            {panel === 'grafico' && <div><h3 className="font-semibold">Vista del instrumento</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">No hay histórico o cotizaciones conectadas a esta ruta React. Selecciona un instrumento disponible cuando el catálogo esté configurado.</p></div>}
            {panel === 'herramientas' && <div><h3 className="font-semibold">Herramientas de Beat</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">La cuadrícula ya se puede activar o desactivar. Los dibujos, la regla y las anotaciones están en las tareas de implementación; no se muestran como botones falsamente operativos.</p></div>}
            {panel === 'ficha' && <div><h3 className="font-semibold">Ficha informativa</h3>
              {selected ? <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-zinc-500">Nombre</dt><dd>{selected.name}</dd></div>
                <div><dt className="text-zinc-500">Código</dt><dd>{selected.code}</dd></div>
                <div><dt className="text-zinc-500">Categoría</dt><dd>{selected.category}</dd></div>
                <div><dt className="text-zinc-500">Fuente</dt><dd>{selected.source ?? 'No indicada'}</dd></div>
              </dl> : <p className="mt-2 text-sm text-zinc-400">Elige un instrumento para ver los campos que realmente estén registrados.</p>}</div>}
            {panel === 'ia' && <div><h3 className="font-semibold">Actividad de inteligencias artificiales</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">Todavía no hay eventos de herramientas verificados ni voces conectadas. Aquí no se inventarán intervenciones.</p></div>}
          </section>
        </main>
        <aside className="hidden min-h-[75vh] flex-col border-l border-white/10 bg-[#0d0f13] p-4 lg:flex">
          <h2 className="font-semibold">IA y locutores</h2>
          <p className="mt-2 text-xs leading-6 text-zinc-400">Registro de actividad verificable, pendiente de una conexión de lectura autorizada.</p>
          {['Locutor A', 'Locutor B'].map(name => <div key={name}
            className="mt-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
            <span className="grid size-9 place-items-center rounded-lg bg-white/10 font-semibold">{name.slice(-1)}</span>
            <div><strong className="block text-sm">{name}</strong><span className="text-xs text-zinc-500">Desconectado</span></div>
          </div>)}
          <div className="mt-5 rounded-xl border border-dashed border-white/15 p-4 text-center">
            <p className="text-sm font-semibold">Sin actividad recibida</p>
            <p className="mt-2 text-xs leading-6 text-zinc-400">Cuando existan registros verificados de herramientas, podrán mostrarse con su hora y estado.</p>
          </div>
        </aside>
      </div>
      <nav aria-label="Navegación móvil" className="fixed bottom-0 left-0 right-0 z-30 flex justify-around border-t border-white/15 bg-[#0c0d10]/95 p-2 backdrop-blur lg:hidden">
        {PANELS.map(p => <button key={p.id} type="button" onClick={() => setPanel(p.id)}
          aria-pressed={panel === p.id}
          className={`flex min-h-12 w-[24%] flex-col items-center justify-center rounded-xl text-xs ${panel === p.id ? 'bg-white/15' : 'text-zinc-400'}`}>
          <span className="text-xl">{p.symbol}</span><span>{p.name}</span></button>)}
      </nav>
    </div>
  );
}
