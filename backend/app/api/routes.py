"""FastAPI endpoint definitions for ProxSecure Audit API."""

from fastapi import APIRouter, Depends, HTTPException, Request, Response

from app.core.config import get_settings
from app.models.automation import RemediationRequest, RemediationResponse
from app.models.check import FleetSummary, HistoricalDataPoint, NodeAuditResult
from app.services.audit_service import AuditService
from app.services.automation_service import AutomationService
from app.services.report_service import ReportService

router = APIRouter(prefix="/api/v1", tags=["audit"])


def get_audit_service(request: Request) -> AuditService:
    """Dependency: return the singleton AuditService (set in main on app.state)."""
    return request.app.state.audit_service


def get_automation_service(request: Request) -> AutomationService:
    """Dependency: return the singleton AutomationService."""
    return request.app.state.automation_service


@router.get(
    "/health",
    summary="Health check",
    description="Health check for monitoring; returns service name, Proxmox mode, and automation status.",
)
def health(request: Request) -> dict:
    """
    Return service health status for monitoring/load balancers.
    Includes Proxmox mode, node count, and automation status.
    """
    settings = get_settings()
    mode = (settings.PROXMOX_MODE or "mock").lower()
    payload = {
        "status": "healthy",
        "service": "ProxSecure Audit API",
        "proxmox_mode": mode,
        "automation_enabled": settings.AUTOMATION_ENABLED,
    }
    try:
        prox = request.app.state.proxmox_service
        nodes = prox.get_all_nodes()
        payload["nodes_accessible"] = len(nodes)
    except Exception:
        payload["nodes_accessible"] = 0
    try:
        auto = request.app.state.automation_service
        payload["automation_status"] = auto.get_status()
    except Exception:
        payload["automation_status"] = {"enabled": False}
    return payload


@router.get(
    "/health/proxmox",
    summary="Proxmox connection diagnostics",
    description="Detailed Proxmox connection test without executing checks.",
)
def health_proxmox(request: Request) -> dict:
    """Return Proxmox connectivity diagnostics."""
    settings = get_settings()
    mode = (settings.PROXMOX_MODE or "mock").lower()
    result = {"mode": mode, "connected": False, "nodes": [], "error": None}
    try:
        prox = request.app.state.proxmox_service
        nodes = prox.get_all_nodes()
        result["connected"] = True
        result["nodes"] = nodes
    except Exception as e:
        result["error"] = str(e)
    return result


@router.get(
    "/audit/nodes",
    response_model=FleetSummary,
    summary="Fleet audit summary",
    description="Returns aggregated compliance for all nodes (target response time < 200ms).",
)
def get_fleet_summary(svc: AuditService = Depends(get_audit_service)) -> FleetSummary:
    """
    Run audits for all nodes and return fleet-wide summary.

    Returns:
        FleetSummary with total_nodes, average_compliance, critical_nodes, and per-node results.
    """
    return svc.get_fleet_summary()


@router.get(
    "/audit/nodes/{node_id}",
    response_model=NodeAuditResult,
    summary="Node audit detail",
    description="Returns full audit result for a single node (target response time < 300ms).",
    responses={404: {"description": "Node not found"}},
)
def get_node_audit(node_id: str, svc: AuditService = Depends(get_audit_service)) -> NodeAuditResult:
    """
    Run all compliance checks for the given node and return the audit result.

    Args:
        node_id: Unique node identifier (e.g. customer-a-node).

    Returns:
        NodeAuditResult with compliance_score, check_results, and counts.

    Raises:
        HTTPException 404: If node_id is not found.
    """
    try:
        return svc.get_node_audit(node_id)
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e)) from e
        raise


@router.get(
    "/audit/nodes/{node_id}/history",
    response_model=list[HistoricalDataPoint],
    summary="Node compliance history",
    description="Returns 30-day compliance trend data for the node.",
    responses={404: {"description": "Node not found"}},
)
def get_node_history(
    node_id: str, svc: AuditService = Depends(get_audit_service)
) -> list[HistoricalDataPoint]:
    """
    Return historical compliance trend data for the given node.

    Args:
        node_id: Unique node identifier.

    Returns:
        List of HistoricalDataPoint (date, compliance_score).

    Raises:
        HTTPException 404: If node_id is not found.
    """
    try:
        return svc.get_node_history(node_id)
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e)) from e
        raise


@router.get(
    "/audit/nodes/{node_id}/report",
    summary="Download PDF audit report",
    description="Generate and download compliance audit report as PDF",
    responses={404: {"description": "Node not found"}},
)
def download_node_report(
    node_id: str, svc: AuditService = Depends(get_audit_service)
) -> Response:
    """
    Generate and return compliance audit report as PDF attachment.

    Args:
        node_id: Unique node identifier.

    Returns:
        Response with PDF content and Content-Disposition attachment header.

    Raises:
        HTTPException 404: If node_id is not found.
    """
    try:
        audit_result = svc.get_node_audit(node_id)
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e)) from e
        raise
    history = None
    try:
        history = svc.get_node_history(node_id)
    except ValueError:
        pass  # Report still generated; trend section omitted when history unavailable
    report_service = ReportService()
    pdf_bytes = report_service.generate_pdf_report(node_id, audit_result, history=history)
    filename = report_service.get_report_filename(node_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        },
    )


# --- Automation endpoints ---


@router.post(
    "/automation/remediate",
    response_model=RemediationResponse,
    summary="Execute remediation",
    description="Run or dry-run remediation for a node/check. Requires AUTOMATION_ENABLED.",
    responses={403: {"description": "Automation disabled"}, 404: {"description": "Node or check not found"}},
)
def execute_remediation(
    body: RemediationRequest,
    request: Request,
    audit_svc: AuditService = Depends(get_audit_service),
    auto_svc: AutomationService = Depends(get_automation_service),
) -> RemediationResponse:
    """Execute or dry-run remediation; snippet resolved from node audit by check_id."""
    settings = get_settings()
    if not settings.AUTOMATION_ENABLED:
        raise HTTPException(status_code=403, detail="Automation is disabled")
    try:
        audit_result = audit_svc.get_node_audit(body.node_id)
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e)) from e
        raise
    snippet = None
    for r in audit_result.check_results:
        if r.check_id == body.check_id and r.remediation:
            snippet = r.remediation.ansible_snippet
            break
    if snippet is None:
        raise HTTPException(
            status_code=404,
            detail=f"Check {body.check_id} not found or has no remediation for node {body.node_id}",
        )
    return auto_svc.execute_remediation(
        node_id=body.node_id,
        check_id=body.check_id,
        ansible_snippet=snippet,
        dry_run=body.dry_run,
    )


@router.get(
    "/automation/history/{node_id}",
    summary="Remediation history for node",
    description="Return list of past remediation executions for the node.",
)
def get_remediation_history(
    node_id: str,
    auto_svc: AutomationService = Depends(get_automation_service),
) -> list:
    """Return execution history for the given node."""
    executions = auto_svc.get_history(node_id=node_id)
    return [{"execution_id": e.execution_id, "node_id": e.node_id, "check_id": e.check_id, "status": e.status, "timestamp": e.timestamp.isoformat(), "error": e.error} for e in executions]


@router.get(
    "/automation/status",
    summary="Automation service status",
    description="Return automation service status and configuration.",
)
def get_automation_status(
    request: Request,
    auto_svc: AutomationService = Depends(get_automation_service),
) -> dict:
    """Return automation status; includes enabled flag from settings."""
    settings = get_settings()
    return {
        "enabled": settings.AUTOMATION_ENABLED,
        "service": auto_svc.get_status(),
    }
