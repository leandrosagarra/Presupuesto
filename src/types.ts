export type ClassificationKey =
  | 'fuenteFinanciamiento'
  | 'inciso'
  | 'partidaPrincipal'
  | 'partidaParcial'
  | 'partidaSubparcial'
  | 'descripcion';

export type MonetaryKey =
  | 'sancion'
  | 'vigente'
  | 'restringido'
  | 'preventivo'
  | 'definitivo'
  | 'devengado';

export type StandardColumnKey = ClassificationKey | MonetaryKey;

export interface ColumnDefinition {
  key: string;
  label: string;
  isMonetary?: boolean;
  isClassification?: boolean;
  originalHeader: string;
}

export interface BudgetRow {
  id: string;
  // Standardized keys
  fuenteFinanciamiento: string;
  inciso: string;
  partidaPrincipal: string;
  partidaParcial: string;
  partidaSubparcial: string;
  descripcion: string;
  
  // Monetary values (parsed as numbers)
  sancion: number;
  vigente: number;
  restringido: number;
  preventivo: number;
  definitivo: number;
  devengado: number;

  // Raw row data preservation for any extra columns from original Excel
  raw: Record<string, any>;
}

export interface BudgetFile {
  id: string;
  fileName: string;
  uploadedAt: string; // ISO date or formatted
  rowCount: number;
  headers: string[]; // Original headers in original order
  columnMapping: Record<string, string>; // maps standard key -> original header
  rows: BudgetRow[];
  fileSize?: number;
}

export interface FilterState {
  fuenteFinanciamiento?: string;
  inciso?: string;
  partidaPrincipal?: string;
  partidaParcial?: string;
  partidaSubparcial?: string;
  descripcion?: string;
  searchTerm?: string;
  // Specific column filter if any
  monetaryFilter?: {
    field: MonetaryKey;
    min?: number;
    max?: number;
  };
}

export interface ColumnValueStat {
  value: string;
  count: number;
  totalVigente: number;
  totalDevengado: number;
  percentageCount: number;
}

export interface MonetaryBreakdownItem {
  id: string;
  descripcion: string;
  inciso: string;
  partidaPrincipal: string;
  amount: number;
  percentageOfTotal: number;
  vigente: number;
}
