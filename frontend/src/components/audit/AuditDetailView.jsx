import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, RefreshCw, Zap } from 'lucide-react';
import * as api from '../../services/api';
import { useNodeHistory } from '../../hooks/useNodeHistory';
import { formatRelativeTime, formatCategoryName } from '../../utils/formatters';
import { toastSuccess, toastError } from '../../utils/toast';
import { FILTER_ALL, FILTER_CRITICAL_ONLY, CATEGORY_LABELS } from '../../utils/constants';
import ComplianceScoreCard from '../dashboard/ComplianceScoreCard';
import ComplianceTrendChart from '../dashboard/ComplianceTrendChart';
import CategoryBreakdown from './CategoryBreakdown';
import CheckResultCard from './CheckResultCard';
import RemediationBlock from './RemediationBlock';

const CATEGORIES = Object.keys(CATEGORY_LABELS);

/**
 * Main audit detail view: fetches node audit + history, header, filters, category breakdown, check table, trend chart, remediation modal.
 * @param {Object} props
 * @param {string} props.nodeId - Node ID from route params
 */
export default function AuditDetailView({ nodeId }) {
  const navigate = useNavigate();
  const [node, setNode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState(FILTER_ALL);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const { history, loading: historyLoading } = useNodeHistory(nodeId);

  const handleDownloadReport = async () => {
    if (!nodeId) return;
    setDownloading(true);
    try {
      const blob = await api.downloadNodeReport(nodeId);
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `compliance-report-${nodeId}-${dateStr}.pdf`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toastSuccess('Compliance report downloaded.');
    } catch (err) {
      toastError(err.message ?? 'Failed to download report.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCreateTicket = () => {
    toastSuccess('Ticket #INC-492 created in Jira');
  };

  const fetchNode = useCallback(async () => {
    if (!nodeId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getNodeDetail(nodeId);
      setNode(data);
    } catch (err) {
      setError(err.message ?? 'Failed to load node audit');
      setNode(null);
    } finally {
      setLoading(false);
    }
  }, [nodeId]);

  useEffect(() => {
    fetchNode();
  }, [fetchNode]);

  const checkResults = node?.check_results ?? [];
  const filtered =
    filterMode === FILTER_CRITICAL_ONLY
      ? checkResults.filter((r) => r.severity === 'CRITICAL')
      : categoryFilter
        ? checkResults.filter((r) => r.category === categoryFilter)
        : checkResults;
  const filteredCount = filtered.length;
  const totalCount = checkResults.length;

  if (loading && !node) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error && !node) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Failed to load node audit</p>
        <p className="mt-1 text-sm">{error}</p>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={fetchNode}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
          >
            Retry
          </button>
          <button
            type="button"
            onClick={() => navigate('/nodes')}
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Nodes List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/nodes')}
        className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Nodes List
      </button>

      {/* Header: node name, score, last scan */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            {node?.node_name ?? node?.node_id ?? '—'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Last scan: {formatRelativeTime(node?.timestamp)}
          </p>
        </div>
        <ComplianceScoreCard
          score={node?.compliance_score ?? 0}
          nodeId={node?.node_id}
          nodeName={node?.node_name}
        />
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDownloadReport}
          disabled={downloading || loading}
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download Audit Report
            </>
          )}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Re-scan Node
        </button>
        <button
          type="button"
          onClick={handleCreateTicket}
          className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
        >
          <Zap className="h-4 w-4" />
          Create Service Ticket
        </button>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Filters:</span>
        <button
          type="button"
          onClick={() => {
            setFilterMode(FILTER_ALL);
            setCategoryFilter(null);
          }}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            filterMode === FILTER_ALL && !categoryFilter
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Show All
        </button>
        <button
          type="button"
          onClick={() => {
            setFilterMode(FILTER_CRITICAL_ONLY);
            setCategoryFilter(null);
          }}
          className={`rounded-md px-3 py-1.5 text-sm font-medium ${
            filterMode === FILTER_CRITICAL_ONLY
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Show Critical Only
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => {
              setCategoryFilter(categoryFilter === cat ? null : cat);
              setFilterMode(FILTER_ALL);
            }}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              categoryFilter === cat
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {formatCategoryName(cat)}
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-500">
          Showing {filteredCount} of {totalCount} checks
        </span>
      </div>

      <CategoryBreakdown checkResults={checkResults} />

      {/* Check results table */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <h3 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">
          Check results
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Check
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Severity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Compliance
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.map((result) => (
                <CheckResultCard
                  key={result.check_id}
                  checkResult={result}
                  onRemediationClick={setSelectedCheck}
                />
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-gray-500">No checks match the current filter.</div>
        )}
      </div>

      <ComplianceTrendChart history={history} loading={historyLoading} />

      {selectedCheck && (
        <RemediationBlock
          checkResult={selectedCheck}
          nodeId={nodeId}
          onClose={() => setSelectedCheck(null)}
        />
      )}
    </div>
  );
}
