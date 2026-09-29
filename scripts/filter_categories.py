import requests
import re

resp = requests.get('https://godofprompt.ai/sitemaps/prompts.xml', headers={'User-Agent': 'Mozilla/5.0'})
urls = re.findall(r'<loc>(https://godofprompt\.ai/prompt-library/([a-zA-Z0-9\-]+))</loc>', resp.text)

print(f"Total prompt URLs: {len(urls)}")

keywords_map = {
    "Coding": ["code", "software", "python", "javascript", "developer", "sql", "api", "git", "debug", "architecture", "full-stack", "refactor", "database"],
    "Design": ["design", "ui-ux", "portrait", "photography", "logo", "midjourney", "aesthetic", "graphic", "art", "typography", "palette", "figma"],
    "Sales": ["sales", "cold-email", "pitch", "objection", "closer", "outreach", "negotiation", "prospecting", "deal", "lead"],
    "Copywriting": ["copywriting", "headline", "storytelling", "writing", "newsletter", "script", "caption", "hook", "article", "blog"],
    "SEO": ["seo", "keyword", "backlink", "meta-description", "ranking", "search-intent", "serp"],
    "Marketing": ["marketing", "funnel", "landing-page", "campaign", "ad", "growth", "audience", "brand", "influencer"]
}

categorized = {k: [] for k in keywords_map}

for full_url, slug in urls:
    matched = False
    for cat, kws in keywords_map.items():
        if any(kw in slug for kw in kws):
            categorized[cat].append((slug, full_url))
            matched = True
            break

for cat, items in categorized.items():
    print(f"\n--- {cat} ({len(items)} found) ---")
    for slug, u in items[:5]:
        print(f"  - {slug}")
