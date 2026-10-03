/**
 * Global Grade Formatting and Styling Utilities
 * Standardized for Mozambican MINEDH grading system:
 * - Formats numbers to 'XX,XX' (using comma separator for decimals)
 * - Negative grade threshold: <= 9.4 (text-red-600 font-bold)
 * - Positive grade threshold: >= 9.5
 */

/**
 * Formats a grade number into standard decimal display format 'XX,XX'.
 * e.g., 10.75 -> '10,75', 8.5 -> '8,50', 14 -> '14', null/undefined/NaN -> ''
 * If forceInteger is true, rounds the value to a whole integer (e.g. for Média Final fields).
 */
export function formatGradeValue(val: number | null | undefined, forceInteger = false): string {
  if (val === null || val === undefined || isNaN(val)) return '';
  if (forceInteger) return Math.round(val).toString();
  if (Number.isInteger(val)) return val.toString();
  return val.toFixed(2).replace('.', ',');
}

/**
 * Checks if a grade is negative according to the MINEDH standard (<= 9.4).
 */
export function isGradeNegative(val: number | null | undefined): boolean {
  if (val === null || val === undefined || isNaN(val)) return false;
  return val <= 9.4;
}

/**
 * Returns the CSS text color class for a grade value:
 * - <= 9.4: 'text-red-600 font-bold' (negative)
 * - >= 9.5: 'text-black font-semibold' (or font-black if bold)
 */
export function getGradeTextColorClass(
  val: number | null | undefined,
  isBold = false,
  customPositiveColor = 'text-black'
): string {
  if (val === null || val === undefined || isNaN(val)) return customPositiveColor;
  if (isGradeNegative(val)) {
    return 'text-red-600 font-bold';
  }
  return isBold ? 'font-black text-black' : customPositiveColor;
}

/**
 * Helper object format return for grade rendering
 */
export interface GradeDisplayInfo {
  text: string;
  isNegative: boolean;
  colorClass: string;
}

export function getGradeDisplayInfo(
  val: number | null | undefined,
  isBold = false,
  customPositiveColor = 'text-black'
): GradeDisplayInfo {
  const text = formatGradeValue(val);
  const negative = isGradeNegative(val);
  const colorClass = getGradeTextColorClass(val, isBold, customPositiveColor);

  return {
    text,
    isNegative: negative,
    colorClass,
  };
}
