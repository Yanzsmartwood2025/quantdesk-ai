'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

export function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <footer className="mt-8 border-t border-gray-200 dark:border-gray-800 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
      <p className="max-w-4xl mx-auto px-4 leading-relaxed">
        QuantDesk AI opera en modo demo/práctica con fines educativos y de
        investigación. No constituye asesoría financiera ni recomendación de
        inversión. Gráficos con tecnología de{' '}
        <a
          href="https://www.tradingview.com/lightweight-charts/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          TradingView Lightweight Charts™
        </a>.
      </p>
      <div className="mt-2">
        <button
          onClick={() => setIsModalOpen(true)}
          className="hover:text-gray-900 dark:hover:text-gray-200 hover:underline transition-colors"
        >
          Términos y Condiciones
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="relative w-full max-w-md bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Términos y Condiciones</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-md text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p>
                Al utilizar QuantDesk AI, usted comprende y acepta los siguientes términos:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Operación Simulada:</strong> El sistema opera exclusivamente en una cuenta demo provista por Deriv. Todos los fondos son simulados y no hay dinero real involucrado.
                </li>
                <li>
                  <strong>Sin Asesoría Financiera:</strong> Las decisiones, análisis y señales generadas por los agentes de Inteligencia Artificial son de carácter puramente experimental y no constituyen asesoría financiera, recomendación de compra o venta, ni sugerencia de inversión.
                </li>
                <li>
                  <strong>Proveedores de Datos:</strong> Los datos de mercado son suministrados por Deriv en tiempo real o diferido. La visualización gráfica es impulsada por TradingView Lightweight Charts.
                </li>
                <li>
                  <strong>Propósito Educativo:</strong> Este proyecto ha sido desarrollado estrictamente con fines de investigación, aprendizaje y demostración técnica sobre la aplicación de IA en entornos financieros simulados.
                </li>
              </ul>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#131722] text-right">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
