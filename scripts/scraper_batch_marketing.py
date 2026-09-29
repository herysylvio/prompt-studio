import re
import html
import json
import csv
import time
import requests

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
}

URLS = [
    "https://godofprompt.ai/prompt-library/analyze-content-structure-and-style",
    "https://godofprompt.ai/prompt-library/boost-social-media-engagement",
    "https://godofprompt.ai/prompt-library/build-content-pillars",
    "https://godofprompt.ai/prompt-library/build-email-opt-in-pages",
    "https://godofprompt.ai/prompt-library/build-marketing-funnel-systems",
]

def clean_html_text(raw_html):
    if not raw_html:
        return ""
    text = re.sub(r'<[^>]+>', ' ', raw_html)
    text = html.unescape(text)
    text = re.sub(r'[ \t]+', ' ', text)
    return text.strip()

def scrape_prompt(url):
    print(f"Fetching: {url} ...")
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.encoding = 'utf-8'
    if resp.status_code != 200:
        print(f"  [ERROR] Status code: {resp.status_code}")
        return None

    page_html = resp.text

    # 1. Title
    title_m = re.search(r'<h1[^>]*>(.*?)</h1>', page_html, re.DOTALL)
    title = clean_html_text(title_m.group(1)) if title_m else ""

    # 2. Description
    meta_desc_m = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', page_html, re.I)
    desc = html.unescape(meta_desc_m.group(1)) if meta_desc_m else ""

    # 3. Full Prompt text
    code_m = re.search(r'<pre[^>]*><code[^>]*>(.*?)</code></pre>', page_html, re.DOTALL)
    if code_m:
        raw_code = code_m.group(1)
        prompt_text = re.sub(r'<[^>]+>', '', raw_code)
        prompt_text = html.unescape(prompt_text).strip()
    else:
        prompt_text = ""

    # 4. Form variables (from 'Fill in the variables' section)
    vars_section = re.search(r'Fill in the variables.*?(?=<h2|$)', page_html, re.DOTALL | re.I)
    variables = []
    if vars_section:
        labels = re.findall(r'<label[^>]*>(.*?)</label>', vars_section.group(0), re.DOTALL)
        variables = [clean_html_text(l) for l in labels if clean_html_text(l)]
    
    # Fallback to placeholders if no label found
    if not variables and prompt_text:
        variables = list(set(re.findall(r'\{\{([^}]+)\}\}', prompt_text)))

    # 5. Compatible Models
    models_pool = ["ChatGPT", "Claude", "Gemini", "Midjourney", "Grok", "DeepSeek"]
    compatible_models = [m for m in models_pool if re.search(rf'\b{m}\b', page_html, re.I)]

    # 6. Prompt Guide
    guide_m = re.search(r'<h2[^>]*>\s*Prompt Guide\s*</h2>(.*?)(?:<h2|$)', page_html, re.DOTALL | re.I)
    guide_paragraphs = []
    if guide_m:
        raw_guide = guide_m.group(1)
        ps = re.findall(r'<p[^>]*>(.*?)</p>', raw_guide, re.DOTALL)
        guide_paragraphs = [clean_html_text(p) for p in ps if clean_html_text(p)]
    guide_text = "\n\n".join(guide_paragraphs) if guide_paragraphs else ""

    return {
        "title": title,
        "category": "Marketing",
        "models": ", ".join(compatible_models),
        "variables": ", ".join(variables) if variables else "None",
        "description": desc,
        "prompt": prompt_text,
        "guide": guide_text,
        "url": url,
    }

def main():
    results = []
    for i, url in enumerate(URLS, start=1):
        item = scrape_prompt(url)
        if item:
            results.append(item)
            print(f"  [OK] Extracted: {item['title']} ({len(item['prompt'])} chars)")
        time.sleep(1) # respectful delay

    # 1. Export JSON
    json_path = r"C:\Users\sylvi\DEV\ANTIGRAVITY\prompts_marketing_sample.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"JSON saved to: {json_path}")

    # 2. Export CSV (with UTF-8 BOM for Excel & Notion compatibility)
    csv_path = r"C:\Users\sylvi\DEV\ANTIGRAVITY\prompts_marketing_sample.csv"
    fieldnames = ["title", "category", "models", "variables", "description", "prompt", "guide", "url"]
    with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in results:
            writer.writerow(r)
    print(f"CSV saved to: {csv_path}")

    # 3. Export Markdown (Catalog view)
    md_path = r"C:\Users\sylvi\DEV\ANTIGRAVITY\prompts_marketing_sample.md"
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# 📚 Échantillon de Prompts - Catégorie Marketing\n\n")
        f.write(f"*Source : [God of Prompt](https://godofprompt.ai/prompt-library) | Échantillon : {len(results)} prompts*\n\n")
        f.write("---\n\n")
        
        for idx, item in enumerate(results, start=1):
            f.write(f"## {idx}. {item['title']}\n\n")
            f.write(f"- **Catégorie :** `{item['category']}`\n")
            f.write(f"- **Modèles compatibles :** `{item['models']}`\n")
            f.write(f"- **Variables à renseigner :** `{item['variables']}`\n")
            f.write(f"- **Lien original :** [{item['url']}]({item['url']})\n\n")
            
            f.write("### 📝 Description\n")
            f.write(f"> {item['description']}\n\n")
            
            f.write("### ⚡ Prompt Prêt à l'Emploi\n")
            f.write("```markdown\n")
            f.write(item['prompt'] + "\n")
            f.write("```\n\n")
            
            if item['guide']:
                f.write("### 💡 Guide d'Utilisation\n")
                f.write(item['guide'] + "\n\n")
                
            f.write("---\n\n")
            
    print(f"Markdown catalog saved to: {md_path}")
    print("Done successfully!")

if __name__ == "__main__":
    main()
