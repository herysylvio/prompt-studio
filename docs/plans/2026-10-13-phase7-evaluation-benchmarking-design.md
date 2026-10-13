# Conception : Phase 7 — Studio d'Évaluation & Benchmarking A/B

> **Projet :** Prompt Studio  
> **Date :** 13 Octobre 2026  
> **Statut :** En cours de validation  
> **Contraintes :** 100% Marque Blanche, 100% Français (UI / Rapports), 0 emoji décoratif (100% Lucide SVG), zéro régression Vite 8 / Rolldown.

---

## 1. Objectif & Vision de la Phase 7

Doter Prompt Studio d'un véritable **Studio d'Évaluation & Benchmarking A/B** pour mesurer scientifiquement l'efficacité d'un prompt :
1. **Estimateur de Consommation & Coût Multi-Modèles** : Calcul instantané des tokens (prompt + complétion estimée) et estimation du coût en dollars par million de tokens pour Claude 3.5 Sonnet, GPT-4o, et Gemini 1.5 Pro.
2. **Matrice d'Évaluation Multi-Critères (Score de Rigueur /100)** : Décomposition du score en 5 axes pondérés (Clarté du Persona, Précision des Directives, Déterminisme du Schéma, Efficience Token, Robustesse aux Hallucinations).
3. **Comparateur A/B de Variantes** : Possibilité de créer une variante B (avec ajustement des directives ou des contraintes) et de comparer les métriques et les sorties simulées côte à côte.
4. **Stress-Test de Robustesse (Garde-fous d'Injection & Cas Limites)** : Détecteur automatique d'ambiguïtés, de variables manquantes et de risques de dérive du modèle.

---

## 2. Architecture & Modules Prévus

### 2.1. Nouvel Onglet Atelier : `Benchmarking & Évaluation` (`activeView === 'benchmark'`)
- Icône Lucide dédiée : `BarChart3` ou `Scale`.
- Rendu direct dans le Workbench avec 4 sous-panneaux :
  - **Panneau 1 : Métriques & Coûts** (Tokens prompt, complétion projetée, coût estimé pour 1 000 exécutions sur Claude 3.5 Sonnet, GPT-4o et Gemini 1.5 Pro).
  - **Panneau 2 : Audit de Rigueur Multi-Axes** (5 axes de notation avec diagnostics précis).
  - **Panneau 3 : Comparateur A/B de Variantes** (Variante A Référence vs Variante B Expérimentale avec prompt live).
  - **Panneau 4 : Stress-Test & Garde-fous** (Checklist de robustesse contre les injections, ambiguïtés et hallucinations).

### 2.2. Intégrations Globales
- **Palette de Commande `⌘K`** : Action rapide `act-benchmark-view` pour basculer en mode évaluation.
- **Export Rapport de Benchmark (.md)** : Téléchargement direct d'une synthèse d'évaluation de coût et de robustesse.
