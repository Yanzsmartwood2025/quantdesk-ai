# Beat — interfaz compacta (vista previa)

El nombre visible de la aplicación es **Beat**. Se mantiene separado del proyecto operativo y del despliegue Next.js. Es una interfaz de lectura y exploración de nombres, no una plataforma de negociación.

## Módulos

- `index.html`: cabecera Beat, botón lateral con línea animada, bandeja deslizante, pantalla central dominante y selector de períodos.
- `styles.css`: cristal blanco y negro, controles legibles en celular, bandeja animada desde el borde izquierdo; color verde/rojo solamente en leyenda de dirección de vela.
- `catalog.js`: 22 **nombres reconocibles de referencia**, distribuidos entre Forex, Criptomonedas, Materias primas, Índices y Sintéticos. No es un inventario verificado de Deriv y no incluye cotizaciones ni promesas de disponibilidad.
- `engine.js`: estado de **una sola selección**, opciones de períodos y política de recursos. Los espacios futuros de agentes se mantienen aislados y deshabilitados.
- `app.js`: control de la bandeja, buscador local, categorías, selección única, cierre, períodos de referencia; sin conexión externa.
- `tests/demo-smoke.test.cjs`: aserciones de comportamiento seguro y estética minimalista.

## Reglas

1. El encabezado muestra solamente el nombre **Beat**.
2. El menú superior izquierdo abre y cierra la bandeja. La línea interna del icono se desplaza de izquierda a derecha según el estado.
3. Se puede cerrar con el mismo botón, botón ×, toque fuera o tecla Escape.
4. La lista cambia de categoría localmente. La búsqueda funciona por nombre y código; cuando existe texto busca en todas las categorías.
5. Si se elige otro nombre, reemplaza al anterior; no quedan dos vistas abiertas.
6. Los botones `1m, 5m, 15m, 30m, 1H, 4H, 1D` cambian únicamente la temporalidad visual seleccionada. **No se generan velas falsas ni cotizaciones.**
7. Los 22 nombres son referencias comunes, **no un catálogo de disponibilidad actual del proveedor**.
8. En ausencia de cotizaciones se muestra un mensaje claro; no se inventan movimientos en tiempo real.
9. La interfaz no ejecuta `fetch`, WebSocket, polling, solicitudes a modelos de IA ni órdenes.
10. Los agentes remotos no se activan: cada rol tiene su espacio lógico independiente, apagado en esta fase.
11. Los gastos del alojamiento web dependen del proveedor. La aplicación **no** origina solicitudes a mercados, Supabase, voces pagadas ni agentes externos.

Para pruebas de código: `node --test preview/beat/tests/demo-smoke.test.cjs`.

**Pendiente:** comprobar renderizado visual desde un navegador. Esta maqueta no resuelve ni verifica la API de Deriv.
