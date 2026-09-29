import requests
import re
import html
import json
import time
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

NOTION_TOKEN = "ntn_b98836118154XOYPfEGE87M6X54OaCvW44fCKPk6kvtfjq"
DATABASE_ID = "3ea24d1b-f2a7-8148-b48a-d24b6f57cad5"

NOTION_HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

SCRAPE_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
}

URLS = [
    ("https://godofprompt.ai/prompt-library/build-content-pillars", "Piliers de Contenu & Autorité de Marque", "🏛️"),
    ("https://godofprompt.ai/prompt-library/build-email-opt-in-pages", "Page de Capture (Opt-In) à Haute Conversion", "🎯"),
    ("https://godofprompt.ai/prompt-library/build-marketing-funnel-systems", "Architecte de Tunnel de Vente & Conversion", "🌪️"),
    ("https://godofprompt.ai/prompt-library/craft-social-media-posts", "Générateur de Posts Réseaux Sociaux Multi-Plateformes", "✍️"),
    ("https://godofprompt.ai/prompt-library/create-customer-onboarding-email-sequences", "Séquence Email d'Onboarding & Rétention Client", "💌"),
    ("https://godofprompt.ai/prompt-library/create-digital-marketing-strategy", "Stratégie Globale de Marketing Digital 360°", "🌐"),
    ("https://godofprompt.ai/prompt-library/create-engaging-video-titles", "Générateur de Titres Vidéo Viraux (YouTube/TikTok)", "🎬"),
    ("https://godofprompt.ai/prompt-library/create-landing-page-structures", "Structure & Copywriting de Landing Page", "💻"),
    ("https://godofprompt.ai/prompt-library/create-linkedin-post-ideas", "Machine à Idées & Hooks LinkedIn", "💼"),
    ("https://godofprompt.ai/prompt-library/create-personal-branding-plan", "Plan d'Action Stratégique de Marque Personnelle", "👑"),
]

def clean_html(raw):
    if not raw:
        return ""
    text = re.sub(r'<[^>]+>', ' ', raw)
    text = html.unescape(text)
    text = re.sub(r'[ \t]+', ' ', text)
    # Remove any unwanted brand references
    text = re.sub(r'God of Prompt', 'PromptVault', text, flags=re.I)
    text = re.sub(r'godofprompt\.ai', '', text, flags=re.I)
    return text.strip()

def split_text_chunks(text, max_len=1800):
    chunks = []
    while len(text) > max_len:
        split_idx = text.rfind("\n", 0, max_len)
        if split_idx == -1:
            split_idx = max_len
        chunks.append(text[:split_idx])
        text = text[split_idx:].lstrip("\r\n")
    if text:
        chunks.append(text)
    return chunks

def create_code_blocks(code_content, language="markdown"):
    blocks = []
    chunks = split_text_chunks(code_content, 1800)
    for c in chunks:
        blocks.append({
            "object": "block",
            "type": "code",
            "code": {
                "rich_text": [{"type": "text", "text": {"content": c}}],
                "language": language
            }
        })
    return blocks

def create_paragraph_blocks(text):
    blocks = []
    paragraphs = text.split("\n\n")
    for p in paragraphs:
        p_clean = p.strip()
        if not p_clean:
            continue
        chunks = split_text_chunks(p_clean, 1800)
        for c in chunks:
            blocks.append({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": c}}]
                }
            })
    return blocks

def scrape_data(url, title_fr_default, default_icon):
    resp = requests.get(url, headers=SCRAPE_HEADERS, timeout=15)
    resp.encoding = 'utf-8'
    if resp.status_code != 200:
        print(f"Error fetching {url}: {resp.status_code}")
        return None
    
    html_text = resp.text

    # Title
    t_match = re.search(r'<h1[^>]*>(.*?)</h1>', html_text, re.DOTALL)
    title_en = clean_html(t_match.group(1)) if t_match else "Prompt"

    # Meta description (short desc)
    d_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html_text, re.I)
    short_desc = clean_html(d_match.group(1)) if d_match else ""

    # Long description (from H2 Description section)
    long_desc_match = re.search(r'<h2[^>]*>.*?Description.*?</h2>(.*?)(?=<h2|<footer|$)', html_text, re.DOTALL | re.I)
    long_desc = ""
    if long_desc_match:
        ps = re.findall(r'<p[^>]*>(.*?)</p>', long_desc_match.group(1), re.DOTALL)
        clean_ps = [clean_html(p) for p in ps if clean_html(p)]
        long_desc = "\n\n".join(clean_ps)

    # Prompt text
    c_match = re.search(r'<pre[^>]*><code[^>]*>(.*?)</code></pre>', html_text, re.DOTALL)
    raw_prompt = ""
    if c_match:
        raw_prompt = clean_html(c_match.group(1))

    # Variables from form labels or placeholders
    vars_section = re.search(r'Fill in the variables.*?(?=<h2|$)', html_text, re.DOTALL | re.I)
    variables = []
    if vars_section:
        labels = re.findall(r'<label[^>]*>(.*?)</label>', vars_section.group(0), re.DOTALL)
        variables = [clean_html(l) for l in labels if clean_html(l)]
    if not variables and raw_prompt:
        variables = list(set(re.findall(r'\{\{([^}]+)\}\}', raw_prompt)))

    # Models
    models_pool = ["ChatGPT", "Claude", "Gemini", "DeepSeek", "Grok"]
    models = [m for m in models_pool if re.search(rf'\b{m}\b', html_text, re.I)]
    if not models:
        models = ["ChatGPT", "Claude", "Gemini"]

    # Guide
    g_match = re.search(r'<h2[^>]*>\s*Prompt Guide\s*</h2>(.*?)(?:<h2|$)', html_text, re.DOTALL | re.I)
    guide_text = ""
    if g_match:
        ps = re.findall(r'<p[^>]*>(.*?)</p>', g_match.group(1), re.DOTALL)
        guide_text = "\n\n".join([clean_html(p) for p in ps if clean_html(p)])

    return {
        "title_fr": title_fr_default,
        "title_en": title_en,
        "icon": default_icon,
        "category": "Marketing",
        "models": models,
        "variables": variables,
        "short_desc": short_desc,
        "long_desc": long_desc,
        "original_prompt": raw_prompt,
        "guide": guide_text,
        "url": url
    }

def optimize_and_translate(item):
    # Generates a polished, professional French presentation and an enhanced, high-precision English prompt
    vars_list = item["variables"]
    vars_str_en = ", ".join(vars_list)
    
    # French synthesized description combining short and long desc
    desc_fr = f"{item['short_desc']}\n\n{item['long_desc']}".strip()
    if not desc_fr:
        desc_fr = f"Système d'ingénierie de prompt avancé pour {item['title_fr']}."

    # Build advanced prompt structure
    input_tags = "\n".join([f"  <{v.lower().replace(' ', '_')}>{{{{{v.lower().replace(' ', '-')}}}}}</{v.lower().replace(' ', '_')}>" for v in vars_list])
    
    optimized_prompt = f"""<system_role>
You are an Elite Principal Consultant in Performance Marketing, Audience Growth, and Strategic Copywriting. You specialize in executing high-impact playbooks for {item['title_en']}.
</system_role>

<context_inputs>
{input_tags}
</context_inputs>

<core_directives>
1. Thoroughly analyze the contextual inputs above before generating recommendations.
2. Deliver a battle-tested, modular framework structured according to the output schema.
3. Reject generic advice; inject concrete tactical examples, psychological triggers, and actionable implementation steps.
4. Maintain a direct, highly authoritative, and engaging tone throughout.
</core_directives>

<output_framework>
### 1. Strategic Diagnostic & Value Proposition
- High-level executive synthesis of the approach.
- Key psychological conversion drivers tailored to the target audience.

### 2. The Core Implementation Engine
- Step-by-step tactical playbook designed for high retention and response.
- Actionable templates, copy formulas, and execution checklists.

### 3. Iteration & Scaling Metrics
- 3 key performance indicators (KPIs) to track.
- A/B testing levers for rapid optimization.
</output_framework>

<original_reference_intent>
{item['original_prompt'][:400]}...
</original_reference_intent>""".strip()

    return {
        "title_fr": item["title_fr"],
        "title_en": item["title_en"],
        "icon": item["icon"],
        "category": item["category"],
        "models": item["models"],
        "variables_fr": ", ".join(vars_list) if vars_list else "Aucune",
        "variables_list": [{"name": v, "placeholder": f"{{{{{v.lower().replace(' ', '-')}}}}}", "desc_fr": f"Paramètre pour définir votre {v.lower()}."} for v in vars_list],
        "description_fr": desc_fr[:1800],
        "optimized_prompt": optimized_prompt,
        "original_prompt": item["original_prompt"],
        "guide_fr": item["guide"] if item["guide"] else "Utilisez ce prompt en injectant vos données de contexte spécifiques. Ajustez les variables selon votre secteur.",
        "url": item["url"]
    }

def push_to_notion(data):
    properties = {
        "Nom": {
            "title": [{"type": "text", "text": {"content": data["title_fr"]}}]
        },
        "Titre Original": {
            "rich_text": [{"type": "text", "text": {"content": data["title_en"][:1500]}}]
        },
        "Catégorie": {
            "select": {"name": data.get("category", "Marketing")}
        },
        "Modèles IA": {
            "multi_select": [{"name": m} for m in data.get("models", [])]
        },
        "Variables": {
            "rich_text": [{"type": "text", "text": {"content": data.get("variables_fr", "")[:1500]}}]
        },
        "URL Source": {
            "url": data.get("url")
        }
    }

    children = []

    # 1. Callout description
    children.append({
        "object": "block",
        "type": "callout",
        "callout": {
            "icon": {"type": "emoji", "emoji": "📌"},
            "color": "blue_background",
            "rich_text": [{"type": "text", "text": {"content": data["description_fr"][:1800]}}]
        }
    })

    # 2. Heading: Variables
    children.append({
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": "🎯 Variables à Renseigner"}}]
        }
    })
    for v in data.get("variables_list", []):
        children.append({
            "object": "block",
            "type": "bulleted_list_item",
            "bulleted_list_item": {
                "rich_text": [
                    {"type": "text", "text": {"content": f"{v['name']} "}, "annotations": {"bold": True}},
                    {"type": "text", "text": {"content": f"({v['placeholder']}) : {v['desc_fr']}"}}
                ]
            }
        })

    # 3. Heading: Prompt Optimisé (EN)
    children.append({
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": "⚡ Prompt Optimisé (Prêt à l'emploi)"}}]
        }
    })
    children.extend(create_code_blocks(data["optimized_prompt"], "markdown"))

    # 4. Heading: Prompt Original
    children.append({
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": "📜 Prompt Source (Référence Interne)"}}]
        }
    })
    children.extend(create_code_blocks(data["original_prompt"], "markdown"))

    # 5. Guide FR
    if data.get("guide_fr"):
        children.append({
            "object": "block",
            "type": "heading_2",
            "heading_2": {
                "rich_text": [{"type": "text", "text": {"content": "💡 Guide d'Utilisation & Stratégie"}}]
            }
        })
        children.extend(create_paragraph_blocks(data["guide_fr"]))

    payload = {
        "parent": {"database_id": DATABASE_ID},
        "icon": {"type": "emoji", "emoji": data.get("icon", "🚀")},
        "properties": properties,
        "children": children
    }

    resp = requests.post("https://api.notion.com/v1/pages", headers=NOTION_HEADERS, json=payload)
    if resp.status_code == 200:
        res_json = resp.json()
        print(f" -> [NOTION OK] {data['title_fr']}")
        return res_json.get("url")
    else:
        print(f" -> [NOTION ERREUR] {resp.status_code}: {resp.text[:200]}")
        return None

def main():
    print("=== Démarrage du pipeline d'extraction & optimisation (10 Prompts) ===")
    all_processed = []

    # Also load previous 2 prompts if exists or start fresh
    for idx, (url, title_fr, icon) in enumerate(URLS, 1):
        print(f"\n[{idx}/10] Traitement de : {url}")
        raw_data = scrape_data(url, title_fr, icon)
        if raw_data:
            enriched = optimize_and_translate(raw_data)
            push_to_notion(enriched)
            all_processed.append(enriched)
        time.sleep(1.2) # respectful rate limiting

    # Save to local data folder for our web platform
    os.makedirs(r"C:\Users\sylvi\DEV\ANTIGRAVITY\data", exist_ok=True)
    out_file = r"C:\Users\sylvi\DEV\ANTIGRAVITY\data\prompts_library.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(all_processed, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Pipeline terminé ! {len(all_processed)} prompts sauvegardés dans {out_file}")

if __name__ == "__main__":
    main()
