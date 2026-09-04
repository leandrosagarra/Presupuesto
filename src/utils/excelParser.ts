import * as XLSX from 'xlsx';
import { BudgetFile, BudgetRow } from '../types';
import { normalizeHeader } from './formatters';

// Comprehensive synonyms and aliases for mapping budget columns flexibly in public finance
const HEADER_PATTERNS: Record<string, string[]> = {
  fuenteFinanciamiento: [
    'fuentefinanciamiento',
    'fuentedefinanciamiento',
    'fuentefinanc',
    'fuente',
    'ff',
    'ftefin',
    'fte',
    'fto',
    'ftefinanciamiento',
    'ftefinanc',
    'codfuente',
    'fuentedeingreso',
    'financiamiento',
    'codfte',
    'ftef',
  ],
  inciso: [
    'inciso',
    'inc',
    'incisos',
    'codinciso',
    'numinciso',
    'incisodepartida',
    'in',
  ],
  partidaPrincipal: [
    'partidaprincipal',
    'partidappal',
    'principal',
    'ppal',
    'pp',
    'pppal',
    'codprincipal',
    'partidap',
    'ppalpartida',
    'partidapp',
    'pdelgasto',
  ],
  partidaParcial: [
    'partidaparcial',
    'parcial',
    'parc',
    'par',
    'pparc',
    'pparcial',
    'codparcial',
    'partidapar',
    'partidaparc',
  ],
  partidaSubparcial: [
    'partidasubparcial',
    'subparcial',
    'subparc',
    'subpar',
    'spar',
    'subp',
    'sub',
    'psubp',
    'psubpar',
    'psubparcial',
    'codsubparcial',
    'subpartida',
  ],
  descripcion: [
    'descripcion',
    'denominacion',
    'concepto',
    'detalle',
    'nombre',
    'detalledelapartida',
    'desc',
    'glosa',
    'objeto',
    'objetodelgasto',
    'denominaciondelapartida',
    'rubro',
    'cuenta',
    'partidadescripcion',
    'textopartida',
  ],
  sancion: [
    'sancion',
    'ley',
    'creditoinicial',
    'credinicial',
    'inicial',
    'aprobado',
    'presupuestado',
    'presupuestoley',
    'creditooriginal',
    'original',
    'presupuestoinicial',
    'credley',
  ],
  vigente: [
    'vigente',
    'creditovigente',
    'credvigente',
    'modificado',
    'totalvigente',
    'actual',
    'presupuestovigente',
    'creditoactual',
    'creditototal',
    'creditoajustado',
    'presupuestoactual',
    'monto',
    'importe',
    'total',
  ],
  restringido: [
    'restringido',
    'restringida',
    'reserva',
    'bloqueado',
    'congelado',
    'restringidos',
    'creditorestringido',
    'noafectado',
  ],
  preventivo: [
    'preventivo',
    'prev',
    'compromisopreventivo',
    'etapapreventivo',
    'afectacionpreventiva',
    'afectprev',
  ],
  definitivo: [
    'definitivo',
    'compromiso',
    'compromisodefinitivo',
    'comprometido',
    'def',
    'etapacompromiso',
    'comprom',
  ],
  devengado: [
    'devengado',
    'dev',
    'ejecutado',
    'ejecucion',
    'gastodevengado',
    'devengada',
    'ejec',
  ],
};

/**
 * Parse string or number to a safe float
 */
export function parseNumberValue(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let str = String(val).trim();
  if (!str || str === '-' || str === '—' || str === 'N/A' || str === 'null') return 0;

  // Handle accounting negative format: (123.45) or ( 123,45 )
  let isNegative = false;
  if (str.startsWith('(') && str.endsWith(')')) {
    isNegative = true;
    str = str.substring(1, str.length - 1).trim();
  } else if (str.startsWith('-')) {
    isNegative = true;
    str = str.substring(1).trim();
  }

  // Remove currency symbols, non-breaking spaces and regular spaces
  str = str.replace(/[$€£\s\u00a0]/g, '');

  // Detect decimal format
  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');

  if (lastComma > lastDot) {
    // Argentine / European standard: 1.234.567,89 -> remove dots, comma to dot
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma && lastComma !== -1) {
    // US standard: 1,234,567.89 -> remove commas
    str = str.replace(/,/g, '');
  } else if (lastComma !== -1 && lastDot === -1) {
    // Single comma: e.g. "1250,50" -> replace comma with dot
    str = str.replace(',', '.');
  } else if (lastDot !== -1 && lastComma === -1) {
    // Single or multiple dots without comma:
    // Check if dot looks like thousand separator (e.g. 1.500.000 or 1.250)
    const parts = str.split('.');
    if (parts.length > 2) {
      // Multiple dots: e.g. 1.234.567 -> thousand separators
      str = str.replace(/\./g, '');
    } else if (parts.length === 2 && parts[1].length === 3 && parts[0].length >= 1) {
      // e.g. 125.000 -> thousand separator in budget context
      // But if there are no decimals, check if value is large
      const possibleThousand = parseInt(parts[0] + parts[1], 10);
      if (possibleThousand > 1000) {
        str = parts[0] + parts[1];
      }
    }
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

/**
 * Score a row based on how many budget column keywords it matches
 */
function scoreHeaderRow(row: any[]): { score: number; matches: Record<string, number> } {
  const matches: Record<string, number> = {};
  let score = 0;

  if (!Array.isArray(row)) return { score: 0, matches };

  const allPatterns = Object.entries(HEADER_PATTERNS);

  row.forEach((cell, colIdx) => {
    if (cell === null || cell === undefined) return;
    const str = String(cell).trim();
    if (!str || str.length > 80) return;

    const normalized = normalizeHeader(str);
    if (!normalized) return;

    for (const [key, patterns] of allPatterns) {
      if (patterns.includes(normalized)) {
        matches[key] = colIdx;
        score += 5;
        break;
      }
      // Substring match
      if (patterns.some(p => normalized.includes(p) && p.length >= 3)) {
        if (matches[key] === undefined) {
          matches[key] = colIdx;
          score += 2;
          break;
        }
      }
    }
  });

  return { score, matches };
}

/**
 * Check if a cell contains a compound partida code like "11-2-1-1-0" or "11.2.1.1.0" or "2.1.1"
 */
function tryParseCompoundPartida(val: any): {
  ff?: string;
  inciso?: string;
  pp?: string;
  parcial?: string;
  subparcial?: string;
} | null {
  if (!val) return null;
  const str = String(val).trim();
  // Patterns like 11-2-1-1-0, 11.2.1.1.0, 11-2-1-1, 2.1.1.0, 2-1-1
  const parts = str.split(/[-._\s/]/).filter(Boolean);
  if (parts.length >= 3 && parts.every(p => /^\d+$/.test(p))) {
    if (parts.length >= 5) {
      return {
        ff: parts[0],
        inciso: parts[1],
        pp: parts[2],
        parcial: parts[3],
        subparcial: parts[4],
      };
    } else if (parts.length === 4) {
      return {
        inciso: parts[0],
        pp: parts[1],
        parcial: parts[2],
        subparcial: parts[3],
      };
    } else if (parts.length === 3) {
      return {
        inciso: parts[0],
        pp: parts[1],
        parcial: parts[2],
      };
    }
  }
  return null;
}

/**
 * Parse an Excel or CSV file Buffer into a structured BudgetFile
 */
export function parseExcelBuffer(
  data: ArrayBuffer | Uint8Array,
  fileName: string,
  fileSize?: number
): BudgetFile {
  let workbook: XLSX.WorkBook;

  // Handle CSV detection with semicolon or comma
  const isCsv = fileName.toLowerCase().endsWith('.csv');
  if (isCsv) {
    try {
      const decoder = new TextDecoder('utf-8');
      const text = decoder.decode(data);
      // Determine if comma or semicolon is dominant in the header lines
      const firstLines = text.split(/\r?\n/).slice(0, 5).join('\n');
      const semicolonCount = (firstLines.match(/;/g) || []).length;
      const commaCount = (firstLines.match(/,/g) || []).length;
      const delimiter = semicolonCount > commaCount ? ';' : ',';

      workbook = XLSX.read(text, { type: 'string', FS: delimiter });
    } catch {
      workbook = XLSX.read(data, { type: 'array' });
    }
  } else {
    workbook = XLSX.read(data, { type: 'array' });
  }

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error('El archivo no contiene hojas de cálculo válidas.');
  }

  // Find the sheet that has the best budget content
  let bestSheetName = workbook.SheetNames[0];
  let bestScore = -1;
  let bestHeaderRowIndex = 0;
  let bestSheetDataFormatted: any[][] = [];
  let bestSheetDataRaw: any[][] = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet || !worksheet['!ref']) continue;

    const formatted2D: any[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: false,
    });

    if (!formatted2D || formatted2D.length === 0) continue;

    // Scan up to first 35 rows to find the actual header row
    const scanLimit = Math.min(35, formatted2D.length);
    for (let r = 0; r < scanLimit; r++) {
      const row = formatted2D[r];
      const { score } = scoreHeaderRow(row);
      if (score > bestScore) {
        bestScore = score;
        bestSheetName = sheetName;
        bestHeaderRowIndex = r;
      }
    }
  }

  // Load chosen sheet
  const chosenWorksheet = workbook.Sheets[bestSheetName];
  if (!chosenWorksheet) {
    throw new Error('No se pudo acceder a los datos de la hoja de cálculo.');
  }

  bestSheetDataFormatted = XLSX.utils.sheet_to_json(chosenWorksheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false,
  });

  bestSheetDataRaw = XLSX.utils.sheet_to_json(chosenWorksheet, {
    header: 1,
    defval: '',
    raw: true,
    blankrows: false,
  });

  if (!bestSheetDataFormatted || bestSheetDataFormatted.length === 0) {
    throw new Error('La hoja seleccionada está vacía.');
  }

  // If no header row had budget keywords (bestScore <= 2), find row with most non-empty text cells
  if (bestScore <= 2) {
    let maxNonEmpty = 0;
    const scanLimit = Math.min(20, bestSheetDataFormatted.length);
    for (let r = 0; r < scanLimit; r++) {
      const nonEmpties = (bestSheetDataFormatted[r] || []).filter(c => String(c).trim() !== '').length;
      if (nonEmpties > maxNonEmpty) {
        maxNonEmpty = nonEmpties;
        bestHeaderRowIndex = r;
      }
    }
  }

  const rawHeadersRow = bestSheetDataFormatted[bestHeaderRowIndex] || [];
  const headers: string[] = rawHeadersRow.map((h, i) => {
    const s = String(h).trim();
    return s || `Columna ${i + 1}`;
  });

  // Calculate column indices map for standard keys
  const colIndexMap: Record<string, number> = {};
  const mapping: Record<string, string> = {};

  // First pass: match using header row
  const { matches } = scoreHeaderRow(rawHeadersRow);
  for (const [standardKey, colIdx] of Object.entries(matches)) {
    colIndexMap[standardKey] = colIdx;
    mapping[standardKey] = headers[colIdx];
  }

  // Second pass: fallback if crucial columns are missing
  // Sample candidate data rows
  const candidateRows = bestSheetDataFormatted.slice(bestHeaderRowIndex + 1);

  // If "descripcion" is not mapped, pick the column with longest text strings
  if (colIndexMap.descripcion === undefined && headers.length > 0) {
    let longestCol = -1;
    let maxAvgLength = 0;
    for (let c = 0; c < headers.length; c++) {
      if (Object.values(colIndexMap).includes(c)) continue;
      const sampleTexts = candidateRows.slice(0, 30).map(r => String(r[c] || '').trim());
      const avgLen = sampleTexts.reduce((sum, t) => sum + t.length, 0) / (sampleTexts.length || 1);
      if (avgLen > maxAvgLength && avgLen > 5) {
        maxAvgLength = avgLen;
        longestCol = c;
      }
    }
    if (longestCol !== -1) {
      colIndexMap.descripcion = longestCol;
      mapping.descripcion = headers[longestCol];
    }
  }

  // If financial columns (vigente / devengado / sancion) are missing, find columns with high numbers
  const unmappedNumCols: number[] = [];
  for (let c = 0; c < headers.length; c++) {
    if (Object.values(colIndexMap).includes(c)) continue;
    const sampleVals = candidateRows.slice(0, 30).map(r => parseNumberValue(r[c]));
    const nonZeroCount = sampleVals.filter(v => v !== 0).length;
    if (nonZeroCount >= 3) {
      unmappedNumCols.push(c);
    }
  }

  if (colIndexMap.vigente === undefined && unmappedNumCols.length > 0) {
    const col = unmappedNumCols.shift()!;
    colIndexMap.vigente = col;
    mapping.vigente = headers[col];
  }

  if (colIndexMap.devengado === undefined && unmappedNumCols.length > 0) {
    const col = unmappedNumCols.shift()!;
    colIndexMap.devengado = col;
    mapping.devengado = headers[col];
  }

  if (colIndexMap.sancion === undefined && unmappedNumCols.length > 0) {
    const col = unmappedNumCols.shift()!;
    colIndexMap.sancion = col;
    mapping.sancion = headers[col];
  }

  // Extract data rows
  const rows: BudgetRow[] = [];
  for (let i = bestHeaderRowIndex + 1; i < bestSheetDataFormatted.length; i++) {
    const rowF = bestSheetDataFormatted[i];
    const rowR = bestSheetDataRaw[i] || [];

    if (!rowF || rowF.length === 0) continue;

    // Check if entire row is empty
    const hasAnyContent = rowF.some(c => c !== null && c !== undefined && String(c).trim() !== '');
    if (!hasAnyContent) continue;

    // Filter out obvious summary/total footer rows like "TOTAL GENERAL", "FIRMA:", etc.
    const rowString = rowF.join(' ').toLowerCase();
    if (
      (rowString.includes('total general') || rowString.includes('totales generales')) &&
      !rowString.includes('inciso')
    ) {
      continue;
    }

    const getCell = (colIdx?: number) => {
      if (colIdx === undefined || colIdx < 0) return '';
      const rawVal = rowR[colIdx];
      if (rawVal !== undefined && rawVal !== null && rawVal !== '') return rawVal;
      return rowF[colIdx] || '';
    };

    let ff = String(getCell(colIndexMap.fuenteFinanciamiento) || '').trim();
    let inciso = String(getCell(colIndexMap.inciso) || '').trim();
    let pp = String(getCell(colIndexMap.partidaPrincipal) || '').trim();
    let parcial = String(getCell(colIndexMap.partidaParcial) || '').trim();
    let subparcial = String(getCell(colIndexMap.partidaSubparcial) || '').trim();
    let descripcion = String(getCell(colIndexMap.descripcion) || '').trim();

    // Check if any column contains compound partida code like "11-2-1-1-0"
    if (!inciso || !pp) {
      for (let c = 0; c < rowF.length; c++) {
        const compound = tryParseCompoundPartida(rowF[c]);
        if (compound) {
          if (!ff && compound.ff) ff = compound.ff;
          if (!inciso && compound.inciso) inciso = compound.inciso;
          if (!pp && compound.pp) pp = compound.pp;
          if (!parcial && compound.parcial) parcial = compound.parcial;
          if (!subparcial && compound.subparcial) subparcial = compound.subparcial;
          break;
        }
      }
    }

    // Default fallback values if classifications are still missing
    if (!ff) ff = '11';
    if (!inciso) inciso = '1';
    if (!pp) pp = '1';
    if (!parcial) parcial = '0';
    if (!subparcial) subparcial = '0';

    if (!descripcion) {
      // Find first column with readable text
      for (let c = 0; c < rowF.length; c++) {
        const t = String(rowF[c] || '').trim();
        if (t.length > 2 && isNaN(Number(t))) {
          descripcion = t;
          break;
        }
      }
      if (!descripcion) {
        descripcion = `Partida ${inciso}.${pp}.${parcial}.${subparcial}`;
      }
    }

    const sancion = parseNumberValue(getCell(colIndexMap.sancion));
    const vigente = parseNumberValue(getCell(colIndexMap.vigente));
    const restringido = parseNumberValue(getCell(colIndexMap.restringido));
    const preventivo = parseNumberValue(getCell(colIndexMap.preventivo));
    const definitivo = parseNumberValue(getCell(colIndexMap.definitivo));
    const devengado = parseNumberValue(getCell(colIndexMap.devengado));

    // Construct raw record map for complete preservation
    const rawRecord: Record<string, any> = {};
    headers.forEach((h, idx) => {
      rawRecord[h] = rowF[idx] !== undefined ? rowF[idx] : '';
    });

    rows.push({
      id: `row-${rows.length + 1}`,
      fuenteFinanciamiento: ff,
      inciso,
      partidaPrincipal: pp,
      partidaParcial: parcial,
      partidaSubparcial: subparcial,
      descripcion,
      sancion: sancion || (vigente > 0 ? vigente : 0),
      vigente: vigente || sancion || devengado || 0,
      restringido,
      preventivo,
      definitivo: definitivo || devengado || 0,
      devengado,
      raw: rawRecord,
    });
  }

  if (rows.length === 0) {
    throw new Error('No se encontraron filas con datos presupuestarios en el archivo seleccionado.');
  }

  return {
    id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    fileName,
    uploadedAt: new Date().toISOString(),
    rowCount: rows.length,
    headers,
    columnMapping: mapping,
    rows,
    fileSize: fileSize || (data instanceof ArrayBuffer ? data.byteLength : data.length),
  };
}

/**
 * Export filtered rows to XLSX
 */
export function exportRowsToExcel(rows: BudgetRow[], fileName: string) {
  const exportData = rows.map(r => ({
    'FUENTE FINANCIAMIENTO': r.fuenteFinanciamiento,
    'INCISO': r.inciso,
    'PARTIDA PRINCIPAL': r.partidaPrincipal,
    'PARTIDA PARCIAL': r.partidaParcial,
    'PARTIDA SUBPARCIAL': r.partidaSubparcial,
    'DESCRIPCIÓN': r.descripcion,
    'SANCIÓN': r.sancion,
    'VIGENTE': r.vigente,
    'RESTRINGIDO': r.restringido,
    'PREVENTIVO': r.preventivo,
    'DEFINITIVO': r.definitivo,
    'DEVENGADO': r.devengado,
    ...r.raw,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Detalle Presupuestario');
  XLSX.writeFile(workbook, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
}
