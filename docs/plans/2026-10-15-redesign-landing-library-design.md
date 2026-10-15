# Document de Conception : Refonte Visuelle & Expérience Hybride — Prompt Studio

> **Date :** 15 Octobre 2026  
> **Projet :** Prompt Studio  
> **Statut :** Validé par l'utilisateur  
> **Inspiration :** Ergonomie et structure inspirées de God of Prompt, avec une identité visuelle originale Dark Tech Studio (Obsidian & Amber Gold), 100% marque blanche et 100% SVG Lucide (0 emoji décoratif dans l'UI).

---

## 1. Vision & Principes Directeurs

### 1.1. Résolution du problème d'encombrement
L'ancienne interface imposait 3 colonnes compressées fixes (Sidebar 248px + Feed 328px + Workbench). La nouvelle architecture découple la navigation en **3 vues principales distinctes** accessibles via une barre de navigation supérieure unifiée :
1. **Vue "Accueil" (`mainNavView === 'home'`)** : Une Landing Page captivante, aérée, mettant en avant la proposition de valeur, les statistiques clés, une carte mockup interactive flottante, la grille des 12 piliers et la méthode XML déterministe.
2. **Vue "Bibliothèque" (`mainNavView === 'library'`)** : Une bibliothèque aérée en grille de cartes (3 à 4 colonnes), classée par catégories horizontales avec recherche instantanée, tags des modèles compatibles, et actions rapides directes (*Copier le Prompt*, *Ouvrir dans l'Atelier*).
3. **Vue "Atelier" (`mainNavView === 'workbench'`)** : L'espace de travail d'ingénierie plein écran pour personnaliser les variables, inspecter le code XML, lancer la simulation multi-modèles (Sandbox) ou exécuter un Playbook.

---

## 2. Système Visuel & Branding "Dark Obsidian & Amber Gold"

### 2.1. Palette de Couleurs & Tokens CSS
- **Fond principal (Canvas)** : Noir minéral obsidienne `#08090c` avec dégradé subtil vers `#0d0f14`.
- **Cartes & Surfaces** : `#11141b` avec bordure hairline fine `rgba(255, 255, 255, 0.07)` et micro-halo doré au survol (`rgba(245, 158, 11, 0.15)`).
- **Accents de Marque** : 
  - Or Ambré studio : `#f59e0b` (primaire), `#d97706` (survol).
  - Émeraude technique : `#10b981` (validation, conformité).
- **Typographie** :
  - `Plus Jakarta Sans` : Titres massifs (weights 700 et 800) avec interlettrage resserré (`-0.03em`).
  - `JetBrains Mono` : Métadonnées, balises XML et tokens.
- **Iconographie** : Exclusivement des icônes vectorielles SVG Lucide (`lucide-react`), aucun emoji décoratif.

---

## 3. Architecture Détaillée des Composants

### 3.1. Header Supérieur Flottant (`ps-global-nav`)
- **Logo & Monogramme** : `⌘` sur fond or ambré + typographie `Prompt Studio`.
- **Sélecteur de Vue Central** :
  - `Accueil` (icône `Globe` ou `Sparkles`)
  - `Bibliothèque` (icône `Boxes` ou `Layers`, avec compteur `144`)
  - `Playbooks` (icône `Compass`, avec compteur `9`)
  - `Atelier` (icône `SlidersHorizontal`)
- **Utilitaires à droite** :
  - Recherche / Palette rapide (`⌘K`)
  - Bouton Thème Sombre / Clair
  - CTA direct *"Explorer les Prompts"*

### 3.2. Page d'Accueil (Landing Page)
- **Badge Capsule (Pill Tag)** : `Atelier d'Ingénierie IA • 100% Déterministe & Marque Blanche`.
- **Hero Headline & Subtitle** :
  - Titre : *"L'arsenal ultime de prompts d'ingénierie pour décupler vos résultats IA."*
  - Sous-titre : *"144 architectures XML d'élite et 9 playbooks d'exécution conçus pour Claude 3.5 Sonnet, GPT-4o et Gemini 1.5 Pro. Structurez, personnalisez et déployez en 1 clic."*
- **Double CTA d'action** :
  - Bouton vibrant : *"Explorer la Bibliothèque (144 Prompts)"*.
  - Bouton secondaire : *"Lancer le Prompt Builder"*.
- **Mockup Interactif Flottant ("Show, Don't Tell")** :
  - Une carte de code studio vivante simulant en direct un prompt XML déterministe avec coloration syntaxique, score qualité 100/100 et variables interactives.
- **Bandeau de Réassurance / Métriques** :
  - `144` Prompts XML testés
  - `12` Domaines métiers couverts
  - `9` Playbooks séquentiels
  - `100%` Marque blanche
- **Bento Grid des 12 Piliers Métiers** :
  - Cartes interactives pour chaque univers (Marketing, Dev, Vente, Design, SEO, Copywriting, Automatisation, Business, Finance, E-commerce, RH, Média). Clic = redirection vers la Bibliothèque avec le filtre appliqué.
- **Section "La Méthode XML Déterministe"** :
  - Comparatif pédagogique Prompt Brut vs Prompt Studio XML.

### 3.3. Vue Bibliothèque (Grid Aérée)
- **Barre d'outils supérieure** :
  - Champ de recherche instantanée large.
  - Catégories horizontales sous forme de pills filtrantes (Tous, Favoris, Récents, Marketing, Code, etc.).
  - Sélecteur de modèle d'IA compatible.
  - Compteur de résultats en temps réel.
- **Grille de Cartes Responsive (3 à 4 colonnes)** :
  - Carte aérée avec :
    - Badge catégorie et icône métier Lucide.
    - Étoile de favori.
    - Titre en gras et description soignée sur 2-3 lignes.
    - Tags des modèles IA (`Claude 3.5 Sonnet`, `GPT-4o`...).
    - Barre d'action basse : Bouton *"Copier"* instantané + Bouton *"Personnaliser"* (ouvre l'Atelier).

### 3.4. Vue Atelier (Workbench Décompressé)
- L'Atelier existant (avec le Prompt Builder, le mode Split-View, la Sandbox de simulation et le Benchmark A/B) est préservé dans son intégralité, mais il s'affiche désormais sans la compression obligatoire des deux colonnes de gauche, avec un bouton de retour rapide vers la Bibliothèque.

---

## 4. Stratégie de Test & TDD

- Création d'un script de vérification : `scripts/verify_redesign.py`.
- Validation des états de navigation : `mainNavView` (`home`, `library`, `playbooks`, `workbench`).
- Validation du rendu des sections du Hero, des 12 cartes Bento et de la grille Bibliothèque.
- Vérification absolue de **0 emoji décoratif** et conformité du build de production (`npm run build`).
