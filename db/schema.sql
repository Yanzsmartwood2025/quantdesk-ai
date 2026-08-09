-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table for tracking closed trades and their outcome (used as memory)
CREATE TABLE IF NOT EXISTS trading_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    instrument VARCHAR(20) NOT NULL,
    setup_type VARCHAR(100) NOT NULL,
    outcome VARCHAR(20) NOT NULL, -- 'WIN' or 'LOSS'
    pnl NUMERIC NOT NULL,
    trade_id VARCHAR(50) UNIQUE NOT NULL
);

-- Index for querying memory fast
CREATE INDEX idx_trading_memory_instrument_setup ON trading_memory(instrument, setup_type);

-- Table for logging agent reasoning and decisions
CREATE TABLE IF NOT EXISTS agent_traces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    instrument VARCHAR(20) NOT NULL,
    cycle_id UUID NOT NULL, -- To group all agent runs in a single loop cycle
    agent_role VARCHAR(50) NOT NULL, -- 'analyst', 'risk_manager', 'portfolio_manager'
    inputs JSONB NOT NULL,
    outputs JSONB NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    provider VARCHAR(50)
);

CREATE INDEX idx_agent_traces_cycle ON agent_traces(cycle_id);
CREATE INDEX idx_agent_traces_instrument ON agent_traces(instrument);

-- Table for tracking historical OHLC market candles
CREATE TABLE IF NOT EXISTS market_candles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instrument VARCHAR(20) NOT NULL,
    timeframe VARCHAR(10) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open NUMERIC NOT NULL,
    high NUMERIC NOT NULL,
    low NUMERIC NOT NULL,
    close NUMERIC NOT NULL,
    volume NUMERIC,
    UNIQUE(instrument, timeframe, timestamp)
);

CREATE INDEX idx_market_candles_instrument_timeframe ON market_candles(instrument, timeframe);
CREATE INDEX idx_market_candles_timestamp ON market_candles(timestamp);

-- Table for tracking which instruments the AI should process
CREATE TABLE IF NOT EXISTS active_instruments (
    instrument VARCHAR(20) PRIMARY KEY,
    category VARCHAR(20) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    activated_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS and setup policies for active_instruments
ALTER TABLE active_instruments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active_instruments
CREATE POLICY "Allow public read access to active_instruments" ON active_instruments
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Allow public updates to is_active and activated_at ONLY on active_instruments
CREATE POLICY "Allow public updates to active_instruments" ON active_instruments
    FOR UPDATE
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- Insert baseline instruments for Forex
INSERT INTO active_instruments (instrument, category, is_active) VALUES
    ('EUR_USD', 'Forex', false),
    ('GBP_USD', 'Forex', false),
    ('USD_JPY', 'Forex', false),
    ('AUD_USD', 'Forex', false),
    ('USD_CAD', 'Forex', false),
    ('USD_CHF', 'Forex', false),
    ('NZD_USD', 'Forex', false)
ON CONFLICT (instrument) DO NOTHING;

-- Insert baseline instruments for Synthetics
