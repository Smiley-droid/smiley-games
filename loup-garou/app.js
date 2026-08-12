/* =========================================================
   Loup-Garou — mini-site Smiley Games
   © 2026 Smiley-droid — Tous droits réservés. Voir /LICENSE.
   Stockage 100% local (localStorage), aucune donnée réseau.
   ========================================================= */

const STORAGE_KEY = 'lg_game_v1';

const ROLES = {
  loup: { key: 'loup', name: 'Loup-Garou', icon: '🐺', team: 'loups', special: false,
    desc: "Chaque nuit, tu te réveilles avec les autres loups pour désigner ensemble une victime à dévorer. Le jour, fais profil bas pour ne pas te faire démasquer." },
  villageois: { key: 'villageois', name: 'Villageois', icon: '🧑‍🌾', team: 'village', special: false,
    desc: "Tu n'as aucun pouvoir particulier. Ta seule arme : observer, discuter et voter intelligemment le jour pour démasquer les loups." },
  voyante: { key: 'voyante', name: 'Voyante', icon: '🔮', team: 'village', special: true,
    desc: "Chaque nuit, tu peux regarder en secret le rôle d'un joueur de ton choix." },
  sorciere: { key: 'sorciere', name: 'Sorcière', icon: '🧪', team: 'village', special: true,
    desc: "Tu as deux potions à usage unique : une de vie (sauver la victime des loups) et une de mort (éliminer qui tu veux)." },
  chasseur: { key: 'chasseur', name: 'Chasseur', icon: '🏹', team: 'village', special: true,
    desc: "Si tu meurs (nuit ou jour), tu emportes immédiatement un autre joueur de ton choix avec toi." },
  cupidon: { key: 'cupidon', name: 'Cupidon', icon: '💘', team: 'village', special: true,
    desc: "La première nuit uniquement, tu désignes deux joueurs amoureux. Si l'un meurt, l'autre meurt de chagrin." },
  petitefille: { key: 'petitefille', name: 'Petite Fille', icon: '👧', team: 'village', special: true,
    desc: "Tu peux discrètement épier les loups-garous pendant leur réveil nocturne, sans te faire repérer." },
  salvateur: { key: 'salvateur', name: 'Salvateur', icon: '🛡️', team: 'village', special: true,
    desc: "Chaque nuit, tu proteges un joueur (jamais le même deux nuits de suite) : il survit à une attaque des loups cette nuit-là." }
};

const store = {
  get(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (e) { return fallback; }
  },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} },
  remove(key) { localStorage.removeItem(key); }
};

function uid() { return Math.random().toString(36).slice(2, 10); }
function getGame() { return store.get(STORAGE_KEY, null); }
function saveGame(g) { store.set(STORAGE_KEY, g); }
function clearGame() { store.remove(STORAGE_KEY); }

function alivePlayers(game) { return game.players.filter(p => game.alive[p.id]); }
function playerRole(game, playerId) {
  const r = game.roles.find(r => r.playerId === playerId);
  return r ? ROLES[r.roleKey] : null;
}

/* ---------- Router ---------- */
const app = document.getElementById('app');
let setupSpecials = {};
let revealIndex = 0;
let revealFlipped = false;

function setView(view) {
  if (view === 'home') renderHome();
  else if (view === 'setup') renderSetup();
  else if (view === 'reveal') renderReveal();
  else if (view === 'master') renderMaster();
  else if (view === 'end') renderEnd();
}

document.getElementById('rules-btn').addEventListener('click', openRulesModal);

/* ---------- Modale règles ---------- */
function openRulesModal() {
  const overlay = document.createElement('div');
  overlay.className = 'lg-modal-overlay';
  overlay.innerHTML = `
    <div class="lg-modal-card">
      <h3>🐺 Règles du Loup-Garou</h3>
      <p>Le village s'endort chaque nuit pendant que les <strong>Loups-Garous</strong> dévorent un joueur. Le jour, tous les survivants débattent puis votent pour éliminer un suspect.</p>
      <p>Le <strong>Village</strong> gagne si tous les loups sont éliminés. Les <strong>Loups</strong> gagnent s'ils sont à égalité ou en supériorité numérique face aux villageois restants.</p>
      <p>Cette appli sert de <strong>meneur de jeu automatique</strong> : elle distribue les rôles en secret (à faire tourner de main en main) puis guide l'ordre de réveil nocturne et le vote du jour. Un joueur (souvent celui qui ne joue pas, ou à tour de rôle) tient le téléphone et suit les instructions à voix haute — sauf pour la Voyante, dont la réponse doit rester secrète.</p>
      <button class="lg-btn-primary" id="rules-modal-close">Fermer</button>
    </div>`;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  document.getElementById('rules-modal-close').addEventListener('click', () => overlay.remove());
}

/* ---------- Vue : Accueil ---------- */
function renderHome() {
  const tpl = document.getElementById('tpl-home');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));
  document.getElementById('new-game-btn').addEventListener('click', () => {
    setupSpecials = {};
    setView('setup');
  });
  const existing = getGame();
  const zone = document.getElementById('lg-resume-zone');
  if (existing && existing.phase !== 'end') {
    zone.innerHTML = `
      <div class="lg-resume-card">
        <strong>Partie en cours</strong>
        <p>${existing.players.length} joueurs · ${existing.phase === 'reveal' ? 'distribution en cours' : (existing.night ? 'Nuit ' + existing.night : 'En cours')}</p>
        <button class="lg-btn-ghost" id="lg-resume-btn">Reprendre →</button>
      </div>`;
    document.getElementById('lg-resume-btn').addEventListener('click', () => {
      setView(existing.phase === 'reveal' ? 'reveal' : (existing.phase === 'end' ? 'end' : 'master'));
    });
  }
}

/* ---------- Vue : Configuration ---------- */
function renderSetup() {
  const tpl = document.getElementById('tpl-setup');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));
  document.querySelector('[data-back="home"]').addEventListener('click', () => setView('home'));

  let players = [];
  const listEl = document.getElementById('setup-player-list');

  function renderPlayers() {
    listEl.innerHTML = '';
    players.forEach((p, i) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${escapeHtml(p.name)}</span> <button data-idx="${i}">×</button>`;
      listEl.appendChild(li);
    });
    listEl.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => { players.splice(parseInt(btn.dataset.idx, 10), 1); renderPlayers(); renderSummary(); });
    });
  }
  renderPlayers();

  const input = document.getElementById('setup-new-player');
  function addPlayer() {
    const name = input.value.trim();
    if (!name) return;
    players.push({ id: uid(), name });
    input.value = '';
    renderPlayers();
    renderSummary();
  }
  document.getElementById('setup-add-player').addEventListener('click', addPlayer);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addPlayer(); });

  const specialKeys = Object.keys(ROLES).filter(k => ROLES[k].special);
  const pickerEl = document.getElementById('role-picker');
  specialKeys.forEach(key => {
    const role = ROLES[key];
    const row = document.createElement('label');
    row.className = 'lg-role-row';
    row.innerHTML = `
      <input type="checkbox" data-role="${key}" ${setupSpecials[key] ? 'checked' : ''}>
      <span class="lg-role-icon-sm">${role.icon}</span>
      <span class="lg-role-info"><strong>${role.name}</strong><span>${role.desc}</span></span>`;
    pickerEl.appendChild(row);
  });
  pickerEl.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => { setupSpecials[cb.dataset.role] = cb.checked; renderSummary(); });
  });

  const summaryEl = document.getElementById('setup-summary');
  const startBtn = document.getElementById('distribute-btn');
  function renderSummary() {
    const n = players.length;
    const specialsCount = Object.values(setupSpecials).filter(Boolean).length;
    const loupCount = Math.max(1, Math.round(n / 3));
    const villageoisCount = n - loupCount - specialsCount;
    if (n < 5) {
      summaryEl.textContent = `Ajoute au moins 5 joueurs (${n}/5).`;
      startBtn.disabled = true;
    } else if (villageoisCount < 0) {
      summaryEl.textContent = `Trop de rôles spéciaux sélectionnés pour ${n} joueurs — décoche-en quelques-uns.`;
      startBtn.disabled = true;
    } else {
      summaryEl.textContent = `${n} joueurs · ${loupCount} Loup(s)-Garou(s) · ${specialsCount} rôle(s) spécial(aux) · ${villageoisCount} Villageois.`;
      startBtn.disabled = false;
    }
  }
  renderSummary();

  startBtn.addEventListener('click', () => {
    const n = players.length;
    const loupCount = Math.max(1, Math.round(n / 3));
    const specialKeysChosen = Object.keys(setupSpecials).filter(k => setupSpecials[k]);
    const pool = [];
    for (let i = 0; i < loupCount; i++) pool.push('loup');
    specialKeysChosen.forEach(k => pool.push(k));
    while (pool.length < n) pool.push('villageois');
    // Mélange (Fisher-Yates)
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const shuffledPlayers = [...players];
    for (let i = shuffledPlayers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]];
    }

    const alive = {};
    shuffledPlayers.forEach(p => { alive[p.id] = true; });

    const game = {
      id: uid(),
      players: shuffledPlayers,
      roles: shuffledPlayers.map((p, i) => ({ playerId: p.id, roleKey: pool[i] })),
      alive,
      phase: 'reveal',
      night: 1,
      stepQueue: [],
      stepIndex: 0,
      lovers: null,
      witch: { lifeUsed: false, deathUsed: false },
      protectedLastNight: null,
      protectedThisNight: null,
      wolfTarget: null,
      log: []
    };
    saveGame(game);
    revealIndex = 0;
    revealFlipped = false;
    setView('reveal');
  });
}

/* ---------- Vue : Révélation des rôles (passe le téléphone) ---------- */
function renderReveal() {
  const game = getGame();
  if (!game) { setView('home'); return; }
  const tpl = document.getElementById('tpl-reveal');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));

  const player = game.players[revealIndex];
  document.getElementById('reveal-progress').textContent = `Joueur ${revealIndex + 1} / ${game.players.length}`;
  document.getElementById('pass-name').textContent = 'Passe le téléphone à';
  document.getElementById('reveal-player-name').textContent = player.name;

  const hiddenFace = document.getElementById('role-card-hidden');
  const shownFace = document.getElementById('role-card-shown');
  const nextBtn = document.getElementById('reveal-next-btn');
  const card = document.getElementById('role-card');

  function showRole() {
    const role = playerRole(game, player.id);
    document.getElementById('reveal-role-icon').textContent = role.icon;
    document.getElementById('reveal-role-name').textContent = role.name;
    document.getElementById('reveal-role-desc').textContent = role.desc;
    hiddenFace.classList.add('hidden');
    shownFace.classList.remove('hidden');
    nextBtn.classList.remove('hidden');
    revealFlipped = true;
  }
  if (revealFlipped) showRole();

  card.addEventListener('click', () => { if (!revealFlipped) showRole(); });

  nextBtn.addEventListener('click', () => {
    revealIndex++;
    revealFlipped = false;
    if (revealIndex >= game.players.length) {
      game.phase = 'night';
      saveGame(game);
      setView('master');
    } else {
      setView('reveal');
    }
  });
}

/* ---------- Moteur nuit / jour ---------- */
function includedRoleKeys(game) {
  return Array.from(new Set(game.roles.map(r => r.roleKey)));
}

function buildNightQueue(game) {
  const included = includedRoleKeys(game);
  const q = [];
  if (game.night === 1 && included.includes('cupidon')) q.push('cupidon');
  if (included.includes('voyante')) q.push('voyante');
  if (included.includes('salvateur')) q.push('salvateur');
  q.push('loups');
  if (included.includes('sorciere')) q.push('sorciere');
  q.push('resolve_night');
  return q;
}

function checkWinCondition(game) {
  const alive = alivePlayers(game);
  const wolves = alive.filter(p => playerRole(game, p.id).team === 'loups');
  const villagers = alive.filter(p => playerRole(game, p.id).team === 'village');
  if (wolves.length === 0) return 'village';
  if (wolves.length >= villagers.length) return 'loups';
  return null;
}

/* Tue un joueur en gérant la chaîne amoureux + chasseur. Retourne la liste des morts de ce tour. */
function killPlayer(game, playerId, deaths) {
  if (!game.alive[playerId]) return;
  game.alive[playerId] = false;
  deaths.push(playerId);
  if (game.lovers && game.lovers.includes(playerId)) {
    const otherId = game.lovers.find(id => id !== playerId);
    if (otherId && game.alive[otherId]) killPlayer(game, otherId, deaths);
  }
}

function renderMaster() {
  const game = getGame();
  if (!game) { setView('home'); return; }
  const win = checkWinCondition(game);
  if (win) { game.phase = 'end'; game.winner = win; saveGame(game); setView('end'); return; }

  const tpl = document.getElementById('tpl-master');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));
  document.getElementById('abandon-btn').addEventListener('click', () => {
    if (confirm('Abandonner cette partie ?')) { clearGame(); setView('home'); } else { setView('master'); }
  });

  const banner = document.getElementById('phase-banner');
  const stepEl = document.getElementById('master-step');

  if (game.phase === 'night') {
    if (!game.stepQueue || game.stepQueue.length === 0) {
      game.stepQueue = buildNightQueue(game);
      game.stepIndex = 0;
      game.protectedThisNight = null;
      saveGame(game);
    }
    banner.textContent = `🌙 Nuit ${game.night}`;
    renderNightStep(game, stepEl);
  } else if (game.phase === 'day') {
    banner.textContent = `☀️ Jour ${game.night}`;
    renderDayStep(game, stepEl);
  }

  renderAliveList(game);
}

function renderAliveList(game) {
  const listEl = document.getElementById('alive-list');
  listEl.innerHTML = '';
  game.players.forEach(p => {
    const alive = game.alive[p.id];
    const li = document.createElement('li');
    li.className = alive ? '' : 'dead';
    li.innerHTML = `<span>${alive ? '🟢' : '💀'} ${escapeHtml(p.name)}</span>` + (alive ? '' : `<span class="lg-role-tag">${playerRole(game, p.id).name}</span>`);
    listEl.appendChild(li);
  });
}

function targetChips(game, { excludeDead = true, excludeIds = [] } = {}) {
  return game.players
    .filter(p => (!excludeDead || game.alive[p.id]) && !excludeIds.includes(p.id))
    .map(p => `<button type="button" class="lg-target-chip" data-id="${p.id}">${escapeHtml(p.name)}</button>`)
    .join('');
}

function advanceNightStep(game) {
  game.stepIndex++;
  saveGame(game);
  renderMaster();
}

function renderNightStep(game, el) {
  const step = game.stepQueue[game.stepIndex];

  if (step === 'cupidon') {
    el.innerHTML = `
      <div class="lg-step-card">
        <h3>💘 Cupidon</h3>
        <p>Réveille Cupidon. Il désigne en secret deux joueurs qui tombent amoureux (touche les deux, dans l'ordre).</p>
        <div class="lg-target-grid" id="cupidon-grid">${targetChips(game)}</div>
        <button class="lg-btn-primary" id="cupidon-confirm" disabled>Confirmer</button>
      </div>`;
    const grid = document.getElementById('cupidon-grid');
    const picked = [];
    grid.querySelectorAll('.lg-target-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.dataset.id;
        const idx = picked.indexOf(id);
        if (idx >= 0) { picked.splice(idx, 1); chip.classList.remove('selected'); }
        else if (picked.length < 2) { picked.push(id); chip.classList.add('selected'); }
        document.getElementById('cupidon-confirm').disabled = picked.length !== 2;
      });
    });
    document.getElementById('cupidon-confirm').addEventListener('click', () => {
      game.lovers = [...picked];
      advanceNightStep(game);
    });
    return;
  }

  if (step === 'voyante') {
    el.innerHTML = `
      <div class="lg-step-card">
        <h3>🔮 Voyante</h3>
        <p>Réveille la Voyante seule. Elle choisit un joueur dont elle veut découvrir le rôle (à lui montrer discrètement, sans que les autres voient).</p>
        <div class="lg-target-grid" id="voyante-grid">${targetChips(game)}</div>
        <div id="voyante-result"></div>
      </div>`;
    document.getElementById('voyante-grid').querySelectorAll('.lg-target-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const role = playerRole(game, chip.dataset.id);
        document.getElementById('voyante-result').innerHTML = `
          <p style="margin-top:12px;"><strong>${role.icon} ${role.name}</strong></p>
          <button class="lg-btn-primary" id="voyante-confirm">C'est vu, continuer</button>`;
        document.getElementById('voyante-confirm').addEventListener('click', () => advanceNightStep(game));
      });
    });
    return;
  }

  if (step === 'salvateur') {
    el.innerHTML = `
      <div class="lg-step-card">
        <h3>🛡️ Salvateur</h3>
        <p>Réveille le Salvateur. Il désigne un joueur à protéger cette nuit (il ne peut pas protéger deux nuits de suite la même personne).</p>
        <div class="lg-target-grid" id="salvateur-grid">${targetChips(game, { excludeIds: game.protectedLastNight ? [game.protectedLastNight] : [] })}</div>
      </div>`;
    document.getElementById('salvateur-grid').querySelectorAll('.lg-target-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        game.protectedThisNight = chip.dataset.id;
        advanceNightStep(game);
      });
    });
    return;
  }

  if (step === 'loups') {
    el.innerHTML = `
      <div class="lg-step-card">
        <h3>🐺 Loups-Garous</h3>
        <p>Réveille tous les Loups-Garous ensemble (et discrètement la Petite Fille, si elle est en jeu). Ils désignent d'un commun accord leur victime.</p>
        <div class="lg-target-grid" id="loups-grid">${targetChips(game)}</div>
      </div>`;
    document.getElementById('loups-grid').querySelectorAll('.lg-target-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        game.wolfTarget = chip.dataset.id;
        advanceNightStep(game);
      });
    });
    return;
  }

  if (step === 'sorciere') {
    const targetName = game.players.find(p => p.id === game.wolfTarget).name;
    el.innerHTML = `
      <div class="lg-step-card">
        <h3>🧪 Sorcière</h3>
        <p>Réveille la Sorcière. Cette nuit, les loups ont attaqué <strong>${escapeHtml(targetName)}</strong>.</p>
        <div class="lg-btn-row" style="display:flex;flex-direction:column;gap:10px;">
          <button class="lg-btn-ghost" id="witch-save" ${game.witch.lifeUsed ? 'disabled' : ''}>🧪 Utiliser la potion de vie (sauver ${escapeHtml(targetName)})</button>
          <button class="lg-btn-ghost" id="witch-kill" ${game.witch.deathUsed ? 'disabled' : ''}>☠️ Utiliser la potion de mort</button>
          <button class="lg-btn-primary" id="witch-skip">Ne rien faire, continuer</button>
        </div>
        <div id="witch-kill-grid" class="lg-target-grid hidden" style="margin-top:12px;"></div>
      </div>`;
    document.getElementById('witch-save').addEventListener('click', () => {
      game.witch.lifeUsed = true;
      game.wolfSaved = true;
      advanceNightStep(game);
    });
    document.getElementById('witch-kill').addEventListener('click', () => {
      const grid = document.getElementById('witch-kill-grid');
      grid.classList.remove('hidden');
      grid.innerHTML = targetChips(game, { excludeIds: [game.wolfTarget] });
      grid.querySelectorAll('.lg-target-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          game.witch.deathUsed = true;
          game.witchKillTarget = chip.dataset.id;
          advanceNightStep(game);
        });
      });
    });
    document.getElementById('witch-skip').addEventListener('click', () => advanceNightStep(game));
    return;
  }

  if (step === 'resolve_night') {
    const deaths = [];
    if (game.wolfTarget && !game.wolfSaved && game.protectedThisNight !== game.wolfTarget) {
      killPlayer(game, game.wolfTarget, deaths);
    }
    if (game.witchKillTarget) killPlayer(game, game.witchKillTarget, deaths);
    saveGame(game);

    let hunterDeadId = deaths.find(id => playerRole(game, id).key === 'chasseur' || (game.roles.find(r => r.playerId === id) || {}).roleKey === 'chasseur');

    const uniqueDeaths = Array.from(new Set(deaths));
    const namesHtml = uniqueDeaths.length
      ? uniqueDeaths.map(id => `<li>${playerRole(game, id).icon} <strong>${escapeHtml(game.players.find(p => p.id === id).name)}</strong> (${playerRole(game, id).name})</li>`).join('')
      : '<li>Personne n\'est mort cette nuit — le village a de la chance.</li>';

    el.innerHTML = `
      <div class="lg-step-card">
        <h3>🌄 Le village se réveille</h3>
        <p>Voici ce qui s'est passé cette nuit :</p>
        <ul style="padding-left:18px; color:var(--parchment); font-size:0.9rem; line-height:1.7;">${namesHtml}</ul>
        ${hunterDeadId ? '<p><strong>⚠️ Le Chasseur est mort !</strong> Avant de continuer, il doit désigner quelqu\'un à emporter avec lui.</p>' : ''}
        <div id="hunter-zone"></div>
        <button class="lg-btn-primary" id="resolve-night-continue">Passer au jour</button>
      </div>`;

    if (hunterDeadId) {
      document.getElementById('hunter-zone').innerHTML = `<div class="lg-target-grid" id="hunter-grid">${targetChips(game, { excludeIds: [hunterDeadId] })}</div>`;
      document.getElementById('resolve-night-continue').disabled = true;
      document.getElementById('hunter-grid').querySelectorAll('.lg-target-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const chainDeaths = [];
          killPlayer(game, chip.dataset.id, chainDeaths);
          document.getElementById('resolve-night-continue').disabled = false;
          chip.parentNode.querySelectorAll('.lg-target-chip').forEach(c => c.classList.add('dead'));
          chip.classList.remove('dead'); chip.classList.add('selected');
        });
      });
    }

    document.getElementById('resolve-night-continue').addEventListener('click', () => {
      game.protectedLastNight = game.protectedThisNight;
      game.wolfTarget = null; game.wolfSaved = false; game.witchKillTarget = null;
      game.stepQueue = []; game.stepIndex = 0;
      game.phase = 'day';
      saveGame(game);
      renderMaster();
    });
    return;
  }
}

function renderDayStep(game, el) {
  el.innerHTML = `
    <div class="lg-step-card">
      <h3>☀️ Débat &amp; vote</h3>
      <p>Place au débat entre villageois ! Une fois la discussion terminée, désignez ensemble un joueur à éliminer par vote (ou touchez "Personne n'est éliminé" en cas d'égalité).</p>
      <div class="lg-target-grid" id="vote-grid">${targetChips(game)}</div>
      <button class="lg-btn-ghost" id="vote-none">Personne n'est éliminé</button>
    </div>`;

  function resolveVote(eliminatedId) {
    const deaths = [];
    let hunterDeadId = null;
    if (eliminatedId) {
      killPlayer(game, eliminatedId, deaths);
      const roleOf = game.roles.find(r => r.playerId === eliminatedId);
      if (roleOf && roleOf.roleKey === 'chasseur') hunterDeadId = eliminatedId;
    }
    saveGame(game);
    const uniqueDeaths = Array.from(new Set(deaths));
    const namesHtml = uniqueDeaths.length
      ? uniqueDeaths.map(id => `<li>${playerRole(game, id).icon} <strong>${escapeHtml(game.players.find(p => p.id === id).name)}</strong> (${playerRole(game, id).name})</li>`).join('')
      : '<li>Personne n\'a été éliminé.</li>';

    el.innerHTML = `
      <div class="lg-step-card">
        <h3>🗳️ Résultat du vote</h3>
        <ul style="padding-left:18px; color:var(--parchment); font-size:0.9rem; line-height:1.7;">${namesHtml}</ul>
        ${hunterDeadId ? '<p><strong>⚠️ Le Chasseur est mort !</strong> Il doit désigner quelqu\'un à emporter avec lui.</p>' : ''}
        <div id="hunter-zone-day"></div>
        <button class="lg-btn-primary" id="day-continue">Nuit suivante</button>
      </div>`;

    if (hunterDeadId) {
      document.getElementById('hunter-zone-day').innerHTML = `<div class="lg-target-grid" id="hunter-grid-day">${targetChips(game, { excludeIds: [hunterDeadId] })}</div>`;
      document.getElementById('day-continue').disabled = true;
      document.getElementById('hunter-grid-day').querySelectorAll('.lg-target-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const chainDeaths = [];
          killPlayer(game, chip.dataset.id, chainDeaths);
          document.getElementById('day-continue').disabled = false;
          chip.parentNode.querySelectorAll('.lg-target-chip').forEach(c => c.classList.add('dead'));
          chip.classList.remove('dead'); chip.classList.add('selected');
        });
      });
    }

    document.getElementById('day-continue').addEventListener('click', () => {
      game.night++;
      game.phase = 'night';
      game.stepQueue = [];
      game.stepIndex = 0;
      saveGame(game);
      renderMaster();
    });
  }

  document.getElementById('vote-grid').querySelectorAll('.lg-target-chip').forEach(chip => {
    chip.addEventListener('click', () => resolveVote(chip.dataset.id));
  });
  document.getElementById('vote-none').addEventListener('click', () => resolveVote(null));
}

/* ---------- Vue : Fin de partie ---------- */
function renderEnd() {
  const game = getGame();
  if (!game) { setView('home'); return; }
  const tpl = document.getElementById('tpl-end');
  app.innerHTML = '';
  app.appendChild(tpl.content.cloneNode(true));

  const banner = document.getElementById('end-banner');
  banner.textContent = game.winner === 'village' ? '🏆 Le Village a gagné !' : '🐺 Les Loups-Garous ont gagné !';

  const listEl = document.getElementById('end-role-list');
  game.players.forEach(p => {
    const role = playerRole(game, p.id);
    const li = document.createElement('li');
    li.className = game.alive[p.id] ? '' : 'dead';
    li.innerHTML = `<span>${game.alive[p.id] ? '🟢' : '💀'} ${escapeHtml(p.name)}</span><span class="lg-role-tag">${role.icon} ${role.name}</span>`;
    listEl.appendChild(li);
  });

  document.getElementById('end-newgame-btn').addEventListener('click', () => {
    clearGame();
    setupSpecials = {};
    setView('setup');
  });
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/* ---------- Démarrage ---------- */
setView('home');
