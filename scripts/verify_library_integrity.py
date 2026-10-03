import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

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

    print("✅ OK: 108 prompts verified across all 9 categories (12 per category)!")

if __name__ == "__main__":
    test_library_108_prompts()
