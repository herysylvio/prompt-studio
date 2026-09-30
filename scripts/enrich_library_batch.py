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

# Lot de 20 nouveaux prompts (4 par catégorie : Coding, Design, Sales, Copywriting, SEO)
TARGET_PROMPTS = [
    # --- Coding (4) ---
    {
        "id": "database-schema-architect",
        "url": "https://godofprompt.ai/prompt-library/design-database-schemas",
        "category": "Coding",
        "icon": "🗄️",
        "title_fr": "Architecte de Schémas de Bases de Données & Modélisation SQL",
        "description_fr": "Conçoit des schémas de bases de données relationnelles ou NoSQL normalisés, performants et évolutifs. Ce système définit les tables, clés primaires/étrangères, index stratégiques, contraintes d'intégrité et stratégies de migration pour supporter une montée en charge sans goulot d'étranglement.",
        "guide_fr": "Précisez vos cas d'usage métier, le volume de lectures/écritures attendu et le SGBD choisi (PostgreSQL, MySQL, Prisma, Supabase) pour obtenir un script DDL prêt à exécuter avec les index optimaux."
    },
    {
        "id": "nl-to-sql-converter",
        "url": "https://godofprompt.ai/prompt-library/plain-english-to-sql-query-converter",
        "category": "Coding",
        "icon": "🔎",
        "title_fr": "Convertisseur Langage Naturel vers Requêtes SQL Complexes",
        "description_fr": "Traduit instantanément vos besoins analytiques exprimés en langage courant en requêtes SQL hautement optimisées (CTE, fonctions de fenêtrage, jointures multiples, agrégations). Idéal pour extraire des indicateurs métier précis tout en évitant les scans de table coûteux.",
        "guide_fr": "Fournissez la structure de vos tables (ou votre schéma Prisma/SQL) ainsi que la question métier exacte. Le prompt générera la requête commentée ainsi qu'une analyse de performance (EXPLAIN)."
    },
    {
        "id": "complex-code-deconstructor",
        "url": "https://godofprompt.ai/prompt-library/break-down-complex-code",
        "category": "Coding",
        "icon": "🧩",
        "title_fr": "Analyseur & Décrypteur de Code Legacy Complexe",
        "description_fr": "Déconstruit n'importe quel bloc de code monolithique, algorithme obscur ou codebase legacy en une explication architecturale limpide. Identifie les flux de données, les effets de bord cachés, la complexité algorithmique (Big-O) et propose des pistes de refactorisation sûres.",
        "guide_fr": "Collez une fonction ou une classe difficile à maintenir. Utilisez la cartographie générée pour documenter votre code ou préparer une refactorisation sans casser la logique existante."
    },
    {
        "id": "app-security-auditor",
        "url": "https://godofprompt.ai/prompt-library/secure-vibe-coded-app",
        "category": "Coding",
        "icon": "🔐",
        "title_fr": "Auditeur de Sécurité Applicative & Vulnérabilités OWASP",
        "description_fr": "Passe au crible votre code et votre architecture pour détecter les failles de sécurité critiques (injections, failles d'authentification, exposition de secrets, IDOR, XSS/CSRF). Fournit un rapport de remédiation priorisé par sévérité avec les correctifs de code exacts.",
        "guide_fr": "Exécutez cet audit avant toute mise en production, en particulier sur les routes d'API, les middlewares d'authentification et la gestion des paiements ou données utilisateurs sensibles."
    },

    # --- Design (4) ---
    {
        "id": "brand-logo-designer",
        "url": "https://godofprompt.ai/prompt-library/generate-brand-logo-ideas",
        "category": "Design",
        "icon": "🎨",
        "title_fr": "Concepteur de Logos Minimalistes & Identité Visuelle",
        "description_fr": "Génère des concepts de logos vectoriels mémorables, intemporels et déclinables sur tous les supports. Combine la psychologie des formes, le minimalisme géométrique (style Paul Rand / Pentagram) et l'équilibre négatif pour créer un symbole fort.",
        "guide_fr": "Indiquez les valeurs fondamentales de votre marque et les éléments visuels à éviter absolument. Utilisez le prompt généré dans Midjourney, Ideogram ou Recraft pour obtenir des planches de logos vectoriels."
    },
    {
        "id": "editorial-product-photoshoot",
        "url": "https://godofprompt.ai/prompt-library/create-editorial-product-photoshoots",
        "category": "Design",
        "icon": "📷",
        "title_fr": "Shooting Photo Produit Éditorial & Studio Commercial",
        "description_fr": "Orchestrez des séances photo produits dignes des plus grands studios créatifs sans matériel physique. Définit la scénographie, les matériaux de surface (travertin, béton ciré, métal brossé), la direction de lumière et l'objectif photographique.",
        "guide_fr": "Parfait pour les fiches produits e-commerce et campagnes social media. Précisez les couleurs dominantes de votre produit pour créer un contraste chromatique harmonieux avec le décor."
    },
    {
        "id": "editorial-flat-illustrations",
        "url": "https://godofprompt.ai/prompt-library/design-editorial-flat-illustrations",
        "category": "Design",
        "icon": "✒️",
        "title_fr": "Illustrations Vectorielles Éditoriales & Flat Design",
        "description_fr": "Crée des illustrations éditoriales modernes et épurées (inspirées du style New Yorker, Notion ou Stripe) pour habiller vos articles de blog, landing pages SaaS et présentations. Garantit une cohérence de trait, de grain et de palette chromatique.",
        "guide_fr": "Décrivez le concept abstrait ou la métaphore que vous souhaitez illustrer (ex: la productivité, la cybersécurité) ainsi que 2 à 3 couleurs de votre charte graphique."
    },
    {
        "id": "minimalist-website-ui",
        "url": "https://godofprompt.ai/prompt-library/build-minimalist-company-websites",
        "category": "Design",
        "icon": "🖥️",
        "title_fr": "Architecte UI/UX de Sites Web Minimalistes & Modernes",
        "description_fr": "Conçoit le système de design complet et la maquette structurelle d'un site web d'entreprise ultra-épuré (inspiration Linear, Apple, Vercel). Définit la grille typographique, la hiérarchie visuelle, les micro-interactions et l'agencement des sections clés.",
        "guide_fr": "Utilisez ce prompt en amont du développement ou dans des outils comme Stitch/v0/Cursor pour poser une direction artistique sobre, lisible et orientée conversion."
    },

    # --- Sales (4) ---
    {
        "id": "b2b-sales-playbook",
        "url": "https://godofprompt.ai/prompt-library/create-sales-playbook",
        "category": "Sales",
        "icon": "📘",
        "title_fr": "Créateur de Sales Playbook & Standardisation Commerciale",
        "description_fr": "Bâtit le manuel d'exécution commerciale complet de votre entreprise : qualification des leads (MEDDIC/BANT), scripts d'appels de découverte, grille de démonstration, matrices de traitement d'objections et séquences de closing reproductibles.",
        "guide_fr": "Indispensable pour structurer votre démarche commerciale ou former de nouveaux commerciaux (SDR/Account Executives). Précisez votre cycle de vente moyen et le panier moyen (ACV)."
    },
    {
        "id": "negotiation-email-strategist",
        "url": "https://godofprompt.ai/prompt-library/craft-negotiation-emails",
        "category": "Sales",
        "icon": "🤝",
        "title_fr": "Stratège de Négociation Commerciale & Défense des Marges",
        "description_fr": "Rédige des réponses de négociation chirurgicales pour défendre vos tarifs face aux demandes de remise, débloquer les achats (Procurement) et obtenir des contreparties concrètes (engagement pluriannuel, étude de cas, paiement comptant) sans dévaloriser votre offre.",
        "guide_fr": "Ne cédez jamais une remise sans contrepartie (Give-Get). Indiquez l'objection budgétaire exacte du prospect et votre marge de manœuvre réelle pour générer 3 options de réponse."
    },
    {
        "id": "investor-pitch-narrative",
        "url": "https://godofprompt.ai/prompt-library/develop-investor-pitch-narratives",
        "category": "Sales",
        "icon": "🚀",
        "title_fr": "Architecte de Pitch Deck & Storytelling Investisseurs",
        "description_fr": "Structure un récit de levée de fonds ou de partenariat stratégique irrésistible slide par slide : l'inévitabilité du marché (Why Now), l'ampleur du problème, la supériorité du produit, la traction, le modèle économique (Unit Economics) et la vision long terme.",
        "guide_fr": "Fournissez vos métriques actuelles (même modestes) et l'avantage injuste (Unfair Advantage) de votre projet pour construire une trame narrative qui capte l'attention des décideurs en 3 minutes."
    },
    {
        "id": "sales-objection-crusher",
        "url": "https://godofprompt.ai/prompt-library/generate-sales-conversation-replies",
        "category": "Sales",
        "icon": "⚡",
        "title_fr": "Traitement des Objections & Réponses de Closing B2B",
        "description_fr": "Transforme les hésitations et blocages des prospects ('C'est trop cher', 'On utilise déjà un concurrent', 'Rappelez-moi au prochain trimestre') en conversations constructives grâce aux techniques d'empathie tactique et de recadrage par la valeur.",
        "guide_fr": "Collez le message ou l'objection exacte reçue par email, LinkedIn ou en appel. Le prompt vous livre une réponse immédiate qui valide l'inquiétude tout en isolant le vrai frein à la décision."
    },

    # --- Copywriting (4) ---
    {
        "id": "strategic-storytelling-master",
        "url": "https://godofprompt.ai/prompt-library/use-storytelling-techniques",
        "category": "Copywriting",
        "icon": "📖",
        "title_fr": "Maître du Storytelling Stratégique & Récit de Marque",
        "description_fr": "Transforme des faits bruts, études de cas ou parcours d'entreprise en récits captivants basés sur les structures dramaturgiques éprouvées (Voyage du Héros, In Media Res, Tension-Résolution). Crée une connexion émotionnelle immédiate qui fait mémoriser votre message.",
        "guide_fr": "Commencez toujours au cœur de l'action ou du moment de crise plutôt que par une longue introduction chronologique. Idéal pour vos pages 'À propos', posts fondateurs et conférences."
    },
    {
        "id": "high-retention-newsletter",
        "url": "https://godofprompt.ai/prompt-library/create-engaging-newsletter-content",
        "category": "Copywriting",
        "icon": "📰",
        "title_fr": "Rédacteur de Newsletters Captivantes à Forte Rétention",
        "description_fr": "Conçoit des éditions de newsletters que vos abonnés attendent chaque semaine : objets d'emails à fort taux d'ouverture, intro narrative fluide, apport de valeur dense et scannable, et transition naturelle vers votre offre commerciale.",
        "guide_fr": "Suivez la règle 80/20 : 80 % de valeur pure (insight exclusif, méthode applicable en 5 minutes) et 20 % d'appel à l'action vers vos produits ou services."
    },
    {
        "id": "ppc-ad-copy-converter",
        "url": "https://godofprompt.ai/prompt-library/write-ppc-ad-copy",
        "category": "Copywriting",
        "icon": "🎯",
        "title_fr": "Copywriter Publicitaire Haute Conversion (Meta & Google Ads)",
        "description_fr": "Génère des variations d'annonces publicitaires payantes (titres, textes principaux, descriptions) calibrées pour stopper le scroll, maximiser le taux de clic (CTR) et abaisser votre coût d'acquisition (CPA) en ciblant différents niveaux de conscience du marché.",
        "guide_fr": "Générez systématiquement 3 angles psychologiques distincts par campagne (Douleur/Urgence, Preuve Sociale/Résultat, Curiosité/Mécanisme Unique) pour vos tests A/B."
    },
    {
        "id": "viral-x-threads-architect",
        "url": "https://godofprompt.ai/prompt-library/generate-viral-x-threads",
        "category": "Copywriting",
        "icon": "🧵",
        "title_fr": "Architecte de Threads Viraux & Carrousels d'Autorité",
        "description_fr": "Découpe un sujet d'expertise dense en une séquence de posts courts (Thread X/Twitter ou Carrousel LinkedIn) au rythme magnétique. Chaque étape contient une micro-récompense cognitive et une boucle ouverte qui pousse à lire la suite et à enregistrer le post.",
        "guide_fr": "Soignez particulièrement le Tweet/Slide n°1 (promesse chiffrée + preuve de crédibilité) et l'avant-dernier post qui synthétise toute la valeur pour déclencher les partages (retweets/bookmarks)."
    },

    # --- SEO (4) ---
    {
        "id": "high-volume-keyword-hunter",
        "url": "https://godofprompt.ai/prompt-library/discover-high-volume-keyword-opportunities",
        "category": "SEO",
        "icon": "💎",
        "title_fr": "Chasseur de Mots-Clés à Fort Potentiel & Faible Concurrence",
        "description_fr": "Identifie des grappes de mots-clés (Topic Clusters) et des requêtes de longue traîne à haute intention commerciale que vos concurrents ignorent. Classe chaque opportunité par intention de recherche (informationnelle, comparative, transactionnelle) et priorité business.",
        "guide_fr": "Ciblez en priorité les requêtes à forte intention d'achat ('meilleur outil pour...', 'alternative à...', 'comparatif...') qui génèrent des conversions rapides même avec un volume modéré."
    },
    {
        "id": "local-seo-dominator",
        "url": "https://godofprompt.ai/prompt-library/conduct-local-seo-audit",
        "category": "SEO",
        "icon": "📍",
        "title_fr": "Auditeur SEO Local & Optimisation Google Business Profile",
        "description_fr": "Déploie un plan d'action complet pour dominer le Pack Local Google Maps et les recherches géolocalisées : optimisation de la fiche Google Business Profile, stratégie de collecte d'avis sémantiques, pages locales dédiées, citations NAP et balisage Schema.org LocalBusiness.",
        "guide_fr": "Encouragez vos clients à mentionner naturellement le nom de la prestation et la ville dans leurs avis Google : c'est l'un des facteurs de classement local les plus puissants."
    },
    {
        "id": "youtube-seo-strategist",
        "url": "https://godofprompt.ai/prompt-library/develop-youtube-seo-strategy",
        "category": "SEO",
        "icon": "▶️",
        "title_fr": "Stratège SEO YouTube & Algorithme de Découvrabilité Vidéo",
        "description_fr": "Optimise le référencement de vos vidéos sur YouTube et Google Vidéos : recherche de mots-clés vidéo, titres optimisés CTR + SEO, descriptions riches en entités, chapitrage stratégique (timestamps), tags sémantiques et maillage de fin d'écran.",
        "guide_fr": "Prononcez votre mot-clé principal à voix haute dans les 30 premières secondes de la vidéo : YouTube indexe automatiquement la transcription audio pour classer votre contenu."
    },
    {
        "id": "seo-content-humanizer",
        "url": "https://godofprompt.ai/prompt-library/humanize-your-seo-text",
        "category": "SEO",
        "icon": "✍️",
        "title_fr": "Humaniseur de Contenu SEO & Optimisation E-E-A-T",
        "description_fr": "Réécrit et enrichit les brouillons d'articles SEO pour éliminer toute tournure robotique ou répétitive. Injecte de la variété syntaxique (perplexité et burstiness), un ton incarné et les marqueurs d'expérience réelle (E-E-A-T) valorisés par Google.",
        "guide_fr": "Passez vos textes générés par IA dans ce filtre avant publication et ajoutez un encadré 'Retour d'expérience terrain' ou un chiffre issu de votre propre pratique pour maximiser la crédibilité."
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

    # 100% French description
    desc_fr = item["description_fr"]

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
You are a {expert_role}.
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
{raw_prompt[:500]}
</source_intent_reference>""".strip()

    vars_list = [
        {
            "name": v,
            "placeholder": f"{{{{{v.lower().replace(' ', '-')}}}}}",
            "desc_fr": f"Renseignez votre paramètre ({v.lower()}) pour personnaliser le résultat."
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

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    web_file = os.path.join(base_dir, "src", "data", "prompts.json")

    with open(web_file, "r", encoding="utf-8") as f:
        existing_prompts = json.load(f)

    existing_ids = {p.get("id") for p in existing_prompts}
    newly_processed = []

    for idx, item in enumerate(TARGET_PROMPTS, 1):
        if item["id"] in existing_ids:
            print(f"\n[{idx}/{len(TARGET_PROMPTS)}] SKIP (déjà présent) : {item['title_fr']}")
            continue
        print(f"\n[{idx}/{len(TARGET_PROMPTS)}] {item['category']} | {item['title_fr']}")
        data = scrape_prompt(item)
        if data:
            push_to_notion(data)
            newly_processed.append(data)
        time.sleep(0.8)

    added_count = 0
    for p in newly_processed:
        if p["id"] not in existing_ids:
            clean_for_web = {k: v for k, v in p.items() if k != "url"}
            existing_prompts.append(clean_for_web)
            existing_ids.add(p["id"])
            added_count += 1

    with open(web_file, "w", encoding="utf-8") as f:
        json.dump(existing_prompts, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 Succès ! {added_count} nouveaux prompts ajoutés à l'application et synchronisés sur Notion.")
    print(f"Total des prompts disponibles : {len(existing_prompts)}")

if __name__ == "__main__":
    main()
