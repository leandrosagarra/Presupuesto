import React from 'react';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { HierarchyPath } from '../utils/budgetHierarchy';

interface HierarchyBreadcrumbProps {
  path: HierarchyPath;
  onNavigate: (newPath: HierarchyPath) => void;
  fuenteDesc?: string;
  incisoDesc?: string;
  principalDesc?: string;
  parcialDesc?: string;
  subparcialDesc?: string;
}

export const HierarchyBreadcrumb: React.FC<HierarchyBreadcrumbProps> = ({
  path,
  onNavigate,
  fuenteDesc,
  incisoDesc,
  principalDesc,
  parcialDesc,
  subparcialDesc,
}) => {
  const isAtRoot = !path.fuente;

  const handleGoBackOneLevel = () => {
    if (path.subparcial) {
      onNavigate({ ...path, subparcial: undefined });
    } else if (path.parcial) {
      onNavigate({ ...path, parcial: undefined });
    } else if (path.principal) {
      onNavigate({ ...path, principal: undefined });
    } else if (path.inciso) {
      onNavigate({ ...path, inciso: undefined });
    } else if (path.fuente) {
      onNavigate({});
    }
  };

  return (
    <nav className="bg-white border border-[#CBD5E1] rounded-lg px-3.5 py-2.5 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
      <div className="flex items-center flex-wrap gap-1.5 text-xs">
        {/* Step 0: Inicio */}
        <button
          type="button"
          onClick={() => onNavigate({})}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-bold transition-colors ${
            isAtRoot
              ? 'bg-[#0F172A] text-white shadow-2xs'
              : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
          }`}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Inicio</span>
        </button>

        {/* Step 1: Fuente */}
        {path.fuente && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <button
              type="button"
              onClick={() => onNavigate({ fuente: path.fuente })}
              className={`px-2.5 py-1 rounded font-bold transition-colors max-w-xs truncate ${
                !path.inciso
                  ? 'bg-[#0F172A] text-white shadow-2xs'
                  : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
              title={fuenteDesc}
            >
              Fuente {path.fuente}
            </button>
          </>
        )}

        {/* Step 2: Inciso */}
        {path.fuente && path.inciso && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <button
              type="button"
              onClick={() => onNavigate({ fuente: path.fuente, inciso: path.inciso })}
              className={`px-2.5 py-1 rounded font-bold transition-colors max-w-xs truncate ${
                !path.principal
                  ? 'bg-[#0F172A] text-white shadow-2xs'
                  : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
              title={incisoDesc}
            >
              Inciso {path.inciso}
            </button>
          </>
        )}

        {/* Step 3: Partida Principal */}
        {path.fuente && path.inciso && path.principal && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <button
              type="button"
              onClick={() =>
                onNavigate({
                  fuente: path.fuente,
                  inciso: path.inciso,
                  principal: path.principal,
                })
              }
              className={`px-2.5 py-1 rounded font-bold transition-colors max-w-xs truncate ${
                !path.parcial
                  ? 'bg-[#0F172A] text-white shadow-2xs'
                  : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
              title={principalDesc}
            >
              Partida Principal {path.principal}
            </button>
          </>
        )}

        {/* Step 4: Partida Parcial */}
        {path.fuente && path.inciso && path.principal && path.parcial && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <button
              type="button"
              onClick={() =>
                onNavigate({
                  fuente: path.fuente,
                  inciso: path.inciso,
                  principal: path.principal,
                  parcial: path.parcial,
                })
              }
              className={`px-2.5 py-1 rounded font-bold transition-colors max-w-xs truncate ${
                !path.subparcial
                  ? 'bg-[#0F172A] text-white shadow-2xs'
                  : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
              }`}
              title={parcialDesc}
            >
              Partida Parcial {path.parcial}
            </button>
          </>
        )}

        {/* Step 5: Subparcial */}
        {path.fuente && path.inciso && path.principal && path.parcial && path.subparcial && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
            <span
              className="px-2.5 py-1 rounded font-bold bg-[#0F172A] text-white shadow-2xs max-w-xs truncate"
              title={subparcialDesc}
            >
              Subparcial {path.subparcial}
            </span>
          </>
        )}
      </div>

      {/* Back button */}
      {!isAtRoot && (
        <button
          type="button"
          onClick={handleGoBackOneLevel}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-[#475569] hover:text-[#0F172A] bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#CBD5E1] rounded transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver un nivel</span>
        </button>
      )}
    </nav>
  );
};
