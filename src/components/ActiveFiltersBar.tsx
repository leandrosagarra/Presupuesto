import React from 'react';
import { X, FilterX, SlidersHorizontal, Search } from 'lucide-react';
import { FilterState, ClassificationKey } from '../types';

interface ActiveFiltersBarProps {
  filters: FilterState;
  onRemoveFilter: (key: ClassificationKey) => void;
  onClearSearch: () => void;
  onClearAll: () => void;
}

const FILTER_LABELS: Record<ClassificationKey, string> = {
  fuenteFinanciamiento: 'FUENTE FINANCIAMIENTO',
  inciso: 'INCISO',
  partidaPrincipal: 'PARTIDA PRINCIPAL',
  partidaParcial: 'PARTIDA PARCIAL',
  partidaSubparcial: 'PARTIDA SUBPARCIAL',
  descripcion: 'DESCRIPCIÓN',
};

export const ActiveFiltersBar: React.FC<ActiveFiltersBarProps> = ({
  filters,
  onRemoveFilter,
  onClearSearch,
  onClearAll,
}) => {
  const activeClassificationEntries = (
    Object.keys(FILTER_LABELS) as ClassificationKey[]
  ).filter((key) => Boolean(filters[key]));

  const hasSearch = Boolean(filters.searchTerm);
  const totalActiveCount = activeClassificationEntries.length + (hasSearch ? 1 : 0);

  if (totalActiveCount === 0) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1E293B]">
            Filtros Activos:
          </span>
          <span className="text-[#94A3B8] italic font-medium">
            Sin filtros aplicados (mostrando todos los registros del archivo)
          </span>
        </div>
        <span className="text-[11px] text-[#94A3B8] font-medium hidden sm:inline">
          Haga clic en cualquiera de los recuadros superiores para filtrar
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 mr-1">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#1E293B]" />
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#1E293B]">
            Filtros Activos ({totalActiveCount}):
          </span>
        </div>

        {/* Search pill if active */}
        {hasSearch && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#F1F5F9] text-[#0F172A] border border-[#CBD5E1] text-xs font-bold shadow-2xs">
            <Search className="w-3 h-3 text-[#64748B]" />
            <span className="text-[#64748B] text-[10px] uppercase tracking-wider">Búsqueda:</span>
            <strong className="truncate max-w-[140px]">"{filters.searchTerm}"</strong>
            <button
              type="button"
              onClick={onClearSearch}
              className="p-0.5 ml-0.5 text-slate-400 hover:text-[#0F172A] rounded-full hover:bg-slate-200 transition-colors"
              title="Quitar término de búsqueda"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        )}

        {/* Classification pills */}
        {activeClassificationEntries.map((key) => {
          const value = filters[key];
          const label = FILTER_LABELS[key];

          return (
            <span
              key={key}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#1E293B] text-white text-xs font-bold shadow-2xs"
            >
              <span className="text-[#94A3B8] text-[9px] uppercase tracking-wider">
                {label}:
              </span>
              <strong className="truncate max-w-[180px]">{value}</strong>
              <button
                type="button"
                onClick={() => onRemoveFilter(key)}
                className="p-0.5 ml-0.5 text-slate-300 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                title={`Eliminar filtro ${label}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          );
        })}
      </div>

      {/* Clear all action matching design theme */}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs font-bold uppercase tracking-wider text-[#DC2626] border border-[#FECACA] px-4 py-1.5 rounded hover:bg-[#FEF2F2] transition-colors"
      >
        Limpiar Todos
      </button>
    </div>
  );
};
