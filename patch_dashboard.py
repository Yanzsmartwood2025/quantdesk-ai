import re

with open("web/src/components/dashboard/Dashboard.tsx", "r") as f:
    content = f.read()

# We need to find the "Initial Data Fetch" block and replace it
# The block starts at: // Initial Data Fetch
# and ends right before: // Supabase Realtime Subscriptions

search_str = """  // Initial Data Fetch
  useEffect(() => {
    if (loading) return;

    const fetchTimeframesAndData = async () => {
      setDataLoading(true);

      try {
        // 1. We ALWAYS support these exactly 7 timeframes as configured by backend
        const availableTimeframes = [...TIMEFRAMES_DISPLAY];
        setTimeframes(availableTimeframes);

        let targetTimeframeDisplay = selectedTimeframe;
        if (availableTimeframes.length > 0 && (!selectedTimeframe || !availableTimeframes.includes(selectedTimeframe))) {
          targetTimeframeDisplay = availableTimeframes[0];
          setSelectedTimeframe(targetTimeframeDisplay);
        }

        // Convert display timeframe to internal before query
        const tfIndex = TIMEFRAMES_DISPLAY.indexOf(targetTimeframeDisplay);
        const targetTimeframeInternal = tfIndex >= 0 ? TIMEFRAMES_INTERNAL[tfIndex] : null;

        // 2. Fetch candles based on instrument and selected/target timeframe
        let candlesQuery = supabase
          .from('market_candles')
          .select('*')
          .eq('instrument', instrument)
          .order('timestamp', { ascending: false })
          .limit(200);

        if (targetTimeframeInternal) {
          candlesQuery = candlesQuery.eq('timeframe', targetTimeframeInternal);
        }

        const { data: candlesData, error: candlesError } = await candlesQuery;

        if (candlesData) {
          setCandles(candlesData);
        }
        if (candlesError) console.error("Failed to load candles:", candlesError);

        // 3. Fetch initial traces
        const { data: tracesData, error: tracesError } = await supabase
          .from('agent_traces')
          .select('*')
          .eq('instrument', instrument)
          .order('created_at', { ascending: false })
          .limit(50);

        // 4. Fetch active state
        const { data: activeData, error: activeError } = await supabase
          .from('active_instruments')
          .select('is_active')
          .eq('instrument', instrument)
          .single();

        if (activeData) {
          setIsInstrumentActive(activeData.is_active);
        } else {
          setIsInstrumentActive(false); // default
        }
        if (activeError) console.error("Failed to load active status:", activeError);

        if (tracesData) {
          setTraces(tracesData);
        }
        if (tracesError) console.error("Failed to load traces:", tracesError);
      } catch (err) {
        console.error("Error during initial data fetch:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchTimeframesAndData();
  }, [instrument, selectedTimeframe, loading]);"""

replace_str = """  // Effect 1: Instrument Data Fetch (Traces & Status)
  useEffect(() => {
    if (loading) return;

    const fetchInstrumentData = async () => {
      setDataLoading(true);
      try {
        // Initialize timeframes static list
        setTimeframes([...TIMEFRAMES_DISPLAY]);
        if (!selectedTimeframe || !TIMEFRAMES_DISPLAY.includes(selectedTimeframe)) {
           setSelectedTimeframe(TIMEFRAMES_DISPLAY[0]);
        }

        // Fetch initial traces
        const { data: tracesData, error: tracesError } = await supabase
          .from('agent_traces')
          .select('*')
          .eq('instrument', instrument)
          .order('created_at', { ascending: false })
          .limit(50);

        // Fetch active state
        const { data: activeData, error: activeError } = await supabase
          .from('active_instruments')
          .select('is_active')
          .eq('instrument', instrument)
          .single();

        if (activeData) {
          setIsInstrumentActive(activeData.is_active);
        } else {
          setIsInstrumentActive(false); // default
        }
        if (activeError) console.error("Failed to load active status:", activeError);

        if (tracesData) {
          setTraces(tracesData);
        }
        if (tracesError) console.error("Failed to load traces:", tracesError);
      } catch (err) {
        console.error("Error during instrument data fetch:", err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchInstrumentData();
  }, [instrument, loading]);

  // Effect 2: Timeframe Data Fetch (Candles only)
  useEffect(() => {
    if (loading) return;

    // Safety check - wait for selectedTimeframe to be set by Effect 1 if missing
    if (!selectedTimeframe) return;

    const fetchCandles = async () => {
      try {
        const tfIndex = TIMEFRAMES_DISPLAY.indexOf(selectedTimeframe);
        const targetTimeframeInternal = tfIndex >= 0 ? TIMEFRAMES_INTERNAL[tfIndex] : null;

        let candlesQuery = supabase
          .from('market_candles')
          .select('*')
          .eq('instrument', instrument)
          .order('timestamp', { ascending: false })
          .limit(200);

        if (targetTimeframeInternal) {
          candlesQuery = candlesQuery.eq('timeframe', targetTimeframeInternal);
        }

        const { data: candlesData, error: candlesError } = await candlesQuery;

        if (candlesData) {
          setCandles(candlesData);
        }
        if (candlesError) console.error("Failed to load candles:", candlesError);
      } catch (err) {
        console.error("Error during candle data fetch:", err);
      }
    };

    fetchCandles();
  }, [instrument, selectedTimeframe, loading]);"""

if search_str in content:
    new_content = content.replace(search_str, replace_str)
    with open("web/src/components/dashboard/Dashboard.tsx", "w") as f:
        f.write(new_content)
    print("Successfully patched Dashboard.tsx")
else:
    print("Could not find the target block in Dashboard.tsx")
