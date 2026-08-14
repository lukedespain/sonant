#!/usr/bin/env python3
"""
Generate a synthetic brief corpus using Claude.

Produces varied, realistic sync briefs across all four modes and stores them
directly in brief_corpus with approved=True so the generator can use them
as few-shot examples immediately.

Usage:
  python generate_synthetic.py              # generate + store (100 briefs)
  python generate_synthetic.py --dry-run    # generate + print, don't store
  python generate_synthetic.py --count 20   # generate a specific number
"""

import sys
import json
import time
import os
import random
import argparse
from typing import Optional
import anthropic
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

# ─── Identity pools ───────────────────────────────────────────────────────────
# Mirrored from generate.ts so synthetic briefs reflect the same variance space

BRAND_VERTICALS = [
    "outdoor & adventure gear", "B2B SaaS", "plant-based food", "fintech & payments",
    "direct-to-consumer skincare", "electric mobility", "craft spirits", "sustainable fashion",
    "wellness & fitness apps", "home goods & interiors", "pet care", "travel & hospitality",
    "children's education", "luxury real estate", "functional beverages", "independent bookshops",
]

BRAND_CAMPAIGNS = [
    "product launch", "brand anthem", "seasonal campaign", "social impact story",
    "founder origin story", "customer testimonial spot", "irreverent humor campaign",
    "heritage & legacy relaunch", "challenger brand positioning", "community-first campaign",
    "global expansion launch", "limited edition drop",
]

BRAND_SCALES = [
    "bootstrapped startup finding its voice", "venture-backed scale-up going mainstream",
    "heritage brand repositioning for a new generation", "global CPG with regional focus",
    "niche specialist crossing into mass market", "challenger brand taking on a category leader",
    "values-led cooperative", "celebrity-founded direct-to-consumer brand",
]

FILM_CONTEXTS = [
    "Sundance-track indie feature", "prestige streaming limited series", "festival short film",
    "prestige drama theatrical release", "slow-burn psychological thriller", "documentary feature",
    "debut feature from an emerging director", "art house co-production",
    "adapted literary novel", "social realist drama",
]

FILM_VISUALS = [
    "handheld verité with natural light", "wide anamorphic cinematography",
    "intimate close-up driven", "archival footage mixed with present-day",
    "sparse long unbroken takes", "dense kinetic editing",
    "static locked-off frames", "shallow depth of field throughout",
]

FILM_REGISTERS = [
    "quiet and deeply interior", "slow-burn tension that never fully releases",
    "social realism with no score relief", "dreamlike and temporally fractured",
    "restrained character study", "genre film with arthouse ambition",
    "unsentimental emotional restraint", "elliptical non-linear storytelling",
]

GAMES_GENRES = [
    "action-RPG", "survival horror", "narrative adventure", "open-world exploration",
    "roguelike dungeon crawler", "puzzle-platformer", "atmospheric horror", "tactical RPG",
    "city builder", "metroidvania", "cozy life sim", "souls-like",
]

GAMES_ART = [
    "stylized 3D", "pixel art with modern lighting", "hand-drawn painterly",
    "photorealistic", "low-poly minimalist", "retro-CRT inspired",
    "watercolor and ink", "voxel-based",
]

GAMES_MOMENTS = [
    "the opening minutes before the player knows the rules",
    "mid-game turning point where stakes shift",
    "final confrontation before the credits",
    "ambient open-world exploration loop",
    "narrative cutscene revealing a key truth",
    "post-death respawn screen",
    "quiet downtime between missions",
    "title screen and main menu",
    "tutorial section before the first threat",
    "victory and resolution sequence",
]

MOODS = {
    "brand": ["Triumphant", "Melancholic", "Playful", "Epic", "Intimate", "Hopeful",
              "Mysterious", "Uplifting", "Driving", "Emotional", "Atmospheric", "Tense"],
    "film":  ["Melancholic", "Tense", "Haunting", "Hopeful", "Intimate", "Eerie",
              "Bittersweet", "Suspenseful", "Epic", "Dramatic", "Serene", "Nostalgic"],
    "games": ["Intense", "Atmospheric", "Mysterious", "Adventurous", "Triumphant",
              "Ominous", "Focused", "Playful", "Epic", "Tense", "Serene", "Heroic"],
    "tv":    ["Intimate", "Tense", "Emotional", "Hopeful", "Bittersweet", "Playful",
              "Nostalgic", "Driving", "Melancholic", "Atmospheric"],
}

GENRES = [
    "Cinematic", "Electronic", "Hip-Hop", "Rock", "Pop", "Orchestral",
    "Ambient", "Folk / Acoustic", "Indie", "R&B / Soul", "Alternative",
    "Country", "Jazz", "Neo-Classical",
]

MODES = ["brand", "film", "games", "tv"]

# ─── Prompt ───────────────────────────────────────────────────────────────────

SYSTEM = """You are a working music supervisor writing realistic sync briefs for a composer training tool.

Write briefs that sound like they came from a real supervisor — specific, professional, direct. No corporate filler. No AI-speak. Trust the composer.

Return ONLY a valid JSON object with these fields:
{
  "mode": string,
  "mood": string,
  "genre": string,
  "tempo": "slow" | "medium" | "fast" | "any",
  "scene_context": string,
  "music_ask": string,
  "instrumentation_notes": string
}

Guidelines per field:
- scene_context: 2-3 sentences. What is actually happening — specific, visual, immediate. Not brand copy.
- music_ask: 3-4 sentences. What this track needs to do emotionally, sonically, and what makes it hard to execute.
- instrumentation_notes: 1-2 sentences. Specific instruments, production approach, or reference vocabulary. Concrete.
- tempo: pick one: slow, medium, fast, any
- mood and genre: single descriptive strings
"""


def build_prompt(mode: str) -> str:
    moods = random.sample(MOODS[mode], 2)
    genres = random.sample(GENRES, 2)

    if mode == "brand":
        seed = (
            f"Industry: {random.choice(BRAND_VERTICALS)}\n"
            f"Campaign type: {random.choice(BRAND_CAMPAIGNS)}\n"
            f"Company profile: {random.choice(BRAND_SCALES)}"
        )
    elif mode == "film":
        seed = (
            f"Production context: {random.choice(FILM_CONTEXTS)}\n"
            f"Visual language: {random.choice(FILM_VISUALS)}\n"
            f"Narrative register: {random.choice(FILM_REGISTERS)}"
        )
    elif mode == "games":
        seed = (
            f"Game genre: {random.choice(GAMES_GENRES)}\n"
            f"Art direction: {random.choice(GAMES_ART)}\n"
            f"In-game moment: {random.choice(GAMES_MOMENTS)}"
        )
    else:  # tv
        seed = (
            f"Show type: {random.choice(FILM_CONTEXTS)}\n"
            f"Scene register: {random.choice(FILM_REGISTERS)}\n"
            f"Visual language: {random.choice(FILM_VISUALS)}"
        )

    return f"""Generate a realistic music sync brief for the following context.

Mode: {mode}
Mood palette: {', '.join(moods)}
Genre palette: {', '.join(genres)}

Creative seed (translate into a specific fictional project — do not echo these words verbatim):
{seed}

Return ONLY the JSON object. No preamble."""


# ─── Generation ───────────────────────────────────────────────────────────────

def scrub(text: str) -> str:
    if not text:
        return text
    import re
    text = re.sub(r'\s*[—–]\s*', ', ', text)
    text = re.sub(r'[—–]', ', ', text)
    text = re.sub(r',\s*,', ',', text)
    text = re.sub(r',\s*\.', '.', text)
    text = re.sub(r'\.\s*,', '.', text)
    text = re.sub(r',\s*$', '.', text)
    text = re.sub(r'  +', ' ', text)
    return text.strip()


def scrub_brief(brief: dict) -> dict:
    return {k: scrub(v) if isinstance(v, str) else v for k, v in brief.items()}


def generate_brief(mode: str) -> Optional[dict]:
    try:
        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=600,
            system=SYSTEM,
            messages=[{"role": "user", "content": build_prompt(mode)}],
        )
        text = response.content[0].text.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        return scrub_brief(json.loads(text.strip()))
    except Exception as e:
        print(f"  Generation error: {e}")
        return None


def store_brief(sb, mode: str, brief: dict) -> bool:
    try:
        sb.table("brief_corpus").insert({
            "source": "synthetic",
            "source_url": f"synthetic://{mode}/{os.urandom(8).hex()}",
            "raw_text": f"{brief.get('scene_context', '')} {brief.get('music_ask', '')}",
            "extracted_fields": {
                "mood": brief.get("mood"),
                "genre": brief.get("genre"),
                "tempo": brief.get("tempo"),
                "scene_context": brief.get("scene_context"),
                "music_ask": brief.get("music_ask"),
                "instrumentation_notes": brief.get("instrumentation_notes"),
            },
            "mode": mode,
            "quality_score": 4,   # synthetic briefs start at 4 — curate down as needed
            "curated": True,
            "approved": False,    # you approve manually in Supabase after review
        }).execute()
        return True
    except Exception as e:
        print(f"  Store error: {e}")
        return False


# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--count", type=int, default=100)
    args = parser.parse_args()

    sb = None if args.dry_run else create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )

    # Distribute evenly across modes
    per_mode = args.count // len(MODES)
    remainder = args.count % len(MODES)
    distribution = {m: per_mode for m in MODES}
    for m in MODES[:remainder]:
        distribution[m] += 1

    counts = {"stored": 0, "errors": 0}
    total = 0

    for mode, n in distribution.items():
        print(f"\n=== {mode.upper()} ({n} briefs) ===")
        for i in range(n):
            total += 1
            print(f"  [{total}/{args.count}] Generating {mode}...", end=" ")
            brief = generate_brief(mode)
            if not brief:
                print("ERROR")
                counts["errors"] += 1
                continue

            if args.dry_run:
                print("OK")
                print(f"    scene:  {brief.get('scene_context', '')[:90]}")
                print(f"    ask:    {brief.get('music_ask', '')[:90]}")
                print(f"    instr:  {brief.get('instrumentation_notes', '')[:70]}")
                print(f"    mood={brief.get('mood')}  genre={brief.get('genre')}  tempo={brief.get('tempo')}")
            else:
                if store_brief(sb, mode, brief):
                    print("stored")
                    counts["stored"] += 1
                else:
                    print("ERROR")
                    counts["errors"] += 1

            # Haiku rate limit: ~5 req/s, stay conservative
            time.sleep(0.3)

    print(f"\n=== Done ===")
    if args.dry_run:
        print("(dry run — nothing stored)")
    else:
        print(f"Stored:  {counts['stored']}")
        print(f"Errors:  {counts['errors']}")
        print(f"\nNext: go to Supabase → Table Editor → brief_corpus")
        print(f"Filter: source = 'synthetic', approved = false")
        print(f"Review each row and set approved = true on the ones you'd keep.")


if __name__ == "__main__":
    main()
