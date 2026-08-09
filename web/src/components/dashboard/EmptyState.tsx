import React from 'react';
import { Activity } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = "Esperando la primera señal del sistema..." }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full min-h-[400px] bg-[#131722] rounded-lg border border-gray-800 p-8">
      <div className="relative flex items-center justify-center w-24 h-24 mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/30 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
        <div className="absolute inset-2 rounded-full border-2 border-blue-500/40 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]"></div>
        <div className="absolute inset-4 rounded-full border-2 border-blue-500/50 animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite_1s]"></div>
        <div className="relative flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-full border border-blue-500/50">
          <Activity className="w-6 h-6 text-blue-400 animate-pulse" />
        </div>
      </div>

      <h3 className="text-xl font-medium text-gray-200 mb-2">Sistema en modo de espera</h3>
      <p className="text-gray-400 text-center max-w-md">
        {message}
      </p>
      <div className="mt-8 flex items-center gap-2 text-xs text-gray-500 bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-800">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        Conectado a la base de datos
      </div>
    </div>
  );
}
