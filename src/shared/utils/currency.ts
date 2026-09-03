/**
 * Bangladeshi Taka (BDT) Currency Utilities
 * Formats numbers into BDT standard and South Asian numbering notation (Lakh, Crore).
 */

export interface FormatBdtOptions {
  includeSymbol?: boolean;
  showDecimals?: boolean;
  compact?: boolean;
}

/**
 * Formats a numeric amount or string into BDT currency display.
 * Example: 154000 -> "৳1,54,000" or "৳1.54 Lakh" (compact)
 */
export function formatBDT(
  amount: number | string | { toString(): string },
  options: FormatBdtOptions = {}
): string {
  const { includeSymbol = true, showDecimals = true, compact = false } = options;

  const num = typeof amount === 'number' ? amount : Number(amount.toString());

  if (Number.isNaN(num)) {
    return includeSymbol ? '৳0.00' : '0.00';
  }

  const symbol = includeSymbol ? '৳' : '';

  if (compact) {
    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (abs >= 10_000_000) {
      // 1 Crore = 10,000,000
      const crore = (abs / 10_000_000).toFixed(2).replace(/\.?0+$/, '');
      return `${sign}${symbol}${crore} Cr`;
    }
    if (abs >= 100_000) {
      // 1 Lakh = 100,000
      const lakh = (abs / 100_000).toFixed(2).replace(/\.?0+$/, '');
      return `${sign}${symbol}${lakh} Lakh`;
    }
    if (abs >= 1_000) {
      const k = (abs / 1_000).toFixed(1).replace(/\.?0+$/, '');
      return `${sign}${symbol}${k}k`;
    }
  }

  // Format with South Asian comma grouping: 12,34,567.89
  const sign = num < 0 ? '-' : '';
  const absNum = Math.abs(num);

  const fixed = showDecimals ? absNum.toFixed(2) : Math.round(absNum).toString();
  const parts = fixed.split('.');
  const integerPart = parts[0] ?? '0';
  const decimalPart = parts[1];

  // Apply South Asian regex: 3 digits rightmost, then groups of 2
  let lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const finalNumber = showDecimals && decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;

  return `${sign}${symbol}${finalNumber}`;
}
