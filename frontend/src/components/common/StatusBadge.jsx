import { CheckCircle2, XCircle } from 'lucide-react';

/**
 * Status indicator badge for PASS/FAIL.
 * @param {Object} props
 * @param {string} props.status - 'PASS' | 'FAIL'
 */
export default function StatusBadge({ status }) {
  const isPass = status === 'PASS';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {isPass ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          PASS
        </>
      ) : (
        <>
          <XCircle className="h-3.5 w-3.5" />
          FAIL
        </>
      )}
    </span>
  );
}
