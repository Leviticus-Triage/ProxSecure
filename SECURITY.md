# Security Policy

## Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in ProxSecure, please report it responsibly:

1. **Do not** open a public GitHub issue for security-sensitive findings.
2. Send a private report to the maintainers (e.g. via GitHub Security Advisories: **Security** → **Advisories** → **Report a vulnerability** for this repository, or contact the project owners as indicated in the repository).
3. Include a clear description, steps to reproduce, and impact where possible.
4. Allow a reasonable time for a fix before any public disclosure.

We will acknowledge receipt and work with you to understand and address the issue.

## Security Best Practices for Deployment

- **Credentials:** Never commit `.env` files with real credentials. Use environment variables, Docker secrets, or a secrets manager in production. See [DEPLOYMENT.md](DEPLOYMENT.md) section 4 (Security Best Practices).
- **Proxmox access:** Use dedicated Proxmox users with minimal required permissions; prefer API tokens over passwords. Use HTTPS and `PROXMOX_VERIFY_SSL=true` in production.
- **Automation:** Enable remediation execution only when needed. Always use dry-run first and review the audit trail. See [AUTOMATION.md](AUTOMATION.md) for safety and usage.
- **Network:** Run the application behind a reverse proxy (e.g. Nginx) and restrict access to the backend API as appropriate for your environment.
