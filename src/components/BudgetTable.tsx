import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from 'lucide-react';
import { BudgetRow, BudgetFile } from '../types';
import { formatCurrency, formatNumber } from '../utils/formatters';
import { exportRowsToExcel } from '../utils/excelParser';

interface BudgetTableProps {
  rows: BudgetRow[];
  activeFile: BudgetFile;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  onCellFilterClick?: (columnKey: string, value: string) => void;
  onBackToHierarchy?: () => void;
}

type SortDirection = 'asc' | 'desc' | null;

interface SortState {
  column: string;
  direction: SortDirection;
}

export const BudgetTable: React.FC<BudgetTableProps> = ({
  rows,
  activeFile,
  searchTerm,
  onSearchChange,
  onCellFilterClick,
  onBackToHierarchy,
}) => {
  const [sort, setSort] = useState<SortState>({
    column: 'fuenteFinanciamiento',
    direction: 'asc',
  });
  const [pageSize, setPageSize] = useState<number>(25);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Derive column list based on activeFile headers or standard keys
  const standardColumns = useMemo(() => [
    { key: 'fuenteFinanciamiento', label: 'FUENTE FIN.', isMonetary: false },
    { key: 'inciso', label: 'INCISO', isMonetary: false },
    { key: 'partidaPrincipal', label: 'PARTIDA PRINCIPAL', isMonetary: false },
    { key: 'partidaParcial', label: 'PARTIDA PARCIAL', isMonetary: false },
    { key: 'partidaSubparcial', label: 'PARTIDA SUBPARCIAL', isMonetary: false },
    { key: 'descripcion', label: 'DESCRIPCIÓN', isMonetary: false },
    { key: 'sancion', label: 'SANCIÓN', isMonetary: true },
    { key: 'vigente', label: 'VIGENTE', isMonetary: true },
    { key: 'restringido', label: 'RESTRINGIDO', isMonetary: true },
    { key: 'preventivo', label: 'PREVENTIVO', isMonetary: true },
    { key: 'definitivo', label: 'DEFINITIVO', isMonetary: true },
    { key: 'devengado', label: 'DEVENGADO', isMonetary: true },
  ], []);

  // Check if there are additional columns in raw data that are not already mapped
  const additionalColumns = useMemo(() => {
    if (!activeFile || !activeFile.headers) return [];
    const mappedOriginals = new Set(Object.values(activeFile.columnMapping));
    return activeFile.headers
      .filter((h) => !mappedOriginals.has(h))
      .map((h) => ({
        key: `raw_${h}`,
        originalHeader: h,
        label: h.toUpperCase(),
        isMonetary: false,
      }));
  }, [activeFile]);

  // Handle column header click for sorting
  const handleHeaderClick = (colKey: string) => {
    setSort((prev) => {
      if (prev.column !== colKey) {
        return { column: colKey, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { column: colKey, direction: 'desc' };
      }
      return { column: colKey, direction: 'asc' };
    });
  };

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!sort.direction) return rows;

    return [...rows].sort((a, b) => {
      let valA: any;
      let valB: any;

      if (sort.column.startsWith('raw_')) {
        const header = sort.column.replace('raw_', '');
        valA = a.raw?.[header] ?? '';
        valB = b.raw?.[header] ?? '';
      } else {
        valA = (a as any)[sort.column];
        valB = (b as any)[sort.column];
      }

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sort.direction === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA || '').toLowerCase();
      const strB = String(valB || '').toLowerCase();
      if (strA < strB) return sort.direction === 'asc' ? -1 : 1;
      if (strA > strB) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sort]);

  // Pagination calculations
  const totalRecords = sortedRows.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  
  // Reset page if bounds exceeded
  const safePage = Math.min(currentPage, totalPages);

  const paginatedRows = useMemo(() => {
    if (pageSize === -1) return sortedRows;
    const start = (safePage - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, safePage, pageSize]);

  // Totals for the currently filtered set of rows
  const visibleTotals = useMemo(() => {
    return rows.reduce(
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
  }, [rows]);

  const handleExport = () => {
    const fileName = `Detalle_Presupuestario_${activeFile.fileName.replace(/\.[^/.]+$/, '')}_filtrado.xlsx`;
    exportRowsToExcel(rows, fileName);
  };

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden flex flex-col">
      {/* Table Header Controls matching design */}
      <div className="bg-[#F1F5F9] rounded-t-lg px-4 sm:px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between border-b border-[#E2E8F0] gap-3">
        <div className="flex items-center gap-3">
          {onBackToHierarchy && (
            <button
              type="button"
              onClick={onBackToHierarchy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-white bg-[#0F172A] hover:bg-[#1E293B] rounded-lg shadow-xs transition-colors"
            >
              <span>← VOLVER A VISTA JERÁRQUICA</span>
            </button>
          )}

          <span className="text-xs font-black uppercase tracking-widest text-[#0F172A]">
            TABLA COMPLETA
          </span>
          <span className="text-[10px] bg-white border border-[#E2E8F0] px-2.5 py-1 rounded font-bold text-[#64748B] font-mono">
            {formatNumber(rows.length)} registros
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Global Search */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                onSearchChange(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filtrar tabla..."
              className="w-full pl-9 pr-3 py-1.5 text-[11px] bg-white border border-[#E2E8F0] rounded focus:outline-none focus:ring-2 focus:ring-[#1E293B] text-[#0F172A] placeholder:text-[#94A3B8]"
            />
          </div>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExport}
            className="bg-[#1E293B] text-white px-3.5 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 hover:bg-black transition-colors shadow-2xs"
            title="Exportar vista actual a Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Table Scroll Area */}
      <div className="relative overflow-x-auto max-h-[580px] scrollbar-thin scrollbar-thumb-slate-300">
        <table className="w-full text-left text-xs border-collapse">
          {/* Sticky Header */}
          <thead className="bg-white sticky top-0 z-20 text-[#64748B] border-b border-[#E2E8F0] shadow-2xs">
            <tr>
              <th className="py-3 px-3 font-black text-[10px] uppercase tracking-wider text-[#94A3B8] border-r border-[#E2E8F0] w-12 text-center">
                #
              </th>
              {standardColumns.map((col) => {
                const isSorted = sort.column === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleHeaderClick(col.key)}
                    className={`py-3 px-3 font-black text-[10px] uppercase tracking-wider cursor-pointer select-none hover:bg-[#F8FAFC] transition-colors border-r border-[#E2E8F0] whitespace-nowrap ${
                      col.isMonetary ? 'text-right' : 'text-left'
                    } ${isSorted ? 'bg-[#F1F5F9] text-[#1E293B]' : 'text-[#64748B]'}`}
                    title={`Ordenar por ${col.label}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.isMonetary ? 'justify-end w-full' : ''
                      }`}
                    >
                      <span>{col.label}</span>
                      {isSorted ? (
                        sort.direction === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E293B] stroke-[2.5]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E293B] stroke-[2.5]" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-[#CBD5E1] opacity-60 hover:opacity-100" />
                      )}
                    </div>
                  </th>
                );
              })}

              {/* Extra Columns from original Excel if any */}
              {additionalColumns.map((col) => {
                const isSorted = sort.column === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleHeaderClick(col.key)}
                    className="py-3 px-3 font-black text-[10px] uppercase tracking-wider cursor-pointer select-none hover:bg-[#F8FAFC] transition-colors border-r border-[#E2E8F0] text-[#64748B] whitespace-nowrap"
                  >
                    <div className="inline-flex items-center gap-1.5">
                      <span>{col.label}</span>
                      {isSorted && (
                        sort.direction === 'asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#1E293B]" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#1E293B]" />
                        )
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F1F5F9] font-sans">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={standardColumns.length + additionalColumns.length + 1}
                  className="py-12 text-center text-[#64748B]"
                >
                  <p className="text-sm font-bold text-[#1E293B]">
                    No se encontraron registros con los filtros aplicados.
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-1 font-medium">
                    Pruebe limpiando algunos de los filtros activos o modificando el término de búsqueda.
                  </p>
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => {
                const globalIdx = pageSize === -1 ? idx + 1 : (safePage - 1) * pageSize + idx + 1;
                return (
                  <tr
                    key={row.id}
                    className="hover:bg-[#F8FAFC] transition-colors group"
                  >
                    <td className="py-2.5 px-3 text-[#94A3B8] text-[10px] font-mono text-center border-r border-[#E2E8F0] bg-[#F8FAFC]/50 font-bold">
                      {globalIdx}
                    </td>

                    {/* FUENTE FINANCIAMIENTO */}
                    <td
                      onClick={() => onCellFilterClick?.('fuenteFinanciamiento', row.fuenteFinanciamiento)}
                      className="py-2.5 px-3 font-mono font-bold text-[#1E293B] border-r border-[#E2E8F0] text-center cursor-pointer hover:text-black hover:underline"
                      title={`Filtrar por FF ${row.fuenteFinanciamiento}`}
                    >
                      {row.fuenteFinanciamiento || '-'}
                    </td>

                    {/* INCISO */}
                    <td
                      onClick={() => onCellFilterClick?.('inciso', row.inciso)}
                      className="py-2.5 px-3 font-mono font-bold text-[#1E293B] border-r border-[#E2E8F0] text-center cursor-pointer hover:text-black hover:underline"
                      title={`Filtrar por Inciso ${row.inciso}`}
                    >
                      {row.inciso || '-'}
                    </td>

                    {/* PARTIDA PRINCIPAL */}
                    <td
                      onClick={() => onCellFilterClick?.('partidaPrincipal', row.partidaPrincipal)}
                      className="py-2.5 px-3 font-mono font-bold text-[#1E293B] border-r border-[#E2E8F0] text-center cursor-pointer hover:text-black hover:underline"
                    >
                      {row.partidaPrincipal || '-'}
                    </td>

                    {/* PARTIDA PARCIAL */}
                    <td
                      onClick={() => onCellFilterClick?.('partidaParcial', row.partidaParcial)}
                      className="py-2.5 px-3 font-mono font-bold text-[#1E293B] border-r border-[#E2E8F0] text-center cursor-pointer hover:text-black hover:underline"
                    >
                      {row.partidaParcial || '-'}
                    </td>

                    {/* PARTIDA SUBPARCIAL */}
                    <td
                      onClick={() => onCellFilterClick?.('partidaSubparcial', row.partidaSubparcial)}
                      className="py-2.5 px-3 font-mono font-bold text-[#1E293B] border-r border-[#E2E8F0] text-center cursor-pointer hover:text-black hover:underline"
                    >
                      {row.partidaSubparcial || '-'}
                    </td>

                    {/* DESCRIPCIÓN */}
                    <td className="py-2.5 px-3 text-[#0F172A] border-r border-[#E2E8F0] max-w-sm truncate font-medium text-xs" title={row.descripcion}>
                      {row.descripcion || '-'}
                    </td>

                    {/* SANCIÓN */}
                    <td className="py-2.5 px-3 text-right tabular-nums font-mono font-bold border-r border-[#E2E8F0] text-[#0F172A]">
                      {formatCurrency(row.sancion)}
                    </td>

                    {/* VIGENTE */}
                    <td className="py-2.5 px-3 text-right tabular-nums font-mono border-r border-[#E2E8F0] font-black text-[#0369A1] bg-sky-50/20">
                      {formatCurrency(row.vigente)}
                    </td>

                    {/* RESTRINGIDO */}
                    <td className="py-2.5 px-3 text-right tabular-nums font-mono font-bold border-r border-[#E2E8F0] text-[#64748B]">
                      {row.restringido > 0 ? formatCurrency(row.restringido) : '-'}
                    </td>

                    {/* PREVENTIVO */}
                    <td className="py-2.5 px-3 text-right tabular-nums font-mono font-bold border-r border-[#E2E8F0] text-[#D97706]">
                      {row.preventivo > 0 ? formatCurrency(row.preventivo) : '-'}
                    </td>

                    {/* DEFINITIVO */}
                    <td className="py-2.5 px-3 text-right tabular-nums font-mono font-bold border-r border-[#E2E8F0] text-[#7C3AED]">
                      {row.definitivo > 0 ? formatCurrency(row.definitivo) : '-'}
                    </td>

                    {/* DEVENGADO */}
                    <td className="py-2.5 px-3 text-right tabular-nums font-mono border-r border-[#E2E8F0] font-black text-[#059669] bg-emerald-50/20">
                      {formatCurrency(row.devengado)}
                    </td>

                    {/* Additional columns */}
                    {additionalColumns.map((col) => (
                      <td
                        key={col.key}
                        className="py-2.5 px-3 text-[#475569] border-r border-[#E2E8F0] max-w-xs truncate text-xs"
                        title={String(row.raw?.[col.originalHeader] ?? '')}
                      >
                        {String(row.raw?.[col.originalHeader] ?? '-')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Totals Footer Row */}
          {rows.length > 0 && (
            <tfoot className="bg-[#F1F5F9] sticky bottom-0 z-10 border-t-2 border-[#CBD5E1] font-black text-[#0F172A] text-xs">
              <tr>
                <td className="py-3 px-3 text-center text-[#64748B] font-mono text-[11px] border-r border-[#E2E8F0]">
                  Σ
                </td>
                <td colSpan={5} className="py-3 px-3 text-[#0F172A] font-black uppercase tracking-wider border-r border-[#E2E8F0]">
                  TOTALES ({formatNumber(rows.length)} REGISTROS)
                </td>
                <td className="py-3 px-3 text-[#94A3B8] border-r border-[#E2E8F0]">
                  —
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-[#0F172A] font-black border-r border-[#E2E8F0]">
                  {formatCurrency(visibleTotals.sancion)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-[#0369A1] font-black border-r border-[#E2E8F0] bg-sky-100/60">
                  {formatCurrency(visibleTotals.vigente)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-[#64748B] font-black border-r border-[#E2E8F0]">
                  {formatCurrency(visibleTotals.restringido)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-[#D97706] font-black border-r border-[#E2E8F0]">
                  {formatCurrency(visibleTotals.preventivo)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-[#7C3AED] font-black border-r border-[#E2E8F0]">
                  {formatCurrency(visibleTotals.definitivo)}
                </td>
                <td className="py-3 px-3 text-right font-mono tabular-nums text-[#059669] font-black border-r border-[#E2E8F0] bg-emerald-100/60">
                  {formatCurrency(visibleTotals.devengado)}
                </td>
                {additionalColumns.map((c) => (
                  <td key={c.key} className="py-3 px-3 border-r border-[#E2E8F0] text-[#94A3B8] text-center">
                    —
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination & Status Footer */}
      <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
        <div className="flex items-center gap-3">
          <span>
            Mostrando{' '}
            <strong className="text-[#0F172A] font-black font-mono">
              {totalRecords === 0 ? 0 : (safePage - 1) * (pageSize === -1 ? totalRecords : pageSize) + 1}
            </strong>{' '}
            a{' '}
            <strong className="text-[#0F172A] font-black font-mono">
              {pageSize === -1 ? totalRecords : Math.min(safePage * pageSize, totalRecords)}
            </strong>{' '}
            de <strong className="text-[#0F172A] font-black font-mono">{formatNumber(totalRecords)}</strong> registros
          </span>

          <div className="flex items-center gap-1.5 ml-2 border-l border-[#E2E8F0] pl-3">
            <span className="text-[#64748B] font-medium">Filas por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-[#E2E8F0] rounded px-2.5 py-1 text-xs text-[#0F172A] font-bold focus:outline-none focus:ring-1 focus:ring-[#1E293B]"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={-1}>Todas</option>
            </select>
          </div>
        </div>

        {pageSize !== -1 && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
              className="p-1.5 rounded bg-white border border-[#E2E8F0] text-[#1E293B] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F1F5F9] transition-colors"
              title="Primera página"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="p-1.5 rounded bg-white border border-[#E2E8F0] text-[#1E293B] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F1F5F9] transition-colors"
              title="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-bold font-mono text-[#0F172A]">
              Página {safePage} de {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="p-1.5 rounded bg-white border border-[#E2E8F0] text-[#1E293B] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F1F5F9] transition-colors"
              title="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage === totalPages}
              className="p-1.5 rounded bg-white border border-[#E2E8F0] text-[#1E293B] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F1F5F9] transition-colors"
              title="Última página"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
