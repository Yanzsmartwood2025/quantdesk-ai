file_path = "web/src/components/dashboard/Dashboard.tsx"
with open(file_path, "r") as f:
    content = f.read()

search_constants = """const AVAILABLE_INSTRUMENTS = ['EUR_USD', 'GBP_USD', 'USD_JPY'];
const ASSET_CATEGORIES = ['Forex', 'Sintéticos', 'Cripto', 'Índices', 'Commodities'];"""

replace_constants = """const AVAILABLE_INSTRUMENTS = ['EUR_USD', 'GBP_USD', 'USD_JPY'];
const SYNTHETIC_INSTRUMENTS = ['R_75', 'R_100', 'BOOM1000', 'CRASH1000'];
const ASSET_CATEGORIES = ['Forex', 'Sintéticos', 'Cripto', 'Índices', 'Commodities'];

const instrumentLabels: Record<string, string> = {
  'R_75': 'Volatility 75',
  'R_100': 'Volatility 100',
  'BOOM1000': 'Boom 1000',
  'CRASH1000': 'Crash 1000'
};"""

content = content.replace(search_constants, replace_constants)

search_category_effect = """  // Initial Data Fetch
  useEffect(() => {"""

replace_category_effect = """  // Handle category change
  useEffect(() => {
    if (category === 'Forex') {
      if (!AVAILABLE_INSTRUMENTS.includes(instrument)) setInstrument(AVAILABLE_INSTRUMENTS[0]);
    } else if (category === 'Sintéticos') {
      if (!SYNTHETIC_INSTRUMENTS.includes(instrument)) setInstrument(SYNTHETIC_INSTRUMENTS[0]);
    }
  }, [category, instrument]);

  // Initial Data Fetch
  useEffect(() => {"""

content = content.replace(search_category_effect, replace_category_effect)

search_dropdown = """          {category === 'Forex' && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400">Instrumento:</label>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="bg-[#131722] border border-gray-700 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {AVAILABLE_INSTRUMENTS.map(inst => (
                  <option key={inst} value={inst}>{inst.replace('_', '/')}</option>
                ))}
              </select>
            </div>
          )}"""

replace_dropdown = """          {(category === 'Forex' || category === 'Sintéticos') && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-400">Instrumento:</label>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="bg-[#131722] border border-gray-700 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {category === 'Forex' && AVAILABLE_INSTRUMENTS.map(inst => (
                  <option key={inst} value={inst}>{inst.replace('_', '/')}</option>
                ))}
                {category === 'Sintéticos' && SYNTHETIC_INSTRUMENTS.map(inst => (
                  <option key={inst} value={inst}>{instrumentLabels[inst] || inst}</option>
                ))}
              </select>
            </div>
          )}"""

content = content.replace(search_dropdown, replace_dropdown)

search_empty_state = """      {category !== 'Forex' ? ("""
replace_empty_state = """      {(category !== 'Forex' && category !== 'Sintéticos') ? ("""
content = content.replace(search_empty_state, replace_empty_state)

with open(file_path, "w") as f:
    f.write(content)
