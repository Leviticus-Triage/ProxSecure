"""Unit tests for Proxmox mock, real (mocked), and hybrid services."""

from unittest.mock import MagicMock, patch

import pytest

from app.services.proxmox_base import ProxmoxServiceProtocol
from app.services.proxmox_mock import ProxmoxMockService
from app.services.proxmox_real import ProxmoxRealService
from app.services.proxmox_hybrid import ProxmoxHybridService


class TestProxmoxMockService:
    """Existing mock behavior."""

    def test_get_all_nodes(self):
        svc = ProxmoxMockService()
        nodes = svc.get_all_nodes()
        assert isinstance(nodes, list)
        assert "customer-a-node" in nodes
        assert "customer-b-node" in nodes
        assert "customer-c-node" in nodes

    def test_get_node_config(self):
        svc = ProxmoxMockService()
        config = svc.get_node_config("customer-a-node")
        assert "ssh_permit_root_login" in config
        assert config["ssh_permit_root_login"] == "yes"

    def test_get_node_config_not_found(self):
        svc = ProxmoxMockService()
        with pytest.raises(ValueError, match="not found"):
            svc.get_node_config("nonexistent")

    def test_get_node_history(self):
        svc = ProxmoxMockService()
        history = svc.get_node_history("customer-a-node")
        assert isinstance(history, list)
        assert len(history) > 0
        assert "date" in history[0]
        assert "compliance_score" in history[0]

    def test_get_node_history_not_found(self):
        svc = ProxmoxMockService()
        with pytest.raises(ValueError, match="not found"):
            svc.get_node_history("nonexistent")

    def test_execute_remediation_stub(self):
        svc = ProxmoxMockService()
        out = svc.execute_remediation("customer-a-node", "- name: test\n  debug: msg=hi")
        assert out is not None
        assert out.get("status") == "skipped"

    def test_implements_protocol(self):
        assert isinstance(ProxmoxMockService(), ProxmoxServiceProtocol)


class TestProxmoxHybridService:
    """Hybrid routing logic."""

    def test_hybrid_merges_nodes(self):
        config = {"customer-a-node": "mock", "customer-b-node": "mock"}
        hybrid = ProxmoxHybridService(config, real_service=None)
        nodes = hybrid.get_all_nodes()
        assert "customer-a-node" in nodes
        assert "customer-b-node" in nodes
        assert "customer-c-node" in nodes

    def test_hybrid_routes_by_config(self):
        config = {"customer-a-node": "mock"}
        hybrid = ProxmoxHybridService(config, real_service=None)
        cfg = hybrid.get_node_config("customer-a-node")
        assert cfg["ssh_permit_root_login"] == "yes"
        cfg2 = hybrid.get_node_config("customer-b-node")
        assert "ssh_permit_root_login" in cfg2

    def test_hybrid_get_node_history(self):
        config = {}
        hybrid = ProxmoxHybridService(config, real_service=None)
        history = hybrid.get_node_history("customer-a-node")
        assert isinstance(history, list)
        assert len(history) > 0


class TestProxmoxRealService:
    """ProxmoxRealService with mocked proxmoxer.ProxmoxAPI."""

    @staticmethod
    def _make_mock_proxmox(nodes_list=None):
        nodes_list = nodes_list or [{"node": "pve1"}, {"node": "pve2"}]
        mock_px = MagicMock()
        node_mock = MagicMock()
        node_mock.config.get.return_value = {}
        node_mock.firewall.options.get.return_value = {"enable": 0}
        mock_nodes = MagicMock()
        mock_nodes.get.return_value = nodes_list
        mock_nodes.return_value = node_mock
        mock_px.nodes = mock_nodes
        mock_px.access.users.get.return_value = []
        mock_px.cluster = MagicMock()
        mock_px.cluster.backup.get.return_value = {}
        return mock_px

    @patch("app.services.proxmox_real._get_proxmoxer")
    def test_get_all_nodes(self, mock_get_proxmoxer):
        mock_px = self._make_mock_proxmox()
        mock_proxmoxer = MagicMock()
        mock_proxmoxer.ProxmoxAPI.return_value = mock_px
        mock_get_proxmoxer.return_value = mock_proxmoxer

        svc = ProxmoxRealService(
            host="proxmox.example.com",
            user="root@pam",
            token_name="t",
            token_value="v",
        )
        nodes = svc.get_all_nodes()
        assert nodes == ["pve1", "pve2"]

    @patch("app.services.proxmox_real._get_proxmoxer")
    def test_get_node_config_aggregates(self, mock_get_proxmoxer):
        mock_px = self._make_mock_proxmox()
        mock_proxmoxer = MagicMock()
        mock_proxmoxer.ProxmoxAPI.return_value = mock_px
        mock_get_proxmoxer.return_value = mock_proxmoxer

        svc = ProxmoxRealService(
            host="proxmox.example.com",
            user="root@pam",
            password="secret",
        )
        config = svc.get_node_config("pve1")
        assert "ssh_permit_root_login" in config
        assert "firewall_enabled" in config
        assert "backup_schedule" in config
        assert "vm_network_segmentation" in config

    @patch("app.services.proxmox_real._get_proxmoxer")
    def test_get_node_config_node_not_found(self, mock_get_proxmoxer):
        mock_px = self._make_mock_proxmox(nodes_list=[{"node": "pve1"}])
        mock_proxmoxer = MagicMock()
        mock_proxmoxer.ProxmoxAPI.return_value = mock_px
        mock_get_proxmoxer.return_value = mock_proxmoxer

        svc = ProxmoxRealService(
            host="proxmox.example.com",
            user="root@pam",
            password="secret",
        )
        with pytest.raises(ValueError, match="Node not found"):
            svc.get_node_config("nonexistent")

    @patch("app.services.proxmox_real._get_proxmoxer")
    def test_get_node_history_returns_empty(self, mock_get_proxmoxer):
        mock_px = self._make_mock_proxmox()
        mock_proxmoxer = MagicMock()
        mock_proxmoxer.ProxmoxAPI.return_value = mock_px
        mock_get_proxmoxer.return_value = mock_proxmoxer

        svc = ProxmoxRealService(
            host="proxmox.example.com",
            user="root@pam",
            password="secret",
        )
        history = svc.get_node_history("pve1")
        assert history == []

    @patch("app.services.proxmox_real._get_proxmoxer")
    def test_get_node_history_node_not_found(self, mock_get_proxmoxer):
        mock_px = self._make_mock_proxmox(nodes_list=[{"node": "pve1"}])
        mock_proxmoxer = MagicMock()
        mock_proxmoxer.ProxmoxAPI.return_value = mock_px
        mock_get_proxmoxer.return_value = mock_proxmoxer

        svc = ProxmoxRealService(
            host="proxmox.example.com",
            user="root@pam",
            password="secret",
        )
        with pytest.raises(ValueError, match="Node not found"):
            svc.get_node_history("nonexistent")

    @patch("app.services.proxmox_real._get_proxmoxer")
    def test_execute_remediation_stub_returns_result(self, mock_get_proxmoxer):
        mock_px = self._make_mock_proxmox()
        mock_proxmoxer = MagicMock()
        mock_proxmoxer.ProxmoxAPI.return_value = mock_px
        mock_get_proxmoxer.return_value = mock_proxmoxer

        svc = ProxmoxRealService(
            host="proxmox.example.com",
            user="root@pam",
            password="secret",
        )
        out = svc.execute_remediation("pve1", "- name: test\n  debug: msg=hi")
        assert out is not None
        assert out.get("status") == "logged"
        assert "message" in out
