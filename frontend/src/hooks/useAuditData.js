import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

/**
 * Fetches fleet summary on mount and exposes nodes, loading, error, refetch.
 */
export function useAuditData() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNodes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getNodes();
      setNodes(data.nodes ?? []);
    } catch (err) {
      setError(err.message ?? 'Failed to load audit data');
      setNodes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNodes();
  }, [fetchNodes]);

  return { nodes, loading, error, refetch: fetchNodes };
}
