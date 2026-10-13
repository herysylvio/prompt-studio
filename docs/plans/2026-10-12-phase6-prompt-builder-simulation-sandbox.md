# Plan d'implémentation de la Phase 6 : Prompt Builder Pas-à-Pas, Simulateur de Sorties Multi-Modèles & Export Spécification d'Équipe

**Objectif :** Équiper Prompt Studio d'un **Assistant de Création Interactif Pas-à-Pas (Prompt Builder)** pour composer des prompts XML d'élite, d'un **Simulateur de Sorties Multi-Modèles (Output Sandbox)** démontrant la réponse attendue selon Claude/ChatGPT/Gemini, et d'un **Générateur de Fiche de Spécification Pro (Markdown/HTML imprimable)** pour le partage en équipe.

**Architecture :** 
- Le Prompt Builder (`PromptBuilderModal`) guide l'utilisateur à travers 4 étapes séquentielles (Rôle & Persona, Contexte & Variables `{{...}}`, Garde-fous & Directives, Schéma de sortie) avec prévisualisation XML en temps réel.
- Le Simulateur (`OutputSandboxView`) intègre une simulation déterministe de sortie haute fidélité adaptée au `<structured_output_schema>` du prompt actif et au modèle sélectionné.
- L'Export Pro (`handleExportTeamSpec`) génère un document de spécification prêt pour la production (cartouche de gouvernance IA, tableau des paramètres, directives de sécurité et prompt prêt au déploiement).

**Stack Technique :** React 19, Lucide React (100% SVG, zéro emoji décoratif dans l'UI), CSS Variables (`src/index.css`), Vite 8 / Rolldown.

---

### Tâche 1 : Assistant de Création Interactif Pas-à-Pas (Prompt Builder Wizard)

**Fichiers :**
- Modifier : `src/App.jsx`
- Modifier : `src/index.css`
- Tester : `scripts/verify_phase6.py`

**Étape 1 : Écrire le test de vérification du Prompt Builder**
```python
# Dans scripts/verify_phase6.py
import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
app_file = os.path.join(base_dir, "src", "App.jsx")

with open(app_file, "r", encoding="utf-8") as f:
    code = f.read()

assert "isBuilderOpen" in code, "État isBuilderOpen manquant"
assert "builderStep" in code, "État builderStep manquant"
assert "assembledBuilderPrompt" in code, "Générateur assembledBuilderPrompt manquant"
print("✅ Test Tâche 1 : Prompt Builder Wizard présent dans src/App.jsx")
```

**Étape 2 : Exécuter le test pour vérifier l'échec initial**
Exécuter : `python scripts/verify_phase6.py`
Résultat attendu : ÉCHEC (`AssertionError: État isBuilderOpen manquant`)

**Étape 3 : Implémenter le composant Prompt Builder dans `src/App.jsx`**
1. Ajouter le bouton "Assistant Guidé" dans la barre latérale et dans la Palette `⌘K`.
2. Créer l'état du wizard en 4 étapes :
   - Étape 1 : Définition du Persona Senior & Titre Métier.
   - Étape 2 : Définition des Entrées et Variables Interactives (`{{...}}`).
   - Étape 3 : Garde-fous, Règles Négatives et Contraintes de Rigueur.
   - Étape 4 : Schéma de Sortie Déterministe (`<structured_output_schema>`).
3. Générer en direct le bloc XML assemblé avec coloration syntaxique et bouton "Insérer dans l'Atelier".

**Étape 4 : Exécuter le test pour vérifier le succès**
Exécuter : `python scripts/verify_phase6.py`
Résultat attendu : SUCCÈS

---

### Tâche 2 : Simulateur / Sandbox de Sorties Attendues Multi-Modèles

**Fichiers :**
- Modifier : `src/App.jsx`
- Tester : `scripts/verify_phase6.py`

**Étape 1 : Ajouter les assertions pour le Simulateur de Sorties dans `scripts/verify_phase6.py`**
```python
assert "activeView === 'sandbox'" in code or "isSandboxOpen" in code, "Vue Sandbox/Simulateur manquante"
assert "simulatedOutput" in code, "Générateur de sortie simulée manquant"
print("✅ Test Tâche 2 : Simulateur de sorties multi-modèles présent dans src/App.jsx")
```

**Étape 2 : Exécuter le test pour vérifier l'échec initial**
Exécuter : `python scripts/verify_phase6.py`
Résultat attendu : ÉCHEC

**Étape 3 : Implémenter le Simulateur de Sorties dans `src/App.jsx`**
1. Ajouter un 4e onglet dans la barre d'outils du Workbench : `Simulation de Réponse` (icône Lucide `FlaskConical`).
2. Calculer une réponse simulée ultra-réaliste déduite du `<structured_output_schema>` et des variables renseignées pour le prompt actif.
3. Afficher les sélecteurs de style de modèle (Claude, ChatGPT, Gemini) modulant le ton et la granularité de la réponse simulée.
4. Bouton de copie rapide de la sortie simulée pour validation par l'utilisateur.

**Étape 4 : Exécuter le test pour vérifier le succès**
Exécuter : `python scripts/verify_phase6.py`
Résultat attendu : SUCCÈS

---

### Tâche 3 : Export Spécification d'Équipe & Fiche Technique Pro

**Fichiers :**
- Modifier : `src/App.jsx`
- Tester : `scripts/verify_phase6.py`

**Étape 1 : Ajouter l'assertion pour l'export de spécification d'équipe**
```python
assert "handleExportTeamSpec" in code, "Fonction handleExportTeamSpec manquante"
print("✅ Test Tâche 3 : Export de spécification technique présent")
```

**Étape 2 : Exécuter le test pour vérifier l'échec initial**
Exécuter : `python scripts/verify_phase6.py`
Résultat attendu : ÉCHEC

**Étape 3 : Implémenter la génération de la Fiche de Spécification dans `src/App.jsx`**
1. Ajouter le bouton "Fiche Technique Pro" dans la barre d'outils utilitaires.
2. Générer un document Markdown complet comprenant :
   - Cartouche d'en-tête (Nom du module, Catégorie, Modèles cibles, Score d'ingénierie `/100`, Date).
   - Tableau synthétique des variables et de leurs valeurs courantes.
   - Directives d'exécution et règles de sécurité.
   - Code complet prêt à l'emploi.
3. Téléchargement direct sous format `.md` structuré.

**Étape 4 : Exécuter le test et vérifier le build Vite**
Exécuter : `python scripts/verify_phase6.py; npm run build`
Résultat attendu : SUCCÈS (0 erreur, 0 emoji décoratif, build propre)

**Étape 5 : Commiter et déployer**
```bash
git add src/ scripts/ docs/plans/ contexte_projet.md
git commit -m "feat(phase6): prompt builder wizard, output sandbox simulation and team spec export"
git push origin main
```
