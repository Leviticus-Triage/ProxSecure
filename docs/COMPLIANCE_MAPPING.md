# Compliance Mapping Validation Checklist

ProxSecure audit checks are mapped to ISO 27001:2022, BSI IT-Grundschutz Edition 2023, and NIS2 Directive Article 21. This table documents the control mapping for validation and audit evidence.

| Check ID | ISO 2013 | ISO 2022 | BSI 2023 | NIS2 Article | Status |
|----------|----------|----------|----------|--------------|--------|
| ssh_root_login | A.9.2.3 | A.8.2 | SYS.1.3.A14 | 21(2)(a) | ✓ |
| firewall_enabled | A.13.1.1/A.13.1.2 | A.8.20/A.8.21 | NET.1.1.A5 | 21(2)(b) | ✓ |
| backup_schedule | A.12.3.1 | A.8.13 | CON.3.1.A1 | 21(2)(c) | ✓ |
| backup_retention | A.12.3.1 | A.8.13 | CON.3.1.A1 | 21(2)(c) | ✓ |
| two_factor_enabled | A.9.4.2 | A.8.5 | APP.4.2.A3 | 21(2)(a) | ✓ |
| syslog_forwarding | A.12.4.1/A.12.4.3 | A.8.15 | SYS.1.1.A18 | 21(2)(d) | ✓ |
| snmp_configured | A.12.4.1 | A.8.15 | SYS.1.1.A18 | 21(2)(d) | ✓ |
| vm_network_segmentation | A.13.1.1 | A.8.20 | NET.1.1.A5 | 21(2)(b) | ✓ |
| vm_resource_limits | A.12.1.4 | A.8.31 | SYS.1.2.A2 | 21(2)(e) | ✓ |
| privileged_access_logging | A.9.2.5/A.12.4.1 | A.5.18/A.8.15 | APP.4.2.A5 | 21(2)(a,d) | ✓ |

## Verification steps

1. Review all ISO 27001:2022 control numbers in `backend/app/core/audit_engine.py` match the mapping table.
2. Verify BSI IT-Grundschutz references against Edition 2023 Kompendium.
3. Test Ansible snippets syntax with `ansible-playbook --syntax-check`.
4. Validate NIS2 Article 21 alignment comments are present in the audit engine.
5. Confirm README documentation reflects 2022 standard accurately.

## Framework versions

- **ISO 27001:2022** – Annex A controls (replaces 2013 numbering).
- **BSI IT-Grundschutz Kompendium Edition 2023** – Module references (SYS, NET, CON, APP).
- **NIS2 Directive Article 21** – Cybersecurity risk-management measures (EU).

All control mappings verified as of January 2026.
