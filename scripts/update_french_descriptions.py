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
    ),
    "Architecte Logiciel Full-Stack & Microservices": (
        "Génère du code prêt pour la production tout en imposant une intégrité architecturale stricte entre le frontend, le backend et les couches partagées. "
        "Analyse l'impact structurel, déclare les dépendances exactes, applique le typage fort et définit les tests unitaires et d'intégration nécessaires."
    ),
    "Débogueur Systématique & Résolution d'Erreurs": (
        "Applique la méthode scientifique au débogage logiciel pour résoudre les erreurs complexes sans tâtonner. "
        "Traduit les messages d'erreur cryptiques, formule des hypothèses classées par probabilité, conçoit des tests d'isolation par recherche binaire et corrige la cause racine."
    ),
    "Pipeline de Qualité de Code & CI/CD Linter": (
        "Configure un système complet d'automatisation de la qualité de code (linters, formateurs, hooks pre-commit Git et intégration IDE). "
        "Élimine les débats de style dans les pull requests et bloque les erreurs avant l'exécution grâce aux conventions éprouvées de l'industrie."
    ),
    "Direction Artistique de Publicités Luxe & Flacons": (
        "Conçoit des planches publicitaires éditoriales en 6 panneaux pour la haute parfumerie et les produits de luxe. "
        "Maîtrise les reflets du verre, l'éclairage studio dramatique, les textures nobles (marbre noir, or brossé, soie) et la mise en scène sensorielle."
    ),
    "Photographie de Portrait Cinématographique": (
        "Génère des portraits photographiques ultra-réalistes au rendu optique 85mm professionnel. "
        "Orchestrez la lumière dorée (golden hour), la profondeur de champ réduite (bokeh cinéma), le grain naturel de la peau et l'émotion du sujet sans aucun artefact synthétique."
    ),
    "Générateur de Mockups & Packaging Produits Photoréalistes": (
        "Transforme vos designs d'emballages en visualisations 3D photoréalistes haute définition (8K) en perspective 3/4. "
        "Restitue fidèlement les pliages, le grain des matériaux, la typographie sans distorsion et l'éclairage commercial en boîte à lumière."
    ),
    "Générateur d'Emails de Prospection B2B (Cold Outreach)": (
        "Crée des séquences de prospection à froid (email initial + 2 relances) conçues pour capter l'attention des décideurs en moins de 7 secondes. "
        "Élimine le jargon commercial au profit d'accroches personnalisées, de preuves sociales subtiles et d'appels à l'action conversationnels."
    ),
    "Script de Vidéo de Vente Haute Conversion (VSL)": (
        "Structure des scripts de vidéos de vente (Video Sales Letters) complets basés sur la psychologie de conversion directe. "
        "Enchaîne l'accroche de rupture, l'amplification du problème, la révélation du mécanisme unique, l'empilement de valeur et l'inversion du risque."
    ),
    "Diagnostic des Risques d'Échec de Vente & Closing": (
        "Analyse vos opportunités commerciales en cours pour détecter les signaux faibles d'échec avant qu'il ne soit trop tard. "
        "Évalue les dynamiques de pouvoir chez le client, les objections cachées et livre un plan de sauvetage tactique pour sécuriser la signature."
    ),
    "Clonage d'ADN Éditorial & Voix de Marque": (
        "Extrait l'empreinte linguistique exacte de vos textes (cadence des phrases, vocabulaire, figures de style, niveau d'autorité et transitions). "
        "Fournit un profil stylistique réutilisable permettant à l'IA d'écrire exactement comme vous sans jamais sonner générique."
    ),
    "Polisseur Littéraire & Amplificateur de Clarté": (
        "Sublime vos brouillons en éliminant les lourdeurs syntaxiques, la voix passive et les répétitions. "
        "Renforce l'impact de chaque paragraphe tout en préservant scrupuleusement l'intention, la personnalité et la voix de l'auteur."
    ),
    "Scripts de Vidéos Courtes Virales (Reels, TikTok, Shorts)": (
        "Conçoit des scripts de vidéos verticales calibrés pour la rétention algorithmique maximale. "
        "Combine un hook visuel et sonore dans les 3 premières secondes, des ruptures de rythme (pattern interrupts) toutes les 5 secondes et une boucle finale favorisant le revisionnage."
    ),
    "Audit & Optimisation Référencement Naturel (SEO On-Page)": (
        "Réalise un diagnostic SEO On-Page complet de vos pages web : alignement avec l'intention de recherche, hiérarchie des balises H1-H3, densité sémantique, optimisation des méta-données et recommandations de maillage interne."
    ),
    "Analyse des Gaps de Contenu & Opportunités SEO": (
        "Compare votre couverture thématique à celle de vos concurrents pour révéler les angles morts à fort trafic. "
        "Priorise les sujets à créer ou à mettre à jour selon leur potentiel de positionnement rapide et leur valeur commerciale."
    ),
    "Rédacteur d'Articles Sémantiques & SEO Neutre": (
        "Rédige des articles de fond optimisés pour les moteurs de recherche et les lecteurs exigeants. "
        "Déploie un champ lexical riche, répond directement aux intentions de recherche secondaires (People Also Ask) et évite toutes les formules artificielles."
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

def update_web_data():
    import os
    print("\n=== Mise à jour des données locales de la plateforme web ===")
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    web_file = os.path.join(base_dir, "src", "data", "prompts.json")
    with open(web_file, "r", encoding="utf-8") as f:
        prompts = json.load(f)

    for p in prompts:
        title = p["title_fr"]
        if title in DESCRIPTIONS_FR:
            p["description_fr"] = DESCRIPTIONS_FR[title]

    with open(web_file, "w", encoding="utf-8") as f:
        json.dump(prompts, f, ensure_ascii=False, indent=2)
    print(f"✅ Fichier web mis à jour avec toutes les descriptions 100% françaises : {web_file}")

if __name__ == "__main__":
    update_notion_pages()
    update_web_data()
    print("\n🎉 Toutes les descriptions longues sont maintenant 100% en français !")
