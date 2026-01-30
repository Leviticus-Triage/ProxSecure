import { Server, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CRITICAL_THRESHOLD, MEDIUM_THRESHOLD } from '../../utils/constants';

/**
 * Aggregated fleet stats: total nodes, average compliance, critical/medium/good counts.
 */
export default function FleetSummary({ nodes }) {
  const totalNodes = nodes?.length ?? 0;
  const averageCompliance =
    totalNodes > 0
      ? Math.round(
          nodes.reduce((sum, n) => sum + (n.compliance_score ?? 0), 0) / totalNodes
        )
      : 0;
  const criticalCount = nodes?.filter((n) => (n.compliance_score ?? 0) < CRITICAL_THRESHOLD).length ?? 0;
  const mediumCount =
    nodes?.filter(
      (n) => (n.compliance_score ?? 0) >= CRITICAL_THRESHOLD && (n.compliance_score ?? 0) < MEDIUM_THRESHOLD
    ).length ?? 0;
  const goodCount = nodes?.filter((n) => (n.compliance_score ?? 0) >= MEDIUM_THRESHOLD).length ?? 0;

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Total Nodes</span>
          <Server className="h-5 w-5 text-gray-500" />
        </div>
        <p className="mt-2 text-2xl font-bold text-gray-800">{totalNodes}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Avg. Compliance</span>
        </div>
        <p className="mt-2 text-2xl font-bold text-gray-800">{averageCompliance}%</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Critical</span>
          <AlertTriangle className="h-5 w-5 text-critical" />
        </div>
        <p className="mt-2 text-2xl font-bold text-critical">{criticalCount}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Medium</span>
          <AlertCircle className="h-5 w-5 text-medium" />
        </div>
        <p className="mt-2 text-2xl font-bold text-medium">{mediumCount}</p>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-500">Good</span>
          <CheckCircle2 className="h-5 w-5 text-good" />
        </div>
        <p className="mt-2 text-2xl font-bold text-good">{goodCount}</p>
      </div>
    </div>
  );
}
