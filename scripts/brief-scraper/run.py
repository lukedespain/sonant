#!/usr/bin/env python3
"""
Run the brief-scraper pipeline.

Usage:
  python run.py              # scrape Reddit, extract, store
  python run.py --dry-run    # scrape + extract, print results without storing
"""

import sys
import time
import os
from supabase import create_client
from dotenv import load_dotenv

from scraper import scrape_reddit
from extractor import extract_brief

load_dotenv()

DRY_RUN = "--dry-run" in sys.argv


def supabase_client():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def already_scraped(sb, source_url: str) -> bool:
    result = sb.table("brief_corpus").select("id").eq("source_url", source_url).execute()
    return len(result.data) > 0


def store_brief(sb, item: dict, extracted: dict) -> bool:
    try:
        sb.table("brief_corpus").insert(
            {
                "source": item["source"],
                "source_url": item["source_url"],
                "raw_text": item["raw_text"],
                "extracted_fields": {
                    "mood": extracted.get("mood"),
                    "genre": extracted.get("genre"),
                    "tempo": extracted.get("tempo"),
                    "scene_context": extracted.get("scene_context"),
                    "music_ask": extracted.get("music_ask"),
                    "instrumentation_notes": extracted.get("instrumentation_notes"),
                },
                "mode": extracted.get("mode"),
                "quality_score": extracted.get("quality_score"),
                "curated": False,
                "approved": False,
            }
        ).execute()
        return True
    except Exception as e:
        print(f"  Store error: {e}")
        return False


def run():
    sb = None if DRY_RUN else supabase_client()

    print("=== Scraping Reddit ===")
    items = scrape_reddit()

    counts = {"stored": 0, "skipped": 0, "not_brief": 0, "errors": 0}

    for i, item in enumerate(items):
        url_short = item["source_url"][-60:]
        print(f"\n[{i + 1}/{len(items)}] {url_short}")

        if sb and already_scraped(sb, item["source_url"]):
            print("  → duplicate, skipping")
            counts["skipped"] += 1
            continue

        extracted = extract_brief(item["raw_text"])
        if extracted is None:
            counts["errors"] += 1
            continue

        if not extracted.get("is_real_brief"):
            print("  → not a brief")
            counts["not_brief"] += 1
            continue

        mode = extracted.get("mode", "?")
        score = extracted.get("quality_score", "?")
        print(f"  → BRIEF  mode={mode}  quality={score}")

        if DRY_RUN:
            print(f"     scene: {extracted.get('scene_context', '')[:80]}")
            print(f"     ask:   {extracted.get('music_ask', '')[:80]}")
        else:
            if store_brief(sb, item, extracted):
                counts["stored"] += 1
            else:
                counts["errors"] += 1

        # Stay well under Haiku rate limits
        time.sleep(0.4)

    print("\n=== Done ===")
    if DRY_RUN:
        print("(dry run — nothing stored)")
    print(f"Stored:     {counts['stored']}")
    print(f"Skipped:    {counts['skipped']}")
    print(f"Not briefs: {counts['not_brief']}")
    print(f"Errors:     {counts['errors']}")


if __name__ == "__main__":
    run()
