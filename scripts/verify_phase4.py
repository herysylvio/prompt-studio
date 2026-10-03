import json
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def test_phase4():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    prompts_file = os.path.join(base_dir, "src", "data", "prompts.json")
    playbooks_file = os.path.join(base_dir, "src", "data", "playbooks.json")
    index_html_file = os.path.join(base_dir, "index.html")
    favicon_file = os.path.join(base_dir, "public", "favicon.svg")

    assert os.path.exists(playbooks_file), "Missing src/data/playbooks.json"

    with open(prompts_file, "r", encoding="utf-8") as f:
        prompts = json.load(f)
    prompt_ids = {p["id"] for p in prompts}

    with open(playbooks_file, "r", encoding="utf-8") as f:
        playbooks = json.load(f)

    assert len(playbooks) == 6, f"Expected 6 playbooks, got {len(playbooks)}"

    for pb in playbooks:
        assert pb.get("id"), "Playbook missing id"
        assert pb.get("title_fr"), f"Playbook {pb.get('id')} missing title_fr"
        assert pb.get("description_fr"), f"Playbook {pb.get('id')} missing description_fr"
        steps = pb.get("steps", [])
        assert len(steps) == 5, f"Playbook {pb['id']} should have 5 steps, got {len(steps)}"
        for step in steps:
            pid = step.get("promptId")
            assert pid in prompt_ids, f"Playbook {pb['id']} references unknown promptId: {pid}"
            assert step.get("stepTitle"), f"Playbook {pb['id']} step missing stepTitle"
            assert step.get("transitionNote"), f"Playbook {pb['id']} step missing transitionNote"

    with open(index_html_file, "r", encoding="utf-8") as f:
        html_content = f.read()
    assert 'lang="fr"' in html_content, "index.html must use lang=\"fr\""
    assert "Prompt Studio" in html_content, "index.html must contain Prompt Studio title"
    assert "prompt-vault-web" not in html_content, "index.html still contains old prompt-vault-web title"
    assert os.path.exists(favicon_file), "Missing public/favicon.svg"

    print("✅ OK: Phase 4 verified (6 Playbooks with 30 valid steps, French index.html, and custom SVG favicon)!")

if __name__ == "__main__":
    test_phase4()
