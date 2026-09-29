import requests
import re

resp = requests.get('https://godofprompt.ai/sitemaps/prompts.xml', headers={'User-Agent': 'Mozilla/5.0'})
all_urls = re.findall(r'<loc>(https://godofprompt\.ai/prompt-library/([a-zA-Z0-9\-]+))</loc>', resp.text)

def find_slugs(pattern, n=5):
    res = []
    for full_url, slug in all_urls:
        if re.search(pattern, slug, re.I):
            res.append((slug, full_url))
        if len(res) >= n:
            break
    return res

print("Coding candidates:")
for s, u in find_slugs(r'code|developer|software|architect|python', 10):
    print(" ", s)

print("\nDesign candidates:")
for s, u in find_slugs(r'photo|portrait|design|logo|ad', 10):
    print(" ", s)

print("\nSales candidates:")
for s, u in find_slugs(r'sales|email|pitch|deal|lead', 10):
    print(" ", s)
