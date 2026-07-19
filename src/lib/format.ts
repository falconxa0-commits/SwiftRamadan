/**
 * Shared formatting utilities for SwiftRamadan.
 * Single source of truth for currency, numbers, etc.
 */

/**
 * Format a number as Nigerian Naira with 2 decimal places.
 * e.g. formatNaira(1250) → "₦1,250.00"
 */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
