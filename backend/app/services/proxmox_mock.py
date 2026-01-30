"""Mock Proxmox data provider for PoC testing without real Proxmox API."""

import logging

from app.data.mock_data import MOCK_HISTORY, MOCK_NODES
from app.services.proxmox_base import ProxmoxServiceProtocol

logger = logging.getLogger(__name__)


class ProxmoxMockService:
    """Implements ProxmoxServiceProtocol with static mock data. execute_remediation logs only."""

    """
    Provides mock node configurations and historical trend data for audit engine testing.
    Raises ValueError if node_id is not found.
    """

    def get_all_nodes(self) -> list[str]:
        """
        Return list of all node IDs available in the mock data.

        Returns:
            List of node identifier strings (e.g. ["customer-a-node", "customer-b-node", "customer-c-node"]).
        """
        return list(MOCK_NODES.keys())

    def get_node_config(self, node_id: str) -> dict:
        """
        Return configuration dictionary for a specific node.

        Args:
            node_id: Unique node identifier.

        Returns:
            Configuration dict with keys used by audit checks (e.g. ssh_permit_root_login, firewall_enabled).

        Raises:
            ValueError: If node_id is not in MOCK_NODES.
        """
        if node_id not in MOCK_NODES:
            raise ValueError(f"Node not found: {node_id}")
        return MOCK_NODES[node_id].copy()

    def get_node_history(self, node_id: str) -> list[dict]:
        """
        Return historical trend data for a node (e.g. 30-day compliance trajectory).

        Args:
            node_id: Unique node identifier.

        Returns:
            List of dicts with keys "date" (str) and "compliance_score" (int).

        Raises:
            ValueError: If node_id is not in MOCK_HISTORY.
        """
        if node_id not in MOCK_HISTORY:
            raise ValueError(f"Node not found: {node_id}")
        return list(MOCK_HISTORY[node_id])

    def execute_remediation(self, node_id: str, ansible_snippet: str) -> dict | None:
        """Stub: log but do not execute. Returns None for mock (no real execution)."""
        if node_id not in MOCK_NODES:
            raise ValueError(f"Node not found: {node_id}")
        logger.info(
            "Mock execute_remediation: node_id=%s, snippet_len=%d (not executed)",
            node_id,
            len(ansible_snippet or ""),
        )
        return {"status": "skipped", "message": "Mock mode: remediation not executed"}
