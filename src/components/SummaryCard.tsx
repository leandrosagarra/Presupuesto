import React from 'react';
import { Layers, CheckCircle, PieChart } from 'lucide-react';
import { BudgetRow } from '../types';
import { formatCurrency, formatNumber, formatPercentage } from '../utils/formatters';

interface SummaryCardProps {
  filteredRows: BudgetRow[];
  totalRowsCount: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  filteredRows,
  totalRowsCount,
}) => {
  const totals = React.useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => ({
        sancion: acc.sancion + (r.sancion || 0),
        vigente: acc.vigente + (r.vigente || 0),
        restringido: acc.restringido + (r.restringido || 0),
        preventivo: acc.preventivo + (r.preventivo || 0),
        definitivo: acc.definitivo + (r.definitivo || 0),
        devengado: acc.devengado + (r.devengado || 0),
      }),
      { sancion: 0, vigente: 0, restringido: 0, preventivo: 0, definitivo: 0, devengado: 0 }
    );
  }, [filteredRows]);

  const devengadoOverVigente =
    totals.vigente > 0 ? (totals.devengado / totals.vigente) * 100 : 0;
  
  // Saldo disponible presupuestario = Vigente - Preventivo (o Restringido)
  const saldoDisponible = totals.vigente - totals.definitivo;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F1F5F9] gap-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#94A3B8]">
          Resumen del Resultado
        </h3>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wider bg-[#F1F5F9] border border-[#E2E8F0] px-3 py-1.5 rounded text-[#0F172A]">
            REGISTROS ENCONTRADOS: <strong className="font-mono text-[#1E293B]">{formatNumber(filteredRows.length)}</strong>
            <span className="text-[#64748B] font-medium ml-1 font-sans">
              (de {formatNumber(totalRowsCount)})
            </span>
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-[#059669] bg-[#ECFDF5] px-2.5 py-1.5 rounded border border-[#A7F3D0] font-mono">
            <CheckCircle className="w-3.5 h-3.5 text-[#059669]" />
            Ejecución: {formatPercentage(devengadoOverVigente)}
          </span>
        </div>
      </div>

      {/* Grid of 6 Totals with distinct Bold Typography borders */}
      <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* SANCIÓN */}
        <div className="bg-white border border-[#E2E8F0] border-l-4 border-l-[#1E293B] rounded p-3 shadow-2xs">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
            SANCIÓN:
          </span>
          <p className="text-sm sm:text-base font-black text-[#0F172A] tabular-nums font-mono mt-0.5" title={formatCurrency(totals.sancion)}>
            {formatCurrency(totals.sancion)}
          </p>
        </div>

        {/* VIGENTE */}
        <div className="bg-white border border-[#E2E8F0] border-l-4 border-l-[#0369A1] rounded p-3 shadow-2xs">
          <span className="text-[10px] font-bold text-[#0369A1] uppercase tracking-wider block">
            VIGENTE:
          </span>
          <p className="text-sm sm:text-base font-black text-[#0369A1] tabular-nums font-mono mt-0.5" title={formatCurrency(totals.vigente)}>
            {formatCurrency(totals.vigente)}
          </p>
        </div>

        {/* RESTRINGIDO */}
        <div className="bg-white border border-[#E2E8F0] border-l-4 border-l-[#94A3B8] rounded p-3 shadow-2xs">
          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
            RESTRINGIDO:
          </span>
          <p className="text-sm sm:text-base font-black text-[#0F172A] tabular-nums font-mono mt-0.5" title={formatCurrency(totals.restringido)}>
            {formatCurrency(totals.restringido)}
          </p>
        </div>

        {/* PREVENTIVO */}
        <div className="bg-white border border-[#E2E8F0] border-l-4 border-l-[#F59E0B] rounded p-3 shadow-2xs">
          <span className="text-[10px] font-bold text-[#D97706] uppercase tracking-wider block">
            PREVENTIVO:
          </span>
          <p className="text-sm sm:text-base font-black text-[#0F172A] tabular-nums font-mono mt-0.5" title={formatCurrency(totals.preventivo)}>
            {formatCurrency(totals.preventivo)}
          </p>
        </div>

        {/* DEFINITIVO */}
        <div className="bg-white border border-[#E2E8F0] border-l-4 border-l-[#7C3AED] rounded p-3 shadow-2xs">
          <span className="text-[10px] font-bold text-[#7C3AED] uppercase tracking-wider block">
            DEFINITIVO:
          </span>
          <p className="text-sm sm:text-base font-black text-[#0F172A] tabular-nums font-mono mt-0.5" title={formatCurrency(totals.definitivo)}>
            {formatCurrency(totals.definitivo)}
          </p>
        </div>

        {/* DEVENGADO */}
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] border-l-4 border-l-[#10B981] rounded p-3 shadow-2xs">
          <span className="text-[10px] font-bold text-[#059669] uppercase tracking-wider block">
            DEVENGADO:
          </span>
          <p className="text-sm sm:text-base font-black text-[#059669] tabular-nums font-mono mt-0.5" title={formatCurrency(totals.devengado)}>
            {formatCurrency(totals.devengado)}
          </p>
        </div>
      </div>
    </div>
  );
};
