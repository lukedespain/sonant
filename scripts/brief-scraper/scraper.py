import os
import praw
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

SUBREDDITS = [
    "WeAreTheMusicMakers",
    "gamedev",
    "Songwriters",
    "musicbusiness",
    "FilmScoring",
    "indiegaming",
]

SEARCH_TERMS = [
    "sync brief",
    "music supervisor brief",
    "licensing brief",
    "music brief",
    "sync opportunity",
    "music placement",
    "music for film",
    "need music for",
    "looking for music",
]


def create_reddit():
    return praw.Reddit(
        client_id=os.environ["REDDIT_CLIENT_ID"],
        client_secret=os.environ["REDDIT_CLIENT_SECRET"],
        user_agent=os.environ.get("REDDIT_USER_AGENT", "SonantBriefScraper/1.0"),
    )


def scrape_reddit(limit_per_search=25) -> list[dict]:
    reddit = create_reddit()
    results = []
    seen_ids = set()

    for subreddit_name in SUBREDDITS:
        subreddit = reddit.subreddit(subreddit_name)
        for term in SEARCH_TERMS:
            try:
                posts = subreddit.search(
                    term, sort="new", time_filter="year", limit=limit_per_search
                )
                for post in posts:
                    if post.id in seen_ids:
                        continue
                    seen_ids.add(post.id)

                    raw_text = f"Title: {post.title}\n\n{post.selftext}".strip()
                    if len(raw_text) < 80:
                        continue

                    results.append(
                        {
                            "source": "reddit",
                            "source_url": f"https://reddit.com{post.permalink}",
                            "raw_text": raw_text,
                            "meta": {
                                "subreddit": subreddit_name,
                                "score": post.score,
                                "created_utc": datetime.utcfromtimestamp(
                                    post.created_utc
                                ).isoformat(),
                                "search_term": term,
                            },
                        }
                    )
            except Exception as e:
                print(f"  Error in r/{subreddit_name} '{term}': {e}")

    print(f"Scraped {len(results)} unique posts from Reddit")
    return results
