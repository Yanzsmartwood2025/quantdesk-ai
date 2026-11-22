/* FICTITIOUS educational samples.
 * The preview never exposes real provider symbols, active instruments,
 * credentials, market quotes or trading links. All names are invented.
 */
export const categories = Object.freeze(["Forex","Sintéticos","Cripto","Índices","Commodities"]);
const groups={
  Forex:["Variación A","Variación B","Cruce ficticio","Ciclos suaves","Serie gradual","Rango neutro"],
  Sintéticos:["Ciclo alfa","Ciclo beta","Ruido artificial","Serie combinada","Índice imaginario","Variación lenta"],
  Cripto:["Escenario digital","Escenario virtual","Serie criptográfica","Oscilación inventada","Curva simulada","Prueba ficticia"],
  Índices:["Colección abstracta","Índice de laboratorio","Cesta ficticia","Escala numérica","Rango sintético","Prueba histórica inventada"],
  Commodities:["Elemento natural ficticio","Muestra de aula","Cesta simulada","Escenario imaginario","Serie experimental","Referencia neutra"]
};
const prefixes={Forex:"FX",Sintéticos:"SY",Cripto:"CR",Índices:"IX",Commodities:"CM"};
export const inventory=Object.freeze(categories.flatMap(group=>
  groups[group].map((subcategory,i)=>Object.freeze({
    code:`LAB-${prefixes[group]}-${String(i+1).padStart(2,"0")}`,
    group,subcategory
  }))
));
export const snapshot=Object.freeze({
  label:"Muestras ficticias para aprendizaje",
  records:inventory.length,
  source:"Datos generados localmente",
  externalRequests:0
});
