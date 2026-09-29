import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

NOTION_TOKEN = "ntn_b98836118154XOYPfEGE87M6X54OaCvW44fCKPk6kvtfjq"
DATABASE_ID = "3ea24d1b-f2a7-8148-b48a-d24b6f57cad5"

headers = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
}

GUIDES_FR = {
    "Plan d'Action Stratégique de Marque Personnelle": (
        "La régularité prime sur la perfection. Choisissez un canal principal d'autorité (ex: LinkedIn ou YouTube) et un canal de rétention intime (comme une newsletter). "
        "Utilisez la feuille de route sur 90 jours générée par ce prompt pour concentrer vos efforts sans vous disperser."
    ),
    "Machine à Idées & Hooks LinkedIn": (
        "L'accroche (les 2 premières lignes avant le bouton 'voir plus') détermine 80 % du succès d'une publication. "
        "Utilisez les structures fournies pour briser le défilement (pattern interrupt) avec une affirmation courte, contre-intuitive ou chiffrée qui donne envie de lire la suite."
    ),
    "Structure & Copywriting de Landing Page": (
        "La clé d'une landing page rentable réside dans la clarté immédiate de la section héro (au-dessus de la ligne de flottaison). "
        "Utilisez les titres et sous-titres générés pour que n'importe quel visiteur comprenne en 5 secondes ce que vous faites et pourquoi il doit agir maintenant."
    ),
    "Générateur de Titres Vidéo Viraux (YouTube/TikTok)": (
        "Testez toujours 3 à 5 variantes de titres avant de publier. "
        "Associez toujours un titre basé sur la curiosité à une miniature contrastée qui complète la promesse visuellement sans répéter bêtement les mêmes mots."
    ),
    "Stratégie Globale de Marketing Digital 360°": (
        "Ce plan d'action sert de feuille de route trimestrielle. "
        "Renseignez votre budget approximatif et vos ressources actuelles pour que l'IA priorise les leviers d'acquisition les plus rentables avant de déployer des tactiques secondaires."
    ),
    "Séquence Email d'Onboarding & Rétention Client": (
        "Les 48 premières heures après l'inscription sont cruciales. "
        "Veillez à ce que le premier email délivre immédiatement l'accès promis et une victoire rapide (quick win) en moins de 3 minutes pour créer un effet waouh instantané."
    ),
    "Générateur de Posts Réseaux Sociaux Multi-Plateformes": (
        "Au lieu de publier le même message partout, ce prompt adapte le rythme et la structure : "
        "des accroches tranchées pour X/Twitter, un storytelling aéré pour LinkedIn, et des résumés visuels orientés engagement pour Instagram."
    ),
    "Architecte de Tunnel de Vente & Conversion": (
        "Ce framework est conçu pour aligner la valeur perçue à chaque palier. "
        "Utilisez-le pour concevoir vos offres complémentaires (upsells) et vos séquences de relance. Assurez-vous de renseigner vos sources de trafic réelles pour obtenir des transitions adaptées."
    ),
    "Page de Capture (Opt-In) à Haute Conversion": (
        "Concentrez-vous sur un problème unique et urgent. "
        "Votre ressource gratuite (lead magnet) doit promettre une solution immédiate. Ce prompt structure une proposition de valeur limpide avec des puces promesses qui éliminent les hésitations du visiteur."
    ),
    "Piliers de Contenu & Autorité de Marque": (
        "Pour un résultat optimal, ne restez pas trop généraliste : précisez vos 2 ou 3 compétences distinctives et les objections fréquentes de vos clients. "
        "Ce prompt vous fournira une matrice thématique équilibrée entre posts éducatifs, histoires inspirantes et preuves d'autorité."
    ),
    "Architecte de Stratégie d'Engagement Réseaux Sociaux": (
        "À utiliser pour débloquer la croissance de vos comptes sociaux quand les publications manquent d'interactions. "
        "Renseignez précisément votre niche et votre voix de marque pour obtenir un système d'engagement conversationnel concret et des modèles de réponses réutilisables."
    ),
    "Analyseur de Contenu & Générateur d'Idées Dérivées": (
        "Ce prompt est idéal pour alimenter votre calendrier éditorial hebdomadaire. "
        "Prenez un contenu qui a déjà fait ses preuves (votre meilleur article, un post viral de votre secteur, ou une transcription de podcast) et laissez l'IA dégager la moelle épinière stratégique pour vous générer 3 nouveaux angles prêts à rédiger."
    )
}

def update_web_guides():
    print("1. Mise à jour de l'application Web locale...", flush=True)
    web_file = r"C:\Users\sylvi\DEV\ANTIGRAVITY\prompt-vault-web\src\data\prompts.json"
    with open(web_file, "r", encoding="utf-8") as f:
        prompts = json.load(f)

    for p in prompts:
        title = p["title_fr"]
        if title in GUIDES_FR:
            p["guide_fr"] = GUIDES_FR[title]

    with open(web_file, "w", encoding="utf-8") as f:
        json.dump(prompts, f, ensure_ascii=False, indent=2)
    print(f" -> Application web mise a jour avec succes ({len(prompts)} prompts).", flush=True)

def update_notion_guides():
    print("2. Mise à jour des pages Notion...", flush=True)
    try:
        res = requests.post(f"https://api.notion.com/v1/databases/{DATABASE_ID}/query", headers=headers, timeout=10)
        pages = res.json().get("results", [])
    except Exception as e:
        print(f"Error querying Notion DB: {e}", flush=True)
        return

    for p in pages:
        page_id = p["id"]
        title_prop = p["properties"]["Nom"]["title"]
        title = title_prop[0]["plain_text"] if title_prop else ""
        guide_text = GUIDES_FR.get(title)
        if not guide_text:
            continue

        try:
            b_res = requests.get(f"https://api.notion.com/v1/blocks/{page_id}/children", headers=headers, timeout=10)
            blocks = b_res.json().get("results", [])

            guide_idx = -1
            for i, b in enumerate(blocks):
                if b.get("type") == "heading_2":
                    rt = b["heading_2"].get("rich_text", [])
                    h_text = rt[0]["plain_text"] if rt else ""
                    if "Guide" in h_text or "Conseil" in h_text:
                        guide_idx = i
                        break
            
            if guide_idx != -1:
                # Find paragraphs right after this heading
                paragraph_blocks = [b for b in blocks[guide_idx+1:] if b.get("type") == "paragraph"]
                if paragraph_blocks:
                    # Update first paragraph
                    first_p_id = paragraph_blocks[0]["id"]
                    requests.patch(
                        f"https://api.notion.com/v1/blocks/{first_p_id}",
                        headers=headers,
                        json={"paragraph": {"rich_text": [{"type": "text", "text": {"content": guide_text}}]}},
                        timeout=10
                    )
                    # Delete subsequent paragraphs under this section
                    for extra_p in paragraph_blocks[1:]:
                        requests.delete(f"https://api.notion.com/v1/blocks/{extra_p['id']}", headers=headers, timeout=10)
                    print(f" -> [NOTION OK] {title}", flush=True)
                else:
                    # Append paragraph
                    requests.patch(
                        f"https://api.notion.com/v1/blocks/{page_id}/children",
                        headers=headers,
                        json={"children": [{"object": "block", "type": "paragraph", "paragraph": {"rich_text": [{"type": "text", "text": {"content": guide_text}}]}}]},
                        timeout=10
                    )
                    print(f" -> [NOTION AJOUTE] {title}", flush=True)
        except Exception as e:
            print(f"Error on {title}: {e}", flush=True)

if __name__ == "__main__":
    update_web_guides()
    update_notion_guides()
    print("Termine avec succes !", flush=True)
