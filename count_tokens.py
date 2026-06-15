#!/usr/bin/env python3
"""
Count token usage from Claude Code JSONL session files.

Usage:
    python3 count_tokens.py <directory>
    python3 count_tokens.py ~/.claude/projects/-home-hungnv256-Documents-code
"""

import json
import glob
import sys
import os
from collections import defaultdict


def get_first_user_prompt(filepath: str) -> str:
    """Extract the first user message text, limited to 20 words."""
    try:
        with open(filepath, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue

                msg = obj.get("message", {})
                if not isinstance(msg, dict):
                    continue
                if msg.get("role") != "user":
                    continue

                content = msg.get("content", "")
                text = ""
                if isinstance(content, list):
                    for c in content:
                        if isinstance(c, dict) and c.get("type") == "text":
                            text = c.get("text", "").strip()
                            break
                elif isinstance(content, str):
                    text = content.strip()

                if not text:
                    continue

                # Skip các message từ local command hooks (/clear, /compact, etc.)
                if "<local-command-caveat>" in text or "<command-name>" in text or text.startswith("/"):
                    continue

                # Giới hạn 20 chữ
                words = text.split()
                if len(words) > 20:
                    return " ".join(words[:20]) + "..."
                return text
    except Exception:
        pass
    return "(no prompt found)"


def parse_usage(usage: dict) -> dict:
    return {
        "input_tokens": usage.get("input_tokens", 0),
        "cache_creation_input_tokens": usage.get("cache_creation_input_tokens", 0),
        "cache_read_input_tokens": usage.get("cache_read_input_tokens", 0),
        "output_tokens": usage.get("output_tokens", 0),
    }


def count_file(filepath: str) -> dict:
    totals = defaultdict(int)
    seen_uuids = set()
    entry_count = 0

    with open(filepath, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue

            msg = obj.get("message")
            if not isinstance(msg, dict):
                continue
            usage = msg.get("usage")
            if not isinstance(usage, dict):
                continue

            uuid = obj.get("uuid")

            if uuid and uuid in seen_uuids:
                print(f"  [WARN] Duplicate UUID skipped: {uuid}")
                continue
            if uuid:
                seen_uuids.add(uuid)

            parsed = parse_usage(usage)
            for k, v in parsed.items():
                totals[k] += v
            entry_count += 1

    totals["_entry_count"] = entry_count
    return dict(totals)


# Sonnet 4.6 pricing (per 1M tokens)
PRICE_INPUT_PER_M = 3.00
PRICE_CACHE_WRITE_PER_M = 3.75
PRICE_CACHE_READ_PER_M = 0.30
PRICE_OUTPUT_PER_M = 15.00

# Claude Pro 5-hour window token budget (tổng input + output).
# Anthropic không công bố con số chính xác — đây là ước tính thực nghiệm
# dựa trên báo cáo cộng đồng sau khi Anthropic tăng gấp đôi limit tháng 5/2026.
# Nguồn: https://github.com/anthropics/claude-code/issues/9094
# Chỉnh PRO_WINDOW_TOKENS nếu bạn quan sát limit thực tế khác.
PRO_WINDOW_TOKENS = 900_000  # ~900k tokens / 5h (ước tính sau khi x2)


def estimate_cost(d: dict) -> float:
    return (
        d.get("input_tokens", 0) / 1_000_000 * PRICE_INPUT_PER_M
        + d.get("cache_creation_input_tokens", 0) / 1_000_000 * PRICE_CACHE_WRITE_PER_M
        + d.get("cache_read_input_tokens", 0) / 1_000_000 * PRICE_CACHE_READ_PER_M
        + d.get("output_tokens", 0) / 1_000_000 * PRICE_OUTPUT_PER_M
    )


def fmt(n: int) -> str:
    return f"{n:>12,}"


def print_row(label: str, d: dict, prefix: str = ""):
    print(f"{prefix}{label}")
    print(f"  {'input_tokens':<35}{fmt(d.get('input_tokens', 0))}")
    print(f"  {'cache_creation_input_tokens':<35}{fmt(d.get('cache_creation_input_tokens', 0))}")
    print(f"  {'cache_read_input_tokens':<35}{fmt(d.get('cache_read_input_tokens', 0))}")
    print(f"  {'output_tokens':<35}{fmt(d.get('output_tokens', 0))}")
    total_in = (
        d.get("input_tokens", 0)
        + d.get("cache_creation_input_tokens", 0)
        + d.get("cache_read_input_tokens", 0)
    )
    print(f"  {'--- total input (inc. cache)':<35}{fmt(total_in)}")
    print(f"  {'API calls (assistant entries)':<35}{fmt(d.get('_entry_count', 0))}")
    cost = estimate_cost(d)
    print(f"  {'--- chi phí ước tính (Sonnet 4.6)':<35}  ${cost:>10.4f}")
    total_tokens = (
        d.get("input_tokens", 0)
        + d.get("cache_creation_input_tokens", 0)
        + d.get("cache_read_input_tokens", 0)
        + d.get("output_tokens", 0)
    )
    pct = total_tokens / PRO_WINDOW_TOKENS * 100
    print(f"  {'--- % window Pro 5h (~900k, ước tính)':<35}  {pct:>9.1f}%")


def main():
    directory = sys.argv[1] if len(sys.argv) > 1 else "."
    directory = os.path.expanduser(directory)

    pattern = os.path.join(directory, "*.jsonl")
    files = sorted(glob.glob(pattern))

    if not files:
        print(f"No .jsonl files found in: {directory}")
        sys.exit(1)

    print(f"Directory : {directory}")
    print(f"Files     : {len(files)}")
    print("=" * 60)

    grand = defaultdict(int)

    for filepath in files:
        fname = os.path.basename(filepath)
        first_prompt = get_first_user_prompt(filepath)
        title = f'"{first_prompt}" | {fname}'
        result = count_file(filepath)
        print_row(title, result)
        print()
        for k, v in result.items():
            grand[k] += v

    print("=" * 60)
    print_row("GRAND TOTAL", grand)


if __name__ == "__main__":
    main()
