ALTER TABLE active_instruments ADD COLUMN IF NOT EXISTS market VARCHAR(30);

UPDATE active_instruments SET market = 'Forex' WHERE category = 'Forex' AND market IS NULL;
UPDATE active_instruments SET market = 'Sintéticos' WHERE category != 'Forex' AND market IS NULL;

CREATE INDEX IF NOT EXISTS idx_active_instruments_market ON active_instruments(market);
