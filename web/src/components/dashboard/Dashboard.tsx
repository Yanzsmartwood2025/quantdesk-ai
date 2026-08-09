'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AgentTrace, MarketCandle } from '@/types/database';
import { EmptyState } from './EmptyState';
import { AgentStatusCard } from './AgentStatusCard';
import { ReasoningFeed } from './ReasoningFeed';
import { ChartWidget } from './ChartWidget';
import { ThemeToggle } from '../ThemeToggle';
import { InstrumentSelector } from './InstrumentSelector';

const AVAILABLE_INSTRUMENTS = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD', 'USD_CAD', 'USD_CHF', 'NZD_USD'];
const SYNTHETIC_INSTRUMENTS = ['R_75', 'R_100', 'BOOM1000', 'CRASH1000'];
const ASSET_CATEGORIES = ['Forex', 'Sintéticos', 'Cripto', 'Índices', 'Commodities'];

const instrumentLabels: Record<string, string> = {
  'R_75': 'Volatility 75',
  'R_100': 'Volatility 100',
  'BOOM1000': 'Boom 1000',
  'CRASH1000': 'Crash 1000'
};

export function Dashboard() {
  const [category, setCategory] = useState(ASSET_CATEGORIES[0]);
  const [instrument, setInstrument] = useState(AVAILABLE_INSTRUMENTS[0]);
  const [timeframes, setTimeframes] = useState<string[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('');
  const [candles, setCandles] = useState<MarketCandle[]>([]);
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [loading, setLoading] = useState(true);

  // Active states for agents
  const [analystActive, setAnalystActive] = useState(false);
  const [riskActive, setRiskActive] = useState(false);
  const [portfolioActive, setPortfolioActive] = useState(false);

  // Active Instrument state
  const [isInstrumentActive, setIsInstrumentActive] = useState(false);

  // Handle category change
  useEffect(() => {
    if (category === 'Forex') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!AVAILABLE_INSTRUMENTS.includes(instrument)) setInstrument(AVAILABLE_INSTRUMENTS[0]);
    } else if (category === 'Sintéticos') {

      if (!SYNTHETIC_INSTRUMENTS.includes(instrument)) setInstrument(SYNTHETIC_INSTRUMENTS[0]);
    }
  }, [category, instrument]);

  // Initial Data Fetch
  useEffect(() => {
    const fetchTimeframesAndData = async () => {
      setLoading(true);

      // 1. Fetch available timeframes for this instrument
      const { data: timeframeData, error: timeframeError } = await supabase
        .from('market_candles')
        .select('timeframe')
        .eq('instrument', instrument);

      if (timeframeError) {
        console.error("Failed to load timeframes:", timeframeError);
      }

      let availableTimeframes: string[] = [];
      if (timeframeData && timeframeData.length > 0) {
        const uniqueTimeframes = Array.from(new Set(timeframeData.map(d => d.timeframe))).filter(Boolean);
        // Sort timeframes logically if possible, otherwise keep as is
        const orderMap: Record<string, number> = { '1m': 1, '5m': 2, '15m': 3, '1H': 4, '4H': 5, '1D': 6 };
        uniqueTimeframes.sort((a, b) => (orderMap[a] || 99) - (orderMap[b] || 99));

        availableTimeframes = uniqueTimeframes;
      }

      setTimeframes(availableTimeframes);

      let targetTimeframe = selectedTimeframe;
      if (availableTimeframes.length > 0 && (!selectedTimeframe || !availableTimeframes.includes(selectedTimeframe))) {
        targetTimeframe = availableTimeframes[0];
        setSelectedTimeframe(targetTimeframe);
      }

      // 2. Fetch candles based on instrument and selected/target timeframe
      let candlesQuery = supabase
        .from('market_candles')
        .select('*')
        .eq('instrument', instrument)
        .order('timestamp', { ascending: false })
        .limit(200);

      if (targetTimeframe) {
        candlesQuery = candlesQuery.eq('timeframe', targetTimeframe);
      }

      const { data: candlesData, error: candlesError } = await candlesQuery;

      if (candlesData) {
        setCandles(candlesData);
      }
      if (candlesError) console.error("Failed to load candles:", candlesError);

      // 3. Fetch initial traces
      const { data: tracesData, error: tracesError } = await supabase
        .from('agent_traces')
        .select('*')
        .eq('instrument', instrument)
        .order('created_at', { ascending: false })
        .limit(50);

      // 4. Fetch active state
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

      setLoading(false);
    };

    fetchTimeframesAndData();
  }, [instrument, selectedTimeframe]);

  // Supabase Realtime Subscriptions
  useEffect(() => {
    // Unfortunately, Supabase realtime filters only support a single equality condition out-of-the-box in the standard JS client for `filter`.
    // To strictly filter by instrument AND timeframe in real-time we must handle it client-side.
    // We subscribe to the instrument and filter the timeframe inside the callback.

    const channel = supabase
      .channel(`room_${instrument}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'market_candles',
          filter: `instrument=eq.${instrument}`,
        },
        (payload) => {
          const newCandle = payload.new as MarketCandle;
          if (!selectedTimeframe || newCandle.timeframe === selectedTimeframe) {
             setCandles((current) => [newCandle, ...current]);
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instrument, selectedTimeframe]);

  const toggleInstrumentActive = async () => {
    const newState = !isInstrumentActive;
    // Optimistic update
    setIsInstrumentActive(newState);

    const { error } = await supabase
      .from('active_instruments')
      .update({ is_active: newState, activated_at: newState ? new Date().toISOString() : null })
      .eq('instrument', instrument);

    if (error) {
      console.error("Failed to update active status:", error);
      // Revert on error
      setIsInstrumentActive(!newState);
    }
  };

  // Derived state for empty state
  const isDataEmpty = !loading && candles.length === 0 && traces.length === 0;

  // Last active times
  const lastAnalyst = traces.find(t => t.agent_role === 'analyst')?.created_at;
  const lastRisk = traces.find(t => t.agent_role === 'risk_manager')?.created_at;
  const lastPortfolio = traces.find(t => t.agent_role === 'portfolio_manager')?.created_at;

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
                instruments={category === 'Forex' ? AVAILABLE_INSTRUMENTS : SYNTHETIC_INSTRUMENTS}
                selectedInstrument={instrument}
                onSelect={setInstrument}
                getLabel={(inst) => category === 'Forex' ? inst.replace('_', '/') : (instrumentLabels[inst] || inst)}
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
      ) : loading ? (
         <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
         </div>
      ) : isDataEmpty ? (
        <EmptyState message={`Esperando las primeras velas y señales para ${instrumentLabels[instrument] || instrument.replace('_', '/')}...`} />
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
              <ChartWidget candles={candles} traces={traces} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
