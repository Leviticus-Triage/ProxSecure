"""Registry Pattern audit engine with pluggable compliance checks."""

from dataclasses import dataclass
from datetime import datetime
from typing import Callable

from app.models.check import (
    CheckResult,
    ComplianceMapping,
    RemediationTemplate,
)


@dataclass
class CheckDefinition:
    """Definition of a single compliance check: metadata, validator, and remediation."""

    check_id: str
    check_name: str
    category: str
    severity: str
    compliance_mapping: ComplianceMapping
    validator_func: Callable[[dict], bool]
    remediation_template: RemediationTemplate | None


# --- Validators (one per compliance check) ---


def validate_ssh_root_login(config: dict) -> bool:
    """Check that SSH does not permit root login (ssh_permit_root_login == "no")."""
    return config.get("ssh_permit_root_login") == "no"


def validate_firewall_enabled(config: dict) -> bool:
    """Check that firewall is enabled."""
    return config.get("firewall_enabled") is True


def validate_backup_schedule(config: dict) -> bool:
    """Check that a backup schedule is configured (not None)."""
    return config.get("backup_schedule") is not None


def validate_backup_retention(config: dict) -> bool:
    """Check that backup retention is at least 7 days."""
    val = config.get("backup_retention_days")
    return isinstance(val, (int, float)) and val >= 7


def validate_two_factor(config: dict) -> bool:
    """Check that two-factor authentication is enabled."""
    return config.get("two_factor_enabled") is True


def validate_syslog_forwarding(config: dict) -> bool:
    """Check that syslog forwarding is enabled."""
    return config.get("syslog_forwarding") is True


def validate_snmp_configured(config: dict) -> bool:
    """Check that SNMP is configured."""
    return config.get("snmp_configured") is True


def validate_vm_segmentation(config: dict) -> bool:
    """Check that VM network segmentation is enabled."""
    return config.get("vm_network_segmentation") is True


def validate_resource_limits(config: dict) -> bool:
    """Check that VM resource limits are configured."""
    return config.get("vm_resource_limits") is True


def validate_privileged_logging(config: dict) -> bool:
    """Check that privileged access logging is enabled."""
    return config.get("privileged_access_logging") is True


# --- Check definitions with ISO 27001, BSI IT-Grundschutz, and Ansible remediation ---

CHECK_SSH_ROOT = CheckDefinition(
    check_id="ssh_root_login",
    check_name="SSH root login disabled",
    category="ACCESS_CONTROL",
    severity="CRITICAL",
    compliance_mapping=ComplianceMapping(
        iso_27001=["A.9.2.3"],
        bsi_grundschutz=["SYS.1.3.A14"],
    ),
    validator_func=validate_ssh_root_login,
    remediation_template=RemediationTemplate(
        description="Disable SSH root login via PermitRootLogin no",
        ansible_snippet=(
            "- name: Disable SSH root login\n"
            "  ansible.builtin.lineinfile:\n"
            "    path: /etc/ssh/sshd_config\n"
            "    regexp: '^#?PermitRootLogin'\n"
            "    line: 'PermitRootLogin no'\n"
            "  notify: restart sshd\n"
        ),
        priority="HIGH",
    ),
)

CHECK_FIREWALL = CheckDefinition(
    check_id="firewall_enabled",
    check_name="Firewall enabled",
    category="NETWORK_SECURITY",
    severity="CRITICAL",
    compliance_mapping=ComplianceMapping(
        iso_27001=["A.13.1.1", "A.13.1.2"],
        bsi_grundschutz=["NET.1.1.A5"],
    ),
    validator_func=validate_firewall_enabled,
    remediation_template=RemediationTemplate(
        description="Enable and start firewall (iptables/nftables)",
        ansible_snippet=(
            "- name: Enable firewall\n"
            "  ansible.builtin.systemd:\n"
            "    name: '{{ proxmox_firewall_service }}'\n"
            "    state: started\n"
            "    enabled: true\n"
        ),
        priority="HIGH",
    ),
)

CHECK_BACKUP_SCHEDULE = CheckDefinition(
    check_id="backup_schedule",
    check_name="Backup schedule configured",
    category="STORAGE_BACKUP",
    severity="CRITICAL",
    compliance_mapping=ComplianceMapping(
        iso_27001=["A.12.3.1"],
        bsi_grundschutz=["CON.3.1.A1"],
    ),
    validator_func=validate_backup_schedule,
    remediation_template=RemediationTemplate(
        description="Configure Proxmox backup schedule (e.g. vzdump cron)",
        ansible_snippet=(
            "- name: Configure backup schedule\n"
            "  community.general.cron:\n"
            "    name: 'Proxmox backup'\n"
            "    minute: '0'\n"
            "    hour: '2'\n"
            "    job: '/usr/bin/vzdump --compress zstd --mode snapshot'\n"
            "    user: root\n"
            "    state: present\n"
        ),
        priority="HIGH",
    ),
)

CHECK_BACKUP_RETENTION = CheckDefinition(
    check_id="backup_retention",
    check_name="Backup retention at least 7 days",
    category="STORAGE_BACKUP",
    severity="HIGH",
    compliance_mapping=ComplianceMapping(
        iso_27001=["A.12.3.1"],
        bsi_grundschutz=["CON.3.1.A1"],
    ),
    validator_func=validate_backup_retention,
    remediation_template=RemediationTemplate(
        description="Set backup retention to at least 7 days",
        ansible_snippet=(
            "- name: Set backup retention\n"
            "  community.general.ini_file:\n"
            "    path: /etc/pve/vzdump.cron\n"
            "    section: retention\n"
            "    option: maxfiles\n"
            "    value: '7'\n"
            "    create: true\n"
        ),
        priority="MEDIUM",
    ),
)

CHECK_TWO_FACTOR = CheckDefinition(
    check_id="two_factor_enabled",
    check_name="Two-factor authentication enabled",
    category="ACCESS_CONTROL",
    severity="CRITICAL",
    compliance_mapping=ComplianceMapping(
        iso_27001=["A.9.4.2"],
        bsi_grundschutz=["APP.4.2.A3"],
    ),
    validator_func=validate_two_factor,
    remediation_template=RemediationTemplate(
        description="Enable 2FA for Proxmox web UI (TOTP)",
        ansible_snippet=(
            "- name: Enable 2FA for realm\n"
            "  community.general.proxmox:\n"
            "    api_host: '{{ proxmox_host }}'\n"
            "    two_factor: true\n"
            "    realm: pam\n"
            "    state: present\n"
        ),
        priority="HIGH",
    ),
)

CHECK_SYSLOG = CheckDefinition(
    check_id="syslog_forwarding",
    check_name="Syslog forwarding enabled",
    category="LOGGING_MONITORING",
    severity="HIGH",
    compliance_mapping=ComplianceMapping(
        iso_27001=["A.12.4.1", "A.12.4.3"],
        bsi_grundschutz=["SYS.1.1.A18"],
    ),
    validator_func=validate_syslog_forwarding,
    remediation_template=RemediationTemplate(
        description="Forward syslog to central SIEM/log server",
        ansible_snippet=(
            "- name: Configure syslog forwarding\n"
            "  ansible.builtin.lineinfile:\n"
            "    path: /etc/rsyslog.d/50-forward.conf\n"
            "    line: '*.* @{{ syslog_server }}:514'\n"
            "    create: true\n"
            "  notify: restart rsyslog\n"
        ),
        priority="MEDIUM",
    ),
)

CHECK_SNMP = CheckDefinition(
    check_id="snmp_configured",
    check_name="SNMP configured for monitoring",
    category="LOGGING_MONITORING",
    severity="MEDIUM",
    compliance_mapping=ComplianceMapping(
        iso_27001=["A.12.4.1"],
        bsi_grundschutz=["SYS.1.1.A18"],
    ),
    validator_func=validate_snmp_configured,
    remediation_template=RemediationTemplate(
        description="Configure SNMP agent for monitoring",
        ansible_snippet=(
            "- name: Install and configure SNMP\n"
            "  ansible.builtin.template:\n"
            "    src: snmpd.conf.j2\n"
            "    dest: /etc/snmp/snmpd.conf\n"
            "  notify: restart snmpd\n"
        ),
        priority="LOW",
    ),
)

CHECK_VM_SEGMENTATION = CheckDefinition(
    check_id="vm_network_segmentation",
    check_name="VM network segmentation",
    category="VIRTUALIZATION_SECURITY",
    severity="HIGH",
    compliance_mapping=ComplianceMapping(
        iso_27001=["A.13.1.1"],
        bsi_grundschutz=["NET.1.1.A5"],
    ),
    validator_func=validate_vm_segmentation,
    remediation_template=RemediationTemplate(
        description="Enforce VM network segmentation (VLANs/firewall rules)",
        ansible_snippet=(
            "- name: Apply VM network segmentation rules\n"
            "  community.general.proxmox:\n"
            "    api_host: '{{ proxmox_host }}'\n"
            "    vmid: '{{ vmid }}'\n"
            "    firewall: true\n"
            "    firewall_rules: '{{ segmentation_rules }}'\n"
            "    state: present\n"
        ),
        priority="MEDIUM",
    ),
)

CHECK_RESOURCE_LIMITS = CheckDefinition(
    check_id="vm_resource_limits",
    check_name="VM resource limits configured",
    category="VIRTUALIZATION_SECURITY",
    severity="MEDIUM",
    compliance_mapping=ComplianceMapping(
        iso_27001=["A.12.1.4"],
        bsi_grundschutz=["SYS.1.2.A2"],
    ),
    validator_func=validate_resource_limits,
    remediation_template=RemediationTemplate(
        description="Set CPU/memory limits on VMs",
        ansible_snippet=(
            "- name: Set VM resource limits\n"
            "  community.general.proxmox:\n"
            "    api_host: '{{ proxmox_host }}'\n"
            "    vmid: '{{ vmid }}'\n"
            "    cores: 4\n"
            "    memory: 8192\n"
            "    state: present\n"
        ),
        priority="LOW",
    ),
)

CHECK_PRIVILEGED_LOGGING = CheckDefinition(
    check_id="privileged_access_logging",
    check_name="Privileged access logging enabled",
    category="LOGGING_MONITORING",
    severity="HIGH",
    compliance_mapping=ComplianceMapping(
        iso_27001=["A.9.2.5", "A.12.4.1"],
        bsi_grundschutz=["APP.4.2.A5"],
    ),
    validator_func=validate_privileged_logging,
    remediation_template=RemediationTemplate(
        description="Enable logging for privileged/sudo access",
        ansible_snippet=(
            "- name: Enable privileged access logging\n"
            "  ansible.builtin.lineinfile:\n"
            "    path: /etc/sudoers.d/audit\n"
            "    line: 'Defaults log_output, log_input'\n"
            "    create: true\n"
            "  when: ansible_os_family == 'Debian'\n"
        ),
        priority="MEDIUM",
    ),
)

ALL_CHECKS: list[CheckDefinition] = [
    CHECK_SSH_ROOT,
    CHECK_FIREWALL,
    CHECK_BACKUP_SCHEDULE,
    CHECK_BACKUP_RETENTION,
    CHECK_TWO_FACTOR,
    CHECK_SYSLOG,
    CHECK_SNMP,
    CHECK_VM_SEGMENTATION,
    CHECK_RESOURCE_LIMITS,
    CHECK_PRIVILEGED_LOGGING,
]


class AuditEngine:
    """
    Registry-based audit engine: register checks and execute them against node configs.
    Returns standardized CheckResult list per node.
    """

    def __init__(self) -> None:
        self._checks: dict[str, CheckDefinition] = {}

    def register_check(self, check_def: CheckDefinition) -> None:
        """
        Add a compliance check to the registry.

        Args:
            check_def: CheckDefinition with id, validator, and remediation.
        """
        self._checks[check_def.check_id] = check_def

    def execute_checks(self, node_config: dict) -> list[CheckResult]:
        """
        Run all registered checks against the given node configuration.

        Args:
            node_config: Dict with keys expected by validators (e.g. ssh_permit_root_login).

        Returns:
            List of CheckResult (one per registered check) with status PASS/FAIL and details.
        """
        results: list[CheckResult] = []
        for check_def in self._checks.values():
            passed = check_def.validator_func(node_config)
            status = "PASS" if passed else "FAIL"
            remediation = None if passed else check_def.remediation_template
            details = (
                f"Check {check_def.check_name} {status}."
                if passed
                else f"Check {check_def.check_name} failed; remediation available."
            )
            results.append(
                CheckResult(
                    check_id=check_def.check_id,
                    check_name=check_def.check_name,
                    category=check_def.category,
                    severity=check_def.severity,
                    status=status,
                    compliance_mapping=check_def.compliance_mapping,
                    remediation=remediation,
                    details=details,
                )
            )
        return results

    def get_all_checks(self) -> list[CheckDefinition]:
        """Return all registered check definitions (for introspection/documentation)."""
        return list(self._checks.values())


def _create_default_engine() -> AuditEngine:
    """Build engine with all 10 compliance checks registered."""
    engine = AuditEngine()
    for check_def in ALL_CHECKS:
        engine.register_check(check_def)
    return engine


default_engine: AuditEngine = _create_default_engine()
