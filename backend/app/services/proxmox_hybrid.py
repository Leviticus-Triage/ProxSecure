"""Hybrid Proxmox service: routes requests to mock or real by node_id."""

import logging
from typing import Any

from app.services.proxmox_base import ProxmoxServiceProtocol
from app.services.proxmox_mock import ProxmoxMockService
from app.services.proxmox_real import ProxmoxRealService

logger = logging.getLogger(__name__)


class ProxmoxHybridService:
    """
    Implements ProxmoxServiceProtocol by routing to mock or real service per node_id.
    Config: { node_id: "mock" | "real" }. Nodes not in config default to mock.
    """

    def __init__(self, hybrid_config: dict[str, str], real_service: ProxmoxRealService | None = None) -> None:
        self._config = dict(hybrid_config or {})
        self._mock = ProxmoxMockService()
        self._real = real_service

    def _service_for(self, node_id: str) -> ProxmoxServiceProtocol:
        mode = self._config.get(node_id, "mock")
        if mode == "real" and self._real:
            return self._real
        return self._mock

    def get_all_nodes(self) -> list[str]:
        """Merge node lists from mock and real (deduplicated)."""
        nodes: set[str] = set()
        nodes.update(self._mock.get_all_nodes())
        if self._real:
            try:
                nodes.update(self._real.get_all_nodes())
            except Exception as e:
                logger.warning("Hybrid get_all_nodes: real service failed: %s", e)
        return sorted(nodes)

    def get_node_config(self, node_id: str) -> dict:
        """Route to mock or real based on hybrid config."""
        svc = self._service_for(node_id)
        return svc.get_node_config(node_id)

    def get_node_history(self, node_id: str) -> list[dict]:
        """Route to mock or real based on hybrid config."""
        svc = self._service_for(node_id)
        return svc.get_node_history(node_id)

    def execute_remediation(self, node_id: str, ansible_snippet: str) -> dict | None:
        """Route to mock or real based on hybrid config."""
        svc = self._service_for(node_id)
        if hasattr(svc, "execute_remediation"):
            return svc.execute_remediation(node_id, ansible_snippet)
        return None
