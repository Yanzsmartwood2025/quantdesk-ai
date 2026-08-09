export type AgentRole = 'analyst' | 'risk_manager' | 'portfolio_manager';

export interface AgentTrace {
  id: string;
  created_at: string;
  instrument: string;
  cycle_id: string;
  agent_role: AgentRole;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  prompt_tokens?: number;
  completion_tokens?: number;
  provider?: string;
}

export interface MarketCandle {
  id: string;
  instrument: string;
  timeframe: string;
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}
