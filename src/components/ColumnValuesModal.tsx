import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Filter,
  BarChart3,
  Check,
  DollarSign,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import {
  ClassificationKey,
  MonetaryKey,
  BudgetRow,
  FilterState,
} from '../types';
import { formatCurrency, formatNumber, formatPercentage } from '../utils/formatters';

interface ColumnValuesModalProps {
  isOpen: boolean;
  onClose: () => void;
  classificationKey: ClassificationKey | null;
  monetaryKey: MonetaryKey | null;
  filteredRows: BudgetRow[];
  currentFilters: FilterState;
  onSelectClassificationValue: (key: ClassificationKey, value: string) => void;
  onClearClassificationFilter: (key: ClassificationKey) => void;
}

const CLASSIFICATION_TITLES: Record<ClassificationKey, string> = {
  fuenteFinanciamiento: 'FUENTE FINANCIAMIENTO',
  inciso: 'INCISO',
  partidaPrincipal: 'PARTIDA PRINCIPAL',
  partidaParcial: 'PARTIDA PARCIAL',
  partidaSubparcial: 'PARTIDA SUBPARCIAL',
  descripcion: 'DESCRIPCIÓN',
};

const MONETARY_TITLES: Record<MonetaryKey, string> = {
  sancion: 'SANCIÓN',
  vigente: 'VIGENTE',
  restringido: 'RESTRINGIDO',
  preventivo: 'PREVENTIVO',
  definitivo: 'DEFINITIVO',
  devengado: 'DEVENGADO',
};

export const ColumnValuesModal: React.FC<ColumnValuesModalProps> = ({
  isOpen,
  onClose,
  classificationKey,
  monetaryKey,
  filteredRows,
  currentFilters,
  onSelectClassificationValue,
  onClearClassificationFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen || (!classificationKey && !monetaryKey)) return null;

  // Analysis for Classification Key
  const classificationAnalysis = useMemo(() => {
    if (!classificationKey) return null;

    const map = new Map<
      string,
      { count: number; totalVigente: number; totalDevengado: number; sampleDesc: string }
    >();

    filteredRows.forEach((r) => {
      const val = r[classificationKey] || '(Sin valor)';
      const existing = map.get(val) || {
        count: 0,
        totalVigente: 0,
        totalDevengado: 0,
        sampleDesc: r.descripcion,
      };
      existing.count += 1;
      existing.totalVigente += r.vigente || 0;
      existing.totalDevengado += r.devengado || 0;
      map.set(val, existing);
    });

    const list = Array.from(map.entries()).map(([value, stats]) => ({
      value,
      ...stats,
    }));

    // Default sort by value
    return list.sort((a, b) => {
      // If numeric values, sort numerically
      const numA = parseFloat(a.value);
      const numB = parseFloat(b.value);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.value.localeCompare(b.value);
    });
  }, [classificationKey, filteredRows]);

  // Analysis for Monetary Key
  const monetaryAnalysis = useMemo(() => {
    if (!monetaryKey) return null;

    const totalMonetary = filteredRows.reduce(
      (sum, r) => sum + (r[monetaryKey] || 0),
      0
    );

    // Records sorted by amount descending
    const items = filteredRows
      .filter((r) => (r[monetaryKey] || 0) > 0)
      .map((r) => ({
        id: r.id,
        ff: r.fuenteFinanciamiento,
        inciso: r.inciso,
        pp: r.partidaPrincipal,
        parcial: r.partidaParcial,
        subparcial: r.partidaSubparcial,
        descripcion: r.descripcion,
        amount: r[monetaryKey] || 0,
        vigente: r.vigente,
        percentage:
          totalMonetary > 0 ? ((r[monetaryKey] || 0) / totalMonetary) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return {
      totalMonetary,
      items,
      countWithAmount: items.length,
    };
  }, [monetaryKey, filteredRows]);

  // Filtered by internal search
  const filteredClassificationItems = useMemo(() => {
    if (!classificationAnalysis) return [];
    if (!searchTerm.trim()) return classificationAnalysis;
    const term = searchTerm.toLowerCase();
    return classificationAnalysis.filter(
      (item) =>
        item.value.toLowerCase().includes(term) ||
        item.sampleDesc.toLowerCase().includes(term)
    );
  }, [classificationAnalysis, searchTerm]);

  const filteredMonetaryItems = useMemo(() => {
    if (!monetaryAnalysis) return [];
    if (!searchTerm.trim()) return monetaryAnalysis.items;
    const term = searchTerm.toLowerCase();
    return monetaryAnalysis.items.filter(
      (item) =>
        item.descripcion.toLowerCase().includes(term) ||
        item.ff.toLowerCase().includes(term) ||
        item.inciso.toLowerCase().includes(term) ||
        item.pp.toLowerCase().includes(term)
    );
  }, [monetaryAnalysis, searchTerm]);

  const activeValue = classificationKey ? currentFilters[classificationKey] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg border border-[#CBD5E1] shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[#1E293B] text-white shadow-xs">
              {classificationKey ? (
                <Filter className="w-4 h-4 text-emerald-400" />
              ) : (
                <DollarSign className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] block">
                {classificationKey
                  ? 'EXPLORACIÓN DE COLUMNA Y FILTRADO EN CASCADA'
                  : 'DESGLOSE DE IMPORTE PRESUPUESTARIO'}
              </span>
              <h3 className="text-base font-black text-[#0F172A] leading-tight uppercase tracking-tight">
                {classificationKey
                  ? CLASSIFICATION_TITLES[classificationKey]
                  : monetaryKey
                  ? MONETARY_TITLES[monetaryKey]
                  : ''}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-[#0F172A] rounded hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Search & Filter Header */}
        <div className="px-6 py-3 border-b border-[#E2E8F0] bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en valores..."
              className="w-full pl-9 pr-3 py-1.5 text-[11px] bg-white border border-[#E2E8F0] rounded focus:outline-none focus:ring-2 focus:ring-[#1E293B] text-[#0F172A]"
              autoFocus
            />
          </div>

          {classificationKey && activeValue && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#64748B] font-medium">Filtro aplicado:</span>
              <span className="font-bold text-white bg-[#1E293B] px-2.5 py-0.5 rounded text-xs">
                {activeValue}
              </span>
              <button
                type="button"
                onClick={() => {
                  onClearClassificationFilter(classificationKey);
                }}
                className="text-[#DC2626] hover:underline font-bold text-xs ml-1 uppercase tracking-wider"
              >
                Quitar filtro
              </button>
            </div>
          )}

          {monetaryAnalysis && (
            <div className="text-right text-xs">
              <span className="text-[#64748B] font-medium mr-1">Sumatoria total:</span>
              <strong className="font-black text-[#0F172A] font-mono text-sm">
                {formatCurrency(monetaryAnalysis.totalMonetary)}
              </strong>
            </div>
          )}
        </div>

        {/* Modal Content List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 max-h-[500px] scrollbar-thin scrollbar-thumb-slate-300">
          {/* Classification Values Mode */}
          {classificationKey && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-12 px-3 py-1 text-[10px] font-black text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0]">
                <span className="col-span-4">VALOR ({CLASSIFICATION_TITLES[classificationKey]})</span>
                <span className="col-span-2 text-center">REGISTROS</span>
                <span className="col-span-3 text-right">TOTAL VIGENTE</span>
                <span className="col-span-3 text-right">ACCIÓN</span>
              </div>

              {filteredClassificationItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64748B] font-medium">
                  No se encontraron valores que coincidan con la búsqueda.
                </div>
              ) : (
                filteredClassificationItems.map((item) => {
                  const isSelected = activeValue === item.value;
                  return (
                    <div
                      key={item.value}
                      onClick={() => {
                        onSelectClassificationValue(classificationKey, item.value);
                        onClose();
                      }}
                      className={`grid grid-cols-12 items-center px-3.5 py-2.5 rounded-lg border text-xs cursor-pointer transition-all shadow-2xs ${
                        isSelected
                          ? 'border-2 border-[#1E293B] bg-[#F1F5F9]'
                          : 'bg-white border-[#E2E8F0] hover:border-[#1E293B] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="col-span-4 font-bold text-[#0F172A] flex items-center gap-2">
                        {isSelected && (
                          <span className="p-0.5 bg-[#1E293B] text-white rounded-full">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                        <span className="truncate" title={item.value}>
                          {item.value}
                        </span>
                      </div>

                      <div className="col-span-2 text-center tabular-nums text-[#64748B] font-mono font-bold text-[11px]">
                        {formatNumber(item.count)} reg.
                      </div>

                      <div className="col-span-3 text-right tabular-nums font-mono text-[#0F172A] font-black">
                        {formatCurrency(item.totalVigente)}
                      </div>

                      <div className="col-span-3 text-right">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-white bg-[#1E293B] px-2 py-0.5 rounded">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#1E293B] bg-[#F1F5F9] border border-[#E2E8F0] hover:bg-[#1E293B] hover:text-white px-2.5 py-1 rounded transition-colors">
                            Seleccionar
                            <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Monetary Breakdown Mode */}
          {monetaryKey && monetaryAnalysis && (
            <div className="space-y-2">
              <p className="text-xs text-[#64748B] font-medium pb-2 border-b border-[#F1F5F9]">
                Detalle de los registros que componen el importe de <strong className="font-bold text-[#0F172A]">{MONETARY_TITLES[monetaryKey]}</strong> ({formatNumber(monetaryAnalysis.countWithAmount)} partidas con importe mayor a $0):
              </p>

              <div className="space-y-2">
                {filteredMonetaryItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#64748B] font-medium">
                    No hay registros con importe en este campo según los filtros activos.
                  </div>
                ) : (
                  filteredMonetaryItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-white border border-[#E2E8F0] rounded-lg text-xs hover:border-[#1E293B] transition-colors shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[10px] text-[#64748B] font-mono mb-1">
                            <span className="font-bold text-[#1E293B]">#{index + 1}</span>
                            <span>FF: <strong className="text-[#0F172A] font-bold">{item.ff}</strong></span>
                            <span>·</span>
                            <span>Inciso: <strong className="text-[#0F172A] font-bold">{item.inciso}</strong></span>
                            <span>·</span>
                            <span>PP: <strong className="text-[#0F172A] font-bold">{item.pp}</strong></span>
                          </div>
                          <p className="text-xs font-bold text-[#0F172A] leading-snug">
                            {item.descripcion}
                          </p>
                        </div>

                        <div className="text-right whitespace-nowrap">
                          <span className="text-sm font-black text-[#0F172A] font-mono block">
                            {formatCurrency(item.amount)}
                          </span>
                          <span className="text-[10px] font-bold font-mono text-[#059669]">
                            {formatPercentage(item.percentage)} del total
                          </span>
                        </div>
                      </div>

                      {/* Progress bar visual */}
                      <div className="mt-2.5 w-full bg-[#F1F5F9] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#1E293B] h-full rounded-full transition-all"
                          style={{ width: `${Math.min(100, item.percentage)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F1F5F9] flex items-center justify-between text-xs">
          <span className="text-[#64748B] font-medium">
            {classificationKey
              ? `${filteredClassificationItems.length} valores distintos disponibles en esta columna`
              : `${filteredMonetaryItems.length} registros listados`}
          </span>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#1E293B] bg-white border border-[#CBD5E1] rounded hover:bg-[#F8FAFC] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
