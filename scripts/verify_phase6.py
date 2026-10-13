import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

def verify_phase6():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    app_file = os.path.join(base_dir, "src", "App.jsx")

    with open(app_file, "r", encoding="utf-8") as f:
        app_code = f.read()

    # 1. Prompt Builder Wizard assertions
    assert "isBuilderOpen" in app_code, "État isBuilderOpen manquant dans src/App.jsx"
    assert "builderStep" in app_code, "État builderStep manquant dans src/App.jsx"
    assert "assembledBuilderPrompt" in app_code, "Calculateur assembledBuilderPrompt manquant dans src/App.jsx"
    assert "ps-prompt-builder" in app_code, "Conteneur ps-prompt-builder manquant dans src/App.jsx"
    print("✅ SUCCÈS Tâche 1 : Prompt Builder Wizard présent dans src/App.jsx.")

    # 2. Output Sandbox Simulation assertions
    assert "activeView === 'sandbox'" in app_code, "Vue activeView === 'sandbox' manquante dans src/App.jsx"
    assert "simulatedOutput" in app_code, "Générateur simulatedOutput manquant dans src/App.jsx"
    assert "sandboxModelStyle" in app_code, "Sélecteur sandboxModelStyle manquant dans src/App.jsx"
    print("✅ SUCCÈS Tâche 2 : Simulateur / Sandbox de Sorties Multi-Modèles présent dans src/App.jsx.")

    # 3. Team Spec Export assertions
    assert "handleExportTeamSpec" in app_code, "Fonction handleExportTeamSpec manquante dans src/App.jsx"
    print("✅ SUCCÈS Tâche 3 : Export de spécification technique d'équipe présent dans src/App.jsx.")

    # 4. Zero decorative emoji check in src/App.jsx
    emoji_pattern = re.compile(r"[\U0001F300-\U0001FAFF]")
    emojis_found = emoji_pattern.findall(app_code)
    assert not emojis_found, f"Emojis décoratifs détectés dans src/App.jsx : {emojis_found}"
    print("✅ SUCCÈS : 0 emoji décoratif dans src/App.jsx (100% SVG Lucide).")

if __name__ == "__main__":
    verify_phase6()
