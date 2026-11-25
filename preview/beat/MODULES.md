# Beat — visor de investigación, gráfico y cabina de IA

Actualizado: 23 de noviembre de 2026.

## Diseño
- Gráfico central grande con controles de temporalidad.
- Bandeja izquierda de seis categorías: Acciones, Forex, Criptomonedas, Materias primas, Índices y Sintéticos.
- Símbolos reconocibles, búsqueda por código y nombre, selección de una sola vista.
- Ficha del símbolo y perfil de empresa para algunas acciones compatibles.
- Cabina de dos locutores y monitor de actividad de agentes, lateral en escritorio y debajo del gráfico en móviles.
- Navegación inferior móvil: Gráfico, Ficha, Utilidades e IA.

## Proveedor de gráficos
La pantalla integra TradingView Advanced Real-Time Chart Widget (Web Component) desde el proveedor oficial. El componente externo presenta gráficos e indicadores de los símbolos compatibles, con atribución visible. Cambiar de activo actualiza su atributo symbol; cambiar temporalidad actualiza interval. Los datos y su actualización están sujetos a cobertura, retrasos, sesiones de mercado y políticas de TradingView.

La lista del módulo catalog.js contiene identificadores de referencia, no un inventario completo ni autorizado de ningún bróker. No se afirma equivalencia entre proveedores ni se inventan cotizaciones. Los activos sin fuente conocida muestran un estado vacío.

Los emblemas tipográficos de la bandeja no son logotipos oficiales. Para logos reales, un proveedor autorizado o archivos aportados con derechos de uso deben suministrar la imagen; algunos widgets de TradingView pueden presentar logos propios dentro de su interfaz.

## Seguimiento de herramientas e IA
La cabina empieza SIN eventos, voz ni agentes conectados, y no inventa acciones. app.js expone un puente de solo lectura para futuras integraciones autorizadas:

- window.BeatAudit.push({agent, tool, status, summary, at}) presenta un evento sin HTML; el estado puede ser queued, running, completed o error.
- window.BeatAudit.speaker("A", "speaking") o speaker("B", "idle") actualizan el indicador de voz de forma visual.
- Un sistema ya autorizado puede emitir en el documento un evento CustomEvent llamado beat:agent-event con datos de resumen no sensibles.
- Los textos se recortan y se representan mediante textContent. Solo hay 20 eventos visibles. No se envían prompts, tokens, identidades ni claves a servicios desde la cabina.

La conexión real al backend de agentes, sus permisos, registros auditables y módulos TTS/voz es otra fase. No se deben activar ni simular procesos costosos o de negociación mediante esta vista.

## Pruebas
Desde la raíz del repositorio:

    node --test preview/beat/tests/demo-smoke.test.cjs

La prueba comprueba estructura, atribución, referencias, eventos y ausencia de funciones de ejecución financiera. No demuestra que el proveedor remoto siempre tenga datos ni reemplaza una revisión visual móvil.

## Límites de la entrega
- La rama modifica preview/beat, independiente del frontend Next.js en web/.
- Se requiere validar cada símbolo externo y la carga en navegadores Android.
- La conexión de datos internos y la actividad efectiva de voces/agentes no están implementadas.
- No se habilitan órdenes, cuentas de negociación ni recomendaciones automáticas.
