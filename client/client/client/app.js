// app.js
// If your backend is on another host (Render), set API_ROOT to that URL (no trailing slash), e.g.:
// const API_ROOT = 'https://your-backend.onrender.com';
const API_ROOT =
const API = (API_ROOT || '') + '/api';

///// UI elements /////
const $ = id => document.getElementById(id);
const nameEl = $('name'), emailEl = $('email'), btnRegister = $('btnRegister');
const authCard = $('authCard'), gameCard = $('gameCard');
const statusEl = $('status'), userInfoEl = $('userInfo'), demoInfoEl = $('demoInfo');
const boardEl = $('board'), startBtn = $('startBtn'), resetBtn = $('resetBtn'), simulateWinBtn = $('simulateWinBtn');
const modeSelect = $('modeSelect'), tierSelect = $('tierSelect'), btnUpgrade = $('btnUpgrade');
const rewardInfoEl = $('rewardInfo'), accNameEl = $('accName'), accNumberEl = $('accNumber'), bankCodeEl = $('bankCode');
const btnCreateRecipient = $('btnCreateRecipient'), recipientInfoEl = $('recipientInfo');
const withdrawAmountEl = $('withdrawAmount'), btnWithdraw = $('btnWithdraw'), withdrawResultEl = $('withdrawResult');
const musicToggle = $('musicToggle');

///// Game state /////
let user = null;
let cells = Array(9).fill(null);
let current = 'X'; // current player symbol for UI (X always starts)
let playing = false;
let mySymbol = 'X';
let aiSymbol = 'O';
let musicOn = false;

// Audio using WebAudio (no external files)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function clickSound(){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine'; o.frequency.value = 800;
  g.gain.value = 0.06;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.06);
}
function winSound(){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'triangle';
  g.gain.value = 0.08;
  o.frequency.value = 440;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); 
  setTimeout(()=> o.stop(), 300);
}
function drawSound(){
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.frequency.value = 220;
  g.gain.value = 0.04;
  o.connect(g); g.connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + 0.12);
}

// simple looped background music (synth)
let musicNode = null;
function startMusic(){
  if(musicNode) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = 'sine';
  o.frequency.value = 220;
  g.gain.value = 0.02;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  musicNode = { osc: o, gain: g };
}
function stopMusic(){
  if(!musicNode) return;
  musicNode.osc.stop();
  musicNode = null;
}

musicToggle.addEventListener('change', () => {
  if(musicToggle.checked){
    // need user gesture to resume AudioContext on some browsers
    if(audioCtx.state === 'suspended') audioCtx.resume();
    startMusic();
  } else stopMusic();
});

///// Render board /////
function renderBoard(){
  boardEl.innerHTML = '';
  for(let i=0;i<9;i++){
    const val = cells[i];
    const c = document.createElement('button');
    c.className = 'cell' + (val ? ' ' + (val === 'X' ? 'x' : 'o') : '');
    c.setAttribute('data-i', i);
    c.setAttribute('aria-label', 'cell ' + (i+1));
    c.innerHTML = val || '';
    c.addEventListener('click', () => onClickCell(i));
    boardEl.appendChild(c);
  }
}

function resetBoard(){
  cells = Array(9).fill(null);
  current = 'X';
  playing = true;
  updateStatus('Game started — ' + (modeSelect.value === 'pvc' ? 'Your turn (X)' : 'Player X\'s turn'));
  renderBoard();
}

function onClickCell(i){
  if(!playing) return;
  if(cells[i]) return;
  clickSound();
  if(modeSelect.value === 'pvc'){
    // player's turn is always X
    if(current !== mySymbol) return;
    makeMove(i, mySymbol);
    const winner = checkWinner(cells);
    if(winner || isFull(cells)){ endGame(winner); return; }
    // AI move with short delay
    setTimeout(()=> {
      const aiMoveIndex = bestMove(cells, aiSymbol);
      if(aiMoveIndex != null) makeMove(aiMoveIndex, aiSymbol);
      const w2 = checkWinner(cells);
      if(w2 || isFull(cells)) endGame(w2);
    }, 300);
  } else {
    // local 2-player
    makeMove(i, current);
    const winner = checkWinner(cells);
    if(winner || isFull(cells)){ endGame(winner); return; }
    current = (current === 'X') ? 'O' : 'X';
    updateStatus('Player ' + current + "'s turn");
  }
}

function makeMove(i, symbol){
  cells[i] = symbol;
  renderBoard();
}

function isFull(b){ return b.every(Boolean); }

function endGame(winner){
  playing = false;
  if(winner){
    winSound();
    updateStatus('Winner: ' + winner);
    // If user is playing PvC and won as X, report to server (API credits reward for premium)
    // Logic: consider "player X" is the local user when in PvC; we will treat X as current user
    if(modeSelect.value === 'pvc' && winner === mySymbol){
      reportWin();
    } else if(modeSelect.value === 'pvp-local'){
      // In local 2-player we can't know which player maps to account. For simplicity we assume the logged-in user is player X.
      if(winner === 'X') reportWin();
    }
  } else {
    drawSound();
    updateStatus('Draw');
  }
}

function updateStatus(t){
  statusEl.textContent = t;
}

///// Game mechanics: minimax for Tic-Tac-Toe /////
function checkWinner(b){
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for(const [a,b1,c] of lines){
    if(b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
  }
  return null;
}
function bestMove(board, aiSymbol){
  const human = aiSymbol === 'X' ? 'O' : 'X';
  // empty cells
  let bestScore = -Infinity, move = null;
  for(let i=0;i<9;i++){
    if(!board[i]){
      board[i] = aiSymbol;
      const score = minimax(board, 0, false, aiSymbol, human);
      board[i] = null;
      if(score > bestScore){ bestScore = score; move = i; }
    }
  }
  return move;
}
function minimax(board, depth, isMax, aiSym, human){
  const winner = checkWinner(board);
  if(winner === aiSym) return 10 - depth;
  if(winner === human) return depth - 10;
  if(isFull(board)) return 0;
  if(isMax){
    let best = -Infinity;
    for(let i=0;i<9;i++){
      if(!board[i]){
        board[i] = aiSym;
        best = Math.max(best, minimax(board, depth+1, false, aiSym, human));
        board[i] = null;
      }
    }
    return best;
  } else {
    let best = Infinity;
    for(let i=0;i<9;i++){
      if(!board[i]){
        board[i] = human;
        best = Math.min(best, minimax(board, depth+1, true, aiSym, human));
        board[i] = null;
      }
    }
    return best;
  }
}

///// API calls & user flows /////
async function api(path, opts = {}){
  try {
    const res = await fetch(API + path, opts);
    const data = await res.json();
    if(!res.ok) throw new Error(data.error || JSON.stringify(data));
    return data;
  } catch (err) {
    console.error('API error', err);
    throw err;
  }
}

btnRegister.addEventListener('click', async () => {
  const name = nameEl.value.trim() || 'Player';
  const email = emailEl.value.trim();
  if(!email){ alert('Please enter an email'); return; }
  btnRegister.disabled = true;
  try {
    const data = await api('/register', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name, email })});
    user = data.user;
    onUserLoaded();
  } catch (e){
    alert('Register failed: ' + e.message);
  } finally { btnRegister.disabled = false; }
});

function onUserLoaded(){
  authCard.style.display = 'none';
  gameCard.style.display = 'block';
  $('playerLabel').textContent = user.name;
  refreshUserInfo();
  renderBoard();
  playing = false;
}

async function refreshUserInfo(){
  if(!user) return;
  try {
    const u = await api('/users/' + user.id);
    user = u;
    userInfoEl.textContent = `${user.name} (${user.email})`;
    $('demoInfo').textContent = `Demo plays left: ${user.demoGamesLeft || 0} | Premium: ${user.premiumTier || 'No'}`;
    updateRewardInfo();
    recipientInfoEl.textContent = `Recipient: ${user.paystackRecipient || 'none'}`;
  } catch (e) {
    console.warn('refresh failed', e);
  }
}

function updateRewardInfo(){
  // rewardBalance stored in smallest unit (kobo). We show NGN value.
  const balSmall = user.rewardBalance || 0;
  const capSmall = user.rewardCap || 0;
  const perWin = user.perWinReward || 0;
  rewardInfoEl.textContent = `Balance: ${formatMoney(balSmall)} / Cap: ${formatMoney(capSmall)} — Per win: ${formatMoney(perWin)}`;
}
function formatMoney(small){ return '₦' + (Number(small || 0) / 100).toFixed(2); }

startBtn.addEventListener('click', () => {
  if(!user){ alert('Register first'); return; }
  // check demo allowance
  startDemoGame();
});

resetBtn.addEventListener('click', () => {
  resetBoard();
  renderBoard();
  updateStatus('Board reset. Start a new game.');
});

simulateWinBtn.addEventListener('click', async () => {
  if(!user){ alert('Register first'); return; }
  // This simulates a win for the logged-in user (for testing)
  try {
    const r = await api('/play/result', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ userId: user.id, result: 'win' })
    });
    alert('Simulate result: ' + JSON.stringify(r));
    await refreshUserInfo();
  } catch (e){ alert('Error: ' + e.message); }
});

async function startDemoGame(){
  try {
    const r = await api('/start-demo', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ userId: user.id })
    });
    if(r.allowed){
      resetBoard();
      updateStatus('Game started — Good luck!');
    } else {
      updateStatus('Demo expired — please upgrade to premium');
      alert('Your demo plays are finished — please upgrade to premium to continue.');
    }
    await refreshUserInfo();
  } catch (e){
    alert('Could not start demo: ' + e.message);
  }
}

// Upgrade flow: initialize transaction then verify
btnUpgrade.addEventListener('click', async () => {
  if(!user){ alert('Register first'); return; }
  const tier = Number(tierSelect.value);
  btnUpgrade.disabled = true;
  try {
    const resp = await api('/init-transaction', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ userId: user.id, amount: tier, currency: 'NGN' })
    });
    if(resp.authorization_url){
      if(resp.demo){
        // demo: server simulates checkout — call verify endpoint to activate
        alert('Demo payment simulated. Activating premium...');
        const v = await api('/verify/' + resp.reference);
        alert('Upgrade result: ' + (v.status || JSON.stringify(v)));
        await refreshUserInfo();
      } else {
        // real mode: open Paystack checkout in new tab
        window.open(resp.authorization_url, '_blank');
        alert('Paystack checkout opened. After payment, your server webhook or /api/verify will activate premium.');
      }
    } else {
      alert('Init transaction failed: ' + JSON.stringify(resp));
    }
  } catch (e){
    alert('Upgrade failed: ' + e.message);
  } finally { btnUpgrade.disabled = false; }
});

// Report a win to server
async function reportWin(){
  if(!user) return;
  try {
    const r = await api('/play/result', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ userId: user.id, result: 'win' })
    });
    if(r.status === 'credited') {
      alert(`You received ${formatMoney(r.amount)}!`);
      await refreshUserInfo();
    } else if(r.status === 'demo-win'){
      alert('Win recorded — upgrade to premium to earn real rewards.');
    } else {
      console.log('play result', r);
    }
  } catch (e){
    console.error('report win error', e);
  }
}

///// Recipient & Withdraw /////
btnCreateRecipient.addEventListener('click', async () => {
  if(!user) return alert('Login first');
  const name = accNameEl.value.trim();
  const account_number = accNumberEl.value.trim();
  const bank_code = bankCodeEl.value.trim();
  if(!name || !account_number || !bank_code) return alert('Fill account name, number and bank code');
  try {
    const r = await api('/create-recipient', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ userId: user.id, name, account_number, bank_code })
    });
    alert('Recipient created: ' + (r.recipient_code || 'OK'));
    await refreshUserInfo();
  } catch (e){
    alert('Create recipient failed: ' + e.message);
  }
});

btnWithdraw.addEventListener('click', async () => {
  if(!user) return alert('Login first');
  const amt = parseFloat(withdrawAmountEl.value);
  if(isNaN(amt) || amt <= 0) return alert('Enter a valid NGN amount');
  const amtSmall = Math.round(amt * 100);
  try {
    const r = await api('/withdraw', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ userId: user.id, amount: amtSmall })
    });
    if(r.ok){ withdrawResultEl.textContent = 'Withdraw successful (demo or pending)'; }
    else withdrawResultEl.textContent = JSON.stringify(r);
    await refreshUserInfo();
  } catch (e){
    withdrawResultEl.textContent = 'Withdraw failed: ' + e.message;
  }
});

///// Init UI /////
renderBoard();
updateStatus('Register to start. Demo mode available by default.');
