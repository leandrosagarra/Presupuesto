import React from 'react';
import {
  HierarchyTree,
  HierarchyPath,
  FuenteNode,
  IncisoNode,
  PrincipalNode,
  ParcialNode,
} from '../utils/budgetHierarchy';
import {
  formatCurrency,
  formatCurrencyCompact,
  formatPercentage,
} from '../utils/formatters';
import {
  ArrowRight,
  ChevronRight,
  Layers,
  FileSpreadsheet,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface HierarchyNavigatorProps {
  tree: HierarchyTree;
  path: HierarchyPath;
  onNavigate: (newPath: HierarchyPath) => void;
}

export const HierarchyNavigator: React.FC<HierarchyNavigatorProps> = ({
  tree,
  path,
  onNavigate,
}) => {
  // Find current node according to path
  const selectedFuente = tree.fuentes.find((f) => f.code === path.fuente);
  const selectedInciso = selectedFuente?.incisos.find((i) => i.code === path.inciso);
  const selectedPrincipal = selectedInciso?.principales.find((p) => p.code === path.principal);
  const selectedParcial = selectedPrincipal?.parciales.find((p) => p.code === path.parcial);

  // LEVEL 1: FUENTES DE FINANCIAMIENTO (Root level)
  if (!path.fuente || !selectedFuente) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black uppercase text-[#0F172A] tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>NIVEL 1 – FUENTES DE FINANCIAMIENTO</span>
            </h2>
            <p className="text-xs text-[#64748B]">
              Seleccione una Fuente de Financiamiento para explorar sus incisos y partidas correspondientes.
            </p>
          </div>
          <span className="text-xs font-mono font-bold bg-[#F1F5F9] px-2.5 py-1 rounded border border-[#CBD5E1] text-[#475569]">
            {tree.fuentes.length} {tree.fuentes.length === 1 ? 'Fuente detectada' : 'Fuentes detectadas'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tree.fuentes.map((fuente) => (
            <div
              key={fuente.code}
              onClick={() => onNavigate({ fuente: fuente.code })}
              className="bg-white border-2 border-[#CBD5E1] hover:border-[#0F172A] rounded-xl p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-black uppercase font-mono px-2 py-0.5 rounded bg-[#0F172A] text-white">
                    FUENTE {fuente.code}
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 font-bold">
                    {fuente.incisos.length} incisos
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#0F172A] mt-2.5 line-clamp-2 min-h-[40px]" title={fuente.descripcion}>
                  {fuente.descripcion}
                </h3>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#64748B]">
                      Crédito Vigente
                    </span>
                    <div className="text-xl font-black font-mono text-[#0F172A] mt-0.5">
                      {formatCurrency(fuente.totals.vigente)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-dashed border-slate-200">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400">Devengado:</span>
                      <div className="font-mono font-bold text-slate-700">
                        {formatCurrencyCompact(fuente.totals.devengado)}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-slate-400">Ejecución:</span>
                      <div className="font-mono font-bold text-emerald-700">
                        {formatPercentage(
                          fuente.totals.vigente > 0 ? (fuente.totals.devengado / fuente.totals.vigente) * 100 : 0
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-700 group-hover:text-blue-900">
                <span>Ver detalle de incisos</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // LEVEL 2: INCISOS
  if (!path.inciso || !selectedInciso) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black uppercase text-[#0F172A] tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>NIVEL 2 – INCISOS (FUENTE {selectedFuente.code})</span>
            </h2>
            <p className="text-xs text-[#64748B]">
              Seleccione un Inciso para desglosar sus Partidas Principales correspondientes.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({})}
            className="text-xs font-bold text-[#475569] hover:text-[#0F172A] underline"
          >
            ← Cambiar de Fuente
          </button>
        </div>

        <div className="space-y-3">
          {selectedFuente.incisos.map((inciso) => {
            const execRate =
              inciso.totals.vigente > 0 ? (inciso.totals.devengado / inciso.totals.vigente) * 100 : 0;

            return (
              <div
                key={inciso.code}
                onClick={() => onNavigate({ fuente: selectedFuente.code, inciso: inciso.code })}
                className="bg-white border border-[#CBD5E1] hover:border-[#0F172A] rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-black uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-white">
                      INCISO {inciso.code}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {inciso.principales.length} Partidas Principales
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] tracking-tight">
                    {inciso.descripcion}
                  </h3>
                </div>

                {/* Metrics bar */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 text-right shrink-0 items-center">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">Vigente</span>
                    <span className="text-sm font-black font-mono text-slate-900 block" title={formatCurrency(inciso.totals.vigente)}>
                      {formatCurrencyCompact(inciso.totals.vigente)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">Definitivo</span>
                    <span className="text-sm font-mono font-bold text-slate-700 block" title={formatCurrency(inciso.totals.definitivo)}>
                      {formatCurrencyCompact(inciso.totals.definitivo)}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">Devengado</span>
                    <span className="text-sm font-mono font-bold text-emerald-800 block" title={formatCurrency(inciso.totals.devengado)}>
                      {formatCurrencyCompact(inciso.totals.devengado)}
                    </span>
                  </div>

                  <div className="hidden sm:block">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">Ejecución</span>
                    <span className="text-xs font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                      {formatPercentage(execRate)}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <div className="flex items-center justify-end text-xs font-bold text-blue-700 group-hover:text-blue-900 shrink-0">
                  <span className="mr-1">Ver partidas</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // LEVEL 3: PARTIDAS PRINCIPALES
  if (!path.principal || !selectedPrincipal) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black uppercase text-[#0F172A] tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>NIVEL 3 – PARTIDAS PRINCIPALES (INCISO {selectedInciso.code})</span>
            </h2>
            <p className="text-xs text-[#64748B]">
              Partidas Principales de {selectedInciso.descripcion}. Seleccione una para ver sus Partidas Parciales.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate({ fuente: selectedFuente.code })}
            className="text-xs font-bold text-[#475569] hover:text-[#0F172A] underline"
          >
            ← Volver a Incisos
          </button>
        </div>

        <div className="bg-white border border-[#CBD5E1] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[#475569] font-mono uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-3.5 py-3 w-16">Código</th>
                  <th className="px-3.5 py-3">Descripción</th>
                  <th className="px-3 py-3 text-right">Sanción</th>
                  <th className="px-3 py-3 text-right font-black text-slate-900">Vigente</th>
                  <th className="px-3 py-3 text-right">Restringido</th>
                  <th className="px-3 py-3 text-right">Preventivo</th>
                  <th className="px-3 py-3 text-right">Definitivo</th>
                  <th className="px-3 py-3 text-right text-emerald-900 font-bold">Devengado</th>
                  <th className="px-3 py-3 text-center w-28">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedInciso.principales.map((pp) => (
                  <tr
                    key={pp.code}
                    onClick={() =>
                      onNavigate({
                        fuente: selectedFuente.code,
                        inciso: selectedInciso.code,
                        principal: pp.code,
                      })
                    }
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-900">
                      PP {pp.code}
                    </td>
                    <td className="px-3.5 py-3 font-bold text-slate-900">
                      <div>{pp.descripcion}</div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {pp.parciales.length} {pp.parciales.length === 1 ? 'partida parcial' : 'partidas parciales'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-600">
                      {pp.totals.sancion > 0 ? formatCurrencyCompact(pp.totals.sancion) : '-'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-black text-slate-900">
                      {formatCurrencyCompact(pp.totals.vigente)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-rose-700">
                      {pp.totals.restringido > 0 ? formatCurrencyCompact(pp.totals.restringido) : '$ 0'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-600">
                      {pp.totals.preventivo > 0 ? formatCurrencyCompact(pp.totals.preventivo) : '$ 0'}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-700 font-semibold">
                      {formatCurrencyCompact(pp.totals.definitivo)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-emerald-800">
                      {formatCurrencyCompact(pp.totals.devengado)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 group-hover:text-blue-900 bg-blue-50 px-2 py-1 rounded"
                      >
                        <span>Parciales</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // LEVEL 4: PARTIDAS PARCIALES
  if (!path.parcial || !selectedParcial) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black uppercase text-[#0F172A] tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>
                NIVEL 4 – PARTIDAS PARCIALES (PP {selectedPrincipal.code} — {selectedPrincipal.descripcion})
              </span>
            </h2>
            <p className="text-xs text-[#64748B]">
              Seleccione una Partida Parcial para ver el detalle de sus Partidas Subparciales.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onNavigate({
                fuente: selectedFuente.code,
                inciso: selectedInciso.code,
              })
            }
            className="text-xs font-bold text-[#475569] hover:text-[#0F172A] underline"
          >
            ← Volver a Partidas Principales
          </button>
        </div>

        <div className="bg-white border border-[#CBD5E1] rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[#475569] font-mono uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="px-3.5 py-3 w-20">Código</th>
                  <th className="px-3.5 py-3">Descripción</th>
                  <th className="px-3 py-3 text-right font-black text-slate-900">Vigente</th>
                  <th className="px-3 py-3 text-right">Preventivo</th>
                  <th className="px-3 py-3 text-right">Definitivo</th>
                  <th className="px-3 py-3 text-right text-emerald-900 font-bold">Devengado</th>
                  <th className="px-3 py-3 text-center w-28">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedPrincipal.parciales.map((parc) => (
                  <tr
                    key={parc.code}
                    onClick={() =>
                      onNavigate({
                        fuente: selectedFuente.code,
                        inciso: selectedInciso.code,
                        principal: selectedPrincipal.code,
                        parcial: parc.code,
                      })
                    }
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-3.5 py-3 font-mono font-bold text-slate-900">
                      Parcial {parc.code}
                    </td>
                    <td className="px-3.5 py-3 font-bold text-slate-900">
                      <div>{parc.descripcion}</div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {parc.subparciales.length} {parc.subparciales.length === 1 ? 'subparcial' : 'subparciales'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-black text-slate-900" title={formatCurrency(parc.totals.vigente)}>
                      {formatCurrency(parc.totals.vigente)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-600">
                      {formatCurrency(parc.totals.preventivo)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-slate-700 font-semibold">
                      {formatCurrency(parc.totals.definitivo)}
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-emerald-800">
                      {formatCurrency(parc.totals.devengado)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 group-hover:text-blue-900 bg-blue-50 px-2 py-1 rounded"
                      >
                        <span>Subparciales</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // LEVEL 5: PARTIDAS SUBPARCIALES (Deepest level)
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-black uppercase text-[#0F172A] tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>
              NIVEL 5 – PARTIDAS SUBPARCIALES (PARCIAL {selectedParcial.code} — {selectedParcial.descripcion})
            </span>
          </h2>
          <p className="text-xs text-[#64748B]">
            Detalle analítico y registros correspondientes a la partida parcial seleccionada.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            onNavigate({
              fuente: selectedFuente.code,
              inciso: selectedInciso.code,
              principal: selectedPrincipal.code,
            })
          }
          className="text-xs font-bold text-[#475569] hover:text-[#0F172A] underline"
        >
          ← Volver a Partidas Parciales
        </button>
      </div>

      <div className="bg-white border border-[#CBD5E1] rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[#475569] font-mono uppercase text-[10px] tracking-wider font-bold">
              <tr>
                <th className="px-3.5 py-3 w-24">Código</th>
                <th className="px-3.5 py-3">Descripción</th>
                <th className="px-3 py-3 text-right">Sanción</th>
                <th className="px-3 py-3 text-right font-black text-slate-900">Vigente</th>
                <th className="px-3 py-3 text-right">Restringido</th>
                <th className="px-3 py-3 text-right">Preventivo</th>
                <th className="px-3 py-3 text-right">Definitivo</th>
                <th className="px-3 py-3 text-right text-emerald-900 font-bold">Devengado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {selectedParcial.subparciales.map((sub) => (
                <tr key={sub.code} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3.5 py-3 font-mono font-bold text-slate-900">
                    Subparcial {sub.code}
                  </td>
                  <td className="px-3.5 py-3 font-bold text-slate-900">
                    <div>{sub.descripcion}</div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Código completo: {sub.fullCode}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-slate-600">
                    {sub.totals.sancion > 0 ? formatCurrency(sub.totals.sancion) : '-'}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-black text-slate-900">
                    {formatCurrency(sub.totals.vigente)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-rose-700">
                    {sub.totals.restringido > 0 ? formatCurrency(sub.totals.restringido) : '$ 0'}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-slate-600">
                    {formatCurrency(sub.totals.preventivo)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-slate-700 font-semibold">
                    {formatCurrency(sub.totals.definitivo)}
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-emerald-800">
                    {formatCurrency(sub.totals.devengado)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
