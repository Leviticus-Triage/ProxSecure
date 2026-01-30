import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FleetSummary from '../components/dashboard/FleetSummary';
import NodeTriageTable from '../components/dashboard/NodeTriageTable';
import { useAuditData } from '../hooks/useAuditData';
import { AppContext } from '../context/AppContext';

export default function Dashboard() {
  const { nodes, loading, error, refetch } = useAuditData();
  const { setLastUpdated } = useContext(AppContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (nodes?.length) {
      const maxTs = Math.max(
        ...nodes.map((n) => new Date(n.timestamp || 0).getTime())
      );
      setLastUpdated(new Date(maxTs));
    } else {
      setLastUpdated(null);
    }
  }, [nodes, setLastUpdated]);

  const handleNodeClick = (nodeId) => {
    navigate(`/nodes/${nodeId}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p className="font-medium">Failed to load audit data</p>
        <p className="mt-1 text-sm">{error}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <FleetSummary nodes={nodes} />
      <NodeTriageTable nodes={nodes} onNodeClick={handleNodeClick} />
    </>
  );
}
