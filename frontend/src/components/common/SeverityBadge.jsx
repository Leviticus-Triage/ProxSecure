import { getSeverityColor } from '../../utils/formatters';

/**
 * Reusable severity badge (CRITICAL, HIGH, MEDIUM).
 * @param {Object} props
 * @param {string} props.severity - CRITICAL | HIGH | MEDIUM
 */
export default function SeverityBadge({ severity }) {
  const colorClass = getSeverityColor(severity ?? '');
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      {severity ?? '—'}
    </span>
  );
}
