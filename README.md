# Smiley Games 🃏

Petit site (HTML/CSS/JS pur, sans dépendance) pour jouer et compter les points entre amis.

## Jeux pris en charge

- **Cinq Rois** — 11 manches, le score le plus **bas** gagne.
- **Le Roi des Nains** — 7 donnes, le score le plus **haut** gagne.
- **La Caracole** — combinaisons de cartes (le 8 vaut 0), objectif 100 points, le score le plus **bas** gagne.
- **Flip 7** — objectif 200 points, le score le plus **haut** gagne (fin automatique dès qu'un joueur atteint le score cible).
- **Tarot** — le preneur contre la défense, scores positifs ou négatifs, le plus **haut** gagne.
- **Belote** — par équipes de 2, objectif 501 points, le plus **haut** gagne.
- **Rami** — suites et brelans, le score le plus **bas** gagne.
- **Skyjo** — grille de cartes cachées, objectif 100, le plus **bas** gagne.
- **Uno** — premier à vider sa main marque 0, objectif 500, le plus **bas** gagne.
- **Yams** — 13 catégories de dés, le score le plus **haut** gagne.
- **Jeux personnalisés** — crée ton propre jeu : nom, sens du score, fin de partie (nombre de manches ou objectif de points), scores négatifs ou non, tout est réglable.
- **Undercover** — jeu de bluff et de déduction à un seul téléphone (mini-site dédié dans `/undercover`).
- **Loup-Garou** — rôles cachés, phases nuit/jour, meneur de jeu automatique (mini-site dédié dans `/loup-garou`).

## Fonctionnalités

- Sélection et création de joueurs, **sauvegardés en local** (localStorage du navigateur, aucune donnée envoyée sur internet).
- **Statistiques par joueur** : victoires, score moyen, série de victoires en cours.
- **Thème de table** : vert, bordeaux, bleu nuit, ou mode clair.
- Saisie manche par manche, totaux calculés automatiquement, meneurs mis en évidence (gère les égalités).
- Ajout/retrait de joueurs en cours de partie.
- Import/export d'une partie via un code texte.
- Reprise automatique d'une partie en cours si vous fermez l'onglet.
- Historique des parties terminées.
- Recherche parmi les jeux disponibles.

## Utilisation

Le site est accessible en ligne. Ce dépôt est public uniquement pour permettre l'hébergement via GitHub Pages — voir la section Licence ci-dessous.

## Structure

- `index.html` — structure de la page et templates des vues
- `style.css` — thème visuel (table de jeu / feuille de marque)
- `app.js` — logique de l'application et gestion du localStorage
- `undercover/` — mini-site indépendant du jeu Undercover
- `loup-garou/` — mini-site indépendant du jeu Loup-Garou

## Licence

© 2026 Smiley-droid — **Tous droits réservés.**

Ce dépôt est public uniquement pour des raisons techniques (hébergement GitHub Pages). Cela ne constitue **aucune autorisation** de copier, réutiliser, redistribuer ou modifier ce code, en tout ou partie. Voir le fichier [`LICENSE`](./LICENSE) pour le détail des conditions.

