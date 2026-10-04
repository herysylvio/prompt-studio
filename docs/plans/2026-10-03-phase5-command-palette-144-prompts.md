# Plan d'implémentation de la Phase 5 : Cap des 144 Prompts, 9 Playbooks, Palette de Commande ⌘K & Atelier Qualité

**Objectif :** Étendre la bibliothèque de Prompt Studio à **144 prompts d'ingénierie avancée** (12 catégories × 12 prompts synchronisés sur Notion) et **9 Playbooks multi-étapes**, tout en dotant l'application d'une **Palette de Commande modale `⌘K` façon Raycast/Linear**, d'un **Score de Précision & Checklist Qualité en direct**, d'un **Mode Comparaison Split-View (XML vs Brut)** et d'un **Historique des Copies Récentes**.

**Architecture :** Le script Python `scripts/enrich_library_phase5.py` extrait 36 nouveaux prompts sur `godofprompt.ai` répartis dans 3 nouvelles catégories métiers (`Ecommerce` — E-Commerce & Retail, `Operations` — Juridique, RH & Opérations, `Media` — Vidéo, YouTube & Créateurs), génère les prompts structurés en balises XML (en anglais) avec toutes les métadonnées et descriptions en français, synchronise les 36 fiches sur Notion et met à jour `src/data/prompts.json` en 100 % marque blanche (144 prompts au total). `src/data/playbooks.json` passe de 6 à 9 Playbooks (45 étapes guidées). L'interface `src/App.jsx` intègre la Palette de Commande `⌘K` modale (navigation clavier `↑/↓/Entrée`, actions rapides et saut direct aux prompts/playbooks/profils), l'évaluateur de qualité du prompt en temps réel (score `/100`), la vue comparative côte-à-côte (`split`) et le filtre/historique des prompts récemment copiés (`ps_recent_history_v1`).

**Stack Technique :** React 19, Vite 8 (Rolldown), Lucide React (`lucide-react`), CSS Custom Properties (`src/index.css`), Python 3 (`requests`) + Notion API (`2022-06-28`).

---

### Tâche 1 : Expansion du Catalogue à 144 Prompts (+36 Prompts dans 3 Nouvelles Catégories) & Synchronisation Notion

**Fichiers :**
- Créer : `scripts/enrich_library_phase5.py`
- Modifier : `src/data/prompts.json`
- Tester : `scripts/verify_phase5.py`

**Étape 1 : Écrire le test de vérification du catalogue Phase 5 (144 prompts, 12 catégories, 100 % FR, 0 URL externe)**
```python
# Dans scripts/verify_phase5.py
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")

with open("src/data/prompts.json", "r", encoding="utf-8") as f:
    prompts = json.load(f)

assert len(prompts) == 144, f"Attendu 144 prompts, trouvé {len(prompts)}"
categories = {}
for p in prompts:
    cat = p.get("category")
    categories[cat] = categories.get(cat, 0) + 1
    assert "url" not in p, f"URL externe détectée dans {p['id']}"
    assert "<system_role>" in p.get("optimized_prompt", ""), f"Balise XML manquante dans {p['id']}"

assert len(categories) == 12, f"Attendu 12 catégories, trouvé {len(categories)}: {categories}"
for cat, count in categories.items():
    assert count == 12, f"Catégorie {cat} contient {count} prompts au lieu de 12"
print("SUCCÈS : 144 prompts répartis en 12 catégories x 12, 100% marque blanche.")
```

**Étape 2 : Exécuter le test pour vérifier l'échec initial**
Exécuter : `python scripts/verify_phase5.py`
Résultat attendu : ÉCHEC (`AssertionError: Attendu 144 prompts, trouvé 108`)

**Étape 3 : Créer et exécuter `scripts/enrich_library_phase5.py` pour enrichir les 3 nouvelles catégories (`Ecommerce`, `Operations`, `Media`)**
1. Définir 36 nouveaux prompts (12 par catégorie) :
   - **`Ecommerce` (E-Commerce, Produit & Retail — 12 prompts)** : Optimisation de fiches produits Shopify/Amazon à haute conversion, Architecte de bundles & upsells AOV, Séquence d'emails panier abandonné, Analyseur d'avis clients & matrice d'amélioration produit, Stratégie de lancement de collection saisonnière, Calculateur de politique de retour & prévention de fraude, etc.
   - **`Operations` (Juridique, RH & Opérations — 12 prompts)** : Rédacteur de procédures opérationnelles standardisées (SOP), Générateur de fiches de poste & scorecard de recrutement, Grille d'entretien structuré anti-biais, Plan d'onboarding collaborateur 30-60-90 jours, Auditeur de clauses contractuelles & risques B2B, Synthétiseur de politiques RGPD & conformité interne, etc.
   - **`Media` (Vidéo, YouTube & Créateurs — 12 prompts)** : Architecte de scripts YouTube à haute rétention, Ingénieur de hooks vidéo 5 premières secondes (Reels/TikTok/Shorts), Concepteur de miniatures YouTube (CTR > 10 %) & titres A/B, Structurateur d'épisodes de podcast & questions d'interview, Repurposing multi-plateforme d'une vidéo longue en 10 actifs, Planificateur éditorial de chaîne média, etc.
2. Synchroniser chaque prompt avec la base Notion (`3ea24d1b-f2a7-8148-b48a-d24b6f57cad5`) et sauvegarder les 144 prompts sans clé `url` dans `src/data/prompts.json`.

**Étape 4 : Exécuter le test pour vérifier le succès**
Exécuter : `python scripts/verify_phase5.py`
Résultat attendu : SUCCÈS (`144 prompts répartis en 12 catégories x 12`)

---

### Tâche 2 : Extension des Playbooks Multi-Étapes (de 6 à 9 Playbooks Métiers)

**Fichiers :**
- Modifier : `src/data/playbooks.json`
- Tester : `scripts/verify_phase5.py`

**Étape 1 : Ajouter l'assertion des 9 Playbooks dans `scripts/verify_phase5.py`**
```python
with open("src/data/playbooks.json", "r", encoding="utf-8") as f:
    playbooks = json.load(f)

assert len(playbooks) == 9, f"Attendu 9 playbooks, trouvé {len(playbooks)}"
prompt_ids = {p["id"] for p in prompts}
for pb in playbooks:
    assert len(pb.get("steps", [])) == 5, f"Playbook {pb['id']} doit avoir 5 étapes"
    for step in pb["steps"]:
        assert step["promptId"] in prompt_ids, f"Prompt ID {step['promptId']} introuvable"
```

**Étape 2 : Exécuter le test pour vérifier l'échec**
Exécuter : `python scripts/verify_phase5.py`
Résultat attendu : ÉCHEC (`AssertionError: Attendu 9 playbooks, trouvé 6`)

**Étape 3 : Ajouter 3 nouveaux Playbooks de 5 étapes dans `src/data/playbooks.json`**
1. **`playbook-ecommerce-scaling` (Lancement & Scaling Boutique E-Commerce)** : Positionnement offre & bundles AOV → Fiches produits haute conversion → Séquence paniers abandonnés → Analyse avis clients → Campagne d'acquisition ROAS.
2. **`playbook-hr-ops-excellence` (Structuration RH, Recrutement & SOP Opérationnelles)** : Scorecard & fiche de poste → Grille d'entretien structuré → Plan d'onboarding 30-60-90j → Rédaction de SOP standardisée → Audit d'automatisation opérationnelle.
3. **`playbook-creator-video-engine` (Machine de Contenu Vidéo YouTube, Shorts & Podcast)** : Idéation & titres/miniatures à haut CTR → Hook des 5 premières secondes → Script vidéo haute rétention → Repurposing multi-plateforme → Monétisation & sponsoring.

**Étape 4 : Exécuter le test pour vérifier le succès**
Exécuter : `python scripts/verify_phase5.py`
Résultat attendu : SUCCÈS (`9 Playbooks valides (45 étapes reliées)`)

---

### Tâche 3 : Palette de Commande Modale `⌘K` façon Raycast / Linear

**Fichiers :**
- Modifier : `src/App.jsx`
- Modifier : `src/index.css`
- Tester : `scripts/verify_phase5.py`

**Étape 1 : Ajouter le test de présence de la Palette de Commande `⌘K` dans `scripts/verify_phase5.py`**
```python
with open("src/App.jsx", "r", encoding="utf-8") as f:
    app_code = f.read()

assert "isCommandPaletteOpen" in app_code, "État isCommandPaletteOpen manquant"
assert "CommandPaletteModal" in app_code or "ps-command-palette" in app_code, "Composant Palette de Commande manquant"
```

**Étape 2 : Exécuter le test pour vérifier l'échec**
Exécuter : `python scripts/verify_phase5.py`
Résultat attendu : ÉCHEC (`AssertionError: État isCommandPaletteOpen manquant`)

**Étape 3 : Implémenter la Palette de Commande `⌘K` dans `src/App.jsx` et `src/index.css`**
- Raccourci `⌘K` / `Ctrl+K` (ainsi qu'un bouton dédié dans l'en-tête de la barre latérale) ouvrant une modale centrée ultra-rapide style Raycast/Linear (`ps-command-palette`).
- Recherche instantanée multi-cibles :
  1. **Actions Rapides** : Créer un nouveau prompt sur-mesure, Gérer les Profils de Contexte, Basculer le Mode Focus, Basculer le Thème Clair/Sombre, Exporter la sauvegarde JSON.
  2. **Playbooks Guidés** : Accès direct aux 9 Playbooks multi-étapes.
  3. **Catalogue de Prompts (144)** : Recherche floue par titre, catégorie ou variable avec navigation clavier `↑` / `↓` et validation par `Entrée`.

**Étape 4 : Exécuter le test pour vérifier le succès**
Exécuter : `python scripts/verify_phase5.py`
Résultat attendu : SUCCÈS

---

### Tâche 4 : Score de Précision & Checklist Qualité en Direct + Mode Split-View + Historique des Copies Récentes

**Fichiers :**
- Modifier : `src/App.jsx`
- Tester : `scripts/verify_phase5.py`

**Étape 1 : Ajouter les assertions pour le Score de Qualité, le Mode Split-View et l'Historique dans `scripts/verify_phase5.py`**
```python
assert "RECENT_HISTORY" in app_code, "Clé STORAGE_KEYS.RECENT_HISTORY manquante"
assert "promptQualityReport" in app_code, "Calculateur promptQualityReport manquant"
assert "activeView === 'split'" in app_code, "Mode Comparaison Split-View manquant"
```

**Étape 2 : Exécuter le test pour vérifier l'échec**
Exécuter : `python scripts/verify_phase5.py`
Résultat attendu : ÉCHEC

**Étape 3 : Implémenter les 3 fonctionnalités Power-User dans `src/App.jsx`**
1. **Score de Précision & Checklist Qualité (`promptQualityReport`)** :
   - Évalue en temps réel le prompt actif sur 5 critères objectifs (sur 100 points) :
     - Rôle & Persona Système (`<system_role>` présent — 20 pts)
     - Architecture & Contraintes d'Exécution (`<execution_guidelines>` présent — 20 pts)
     - Schéma de Sortie Déterministe (`<structured_output_schema>` présent — 20 pts)
     - Taux de complétion des variables interactives (`{{...}}` renseignées — jusqu'à 25 pts)
     - Profil de Contexte Global injecté ou personnalisation live active (15 pts)
   - Affiche une jauge compacte et élégante avec badge de score (`Score d'Ingénierie : X/100`) et pastilles de contrôle visuelles.
2. **Mode Comparaison Côte-à-Côte (`activeView === 'split'`)** :
   - Ajoute un 3e onglet dans la barre d'outils du Workbench : `Comparaison Côte-à-Côte (Split)` avec l'icône Lucide `Columns2`.
   - Affiche en grille 2 colonnes synchronisées : à gauche le **Prompt Optimisé & Personnalisé (XML)**, à droite le **Prompt Source Brut (Référence)** pour visualiser instantanément le gain structurel.
3. **Historique des Prompts Récemment Copiés (`STORAGE_KEYS.RECENT_HISTORY = 'ps_recent_history_v1'`)** :
   - Enregistre automatiquement les 15 derniers prompts copiés avec horodatage.
   - Ajoute une entrée de filtre rapide **« Récemment Copiés »** (icône Lucide `History`) dans la barre latérale gauche, ainsi que les 3 nouvelles catégories (`Ecommerce` avec `ShoppingCart`, `Operations` avec `Scale`, `Media` avec `Video`).

**Étape 4 : Exécuter le test et le build de production**
Exécuter : `python scripts/verify_phase5.py && npm run build`
Résultat attendu : SUCCÈS (0 erreur, 0 emoji décoratif dans `src/App.jsx`, build Vite propre)

**Étape 5 : Commiter et pousser les changements**
```bash
git add src/ scripts/ docs/plans/ contexte_projet.md
git commit -m "feat(phase5): 144 prompts, 9 playbooks, Cmd+K command palette, quality score and split view"
git push origin main
```
