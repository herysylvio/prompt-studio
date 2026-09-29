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

TARGET_PROMPTS = [
    # --- Coding ---
    {
        "id": "full-stack-architecture",
        "url": "https://godofprompt.ai/prompt-library/build-full-stack-software-architectures",
        "category": "Coding",
        "icon": "💻",
        "title_fr": "Architecte Logiciel Full-Stack & Microservices",
        "guide_fr": "Idéal pour cadrer un projet dès le départ. Renseignez votre stack technologique de prédilection et le volume attendu d'utilisateurs pour obtenir un schéma architectural modulaire, résilient et immédiatement exploitable."
    },
    {
        "id": "systematic-debugging",
        "url": "https://godofprompt.ai/prompt-library/fix-code-errors",
        "category": "Coding",
        "icon": "🐞",
        "title_fr": "Débogueur Systématique & Résolution d'Erreurs",
        "guide_fr": "Fournissez toujours l'extrait exact de la stack trace ainsi que l'environnement d'exécution (version du runtime, OS, dépendances). Le prompt identifiera la cause racine (root cause) plutôt que d'appliquer un simple correctif superficiel."
    },
    {
        "id": "code-quality-systems",
        "url": "https://godofprompt.ai/prompt-library/automate-code-quality-systems",
        "category": "Coding",
        "icon": "⚡",
        "title_fr": "Pipeline de Qualité de Code & CI/CD Linter",
        "guide_fr": "Utilisez ce prompt pour standardiser les règles de vos pull requests, configurer vos linters et mettre en place des tests automatisés stricts pour éliminer la dette technique dès la conception."
    },

    # --- Design ---
    {
        "id": "luxury-perfume-ads",
        "url": "https://godofprompt.ai/prompt-library/design-luxury-perfume-ads",
        "category": "Design",
        "icon": "✨",
        "title_fr": "Direction Artistique de Publicités Luxe & Flacons",
        "guide_fr": "Associez des mots-clés de rendu studio (éclairage cinématique, reflets caustiques, matériaux nobles) et précisez la palette de nuances désirée pour générer des visuels publicitaires haut de gamme sur Midjourney ou Flux."
    },
    {
        "id": "cinematic-portraits",
        "url": "https://godofprompt.ai/prompt-library/generate-cinematic-portrait-photography-2",
        "category": "Design",
        "icon": "📸",
        "title_fr": "Photographie de Portrait Cinématographique",
        "guide_fr": "Spécifiez l'ouverture focale (ex: f/1.4), l'atmosphère lumineuse (golden hour, néon moody) et le type de capteur (35mm, grain Kodak) pour obtenir des portraits photoréalistes saisissants sans l'effet artificiel de l'IA."
    },
    {
        "id": "packaging-mockups",
        "url": "https://godofprompt.ai/prompt-library/generate-photorealistic-packaging-mockups",
        "category": "Design",
        "icon": "📦",
        "title_fr": "Générateur de Mockups & Packaging Produits Photoréalistes",
        "guide_fr": "Très utile pour les créateurs de marques e-commerce et agences. Précisez la texture du contenant (verre dépoli, carton kraft recyclé, aluminium mat) pour générer des packagings crédibles prêts pour présentation client."
    },

    # --- Sales ---
    {
        "id": "b2b-cold-outreach",
        "url": "https://godofprompt.ai/prompt-library/create-cold-email-templates",
        "category": "Sales",
        "icon": "✉️",
        "title_fr": "Générateur d'Emails de Prospection B2B (Cold Outreach)",
        "guide_fr": "La brièveté est la clé (moins de 100 mots). Concentrez-vous sur le point de friction spécifique du prospect et formulez un appel à l'action sans friction (soft CTA) invitant à un simple échange plutôt qu'à une vente forcée."
    },
    {
        "id": "vsl-script-generator",
        "url": "https://godofprompt.ai/prompt-library/generate-video-sales-letter-scripts",
        "category": "Sales",
        "icon": "🎥",
        "title_fr": "Script de Vidéo de Vente Haute Conversion (VSL)",
        "guide_fr": "Structurez votre vidéo en 5 phases clés : choc initial (Hook), amplification de la douleur, révélation du mécanisme unique, preuve irréfutable, et offre irrésistible avec garantie inversée."
    },
    {
        "id": "deal-risk-diagnostic",
        "url": "https://godofprompt.ai/prompt-library/diagnose-deal-failure-risks",
        "category": "Sales",
        "icon": "🛡️",
        "title_fr": "Diagnostic des Risques d'Échec de Vente & Closing",
        "guide_fr": "À utiliser avant un appel de clôture décisif ou sur un cycle de vente qui stagne. Renseignez l'organigramme des décideurs et les objections latentes pour anticiper les blocages et déverrouiller la signature."
    },

    # --- Copywriting ---
    {
        "id": "clone-writing-dna",
        "url": "https://godofprompt.ai/prompt-library/clone-your-writing-style",
        "category": "Copywriting",
        "icon": "🖋️",
        "title_fr": "Clonage d'ADN Éditorial & Voix de Marque",
        "guide_fr": "Fournissez 3 échantillons bruts de vos meilleurs textes (sans retouche). Le prompt analysera la longueur de vos phrases, vos figures de style récurrentes, votre ponctuation et votre rythme pour répliquer exactement votre voix."
    },
    {
        "id": "writing-quality-polisher",
        "url": "https://godofprompt.ai/prompt-library/enhance-writing-quality",
        "category": "Copywriting",
        "icon": "💎",
        "title_fr": "Polisseur Littéraire & Amplificateur de Clarté",
        "guide_fr": "Passez vos brouillons dans ce module pour supprimer le verbiage inutile, dynamiser les verbes d'action et transformer des arguments abstraits en images mémorables pour vos lecteurs."
    },
    {
        "id": "viral-short-video-scripts",
        "url": "https://godofprompt.ai/prompt-library/generate-viral-short-form-video-scripts",
        "category": "Copywriting",
        "icon": "⚡",
        "title_fr": "Scripts de Vidéos Courtes Virales (Reels, TikTok, Shorts)",
        "guide_fr": "Chaque seconde compte : placez le point d'inflexion (plot twist ou révélation) dès la troisième seconde et conservez un rythme saccadé (1 idée = 1 plan dynamique) pour maximiser le taux de rétention."
    },

    # --- SEO ---
    {
        "id": "seo-onpage-audit",
        "url": "https://godofprompt.ai/prompt-library/optimize-your-seo",
        "category": "SEO",
        "icon": "🔍",
        "title_fr": "Audit & Optimisation Référencement Naturel (SEO On-Page)",
        "guide_fr": "Vérifiez l'adéquation exacte entre l'intention de recherche (Search Intent) et la structure de vos balises Hn. Intégrez le mot-clé principal naturellement dans les 100 premiers mots sans tomber dans la sur-optimisation."
    },
    {
        "id": "seo-content-gap",
        "url": "https://godofprompt.ai/prompt-library/identify-seo-content-opportunities",
        "category": "SEO",
        "icon": "📊",
        "title_fr": "Analyse des Gaps de Contenu & Opportunités SEO",
        "guide_fr": "Indiquez les URLs de vos concurrents principaux. Le système identifie les sous-thématiques qu'ils ont négligées afin de vous permettre de créer un contenu 10x supérieur (Skyscraper Technique) facile à positionner."
    },
    {
        "id": "natural-seo-writer",
        "url": "https://godofprompt.ai/prompt-library/create-natural-seo-content",
        "category": "SEO",
        "icon": "🌿",
        "title_fr": "Rédacteur d'Articles Sémantiques & SEO Neutre",
        "guide_fr": "Ce prompt contourne les empreintes classiques des textes IA génériques en utilisant un vocabulaire technique varié, des entités nommées riches et une structure sémantique appréciée des algorithmes Google Helpful Content."
    }
]

def clean_html(raw):
    if not raw:
        return ""
    text = re.sub(r'<[^>]+>', ' ', raw)
    text = html.unescape(text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'God of Prompt', 'Prompt Studio', text, flags=re.I)
    text = re.sub(r'godofprompt\.ai', '', flags=re.I, string=text)
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

def scrape_prompt(item):
    url = item["url"]
    resp = requests.get(url, headers=SCRAPE_HEADERS, timeout=15)
    resp.encoding = 'utf-8'
    if resp.status_code != 200:
        print(f"Error fetching {url}: {resp.status_code}")
        return None

    html_text = resp.text

    # Title EN
    t_match = re.search(r'<h1[^>]*>(.*?)</h1>', html_text, re.DOTALL)
    title_en = clean_html(t_match.group(1)) if t_match else item["title_fr"]

    # Short description
    d_match = re.search(r'<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\']', html_text, re.I)
    short_desc = clean_html(d_match.group(1)) if d_match else ""

    # Long description
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

    # Variables
    vars_section = re.search(r'Fill in the variables.*?(?=<h2|$)', html_text, re.DOTALL | re.I)
    variables = []
    if vars_section:
        labels = re.findall(r'<label[^>]*>(.*?)</label>', vars_section.group(0), re.DOTALL)
        variables = [clean_html(l) for l in labels if clean_html(l)]
    if not variables and raw_prompt:
        variables = list(dict.fromkeys(re.findall(r'\{\{([^}]+)\}\}', raw_prompt)))

    # Models
    models_pool = ["ChatGPT", "Claude", "Gemini", "DeepSeek", "Grok"]
    models = [m for m in models_pool if re.search(rf'\b{m}\b', html_text, re.I)]
    if not models:
        models = ["ChatGPT", "Claude", "Gemini"]

    # Format synthesized French description
    desc_fr = f"Ce système d'ingénierie de prompt vous permet de maîtriser {item['title_fr'].lower()}."
    if short_desc:
        desc_fr += f"\n\nObjectif opérationnel : {short_desc}"
    if long_desc:
        desc_fr += f"\n\nContexte d'application : {long_desc[:600]}..."

    # Create dynamic input tags
    input_tags = "\n".join([f"  <{v.lower().replace(' ', '_').replace('-', '_')}>{{{{{v.lower().replace(' ', '-')}}}}}</{v.lower().replace(' ', '_').replace('-', '_')}>" for v in variables])

    # Advanced engineered prompt
    role_dict = {
        "Coding": f"Principal Software Engineer, Systems Architect, and Clean Code Auditor specializing in {title_en}",
        "Design": f"World-Class Creative Director, Senior Prompt Artist, and Commercial Visual Designer specializing in {title_en}",
        "Sales": f"Elite VP of B2B Sales, Enterprise Deal Closer, and Pipeline Strategist specializing in {title_en}",
        "Copywriting": f"Master Direct-Response Copywriter, Brand Voice Stylist, and Storyteller specializing in {title_en}",
        "SEO": f"Principal SEO Technical Lead, Semantic Search Specialist, and Content Strategist specializing in {title_en}"
    }

    expert_role = role_dict.get(item["category"], f"Principal Industry Consultant specializing in {title_en}")

    optimized_prompt = f"""<system_role>
You are an {expert_role}.
Your objective is to produce world-class, production-grade output for: {title_en}.
</system_role>

<context_inputs>
{input_tags if input_tags else "  <!-- Direct user requirements and specifications -->"}
</context_inputs>

<execution_guidelines>
1. Evaluate all input parameters thoroughly before structuring your solution.
2. Produce structured, highly specific, and actionable results based on the schema below.
3. Eliminate generic filler words; prioritize concrete patterns, rigorous logic, and measurable impact.
4. Adapt tone, depth, and syntax to senior practitioner standards.
</execution_guidelines>

<structured_output_schema>
### 1. Strategic Architecture & Core Principles
- Executive summary of the recommended approach.
- Key technical, psychological, or creative levers implemented.

### 2. Concrete Implementation & Execution Blueprint
- Step-by-step deliverable formatted for immediate operational deployment.
- High-precision templates, code blocks, visual prompts, or persuasive frameworks.

### 3. Optimization & Long-Term Scaling Guardrails
- Critical edge-cases, common pitfalls to avoid, and testing/validation benchmarks.
</structured_output_schema>

<source_intent_reference>
{raw_prompt[:350]}...
</source_intent_reference>""".strip()

    vars_list = [
        {
            "name": v,
            "placeholder": f"{{{{{v.lower().replace(' ', '-')}}}}}",
            "desc_fr": f"Spécifiez votre {v.lower()}."
        }
        for v in variables
    ]

    return {
        "id": item["id"],
        "title_fr": item["title_fr"],
        "title_en": title_en,
        "icon": item["icon"],
        "category": item["category"],
        "models": models,
        "variables_fr": ", ".join(variables) if variables else "Aucune variable",
        "variables_list": vars_list,
        "description_fr": desc_fr[:1800],
        "optimized_prompt": optimized_prompt,
        "original_prompt": raw_prompt,
        "guide_fr": item["guide_fr"],
        "url": url
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
            "select": {"name": data["category"]}
        },
        "Modèles IA": {
            "multi_select": [{"name": m} for m in data["models"]]
        },
        "Variables": {
            "rich_text": [{"type": "text", "text": {"content": data["variables_fr"][:1500]}}]
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
    if data["variables_list"]:
        children.append({
            "object": "block",
            "type": "heading_2",
            "heading_2": {
                "rich_text": [{"type": "text", "text": {"content": "🎯 Variables à Renseigner"}}]
            }
        })
        for v in data["variables_list"]:
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

    # 4. Heading: Prompt Source
    if data["original_prompt"]:
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
        "icon": {"type": "emoji", "emoji": data["icon"]},
        "properties": properties,
        "children": children
    }

    try:
        resp = requests.post("https://api.notion.com/v1/pages", headers=NOTION_HEADERS, json=payload, timeout=15)
        if resp.status_code == 200:
            print(f" -> [NOTION OK] {data['title_fr']}")
            return True
        else:
            print(f" -> [NOTION ERREUR {resp.status_code}] {resp.text[:150]}")
            return False
    except Exception as e:
        print(f" -> [NOTION EXCEPTION] {e}")
        return False

def main():
    print(f"=== Enrichissement de la Bibliothèque ({len(TARGET_PROMPTS)} Nouveaux Prompts Multi-Catégories) ===")

    newly_processed = []

    for idx, item in enumerate(TARGET_PROMPTS, 1):
        print(f"\n[{idx}/{len(TARGET_PROMPTS)}] {item['category']} | {item['title_fr']}")
        data = scrape_prompt(item)
        if data:
            push_to_notion(data)
            newly_processed.append(data)
        time.sleep(1.0)

    # Now load existing web prompts data and merge
    web_file = r"C:\Users\sylvi\DEV\ANTIGRAVITY\prompt-vault-web\src\data\prompts.json"
    with open(web_file, "r", encoding="utf-8") as f:
        existing_prompts = json.load(f)

    existing_ids = {p.get("id") for p in existing_prompts}
    added_count = 0
    for p in newly_processed:
        if p["id"] not in existing_ids:
            # We don't expose the url in the frontend prompts.json to keep it 100% white-label!
            clean_for_web = {k: v for k, v in p.items() if k != "url"}
            existing_prompts.append(clean_for_web)
            existing_ids.add(p["id"])
            added_count += 1

    with open(web_file, "w", encoding="utf-8") as f:
        json.dump(existing_prompts, f, ensure_ascii=False, indent=2)

    # Also update backup data
    backup_file = r"C:\Users\sylvi\DEV\ANTIGRAVITY\data\prompts_library.json"
    os.makedirs(os.path.dirname(backup_file), exist_ok=True)
    with open(backup_file, "w", encoding="utf-8") as f:
        json.dump(existing_prompts, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 Succès ! {added_count} nouveaux prompts ajoutés à l'application.")
    print(f"Total des prompts disponibles : {len(existing_prompts)}")

if __name__ == "__main__":
    main()
