"""Remediation execution service: dry-run and execute via Proxmox service."""

import logging
import uuid
from datetime import datetime
from typing import Optional

from app.models.automation import RemediationExecution, RemediationResponse
from app.services.proxmox_base import ProxmoxServiceProtocol

logger = logging.getLogger(__name__)


class AutomationService:
    """
    Executes remediation (Ansible snippets) via ProxmoxServiceProtocol.
    Supports DRY_RUN (validate/log only) and EXECUTE modes.
    """

    def __init__(
        self,
        proxmox_service: ProxmoxServiceProtocol,
        automation_enabled: bool = False,
    ) -> None:
        self._proxmox = proxmox_service
        self._automation_enabled = automation_enabled
        self._history: list[RemediationExecution] = []

    def execute_remediation(
        self,
        node_id: str,
        check_id: str,
        ansible_snippet: str,
        dry_run: bool = True,
    ) -> RemediationResponse:
        """
        Execute or dry-run remediation for a node.

        Args:
            node_id: Target node identifier.
            check_id: Check ID for audit trail.
            ansible_snippet: Ansible playbook/task snippet.
            dry_run: If True, validate and log only; do not execute.

        Returns:
            RemediationResponse with execution_id, status, output/error.
        """
        execution_id = f"rem-{uuid.uuid4().hex[:12]}"
        timestamp = datetime.utcnow()
        try:
            if dry_run:
                logger.info(
                    "Automation dry_run: node_id=%s check_id=%s snippet_len=%d",
                    node_id,
                    check_id,
                    len(ansible_snippet or ""),
                )
                output = f"Dry run: would execute snippet ({len(ansible_snippet or '')} chars) on node {node_id}"
                status = "skipped"
                result = self._proxmox.get_node_config(node_id)
                if result is None:
                    raise ValueError(f"Node not found: {node_id}")
            else:
                if not hasattr(self._proxmox, "execute_remediation"):
                    status = "error"
                    output = None
                    err = "Proxmox service does not support execute_remediation"
                else:
                    out = self._proxmox.execute_remediation(node_id, ansible_snippet or "")
                    if out and out.get("status") == "error":
                        status = "error"
                        output = out.get("message") or out.get("output")
                        err = out.get("error", str(out))
                    else:
                        status = (out or {}).get("status") or "success"
                        output = (out or {}).get("message") or (out or {}).get("output") or "Execution completed"
                        err = None
        except ValueError as e:
            status = "error"
            output = None
            err = str(e)
            logger.warning("Automation execute_remediation validation: %s", e)
        except Exception as e:
            status = "error"
            output = None
            err = str(e)
            logger.exception("Automation execute_remediation failed: %s", e)

        execution = RemediationExecution(
            execution_id=execution_id,
            node_id=node_id,
            check_id=check_id,
            status=status,
            timestamp=timestamp,
            output=output,
            error=err if status == "error" else None,
        )
        self._history.append(execution)

        return RemediationResponse(
            execution_id=execution_id,
            node_id=node_id,
            check_id=check_id,
            status=status,
            dry_run=dry_run,
            timestamp=timestamp,
            output=output,
            error=err if status == "error" else None,
        )

    def get_history(self, node_id: Optional[str] = None) -> list[RemediationExecution]:
        """Return execution history, optionally filtered by node_id."""
        if node_id is None:
            return list(self._history)
        return [h for h in self._history if h.node_id == node_id]

    def get_status(self) -> dict:
        """Return automation service status and config summary (enabled from settings)."""
        return {
            "enabled": self._automation_enabled,
            "history_count": len(self._history),
        }
