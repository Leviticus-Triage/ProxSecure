"""Proxmox service abstraction: protocol for mock, real, and hybrid implementations."""

from typing import Protocol, runtime_checkable


@runtime_checkable
class ProxmoxServiceProtocol(Protocol):
    """
    Protocol for Proxmox data providers (mock, real, or hybrid).
    Implementations must provide node discovery, config, and history;
    execute_remediation is optional for automation support.
    """

    def get_all_nodes(self) -> list[str]:
        """
        Return list of all node IDs.

        Returns:
            List of node identifier strings.
        """
        ...

    def get_node_config(self, node_id: str) -> dict:
        """
        Return configuration dictionary for a node (keys used by audit engine).

        Args:
            node_id: Unique node identifier.

        Returns:
            Config dict (e.g. ssh_permit_root_login, firewall_enabled, backup_schedule).

        Raises:
            ValueError: If node_id is not found.
        """
        ...

    def get_node_history(self, node_id: str) -> list[dict]:
        """
        Return historical trend data for a node.

        Args:
            node_id: Unique node identifier.

        Returns:
            List of dicts with "date" (str) and "compliance_score" (int).

        Raises:
            ValueError: If node_id is not found.
        """
        ...

    def execute_remediation(self, node_id: str, ansible_snippet: str) -> dict | None:
        """
        Optional: Execute remediation (e.g. apply Ansible snippet) on the node.

        Args:
            node_id: Target node identifier.
            ansible_snippet: Ansible playbook/task snippet to execute.

        Returns:
            Result dict (e.g. status, output, error) or None if not supported.
        """
        ...
