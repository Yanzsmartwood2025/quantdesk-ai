import { BeatNative } from '@/components/beat/BeatNative';

export const metadata = {
  title: 'Beat | Visor React propio',
  description: 'Consulta de instrumentos y datos registrados. Sin operaciones ni gráficos incrustados.',
};

export default function BeatPage() {
  return <BeatNative />;
}
