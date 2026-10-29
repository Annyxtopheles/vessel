import type { NumberGroupingOption } from '../types';

/**
 * Formats a numeric value according to Bangladeshi (Lakh/Crore) or International grouping.
 * - Bangladeshi: 1,00,000 (1 Lakh), 1,00,00,000 (1 Crore)
 * - International: 100,000, 10,000,000
 */
export function formatNumberWithGrouping(
  val: number,
  grouping: NumberGroupingOption = 'bangladeshi'
): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  const isNegative = val < 0;
  const absVal = Math.abs(val);
  
  // Format up to 2 decimal places if needed or integer
  const rounded = Math.round(absVal * 100) / 100;
  const parts = rounded.toString().split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1] ? `.${parts[1]}` : '';

  if (grouping === 'international') {
    const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `${isNegative ? '-' : ''}${formatted}${decimalPart}`;
  }

  // Bangladeshi (Lakh/Crore) system:
  // The first group from right is 3 digits, then every subsequent group is 2 digits
  if (integerPart.length <= 3) {
    return `${isNegative ? '-' : ''}${integerPart}${decimalPart}`;
  }

  const lastThree = integerPart.slice(-3);
  const otherDigits = integerPart.slice(0, -3);
  const formattedOthers = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const formatted = `${formattedOthers},${lastThree}`;

  return `${isNegative ? '-' : ''}${formatted}${decimalPart}`;
}

/**
 * Formats a value as currency with the chosen symbol and grouping.
 * Defaults to '৳' and Bangladeshi grouping.
 */
export function formatCurrency(
  val: number,
  currencySymbol = '৳',
  grouping: NumberGroupingOption = 'bangladeshi'
): string {
  return `${currencySymbol}${formatNumberWithGrouping(val, grouping)}`;
}
