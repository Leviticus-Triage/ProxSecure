# Changelog

All notable changes to ProxSecure are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added

- **deploy.sh:** Interactive deployment script — checks Docker/Docker Compose, prompts for Mock or Real Proxmox mode, generates `backend/.env`, runs `docker-compose up -d --build`, and performs health check against `/api/v1/health`.
- **README screenshots:** Dashboard overview, node list triage, node detail view, and remediation modal images linked in README.
- **Service Ticket button:** "Create Service Ticket" button in node detail view (mock toast: "Ticket #INC-492 created in Jira").
- **Route /dashboard:** Explicit route for charts/overview (same as `/`); `/nodes` remains the node list view.

### Changed

- **PDF report:** Fixed layout — reduced top/bottom margins, title and Executive Summary on page 1 (no separate cover), fixed column widths (Check 35%, Category 15%, Status 10%, Severity 10%, ISO/BSI 30%), table font 8pt with word-wrap for compliance column, ISO and BSI merged into one column.

---

## [0.1.0] - Initial Release

### Added

- **Audit engine:** Registry-pattern audit engine with 10 compliance checks mapping to ISO 27001:2022 and BSI IT-Grundschutz.
- **Proxmox integration:** Mock, real (proxmoxer), and hybrid Proxmox modes configurable via environment (`PROXMOX_MODE`, `PROXMOX_HYBRID_CONFIG`).
- **Automation API:** POST `/api/v1/automation/remediate` (dry-run and execute), remediation history and status endpoints.
- **React dashboard:** Fleet overview, node triage table, compliance score cards, 30-day trend charts, node detail view with remediation modal.
- **PDF reports:** Professional audit report generation via ReportLab.
- **Docker deployment:** Docker Compose stack with Nginx, backend, and frontend containers.
- **Documentation:** README with architecture and system diagrams, AUTOMATION.md, DEPLOYMENT.md, SECURITY.md, contributing guidelines.

### Security

- Credentials via environment variables or Docker secrets; no hardcoded secrets.
- Optional automation with dry-run and audit trail; security best practices documented in DEPLOYMENT.md and SECURITY.md.
