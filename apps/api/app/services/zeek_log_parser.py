"""
PRIVACYLENS — Zeek Log Parser & Live Console Auditor
Parses Zeek network logs (TSV, JSON, DNS, HTTP, SSL), resolves CNAME cloaking,
and formats real-time wire audit console outputs.
"""

import json
import re
from typing import List, Dict, Any, Optional
from ..schemas.schemas import ZeekEvidenceRecord

class ZeekLogParser:
    """
    Parses native Zeek output logs:
    - privacylens_audit.log (Custom Zeek privacy monitor stream)
    - http.log (Zeek standard HTTP transactions)
    - ssl.log (Zeek TLS handshakes & SNI)
    - dns.log (Zeek DNS resolution & CNAME cloaking detection)
    - conn.log (Zeek connection summary records)
    """

    @staticmethod
    def parse_zeek_tsv(tsv_content: str) -> List[ZeekEvidenceRecord]:
        """
        Parses standard Zeek ASCII TSV files with '#fields' headers.
        """
        records: List[ZeekEvidenceRecord] = []
        fields: List[str] = []

        for line in tsv_content.strip().splitlines():
            line = line.strip()
            if not line or line.startswith("#separator") or line.startswith("#set_separator") or line.startswith("#empty_field") or line.startswith("#unset_field") or line.startswith("#path") or line.startswith("#open") or line.startswith("#close") or line.startswith("#types"):
                continue

            if line.startswith("#fields"):
                fields = line.split("\t")[1:]
                continue

            if not fields:
                continue

            parts = line.split("\t")
            if len(parts) != len(fields):
                # Fallback on whitespace split
                parts = re.split(r"\s+", line)
                if len(parts) != len(fields):
                    continue

            row = dict(zip(fields, parts))
            
            # Map Zeek TSV fields to ZeekEvidenceRecord
            is_tracker = row.get("is_tracker", "F").upper() in ["T", "TRUE", "1"]
            is_recorder = row.get("is_screen_recorder", "F").upper() in ["T", "TRUE", "1"]
            is_cloaked = row.get("is_cname_cloaked", "F").upper() in ["T", "TRUE", "1"]

            records.append(
                ZeekEvidenceRecord(
                    ts=row.get("ts"),
                    uid=row.get("uid", f"zeek-{len(records)}"),
                    proto=row.get("proto", "http"),
                    host=row.get("host", ""),
                    uri=row.get("uri") if row.get("uri") != "-" else None,
                    method=row.get("method") if row.get("method") != "-" else None,
                    is_tracker=is_tracker,
                    tracker_name=row.get("tracker_name") if row.get("tracker_name") != "-" else None,
                    tracker_category=row.get("tracker_category") if row.get("tracker_category") != "-" else None,
                    is_screen_recorder=is_recorder,
                    is_cname_cloaked=is_cloaked,
                    cname_target=row.get("cname_target") if row.get("cname_target") != "-" else None,
                    audit_note=row.get("audit_note") if row.get("audit_note") != "-" else None,
                )
            )

        return records

    @staticmethod
    def parse_zeek_json_lines(json_content: str) -> List[ZeekEvidenceRecord]:
        """
        Parses streaming Zeek JSON logs (one JSON object per line).
        """
        records: List[ZeekEvidenceRecord] = []
        for line in json_content.strip().splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                data = json.loads(line)
                records.append(
                    ZeekEvidenceRecord(
                        ts=str(data.get("ts", "")),
                        uid=str(data.get("uid", f"zeek-{len(records)}")),
                        proto=data.get("proto", "http"),
                        host=data.get("host", ""),
                        uri=data.get("uri"),
                        method=data.get("method"),
                        is_tracker=bool(data.get("is_tracker", False)),
                        tracker_name=data.get("tracker_name"),
                        tracker_category=data.get("tracker_category"),
                        is_screen_recorder=bool(data.get("is_screen_recorder", False)),
                        is_cname_cloaked=bool(data.get("is_cname_cloaked", False)),
                        cname_target=data.get("cname_target"),
                        audit_note=data.get("audit_note"),
                    )
                )
            except Exception:
                continue
        return records

    @staticmethod
    def detect_cname_cloaking(dns_tsv: str) -> Dict[str, str]:
        """
        Scans Zeek dns.log output to identify CNAME cloaking where a first-party
        subdomain (e.g. data.example.com) maps to a third-party tracker (e.g. clarity.ms).
        """
        cloaked_map: Dict[str, str] = {}
        for line in dns_tsv.strip().splitlines():
            if line.startswith("#"):
                continue
            parts = line.split("\t")
            if len(parts) >= 3:
                query = parts[0].strip().lower()
                qtype_name = parts[1].strip()
                answers = parts[2].strip()

                if "CNAME" in qtype_name or "cname" in parts:
                    for target in answers.split(","):
                        target_clean = target.strip().lower()
                        # If alias and target belong to different apex domains
                        if any(trk in target_clean for trk in ["clarity.ms", "hotjar", "criteo", "eulerian", "wt-eu02.net"]):
                            cloaked_map[query] = target_clean

        return cloaked_map

    @staticmethod
    def format_console_log(record: ZeekEvidenceRecord, color: bool = True) -> str:
        """
        Formats a Zeek wire record into an informative console log line.
        """
        status_tag = "[CLEAN]"
        color_code = "\033[92m" # Green

        if record.is_screen_recorder:
            status_tag = "[SCREEN REPLAY DETECTED]"
            color_code = "\033[91m" # Red
        elif record.is_cname_cloaked:
            status_tag = f"[CNAME CLOAKED -> {record.cname_target}]"
            color_code = "\033[93m" # Yellow
        elif record.is_tracker:
            status_tag = f"[TRACKER: {record.tracker_name or record.tracker_category}]"
            color_code = "\033[95m" # Magenta

        reset_code = "\033[0m" if color else ""
        color_code = color_code if color else ""

        ts_str = record.ts or "0.000000"
        proto_str = record.proto.upper().ljust(4)
        host_str = record.host
        method_str = f"[{record.method}] " if record.method else ""

        return (
            f"[ZEEK WIRE AUDIT] {color_code}{status_tag}{reset_code} "
            f"UID: {record.uid} | {proto_str} | {method_str}{host_str} | "
            f"Note: {record.audit_note or 'Wire packet analyzed'}"
        )

