import requests
import json
import time
import sys
import os

sys.stdout.reconfigure(encoding="utf-8")

NOTION_TOKEN = "ntn_b98836118154XOYPfEGE87M6X54OaCvW44fCKPk6kvtfjq"
DATABASE_ID = "3ea24d1b-f2a7-8148-b48a-d24b6f57cad5"

NOTION_HEADERS = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

# Lot Phase 5 : 36 nouveaux prompts (12 par catégorie : Ecommerce, Operations, Media -> 144 prompts au total)
TARGET_PROMPTS = [
    # ==========================================
    # 1. Ecommerce (E-Commerce & Retail — 12)
    # ==========================================
    {
        "id": "shopify-high-converting-product-page",
        "category": "Ecommerce",
        "icon": "🛍️",
        "title_fr": "Architecte de Fiches Produits E-Commerce Haute Conversion",
        "title_en": "High-Converting E-Commerce Product Page Copy & CRO Architect",
        "variables": ["Product Name", "Target Customer", "Core Benefits", "Price Point"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Conçoit l'architecture persuasive complète d'une fiche produit (Shopify, WooCommerce, Amazon) : accroche au-dessus de la ligne de flottaison, puces orientées bénéfices émotionnels, traitement des objections d'achat, preuve sociale et micro-copie rassurante autour du bouton d'ajout au panier.",
        "guide_fr": "Indiquez les caractéristiques techniques de votre produit et les doutes fréquents de vos clients pour générer une fiche structurée pour le CRO mobile et desktop.",
        "raw_prompt": "Act as a senior e-commerce CRO specialist and direct-response copywriter. Write a high-converting product page for {{product-name}} targeting {{target-customer}} with core benefits {{core-benefits}} at {{price-point}}. Include hero hook, benefit bullets, sensory description, objection FAQ, and guarantee microcopy."
    },
    {
        "id": "ecommerce-aov-bundle-architect",
        "category": "Ecommerce",
        "icon": "📦",
        "title_fr": "Stratège d'Offres Groupées (Bundles) & Maximisation du Panier Moyen (AOV)",
        "title_en": "E-Commerce AOV Bundle, Upsell & Cross-Sell Strategy Architect",
        "variables": ["Hero Product", "Current AOV", "Catalog Margin", "Customer Persona"],
        "models": ["ChatGPT", "Claude", "Gemini", "DeepSeek"],
        "description_fr": "Ingénierie d'offres groupées (Bundles), d'upsells pré-achat et post-achat (One-Click Upsell) et de paliers de livraison gratuite pour augmenter immédiatement le panier moyen (AOV) de 25 à 40 % sans dégrader la marge brute.",
        "guide_fr": "Renseignez votre produit phare, votre panier moyen actuel et votre marge brute moyenne pour obtenir 3 architectures de bundles chiffrées.",
        "raw_prompt": "Design a profitable AOV optimization strategy around {{hero-product}} with current AOV {{current-aov}}, margin profile {{catalog-margin}}, for {{customer-persona}}. Include tiered bundles, cart drawer progress bar thresholds, and post-purchase one-click upsells."
    },
    {
        "id": "abandoned-cart-recovery-sequence",
        "category": "Ecommerce",
        "icon": "🛒",
        "title_fr": "Séquence Multi-Canal de Récupération de Paniers Abandonnés",
        "title_en": "Abandoned Cart & Checkout Recovery Email/SMS Sequence Builder",
        "variables": ["Store Niche", "Average Cart Value", "Main Objection", "Discount Policy"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Rédige une séquence chirurgicale en 4 temps (Email + SMS Klaviyo) déclenchée après un abandon de panier ou de paiement : rappel serviable à H+1, réassurance et preuve sociale à H+24, levée d'objection à H+48 et offre de clôture à H+72.",
        "guide_fr": "Précisez si vous souhaitez récupérer les paniers sans code promo (préservation de marque) ou avec une incitation progressive sur les derniers messages.",
        "raw_prompt": "Create a 4-part abandoned cart recovery sequence (Email and SMS) for a {{store-niche}} brand with {{average-cart-value}} cart value, addressing {{main-objection}} under {{discount-policy}}."
    },
    {
        "id": "customer-reviews-mining-matrix",
        "category": "Ecommerce",
        "icon": "⭐",
        "title_fr": "Analyseur d'Avis Clients & Matrice d'Amélioration Produit (VoC)",
        "title_en": "Customer Review Voice-of-Customer Mining & Product Iteration Matrix",
        "variables": ["Product Category", "Raw Reviews Sample", "Competitor Brand", "Target Market"],
        "models": ["ChatGPT", "Claude", "Gemini", "DeepSeek"],
        "description_fr": "Extrait la Voix du Client (Voice of Customer) à partir d'avis 1 à 5 étoiles (les vôtres ou ceux d'un concurrent Amazon/Trustpilot) : identifie les motifs d'insatisfaction récurrents, les formulations exactes d'enthousiasme à réinjecter dans vos publicités et les améliorations produit prioritaires.",
        "guide_fr": "Collez un échantillon de 15 à 50 avis clients bruts pour obtenir une cartographie sémantique exploitable en R&D et en publicité Meta/TikTok.",
        "raw_prompt": "Analyze {{raw-reviews-sample}} in {{product-category}} compared to {{competitor-brand}} for {{target-market}}. Extract top friction points, verbatim emotional hooks for ad copy, and prioritized product improvements."
    },
    {
        "id": "seasonal-collection-launch-playbook",
        "category": "Ecommerce",
        "icon": "🚀",
        "title_fr": "Plan de Lancement de Collection & Drop Édition Limitée",
        "title_en": "Seasonal Product Drop & Limited-Edition E-Commerce Launch Architect",
        "variables": ["Collection Theme", "Launch Date", "VIP List Size", "Stock Quantity"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Orchestre un lancement de produit ou de collection façon 'Drop' à forte désirabilité : phase de teasing liste d'attente VIP, accès anticipé sur mot de passe, ouverture publique, mécanique de rareté éthique et relance des stocks restants.",
        "guide_fr": "Idéal pour les marques D2C (mode, cosmétique, accessoires, alimentation) souhaitant concentrer un pic de chiffre d'affaires sur 48 à 72 heures.",
        "raw_prompt": "Build a complete D2C product drop campaign for {{collection-theme}} launching on {{launch-date}} with {{vip-list-size}} VIP subscribers and {{stock-quantity}} units available."
    },
    {
        "id": "marketplace-amazon-listing-seo",
        "category": "Ecommerce",
        "icon": "🔎",
        "title_fr": "Optimiseur de Fiches Marketplace Amazon (Algorithme A9/COSMO)",
        "title_en": "Amazon Marketplace A9 & COSMO Search Listing Optimization Engine",
        "variables": ["Product Type", "Primary Keywords", "Unique Differentiator", "Target Buyer"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Optimise intégralement votre listing marketplace (Amazon, Cdiscount, Fnac) : titre haute densité sémantique conforme aux règles de style, 5 bullet points orientés usage (algorithme d'intention COSMO), contenu A+ visuel et mots-clés backend cachés.",
        "guide_fr": "Fournissez vos mots-clés principaux issus d'Helium10 ou JungleScout ainsi que votre avantage concurrentiel majeur.",
        "raw_prompt": "Optimize an Amazon product listing for {{product-type}} using {{primary-keywords}}, highlighting {{unique-differentiator}} for {{target-buyer}}. Include title, 5 bullets, A+ module storyboard, and backend search terms."
    },
    {
        "id": "post-purchase-retention-loyalty",
        "category": "Ecommerce",
        "icon": "💎",
        "title_fr": "Architecte d'Expérience Post-Achat, Réachat & Fidélisation LTV",
        "title_en": "D2C Post-Purchase Experience, Replenishment & LTV Retention System",
        "variables": ["Brand Name", "Consumption Cycle", "Repeat Purchase Goal", "VIP Perks"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Transforme les acheteurs ponctuels en clients récurrents à forte Lifetime Value (LTV) : emails d'éducation produit pendant la livraison, rituel d'unboxing, séquence de réassort prédictif (Replenishment) et programme d'ambassadeurs VIP.",
        "guide_fr": "Indiquez la durée moyenne d'utilisation de votre produit (ex: 30 jours pour un complément, 6 mois pour du textile) pour caler les relances au jour près.",
        "raw_prompt": "Design a post-purchase retention and LTV system for {{brand-name}} with a {{consumption-cycle}} product cycle, aiming for {{repeat-purchase-goal}} using {{vip-perks}}."
    },
    {
        "id": "ecommerce-returns-prevention-system",
        "category": "Ecommerce",
        "icon": "🛡️",
        "title_fr": "Système de Réduction des Retours & Conversion en Échanges",
        "title_en": "E-Commerce Return Rate Reduction & Exchange Conversion Strategist",
        "variables": ["Product Category", "Current Return Rate", "Top Return Reason", "Exchange Incentive"],
        "models": ["ChatGPT", "Claude", "Gemini", "DeepSeek"],
        "description_fr": "Analyse les causes de retours (taille, attentes visuelles, prise en main) et déploie un plan préventif sur les fiches produits ainsi qu'un flux de portail de retour incitant le client à choisir un échange ou un avoir bonifié plutôt qu'un remboursement.",
        "guide_fr": "Indiquez votre taux de retour actuel et le motif n°1 invoqué par vos clients pour protéger votre trésorerie nette.",
        "raw_prompt": "Create a comprehensive return reduction and exchange conversion strategy for {{product-category}} experiencing {{current-return-rate}} due to {{top-return-reason}}, leveraging {{exchange-incentive}}."
    },
    {
        "id": "bfcm-promotional-war-room",
        "category": "Ecommerce",
        "icon": "🔥",
        "title_fr": "Plan de Guerre Promotionnel Black Friday / Cyber Monday (BFCM)",
        "title_en": "Black Friday Cyber Monday (BFCM) Omnichannel Revenue War-Room Planner",
        "variables": ["Revenue Target", "Offer Architecture", "Ad Budget", "Inventory Constraints"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Construit le calendrier d'exécution heure par heure pour le Black Friday et les temps forts commerciaux : segmentation de la base email/SMS, structure d'offre sans cannibalisation de marge, paliers cadeaux et plan de contingence logistique.",
        "guide_fr": "Utilisez ce module 4 à 6 semaines avant un pic commercial majeur (BFCM, Soldes, Noël, Fête des Mères) pour aligner acquisition et CRM.",
        "raw_prompt": "Develop a complete BFCM promotional war-room plan to hit {{revenue-target}} with {{offer-architecture}}, {{ad-budget}} spend, and {{inventory-constraints}}."
    },
    {
        "id": "subscription-box-churn-buster",
        "category": "Ecommerce",
        "icon": "🔄",
        "title_fr": "Architecte d'Offre par Abonnement (Subscribe & Save) & Anti-Churn",
        "title_en": "E-Commerce Subscription Model & Cancel-Flow Churn Prevention Architect",
        "variables": ["Subscription Product", "Monthly Price", "Average Retention Months", "Cancel Reason"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Conçoit une offre d'abonnement récurrent irrésistible (Recharge, Skio, Bold) et un parcours d'annulation intelligent (Cancel Flow) proposant la mise en pause, le décalage d'expédition ou le changement de parfum/format avant la résiliation.",
        "guide_fr": "Précisez la raison principale pour laquelle vos abonnés résilient (trop de stock, budget, lassitude) pour générer les contre-propositions adaptées.",
        "raw_prompt": "Design a subscription growth and cancel-flow retention architecture for {{subscription-product}} at {{monthly-price}} with {{average-retention-months}} retention and primary churn reason {{cancel-reason}}."
    },
    {
        "id": "d2c-quiz-funnel-architect",
        "category": "Ecommerce",
        "icon": "🧭",
        "title_fr": "Concepteur de Quiz Diagnostic Produit & Collecte Zero-Party Data",
        "title_en": "D2C Product Recommendation Quiz Funnel & Zero-Party Data Architect",
        "variables": ["Product Line", "Customer Problem", "Quiz Length", "Lead Magnet Offer"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Crée l'arbre logique complet d'un quiz de recommandation personnalisée (Octane AI, Typeform) : questions engageantes qualifiant le besoin et le budget, collecte d'email/SMS à haute conversion et page de résultats recommandant la routine idéale.",
        "guide_fr": "Parfait pour les catalogues techniques ou multi-références (soins de la peau, nutrition, équipement sportif, café) où le client hésite avant d'acheter.",
        "raw_prompt": "Build an interactive D2C product recommendation quiz funnel for {{product-line}} solving {{customer-problem}} in {{quiz-length}} questions with {{lead-magnet-offer}}."
    },
    {
        "id": "supplier-negotiation-sourcing-pro",
        "category": "Ecommerce",
        "icon": "🏭",
        "title_fr": "Négociateur Achats, Sourcing Fournisseurs & Optimisation MOQ",
        "title_en": "Supply Chain Sourcing, Manufacturer Negotiation & MOQ Optimizer",
        "variables": ["Product Spec", "Target Unit Cost", "Supplier Quote", "Order Volume"],
        "models": ["ChatGPT", "Claude", "Gemini", "DeepSeek"],
        "description_fr": "Rédige vos scripts de négociation achats et appels d'offres industriels (Alibaba, usines européennes ou asiatiques) pour abaisser les quantités minimales de commande (MOQ), sécuriser les délais de paiement (30/70), imposer des pénalités de retard et verrouiller le contrôle qualité.",
        "guide_fr": "Indiquez le prix unitaire proposé par l'usine et votre prix cible pour obtenir une séquence de négociation ferme et respectueuse.",
        "raw_prompt": "Draft a manufacturer sourcing and negotiation strategy for {{product-spec}} targeting {{target-unit-cost}} against {{supplier-quote}} at {{order-volume}} units."
    },

    # ==========================================
    # 2. Operations (Juridique, RH & Opérations — 12)
    # ==========================================
    {
        "id": "sop-standard-operating-procedure",
        "category": "Operations",
        "icon": "📋",
        "title_fr": "Rédacteur de Procédures Opérationnelles Standardisées (SOP)",
        "title_en": "Enterprise Standard Operating Procedure (SOP) & Process Documentation Architect",
        "variables": ["Process Name", "Role Responsible", "Tools Used", "Quality Criteria"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Transforme n'importe quelle tâche complexe en une Procédure Opérationnelle Standardisée (SOP) claire et immédiatement délégable sur Notion : objectif, prérequis, instructions pas-à-pas, captures/vérifications attendues, gestion des exceptions et critères de validation (Definition of Done).",
        "guide_fr": "Décrivez en vrac comment vous réalisez actuellement la tâche pour obtenir un document de référence prêt à former un nouveau collaborateur.",
        "raw_prompt": "Create a rigorous, step-by-step Standard Operating Procedure (SOP) for {{process-name}} executed by {{role-responsible}} using {{tools-used}} with quality standard {{quality-criteria}}."
    },
    {
        "id": "a-player-job-scorecard-builder",
        "category": "Operations",
        "icon": "🎯",
        "title_fr": "Architecte de Fiche de Poste & Scorecard de Recrutement (Méthode Who)",
        "title_en": "A-Player Job Description & Competency Scorecard Architect",
        "variables": ["Job Title", "Department", "90-Day Outcomes", "Company Culture"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Remplace les offres d'emploi génériques par une Scorecard de recrutement haute performance (inspirée de la méthode 'Who') : mission du poste, 5 résultats mesurables attendus à 90 jours et 12 mois, compétences comportementales critiques et annonce attractive.",
        "guide_fr": "Précisez les résultats concrets que la personne recrutée devra avoir livrés au bout de 3 mois pour être considérée comme un recrutement réussi.",
        "raw_prompt": "Design a complete A-Player Hiring Scorecard and compelling Job Description for {{job-title}} in {{department}} focused on {{90-day-outcomes}} within {{company-culture}}."
    },
    {
        "id": "structured-interview-anti-bias",
        "category": "Operations",
        "icon": "🤝",
        "title_fr": "Grille d'Entretien Structuré Anti-Biais & Cas Pratique d'Évaluation",
        "title_en": "Structured Behavioral Interview Guide & Practical Case Assessment Builder",
        "variables": ["Role Title", "Core Competencies", "Seniority Level", "Red Flags"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Construit un guide d'entretien comportemental structuré (méthode STAR/Topgrading) accompagné d'un barème de notation objectif de 1 à 5 pour chaque réponse, d'un test technique/cas pratique réaliste de 45 minutes et de questions de prise de références.",
        "guide_fr": "Éliminez les recrutements à l'intuition en posant exactement les mêmes questions factuelles à chaque candidat finaliste.",
        "raw_prompt": "Build a structured behavioral interview guide and practical work-sample test for a {{seniority-level}} {{role-title}}, evaluating {{core-competencies}} and screening for {{red-flags}}."
    },
    {
        "id": "employee-onboarding-30-60-90",
        "category": "Operations",
        "icon": "🚀",
        "title_fr": "Plan d'Onboarding Collaborateur 30-60-90 Jours Haute Vélocité",
        "title_en": "High-Velocity 30-60-90 Day Employee Onboarding & Ramp-Up Blueprint",
        "variables": ["New Hire Role", "Team Structure", "First Quick Win", "Tech Stack"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Structure l'intégration complète d'une nouvelle recrue jour par jour sur sa première semaine, puis à 30, 60 et 90 jours : accès outils, rencontres clés, premier livrable rapide (Quick Win dès la semaine 2), jalons d'autonomie et bilans de période d'essai.",
        "guide_fr": "Indiquez le premier petit projet concret que la recrue peut livrer dès ses 10 premiers jours pour créer une dynamique de confiance immédiate.",
        "raw_prompt": "Create a structured 30-60-90 day onboarding plan for {{new-hire-role}} joining {{team-structure}}, delivering {{first-quick-win}} on {{tech-stack}}."
    },
    {
        "id": "b2b-contract-clause-risk-auditor",
        "category": "Operations",
        "icon": "⚖️",
        "title_fr": "Auditeur de Clauses Contractuelles B2B & Matrice des Risques",
        "title_en": "B2B Commercial Contract Risk Auditor & Redline Negotiation Clauses",
        "variables": ["Contract Type", "Our Position", "Clause Text", "Jurisdiction"],
        "models": ["ChatGPT", "Claude", "Gemini", "DeepSeek"],
        "description_fr": "Analyse un contrat commercial (MSA, CGV, prestation de service, SaaS, NDA) pour détecter les clauses déséquilibrées : plafond de responsabilité, cession de propriété intellectuelle, tacite reconduction, pénalités et propose des formulations de compromis (Redlines) protectrices.",
        "guide_fr": "Précisez si vous êtes le Prestataire/Vendeur ou le Client/Acheteur et collez les clauses sensibles à auditer avant validation par votre conseil.",
        "raw_prompt": "Audit the following {{contract-type}} clause from the perspective of {{our-position}} under {{jurisdiction}}: {{clause-text}}. Identify legal/commercial risks and provide balanced redline counter-proposals."
    },
    {
        "id": "gdpr-privacy-compliance-architect",
        "category": "Operations",
        "icon": "🔒",
        "title_fr": "Architecte de Conformité RGPD, Registre de Traitement & Politique Données",
        "title_en": "GDPR Data Privacy Compliance, ROPA & DPA Documentation Architect",
        "variables": ["Product or Service", "Personal Data Collected", "Subprocessors", "Retention Period"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Structure votre documentation de conformité RGPD : registre des activités de traitement (ROPA), politique de confidentialité transparente en langage clair, annexe de sous-traitance des données (DPA) et procédure de réponse aux demandes d'accès ou de suppression (DSAR).",
        "guide_fr": "Listez les données collectées (ex: email, IP, facturation) et vos outils tiers (Stripe, AWS, HubSpot, OpenAI) pour générer un cadre conforme.",
        "raw_prompt": "Generate a GDPR compliance documentation framework (Privacy Policy, ROPA summary, and Subprocessor disclosure) for {{product-or-service}} collecting {{personal-data-collected}} using {{subprocessors}} with {{retention-period}}."
    },
    {
        "id": "performance-review-feedback-system",
        "category": "Operations",
        "icon": "📈",
        "title_fr": "Système d'Évaluation Annuelle, Feedback 360° & Plan de Progression",
        "title_en": "Employee Performance Review, 360 Feedback & Career Growth Matrix",
        "variables": ["Employee Role", "Key Achievements", "Growth Areas", "Next Level Target"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Prépare des entretiens d'évaluation annuels ou semestriels constructifs, exigeants et motivants : synthèse factuelle des réalisations, formulation SBI (Situation-Comportement-Impact) pour les axes d'amélioration et feuille de route claire vers le niveau supérieur.",
        "guide_fr": "Renseignez les faits marquants du semestre et les points de blocage observés pour obtenir une trame d'entretien équilibrée et actionnable.",
        "raw_prompt": "Draft a structured performance review and career growth plan for {{employee-role}} highlighting {{key-achievements}}, addressing {{growth-areas}}, and preparing for {{next-level-target}}."
    },
    {
        "id": "crisis-internal-comms-playbook",
        "category": "Operations",
        "icon": "📣",
        "title_fr": "Directeur de Communication Interne & Gestion du Changement",
        "title_en": "Executive Internal Communications & Organizational Change Management Lead",
        "variables": ["Change Announcement", "Impacted Teams", "Main Employee Concern", "Timeline"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Rédige les communications internes sensibles de la direction (réorganisation, pivot stratégique, nouvelle politique télétravail, incident opérationnel) accompagnées d'une FAQ anticipant les questions difficiles des équipes pour maintenir la cohésion et la clarté.",
        "guide_fr": "Indiquez la décision à annoncer et la crainte principale des collaborateurs pour adopter un ton transparent, empathique et résolument tourné vers l'action.",
        "raw_prompt": "Write an executive internal communication announcement and manager FAQ for {{change-announcement}} affecting {{impacted-teams}}, addressing {{main-employee-concern}} over {{timeline}}."
    },
    {
        "id": "vendor-rfp-procurement-evaluator",
        "category": "Operations",
        "icon": "📑",
        "title_fr": "Cahier des Charges Appel d'Offres (RFP) & Grille de Sélection Prestataires",
        "title_en": "Enterprise RFP Generator & Weighted Vendor Evaluation Matrix",
        "variables": ["Project Scope", "Budget Envelope", "Mandatory Requirements", "Timeline"],
        "models": ["ChatGPT", "Claude", "Gemini", "DeepSeek"],
        "description_fr": "Formalise un appel d'offres (Request for Proposal) rigoureux pour sélectionner une agence, un éditeur logiciel ou un prestataire externe, accompagné d'une matrice de notation pondérée (technique, sécurité, coût total de possession, SLA) pour départager les offres.",
        "guide_fr": "Idéal pour comparer objectivement 3 à 5 prestataires sans se laisser influencer uniquement par la présentation commerciale.",
        "raw_prompt": "Create a comprehensive Request for Proposal (RFP) and weighted vendor scoring matrix for {{project-scope}} within {{budget-envelope}}, requiring {{mandatory-requirements}} by {{timeline}}."
    },
    {
        "id": "remote-async-culture-handbook",
        "category": "Operations",
        "icon": "🌐",
        "title_fr": "Architecte de Manuel d'Équipe Hybride / Remote & Rituels Asynchrones",
        "title_en": "Async-First Remote Team Handbook & Meeting Hygiene Architect",
        "variables": ["Team Size", "Timezones", "Communication Tools", "Core Working Hours"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Conçoit la charte de fonctionnement d'une équipe distribuée ou hybride (façon GitLab / Linear) : règles d'hygiène des réunions, SLA de réponse par canal (Slack vs Notion vs Email), check-ins écrits quotidiens et protection des plages de Deep Work.",
        "guide_fr": "Précisez vos outils actuels pour définir quel type d'information doit vivre dans quel canal et supprimer 40 % des réunions inutiles.",
        "raw_prompt": "Design an Async-First Team Operating Handbook for a {{team-size}} team across {{timezones}} using {{communication-tools}} with {{core-working-hours}}."
    },
    {
        "id": "customer-sla-incident-response",
        "category": "Operations",
        "icon": "🚨",
        "title_fr": "Protocole de Gestion d'Incidents Critiques (SEV-1) & SLA Client",
        "title_en": "SEV-1 Incident Response Playbook, SLA Policy & Post-Mortem Template",
        "variables": ["Service Type", "Severity Levels", "Target Response Time", "Escalation Path"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Établit la politique de niveaux de service (SLA) et le protocole d'intervention en cas d'incident critique (SEV-1 à SEV-3) : rôles en cellule de crise, modèles de mises à jour page de statut client et trame de rapport Post-Mortem sans blâme (Blameless Post-Mortem).",
        "guide_fr": "Indispensable pour les équipes SaaS, agences techniques et opérations e-commerce souhaitant professionnaliser leur fiabilité.",
        "raw_prompt": "Create an Incident Response Playbook, SLA matrix, and Blameless Post-Mortem template for {{service-type}} across {{severity-levels}} with {{target-response-time}} and {{escalation-path}}."
    },
    {
        "id": "freelance-contractor-scope-of-work",
        "category": "Operations",
        "icon": "✍️",
        "title_fr": "Générateur de Cahier de Mission Freelance (SOW) & Jalons de Livrables",
        "title_en": "Statement of Work (SOW), Milestone Acceptance & Scope-Creep Guardrails",
        "variables": ["Project Deliverable", "Milestone Schedule", "Out of Scope Items", "Payment Terms"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Rédige un Statement of Work (SOW) ultra-précis pour encadrer une mission freelance ou agence : périmètre exact des livrables, nombre d'allers-retours de révision inclus, exclusions explicites (anti Scope-Creep), critères d'acceptation et échéancier de facturation.",
        "guide_fr": "Utilisez ce prompt avant le démarrage de toute prestation externe (ou avec vos propres clients) pour éviter tout malentendu sur le périmètre.",
        "raw_prompt": "Draft a rock-solid Statement of Work (SOW) for {{project-deliverable}} structured around {{milestone-schedule}}, explicitly excluding {{out-of-scope-items}}, under {{payment-terms}}."
    },

    # ==========================================
    # 3. Media (Vidéo, YouTube & Créateurs — 12)
    # ==========================================
    {
        "id": "youtube-high-retention-scriptwriter",
        "category": "Media",
        "icon": "🎬",
        "title_fr": "Scénariste de Vidéos YouTube Long Format à Haute Rétention",
        "title_en": "High-Retention YouTube Long-Form Video Script & Pacing Architect",
        "variables": ["Video Topic", "Target Audience", "Video Duration", "Core Takeaway"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Écrit des scripts YouTube complets optimisés pour l'algorithme de rétention (Average View Duration) : validation immédiate du titre/miniature dans les 15 premières secondes, boucles de curiosité ouvertes (Open Loops), ruptures de rythme visuelles (B-Roll/Pattern Interrupts) toutes les 45 secondes et climax final.",
        "guide_fr": "Indiquez la promesse exacte de votre vidéo et la durée visée pour obtenir un script chronométré avec indications de montage.",
        "raw_prompt": "Write a high-retention YouTube video script on {{video-topic}} for {{target-audience}} lasting {{video-duration}} delivering {{core-takeaway}}. Include hook validation, open loops, pattern interrupts, and B-roll cues."
    },
    {
        "id": "short-form-viral-hook-engineer",
        "category": "Media",
        "icon": "⚡",
        "title_fr": "Ingénieur de Hooks Vidéo Viraux (TikTok, Reels, YouTube Shorts)",
        "title_en": "Short-Form Video 3-Second Visual & Verbal Hook Engineering Matrix",
        "variables": ["Core Subject", "Target Niche", "Controversial Angle", "Call to Action"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Génère 15 variations d'accroches (Hooks) pour les 3 premières secondes de vos vidéos verticales (TikTok, Reels, Shorts), combinant le texte parlé, le texte affiché à l'écran et l'action visuelle d'ouverture pour stopper le scroll (Scroll-Stop Rate > 75 %).",
        "guide_fr": "Testez 3 hooks différents sur le même corps de vidéo de 45 secondes pour démultiplier vos chances de portée organique.",
        "raw_prompt": "Generate 15 high-converting 3-second short-form video hooks (spoken line + on-screen text + visual action) for {{core-subject}} in {{target-niche}} leveraging {{controversial-angle}} leading to {{call-to-action}}."
    },
    {
        "id": "youtube-thumbnail-title-ctr-lab",
        "category": "Media",
        "icon": "🖼️",
        "title_fr": "Laboratoire de Miniatures YouTube & Titres à Fort CTR (> 10 %)",
        "title_en": "YouTube Packaging Lab: High-CTR Thumbnail Concepts & Title A/B Pairs",
        "variables": ["Video Idea", "Viewer Curiosity Gap", "Channel Style", "Competitor Reference"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Conçoit le 'Packaging' de votre vidéo avant même de la tourner : 10 duos complémentaires Titre + Concept de Miniature (3 éléments visuels maximum, contraste émotionnel, texte de miniature en 3 mots qui complète le titre sans le répéter) pour maximiser le taux de clic (CTR).",
        "guide_fr": "En création vidéo moderne, concevez toujours le duo Titre + Miniature avec ce prompt avant d'écrire la première ligne du script.",
        "raw_prompt": "Design 10 high-CTR YouTube Title + Thumbnail packaging pairs for {{video-idea}} exploiting {{viewer-curiosity-gap}} in {{channel-style}} inspired by {{competitor-reference}}."
    },
    {
        "id": "podcast-episode-interview-architect",
        "category": "Media",
        "icon": "🎙️",
        "title_fr": "Producteur d'Épisodes de Podcast & Architecte d'Interviews Profondes",
        "title_en": "Podcast Showrunner, Deep-Dive Guest Research & Interview Arc Builder",
        "variables": ["Guest Name or Profile", "Episode Theme", "Listener Persona", "Show Duration"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Prépare des interviews de podcast mémorables (façon Tim Ferriss / Lex Fridman / Diary of a CEO) : intro bande-annonce percutante, questions brise-glace originales que personne ne pose jamais à l'invité, relances d'approfondissement pour obtenir des anecdotes concrètes et chapitrage horodaté.",
        "guide_fr": "Renseignez la biographie ou les accomplissements de votre invité pour éviter les questions banales et extraire des pépites exclusives.",
        "raw_prompt": "Prepare a world-class podcast episode production brief and non-obvious interview question arc for {{guest-name-or-profile}} on {{episode-theme}} for {{listener-persona}} over {{show-duration}}."
    },
    {
        "id": "omnipresence-video-repurposing-engine",
        "category": "Media",
        "icon": "♻️",
        "title_fr": "Moteur de Repurposing : 1 Vidéo Longue vers 12 Contenus Multi-Réseaux",
        "title_en": "Content Waterfall Engine: 1 Long-Form Video/Podcast to 12 Omnichannel Assets",
        "variables": ["Transcript or Summary", "Core Thesis", "Brand Tone", "Primary CTA"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Découpe et adapte la transcription d'une vidéo YouTube, d'un podcast ou d'un webinaire en un écosystème complet de 12 actifs : 4 scripts de Shorts/Reels autonomes, 3 posts LinkedIn, 2 threads X/Twitter, 1 édition de newsletter et 2 scripts de carrousels Instagram.",
        "guide_fr": "Collez le résumé détaillé ou les meilleurs passages de votre transcription vidéo pour alimenter toute votre semaine de publication en 5 minutes.",
        "raw_prompt": "Transform {{transcript-or-summary}} centered on {{core-thesis}} in {{brand-tone}} with {{primary-cta}} into 12 native omnichannel content assets (Shorts clips, LinkedIn posts, X thread, newsletter)."
    },
    {
        "id": "documentary-storytelling-script",
        "category": "Media",
        "icon": "📽️",
        "title_fr": "Architecte de Storytelling Documentaire & Études de Cas Vidéo",
        "title_en": "Cinematic Documentary & Business Case-Study Video Narrative Architect",
        "variables": ["Subject or Company", "Central Conflict", "Turning Point", "Moral or Lesson"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Structure des vidéos narratives captivantes (études de cas business, mini-documentaires, histoires de marques) selon l'arc dramatique en 5 actes : exposition à fort enjeu, montée de la tension, point de rupture, résolution contre-intuitive et leçon stratégique.",
        "guide_fr": "Idéal pour les chaînes d'analyse business, histoire, tech ou pour raconter l'étude de cas d'un client de manière cinématographique.",
        "raw_prompt": "Outline and script a gripping documentary-style video essay on {{subject-or-company}} exploring {{central-conflict}}, the {{turning-point}}, and {{moral-or-lesson}}."
    },
    {
        "id": "creator-sponsorship-pitch-deck",
        "category": "Media",
        "icon": "🤝",
        "title_fr": "Négociateur de Sponsoring Créateur, Media Kit & Intégrations Natives",
        "title_en": "Creator Sponsorship Pitch, Media Kit & High-Converting Ad-Read Architect",
        "variables": ["Channel Niche", "Audience Metrics", "Target Sponsor Brand", "Package Rate"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Rédige vos emails d'approche sponsors B2B/B2C, structure vos offres groupées multi-épisodes (au lieu de placements isolés) et écrit le script de l'intégration publicitaire native (Ad-Read de 60s) qui s'insère sans casser la rétention de la vidéo.",
        "guide_fr": "Indiquez la marque que vous ciblez et la taille/qualité de votre audience pour proposer un partenariat orienté ROI annonceur.",
        "raw_prompt": "Create a creator sponsorship pitch, multi-episode bundle pricing, and native 60-second ad-read script for a {{channel-niche}} creator with {{audience-metrics}} pitching {{target-sponsor-brand}} at {{package-rate}}."
    },
    {
        "id": "webinar-masterclass-showrunner",
        "category": "Media",
        "icon": "🖥️",
        "title_fr": "Architecte de Webinaire Live & Masterclass à Haute Conversion",
        "title_en": "High-Converting Live Webinar & Masterclass Run-of-Show Architect",
        "variables": ["Masterclass Topic", "Target Attendee", "Core Framework", "Paid Offer Pitch"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Conçoit le conducteur minute par minute (Run of Show) d'un webinaire ou d'une masterclass de 60 minutes : promesse d'ouverture, interactions dans le chat toutes les 7 minutes, enseignement de 3 déclics majeurs, transition fluide vers votre offre et session Q&A orientée clôture.",
        "guide_fr": "Évitez l'effet 'cours magistral gratuit qui ne vend rien' en structurant l'enseignement pour faire naître le désir d'accompagnement.",
        "raw_prompt": "Design a 60-minute live webinar run-of-show and slide-by-slide script on {{masterclass-topic}} for {{target-attendee}}, teaching {{core-framework}} and transitioning to {{paid-offer-pitch}}."
    },
    {
        "id": "tiktok-reels-60s-edutainment",
        "category": "Media",
        "icon": "📱",
        "title_fr": "Scénariste de Capsules Edutainment 60 Secondes (Rythme & Rétention)",
        "title_en": "60-Second Edutainment Vertical Video Script & Visual Storyboarder",
        "variables": ["Educational Concept", "Viewer Pain Point", "Visual Metaphor", "Save Trigger"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Écrit des scripts de 130 à 150 mots calibrés pour 60 secondes d'Edutainment (éducation + divertissement) : vulgarisation par métaphore visuelle, rythme de phrases courtes sans respiration morte et déclencheur psychologique de mise en favoris (Save/Bookmark).",
        "guide_fr": "L'indicateur clé des algorithmes TikTok et Reels est le taux d'enregistrement (Saves) : renseignez un outil, une liste ou un cadre que l'audience voudra conserver.",
        "raw_prompt": "Write a tight 60-second (140-word) edutainment vertical video script explaining {{educational-concept}} to solve {{viewer-pain-point}} using {{visual-metaphor}} and optimizing for {{save-trigger}}."
    },
    {
        "id": "youtube-channel-positioning-bible",
        "category": "Media",
        "icon": "🧭",
        "title_fr": "Bible de Positionnement de Chaîne YouTube & Piliers Éditoriaux",
        "title_en": "YouTube Channel Positioning Bible, Viewer Avatar & Content Buckets",
        "variables": ["Creator Expertise", "Target Viewer Avatar", "Monetization Model", "Publishing Cadence"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Définit la stratégie fondatrice d'une chaîne YouTube ou d'un média d'entreprise : avatar spectateur unique, 3 formats récurrents (shows), équilibre entre vidéos découvrables (Top of Funnel) et vidéos de profondeur (Trust/Conversion), et calendrier des 10 premières vidéos.",
        "guide_fr": "Idéal pour lancer une nouvelle chaîne ou repositionner une chaîne stagnante autour d'un objectif business clair.",
        "raw_prompt": "Build a complete YouTube Channel Positioning Bible around {{creator-expertise}} for {{target-viewer-avatar}}, monetized via {{monetization-model}} at {{publishing-cadence}}."
    },
    {
        "id": "video-broll-editing-director",
        "category": "Media",
        "icon": "🎞️",
        "title_fr": "Directeur Artistique de Montage Vidéo, B-Roll & Sound Design",
        "title_en": "Video Editing Retention Director: B-Roll, Motion Graphics & SFX Cue Sheet",
        "variables": ["Raw Script Text", "Editing Style", "Target Platform", "Emotional Tone"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Transforme un script texte brut en une feuille de route de montage (Edit Decision List) prête à envoyer à votre monteur vidéo (Premiere, DaVinci, CapCut) : cadrages, zooms dynamiques, animations motion design explicatives, incrustations B-Roll et effets sonores (SFX) ligne par ligne.",
        "guide_fr": "Collez votre script validé et envoyez directement le tableau généré à votre monteur pour diviser par 3 les allers-retours de retouches.",
        "raw_prompt": "Convert {{raw-script-text}} into a second-by-second video editor cue sheet in {{editing-style}} for {{target-platform}} with {{emotional-tone}} (camera cuts, motion graphics, B-roll, and SFX)."
    },
    {
        "id": "newsletter-to-video-show-converter",
        "category": "Media",
        "icon": "📰",
        "title_fr": "Convertisseur d'Articles / Newsletters en Émission Vidéo & Audio",
        "title_en": "Written Article & Newsletter to Visual Video Essay Adaptation Engine",
        "variables": ["Article Content", "Host Persona", "Visual Props", "Target Duration"],
        "models": ["ChatGPT", "Claude", "Gemini"],
        "description_fr": "Réécrit un article de blog ou une édition de newsletter (style écrit) en un script parlé naturel et incarné (style oral face caméra), en remplaçant les paragraphes abstraits par des démonstrations visuelles à l'écran, des graphiques commentés et des transitions fluides.",
        "guide_fr": "Ne lisez jamais un article écrit face caméra : passez-le dans ce convertisseur pour adapter la syntaxe au langage parlé et visuel.",
        "raw_prompt": "Adapt the written {{article-content}} into a natural spoken-word video essay hosted by {{host-persona}}, incorporating {{visual-props}} for a {{target-duration}} episode."
    }
]


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


def build_prompt_object(item):
    title_en = item["title_en"]
    variables = item["variables"]
    raw_prompt = item["raw_prompt"]

    input_tags = "\n".join([
        f"  <{v.lower().replace(' ', '_').replace('-', '_')}>{{{{{v.lower().replace(' ', '-')}}}}}</{v.lower().replace(' ', '_').replace('-', '_')}>"
        for v in variables
    ])

    role_dict = {
        "Ecommerce": f"Chief E-Commerce Officer, Principal D2C CRO Strategist, and Retail Merchandising Architect specializing in {title_en}",
        "Operations": f"Chief Operating Officer (COO), VP of People Operations, and Corporate Legal Operations Architect specializing in {title_en}",
        "Media": f"Executive Producer, Viral Retention Showrunner, and Multi-Platform Creator Strategist specializing in {title_en}"
    }
    expert_role = role_dict.get(item["category"], f"Principal Industry Strategist specializing in {title_en}")

    optimized_prompt = f"""<system_role>
You are a {expert_role}.
Your objective is to produce world-class, production-grade output for: {title_en}.
</system_role>

<context_inputs>
{input_tags}
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
- High-precision templates, scripts, SOPs, or conversion frameworks.

### 3. Optimization & Long-Term Scaling Guardrails
- Critical edge-cases, common pitfalls to avoid, and validation benchmarks.
</structured_output_schema>

<source_intent_reference>
{raw_prompt}
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
        "models": item["models"],
        "variables_fr": ", ".join(variables),
        "variables_list": vars_list,
        "description_fr": item["description_fr"],
        "optimized_prompt": optimized_prompt,
        "original_prompt": raw_prompt,
        "guide_fr": item["guide_fr"]
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

    children = [
        {
            "object": "block",
            "type": "callout",
            "callout": {
                "icon": {"type": "emoji", "emoji": "📌"},
                "color": "blue_background",
                "rich_text": [{"type": "text", "text": {"content": data["description_fr"][:1800]}}]
            }
        }
    ]

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

    children.append({
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": "⚡ Prompt Optimisé (Prêt à l'emploi)"}}]
        }
    })
    children.extend(create_code_blocks(data["optimized_prompt"], "markdown"))

    if data["original_prompt"]:
        children.append({
            "object": "block",
            "type": "heading_2",
            "heading_2": {
                "rich_text": [{"type": "text", "text": {"content": "📜 Prompt Source (Référence Interne)"}}]
            }
        })
        children.extend(create_code_blocks(data["original_prompt"], "markdown"))

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
    print(f"=== Phase 5 : Enrichissement de la Bibliothèque (+{len(TARGET_PROMPTS)} Prompts -> 144 Total) ===")

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    web_file = os.path.join(base_dir, "src", "data", "prompts.json")

    with open(web_file, "r", encoding="utf-8") as f:
        existing_prompts = json.load(f)

    existing_ids = {p.get("id") for p in existing_prompts}
    added_count = 0

    for idx, item in enumerate(TARGET_PROMPTS, 1):
        if item["id"] in existing_ids:
            print(f"[{idx}/{len(TARGET_PROMPTS)}] SKIP (déjà présent) : {item['title_fr']}")
            continue

        print(f"[{idx}/{len(TARGET_PROMPTS)}] {item['category']} | {item['title_fr']}")
        data = build_prompt_object(item)
        push_to_notion(data)
        existing_prompts.append(data)
        existing_ids.add(data["id"])
        added_count += 1
        time.sleep(0.35)

    with open(web_file, "w", encoding="utf-8") as f:
        json.dump(existing_prompts, f, ensure_ascii=False, indent=2)

    print(f"\n🎉 Succès ! {added_count} nouveaux prompts ajoutés à src/data/prompts.json et synchronisés sur Notion.")
    print(f"Total des prompts disponibles : {len(existing_prompts)}")


if __name__ == "__main__":
    main()
