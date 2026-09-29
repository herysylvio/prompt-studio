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

# Accurate French descriptions mapped by title
DESCRIPTIONS_FR = {
    "Plan d'Action Stratégique de Marque Personnelle": (
        "Ce système complet permet de bâtir une autorité de marque personnelle incontournable dans votre secteur. "
        "Il analyse en profondeur vos compétences clés, votre histoire, votre audience cible et vos objectifs pour structurer une stratégie sur 90 jours : "
        "positionnement unique, piliers de contenu, plan de monétisation, calendrier de diffusion et tactiques de réseau d'influence."
    ),
    "Machine à Idées & Hooks LinkedIn": (
        "Génère un flux inépuisable d'idées de publications et d'accroches (hooks) percutantes pour LinkedIn conçues pour maximiser la portée organique et l'algorithme. "
        "Il décline votre thématique en 5 formats viraux : retours d'expérience et vulnérabilité, opinions tranchées (contrarian), guides pratiques étape par étape, "
        "études de cas concrètes et questions débat pour déclencher les commentaires."
    ),
    "Structure & Copywriting de Landing Page": (
        "Conçoit l'architecture complète et le copywriting persuasif d'une page de vente ou landing page à fort taux de conversion. "
        "En s'appuyant sur les principes de psychologie comportementale (formule PAS ou AIDA), il rédige le titre principal, les points de douleur, "
        "la promesse de transformation, les témoignages et preuves sociales, la ventilation de l'offre et les appels à l'action (CTA) irrésistibles."
    ),
    "Générateur de Titres Vidéo Viraux (YouTube/TikTok)": (
        "Développe des titres vidéo à taux de clic (CTR) exceptionnel pour YouTube, TikTok et Instagram Reels. "
        "Ce prompt applique les leviers psychologiques de la curiosité, du contraste dramatique, de l'urgence et de la promesse de bénéfice immédiat, "
        "tout en évitant le piège du clickbait déceptif pour garantir un temps de visionnage maximal."
    ),
    "Stratégie Globale de Marketing Digital 360°": (
        "Un plan stratégique marketing complet pour accélérer la croissance de votre entreprise. "
        "Ce cadre analyse votre positionnement, définit vos profils de clients idéaux (ICP), orchestre les canaux d'acquisition payants et organiques, "
        "aligne les tunnels de conversion et établit les indicateurs de performance (KPIs) essentiels pour piloter votre retour sur investissement."
    ),
    "Séquence Email d'Onboarding & Rétention Client": (
        "Rédige une séquence d'e-mails d'accueil et d'intégration automatisée en 5 à 7 étapes pour transformer vos nouveaux inscrits ou acheteurs en clients fidèles et ambassadeurs. "
        "Chaque e-mail est calibré pour offrir une victoire rapide (quick win), lever les frictions d'utilisation, créer un lien émotionnel fort et encourager le réachat ou la recommandation."
    ),
    "Générateur de Posts Réseaux Sociaux Multi-Plateformes": (
        "Transforme une idée, un article ou une actualité en une panoplie de publications adaptées aux codes spécifiques de chaque réseau social (LinkedIn, X/Twitter, Instagram, Facebook). "
        "Il adapte le ton, le formatage, la longueur, les sauts de ligne et les déclencheurs d'interaction pour captiver chaque communauté sans jamais faire de copié-collé paresseux."
    ),
    "Architecte de Tunnel de Vente & Conversion": (
        "Modélise un écosystème complet de tunnel de vente : de l'aimant à prospects (lead magnet) jusqu'à l'offre haut de gamme (high-ticket), en passant par les ventes incitatives (upsells/downsells). "
        "Ce prompt détaille chaque étape du parcours client, les messages clés de transition et les déclencheurs d'automatisation pour maximiser la valeur vie client (LTV)."
    ),
    "Page de Capture (Opt-In) à Haute Conversion": (
        "Crée des textes percutants et minimalistes pour vos pages de capture de leads. "
        "Il formule des promesses claires et focalisées sur un problème précis, élimine toute distraction superflue et maximise le taux d'inscription de vos visiteurs en échange de votre ressource gratuite (guide, template, webinaire)."
    ),
    "Piliers de Contenu & Autorité de Marque": (
        "Établit les fondations thématiques de votre stratégie éditoriale. "
        "Ce prompt décompose votre expertise en 3 à 5 piliers cardinaux, déclinés en sous-thématiques actionnables et en formats récurrents. "
        "Vous ne manquerez plus jamais d'inspiration et assurerez une cohérence totale de votre message sur tous vos canaux."
    ),
    "Architecte de Stratégie d'Engagement Réseaux Sociaux": (
        "Conçoit un plan d'action d'engagement communautaire sur-mesure : "
        "tactiques pour déclencher des commentaires qualifiés, modèles de réponses relationnelles et formats favorisant l'algorithme des plateformes sociales pour transformer des abonnés passifs en communauté active."
    ),
    "Analyseur de Contenu & Générateur d'Idées Dérivées": (
        "Déconstruit n'importe quel contenu textuel (style, structure, arguments clés, leviers d'engagement) "
        "et formule 3 nouveaux concepts de contenus originaux à fort impact sous des angles différenciants sans jamais plagier la source."
    )
}

def update_notion_pages():
    print("=== Mise à jour des descriptions françaises dans Notion ===")
    res = requests.post(f"https://api.notion.com/v1/databases/{DATABASE_ID}/query", headers=headers)
    pages = res.json().get("results", [])

    for p in pages:
        page_id = p["id"]
        title_prop = p["properties"]["Nom"]["title"]
        title = title_prop[0]["plain_text"] if title_prop else ""
        
        new_desc = DESCRIPTIONS_FR.get(title)
        if not new_desc:
            print(f"Skipping (no custom translation for): {title}")
            continue

        # Get page blocks to find callout
        b_res = requests.get(f"https://api.notion.com/v1/blocks/{page_id}/children", headers=headers)
        blocks = b_res.json().get("results", [])
        
        callout_block = next((b for b in blocks if b["type"] == "callout"), None)
        if callout_block:
            callout_id = callout_block["id"]
            patch_payload = {
                "callout": {
                    "rich_text": [{"type": "text", "text": {"content": new_desc[:1900]}}]
                }
            }
            patch_res = requests.patch(f"https://api.notion.com/v1/blocks/{callout_id}", headers=headers, json=patch_payload)
            if patch_res.status_code == 200:
                print(f" -> [NOTION MIS A JOUR] {title}")
            else:
                print(f" -> [ERREUR NOTION] {title}: {patch_res.text[:100]}")
        else:
            print(f" -> Pas de callout trouvé pour {title}")

def update_web_data():
    print("\n=== Mise à jour des données locales de la plateforme web ===")
    web_file = r"C:\Users\sylvi\DEV\ANTIGRAVITY\prompt-vault-web\src\data\prompts.json"
    with open(web_file, "r", encoding="utf-8") as f:
        prompts = json.load(f)

    for p in prompts:
        title = p["title_fr"]
        if title in DESCRIPTIONS_FR:
            p["description_fr"] = DESCRIPTIONS_FR[title]

    with open(web_file, "w", encoding="utf-8") as f:
        json.dump(prompts, f, ensure_ascii=False, indent=2)
    print(f"✅ Fichier web mis à jour avec les 12 descriptions traduites : {web_file}")

if __name__ == "__main__":
    update_notion_pages()
    update_web_data()
    print("\n🎉 Toutes les descriptions longues sont maintenant 100% en français !")
