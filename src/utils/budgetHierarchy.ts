import { BudgetRow } from '../types';

export const STANDARD_INCISOS: Record<string, string> = {
  '1': 'Gastos en Personal',
  '2': 'Bienes de Consumo',
  '3': 'Servicios No Personales',
  '4': 'Bienes de Uso',
  '5': 'Transferencias',
  '6': 'Activos Financieros',
  '7': 'Servicio de la Deuda y Disminución de Otros Pasivos',
  '8': 'Otros Gastos',
  '9': 'Gastos Figurativos',
};

export const STANDARD_FUENTES: Record<string, string> = {
  '11': 'Tesoro Provincial / Nacional (Recursos del Tesoro)',
  '12': 'Recursos Propios',
  '13': 'Recursos con Afectación Específica',
  '14': 'Transferencias Internas',
  '15': 'Crédito Interno',
  '21': 'Transferencias Externas',
  '22': 'Crédito Externo',
};

export interface EconomicTotals {
  sancion: number;
  vigente: number;
  restringido: number;
  preventivo: number;
  definitivo: number;
  devengado: number;
  rowCount: number;
  leafCount: number;
}

export interface SubparcialNode {
  code: string;
  fullCode: string; // e.g. "11-1-1-1-1"
  descripcion: string;
  totals: EconomicTotals;
  rows: BudgetRow[];
  fuenteCode: string;
  incisoCode: string;
  principalCode: string;
  parcialCode: string;
}

export interface ParcialNode {
  code: string;
  fullCode: string; // e.g. "11-1-1-1"
  descripcion: string;
  totals: EconomicTotals;
  subparciales: SubparcialNode[];
  rows: BudgetRow[];
  fuenteCode: string;
  incisoCode: string;
  principalCode: string;
}

export interface PrincipalNode {
  code: string;
  fullCode: string; // e.g. "11-1-1"
  descripcion: string;
  totals: EconomicTotals;
  parciales: ParcialNode[];
  rows: BudgetRow[];
  fuenteCode: string;
  incisoCode: string;
}

export interface IncisoNode {
  code: string;
  fullCode: string; // e.g. "11-1"
  descripcion: string;
  totals: EconomicTotals;
  principales: PrincipalNode[];
  rows: BudgetRow[];
  fuenteCode: string;
}

export interface FuenteNode {
  code: string;
  fullCode: string; // e.g. "11"
  descripcion: string;
  totals: EconomicTotals;
  incisos: IncisoNode[];
  rows: BudgetRow[];
}

export interface HierarchyTree {
  fuentes: FuenteNode[];
  globalTotals: EconomicTotals;
  totalRows: number;
  totalLeaves: number;
  hasAggregatesDetected: boolean;
}

export interface HierarchyPath {
  fuente?: string;
  inciso?: string;
  principal?: string;
  parcial?: string;
  subparcial?: string;
}

export interface SearchMatch {
  id: string;
  type: 'fuente' | 'inciso' | 'principal' | 'parcial' | 'subparcial' | 'row';
  title: string;
  code: string;
  fullCode: string;
  descripcion: string;
  vigente: number;
  devengado: number;
  path: HierarchyPath;
  breadcrumbsText: string;
}

/**
 * Clean and normalize a code string (e.g. '01' -> '1', ' 11 ' -> '11')
 */
export function normalizeCode(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  // If it's a numeric string like "01" or "00", normalize but keep '0' if it is zero
  if (/^\d+$/.test(str)) {
    const num = parseInt(str, 10);
    return String(num);
  }
  return str;
}

function createEmptyTotals(): EconomicTotals {
  return {
    sancion: 0,
    vigente: 0,
    restringido: 0,
    preventivo: 0,
    definitivo: 0,
    devengado: 0,
    rowCount: 0,
    leafCount: 0,
  };
}

function addRowToTotals(totals: EconomicTotals, row: BudgetRow) {
  totals.sancion += row.sancion || 0;
  totals.vigente += row.vigente || 0;
  totals.restringido += row.restringido || 0;
  totals.preventivo += row.preventivo || 0;
  totals.definitivo += row.definitivo || 0;
  totals.devengado += row.devengado || 0;
  totals.rowCount += 1;
}

/**
 * Builds a strict hierarchical tree while eliminating double counting.
 *
 * In budget spreadsheets, rows can be:
 * 1) Detail leaves (atomic items with actual budget credit)
 * 2) Summary rows (e.g. a row for Principal 1 with parcial="0" whose amount
 *    is the sum of parciales 1, 2, 5, 6).
 *
 * Algorithm:
 * - Identifies all branches down to the finest granularity present.
 * - If a parent node (e.g., PP 1) has child rows (parciales 1, 2...) with amounts,
 *   any sibling row representing the parent summary (e.g. parcial '0' with matching total)
 *   is flagged as an aggregate row and excluded from leaf sums.
 * - Economic totals at every level are strictly aggregated from leaf rows.
 */
export function buildBudgetHierarchy(rows: BudgetRow[]): HierarchyTree {
  if (!rows || rows.length === 0) {
    return {
      fuentes: [],
      globalTotals: createEmptyTotals(),
      totalRows: 0,
      totalLeaves: 0,
      hasAggregatesDetected: false,
    };
  }

  // Pre-process rows with normalized codes
  interface ProcessedRow {
    row: BudgetRow;
    ff: string;
    inciso: string;
    pp: string;
    parcial: string;
    subparcial: string;
    isZeroOrBlankParcial: boolean;
    isZeroOrBlankSubparcial: boolean;
    isLeaf: boolean;
  }

  const processed: ProcessedRow[] = rows.map((r) => {
    const ff = normalizeCode(r.fuenteFinanciamiento) || '11';
    const inciso = normalizeCode(r.inciso) || '1';
    const pp = normalizeCode(r.partidaPrincipal) || '1';
    const parcial = normalizeCode(r.partidaParcial) || '0';
    const subparcial = normalizeCode(r.partidaSubparcial) || '0';

    const isZeroOrBlankParcial = parcial === '0' || parcial === '';
    const isZeroOrBlankSubparcial = subparcial === '0' || subparcial === '';

    return {
      row: r,
      ff,
      inciso,
      pp,
      parcial,
      subparcial,
      isZeroOrBlankParcial,
      isZeroOrBlankSubparcial,
      isLeaf: true, // will be refined below
    };
  });

  // Step 1: Detect double counting candidates
  // Group by (ff, inciso, pp)
  let aggregatesDetected = false;
  const ppGroups = new Map<string, ProcessedRow[]>();

  for (const pr of processed) {
    const key = `${pr.ff}-${pr.inciso}-${pr.pp}`;
    if (!ppGroups.has(key)) {
      ppGroups.set(key, []);
    }
    ppGroups.get(key)!.push(pr);
  }

  for (const [, group] of ppGroups) {
    // Check if there are non-zero parcial rows
    const explicitParcialRows = group.filter((g) => !g.isZeroOrBlankParcial);
    const summaryCandidates = group.filter((g) => g.isZeroOrBlankParcial && g.isZeroOrBlankSubparcial);

    if (explicitParcialRows.length > 0 && summaryCandidates.length > 0) {
      const explicitSumVigente = explicitParcialRows.reduce((acc, g) => acc + (g.row.vigente || 0), 0);
      for (const summaryRow of summaryCandidates) {
        const summaryVigente = summaryRow.row.vigente || 0;
        // If the summary row equals the sum of children or is marked as general header
        if (summaryVigente > 0 && Math.abs(summaryVigente - explicitSumVigente) < Math.max(1, explicitSumVigente * 0.05)) {
          summaryRow.isLeaf = false;
          aggregatesDetected = true;
        } else if (summaryVigente === 0 && explicitSumVigente > 0) {
          summaryRow.isLeaf = false;
        }
      }
    }

    // Also check within each parcial for subparcial summaries
    const parcialGroups = new Map<string, ProcessedRow[]>();
    for (const pr of group) {
      if (!pr.isLeaf) continue;
      const pKey = pr.parcial;
      if (!parcialGroups.has(pKey)) {
        parcialGroups.set(pKey, []);
      }
      parcialGroups.get(pKey)!.push(pr);
    }

    for (const [, pGroup] of parcialGroups) {
      const explicitSubparcialRows = pGroup.filter((g) => !g.isZeroOrBlankSubparcial);
      const subSummaryCandidates = pGroup.filter((g) => g.isZeroOrBlankSubparcial);

      if (explicitSubparcialRows.length > 0 && subSummaryCandidates.length > 0) {
        const explicitSumVigente = explicitSubparcialRows.reduce((acc, g) => acc + (g.row.vigente || 0), 0);
        for (const subSumRow of subSummaryCandidates) {
          const sumVigente = subSumRow.row.vigente || 0;
          if (sumVigente > 0 && Math.abs(sumVigente - explicitSumVigente) < Math.max(1, explicitSumVigente * 0.05)) {
            subSumRow.isLeaf = false;
            aggregatesDetected = true;
          } else if (sumVigente === 0 && explicitSumVigente > 0) {
            subSumRow.isLeaf = false;
          }
        }
      }
    }
  }

  // Step 2: Build the tree structure
  const fuentesMap = new Map<string, FuenteNode>();

  for (const pr of processed) {
    const { ff, inciso, pp, parcial, subparcial, row, isLeaf } = pr;

    // 1. Fuente
    if (!fuentesMap.has(ff)) {
      fuentesMap.set(ff, {
        code: ff,
        fullCode: `Fuente ${ff}`,
        descripcion: STANDARD_FUENTES[ff] || `Fuente de Financiamiento ${ff}`,
        totals: createEmptyTotals(),
        incisos: [],
        rows: [],
      });
    }
    const fuenteNode = fuentesMap.get(ff)!;
    fuenteNode.rows.push(row);
    if (isLeaf) {
      addRowToTotals(fuenteNode.totals, row);
      fuenteNode.totals.leafCount += 1;
    }

    // 2. Inciso
    let incisoNode = fuenteNode.incisos.find((i) => i.code === inciso);
    if (!incisoNode) {
      let desc = STANDARD_INCISOS[inciso] || '';
      // If row description has inciso info or if not standard
      if (!desc) {
        desc = `Inciso ${inciso}`;
      }
      incisoNode = {
        code: inciso,
        fullCode: `${ff}-${inciso}`,
        descripcion: desc,
        totals: createEmptyTotals(),
        principales: [],
        rows: [],
        fuenteCode: ff,
      };
      fuenteNode.incisos.push(incisoNode);
    }
    incisoNode.rows.push(row);
    if (isLeaf) {
      addRowToTotals(incisoNode.totals, row);
      incisoNode.totals.leafCount += 1;
    }

    // 3. Principal
    let principalNode = incisoNode.principales.find((p) => p.code === pp);
    if (!principalNode) {
      let ppDesc = '';
      // If row is at PP level or has a clear name
      if (pr.isZeroOrBlankParcial && pr.isZeroOrBlankSubparcial && row.descripcion) {
        ppDesc = row.descripcion;
      } else if (row.descripcion && !row.descripcion.toLowerCase().includes('inciso')) {
        ppDesc = row.descripcion;
      } else {
        ppDesc = `Partida Principal ${pp}`;
      }
      principalNode = {
        code: pp,
        fullCode: `${ff}-${inciso}-${pp}`,
        descripcion: ppDesc,
        totals: createEmptyTotals(),
        parciales: [],
        rows: [],
        fuenteCode: ff,
        incisoCode: inciso,
      };
      incisoNode.principales.push(principalNode);
    }
    // Update PP description if a better one comes from an aggregate or first row
    if (
      (!principalNode.descripcion || principalNode.descripcion.startsWith('Partida Principal')) &&
      row.descripcion &&
      pr.isZeroOrBlankParcial
    ) {
      principalNode.descripcion = row.descripcion;
    }
    principalNode.rows.push(row);
    if (isLeaf) {
      addRowToTotals(principalNode.totals, row);
      principalNode.totals.leafCount += 1;
    }

    // 4. Parcial
    let parcialNode = principalNode.parciales.find((p) => p.code === parcial);
    if (!parcialNode) {
      let pDesc = row.descripcion || `Partida Parcial ${parcial}`;
      parcialNode = {
        code: parcial,
        fullCode: `${ff}-${inciso}-${pp}-${parcial}`,
        descripcion: pDesc,
        totals: createEmptyTotals(),
        subparciales: [],
        rows: [],
        fuenteCode: ff,
        incisoCode: inciso,
        principalCode: pp,
      };
      principalNode.parciales.push(parcialNode);
    }
    if (
      (!parcialNode.descripcion || parcialNode.descripcion.startsWith('Partida Parcial')) &&
      row.descripcion
    ) {
      parcialNode.descripcion = row.descripcion;
    }
    parcialNode.rows.push(row);
    if (isLeaf) {
      addRowToTotals(parcialNode.totals, row);
      parcialNode.totals.leafCount += 1;
    }

    // 5. Subparcial
    let subparcialNode = parcialNode.subparciales.find((s) => s.code === subparcial);
    if (!subparcialNode) {
      subparcialNode = {
        code: subparcial,
        fullCode: `${ff}-${inciso}-${pp}-${parcial}-${subparcial}`,
        descripcion: row.descripcion || `Subparcial ${subparcial}`,
        totals: createEmptyTotals(),
        rows: [],
        fuenteCode: ff,
        incisoCode: inciso,
        principalCode: pp,
        parcialCode: parcial,
      };
      parcialNode.subparciales.push(subparcialNode);
    }
    subparcialNode.rows.push(row);
    if (isLeaf) {
      addRowToTotals(subparcialNode.totals, row);
      subparcialNode.totals.leafCount += 1;
    }
  }

  // Sort nodes naturally
  const fuentes = Array.from(fuentesMap.values()).sort((a, b) => {
    const na = parseInt(a.code, 10);
    const nb = parseInt(b.code, 10);
    return isNaN(na) || isNaN(nb) ? a.code.localeCompare(b.code) : na - nb;
  });

  for (const f of fuentes) {
    f.incisos.sort((a, b) => parseInt(a.code, 10) - parseInt(b.code, 10));
    for (const inc of f.incisos) {
      inc.principales.sort((a, b) => parseInt(a.code, 10) - parseInt(b.code, 10));
      for (const pp of inc.principales) {
        pp.parciales.sort((a, b) => parseInt(a.code, 10) - parseInt(b.code, 10));
        for (const parc of pp.parciales) {
          parc.subparciales.sort((a, b) => parseInt(a.code, 10) - parseInt(b.code, 10));
        }
      }
    }
  }

  // Global totals from all non-duplicated leaf rows
  const globalTotals = createEmptyTotals();
  let totalLeaves = 0;
  for (const pr of processed) {
    if (pr.isLeaf) {
      addRowToTotals(globalTotals, pr.row);
      totalLeaves += 1;
    }
  }

  return {
    fuentes,
    globalTotals,
    totalRows: rows.length,
    totalLeaves,
    hasAggregatesDetected: aggregatesDetected,
  };
}

/**
 * Searches the entire hierarchy by keyword or code
 */
export function searchHierarchy(
  tree: HierarchyTree,
  query: string,
  maxResults: number = 25
): SearchMatch[] {
  if (!query || query.trim().length === 0) return [];
  const q = query.trim().toLowerCase();
  const results: SearchMatch[] = [];

  const matchesText = (text: string) => text.toLowerCase().includes(q);

  for (const f of tree.fuentes) {
    // Check Fuente
    if (matchesText(f.code) || matchesText(f.descripcion) || matchesText(`fuente ${f.code}`)) {
      results.push({
        id: `f-${f.code}`,
        type: 'fuente',
        title: `Fuente ${f.code}`,
        code: f.code,
        fullCode: f.fullCode,
        descripcion: f.descripcion,
        vigente: f.totals.vigente,
        devengado: f.totals.devengado,
        path: { fuente: f.code },
        breadcrumbsText: `Fuente ${f.code}`,
      });
    }

    for (const inc of f.incisos) {
      // Check Inciso
      if (
        matchesText(inc.code) ||
        matchesText(inc.descripcion) ||
        matchesText(`inciso ${inc.code}`) ||
        matchesText(`${f.code}-${inc.code}`)
      ) {
        results.push({
          id: `inc-${f.code}-${inc.code}`,
          type: 'inciso',
          title: `Inciso ${inc.code}`,
          code: inc.code,
          fullCode: inc.fullCode,
          descripcion: inc.descripcion,
          vigente: inc.totals.vigente,
          devengado: inc.totals.devengado,
          path: { fuente: f.code, inciso: inc.code },
          breadcrumbsText: `Fuente ${f.code} › Inciso ${inc.code}`,
        });
      }

      for (const pp of inc.principales) {
        // Check Principal
        if (
          matchesText(pp.code) ||
          matchesText(pp.descripcion) ||
          matchesText(`pp ${pp.code}`) ||
          matchesText(`principal ${pp.code}`) ||
          matchesText(`${f.code}-${inc.code}-${pp.code}`)
        ) {
          results.push({
            id: `pp-${f.code}-${inc.code}-${pp.code}`,
            type: 'principal',
            title: `Partida Principal ${pp.code}`,
            code: pp.code,
            fullCode: pp.fullCode,
            descripcion: pp.descripcion,
            vigente: pp.totals.vigente,
            devengado: pp.totals.devengado,
            path: { fuente: f.code, inciso: inc.code, principal: pp.code },
            breadcrumbsText: `Fuente ${f.code} › Inciso ${inc.code} › PP ${pp.code}`,
          });
        }

        for (const parc of pp.parciales) {
          // Check Parcial
          if (
            matchesText(parc.code) ||
            matchesText(parc.descripcion) ||
            matchesText(`parcial ${parc.code}`) ||
            matchesText(`${f.code}-${inc.code}-${pp.code}-${parc.code}`)
          ) {
            results.push({
              id: `parc-${f.code}-${inc.code}-${pp.code}-${parc.code}`,
              type: 'parcial',
              title: `Partida Parcial ${parc.code}`,
              code: parc.code,
              fullCode: parc.fullCode,
              descripcion: parc.descripcion,
              vigente: parc.totals.vigente,
              devengado: parc.totals.devengado,
              path: {
                fuente: f.code,
                inciso: inc.code,
                principal: pp.code,
                parcial: parc.code,
              },
              breadcrumbsText: `Fuente ${f.code} › Inciso ${inc.code} › PP ${pp.code} › Parcial ${parc.code}`,
            });
          }

          for (const sub of parc.subparciales) {
            if (
              matchesText(sub.code) ||
              matchesText(sub.descripcion) ||
              matchesText(`subparcial ${sub.code}`) ||
              matchesText(`${f.code}-${inc.code}-${pp.code}-${parc.code}-${sub.code}`)
            ) {
              results.push({
                id: `sub-${f.code}-${inc.code}-${pp.code}-${parc.code}-${sub.code}`,
                type: 'subparcial',
                title: `Subparcial ${sub.code}`,
                code: sub.code,
                fullCode: sub.fullCode,
                descripcion: sub.descripcion,
                vigente: sub.totals.vigente,
                devengado: sub.totals.devengado,
                path: {
                  fuente: f.code,
                  inciso: inc.code,
                  principal: pp.code,
                  parcial: parc.code,
                  subparcial: sub.code,
                },
                breadcrumbsText: `Fuente ${f.code} › Inciso ${inc.code} › PP ${pp.code} › Parcial ${parc.code} › Subparcial ${sub.code}`,
              });
            }

            if (results.length >= maxResults) return results;
          }

          if (results.length >= maxResults) return results;
        }

        if (results.length >= maxResults) return results;
      }

      if (results.length >= maxResults) return results;
    }

    if (results.length >= maxResults) return results;
  }

  return results;
}
