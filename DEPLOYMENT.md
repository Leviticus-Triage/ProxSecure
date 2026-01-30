# ProxSecure Deployment Guide

Step-by-step deployment for mock, real, and hybrid Proxmox modes.

---

## 1. Mock Mode (Development)

Default; no Proxmox connection required.

```bash
# backend/.env or environment
PROXMOX_MODE=mock
AUTOMATION_ENABLED=false
```

- Run backend: `cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000`
- Run frontend: `cd frontend && npm install && npm run dev`
- Access: http://localhost:5173 (frontend), http://localhost:8000/docs (API)

---

## 2. Real Mode (Production)

Connect to a real Proxmox host.

### 2.1 Proxmox API Token (recommended)

1. In Proxmox: Datacenter → Permissions → Users → Add user (e.g. `audit@pve`).
2. Datacenter → Permissions → API Tokens → Add API Token for that user.
3. Grant minimal roles (e.g. read-only for audit; add write only if using automation).

### 2.2 Environment

```bash
PROXMOX_MODE=real
PROXMOX_HOST=proxmox.example.com
PROXMOX_USER=audit@pve
PROXMOX_TOKEN_NAME=audit-token
PROXMOX_TOKEN_VALUE=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
PROXMOX_VERIFY_SSL=true
AUTOMATION_ENABLED=true   # optional; set false for read-only
```

- **Never commit** `.env` with real credentials. Use Docker secrets or CI/CD env injection in production.
- Use **HTTPS** and `PROXMOX_VERIFY_SSL=true` in production.

### 2.3 Docker Compose

```bash
export PROXMOX_MODE=real
export PROXMOX_HOST=proxmox.example.com
export PROXMOX_USER=audit@pve
export PROXMOX_TOKEN_NAME=audit-token
export PROXMOX_TOKEN_VALUE=<your-token>
docker-compose up --build
```

---

## 3. Hybrid Mode (Migration / Testing)

Some nodes use mock data, others the real Proxmox API.

```bash
PROXMOX_MODE=hybrid
PROXMOX_HOST=proxmox.example.com
PROXMOX_USER=audit@pve
PROXMOX_PASSWORD=<password>   # or token
PROXMOX_HYBRID_CONFIG={"customer-a-node":"mock","customer-b-node":"mock","prod-node-1":"real"}
AUTOMATION_ENABLED=false
```

- `PROXMOX_HYBRID_CONFIG` is a JSON object: node_id → `"mock"` or `"real"`.
- Nodes not listed default to mock.

---

## 4. Security Best Practices

- **Credentials:** Use API tokens instead of passwords where possible. Rotate tokens periodically.
- **SSL:** Always use HTTPS for Proxmox in production; keep `PROXMOX_VERIFY_SSL=true`.
- **Permissions:** Create a dedicated Proxmox user with minimal required permissions (read for audit; add write only for automation).
- **Secrets:** In production, inject credentials via Docker secrets, Kubernetes secrets, or a vault — never in `.env` in version control.

---

## 5. Troubleshooting

| Issue | Check |
|-------|--------|
| Connection refused | `PROXMOX_HOST` and firewall (8006 for Proxmox API). |
| SSL errors | `PROXMOX_VERIFY_SSL=false` only for testing; fix certs in production. |
| 401 Unauthorized | User, password/token, and permissions in Proxmox. |
| Node not found | In real mode, node IDs come from Proxmox `/nodes`; ensure hostname matches. |
| Fallback to mock | Backend logs "Proxmox connection failed; falling back to mock". Check settings and connectivity. |

**Diagnostics:** `GET /api/v1/health` returns `proxmox_mode` and `nodes_accessible`. `GET /api/v1/health/proxmox` returns connection status and node list.

---

## 6. Performance

- **Fleet summary:** Target &lt; 200 ms; in real mode latency depends on Proxmox API.
- **Node detail:** Target &lt; 300 ms per node.
- Use connection pooling (proxmoxer reuses connections); for many nodes, consider caching or async where applicable.
