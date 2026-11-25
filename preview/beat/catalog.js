/**
 * Curated identifiers for a READ-ONLY research workspace.
 * These are reference symbols, NOT a verified inventory of any broker.
 * TradingView may show delayed or unavailable data depending on exchange/market.
 * Synthetic indices have no asserted TradingView equivalents.
 */
export const groups=Object.freeze([
 {id:"Acciones",label:"Acciones",icon:"▦"},
 {id:"Forex",label:"Forex",icon:"⇄"},
 {id:"Cripto",label:"Criptomonedas",icon:"₿"},
 {id:"Commodities",label:"Materias primas",icon:"◈"},
 {id:"Índices",label:"Índices",icon:"▥"},
 {id:"Sintéticos",label:"Sintéticos",icon:"∿"}
]);
const examples=[
 ["MSFT","Microsoft Corporation","Acciones","NASDAQ:MSFT","M","NASDAQ"],
 ["AAPL","Apple Inc.","Acciones","NASDAQ:AAPL","A","NASDAQ"],
 ["NVDA","NVIDIA Corporation","Acciones","NASDAQ:NVDA","N","NASDAQ"],
 ["EUR/USD","Euro / Dólar","Forex","FX:EURUSD","€","Referencia TV"],
 ["GBP/USD","Libra / Dólar","Forex","FX:GBPUSD","£","Referencia TV"],
 ["USD/JPY","Dólar / Yen","Forex","FX:USDJPY","¥","Referencia TV"],
 ["USD/CHF","Dólar / Franco suizo","Forex","FX:USDCHF","₣","Referencia TV"],
 ["AUD/USD","Dólar australiano / Dólar","Forex","FX:AUDUSD","A","Referencia TV"],
 ["USD/CAD","Dólar / Dólar canadiense","Forex","FX:USDCAD","$","Referencia TV"],
 ["NZD/USD","Dólar neozelandés / Dólar","Forex","FX:NZDUSD","N","Referencia TV"],
 ["BTC/USD","Bitcoin","Cripto","BITSTAMP:BTCUSD","₿","Bitstamp"],
 ["ETH/USD","Ethereum","Cripto","BITSTAMP:ETHUSD","Ξ","Bitstamp"],
 ["LTC","Litecoin","Cripto",null,"Ł","Sin fuente configurada"],
 ["SOL","Solana","Cripto",null,"S","Sin fuente configurada"],
 ["XRP","XRP","Cripto",null,"X","Sin fuente configurada"],
 ["XAU/USD","Oro / Dólar","Commodities","OANDA:XAUUSD","Au","OANDA"],
 ["XAG/USD","Plata / Dólar","Commodities","OANDA:XAGUSD","Ag","OANDA"],
 ["WTI","Petróleo WTI","Commodities",null,"O","Sin fuente configurada"],
 ["SPX","S&P 500","Índices","SP:SPX","S","Índice de referencia"],
 ["NDX","Nasdaq 100","Índices","NASDAQ:NDX","N","Índice de referencia"],
 ["DAX","DAX 40","Índices",null,"D","Sin fuente configurada"],
 ["R_75","Volatility 75","Sintéticos",null,"75","Sin fuente configurada"],
 ["R_100","Volatility 100","Sintéticos",null,"100","Sin fuente configurada"],
 ["BOOM1000","Boom 1000","Sintéticos",null,"B","Sin fuente configurada"],
 ["CRASH1000","Crash 1000","Sintéticos",null,"C","Sin fuente configurada"]
];
export const labels=Object.freeze(examples.map(([code,name,group,tvSymbol,icon,source])=>
 Object.freeze({code,name,group,tvSymbol,icon,source})));
export const catalogNote="Lista de referencias para explorar. No certifica cobertura ni equivalencia con el catálogo de ningún bróker.";
