// Écran de configuration : nombre de joueurs, rôles spéciaux, choix des mots.

/* ---------------------------------------------------------
   ÉCRAN DE CONFIGURATION
--------------------------------------------------------- */
function maxUndercover(){
  const base = setup.count - (setup.mrWhite?1:0) - (setup.detective?1:0) - (setup.jester?1:0) - (setup.protector?1:0) - (setup.avenger?1:0) - 1;
  return Math.max(1, base);
}

function validateSetup(){
  const N = setup.count;
  if(N < 3) return "Il faut au moins 3 joueurs.";
  if(N > 20) return "20 joueurs maximum.";
  const specialNeeded = (setup.detective?1:0) + (setup.jester?1:0) + (setup.protector?1:0) + (setup.avenger?1:0);
  const civilCount = N - setup.undercoverCount - (setup.mrWhite?1:0);
  if(setup.undercoverCount < 1) return "Il faut au moins 1 undercover.";
  if(civilCount < specialNeeded + 1) return "Pas assez de civils pour ce nombre d'undercover et de rôles spéciaux. Réduisez les undercover ou désactivez un rôle spécial.";
  if(setup.wordSource === "custom"){
    const a = setup.customCivil.trim(), b = setup.customUndercover.trim();
    if(!a || !b) return "Entrez les deux mots du dossier personnalisé.";
    if(normalize(a) === normalize(b)) return "Les deux mots personnalisés doivent être différents.";
  } else if(setup.wordSource === "random"){
    if(!setup.categories || setup.categories.length === 0) return "Sélectionnez au moins une catégorie de mots.";
  }
  return null;
}

function renderSetup(){
  const wrap = el(`<div></div>`);
  wrap.appendChild(el(`
    <div class="masthead">
      <button class="home-btn" id="setup-home-btn" aria-label="Retour à l'accueil">🏠</button>
      <div class="eyebrow">Dossier confidentiel · Nouvelle partie</div>
      <h1 class="title">UNDERCOVER</h1>
      <p class="subtitle">Un seul téléphone. Passez-le à chaque agent au bon moment.</p>
    </div>
  `));
  wrap.querySelector('#setup-home-btn').addEventListener('click', ()=>{ screen = 'home'; render(); });

  const content = el(`<div class="content"></div>`);

  // Bloc joueurs
  const savedPlayers = loadSavedPlayers();
  const b1 = el(`
    <section class="block">
      <h2 class="block-title">Combien d'agents ce soir ?</h2>
      <p class="block-desc">De 3 à 20 joueurs. Chacun verra son mot en privé, à son tour.</p>
      <div class="stepper">
        <button data-act="dec-count">−</button>
        <div class="count">${setup.count}</div>
        <button data-act="inc-count">+</button>
      </div>
      <div class="name-list" id="name-list"></div>
      ${savedPlayers.length ? `
      <div style="margin-top:14px;">
        <div class="block-desc" style="margin-bottom:8px;">Joueurs enregistrés — touchez pour ajouter :</div>
        <div class="choice-row" id="saved-players-row">
          ${savedPlayers.map(n=>`<div class="choice" data-saved="${n.replace(/"/g,'&quot;')}">${n}</div>`).join('')}
          <div class="choice" data-act="clear-saved" style="color:var(--red);border-color:var(--red);">Effacer la liste</div>
        </div>
      </div>` : ``}
    </section>
  `);
  const nameList = b1.querySelector('#name-list');
  for(let i=0;i<setup.count;i++){
    const row = el(`
      <div class="name-row">
        <div class="idx">${i+1}</div>
        <input type="text" placeholder="Joueur ${i+1}" data-name-idx="${i}" value="${(setup.names[i]||"").replace(/"/g,'&quot;')}">
      </div>
    `);
    nameList.appendChild(row);
  }
  content.appendChild(b1);

  // Bloc rôles spéciaux
  const b2 = el(`
    <section class="block">
      <h2 class="block-title">Rôles spéciaux</h2>
      <p class="block-desc">Activez ou non chaque rôle. Ils s'ajoutent aux civils et undercover classiques.</p>

      <div class="toggle-row">
        <div class="switch ${setup.undercoverCount>0?'on':''}" style="visibility:hidden"></div>
        <div class="toggle-text" style="flex:1">
          <div class="name">Undercover</div>
          <div class="desc">Ont un mot proche mais différent de celui des civils. Doivent se fondre dans la masse.</div>
          <div class="stepper-inline">
            <button data-act="dec-uc">−</button>
            <div class="n">${setup.undercoverCount}</div>
            <button data-act="inc-uc">+</button>
          </div>
        </div>
      </div>

      <div class="toggle-row">
        <div class="switch ${setup.mrWhite?'on':''}" data-act="toggle-mrwhite"></div>
        <div class="toggle-text">
          <div class="name">Mr. White</div>
          <div class="desc">N'a aucun mot et doit bluffer. S'il est éliminé, il tente de deviner le mot des civils pour renverser la partie.</div>
        </div>
      </div>

      <div class="toggle-row">
        <div class="switch ${setup.detective?'on':''}" data-act="toggle-detective"></div>
        <div class="toggle-text">
          <div class="name">Détective</div>
          <div class="desc">Un civil qui, en secret, espionne un joueur au hasard pendant la révélation et apprend s'il est "Civil" ou "Suspect".</div>
        </div>
      </div>

      <div class="toggle-row">
        <div class="switch ${setup.jester?'on':''}" data-act="toggle-jester"></div>
        <div class="toggle-text">
          <div class="name">Bouffon</div>
          <div class="desc">Un civil qui gagne seul s'il se fait éliminer par le vote. Il a intérêt à paraître louche !</div>
        </div>
      </div>

      <div class="toggle-row">
        <div class="switch ${setup.lovers?'on':''}" data-act="toggle-lovers"></div>
        <div class="toggle-text">
          <div class="name">Amoureux</div>
          <div class="desc">Deux joueurs tirés au sort, dans n'importe quel camp. Si l'un est éliminé, l'autre l'est aussi par chagrin. S'ils restent tous les deux seuls en vie, ils gagnent ensemble, peu importe leur camp.</div>
        </div>
      </div>

      <div class="toggle-row">
        <div class="switch ${setup.protector?'on':''}" data-act="toggle-protector"></div>
        <div class="toggle-text">
          <div class="name">Garde du corps</div>
          <div class="desc">Un civil qui, à chaque tour, choisit en secret un joueur à protéger. Si ce joueur est le plus voté, il est épargné et personne n'est éliminé ce tour-là.</div>
        </div>
      </div>

      <div class="toggle-row">
        <div class="switch ${setup.avenger?'on':''}" data-act="toggle-avenger"></div>
        <div class="toggle-text">
          <div class="name">Vengeur</div>
          <div class="desc">Un civil qui, s'il est éliminé, désigne aussitôt un autre joueur à emmener avec lui.</div>
        </div>
      </div>
    </section>
  `);
  content.appendChild(b2);

  // Bloc mots
  const allCats = Object.keys(WORD_CATEGORIES);
  const b3 = el(`
    <section class="block">
      <h2 class="block-title">Le dossier (les mots)</h2>
      <p class="block-desc">Choisissez une paire de mots au hasard dans les catégories cochées, ou définissez la vôtre.</p>
      <div class="choice-row">
        <div class="choice ${setup.wordSource==='random'?'active':''}" data-act="src-random">Aléatoire</div>
        <div class="choice ${setup.wordSource==='custom'?'active':''}" data-act="src-custom">Personnalisé</div>
      </div>
      ${setup.wordSource==='custom' ? `
      <div class="custom-words">
        <input type="text" placeholder="Mot des civils" id="cw-civil" value="${setup.customCivil.replace(/"/g,'&quot;')}">
        <input type="text" placeholder="Mot des undercover" id="cw-uc" value="${setup.customUndercover.replace(/"/g,'&quot;')}">
      </div>` : `
      <div style="margin-top:14px;">
        <div class="choice-row" style="margin-bottom:10px;">
          <div class="choice" data-act="cats-all">Tout cocher</div>
          <div class="choice" data-act="cats-none">Tout décocher</div>
        </div>
        <div class="choice-row" id="category-chips">
          ${allCats.map(cat=>`<div class="choice ${setup.categories.includes(cat)?'active':''}" data-cat="${cat.replace(/"/g,'&quot;')}">${cat}</div>`).join('')}
        </div>
      </div>` }
    </section>
  `);
  content.appendChild(b3);

  const err = validateSetup();
  if(err){
    content.appendChild(el(`<div class="error-box">${err}</div>`));
  }

  const startBtn = el(`<button class="btn btn-primary" ${err?'disabled':''}>Lancer la partie</button>`);
  startBtn.addEventListener('click', ()=>{ if(!validateSetup()){ startGame(); } });
  content.appendChild(el(`<div style="height:6px"></div>`));
  content.appendChild(startBtn);
  content.appendChild(el(`<div class="footer-note">DOSSIER N°${String(APP_VERSION).padStart(3,'0')} · À USAGE INTERNE</div>`));

  wrap.appendChild(content);

  // Listeners
  wrap.querySelector('[data-act="dec-count"]').onclick = ()=>{ setup.count = Math.max(3,setup.count-1); setup.names.length=setup.count; setup.undercoverCount = Math.min(setup.undercoverCount, maxUndercover()); render(); };
  wrap.querySelector('[data-act="inc-count"]').onclick = ()=>{ setup.count = Math.min(20,setup.count+1); render(); };
  wrap.querySelectorAll('[data-name-idx]').forEach(inp=>{
    inp.addEventListener('input', e=>{ setup.names[+e.target.dataset.nameIdx] = e.target.value; });
  });
  wrap.querySelectorAll('[data-saved]').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      const name = chip.dataset.saved;
      let slot = setup.names.findIndex((n,i)=> i<setup.count && !(n||"").trim());
      if(slot === -1 && setup.count < 20){
        setup.count += 1;
        setup.names.length = setup.count;
        slot = setup.count - 1;
      }
      if(slot !== -1){
        setup.names[slot] = name;
        render();
      }
    });
  });
  const clearSavedBtn = wrap.querySelector('[data-act="clear-saved"]');
  if(clearSavedBtn) clearSavedBtn.addEventListener('click', ()=>{ clearSavedPlayers(); render(); });
  wrap.querySelector('[data-act="dec-uc"]').onclick = ()=>{ setup.undercoverCount = Math.max(1, setup.undercoverCount-1); render(); };
  wrap.querySelector('[data-act="inc-uc"]').onclick = ()=>{ setup.undercoverCount = Math.min(maxUndercover(), setup.undercoverCount+1); render(); };
  wrap.querySelector('[data-act="toggle-mrwhite"]').onclick = ()=>{ setup.mrWhite = !setup.mrWhite; render(); };
  wrap.querySelector('[data-act="toggle-detective"]').onclick = ()=>{ setup.detective = !setup.detective; render(); };
  wrap.querySelector('[data-act="toggle-jester"]').onclick = ()=>{ setup.jester = !setup.jester; render(); };
  wrap.querySelector('[data-act="toggle-lovers"]').onclick = ()=>{ setup.lovers = !setup.lovers; render(); };
  wrap.querySelector('[data-act="toggle-protector"]').onclick = ()=>{ setup.protector = !setup.protector; render(); };
  wrap.querySelector('[data-act="toggle-avenger"]').onclick = ()=>{ setup.avenger = !setup.avenger; render(); };
  wrap.querySelector('[data-act="src-random"]').onclick = ()=>{ setup.wordSource='random'; render(); };
  wrap.querySelector('[data-act="src-custom"]').onclick = ()=>{ setup.wordSource='custom'; render(); };
  const catAllBtn = wrap.querySelector('[data-act="cats-all"]');
  const catNoneBtn = wrap.querySelector('[data-act="cats-none"]');
  if(catAllBtn) catAllBtn.onclick = ()=>{ setup.categories = Object.keys(WORD_CATEGORIES); render(); };
  if(catNoneBtn) catNoneBtn.onclick = ()=>{ setup.categories = []; render(); };
  wrap.querySelectorAll('[data-cat]').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      const cat = chip.dataset.cat;
      if(setup.categories.includes(cat)){
        setup.categories = setup.categories.filter(c=>c!==cat);
      } else {
        setup.categories = [...setup.categories, cat];
      }
      render();
    });
  });
  const cwCivil = wrap.querySelector('#cw-civil');
  const cwUc = wrap.querySelector('#cw-uc');
  if(cwCivil) cwCivil.addEventListener('input', e=>{ setup.customCivil = e.target.value; });
  if(cwUc) cwUc.addEventListener('input', e=>{ setup.customUndercover = e.target.value; });

  return wrap;
}
