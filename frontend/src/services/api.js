import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL ?? '/api/v1';

const api = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      return Promise.reject(new Error(error.response.data?.detail ?? error.message));
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout'));
    }
    return Promise.reject(new Error(error.message || 'Network error'));
  }
);

/**
 * GET /audit/nodes - Fleet summary (FleetSummary)
 */
export function getNodes() {
  return api.get('/audit/nodes').then((res) => res.data);
}

/**
 * GET /audit/nodes/{nodeId} - Single node audit (NodeAuditResult)
 */
export function getNodeDetail(nodeId) {
  return api.get(`/audit/nodes/${nodeId}`).then((res) => res.data);
}

/**
 * GET /audit/nodes/{nodeId}/history - Historical data (HistoricalDataPoint[])
 */
export function getNodeHistory(nodeId) {
  return api.get(`/audit/nodes/${nodeId}/history`).then((res) => res.data);
}

/**
 * GET /audit/nodes/{nodeId}/report - Download PDF report (blob)
 */
export function downloadNodeReport(nodeId) {
  return api.get(`/audit/nodes/${nodeId}/report`, { responseType: 'blob' }).then((res) => res.data);
}

/**
 * POST /automation/remediate - Execute or dry-run remediation
 */
export function executeRemediation(nodeId, checkId, dryRun = true) {
  return api
    .post('/automation/remediate', { node_id: nodeId, check_id: checkId, dry_run: dryRun })
    .then((res) => res.data);
}

/**
 * GET /automation/history/{nodeId} - Remediation execution history for node
 */
export function getRemediationHistory(nodeId) {
  return api.get(`/automation/history/${nodeId}`).then((res) => res.data);
}

/**
 * GET /automation/status - Automation service status
 */
export function getAutomationStatus() {
  return api.get('/automation/status').then((res) => res.data);
}

export default api;
