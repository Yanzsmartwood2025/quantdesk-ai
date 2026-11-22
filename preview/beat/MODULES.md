# Beat Studio — módulos de demostración

Este directorio es una **vista previa pública de lectura**, separada del frontend Next.js y del backend Python. No es una plataforma de negociación.

## Componentes
- `index.html`: interfaz y regiones accesibles.
- `styles.css`: diseño monocromático espacial, velas ficticias verdes/rojas, navegación móvil.
- `catalog.js`: instantánea de **53 identificadores que ya existían** en la base `quantdesk-ai` al 22-11-2026. Los campos son nombre, mercado y subcategoría. No incluye precios, credenciales ni datos personales. Cripto, índices y materias primas siguen vacíos; esto refleja lo guardado, no el catálogo completo de ningún proveedor.
- `engine.js`: estado de la vista, presupuesto de consumo fijo y datos matemáticos ficticios. No llama a Internet.
- `app.js`: controlador UI, selector de un único elemento, gráfico local, tres roles explicativos y voz del navegador a petición.

## Reglas invariables de arquitectura
1. **Catálogo != procesamiento.** Tener 53 identificadores no implica suscribirse a 53 flujos.
2. **Sólo una selección visible.** Al cambiar de categoría o instrumento se cierra el anterior; no existe una cola de trabajo ni llamadas a API.
3. **Fallos seguros.** No se crean instrumentos de relleno ni datos reales falsos.
4. **Nunca guardar secretos en el navegador.** Sin `service_role`, tokens ni variables de entorno privadas.
5. **Agentes separados.** `Observador` enumera hechos; `Verificador` cuestiona limitaciones; `Presentador` sintetiza. Son mensajes predefinidos, **no modelos LLM**.
6. **Voz manual.** `speechSynthesis` solo se invoca tras pulsar. Es una capacidad proporcionada por el navegador, no Deepgram ni una llamada pagada de la aplicación.
7. **Límites:** 1 selección, 0 suscripciones, 0 cron, 0 solicitudes a Supabase/Deriv/IA, $0 de gasto causado por peticiones externas de la aplicación. El hosting puede tener cuotas propias del proveedor.
8. **Toda gráfica es explícitamente ficticia.** No es una cotización ni señal.
9. **Sin actividad financiera.** No incorpora operaciones, recomendaciones de compra/venta, estadísticas de rentabilidad ni conexiones a brokers.
10. **No recargar mientras se esté viendo.** No polling, no temporizadores, no procesos permanentes.

## Pruebas estáticas
Revisar `index.html`, `app.js`, `engine.js`, `catalog.js`, `styles.css` para garantizar que la interfaz no contiene conexiones externas. En cualquier futura ampliación, mantener cada adaptador en un módulo con autorización separada y pruebas de consumo. En esta demostración dichos adaptadores no existen.
