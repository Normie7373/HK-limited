// formatters.js

export function formatMonth(monthStr) {
  if (!monthStr || !/^\d{4}-\d{2}$/.test(monthStr)) return monthStr;
  const [year, month] = monthStr.split('-');
  const date = new Date(year, parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function formatPercent(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '0.0%';
  return `${num.toFixed(1)}%`;
}

export function formatScore(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '0.0';
  return num.toFixed(1);
}

export function formatMonthInput(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${yyyy}-${mm}`;
}

export function formatCurrency(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return '₹0.00';
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
