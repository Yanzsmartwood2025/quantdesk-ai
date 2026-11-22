# Quantum Lab — prototipo aislado de interfaz

Este borrador crea la ruta **/laboratorio** dentro del frontend Next.js.

## Diseño
- Encabezado: identidad de Quantum Lab y estado de demostración.
- Barra superior: colecciones y acceso rápido para cambiar entre ocho series ficticias.
- Selector desplegable: búsqueda de la lista completa de muestras por nombre o código, también en móvil.
- Pantalla central: gráfico grande, cambio de intervalos, valor y variación de la muestra ficticia.
- Panel lateral: ficha del ejemplo y estado de seguridad.
- Franja inferior: tabla con las últimas observaciones ficticias.
- Diseño oscuro adaptable a escritorio y móvil; controles con etiquetas accesibles.

## Alcance técnico y protección
- Datos inventados y generados determinísticamente en memoria: no se leen mercados ni servicios externos.
- No usa Supabase, conectores financieros, API tokens, WebSockets ni proveedores LLM.
- Seleccionar un elemento **no** actualiza registros ni activa procesamiento de fondo.
- No crea ni publica señales, pronósticos ni operaciones.
- Se incorpora en una ruta independiente; **no se modifica el Dashboard actual**.
- No se instala ni despliega automáticamente en Oracle, Coolify o Vercel.

## Validación
Con Node.js instalado, desde `web/`:

```sh
node --test tests/laboratorio-layout.test.cjs
npm run lint
npm run build
```

Las dos últimas verificaciones requieren instalar primero las dependencias revisadas del proyecto. Antes de una prueba visual en servidor, verificar la rama, ejecutar las pruebas y desplegar solamente una vista previa privada.

## Siguiente decisión de producto
La selección, presentación y procesamiento deben tener estados distintos. El catálogo visible nunca debe iniciar tareas externas. No asociar esta demostración con servicios de operaciones financieras.
