import { BeatNative } from '@/components/beat/BeatNative';
import { historicalCatalog } from '@/components/beat/historicalCatalog';

export const metadata = {
  title: 'Beat | Visor React propio',
  description: 'Consulta de instrumentos y datos registrados. Sin operaciones ni gráficos incrustados.',
};

export default function BeatPage() {
  return <BeatNative records={historicalCatalog} />;
}
