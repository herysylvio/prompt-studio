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

# Lot de 36 nouveaux prompts (12 par nouvelle catégorie : Automation, Business, Finance -> 108 prompts total)
TARGET_PROMPTS = [
    # ==========================================
    # 1. Automation (Agents IA & Automatisation — 12)
    # ==========================================
    {
        "id": "n8n-production-workflows",
        "url": "https://godofprompt.ai/prompt-library/generate-production-ready-n8n-workflows",
        "category": "Automation",
        "icon": "🤖",
        "title_fr": "Architecte de Workflows n8n Prêts pour la Production",
        "description_fr": "Conçoit des architectures d'automatisation n8n complètes et résilientes : déclencheurs webhooks, nœuds HTTP Request, transformation JSON/Code, gestion des erreurs (Error Trigger), boucles de retry et intégration d'agents LLM avec mémoire.",
        "guide_fr": "Décrivez les outils à interconnecter (ex: Notion, Slack, HubSpot, OpenAI) et l'événement déclencheur pour obtenir la topologie exacte des nœuds et les expressions JSON."
    },
    {
        "id": "business-automation-systems",
        "url": "https://godofprompt.ai/prompt-library/create-business-automation-workflows",
        "category": "Automation",
        "icon": "⚙️",
        "title_fr": "Concepteur de Systèmes d'Automatisation Métier Bout-en-Bout",
        "description_fr": "Transforme vos processus opérationnels manuels et répétitifs en pipelines automatisés sans friction (Make, Zapier, n8n, scripts). Cartographie les entrées, les règles métier conditionnelles, les validations humaines (Human-in-the-Loop) et les alertes d'anomalie.",
        "guide_fr": "Listez les étapes actuelles de votre processus manuel et le temps perdu à chaque étape pour obtenir un blueprint d'automatisation priorisé par ROI."
    },
    {
        "id": "unattended-agent-instructions",
        "url": "https://godofprompt.ai/prompt-library/standing-instruction-for-unattended-agent-runs",
        "category": "Automation",
        "icon": "🧠",
        "title_fr": "Ingénieur de Directives Systèmes pour Agents IA Autonomes",
        "description_fr": "Rédige les instructions permanentes (Standing Instructions) et les protocoles de sécurité pour les agents IA s'exécutant en arrière-plan sans supervision humaine : critères d'arrêt, gestion des ambiguïtés, journalisation d'audit et limites d'exécution.",
        "guide_fr": "Indispensable pour fiabiliser vos agents autonomes (Claude Code, Devin, AutoGPT, agents cron) et éviter les boucles infinies ou actions destructrices."
    },
    {
        "id": "customer-support-ai-chatbot",
        "url": "https://godofprompt.ai/prompt-library/build-customer-support-chatbots",
        "category": "Automation",
        "icon": "💬",
        "title_fr": "Architecte d'Agents Conversationnels & Support Client IA",
        "description_fr": "Développe le prompt système, la base de connaissances RAG et l'arbre de résolution d'un agent de support client IA capable de résoudre 80 % des tickets de niveau 1 avec empathie, précision et zéro hallucination sur vos politiques commerciales.",
        "guide_fr": "Renseignez vos politiques de remboursement, votre FAQ produit et le ton de votre marque pour générer un agent de support fiable et chaleureux."
    },
    {
        "id": "workflow-automation-auditor",
        "url": "https://godofprompt.ai/prompt-library/identify-workflow-automation-opportunities",
        "category": "Automation",
        "icon": "🔍",
        "title_fr": "Auditeur d'Opportunités d'Automatisation & Gain de Temps",
        "description_fr": "Analyse l'emploi du temps et les opérations d'une équipe ou d'un solopreneur pour détecter les goulots d'étranglement automatisables. Classe chaque opportunité selon une matrice Complexité Technique vs Heures Économisées par mois.",
        "guide_fr": "Décrivez votre journée type ou les tâches hebdomadaires de votre équipe pour identifier les 3 automatisations rapides (Quick Wins) à déployer dès cette semaine."
    },
    {
        "id": "custom-automation-scripts",
        "url": "https://godofprompt.ai/prompt-library/write-custom-automation-scripts",
        "category": "Automation",
        "icon": "⚡",
        "title_fr": "Générateur de Scripts d'Automatisation Sur-Mesure (Python / Bash / Node)",
        "description_fr": "Écrit des scripts d'automatisation locaux ou serveur clés en main : synchronisation de fichiers, nettoyage de données CSV/Excel, envoi de rapports planifiés (Cron / Task Scheduler), notifications Webhook et sauvegardes automatisées.",
        "guide_fr": "Précisez votre système d'exploitation (Windows PowerShell, macOS, Linux) et l'action souhaitée pour obtenir un script robuste avec journalisation (logs) intégrée."
    },
    {
        "id": "prompt-engineering-master",
        "url": "https://godofprompt.ai/prompt-library/refine-prompt-engineering-techniques",
        "category": "Automation",
        "icon": "✨",
        "title_fr": "Méta-Prompt : Optimiseur & Architecte d'Ingénierie de Prompt",
        "description_fr": "Transforme n'importe quelle consigne vague en un prompt d'ingénierie avancée structuré en balises XML, doté d'un Persona senior, de contraintes négatives strictes, d'un raisonnement Chain-of-Thought et d'un schéma de sortie déterministe.",
        "guide_fr": "Collez votre brouillon de prompt initial et indiquez le modèle cible (Claude, GPT-4o, Gemini) pour décupler la qualité et la régularité des réponses."
    },
    {
        "id": "chatbot-handoff-protocols",
        "url": "https://godofprompt.ai/prompt-library/generate-chatbot-handoff-scripts",
        "category": "Automation",
        "icon": "🤝",
        "title_fr": "Protocole d'Escalade & Transfert Agent IA vers Humain",
        "description_fr": "Conçoit les règles de détection de frustration, les seuils de confiance et les scripts de transition fluide lorsqu'un agent IA doit passer le relais à un conseiller humain, incluant la synthèse automatique du contexte pour éviter au client de se répéter.",
        "guide_fr": "Définissez clairement les cas critiques (litige facturation, bug bloquant, client VIP) qui doivent déclencher un transfert humain immédiat."
    },
    {
        "id": "onboarding-chatbot-flows",
        "url": "https://godofprompt.ai/prompt-library/design-onboarding-chatbot-conversation-flows",
        "category": "Automation",
        "icon": "🧭",
        "title_fr": "Concepteur de Flux Conversationnels d'Onboarding Client",
        "description_fr": "Crée des parcours d'accueil interactifs guidés par un assistant IA pour qualifier les nouveaux utilisateurs, configurer leur espace de travail en direct et les amener à leur première victoire (Aha! Moment) en moins de 3 minutes.",
        "guide_fr": "Idéal pour les SaaS, applications mobiles et communautés privées souhaitant maximiser le taux d'activation dès le premier jour."
    },
    {
        "id": "market-research-agent-brief",
        "url": "https://godofprompt.ai/prompt-library/market-research-and-positioning-agent-brief",
        "category": "Automation",
        "icon": "📡",
        "title_fr": "Brief d'Agent Autonome d'Intelligence & Veille Marché",
        "description_fr": "Configure un agent de recherche autonome (Deep Research / Perplexity / Agent Web) chargé de surveiller vos concurrents, d'extraire les signaux faibles d'un marché, d'analyser les avis clients et de synthétiser un rapport de positionnement stratégique.",
        "guide_fr": "Utilisez ce prompt dans les modes Deep Research de Gemini, ChatGPT ou Perplexity pour obtenir une étude de marché sourcée en quelques minutes."
    },
    {
        "id": "reusable-browser-agent",
        "url": "https://godofprompt.ai/prompt-library/browser-operator-workflow-to-reusable-agent",
        "category": "Automation",
        "icon": "🌐",
        "title_fr": "Architecte d'Agents Opérateurs Web & Navigation Automatisée",
        "description_fr": "Convertit une séquence d'actions manuelles dans le navigateur (recherche, extraction de tableaux, remplissage de formulaires, veille tarifaire) en une procédure déterministe et réutilisable pour un agent navigateur (Browser Use / Playwright Agent).",
        "guide_fr": "Détaillez les URLs de départ, les sélecteurs ou repères visuels et les vérifications de succès attendues à chaque étape de navigation."
    },
    {
        "id": "system-prompt-guardrails",
        "url": "https://godofprompt.ai/prompt-library/settled-answers-rule-for-chat-system-prompts",
        "category": "Automation",
        "icon": "🛡️",
        "title_fr": "Ingénieur de Garde-Fous & Règles Déterministes pour System Prompts",
        "description_fr": "Blinde vos System Prompts professionnels contre la dérive conversationnelle, les hallucinations, le contournement de consignes (Prompt Injection) et les réponses contradictoires lors des longues sessions de chat.",
        "guide_fr": "Intégrez ce module de règles dans les instructions système de vos Custom GPTs, Projets Claude ou Gems Gemini."
    },

    # ==========================================
    # 2. Business (Productivité & Stratégie Business — 12)
    # ==========================================
    {
        "id": "ai-business-plan-architect",
        "url": "https://godofprompt.ai/prompt-library/generate-business-plans",
        "category": "Business",
        "icon": "🏛️",
        "title_fr": "Architecte de Business Plan Exécutif & Modèle Économique",
        "description_fr": "Élabore un Business Plan complet, réaliste et orienté exécution : proposition de valeur unique, analyse du marché adressable (TAM/SAM/SOM), modèle de revenus, structure de coûts, stratégie d'acquisition et jalons opérationnels sur 12 mois.",
        "guide_fr": "Fournissez votre idée d'offre, votre capital de départ et votre marché cible pour obtenir un dossier stratégique prêt à challenger ou présenter."
    },
    {
        "id": "strategic-decision-matrix",
        "url": "https://godofprompt.ai/prompt-library/optimize-strategic-decision-making-processes",
        "category": "Business",
        "icon": "⚖️",
        "title_fr": "Système d'Aide à la Décision Stratégique & Arbitrage Dirigeant",
        "description_fr": "Applique les modèles mentaux des meilleurs dirigeants (pensée en premiers principes, analyse pré-mortem, matrice d'irréversibilité de Bezos, coût d'opportunité) pour trancher vos décisions complexes avec lucidité et éliminer les biais cognitifs.",
        "guide_fr": "Exposez les options entre lesquelles vous hésitez, vos contraintes actuelles et ce que vous craignez de perdre pour obtenir un arbitrage structuré."
    },
    {
        "id": "kpi-dashboard-architect",
        "url": "https://godofprompt.ai/prompt-library/generate-kpi-dashboards",
        "category": "Business",
        "icon": "📊",
        "title_fr": "Concepteur de Tableaux de Bord KPIs & OKRs Trimestriels",
        "description_fr": "Sélectionne les indicateurs avancés (Leading Indicators) et retardés (Lagging Indicators) vitaux pour piloter votre activité sans vous noyer sous les métriques de vanité. Aligne vos OKRs trimestriels avec un rituel de suivi hebdomadaire.",
        "guide_fr": "Indiquez votre modèle économique (SaaS, Agence, E-commerce, Infoproduit) et votre objectif du trimestre pour définir votre North Star Metric."
    },
    {
        "id": "saas-onboarding-roadmap",
        "url": "https://godofprompt.ai/prompt-library/develop-saas-onboarding-roadmaps",
        "category": "Business",
        "icon": "🗺️",
        "title_fr": "Architecte de Feuille de Route d'Onboarding & Activation Produit",
        "description_fr": "Conçoit le parcours d'intégration idéal de vos nouveaux clients pour réduire le Time-to-Value (temps avant le premier résultat concret), éliminer les points d'abandon lors des 7 premiers jours et maximiser la rétention à long terme.",
        "guide_fr": "Précisez l'action clé qui prouve qu'un client tire réellement de la valeur de votre produit ou service afin de construire tout le parcours autour d'elle."
    },
    {
        "id": "startup-10k-mrr-blueprint",
        "url": "https://godofprompt.ai/prompt-library/create-10-k-mrr-startups",
        "category": "Business",
        "icon": "🚀",
        "title_fr": "Plan d'Exécution Startup : De 0 à 10 000 € de MRR",
        "description_fr": "Déploie une feuille de route pragmatique et frugale pour valider un problème douloureux, construire une offre minimale vendable (MVP), décrocher les 10 premiers clients payants à la main et atteindre le cap des 10k€ de revenus récurrents mensuels.",
        "guide_fr": "Idéal pour les fondateurs bootstrappés et créateurs d'offres B2B qui veulent privilégier la traction commerciale immédiate plutôt que la sur-ingénierie."
    },
    {
        "id": "innovation-product-roadmap",
        "url": "https://godofprompt.ai/prompt-library/create-innovation-roadmap",
        "category": "Business",
        "icon": "🧭",
        "title_fr": "Stratège de Roadmap Produit & Priorisation R&D (RICE / ICE)",
        "description_fr": "Organise et priorise votre backlog d'idées et de fonctionnalités selon les frameworks RICE (Reach, Impact, Confidence, Effort) et Kano. Sépare les fondations indispensables (Must-Have) des différenciateurs stratégiques sur 3 horizons temporels.",
        "guide_fr": "Listez toutes les fonctionnalités ou projets que vous envisagez de lancer ce semestre ainsi que la taille de votre équipe pour arbitrer sans friction."
    },
    {
        "id": "project-management-system",
        "url": "https://godofprompt.ai/prompt-library/build-minimalist-project-management-dashboards",
        "category": "Business",
        "icon": "📋",
        "title_fr": "Architecte de Système de Gestion de Projet Minimaliste",
        "description_fr": "Conçoit une architecture d'organisation claire et sans lourdeur administrative (pour Notion, Linear ou ClickUp) : découpage en livrables atomiques, gestion des dépendances critiques, matrice RACI et rituels asynchrones.",
        "guide_fr": "Parfait pour structurer un lancement complexe ou organiser une équipe distribuée sans multiplier les réunions de statut inutiles."
    },
    {
        "id": "executive-leadership-coach",
        "url": "https://godofprompt.ai/prompt-library/optimize-leadership-style-adaptation",
        "category": "Business",
        "icon": "🎙️",
        "title_fr": "Coach Exécutif en Leadership, Management & Communication",
        "description_fr": "Prépare vos communications managériales délicates, entretiens de recadrage, annonces de changement stratégique et délégations à fort enjeu en adaptant votre posture au niveau d'autonomie et de maturité de chaque collaborateur.",
        "guide_fr": "Décrivez la situation humaine ou organisationnelle à débloquer pour obtenir des scripts d'entretien basés sur la Candeur Radicale (Radical Candor)."
    },
    {
        "id": "skill-building-accelerator",
        "url": "https://godofprompt.ai/prompt-library/get-skill-building-roadmaps",
        "category": "Business",
        "icon": "🧠",
        "title_fr": "Architecte de Plan de Montée en Compétences Accélérée (Loi de Pareto)",
        "description_fr": "Déconstruit n'importe quelle compétence complexe en ses 20 % de sous-compétences fondamentales qui génèrent 80 % des résultats opérationnels. Livre un programme intensif sur 30 jours basé sur la pratique délibérée et des projets concrets.",
        "guide_fr": "Indiquez la compétence cible, votre niveau actuel et le nombre d'heures que vous pouvez y consacrer par semaine."
    },
    {
        "id": "business-expansion-strategy",
        "url": "https://godofprompt.ai/prompt-library/develop-business-strategy",
        "category": "Business",
        "icon": "🌐",
        "title_fr": "Stratège de Croissance & Positionnement Concurrentiel (Océan Bleu)",
        "description_fr": "Analyse les forces concurrentielles de votre secteur et redéfinit votre positionnement stratégique grâce au canevas Océan Bleu (Exclure, Atténuer, Renforcer, Créer) afin de sortir de la guerre des prix et devenir la référence évidente.",
        "guide_fr": "Renseignez votre offre actuelle et les 3 standards habituels de vos concurrents pour identifier votre angle de différenciation radical."
    },
    {
        "id": "subscription-retention-ai",
        "url": "https://godofprompt.ai/prompt-library/develop-ai-retention-strategies",
        "category": "Business",
        "icon": "🛡️",
        "title_fr": "Ingénieur de Fidélisation Client & Stratégie Anti-Attrition (LTV)",
        "description_fr": "Construit un système complet de rétention et d'augmentation de la Valeur Vie Client (LTV) : détection précoce des signaux de désengagement, boucles d'habitudes produit, programme de succès client proactif et parcours de sauvetage à la résiliation.",
        "guide_fr": "Indiquez votre taux de départ mensuel (churn) et les raisons principales invoquées par les clients sortants pour bâtir un plan correctif ciblé."
    },
    {
        "id": "weekly-performance-optimizer",
        "url": "https://godofprompt.ai/prompt-library/improve-weekly-performance",
        "category": "Business",
        "icon": "⏱️",
        "title_fr": "Système d'Optimisation de Productivité Hebdomadaire & Deep Work",
        "description_fr": "Restructure votre agenda hebdomadaire autour de blocs de travail profond (Deep Work), regroupe les tâches superficielles en lots (Batching), élimine les fuites d'attention et installe une revue hebdomadaire chirurgicale en 20 minutes.",
        "guide_fr": "Fournissez vos 3 priorités majeures de la semaine et vos contraintes horaires fixes pour générer votre emploi du temps haute performance."
    },

    # ==========================================
    # 3. Finance (Data, Finance & Analyse — 12)
    # ==========================================
    {
        "id": "financial-projections-modeler",
        "url": "https://godofprompt.ai/prompt-library/create-financial-projections",
        "category": "Finance",
        "icon": "📈",
        "title_fr": "Modélisateur de Projections Financières & Compte de Résultat (P&L)",
        "description_fr": "Construit des prévisionnels financiers structurés sur 12 à 36 mois (hypothèses de revenus, coût des ventes COGS, marge brute, OPEX, EBITDA et seuil de rentabilité) déclinés en 3 scénarios : prudent, réaliste et ambitieux.",
        "guide_fr": "Indiquez votre prix moyen, vos coûts fixes mensuels et votre coût d'acquisition estimé pour générer un modèle financier cohérent."
    },
    {
        "id": "cash-flow-forecaster",
        "url": "https://godofprompt.ai/prompt-library/forecast-cash-flow",
        "category": "Finance",
        "icon": "💧",
        "title_fr": "Prévisionniste de Trésorerie (Cash-Flow) & Pilotage du BFR",
        "description_fr": "Anticipe vos flux d'encaissements et de décaissements mois par mois en tenant compte des décalages de paiement clients/fournisseurs, de la saisonnalité, de la TVA et du Besoin en Fonds de Roulement (BFR) pour sécuriser votre piste de trésorerie (Runway).",
        "guide_fr": "Renseignez votre trésorerie actuelle et vos délais moyens d'encaissement pour identifier à l'avance tout creux de trésorerie."
    },
    {
        "id": "pricing-strategy-optimizer",
        "url": "https://godofprompt.ai/prompt-library/pricing-optimization-strategies",
        "category": "Finance",
        "icon": "💎",
        "title_fr": "Stratège de Tarification (Pricing Power) & Architecture d'Offres",
        "description_fr": "Repense votre grille tarifaire selon la valeur perçue (Value-Based Pricing) et l'économie comportementale : effet de leurre, ancrage psychologique, métrique de valeur évolutive, structuration Good-Better-Best et hausse de prix sans perte de conversion.",
        "guide_fr": "Décrivez vos tarifs actuels et le gain financier ou temporel que votre offre procure à vos clients pour débloquer votre marge."
    },
    {
        "id": "investment-profitability-analyzer",
        "url": "https://godofprompt.ai/prompt-library/analyze-investment-profitability-ratios",
        "category": "Finance",
        "icon": "🧮",
        "title_fr": "Analyseur de Rentabilité d'Investissement (ROI, TRI, VAN & Payback)",
        "description_fr": "Évalue la viabilité financière d'un projet, d'un recrutement, d'une campagne d'acquisition ou d'un équipement en calculant le retour sur investissement (ROI), la Valeur Actuelle Nette (VAN), le délai de récupération (Payback Period) et les risques.",
        "guide_fr": "Indiquez le montant de l'investissement initial et les flux de gains ou d'économies attendus sur les 24 prochains mois."
    },
    {
        "id": "cash-flow-scenario-simulator",
        "url": "https://godofprompt.ai/prompt-library/simulate-cash-flow-scenarios",
        "category": "Finance",
        "icon": "🛡️",
        "title_fr": "Simulateur de Scénarios de Trésorerie & Stress-Test Financier",
        "description_fr": "Soumet votre entreprise à des simulations de crise ou d'hyper-croissance (baisse de 30 % du chiffre d'affaires, retard d'un grand compte, doublement du coût publicitaire) et prépare les plans de contingence déclenchables par palier.",
        "guide_fr": "À utiliser chaque trimestre pour définir vos seuils d'alerte de trésorerie et protéger la pérennité de l'entreprise."
    },
    {
        "id": "data-analysis-report-generator",
        "url": "https://godofprompt.ai/prompt-library/generate-data-analysis-report",
        "category": "Finance",
        "icon": "📊",
        "title_fr": "Générateur de Rapports d'Analyse de Données & Insights Exécutifs",
        "description_fr": "Transforme des tableaux de chiffres bruts, exports CSV ou métriques mensuelles en un rapport d'analyse décisionnel clair : tendances majeures, anomalies statistiques, corrélations cachées et recommandations d'actions immédiates.",
        "guide_fr": "Collez vos données brutes ou résumés statistiques et précisez la question business à laquelle ce rapport doit répondre."
    },
    {
        "id": "financial-performance-auditor",
        "url": "https://godofprompt.ai/prompt-library/conduct-financial-performance-analysis",
        "category": "Finance",
        "icon": "🔍",
        "title_fr": "Auditeur de Performance Financière & Unit Economics (LTV/CAC)",
        "description_fr": "Passe au crible la santé économique de votre activité : marges contributives par produit, ratio LTV/CAC, délai de remboursement du CAC, efficacité du capital et identification des coûts fantômes qui érodent votre rentabilité nette.",
        "guide_fr": "Idéal pour préparer un bilan mensuel ou assainir ses marges avant d'accélérer les dépenses d'acquisition."
    },
    {
        "id": "data-analytics-platform-architect",
        "url": "https://godofprompt.ai/prompt-library/build-data-analytics-platforms",
        "category": "Finance",
        "icon": "🗄️",
        "title_fr": "Architecte de Plateforme Data Analytics & Pipelines BI",
        "description_fr": "Conçoit l'architecture moderne de votre stack de données (Modern Data Stack) : collecte d'événements, entrepôt de données (BigQuery, Snowflake, Postgres), modélisation dbt, gouvernance de la qualité des données et tableaux de bord BI.",
        "guide_fr": "Listez vos sources de données actuelles (Stripe, CRM, Analytics, Base de production) pour unifier vos indicateurs dans une source unique de vérité."
    },
    {
        "id": "proposal-budget-builder",
        "url": "https://godofprompt.ai/prompt-library/develop-proposal-budget",
        "category": "Finance",
        "icon": "📋",
        "title_fr": "Concepteur de Budgets Prévisionnels & Chiffrage de Projets Rentables",
        "description_fr": "Chiffre avec précision vos prestations complexes, projets clients ou développements internes : ventilation par lots de travail, calcul du taux journalier moyen (TJM) cible, provision pour aléas (marge de sécurité) et échéancier de facturation.",
        "guide_fr": "Protégez vos marges contre la dérive du périmètre (Scope Creep) en chiffrant explicitement les hypothèses et les limites de chaque lot."
    },
    {
        "id": "financial-tracking-system",
        "url": "https://godofprompt.ai/prompt-library/launch-financial-tracking-system",
        "category": "Finance",
        "icon": "🧭",
        "title_fr": "Architecte de Système de Suivi Financier & Contrôle de Gestion",
        "description_fr": "Met en place une routine de contrôle de gestion agile pour dirigeants et indépendants : plan de catégorisation analytique des dépenses, rapprochement mensuel, suivi budget vs réel (Variance Analysis) et répartition des réserves (Profit First).",
        "guide_fr": "Permet de passer d'une comptabilité subie une fois par an à un pilotage financier proactif en 30 minutes par mois."
    },
    {
        "id": "cash-flow-improvement-plan",
        "url": "https://godofprompt.ai/prompt-library/improve-cash-flow",
        "category": "Finance",
        "icon": "⚡",
        "title_fr": "Plan d'Action d'Accélération du Cash-Flow & Recouvrement",
        "description_fr": "Identifie les leviers immédiats pour libérer de la trésorerie dormante : incitations au paiement comptant ou annuel, restructuration des acomptes à la commande, relance diplomatique des factures échues et renégociation fournisseurs.",
        "guide_fr": "Renseignez vos conditions de facturation actuelles pour obtenir 5 tactiques concrètes applicables dès cette semaine pour encaisser plus tôt."
    },
    {
        "id": "google-analytics-tracking-setup",
        "url": "https://godofprompt.ai/prompt-library/set-up-google-analytics",
        "category": "Finance",
        "icon": "🎯",
        "title_fr": "Architecte de Plan de Marquage Analytique (GA4 / GTM) & Attribution",
        "description_fr": "Définit votre plan de marquage analytique complet : nomenclature des événements personnalisés, suivi des conversions macro/micro, paramètres UTM standardisés, suivi e-commerce/entonnoir et attribution multi-touch.",
        "guide_fr": "Décrivez les étapes clés de votre parcours utilisateur sur votre site ou application pour ne mesurer que les événements qui éclairent vos décisions."
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
        "SEO": f"Principal SEO Technical Lead, Semantic Search Specialist, and Content Strategist specializing in {title_en}",
        "Automation": f"Principal AI Systems Architect, Autonomous Agent Engineer, and Workflow Automation Lead specializing in {title_en}",
        "Business": f"Managing Partner Strategy Consultant, Chief Operating Officer, and Executive Advisor specializing in {title_en}",
        "Finance": f"Chief Financial Officer (CFO), Principal Data Scientist, and Unit Economics Strategist specializing in {title_en}"
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
- Key technical, psychological, or operational levers implemented.

### 2. Concrete Implementation & Execution Blueprint
- Step-by-step deliverable formatted for immediate operational deployment.
- High-precision templates, workflows, financial models, or strategic frameworks.

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
