import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FilePlus,
  Sparkles,
} from 'lucide-react';
import { parseExcelBuffer } from '../utils/excelParser';
import { BudgetFile } from '../types';
import { INITIAL_SAMPLE_FILES } from '../utils/sampleData';

interface ExcelUploadBannerProps {
  onFileLoaded: (file: BudgetFile) => void;
  activeFile: BudgetFile | null;
}

export const ExcelUploadBanner: React.FC<ExcelUploadBannerProps> = ({
  onFileLoaded,
  activeFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProcessFile = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const hasValidExt = validExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (!hasValidExt) {
        throw new Error(
          'Formato no compatible. Por favor seleccione un archivo Excel (.xlsx, .xls) o archivo .csv.'
        );
      }

      const buffer = await file.arrayBuffer();
      const budgetFile = parseExcelBuffer(buffer, file.name, file.size);

      if (!budgetFile.rows || budgetFile.rows.length === 0) {
        throw new Error(
          'No se detectaron filas con datos presupuestarios en el archivo. Verifique el contenido de la hoja.'
        );
      }

      onFileLoaded(budgetFile);
      setSuccessMessage(
        `¡"${budgetFile.fileName}" cargado! (${budgetFile.rowCount} partidas procesadas).`
      );

      setTimeout(() => {
        setSuccessMessage(null);
      }, 4500);
    } catch (err: any) {
      console.error('Error al procesar archivo presupuestario:', err);
      setErrorMessage(
        err?.message ||
          'Error al procesar el archivo Excel. Verifique que contenga partidas presupuestarias.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleProcessFile(selectedFile);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleProcessFile(droppedFile);
    }
  };

  const handleLoadSample = (sample: BudgetFile) => {
    const sampleCopy: BudgetFile = {
      ...sample,
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      uploadedAt: new Date().toISOString(),
    };
    onFileLoaded(sampleCopy);
    setSuccessMessage(`Muestra "${sample.fileName}" cargada.`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  return (
    <section className="bg-white border border-[#CBD5E1] rounded-lg p-3 sm:p-3.5 shadow-xs">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* Error alert if any */}
      {errorMessage && (
        <div className="mb-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-bold text-[11px]">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-800 font-bold text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success alert */}
      {successMessage && (
        <div className="mb-2.5 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-bold text-[11px]">{successMessage}</span>
        </div>
      )}

      {/* Compact Interactive Drop Row */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg px-4 py-3 cursor-pointer transition-all flex flex-col sm:flex-row items-center justify-between gap-3 ${
          isDragging
            ? 'border-[#0F172A] bg-[#F1F5F9] scale-[0.99] ring-2 ring-[#0F172A]/10'
            : 'border-[#CBD5E1] bg-[#F8FAFC] hover:bg-white hover:border-[#0F172A]'
        }`}
      >
        {isLoading ? (
          <div className="py-2 flex items-center justify-center gap-3 w-full">
            <Loader2 className="w-5 h-5 text-[#1E293B] animate-spin shrink-0" />
            <span className="text-xs font-black uppercase tracking-tight text-[#0F172A]">
              Procesando hoja de cálculo y detectando columnas presupuestarias...
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
              <div className="w-9 h-9 rounded bg-white border border-[#CBD5E1] text-[#1E293B] flex items-center justify-center shrink-0 shadow-2xs">
                <UploadCloud className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xs font-black uppercase tracking-tight text-[#0F172A]">
                    Cargar Archivo Excel Presupuestario
                  </h2>
                  <span className="text-[9px] font-mono font-bold text-[#64748B] bg-[#F1F5F9] px-1.5 py-0.2 rounded border border-[#CBD5E1]">
                    .XLSX · .XLS · .CSV
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] font-medium truncate">
                  Arrastre su archivo Excel aquí o haga clic para examinar
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0F172A] hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded transition-colors shadow-xs"
              >
                <FilePlus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Seleccionar archivo</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Compact samples strip */}
      <div className="mt-2.5 pt-2 border-t border-[#F1F5F9] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] px-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#94A3B8]">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Muestras:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {INITIAL_SAMPLE_FILES.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSample(sample);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F8FAFC] hover:bg-white border border-[#CBD5E1] hover:border-[#0F172A] rounded text-[10px] font-bold text-[#1E293B] transition-colors"
                title={`Cargar muestra ${sample.fileName}`}
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>{sample.fileName}</span>
              </button>
            ))}
          </div>
        </div>

        <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider hidden md:inline">
          Consulta independiente
        </span>
      </div>
    </section>
  );
};
