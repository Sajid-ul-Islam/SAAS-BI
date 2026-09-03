import { describe, it, expect } from 'vitest';
import { formatBDT } from '../../src/shared/utils/currency';

describe('formatBDT', () => {
  it('formats basic amounts with Taka symbol and 2 decimals', () => {
    expect(formatBDT(1500)).toBe('৳1,500.00');
    expect(formatBDT(0)).toBe('৳0.00');
  });

  it('formats Bangladeshi Lakh and Crore grouping correctly', () => {
    expect(formatBDT(100000)).toBe('৳1,00,000.00');
    expect(formatBDT(1542350.5)).toBe('৳15,42,350.50');
    expect(formatBDT(10000000)).toBe('৳1,00,00,000.00');
  });

  it('formats compact representations', () => {
    expect(formatBDT(150000, { compact: true })).toBe('৳1.5 Lakh');
    expect(formatBDT(25000000, { compact: true })).toBe('৳2.5 Cr');
    expect(formatBDT(5000, { compact: true })).toBe('৳5k');
  });

  it('handles negative numbers and options', () => {
    expect(formatBDT(-4500, { includeSymbol: false, showDecimals: false })).toBe('-4,500');
  });
});
