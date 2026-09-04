import React from 'react';
import { DollarSign, ChevronRight, BarChart3 } from 'lucide-react';
import { MonetaryKey, BudgetRow } from '../types';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface FinancialBoxesProps {
  filteredRows: BudgetRow[];
  totalRows: BudgetRow[];
  onBoxClick: (key: MonetaryKey) => void;
  selectedMonetaryBox: MonetaryKey | null;
}

interface MonetaryBoxConfig {
  key: MonetaryKey;
  label: string;
  order: number;
  description: string;
  borderColor: string;
  isDevengado?: boolean;
}

const MONETARY_BOXES: MonetaryBoxConfig[] = [
  {
    key: 'sancion',
    label: 'SANCIÓN',
    order: 7,
    description: 'Crédito legalmente aprobado',
    borderColor: 'border-l-[#1E293B]',
  },
  {
    key: 'vigente',
    label: 'VIGENTE',
    order: 8,
    description: 'Crédito actual con modificaciones',
    borderColor: 'border-l-[#0369A1]',
  },
  {
    key: 'restringido',
    label: 'RESTRINGIDO',
    order: 9,
    description: 'Crédito con reserva o bloqueo',
    borderColor: 'border-l-[#94A3B8]',
  },
  {
    key: 'preventivo',
    label: 'PREVENTIVO',
    order: 10,
    description: 'Reserva previa de crédito',
    borderColor: 'border-l-[#F59E0B]',
  },
  {
    key: 'definitivo',
    label: 'DEFINITIVO',
    order: 11,
    description: 'Compromiso contraído formal',
    borderColor: 'border-l-[#7C3AED]',
  },
  {
    key: 'devengado',
    label: 'DEVENGADO',
    order: 12,
    description: 'Gasto ejecutado y exigible',
    borderColor: 'border-l-[#10B981]',
    isDevengado: true,
  },
];

export const FinancialBoxes: React.FC<FinancialBoxesProps> = ({
  filteredRows,
  onBoxClick,
  selectedMonetaryBox,
}) => {
  // Sum of each monetary field across filtered rows
  const totals = React.useMemo(() => {
    return filteredRows.reduce(
      (acc, row) => ({
        sancion: acc.sancion + (row.sancion || 0),
        vigente: acc.vigente + (row.vigente || 0),
        restringido: acc.restringido + (row.restringido || 0),
        preventivo: acc.preventivo + (row.preventivo || 0),
        definitivo: acc.definitivo + (row.definitivo || 0),
        devengado: acc.devengado + (row.devengado || 0),
      }),
      { sancion: 0, vigente: 0, restringido: 0, preventivo: 0, definitivo: 0, devengado: 0 }
    );
  }, [filteredRows]);

  const vigenteTotal = totals.vigente;

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#94A3B8]">
          Créditos / Ejecución Presupuestaria
        </h3>
        <span className="text-[11px] font-semibold text-[#64748B]">
          Sumatorias dinámicas calculadas en tiempo real · Haga clic para ver el desglose
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {MONETARY_BOXES.map((box) => {
          const amount = totals[box.key];
          const isSelected = selectedMonetaryBox === box.key;

          // % sobre vigente
          const percentageOverVigente =
            box.key !== 'vigente' && vigenteTotal > 0
              ? (amount / vigenteTotal) * 100
              : null;

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
              className={`group relative text-left rounded-lg p-4 border border-[#E2E8F0] border-l-4 ${box.borderColor} transition-all cursor-pointer select-none shadow-sm ${
                box.isDevengado
                  ? 'bg-[#F8FAFC]'
                  : 'bg-white'
              } ${
                isSelected
                  ? 'ring-2 ring-[#1E293B] shadow-md'
                  : 'hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {/* Header inside box */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    box.isDevengado ? 'text-[#059669]' : 'text-[#64748B]'
                  }`}
                >
                  {box.label}
                </p>

                <span className="text-[9px] font-mono font-bold text-[#94A3B8]">
                  0{box.order}
                </span>
              </div>

              {/* Amount Display */}
              <div
                className={`text-lg sm:text-xl lg:text-2xl font-black font-mono tracking-tight tabular-nums mt-1 truncate ${
                  box.isDevengado ? 'text-[#059669]' : 'text-[#0F172A]'
                }`}
                title={formatCurrency(amount)}
              >
                {formatCurrency(amount)}
              </div>

              {/* Subtitle / Execution % */}
              <div className="mt-2 pt-2 border-t border-[#F1F5F9] flex items-center justify-between text-[10px]">
                {percentageOverVigente !== null ? (
                  <span
                    className={`font-bold font-mono tabular-nums ${
                      box.isDevengado ? 'text-[#059669]' : 'text-[#64748B]'
                    }`}
                  >
                    {formatPercentage(percentageOverVigente)} s/vig.
                  </span>
                ) : (
                  <span className="text-[#94A3B8] font-semibold">
                    Base 100%
                  </span>
                )}

                <span className="text-[#94A3B8] group-hover:text-[#1E293B] font-bold inline-flex items-center gap-0.5 transition-colors">
                  Detalle
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
