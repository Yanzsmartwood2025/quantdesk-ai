# Quantum / QuantDesk AI — revisión para Bunker

Fecha: 16 noviembre 2026. Revisión de código en `main` para preparar una **vista privada de demostración**, sin órdenes ni operaciones reales.

## Destino

Servidor Oracle Bunker `quantdesk-coolify-a1` (Ampere ARM64, 2 OCPU, ~12 GB RAM), con Coolify operativo. No crear ni utilizar otra máquina. Preservar las aplicaciones y discos existentes.

## Qué existe actualmente

- `src/`: backend Python con agentes de análisis, lógica de riesgo, Supabase y conexión a proveedor externo de datos/operaciones. `src/config.py` define `trading_enabled: bool = False` por defecto, pero el backend contiene código de ejecución; **no desplegarlo ni conectarlo a cuentas reales en esta fase**.
- `Dockerfile` y `docker-compose.yml`: preparados exclusivamente para el backend Python; **no incorporan el dashboard**.
- `web/`: dashboard Next.js 16 / React 19 con consulta de Supabase. Tiene su propio `package.json`, pero carece de un Dockerfile de producción para Coolify.
- `db/schema.sql` define tablas, Realtime y varias políticas RLS; `db/migration_add_market_column.sql` define `market` para el selector.
- Credenciales de backend y claves privadas NO deben exponerse en Next.js ni en un repositorio público. Solo variables `NEXT_PUBLIC_...` con claves públicas y permisos de lectura, nunca `service_role`.

## Hallazgos que bloquean exposición pública

1. El esquema actual incluye una política de `UPDATE` para `anon` y `authenticated` sobre `active_instruments` con `USING (true) WITH CHECK (true)`. Aunque su comentario dice que limita columnas, **RLS no limita columnas por sí solo**. Revisar y retirar esa capacidad pública antes de cualquier dashboard conectado a una base de datos real.
2. El dashboard realiza lecturas y cambios de estado directamente desde el navegador. Para una demo privada segura, quitar/habilitar solo visualización sin escritura, con datos simulados o un origen leído con permisos mínimos.
3. No hay evidencia verificada de un proyecto Supabase de QuantDesk en la conexión Supabase disponible en esta sesión; NO usar bases de otros proyectos para la prueba.
4. El backend realiza operaciones adicionales además de mostrar análisis, y por ello NO se habilita en el despliegue de vista preliminar.
5. El frontend usa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`; si se compila con una configuración de muestra, no estará mostrando datos reales.

## Trabajo completado

- GitHub `.gitignore` actualizado para evitar futuras inclusiones accidentales de `.env`, claves `.pem`, `.key`, logs, `node_modules` y `.next`. **Esto no elimina automáticamente ficheros previamente versionados ni sustituye la revocación de claves expuestas.**
- Repositorio y composición existentes revisados; no se han cambiado los sistemas existentes ni se ha desplegado Quantum en Coolify.

## Próxima fase segura

1. Preparar dashboard de solo lectura con información ficticia o agregada y sin acceso a cuentas externas.
2. Empaquetarlo para ARM64 con Docker, usando recursos de Bunker con límites de memoria/CPU y acceso privado.
3. Verificar build de Next.js y salud HTTP antes de anunciar que funciona.
4. Revisar las políticas de la base de datos y el acceso a datos antes de habilitar conexiones.
5. Mantener cualquier automatización de operaciones fuera de esta fase de demostración.

Esta preparación es independiente del nginx de prueba, que está funcionando en el mismo Bunker.
