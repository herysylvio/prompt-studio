# Plan d'implémentation : Landing Page d'Accueil & Bibliothèque Aérée par Sections

**Objectif :** Transformer Prompt Studio en une application aérée inspirée de God of Prompt avec une signature de marque Dark Tech Studio originale (Obsidian & Amber Gold), intégrant une **Landing Page complète**, une **Bibliothèque aérée en grille de cartes** par sections et un **Atelier décompressé**, en 100% marque blanche et sans aucun emoji décoratif.

**Architecture :**
- Nouveau routeur d'état central : `mainNavView` (`'home'` | `'library'` | `'playbooks'` | `'workbench'`).
- Barre de navigation globale flottante (`ps-global-nav`) avec bascule instantanée entre les vues.
- Composant Landing Page (`LandingPageView`) : Hero percutant, mockup interactif flottant, métriques, Bento Grid des 12 piliers et section méthode XML.
- Composant Bibliothèque en grille (`LibraryGridView`) : Grille spacieuse de cartes en 3 à 4 colonnes, filtres horizontaux par pills et recherche instantanée.
- Conservation de l'Atelier existant (`WorkbenchView`) avec accès direct depuis n'importe quelle carte.

**Stack Technique :** React 19, Lucide React (100% SVG), CSS Variables (`src/index.css`), Vite 8 / Rolldown.

---

### Tâche 1 : Suite de Validation TDD pour le Redesign

**Fichiers :**
- Créer : `scripts/verify_redesign.py`

**Étape 1 : Écrire le test TDD**
Vérifier la présence de `mainNavView`, `ps-global-nav`, `ps-landing-hero`, `ps-library-grid`, les 12 cartes Bento, et l'absence totale d'emoji décoratif.

**Étape 2 : Exécuter pour vérifier l'échec initial**
`python scripts/verify_redesign.py` -> Doit échouer sur `mainNavView`.

---

### Tâche 2 : Styles CSS & Système de Design "Dark Obsidian & Amber Gold"

**Fichiers :**
- Modifier : `src/index.css`

**Détails :**
1. Variables pour l'ambiance Dark Obsidian (`--bg-core: #08090c`, `--bg-card: #11141b`).
2. Classes pour la grille aérée de la bibliothèque (`.ps-library-grid`).
3. Classes pour les cartes Bento et les effets de glow doré au survol.
4. Classes pour le Hero flottant et les badges pills.

---

### Tâche 3 : Barre de Navigation Globale & Vue Landing Page

**Fichiers :**
- Modifier : `src/App.jsx`
- Tester : `scripts/verify_redesign.py`

**Détails :**
1. Déclarer l'état `mainNavView` (défaut `'home'` ou conservé en session).
2. Construire le header unifié `ps-global-nav` avec onglets `Accueil`, `Bibliothèque (144)`, `Playbooks (9)`, `Atelier`.
3. Implémenter la Landing Page :
   - Pill top tag `Atelier d'Ingénierie IA • 100% Déterministe`.
   - H1 et sous-titre à fort impact.
   - Mockup interactif avec code XML animé et score 100/100.
   - Statistiques clés (144 prompts, 12 piliers, 9 playbooks).
   - Bento Grid des 12 piliers avec liens directs vers la bibliothèque filtrée.
   - Pédagogie de la méthode XML.

---

### Tâche 4 : Vue Bibliothèque Aérée par Sections & Grille de Cartes

**Fichiers :**
- Modifier : `src/App.jsx`
- Tester : `scripts/verify_redesign.py`

**Détails :**
1. Créer la vue `LibraryGridView` lorsque `mainNavView === 'library'`.
2. Filtres horizontaux sous forme de pills défilantes pour les 12 catégories + Favoris + Récents + Sur-mesure.
3. Affichage en grille responsive de cartes avec :
   - Icône Lucide dédiée par catégorie.
   - Bouton de copie rapide en 1 clic.
   - Bouton "Ouvrir dans l'Atelier" basculant vers `mainNavView = 'workbench'`.
   - Badges modèles et favoris.

---

### Tâche 5 : Vue Playbooks Spacieuse & Transition vers l'Atelier

**Fichiers :**
- Modifier : `src/App.jsx`
- Tester : `scripts/verify_redesign.py`

**Détails :**
1. Présentation des 9 Playbooks sous forme de grandes cartes d'exécution séquentielles dans `mainNavView === 'playbooks'`.
2. Conservation de l'Atelier de travail complet (split-view, benchmark, sandbox, builder) dans `mainNavView === 'workbench'` avec bouton de retour vers la bibliothèque.

---

### Tâche 6 : Vérification Finale, Build & Déploiement

**Commandes :**
`python scripts/verify_redesign.py; python scripts/verify_phase7.py; npm run build`
Vérification des régressions, build propre en production, commit et push sur `origin/main`.
