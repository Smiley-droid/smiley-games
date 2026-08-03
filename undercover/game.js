// Moteur du jeu : révélation des rôles, discussion, vote, éliminations, conditions de victoire.

/* ---------------------------------------------------------
   LANCEMENT DE PARTIE
--------------------------------------------------------- */
function startGame(){
  const N = setup.count;
  const players = [];
  for(let i=0;i<N;i++){
    players.push({
      id:i,
      name: (setup.names[i]||"").trim() || `Joueur ${i+1}`,
      wordRole: null,
      special: null,
      word: null,
      alive: true,
      hasSeen: false,
      detectiveDone: false,
      detectiveResult: null,
      loverId: null,
      avengeUsed: false,
    });
  }

  // construire les rôles
  let roles = [];
  if(setup.mrWhite) roles.push('mrwhite');
  for(let i=0;i<setup.undercoverCount;i++) roles.push('undercover');
  const civilSlots = N - roles.length;
  let specials = [];
  if(setup.detective) specials.push('detective');
  if(setup.jester) specials.push('jester');
  if(setup.protector) specials.push('protector');
  if(setup.avenger) specials.push('avenger');
  for(let i=0;i<civilSlots;i++) roles.push('civil');

  roles = shuffle(roles);
  players.forEach((p,i)=>{ p.wordRole = roles[i]; });

  // assigner les rôles spéciaux parmi les civils
  const civilPlayers = shuffle(players.filter(p=>p.wordRole==='civil'));
  specials.forEach((s,i)=>{ if(civilPlayers[i]) civilPlayers[i].special = s; });

  // amoureux : deux joueurs au hasard, tous camps confondus
  if(setup.lovers && players.length >= 2){
    const pair = shuffle(players.slice(0,players.length)).slice(0,2);
    pair[0].loverId = pair[1].id;
    pair[1].loverId = pair[0].id;
  }

  // mots
  let civilWord, ucWord;
  if(setup.wordSource === 'custom'){
    civilWord = setup.customCivil.trim();
    ucWord = setup.customUndercover.trim();
  } else {
    const pool = (setup.categories && setup.categories.length ? setup.categories : Object.keys(WORD_CATEGORIES))
      .flatMap(cat => WORD_CATEGORIES[cat] || []);
    const pair = pool[Math.floor(Math.random()*pool.length)];
    civilWord = pair[0]; ucWord = pair[1];
  }
  players.forEach(p=>{
    if(p.wordRole==='civil') p.word = civilWord;
    else if(p.wordRole==='undercover') p.word = ucWord;
    else p.word = null;
  });

  game = {
    players,
    civilWord, ucWord,
    round: 1,
    phase: 'reveal',
    revealIndex: 0,
    revealCurrentShown: false,
    pendingDetectivePick: false,
    votingOrder: [],
    votingIndex: 0,
    votes: {},
    lastEliminatedIds: [],
    mrWhiteGuessed: false,
    tieMessage: null,
    protectedId: null,
    protectedName: null,
    pendingAvengerId: null,
    avengerKillIds: [],
    winner: null,
    scoresSaved: false,
  };
  addSavedPlayers(setup.names.slice(0,N).map(n=>(n||"").trim()).filter(Boolean));
  screen = 'game';
  render();
}

/* ---------------------------------------------------------
   ÉCRAN DE JEU — DISPATCH
--------------------------------------------------------- */
function renderGame(){
  const wrap = el(`<div></div>`);
  wrap.appendChild(el(`
    <div class="masthead">
      <div class="eyebrow">Dossier confidentiel</div>
      <h1 class="title" style="font-size:22px;">UNDERCOVER</h1>
      <p class="subtitle">Manche ${game.round} · ${game.players.filter(p=>p.alive).length} agents en jeu</p>
    </div>
  `));
  const content = el(`<div class="content"></div>`);

  switch(game.phase){
    case 'reveal': content.appendChild(renderReveal()); break;
    case 'detective-peek': content.appendChild(renderDetectivePeek()); break;
    case 'discussion': content.appendChild(renderDiscussion()); break;
    case 'protect-pick': content.appendChild(renderProtectPick()); break;
    case 'voting': content.appendChild(renderVoting()); break;
    case 'tie': content.appendChild(renderTie()); break;
    case 'protected': content.appendChild(renderProtected()); break;
    case 'result': content.appendChild(renderResult()); break;
    case 'avenger-pick': content.appendChild(renderAvengerPick()); break;
    case 'avenger-result': content.appendChild(renderAvengerResult()); break;
    case 'mrwhite-guess': content.appendChild(renderMrWhiteGuess()); break;
    case 'gameover': content.appendChild(renderGameOver()); break;
  }
  wrap.appendChild(content);
  return wrap;
}

/* ---- Révélation des rôles ---- */
function renderReveal(){
  const p = game.players[game.revealIndex];
  const box = el(`<div></div>`);
  box.appendChild(el(`
    <div class="pass-instruction">
      <div class="eyebrow">Passez le téléphone à</div>
      <div class="to">${p.name}</div>
      <div class="hint">Personne d'autre ne doit regarder l'écran.</div>
    </div>
  `));

  let extra = "";
  if(p.wordRole === 'mrwhite'){
    extra = `<div class="label">Aucun mot</div><div class="word" style="font-size:20px;">MR. WHITE</div><div class="role-extra">Vous n'avez pas de mot. Écoutez les autres et bluffez. Si vous êtes éliminé, vous pourrez deviner le mot des civils pour gagner quand même.</div>`;
  } else {
    extra = `<div class="label">Votre mot</div><div class="word">${p.word}</div><div class="role-extra">Décrivez ce mot à voix haute sans jamais le prononcer. Restez naturel.</div>`;
    if(p.special === 'detective'){
      extra += `<div class="special-badge">Rôle spécial — Détective</div><div class="role-extra">Après cette carte, vous choisirez un joueur à espionner.</div>`;
    }
    if(p.special === 'jester'){
      extra += `<div class="special-badge">Rôle spécial — Bouffon</div><div class="role-extra">Vous gagnez seul si le groupe vous élimine au vote.</div>`;
    }
    if(p.special === 'protector'){
      extra += `<div class="special-badge">Rôle spécial — Garde du corps</div><div class="role-extra">Chaque tour, avant le vote, vous choisirez en secret un joueur à protéger.</div>`;
    }
    if(p.special === 'avenger'){
      extra += `<div class="special-badge">Rôle spécial — Vengeur</div><div class="role-extra">Si vous êtes éliminé, vous désignerez aussitôt un autre joueur à emmener avec vous.</div>`;
    }
  }
  if(p.loverId !== null){
    const partner = game.players.find(pl=>pl.id===p.loverId);
    extra += `<div class="special-badge">Rôle spécial — Amoureux</div><div class="role-extra">Vous êtes amoureux de ${partner.name}. Si l'un de vous est éliminé, l'autre l'est aussi. Si vous restez tous les deux seuls en vie, vous gagnez ensemble, peu importe vos camps.</div>`;
  }

  const card = el(`
    <div class="dossier-card">
      <div class="dossier-cover">
        <div class="stamp">DOSSIER</div>
        <div class="cta">Maintenir pour révéler</div>
      </div>
      <div class="dossier-face hidden">${extra}</div>
    </div>
  `);
  const cover = card.querySelector('.dossier-cover');
  const face = card.querySelector('.dossier-face');
  const show = ()=>{ cover.classList.add('hidden'); face.classList.remove('hidden'); p.hasSeen = true; updateNextBtn(); };
  const hide = ()=>{ cover.classList.remove('hidden'); face.classList.add('hidden'); };
  cover.addEventListener('pointerdown', show);
  cover.addEventListener('pointerup', hide);
  cover.addEventListener('pointerleave', hide);
  face.addEventListener('pointerup', hide);
  face.addEventListener('pointerleave', hide);
  box.appendChild(card);

  box.appendChild(el(`<div class="seen-note" id="seen-note">${p.hasSeen ? "Rôle consulté." : "Maintenez la carte appuyée pour lire votre rôle."}</div>`));

  const nextBtn = el(`<button class="btn btn-primary" id="next-reveal-btn" ${p.hasSeen?'':'disabled'}>J'ai vu, joueur suivant</button>`);
  nextBtn.addEventListener('click', ()=>{
    if(p.special === 'detective' && !p.detectiveDone){
      game.phase = 'detective-peek';
      game.pendingDetectivePick = p.id;
    } else {
      game.revealIndex++;
      if(game.revealIndex >= game.players.length){
        game.phase = 'discussion';
      }
    }
    render();
  });
  box.appendChild(nextBtn);

  function updateNextBtn(){
    const b = document.getElementById('next-reveal-btn');
    const n = document.getElementById('seen-note');
    if(b) b.disabled = false;
    if(n) n.textContent = "Rôle consulté.";
  }

  return box;
}

/* ---- Espionnage du Détective ---- */
function renderDetectivePeek(){
  const detId = game.pendingDetectivePick;
  const det = game.players.find(p=>p.id===detId);
  const box = el(`<div></div>`);

  if(!det.detectiveResult){
    box.appendChild(el(`
      <div class="pass-instruction">
        <div class="eyebrow">${det.name} — Détective</div>
        <div class="to" style="font-size:18px;">Choisissez un joueur à espionner</div>
      </div>
    `));
    const grid = el(`<div class="grid-players"></div>`);
    game.players.filter(p=>p.id!==det.id).forEach(p=>{
      const tile = el(`<div class="player-tile">${p.name}</div>`);
      tile.addEventListener('click', ()=>{
        const result = p.wordRole === 'civil' ? 'Civil' : 'Suspect';
        det.detectiveResult = { targetName: p.name, result };
        render();
      });
      grid.appendChild(tile);
    });
    box.appendChild(grid);
    return box;
  }

  box.appendChild(el(`
    <div class="pass-instruction">
      <div class="eyebrow">${det.name} — Résultat de l'enquête</div>
      <div class="hint">Maintenez pour révéler, relâchez pour dissimuler.</div>
    </div>
  `));
  const card = el(`
    <div class="dossier-card" style="height:180px;">
      <div class="dossier-cover">
        <div class="stamp">RAPPORT</div>
        <div class="cta">Maintenir pour révéler</div>
      </div>
      <div class="dossier-face hidden">
        <div class="label">${det.detectiveResult.targetName}</div>
        <div class="word" style="font-size:26px;">${det.detectiveResult.result}</div>
      </div>
    </div>
  `);
  const cover = card.querySelector('.dossier-cover');
  const face = card.querySelector('.dossier-face');
  const show = ()=>{ cover.classList.add('hidden'); face.classList.remove('hidden'); };
  const hide = ()=>{ cover.classList.remove('hidden'); face.classList.add('hidden'); };
  cover.addEventListener('pointerdown', show);
  cover.addEventListener('pointerup', hide);
  cover.addEventListener('pointerleave', hide);
  face.addEventListener('pointerup', hide);
  face.addEventListener('pointerleave', hide);
  box.appendChild(card);

  const btn = el(`<button class="btn btn-primary">Continuer</button>`);
  btn.addEventListener('click', ()=>{
    det.detectiveDone = true;
    game.phase = 'reveal';
    game.revealIndex++;
    if(game.revealIndex >= game.players.length) game.phase = 'discussion';
    render();
  });
  box.appendChild(btn);
  return box;
}

/* ---- Discussion ---- */
function renderDiscussion(){
  const box = el(`<div></div>`);
  box.appendChild(el(`
    <section class="block">
      <h2 class="block-title">Tour de parole</h2>
      <p class="block-desc">Chacun décrit son mot à voix haute, sans le dire directement. Un tour, dans l'ordre ci-dessous, puis on vote.</p>
      <ol class="speak-order"></ol>
    </section>
  `));
  const list = box.querySelector('.speak-order');
  game.players.filter(p=>p.alive).forEach((p,i)=>{
    list.appendChild(el(`<li><div class="n">${i+1}</div><div>${p.name}</div></li>`));
  });
  const hasProtector = game.players.some(p=>p.alive && p.special==='protector');
  const btn = el(`<button class="btn btn-primary">${hasProtector ? "Continuer" : "Commencer le vote"}</button>`);
  btn.addEventListener('click', ()=>{
    if(hasProtector){
      game.phase = 'protect-pick';
    } else {
      game.votingOrder = game.players.filter(p=>p.alive).map(p=>p.id);
      game.votingIndex = 0;
      game.votes = {};
      game.phase = 'voting';
    }
    render();
  });
  box.appendChild(btn);
  return box;
}

/* ---- Garde du corps : choix de la protection ---- */
function renderProtectPick(){
  const protector = game.players.find(p=>p.alive && p.special==='protector');
  const box = el(`<div></div>`);
  box.appendChild(el(`
    <div class="pass-instruction">
      <div class="eyebrow">Passez le téléphone à</div>
      <div class="to">${protector.name}</div>
      <div class="hint">Garde du corps — qui protégez-vous ce tour ?</div>
    </div>
  `));
  const grid = el(`<div class="grid-players"></div>`);
  let selected = null;
  game.players.filter(p=>p.alive).forEach(p=>{
    const tile = el(`<div class="player-tile">${p.name}${p.id===protector.id ? " (vous)" : ""}</div>`);
    tile.addEventListener('click', ()=>{
      grid.querySelectorAll('.player-tile').forEach(t=>t.classList.remove('selected'));
      tile.classList.add('selected');
      selected = p.id;
      confirmBtn.disabled = false;
    });
    grid.appendChild(tile);
  });
  box.appendChild(grid);
  const confirmBtn = el(`<button class="btn btn-primary" style="margin-top:16px;" disabled>Confirmer la protection</button>`);
  confirmBtn.addEventListener('click', ()=>{
    game.protectedId = selected;
    game.votingOrder = game.players.filter(p=>p.alive).map(p=>p.id);
    game.votingIndex = 0;
    game.votes = {};
    game.phase = 'voting';
    render();
  });
  box.appendChild(confirmBtn);
  return box;
}

/* ---- Vote ---- */
function renderVoting(){
  const voterId = game.votingOrder[game.votingIndex];
  const voter = game.players.find(p=>p.id===voterId);
  const box = el(`<div></div>`);
  box.appendChild(el(`
    <div class="pass-instruction">
      <div class="eyebrow">Passez le téléphone à</div>
      <div class="to">${voter.name}</div>
      <div class="hint">Qui soupçonnez-vous ?</div>
    </div>
  `));
  const grid = el(`<div class="grid-players"></div>`);
  let selected = null;
  game.players.filter(p=>p.alive && p.id!==voter.id).forEach(p=>{
    const tile = el(`<div class="player-tile">${p.name}</div>`);
    tile.addEventListener('click', ()=>{
      grid.querySelectorAll('.player-tile').forEach(t=>t.classList.remove('selected'));
      tile.classList.add('selected');
      selected = p.id;
      confirmBtn.disabled = false;
    });
    grid.appendChild(tile);
  });
  box.appendChild(grid);

  const confirmBtn = el(`<button class="btn btn-primary" style="margin-top:16px;" disabled>Confirmer mon vote</button>`);
  confirmBtn.addEventListener('click', ()=>{
    game.votes[voter.id] = selected;
    game.votingIndex++;
    if(game.votingIndex >= game.votingOrder.length){
      tallyVotes();
    }
    render();
  });
  box.appendChild(confirmBtn);
  return box;
}

function eliminateWithGrief(id){
  const ids = [id];
  const pl = game.players.find(p=>p.id===id);
  pl.alive = false;
  if(pl.loverId !== null){
    const partner = game.players.find(p=>p.id===pl.loverId);
    if(partner && partner.alive){
      partner.alive = false;
      ids.push(partner.id);
    }
  }
  return ids;
}

function tallyVotes(){
  const counts = {};
  Object.values(game.votes).forEach(targetId=>{
    counts[targetId] = (counts[targetId]||0)+1;
  });
  let max = 0;
  Object.values(counts).forEach(c=>{ if(c>max) max=c; });
  const topIds = Object.keys(counts).filter(id=>counts[id]===max).map(Number);
  if(topIds.length > 1){
    game.tieMessage = topIds.map(id=>game.players.find(p=>p.id===id).name).join(" et ");
    game.phase = 'tie';
  } else if(game.protectedId !== null && topIds[0] === game.protectedId){
    game.protectedName = game.players.find(p=>p.id===topIds[0]).name;
    game.phase = 'protected';
  } else {
    game.lastEliminatedIds = eliminateWithGrief(topIds[0]);
    game.phase = 'result';
  }
}

function renderTie(){
  const box = el(`<div></div>`);
  box.appendChild(el(`
    <div class="winner-banner">
      <div class="big" style="font-size:19px;">Égalité</div>
      <div class="sub">${game.tieMessage} sont à égalité. Personne n'est éliminé ce tour.</div>
    </div>
  `));
  const btn = el(`<button class="btn btn-primary">Nouveau tour de parole</button>`);
  btn.addEventListener('click', ()=>{ game.round++; game.protectedId=null; game.phase='discussion'; render(); });
  box.appendChild(btn);
  return box;
}

function renderProtected(){
  const box = el(`<div></div>`);
  box.appendChild(el(`
    <div class="winner-banner">
      <div class="big" style="font-size:19px;">Protection réussie</div>
      <div class="sub">${game.protectedName} était le plus visé par le vote, mais le Garde du corps veillait. Personne n'est éliminé ce tour.</div>
    </div>
  `));
  const btn = el(`<button class="btn btn-primary">Nouveau tour de parole</button>`);
  btn.addEventListener('click', ()=>{ game.round++; game.protectedId=null; game.phase='discussion'; render(); });
  box.appendChild(btn);
  return box;
}

/* ---- Résultat de l'élimination ---- */
function renderResult(){
  const ids = game.lastEliminatedIds;
  const p = game.players.find(pl=>pl.id===ids[0]);
  const grief = ids[1] !== undefined ? game.players.find(pl=>pl.id===ids[1]) : null;
  const box = el(`<div></div>`);
  const roleName = ROLE_LABEL[p.wordRole] + (p.special ? ` · ${SPECIAL_LABEL[p.special]}` : "");
  box.appendChild(el(`
    <div class="result-reveal">
      <div class="stamp-big">ÉLIMINÉ</div>
      <div class="who">${p.name}</div>
      <div class="role-tag">${roleName}</div>
      ${p.word ? `<div class="word-was">« ${p.word} »</div>` : `<div class="word-was">Aucun mot</div>`}
    </div>
  `));
  if(grief){
    const griefRole = ROLE_LABEL[grief.wordRole] + (grief.special ? ` · ${SPECIAL_LABEL[grief.special]}` : "");
    box.appendChild(el(`
      <div class="result-reveal">
        <div class="stamp-big" style="border-color:var(--muted);color:var(--muted);">MORT DE CHAGRIN</div>
        <div class="who">${grief.name}</div>
        <div class="role-tag">${griefRole}</div>
        ${grief.word ? `<div class="word-was">« ${grief.word} »</div>` : `<div class="word-was">Aucun mot</div>`}
      </div>
    `));
  }

  const btn = el(`<button class="btn btn-primary">Continuer</button>`);
  btn.addEventListener('click', ()=>{
    const eliminatedNow = ids.map(id=>game.players.find(pl=>pl.id===id));
    handleEliminationContinuation(eliminatedNow);
  });
  box.appendChild(btn);
  return box;
}

/* ---- Vengeur : choix de la cible ---- */
function renderAvengerPick(){
  const avenger = game.players.find(p=>p.id===game.pendingAvengerId);
  const box = el(`<div></div>`);
  box.appendChild(el(`
    <div class="pass-instruction">
      <div class="eyebrow">${avenger.name} — Vengeur</div>
      <div class="to" style="font-size:18px;">Qui emmenez-vous avec vous ?</div>
      <div class="hint">Vous venez d'être éliminé. Choisissez une cible.</div>
    </div>
  `));
  const grid = el(`<div class="grid-players"></div>`);
  game.players.filter(p=>p.alive).forEach(p=>{
    const tile = el(`<div class="player-tile">${p.name}</div>`);
    tile.addEventListener('click', ()=>{
      game.avengerKillIds = eliminateWithGrief(p.id);
      game.phase = 'avenger-result';
      render();
    });
    grid.appendChild(tile);
  });
  box.appendChild(grid);
  return box;
}

function renderAvengerResult(){
  const ids = game.avengerKillIds;
  const p = game.players.find(pl=>pl.id===ids[0]);
  const grief = ids[1] !== undefined ? game.players.find(pl=>pl.id===ids[1]) : null;
  const box = el(`<div></div>`);
  const roleName = ROLE_LABEL[p.wordRole] + (p.special ? ` · ${SPECIAL_LABEL[p.special]}` : "");
  box.appendChild(el(`
    <div class="result-reveal">
      <div class="stamp-big">EMMENÉ PAR VENGEANCE</div>
      <div class="who">${p.name}</div>
      <div class="role-tag">${roleName}</div>
      ${p.word ? `<div class="word-was">« ${p.word} »</div>` : `<div class="word-was">Aucun mot</div>`}
    </div>
  `));
  if(grief){
    const griefRole = ROLE_LABEL[grief.wordRole] + (grief.special ? ` · ${SPECIAL_LABEL[grief.special]}` : "");
    box.appendChild(el(`
      <div class="result-reveal">
        <div class="stamp-big" style="border-color:var(--muted);color:var(--muted);">MORT DE CHAGRIN</div>
        <div class="who">${grief.name}</div>
        <div class="role-tag">${griefRole}</div>
        ${grief.word ? `<div class="word-was">« ${grief.word} »</div>` : `<div class="word-was">Aucun mot</div>`}
      </div>
    `));
  }
  const btn = el(`<button class="btn btn-primary">Continuer</button>`);
  btn.addEventListener('click', ()=>{
    const eliminatedNow = ids.map(id=>game.players.find(pl=>pl.id===id));
    handleEliminationContinuation(eliminatedNow);
  });
  box.appendChild(btn);
  return box;
}

/* ---- Suite commune après toute élimination ---- */
function handleEliminationContinuation(eliminatedNow){
  const jesterOut = eliminatedNow.find(pl=>pl.special === 'jester');
  if(jesterOut){
    game.winner = 'jester';
    game.phase = 'gameover';
    render();
    return;
  }
  const avengerOut = eliminatedNow.find(pl=>pl.special === 'avenger' && !pl.avengeUsed);
  const aliveOthers = game.players.filter(pl=>pl.alive);
  if(avengerOut && aliveOthers.length > 0){
    avengerOut.avengeUsed = true;
    game.pendingAvengerId = avengerOut.id;
    game.phase = 'avenger-pick';
    render();
    return;
  }
  const stillAlive = game.players.filter(pl=>pl.alive);
  if(stillAlive.length === 2 && stillAlive[0].loverId === stillAlive[1].id){
    game.winner = 'amoureux';
    game.phase = 'gameover';
    render();
    return;
  }
  const mrWhiteOut = eliminatedNow.find(pl=>pl.wordRole === 'mrwhite');
  if(mrWhiteOut && !game.mrWhiteGuessed){
    game.phase = 'mrwhite-guess';
    render();
    return;
  }
  resolveWinCondition();
  render();
}

function resolveWinCondition(){
  const alive = game.players.filter(p=>p.alive);
  const threat = alive.filter(p=>p.wordRole==='undercover'||p.wordRole==='mrwhite').length;
  const civilSide = alive.filter(p=>p.wordRole==='civil').length;
  if(threat === 0){
    const hasMrWhite = game.players.some(p=>p.wordRole==='mrwhite');
    if(hasMrWhite && !game.mrWhiteGuessed){
      // Dernière chance : Mr. White devine le mot des civils avant que la victoire soit actée.
      game.phase = 'mrwhite-guess';
    } else {
      game.winner = 'civils'; game.phase = 'gameover';
    }
  } else if(threat >= civilSide){
    game.winner = 'undercover'; game.phase = 'gameover';
  } else {
    game.round++; game.phase = 'discussion';
  }
}

/* ---- Devinette de Mr. White (dès son élimination) ---- */
function renderMrWhiteGuess(){
  const mw = game.players.find(p=>p.wordRole==='mrwhite');
  const box = el(`<div></div>`);
  box.appendChild(el(`
    <div class="pass-instruction">
      <div class="eyebrow">Passez le téléphone à</div>
      <div class="to">${mw.name}</div>
      <div class="hint">Dernière chance avant de quitter la partie.</div>
    </div>
  `));
  box.appendChild(el(`
    <section class="block">
      <h2 class="block-title">La carte de Mr. White</h2>
      <p class="block-desc">Vous n'aviez aucun mot. Devinez le mot des civils : si vous trouvez, votre camp gagne quand même.</p>
      <textarea id="guess-input" rows="1" placeholder="Votre proposition..."></textarea>
    </section>
  `));
  const btn = el(`<button class="btn btn-primary">Valider la proposition</button>`);
  btn.addEventListener('click', ()=>{
    const guess = box.querySelector('#guess-input').value;
    game.mrWhiteGuessed = true;
    if(normalize(guess) === normalize(game.civilWord)){
      game.winner = 'undercover';
      game.phase = 'gameover';
    } else {
      resolveWinCondition();
    }
    render();
  });
  box.appendChild(btn);
  return box;
}

/* ---- Fin de partie ---- */
function computeWinnerNames(){
  if(game.winner === 'civils') return game.players.filter(p=>p.wordRole==='civil').map(p=>p.name);
  if(game.winner === 'undercover') return game.players.filter(p=>p.wordRole==='undercover'||p.wordRole==='mrwhite').map(p=>p.name);
  if(game.winner === 'jester') return game.players.filter(p=>p.special==='jester').map(p=>p.name);
  if(game.winner === 'amoureux') return game.players.filter(p=>p.alive).map(p=>p.name);
  return [];
}

function renderGameOver(){
  if(!game.scoresSaved){
    recordGameResult(game.players.map(p=>p.name), computeWinnerNames());
    game.scoresSaved = true;
  }
  const box = el(`<div></div>`);
  const titles = {
    civils: ["Les civils gagnent","L'infiltré a été démasqué à temps."],
    undercover: ["Les undercover gagnent","Ils ont survécu jusqu'à égaler les civils."],
    jester: ["Le Bouffon gagne","Il voulait être éliminé — mission accomplie."],
    amoureux: ["Les Amoureux gagnent","Ils sont restés seuls en vie, envers et contre tous les camps."],
  };
  const [big, sub] = titles[game.winner];
  box.appendChild(el(`
    <div class="winner-banner">
      <div class="big">${big}</div>
      <div class="sub">${sub}</div>
    </div>
  `));
  box.appendChild(el(`<h2 class="block-title">Dossier final</h2>`));
  const list = el(`<ul class="role-list"></ul>`);
  game.players.forEach(p=>{
    let role = ROLE_LABEL[p.wordRole] + (p.special ? ` · ${SPECIAL_LABEL[p.special]}` : "");
    if(p.loverId !== null) role += ` · Amoureux de ${game.players.find(pl=>pl.id===p.loverId).name}`;
    list.appendChild(el(`
      <li>
        <span class="rn">${p.name}${p.alive?"":" (éliminé)"}</span>
        <span class="rr">${role}${p.word?(" — "+p.word):""}</span>
      </li>
    `));
  });
  box.appendChild(list);

  const row = el(`<div class="btn-row"></div>`);
  const replay = el(`<button class="btn btn-primary">Rejouer (mêmes agents)</button>`);
  replay.addEventListener('click', ()=>{ startGame(); });
  const reset = el(`<button class="btn btn-secondary">Nouvelle configuration</button>`);
  reset.addEventListener('click', ()=>{ screen='setup'; render(); });
  row.appendChild(replay); row.appendChild(reset);
  box.appendChild(row);
  const leaderboardBtn = el(`<button class="btn btn-secondary" style="margin-top:10px;">Voir le classement</button>`);
  leaderboardBtn.addEventListener('click', ()=>{ screen='leaderboard'; render(); });
  box.appendChild(leaderboardBtn);
  return box;
}
