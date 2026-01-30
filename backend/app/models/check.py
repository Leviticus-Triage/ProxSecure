"""Pydantic data models for compliance checks and audit results."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class ComplianceMapping(BaseModel):
    """Dual compliance framework references (ISO 27001 and BSI IT-Grundschutz)."""

    iso_27001: list[str] = Field(..., description="ISO 27001 control references")
    bsi_grundschutz: list[str] = Field(..., description="BSI IT-Grundschutz module references")


class RemediationTemplate(BaseModel):
    """Copy-paste Ansible automation for failed checks."""

    description: str = Field(..., description="Human-readable remediation description")
    ansible_snippet: str = Field(..., description="Ansible playbook/task snippet")
    priority: str = Field(..., description="Remediation priority (e.g., HIGH, MEDIUM)")


class CheckResult(BaseModel):
    """Standardized result of a single compliance check execution."""

    check_id: str = Field(..., description="Unique check identifier")
    check_name: str = Field(..., description="Human-readable check name")
    category: str = Field(..., description="Check category (e.g., ACCESS_CONTROL)")
    severity: str = Field(..., description="Check severity (CRITICAL, HIGH, MEDIUM)")
    status: str = Field(..., description="PASS or FAIL")
    compliance_mapping: ComplianceMapping = Field(..., description="ISO/BSI references")
    remediation: Optional[RemediationTemplate] = Field(
        None, description="Remediation template (typically for failed checks)"
    )
    details: str = Field(..., description="Additional details or message")


class NodeAuditResult(BaseModel):
    """Complete audit report for a single Proxmox node."""

    node_id: str = Field(..., description="Node identifier")
    node_name: str = Field(..., description="Human-readable node name")
    compliance_score: int = Field(..., description="Compliance score 0-100")
    total_checks: int = Field(..., description="Total number of checks executed")
    passed_checks: int = Field(..., description="Number of passed checks")
    failed_checks: int = Field(..., description="Number of failed checks")
    check_results: list[CheckResult] = Field(..., description="Individual check results")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Audit execution time")


class FleetSummary(BaseModel):
    """Aggregated fleet-wide compliance view."""

    total_nodes: int = Field(..., description="Total number of nodes audited")
    average_compliance: float = Field(..., description="Average compliance score across fleet")
    critical_nodes: list[str] = Field(..., description="Node IDs with compliance_score < 60%")
    nodes: list[NodeAuditResult] = Field(..., description="Per-node audit results")


class HistoricalDataPoint(BaseModel):
    """Single data point for compliance trend charts."""

    date: str = Field(..., description="Date string (e.g., YYYY-MM-DD)")
    compliance_score: int = Field(..., description="Compliance score on that date")
