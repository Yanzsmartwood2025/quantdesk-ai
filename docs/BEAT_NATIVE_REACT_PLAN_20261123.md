# BEAT — plan de interfaz React propia y visor de datos de solo lectura

Fecha: 23 de noviembre de 2026.
Objetivo: sustituir el visor externo incrustado por una aplicación Beat propia en React/Next.js. El diseño se inspira en el espacio y organización de las capturas aportadas, sin copiar interfaces, marcas ni logotipos ajenos. **Sin operaciones, órdenes, señales financieras automatizadas ni acceso a cuentas de negociación.**

## 0. Auditoría de lo que ya existe (hechos del repositorio)

- `web/`: Next.js 16 + React 19; `web/src/components/dashboard/ChartWidget.tsx` ya usa `lightweight-charts` y dibuja velas OHLC.
- `web/src/components/dashboard/Dashboard.tsx` consulta `active_instruments`, `market_candles` y `agent_traces` en Supabase. Esta consulta NO equivale a inventario completo ni disponibilidad instantánea del proveedor externo.
- `src/`: proceso Python con conectores históricos y lógica de análisis; **la existencia del código no demuestra que Oracle/Coolify esté ejecutándolo actualmente**.
- `Dockerfile` y `docker-compose.yml` levantan el proceso Python, no un servicio web separado con React.
- Proyecto de Vercel conocido para el repositorio configurado como `python`; un despliegue `READY` de ese proyecto no confirma que renderice `web/`.
- `preview/beat/`: prototipo HTML con un gráfico externo. **No es el producto que se debe liberar**; sustituirlo por la aplicación nativa de `web/`.
- Políticas de acceso en `db/schema.sql` requieren revisión antes de exponer datos a un navegador. No publicar claves privadas ni habilitar escritura por usuarios anónimos.

## 1. Arquitectura final y reglas de comportamiento

```
Beat React / Next.js (web) — interfaz propia, solo lectura
  ├─ Bandeja de instrumentos + búsqueda + favoritos locales
  ├─ Gráfico propio (componente React / Lightweight Charts, no widget externo)
  ├─ Barra de herramientas desarrollada en React
  ├─ Ficha de información factual por instrumento
  └─ Cabina IA/locutores + registro verificable de herramientas

Capa de consulta autorizada (solo lectura)
  ├─ GET catálogo visible con metadatos verificables
  ├─ GET velas históricas del instrumento y período seleccionados
  ├─ Canal opcional de actualizaciones de un único instrumento
  ├─ Registro de procedencia, hora y estado de la fuente
  └─ Lectura segura de actividad de agentes cuando exista

Infraestructura
  ├─ Vercel: frontend web, sin claves privadas
  ├─ Oracle/Coolify: posible alojamiento de procesos privados, sujeto a confirmar estado
  └─ Base de datos: persistencia de cotizaciones e historial con políticas correctas
```

La interfaz **nunca muestra cifras ficticias como mercado real**. Si faltan datos, muestra claramente “Sin datos / Fuente no configurada”. Solo una vista y una suscripción de lectura activas; cerrar un activo detiene las actualizaciones de esa vista. No conectar ni habilitar servicios de negociación.

## 2. Inventario completo de controles

**Cabecera y navegación**
- [ ] Logo propio «Beat» (clic: volver al visor); sin nombre técnico del repositorio.
- [ ] Menú lateral (botón con línea deslizante): abrir/cerrar bandeja.
- [ ] Cerrar bandeja (X, Escape y toque fuera).
- [ ] Búsqueda global de instrumentos (texto o código).
- [ ] Categorías: Forex / Criptomonedas / Materias primas / Índices / Sintéticos / Acciones (solo categorías sustentadas en datos).
- [ ] Contador real de instrumentos de cada categoría, sin elementos de muestra.
- [ ] Fila de activo con logo autorizado si existe, símbolo, nombre, mercado, procedencia y estado de disponibilidad.
- [ ] Seleccionar activo con un toque: sustituye al anterior, cancela solicitudes obsoletas y abre una sola vista.
- [ ] Favoritos locales y orden alfabético; no envían peticiones masivas.
- [ ] Aviso visible de estado de fuente (conectado / desactualizado / sin fuente), nunca “en vivo” sin evidencia.

**Gráfico central**
- [ ] Barra de símbolo / nombre / mercado (clic: abrir selector).
- [ ] Intervalos 1m, 5m, 15m, 30m, 1h, 4h, 1D (solo si hay datos de ese intervalo).
- [ ] Tipo de gráfico: velas / línea / área; todos usando la misma serie auténtica.
- [ ] Escala de precio; escala temporal y zona horaria visibles.
- [ ] Volumen si el origen lo proporciona; no inventarlo.
- [ ] Zoom, desplazamiento y restablecer vista.
- [ ] Cursor de cruz (crosshair) con OHLC y hora.
- [ ] Pantalla completa / volver a pantalla normal.
- [ ] Botón actualizar solamente cuando la lectura falle; sin recarga continua innecesaria.
- [ ] Indicador de carga, datos retrasados, error o mercado cerrado, según evidencia del origen.
- [ ] Limpieza de velas y marcas al cambiar de activo o intervalo; sin mezclar símbolos.

**Herramientas gráficas propias (en barra lateral plegable)**
- [ ] Puntero / selección.
- [ ] Línea de tendencia, horizontal y vertical.
- [ ] Rectángulo de zona y canal paralelo.
- [ ] Regla de precio y tiempo.
- [ ] Texto / nota editable.
- [ ] Marcadores manuales no operativos.
- [ ] Deshacer / rehacer.
- [ ] Mostrar / ocultar dibujos.
- [ ] Borrar dibujo seleccionado / borrar todos con confirmación.
- [ ] Guardar dibujos en almacenamiento local por símbolo y período.
- [ ] Indicadores matemáticos explicativos calculados por Beat, con datos suficientes y período indicado; no producir órdenes.

**Ficha informativa del instrumento**
- [ ] Cabecera nombre / código / origen / logo autorizado.
- [ ] Último dato recibido y hora; cambio calculado solo si existe referencia válida.
- [ ] Máximo / mínimo del período seleccionado cuando exista.
- [ ] Intervalos e histórico disponible.
- [ ] Mercado / categoría / unidad y precisión.
- [ ] Resumen verificable y detalles del proveedor.
- [ ] Estadísticas o perfil empresarial cuando proceda, **solo a partir de una fuente autorizada**, nunca inventados.
- [ ] Estados vacíos para campos ausentes. Eliminar cuadros repetitivos y metadatos no respaldados.

**IA y locutores**
- [ ] Panel tipo chat con mensajes reales y marcas de hora, no diálogo fabricado.
- [ ] Cabecera de cada agente (nombre, tarea y estado).
- [ ] “Herramientas utilizadas”: nombre de herramienta, inicio/fin, estado y resumen saneado.
- [ ] Vista expandible del resultado permitido (sin claves, prompts secretos ni datos privados).
- [ ] Filtro por agente y por herramienta.
- [ ] Dos espacios de locutor con estado silencioso / hablando / desconectado.
- [ ] Controles de audio solo cuando exista un sistema de voz autorizado y realmente conectado.
- [ ] Manejo de desconexión: no fingir actividad cuando falle el servicio.

**Móvil y accesibilidad**
- [ ] Barra inferior compacta: Gráfico / Herramientas / Ficha / IA.
- [ ] Mantener el gráfico como contenido principal; cabina plegable en móviles.
- [ ] Objetivos táctiles adecuados; sin botones solapados.
- [ ] Navegación por teclado, textos legibles, alto contraste y movimiento reducido.
- [ ] Preservar una sola selección al cambiar de pestaña.

## 3. Tareas técnicas ordenadas por prioridad

### P0 — imprescindible para una versión de consulta funcional
- [ ] BEAT-01: retirar todos los widgets externos del producto final y unificar ruta React en `web/`.
- [ ] BEAT-02: inventariar los datos disponibles en almacenamiento; distinguir registros históricos, proveedor, permisos y estado actual. No asumir cobertura.
- [ ] BEAT-03: adaptar una API de consulta **de solo lectura** con respuestas tipadas de catálogo y OHLC. Proteger permisos; no exponer secretos.
- [ ] BEAT-04: React: selector real, una sola vista, cancelación de respuestas antiguas y estados de error/vacío.
- [ ] BEAT-05: React: gráfico propio con histórico auténtico y actualización de la serie solo cuando lleguen datos nuevos.
- [ ] BEAT-06: separar el despliegue del frontend y la fuente privada de datos; inspeccionar Oracle/Coolify antes de afirmar que está activo.
- [ ] **BEAT-14 (P0): conexión continua ChatGPT → GitHub (bunker-ops) → Oracle → Coolify, supervisión periódica segura del servidor y del worker autorizado, sin instalar otra app ni fingir que ChatGPT permanece ejecutándose.** [Tarea #67](https://github.com/Yanzsmartwood2025/quantdesk-ai/issues/67).

### P1 — funcionalidad de interfaz
- [ ] BEAT-07: barra de herramientas gráficas, dibujos y guardado local.
- [ ] BEAT-08: ficha factual del activo, metadatos sustentados y logos permitidos.
- [ ] BEAT-09: panel de IA tipo chat con eventos auditables y espacios de locutor.
- [ ] BEAT-10: sistema visual responsive negro/gris con componentes React reutilizables.

### P2 — pruebas y publicación
- [ ] BEAT-11: tests: menús, selección, temporalidades, serie OHLC, reconexión, error y estados vacíos.
- [ ] BEAT-12: verificación en navegador móvil real, pruebas de compilación y enlace final a la aplicación correcta.
- [ ] BEAT-13: documentar qué elementos requieren datos o autorizaciones externas y qué elementos son puro código.

## 4. Criterios para declarar que está terminado

1. El enlace abre **React Beat** y ningún gráfico incrustado de terceros.
2. Todas las categorías muestran únicamente registros disponibles; los contadores coinciden con la fuente.
3. Al pulsar un activo, solo se carga ese instrumento, su información verificable y su serie histórica, si existe.
4. Las velas se actualizan únicamente ante eventos auténticos; no se dibujan datos inventados.
5. El monitor de IA representa solo actividad real recibida y los controles de locutor no se encienden sin conexión.
6. Hay una prueba de `npm run build`, revisiones de seguridad y navegación móvil.
7. El enlace publicado se verifica por HTTP y navegador; `READY` del proyecto equivocado no es suficiente.

## 5. Límites de alcance

Esta hoja de trabajo es para **visualización e investigación de mercado**, no para habilitar cuentas, contratos, órdenes, señales automáticas ni servicios de apuestas. La conectividad de cualquier proveedor externo se evalúa separadamente con cumplimiento, edad y permisos apropiados. No se conectará ni activará un servicio de negociación desde estas tareas.


## 6. Prioridad inmediata: puente de monitoreo de Oracle/Coolify (BEAT-14)

**Petición del usuario:** dejar registrada la conexión de control y supervisión **desde este mismo chat** como trabajo prioritario, sin reabrir las tareas de diseño ni crear nuevas aplicaciones en el teléfono.

**Estado observado (23-11-2026):** el puente `bunker-bridge` respondió a [diagnóstico del servidor #618](https://github.com/Yanzsmartwood2025/bunker-ops/issues/618) y [consulta de inventario Coolify #619](https://github.com/Yanzsmartwood2025/bunker-ops/issues/619). Son consultas **bajo demanda**, no prueban un monitor proactivo ni permisos para crear/configurar aplicaciones. En el inventario no aparece `quantdesk-ai` como recurso de Coolify. No se ha alterado el servidor.

**Siguiente fase (solo monitoreo):** verificar permisos disponibles, identificar si el agente de Oracle necesita una actualización puntual y añadir un temporizador ligero que registre salud del host, Docker/Coolify y del proceso que se autorice, con errores redactados, sin exponer secretos. Publicar resultados/alertas por el canal existente con frecuencia limitada y comprobar su funcionamiento sin mantener abierto ChatGPT. Monitorear una tabla de datos solo cuando los permisos de lectura sean correctos y verificables.

**Manual / instalaciones:** no hace falta instalar otra aplicación Android. Podría requerirse **una intervención puntual** para actualizar el puente del servidor o aprobar permisos mínimos de lectura en Coolify; debe diagnosticarse antes de pedirla. Nunca pedir credenciales en el chat ni reinstalar Coolify, Oracle o tocar otros contenedores. El monitoreo autónomo pertenece al agente del servidor; ChatGPT puede consultar los reportes cuando está disponible, no quedarse observando continuamente por sí solo.

**Seguimiento principal:** [BEAT #67](https://github.com/Yanzsmartwood2025/quantdesk-ai/issues/67) y [Bunker #96](https://github.com/Yanzsmartwood2025/bunker-ops/issues/96). La posibilidad de crear un recurso nuevo está separada en [Bunker #93](https://github.com/Yanzsmartwood2025/bunker-ops/issues/93) y requiere autorización específica.
