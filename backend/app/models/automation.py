"""Pydantic models for remediation automation API."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class RemediationRequest(BaseModel):
    """API input for remediation execution."""

    node_id: str = Field(..., description="Target node identifier")
    check_id: str = Field(..., description="Check identifier for audit trail")
    dry_run: bool = Field(True, description="If True, validate only; do not execute")


class RemediationResponse(BaseModel):
    """API output for remediation execution."""

    execution_id: str = Field(..., description="Unique execution identifier")
    node_id: str = Field(..., description="Target node")
    check_id: str = Field(..., description="Check identifier")
    status: str = Field(..., description="success | skipped | error")
    dry_run: bool = Field(..., description="Whether execution was dry-run")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    output: Optional[str] = Field(None, description="Execution output")
    error: Optional[str] = Field(None, description="Error message if status=error")


class RemediationExecution(BaseModel):
    """Internal model for execution history."""

    execution_id: str
    node_id: str
    check_id: str
    status: str
    timestamp: datetime
    output: Optional[str] = None
    error: Optional[str] = None
