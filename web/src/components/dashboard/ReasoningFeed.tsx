'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { AgentTrace } from '@/types/database';
import { Brain, Shield, Briefcase, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReasoningFeedProps {
  traces: AgentTrace[];
  isPaused?: boolean;
}

const roleIcons = {
  analyst: Brain,
  risk_manager: Shield,
  portfolio_manager: Briefcase,
};

const roleColors = {
  analyst: 'text-zinc-200',
  risk_manager: 'text-zinc-200',
  portfolio_manager: 'text-zinc-200',
};

const roleNames = {
  analyst: 'Analista Técnico',
  risk_manager: 'Gestor de Riesgo',
  portfolio_manager: 'Portfolio Manager',
};

export function ReasoningFeed({ traces, isPaused }: ReasoningFeedProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  if (traces.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-white dark:bg-[#101010] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        Esperando razonamientos...
      </div>
    );
  }

  return (
    <div className={cn(
      "flex flex-col bg-white dark:bg-[#101010] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden",
      isCollapsed ? "h-auto" : "h-full"
    )}>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#151515] hover:bg-gray-100 dark:hover:bg-[#222222] transition-colors w-full flex items-center justify-between group"
      >
        <h3 className="font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <ChevronRight className={cn(
            "w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-200",
            !isCollapsed ? "rotate-90" : ""
          )} />
          Consola de Agentes
        </h3>
        <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          {isCollapsed ? 'Expandir' : 'Ocultar'}
        </span>
      </button>

      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
          {isPaused && (
            <div className="p-3 mb-2 text-sm text-zinc-200 rounded-lg bg-white/10 dark:bg-white/20 dark:text-zinc-200 border border-white/20 dark:border-white/30" role="alert">
              <span className="font-semibold">Instrumento en pausa.</span> La IA no consumirá tokens ni analizará este instrumento hasta que lo actives.
            </div>
          )}
          {traces.map((trace) => {
            const Icon = roleIcons[trace.agent_role];

            let reasoningText = "Analizando condiciones de mercado...";
            let signalIcon = null;
            let signalColor = "";

            // Extract reasoning or key decision from outputs
            const outputs = trace.outputs as Record<string, string | boolean | undefined>;

            if (outputs) {
               if (trace.agent_role === 'analyst') {
                  reasoningText = (outputs.reasoning as string) || (outputs.analysis as string) || JSON.stringify(outputs);
                  const signal = (outputs.signal as string)?.toUpperCase();
                  if (signal === 'BUY') { signalIcon = TrendingUp; signalColor = "text-zinc-200"; }
                  else if (signal === 'SELL') { signalIcon = TrendingDown; signalColor = "text-zinc-400"; }
                  else { signalIcon = Minus; signalColor = "text-gray-400"; }
               } else if (trace.agent_role === 'risk_manager') {
                  reasoningText = (outputs.reasoning as string) || `Riesgo aprobado: ${outputs.is_approved}`;
                  if (outputs.is_approved) { signalIcon = TrendingUp; signalColor = "text-zinc-200"; }
                  else { signalIcon = Minus; signalColor = "text-zinc-400"; }
               } else if (trace.agent_role === 'portfolio_manager') {
                  reasoningText = (outputs.reasoning as string) || (outputs.action as string) || "Decisión final tomada.";
                  const action = (outputs.action as string)?.toUpperCase();
                  if (action === 'BUY') { signalIcon = TrendingUp; signalColor = "text-zinc-200"; }
                  else if (action === 'SELL') { signalIcon = TrendingDown; signalColor = "text-zinc-400"; }
                  else { signalIcon = Minus; signalColor = "text-gray-400"; }
               }
            }

            return (
              <div key={trace.id} className="group relative pl-6 border-l-2 border-gray-200 dark:border-gray-800 pb-2 last:border-transparent">
                <div className="absolute -left-[11px] top-0 bg-white dark:bg-[#101010] p-1 rounded-full border border-gray-200 dark:border-gray-700">
                  <Icon className={cn("w-3 h-3", roleColors[trace.agent_role])} />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn("font-semibold", roleColors[trace.agent_role])}>
                      {roleNames[trace.agent_role]}
                    </span>
                    <span className="text-gray-400 dark:text-zinc-400">|</span>
                    <span className="text-gray-500">
                      {format(new Date(trace.created_at), 'HH:mm:ss')}
                    </span>
                  </div>

                  <p className="text-gray-700 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
                    {reasoningText}
                  </p>

                  {signalIcon && (
                    <div className="flex items-center gap-1 mt-1">
                       <span className={cn("text-xs font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50", signalColor)}>
                          {outputs?.signal || outputs?.action || (outputs?.is_approved ? 'APPROVED' : 'REJECTED')}
                       </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
