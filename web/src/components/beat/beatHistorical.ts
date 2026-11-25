/**
 * Educational historical snapshots only. No broker connections, streaming,
 * trading decisions, credentials, database writes or background polling.
 * A snapshot is a local, same-origin static JSON file.
 */
export type HistoryPoint = { date: string; value: number };
export type HistoricalSeries = { code: string; source: string; points: HistoryPoint[] };
const CODE = /^[A-Z0-9._-]{1,32}$/;
const MAX_POINTS = 366;
const MAX_BYTES = 131072;
const MIN_AGE = 24 * 60 * 60 * 1000;
const cache = new Map<string, HistoricalSeries>();
export function parseHistoricalSeries(raw: unknown, code: string, now = Date.now()): HistoricalSeries {
  if (!CODE.test(code) || !raw || typeof raw !== 'object') throw new Error('Serie inválida');
  const data = raw as Record<string, unknown>;
  if (data.code !== code || typeof data.source !== 'string' || !data.source.trim() ||
      data.source.length > 200 || !Array.isArray(data.points) ||
      data.points.length < 2 || data.points.length > MAX_POINTS) throw new Error('Histórico inválido');
  let previous = 0;
  const points = data.points.map((row: unknown) => {
    if (!row || typeof row !== 'object') throw new Error('Registro inválido');
    const item = row as Record<string, unknown>;
    if (typeof item.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(item.date) ||
        typeof item.value !== 'number' || !Number.isFinite(item.value)) throw new Error('Registro inválido');
    const date = Date.parse(item.date + 'T00:00:00Z');
    if (!Number.isFinite(date) || new Date(date).toISOString().slice(0, 10) !== item.date ||
        date <= previous || date > now - MIN_AGE) throw new Error('Solo registros históricos diarios, ordenados');
    previous = date;
    return {date:item.date,value:item.value};
  });
  return {code, source:data.source, points};
}
export async function loadHistoricalSeries(code: string, signal: AbortSignal): Promise<HistoricalSeries> {
  if (!CODE.test(code)) throw new Error('Instrumento inválido');
  if (signal.aborted) throw new Error('Consulta cancelada');
  const existing=cache.get(code);
  if (existing) return existing;
  const response=await fetch('/beat-data/series/'+encodeURIComponent(code)+'.json',{
    signal, credentials:'omit', redirect:'error', cache:'force-cache'
  });
  if (!response.ok) throw new Error('No hay histórico disponible');
  const reader=response.body?.getReader();
  if(!reader) throw new Error('No hay datos disponibles');
  const decoder=new TextDecoder();
  let bytes=0, body='';
  try {
    while(true){
      const {done,value}=await reader.read();
      if(done) break;
      bytes+=value.byteLength;
      if(bytes>MAX_BYTES){await reader.cancel();throw new Error('Histórico demasiado grande');}
      body+=decoder.decode(value,{stream:true});
    }
    body+=decoder.decode();
  } finally {reader.releaseLock();}
  if(signal.aborted) throw new Error('Consulta cancelada');
  const result=parseHistoricalSeries(JSON.parse(body),code);
  if(cache.size>=8){const oldest=cache.keys().next().value;if(oldest!==undefined)cache.delete(oldest);}
  cache.set(code,result);
  return result;
}
