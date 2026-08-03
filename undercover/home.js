// Écran d'accueil : mise en scène visuelle façon "ciel nocturne" et logo, avant la configuration.
// Contient aussi un court écran de règles accessible depuis l'accueil.

function renderHome(){
  const box = el(`
    <div class="home-screen">
      <a href="../index.html" class="hub-back-link" style="position:absolute;top:14px;left:14px;z-index:5;color:var(--muted);font-size:12.5px;text-decoration:none;font-family:'IBM Plex Sans',sans-serif;opacity:.75;">← Smiley Games</a>
      <div class="home-sky">
        <div class="home-stars"></div>
        <div class="home-moon"></div>
        <div class="home-mountain home-mountain-back"></div>
        <div class="home-mountain home-mountain-front"></div>
      </div>
      <div class="home-content">
        <img src="logo.svg" alt="Logo Undercover" class="home-logo">
        <div class="eyebrow">Dossier confidentiel · Jeu de bluff</div>
        <h1 class="title home-title">UNDERCOVER</h1>
        <p class="subtitle home-subtitle">Un seul téléphone à faire tourner. Un mot à cacher. Qui est l'intrus ?</p>
        <button class="btn btn-primary home-play-btn" id="home-play-btn">▶ Jouer</button>
        <button class="btn btn-secondary home-rules-btn" id="home-rules-btn">Comment jouer ?</button>
        <button class="btn btn-secondary home-rules-btn" id="home-leaderboard-btn">Classement</button>
      </div>
      <div class="theme-picker">
        <div class="theme-label">Thème</div>
        <div class="theme-swatches">
          <button class="theme-swatch" data-theme-choice="night" aria-label="Thème Nuit"></button>
          <button class="theme-swatch" data-theme-choice="arcade" aria-label="Thème Arcade"></button>
          <button class="theme-swatch" data-theme-choice="light" aria-label="Thème Clair"></button>
        </div>
      </div>
    </div>
  `);
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'night';
  box.querySelectorAll('[data-theme-choice]').forEach(sw=>{
    if(sw.dataset.themeChoice === currentTheme) sw.classList.add('active');
    sw.addEventListener('click', ()=>{
      applyTheme(sw.dataset.themeChoice);
      render();
    });
  });
  box.querySelector('#home-play-btn').addEventListener('click', ()=>{
    screen = 'setup';
    render();
  });
  box.querySelector('#home-rules-btn').addEventListener('click', ()=>{
    screen = 'rules';
    render();
  });
  box.querySelector('#home-leaderboard-btn').addEventListener('click', ()=>{
    screen = 'leaderboard';
    render();
  });
  return box;
}

function renderLeaderboard(){
  const wrap = el(`<div></div>`);
  wrap.appendChild(el(`
    <div class="masthead">
      <div class="eyebrow">Dossier confidentiel</div>
      <h1 class="title" style="font-size:22px;">Classement</h1>
    </div>
  `));
  const content = el(`<div class="content"></div>`);
  const scores = loadScores();
  const rows = Object.keys(scores).map(name=>({ name, ...scores[name] }));
  rows.sort((a,b)=> b.wins - a.wins || b.games - a.games);

  if(rows.length === 0){
    content.appendChild(el(`
      <section class="block">
        <p class="block-desc">Aucune partie enregistrée pour l'instant. Jouez une première partie pour voir apparaître le classement ici.</p>
      </section>
    `));
  } else {
    const section = el(`<section class="block"><h2 class="block-title">Victoires par joueur</h2></section>`);
    const list = el(`<ul class="role-list"></ul>`);
    rows.forEach((r,i)=>{
      list.appendChild(el(`
        <li>
          <span class="rn">${i+1}. ${r.name}</span>
          <span class="rr">${r.wins} victoire${r.wins>1?'s':''} · ${r.games} partie${r.games>1?'s':''}</span>
        </li>
      `));
    });
    section.appendChild(list);
    content.appendChild(section);
  }

  const btnRow = el(`<div class="btn-row"></div>`);
  const backBtn = el(`<button class="btn btn-primary">Retour</button>`);
  backBtn.addEventListener('click', ()=>{ screen = 'home'; render(); });
  btnRow.appendChild(backBtn);
  content.appendChild(btnRow);

  if(rows.length > 0){
    const resetBtn = el(`<button class="btn btn-secondary" style="margin-top:10px;">Réinitialiser les scores</button>`);
    resetBtn.addEventListener('click', ()=>{ clearScores(); render(); });
    content.appendChild(resetBtn);
  }

  wrap.appendChild(content);
  return wrap;
}

function renderRules(){
  const wrap = el(`<div></div>`);
  wrap.appendChild(el(`
    <div class="masthead">
      <div class="eyebrow">Dossier confidentiel</div>
      <h1 class="title" style="font-size:22px;">Comment jouer ?</h1>
    </div>
  `));
  const content = el(`
    <div class="content">
      <section class="block">
        <h2 class="block-title">Le principe</h2>
        <p class="block-desc">Chaque joueur reçoit un mot en privé sur le même téléphone. La majorité partage le même mot ; un ou plusieurs undercover ont un mot proche mais différent. À tour de rôle, chacun décrit son mot sans jamais le dire, puis le groupe vote pour éliminer celui qu'il soupçonne.</p>
      </section>
      <section class="block">
        <h2 class="block-title">Déroulé d'une partie</h2>
        <p class="block-desc">
          1. Configurez le nombre de joueurs, les rôles spéciaux et les mots.<br>
          2. Chacun consulte son rôle en privé (carte à maintenir appuyée).<br>
          3. Tour de parole, puis vote à tour de rôle.<br>
          4. Le joueur le plus voté est éliminé et son rôle est révélé.<br>
          5. La partie continue jusqu'à ce qu'un camp l'emporte.
        </p>
      </section>
      <section class="block">
        <h2 class="block-title">Rôles spéciaux (activables)</h2>
        <p class="block-desc">
          <strong>Mr. White</strong> — aucun mot, doit bluffer ; s'il est éliminé, il peut deviner le mot des civils pour renverser la victoire.<br><br>
          <strong>Détective</strong> — espionne un joueur en secret pendant la révélation.<br><br>
          <strong>Bouffon</strong> — gagne seul s'il se fait éliminer par le vote.<br><br>
          <strong>Amoureux</strong> — deux joueurs liés quel que soit leur camp ; si l'un meurt l'autre aussi, et s'ils restent seuls en vie ensemble, ils gagnent.<br><br>
          <strong>Garde du corps</strong> — protège en secret un joueur du vote à chaque tour.<br><br>
          <strong>Vengeur</strong> — s'il est éliminé, élimine aussitôt un autre joueur avec lui.
        </p>
      </section>
    </div>
  `);
  const btn = el(`<button class="btn btn-primary">Retour</button>`);
  btn.addEventListener('click', ()=>{ screen = 'home'; render(); });
  content.appendChild(btn);
  wrap.appendChild(content);
  return wrap;
}
