#!/usr/bin/env python3
"""
One-time cleanup: remove em dashes from all brief_corpus rows.
Replaces em/en dashes with commas or periods depending on context,
then cleans up any punctuation artifacts.

Usage:
  python3 fix_em_dashes.py --dry-run   # preview changes without writing
  python3 fix_em_dashes.py             # apply fixes to all rows
"""

import re
import sys
import os
import json
import argparse
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

DRY_RUN = "--dry-run" in sys.argv


def scrub(text: str) -> str:
    if not text:
        return text
    # Em/en dash with surrounding spaces → comma
    text = re.sub(r'\s*[—–]\s*', ', ', text)
    # Any remaining bare dashes (no spaces caught above)
    text = re.sub(r'[—–]', ', ', text)
    # Clean up punctuation artifacts
    text = re.sub(r',\s*,', ',', text)
    text = re.sub(r',\s*\.', '.', text)
    text = re.sub(r'\.\s*,', '.', text)
    text = re.sub(r',\s*$', '.', text)
    # Collapse multiple spaces
    text = re.sub(r'  +', ' ', text)
    return text.strip()


def scrub_fields(fields: dict) -> dict:
    return {k: scrub(v) if isinstance(v, str) else v for k, v in fields.items()}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    sb = create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )

    result = sb.table("brief_corpus").select("id, raw_text, extracted_fields").execute()
    rows = result.data
    print(f"Fetched {len(rows)} rows")

    updated = 0
    skipped = 0

    for row in rows:
        new_raw = scrub(row.get("raw_text") or "")
        orig_fields = row.get("extracted_fields") or {}
        new_fields = scrub_fields(orig_fields)

        changed = (new_raw != row.get("raw_text")) or (new_fields != orig_fields)

        if not changed:
            skipped += 1
            continue

        if args.dry_run:
            print(f"\n── Row {row['id'][:8]} ──")
            if new_raw != row.get("raw_text"):
                print(f"  raw_text before: {(row.get('raw_text') or '')[:120]}")
                print(f"  raw_text after:  {new_raw[:120]}")
            for k in new_fields:
                if new_fields[k] != orig_fields.get(k):
                    print(f"  {k} before: {str(orig_fields.get(k))[:100]}")
                    print(f"  {k} after:  {str(new_fields[k])[:100]}")
        else:
            sb.table("brief_corpus").update({
                "raw_text": new_raw,
                "extracted_fields": new_fields,
            }).eq("id", row["id"]).execute()

        updated += 1

    print(f"\n{'[DRY RUN] Would update' if args.dry_run else 'Updated'}: {updated} rows")
    print(f"Skipped (no em dashes): {skipped} rows")


if __name__ == "__main__":
    main()
