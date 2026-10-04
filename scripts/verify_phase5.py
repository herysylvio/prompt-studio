import json
import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

def verify_phase5():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    prompts_file = os.path.join(base_dir, "src", "data", "prompts.json")
    playbooks_file = os.path.join(base_dir, "src", "data", "playbooks.json")
    app_file = os.path.join(base_dir, "src", "App.jsx")

    # 1. Verify 144 prompts across 12 categories (12 each)
    with open(prompts_file, "r", encoding="utf-8") as f:
        prompts = json.load(f)

    assert len(prompts) == 144, f"Attendu 144 prompts, trouvé {len(prompts)}"
    categories = {}
    for p in prompts:
        cat = p.get("category")
        categories[cat] = categories.get(cat, 0) + 1
        assert "url" not in p, f"URL externe détectée dans {p['id']}"
        assert p.get("optimized_prompt"), f"optimized_prompt manquant dans {p['id']}"
        if cat in ("Automation", "Business", "Finance", "Ecommerce", "Operations", "Media"):
            assert "<system_role>" in p.get("optimized_prompt", ""), f"Balise XML <system_role> manquante dans {p['id']}"
            assert "<execution_guidelines>" in p.get("optimized_prompt", ""), f"Balise XML <execution_guidelines> manquante dans {p['id']}"
            assert "<structured_output_schema>" in p.get("optimized_prompt", ""), f"Balise XML <structured_output_schema> manquante dans {p['id']}"
        assert p.get("title_fr"), f"Titre FR manquant dans {p['id']}"
        assert p.get("description_fr"), f"Description FR manquante dans {p['id']}"

    assert len(categories) == 12, f"Attendu 12 catégories, trouvé {len(categories)}: {categories}"
    for cat, count in categories.items():
        assert count == 12, f"Catégorie {cat} contient {count} prompts au lieu de 12"
    print("✅ SUCCÈS Tâche 1 : 144 prompts répartis en 12 catégories x 12, 100% marque blanche.")

    # 2. Verify 9 playbooks (45 steps total)
    with open(playbooks_file, "r", encoding="utf-8") as f:
        playbooks = json.load(f)

    assert len(playbooks) == 9, f"Attendu 9 playbooks, trouvé {len(playbooks)}"
    prompt_ids = {p["id"] for p in prompts}
    for pb in playbooks:
        assert len(pb.get("steps", [])) == 5, f"Playbook {pb['id']} doit avoir 5 étapes"
        for step in pb["steps"]:
            assert step["promptId"] in prompt_ids, f"Prompt ID {step['promptId']} introuvable dans {pb['id']}"
    print("✅ SUCCÈS Tâche 2 : 9 Playbooks multi-étapes valides (45 étapes reliées).")

    # 3. Verify Command Palette Cmd+K in App.jsx
    with open(app_file, "r", encoding="utf-8") as f:
        app_code = f.read()

    assert "isCommandPaletteOpen" in app_code, "État isCommandPaletteOpen manquant dans src/App.jsx"
    assert "ps-command-palette" in app_code, "Conteneur ps-command-palette manquant dans src/App.jsx"
    print("✅ SUCCÈS Tâche 3 : Palette de Commande ⌘K présente dans src/App.jsx.")

    # 4. Verify Quality Score, Split-View, Recent History & 12 categories in App.jsx
    assert "RECENT_HISTORY" in app_code, "Clé STORAGE_KEYS.RECENT_HISTORY manquante dans src/App.jsx"
    assert "promptQualityReport" in app_code, "Calculateur promptQualityReport manquant dans src/App.jsx"
    assert "activeView === 'split'" in app_code, "Mode Comparaison Split-View manquant dans src/App.jsx"
    for new_cat in ["Ecommerce", "Operations", "Media"]:
        assert f"id: '{new_cat}'" in app_code, f"Catégorie {new_cat} manquante dans la sidebar de src/App.jsx"

    # Zero decorative emoji check in src/App.jsx
    emoji_pattern = re.compile(r"[\U0001F300-\U0001FAFF]")
    emojis_found = emoji_pattern.findall(app_code)
    assert not emojis_found, f"Emojis décoratifs détectés dans src/App.jsx : {emojis_found}"
    print("✅ SUCCÈS Tâche 4 : Score de Précision, Mode Split-View, Historique des Copies et 0 emoji décoratif dans src/App.jsx.")

if __name__ == "__main__":
    verify_phase5()
