import React from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { BudgetFile } from '../types';
import { formatDate, formatNumber } from '../utils/formatters';

interface FilesHistoryProps {
  files: BudgetFile[];
  activeFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onRemoveFile?: (fileId: string) => void;
  onUploadClick: () => void;
}

export const FilesHistory: React.FC<FilesHistoryProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onRemoveFile,
  onUploadClick,
}) => {
  return (
    <section className="bg-white border border-[#CBD5E1] rounded-xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
            ARCHIVOS
          </h2>
          <span className="text-[11px] font-mono font-bold bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] px-2 py-0.5 rounded">
            {files.length} {files.length === 1 ? 'cargado' : 'cargados'}
          </span>
        </div>

        <button
          type="button"
          onClick={onUploadClick}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F172A] hover:text-blue-700 underline"
        >
          <UploadCloud className="w-3.5 h-3.5" />
          <span>+ Cargar otro archivo</span>
        </button>
      </div>

      <div className="mt-3 space-y-2">
        {files.map((file) => {
          const isActive = file.id === activeFileId;

          return (
            <div
              key={file.id}
              onClick={() => !isActive && onSelectFile(file.id)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg border transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-50 border-[#0F172A] ring-1 ring-[#0F172A]'
                  : 'bg-white border-slate-200 hover:border-slate-400 hover:bg-slate-50/50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Status Dot: ● ACTIVO vs ○ INACTIVO */}
                <div className="shrink-0 flex items-center justify-center">
                  {isActive ? (
                    <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100 flex items-center justify-center" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border-2 border-slate-300" />
                  )}
                </div>

                <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center sm:gap-2.5">
                  <span
                    className={`font-mono text-xs font-bold truncate max-w-sm ${
                      isActive ? 'text-[#0F172A]' : 'text-slate-700'
                    }`}
                    title={file.fileName}
                  >
                    {file.fileName}
                  </span>

                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider font-mono shrink-0">
                      ● ACTIVO
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-mono shrink-0">
                      (Haga clic para activar)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono text-slate-500 shrink-0">
                <span className="hidden sm:inline-block">
                  {formatNumber(file.rowCount)} registros
                </span>
                <span className="hidden md:inline-block text-slate-400">
                  {formatDate(file.uploadedAt)}
                </span>

                {files.length > 1 && onRemoveFile && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFile(file.id);
                    }}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded"
                    title="Eliminar archivo del historial"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
