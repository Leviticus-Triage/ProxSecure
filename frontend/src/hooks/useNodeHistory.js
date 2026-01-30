import { useState, useEffect } from 'react';
import * as api from '../services/api';

/**
 * Fetches historical data for a node (Phase 3 stub).
 * @param {string} nodeId - Node identifier
 * @returns {{ history: Array, loading: boolean }}
 */
export function useNodeHistory(nodeId) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!nodeId) {
      setHistory([]);
      return;
    }
    setLoading(true);
    api
      .getNodeHistory(nodeId)
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [nodeId]);

  return { history, loading };
}
