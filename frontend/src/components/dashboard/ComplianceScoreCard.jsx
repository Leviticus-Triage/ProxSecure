import { getComplianceStatus, getStatusColor } from '../../utils/formatters';
import { STATUS_LABELS } from '../../utils/constants';
import { STATUS_BG_COLORS } from '../../utils/constants';

const CIRCLE_SIZE = 80;
const STROKE_WIDTH = 8;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Circular progress indicator for compliance score.
 * Reusable for table rows and detail views.
 */
export default function ComplianceScoreCard({ score, nodeId, nodeName }) {
  const status = getComplianceStatus(score);
  const colorClass = getStatusColor(status);
  const strokeDashoffset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
  const strokeColor =
    status === 'CRITICAL' ? '#ef4444' : status === 'MEDIUM' ? '#f59e0b' : '#10b981';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}>
        <svg
          className="-rotate-90"
          width={CIRCLE_SIZE}
          height={CIRCLE_SIZE}
          viewBox={`0 0 ${CIRCLE_SIZE} ${CIRCLE_SIZE}`}
        >
          <circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            cx={CIRCLE_SIZE / 2}
            cy={CIRCLE_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={strokeColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            transition="stroke-dashoffset 0.3s ease"
          />
        </svg>
        <span
          className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${colorClass}`}
        >
          {score}%
        </span>
      </div>
      <span
        className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorClass} ${STATUS_BG_COLORS[status]}`}
      >
        {STATUS_LABELS[status]}
      </span>
      {nodeName && (
        <span className="text-center text-sm text-gray-600" title={nodeId}>
          {nodeName}
        </span>
      )}
    </div>
  );
}
