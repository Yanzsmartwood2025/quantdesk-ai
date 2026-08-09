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

const roleBgs = {
  analyst: 'bg-blue-500/20 border-blue-500/30',
  risk_manager: 'bg-orange-500/20 border-orange-500/30',
  portfolio_manager: 'bg-purple-500/20 border-purple-500/30',
};

const roleGlows = {
  analyst: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]',
  risk_manager: 'shadow-[0_0_15px_rgba(249,115,22,0.5)]',
  portfolio_manager: 'shadow-[0_0_15px_rgba(168,85,247,0.5)]',
};

export function AgentStatusCard({ role, title, description, isActive, lastActiveAt }: AgentStatusCardProps) {
  const Icon = roleIcons[role];
  const colorClass = roleColors[role];
  const bgClass = roleBgs[role];
  const glowClass = isActive ? roleGlows[role] : '';

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 transition-all duration-500",
        isActive
          ? `bg-gray-50 dark:bg-[#1a1f2e] border-gray-300 dark:border-gray-600 ${glowClass}`
          : "bg-white dark:bg-[#131722] border-gray-200 dark:border-gray-800"
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
            <h4 className="font-medium text-gray-800 dark:text-gray-200">{title}</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className={cn(
              "text-xs font-medium uppercase tracking-wider",
              isActive ? colorClass : "text-gray-400 dark:text-gray-500"
            )}>
              {isActive ? 'Analizando...' : 'En Espera'}
            </span>
            <div className="relative flex h-2 w-2">
              {isActive && (
                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", bgClass.split(' ')[0].replace('/20', ''))}></span>
              )}
              <span className={cn("relative inline-flex rounded-full h-2 w-2", isActive ? bgClass.split(' ')[0].replace('/20', '') : 'bg-gray-300 dark:bg-gray-600')}></span>
            </div>
          </div>

          {lastActiveAt && !isActive && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              Último: {new Date(lastActiveAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
