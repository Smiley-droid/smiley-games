/* =========================================================
   Smiley Games — Cinq Rois, Flip 7 & jeux personnalisés
   Stockage 100% local (localStorage), aucune donnée réseau.
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
  cinqrois: `<p>11 manches, une par nombre de cartes distribuées (de 3 à 13). Chaque manche, on cherche à se débarrasser de sa main en formant des <strong>suites</strong> (cartes qui se suivent, même couleur) et des <strong>familles</strong> (même valeur, couleurs différentes).</p>
    <p>À la fin de chaque manche, les cartes qui restent en main comptent en points de pénalité (figures = 10, As = 1, etc. selon vos règles de table). Le score le plus <strong>bas</strong> à la fin des 11 manches gagne.</p>`,
  flip7: `<p>Jeu de prise de risque : à chaque tour, on retourne des cartes une par une et on peut s'arrêter ("rester") ou continuer ("flip"). Si on retourne deux fois la même valeur, on est éliminé du tour sans marquer de points.</p>
    <p>Réunir 7 cartes différentes dans un tour rapporte un bonus de +15. Premier joueur à atteindre <strong>200 points</strong> (score le plus haut) déclenche la fin de la partie.</p>`,
  roidesnains: `<p>7 donnes, chacune avec une "quête" différente (annoncée avant de jouer) qui détermine comment les points sont gagnés ou perdus ce tour-là — d'où la possibilité de scores négatifs.</p>
    <p>Après les 7 donnes, le total le plus <strong>haut</strong> gagne.</p>`,
  caracole: `<p>Jeu de combinaisons (52 cartes) : paires, brelans, carrés, ou suites de 3+ cartes de même couleur à poser sur la pile. Un joueur peut "caracoler" quand il lui reste 10 points ou moins en main.</p>
    <p>Valeur des cartes : 1 à 7 = leur valeur, <strong>8 = 0</strong>, Valet = 11, Dame = 12, Roi = 13. Le vainqueur de la manche marque 0, le "caracoleur" qui ne gagne pas prend 30 points de pénalité, les autres marquent les points restant en main.</p>
    <p>Dès qu'un joueur <strong>dépasse 100 points</strong> au total, la partie s'arrête : le total le plus <strong>bas</strong> gagne.</p>`
};

function getRulesHtml(gameDef) {
  if (!gameDef.custom) {
    return BUILTIN_RULES[gameDef.id] || '<p>Règles non disponibles.</p>';
  }
  // Jeu personnalisé : pas de vraies règles de carte connues, on explique le fonctionnement configuré.
  const endText = gameDef.endMode === 'target'
    ? `dès qu'un total atteint ou dépasse <strong>${gameDef.defaultTarget} points</strong>`
    : `après <strong>${gameDef.defaultRounds} ${gameDef.roundWord.toLowerCase()}(s)</strong>`;
  const winText = gameDef.direction === 'asc' ? 'le score le plus <strong>bas</strong> gagne' : 'le score le plus <strong>haut</strong> gagne';
  return `<p>Jeu personnalisé — les règles de cartes précises se jouent entre vous à table, Smiley Games se charge juste des totaux.</p>
    <p>La partie se termine ${endText}. À ce moment-là, ${winText}.</p>
    <p>Scores négatifs pour une ${gameDef.roundWord.toLowerCase()} : ${gameDef.allowNegative ? '<strong>autorisés</strong>' : '<strong>non autorisés</strong>'}.</p>`;
}

function openRulesModal(gameDef) {
  openModal(`
    <h3 class="modal-title">${gameDef.suit} Règles — ${escapeHtml(gameDef.label)}</h3>
    ${getRulesHtml(gameDef)}
    <div class="modal-actions">
      <button class="btn-primary" id="rules-close-btn">Fermer</button>
    </div>`);
  document.getElementById('rules-close-btn').addEventListener('click', closeModal);
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
    <h3 class="modal-title">Exporter la partie</h3>
    <p class="hint">Copie ce code (${game.finished ? 'partie terminée' : 'partie en cours'}) et envoie-le pour le reprendre sur un autre appareil, via l'onglet « Importer ».</p>
    <textarea id="export-code" class="code-textarea" rows="6" readonly></textarea>
    <div class="modal-actions">
      <button class="btn-primary" id="export-copy-btn">Copier le code</button>
      <button class="btn-ghost" id="export-close-btn">Fermer</button>
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
    e.target.textContent = 'Copié ✓';
    setTimeout(() => { e.target.textContent = 'Copier le code'; }, 1500);
  });
  overlay.querySelector('#export-close-btn').addEventListener('click', closeModal);
}

function openImportModal() {
  const overlay = openModal(`
    <h3 class="modal-title">Importer une partie</h3>
    <p class="hint">Colle ici le code reçu (partie en cours ou terminée).</p>
    <textarea id="import-code" class="code-textarea" rows="6" placeholder="Colle le code ici…"></textarea>
    <p class="import-error hidden" id="import-error"></p>
    <div class="modal-actions">
      <button class="btn-primary" id="import-confirm-btn">Importer</button>
      <button class="btn-ghost" id="import-close-btn">Annuler</button>
    </div>`);
  overlay.querySelector('#import-close-btn').addEventListener('click', closeModal);
  overlay.querySelector('#import-confirm-btn').addEventListener('click', () => {
    const val = overlay.querySelector('#import-code').value;
    const errEl = overlay.querySelector('#import-error');
    let game;
    try {
      game = importGameCode(val);
    } catch (e) {
      errEl.textContent = "Code invalide ou incomplet — vérifie qu'il a été copié en entier.";
      errEl.classList.remove('hidden');
      return;
    }
    const existing = getCurrentGame();
    if (existing && !confirm("Importer cette partie remplacera la partie en cours affichée à l'écran. Continuer ?")) {
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

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => setView(btn.dataset.view));
});

/* ---------- Vue: Accueil ---------- */
function renderHome() {
  const tpl = document.getElementById('tpl-home');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));

  const picker = document.getElementById('game-picker');
  const builtinDescr = {
    cinqrois: '11 manches. Combinaisons de suites &amp; familles. Le score le plus bas gagne.',
    flip7: 'Prise de risque. Objectif 200 points. Le score le plus haut gagne.',
    roidesnains: '7 donnes, une quête différente à chaque fois. Le score le plus haut gagne.',
    caracole: 'Combinaisons de cartes, le 8 vaut 0. Dès qu\'un joueur dépasse 100, le plus bas total gagne.'
  };

  function makeCard(type, def, descr) {
    const btn = document.createElement('button');
    btn.className = 'game-card';
    btn.innerHTML = `
      <span class="game-card-suit">${def.suit}</span>
      <h3>${escapeHtml(def.label)}</h3>
      <p>${descr}</p>
      <span class="game-card-cta">Nouvelle partie →</span>`;
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

  const undercoverCard = document.createElement('button');
  undercoverCard.className = 'game-card';
  undercoverCard.innerHTML = `
    <span class="game-card-suit">🕵️</span>
    <h3>Undercover</h3>
    <p>Jeu de bluff et de déduction à un seul téléphone. Pas de score à saisir : ce jeu se joue à part.</p>
    <span class="game-card-cta">Ouvrir Undercover →</span>`;
  undercoverCard.addEventListener('click', () => { window.location.href = 'undercover/index.html'; });
  picker.appendChild(undercoverCard);

  getCustomGames().forEach(cg => {
    const def = getGameDef('custom:' + cg.id);
    const descr = def.endMode === 'target'
      ? `Objectif ${def.defaultTarget} points. ${def.direction === 'asc' ? 'Score le plus bas gagne.' : 'Score le plus haut gagne.'}`
      : `${def.defaultRounds} manches. ${def.direction === 'asc' ? 'Score le plus bas gagne.' : 'Score le plus haut gagne.'}`;
    picker.appendChild(makeCard('custom:' + cg.id, def, descr));
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
            <strong>Partie en cours — ${escapeHtml(gameDef.label)}</strong>
            <p>${current.players.map(p => escapeHtml(p.name)).join(', ')} · ${current.rounds.length} manche(s) jouée(s)</p>
          </div>
          <button class="btn-ghost" id="resume-btn" style="border-color:var(--felt-1);color:var(--felt-1);">Reprendre →</button>
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

  document.getElementById('setup-title').textContent = `${gameDef.suit} ${gameDef.label} — nouvelle partie`;
  document.getElementById('setup-rules-btn').addEventListener('click', () => openRulesModal(gameDef));
  document.querySelector('[data-back="home"]').addEventListener('click', () => setView('home'));

  const listEl = document.getElementById('setup-player-list');

  function renderChips() {
    const players = getPlayers();
    listEl.innerHTML = '';
    if (players.length === 0) {
      listEl.innerHTML = '<p class="hint" style="margin:0;">Aucun joueur enregistré pour l\'instant — ajoute un nom ci-dessous.</p>';
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
    optionsBlock.innerHTML = `<h3>Options</h3><div class="option-row">
        <label for="opt-target">Score cible</label>
        <input type="number" id="opt-target" min="1" step="5" value="${gameDef.defaultTarget || 100}">
      </div>`;
  } else {
    optionsBlock.innerHTML = `<h3>Options</h3><div class="option-row">
        <label for="opt-maxrounds">Nombre de manches</label>
        <input type="number" id="opt-maxrounds" min="1" max="50" value="${gameDef.defaultRounds || 10}">
      </div>`;
  }

  const startBtn = document.getElementById('setup-start');
  function refreshStartState() {
    startBtn.disabled = setupSelectedPlayers.length < 2;
    startBtn.textContent = setupSelectedPlayers.length < 2
      ? 'Sélectionne au moins 2 joueurs'
      : 'Commencer la partie';
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

  document.querySelector('[data-back="home"]').addEventListener('click', () => setView('home'));
  document.getElementById('board-title').textContent = `${gameDef.suit} ${gameDef.label}`;
  document.getElementById('board-rules-btn').addEventListener('click', () => openRulesModal(gameDef));

  const totals = computeTotals(game);
  const ranking = getRanking(gameDef, totals);
  const leaderIdx = ranking.length ? ranking[0].i : -1;

  document.getElementById('board-meta').textContent = gameDef.endMode === 'target'
    ? `Objectif : ${game.target} points · ${gameDef.direction === 'asc' ? 'Score le plus bas gagne' : 'Meilleur score gagne'}`
    : `${game.rounds.length} / ${game.maxRounds} manches · ${gameDef.direction === 'asc' ? 'Score le plus bas gagne' : 'Score le plus haut gagne'}`;

  const bannerEl = document.getElementById('winner-banner');
  if (game.finished) {
    const winner = game.players[game.winnerId];
    bannerEl.classList.remove('hidden');
    bannerEl.textContent = winner ? `🏆 ${winner.name} remporte la partie avec ${totals[game.winnerId]} points !` : 'Partie terminée';
  } else {
    bannerEl.classList.add('hidden');
  }

  /* Construction du tableau */
  const table = document.getElementById('scoreboard');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.innerHTML = '<th>Manche</th>' + game.players.map((p, i) => `
    <th>
      <div class="player-col-name">
        <span>${escapeHtml(p.name)}</span>
        ${!game.finished ? `<button class="remove-col" data-remove-player="${i}" title="Retirer ce joueur" aria-label="Retirer ${escapeHtml(p.name)}">×</button>` : ''}
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
    const isLeader = i === leaderIdx && game.rounds.length > 0;
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
        alert('Il faut au moins 2 joueurs.');
        return;
      }
      if (game.rounds.length > 0) {
        const name = game.players[idx].name;
        if (!confirm(`Retirer ${name} ? Son historique de scores dans cette partie sera perdu.`)) return;
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
      manageEl.innerHTML = `<button class="board-toggle-add" id="board-toggle-add-btn">+ Ajouter un joueur</button>`;
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
            <h3>Ajouter un joueur</h3>
            <button class="icon-btn" id="board-close-add-btn" style="color:#6b6550;">Fermer ✕</button>
          </div>
          <p class="hint">${game.rounds.length > 0 ? `Il recevra 0 point pour les ${game.rounds.length} manche(s) déjà jouée(s).` : 'Sélectionne un joueur enregistré ou ajoutes-en un nouveau.'}</p>
          <div class="chip-list" id="board-available-chips"></div>
          <div class="inline-add">
            <input type="text" id="board-new-player" placeholder="Nom du joueur" maxlength="24">
            <button id="board-add-player-btn" class="btn-ghost">+ Ajouter</button>
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
        chipsEl.innerHTML = '<p class="hint" style="margin:0;">Tous les joueurs enregistrés sont déjà dans la partie.</p>';
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
    addBtn.textContent = game.rounds.length === 0 ? 'Valider la 1ère manche' : 'Valider la manche';
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
        const rank = getRanking(gameDef, newTotals);
        game.winnerId = rank[0].i;
        archiveGame(gameDef, game, newTotals);
      }
      saveCurrentGame(game);
      renderBoard();
    });
    actionsEl.appendChild(addBtn);

    if (game.rounds.length > 0) {
      const undoBtn = document.createElement('button');
      undoBtn.className = 'btn-ghost';
      undoBtn.textContent = 'Annuler la dernière manche';
      undoBtn.addEventListener('click', () => {
        game.rounds.pop();
        saveCurrentGame(game);
        renderBoard();
      });
      actionsEl.appendChild(undoBtn);
    }

    const finishBtn = document.createElement('button');
    finishBtn.className = 'btn-ghost';
    finishBtn.textContent = 'Terminer la partie maintenant';
    finishBtn.addEventListener('click', () => {
      if (!confirm('Terminer la partie avec les scores actuels ?')) return;
      const finalTotals = computeTotals(game);
      game.finished = true;
      const rank = getRanking(gameDef, finalTotals);
      game.winnerId = rank[0].i;
      archiveGame(gameDef, game, finalTotals);
      saveCurrentGame(game);
      renderBoard();
    });
    actionsEl.appendChild(finishBtn);
  } else {
    const newGameBtn = document.createElement('button');
    newGameBtn.className = 'btn-primary';
    newGameBtn.textContent = 'Nouvelle partie';
    newGameBtn.addEventListener('click', () => {
      clearCurrentGame();
      setView('home');
    });
    actionsEl.appendChild(newGameBtn);
  }

  const exportBtn = document.createElement('button');
  exportBtn.className = 'btn-ghost';
  exportBtn.textContent = 'Exporter (code texte)';
  exportBtn.addEventListener('click', () => openExportModal(game));
  actionsEl.appendChild(exportBtn);

  const abandonBtn = document.createElement('button');
  abandonBtn.className = 'btn-ghost';
  abandonBtn.textContent = 'Supprimer cette partie';
  abandonBtn.addEventListener('click', () => {
    if (!confirm('Supprimer définitivement cette partie en cours ?')) return;
    clearCurrentGame();
    setView('home');
  });
  actionsEl.appendChild(abandonBtn);

  const firstInput = table.querySelector('[data-score-input]');
  if (firstInput) firstInput.focus();
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
      listEl.innerHTML = '<p class="empty-note" style="color:rgba(246,241,226,0.7);">Aucun joueur enregistré pour l\'instant.</p>';
      return;
    }
    listEl.innerHTML = '';
    players.forEach(p => {
      const li = document.createElement('li');
      const date = p.createdAt ? new Date(p.createdAt).toLocaleDateString('fr-FR') : '';
      li.innerHTML = `
        <div>
          <div class="pname">${escapeHtml(p.name)}</div>
          <div class="pmeta">Ajouté le ${date}</div>
        </div>
        <button class="icon-btn" data-remove="${p.id}">Supprimer</button>`;
      listEl.appendChild(li);
    });
    listEl.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.remove;
        if (!confirm('Supprimer ce joueur de la liste enregistrée ?')) return;
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

  document.getElementById('customs-new-btn').addEventListener('click', () => {
    editingCustomId = null;
    setView('customnew');
  });

  const listEl = document.getElementById('customs-list');
  const customs = getCustomGames();
  if (customs.length === 0) {
    listEl.innerHTML = '<p class="empty-note" style="color:rgba(246,241,226,0.7);">Aucun jeu personnalisé pour l\'instant.</p>';
    return;
  }
  listEl.innerHTML = '';
  customs.forEach(cg => {
    const desc = cg.endMode === 'target'
      ? `Objectif ${cg.target} pts · ${cg.direction === 'asc' ? 'plus bas gagne' : 'plus haut gagne'}`
      : `${cg.roundsCount} manches · ${cg.direction === 'asc' ? 'plus bas gagne' : 'plus haut gagne'}`;
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <div class="pname">${cg.suit || '★'} ${escapeHtml(cg.name)}</div>
        <div class="pmeta">${desc}</div>
      </div>
      <div class="custom-game-card-actions">
        <button class="btn-ghost" data-edit="${cg.id}" style="border-color:var(--felt-1);color:var(--felt-1);padding:6px 10px;">Modifier</button>
        <button class="icon-btn" data-remove="${cg.id}">Supprimer</button>
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
      if (!confirm('Supprimer ce jeu personnalisé ? Les parties déjà jouées restent visibles dans l\'historique.')) return;
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
    document.querySelector('.view-title').textContent = 'Modifier le jeu personnalisé';
    saveBtn.textContent = 'Enregistrer les modifications';
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
    if (!name) { alert('Donne un nom à ton jeu.'); nameInput.focus(); return; }
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

  const listEl = document.getElementById('history-list');
  const history = getHistory();
  if (history.length === 0) {
    listEl.innerHTML = '<p class="empty-note">Aucune partie terminée pour l\'instant.</p>';
    return;
  }

  history.forEach(h => {
    const div = document.createElement('div');
    div.className = 'history-card';
    const date = new Date(h.finishedAt).toLocaleString('fr-FR');
    const pills = h.players.map((p, i) => `
      <span class="history-pill ${i === h.winnerId ? 'win' : ''}">${escapeHtml(p.name)} · ${h.totals[i]}</span>
    `).join('');
    div.innerHTML = `
      <h4>${h.suit || ''} ${escapeHtml(h.label || h.type)}</h4>
      <div class="hdate">${date} · ${h.roundsPlayed} manche(s)</div>
      <div class="history-scores">${pills}</div>`;
    listEl.appendChild(div);
  });

  const clearBtn = document.createElement('button');
  clearBtn.className = 'btn-ghost';
  clearBtn.textContent = 'Effacer l\'historique';
  clearBtn.style.marginTop = '8px';
  clearBtn.addEventListener('click', () => {
    if (!confirm('Effacer tout l\'historique des parties ?')) return;
    saveHistory([]);
    renderHistory();
  });
  listEl.appendChild(clearBtn);
}

/* ---------- Utilitaires ---------- */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ---------- Démarrage ---------- */
setView('home');
