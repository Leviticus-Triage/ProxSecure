"""Configuration validator and migration helper for Proxmox services."""

import logging
from typing import Any

logger = logging.getLogger(__name__)

# Expected keys used by audit engine validators (from mock_data / audit_engine).
EXPECTED_CONFIG_KEYS = [
    "ssh_permit_root_login",
    "firewall_enabled",
    "backup_schedule",
    "backup_retention_days",
    "two_factor_enabled",
    "syslog_forwarding",
    "snmp_configured",
    "vm_network_segmentation",
    "vm_resource_limits",
    "privileged_access_logging",
]


def validate_config_structure(config: dict[str, Any]) -> tuple[bool, list[str]]:
    """
    Check if config dict has expected keys for audit engine.
    Returns (is_valid, list of missing or invalid keys).
    """
    missing = [k for k in EXPECTED_CONFIG_KEYS if k not in config]
    if missing:
        return False, missing
    return True, []


def compare_mock_vs_real(mock_config: dict[str, Any], real_config: dict[str, Any]) -> dict[str, Any]:
    """
    Compare mock and real config for same node; return diff for troubleshooting.
    Useful for migration when mapping real Proxmox API data to audit engine keys.
    """
    diff: dict[str, Any] = {"missing_in_real": [], "value_diffs": {}}
    for key in EXPECTED_CONFIG_KEYS:
        if key not in real_config:
            diff["missing_in_real"].append(key)
        elif key in mock_config and mock_config[key] != real_config[key]:
            diff["value_diffs"][key] = {"mock": mock_config[key], "real": real_config[key]}
    return diff


def diagnostic_output(service_name: str, node_id: str, config: dict[str, Any]) -> str:
    """Produce diagnostic output for troubleshooting API mapping."""
    valid, missing = validate_config_structure(config)
    lines = [
        f"[{service_name}] node_id={node_id}",
        f"  valid={valid}",
        f"  missing_keys={missing}",
        f"  config_keys={list(config.keys())}",
    ]
    return "\n".join(lines)
