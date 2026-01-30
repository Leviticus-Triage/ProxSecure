"""Static mock configurations for three differentiated customer nodes and trend data."""

# Three nodes: customer-a-node (40%), customer-b-node (70%), customer-c-node (90%)
# Each key corresponds to a compliance check; values drive PASS/FAIL per plan.

MOCK_NODES: dict[str, dict] = {
    "customer-a-node": {
        "ssh_permit_root_login": "yes",  # FAIL
        "firewall_enabled": False,  # FAIL
        "backup_schedule": None,  # FAIL
        "backup_retention_days": 0,  # FAIL
        "two_factor_enabled": False,  # FAIL
        "syslog_forwarding": False,  # FAIL
        "snmp_configured": True,  # PASS (not critical per plan)
        "vm_network_segmentation": True,  # PASS (not critical)
        "vm_resource_limits": True,  # PASS (not critical)
        "privileged_access_logging": True,  # PASS (not critical)
    },
    "customer-b-node": {
        "ssh_permit_root_login": "no",  # PASS
        "firewall_enabled": True,  # PASS
        "backup_schedule": "0 2 * * *",  # PASS
        "backup_retention_days": 5,  # FAIL (< 7 days)
        "two_factor_enabled": True,  # PASS
        "syslog_forwarding": True,  # PASS
        "snmp_configured": False,  # FAIL
        "vm_network_segmentation": True,  # PASS
        "vm_resource_limits": True,  # PASS
        "privileged_access_logging": False,  # FAIL (3rd fail for 70%)
    },
    "customer-c-node": {
        "ssh_permit_root_login": "no",  # PASS
        "firewall_enabled": True,  # PASS
        "backup_schedule": "0 3 * * *",  # PASS
        "backup_retention_days": 14,  # PASS
        "two_factor_enabled": True,  # PASS
        "syslog_forwarding": True,  # PASS
        "snmp_configured": True,  # PASS
        "vm_network_segmentation": True,  # PASS
        "vm_resource_limits": True,  # PASS
        "privileged_access_logging": False,  # FAIL
    },
}

# 30-day trend data: 5 data points per node showing compliance trajectory.
MOCK_HISTORY: dict[str, list[dict[str, str | int]]] = {
    "customer-a-node": [
        {"date": "2025-01-06", "compliance_score": 30},
        {"date": "2025-01-13", "compliance_score": 35},
        {"date": "2025-01-20", "compliance_score": 38},
        {"date": "2025-01-27", "compliance_score": 40},
        {"date": "2025-01-30", "compliance_score": 40},
    ],
    "customer-b-node": [
        {"date": "2025-01-06", "compliance_score": 60},
        {"date": "2025-01-13", "compliance_score": 65},
        {"date": "2025-01-20", "compliance_score": 68},
        {"date": "2025-01-27", "compliance_score": 70},
        {"date": "2025-01-30", "compliance_score": 70},
    ],
    "customer-c-node": [
        {"date": "2025-01-06", "compliance_score": 80},
        {"date": "2025-01-13", "compliance_score": 85},
        {"date": "2025-01-20", "compliance_score": 88},
        {"date": "2025-01-27", "compliance_score": 90},
        {"date": "2025-01-30", "compliance_score": 90},
    ],
}
