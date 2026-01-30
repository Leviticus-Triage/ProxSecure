import {
  CRITICAL_THRESHOLD,
  MEDIUM_THRESHOLD,
  STATUS_COLORS,
  CATEGORY_LABELS,
  SEVERITY_BG_COLORS,
} from './constants';

/**
 * Returns 'CRITICAL' | 'MEDIUM' | 'GOOD' based on score and thresholds.
 */
export function getComplianceStatus(score) {
  if (score < CRITICAL_THRESHOLD) return 'CRITICAL';
  if (score < MEDIUM_THRESHOLD) return 'MEDIUM';
  return 'GOOD';
}

/**
 * Returns Tailwind text color class for status.
 */
export function getStatusColor(status) {
  return STATUS_COLORS[status] ?? 'text-gray-600';
}

/**
 * Converts ISO timestamp to relative time (e.g. "2 min ago").
 */
export function formatRelativeTime(timestamp) {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHour < 24) return `${diffHour} hr ago`;
  if (diffDay < 7) return `${diffDay} day ago`;
  return date.toLocaleDateString();
}

/**
 * Convert "2025-01-30" to "Jan 30" for chart labels.
 * @param {string} dateString - ISO date string
 * @returns {string}
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return dateString;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Convert "ACCESS_CONTROL" to "Access Control".
 * @param {string} category - Category key
 * @returns {string}
 */
export function formatCategoryName(category) {
  if (!category) return '—';
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, ' ');
}

/**
 * Return Tailwind color classes for severity (CRITICAL, HIGH, MEDIUM).
 * @param {string} severity
 * @returns {string}
 */
export function getSeverityColor(severity) {
  return SEVERITY_BG_COLORS[severity] ?? 'bg-gray-100 text-gray-800';
}
