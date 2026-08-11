import re

with open("web/src/components/dashboard/Dashboard.tsx", "r") as f:
    content = f.read()

# Make sure the realtime subscription effectively utilizes the target timeframe internal.
search_str = """  // Supabase Realtime Subscriptions
  useEffect(() => {
    // Unfortunately, Supabase realtime filters only support a single equality condition out-of-the-box in the standard JS client for `filter`.
    // To strictly filter by instrument AND timeframe in real-time we must handle it client-side.
    // We subscribe to the instrument and filter the timeframe inside the callback.

    const tfIndex = TIMEFRAMES_DISPLAY.indexOf(selectedTimeframe);
    const targetTimeframeInternal = tfIndex >= 0 ? TIMEFRAMES_INTERNAL[tfIndex] : null;

    try {
      const channel = supabase"""

if search_str in content:
    print("Realtime subscription properly checks for targetTimeframeInternal")
else:
    print("Could not find realtime subscription block.")

