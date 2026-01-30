import { useParams } from 'react-router-dom';
import AuditDetailView from '../components/audit/AuditDetailView';

/**
 * Node detail page: renders full AuditDetailView with nodeId from route params.
 * Wraps in error boundary context (handled inside AuditDetailView for 404/network).
 */
export default function NodeDetail() {
  const { nodeId } = useParams();

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <AuditDetailView nodeId={nodeId} />
    </div>
  );
}
