import os
import re
import sys

sys.stdout.reconfigure(encoding="utf-8")

def verify_phase7():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    app_file = os.path.join(base_dir, "src", "App.jsx")

    with open(app_file, "r", encoding="utf-8") as f:
        app_code = f.read()

    # 1. Benchmarking View assertions
    assert "activeView === 'benchmark'" in app_code, "Vue activeView === 'benchmark' manquante dans src/App.jsx"
    assert "benchmarkCostEstimate" in app_code, "Calculateur benchmarkCostEstimate manquant dans src/App.jsx"
    print("✅ SUCCÈS Tâche 1 : Vue de Benchmarking & Estimateur de Coûts présents.")

    # 2. Multi-Axes Rigor Audit assertions
    assert "benchmarkAuditReport" in app_code, "Audit multi-axes benchmarkAuditReport manquant dans src/App.jsx"
    print("✅ SUCCÈS Tâche 2 : Audit de Rigueur Multi-Axes présent.")

    # 3. A/B Variant Comparator & Export assertions
    assert "benchmarkVariantB" in app_code, "Gestionnaire de variante B benchmarkVariantB manquant dans src/App.jsx"
    assert "handleExportBenchmarkReport" in app_code, "Export handleExportBenchmarkReport manquant dans src/App.jsx"
    print("✅ SUCCÈS Tâche 3 : Comparateur A/B & Export de Rapport présents.")

    # 4. Zero decorative emoji check in src/App.jsx
    emoji_pattern = re.compile(r"[\U0001F300-\U0001FAFF]")
    emojis_found = emoji_pattern.findall(app_code)
    assert not emojis_found, f"Emojis décoratifs détectés dans src/App.jsx : {emojis_found}"
    print("✅ SUCCÈS : 0 emoji décoratif dans src/App.jsx (100% SVG Lucide).")

if __name__ == "__main__":
    verify_phase7()
