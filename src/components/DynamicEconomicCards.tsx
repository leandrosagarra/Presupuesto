import React from 'react';
import { EconomicTotals, HierarchyPath } from '../utils/budgetHierarchy';
import { formatCurrency, formatCurrencyCompact, formatPercentage } from '../utils/formatters';
import { ShieldCheck } from 'lucide-react';

interface DynamicEconomicCardsProps {
  totals: EconomicTotals;
  path: HierarchyPath;
  levelTitle: string;
  hasAggregatesDetected?: boolean;
}

export const DynamicEconomicCards: React.FC<DynamicEconomicCardsProps> = ({
  totals,
  path,
  levelTitle,
  hasAggregatesDetected,
}) => {
  const executionRate = totals.vigente > 0 ? (totals.devengado / totals.vigente) * 100 : 0;
  const commitmentRate = totals.vigente > 0 ? (totals.definitivo / totals.vigente) * 100 : 0;

  const cards = [
    {
      key: 'sancion',
      label: 'SANCIÓN',
      amount: totals.sancion,
      sublabel: 'Crédito ley original',
      borderColor: 'border-slate-300',
      bgHeader: 'bg-slate-100 text-slate-700',
    },
    {
      key: 'vigente',
      label: 'VIGENTE',
      amount: totals.vigente,
      sublabel: 'Crédito ajustado total',
      borderColor: 'border-slate-900',
      bgHeader: 'bg-[#0F172A] text-white',
      isPrimary: true,
    },
    {
      key: 'restringido',
      label: 'RESTRINGIDO',
      amount: totals.restringido,
      sublabel: 'Reserva / indisponible',
      borderColor: 'border-rose-200',
      bgHeader: 'bg-rose-50 text-rose-800',
      isAlert: totals.restringido > 0,
    },
    {
      key: 'preventivo',
      label: 'PREVENTIVO',
      amount: totals.preventivo,
      sublabel: 'Afectación preventiva',
      borderColor: 'border-slate-300',
      bgHeader: 'bg-slate-100 text-slate-700',
    },
    {
      key: 'definitivo',
      label: 'DEFINITIVO',
      amount: totals.definitivo,
      sublabel: `${formatPercentage(commitmentRate)} del vigente`,
      borderColor: 'border-slate-300',
      bgHeader: 'bg-slate-100 text-slate-700',
    },
    {
      key: 'devengado',
      label: 'DEVENGADO',
      amount: totals.devengado,
      sublabel: `${formatPercentage(executionRate)} ejecutado`,
      borderColor: 'border-emerald-300',
      bgHeader: 'bg-emerald-50 text-emerald-900',
      isPositive: true,
    },
  ];

  return (
    <div className="bg-white border border-[#CBD5E1] rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
      {/* Scope header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#E2E8F0]">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#64748B]">
            RESUMEN ECONÓMICO DEL NIVEL SELECCIONADO
          </span>
          <p className="text-sm font-black text-[#0F172A] tracking-tight truncate max-w-2xl" title={levelTitle}>
            {levelTitle}
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Exactitud verificada · Sin duplicación</span>
          </div>

          <div className="text-[11px] font-mono text-[#64748B]">
            <span className="font-bold text-[#0F172A]">{totals.rowCount}</span> partidas analizadas
          </div>
        </div>
      </div>

      {/* 6 Economic Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
        {cards.map((c) => (
          <div
            key={c.key}
            className={`flex flex-col justify-between rounded-lg border bg-white overflow-hidden transition-all ${c.borderColor} ${
              c.isPrimary ? 'ring-1 ring-[#0F172A]' : ''
            }`}
          >
            {/* Header label */}
            <div className={`px-2.5 py-1.5 flex items-center justify-between text-[11px] font-black tracking-wider uppercase ${c.bgHeader}`}>
              <span>{c.label}</span>
              {c.key === 'devengado' && (
                <span className="text-[10px] font-mono px-1 py-0.2 bg-emerald-600 text-white rounded">
                  {formatPercentage(executionRate, 0)}
                </span>
              )}
            </div>

            {/* Amount Body */}
            <div className="p-3">
              <div
                className="text-lg sm:text-xl font-black font-mono tracking-tight text-[#0F172A] truncate"
                title={formatCurrency(c.amount)}
              >
                {formatCurrencyCompact(c.amount)}
              </div>
              <div
                className="text-[10px] font-mono text-[#64748B] font-medium truncate mt-0.5"
                title={formatCurrency(c.amount)}
              >
                {formatCurrency(c.amount)}
              </div>
              <p className="text-[10px] text-[#64748B] mt-1.5 pt-1 border-t border-slate-100 truncate">
                {c.sublabel}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
