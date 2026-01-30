import { useState, useEffect } from 'react';
import * as api from '../../services/api';
import { toastError } from '../../utils/toast';

/**
 * Execute remediation with dry-run preview, execution status/output, and warnings.
 * Shown inside RemediationBlock when automation is enabled.
 */
export default function RemediationExecutor({ nodeId, checkId, checkName, severity }) {
  const [dryRunResult, setDryRunResult] = useState(null);
  const [executeResult, setExecuteResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const isCritical = severity === 'CRITICAL';

  const loadHistory = () => {
    if (!nodeId) return;
    api
      .getRemediationHistory(nodeId)
      .then((list) => setHistory(list.filter((h) => h.check_id === checkId)))
      .catch(() => setHistory([]));
  };

  useEffect(() => {
    loadHistory();
  }, [nodeId, checkId]);

  const handleDryRun = () => {
    setLoading(true);
    setDryRunResult(null);
    setExecuteResult(null);
    api
      .executeRemediation(nodeId, checkId, true)
      .then((res) => {
        setDryRunResult(res);
      })
      .catch((err) => {
        toastError(err.message ?? 'Dry-run failed');
      })
      .finally(() => setLoading(false));
  };

  const handleExecute = () => {
    if (isCritical && !window.confirm(`Execute remediation on node "${nodeId}" for critical check "${checkName}"?`)) {
      return;
    }
    setLoading(true);
    setDryRunResult(null);
    setExecuteResult(null);
    api
      .executeRemediation(nodeId, checkId, false)
      .then((res) => {
        setExecuteResult(res);
        loadHistory();
      })
      .catch((err) => {
        toastError(err.message ?? 'Execution failed');
      })
      .finally(() => setLoading(false));
  };

  const lastResult = executeResult ?? dryRunResult;

  return (
    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <h4 className="mb-2 text-sm font-semibold text-gray-700">Execute Remediation</h4>
      {isCritical && (
        <p className="mb-2 text-xs text-amber-700">
          ⚠ Critical check: confirm before executing on the node.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDryRun}
          disabled={loading}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
        >
          {loading ? 'Running…' : 'Dry run'}
        </button>
        <button
          type="button"
          onClick={handleExecute}
          disabled={loading}
          className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          Execute
        </button>
      </div>
      {lastResult && (
        <div className="mt-3 rounded border border-gray-200 bg-white p-2 text-xs">
          <p>
            <span className="font-medium">Status:</span> {lastResult.status}
            {lastResult.dry_run && ' (dry run)'}
          </p>
          {lastResult.output && <p className="mt-1 text-gray-600">{lastResult.output}</p>}
          {lastResult.error && <p className="mt-1 text-red-600">{lastResult.error}</p>}
        </div>
      )}
      {history.length > 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium text-gray-600">Recent executions</p>
          <ul className="mt-1 list-inside list-disc text-xs text-gray-500">
            {history.slice(0, 5).map((h) => (
              <li key={h.execution_id}>
                {h.status} @ {new Date(h.timestamp).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
