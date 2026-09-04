import React from 'react';
import { Filter, ChevronRight, X, ListFilter } from 'lucide-react';
import { ClassificationKey, FilterState, BudgetRow } from '../types';

interface ClassificationBoxesProps {
  filteredRows: BudgetRow[];
  totalRowsCount: number;
  filters: FilterState;
  onBoxClick: (key: ClassificationKey) => void;
  onClearFilter: (key: ClassificationKey) => void;
}

interface BoxConfig {
  key: ClassificationKey;
  label: string;
  order: number;
  shortLabel: string;
}

const CLASSIFICATION_BOXES: BoxConfig[] = [
  { key: 'fuenteFinanciamiento', label: 'FUENTE FINANCIAMIENTO', order: 1, shortLabel: 'Fuente' },
  { key: 'inciso', label: 'INCISO', order: 2, shortLabel: 'Inciso' },
  { key: 'partidaPrincipal', label: 'PARTIDA PRINCIPAL', order: 3, shortLabel: 'P. Ppal' },
  { key: 'partidaParcial', label: 'PARTIDA PARCIAL', order: 4, shortLabel: 'P. Parcial' },
  { key: 'partidaSubparcial', label: 'PARTIDA SUBPARCIAL', order: 5, shortLabel: 'P. Subparcial' },
  { key: 'descripcion', label: 'DESCRIPCIÓN', order: 6, shortLabel: 'Descripción' },
];

export const ClassificationBoxes: React.FC<ClassificationBoxesProps> = ({
  filteredRows,
  totalRowsCount,
  filters,
  onBoxClick,
  onClearFilter,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#94A3B8]">
          Clasificación Presupuestaria
        </h3>
        <span className="text-[11px] font-semibold text-[#64748B]">
          Selección acumulativa en cascada · Haga clic para explorar y filtrar
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {CLASSIFICATION_BOXES.map((box) => {
          const activeValue = filters[box.key];
          const hasActiveFilter = Boolean(activeValue);

          // Calculate distinct values present in currently filtered rows
          const distinctValues = Array.from(
            new Set(filteredRows.map(r => r[box.key]).filter(v => v !== ''))
          );
          const distinctCount = distinctValues.length;

          return (
            <div
              key={box.key}
              id={`box-${box.key}`}
              onClick={() => onBoxClick(box.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onBoxClick(box.key);
                }
              }}
              className={`group relative text-left rounded-lg p-3.5 border transition-all cursor-pointer select-none shadow-xs ${
                hasActiveFilter
                  ? 'bg-[#1E293B] text-white border-[#1E293B] ring-4 ring-[#E2E8F0]'
                  : 'bg-white border-[#E2E8F0] hover:border-[#1E293B] hover:shadow-sm'
              }`}
            >
              {/* Order indicator & action */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <span
                  className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded ${
                    hasActiveFilter
                      ? 'bg-black/40 text-white'
                      : 'bg-[#F1F5F9] text-[#64748B]'
                  }`}
                >
                  0{box.order}
                </span>

                {hasActiveFilter ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearFilter(box.key);
                    }}
                    className="p-1 -mr-1 -mt-1 text-slate-300 hover:text-white hover:bg-white/20 rounded-full transition-colors"
                    title={`Quitar filtro de ${box.label}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <Filter className="w-3 h-3 text-[#94A3B8] group-hover:text-[#1E293B] transition-colors" />
                )}
              </div>

              {/* Exact Denomination */}
              <p
                className={`text-[9px] font-bold uppercase tracking-wider mb-1 line-clamp-1 ${
                  hasActiveFilter ? 'text-[#94A3B8]' : 'text-[#64748B]'
                }`}
              >
                {box.label}
              </p>

              {/* Status / Value */}
              <div className="mt-1">
                {hasActiveFilter ? (
                  <div>
                    <p
                      className="text-sm font-black text-white truncate"
                      title={activeValue}
                    >
                      {activeValue}
                    </p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mt-0.5">
                      Filtro Activo
                    </span>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-black text-[#0F172A] truncate">
                      {distinctCount === 0 ? 'SIN DATOS' : `TODOS (${distinctCount})`}
                    </p>
                    <span className="text-[10px] text-[#94A3B8] group-hover:text-[#1E293B] font-bold inline-flex items-center gap-0.5 mt-0.5 transition-colors">
                      Explorar datos
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
