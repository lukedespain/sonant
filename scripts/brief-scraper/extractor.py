import json
import os
from typing import Optional
import anthropic
from dotenv import load_dotenv

load_dotenv()

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

SYSTEM_PROMPT = """You analyze text to determine whether it contains a real music sync brief — a specific music request from a supervisor, developer, advertiser, or filmmaker describing what music they need for a project.

If the text does NOT contain a real brief (general questions, tutorials, unrelated discussion, spam), return {"is_real_brief": false} and nothing else.

If it IS a real brief, extract the fields below and return ONLY valid JSON:

{
  "is_real_brief": true,
  "mode": "brand" | "film" | "games" | "tv" | "other",
  "mood": "<describe the emotional tone, e.g. 'tense and cinematic'>",
  "genre": "<musical genre, e.g. 'indie folk' or 'orchestral'>",
  "tempo": "slow" | "medium" | "fast" | "any",
  "scene_context": "<what the music is for — the actual scene or use case>",
  "music_ask": "<the specific request, e.g. 'no vocals, builds to a climax'>",
  "instrumentation_notes": "<specific instruments, style notes, or references>",
  "quality_score": 1 | 2 | 3 | 4 | 5
}

quality_score:
  1 = too vague to be useful ("need some music")
  2 = genre only, minimal detail
  3 = mood + genre + context
  4 = specific scene, instruments, mood, tempo
  5 = very detailed — reference tracks, precise emotional arc, production notes"""


def extract_brief(raw_text: str) -> Optional[dict]:
    try:
        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=512,
            system=SYSTEM_PROMPT,
            messages=[
                {
                    "role": "user",
                    "content": f"Extract brief information:\n\n{raw_text[:3000]}",
                }
            ],
        )
        content = response.content[0].text.strip()
        # Strip markdown code fences if model wraps in ```json
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        return json.loads(content.strip())
    except json.JSONDecodeError as e:
        print(f"  JSON parse error: {e}")
        return None
    except Exception as e:
        print(f"  Extraction error: {e}")
        return None
