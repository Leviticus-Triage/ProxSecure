# ProxSecure Automation Guide

Remediation execution (dry-run and execute) with safety and audit trail.

---

## 1. Overview

When `AUTOMATION_ENABLED=true`, the API and frontend allow:

- **Dry-run:** Validate and log what would be executed; no changes on the node.
- **Execute:** Run remediation via the Proxmox service (mock logs only; real mode can integrate with Proxmox API or Ansible).

Remediation snippets are taken from the audit engine (Ansible snippets per check). The automation service records each execution in memory (execution_id, node_id, check_id, status, timestamp, output/error).

---

## 2. API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/automation/remediate` | Body: `{ "node_id", "check_id", "dry_run": true }`. Returns execution status and output. |
| GET | `/api/v1/automation/history/{node_id}` | List past executions for the node. |
| GET | `/api/v1/automation/status` | Returns `enabled` (from settings) and service status. |

If `AUTOMATION_ENABLED=false`, POST `/automation/remediate` returns **403 Forbidden**.

---

## 3. Safety Considerations

- **Opt-in:** Automation is disabled by default; enable only when needed.
- **Dry-run first:** Use `dry_run: true` to validate and inspect before executing.
- **Critical checks:** The frontend shows a confirmation for critical-severity checks before execute.
- **Audit trail:** All executions are logged (execution_id, node_id, check_id, status, timestamp). In production, persist to a database for long-term audit.
- **Rate limiting:** Consider adding rate limits on `/automation/remediate` in production to avoid accidental bulk execution.

---

## 4. Frontend Integration

In the remediation modal (per check):

- If automation is enabled, an **Execute Remediation** section appears with:
  - **Dry run** — calls API with `dry_run: true` and shows result.
  - **Execute** — calls API with `dry_run: false`; for critical checks, a browser confirm is shown first.
- Execution status and output are shown below the buttons.
- Recent executions for the current check/node are listed when history is available.

---

## 5. Future: Ansible Tower / AWX

The current implementation uses the Proxmox service’s `execute_remediation` (mock logs; real service can stub or call external systems). For full playbook execution:

- Integrate with Ansible Tower or AWX API: submit job template with node and snippet.
- Keep the same API contract: `POST /automation/remediate` with node_id, check_id, dry_run; backend translates to Tower/AWX job and returns job status as execution result.
