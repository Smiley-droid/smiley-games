/* =========================================================
   Marque-Points — Cinq Rois & Flip 7
   Stockage 100% local (localStorage), aucune donnée réseau.
   ========================================================= */

const STORAGE_KEYS = {
  players: 'mp_players_v1',
  currentGame: 'mp_current_game_v1',
  history: 'mp_history_v1'
};

const GAMES = {
  cinqrois: {
    label: 'Cinq Rois',
    suit: '♦',
    defaultRounds: 11,
    direction: 'asc', // le score le plus BAS gagne
    roundLabel: (n) => `Manche ${n}`,
    describeOptions() {
      return `<div class="option-row">
        <label for="opt-maxrounds">Nombre de manches</label>
        <input type="number" id="opt-maxrounds" min="1" max="20" value="11">
      </div>`;
    }
  },
  flip7: {
    label: 'Flip 7',
    suit: '♥',
    direction: 'desc', // le score le plus HAUT gagne
    target: 200,
    roundLabel: (n) => `Tour ${n}`,
    describeOptions() {
      return `<div class="option-row">
        <label for="opt-target">Score cible</label>
        <input type="number" id="opt-target" min="10" step="5" value="200">
      </div>`;
    }
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
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Erreur d\'écriture localStorage', e);
    }
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

/* ---------- Router ---------- */
const app = document.getElementById('app');
let setupSelectedGame = null;
let setupSelectedPlayers = [];

function setView(view, payload) {
  document.querySelectorAll('.nav-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === view);
  });
  if (view === 'home') renderHome();
  else if (view === 'players') renderPlayers();
  else if (view === 'history') renderHistory();
  else if (view === 'setup') renderSetup(payload);
  else if (view === 'board') renderBoard();
}

document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => setView(btn.dataset.view));
});

/* ---------- Vue: Accueil ---------- */
function renderHome() {
  const tpl = document.getElementById('tpl-home');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));

  app.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => {
      setupSelectedGame = card.dataset.game;
      setupSelectedPlayers = [];
      setView('setup');
    });
  });

  const resumeZone = document.getElementById('resume-zone');
  const current = getCurrentGame();
  if (current && !current.finished) {
    const gameDef = GAMES[current.type];
    resumeZone.innerHTML = `
      <div class="resume-card">
        <div>
          <strong>Partie en cours — ${gameDef.label}</strong>
          <p>${current.players.map(p => p.name).join(', ')} · ${current.rounds.length} manche(s) jouée(s)</p>
        </div>
        <button class="btn-ghost" id="resume-btn" style="border-color:var(--felt-1);color:var(--felt-1);">Reprendre →</button>
      </div>`;
    document.getElementById('resume-btn').addEventListener('click', () => setView('board'));
  }
}

/* ---------- Vue: Configuration nouvelle partie ---------- */
function renderSetup() {
  if (!setupSelectedGame) { setView('home'); return; }
  const gameDef = GAMES[setupSelectedGame];
  const tpl = document.getElementById('tpl-setup');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));

  document.getElementById('setup-title').textContent = `${gameDef.suit} ${gameDef.label} — nouvelle partie`;
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

  document.getElementById('setup-options').innerHTML = gameDef.describeOptions();

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
    if (setupSelectedGame === 'cinqrois') {
      const v = parseInt(document.getElementById('opt-maxrounds').value, 10);
      game.maxRounds = (v && v > 0) ? v : GAMES.cinqrois.defaultRounds;
    } else if (setupSelectedGame === 'flip7') {
      const v = parseInt(document.getElementById('opt-target').value, 10);
      game.target = (v && v > 0) ? v : GAMES.flip7.target;
    }
    saveCurrentGame(game);
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

function getRanking(game, totals) {
  const dir = GAMES[game.type].direction;
  const order = totals.map((t, i) => ({ i, t }));
  order.sort((a, b) => dir === 'asc' ? a.t - b.t : b.t - a.t);
  return order;
}

function checkGameEnd(game, totals) {
  if (game.type === 'flip7') {
    const target = game.target || 200;
    const maxTotal = Math.max(...totals, -Infinity);
    if (game.rounds.length > 0 && maxTotal >= target) return true;
  } else if (game.type === 'cinqrois') {
    if (game.rounds.length >= (game.maxRounds || 11)) return true;
  }
  return false;
}

function renderBoard() {
  let game = getCurrentGame();
  if (!game) { setView('home'); return; }
  const gameDef = GAMES[game.type];

  const tpl = document.getElementById('tpl-board');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));

  document.querySelector('[data-back="home"]').addEventListener('click', () => setView('home'));
  document.getElementById('board-title').textContent = `${gameDef.suit} ${gameDef.label}`;

  const totals = computeTotals(game);
  const ranking = getRanking(game, totals);
  const leaderIdx = ranking.length ? ranking[0].i : -1;

  document.getElementById('board-meta').textContent = game.type === 'flip7'
    ? `Objectif : ${game.target || 200} points · Meilleur score gagne`
    : `${game.rounds.length} / ${game.maxRounds || 11} manches · Score le plus bas gagne`;

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
        ${game.rounds.length === 0 && !game.finished ? `<button class="remove-col" data-remove-player="${i}" title="Retirer ce joueur" aria-label="Retirer ${escapeHtml(p.name)}">×</button>` : ''}
      </div>
    </th>`).join('');
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  game.rounds.forEach((round, rIdx) => {
    const tr = document.createElement('tr');
    let cells = `<td>${gameDef.roundLabel(rIdx + 1)}</td>`;
    round.forEach(val => {
      cells += `<td>${Number.isFinite(val) ? val : 0}</td>`;
    });
    tr.innerHTML = cells;
    tbody.appendChild(tr);
  });

  if (!game.finished) {
    const nextRoundNum = game.rounds.length + 1;
    const tr = document.createElement('tr');
    let cells = `<td>${gameDef.roundLabel(nextRoundNum)}</td>`;
    game.players.forEach((p, i) => {
      cells += `<td><input type="number" inputmode="numeric" data-score-input="${i}" placeholder="0"></td>`;
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

  /* Retirer un joueur avant le début */
  table.querySelectorAll('[data-remove-player]').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.removePlayer, 10);
      if (game.players.length <= 2) {
        alert('Il faut au moins 2 joueurs.');
        return;
      }
      game.players.splice(idx, 1);
      saveCurrentGame(game);
      renderBoard();
    });
  });

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
        const v = parseInt(inp.value, 10);
        round[i] = Number.isFinite(v) ? v : 0;
      });
      game.rounds.push(round);
      const newTotals = computeTotals(game);
      if (checkGameEnd(game, newTotals)) {
        game.finished = true;
        const rank = getRanking(game, newTotals);
        game.winnerId = rank[0].i;
        archiveGame(game, newTotals);
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
      const rank = getRanking(game, finalTotals);
      game.winnerId = rank[0].i;
      archiveGame(game, finalTotals);
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

  const abandonBtn = document.createElement('button');
  abandonBtn.className = 'btn-ghost';
  abandonBtn.textContent = 'Supprimer cette partie';
  abandonBtn.addEventListener('click', () => {
    if (!confirm('Supprimer définitivement cette partie en cours ?')) return;
    clearCurrentGame();
    setView('home');
  });
  actionsEl.appendChild(abandonBtn);

  // Focus le premier champ de saisie pour aller plus vite
  const firstInput = table.querySelector('[data-score-input]');
  if (firstInput) firstInput.focus();
}

function archiveGame(game, totals) {
  const history = getHistory();
  history.unshift({
    id: game.id,
    type: game.type,
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
    const gameDef = GAMES[h.type] || {};
    const div = document.createElement('div');
    div.className = 'history-card';
    const date = new Date(h.finishedAt).toLocaleString('fr-FR');
    const pills = h.players.map((p, i) => `
      <span class="history-pill ${i === h.winnerId ? 'win' : ''}">${escapeHtml(p.name)} · ${h.totals[i]}</span>
    `).join('');
    div.innerHTML = `
      <h4>${gameDef.suit || ''} ${gameDef.label || h.type}</h4>
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
