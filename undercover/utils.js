// Fonctions utilitaires partagées + état global de l'application (setup, game, screen).


/* ---------------------------------------------------------
   ÉTAT
--------------------------------------------------------- */
let setup = {
  count: 6,
  names: ["","","","","",""],
  undercoverCount: 1,
  mrWhite: false,
  detective: false,
  jester: false,
  lovers: false,
  protector: false,
  avenger: false,
  wordSource: "random", // "random" | "custom"
  categories: Object.keys(WORD_CATEGORIES), // catégories sélectionnées pour le tirage aléatoire
  customCivil: "",
  customUndercover: "",
};

let game = null; // objet de partie une fois lancée
let screen = "home"; // "home" | "rules" | "setup" | "game"

// Numéro de version affiché en pied de page de la configuration (DOSSIER N°XXX).
// À incrémenter de 1 à chaque nouvelle mise à jour publiée sur le dépôt.
const APP_VERSION = 14;

/* ---------------------------------------------------------
   UTILITAIRES
--------------------------------------------------------- */
function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function normalize(str){
  return (str||"").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}
function el(html){
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstChild;
}

/* ---- Stockage local (joueurs enregistrés + scores) ---- */
/* Enveloppé dans des try/catch : si le stockage local est indisponible
   (mode privé, prévisualisation, etc.), le jeu continue de fonctionner
   simplement sans mémoriser quoi que ce soit d'une session à l'autre. */
function loadSavedPlayers(){
  try{
    const raw = localStorage.getItem('undercover_saved_players');
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}
function addSavedPlayers(names){
  try{
    const current = loadSavedPlayers();
    const merged = current.slice();
    names.forEach(n=>{
      const trimmed = (n||"").trim();
      if(trimmed && !merged.includes(trimmed)) merged.push(trimmed);
    });
    localStorage.setItem('undercover_saved_players', JSON.stringify(merged));
  }catch(e){}
}
function removeSavedPlayer(name){
  try{
    const current = loadSavedPlayers().filter(n=>n!==name);
    localStorage.setItem('undercover_saved_players', JSON.stringify(current));
  }catch(e){}
}
function clearSavedPlayers(){
  try{ localStorage.removeItem('undercover_saved_players'); }catch(e){}
}
/* ---- Thème visuel ---- */
function loadTheme(){
  try{ return localStorage.getItem('undercover_theme') || 'night'; }
  catch(e){ return 'night'; }
}
function applyTheme(name){
  try{ localStorage.setItem('undercover_theme', name); }catch(e){}
  document.documentElement.setAttribute('data-theme', name);
}

function loadScores(){
  try{
    const raw = localStorage.getItem('undercover_scores');
    return raw ? JSON.parse(raw) : {};
  }catch(e){ return {}; }
}
function saveScores(scores){
  try{ localStorage.setItem('undercover_scores', JSON.stringify(scores)); }catch(e){}
}
function recordGameResult(playerNames, winnerNames){
  const scores = loadScores();
  playerNames.forEach(name=>{
    if(!scores[name]) scores[name] = { games:0, wins:0 };
    scores[name].games += 1;
    if(winnerNames.includes(name)) scores[name].wins += 1;
  });
  saveScores(scores);
}
function clearScores(){
  try{ localStorage.removeItem('undercover_scores'); }catch(e){}
}
function render(){
  const app = document.getElementById('app');
  app.innerHTML = "";
  let view;
  if(screen === "home") view = renderHome();
  else if(screen === "rules") view = renderRules();
  else if(screen === "leaderboard") view = renderLeaderboard();
  else if(screen === "setup") view = renderSetup();
  else view = renderGame();
  app.appendChild(view);
}
