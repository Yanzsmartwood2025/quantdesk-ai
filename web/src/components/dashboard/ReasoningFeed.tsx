'use client';

import React from 'react';
import { format } from 'date-fns';
import { AgentTrace } from '@/types/database';
import { Brain, Shield, Briefcase, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReasoningFeedProps {
  traces: AgentTrace[];
}

const roleIcons = {
  analyst: Brain,
  risk_manager: Shield,
  portfolio_manager: Briefcase,
};

const roleColors = {
  analyst: 'text-blue-400',
  risk_manager: 'text-orange-400',
  portfolio_manager: 'text-purple-400',
};

const roleNames = {
  analyst: 'Analista Técnico',
  risk_manager: 'Gestor de Riesgo',
  portfolio_manager: 'Portfolio Manager',
};

export function ReasoningFeed({ traces }: ReasoningFeedProps) {
  if (traces.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-white dark:bg-[#131722] rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        Esperando razonamientos...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#131722] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1f2e]">
        <h3 className="font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          Consola de Agentes
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
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
                if (signal === 'BUY') { signalIcon = TrendingUp; signalColor = "text-green-500"; }
                else if (signal === 'SELL') { signalIcon = TrendingDown; signalColor = "text-red-500"; }
                else { signalIcon = Minus; signalColor = "text-gray-400"; }
             } else if (trace.agent_role === 'risk_manager') {
                reasoningText = (outputs.reasoning as string) || `Riesgo aprobado: ${outputs.approved}`;
                if (outputs.approved) { signalIcon = TrendingUp; signalColor = "text-green-500"; }
                else { signalIcon = Minus; signalColor = "text-red-500"; }
             } else if (trace.agent_role === 'portfolio_manager') {
                reasoningText = (outputs.reasoning as string) || (outputs.action as string) || "Decisión final tomada.";
                const action = (outputs.action as string)?.toUpperCase();
                if (action === 'BUY') { signalIcon = TrendingUp; signalColor = "text-green-500"; }
                else if (action === 'SELL') { signalIcon = TrendingDown; signalColor = "text-red-500"; }
                else { signalIcon = Minus; signalColor = "text-gray-400"; }
             }
          }

          return (
            <div key={trace.id} className="group relative pl-6 border-l-2 border-gray-200 dark:border-gray-800 pb-2 last:border-transparent">
              <div className="absolute -left-[11px] top-0 bg-white dark:bg-[#131722] p-1 rounded-full border border-gray-200 dark:border-gray-700">
                <Icon className={cn("w-3 h-3", roleColors[trace.agent_role])} />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className={cn("font-semibold", roleColors[trace.agent_role])}>
                    {roleNames[trace.agent_role]}
                  </span>
                  <span className="text-gray-400 dark:text-gray-600">|</span>
                  <span className="text-gray-500">
                    {format(new Date(trace.created_at), 'HH:mm:ss')}
                  </span>
                </div>

                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap break-words">
                  {reasoningText}
                </p>

                {signalIcon && (
                  <div className="flex items-center gap-1 mt-1">
                     <span className={cn("text-xs font-semibold px-2 py-0.5 rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50", signalColor)}>
                        {outputs?.signal || outputs?.action || (outputs?.approved ? 'APPROVED' : 'REJECTED')}
                     </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
