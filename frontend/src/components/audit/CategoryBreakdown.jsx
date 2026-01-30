import { Shield, Network, Database, FileText, Server } from 'lucide-react';
import { formatCategoryName } from '../../utils/formatters';
import { CATEGORY_ICON_NAMES } from '../../utils/constants';

const ICON_MAP = {
  Shield,
  Network,
  Database,
  FileText,
  Server,
};

/**
 * Visual summary of compliance by category: grid of cards with pass/fail ratio and percentage bar.
 * @param {Object} props
 * @param {Array<{ category: string, status: string }>} props.checkResults - Array of CheckResult objects
 */
export default function CategoryBreakdown({ checkResults }) {
  const byCategory = (checkResults ?? []).reduce((acc, r) => {
    const cat = r.category ?? 'OTHER';
    if (!acc[cat]) acc[cat] = { pass: 0, fail: 0 };
    if (r.status === 'PASS') acc[cat].pass += 1;
    else acc[cat].fail += 1;
    return acc;
  }, {});

  const categories = [
    'ACCESS_CONTROL',
    'NETWORK_SECURITY',
    'STORAGE_BACKUP',
    'LOGGING_MONITORING',
    'VIRTUALIZATION_SECURITY',
  ];

  return (
    <div className="mb-6">
      <h3 className="mb-3 text-sm font-semibold text-gray-700">Compliance by category</h3>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {categories.map((cat) => {
          const { pass = 0, fail = 0 } = byCategory[cat] ?? {};
          const total = pass + fail;
          const pct = total > 0 ? Math.round((pass / total) * 100) : 0;
          const IconName = ICON_MAP[CATEGORY_ICON_NAMES[cat]] ?? FileText;
          return (
            <div
              key={cat}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <IconName className="h-5 w-5 text-primary-600" />
                <span className="text-sm font-medium text-gray-800">
                  {formatCategoryName(cat)}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {pass}/{total} passed
              </p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
