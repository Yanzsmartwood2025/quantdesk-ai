/* Instantánea histórica de consulta de Supabase, 22 nov 2026. NO COTIZACIONES.
 * Los registros de catálogos vacíos no se inventan.
 * El sitio de demostración no hace solicitudes a Supabase ni a proveedores financieros.
 */
export const categories = Object.freeze(["Forex","Sintéticos","Cripto","Índices","Commodities"]);
export const inventory = Object.freeze([
  {
    "code": "AUD_USD",
    "group": "Forex",
    "subcategory": "Forex"
  },
  {
    "code": "EUR_USD",
    "group": "Forex",
    "subcategory": "Forex"
  },
  {
    "code": "GBP_USD",
    "group": "Forex",
    "subcategory": "Forex"
  },
  {
    "code": "NZD_USD",
    "group": "Forex",
    "subcategory": "Forex"
  },
  {
    "code": "USD_CAD",
    "group": "Forex",
    "subcategory": "Forex"
  },
  {
    "code": "USD_CHF",
    "group": "Forex",
    "subcategory": "Forex"
  },
  {
    "code": "USD_JPY",
    "group": "Forex",
    "subcategory": "Forex"
  },
  {
    "code": "WLDXAU",
    "group": "Sintéticos",
    "subcategory": "Commodity Basket"
  },
  {
    "code": "BOOM1000",
    "group": "Sintéticos",
    "subcategory": "Crash Index"
  },
  {
    "code": "BOOM150N",
    "group": "Sintéticos",
    "subcategory": "Crash Index"
  },
  {
    "code": "BOOM300N",
    "group": "Sintéticos",
    "subcategory": "Crash Index"
  },
  {
    "code": "BOOM50",
    "group": "Sintéticos",
    "subcategory": "Crash Index"
  },
  {
    "code": "BOOM500",
    "group": "Sintéticos",
    "subcategory": "Crash Index"
  },
  {
    "code": "BOOM600",
    "group": "Sintéticos",
    "subcategory": "Crash Index"
  },
  {
    "code": "BOOM900",
    "group": "Sintéticos",
    "subcategory": "Crash Index"
  },
  {
    "code": "CRASH1000",
    "group": "Sintéticos",
    "subcategory": "Crash Index"
  },
  {
    "code": "CRASH150N",
    "group": "Sintéticos",
    "subcategory": "Crash Index"
  },
  {
    "code": "CRASH300N",
    "group": "Sintéticos",
    "subcategory": "Crash Index"
  },
  {
    "code": "CRASH50",
    "group": "Sintéticos",
    "subcategory": "Crash Index"
  },
  {
    "code": "CRASH500",
    "group": "Sintéticos",
    "subcategory": "Crash Index"
  },
  {
    "code": "CRASH600",
    "group": "Sintéticos",
    "subcategory": "Crash Index"
  },
  {
    "code": "CRASH900",
    "group": "Sintéticos",
    "subcategory": "Crash Index"
  },
  {
    "code": "WLDAUD",
    "group": "Sintéticos",
    "subcategory": "Forex Basket"
  },
  {
    "code": "WLDEUR",
    "group": "Sintéticos",
    "subcategory": "Forex Basket"
  },
  {
    "code": "WLDGBP",
    "group": "Sintéticos",
    "subcategory": "Forex Basket"
  },
  {
    "code": "WLDUSD",
    "group": "Sintéticos",
    "subcategory": "Forex Basket"
  },
  {
    "code": "JD10",
    "group": "Sintéticos",
    "subcategory": "Jump Index"
  },
  {
    "code": "JD100",
    "group": "Sintéticos",
    "subcategory": "Jump Index"
  },
  {
    "code": "JD25",
    "group": "Sintéticos",
    "subcategory": "Jump Index"
  },
  {
    "code": "JD50",
    "group": "Sintéticos",
    "subcategory": "Jump Index"
  },
  {
    "code": "JD75",
    "group": "Sintéticos",
    "subcategory": "Jump Index"
  },
  {
    "code": "RDBEAR",
    "group": "Sintéticos",
    "subcategory": "Random Daily"
  },
  {
    "code": "RDBULL",
    "group": "Sintéticos",
    "subcategory": "Random Daily"
  },
  {
    "code": "1HZ100V",
    "group": "Sintéticos",
    "subcategory": "Random Index"
  },
  {
    "code": "1HZ10V",
    "group": "Sintéticos",
    "subcategory": "Random Index"
  },
  {
    "code": "1HZ15V",
    "group": "Sintéticos",
    "subcategory": "Random Index"
  },
  {
    "code": "1HZ25V",
    "group": "Sintéticos",
    "subcategory": "Random Index"
  },
  {
    "code": "1HZ30V",
    "group": "Sintéticos",
    "subcategory": "Random Index"
  },
  {
    "code": "1HZ50V",
    "group": "Sintéticos",
    "subcategory": "Random Index"
  },
  {
    "code": "1HZ75V",
    "group": "Sintéticos",
    "subcategory": "Random Index"
  },
  {
    "code": "1HZ90V",
    "group": "Sintéticos",
    "subcategory": "Random Index"
  },
  {
    "code": "R_10",
    "group": "Sintéticos",
    "subcategory": "Random Index"
  },
  {
    "code": "R_100",
    "group": "Sintéticos",
    "subcategory": "Random Index"
  },
  {
    "code": "R_25",
    "group": "Sintéticos",
    "subcategory": "Random Index"
  },
  {
    "code": "R_50",
    "group": "Sintéticos",
    "subcategory": "Random Index"
  },
  {
    "code": "R_75",
    "group": "Sintéticos",
    "subcategory": "Random Index"
  },
  {
    "code": "RB100",
    "group": "Sintéticos",
    "subcategory": "Range Index"
  },
  {
    "code": "RB200",
    "group": "Sintéticos",
    "subcategory": "Range Index"
  },
  {
    "code": "stpRNG",
    "group": "Sintéticos",
    "subcategory": "Step Index"
  },
  {
    "code": "stpRNG2",
    "group": "Sintéticos",
    "subcategory": "Step Index"
  },
  {
    "code": "stpRNG3",
    "group": "Sintéticos",
    "subcategory": "Step Index"
  },
  {
    "code": "stpRNG4",
    "group": "Sintéticos",
    "subcategory": "Step Index"
  },
  {
    "code": "stpRNG5",
    "group": "Sintéticos",
    "subcategory": "Step Index"
  }
]);
export const snapshot = Object.freeze({label:"Instantánea histórica · 22 nov 2026",records:53,source:"catálogo guardado",externalRequests:0});
