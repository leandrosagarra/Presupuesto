import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, ArrowRight, CornerDownLeft, Layers } from 'lucide-react';
import { HierarchyTree, HierarchyPath, searchHierarchy, SearchMatch } from '../utils/budgetHierarchy';
import { formatCurrencyCompact } from '../utils/formatters';

interface GlobalBudgetSearchProps {
  tree: HierarchyTree;
  onNavigate: (path: HierarchyPath) => void;
}

export const GlobalBudgetSearch: React.FC<GlobalBudgetSearchProps> = ({
  tree,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    return searchHierarchy(tree, query, 30);
  }, [tree, query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (path: HierarchyPath) => {
    onNavigate(path);
    setQuery('');
    setIsOpen(false);
  };

  const getTypeBadge = (type: SearchMatch['type']) => {
    switch (type) {
      case 'fuente':
        return <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-black uppercase">Fuente</span>;
      case 'inciso':
        return <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase">Inciso</span>;
      case 'principal':
        return <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">Partida Ppal</span>;
      case 'parcial':
        return <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-black uppercase">Parcial</span>;
      case 'subparcial':
        return <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-black uppercase">Subparcial</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-black uppercase">Partida</span>;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Big Search Bar */}
      <div className="relative flex items-center">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-[#64748B]" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length > 0) setIsOpen(true);
          }}
          placeholder="Buscar partida, código o descripción... (ej. Personal Permanente, IPS, 11-1-1, Combustibles)"
          className="w-full pl-11 pr-10 py-3 bg-white border-2 border-[#CBD5E1] focus:border-[#0F172A] rounded-xl text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] shadow-xs outline-none transition-all"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#94A3B8] hover:text-[#0F172A]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Instant Search Results Dropdown */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#CBD5E1] rounded-xl shadow-xl z-40 max-h-96 overflow-y-auto divide-y divide-slate-100 animate-in fade-in duration-100">
          <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-[#64748B]">
            <span>Resultados encontrados: {results.length}</span>
            <span className="text-[11px] font-normal text-slate-400">Haga clic para navegar directo a la partida</span>
          </div>

          {results.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              No se encontraron partidas ni códigos con el término &ldquo;<strong className="text-slate-700">{query}</strong>&rdquo;.
            </div>
          ) : (
            results.map((match) => (
              <button
                key={match.id}
                type="button"
                onClick={() => handleSelectResult(match.path)}
                className="w-full px-4 py-2.5 text-left hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    {getTypeBadge(match.type)}
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {match.fullCode}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {match.descripcion}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">
                    {match.breadcrumbsText}
                  </p>
                </div>

                <div className="text-right shrink-0 flex items-center gap-3">
                  <div>
                    <div className="text-xs font-mono font-bold text-slate-900">
                      {formatCurrencyCompact(match.vigente)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Vigente
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-800 transition-colors" />
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
