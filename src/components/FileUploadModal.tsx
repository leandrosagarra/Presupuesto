import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  FilePlus2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { parseExcelBuffer } from '../utils/excelParser';
import { BudgetFile } from '../types';
import { INITIAL_SAMPLE_FILES } from '../utils/sampleData';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileLoaded: (file: BudgetFile) => void;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onFileLoaded,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    setError(null);
    setIsLoading(true);

    try {
      // Validate file extension
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const hasValidExt = validExtensions.some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

      if (!hasValidExt) {
        throw new Error('Por favor seleccione un archivo Excel válido (.xlsx, .xls) o archivo .csv');
      }

      const buffer = await file.arrayBuffer();
      const budgetFile = parseExcelBuffer(buffer, file.name, file.size);

      if (budgetFile.rows.length === 0) {
        throw new Error('El archivo no contiene filas de datos presupuestarios.');
      }

      onFileLoaded(budgetFile);
      onClose();
    } catch (err: any) {
      console.error('Error al procesar archivo Excel:', err);
      setError(err?.message || 'Error al procesar el archivo Excel. Verifique el formato.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleProcessFile(selectedFile);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleProcessFile(droppedFile);
    }
  };

  const handleLoadSample = (sample: BudgetFile) => {
    // Generate new unique id if needed
    const sampleCopy: BudgetFile = {
      ...sample,
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      uploadedAt: new Date().toISOString(),
    };
    onFileLoaded(sampleCopy);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-lg border border-[#CBD5E1] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] bg-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1E293B] text-white rounded shadow-xs">
              <Upload className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] block">
                CARGA DE DOCUMENTO
              </span>
              <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-tight">
                Cargar Archivo Excel Presupuestario
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

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold uppercase tracking-wider text-[11px]">Error de lectura</p>
                <p className="mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Drag & Drop Box */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#1E293B] bg-[#F1F5F9] ring-2 ring-[#1E293B]/20'
                : 'border-[#CBD5E1] bg-[#F8FAFC] hover:bg-white hover:border-[#1E293B]'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />

            {isLoading ? (
              <div className="py-4 flex flex-col items-center">
                <Loader2 className="w-8 h-8 text-[#1E293B] animate-spin mb-2" />
                <p className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                  Procesando e identificando columnas del Excel...
                </p>
                <p className="text-[11px] text-[#64748B] mt-1 font-medium">
                  Leyendo registros y calculando sumatorias dinámicas...
                </p>
              </div>
            ) : (
              <div>
                <div className="w-12 h-12 rounded-full bg-white border border-[#CBD5E1] text-[#1E293B] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                  <FilePlus2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-black uppercase tracking-wider text-[#0F172A]">
                  Haga clic para seleccionar o arrastre su archivo aquí
                </p>
                <p className="text-[11px] text-[#64748B] mt-1 font-medium">
                  Formatos compatibles: <strong className="text-[#0F172A]">.xlsx</strong>, <strong className="text-[#0F172A]">.xls</strong>, <strong className="text-[#0F172A]">.csv</strong>
                </p>
                <span className="inline-block mt-3 px-4 py-2 bg-[#1E293B] text-white font-bold text-xs uppercase tracking-wider rounded shadow-xs hover:bg-black transition-colors">
                  Seleccionar archivo desde el equipo
                </span>
              </div>
            )}
          </div>

          {/* Quick sample loader */}
          <div className="pt-3 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] font-black text-[#64748B] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                O cargar archivo presupuestario de muestra 2026:
              </span>
            </div>
            <div className="space-y-1.5">
              {INITIAL_SAMPLE_FILES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleLoadSample(sample)}
                  className="w-full text-left p-2.5 bg-[#F1F5F9] hover:bg-white border border-[#E2E8F0] hover:border-[#1E293B] rounded-lg text-xs flex items-center justify-between transition-colors group shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-bold text-[#0F172A] truncate">
                      {sample.fileName}
                    </span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B] group-hover:text-[#1E293B] shrink-0 font-mono">
                    Cargar muestra →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F1F5F9] flex items-center justify-between text-xs">
          <span className="text-[#94A3B8] text-[11px] font-medium">
            Procesamiento seguro y estrictamente local en navegador.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#1E293B] bg-white border border-[#CBD5E1] rounded hover:bg-[#F8FAFC] transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
