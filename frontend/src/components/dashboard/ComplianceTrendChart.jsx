import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';
import { formatDate } from '../../utils/formatters';

/**
 * Historical compliance trend chart (Recharts). X: date (e.g. Jan 1), Y: 0–100%, tooltip with full date.
 * @param {Object} props
 * @param {Array<{ date: string, compliance_score: number }>} props.history - HistoricalDataPoint[]
 * @param {boolean} [props.loading] - Show loading state
 */
export default function ComplianceTrendChart({ history, loading }) {
  const data = (history ?? []).map((d) => ({
    date: d.date,
    score: d.compliance_score ?? 0,
    label: formatDate(d.date),
  }));

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-gray-200 bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex h-[300px] items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500">
        No historical data available.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Compliance trend</h3>
      <div style={{ height: 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11 }}
              stroke="#6b7280"
            />
            <Tooltip
              formatter={(value) => [`${value}%`, 'Score']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
