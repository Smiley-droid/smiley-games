# Smiley Games 🃏

Petit site (HTML/CSS/JS pur, sans dépendance) pour jouer et compter les points entre amis.

## Jeux pris en charge

- **Cinq Rois** — 13 manches, le score le plus **bas** gagne.
- **Flip 7** — objectif 200 points, le score le plus **haut** gagne (fin automatique dès qu'un joueur atteint le score cible).
- **Jeux personnalisés** — crée ton propre jeu : nom, sens du score, fin de partie (nombre de manches ou objectif de points), tout est réglable.
- **Undercover** — jeu de bluff et de déduction à un seul téléphone (mini-site dédié dans `/undercover`).

## Fonctionnalités

- Sélection et création de joueurs, **sauvegardés en local** (localStorage du navigateur, aucune donnée envoyée sur internet).
- Saisie manche par manche, totaux calculés automatiquement, meneur mis en évidence.
- Reprise automatique d'une partie en cours si vous fermez l'onglet.
- Historique des parties terminées.

## Utilisation

Ouvrez simplement `index.html` dans un navigateur, ou hébergez le dossier tel quel (par ex. avec GitHub Pages).

```
git clone <ce-dépôt>
cd <dossier>
python3 -m http.server 8000
# puis ouvrez http://localhost:8000
```

## Structure

- `index.html` — structure de la page et templates des vues
- `style.css` — thème visuel (table de jeu / feuille de marque)
- `app.js` — logique de l'application et gestion du localStorage
- `undercover/` — mini-site indépendant du jeu Undercover
