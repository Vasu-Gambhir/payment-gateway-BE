// Utility functions for handling money as integer cents
// This prevents floating-point precision issues in financial calculations

/**
 * Convert dollars to cents (integer)
 * @param {number} dollars - Dollar amount (e.g., 123.45)
 * @returns {number} - Cents as integer (e.g., 12345)
 */
const dollarsToCents = (dollars) => {
  if (typeof dollars !== 'number' || isNaN(dollars)) {
    return 0;
  }
  // Round to handle any floating point precision issues in input
  return Math.round(dollars * 100);
};

/**
 * Convert cents to dollars
 * @param {number} cents - Cents as integer (e.g., 12345)
 * @returns {number} - Dollar amount (e.g., 123.45)
 */
const centsToDollars = (cents) => {
  if (typeof cents !== 'number' || isNaN(cents)) {
    return 0;
  }
  return cents / 100;
};

/**
 * Format cents as currency string
 * @param {number} cents - Cents as integer
 * @param {string} currency - Currency code (default: 'USD')
 * @returns {string} - Formatted currency string (e.g., "$123.45")
 */
const formatCentsAsCurrency = (cents, currency = 'USD') => {
  const dollars = centsToDollars(cents);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
};

/**
 * Format cents as plain dollar string
 * @param {number} cents - Cents as integer
 * @returns {string} - Formatted dollar string (e.g., "123.45")
 */
const formatCentsAsDollars = (cents) => {
  const dollars = centsToDollars(cents);
  return dollars.toFixed(2);
};

/**
 * Validate that amount is a positive integer (for cents)
 * @param {number} cents - Amount in cents
 * @returns {boolean} - Whether the amount is valid
 */
const isValidCentsAmount = (cents) => {
  return Number.isInteger(cents) && cents >= 0;
};

/**
 * Parse user input (dollars) and convert to cents safely
 * @param {string|number} input - User input (e.g., "123.45" or 123.45)
 * @returns {number} - Cents as integer, or 0 if invalid
 */
const parseInputToCents = (input) => {
  if (typeof input === 'string') {
    input = parseFloat(input);
  }
  
  if (isNaN(input) || input < 0) {
    return 0;
  }
  
  return dollarsToCents(input);
};

module.exports = {
  dollarsToCents,
  centsToDollars,
  formatCentsAsCurrency,
  formatCentsAsDollars,
  isValidCentsAmount,
  parseInputToCents,
};