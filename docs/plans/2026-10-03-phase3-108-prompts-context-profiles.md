# Plan d'implémentation de la Phase 3 : Cap des 108 Prompts (9 Catégories) & Profils de Contexte Global

**Objectif :** Étendre la bibliothèque à 108 prompts répartis équitablement dans 9 catégories (en ajoutant *Agents IA & Automatisation*, *Productivité & Stratégie Business*, et *Data, Finance & Analyse* avec 12 prompts chacune synchronisés sur Notion) et intégrer un gestionnaire de **Profils de Contexte Global** ainsi qu'un module de **Sauvegarde / Restauration JSON** de l'espace utilisateur.

**Architecture :** Le pipeline Python (`scripts/enrich_library_batch.py`) est enrichi avec les 36 nouveaux modules (100 % métadonnées françaises, prompts XML en anglais, synchronisation Notion automatique). Côté frontend (`src/App.jsx`), les 3 nouvelles catégories sont branchées avec leurs icônes vectorielles Lucide (`Bot`, `Briefcase`, `LineChart`), accompagnées d'un système de **Profils de Contexte** (`ps_context_profiles_v1` dans `localStorage`) permettant d'injecter automatiquement les paramètres récurrents de l'utilisateur (ex: nom d'entreprise, secteur, cible, stack technique) dans les variables correspondantes de n'importe quel prompt, et d'un utilitaire d'export/import JSON de l'espace de travail.

**Stack Technique :** React 18, Vite, Lucide Icons (SVG strict), Python 3 (`requests`), API Notion (`2022-06-28`), `localStorage`.

---

### Tâche 1 : Préparation et Vérification du Pipeline des 36 Nouveaux Prompts (3 Nouvelles Catégories)

**Fichiers :**
- Modifier : `scripts/enrich_library_batch.py`
- Tester : `scripts/verify_library_integrity.py` (nouveau script de validation TDD)

**Étape 1 : Écrire le test de validation d'intégrité (`scripts/verify_library_integrity.py`)**
```python
import json
import os
import sys

def test_library_108_prompts():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    web_file = os.path.join(base_dir, "src", "data", "prompts.json")
    with open(web_file, "r", encoding="utf-8") as f:
        prompts = json.load(f)

    expected_categories = {
        "Marketing": 12,
        "Coding": 12,
        "Design": 12,
        "Sales": 12,
        "Copywriting": 12,
        "SEO": 12,
        "Automation": 12,
        "Business": 12,
        "Finance": 12,
    }

    counts = {}
    for p in prompts:
        cat = p.get("category")
        counts[cat] = counts.get(cat, 0) + 1
        assert p.get("title_fr"), f"Missing title_fr on {p.get('id')}"
        assert p.get("description_fr"), f"Missing description_fr on {p.get('id')}"
        assert p.get("optimized_prompt"), f"Missing optimized_prompt on {p.get('id')}"
        assert "url" not in p, f"White-label violation: url present on {p.get('id')}"

    assert len(prompts) == 108, f"Expected 108 prompts, got {len(prompts)}"
    for cat, expected in expected_categories.items():
        actual = counts.get(cat, 0)
        assert actual == expected, f"Category {cat}: expected {expected}, got {actual}"

    print("OK: 108 prompts verified across all 9 categories!")

if __name__ == "__main__":
    test_library_108_prompts()
```

**Étape 2 : Exécuter le test pour vérifier l'échec initial**
Exécuter : `python scripts/verify_library_integrity.py`
Résultat attendu : ÉCHEC (`AssertionError: Expected 108 prompts, got 72`)

**Étape 3 : Mettre à jour `scripts/enrich_library_batch.py` avec les 36 nouveaux prompts et exécuter la synchronisation Notion + JSON**
Configurer les 3 nouvelles catégories dans `TARGET_PROMPTS` :
1. **`Automation` (Agents IA & Automatisation — 12 prompts)** :
   - `n8n-production-workflows` (*Architecte de Workflows n8n Prêts pour la Production*)
   - `business-automation-systems` (*Concepteur de Systèmes d'Automatisation Métier Bout-en-Bout*)
   - `unattended-agent-instructions` (*Ingénieur de Directives Systèmes pour Agents IA Autonomes*)
   - `customer-support-ai-chatbot` (*Architecte d'Agents Conversationnels & Support Client IA*)
   - `workflow-automation-auditor` (*Auditeur d'Opportunités d'Automatisation & Gain de Temps*)
   - `custom-automation-scripts` (*Générateur de Scripts d'Automatisation Sur-Mesure & Cron*)
   - `prompt-engineering-master` (*Méta-Prompt : Optimiseur & Raffineur d'Ingénierie de Prompt*)
   - `chatbot-handoff-protocols` (*Protocole d'Escalade & Transfert Agent IA vers Humain*)
   - `onboarding-chatbot-flows` (*Concepteur de Flux Conversationnels d'Onboarding Client*)
   - `market-research-agent-brief` (*Brief d'Agent Autonome d'Intelligence & Veille Marché*)
   - `reusable-browser-agent` (*Architecte d'Agents Opérateurs Web & Navigation Automatisée*)
   - `system-prompt-guardrails` (*Ingénieur de Garde-Fous & Règles Déterministes pour System Prompts*)
2. **`Business` (Productivité & Stratégie Business — 12 prompts)** :
   - `ai-business-plan-architect` (*Architecte de Business Plan Exécutif & Modèle Économique*)
   - `strategic-decision-matrix` (*Système d'Aide à la Décision Stratégique & Arbitrage Dirigeant*)
   - `kpi-dashboard-architect` (*Concepteur de Tableaux de Bord KPIs & OKRs Trimestriels*)
   - `saas-onboarding-roadmap` (*Architecte de Feuille de Route d'Onboarding & Activation SaaS*)
   - `startup-10k-mrr-blueprint` (*Plan d'Exécution Startup : De 0 à 10k€ de MRR*)
   - `innovation-product-roadmap` (*Stratège de Roadmap Produit & Priorisation R&D*)
   - `project-management-system` (*Architecte de Système de Gestion de Projet Minimaliste*)
   - `executive-leadership-coach` (*Coach Exécutif en Leadership & Communication d'Équipe*)
   - `skill-building-accelerator` (*Architecte de Plan de Montée en Compétences Accélérée*)
   - `business-expansion-strategy` (*Stratège d'Expansion Commerciale & Ouverture de Nouveaux Marchés*)
   - `Subscription-retention-ai` (*Ingénieur de Rétention Client & Réduction du Churn*)
   - `weekly-performance-optimizer` (*Système d'Optimisation de Productivité Hebdomadaire & Deep Work*)
3. **`Finance` (Data, Finance & Analyse — 12 prompts)** :
   - `financial-projections-modeler` (*Modélisateur de Projections Financières & Compte de Résultat (P&L)*)
   - `cash-flow-forecaster` (*Prévisionniste de Trésorerie (Cash-Flow) & BFR*)
   - `pricing-strategy-optimizer` (*Stratège de Tarification (Pricing Power) & Psychologie des Prix*)
   - `investment-profitability-analyzer` (*Analyseur de Rentabilité d'Investissement (ROI, TRI, VAN)*)
   - `cash-flow-scenario-simulator` (*Simulateur de Scénarios de Trésorerie & Stress-Test Financier*)
   - `data-analysis-report-generator` (*Générateur de Rapports d'Analyse de Données & Insights Exécutifs*)
   - `financial-performance-auditor` (*Auditeur de Performance Financière & Marges Opérationnelles*)
   - `data-analytics-platform-architect` (*Architecte de Plateforme Data Analytics & Pipelines BI*)
   - `proposal-budget-builder` (*Concepteur de Budgets Prévisionnels & Chiffrage de Projets*)
   - `financial-tracking-system` (*Architecte de Système de Suivi Financier & Contrôle de Gestion*)
   - `cash-flow-improvement-plan` (*Plan d'Action d'Optimisation du Cash-Flow & Recouvrement*)
   - `google-analytics-tracking-setup` (*Architecte de Plan de Marquage Analytique & Attribution Data*)

**Étape 4 : Exécuter le script et relancer le test de validation**
Exécuter : `python scripts/enrich_library_batch.py && python scripts/verify_library_integrity.py`
Résultat attendu : SUCCÈS (`OK: 108 prompts verified across all 9 categories!`)

---

### Tâche 2 : Intégration des 3 Nouvelles Catégories dans l'Interface (`src/App.jsx`)

**Fichiers :**
- Modifier : `src/App.jsx`

**Étape 1 : Ajouter les 3 nouvelles catégories avec icônes SVG Lucide (`Bot`, `Briefcase`, `LineChart`)**
- Ajouter `Automation` (*Agents IA & Automatisation*, icône `Bot`)
- Ajouter `Business` (*Productivité & Stratégie*, icône `Briefcase`)
- Ajouter `Finance` (*Data, Finance & Analyse*, icône `LineChart`)
- Mettre à jour le `<select>` de la modale de création de prompt sur-mesure avec ces 3 nouvelles catégories.

---

### Tâche 3 : Gestionnaire de « Profils de Contexte Global » & Sauvegarde/Restauration JSON (`src/App.jsx`)

**Fichiers :**
- Modifier : `src/App.jsx`

**Étape 1 : Implémenter les Profils de Contexte (`ps_context_profiles_v1`)**
- Permettre à l'utilisateur de définir et sélectionner un **Profil de Contexte Actif** (ex: *Mon Entreprise / SaaS*, *Client A*, *Projet E-commerce*) contenant ses informations clés (Contexte métier / Entreprise, Audience cible / ICP, Ton & Voix de marque, Stack technique / Outils, Objectif principal).
- Ajouter un bouton **« Injecter mon Profil »** dans le panneau des Variables Interactives qui pré-remplit intelligemment les variables du prompt ou ajoute un bloc `<user_workspace_profile>` optionnel en un clic.

**Étape 2 : Implémenter la Sauvegarde & Restauration JSON de l'Espace Utilisateur**
- Ajouter dans le pied de la barre latérale deux actions rapides : **Exporter Espace (.json)** (sauvegarde les favoris, prompts sur-mesure, profils de contexte et variables saisies) et **Importer (.json)** pour restaurer ou transférer sa configuration entre deux appareils.

**Étape 3 : Vérifier le build de production et mettre à jour `contexte_projet.md`**
Exécuter : `npm run build`
Résultat attendu : SUCCÈS (0 erreur).
