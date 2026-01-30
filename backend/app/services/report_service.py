"""PDF compliance audit report generation using ReportLab."""

from datetime import datetime
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    SimpleDocTemplate,
)

from app.models.check import HistoricalDataPoint, NodeAuditResult

# ProxSecure theme: blue accents, neutral grays
COLOR_PRIMARY = colors.HexColor("#3b82f6")
COLOR_GRAY_800 = colors.HexColor("#1f2937")
COLOR_GRAY_600 = colors.HexColor("#4b5563")
COLOR_GRAY_200 = colors.HexColor("#e5e7eb")
COLOR_PASS = colors.HexColor("#10b981")
COLOR_FAIL = colors.HexColor("#ef4444")


class ReportService:
    """
    Generates PDF compliance audit reports from NodeAuditResult.
    Returns PDF bytes; filename format: compliance-report-{node_id}-{YYYY-MM-DD}.pdf
    """

    def generate_pdf_report(
        self,
        node_id: str,
        audit_result: NodeAuditResult,
        history: list[HistoricalDataPoint] | None = None,
    ) -> bytes:
        """
        Build a multi-section PDF report and return as bytes.

        Args:
            node_id: Node identifier (used in filename).
            audit_result: Full node audit result from AuditService.get_node_audit().
            history: Optional 30-day compliance trend (from AuditService.get_node_history).
                     If None or empty, the Compliance Trend Summary section is omitted.

        Returns:
            PDF file content as bytes.
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5 * cm,
            leftMargin=1.5 * cm,
            topMargin=1.5 * cm,
            bottomMargin=1.5 * cm,
        )
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            name="ProxSecureTitle",
            parent=styles["Title"],
            fontSize=22,
            textColor=COLOR_PRIMARY,
            spaceAfter=12,
        )
        heading_style = ParagraphStyle(
            name="ProxSecureHeading",
            parent=styles["Heading2"],
            fontSize=14,
            textColor=COLOR_GRAY_800,
            spaceBefore=14,
            spaceAfter=8,
        )
        body_style = ParagraphStyle(
            name="ProxSecureBody",
            parent=styles["Normal"],
            fontSize=10,
            textColor=COLOR_GRAY_600,
            spaceAfter=6,
        )
        story = []

        # --- Cover Page ---
        story.append(Paragraph("Compliance Audit Report", title_style))
        story.append(Spacer(1, 0.5 * cm))
        story.append(
            Paragraph(
                f"<b>Customer Node:</b> {audit_result.node_name or node_id}",
                body_style,
            )
        )
        gen_date = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
        story.append(Paragraph(f"<b>Report generated:</b> {gen_date}", body_style))
        story.append(Spacer(1, 1 * cm))
        story.append(
            Paragraph(
                "<i>ProxSecure Audit — Compliance automation for Proxmox infrastructure</i>",
                body_style,
            )
        )
        story.append(PageBreak())

        # --- Executive Summary ---
        story.append(Paragraph("Executive Summary", heading_style))
        score = audit_result.compliance_score
        total = audit_result.total_checks
        passed = audit_result.passed_checks
        failed = audit_result.failed_checks
        story.append(
            Paragraph(
                f"Overall compliance score: <b>{score}%</b>. "
                f"Total checks: {total} (Passed: {passed}, Failed: {failed}).",
                body_style,
            )
        )
        critical_failed = [
            c for c in audit_result.check_results
            if c.status == "FAIL" and c.severity == "CRITICAL"
        ]
        if critical_failed:
            story.append(
                Paragraph(
                    f"Critical findings: {len(critical_failed)}. "
                    "See Detailed Findings and Remediation Roadmap below.",
                    body_style,
                )
            )
        else:
            story.append(
                Paragraph(
                    "No critical-severity failures in this audit.",
                    body_style,
                )
            )
        story.append(Spacer(1, 0.5 * cm))

        # --- Detailed Findings Table ---
        story.append(Paragraph("Detailed Findings", heading_style))
        table_data = [
            [
                "Check Name",
                "Category",
                "Status",
                "Severity",
                "ISO 27001",
                "BSI IT-Grundschutz",
            ]
        ]
        for r in audit_result.check_results:
            iso_refs = ", ".join(r.compliance_mapping.iso_27001) if r.compliance_mapping else "—"
            bsi_refs = ", ".join(r.compliance_mapping.bsi_grundschutz) if r.compliance_mapping else "—"
            table_data.append([
                r.check_name or r.check_id,
                r.category.replace("_", " ") if r.category else "—",
                r.status,
                r.severity or "—",
                iso_refs,
                bsi_refs,
            ])
        t = Table(table_data, colWidths=[4 * cm, 2.5 * cm, 1.5 * cm, 1.5 * cm, 2.5 * cm, 2.5 * cm])
        t.setStyle(
            TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), COLOR_GRAY_800),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, 0), 8),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 10),
                ("TOPPADDING", (0, 0), (-1, 0), 10),
                ("BACKGROUND", (0, 1), (-1, -1), colors.white),
                ("TEXTCOLOR", (0, 1), (-1, -1), COLOR_GRAY_600),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 1), (-1, -1), 7),
                ("GRID", (0, 0), (-1, -1), 0.5, COLOR_GRAY_200),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("WORDWRAP", (0, 0), (-1, -1), True),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 1), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
            ])
        )
        story.append(t)
        story.append(PageBreak())

        # --- Remediation Roadmap (failed checks by priority) ---
        failed_checks = [c for c in audit_result.check_results if c.status == "FAIL" and c.remediation]
        by_priority: dict[str, list] = {"HIGH": [], "MEDIUM": [], "LOW": []}
        for c in failed_checks:
            prio = (c.remediation.priority or "MEDIUM").upper()
            by_priority[prio if prio in by_priority else "MEDIUM"].append(c)

        story.append(Paragraph("Remediation Roadmap", heading_style))
        for priority in ("HIGH", "MEDIUM", "LOW"):
            items = by_priority.get(priority, [])
            if not items:
                continue
            story.append(Paragraph(f"<b>{priority} priority</b>", body_style))
            for c in items:
                story.append(Paragraph(f"• {c.check_name} ({c.category})", body_style))
                if c.remediation and c.remediation.ansible_snippet:
                    story.append(
                        Paragraph(
                            f'<font size="8" face="Courier">{c.remediation.ansible_snippet[:500].replace(chr(10), "<br/>")}...</font>'
                            if len(c.remediation.ansible_snippet) > 500
                            else f'<font size="8" face="Courier">{c.remediation.ansible_snippet.replace(chr(10), "<br/>")}</font>',
                            body_style,
                        )
                    )
                story.append(Spacer(1, 0.2 * cm))
            story.append(Spacer(1, 0.3 * cm))

        # --- Compliance Trend Summary (optional when history is available) ---
        story.append(Paragraph("Compliance Trend Summary", heading_style))
        if history and len(history) > 0:
            scores = [p.compliance_score for p in history]
            min_s, max_s = min(scores), max(scores)
            avg_s = round(sum(scores) / len(scores), 1) if scores else 0
            trend_text = (
                f"Based on the last {len(history)} days: minimum compliance <b>{min_s}%</b>, "
                f"average <b>{avg_s}%</b>, maximum <b>{max_s}%</b>."
            )
            story.append(Paragraph(trend_text, body_style))
            if len(scores) >= 2:
                delta = scores[-1] - scores[0]
                if delta > 0:
                    story.append(
                        Paragraph(f"Overall trend: <b>+{delta}%</b> versus start of period (improving).", body_style)
                    )
                elif delta < 0:
                    story.append(
                        Paragraph(f"Overall trend: <b>{delta}%</b> versus start of period (declining).", body_style)
                    )
                else:
                    story.append(Paragraph("Overall trend: stable over the period.", body_style))
            story.append(Spacer(1, 0.3 * cm))
        else:
            story.append(
                Paragraph(
                    "No historical trend data available for this node. Compliance trend charts are available in the web dashboard.",
                    body_style,
                )
            )

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    def get_report_filename(self, node_id: str) -> str:
        """Return suggested filename: compliance-report-{node_id}-{YYYY-MM-DD}.pdf"""
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        return f"compliance-report-{node_id}-{date_str}.pdf"
