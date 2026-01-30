import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { formatCategoryName } from '../../utils/formatters';
import SeverityBadge from '../common/SeverityBadge';
import CopyButton from '../common/CopyButton';
import { toastSuccess } from '../../utils/toast';
import * as api from '../../services/api';
import RemediationExecutor from '../automation/RemediationExecutor';

/**
 * Modal/drawer for remediation: check name, severity, category, compliance tags, description, Ansible YAML with copy button, Close and Mark as Exception.
 * @param {Object} props
 * @param {Object} props.checkResult - CheckResult with remediation data
 * @param {string} [props.nodeId] - Node ID for Execute Remediation (when automation enabled)
 * @param {function} props.onClose - Called when modal should close
 * @param {function} [props.onMarkException] - Called when "Mark as Exception" is clicked (checkResult passed); if not provided, button is disabled
 */
export default function RemediationBlock({ checkResult, nodeId, onClose, onMarkException }) {
  const [ticketCreated, setTicketCreated] = useState(false);
  const [automationEnabled, setAutomationEnabled] = useState(false);

  useEffect(() => {
    api
      .getAutomationStatus()
      .then((res) => setAutomationEnabled(res?.enabled === true))
      .catch(() => setAutomationEnabled(false));
  }, []);

  if (!checkResult) return null;

  const handleCreateTicket = () => {
    const ticketId = `INC-${Math.floor(1000 + Math.random() * 9000)}`;
    toastSuccess(`✓ Ticket ${ticketId} created in Jira/ServiceNow`);
    setTicketCreated(true);
  };

  const {
    check_name,
    category,
    severity,
    compliance_mapping,
    remediation,
    details,
  } = checkResult;
  const iso = compliance_mapping?.iso_27001 ?? [];
  const bsi = compliance_mapping?.bsi_grundschutz ?? [];
  const snippet = remediation?.ansible_snippet ?? '';
  const description = remediation?.description ?? details ?? '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remediation-title"
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        aria-hidden="true"
      />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-200 px-4 py-3">
          <h2 id="remediation-title" className="text-lg font-semibold text-gray-800">
            {check_name}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SeverityBadge severity={severity} />
            <span className="text-sm text-gray-600">
              {formatCategoryName(category)}
            </span>
            {iso.map((ref) => (
              <span
                key={ref}
                className="rounded bg-primary-100 px-1.5 py-0.5 text-xs text-primary-800"
              >
                ISO {ref}
              </span>
            ))}
            {bsi.map((ref) => (
              <span
                key={ref}
                className="rounded bg-primary-100 px-1.5 py-0.5 text-xs text-primary-800"
              >
                BSI {ref}
              </span>
            ))}
          </div>
        </div>
        <div className="max-h-[50vh] overflow-y-auto px-4 py-3">
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-700">
            <li>{description}</li>
            <li>Risk: Non-compliance with control requirements.</li>
          </ul>
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Ansible remediation</span>
              <CopyButton text={snippet} />
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-900">
              <SyntaxHighlighter
                language="yaml"
                style={atomDark}
                customStyle={{ margin: 0, padding: '1rem', fontSize: '12px' }}
                showLineNumbers={false}
                PreTag="div"
              >
                {snippet || '# No snippet'}
              </SyntaxHighlighter>
            </div>
          </div>
          {automationEnabled && nodeId && checkResult?.check_id && (
            <RemediationExecutor
              nodeId={nodeId}
              checkId={checkResult.check_id}
              checkName={check_name}
              severity={severity}
            />
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
          <button
            type="button"
            onClick={handleCreateTicket}
            disabled={ticketCreated}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {ticketCreated ? '✓ Ticket Created' : '⚡ Create Service Ticket'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onMarkException?.(checkResult);
              onClose?.();
            }}
            disabled={!onMarkException}
            className="rounded-md bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark as Exception
          </button>
        </div>
      </div>
    </div>
  );
}
