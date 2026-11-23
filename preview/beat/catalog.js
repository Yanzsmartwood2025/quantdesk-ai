/**
 * Beat: display labels for familiar asset classes.
 * These are examples of names only, not a Deriv inventory, not proof of
 * provider availability, and not tradable instruments in this application.
 * No API keys, prices, network clients, or subscriptions.
 */
export const groups = Object.freeze([
  {id:"Forex",label:"Forex"},
  {id:"Cripto",label:"Criptomonedas"},
  {id:"Commodities",label:"Materias primas"},
  {id:"Índices",label:"Índices"},
  {id:"Sintéticos",label:"Sintéticos"}
]);
const entries = [
  ["EUR/USD","Euro / Dólar","Forex","€"],
  ["GBP/USD","Libra / Dólar","Forex","£"],
  ["USD/JPY","Dólar / Yen","Forex","¥"],
  ["AUD/USD","Dólar australiano / Dólar","Forex","A"],
  ["USD/CAD","Dólar / Dólar canadiense","Forex","$"],
  ["USD/CHF","Dólar / Franco suizo","Forex","₣"],
  ["NZD/USD","Dólar neozelandés / Dólar","Forex","N"],
  ["BTC","Bitcoin","Cripto","₿"],
  ["ETH","Ethereum","Cripto","Ξ"],
  ["LTC","Litecoin","Cripto","Ł"],
  ["SOL","Solana","Cripto","S"],
  ["XRP","XRP","Cripto","X"],
  ["XAU","Oro","Commodities","Au"],
  ["XAG","Plata","Commodities","Ag"],
  ["WTI","Petróleo WTI","Commodities","O"],
  ["SPX","S&P 500","Índices","5"],
  ["NDX","Nasdaq 100","Índices","N"],
  ["DAX","DAX 40","Índices","D"],
  ["R_75","Volatility 75","Sintéticos","V"],
  ["R_100","Volatility 100","Sintéticos","V"],
  ["BOOM1000","Boom 1000","Sintéticos","B"],
  ["CRASH1000","Crash 1000","Sintéticos","C"]
];
export const labels=Object.freeze(entries.map(([code,name,group,icon])=>Object.freeze({
  code,name,group,icon,status:"Sin datos conectados"
})));
export const catalogNote="Nombres de referencia. No constituye un catálogo verificado de Deriv.";
