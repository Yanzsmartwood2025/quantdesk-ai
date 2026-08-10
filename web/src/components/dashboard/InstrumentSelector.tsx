'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface InstrumentGroup {
  label: string;
  items: string[];
}

interface InstrumentSelectorProps {
  instruments?: string[];
  groups?: InstrumentGroup[];
  selectedInstrument: string;
  onSelect: (instrument: string) => void;
  getLabel?: (instrument: string) => string;
}

export function InstrumentSelector({
  instruments = [],
  groups = [],
  selectedInstrument,
  onSelect,
  getLabel = (inst) => inst.replace('_', '/')
}: InstrumentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const renderDesktopItems = () => {
    if (groups && groups.length > 0) {
      return groups.map((group, groupIdx) => (
        <div key={`group-${groupIdx}`}>
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 sticky top-0">
            {group.label}
          </div>
          {group.items.map((inst) => (
            <button
              key={inst}
              onClick={() => {
                onSelect(inst);
                setIsOpen(false);
              }}
              className="flex items-center justify-between w-full text-left pl-6 pr-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {getLabel(inst)}
              {selectedInstrument === inst && <Check className="w-4 h-4 text-blue-500" />}
            </button>
          ))}
        </div>
      ));
    }

    return instruments.map(inst => (
      <button
        key={inst}
        onClick={() => {
          onSelect(inst);
          setIsOpen(false);
        }}
        className="flex items-center justify-between w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {getLabel(inst)}
        {selectedInstrument === inst && <Check className="w-4 h-4 text-blue-500" />}
      </button>
    ));
  };

  const renderMobileItems = () => {
    if (groups && groups.length > 0) {
      return groups.map((group, groupIdx) => (
        <div key={`mobile-group-${groupIdx}`} className="mb-4 last:mb-0">
          <h4 className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            {group.label}
          </h4>
          <div className="space-y-1 pl-2 border-l-2 border-gray-100 dark:border-gray-800 ml-2">
            {group.items.map((inst) => (
              <button
                key={inst}
                onClick={() => {
                  onSelect(inst);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between w-full text-left px-4 py-3 text-base rounded-lg transition-colors",
                  selectedInstrument === inst
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
              >
                {getLabel(inst)}
                {selectedInstrument === inst && <Check className="w-5 h-5 text-blue-500" />}
              </button>
            ))}
          </div>
        </div>
      ));
    }

    return instruments.map(inst => (
      <button
        key={inst}
        onClick={() => {
          onSelect(inst);
          setIsOpen(false);
        }}
        className={cn(
          "flex items-center justify-between w-full text-left px-4 py-3 text-base rounded-lg transition-colors",
          selectedInstrument === inst
            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        )}
      >
        {getLabel(inst)}
        {selectedInstrument === inst && <Check className="w-5 h-5 text-blue-500" />}
      </button>
    ));
  };

  return (
    <div className="relative w-full md:w-auto" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full md:w-auto gap-2 bg-white dark:bg-[#131722] border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
      >
        <span className="truncate">{getLabel(selectedInstrument)}</span>
        <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", isOpen ? "rotate-180" : "")} />
      </button>

      {/* Desktop Dropdown */}
      <div className={cn(
        "hidden md:block absolute top-full left-0 mt-1 w-56 bg-white dark:bg-[#1a1f2e] border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 overflow-hidden transition-all origin-top",
        isOpen ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0 pointer-events-none"
      )}>
        <div className="max-h-80 overflow-y-auto custom-scrollbar">
          {renderDesktopItems()}
        </div>
      </div>

      {/* Mobile Bottom Sheet Overlay */}
      <div className={cn(
        "md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )} onClick={() => setIsOpen(false)} />

      {/* Mobile Bottom Sheet Content */}
      <div className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1a1f2e] border-t border-gray-200 dark:border-gray-800 rounded-t-xl z-50 transition-transform duration-300 max-h-[85vh] overflow-hidden flex flex-col",
        isOpen ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="flex justify-center p-2 border-b border-gray-100 dark:border-gray-800">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="p-4 flex-1 overflow-y-auto pb-8">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 px-2">Seleccionar Instrumento</h3>
          <div className={cn("space-y-1", groups && groups.length > 0 ? "mt-4" : "")}>
            {renderMobileItems()}
          </div>
        </div>
      </div>
    </div>
  );
}
