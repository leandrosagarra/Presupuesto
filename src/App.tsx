import React, { useState, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { DynamicEconomicCards } from './components/DynamicEconomicCards';
import { HierarchyBreadcrumb } from './components/HierarchyBreadcrumb';
import { HierarchyNavigator } from './components/HierarchyNavigator';
import { GlobalBudgetSearch } from './components/GlobalBudgetSearch';
import { FilesHistory } from './components/FilesHistory';
import { BudgetTable } from './components/BudgetTable';
import { FileUploadModal } from './components/FileUploadModal';
import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';
import { BudgetFile } from './types';
import {
  HierarchyPath,
  buildBudgetHierarchy,
  EconomicTotals,
} from './utils/budgetHierarchy';
import { INITIAL_SAMPLE_FILES } from './utils/sampleData';
import { parseExcelBuffer } from './utils/excelParser';

export default function App() {
  // Loaded budget files collection
  const [files, setFiles] = useState<BudgetFile[]>(INITIAL_SAMPLE_FILES);
  const [activeFileId, setActiveFileId] = useState<string>(
    INITIAL_SAMPLE_FILES[0]?.id || ''
  );

  // View state: 'hierarchy' (default primary) or 'table' (secondary)
  const [currentView, setCurrentView] = useState<'hierarchy' | 'table'>('hierarchy');

  // Hierarchy navigation path state
  const [hierarchyPath, setHierarchyPath] = useState<HierarchyPath>({});

  // Search filter for full table view
  const [tableSearchTerm, setTableSearchTerm] = useState<string>('');

  // Modals & Notifications
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [globalNotification, setGlobalNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Current active file
  const activeFile = useMemo(() => {
    return files.find((f) => f.id === activeFileId) || files[0] || null;
  }, [files, activeFileId]);

  // Build the hierarchical tree avoiding double counting
  const hierarchyTree = useMemo(() => {
    if (!activeFile) {
      return buildBudgetHierarchy([]);
    }
    return buildBudgetHierarchy(activeFile.rows);
  }, [activeFile]);

  // Switch active file handler
  const handleSelectFile = useCallback(
    (newFileId: string) => {
      if (newFileId === activeFileId) return;
      setActiveFileId(newFileId);
      // Reset hierarchy path when switching file to view its root
      setHierarchyPath({});
      setTableSearchTerm('');
    },
    [activeFileId]
  );

  // Remove file from history
  const handleRemoveFile = useCallback(
    (fileIdToRemove: string) => {
      setFiles((prev) => {
        const remaining = prev.filter((f) => f.id !== fileIdToRemove);
        if (activeFileId === fileIdToRemove) {
          const nextActive = remaining[0]?.id || '';
          setActiveFileId(nextActive);
          setHierarchyPath({});
        }
        return remaining;
      });
    },
    [activeFileId]
  );

  // Add newly uploaded file
  const handleFileLoaded = useCallback((newFile: BudgetFile) => {
    setFiles((prev) => [newFile, ...prev]);
    setActiveFileId(newFile.id);
    setHierarchyPath({});
    setCurrentView('hierarchy');
    setGlobalNotification({
      type: 'success',
      message: `Archivo "${newFile.fileName}" cargado exitosamente (${newFile.rowCount} registros presupuestarios procesados).`,
    });
    setTimeout(() => setGlobalNotification(null), 5000);
  }, []);

  // Global Drag and drop file upload
  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragging(true);
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsGlobalDragging(false);
  };

  const handleGlobalDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;

    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some((ext) =>
      droppedFile.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setGlobalNotification({
        type: 'error',
        message: 'Por favor arrastre un archivo Excel (.xlsx, .xls) o archivo .csv válido.',
      });
      setTimeout(() => setGlobalNotification(null), 4000);
      return;
    }

    try {
      const buffer = await droppedFile.arrayBuffer();
      const budgetFile = parseExcelBuffer(buffer, droppedFile.name, droppedFile.size);
      handleFileLoaded(budgetFile);
    } catch (err: any) {
      setGlobalNotification({
        type: 'error',
        message: err?.message || 'Error al procesar el archivo presupuestario.',
      });
      setTimeout(() => setGlobalNotification(null), 5000);
    }
  };

  // Determine current node in hierarchy and its totals for the 6 dynamic cards
  const selectedFuente = hierarchyTree.fuentes.find((f) => f.code === hierarchyPath.fuente);
  const selectedInciso = selectedFuente?.incisos.find((i) => i.code === hierarchyPath.inciso);
  const selectedPrincipal = selectedInciso?.principales.find((p) => p.code === hierarchyPath.principal);
  const selectedParcial = selectedPrincipal?.parciales.find((p) => p.code === hierarchyPath.parcial);
  const selectedSubparcial = selectedParcial?.subparciales.find((s) => s.code === hierarchyPath.subparcial);

  const { currentTotals, levelTitle } = useMemo((): {
    currentTotals: EconomicTotals;
    levelTitle: string;
  } => {
    if (selectedSubparcial) {
      return {
        currentTotals: selectedSubparcial.totals,
        levelTitle: `Subparcial ${selectedSubparcial.code} — ${selectedSubparcial.descripcion}`,
      };
    }
    if (selectedParcial) {
      return {
        currentTotals: selectedParcial.totals,
        levelTitle: `Partida Parcial ${selectedParcial.code} — ${selectedParcial.descripcion}`,
      };
    }
    if (selectedPrincipal) {
      return {
        currentTotals: selectedPrincipal.totals,
        levelTitle: `Partida Principal ${selectedPrincipal.code} — ${selectedPrincipal.descripcion}`,
      };
    }
    if (selectedInciso) {
      return {
        currentTotals: selectedInciso.totals,
        levelTitle: `Inciso ${selectedInciso.code} — ${selectedInciso.descripcion}`,
      };
    }
    if (selectedFuente) {
      return {
        currentTotals: selectedFuente.totals,
        levelTitle: `Fuente ${selectedFuente.code} — ${selectedFuente.descripcion}`,
      };
    }
    return {
      currentTotals: hierarchyTree.globalTotals,
      levelTitle: 'Presupuesto Consolidado · Total General del Archivo',
    };
  }, [
    selectedSubparcial,
    selectedParcial,
    selectedPrincipal,
    selectedInciso,
    selectedFuente,
    hierarchyTree.globalTotals,
  ]);

  return (
    <div
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
      className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans selection:bg-[#0F172A] selection:text-white relative"
    >
      {/* Global Drag Overlay */}
      {isGlobalDragging && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/85 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-white text-center pointer-events-none animate-in fade-in duration-100">
          <div className="p-8 bg-white/10 rounded-2xl border-3 border-dashed border-emerald-400 max-w-lg w-full flex flex-col items-center shadow-2xl">
            <UploadCloud className="w-16 h-16 text-emerald-400 animate-bounce mb-3" />
            <h3 className="text-2xl font-black uppercase tracking-tight text-white">
              Suelte su archivo Excel o CSV aquí
            </h3>
            <p className="text-xs text-emerald-200 mt-2 font-bold font-mono">
              Formatos compatibles: .XLSX · .XLS · .CSV
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Reconstrucción automática de la jerarquía presupuestaria
            </p>
          </div>
        </div>
      )}

      {/* Global Toast Notification */}
      {globalNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-3 duration-200">
          <div
            className={`p-4 rounded-xl border shadow-xl flex items-start gap-3 ${
              globalNotification.type === 'success'
                ? 'bg-[#0F172A] border-emerald-500 text-white'
                : 'bg-rose-900 border-rose-400 text-white'
            }`}
          >
            {globalNotification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-300 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <p className="font-bold">{globalNotification.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setGlobalNotification(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 1. ENCABEZADO */}
      <Header
        activeFile={activeFile}
        onOpenUpload={() => setIsUploadOpen(true)}
        currentView={currentView}
        onToggleView={(v) => setCurrentView(v)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* BUSCADOR GENERAL */}
        <GlobalBudgetSearch
          tree={hierarchyTree}
          onNavigate={(path) => {
            setHierarchyPath(path);
            setCurrentView('hierarchy');
          }}
        />

        {/* RESUMEN ECONÓMICO DINÁMICO (6 TARJETAS) */}
        <DynamicEconomicCards
          totals={currentTotals}
          path={hierarchyPath}
          levelTitle={levelTitle}
          hasAggregatesDetected={hierarchyTree.hasAggregatesDetected}
        />

        {/* MAIN BODY: HIERARCHICAL NAVIGATION (PRIMARY) VS FULL TABLE (SECONDARY) */}
        {currentView === 'hierarchy' ? (
          <div className="space-y-4">
            {/* Interactive Breadcrumb Navigation Path */}
            <HierarchyBreadcrumb
              path={hierarchyPath}
              onNavigate={(newPath) => setHierarchyPath(newPath)}
              fuenteDesc={selectedFuente?.descripcion}
              incisoDesc={selectedInciso?.descripcion}
              principalDesc={selectedPrincipal?.descripcion}
              parcialDesc={selectedParcial?.descripcion}
              subparcialDesc={selectedSubparcial?.descripcion}
            />

            {/* Hierarchical Levels (Nivel 1 al 5) */}
            <HierarchyNavigator
              tree={hierarchyTree}
              path={hierarchyPath}
              onNavigate={(newPath) => setHierarchyPath(newPath)}
            />
          </div>
        ) : (
          /* VISTA TABLA COMPLETA */
          activeFile && (
            <BudgetTable
              rows={activeFile.rows}
              activeFile={activeFile}
              searchTerm={tableSearchTerm}
              onSearchChange={setTableSearchTerm}
              onBackToHierarchy={() => setCurrentView('hierarchy')}
            />
          )
        )}

        {/* SECCIÓN ARCHIVOS (HISTORIAL PERMANENTE) */}
        <FilesHistory
          files={files}
          activeFileId={activeFileId}
          onSelectFile={handleSelectFile}
          onRemoveFile={handleRemoveFile}
          onUploadClick={() => setIsUploadOpen(true)}
        />
      </main>

      {/* Upload Modal */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onFileLoaded={handleFileLoaded}
      />

      {/* Institutional Footer */}
      <footer className="bg-white border-t border-[#CBD5E1] py-5 mt-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-2">
          <p className="font-black tracking-tight text-[#0F172A] uppercase">
            PRESUPUESTO · LISTADO DE CRÉDITOS AÑO 2026
          </p>
          <p className="text-[#64748B] text-[11px] font-mono font-medium">
            Visualizador jerárquico presupuestario institucional
          </p>
        </div>
      </footer>
    </div>
  );
}
