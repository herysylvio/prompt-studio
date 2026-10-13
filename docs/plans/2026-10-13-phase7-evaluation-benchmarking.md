# Plan d'implémentation de la Phase 7 : Studio d'Évaluation & Benchmarking A/B

**Objectif :** Équiper Prompt Studio d'un **Studio d'Évaluation & Benchmarking A/B** complet intégrant l'estimation des coûts multi-modèles, un audit de rigueur multi-axes (/100), un comparateur A/B de variantes et des tests de robustesse/garde-fous.

**Architecture :** 
- Nouvel onglet dans le Workbench (`activeView === 'benchmark'`, icône `Scale` ou `LineChart`).
- Calculateur de coûts et tokens multi-modèles (`benchmarkCostEstimate`).
- Audit de rigueur sur 5 piliers déterministes (`benchmarkAuditReport`).
- Système de variante B avec live-diff et comparaison des métriques (`benchmarkVariantB`).
- Export dédié du rapport d'évaluation (`handleExportBenchmarkReport`).

**Stack Technique :** React 19, Lucide React (100% SVG, zéro emoji décoratif), Vite 8 / Rolldown, CSS Variables standard.

---

### Tâche 1 : Suite de Tests TDD pour la Phase 7

**Fichiers :**
- Créer : `scripts/verify_phase7.py`

**Étape 1 : Écrire le script de test**
Vérifier l'onglet benchmark, les calculs de coûts, le comparateur de variante et l'absence d'emoji.

**Étape 2 : Exécuter pour vérifier l'échec initial**
`python scripts/verify_phase7.py` -> Échec attendu.

---

### Tâche 2 : Implémentation du Simulateur de Coûts & Audit de Rigueur Multi-Axes

**Fichiers :**
- Modifier : `src/App.jsx`
- Tester : `scripts/verify_phase7.py`

**Détails :**
1. Ajouter les états et calculs :
   - Tarifs par million de tokens (Claude 3.5 Sonnet: \$3 in / \$15 out ; GPT-4o: \$2.50 in / \$10 out ; Gemini 1.5 Pro: \$3.50 in / \$10.50 out).
   - Calcul des projections pour 1 000 exécutions de production.
   - Notation des 5 axes de rigueur (Persona, Directives, Schéma, Efficience, Garde-fous).

---

### Tâche 3 : Comparateur A/B de Variantes & Stress-Test de Robustesse

**Fichiers :**
- Modifier : `src/App.jsx`
- Tester : `scripts/verify_phase7.py`

**Détails :**
1. Variante A (Prompt optimisé actuel) vs Variante B (Variante avec contraintes renforcées ou format concis).
2. Stress-test d'intégrité (Vérification des variables non renseignées, injection potentielle, dérive stylistique).
3. Export de rapport d'évaluation technique (`handleExportBenchmarkReport`).
4. Intégration dans la Palette de Commande `⌘K` (`act-benchmark-view`).

---

### Tâche 4 : Vérification Finale & Build

**Commandes :**
`python scripts/verify_phase7.py; npm run build`
Validation de 0 emoji, build propre en production, commit et push sur `origin/main`.
