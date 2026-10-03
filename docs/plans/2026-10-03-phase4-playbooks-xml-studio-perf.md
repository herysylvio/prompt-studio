# Plan d'implémentation de la Phase 4 : Playbooks Multi-Étapes, Studio XML Colorisé & Optimisation Build

**Objectif :** Ajouter un système de **Playbooks Multi-Étapes** (6 parcours guidés enchaînant les prompts de la bibliothèque avec suivi de progression), doter l'atelier d'un **Aperçu XML Colorisé avec Compteur de Tokens et Mode Édition Live**, et finaliser l'identité technique (`index.html`, `favicon.svg`, `package.json`) ainsi que le découpage du bundle Vite (`vite.config.js`).

**Architecture :** Les Playbooks sont définis dans `src/data/playbooks.json` et validés par test TDD contre `src/data/prompts.json`. L'interface React (`src/App.jsx`) intègre un mode parcours avec persistance de progression (`ps_playbook_progress_v1`), un parseur léger de coloration syntaxique (balises XML, titres Markdown, variables `{{...}}`), une estimation de tokens en temps réel et un mode d'édition libre du prompt final. `vite.config.js` sépare les chunks (`vendor`, `icons`, `catalog`) pour garantir un chargement initial ultra-léger sans avertissement de build.

**Stack Technique :** React 19, Vite 8, Lucide Icons (SVG strict), Python 3 (validation TDD), `localStorage`.

---

### Tâche 1 : Création de `src/data/playbooks.json` & Script de Validation TDD (`scripts/verify_phase4.py`)

**Fichiers :**
- Créer : `scripts/verify_phase4.py`
- Créer : `src/data/playbooks.json`

**Étape 1 : Écrire le test de validation TDD (`scripts/verify_phase4.py`)**
Vérifie que :
1. `src/data/playbooks.json` contient 6 playbooks complets et que chaque `promptId` d'étape existe dans `src/data/prompts.json`.
2. `index.html` est en `lang="fr"`, contient le titre `Prompt Studio` et ne mentionne plus `prompt-vault-web`.
3. `public/favicon.svg` existe.

**Étape 2 : Exécuter le test pour vérifier l'échec initial**
Exécuter : `python scripts/verify_phase4.py`
Résultat attendu : ÉCHEC (`FileNotFoundError: playbooks.json`)

**Étape 3 : Créer `src/data/playbooks.json` avec les 6 Playbooks Multi-Étapes**
1. **Lancement de Produit / SaaS de A à Z** (5 étapes : Business Plan → Architecture Full-Stack → Design UI SaaS → Copywriting Landing Page → Roadmap Onboarding)
2. **Machine d'Acquisition & Closing B2B** (5 étapes : Sales Playbook → Cold Outreach B2B → Relance Multi-Touches → Traitement des Objections → Proposition Commerciale)
3. **Domination SEO & Autorité Sémantique** (5 étapes : Chasseur de Mots-Clés → Rétro-Ingénierie SERP → Rédacteur Sémantique → Humaniseur E-E-A-T → Maillage Interne)
4. **Système d'Autorité & Croissance Organique** (5 étapes : Marque Personnelle → Piliers de Contenu → Clonage ADN Éditorial → Machine à Hooks LinkedIn → Newsletter Haute Rétention)
5. **Usine d'Automatisation & Agents IA** (5 étapes : Audit d'Opportunités → Système d'Automatisation Métier → Workflows n8n → Garde-Fous System Prompts → Directives Agents Autonomes)
6. **Pilotage Financier, Pricing & Levée de Fonds** (5 étapes : Stratégie de Pricing Power → Projections Financières P&L → Prévisionnel Cash-Flow → Audit Unit Economics → Pitch Deck Investisseurs)

---

### Tâche 2 : Identité Marque Blanche (`index.html`, `public/favicon.svg`, `package.json`) & Optimisation Vite (`vite.config.js`)

**Fichiers :**
- Créer : `public/favicon.svg`
- Modifier : `index.html`
- Modifier : `package.json`
- Modifier : `vite.config.js`

**Étape 1 : Créer `public/favicon.svg` et mettre à jour `index.html` & `package.json`**
- Remplacer `prompt-vault-web` par `Prompt Studio — Atelier d'Ingénierie de Prompt IA`.
- Configurer le découpage des chunks dans `vite.config.js` pour séparer les données et les icônes du cœur applicatif.

**Étape 2 : Exécuter `python scripts/verify_phase4.py`**
Résultat attendu : SUCCÈS.

---

### Tâche 3 : Intégration des Playbooks Guidés, de la Coloration XML, du Compteur de Tokens & de l'Édition Live (`src/App.jsx`)

**Fichiers :**
- Modifier : `src/App.jsx`
- Modifier : `contexte_projet.md`

**Étape 1 : Intégrer le sélecteur de Playbooks et la bannière de progression étape par étape**
- Afficher les 6 Playbooks dans la barre latérale avec compteur d'étapes complétées (`X/5`).
- Permettre de cocher chaque étape réalisée et de passer en un clic au prompt suivant du Playbook.

**Étape 2 : Intégrer la Coloration Syntaxique XML, le Compteur de Tokens (`~X tokens`) et le Mode Édition Directe**
- Mettre en couleur les balises `<xml_tag>`, les en-têtes `###` et les variables `{{...}}` dans l'aperçu du code.
- Afficher l'estimation du nombre de tokens (`~X tokens`) à côté du nombre de caractères.
- Ajouter un bouton **« Éditer le texte »** permettant de modifier librement le prompt final avant copie ou export `.md`.

**Étape 3 : Vérifier le build de production et commiter**
Exécuter : `npm run build`
Résultat attendu : SUCCÈS sans aucun avertissement de taille de chunk.
