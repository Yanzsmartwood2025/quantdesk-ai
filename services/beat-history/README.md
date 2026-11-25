# Beat — historical dataset service

Independent, read-only educational archive. This container serves curated, fixed historical daily JSON snapshots only. It does not start the original trading engine, fetch broker data, store credentials, provide signals, accept orders, or connect to Supabase.

The catalogue is intentionally empty until source-verified historical datasets are supplied. Series use the same schema as `web/src/components/beat/beatHistorical.ts` (code, source, date/value points). Do not include current or intraday values. The container exposes only /healthz, /beat-data/catalog.json and bounded series paths; it has no write API or directory listing.

The Docker build context is this directory. Internal port: 8080. Keep the service private; it requires no public domain, secrets or external volumes. The Vercel UI presently reads same-origin snapshots only; no connection to this container has been activated. A reviewed snapshot release can supply the same immutable files to both services without requesting a database.

Status: candidate only. No deployment or integration has been authorized for the legacy engine. Image build, health check and route tests remain to be verified in an available build environment.
