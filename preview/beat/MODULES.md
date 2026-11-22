# Beat Studio — interfaz educativa modular

**Este prototipo es completamente ficticio.** No se conecta con Deriv, Supabase, TradingView, plataformas de inversión ni API externas. No contiene nombres de símbolos reales, precios actuales, señales ni operaciones.

## Módulos independientes

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Estructura accesible de la aplicación, bandeja modal, área central, paneles y controles |
| `styles.css` | Diseño espacial blanco/negro; verde y rojo únicamente para velas ficticias |
| `catalog.js` | 30 muestras **inventadas**: seis por categoría (Forex, Sintéticos, Cripto, Índices, Commodities) |
| `engine.js` | Estado único seleccionado, presupuesto fijo, velas matemáticas y movimiento ficticio |
| `app.js` | Navegación, bandeja y búsqueda, periodos, animación voluntaria, voz local, limpieza de recursos |

## Reglas verificables
1. **Una sola vista:** elegir otra muestra reemplaza la anterior. Cambiar de grupo la cierra.
2. **La bandeja se abre al pulsar un grupo** o el botón "Explorar bandeja"; el buscador también la abre. Se cierra con × o Escape.
3. **Temporales de ejemplo:** `1m`, `5m`, `15m`, `30m`, `1H`, `4H` y `1D`. Es una explicación didáctica de la agrupación temporal, no una cotización.
4. **Animación:** solo al pulsar "Animar vela"; una sola tarea local cada 1250 ms; se detiene al cerrar, cambiar de muestra, cambiar de periodo, ocultar la pestaña o salir.
5. Cada cinco cuadros acelerados avanza a una vela nueva, independientemente del intervalo elegido. **El tiempo de la animación NO coincide con minutos u horas reales.**
6. **Color:** velas ficticias ascendentes `#22c55e`, descendentes `#ef4444`; resto en escala de grises.
7. **Sin consultas:** ninguna llamada HTTP a proveedores ni base de datos, sin WebSocket, cron, órdenes o servicios de IA. La descarga de los archivos estáticos sí utiliza el hosting Vercel.
8. **Agentes separados:** Observador, Verificador y Presentador tienen explicaciones predefinidas, no modelos remotos. La voz de `speechSynthesis` se inicia únicamente tras interacción.
9. **Iconos:** marcadores neutros por categoría, no logotipos oficiales ni símbolos de cotización. No se inventa que una API suministra logos.
10. **Presupuesto:** máximo una selección visual; 0 consultas externas a API; 0 ejecuciones de IA; 0 suscripciones. El costo de hosting se rige por el plan de Vercel.
11. **No se modifica el repositorio original en producción** ni las tablas de la cuenta Supabase.

## Pruebas
Comprobar los cambios con `node --test preview/beat/tests/demo-smoke.test.cjs` desde la raíz del repositorio. El sitio desplegado debe mostrar cinco categorías y una bandeja funcional. No requiere credenciales.

## Limitaciones
Esta maqueta **no obtiene** un inventario vigente de ninguna plataforma y no sincroniza periodos con un mercado. Todo movimiento de velas es una simulación educativa.
