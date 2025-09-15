/* script.js
   - Replace API_ROOT below with your Render backend URL (include https:// and any -1 suffix)
   - The frontend expects these backend endpoints:
     POST  /api/auth/register   {name,email,password}
     POST  /api/auth/login      {email,password} -> returns { token }
     GET   /api/auth/me         (Authorization: Bearer <token>) -> returns user
     POST  /api/win             { mode } (Authorization) -> optional (if backend supports rewards)
     POST  /api/upgrade         { amount } (Authorization) -> optional
     POST  /api/withdraw        { account_number, account_name } (Authorization) -> optional
*/

const API_ROOT = "https://tic-tac-rewards-1.onrender.com";

// UI elements
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authMsg = document.getElementById("authMsg");
const authCard = document.getElementById("authCard");
const profileCard = document.getElementById("profileCard");
const logoutBtn = document.getElementById("logoutBtn");

const boardEl = document.getElementById("board");
const statusLine = document.getElementById("statusLine");
const modeSelect = document.getElementById("modeSelect");
const aiLevelSelect = document.getElementById("aiLevel");
const btnRestart = document.getElementById("btnRestart");
const btnHint = document.getElementById("btnHint");
const levelBadge = document.getElementById("levelBadge");
const levelProgress = document.getElementById("levelProgress");
const perWinEl = document.getElementById("perWin");
const historyList = document.getElementById("historyList");
const profileNameEl = document.getElementById("profileName");
const profileEmailEl = document.getElementById("profileEmail");
const profileBalanceEl = document.getElementById("profileBalance");
const profileLevelEl = document.getElementById("profileLevel");
const btnUpgrade = document.getElementById("btnUpgrade");
const btnWithdraw = document.getElementById("btnWithdraw");
const musicToggle = document.getElementById("musicToggle");

const sndClick = document.getElementById("sndClick");
const sndWin = document.getElementById("sndWin");
const bgMusic = document.getElementById("bgMusic");

// app state
let token = localStorage.getItem("tt_token") || null;
let currentUser = null;
let board = Array(9).fill("");
let mode = modeSelect.value || "ai";
let aiLevel = aiLevelSelect.value || "easy";
let musicOn = false;
let recentHistory = [];

// UI events
tabLogin.onclick = () => { tabLogin.classList.add("active"); tabRegister.classList.remove("active"); loginForm.style.display="block"; registerForm.style.display="none"; }
tabRegister.onclick = () => { tabRegister.classList.add("active"); tabLogin.classList.remove("active"); registerForm.style.display="block"; loginForm.style.display="none"; }

document.getElementById("btnRegister").onclick = register;
document.getElementById("btnLogin").onclick = login;
logoutBtn.onclick = logout;
modeSelect.onchange = (e)=>{ mode = e.target.value; renderStatus(); resetBoard(); }
aiLevelSelect.onchange = (e)=>{ aiLevel = e.target.value; }
btnRestart.onclick = resetBoard;
btnHint.onclick = showHint;
musicToggle.onclick = toggleMusic;
btnUpgrade.onclick = upgrade;
btnWithdraw.onclick = withdraw;

// helper: authorized fetch
async function api(path, opts = {}) {
  opts.headers = opts.headers || {};
  opts.headers['Content-Type'] = 'application/json';
  if (token) opts.headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_ROOT + path, opts);
  // not throwing - caller will handle status
  return res;
}

// ---------- AUTH ----------
async function register(){
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;
  if(!name||!email||!password){ authMsg.innerText="Fill all fields"; return; }

  try{
    const r = await fetch(API_ROOT + "/api/auth/register", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const j = await r.json();
    if(r.ok) {
      authMsg.innerText = "Registered — please login";
      tabLogin.click();
    } else {
      authMsg.innerText = j.message || j.error || "Registration failed";
    }
  }catch(e){ authMsg.innerText = e.message; }
}

async function login(){
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  if(!email||!password){ authMsg.innerText="Enter email & password"; return; }

  try{
    const r = await fetch(API_ROOT + "/api/auth/login", {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email, password })
    });
    const j = await r.json();
    if(r.ok && j.token){
      token = j.token;
      localStorage.setItem("tt_token", token);
      await loadProfile();
      authCard.style.display = "none";
      profileCard.style.display = "block";
      logoutBtn.style.display = "inline-block";
      renderBoard();
    } else {
      authMsg.innerText = j.message || j.error || "Login failed";
    }
  }catch(e){ authMsg.innerText = e.message; }
}

function logout(){
  token = null;
  currentUser = null;
  localStorage.removeItem("tt_token");
  authCard.style.display = "block";
  profileCard.style.display = "none";
  logoutBtn.style.display = "none";
  renderStatus("Logged out");
  resetBoard();
}

// load profile using /api/auth/me
async function loadProfile(){
  try{
    const r = await api("/api/auth/me", { method: "GET" });
    if(r.status === 401) { logout(); return; }
    const j = await r.json();
    currentUser = j;
    // if backend returns user inside object, handle both shapes
    if (j.user) currentUser = j.user;
    refreshProfileView();
  } catch(e){ console.error(e); }
}

function refreshProfileView(){
  if(!currentUser) return;
  profileNameEl.innerText = currentUser.name || "Player";
  profileEmailEl.innerText = currentUser.email || "";
  profileBalanceEl.innerText = `Balance: ₦${currentUser.balance || 0}`;
  profileLevelEl.innerText = `Level: ${currentUser.level || currentUser.level === 0 ? currentUser.level : 1}`;
  levelBadge.innerText = `Lv ${currentUser.level || 1}`;
  perWinEl.innerText = `Per win: ₦${currentUser.perWinReward || 0}`;
  recentHistory = currentUser.history || recentHistory || [];
  renderHistory();
  updateProgressBar();
  updateAiOptions();
}

// ---------- BOARD / GAME ----------
function renderBoard(){
  boardEl.innerHTML = "";
  for(let i=0;i<9;i++){
    const c = document.createElement("div");
    c.className = "cell " + (board[i] ? (board[i]==='X'?'x':'o') : '');
    c.dataset.i = i;
    c.innerText = board[i] || "";
    c.onclick = () => onCellClick(i);
    boardEl.appendChild(c);
  }
  renderStatus();
}

function onCellClick(i){
  if(board[i]) return; // occupied
  // in AI mode player is X only
  if(mode === "ai"){
    board[i] = "X";
    playClick();
    renderBoard();
    if(checkWin("X")) return;
    setTimeout(aiMove, 250);
    return;
  }
  // local mode: alternate based on counts
  const countX = board.filter(v=>v==='X').length;
  const countO = board.filter(v=>v==='O').length;
  const next = countX <= countO ? 'X' : 'O';
  board[i] = next;
  playClick();
  renderBoard();
  checkWin(next);
}

// AI moves
function aiMove(){
  const empty = board.map((v,i)=>v===''?i:null).filter(v=>v!==null);
  if(empty.length===0) return;
  let choice;
  if(aiLevel === "easy"){
    choice = empty[Math.floor(Math.random()*empty.length)];
  } else if(aiLevel === "medium"){
    choice = mediumMove();
  } else {
    choice = bestMoveMinimax(board, 'O');
  }
  if(choice !== undefined){
    board[choice] = 'O';
    playClick();
    renderBoard();
    checkWin('O');
  }
}

// medium heuristic
function mediumMove(){
  // try to win
  for(let i=0;i<9;i++) if(board[i]==='') {
    board[i] = 'O';
    if(isWinner(board,'O')) { board[i]=''; return i; }
    board[i]='';
  }
  // try to block
  for(let i=0;i<9;i++) if(board[i]===''){
    board[i] = 'X';
    if(isWinner(board,'X')) { board[i]=''; return i; }
    board[i]='';
  }
  // else random
  const empty = board.map((v,i)=>v===''?i:null).filter(v=>v!==null);
  return empty[Math.floor(Math.random()*empty.length)];
}

// minimax (hard)
function bestMoveMinimax(bd, player){
  const avail = bd.map((v,i)=>v===''?i:null).filter(v=>v!==null);
  if(avail.length===0) return undefined;
  let bestScore = -Infinity;
  let move;
  for(const i of avail){
    bd[i]=player;
    const score = minimax(bd, 0, false, player);
    bd[i]='';
    if(score>bestScore){ bestScore=score; move=i; }
  }
  return move;
}
function minimax(bd, depth, isMax, aiPlayer){
  const human = aiPlayer==='X'?'O':'X';
  const winner = getWinner(bd);
  if(winner) return winner === aiPlayer ? 10-depth : (winner === human ? depth-10 : 0);
  if(!bd.includes('')) return 0;
  if(isMax){
    let best=-Infinity;
    for(let i=0;i<9;i++) if(bd[i]===''){ bd[i]=aiPlayer; best=Math.max(best,minimax(bd,depth+1,false,aiPlayer)); bd[i]=''; }
    return best;
  } else {
    let best=Infinity;
    for(let i=0;i<9;i++) if(bd[i]===''){ bd[i]=human; best=Math.min(best,minimax(bd,depth+1,true,aiPlayer)); bd[i]=''; }
    return best;
  }
}

// win helpers
function getWinner(bd){
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for(const [a,b,c] of lines) if(bd[a] && bd[a]===bd[b] && bd[a]===bd[c]) return bd[a];
  return null;
}
function isWinner(bd, pl){ return !!getWinner(bd) && getWinner(bd)===pl; }

async function checkWin(player){
  const winner = getWinner(board);
  if(winner){
    // highlight
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for(const [a,b,c] of lines){
      if(board[a] && board[a]===board[b] && board[a]===board[c]){
        boardEl.childNodes[a].classList.add('win');
        boardEl.childNodes[b].classList.add('win');
        boardEl.childNodes[c].classList.add('win');
      }
    }
    sndWin.play?.();
    renderStatus(`${winner} wins!`);
    // if logged-in and X won (player) call backend /api/win to credit
    if(token && winner==='X'){
      try{
        const r = await api("/api/win", { method: "POST", body: JSON.stringify({ mode }) });
        if(r.ok){
          const j = await r.json();
          // if backend returns updated user data, refresh local profile
          if(j.balance !== undefined){
            currentUser.balance = j.balance;
            currentUser.level = j.level || currentUser.level;
            currentUser.wins = j.wins || currentUser.wins;
            currentUser.perWinReward = j.perWinReward || currentUser.perWinReward;
            recentHistory = j.history || recentHistory;
            refreshProfileView();
          }
        } else {
          // ignore - backend might not implement /api/win
          // console.warn('win endpoint returned', r.status);
        }
      }catch(e){ console.error('win call failed', e); }
    }
    return true;
  } else if(!board.includes('')){
    renderStatus('Draw!');
    return true;
  }
  return false;
}

// utilities
function renderStatus(text){
  if(text) statusLine.innerText = text;
  else statusLine.innerText = mode === 'ai' ? `Mode: vs AI (${aiLevel})` : 'Mode: Local 2-player';
}

function resetBoard(){
  board = Array(9).fill("");
  Array.from(boardEl.children).forEach(n=>n && n.classList.remove('win'));
  renderBoard();
  renderStatus('Board cleared');
}

function showHint(){
  const idx = aiLevel === 'hard' ? bestMoveMinimax(board,'X') : mediumMove();
  if(idx!==undefined){
    renderStatus(`Hint: cell ${idx+1}`);
    boardEl.childNodes[idx].classList.add('hint');
    setTimeout(()=>boardEl.childNodes[idx].classList.remove('hint'),900);
  } else renderStatus('No hint available');
}

// audio
function playClick(){ try{ sndClick.play(); }catch(e){} }
function toggleMusic(){ musicOn = !musicOn; if(musicOn) bgMusic.play().catch(()=>{}); else bgMusic.pause(); musicToggle.innerText = musicOn ? 'Music: On' : 'Music'; }

// history & UI helpers
function renderHistory(){
  historyList.innerHTML = '';
  if(!recentHistory || recentHistory.length===0){ historyList.innerHTML = '<li class="muted">No activity yet</li>'; return; }
  recentHistory.slice(0,20).forEach(h=>{
    const li = document.createElement('li');
    const left = document.createElement('div'); left.innerText = `${(h.result||'').toUpperCase()} (${h.mode||''})`;
    const right = document.createElement('div'); right.innerText = `${h.reward? '₦'+h.reward : ''} • ${h.at ? new Date(h.at).toLocaleString() : ''}`;
    li.appendChild(left); li.appendChild(right); historyList.appendChild(li);
  });
}

function updateProgressBar(){
  const wins = currentUser && currentUser.wins ? currentUser.wins : 0;
  const winsForNext = 5;
  const progress = (wins % winsForNext) / winsForNext * 100;
  levelProgress.style.width = `${progress}%`;
  levelBadge.innerText = `Lv ${currentUser ? (currentUser.level || 1) : 1}`;
}

// AI options lock/unlock based on level/tier
function updateAiOptions(){
  const hard = aiLevelSelect.querySelector('option[value="hard"]');
  const medium = aiLevelSelect.querySelector('option[value="medium"]');
  if(!currentUser) { hard.disabled = true; medium.disabled = true; return; }
  medium.disabled = !(currentUser.level >= 2 || (currentUser.tier && currentUser.tier >= 500));
  hard.disabled = !(currentUser.level >= 4 || (currentUser.tier && currentUser.tier >= 1000));
}

// upgrade (opens paystack in new tab if backend returns URL)
async function upgrade(){
  if(!token) return alert('Login first');
  const amount = parseInt(prompt('Enter premium amount (₦500 - ₦5000):','500'));
  if(!amount || amount < 500) return alert('Invalid amount');
  try{
    const r = await api('/api/upgrade', { method:'POST', body: JSON.stringify({ amount }) });
    const j = await r.json();
    if(j.authorization_url) window.open(j.authorization_url,'_blank');
    else alert(j.message || 'Upgrade initialized (backend may require webhook to finalize).');
  }catch(e){ alert('Upgrade failed'); console.error(e); }
}

// withdraw (frontend prompts account + name)
async function withdraw(){
  if(!token) return alert('Login first');
  const acc = prompt('Bank account number:');
  const name = prompt("Account holder's name:");
  if(!acc || !name) return;
  try{
    const r = await api('/api/withdraw', { method:'POST', body: JSON.stringify({ account_number: acc, account_name: name }) });
    const j = await r.json();
    if(r.ok) { alert(j.message || 'Withdrawal requested'); currentUser.balance = 0; refreshProfileView(); }
    else alert(j.message || 'Withdraw failed');
  }catch(e){ alert('Withdraw failed'); console.error(e); }
}

// init
function init(){
  renderBoard();
  renderStatus();
  if(token) loadProfile().then(()=>{ authCard.style.display='none'; profileCard.style.display='block'; logoutBtn.style.display='inline-block'; });
}
init();
