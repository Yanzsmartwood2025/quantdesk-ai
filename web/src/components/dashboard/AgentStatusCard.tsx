'use client';

import React from 'react';
import { Brain, Shield, Briefcase } from 'lucide-react';
import { AgentRole } from '@/types/database';
import { cn } from '@/lib/utils';

interface AgentStatusCardProps {
  role: AgentRole;
  title: string;
  description: string;
  isActive: boolean;
  lastActiveAt?: string;
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

const roleBgs = {
  analyst: 'bg-white/20 border-white/30',
  risk_manager: 'bg-white/20 border-white/30',
  portfolio_manager: 'bg-white/20 border-white/30',
};

const roleGlows = {
  analyst: 'shadow-[0_0_15px_rgba(255,255,255,0.18)]',
  risk_manager: 'shadow-[0_0_15px_rgba(255,255,255,0.18)]',
  portfolio_manager: 'shadow-[0_0_15px_rgba(255,255,255,0.18)]',
};

export function AgentStatusCard({ role, title, description, isActive, lastActiveAt, isPaused }: AgentStatusCardProps) {
  const Icon = roleIcons[role];
  const colorClass = roleColors[role];
  const bgClass = roleBgs[role];
  const glowClass = isActive ? roleGlows[role] : '';

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 transition-all duration-500",
        isActive
          ? `bg-gray-50 dark:bg-[#151515] border-gray-300 dark:border-gray-600 ${glowClass}`
          : "bg-white dark:bg-[#101010] border-gray-200 dark:border-gray-800"
      )}
    >
      {/* Background Pulse when active */}
      {isActive && (
        <div className="absolute inset-0 overflow-hidden">
           <div className={cn("absolute -top-1/2 -left-1/2 w-[200%] h-[200%] rounded-full opacity-10 blur-3xl animate-pulse", bgClass.split(' ')[0])}></div>
        </div>
      )}

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg border", isActive ? bgClass : "bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700")}>
            <Icon className={cn("w-5 h-5", isActive ? colorClass : "text-gray-500 dark:text-gray-400")} />
          </div>
          <div>
            <h4 className="font-medium text-gray-800 dark:text-zinc-100">{title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-medium uppercase tracking-wider",
              isActive ? colorClass : (isPaused ? "text-gray-400 dark:text-zinc-400" : "text-gray-400 dark:text-zinc-400")
            )}>
              {isActive ? 'Analizando...' : (isPaused ? 'Instrumento en pausa' : 'En Espera')}
            </span>
            <div className="relative flex h-2 w-2">
              {isActive && (
                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", bgClass.split(' ')[0].replace('/20', ''))}></span>
              )}
              <span className={cn("relative inline-flex rounded-full h-2 w-2", isActive ? bgClass.split(' ')[0].replace('/20', '') : (isPaused ? 'bg-gray-400 dark:bg-gray-700' : 'bg-gray-300 dark:bg-gray-600'))}></span>
            </div>
          </div>

          {lastActiveAt && !isActive && (
            <span className="text-[10px] text-gray-400 dark:text-zinc-400">
              Último: {new Date(lastActiveAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
