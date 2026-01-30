"""Audit orchestration: fleet summary, per-node audit, and historical trend data."""

from datetime import datetime

from app.core.audit_engine import AuditEngine
from app.models.check import (
    FleetSummary,
    HistoricalDataPoint,
    NodeAuditResult,
)
from app.services.proxmox_base import ProxmoxServiceProtocol


class AuditService:
    """
    Orchestrates audit execution: uses ProxmoxServiceProtocol for data and AuditEngine
    for checks; computes compliance scores and aggregates fleet metrics.
    """

    CRITICAL_THRESHOLD = 60  # Nodes with compliance_score < 60% are critical

    def __init__(
        self,
        proxmox_service: ProxmoxServiceProtocol,
        audit_engine: AuditEngine,
    ) -> None:
        """
        Args:
            proxmox_service: Provider of node configs and history (mock, real, or hybrid).
            audit_engine: Registry-based engine that runs compliance checks.
        """
        self._proxmox = proxmox_service
        self._engine = audit_engine

    def get_fleet_summary(self) -> FleetSummary:
        """
        Run audits for all nodes and return aggregated fleet summary.

        Returns:
            FleetSummary with total_nodes, average_compliance, critical_nodes, and per-node results.
        """
        node_ids = self._proxmox.get_all_nodes()
        node_results: list[NodeAuditResult] = []
        for node_id in node_ids:
            result = self._get_node_audit_internal(node_id)
            node_results.append(result)

        total = len(node_results)
        if total == 0:
            average_compliance = 0.0
            critical_nodes_list: list[str] = []
        else:
            average_compliance = sum(n.compliance_score for n in node_results) / total
            critical_nodes_list = [
                n.node_id for n in node_results if n.compliance_score < self.CRITICAL_THRESHOLD
            ]

        return FleetSummary(
            total_nodes=total,
            average_compliance=round(average_compliance, 2),
            critical_nodes=critical_nodes_list,
            nodes=node_results,
        )

    def get_node_audit(self, node_id: str) -> NodeAuditResult:
        """
        Run all compliance checks for a single node and return the audit result.

        Args:
            node_id: Unique node identifier.

        Returns:
            NodeAuditResult with compliance_score, check_results, and counts.

        Raises:
            ValueError: If node_id is not found (caller should map to 404).
        """
        return self._get_node_audit_internal(node_id)

    def _get_node_audit_internal(self, node_id: str) -> NodeAuditResult:
        """Execute checks for one node; raises ValueError if node not found."""
        config = self._proxmox.get_node_config(node_id)
        check_results = self._engine.execute_checks(config)
        total_checks = len(check_results)
        passed_checks = sum(1 for r in check_results if r.status == "PASS")
        failed_checks = total_checks - passed_checks
        compliance_score = int((passed_checks / total_checks) * 100) if total_checks else 0
        node_name = node_id.replace("-", " ").title()

        return NodeAuditResult(
            node_id=node_id,
            node_name=node_name,
            compliance_score=compliance_score,
            total_checks=total_checks,
            passed_checks=passed_checks,
            failed_checks=failed_checks,
            check_results=check_results,
            timestamp=datetime.utcnow(),
        )

    def get_node_history(self, node_id: str) -> list[HistoricalDataPoint]:
        """
        Return historical trend data for a node (e.g. 30-day compliance trajectory).

        Args:
            node_id: Unique node identifier.

        Returns:
            List of HistoricalDataPoint (date, compliance_score).

        Raises:
            ValueError: If node_id is not found (caller should map to 404).
        """
        raw = self._proxmox.get_node_history(node_id)
        return [
            HistoricalDataPoint(date=item["date"], compliance_score=item["compliance_score"])
            for item in raw
        ]
