"""Unit tests for automation/remediation execution service."""

import pytest

from app.services.automation_service import AutomationService
from app.services.proxmox_mock import ProxmoxMockService


class TestAutomationService:
    """Remediation execution and dry-run."""

    @pytest.fixture
    def automation_service(self):
        prox = ProxmoxMockService()
        return AutomationService(proxmox_service=prox)

    def test_execute_remediation_dry_run(self, automation_service):
        resp = automation_service.execute_remediation(
            node_id="customer-a-node",
            check_id="ssh_root_login",
            ansible_snippet="- name: test\n  debug: msg=hi",
            dry_run=True,
        )
        assert resp.execution_id.startswith("rem-")
        assert resp.node_id == "customer-a-node"
        assert resp.check_id == "ssh_root_login"
        assert resp.status == "skipped"
        assert resp.dry_run is True

    def test_execute_remediation_execute_mock(self, automation_service):
        resp = automation_service.execute_remediation(
            node_id="customer-a-node",
            check_id="ssh_root_login",
            ansible_snippet="- name: test\n  debug: msg=hi",
            dry_run=False,
        )
        assert resp.status in ("success", "skipped")
        assert resp.dry_run is False

    def test_get_history(self, automation_service):
        automation_service.execute_remediation(
            node_id="customer-a-node",
            check_id="ssh_root_login",
            ansible_snippet="test",
            dry_run=True,
        )
        history = automation_service.get_history(node_id="customer-a-node")
        assert len(history) >= 1
        assert history[0].node_id == "customer-a-node"

    def test_get_history_filter_by_node(self, automation_service):
        automation_service.execute_remediation(
            node_id="customer-a-node",
            check_id="ssh_root_login",
            ansible_snippet="test",
            dry_run=True,
        )
        automation_service.execute_remediation(
            node_id="customer-b-node",
            check_id="firewall_enabled",
            ansible_snippet="test",
            dry_run=True,
        )
        history_a = automation_service.get_history(node_id="customer-a-node")
        history_b = automation_service.get_history(node_id="customer-b-node")
        assert all(h.node_id == "customer-a-node" for h in history_a)
        assert all(h.node_id == "customer-b-node" for h in history_b)

    def test_get_status(self, automation_service):
        status = automation_service.get_status()
        assert "enabled" in status
        assert "history_count" in status
