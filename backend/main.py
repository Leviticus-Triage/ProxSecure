"""FastAPI application entry point for ProxSecure Audit API."""

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.audit_engine import default_engine
from app.core.config import get_settings
from app.services.audit_service import AuditService
from app.services.automation_service import AutomationService
from app.services.proxmox_base import ProxmoxServiceProtocol
from app.services.proxmox_hybrid import ProxmoxHybridService
from app.services.proxmox_mock import ProxmoxMockService
from app.services.proxmox_real import ProxmoxRealService

logger = logging.getLogger(__name__)

app = FastAPI(
    title="ProxSecure Audit API",
    description="Compliance automation for Proxmox infrastructure (MSP-focused)",
    version="0.1.0",
    docs_url="/docs",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def create_proxmox_service() -> ProxmoxServiceProtocol:
    """Factory: return mock, real, or hybrid service based on PROXMOX_MODE."""
    settings = get_settings()
    mode = (settings.PROXMOX_MODE or "mock").lower()
    if mode == "mock":
        return ProxmoxMockService()
    if mode == "real":
        settings.validate_for_mode()
        return ProxmoxRealService(
            host=settings.PROXMOX_HOST,
            user=settings.PROXMOX_USER,
            password=settings.PROXMOX_PASSWORD or None,
            token_name=settings.PROXMOX_TOKEN_NAME or None,
            token_value=settings.PROXMOX_TOKEN_VALUE or None,
            verify_ssl=settings.PROXMOX_VERIFY_SSL,
        )
    if mode == "hybrid":
        settings.validate_for_mode()
        real_svc = ProxmoxRealService(
            host=settings.PROXMOX_HOST,
            user=settings.PROXMOX_USER,
            password=settings.PROXMOX_PASSWORD or None,
            token_name=settings.PROXMOX_TOKEN_NAME or None,
            token_value=settings.PROXMOX_TOKEN_VALUE or None,
            verify_ssl=settings.PROXMOX_VERIFY_SSL,
        )
        return ProxmoxHybridService(
            hybrid_config=settings.hybrid_config_dict(),
            real_service=real_svc,
        )
    logger.warning("Unknown PROXMOX_MODE=%s; falling back to mock", mode)
    return ProxmoxMockService()


def _create_services():
    """Create proxmox and audit services; fall back to mock on real/hybrid connection failure."""
    settings = get_settings()
    mode = (settings.PROXMOX_MODE or "mock").lower()
    try:
        proxmox_service = create_proxmox_service()
        if mode in ("real", "hybrid"):
            try:
                nodes = proxmox_service.get_all_nodes()
                logger.info("Proxmox connection OK; nodes=%s", nodes[:10] if len(nodes) > 10 else nodes)
            except Exception as e:
                logger.warning("Proxmox connection failed; falling back to mock: %s", e)
                proxmox_service = ProxmoxMockService()
    except Exception as e:
        logger.warning("create_proxmox_service failed; falling back to mock: %s", e)
        proxmox_service = ProxmoxMockService()
    audit_engine = default_engine
    audit_service = AuditService(proxmox_service=proxmox_service, audit_engine=audit_engine)
    automation_service = AutomationService(
        proxmox_service=proxmox_service,
        automation_enabled=settings.AUTOMATION_ENABLED,
    )
    return proxmox_service, audit_service, automation_service


proxmox_service, audit_service, automation_service = _create_services()
app.state.audit_service = audit_service
app.state.automation_service = automation_service
app.state.proxmox_service = proxmox_service

app.include_router(router)


@app.on_event("startup")
async def startup_validate():
    """Validate Proxmox connectivity in real/hybrid modes; log and degrade to mock on failure."""
    settings = get_settings()
    mode = (settings.PROXMOX_MODE or "mock").lower()
    if mode not in ("real", "hybrid"):
        return
    try:
        settings.validate_for_mode()
        svc = app.state.proxmox_service
        nodes = svc.get_all_nodes()
        logger.info("Startup: Proxmox OK, nodes=%s", len(nodes))
    except Exception as e:
        logger.warning("Startup: Proxmox validation failed (services already fallback to mock): %s", e)
