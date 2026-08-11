import re

with open("web/src/components/dashboard/Dashboard.tsx", "r") as f:
    content = f.read()

# 1. Update state variables
state_search = """  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);"""

state_replace = """  const [loading, setLoading] = useState(false);
  const [isTracesLoading, setIsTracesLoading] = useState(false);
  const [isInitialCandlesLoading, setIsInitialCandlesLoading] = useState(false);
  const dataLoading = isTracesLoading || isInitialCandlesLoading;
  const prevInstrument = useRef(instrument);"""

content = content.replace(state_search, state_replace)

# 2. Update Effect 1
effect1_search = """  // Effect 1: Instrument Data Fetch (Traces & Status)
  useEffect(() => {
    if (loading) return;

    const fetchInstrumentData = async () => {
      setDataLoading(true);
      try {
        // Initialize timeframes static list
        setTimeframes([...TIMEFRAMES_DISPLAY]);
        if (!selectedTimeframe || !TIMEFRAMES_DISPLAY.includes(selectedTimeframe)) {
           setSelectedTimeframe(TIMEFRAMES_DISPLAY[0]);
        }"""

effect1_replace = """  // Effect 1: Instrument Data Fetch (Traces & Status)
  useEffect(() => {
    if (loading) return;

    const fetchInstrumentData = async () => {
      setIsTracesLoading(true);
      try {
        // Initialize timeframes static list
        setTimeframes([...TIMEFRAMES_DISPLAY]);
        setSelectedTimeframe((prev) => (!prev || !TIMEFRAMES_DISPLAY.includes(prev)) ? TIMEFRAMES_DISPLAY[0] : prev);"""

content = content.replace(effect1_search, effect1_replace)

# 3. Update Effect 1 finally block
effect1_finally_search = """      } finally {
        setDataLoading(false);
      }
    };

    fetchInstrumentData();
  }, [instrument, loading]);"""

effect1_finally_replace = """      } finally {
        setIsTracesLoading(false);
      }
    };

    fetchInstrumentData();
  }, [instrument, loading]);"""

content = content.replace(effect1_finally_search, effect1_finally_replace)


# 4. Update Effect 2
effect2_search = """  // Effect 2: Timeframe Data Fetch (Candles only)
  useEffect(() => {
    if (loading) return;

    // Safety check - wait for selectedTimeframe to be set by Effect 1 if missing
    if (!selectedTimeframe) return;

    const fetchCandles = async () => {
      try {"""

effect2_replace = """  // Effect 2: Timeframe Data Fetch (Candles only)
  useEffect(() => {
    if (loading) return;

    // Safety check - wait for selectedTimeframe to be set by Effect 1 if missing
    if (!selectedTimeframe) return;

    const isInstrumentChange = prevInstrument.current !== instrument;
    if (isInstrumentChange) {
       setIsInitialCandlesLoading(true);
       setCandles([]); // Clear old candles to avoid flashing stale data
    }

    const fetchCandles = async () => {
      try {"""

content = content.replace(effect2_search, effect2_replace)

# 5. Update Effect 2 finally block
effect2_finally_search = """        if (candlesError) console.error("Failed to load candles:", candlesError);
      } catch (err) {
        console.error("Error during candle data fetch:", err);
      }
    };

    fetchCandles();
  }, [instrument, selectedTimeframe, loading]);"""

effect2_finally_replace = """        if (candlesError) console.error("Failed to load candles:", candlesError);
      } catch (err) {
        console.error("Error during candle data fetch:", err);
      } finally {
        if (isInstrumentChange) {
           setIsInitialCandlesLoading(false);
           prevInstrument.current = instrument;
        }
      }
    };

    fetchCandles();
  }, [instrument, selectedTimeframe, loading]);"""

content = content.replace(effect2_finally_search, effect2_finally_replace)

# Add useRef import if missing
if "useRef" not in content[:content.find(";")]:
    content = content.replace("import React, { useEffect, useState } from 'react';", "import React, { useEffect, useState, useRef } from 'react';")

with open("web/src/components/dashboard/Dashboard.tsx", "w") as f:
    f.write(content)
print("Successfully updated Dashboard.tsx")
