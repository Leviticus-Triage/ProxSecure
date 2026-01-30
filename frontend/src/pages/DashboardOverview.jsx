import { useContext, useEffect } from 'react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { useAuditData } from '../hooks/useAuditData';
import { AppContext } from '../context/AppContext';
import { CRITICAL_THRESHOLD, MEDIUM_THRESHOLD } from '../utils/constants';

const PIE_COLORS = {
  Critical: '#ef4444',
  Medium: '#f59e0b',
  Good: '#10b981',
};
const BAR_COLOR = '#3b82f6';

export default function DashboardOverview() {
  const { nodes, loading, error, refetch } = useAuditData();
  const { setLastUpdated } = useContext(AppContext);

  useEffect(() => {
    if (nodes?.length) {
      const maxTs = Math.max(
        ...nodes.map((n) => new Date(n.timestamp || 0).getTime())
      );
      setLastUpdated(new Date(maxTs));
    } else {
      setLastUpdated(null);
    }
  }, [nodes, setLastUpdated]);

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Failed to load audit data</p>
        <p className="mt-1 text-sm">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const criticalCount = nodes?.filter((n) => n.compliance_score < CRITICAL_THRESHOLD).length ?? 0;
  const mediumCount =
    nodes?.filter(
      (n) => n.compliance_score >= CRITICAL_THRESHOLD && n.compliance_score < MEDIUM_THRESHOLD
    ).length ?? 0;
  const goodCount = nodes?.filter((n) => n.compliance_score >= MEDIUM_THRESHOLD).length ?? 0;

  const complianceDistribution = [
    { name: 'Critical', value: criticalCount, fill: PIE_COLORS.Critical },
    { name: 'Medium', value: mediumCount, fill: PIE_COLORS.Medium },
    { name: 'Good', value: goodCount, fill: PIE_COLORS.Good },
  ].filter((d) => d.value > 0);

  const failureCountByCheck = {};
  nodes?.forEach((node) => {
    (node.check_results ?? []).forEach((r) => {
      if (r.status === 'FAIL') {
        const name = r.check_name || r.check_id;
        failureCountByCheck[name] = (failureCountByCheck[name] ?? 0) + 1;
      }
    });
  });
  const topFailingChecks = Object.entries(failureCountByCheck)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-700">
          Compliance Score Distribution
        </h3>
        {complianceDistribution.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={complianceDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {complianceDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500">No node data to display.</p>
        )}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-700">
          Top 5 Failing Checks
        </h3>
        {topFailingChecks.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={topFailingChecks}
              layout="vertical"
              margin={{ left: 20, right: 20 }}
            >
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill={BAR_COLOR} name="Failures" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-gray-500">No failing checks across nodes.</p>
        )}
      </div>
    </div>
  );
}
