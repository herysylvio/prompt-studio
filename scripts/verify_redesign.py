import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

def verify_redesign():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    app_file = os.path.join(base_dir, "src", "App.jsx")
    css_file = os.path.join(base_dir, "src", "index.css")

    with open(app_file, "r", encoding="utf-8") as f:
        app_code = f.read()

    with open(css_file, "r", encoding="utf-8") as f:
        css_code = f.read()

    # 1. Navigation globale et états
    assert "mainNavView" in app_code, "État mainNavView manquant dans src/App.jsx"
    assert "ps-global-nav" in app_code or "ps-global-nav" in css_code, "Navigation globale ps-global-nav manquante"
    print("✅ SUCCÈS Tâche 1 : Routeur d'état mainNavView et navigation globale présents.")

    # 2. Landing Page Hero et Bento Grid
    assert "ps-landing-hero" in app_code, "Composant/Section ps-landing-hero manquant dans src/App.jsx"
    assert "ps-bento-grid" in app_code, "Section Bento Grid des piliers manquante dans src/App.jsx"
    print("✅ SUCCÈS Tâche 2 : Landing Page avec Hero et Bento Grid présents.")

    # 3. Bibliothèque en grille aérée
    assert "ps-library-grid" in app_code or "ps-library-grid" in css_code, "Grille de bibliothèque ps-library-grid manquante"
    print("✅ SUCCÈS Tâche 3 : Bibliothèque structurée en cartes aérées présente.")

    # 4. Zéro emoji décoratif dans src/App.jsx
    emoji_pattern = re.compile(r"[\U0001F300-\U0001FAFF]")
    emojis_found = emoji_pattern.findall(app_code)
    assert not emojis_found, f"Emojis décoratifs détectés dans src/App.jsx : {emojis_found}"
    print("✅ SUCCÈS : 0 emoji décoratif dans src/App.jsx (100% SVG Lucide).")

if __name__ == "__main__":
    verify_redesign()
