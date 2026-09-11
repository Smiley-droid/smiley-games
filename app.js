/* =========================================================
   Smiley Games — Cinq Rois, Flip 7 & jeux personnalisés
   Stockage 100% local (localStorage), aucune donnée réseau.
   © 2026 Smiley-droid — Tous droits réservés.
   Aucune copie, reproduction, distribution ou réutilisation de ce
   code n'est autorisée sans permission écrite préalable. Voir /LICENSE.
   ========================================================= */

const STORAGE_KEYS = {
  players: 'mp_players_v1',
  currentGame: 'mp_current_game_v1',
  history: 'mp_history_v1',
  customGames: 'mp_custom_games_v1'
};

/* Jeux intégrés. endMode: 'rounds' (nombre de manches fixe) ou 'target' (objectif de points).
   direction: 'asc' = le score le plus bas gagne, 'desc' = le score le plus haut gagne. */
const BUILTIN_GAMES = {
  cinqrois: {
    label: 'Cinq Rois',
    suit: '♦',
    direction: 'asc',
    endMode: 'rounds',
    defaultRounds: 11,
    roundWord: 'Manche',
    allowNegative: false
  },
  flip7: {
    label: 'Flip 7',
    suit: '♥',
    direction: 'desc',
    endMode: 'target',
    defaultTarget: 200,
    roundWord: 'Tour',
    allowNegative: false
  },
  roidesnains: {
    label: 'Le Roi des Nains',
    suit: '👑',
    direction: 'desc',
    endMode: 'rounds',
    defaultRounds: 7,
    roundWord: 'Donne',
    allowNegative: true
  },
  caracole: {
    label: 'La Caracole',
    suit: '🐌',
    direction: 'asc',
    endMode: 'target',
    defaultTarget: 100,
    roundWord: 'Manche',
    allowNegative: false
  },
  tarot: {
    label: 'Tarot',
    suit: '🃏',
    direction: 'desc',
    endMode: 'rounds',
    defaultRounds: 4,
    roundWord: 'Donne',
    allowNegative: true
  },
  belote: {
    label: 'Belote',
    suit: '♣',
    direction: 'desc',
    endMode: 'target',
    defaultTarget: 501,
    roundWord: 'Donne',
    allowNegative: true
  },
  rami: {
    label: 'Rami',
    suit: '♠',
    direction: 'asc',
    endMode: 'rounds',
    defaultRounds: 10,
    roundWord: 'Manche',
    allowNegative: false
  },
  skyjo: {
    label: 'Skyjo',
    suit: '🎯',
    direction: 'asc',
    endMode: 'target',
    defaultTarget: 100,
    roundWord: 'Manche',
    allowNegative: true
  },
  uno: {
    label: 'Uno',
    suit: '🔄',
    direction: 'asc',
    endMode: 'target',
    defaultTarget: 500,
    roundWord: 'Manche',
    allowNegative: false
  },
  yams: {
    label: 'Yams',
    suit: '🎲',
    direction: 'desc',
    endMode: 'rounds',
    defaultRounds: 13,
    roundWord: 'Catégorie',
    allowNegative: false
  },
  president: {
    label: 'Le Président',
    suit: '🥇',
    direction: 'desc',
    endMode: 'rounds',
    defaultRounds: 10,
    roundWord: 'Manche',
    allowNegative: true
  },
  millebornes: {
    label: 'Mille Bornes',
    suit: '🚗',
    direction: 'desc',
    endMode: 'target',
    defaultTarget: 1000,
    roundWord: 'Manche',
    allowNegative: false
  },
  poker: {
    label: 'Poker',
    suit: '🎰',
    direction: 'desc',
    endMode: 'rounds',
    defaultRounds: 20,
    roundWord: 'Main',
    allowNegative: true
  },
  kaid: {
    label: 'Bataille Corse (Kaïd)',
    suit: '🏔️',
    direction: 'desc',
    endMode: 'rounds',
    defaultRounds: 8,
    roundWord: 'Manche',
    allowNegative: false
  },
  killer: {
    label: 'Killer',
    suit: '🗡️',
    direction: 'desc',
    endMode: 'rounds',
    defaultRounds: 10,
    roundWord: 'Manche',
    allowNegative: false
  },
  cinqcents: {
    label: '500 (Cinq Cents)',
    suit: '5️⃣',
    direction: 'desc',
    endMode: 'target',
    defaultTarget: 500,
    roundWord: 'Manche',
    allowNegative: true
  }
};

/* ---------- Stockage local ---------- */
const store = {
  get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error('Erreur de lecture localStorage', e);
      return fallback;
    }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.error("Erreur d'écriture localStorage", e); }
  },
  remove(key) { localStorage.removeItem(key); }
};

function getPlayers() { return store.get(STORAGE_KEYS.players, []); }
function savePlayers(list) { store.set(STORAGE_KEYS.players, list); }
function getCurrentGame() { return store.get(STORAGE_KEYS.currentGame, null); }
function saveCurrentGame(game) { store.set(STORAGE_KEYS.currentGame, game); }
function clearCurrentGame() { store.remove(STORAGE_KEYS.currentGame); }
function getHistory() { return store.get(STORAGE_KEYS.history, []); }
function saveHistory(list) { store.set(STORAGE_KEYS.history, list); }
function getCustomGames() { return store.get(STORAGE_KEYS.customGames, []); }
function saveCustomGames(list) { store.set(STORAGE_KEYS.customGames, list); }

function uid() { return Math.random().toString(36).slice(2, 10); }

function ensurePlayer(name) {
  const players = getPlayers();
  const clean = name.trim();
  if (!clean) return null;
  let existing = players.find(p => p.name.toLowerCase() === clean.toLowerCase());
  if (existing) return existing;
  const p = { id: uid(), name: clean, createdAt: Date.now() };
  players.push(p);
  savePlayers(players);
  return p;
}

/* Normalise un type de jeu (intégré ou personnalisé "custom:<id>") en un objet
   { label, suit, direction, endMode, defaultRounds, defaultTarget, roundWord, custom } */
function getGameDef(type) {
  if (BUILTIN_GAMES[type]) {
    return Object.assign({ custom: false, id: type }, BUILTIN_GAMES[type]);
  }
  if (typeof type === 'string' && type.startsWith('custom:')) {
    const id = type.slice(7);
    const cg = getCustomGames().find(g => g.id === id);
    if (!cg) return null;
    return {
      custom: true,
      id: cg.id,
      label: cg.name,
      suit: cg.suit || '★',
      direction: cg.direction,
      endMode: cg.endMode,
      defaultRounds: cg.roundsCount,
      defaultTarget: cg.target,
      roundWord: cg.roundWord || 'Manche',
      allowNegative: !!cg.allowNegative
    };
  }
  return null;
}

function roundLabel(gameDef, n) { return `${gameDef.roundWord} ${n}`; }

/* ---------- Règles des jeux (affichées via le bouton "?") ---------- */
const BUILTIN_RULES = {
  fr: {
    cinqrois: `<p>11 manches, une par nombre de cartes distribuées (de 3 à 13). Chaque manche, on cherche à se débarrasser de sa main en formant des <strong>suites</strong> (cartes qui se suivent, même couleur) et des <strong>familles</strong> (même valeur, couleurs différentes).</p>
    <p>À la fin de chaque manche, les cartes qui restent en main comptent en points de pénalité (figures = 10, As = 1, etc. selon vos règles de table). Le score le plus <strong>bas</strong> à la fin des 11 manches gagne.</p>`,
    flip7: `<p>Jeu de prise de risque : à chaque tour, on retourne des cartes une par une et on peut s'arrêter ("rester") ou continuer ("flip"). Si on retourne deux fois la même valeur, on est éliminé du tour sans marquer de points.</p>
    <p>Réunir 7 cartes différentes dans un tour rapporte un bonus de +15. Premier joueur à atteindre <strong>200 points</strong> (score le plus haut) déclenche la fin de la partie.</p>`,
    roidesnains: `<p>7 donnes, chacune avec une "quête" différente (annoncée avant de jouer) qui détermine comment les points sont gagnés ou perdus ce tour-là — d'où la possibilité de scores négatifs.</p>
    <p>Après les 7 donnes, le total le plus <strong>haut</strong> gagne.</p>`,
    caracole: `<p>Jeu de combinaisons (52 cartes) : paires, brelans, carrés, ou suites de 3+ cartes de même couleur à poser sur la pile. Un joueur peut "caracoler" quand il lui reste 10 points ou moins en main.</p>
    <p>Valeur des cartes : 1 à 7 = leur valeur, <strong>8 = 0</strong>, Valet = 11, Dame = 12, Roi = 13. Le vainqueur de la manche marque 0, le "caracoleur" qui ne gagne pas prend 30 points de pénalité, les autres marquent les points restant en main.</p>
    <p>Dès qu'un joueur <strong>dépasse 100 points</strong> au total, la partie s'arrête : le total le plus <strong>bas</strong> gagne.</p>`,
    tarot: `<p>Jeu à 4 (ou 3/5) joueurs avec le Fou, les 21 atouts et les rois. À chaque donne, un joueur (le "preneur") annonce un contrat et joue seul contre les autres, qui font "défense".</p>
    <p>Selon le nombre de points au Bout ramassés, le preneur gagne ou perd des points — qui viennent en négatif/positif selon les cas, d'où l'utilité des scores négatifs. Sur plusieurs donnes, le total le plus <strong>haut</strong> gagne.</p>`,
    belote: `<p>Traditionnellement en 2 équipes de 2. Chaque donne, une couleur est choisie comme atout (par annonce ou "prise"), et l'équipe qui prend doit ramasser plus de la moitié des 162 points de la donne (ou faire une "belote-rebelote", un "capot", etc.).</p>
    <p>Comme l'appli compte par "joueur", utilisez un nom par équipe (ex. "Nous" / "Eux"). Premier total à atteindre <strong>501 points</strong> gagne.</p>`,
    rami: `<p>Chaque joueur essaie de se débarrasser de sa main en formant des combinaisons : <strong>suites</strong> (cartes qui se suivent, même couleur) et <strong>brelans/carrés</strong> (même valeur).</p>
    <p>À la fin d'une manche, les cartes qui restent en main comptent en pénalité. Après plusieurs manches, le score le plus <strong>bas</strong> gagne.</p>`,
    skyjo: `<p>Chaque joueur a une grille de 12 cartes face cachée (valeurs de -2 à 12) et en retourne progressivement en piochant/défaussant, en essayant d'avoir le total le plus bas.</p>
    <p>Dès qu'un joueur retourne sa dernière carte, un ultime tour est joué puis les grilles sont révélées. Dès qu'un total <strong>atteint 100</strong>, la partie s'arrête : le plus <strong>bas</strong> total gagne.</p>`,
    uno: `<p>Le premier joueur à vider sa main remporte la manche et marque 0. Les autres comptent les points des cartes qui leur restent en main (cartes chiffrées = leur valeur, cartes spéciales = 20, Joker/+4 = 50).</p>
    <p>Ces points s'accumulent manche après manche. Premier joueur à <strong>atteindre 500 points perd</strong> — donc le total le plus <strong>bas</strong> gagne à l'arrêt de la partie.</p>`,
    yams: `<p>Feuille de 13 catégories (brelan, full, suite, yams, etc.) à remplir une par une au fil des lancers de 5 dés, chacune ne pouvant être utilisée qu'une seule fois.</p>
    <p>Dans l'appli, chaque "manche" correspond à une catégorie remplie : entrez le score obtenu (0 si la catégorie est ratée/barrée). Après les 13 catégories, le total le plus <strong>haut</strong> gagne.</p>`,
    president: `<p>Chaque manche, on se débarrasse de ses cartes en jouant des combinaisons de force croissante (paires, brelans...). Le premier à finir devient "Président", le dernier devient "Trou du cul" pour la manche suivante (échange de cartes entre eux).</p>
    <p>Comptez les points comme vous préférez (ex. Président +3, dernier -3, ou juste l'ordre de sortie). Le total le plus <strong>haut</strong> gagne après le nombre de manches choisi.</p>`,
    millebornes: `<p>Chaque équipe/joueur pose des cartes Étape (bornes de 25 à 200 km) pour avancer, en gérant attaques (Crevaison, Panne...) et parades. Objectif : atteindre <strong>1000 km</strong> (ou 700 en partie courte) avant les autres.</p>
    <p>Des primes s'ajoutent en fin de manche (Coup Fourré, Allonge, Sans Bottes...). Le score le plus <strong>haut</strong> gagne.</p>`,
    poker: `<p>Suivi de jetons pour une partie de poker maison (Texas Hold'em ou autre variante). Entrez le gain ou la perte nette de chaque joueur à chaque main (les pertes en négatif).</p>
    <p>Le total le plus <strong>haut</strong> à la fin de la session remporte la partie — la somme de tous les joueurs doit toujours être égale à zéro si tout est bien compté !</p>`,
    kaid: `<p>Jeu de plis traditionnel corse, jouable à 3 ou 4. Chaque manche, on compte les points des plis remportés (valeurs classiques : As, 10, Roi, Dame, Valet...).</p>
    <p>Après plusieurs manches, le total le plus <strong>haut</strong> gagne.</p>`,
    killer: `<p>Chaque joueur reçoit une carte cible (un autre joueur à "éliminer") sans que personne ne le sache. On joue des tours successifs ; être éliminé signifie perdre la partie pour ce joueur, l'assassin hérite alors de sa cible.</p>
    <p>Notez à chaque manche le nombre de tours survécus ou de cibles éliminées. Le total le plus <strong>haut</strong> (dernier survivant) gagne.</p>`,
    cinqcents: `<p>Variante du Rami où chaque combinaison posée rapporte des points définis (ex. As = 15-20, figures = 10, etc.) tandis que les cartes qui restent en main à la fin d'une manche sont des points négatifs.</p>
    <p>Premier joueur à atteindre <strong>500 points</strong> remporte la partie.</p>`
  },
  en: {
    cinqrois: `<p>11 rounds, one for each number of cards dealt (from 3 to 13). Each round, try to empty your hand by forming <strong>runs</strong> (consecutive cards, same suit) and <strong>sets</strong> (same value, different suits).</p>
    <p>At the end of each round, cards left in hand count as penalty points (face cards = 10, Ace = 1, etc. per your house rules). The <strong>lowest</strong> score after the 11 rounds wins.</p>`,
    flip7: `<p>Push-your-luck game: each turn, cards are flipped one by one and you can choose to "stay" or keep "flipping." Flipping a duplicate value busts you for the turn with no points.</p>
    <p>Collecting 7 different cards in a turn gives a +15 bonus. First player to reach <strong>200 points</strong> (highest score) triggers the end of the game.</p>`,
    roidesnains: `<p>7 hands, each with a different "quest" (announced before playing) that determines how points are won or lost that round — hence the possibility of negative scores.</p>
    <p>After the 7 hands, the <strong>highest</strong> total wins.</p>`,
    caracole: `<p>Combination game (52 cards): pairs, three/four of a kind, or runs of 3+ same-suit cards played onto the pile. A player can "caracole" once they have 10 points or less left in hand.</p>
    <p>Card values: 1 to 7 = face value, <strong>8 = 0</strong>, Jack = 11, Queen = 12, King = 13. The round winner scores 0; the "caracoler" who doesn't win takes a 30-point penalty; everyone else scores the points remaining in hand.</p>
    <p>As soon as a player's total <strong>exceeds 100 points</strong>, the game stops: the <strong>lowest</strong> total wins.</p>`,
    tarot: `<p>A game for 4 (or 3/5) players featuring the Fool, the 21 trumps, and the kings. Each hand, one player (the "bidder") announces a contract and plays alone against the others, who defend.</p>
    <p>Depending on the points collected in the "Bout," the bidder gains or loses points — which can be negative or positive, hence the usefulness of negative scores. Over several hands, the <strong>highest</strong> total wins.</p>`,
    belote: `<p>Traditionally played in 2 teams of 2. Each hand, a suit is chosen as trump (by bid or "prise"), and the bidding team must collect more than half of the hand's 162 points (or achieve a "belote-rebelote," a "capot," etc.).</p>
    <p>Since the app scores by "player," use one name per team (e.g. "Us" / "Them"). First team to reach <strong>501 points</strong> wins.</p>`,
    rami: `<p>Each player tries to empty their hand by forming combinations: <strong>runs</strong> (consecutive cards, same suit) and <strong>sets</strong> (same value).</p>
    <p>At the end of a round, cards left in hand count as a penalty. After several rounds, the <strong>lowest</strong> score wins.</p>`,
    skyjo: `<p>Each player has a grid of 12 face-down cards (values from -2 to 12) and progressively reveals them by drawing/discarding, trying to keep the lowest total.</p>
    <p>Once a player flips their last card, one final turn is played, then all grids are revealed. As soon as a total <strong>reaches 100</strong>, the game stops: the <strong>lowest</strong> total wins.</p>`,
    uno: `<p>The first player to empty their hand wins the round and scores 0. Everyone else counts the points of the cards left in hand (numbered cards = face value, special cards = 20, Wild/+4 = 50).</p>
    <p>These points accumulate round after round. The first player to <strong>reach 500 points loses</strong> — so the <strong>lowest</strong> total wins when the game stops.</p>`,
    yams: `<p>A sheet of 13 categories (three of a kind, full house, straight, yams, etc.) filled in one at a time as you roll 5 dice, each usable only once.</p>
    <p>In the app, each "round" is one filled category: enter the score you got (0 if the category is missed/crossed out). After all 13 categories, the <strong>highest</strong> total wins.</p>`,
    president: `<p>Each round, players get rid of cards by playing combinations of increasing strength (pairs, three of a kind...). The first to finish becomes "President," the last becomes the "Asshole" for the next round (they swap cards).</p>
    <p>Score points however you like (e.g. President +3, last place -3, or just finishing order). The <strong>highest</strong> total wins after the chosen number of rounds.</p>`,
    millebornes: `<p>Each team/player plays Distance cards (25 to 200 km milestones) to advance, managing hazards (Flat Tire, Breakdown...) and safety cards. Goal: reach <strong>1000 km</strong> (or 700 in a short game) before the others.</p>
    <p>Bonus points are added at the end of a round (Coup Fourré, Extension, Safe Trip...). The <strong>highest</strong> score wins.</p>`,
    poker: `<p>Chip tracking for a home poker game (Texas Hold'em or other variant). Enter each player's net win or loss for every hand (losses as negative numbers).</p>
    <p>The <strong>highest</strong> total at the end of the session wins — the sum across all players should always equal zero if everything is tallied correctly!</p>`,
    kaid: `<p>A traditional Corsican trick-taking game, played with 3 or 4 players. Each round, count the points from tricks won (classic values: Ace, 10, King, Queen, Jack...).</p>
    <p>After several rounds, the <strong>highest</strong> total wins.</p>`,
    killer: `<p>Each player secretly receives a target card (another player to "eliminate") without anyone knowing. Successive turns are played; being eliminated means losing the game, and the killer inherits their victim's target.</p>
    <p>Note each round the number of turns survived or targets eliminated. The <strong>highest</strong> total (last survivor) wins.</p>`,
    cinqcents: `<p>A Rummy variant where each combination played earns set point values (e.g. Ace = 15-20, face cards = 10, etc.), while cards left in hand at the end of a round count as negative points.</p>
    <p>First player to reach <strong>500 points</strong> wins the game.</p>`
  }
};

function getRulesHtml(gameDef) {
  if (!gameDef.custom) {
    const table = BUILTIN_RULES[currentLang] || BUILTIN_RULES.fr;
    return table[gameDef.id] || (BUILTIN_RULES.fr[gameDef.id]) || `<p>${t('rules.notAvailable')}</p>`;
  }
  // Jeu personnalisé : pas de vraies règles de carte connues, on explique le fonctionnement configuré.
  const endText = gameDef.endMode === 'target'
    ? tf('rules.customEndTarget', { n: gameDef.defaultTarget })
    : tf('rules.customEndRounds', { n: gameDef.defaultRounds, word: gameDef.roundWord.toLowerCase() });
  const winText = gameDef.direction === 'asc' ? t('rules.customWinAsc') : t('rules.customWinDesc');
  return `<p>${t('rules.customIntro')}</p>
    <p>${tf('rules.customEndsWhen', { endText, winText })}</p>
    <p>${tf('rules.customNegative', { word: gameDef.roundWord.toLowerCase(), state: gameDef.allowNegative ? t('rules.allowed') : t('rules.notAllowed') })}</p>`;
}

function openRulesModal(gameDef) {
  openModal(`
    <h3 class="modal-title">${gameDef.suit} ${t('common.rulesTitle')} — ${escapeHtml(gameDef.label)}</h3>
    ${getRulesHtml(gameDef)}
    <div class="modal-actions">
      <button class="btn-primary" id="rules-close-btn">${t('common.close')}</button>
    </div>`);
  document.getElementById('rules-close-btn').addEventListener('click', closeModal);
}

/* ---------- Thème (couleur de table + mode clair) ---------- */
const THEMES = [
  { key: 'auto', labelKey: 'theme.auto', dot: 'linear-gradient(135deg,#ffffff 50%,#000000 50%)' },
  { key: 'appledark', labelKey: 'theme.appledark', dot: 'linear-gradient(135deg,#1c1c1e,#000000)' },
  { key: 'applelight', labelKey: 'theme.applelight', dot: 'linear-gradient(135deg,#ffffff,#f2f2f7)' },
  { key: 'fantasy', labelKey: 'theme.fantasy', dot: 'linear-gradient(135deg,#e6b8ff,#2a1152)' }
];

function applyTheme(key) {
  if (key === 'auto') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', key);
  try { localStorage.setItem('mp_theme_v1', key === 'auto' ? '' : key); } catch (e) {}
}

function openThemeModal() {
  const current = document.documentElement.getAttribute('data-theme') || 'auto';
  const overlay = openModal(`
    <h3 class="modal-title">🎨 ${t('theme.modalTitle')}</h3>
    <div class="theme-grid" id="theme-grid"></div>
    <div class="modal-actions">
      <button class="btn-ghost" id="theme-close-btn">${t('common.close')}</button>
    </div>`);
  const grid = overlay.querySelector('#theme-grid');
  THEMES.forEach(theme => {
    const opt = document.createElement('button');
    opt.type = 'button';
    opt.className = 'theme-opt' + (theme.key === current ? ' selected' : '');
    opt.innerHTML = `<span class="theme-dot" style="background:${theme.dot}"></span><span>${t(theme.labelKey)}</span>`;
    opt.addEventListener('click', () => {
      applyTheme(theme.key);
      grid.querySelectorAll('.theme-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
    });
    grid.appendChild(opt);
  });
  overlay.querySelector('#theme-close-btn').addEventListener('click', closeModal);
}



/* ---------- Import / export de partie (code texte encodé en hexadécimal) ----------
   Remarque : il s'agit d'un encodage réversible (XOR + hexadécimal), pas d'un
   chiffrement cryptographique sécurisé — il sert juste à obtenir un code
   compact et illisible à copier-coller, pas à protéger des données sensibles. */
const XOR_KEY = [0x5A, 0x3C, 0x7E, 0x91, 0x2D, 0x6F, 0xA3, 0x18];

function exportGameCode(game) {
  const json = JSON.stringify(game);
  const bytes = new TextEncoder().encode(json);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i] ^ XOR_KEY[i % XOR_KEY.length];
    hex += b.toString(16).padStart(2, '0');
  }
  return hex;
}

function importGameCode(hexStr) {
  const clean = hexStr.trim().replace(/\s+/g, '');
  if (!/^[0-9a-fA-F]+$/.test(clean) || clean.length === 0 || clean.length % 2 !== 0) {
    throw new Error('Code invalide.');
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    const b = parseInt(clean.substr(i, 2), 16);
    bytes[i / 2] = b ^ XOR_KEY[(i / 2) % XOR_KEY.length];
  }
  const json = new TextDecoder().decode(bytes);
  const game = JSON.parse(json);
  if (!game || typeof game !== 'object' || !game.type || !Array.isArray(game.players) || !Array.isArray(game.rounds)) {
    throw new Error('Ce code ne correspond pas à une partie valide.');
  }
  return game;
}

function closeModal() {
  const m = document.querySelector('.modal-overlay');
  if (m) m.remove();
}

function openModal(innerHtml) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `<div class="modal-card">${innerHtml}</div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  return overlay;
}

function openExportModal(game) {
  const code = exportGameCode(game);
  const overlay = openModal(`
    <h3 class="modal-title">${t('export.title')}</h3>
    <p class="hint">${tf('export.desc', { status: game.finished ? t('export.statusFinished') : t('export.statusOngoing') })}</p>
    <textarea id="export-code" class="code-textarea" rows="6" readonly></textarea>
    <div class="modal-actions">
      <button class="btn-primary" id="export-copy-btn">${t('export.copyBtn')}</button>
      <button class="btn-ghost" id="export-close-btn">${t('common.close')}</button>
    </div>`);
  const ta = overlay.querySelector('#export-code');
  ta.value = code;
  ta.addEventListener('click', () => ta.select());
  overlay.querySelector('#export-copy-btn').addEventListener('click', async (e) => {
    ta.select();
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      document.execCommand('copy');
    }
    e.target.textContent = t('export.copiedBtn');
    setTimeout(() => { e.target.textContent = t('export.copyBtn'); }, 1500);
  });
  overlay.querySelector('#export-close-btn').addEventListener('click', closeModal);
}

function openImportModal() {
  const overlay = openModal(`
    <h3 class="modal-title">${t('import.title')}</h3>
    <p class="hint">${t('import.desc')}</p>
    <textarea id="import-code" class="code-textarea" rows="6" placeholder="${t('import.placeholder')}"></textarea>
    <p class="import-error hidden" id="import-error"></p>
    <div class="modal-actions">
      <button class="btn-primary" id="import-confirm-btn">${t('import.confirmBtn')}</button>
      <button class="btn-ghost" id="import-close-btn">${t('common.cancel')}</button>
    </div>`);
  overlay.querySelector('#import-close-btn').addEventListener('click', closeModal);
  overlay.querySelector('#import-confirm-btn').addEventListener('click', () => {
    const val = overlay.querySelector('#import-code').value;
    const errEl = overlay.querySelector('#import-error');
    let game;
    try {
      game = importGameCode(val);
    } catch (e) {
      errEl.textContent = t('import.errorMsg');
      errEl.classList.remove('hidden');
      return;
    }
    const existing = getCurrentGame();
    if (existing && !confirm(t('import.confirmReplace'))) {
      return;
    }
    game.id = uid(); // évite les collisions avec une partie déjà archivée localement
    saveCurrentGame(game);
    boardAddPlayerOpen = false;
    closeModal();
    setView('board');
  });
}

/* ---------- Router ---------- */
const app = document.getElementById('app');
let setupSelectedGame = null;
let setupSelectedPlayers = [];
let editingCustomId = null;
let boardAddPlayerOpen = false;

/* ---------- Minuteur (utile pour les jeux à tour chronométré) ---------- */
let timerPanelOpen = false;
let timerRunning = false;
let timerDurationSec = (() => {
  try { return parseInt(localStorage.getItem('mp_timer_duration_v1'), 10) || 60; } catch (e) { return 60; }
})();
let timerRemainingSec = timerDurationSec;
let timerIntervalId = null;

function formatTimer(sec) {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

function playTimerBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 220].forEach(delay => {
      setTimeout(() => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }, delay);
    });
  } catch (e) {}
  if (navigator.vibrate) { try { navigator.vibrate([200, 100, 200]); } catch (e) {} }
}

function timerTick() {
  timerRemainingSec--;
  const disp = document.getElementById('timer-display-el');
  if (disp) disp.textContent = formatTimer(timerRemainingSec);
  if (timerRemainingSec <= 0) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
    timerRunning = false;
    if (disp) disp.classList.add('timer-done');
    playTimerBeep();
    renderTimerPanel();
  }
}

function renderTimerPanel() {
  const wrap = document.getElementById('board-timer');
  if (!wrap) return;
  if (!timerPanelOpen) {
    wrap.innerHTML = `<button class="timer-toggle" id="timer-toggle-btn">⏱️ Minuteur</button>`;
    document.getElementById('timer-toggle-btn').addEventListener('click', () => {
      timerPanelOpen = true;
      renderTimerPanel();
    });
    return;
  }
  wrap.innerHTML = `
    <div class="timer-panel">
      <div class="timer-display${timerRemainingSec <= 0 ? ' timer-done' : ''}" id="timer-display-el">${formatTimer(timerRemainingSec)}</div>
      <div class="timer-duration-row">
        <label for="timer-duration-input" style="font-size:0.85rem;color:#5a543f;">Durée (min)</label>
        <input type="number" id="timer-duration-input" min="1" max="180" value="${Math.round(timerDurationSec / 60 * 10) / 10}" ${timerRunning ? 'disabled' : ''}>
      </div>
      <div class="timer-btn-row">
        <button class="btn-primary" id="timer-startpause-btn">${timerRunning ? '⏸ Pause' : '▶️ Démarrer'}</button>
        <button class="btn-ghost" id="timer-reset-btn" style="border-color:var(--felt-1);color:var(--felt-1);">↺ Réinitialiser</button>
        <button class="btn-ghost" id="timer-close-btn" style="border-color:var(--felt-1);color:var(--felt-1);">Fermer</button>
      </div>
    </div>`;

  document.getElementById('timer-duration-input').addEventListener('change', (e) => {
    const mins = parseFloat(e.target.value);
    if (mins > 0) {
      timerDurationSec = Math.round(mins * 60);
      try { localStorage.setItem('mp_timer_duration_v1', timerDurationSec); } catch (err) {}
      if (!timerRunning) {
        timerRemainingSec = timerDurationSec;
        renderTimerPanel();
      }
    }
  });

  document.getElementById('timer-startpause-btn').addEventListener('click', () => {
    if (timerRunning) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
      timerRunning = false;
    } else {
      if (timerRemainingSec <= 0) timerRemainingSec = timerDurationSec;
      timerRunning = true;
      timerIntervalId = setInterval(timerTick, 1000);
    }
    renderTimerPanel();
  });

  document.getElementById('timer-reset-btn').addEventListener('click', () => {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
    timerRunning = false;
    timerRemainingSec = timerDurationSec;
    renderTimerPanel();
  });

  document.getElementById('timer-close-btn').addEventListener('click', () => {
    timerPanelOpen = false;
    renderTimerPanel();
  });
}


function setView(view, payload) {
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  if (view === 'home') renderHome();
  else if (view === 'players') renderPlayers();
  else if (view === 'history') renderHistory();
  else if (view === 'setup') renderSetup(payload);
  else if (view === 'board') renderBoard();
  else if (view === 'customs') renderCustoms();
  else if (view === 'customnew') renderCustomForm(payload);
}

document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
  btn.addEventListener('click', () => setView(btn.dataset.view));
});

document.getElementById('theme-btn').addEventListener('click', openThemeModal);

/* ---------- Vue: Accueil ---------- */
function renderHome() {
  const tpl = document.getElementById('tpl-home');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));
  applyI18n(app);

  const picker = document.getElementById('game-picker');
  const builtinDescr = {
    cinqrois: t('gameDescr.cinqrois'),
    flip7: t('gameDescr.flip7'),
    roidesnains: t('gameDescr.roidesnains'),
    caracole: t('gameDescr.caracole'),
    tarot: t('gameDescr.tarot'),
    belote: t('gameDescr.belote'),
    rami: t('gameDescr.rami'),
    skyjo: t('gameDescr.skyjo'),
    uno: t('gameDescr.uno'),
    yams: t('gameDescr.yams'),
    president: t('gameDescr.president'),
    millebornes: t('gameDescr.millebornes'),
    poker: t('gameDescr.poker'),
    kaid: t('gameDescr.kaid'),
    killer: t('gameDescr.killer'),
    cinqcents: t('gameDescr.cinqcents')
  };

  function makeCard(type, def, descr) {
    const btn = document.createElement('button');
    btn.className = 'game-card';
    btn.dataset.search = normalize(def.label);
    btn.innerHTML = `
      <span class="game-card-suit">${def.suit}</span>
      <h3>${escapeHtml(def.label)}</h3>
      <p>${descr}</p>
      <span class="game-card-cta">${t('home.newGameCta')}</span>`;
    btn.addEventListener('click', () => {
      setupSelectedGame = type;
      setupSelectedPlayers = [];
      setView('setup');
    });
    return btn;
  }

  picker.appendChild(makeCard('cinqrois', BUILTIN_GAMES.cinqrois, builtinDescr.cinqrois));
  picker.appendChild(makeCard('flip7', BUILTIN_GAMES.flip7, builtinDescr.flip7));
  picker.appendChild(makeCard('roidesnains', BUILTIN_GAMES.roidesnains, builtinDescr.roidesnains));
  picker.appendChild(makeCard('caracole', BUILTIN_GAMES.caracole, builtinDescr.caracole));
  picker.appendChild(makeCard('tarot', BUILTIN_GAMES.tarot, builtinDescr.tarot));
  picker.appendChild(makeCard('belote', BUILTIN_GAMES.belote, builtinDescr.belote));
  picker.appendChild(makeCard('rami', BUILTIN_GAMES.rami, builtinDescr.rami));
  picker.appendChild(makeCard('skyjo', BUILTIN_GAMES.skyjo, builtinDescr.skyjo));
  picker.appendChild(makeCard('uno', BUILTIN_GAMES.uno, builtinDescr.uno));
  picker.appendChild(makeCard('yams', BUILTIN_GAMES.yams, builtinDescr.yams));
  picker.appendChild(makeCard('president', BUILTIN_GAMES.president, builtinDescr.president));
  picker.appendChild(makeCard('millebornes', BUILTIN_GAMES.millebornes, builtinDescr.millebornes));
  picker.appendChild(makeCard('poker', BUILTIN_GAMES.poker, builtinDescr.poker));
  picker.appendChild(makeCard('kaid', BUILTIN_GAMES.kaid, builtinDescr.kaid));
  picker.appendChild(makeCard('killer', BUILTIN_GAMES.killer, builtinDescr.killer));
  picker.appendChild(makeCard('cinqcents', BUILTIN_GAMES.cinqcents, builtinDescr.cinqcents));

  const undercoverCard = document.createElement('button');
  undercoverCard.className = 'game-card';
  undercoverCard.dataset.search = normalize('Undercover bluff déduction');
  undercoverCard.innerHTML = `
    <span class="game-card-suit">🕵️</span>
    <h3>Undercover</h3>
    <p>${t('gameDescr.undercover')}</p>
    <span class="game-card-cta">${t('home.openUndercover')}</span>`;
  undercoverCard.addEventListener('click', () => { window.location.href = 'undercover/index.html'; });
  picker.appendChild(undercoverCard);

  const loupGarouCard = document.createElement('button');
  loupGarouCard.className = 'game-card';
  loupGarouCard.dataset.search = normalize('Loup-Garou village nuit roles caches');
  loupGarouCard.innerHTML = `
    <span class="game-card-suit">🐺</span>
    <h3>Loup-Garou</h3>
    <p>${t('gameDescr.loupgarou')}</p>
    <span class="game-card-cta">${t('home.openLoupGarou')}</span>`;
  loupGarouCard.addEventListener('click', () => { window.location.href = 'loup-garou/index.html'; });
  picker.appendChild(loupGarouCard);

  getCustomGames().forEach(cg => {
    const def = getGameDef('custom:' + cg.id);
    const descr = def.endMode === 'target'
      ? `Objectif ${def.defaultTarget} points. ${def.direction === 'asc' ? 'Score le plus bas gagne.' : 'Score le plus haut gagne.'}`
      : `${def.defaultRounds} manches. ${def.direction === 'asc' ? 'Score le plus bas gagne.' : 'Score le plus haut gagne.'}`;
    picker.appendChild(makeCard('custom:' + cg.id, def, descr));
  });

  const searchInput = document.getElementById('game-search');
  const emptyNote = document.getElementById('game-search-empty');
  searchInput.addEventListener('input', () => {
    const q = normalize(searchInput.value.trim());
    let visibleCount = 0;
    picker.querySelectorAll('.game-card').forEach(card => {
      const match = !q || card.dataset.search.includes(q);
      card.style.display = match ? '' : 'none';
      if (match) visibleCount++;
    });
    emptyNote.classList.toggle('hidden', visibleCount > 0);
  });

  document.getElementById('goto-create-custom').addEventListener('click', () => {
    editingCustomId = null;
    setView('customnew');
  });

  document.getElementById('goto-import').addEventListener('click', () => openImportModal());

  const resumeZone = document.getElementById('resume-zone');
  const current = getCurrentGame();
  if (current && !current.finished) {
    const gameDef = getGameDef(current.type);
    if (gameDef) {
      resumeZone.innerHTML = `
        <div class="resume-card">
          <div>
            <strong>${tf('home.resumeTitle', { label: escapeHtml(gameDef.label) })}</strong>
            <p>${current.players.map(p => escapeHtml(p.name)).join(', ')} · ${tf('home.resumeRounds', { n: current.rounds.length })}</p>
          </div>
          <button class="btn-ghost" id="resume-btn" style="border-color:var(--paper-accent);color:var(--paper-accent);">${t('home.resumeBtn')}</button>
        </div>`;
      document.getElementById('resume-btn').addEventListener('click', () => { boardAddPlayerOpen = false; setView('board'); });
    }
  }
}

/* ---------- Vue: Configuration nouvelle partie ---------- */
function renderSetup() {
  if (!setupSelectedGame) { setView('home'); return; }
  const gameDef = getGameDef(setupSelectedGame);
  if (!gameDef) { setView('home'); return; }
  const tpl = document.getElementById('tpl-setup');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));
  applyI18n(app);

  document.getElementById('setup-title').textContent = `${gameDef.suit} ${gameDef.label} — ${t('setup.newGameSuffix')}`;
  document.getElementById('setup-rules-btn').addEventListener('click', () => openRulesModal(gameDef));
  document.querySelector('[data-back="home"]').addEventListener('click', () => setView('home'));

  const listEl = document.getElementById('setup-player-list');

  function renderChips() {
    const players = getPlayers();
    listEl.innerHTML = '';
    if (players.length === 0) {
      listEl.innerHTML = `<p class="hint" style="margin:0;">${t('setup.noPlayersYet')}</p>`;
    }
    players.forEach(p => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'chip' + (setupSelectedPlayers.includes(p.id) ? ' selected' : '');
      chip.textContent = p.name;
      chip.addEventListener('click', () => {
        const idx = setupSelectedPlayers.indexOf(p.id);
        if (idx >= 0) setupSelectedPlayers.splice(idx, 1);
        else setupSelectedPlayers.push(p.id);
        renderChips();
        refreshStartState();
      });
      listEl.appendChild(chip);
    });
  }
  renderChips();

  const newPlayerInput = document.getElementById('setup-new-player');
  document.getElementById('setup-add-player').addEventListener('click', () => addSetupPlayer());
  newPlayerInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addSetupPlayer(); });
  function addSetupPlayer() {
    const p = ensurePlayer(newPlayerInput.value);
    if (p) {
      if (!setupSelectedPlayers.includes(p.id)) setupSelectedPlayers.push(p.id);
      newPlayerInput.value = '';
      renderChips();
      refreshStartState();
    }
  }

  const optionsBlock = document.getElementById('setup-options');
  if (gameDef.endMode === 'target') {
    optionsBlock.innerHTML = `<h3>${t('setup.optionsTitle')}</h3><div class="option-row">
        <label for="opt-target">${t('customgame.targetLabel')}</label>
        <input type="number" id="opt-target" min="1" step="5" value="${gameDef.defaultTarget || 100}">
      </div>`;
  } else {
    optionsBlock.innerHTML = `<h3>${t('setup.optionsTitle')}</h3><div class="option-row">
        <label for="opt-maxrounds">${t('customgame.roundsCountLabel')}</label>
        <input type="number" id="opt-maxrounds" min="1" max="50" value="${gameDef.defaultRounds || 10}">
      </div>`;
  }

  const startBtn = document.getElementById('setup-start');
  function refreshStartState() {
    startBtn.disabled = setupSelectedPlayers.length < 2;
    startBtn.textContent = setupSelectedPlayers.length < 2
      ? t('setup.selectAtLeast2')
      : t('setup.startBtn');
  }
  refreshStartState();

  startBtn.addEventListener('click', () => {
    if (setupSelectedPlayers.length < 2) return;
    const players = getPlayers();
    const chosen = setupSelectedPlayers.map(id => players.find(p => p.id === id)).filter(Boolean);

    const game = {
      id: uid(),
      type: setupSelectedGame,
      players: chosen.map(p => ({ id: p.id, name: p.name })),
      rounds: [],
      finished: false,
      winnerId: null,
      createdAt: Date.now()
    };
    if (gameDef.endMode === 'target') {
      const v = parseInt(document.getElementById('opt-target').value, 10);
      game.target = (v && v > 0) ? v : (gameDef.defaultTarget || 100);
    } else {
      const v = parseInt(document.getElementById('opt-maxrounds').value, 10);
      game.maxRounds = (v && v > 0) ? v : (gameDef.defaultRounds || 10);
    }
    saveCurrentGame(game);
    boardAddPlayerOpen = false;
    setView('board');
  });
}

/* ---------- Vue: Plateau de score ---------- */
function computeTotals(game) {
  const totals = game.players.map(() => 0);
  game.rounds.forEach(round => {
    round.forEach((val, i) => { totals[i] += (Number.isFinite(val) ? val : 0); });
  });
  return totals;
}

function getRanking(gameDef, totals) {
  const dir = gameDef.direction;
  const order = totals.map((t, i) => ({ i, t }));
  order.sort((a, b) => dir === 'asc' ? a.t - b.t : b.t - a.t);
  return order;
}

/* Retourne les indices de tous les joueurs à égalité en tête (gère les égalités) */
function getLeaderIndices(gameDef, totals) {
  if (!totals.length) return [];
  const best = gameDef.direction === 'asc' ? Math.min(...totals) : Math.max(...totals);
  return totals.reduce((acc, t, i) => { if (t === best) acc.push(i); return acc; }, []);
}

function checkGameEnd(gameDef, game, totals) {
  if (gameDef.endMode === 'target') {
    if (game.rounds.length === 0) return false;
    const target = game.target || gameDef.defaultTarget || 100;
    // L'objectif déclenche la fin dès qu'un total atteint/dépasse la cible,
    // que ce soit pour un score qui doit monter (le plus haut gagne) ou pour
    // un score qui doit rester bas (le plus haut qui dépasse la cible sort
    // la partie, et c'est alors le plus bas total qui gagne — ex. Caracole).
    return Math.max(...totals) >= target;
  }
  return game.rounds.length >= (game.maxRounds || gameDef.defaultRounds || 10);
}

function renderBoard() {
  let game = getCurrentGame();
  if (!game) { setView('home'); return; }
  const gameDef = getGameDef(game.type);
  if (!gameDef) {
    alert("Ce jeu personnalisé n'existe plus.");
    clearCurrentGame();
    setView('home');
    return;
  }

  const tpl = document.getElementById('tpl-board');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));
  applyI18n(app);

  document.querySelector('[data-back="home"]').addEventListener('click', () => setView('home'));
  document.getElementById('board-title').textContent = `${gameDef.suit} ${gameDef.label}`;
  document.getElementById('board-rules-btn').addEventListener('click', () => openRulesModal(gameDef));
  renderTimerPanel();

  const totals = computeTotals(game);
  const leaderIndices = getLeaderIndices(gameDef, totals);

  document.getElementById('board-meta').textContent = gameDef.endMode === 'target'
    ? tf('board.metaTarget', { n: game.target, direction: gameDef.direction === 'asc' ? t('board.lowestWins') : t('board.bestWins') })
    : tf('board.metaRounds', { played: game.rounds.length, total: game.maxRounds, direction: gameDef.direction === 'asc' ? t('board.lowestWins') : t('board.highestWins') });

  const bannerEl = document.getElementById('winner-banner');
  if (game.finished) {
    const winnerIds = game.winnerIds || (game.winnerId != null ? [game.winnerId] : []);
    const winnerNames = winnerIds.map(i => game.players[i] && game.players[i].name).filter(Boolean);
    bannerEl.classList.remove('hidden');
    if (winnerNames.length > 1) {
      bannerEl.textContent = tf('board.tieBanner', { names: joinNames(winnerNames), n: totals[winnerIds[0]] });
    } else if (winnerNames.length === 1) {
      bannerEl.textContent = tf('board.winnerBanner', { name: winnerNames[0], n: totals[winnerIds[0]] });
    } else {
      bannerEl.textContent = t('board.gameOverText');
    }
  } else {
    bannerEl.classList.add('hidden');
  }

  /* Construction du tableau */
  const table = document.getElementById('scoreboard');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.innerHTML = `<th>${t('board.roundColumnHeader')}</th>` + game.players.map((p, i) => `
    <th>
      <div class="player-col-name">
        <span>${escapeHtml(p.name)}</span>
        ${!game.finished ? `<button class="remove-col" data-remove-player="${i}" title="${t('board.removePlayerTitle')}" aria-label="${tf('board.removePlayerAria', { name: escapeHtml(p.name) })}">×</button>` : ''}
      </div>
    </th>`).join('');
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  game.rounds.forEach((round, rIdx) => {
    const tr = document.createElement('tr');
    let cells = `<td>${roundLabel(gameDef, rIdx + 1)}</td>`;
    round.forEach(val => {
      cells += `<td>${Number.isFinite(val) ? val : 0}</td>`;
    });
    tr.innerHTML = cells;
    tbody.appendChild(tr);
  });

  if (!game.finished) {
    const nextRoundNum = game.rounds.length + 1;
    const tr = document.createElement('tr');
    let cells = `<td>${roundLabel(gameDef, nextRoundNum)}</td>`;
    game.players.forEach((p, i) => {
      cells += `<td><input type="number" ${gameDef.allowNegative ? '' : 'inputmode="numeric" min="0"'} data-score-input="${i}" placeholder="0"></td>`;
    });
    tr.innerHTML = cells;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);

  const tfoot = document.createElement('tfoot');
  const totalRow = document.createElement('tr');
  let totalCells = '<td>Total</td>';
  totals.forEach((t, i) => {
    const isLeader = leaderIndices.includes(i) && game.rounds.length > 0;
    totalCells += `<td class="${isLeader ? 'leader' : ''}">${t}</td>`;
  });
  totalRow.innerHTML = totalCells;
  tfoot.appendChild(totalRow);
  table.appendChild(tfoot);

  /* Retirer un joueur, à tout moment de la partie */
  table.querySelectorAll('[data-remove-player]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.removePlayer, 10);
      if (game.players.length <= 2) {
        alert(t('board.needTwoPlayers'));
        return;
      }
      if (game.rounds.length > 0) {
        const name = game.players[idx].name;
        if (!confirm(tf('board.removePlayerConfirm', { name }))) return;
      }
      game.players.splice(idx, 1);
      game.rounds.forEach(round => round.splice(idx, 1));
      saveCurrentGame(game);
      renderBoard();
    });
  });

  /* Ajouter un joueur en cours de partie (derrière un bouton, pour ne pas prendre trop de place) */
  const manageEl = document.getElementById('board-manage-players');
  if (!game.finished) {
    if (!boardAddPlayerOpen) {
      manageEl.innerHTML = `<button class="board-toggle-add" id="board-toggle-add-btn">${t('board.addPlayerToggle')}</button>`;
      document.getElementById('board-toggle-add-btn').addEventListener('click', () => {
        boardAddPlayerOpen = true;
        renderBoard();
      });
    } else {
      const inGameIds = new Set(game.players.map(p => p.id));
      const available = getPlayers().filter(p => !inGameIds.has(p.id));
      manageEl.innerHTML = `
        <div class="setup-block" style="margin-top:0;margin-bottom:16px;">
          <div class="setup-block-head">
            <h3>${t('board.addPlayerTitle')}</h3>
            <button class="icon-btn" id="board-close-add-btn" style="color:rgba(var(--ink-rgb),0.6);">${t('board.closeBtn')}</button>
          </div>
          <p class="hint">${game.rounds.length > 0 ? tf('board.addPlayerHintRounds', { n: game.rounds.length }) : t('board.addPlayerHintNew')}</p>
          <div class="chip-list" id="board-available-chips"></div>
          <div class="inline-add">
            <input type="text" id="board-new-player" placeholder="${t('common.playerNamePlaceholder')}" maxlength="24">
            <button id="board-add-player-btn" class="btn-ghost">${t('common.addBtn')}</button>
          </div>
        </div>`;

      document.getElementById('board-close-add-btn').addEventListener('click', () => {
        boardAddPlayerOpen = false;
        renderBoard();
      });

      function addPlayerToGame(p) {
        game.players.push({ id: p.id, name: p.name });
        game.rounds.forEach(round => round.push(0));
        saveCurrentGame(game);
        boardAddPlayerOpen = false;
        renderBoard();
      }

      const chipsEl = document.getElementById('board-available-chips');
      if (available.length === 0) {
        chipsEl.innerHTML = `<p class="hint" style="margin:0;">${t('board.allRegisteredInGame')}</p>`;
      } else {
        available.forEach(p => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'chip';
          chip.textContent = p.name;
          chip.addEventListener('click', () => addPlayerToGame(p));
          chipsEl.appendChild(chip);
        });
      }

      const newInput = document.getElementById('board-new-player');
      newInput.focus();
      document.getElementById('board-add-player-btn').addEventListener('click', () => {
        const p = ensurePlayer(newInput.value);
        if (p) addPlayerToGame(p);
      });
      newInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('board-add-player-btn').click(); });
    }
  } else {
    manageEl.innerHTML = '';
  }

  /* Actions */
  const actionsEl = document.getElementById('board-actions');
  actionsEl.innerHTML = '';

  if (!game.finished) {
    const addBtn = document.createElement('button');
    addBtn.className = 'btn-primary';
    addBtn.textContent = game.rounds.length === 0 ? t('board.validateFirstRound') : t('board.validateRound');
    addBtn.addEventListener('click', () => {
      const inputs = table.querySelectorAll('[data-score-input]');
      const round = new Array(game.players.length).fill(0);
      inputs.forEach(inp => {
        const i = parseInt(inp.dataset.scoreInput, 10);
        let v = parseInt(inp.value, 10);
        if (!Number.isFinite(v)) v = 0;
        if (!gameDef.allowNegative && v < 0) v = 0;
        round[i] = v;
      });
      game.rounds.push(round);
      const newTotals = computeTotals(game);
      if (checkGameEnd(gameDef, game, newTotals)) {
        game.finished = true;
        game.winnerIds = getLeaderIndices(gameDef, newTotals);
        game.winnerId = game.winnerIds[0];
        archiveGame(gameDef, game, newTotals);
        saveCurrentGame(game);
        renderBoard();
        launchConfetti();
        return;
      }
      saveCurrentGame(game);
      renderBoard();
    });
    actionsEl.appendChild(addBtn);

    if (game.rounds.length > 0) {
      const undoBtn = document.createElement('button');
      undoBtn.className = 'btn-ghost';
      undoBtn.textContent = t('board.undoBtn');
      undoBtn.addEventListener('click', () => {
        game.rounds.pop();
        saveCurrentGame(game);
        renderBoard();
      });
      actionsEl.appendChild(undoBtn);
    }

    const finishBtn = document.createElement('button');
    finishBtn.className = 'btn-ghost';
    finishBtn.textContent = t('board.finishBtn');
    finishBtn.addEventListener('click', () => {
      if (!confirm(t('board.finishConfirm'))) return;
      const finalTotals = computeTotals(game);
      game.finished = true;
      game.winnerIds = getLeaderIndices(gameDef, finalTotals);
      game.winnerId = game.winnerIds[0];
      archiveGame(gameDef, game, finalTotals);
      saveCurrentGame(game);
      renderBoard();
      launchConfetti();
    });
    actionsEl.appendChild(finishBtn);
  } else {
    const newGameBtn = document.createElement('button');
    newGameBtn.className = 'btn-primary';
    newGameBtn.textContent = t('board.newGameBtn');
    newGameBtn.addEventListener('click', () => {
      clearCurrentGame();
      setView('home');
    });
    actionsEl.appendChild(newGameBtn);
  }

  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn-ghost';
  exportBtn.textContent = t('board.exportBtn');
  exportBtn.addEventListener('click', () => openExportModal(game));
  actionsEl.appendChild(exportBtn);

  const abandonBtn = document.createElement('button');
  abandonBtn.className = 'btn-ghost';
  abandonBtn.textContent = t('board.deleteGameBtn');
  abandonBtn.addEventListener('click', () => {
    if (!confirm(t('board.deleteGameConfirm'))) return;
    clearCurrentGame();
    setView('home');
  });
  actionsEl.appendChild(abandonBtn);

  const firstInput = table.querySelector('[data-score-input]');
  if (firstInput) firstInput.focus();
}

/* Petite pluie de confettis (DOM/CSS pur, sans dépendance) */
function launchConfetti() {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const colors = ['#c8a24b', '#e8c877', '#155a41', '#f6f1e2', '#a33d3d'];
  const container = document.createElement('div');
  container.className = 'confetti-layer';
  const count = 60;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
    piece.style.animationDelay = (Math.random() * 0.5) + 's';
    piece.style.setProperty('--drift', (Math.random() * 140 - 70) + 'px');
    piece.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
    if (Math.random() > 0.5) piece.style.borderRadius = '50%';
    container.appendChild(piece);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 4200);
  if (navigator.vibrate) { try { navigator.vibrate([15, 40, 15]); } catch (e) {} }
}

function archiveGame(gameDef, game, totals) {
  const history = getHistory();
  history.unshift({
    id: game.id,
    type: game.type,
    label: gameDef.label,
    suit: gameDef.suit,
    players: game.players,
    totals,
    winnerId: game.winnerId,
    winnerIds: game.winnerIds || (game.winnerId != null ? [game.winnerId] : []),
    roundsPlayed: game.rounds.length,
    finishedAt: Date.now()
  });
  saveHistory(history.slice(0, 100));
}

/* ---------- Vue: Joueurs ---------- */
function renderPlayers() {
  const tpl = document.getElementById('tpl-players');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));
  applyI18n(app);

  const input = document.getElementById('players-new');
  document.getElementById('players-add').addEventListener('click', addPlayer);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addPlayer(); });
  function addPlayer() {
    if (ensurePlayer(input.value)) {
      input.value = '';
      renderList();
    }
  }

  function renderList() {
    const listEl = document.getElementById('players-manage-list');
    const players = getPlayers();
    if (players.length === 0) {
      listEl.innerHTML = `<p class="empty-note">${t('players.noneYet')}</p>`;
      return;
    }
    listEl.innerHTML = '';
    players.forEach(p => {
      const li = document.createElement('li');
      const date = p.createdAt ? new Date(p.createdAt).toLocaleDateString(currentLang === 'en' ? 'en-US' : 'fr-FR') : '';
      const stats = computePlayerStats(p.id);
      const statsLine = stats.gamesPlayed === 0
        ? t('players.statsNone')
        : tf('players.statsLine', { wins: stats.wins, plural: stats.wins > 1 ? t('players.pluralS') : '', games: stats.gamesPlayed }) +
          (stats.avgScore !== null ? tf('players.statsAvg', { avg: stats.avgScore }) : '') +
          (stats.streak >= 2 ? tf('players.statsStreak', { streak: stats.streak }) : '');
      li.innerHTML = `
        <div>
          <div class="pname">${escapeHtml(p.name)}</div>
          <div class="pmeta">${tf('players.addedOn', { date })}</div>
          <div class="pstats">${statsLine}</div>
        </div>
        <button class="icon-btn" data-remove="${p.id}">${t('players.deleteBtn')}</button>`;
      listEl.appendChild(li);
    });
    listEl.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.remove;
        if (!confirm(t('players.deleteConfirm'))) return;
        savePlayers(getPlayers().filter(p => p.id !== id));
        renderList();
      });
    });
  }
  renderList();
}

/* ---------- Vue: Jeux personnalisés (liste + gestion) ---------- */
function renderCustoms() {
  const tpl = document.getElementById('tpl-customs');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));
  applyI18n(app);

  document.getElementById('customs-new-btn').addEventListener('click', () => {
    editingCustomId = null;
    setView('customnew');
  });

  const listEl = document.getElementById('customs-list');
  const customs = getCustomGames();
  if (customs.length === 0) {
    listEl.innerHTML = `<p class="empty-note">${t('customs.noneYet')}</p>`;
    return;
  }
  listEl.innerHTML = '';
  customs.forEach(cg => {
    const dirLabel = cg.direction === 'asc' ? t('customs.lowestWins') : t('customs.highestWins');
    const desc = cg.endMode === 'target'
      ? tf('customs.descTarget', { target: cg.target, dir: dirLabel })
      : tf('customs.descRounds', { rounds: cg.roundsCount, dir: dirLabel });
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <div class="pname">${cg.suit || '★'} ${escapeHtml(cg.name)}</div>
        <div class="pmeta">${desc}</div>
      </div>
      <div class="custom-game-card-actions">
        <button class="btn-ghost" data-edit="${cg.id}" style="border-color:var(--paper-accent);color:var(--paper-accent);padding:6px 10px;">${t('customs.editBtn')}</button>
        <button class="icon-btn" data-remove="${cg.id}">${t('customs.deleteBtn')}</button>
      </div>`;
    listEl.appendChild(li);
  });

  listEl.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => {
      editingCustomId = btn.dataset.edit;
      setView('customnew');
    });
  });
  listEl.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm(t('customs.deleteConfirm'))) return;
      saveCustomGames(getCustomGames().filter(g => g.id !== btn.dataset.remove));
      renderCustoms();
    });
  });
}

/* ---------- Vue: Créer / modifier un jeu personnalisé ---------- */
function renderCustomForm() {
  const tpl = document.getElementById('tpl-customgame-new');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));
  applyI18n(app);
  document.querySelector('[data-back="home"]').addEventListener('click', () => setView('customs'));

  const nameInput = document.getElementById('cg-name');
  const roundsRow = document.getElementById('cg-rounds-row');
  const targetRow = document.getElementById('cg-target-row');
  const maxRoundsInput = document.getElementById('cg-maxrounds');
  const targetInput = document.getElementById('cg-target');
  const roundWordInput = document.getElementById('cg-roundword');
  const saveBtn = document.getElementById('cg-save');

  const existing = editingCustomId ? getCustomGames().find(g => g.id === editingCustomId) : null;
  if (existing) {
    document.querySelector('.view-title').textContent = t('customgame.editTitle');
    saveBtn.textContent = t('customgame.saveEdit');
    nameInput.value = existing.name;
    roundWordInput.value = existing.roundWord || 'Manche';
    document.querySelector(`input[name="cg-direction"][value="${existing.direction}"]`).checked = true;
    document.querySelector(`input[name="cg-endmode"][value="${existing.endMode}"]`).checked = true;
    if (existing.endMode === 'rounds') maxRoundsInput.value = existing.roundsCount;
    else targetInput.value = existing.target;
    document.querySelector(`input[name="cg-negative"][value="${existing.allowNegative ? 'yes' : 'no'}"]`).checked = true;
  }

  function syncEndModeRows() {
    const mode = document.querySelector('input[name="cg-endmode"]:checked').value;
    roundsRow.classList.toggle('hidden', mode !== 'rounds');
    targetRow.classList.toggle('hidden', mode !== 'target');
  }
  syncEndModeRows();
  document.querySelectorAll('input[name="cg-endmode"]').forEach(r => r.addEventListener('change', syncEndModeRows));

  saveBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) { alert(t('customgame.nameRequired')); nameInput.focus(); return; }
    const direction = document.querySelector('input[name="cg-direction"]:checked').value;
    const endMode = document.querySelector('input[name="cg-endmode"]:checked').value;
    const roundWord = roundWordInput.value.trim() || 'Manche';

    const cg = existing || { id: uid() };
    cg.name = name;
    cg.direction = direction;
    cg.endMode = endMode;
    cg.roundWord = roundWord;
    cg.suit = existing ? existing.suit : '★';
    cg.allowNegative = document.querySelector('input[name="cg-negative"]:checked').value === 'yes';
    if (endMode === 'rounds') {
      const v = parseInt(maxRoundsInput.value, 10);
      cg.roundsCount = (v && v > 0) ? v : 10;
      delete cg.target;
    } else {
      const v = parseInt(targetInput.value, 10);
      cg.target = (v && v > 0) ? v : 100;
      delete cg.roundsCount;
    }

    const list = getCustomGames();
    const idx = list.findIndex(g => g.id === cg.id);
    if (idx >= 0) list[idx] = cg; else list.push(cg);
    saveCustomGames(list);
    editingCustomId = null;
    setView('customs');
  });
}

/* ---------- Vue: Historique ---------- */
function renderHistory() {
  const tpl = document.getElementById('tpl-history');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));
  applyI18n(app);

  const listEl = document.getElementById('history-list');
  const history = getHistory();
  if (history.length === 0) {
    listEl.innerHTML = `<p class="empty-note">${t('history.noneYet')}</p>`;
    return;
  }

  history.forEach(h => {
    const div = document.createElement('div');
    div.className = 'history-card';
    const date = new Date(h.finishedAt).toLocaleString(currentLang === 'en' ? 'en-US' : 'fr-FR');
    const pills = h.players.map((p, i) => `
      <span class="history-pill ${(h.winnerIds || [h.winnerId]).includes(i) ? 'win' : ''}">${escapeHtml(p.name)} · ${h.totals[i]}</span>
    `).join('');
    div.innerHTML = `
      <h4>${h.suit || ''} ${escapeHtml(h.label || h.type)}</h4>
      <div class="hdate">${date} · ${tf('history.roundsPlayed', { n: h.roundsPlayed })}</div>
      <div class="history-scores">${pills}</div>`;
    listEl.appendChild(div);
  });

  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn-ghost';
  clearBtn.textContent = t('history.clearBtn');
  clearBtn.style.marginTop = '8px';
  clearBtn.addEventListener('click', () => {
    if (!confirm(t('history.clearConfirm'))) return;
    saveHistory([]);
    renderHistory();
  });
  listEl.appendChild(clearBtn);
}

/* ---------- Utilitaires ---------- */
/* ---------- Langue (FR/EN, détection auto + choix manuel) ----------
   Couvre l'interface fixe (menus, titres d'écran, formulaires, libellés
   communs). Les textes générés dynamiquement en cours de partie (boutons
   d'action, alertes, règles détaillées) restent en français pour l'instant. */
const TRANSLATIONS = {
  fr: {
    'nav.home': 'Accueil', 'nav.players': 'Joueurs', 'nav.customs': 'Jeux perso', 'nav.history': 'Historique',
    'theme.button': 'Changer de thème', 'lang.button': 'Changer de langue',
    'footer.privacy': "Toutes les données restent sur cet appareil (localStorage) — aucune donnée n'est envoyée sur internet.",
    'footer.creditPre': 'Créé et maintenu par',
    'footer.creditPost': '— © 2026, tous droits réservés. Reproduction et réutilisation interdites.',
    'home.title': 'Choisir une partie',
    'home.searchPlaceholder': '🔍 Rechercher un jeu…',
    'home.emptySearch': 'Aucun jeu ne correspond à ta recherche.',
    'home.createCustom': '+ Créer un jeu personnalisé',
    'home.importGame': '📥 Importer une partie (code texte)',
    'common.back': '← Retour',
    'common.rulesTitle': 'Règles du jeu',
    'common.playerNamePlaceholder': 'Nom du joueur',
    'common.addBtn': '+ Ajouter',
    'customgame.title': 'Créer un jeu personnalisé',
    'customgame.nameLabel': 'Nom du jeu',
    'customgame.namePlaceholder': 'Ex : Belote, Tarot, Rami maison…',
    'customgame.directionLabel': 'Sens du score',
    'customgame.directionHint': 'Qui gagne à la fin de la partie ?',
    'customgame.directionDesc': 'Le score le plus <strong>haut</strong> gagne',
    'customgame.directionAsc': 'Le score le plus <strong>bas</strong> gagne',
    'customgame.endLabel': 'Fin de partie',
    'customgame.endHint': 'Comment la partie se termine-t-elle ?',
    'customgame.endRounds': 'Un nombre de manches fixé',
    'customgame.endTarget': 'Un objectif de points à atteindre',
    'customgame.roundsCountLabel': 'Nombre de manches',
    'customgame.targetLabel': 'Objectif de points',
    'customgame.vocabLabel': 'Vocabulaire',
    'customgame.roundWordLabel': "Nom d'une manche",
    'customgame.negativeLabel': 'Scores négatifs',
    'customgame.negativeHint': 'Peut-on saisir des points négatifs pour une manche ?',
    'customgame.negativeYes': 'Oui, autoriser le négatif',
    'customgame.negativeNo': 'Non, scores positifs uniquement',
    'customgame.save': 'Créer ce jeu',
    'setup.playersLabel': 'Joueurs',
    'setup.playersHint': 'Sélectionne des joueurs enregistrés ou ajoutes-en un nouveau.',
    'setup.startBtn': 'Commencer la partie',
    'board.abandon': '← Abandonner / Accueil',
    'customs.title': 'Mes jeux personnalisés',
    'customs.hint': 'Crée un jeu sur mesure : nom, sens du score, fin de partie (nombre de manches ou objectif de points) — tout est réglable.',
    'customs.newBtn': '+ Nouveau jeu personnalisé',
    'players.title': 'Joueurs enregistrés',
    'players.hint': 'Ces joueurs sont sauvegardés sur cet appareil et réutilisables pour toutes les parties.',
    'history.title': 'Historique des parties',
    'home.newGameCta': 'Nouvelle partie →',
    'home.openUndercover': 'Ouvrir Undercover →',
    'home.openLoupGarou': 'Ouvrir Loup-Garou →',
    'board.newGameBtn': 'Nouvelle partie',
    'common.close': 'Fermer',
    'common.cancel': 'Annuler',
    'common.and': 'et',
    'theme.modalTitle': 'Thème de la table',
    'theme.auto': "Automatique (suit l'appareil)",
    'theme.appledark': 'Apple Sombre',
    'theme.applelight': 'Apple Clair',
    'theme.fantasy': 'Fantastique',
    'export.title': 'Exporter la partie',
    'export.desc': "Copie ce code ({status}) et envoie-le pour le reprendre sur un autre appareil, via l'onglet « Importer ».",
    'export.statusFinished': 'partie terminée',
    'export.statusOngoing': 'partie en cours',
    'export.copyBtn': 'Copier le code',
    'export.copiedBtn': 'Copié ✓',
    'import.title': 'Importer une partie',
    'import.desc': 'Colle ici le code reçu (partie en cours ou terminée).',
    'import.placeholder': 'Colle le code ici…',
    'import.confirmBtn': 'Importer',
    'import.errorMsg': "Code invalide ou incomplet — vérifie qu'il a été copié en entier.",
    'import.confirmReplace': "Importer cette partie remplacera la partie en cours affichée à l'écran. Continuer ?",
    'board.metaTarget': 'Objectif : {n} points · {direction}',
    'board.metaRounds': '{played} / {total} manches · {direction}',
    'board.lowestWins': 'Score le plus bas gagne',
    'board.bestWins': 'Meilleur score gagne',
    'board.highestWins': 'Score le plus haut gagne',
    'board.tieBanner': '🤝 Égalité entre {names} avec {n} points !',
    'board.winnerBanner': '🏆 {name} remporte la partie avec {n} points !',
    'board.gameOverText': 'Partie terminée',
    'board.undoBtn': 'Annuler la dernière manche',
    'board.finishBtn': 'Terminer la partie maintenant',
    'board.finishConfirm': 'Terminer la partie avec les scores actuels ?',
    'board.exportBtn': 'Exporter (code texte)',
    'board.deleteGameBtn': 'Supprimer cette partie',
    'board.deleteGameConfirm': 'Supprimer définitivement cette partie en cours ?',
    'board.validateFirstRound': 'Valider la 1ère manche',
    'board.validateRound': 'Valider la manche',
    'board.needTwoPlayers': 'Il faut au moins 2 joueurs.',
    'board.removePlayerConfirm': 'Retirer {name} ? Son historique de scores dans cette partie sera perdu.',
    'board.addPlayerToggle': '+ Ajouter un joueur',
    'board.addPlayerTitle': 'Ajouter un joueur',
    'board.closeBtn': 'Fermer ✕',
    'board.addPlayerHintRounds': 'Il recevra 0 point pour les {n} manche(s) déjà jouée(s).',
    'board.addPlayerHintNew': 'Sélectionne un joueur enregistré ou ajoutes-en un nouveau.',
    'board.allRegisteredInGame': 'Tous les joueurs enregistrés sont déjà dans la partie.',
    'board.roundColumnHeader': 'Manche',
    'board.removePlayerTitle': 'Retirer ce joueur',
    'board.removePlayerAria': 'Retirer {name}',
    'players.noneYet': "Aucun joueur enregistré pour l'instant.",
    'players.statsNone': "Aucune partie terminée pour l'instant",
    'players.statsLine': '🏆 {wins} victoire{plural} sur {games}',
    'players.pluralS': 's',
    'players.statsAvg': ' · Ø {avg} pts',
    'players.statsStreak': ' · 🔥 série de {streak}',
    'players.addedOn': 'Ajouté le {date}',
    'players.deleteBtn': 'Supprimer',
    'players.deleteConfirm': 'Supprimer ce joueur de la liste enregistrée ?',
    'customs.noneYet': "Aucun jeu personnalisé pour l'instant.",
    'customs.lowestWins': 'plus bas gagne',
    'customs.highestWins': 'plus haut gagne',
    'customs.descTarget': 'Objectif {target} pts · {dir}',
    'customs.descRounds': '{rounds} manches · {dir}',
    'customs.editBtn': 'Modifier',
    'customs.deleteBtn': 'Supprimer',
    'customs.deleteConfirm': "Supprimer ce jeu personnalisé ? Les parties déjà jouées restent visibles dans l'historique.",
    'customgame.editTitle': 'Modifier le jeu personnalisé',
    'customgame.saveEdit': 'Enregistrer les modifications',
    'customgame.nameRequired': 'Donne un nom à ton jeu.',
    'setup.optionsTitle': 'Options',
    'setup.selectAtLeast2': 'Sélectionne au moins 2 joueurs',
    'setup.newGameSuffix': 'nouvelle partie',
    'setup.noPlayersYet': "Aucun joueur enregistré pour l'instant — ajoute un nom ci-dessous.",
    'history.noneYet': "Aucune partie terminée pour l'instant.",
    'history.roundsPlayed': '{n} manche(s)',
    'history.clearBtn': "Effacer l'historique",
    'history.clearConfirm': "Effacer tout l'historique des parties ?",
    'home.resumeTitle': 'Partie en cours — {label}',
    'home.resumeRounds': '{n} manche(s) jouée(s)',
    'home.resumeBtn': 'Reprendre →',
    'rules.notAvailable': 'Règles non disponibles.',
    'rules.customIntro': 'Jeu personnalisé — les règles de cartes précises se jouent entre vous à table, Smiley Games se charge juste des totaux.',
    'rules.customEndTarget': "dès qu'un total atteint ou dépasse <strong>{n} points</strong>",
    'rules.customEndRounds': 'après <strong>{n} {word}(s)</strong>',
    'rules.customWinAsc': 'le score le plus <strong>bas</strong> gagne',
    'rules.customWinDesc': 'le score le plus <strong>haut</strong> gagne',
    'rules.customEndsWhen': 'La partie se termine {endText}. À ce moment-là, {winText}.',
    'rules.customNegative': 'Scores négatifs pour une {word} : {state}.',
    'rules.allowed': '<strong>autorisés</strong>',
    'rules.notAllowed': '<strong>non autorisés</strong>',
    'gameDescr.cinqrois': '11 manches. Combinaisons de suites &amp; familles. Le score le plus bas gagne.',
    'gameDescr.flip7': 'Prise de risque. Objectif 200 points. Le score le plus haut gagne.',
    'gameDescr.roidesnains': '7 donnes, une quête différente à chaque fois. Le score le plus haut gagne.',
    'gameDescr.caracole': "Combinaisons de cartes, le 8 vaut 0. Dès qu'un joueur dépasse 100, le plus bas total gagne.",
    'gameDescr.tarot': 'Le preneur contre la défense. Scores positifs ou négatifs selon les donnes.',
    'gameDescr.belote': 'Par équipes de 2. Objectif 501 points, atout et annonces.',
    'gameDescr.rami': 'Suites et brelans pour vider sa main. Le score le plus bas gagne.',
    'gameDescr.skyjo': 'Grille de cartes cachées, de -2 à 12. Objectif 100, le plus bas gagne.',
    'gameDescr.uno': 'Premier à vider sa main marque 0. Objectif 500, le plus bas gagne.',
    'gameDescr.yams': '13 catégories de dés à remplir. Le score le plus haut gagne.',
    'gameDescr.president': 'Hiérarchie qui change à chaque manche. Le score le plus haut gagne.',
    'gameDescr.millebornes': "Course par étapes jusqu'à 1000 km. Le score le plus haut gagne.",
    'gameDescr.poker': 'Suivi des jetons gagnés/perdus main par main. Le total le plus haut gagne.',
    'gameDescr.kaid': 'Jeu de plis traditionnel corse. Le score le plus haut gagne.',
    'gameDescr.killer': 'Élimination progressive de cibles secrètes. Le dernier survivant gagne.',
    'gameDescr.cinqcents': 'Variante du Rami, objectif 500 points. Le score le plus haut gagne.',
    'gameDescr.undercover': 'Jeu de bluff et de déduction à un seul téléphone. Pas de score à saisir : ce jeu se joue à part.',
    'gameDescr.loupgarou': 'Rôles cachés, phases nuit/jour, meneur de jeu automatique. Pas de score à saisir : ce jeu se joue à part.'
  },
  en: {
    'nav.home': 'Home', 'nav.players': 'Players', 'nav.customs': 'Custom games', 'nav.history': 'History',
    'theme.button': 'Change theme', 'lang.button': 'Change language',
    'footer.privacy': 'All data stays on this device (localStorage) — nothing is sent over the internet.',
    'footer.creditPre': 'Made and maintained by',
    'footer.creditPost': '— © 2026, all rights reserved. Reproduction and reuse prohibited.',
    'home.title': 'Choose a game',
    'home.searchPlaceholder': '🔍 Search for a game…',
    'home.emptySearch': 'No game matches your search.',
    'home.createCustom': '+ Create a custom game',
    'home.importGame': '📥 Import a game (text code)',
    'common.back': '← Back',
    'common.rulesTitle': 'Game rules',
    'common.playerNamePlaceholder': 'Player name',
    'common.addBtn': '+ Add',
    'customgame.title': 'Create a custom game',
    'customgame.nameLabel': 'Game name',
    'customgame.namePlaceholder': 'E.g. Belote, Tarot, house Rummy…',
    'customgame.directionLabel': 'Scoring direction',
    'customgame.directionHint': 'Who wins at the end of the game?',
    'customgame.directionDesc': 'The <strong>highest</strong> score wins',
    'customgame.directionAsc': 'The <strong>lowest</strong> score wins',
    'customgame.endLabel': 'End of game',
    'customgame.endHint': 'How does the game end?',
    'customgame.endRounds': 'A fixed number of rounds',
    'customgame.endTarget': 'A points target to reach',
    'customgame.roundsCountLabel': 'Number of rounds',
    'customgame.targetLabel': 'Points target',
    'customgame.vocabLabel': 'Vocabulary',
    'customgame.roundWordLabel': 'Name of a round',
    'customgame.negativeLabel': 'Negative scores',
    'customgame.negativeHint': 'Can a round score be negative?',
    'customgame.negativeYes': 'Yes, allow negative scores',
    'customgame.negativeNo': 'No, positive scores only',
    'customgame.save': 'Create this game',
    'setup.playersLabel': 'Players',
    'setup.playersHint': 'Pick registered players or add a new one.',
    'setup.startBtn': 'Start the game',
    'board.abandon': '← Give up / Home',
    'customs.title': 'My custom games',
    'customs.hint': 'Build your own game: name, scoring direction, end condition (fixed rounds or points target) — fully configurable.',
    'customs.newBtn': '+ New custom game',
    'players.title': 'Registered players',
    'players.hint': 'These players are saved on this device and reusable across every game.',
    'history.title': 'Game history',
    'home.newGameCta': 'New game →',
    'home.openUndercover': 'Open Undercover →',
    'home.openLoupGarou': 'Open Werewolf →',
    'board.newGameBtn': 'New game',
    'common.close': 'Close',
    'common.cancel': 'Cancel',
    'common.and': 'and',
    'theme.modalTitle': 'Table theme',
    'theme.auto': 'Automatic (follows device)',
    'theme.appledark': 'Apple Dark',
    'theme.applelight': 'Apple Light',
    'theme.fantasy': 'Fantasy',
    'export.title': 'Export the game',
    'export.desc': 'Copy this code ({status}) and send it to resume on another device, via the "Import" tab.',
    'export.statusFinished': 'finished game',
    'export.statusOngoing': 'ongoing game',
    'export.copyBtn': 'Copy code',
    'export.copiedBtn': 'Copied ✓',
    'import.title': 'Import a game',
    'import.desc': 'Paste the code you received here (ongoing or finished game).',
    'import.placeholder': 'Paste the code here…',
    'import.confirmBtn': 'Import',
    'import.errorMsg': 'Invalid or incomplete code — check that it was copied in full.',
    'import.confirmReplace': 'Importing this game will replace the game currently shown on screen. Continue?',
    'board.metaTarget': 'Target: {n} points · {direction}',
    'board.metaRounds': '{played} / {total} rounds · {direction}',
    'board.lowestWins': 'Lowest score wins',
    'board.bestWins': 'Best score wins',
    'board.highestWins': 'Highest score wins',
    'board.tieBanner': '🤝 Tie between {names} with {n} points!',
    'board.winnerBanner': '🏆 {name} wins the game with {n} points!',
    'board.gameOverText': 'Game over',
    'board.undoBtn': 'Undo last round',
    'board.finishBtn': 'End the game now',
    'board.finishConfirm': 'End the game with the current scores?',
    'board.exportBtn': 'Export (text code)',
    'board.deleteGameBtn': 'Delete this game',
    'board.deleteGameConfirm': 'Permanently delete this ongoing game?',
    'board.validateFirstRound': 'Confirm the 1st round',
    'board.validateRound': 'Confirm the round',
    'board.needTwoPlayers': 'You need at least 2 players.',
    'board.removePlayerConfirm': "Remove {name}? Their score history in this game will be lost.",
    'board.addPlayerToggle': '+ Add a player',
    'board.addPlayerTitle': 'Add a player',
    'board.closeBtn': 'Close ✕',
    'board.addPlayerHintRounds': "They'll receive 0 points for the {n} round(s) already played.",
    'board.addPlayerHintNew': 'Pick a registered player or add a new one.',
    'board.allRegisteredInGame': 'All registered players are already in the game.',
    'board.roundColumnHeader': 'Round',
    'board.removePlayerTitle': 'Remove this player',
    'board.removePlayerAria': 'Remove {name}',
    'players.noneYet': 'No registered players yet.',
    'players.statsNone': 'No finished games yet',
    'players.statsLine': '🏆 {wins} win{plural} out of {games}',
    'players.pluralS': 's',
    'players.statsAvg': ' · Avg {avg} pts',
    'players.statsStreak': ' · 🔥 streak of {streak}',
    'players.addedOn': 'Added on {date}',
    'players.deleteBtn': 'Delete',
    'players.deleteConfirm': 'Remove this player from the registered list?',
    'customs.noneYet': 'No custom games yet.',
    'customs.lowestWins': 'lowest wins',
    'customs.highestWins': 'highest wins',
    'customs.descTarget': 'Target {target} pts · {dir}',
    'customs.descRounds': '{rounds} rounds · {dir}',
    'customs.editBtn': 'Edit',
    'customs.deleteBtn': 'Delete',
    'customs.deleteConfirm': 'Delete this custom game? Games already played remain visible in the history.',
    'customgame.editTitle': 'Edit custom game',
    'customgame.saveEdit': 'Save changes',
    'customgame.nameRequired': 'Give your game a name.',
    'setup.optionsTitle': 'Options',
    'setup.selectAtLeast2': 'Select at least 2 players',
    'setup.newGameSuffix': 'new game',
    'setup.noPlayersYet': 'No registered players yet — add a name below.',
    'history.noneYet': 'No finished games yet.',
    'history.roundsPlayed': '{n} round(s)',
    'history.clearBtn': 'Clear history',
    'history.clearConfirm': 'Clear the entire game history?',
    'home.resumeTitle': 'Game in progress — {label}',
    'home.resumeRounds': '{n} round(s) played',
    'home.resumeBtn': 'Resume →',
    'rules.notAvailable': 'Rules not available.',
    'rules.customIntro': "Custom game — the exact card rules are played out among you at the table, Smiley Games just handles the totals.",
    'rules.customEndTarget': 'as soon as a total reaches or exceeds <strong>{n} points</strong>',
    'rules.customEndRounds': 'after <strong>{n} {word}(s)</strong>',
    'rules.customWinAsc': 'the <strong>lowest</strong> score wins',
    'rules.customWinDesc': 'the <strong>highest</strong> score wins',
    'rules.customEndsWhen': 'The game ends {endText}. At that point, {winText}.',
    'rules.customNegative': 'Negative scores for a {word}: {state}.',
    'rules.allowed': '<strong>allowed</strong>',
    'rules.notAllowed': '<strong>not allowed</strong>',
    'gameDescr.cinqrois': '11 rounds. Runs &amp; sets combinations. Lowest score wins.',
    'gameDescr.flip7': 'Push your luck. Target 200 points. Highest score wins.',
    'gameDescr.roidesnains': '7 hands, a different quest each time. Highest score wins.',
    'gameDescr.caracole': "Card combinations, 8 counts as 0. Once someone tops 100, the lowest total wins.",
    'gameDescr.tarot': 'The bidder against the defense. Positive or negative scores depending on the hand.',
    'gameDescr.belote': 'Played in teams of 2. Target 501 points, trump suit and bids.',
    'gameDescr.rami': 'Runs and sets to empty your hand. Lowest score wins.',
    'gameDescr.skyjo': 'Grid of hidden cards, from -2 to 12. Target 100, lowest wins.',
    'gameDescr.uno': 'First to empty their hand scores 0. Target 500, lowest wins.',
    'gameDescr.yams': '13 dice categories to fill in. Highest score wins.',
    'gameDescr.president': 'Hierarchy that shifts every round. Highest score wins.',
    'gameDescr.millebornes': "Step-by-step race up to 1000 km. Highest score wins.",
    'gameDescr.poker': 'Track chips won/lost hand by hand. Highest total wins.',
    'gameDescr.kaid': 'Traditional Corsican trick-taking game. Highest score wins.',
    'gameDescr.killer': 'Progressive elimination of secret targets. Last survivor wins.',
    'gameDescr.cinqcents': 'Rummy variant, target 500 points. Highest score wins.',
    'gameDescr.undercover': "Bluffing and deduction game on a single phone. No score to enter: this game is played separately.",
    'gameDescr.loupgarou': "Hidden roles, night/day phases, automatic game master. No score to enter: this game is played separately."
  }
};

const SUPPORTED_LANGS = ['fr', 'en'];

function detectLang() {
  try {
    const saved = localStorage.getItem('mp_lang_v1');
    if (saved && SUPPORTED_LANGS.includes(saved)) return saved;
  } catch (e) {}
  const nav = (navigator.language || navigator.userLanguage || 'fr').slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(nav) ? nav : 'fr';
}

let currentLang = detectLang();

function t(key) {
  return (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) || TRANSLATIONS.fr[key] || key;
}

function tf(key, vars) {
  return t(key).replace(/\{(\w+)\}/g, (_, k) => (vars && vars[k] != null) ? vars[k] : '');
}

function setLang(lang) {
  currentLang = SUPPORTED_LANGS.includes(lang) ? lang : 'fr';
  try { localStorage.setItem('mp_lang_v1', currentLang); } catch (e) {}
  document.documentElement.lang = currentLang;
  applyI18n(document);
}

function applyI18n(root) {
  root.querySelectorAll('[data-i18n]').forEach(el => { el.innerHTML = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    const txt = t(el.dataset.i18nTitle);
    el.title = txt;
    el.setAttribute('aria-label', txt);
  });
}

function openLangModal() {
  const overlay = openModal(`
    <h3 class="modal-title">🌐 ${t('lang.button')}</h3>
    <div class="theme-grid" id="lang-grid">
      <button type="button" class="theme-opt" data-lang="fr">🇫🇷 Français</button>
      <button type="button" class="theme-opt" data-lang="en">🇬🇧 English</button>
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" id="lang-close-btn">${currentLang === 'en' ? 'Close' : 'Fermer'}</button>
    </div>`);
  overlay.querySelectorAll('[data-lang]').forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.lang === currentLang);
    btn.addEventListener('click', () => {
      setLang(btn.dataset.lang);
      closeModal();
      setView('home');
    });
  });
  overlay.querySelector('#lang-close-btn').addEventListener('click', closeModal);
}

document.getElementById('lang-btn').addEventListener('click', openLangModal);
document.documentElement.lang = currentLang;
applyI18n(document);

function normalize(str) {
  return String(str).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/* Statistiques d'un joueur calculées à partir des parties archivées dans l'historique */
function computePlayerStats(playerId) {
  const history = getHistory(); // déjà trié du plus récent au plus ancien
  const played = history.filter(h => h.players.some(p => p.id === playerId));
  let wins = 0, totalScore = 0, scoredCount = 0, streak = 0, streakBroken = false;
  played.forEach(h => {
    const idx = h.players.findIndex(p => p.id === playerId);
    const winnerIds = h.winnerIds || (h.winnerId != null ? [h.winnerId] : []);
    const won = winnerIds.includes(idx);
    if (won) wins++;
    if (idx >= 0 && Number.isFinite(h.totals[idx])) { totalScore += h.totals[idx]; scoredCount++; }
    if (!streakBroken) { if (won) streak++; else streakBroken = true; }
  });
  return {
    gamesPlayed: played.length,
    wins,
    avgScore: scoredCount ? Math.round((totalScore / scoredCount) * 10) / 10 : null,
    streak
  };
}

function joinNames(names) {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} ${t('common.and')} ${names[names.length - 1]}`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- Numéro de version (nombre de commits GitHub) ---------- */
async function loadVersionLabel() {
  const el = document.getElementById('version-line');
  if (!el) return;
  try {
    const res = await fetch('https://api.github.com/repos/Smiley-droid/smiley-games/commits?per_page=1');
    if (!res.ok) return;
    const link = res.headers.get('Link') || res.headers.get('link');
    let count = null;
    if (link) {
      const match = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
      if (match) count = parseInt(match[1], 10);
    } else {
      const data = await res.json();
      if (Array.isArray(data)) count = data.length;
    }
    if (count) el.textContent = `Version n°${count}`;
  } catch (e) {
    console.error('Impossible de récupérer le numéro de version', e);
  }
}
loadVersionLabel();

/* ---------- Démarrage ---------- */
setView('home');
