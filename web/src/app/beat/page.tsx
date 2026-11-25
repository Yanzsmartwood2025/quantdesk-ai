import { BeatNative } from '@/components/beat/BeatNative';
import { historicalCatalog } from '@/components/beat/historicalCatalog';

import { BeatPwa } from '@/components/beat/BeatPwa';
import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = { themeColor: '#07080a' };
export const metadata: Metadata = {
  title: 'Beat | Visor React propio',
  manifest: '/beat.webmanifest',
  appleWebApp: { capable: true, title: 'Beat', statusBarStyle: 'black-translucent' },
  icons: { icon: [{url:'/beat/pwa-icon/192',sizes:'192x192',type:'image/png'},{url:'/beat/pwa-icon/512',sizes:'512x512',type:'image/png'}], apple: '/beat/pwa-icon/192' },
  description: 'Consulta de instrumentos y datos registrados. Sin operaciones ni gráficos incrustados.',
};

export default function BeatPage() {
  return <><BeatNative records={historicalCatalog} /><BeatPwa /></>;
}
