# Contexte de Projet — Prompt Studio

> **Dossier racine** : `C:\Users\sylvi\DEV\PROMPT STUDIO`  
> **Dernière mise à jour** : 3 Octobre 2026  
> **Statut** : En production (Vercel) & synchronisé avec Notion

---

## 1. Vision & Identité du Projet

**Prompt Studio** est un studio et établi d'ingénierie de prompt interactif de niveau professionnel.
- **Positionnement** : Interface épurée, inspirée de Mobbin, Linear et Raycast (thèmes sombre/clair, typographie compacte, icônes SVG strictes, zéro emoji décoratif dans l'UI).
- **Marque blanche totale** : Aucune mention de sources externes. Le produit est une création originale indépendante.
- **Règle linguistique stricte** :
  - **Métadonnées en français** : Titres, descriptions synthétisées, explications de variables et guides stratégiques sont 100 % en français.
  - **Prompts d'exécution en anglais** : Les prompts finaux restent en anglais avec des structures avancées (XML tags, Personas seniors, Directives d'exécution, Schémas de sortie).

---

## 2. Déploiement & Environnements

- **URL de Production (Vercel)** : [https://prompt-studio-henna.vercel.app](https://prompt-studio-henna.vercel.app)
- **Dépôt GitHub** : [https://github.com/herysylvio/prompt-studio.git](https://github.com/herysylvio/prompt-studio.git)
- **Branche principale** : `main` (chaque push sur `origin/main` déclenche le redéploiement automatique sur Vercel).
- **Stack technique** : React 18, Vite, Tailwind CSS, Lucide Icons.

---

## 3. Intégration Notion

- **Notion Integration Token** : `ntn_b98836118154XOYPfEGE87M6X54OaCvW44fCKPk6kvtfjq`
- **Database ID** : `3ea24d1b-f2a7-8148-b48a-d24b6f57cad5`
- **Propriétés de la base** :
  - `Nom` (Title) : Titre en français avec icône emoji.
  - `Titre Original` (Rich text) : Titre source en anglais.
  - `Catégorie` (Select) : `Marketing`, `Coding`, `Design`, `Sales`, `Copywriting`, `SEO`, `Automation`, `Business`, `Finance`.
  - `Modèles IA` (Multi-select) : Modèles recommandés (ChatGPT, Claude, Gemini, DeepSeek...).
  - `Variables` (Rich text) : Liste des variables interactives.
- **Structure des blocs internes Notion** :
  1. `callout` : Synthèse et objectifs en français.
  2. `heading_2` + `bulleted_list_item` : Variables avec noms en gras et placeholders explicatifs.
  3. `heading_2` + `code` (markdown) : Le prompt optimisé et structuré.
  4. `heading_2` + `code` (markdown) : Le prompt source original pour référence.
  5. `heading_2` + `paragraph` : Le guide stratégique et conseils d'utilisation en français.

---

## 4. État de la Bibliothèque (108 Prompts Actifs)

La bibliothèque compte actuellement 108 prompts opérationnels parfaitement équilibrés dans 9 thématiques (12 prompts par catégorie) :
- **Marketing & Croissance** (12 prompts) : Landing pages, tunnels de vente, piliers de contenu, stratégie 360°, hooks LinkedIn, onboarding email, posts multi-plateformes, etc.
- **Code & Développement** (12 prompts) : Architecte logiciel full-stack, schémas de bases de données, convertisseur NL-to-SQL, optimisation SQL, intégrations API & Webhooks, QA Frontend, documentation technique, web scraping, décrypteur de code legacy, audit de sécurité OWASP, débogueur systématique, pipeline qualité CI/CD.
- **Design & Visuels** (12 prompts) : Publicités de luxe & parfums, portraits cinématographiques, mockups packaging, logos minimalistes, shooting photo éditorial, illustrations flat design, architecture UI/UX de sites web, interfaces SaaS & dashboards, lookbooks mode, mockups affichage urbain OOH, photographie cosmétique macro, rendus architecturaux.
- **Vente & Conversion** (12 prompts) : Cold emailing B2B, scripts VSL, diagnostic des risques de closing, Sales Playbook, négociation commerciale, pitch deck investisseurs, traitement des objections, propositions commerciales sur-mesure, expansion de comptes (Upsell/Cross-Sell), scripts de closing Chat/DM, analyse contractuelle B2B, relances multi-touches.
- **Copywriting & Écriture** (12 prompts) : Clonage de style éditorial, polisseur littéraire, scripts vidéos courtes virales, storytelling stratégique, newsletters haute rétention, copy publicitaire Meta/Google Ads, threads viraux, articles d'opinion (Thought Leadership), accroches Google Ads RSA, hooks narratifs d'emails quotidiens, pages de vente long-form, séquences anti-churn.
- **SEO & Visibilité** (12 prompts) : Audit SEO On-Page, content gap analysis, rédacteur d'articles sémantiques, chasseur de mots-clés, audit SEO local & Google Business Profile, stratégie SEO YouTube, humaniseur E-E-A-T, audit SEO technique approfondi, maillage interne & cocons sémantiques, netlinking & backlinks d'autorité, données structurées Schema.org JSON-LD, rétro-ingénierie de SERP.
- **Agents IA & Automatisation** (12 prompts) : Workflows n8n, systèmes d'automatisation métier, directives d'agents autonomes, chatbots support client IA, audit d'opportunités d'automatisation, scripts Cron/Python, méta-prompt d'ingénierie de prompt, protocoles d'escalade IA→Humain, onboarding conversationnel, agent de veille marché, agent navigateur web, garde-fous System Prompts.
- **Productivité & Stratégie Business** (12 prompts) : Business Plan exécutif, matrice d'arbitrage dirigeant, tableaux de bord KPIs & OKRs, roadmap d'activation produit, plan 0 à 10k€ MRR, roadmap R&D (RICE/ICE), gestion de projet minimaliste, coaching leadership exécutif, montée en compétences (Pareto), stratégie Océan Bleu, ingénierie de fidélisation LTV, productivité Deep Work.
- **Data, Finance & Analyse** (12 prompts) : Projections financières & P&L, prévisionnel de trésorerie & BFR, stratégie de Pricing Power, analyse de rentabilité (ROI/TRI/VAN), stress-test de trésorerie, rapports d'analyse de données, audit Unit Economics (LTV/CAC), architecture plateforme BI, budgets prévisionnels projets, contrôle de gestion agile, accélération du cash-flow, plan de marquage analytique GA4/GTM.

Les données de production sont stockées dans :
`src/data/prompts.json`

---

## 5. Scripts d'Automatisation & Pipelines (`scripts/`)

- `scripts/enrich_library_batch.py` : Script tout-en-un pour extraire des lots de prompts, traduire les métadonnées, optimiser les prompts, les envoyer dans Notion et mettre à jour `src/data/prompts.json`.
- `scripts/update_guides_french.py` : Met à jour les guides stratégiques français sur Notion et sur l'application web.
- `scripts/update_french_descriptions.py` : Rafraîchit les descriptions longues traduites.
- `scripts/filter_categories.py` : Analyse le catalogue complet (7 000+ slugs) pour identifier de nouveaux prompts par mot-clé.

---

## 6. Commandes Usuelles

```bash
# Lancer le serveur de développement local
npm run dev

# Tester le build de production
npm run build

# Synchroniser une nouvelle version vers GitHub et Vercel
git add .
git commit -m "feat: description des modifications"
git push origin main
```
