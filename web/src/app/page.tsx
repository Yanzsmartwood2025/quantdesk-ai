import { Dashboard } from '@/components/dashboard/Dashboard';
import { Footer } from '@/components/Footer';

export default function Home() {
  return (
    <main className="bg-white dark:bg-black min-h-screen transition-colors duration-300 flex flex-col">
      <div className="flex-grow">
        <Dashboard />
      </div>
      <Footer />
    </main>
  );
}
