/**
 * Format currency with Argentine standard format:
 * $ 1.250.430.000 or $ 1.250.430.000,00
 */
export function formatCurrency(value: number, includeDecimals: boolean = false): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '$ 0';
  }

  const absValue = Math.abs(value);
  const formatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  }).format(absValue);

  const sign = value < 0 ? '- ' : '';
  return `${sign}$ ${formatted}`;
}

/**
 * Compact currency for executive summary cards (e.g. $ 18.531 M)
 */
export function formatCurrencyCompact(value: number): string {
  if (isNaN(value) || value === null || value === undefined || value === 0) {
    return '$ 0';
  }

  const abs = Math.abs(value);
  const sign = value < 0 ? '- ' : '';

  if (abs >= 1_000_000_000) {
    const millions = abs / 1_000_000;
    const formattedMillions = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(millions);
    return `${sign}$ ${formattedMillions} M`;
  }

  if (abs >= 1_000_000) {
    const millions = abs / 1_000_000;
    const formattedMillions = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 2,
    }).format(millions);
    return `${sign}$ ${formattedMillions} M`;
  }

  if (abs >= 100_000) {
    const thousands = abs / 1_000;
    const formattedThousands = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(thousands);
    return `${sign}$ ${formattedThousands} K`;
  }

  return formatCurrency(value);
}

export function formatNumber(value: number): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0';
  }
  return new Intl.NumberFormat('es-AR').format(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  if (isNaN(value) || !isFinite(value)) {
    return '0.0%';
  }
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(dateStringOrDate: string | Date): string {
  try {
    const d = new Date(dateStringOrDate);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return String(dateStringOrDate);
  }
}

/**
 * Clean string for matching headers (strip accents, lower, remove symbols)
 */
export function normalizeHeader(str: string): string {
  return str
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}
