import { useNavigate } from 'react-router-dom';
import { Eye } from 'lucide-react';
import ComplianceScoreCard from './ComplianceScoreCard';
import { getComplianceStatus } from '../../utils/formatters';
import { formatRelativeTime } from '../../utils/formatters';
import { STATUS_BG_COLORS } from '../../utils/constants';

/**
 * Table of nodes sorted by compliance (worst first). Row click and View Details go to detail view.
 */
export default function NodeTriageTable({ nodes, onNodeClick }) {
  const navigate = useNavigate();
  const sorted = [...(nodes ?? [])].sort(
    (a, b) => (a.compliance_score ?? 0) - (b.compliance_score ?? 0)
  );

  const handleRowClick = (nodeId) => {
    onNodeClick?.(nodeId);
    navigate(`/nodes/${nodeId}`);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Customer Node
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Compliance Score
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Last Scan
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {sorted.map((node) => {
              const status = getComplianceStatus(node.compliance_score ?? 0);
              const rowBg = STATUS_BG_COLORS[status];
              return (
                <tr
                  key={node.node_id}
                  className={`cursor-pointer transition-colors hover:opacity-90 ${rowBg}`}
                  onClick={() => handleRowClick(node.node_id)}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">
                    {node.node_name ?? node.node_id}
                  </td>
                  <td className="px-4 py-3">
                    <ComplianceScoreCard
                      score={node.compliance_score ?? 0}
                      nodeId={node.node_id}
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                        status === 'CRITICAL'
                          ? 'bg-red-100 text-red-800'
                          : status === 'MEDIUM'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                    {formatRelativeTime(node.timestamp)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(node.node_id);
                      }}
                      className="inline-flex items-center gap-1 rounded-md bg-primary-600 px-2 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sorted.length === 0 && (
        <div className="py-12 text-center text-gray-500">No nodes to display.</div>
      )}
    </div>
  );
}
