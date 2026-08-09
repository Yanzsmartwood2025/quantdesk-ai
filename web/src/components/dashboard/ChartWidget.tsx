'use client';

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi, SeriesMarker, Time, createSeriesMarkers, CandlestickSeries } from 'lightweight-charts';
import { MarketCandle, AgentTrace } from '@/types/database';
import { useTheme } from 'next-themes';

interface ChartWidgetProps {
  candles: MarketCandle[];
  traces: AgentTrace[];
}

export function ChartWidget({ candles, traces }: ChartWidgetProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const isDark = resolvedTheme !== 'light';

    // Initialize chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: isDark ? '#d1d4dc' : '#374151',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(42, 46, 57, 0.5)' : 'rgba(229, 231, 235, 0.5)' },
        horzLines: { color: isDark ? 'rgba(42, 46, 57, 0.5)' : 'rgba(229, 231, 235, 0.5)' },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Add Candlestick series
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });

    chartRef.current = chart;
    seriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [resolvedTheme]);

  // Update data and markers when props change
  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;

    // Format candles for lightweight-charts
    const chartData = candles
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(candle => ({
        time: (new Date(candle.timestamp).getTime() / 1000) as Time,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      }));

    // Deduplicate data by time to prevent lightweight-charts errors
    const uniqueChartData = [];
    const seenTimes = new Set();
    for (const data of chartData) {
       if (!seenTimes.has(data.time)) {
           seenTimes.add(data.time);
           uniqueChartData.push(data);
       }
    }

    seriesRef.current.setData(uniqueChartData);

    // Filter portfolio manager traces for buy/sell actions
    const markers: SeriesMarker<Time>[] = traces
      .filter(t => t.agent_role === 'portfolio_manager' && t.outputs && 'action' in t.outputs)
      .map(t => {
        const outputs = t.outputs as Record<string, string>;
        const action = outputs.action?.toUpperCase();
        const time = (new Date(t.created_at).getTime() / 1000) as Time;

        if (action === 'BUY') {
          return {
            time,
            position: 'belowBar',
            color: '#26a69a',
            shape: 'arrowUp',
            text: 'BUY',
          } as SeriesMarker<Time>;
        } else if (action === 'SELL') {
          return {
            time,
            position: 'aboveBar',
            color: '#ef5350',
            shape: 'arrowDown',
            text: 'SELL',
          } as SeriesMarker<Time>;
        }
        return null;
      })
      .filter((m): m is SeriesMarker<Time> => m !== null)
      .sort((a, b) => (a.time as number) - (b.time as number));

    createSeriesMarkers(seriesRef.current, markers);

    // Fit content
    chartRef.current?.timeScale().fitContent();

  }, [candles, traces, resolvedTheme]);

  return (
    <div className="w-full h-full bg-white dark:bg-[#131722] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col transition-colors duration-300">
       <div className="flex-1 w-full h-full" ref={chartContainerRef} />
    </div>
  );
}
