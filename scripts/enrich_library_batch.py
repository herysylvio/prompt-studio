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

# Lot de 25 nouveaux prompts (5 par catégorie : Coding, Design, Sales, Copywriting, SEO -> 12 prompts par catégorie = 72 total)
TARGET_PROMPTS = [
    # --- Coding (+5 -> 12) ---
    {
        "id": "api-integration-architect",
        "url": "https://godofprompt.ai/prompt-library/perform-api-integrations",
        "category": "Coding",
        "icon": "🔌",
        "title_fr": "Architecte d'Intégrations API REST/GraphQL & Webhooks",
        "description_fr": "Conçoit du code d'intégration d'API robuste et tolérant aux pannes : gestion de l'authentification (OAuth2, JWT, clés API), logique de retry avec backoff exponentiel, validation des schémas (Zod/TypeScript), gestion du rate-limiting et sécurisation des webhooks entrants.",
        "guide_fr": "Collez la documentation de l'endpoint cible et précisez votre langage/framework (Node.js, Python, Next.js). Le prompt génère un client API typé, modulaire et prêt pour la production."
    },
    {
        "id": "sql-performance-optimizer",
        "url": "https://godofprompt.ai/prompt-library/analyze-sql-query-performances",
        "category": "Coding",
        "icon": "🚀",
        "title_fr": "Optimiseur de Performance SQL & Indexation Avancée",
        "description_fr": "Diagnostique les requêtes SQL lentes et les goulots d'étranglement de votre base de données. Décode les plans d'exécution (EXPLAIN ANALYZE), élimine les problèmes N+1 et les Full Table Scans, réécrit les sous-requêtes coûteuses et recommande les index composites exacts.",
        "guide_fr": "Fournissez votre requête lente accompagnée de la sortie d'EXPLAIN ANALYZE et de la volumétrie approximative de vos tables pour diviser vos temps de réponse par 10."
    },
    {
        "id": "frontend-qa-auditor",
        "url": "https://godofprompt.ai/prompt-library/frontend-qa-sweep-on-staging",
        "category": "Coding",
        "icon": "🧪",
        "title_fr": "Auditeur QA Frontend & Recette Technique Pré-Production",
        "description_fr": "Établit un protocole d'inspection systématique de votre interface avant la mise en production : états de chargement/erreur/vide, responsive multi-écrans, accessibilité clavier (ARIA), fuites mémoire, résilience réseau (3G/offline) et tests E2E Playwright/Cypress.",
        "guide_fr": "Utilisez cette grille sur votre environnement de staging avant chaque release majeure pour intercepter les régressions visuelles et fonctionnelles que les tests unitaires ne voient pas."
    },
    {
        "id": "technical-docs-generator",
        "url": "https://godofprompt.ai/prompt-library/draft-documentation-from-vibe-code",
        "category": "Coding",
        "icon": "📚",
        "title_fr": "Générateur de Documentation Technique & Spécifications API",
        "description_fr": "Transforme votre code source en une documentation technique claire, structurée et maintenable : README d'architecture, diagrammes de flux Mermaid, documentation des endpoints API (OpenAPI/Swagger), guide d'onboarding développeur et ADR (Architecture Decision Records).",
        "guide_fr": "Fournissez vos fichiers principaux ou votre arbre de dossiers. Idéal pour professionnaliser un dépôt GitHub ou faciliter la passation technique à une équipe."
    },
    {
        "id": "ethical-web-scraper-builder",
        "url": "https://godofprompt.ai/prompt-library/generate-ethical-web-scraping-script",
        "category": "Coding",
        "icon": "🕸️",
        "title_fr": "Ingénieur d'Extraction de Données & Web Scraping Résilient",
        "description_fr": "Développe des pipelines d'extraction et de parsing de données web propres et respectueux (BeautifulSoup, Playwright, Puppeteer). Gère la pagination dynamique, la limitation de cadence (throttling), la gestion des erreurs DOM et l'export structuré en JSON/CSV.",
        "guide_fr": "Indiquez la structure HTML cible (sélecteurs CSS ou extrait du DOM) et le format de sortie souhaité pour obtenir un script d'automatisation fiable et bien structuré."
    },

    # --- Design (+5 -> 12) ---
    {
        "id": "clean-saas-ui-concepts",
        "url": "https://godofprompt.ai/prompt-library/create-clean-ui-design-concepts",
        "category": "Design",
        "icon": "🎛️",
        "title_fr": "Concepteur d'Interfaces SaaS & Dashboard UI Épuré",
        "description_fr": "Génère des concepts d'interfaces logicielles et de tableaux de bord SaaS modernes à haute lisibilité. Maîtrise l'espacement (grille 8pt), les contrastes subtils en mode sombre/clair, la visualisation de données (data-viz) et l'esthétique fonctionnelle contemporaine.",
        "guide_fr": "Décrivez les métriques ou fonctionnalités clés à afficher à l'écran et précisez le thème souhaité (Dark Mode type Linear/Raycast ou Light Mode type Stripe/Notion)."
    },
    {
        "id": "premium-fashion-lookbook",
        "url": "https://godofprompt.ai/prompt-library/design-premium-fashion-advertisement-layouts",
        "category": "Design",
        "icon": "🧥",
        "title_fr": "Directeur Artistique de Campagnes Mode & Lookbooks",
        "description_fr": "Conçoit des visuels de campagnes mode et streetwear haut de gamme avec une direction artistique digne des magazines internationaux. Contrôle le drapé des textiles, la pose éditoriale des mannequins, le grain argentique moyen format et la composition typographique.",
        "guide_fr": "Spécifiez la coupe du vêtement, la matière exacte (lin lavé, cuir grainé, laine mérinos) et l'ambiance architecturale du décor pour un rendu lookbook authentique."
    },
    {
        "id": "luxury-billboard-mockups",
        "url": "https://godofprompt.ai/prompt-library/generate-luxury-billboard-mockups",
        "category": "Design",
        "icon": "🏙️",
        "title_fr": "Mockups d'Affichage Urbain & Campagnes OOH Grand Format",
        "description_fr": "Crée des mises en situation photoréalistes de vos campagnes publicitaires sur des panneaux d'affichage urbains (Out-Of-Home), abribus ou écrans géants architecturaux. Intègre la perspective naturelle, l'éclairage ambiant de la ville et les reflets atmosphériques.",
        "guide_fr": "Parfait pour projeter une identité de marque dans le monde réel lors d'un pitch client. Précisez l'environnement urbain (Paris haussmannien, Tokyo nocturne, avenue minimaliste)."
    },
    {
        "id": "luxury-beauty-product-shots",
        "url": "https://godofprompt.ai/prompt-library/create-luxury-beauty-product-shots",
        "category": "Design",
        "icon": "💧",
        "title_fr": "Photographie Cosmétique & Textures Skincare Haute Définition",
        "description_fr": "Sublime vos produits cosmétiques et soins de la peau grâce à la photographie macro commerciale : gouttelettes d'eau cristallines, textures de sérum ou de crème onctueuse (swatches), surfaces minérales humides et lumière douce réfractée.",
        "guide_fr": "Associez le flacon ou pot à ses ingrédients botaniques ou minéraux phares (ex: quartz rose, feuille d'aloe, ondulations d'eau pure) pour évoquer immédiatement la sensorialité du soin."
    },
    {
        "id": "architectural-exterior-renders",
        "url": "https://godofprompt.ai/prompt-library/render-photorealistic-architecture-exteriors",
        "category": "Design",
        "icon": "🏛️",
        "title_fr": "Rendu Architectural Photoréaliste & Design d'Espaces",
        "description_fr": "Produit des visualisations architecturales extérieures et intérieures d'un réalisme saisissant (style ArchDaily / Dezeen). Maîtrise les matériaux bruts (béton banché, bois brûlé, verre structurel), la végétation paysagère et l'orientation solaire précise.",
        "guide_fr": "Indiquez le style architectural (minimalisme japonais, brutalisme chaleureux, pavillon méditerranéen) et l'heure du jour (heure bleue, zénith, brume matinale)."
    },

    # --- Sales (+5 -> 12) ---
    {
        "id": "b2b-proposal-architect",
        "url": "https://godofprompt.ai/prompt-library/create-compelling-proposal-presentations",
        "category": "Sales",
        "icon": "📑",
        "title_fr": "Rédacteur de Propositions Commerciales & Offres Sur-Mesure",
        "description_fr": "Structure des propositions commerciales B2B qui vendent même en votre absence (pour le comité de direction). Met en avant le diagnostic coût de l'inaction, le retour sur investissement chiffré, le plan de déploiement sans risque et une tarification à 3 paliers d'ancrage.",
        "guide_fr": "Ne commencez jamais une proposition par la présentation de votre entreprise : ouvrez toujours sur la reformulation exacte des enjeux stratégiques du client et le coût de son problème actuel."
    },
    {
        "id": "strategic-upsell-expansion",
        "url": "https://godofprompt.ai/prompt-library/identify-strategic-upsell-opportunities",
        "category": "Sales",
        "icon": "📈",
        "title_fr": "Stratège d'Expansion de Comptes (Upsell & Cross-Sell)",
        "description_fr": "Identifie et active les opportunités de croissance au sein de votre portefeuille clients existant (Net Revenue Retention). Détecte les signaux d'usage, prépare les bilans trimestriels de valeur (QBR) et formule des offres d'extension naturelles.",
        "guide_fr": "Appuyez-vous sur les résultats déjà obtenus par le client avec votre offre initiale pour présenter l'upsell comme l'étape logique suivante de sa croissance."
    },
    {
        "id": "chat-closing-scripts",
        "url": "https://godofprompt.ai/prompt-library/build-chat-closing-script-libraries",
        "category": "Sales",
        "icon": "💬",
        "title_fr": "Bibliothèque de Scripts de Closing par Chat & DM (Social Selling)",
        "description_fr": "Conçoit des séquences conversationnelles pour qualifier et convertir des prospects par messagerie directe (LinkedIn DM, Instagram, WhatsApp, Live Chat) sans paraître intrusif. Utilise le diagnostic par micro-questions pour amener naturellement à la prise de rendez-vous.",
        "guide_fr": "Gardez des messages courts (2 à 3 phrases maximum) qui se terminent toujours par une question ouverte simple portant sur la situation actuelle de votre interlocuteur."
    },
    {
        "id": "contract-negotiation-analyzer",
        "url": "https://godofprompt.ai/prompt-library/analyze-contract-negotiation-points",
        "category": "Sales",
        "icon": "⚖️",
        "title_fr": "Analyseur de Clauses Contractuelles & Leviers d'Accord B2B",
        "description_fr": "Examine les points de friction lors de la finalisation d'un contrat commercial (conditions de paiement, SLA, clauses de sortie, propriété intellectuelle, responsabilité). Propose des formulations de compromis équilibrées qui accélèrent la validation juridique.",
        "guide_fr": "Séparez les concessions financières des concessions de conditions (ex: échanger un délai de paiement à 30 jours contre une signature avant la fin du mois)."
    },
    {
        "id": "multi-touch-followup-system",
        "url": "https://godofprompt.ai/prompt-library/generate-follow-up-emails",
        "category": "Sales",
        "icon": "🔔",
        "title_fr": "Système de Relance Commerciale Multi-Touches Sans Friction",
        "description_fr": "Remplace les relances banales ('Je reviens vers vous...') par une séquence d'emails de suivi qui apportent une nouvelle valeur à chaque point de contact : étude de cas ciblée, ressource métier, insight sectoriel et email de clôture élégant (break-up email).",
        "guide_fr": "Chaque email de relance doit pouvoir se suffire à lui-même et apporter un angle neuf ou une preuve supplémentaire plutôt que de culpabiliser le prospect pour son silence."
    },

    # --- Copywriting (+5 -> 12) ---
    {
        "id": "persuasive-editorial-writer",
        "url": "https://godofprompt.ai/prompt-library/create-persuasive-editorial-content",
        "category": "Copywriting",
        "icon": "🪶",
        "title_fr": "Rédacteur d'Articles d'Opinion (Thought Leadership) & Éditoriaux",
        "description_fr": "Rédige des essais, tribunes et prises de position d'autorité qui vous démarquent du consensus tiède de votre marché. Structure une thèse forte, démonte les idées reçues avec des preuves tangibles et installe votre statut d'expert référent.",
        "guide_fr": "Identifiez une croyance répandue mais obsolète dans votre industrie et expliquez avec bienveillance et rigueur pourquoi la nouvelle réalité exige une approche différente."
    },
    {
        "id": "google-ads-headline-engine",
        "url": "https://godofprompt.ai/prompt-library/craft-google-ads-headlines",
        "category": "Copywriting",
        "icon": "⚡",
        "title_fr": "Générateur d'Accroches Google Ads & Titres à Fort CTR",
        "description_fr": "Produit des matrices complètes de titres (30 caractères) et descriptions (90 caractères) pour vos campagnes Google Search (RSA). Maximise le Quality Score et le taux de clic grâce à l'insertion précise des mots-clés, des chiffres preuves et des bénéfices immédiats.",
        "guide_fr": "Variez les angles entre vos 15 titres RSA : 5 centrés sur le mot-clé exact, 5 sur le bénéfice chiffré ou la rapidité, et 5 sur la réassurance et l'appel à l'action."
    },
    {
        "id": "email-story-hooks-creator",
        "url": "https://godofprompt.ai/prompt-library/get-email-story-hooks",
        "category": "Copywriting",
        "icon": "🪝",
        "title_fr": "Créateur d'Ouvertures Narratives & Hooks d'Emails Quotidiens",
        "description_fr": "Transforme des anecdotes du quotidien, des observations clients ou des faits d'actualité en ouvertures d'emails irrésistibles (style Seinfeld Emails / Infotainment), reliées avec fluidité à une leçon métier et à votre offre du jour.",
        "guide_fr": "La première phrase de votre email doit être courte, visuelle ou intrigante pour entraîner le lecteur dans un toboggan de lecture (slippery slide) jusqu'à l'appel à l'action."
    },
    {
        "id": "long-form-sales-page-writer",
        "url": "https://godofprompt.ai/prompt-library/create-high-converting-sales-pages",
        "category": "Copywriting",
        "icon": "📜",
        "title_fr": "Architecte de Pages de Vente Long-Form & Argumentaires Directs",
        "description_fr": "Développe l'argumentaire complet d'une page de vente haute conversion pour vos offres premium, formations ou logiciels : grande promesse, qualification à qui s'adresse l'offre, démonstration du mécanisme unique, empilement des bonus, FAQ anti-objections et garantie.",
        "guide_fr": "Alternez les éléments émotionnels (la transformation vécue après l'achat) et les éléments rationnels (caractéristiques précises, ROI chiffré, garanties) pour convaincre tous les profils d'acheteurs."
    },
    {
        "id": "renewal-anti-churn-sequences",
        "url": "https://godofprompt.ai/prompt-library/draft-subscription-renewal-communication-sequences",
        "category": "Copywriting",
        "icon": "🔄",
        "title_fr": "Séquences de Renouvellement d'Abonnement & Anti-Churn",
        "description_fr": "Conçoit des campagnes d'emails de fidélisation, de passage à l'offre annuelle et de réactivation (win-back). Rappelle la valeur cumulée par l'utilisateur, célèbre ses jalons d'utilisation et neutralise les risques de résiliation.",
        "guide_fr": "Envoyez votre séquence de renouvellement 30, 15 et 3 jours avant l'échéance en mettant en avant le bilan personnalisé des résultats obtenus par le client."
    },

    # --- SEO (+5 -> 12) ---
    {
        "id": "technical-seo-deep-auditor",
        "url": "https://godofprompt.ai/prompt-library/perform-comprehensive-technical-seo-audit",
        "category": "SEO",
        "icon": "⚙️",
        "title_fr": "Auditeur SEO Technique Approfondi (Crawl, Indexation & Core Web Vitals)",
        "description_fr": "Examine l'infrastructure technique de votre site pour lever tous les freins à l'indexation et au classement Google : budget de crawl, robots.txt, sitemaps XML, balises canoniques, erreurs 4xx/5xx, chaînes de redirections, rendu JavaScript et Core Web Vitals (LCP, INP, CLS).",
        "guide_fr": "Idéal lors d'une refonte de site ou d'une baisse inexpliquée de trafic organique. Fournissez la stack de votre site (Next.js, WordPress, Shopify, Webflow) pour des recommandations ciblées."
    },
    {
        "id": "internal-linking-architect",
        "url": "https://godofprompt.ai/prompt-library/develop-internal-linking-framework",
        "category": "SEO",
        "icon": "🕸️",
        "title_fr": "Architecte de Maillage Interne & Cocons Sémantiques",
        "description_fr": "Structure le maillage interne de votre site en silos thématiques et cocons sémantiques (Pillar Pages & Cluster Content). Optimise la distribution du PageRank interne, définit les ancres de liens contextuelles variées et élimine les pages orphelines.",
        "guide_fr": "Listez vos pages piliers (pages commerciales ou guides majeurs) ainsi que vos articles de blog satellites pour obtenir un plan de liaison précis avec les textes d'ancrage recommandés."
    },
    {
        "id": "authority-backlink-strategist",
        "url": "https://godofprompt.ai/prompt-library/acquire-quality-backlinks-from-authority-sites",
        "category": "SEO",
        "icon": "🔗",
        "title_fr": "Stratège Netlinking & Acquisition de Backlinks d'Autorité",
        "description_fr": "Conçoit des campagnes d'acquisition de liens entrants (Backlinks White-Hat) à haute autorité : création d'actifs linkables (études de données, calculateurs, baromètres), relations presse digitales (Digital PR), récupération de liens cassés et partenariats éditoriaux.",
        "guide_fr": "Privilégiez toujours la pertinence thématique et le trafic réel du domaine référent plutôt que le volume brut de liens. Utilisez les modèles d'outreach inclus pour maximiser le taux de réponse."
    },
    {
        "id": "schema-markup-jsonld-generator",
        "url": "https://godofprompt.ai/prompt-library/implement-schema-markup-in-e-commerce-seo",
        "category": "SEO",
        "icon": "🏷️",
        "title_fr": "Générateur de Données Structurées Schema.org (JSON-LD & Rich Snippets)",
        "description_fr": "Génère des blocs de données structurées JSON-LD valides selon les derniers standards Schema.org et Google Search Central (Product, FAQPage, Article, SoftwareApplication, Organization, BreadcrumbList) pour décrocher les résultats enrichis (Rich Snippets) et nourrir les moteurs IA (GEO).",
        "guide_fr": "Intégrez le script JSON-LD généré dans le <head> de votre page et validez-le avec le test des résultats enrichis Google pour augmenter la surface visuelle de votre résultat dans la SERP."
    },
    {
        "id": "serp-reverse-engineering",
        "url": "https://godofprompt.ai/prompt-library/conduct-serp-analysis-strategy",
        "category": "SEO",
        "icon": "🧭",
        "title_fr": "Analyseur de SERP Google & Rétro-Ingénierie du Top 3",
        "description_fr": "Décortique la première page de Google pour un mot-clé donné afin d'identifier exactement ce que l'algorithme récompense : format dominant (guide, outil, comparatif), profondeur sémantique, fonctionnalités SERP présentes (PAA, Featured Snippet) et angle différenciant (Information Gain).",
        "guide_fr": "Renseignez votre requête cible et les titres ou plans des 3 premiers résultats actuels. Le prompt vous livrera le plan d'article exact conçu pour les surpasser."
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
