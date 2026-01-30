import { formatCategoryName } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import SeverityBadge from '../common/SeverityBadge';

/**
 * Single check result row: name, category, status, severity, compliance tags, "View Remediation" for failed checks.
 * @param {Object} props
 * @param {Object} props.checkResult - CheckResult object from API
 * @param {function} [props.onRemediationClick] - Called when "View Remediation" is clicked
 */
export default function CheckResultCard({ checkResult, onRemediationClick }) {
  if (!checkResult) return null;
  const {
    check_name,
    category,
    status,
    severity,
    compliance_mapping,
    remediation,
  } = checkResult;
  const iso = compliance_mapping?.iso_27001 ?? [];
  const bsi = compliance_mapping?.bsi_grundschutz ?? [];
  const showRemediation = status === 'FAIL' && remediation;

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
        {check_name ?? '—'}
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
        {formatCategoryName(category)}
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <StatusBadge status={status} />
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <SeverityBadge severity={severity} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        <div className="flex flex-wrap gap-1">
          {iso.map((ref) => (
            <span
              key={ref}
              className="inline-flex rounded bg-primary-100 px-1.5 py-0.5 text-xs text-primary-800"
            >
              ISO {ref}
            </span>
          ))}
          {bsi.map((ref) => (
            <span
              key={ref}
              className="inline-flex rounded bg-primary-100 px-1.5 py-0.5 text-xs text-primary-800"
            >
              BSI {ref}
            </span>
          ))}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right">
        {showRemediation && (
          <button
            type="button"
            onClick={() => onRemediationClick?.(checkResult)}
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View Remediation
          </button>
        )}
      </td>
    </tr>
  );
}
