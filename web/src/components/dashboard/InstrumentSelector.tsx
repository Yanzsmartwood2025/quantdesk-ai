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
  const [search, setSearch] = useState('');
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

  // Filter only the catalogue already stored in the database.
  const needle = search.trim().toLocaleLowerCase('es');
  const isMatch = (inst: string) => !needle ||
    inst.toLocaleLowerCase('es').includes(needle) ||
    getLabel(inst).toLocaleLowerCase('es').includes(needle);
  const visibleGroups = groups.map(group => ({
    ...group,
    items: group.items.filter(isMatch),
  })).filter(group => group.items.length > 0);
  const visibleInstruments = instruments.filter(isMatch);
  const noResults = <p className="px-4 py-4 text-sm text-zinc-400" role="status">No hay instrumentos registrados que coincidan con la búsqueda.</p>;

  const renderDesktopItems = () => {
    if (groups && groups.length > 0) {
      if (!visibleGroups.length) return noResults;
      return visibleGroups.map((group, groupIdx) => (
        <div key={`group-${groupIdx}`}>
          <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-zinc-800/50 sticky top-0">
            {group.label}
          </div>
          {group.items.map((inst) => (
            <button
              key={inst}
              onClick={() => {
                onSelect(inst);
                  setSearch('');
                setIsOpen(false);
              }}
              className="flex min-h-10 items-center justify-between w-full text-left pl-6 pr-4 py-2 text-sm text-gray-700 dark:text-zinc-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {getLabel(inst)}
              {selectedInstrument === inst && <Check className="w-4 h-4 text-zinc-200" />}
            </button>
          ))}
        </div>
      ));
    }

    if (!visibleInstruments.length) return noResults;
    return visibleInstruments.map(inst => (
      <button
        key={inst}
        onClick={() => {
          onSelect(inst);
                  setSearch('');
          setIsOpen(false);
        }}
        className="flex min-h-10 items-center justify-between w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {getLabel(inst)}
        {selectedInstrument === inst && <Check className="w-4 h-4 text-zinc-200" />}
      </button>
    ));
  };

  const renderMobileItems = () => {
    if (groups && groups.length > 0) {
      if (!visibleGroups.length) return noResults;
      return visibleGroups.map((group, groupIdx) => (
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
                  setSearch('');
                  setIsOpen(false);
                }}
                className={cn(
                  "flex min-h-11 items-center justify-between w-full text-left px-4 py-3 text-base rounded-lg transition-colors",
                  selectedInstrument === inst
                    ? "bg-white/10 dark:bg-white/20 text-zinc-200 dark:text-zinc-200 font-medium"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
              >
                {getLabel(inst)}
                {selectedInstrument === inst && <Check className="w-5 h-5 text-zinc-200" />}
              </button>
            ))}
          </div>
        </div>
      ));
    }

    if (!visibleInstruments.length) return noResults;
    return visibleInstruments.map(inst => (
      <button
        key={inst}
        onClick={() => {
          onSelect(inst);
                  setSearch('');
          setIsOpen(false);
        }}
        className={cn(
          "flex min-h-11 items-center justify-between w-full text-left px-4 py-3 text-base rounded-lg transition-colors",
          selectedInstrument === inst
            ? "bg-white/10 dark:bg-white/20 text-zinc-200 dark:text-zinc-200 font-medium"
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
        )}
      >
        {getLabel(inst)}
        {selectedInstrument === inst && <Check className="w-5 h-5 text-zinc-200" />}
      </button>
    ));
  };

  return (
    <div className="relative w-full min-w-0 md:w-auto" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="beat-glass-button flex min-h-11 min-w-0 w-full items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-white/70 md:min-w-[170px]"
      >
        <span className="min-w-0 truncate">{selectedInstrument ? getLabel(selectedInstrument) : 'Seleccionar...'}</span>
        <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform", isOpen ? "rotate-180" : "")} />
      </button>

      {/* Desktop Dropdown */}
      <div className={cn(
        "hidden md:block absolute top-full left-0 mt-1 w-64 bg-[#111111] border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-50 overflow-hidden transition-all origin-top",
        isOpen ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0 pointer-events-none"
      )}>
        <div className="border-b border-white/10 p-3">
          <label htmlFor="beat-search-desktop" className="sr-only">Buscar instrumento</label>
          <input id="beat-search-desktop" type="search" value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar nombre o símbolo..."
            className="w-full rounded-lg border border-white/20 bg-[#111111] px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/60" />
        </div>
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
        "md:hidden fixed bottom-0 left-0 right-0 bg-[#111111] border-t border-gray-200 dark:border-gray-800 rounded-t-xl z-50 transition-transform duration-300 max-h-[85vh] overflow-hidden flex flex-col",
        isOpen ? "translate-y-0" : "translate-y-full"
      )}>
        <div className="flex justify-center p-2 border-b border-gray-100 dark:border-gray-800">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="p-4 flex-1 overflow-y-auto pb-8">
          <h3 className="mb-3 px-2 text-sm font-medium text-zinc-300">Seleccionar instrumento</h3>
          <label htmlFor="beat-search-mobile" className="sr-only">Buscar instrumento</label>
          <input id="beat-search-mobile" type="search" value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar nombre o símbolo..."
            className="mb-3 w-full rounded-lg border border-white/20 bg-[#111111] px-3 py-3 text-base text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/60" />
          <div className={cn("space-y-1", groups && groups.length > 0 ? "mt-4" : "")}>
            {renderMobileItems()}
          </div>
        </div>
      </div>
    </div>
  );
}
