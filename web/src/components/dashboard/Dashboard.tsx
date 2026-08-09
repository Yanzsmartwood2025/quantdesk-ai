'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AgentTrace, MarketCandle } from '@/types/database';
import { EmptyState } from './EmptyState';
import { AgentStatusCard } from './AgentStatusCard';
import { ReasoningFeed } from './ReasoningFeed';
import { ChartWidget } from './ChartWidget';

const AVAILABLE_INSTRUMENTS = ['EUR_USD', 'GBP_USD', 'USD_JPY'];
const ASSET_CATEGORIES = ['Forex', 'Sintéticos', 'Cripto', 'Índices', 'Commodities'];

export function Dashboard() {
  const [category, setCategory] = useState(ASSET_CATEGORIES[0]);
  const [instrument, setInstrument] = useState(AVAILABLE_INSTRUMENTS[0]);
  const [candles, setCandles] = useState<MarketCandle[]>([]);
  const [traces, setTraces] = useState<AgentTrace[]>([]);
  const [loading, setLoading] = useState(true);

  // Active states for agents
  const [analystActive, setAnalystActive] = useState(false);
  const [riskActive, setRiskActive] = useState(false);
  const [portfolioActive, setPortfolioActive] = useState(false);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch initial candles
      const { data: candlesData, error: candlesError } = await supabase
        .from('market_candles')
        .select('*')
        .eq('instrument', instrument)
        .order('timestamp', { ascending: false })
        .limit(200);

      if (candlesData) {
        setCandles(candlesData);
      }
      if (candlesError) console.error("Failed to load candles:", candlesError);

      // Fetch initial traces
      const { data: tracesData, error: tracesError } = await supabase
        .from('agent_traces')
        .select('*')
        .eq('instrument', instrument)
        .order('created_at', { ascending: false })
        .limit(50);

      if (tracesData) {
        setTraces(tracesData);
      }
      if (tracesError) console.error("Failed to load traces:", tracesError);

      setLoading(false);
    };

    fetchData();
  }, [instrument]);

  // Supabase Realtime Subscriptions
  useEffect(() => {
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
          setCandles((current) => [payload.new as MarketCandle, ...current]);
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [instrument]);

  // Derived state for empty state
  const isDataEmpty = !loading && candles.length === 0 && traces.length === 0;

  // Last active times
  const lastAnalyst = traces.find(t => t.agent_role === 'analyst')?.created_at;
  const lastRisk = traces.find(t => t.agent_role === 'risk_manager')?.created_at;
  const lastPortfolio = traces.find(t => t.agent_role === 'portfolio_manager')?.created_at;

  return (
    <div className="min-h-screen bg-black text-gray-100 p-4 md:p-6 font-sans">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            QuantDesk AI
          </h1>
          <p className="text-sm text-gray-500">Mesa de inversión autónoma</p>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-2 bg-[#131722] p-1 rounded-lg border border-gray-800">
            {ASSET_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  category === cat
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-transparent'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {category === 'Forex' && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400">Instrumento:</label>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="bg-[#131722] border border-gray-700 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {AVAILABLE_INSTRUMENTS.map(inst => (
                  <option key={inst} value={inst}>{inst.replace('_', '/')}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </header>

      {category !== 'Forex' ? (
        <EmptyState message={`${category} próximamente...`} />
      ) : loading ? (
         <div className="flex items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
         </div>
      ) : isDataEmpty ? (
        <EmptyState message={`Esperando las primeras velas y señales para ${instrument.replace('_', '/')}...`} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-120px)]">
          {/* Left Column: Agents & Feed */}
          <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden h-full">
            <div className="flex flex-col gap-3">
              <AgentStatusCard
                role="analyst"
                title="Analista Técnico"
                description="Identifica setups de mercado"
                isActive={analystActive}
                lastActiveAt={lastAnalyst}
              />
              <AgentStatusCard
                role="risk_manager"
                title="Gestor de Riesgo"
                description="Evalúa riesgo/recompensa"
                isActive={riskActive}
                lastActiveAt={lastRisk}
              />
              <AgentStatusCard
                role="portfolio_manager"
                title="Portfolio Manager"
                description="Decisión final de ejecución"
                isActive={portfolioActive}
                lastActiveAt={lastPortfolio}
              />
            </div>

            <div className="flex-1 overflow-hidden mt-2">
              <ReasoningFeed traces={traces} />
            </div>
          </div>

          {/* Right Column: Chart */}
          <div className="lg:col-span-3 h-full min-h-[400px]">
            <ChartWidget candles={candles} traces={traces} />
          </div>
        </div>
      )}
    </div>
  );
}
