import React from 'react';
import { UploadCloud, Table, FolderTree } from 'lucide-react';
import { BudgetFile } from '../types';

interface HeaderProps {
  activeFile: BudgetFile | null;
  onOpenUpload: () => void;
  currentView: 'hierarchy' | 'table';
  onToggleView: (view: 'hierarchy' | 'table') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeFile,
  onOpenUpload,
  currentView,
  onToggleView,
}) => {
  return (
    <header className="bg-white border-b border-[#CBD5E1] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Main Title & Institutional Subtitle */}
          <div>
            <div className="flex items-baseline gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A] uppercase">
                PRESUPUESTO
              </h1>
              <span className="text-xs sm:text-sm font-bold tracking-wider text-[#475569] uppercase border-l-2 border-[#94A3B8] pl-2.5">
                LISTADO DE CRÉDITOS AÑO 2026
              </span>
            </div>

            {/* Sub-indicator of active file */}
            <div className="flex items-center gap-2 mt-1 text-xs text-[#64748B]">
              <span className="font-semibold text-[#475569]">Archivo analizado:</span>
              {activeFile ? (
                <span className="font-bold text-[#0F172A] bg-[#F1F5F9] px-2 py-0.5 rounded border border-[#E2E8F0] font-mono truncate max-w-xs sm:max-w-md" title={activeFile.fileName}>
                  {activeFile.fileName}
                </span>
              ) : (
                <span className="italic text-[#94A3B8]">Ningún archivo seleccionado</span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Toggle between Hierarchical Navigation and Full Table view */}
            <div className="inline-flex rounded-md border border-[#CBD5E1] bg-[#F8FAFC] p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => onToggleView('hierarchy')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                  currentView === 'hierarchy'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Navegación</span>
              </button>
              <button
                type="button"
                onClick={() => onToggleView('table')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
                  currentView === 'table'
                    ? 'bg-[#0F172A] text-white shadow-xs'
                    : 'text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>Ver Tabla Completa</span>
              </button>
            </div>

            {/* Prominent Upload button */}
            <button
              type="button"
              onClick={onOpenUpload}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider text-white bg-[#0F172A] hover:bg-[#1E293B] rounded-lg transition-all shadow-sm active:scale-98"
            >
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>+ CARGAR NUEVO ARCHIVO</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
