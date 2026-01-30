/** Align with backend AuditService.CRITICAL_THRESHOLD (60). */
export const CRITICAL_THRESHOLD = 60;
export const MEDIUM_THRESHOLD = 80;

export const STATUS_LABELS = {
  CRITICAL: 'Critical',
  MEDIUM: 'Medium',
  GOOD: 'Good',
};

export const STATUS_COLORS = {
  CRITICAL: 'text-critical',
  MEDIUM: 'text-medium',
  GOOD: 'text-good',
};

export const STATUS_BG_COLORS = {
  CRITICAL: 'bg-red-50 dark:bg-red-900/20',
  MEDIUM: 'bg-amber-50 dark:bg-amber-900/20',
  GOOD: 'bg-emerald-50 dark:bg-emerald-900/20',
};

/** Category display labels for Phase 3 audit detail. */
export const CATEGORY_LABELS = {
  ACCESS_CONTROL: 'Access Control',
  NETWORK_SECURITY: 'Network Security',
  STORAGE_BACKUP: 'Storage & Backup',
  LOGGING_MONITORING: 'Logging & Monitoring',
  VIRTUALIZATION_SECURITY: 'Virtualization Security',
};

/** Lucide icon names per category (used with dynamic import or mapping in components). */
export const CATEGORY_ICON_NAMES = {
  ACCESS_CONTROL: 'Shield',
  NETWORK_SECURITY: 'Network',
  STORAGE_BACKUP: 'Database',
  LOGGING_MONITORING: 'FileText',
  VIRTUALIZATION_SECURITY: 'Server',
};

/** Severity Tailwind classes for badges. */
export const SEVERITY_BG_COLORS = {
  CRITICAL: 'bg-red-100 text-red-800',
  HIGH: 'bg-orange-100 text-orange-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
};

/** Filter option keys for audit detail view. */
export const FILTER_ALL = 'all';
export const FILTER_CRITICAL_ONLY = 'critical';
export const FILTER_BY_CATEGORY = 'category';
