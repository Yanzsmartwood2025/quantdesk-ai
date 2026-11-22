'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase, supabaseUrl } from '@/lib/supabase';
import { AgentTrace, MarketCandle } from '@/types/database';
import { EmptyState } from './EmptyState';
import { AgentStatusCard } from './AgentStatusCard';
import { ReasoningFeed } from './ReasoningFeed';
import { ChartWidget } from './ChartWidget';
import { ThemeToggle } from '../ThemeToggle';
import { InstrumentSelector, InstrumentGroup } from './InstrumentSelector';

const ASSET_CATEGORIES = ['Forex', 'Sintéticos', 'Cripto', 'Índices', 'Commodities'];

// Only display instruments actually stored in the read-only catalogue.

const TIMEFRAMES_DISPLAY = ['1m', '5m', '15m', '30m', '1H', '4H', '1D'];
const TIMEFRAMES_INTERNAL = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

export function Dashboard() {
  const [category, setCategory] = useState(ASSET_CATEGORIES[0]);
  const [instrument, setInstrument] = useState('');

  // Data for selector
  const [instrumentsByMarket, setInstrumentsByMarket] = useState<Record<string, InstrumentGroup[]>>({});
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [timeframes, setTimeframes] = useState<string[]>([]); // Display values
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(''); // Display value ('1H')
  const [candles, setCandles] = useState<MarketCandle[]>([]);
  const [lastUpdatedCandle, setLastUpdatedCandle] = useState<MarketCandle | null>(null);
  const [traces, setTraces] = useState<AgentTrace[]>([]);

  // Diagnostic states
  const [diagStatus, setDiagStatus] = useState<string>('INIT');
  const [diagLastEvent, setDiagLastEvent] = useState<unknown>('Ninguno todavía');
  const [loading, setLoading] = useState(false);
  const [isTracesLoading, setIsTracesLoading] = useState(false);
  const [isInitialCandlesLoading, setIsInitialCandlesLoading] = useState(false);
  const dataLoading = isTracesLoading || isInitialCandlesLoading;
  const prevInstrument = useRef(instrument);

  // Active states for agents
  const [analystActive, setAnalystActive] = useState(false);
  const [riskActive, setRiskActive] = useState(false);
  const [portfolioActive, setPortfolioActive] = useState(false);

  // Active Instrument state
  const [isInstrumentActive, setIsInstrumentActive] = useState(false);
  const [instrumentPips, setInstrumentPips] = useState<Record<string, number>>({});

  // Load active instruments from DB on mount
  useEffect(() => {
    const fetchInstruments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('active_instruments')
          .select('instrument, category, market, pip_size');

        if (error) {
          console.error("Failed to load catalogue:", error);
          setCatalogError("No fue posible consultar el catálogo guardado.");
          setInstrumentsByMarket({});
          return;
        }

        setCatalogError(null);
        const marketCategoryMap: Record<string, Record<string, string[]>> = {};
        const pipsRecord: Record<string, number> = {};

        (data || []).forEach(item => {
          if (!item.instrument) return;
          if (item.pip_size !== null) pipsRecord[item.instrument] = Number(item.pip_size);
          const market = item.market || "Sin clasificar";
          const group = item.category || "General";
          if (!marketCategoryMap[market]) marketCategoryMap[market] = {};
          if (!marketCategoryMap[market][group]) marketCategoryMap[market][group] = [];
          marketCategoryMap[market][group].push(item.instrument);
        });

        const byMarket: Record<string, InstrumentGroup[]> = {};
        Object.entries(marketCategoryMap).forEach(([market, groups]) => {
          byMarket[market] = Object.entries(groups)
            .map(([label, items]) => ({ label, items: [...new Set(items)].sort() }))
            .sort((a,b) => a.label.localeCompare(b.label));
        });
        setInstrumentPips(pipsRecord);
        setInstrumentsByMarket(byMarket);
      } catch (err) {
        console.error("Catalogue query failed:", err);
        setCatalogError("No fue posible consultar el catálogo guardado.");
        setInstrumentsByMarket({});
      } finally {
        setLoading(false);
      }
    };

    fetchInstruments();
  }, []);

  // Only one instrument is selected. Selection never writes to the database,
  // opens broker connections, or starts background analysis.
  const clearSelectedView = () => {
    setCandles([]);
    setTraces([]);
    setLastUpdatedCandle(null);
    setIsInstrumentActive(false);
    setSelectedTimeframe('');
    setTimeframes([]);
    setIsTracesLoading(false);
    setIsInitialCandlesLoading(false);
    setAnalystActive(false);
    setRiskActive(false);
    setPortfolioActive(false);
    prevInstrument.current = '';
  };

  const selectInstrument = (next: string) => {
    if (instrument === next) return;
    clearSelectedView();
    setInstrument(next);
  };

  const selectCategory = (nextCategory: string) => {
    if (nextCategory === category) return;
    clearSelectedView();
    setInstrument('');
    setCategory(nextCategory);
  };

  // If the catalogue changes underneath the page, clear any unavailable selection.
  useEffect(() => {
    if (!instrument || loading) return;
    const items = (instrumentsByMarket[category] || []).flatMap(group => group.items);
    if (!items.includes(instrument)) setInstrument('');
  }, [category, instrumentsByMarket, instrument, loading]);

  const currentCategoryCount = (instrumentsByMarket[category] || []).reduce(
    (sum, group) => sum + group.items.length, 0
  );

  // Effect 1: Instrument Data Fetch (Traces & Status)
  useEffect(() => {
    if (loading || !instrument) return;
    let cancelled = false;

    const fetchInstrumentData = async () => {
      setIsTracesLoading(true);
      try {
        // Initialize timeframes static list
        setTimeframes([...TIMEFRAMES_DISPLAY]);
        setSelectedTimeframe((prev) => (!prev || !TIMEFRAMES_DISPLAY.includes(prev)) ? TIMEFRAMES_DISPLAY[0] : prev);

        // Fetch initial traces
        const { data: tracesData, error: tracesError } = await supabase
          .from('agent_traces')
          .select('*')
          .eq('instrument', instrument)
          .order('created_at', { ascending: false })
          .limit(50);

        // Fetch active state
        const { data: activeData, error: activeError } = await supabase
          .from('active_instruments')
          .select('is_active')
          .eq('instrument', instrument)
          .single();

        if (cancelled) return;
        if (activeData) {
          setIsInstrumentActive(activeData.is_active);
        } else {
          setIsInstrumentActive(false); // default
        }
        if (activeError) console.error("Failed to load active status:", activeError);

        if (tracesData) {
          setTraces(tracesData);
        }
        if (tracesError) console.error("Failed to load traces:", tracesError);
      } catch (err) {
        console.error("Error during instrument data fetch:", err);
      } finally {
        if (!cancelled) setIsTracesLoading(false);
      }
    };

    fetchInstrumentData();
    return () => { cancelled = true; };
  }, [instrument, loading]);

  // Effect 2: Timeframe Data Fetch (Candles only)
  useEffect(() => {
    if (loading || !instrument || !selectedTimeframe) return;
    let cancelled = false;

    const isInstrumentChange = prevInstrument.current !== instrument;

    // Clear lastUpdatedCandle safely outside of a direct effect body render-trigger
    // We do it before async fetch so it's consistent.

    const fetchCandles = async () => {
      if (isInstrumentChange) {
         setIsInitialCandlesLoading(true);
         setCandles([]); // Clear old candles to avoid flashing stale data
      }
      setLastUpdatedCandle(null); // Clear live updates on TF/Instrument change
      try {
        const tfIndex = TIMEFRAMES_DISPLAY.indexOf(selectedTimeframe);
        const targetTimeframeInternal = tfIndex >= 0 ? TIMEFRAMES_INTERNAL[tfIndex] : null;

        let candlesQuery = supabase
          .from('market_candles')
          .select('*')
          .eq('instrument', instrument)
          .order('timestamp', { ascending: false })
          .limit(200);

        if (targetTimeframeInternal) {
          candlesQuery = candlesQuery.eq('timeframe', targetTimeframeInternal);
        }

        const { data: candlesData, error: candlesError } = await candlesQuery;

        if (cancelled) return;
        if (candlesData) {
          setCandles(candlesData);
        }
        if (candlesError) console.error("Failed to load candles:", candlesError);
      } catch (err) {
        console.error("Error during candle data fetch:", err);
      } finally {
        if (!cancelled && isInstrumentChange) {
           setIsInitialCandlesLoading(false);
           prevInstrument.current = instrument;
        }
      }
    };

    fetchCandles();
    return () => { cancelled = true; };
  }, [instrument, selectedTimeframe, loading]);

  // Supabase Realtime Subscriptions: at most one selected instrument.
  useEffect(() => {
    if (!instrument || !selectedTimeframe) return;
    let active = true;
    // Unfortunately, Supabase realtime filters only support a single equality condition out-of-the-box in the standard JS client for `filter`.
    // To strictly filter by instrument AND timeframe in real-time we must handle it client-side.
    // We subscribe to the instrument and filter the timeframe inside the callback.

    const tfIndex = TIMEFRAMES_DISPLAY.indexOf(selectedTimeframe);
    const targetTimeframeInternal = tfIndex >= 0 ? TIMEFRAMES_INTERNAL[tfIndex] : null;

    try {
      console.log(`[REALTIME] Subscribing to instrument ${instrument}, timeframe ${targetTimeframeInternal} (${selectedTimeframe})`);

      const channel = supabase
        .channel(`room_${instrument}`)
        .on(
          'broadcast',
          { event: '*' },
          (payload) => {
            console.log("[REALTIME BROADCAST] RAW EVENT RECEIVED:", payload);
            // Some events might just be empty pings or different events, so filter by our known events
            if (payload.payload?.eventType !== 'INSERT' && payload.payload?.eventType !== 'UPDATE') return;

            setDiagLastEvent({ table: 'market_candles', event: payload.payload.eventType, time: new Date().toISOString() });

            const newCandle = payload.payload.new as MarketCandle;

            // Client-side filtering by instrument and timeframe
            if (!active || newCandle.instrument !== instrument) return;
            if (!targetTimeframeInternal || newCandle.timeframe === targetTimeframeInternal) {
               setLastUpdatedCandle(newCandle);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'agent_traces',
            filter: `instrument=eq.${instrument}`,
          },
          (payload) => {
            console.log("[REALTIME] Event received:", payload);
            const newTrace = payload.new as AgentTrace;
            if (!active || newTrace.instrument !== instrument) return;
            setTraces((current) => [newTrace, ...current]);

            // Trigger animations based on role
            if (newTrace.agent_role === 'analyst') {
              setAnalystActive(true);
              setTimeout(() => setAnalystActive(false), 3000);
            } else if (newTrace.agent_role === 'risk_manager') {
              setRiskActive(true);
              setTimeout(() => setRiskActive(false), 3000);
            } else if (newTrace.agent_role === 'portfolio_manager') {
              setPortfolioActive(true);
              setTimeout(() => setPortfolioActive(false), 3000);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'active_instruments',
            filter: `instrument=eq.${instrument}`,
          },
          (payload) => {
            if (active && payload.new.instrument === instrument) setIsInstrumentActive(payload.new.is_active);
          }
        )
        .subscribe((status) => {
          console.log(`[REALTIME] Subscription status for room_${instrument}:`, status);
          if (active) setDiagStatus(status);
        });

      return () => {
        active = false;
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error("Error setting up realtime subscriptions:", err);
    }
  }, [instrument, selectedTimeframe]);

  // Derived state for empty state
  // We only show empty state if we are done loading AND we actually have 0 candles/traces
  const isDataEmpty = !dataLoading && !loading && candles.length === 0 && traces.length === 0;

  // Last active times
  const lastAnalyst = traces.find(t => t.agent_role === 'analyst')?.created_at;
  const lastRisk = traces.find(t => t.agent_role === 'risk_manager')?.created_at;
  const lastPortfolio = traces.find(t => t.agent_role === 'portfolio_manager')?.created_at;

  const getInstrumentLabel = (inst: string) => {
    if (category === 'Forex') return inst.replace('_', '/');
    // For synthetics we can keep the internal name or map known ones
    const labels: Record<string, string> = {
      'R_75': 'Volatility 75',
      'R_100': 'Volatility 100',
      'BOOM1000': 'Boom 1000',
      'CRASH1000': 'Crash 1000'
    };
    return labels[inst] || inst;
  };

  return (
    <div className="beat-app min-h-screen bg-[#060606] text-white p-3 sm:p-5 lg:p-6 font-sans relative">

      {/* Solo desarrollo: datos de depuración ocultos en producción. */}
      {process.env.NODE_ENV === "development" && <div className="fixed bottom-4 right-4 z-50 bg-black/90 text-zinc-200 p-4 rounded-lg shadow-lg border border-gray-700 max-w-sm text-xs font-mono break-words pointer-events-none">
        <h3 className="font-bold text-white mb-2 uppercase border-b border-gray-700 pb-1">Realtime Diagnóstico</h3>
        <p><strong>URL:</strong> {supabaseUrl}</p>
        <p><strong>Status:</strong> {diagStatus}</p>
        <p><strong>Último Evento:</strong> {JSON.stringify(diagLastEvent)}</p>
        <div className="mt-2 border-t border-gray-700 pt-1 max-h-32 overflow-y-auto">
          <strong>lastUpdatedCandle:</strong>
          <pre className="text-gray-300 whitespace-pre-wrap">{lastUpdatedCandle ? JSON.stringify(lastUpdatedCandle, null, 2) : 'null'}</pre>
        </div>
      </div>}

      <header className="mb-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="beat-logo flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black" aria-hidden="true">B</span>
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-tight text-white">Beat</h1>
              <p className="text-xs text-zinc-400">Estudio visual de datos · Demostración</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/20 bg-white/5 px-3 py-2 text-xs text-zinc-300">MODO CONSULTA</span>
            <ThemeToggle />
          </div>
        </div>

        <div className="beat-glass space-y-3 rounded-2xl p-3 sm:p-4">
          <nav aria-label="Categorías de datos" className="flex w-full items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
            {ASSET_CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => selectCategory(cat)}
                aria-pressed={category === cat}
                className={`beat-glass-button shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                  category === cat
                    ? 'border-white/70 bg-white/20 text-white'
                    : 'border-white/15 text-zinc-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </nav>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
              <label className="shrink-0 text-xs font-medium text-zinc-300">Instrumento a visualizar</label>
              <div className="min-w-0 flex-1">
                <InstrumentSelector
                  instruments={category === 'Forex' ? (instrumentsByMarket['Forex'] || []).flatMap(g => g.items) : []}
                  groups={category !== 'Forex' ? (instrumentsByMarket[category] || []) : []}
                  selectedInstrument={instrument}
                  onSelect={selectInstrument}
                  getLabel={getInstrumentLabel}
                />
              </div>
              {instrument && (
                <button type="button" onClick={() => selectInstrument('')}
                  className="beat-glass-button min-h-11 rounded-full px-4 py-2 text-xs font-semibold"
                  aria-label="Cerrar la vista seleccionada">
                  Cerrar vista
                </button>
              )}
            </div>
            <span
              className="inline-flex shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-zinc-200"
              title="Solo lectura: la activación del análisis requiere autorización y está deshabilitada en esta vista"
            >
              {isInstrumentActive ? 'Histórico activo · Solo lectura' : 'Pausado · Solo lectura'}
            </span>
          </div>
        </div>
      </header>

      {!instrument ? (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4 animate-in fade-in duration-500">
          <div className="beat-logo flex h-20 w-20 items-center justify-center rounded-3xl mb-6">
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h2 className="text-3xl font-black mb-3 text-white">
            Bienvenido a Beat
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-md text-lg">
            {catalogError
              ? catalogError
              : currentCategoryCount === 0
                ? `Todavía no hay instrumentos registrados en ${category}. No se mostrarán ejemplos como datos reales.`
                : `Hay ${currentCategoryCount} instrumentos guardados en ${category}. Elige uno para abrir su gráfico; cambiar de instrumento cierra el anterior.`}

          </p>
        </div>
      ) : (loading || dataLoading) ? (
         <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-400"></div>
         </div>
      ) : isDataEmpty ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 h-auto lg:h-[calc(100vh-160px)]">
          {/* We'll render empty states or empty containers here so it matches the UI structure */}
          <div className="order-2 lg:order-1 lg:col-span-1 flex flex-col gap-4 overflow-hidden h-auto lg:h-full">
            <div className="flex flex-col gap-3">
              <AgentStatusCard
                role="analyst"
                title="Analista Técnico"
                description="Identifica setups de mercado"
                isActive={analystActive}
                lastActiveAt={lastAnalyst}
                isPaused={!isInstrumentActive}
              />
              <AgentStatusCard
                role="risk_manager"
                title="Gestor de Riesgo"
                description="Evalúa riesgo/recompensa"
                isActive={riskActive}
                lastActiveAt={lastRisk}
                isPaused={!isInstrumentActive}
              />
              <AgentStatusCard
                role="portfolio_manager"
                title="Portfolio Manager"
                description="Decisión final de ejecución"
                isActive={portfolioActive}
                lastActiveAt={lastPortfolio}
                isPaused={!isInstrumentActive}
              />
            </div>
            <div className="flex-1 overflow-hidden mt-2 min-h-[300px] lg:min-h-0 flex flex-col">
              <ReasoningFeed traces={traces} isPaused={!isInstrumentActive} />
            </div>
          </div>
          <div className="order-1 lg:order-2 lg:col-span-3 h-full min-h-[400px] flex flex-col gap-4">
            <EmptyState message={`No hay registros visualizables para ${getInstrumentLabel(instrument)}...`} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-auto lg:h-[calc(100vh-120px)]">
          {/* Left Column: Agents & Feed */}
          <div className="order-2 lg:order-1 lg:col-span-1 flex flex-col gap-4 overflow-hidden h-auto lg:h-full">
            <div className="flex flex-col gap-3">
              <AgentStatusCard
                role="analyst"
                title="Analista Técnico"
                description="Identifica setups de mercado"
                isActive={analystActive}
                lastActiveAt={lastAnalyst}
                isPaused={!isInstrumentActive}
              />
              <AgentStatusCard
                role="risk_manager"
                title="Gestor de Riesgo"
                description="Evalúa riesgo/recompensa"
                isActive={riskActive}
                lastActiveAt={lastRisk}
                isPaused={!isInstrumentActive}
              />
              <AgentStatusCard
                role="portfolio_manager"
                title="Portfolio Manager"
                description="Decisión final de ejecución"
                isActive={portfolioActive}
                lastActiveAt={lastPortfolio}
                isPaused={!isInstrumentActive}
              />
            </div>

            <div className="flex-1 overflow-hidden mt-2 min-h-[300px] lg:min-h-0 flex flex-col">
              <ReasoningFeed traces={traces} isPaused={!isInstrumentActive} />
            </div>
          </div>

          {/* Right Column: Chart */}
          <div className="order-1 lg:order-2 lg:col-span-3 h-full min-h-[400px] flex flex-col gap-4">
            {timeframes.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Temporalidad:</span>
                <div className="flex flex-wrap gap-2">
                  {timeframes.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setSelectedTimeframe(tf)}
                      className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                        selectedTimeframe === tf
                          ? 'bg-white text-black shadow-sm'
                          : 'bg-white/5 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex-1 min-h-[400px]">
              <ChartWidget key={instrument} candles={candles} traces={traces} lastUpdatedCandle={lastUpdatedCandle} pipSize={instrumentPips[instrument]} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
