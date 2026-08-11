'use client';

import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { AgentTrace, MarketCandle } from '@/types/database';
import { EmptyState } from './EmptyState';
import { AgentStatusCard } from './AgentStatusCard';
import { ReasoningFeed } from './ReasoningFeed';
import { ChartWidget } from './ChartWidget';
import { ThemeToggle } from '../ThemeToggle';
import { InstrumentSelector, InstrumentGroup } from './InstrumentSelector';

const ASSET_CATEGORIES = ['Forex', 'Sintéticos', 'Cripto', 'Índices', 'Commodities'];

// Hardcoded for presentation when DB is empty, but overridden by DB
const DEFAULT_FOREX = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD', 'USD_CAD', 'USD_CHF', 'NZD_USD'];

const TIMEFRAMES_DISPLAY = ['1m', '5m', '15m', '30m', '1H', '4H', '1D'];
const TIMEFRAMES_INTERNAL = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'];

export function Dashboard() {
  const [category, setCategory] = useState(ASSET_CATEGORIES[0]);
  const [instrument, setInstrument] = useState(DEFAULT_FOREX[0]);

  // Data for selector
  const [forexInstruments, setForexInstruments] = useState<string[]>(DEFAULT_FOREX);
  const [syntheticGroups, setSyntheticGroups] = useState<InstrumentGroup[]>([]);

  const [timeframes, setTimeframes] = useState<string[]>([]); // Display values
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>(''); // Display value ('1H')
  const [candles, setCandles] = useState<MarketCandle[]>([]);
  const [lastUpdatedCandle, setLastUpdatedCandle] = useState<MarketCandle | null>(null);
  const [traces, setTraces] = useState<AgentTrace[]>([]);
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

  // Load active instruments from DB on mount
  useEffect(() => {
    const fetchInstruments = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('active_instruments')
          .select('instrument, category');

        if (error) {
          console.error("Failed to load instruments:", error);
          // Set some fallback mock data so we can verify the UI without DB
          setSyntheticGroups([
             { label: 'Volatility Indices', items: ['R_75', 'R_100'] },
             { label: 'Crash/Boom', items: ['BOOM1000', 'CRASH1000'] }
          ]);
          return;
        }

        if (data && data.length > 0) {
          const forex: string[] = [];
          const synthMap: Record<string, string[]> = {};

          data.forEach(item => {
            if (item.category === 'Forex') {
              forex.push(item.instrument);
            } else {
              if (!synthMap[item.category]) {
                synthMap[item.category] = [];
              }
              synthMap[item.category].push(item.instrument);
            }
          });

          if (forex.length > 0) setForexInstruments(forex);

          const groups: InstrumentGroup[] = Object.keys(synthMap).map(key => ({
            label: key,
            items: synthMap[key].sort()
          }));

          // Sort groups alphabetically
          groups.sort((a, b) => a.label.localeCompare(b.label));
          setSyntheticGroups(groups);
        } else {
          // Mock for presentation if empty
          setSyntheticGroups([
             { label: 'Volatility Indices', items: ['R_75', 'R_100'] },
             { label: 'Crash/Boom', items: ['BOOM1000', 'CRASH1000'] }
          ]);
        }
      } catch (err) {
         console.error("Supabase fetch error", err);
         setSyntheticGroups([
             { label: 'Volatility Indices', items: ['R_75', 'R_100'] },
             { label: 'Crash/Boom', items: ['BOOM1000', 'CRASH1000'] }
          ]);
      } finally {
        setLoading(false);
      }
    };

    fetchInstruments();
  }, []);

  // Use an effect to sync the selected instrument ONLY when category changes to a new one
  // and the current instrument isn't in that category. This fixes the sync state warning.
  useEffect(() => {
    const syncInstrument = () => {
      if (category === 'Forex' && !forexInstruments.includes(instrument)) {
        setInstrument(forexInstruments[0] || 'EUR_USD');
      } else if (category === 'Sintéticos') {
        const allSynths = syntheticGroups.flatMap(g => g.items);
        if (allSynths.length > 0 && !allSynths.includes(instrument)) {
          setInstrument(allSynths[0]);
        }
      }
    };
    syncInstrument();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, forexInstruments, syntheticGroups]);

  // Effect 1: Instrument Data Fetch (Traces & Status)
  useEffect(() => {
    if (loading) return;

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
        setIsTracesLoading(false);
      }
    };

    fetchInstrumentData();
  }, [instrument, loading]);

  // Effect 2: Timeframe Data Fetch (Candles only)
  useEffect(() => {
    if (loading) return;

    // Safety check - wait for selectedTimeframe to be set by Effect 1 if missing
    if (!selectedTimeframe) return;

    const isInstrumentChange = prevInstrument.current !== instrument;
    if (isInstrumentChange) {
       setIsInitialCandlesLoading(true);
       setCandles([]); // Clear old candles to avoid flashing stale data
    }
    setLastUpdatedCandle(null); // Clear live updates on TF/Instrument change

    const fetchCandles = async () => {
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

        if (candlesData) {
          setCandles(candlesData);
        }
        if (candlesError) console.error("Failed to load candles:", candlesError);
      } catch (err) {
        console.error("Error during candle data fetch:", err);
      } finally {
        if (isInstrumentChange) {
           setIsInitialCandlesLoading(false);
           prevInstrument.current = instrument;
        }
      }
    };

    fetchCandles();
  }, [instrument, selectedTimeframe, loading]);

  // Supabase Realtime Subscriptions
  useEffect(() => {
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
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'market_candles',
            filter: `instrument=eq.${instrument}`,
          },
          (payload) => {
            console.log("[REALTIME] Market Candle Event received:", payload);
            // Support both INSERT and UPDATE
            if (payload.eventType !== 'INSERT' && payload.eventType !== 'UPDATE') return;
            const newCandle = payload.new as MarketCandle;
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
            setIsInstrumentActive(payload.new.is_active);
          }
        )
        .subscribe((status) => {
          console.log(`[REALTIME] Subscription status for room_${instrument}:`, status);
        });

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (err) {
      console.error("Error setting up realtime subscriptions:", err);
    }
  }, [instrument, selectedTimeframe]);

  const toggleInstrumentActive = async () => {
    const newState = !isInstrumentActive;
    // Optimistic update
    setIsInstrumentActive(newState);

    try {
      const { error } = await supabase
        .from('active_instruments')
        .update({ is_active: newState, activated_at: newState ? new Date().toISOString() : null })
        .eq('instrument', instrument);

      if (error) {
        console.error("Failed to update active status:", error);
        // Revert on error
        setIsInstrumentActive(!newState);
      }
    } catch (err) {
      console.error("Supabase update error:", err);
      setIsInstrumentActive(!newState);
    }
  };

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
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-gray-100 p-4 md:p-6 font-sans transition-colors duration-300">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex justify-between items-center w-full md:w-auto">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              QuantDesk AI
            </h1>
            <p className="text-sm text-gray-500">Mesa de inversión autónoma</p>
          </div>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full md:w-auto overflow-hidden">
          <div className="flex flex-nowrap overflow-x-auto w-full items-center gap-2 bg-gray-100 dark:bg-[#131722] p-1 rounded-lg border border-gray-200 dark:border-gray-800 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {ASSET_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  category === cat
                    ? 'bg-white dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-gray-200 shadow-sm dark:border-blue-500/30'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800 border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {(category === 'Forex' || category === 'Sintéticos') && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <label className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">Instrumento:</label>
              <InstrumentSelector
                instruments={category === 'Forex' ? forexInstruments : []}
                groups={category === 'Sintéticos' ? syntheticGroups : []}
                selectedInstrument={instrument}
                onSelect={setInstrument}
                getLabel={getInstrumentLabel}
              />
              <button
                onClick={toggleInstrumentActive}
                className={`ml-2 px-3 py-1.5 text-sm font-medium rounded-md transition-colors border ${
                  isInstrumentActive
                    ? 'bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/50 dark:hover:bg-blue-500/30'
                    : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 dark:bg-[#1a1f2e] dark:text-gray-400 dark:border-gray-700 dark:hover:bg-[#2a2f3e]'
                }`}
                title={isInstrumentActive ? 'Pausar análisis de IA' : 'Activar análisis de IA (consumirá tokens)'}
              >
                {isInstrumentActive ? 'Activo' : 'Pausado'}
              </button>
            </div>
          )}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {(category !== 'Forex' && category !== 'Sintéticos') ? (
        <EmptyState message={`${category} próximamente...`} />
      ) : (loading || dataLoading) ? (
         <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
         </div>
      ) : isDataEmpty ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-auto lg:h-[calc(100vh-120px)]">
          {/* We'll render empty states or empty containers here so it matches the UI structure */}
          <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden h-auto lg:h-full">
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
          <div className="lg:col-span-3 h-full min-h-[400px] flex flex-col gap-4">
            <EmptyState message={`Esperando las primeras velas y señales para ${getInstrumentLabel(instrument)}...`} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-auto lg:h-[calc(100vh-120px)]">
          {/* Left Column: Agents & Feed */}
          <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden h-auto lg:h-full">
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
          <div className="lg:col-span-3 h-full min-h-[400px] flex flex-col gap-4">
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
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex-1 min-h-[400px]">
              <ChartWidget candles={candles} traces={traces} lastUpdatedCandle={lastUpdatedCandle} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
