// client/app.js
// ====== IMPORTANT: set these to your backend URL before deploying ======
// Example: const API_ROOT = "https://tic-tac-backend.onrender.com";
const API_ROOT = https://tic-tac-rewards-2.onrender.com
const SOCKET_URL = https://tic-tac-rewards-2.onrender.com

if(!API_ROOT || !SOCKET_URL){
  console.warn('Set API_ROOT and SOCKET_URL at top of client/app.js before deploying or testing.');
}

let socket = null;
let roomId = null;

// UI elements
const el = id => document.getElementById(id);
const boardEl = el('board');
const messageEl = el('message');
const modeSelect = el('modeSelect');

let cells = Array(9).fill(null);
let current = 'X';
let playing = false;
let mySymbol = 'X';
let currentUser = null;

// --- UI helpers ---
function renderBoard(){
  boardEl.innerHTML = '';
  cells.forEach((v,i) => {
    const c = document.createElement('div');
    c.className = 'cell';
    c.dataset.i = i;
    c.textContent = v || '';
    c.addEventListener('click', () => onClickCell(i));
    boardEl.appendChild(c);
  });
}
renderBoard();

function setMessage(t){ messageEl.textContent = t; }

// --- Game logic ---
function onClickCell(i){
  if(!playing) return;
  if(cells[i]) return;
  if(modeSelect.value === 'pvp-online'){
    if(!socket) return alert('Connect to online room first');
    socket.emit('game:move', { roomId, index: i, player: mySymbol });
    return;
  }
  if(modeSelect.value === 'pvc'){
    if(current !== mySymbol) return;
    makeMove(i, mySymbol);
    const winner = checkWinner(cells);
    if(winner || isFull(cells)){ endGame(winner); return; }
    // AI move
    const aiIndex = bestMove(cells, getOpponent(mySymbol));
    makeMove(aiIndex, getOpponent(mySymbol));
    const w2 = checkWinner(cells);
    if(w2 || isFull(cells)) endGame(w2);
  } else {
    // local 2-player
    makeMove(i, current);
    const w = checkWinner(cells);
    if(w || isFull(cells)) endGame(w);
    current = getOpponent(current);
  }
}
function makeMove(i, symbol){ cells[i] = symbol; renderBoard(); }
function isFull(b){ return b.every(Boolean); }
function endGame(winner){
  playing = false;
  if(winner){
    setMessage(`Winner: ${winner}`);
    // if local or AI, and currentUser exists and premium, report win to backend
    if(currentUser){
      fetch(API_ROOT + '/api/play/result', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ userId: currentUser.id, result: 'win' })
      }).then(r=>r.json()).then(d=>{
        if(d.status === 'credited') alert(`You got ${d.amount} (smallest unit). Balance: ${d.rewardBalance}`);
        else if(d.status === 'demo-win') alert(d.message);
      }).catch(()=>{});
    }
  } else {
    setMessage('Draw');
  }
}

// winner check
function checkWinner(b){
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for(const [a,c,d] of lines){
    if(b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return null;
}
function getOpponent(s){ return s === 'X' ? 'O' : 'X'; }

// minimax AI
function bestMove(board, ai){
  const human = getOpponent(ai);
  let bestScore = -Infinity, move = null;
  for(let i=0;i<9;i++){
    if(!board[i]){
      board[i] = ai;
      const score = minimax(board, 0, false, ai, human);
      board[i] = null;
      if(score > bestScore){ bestScore = score; move = i; }
    }
  }
  return move;
}
function minimax(board, depth, isMax, ai, human){
  const winner = checkWinner(board);
  if(winner === ai) return 10 - depth;
  if(winner === human) return depth - 10;
  if(isFull(board)) return 0;
  if(isMax){
    let best = -Infinity;
    for(let i=0;i<9;i++) if(!board[i]){ board[i]=ai; best = Math.max(best, minimax(board, depth+1, false, ai, human)); board[i]=null; }
    return best;
  } else {
    let best = Infinity;
    for(let i=0;i<9;i++) if(!board[i]){ board[i]=human; best = Math.min(best, minimax(board, depth+1, true, ai, human)); board[i]=null; }
    return best;
  }
}

// --- Buttons & UI actions ---
el('btnRegister').addEventListener('click', async () => {
  const name = el('name').value.trim();
  const email = el('email').value.trim();
  if(!email) return alert('email required');
  try {
    const r = await fetch(API_ROOT + '/api/register', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name, email })
    });
    const data = await r.json();
    currentUser = data.user;
    el('auth').style.display = 'none';
    el('gameArea').style.display = 'block';
    refreshUser();
    setMessage('Registered: ' + currentUser.name);
  } catch (e) { alert('Register failed'); }
});

el('btnStart').addEventListener('click', () => {
  cells = Array(9).fill(null);
  current = 'X';
  mySymbol = 'X';
  playing = true;
  renderBoard();
  setMessage('Game started (' + modeSelect.value + ')');
});

el('btnReset').addEventListener('click', () => { cells = Array(9).fill(null); playing=false; renderBoard(); setMessage(''); });

el('btnStartDemo').addEventListener('click', async () => {
  if(!currentUser) return alert('login first');
  const r = await fetch(API_ROOT + '/api/start-demo', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ userId: currentUser.id })
  }).then(r=>r.json());
  if(r.allowed){ alert('Demo started. Demo left: ' + r.demoLeft); } else alert('Demo expired. Please upgrade.');
  await refreshUser();
});

el('btnPlayWin').addEventListener('click', async () => {
  if(!currentUser) return alert('login first');
  const r = await fetch(API_ROOT + '/api/play/result', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ userId: currentUser.id, result: 'win' })
  }).then(r=>r.json());
  alert('Result: ' + JSON.stringify(r));
  await refreshUser();
});

// Upgrade flow
el('btnUpgrade').addEventListener('click', async () => {
  if(!currentUser) return alert('login first');
  const tier = parseInt(el('tierSelect').value, 10);
  const r = await fetch(API_ROOT + '/api/init-transaction', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ userId: currentUser.id, amount: tier, currency: 'NGN' })
  }).then(r=>r.json());
  if(r.authorization_url){
    if(r.demo){
      alert('Demo payment simulated. Auto-verifying...');
      const v = await fetch(API_ROOT + '/api/verify/' + r.reference).then(r=>r.json());
      alert('Upgrade done: ' + JSON.stringify(v));
      await refreshUser();
    } else {
      // open actual Paystack checkout in new tab
      window.open(r.authorization_url, '_blank');
      alert('Paystack checkout opened. After payment verify or wait for webhook.');
    }
  } else alert('Init failed: ' + JSON.stringify(r));
});

// create recipient
el('btnCreateRecipient').addEventListener('click', async () => {
  if(!currentUser) return alert('login first');
  const name = el('accName').value.trim(), acc = el('accNumber').value.trim(), bank = el('bankCode').value.trim();
  if(!name || !acc || !bank) return alert('fill fields');
  const r = await fetch(API_ROOT + '/api/create-recipient', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ userId: currentUser.id, account_number: acc, bank_code: bank, name })
  }).then(r=>r.json());
  alert('Recipient: ' + JSON.stringify(r));
  await refreshUser();
});

// withdraw
el('btnWithdraw').addEventListener('click', async () => {
  if(!currentUser) return alert('login first');
  const amt = parseFloat(el('withdrawAmount').value || '0');
  if(!amt) return alert('enter amount');
  const amtSmall = Math.round(amt * 100);
  const r = await fetch(API_ROOT + '/api/withdraw', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ userId: currentUser.id, amount: amtSmall })
  }).then(r=>r.json());
  alert('Withdraw: ' + JSON.stringify(r));
  await refreshUser();
});

// show user info
async function refreshUser(){
  if(!currentUser) return;
  const u = await fetch(API_ROOT + '/api/users/' + currentUser.id).then(r=>r.json());
  currentUser = u;
  el('userInfo').textContent = `${currentUser.name} (${currentUser.email}) — Demo left: ${currentUser.demoGamesLeft} — Premium: ${currentUser.premiumTier || 'No'}`;
  el('rewardInfo').textContent = `Balance: ${currentUser.rewardBalance} (smallest unit) | cap ${currentUser.rewardCap} | per-win ${currentUser.perWinReward}`;
}

// --- Online (Socket.io) ---
el('btnJoinRoom').addEventListener('click', () => {
  if(!currentUser) return alert('login first');
  const rid = el('roomId').value.trim() || null;
  if(!socket){
    socket = io(SOCKET_URL, { transports: ['websocket','polling'] });
    socket.on('connect', ()=>console.log('socket connected', socket.id));
    socket.on('room:update', (r) => el('roomInfo').textContent = 'Room players: ' + (r.players||[]).map(p=>p.name).join(', '));
    socket.on('game:move', (d) => { cells = d.state; renderBoard(); const w = checkWinner(cells); if(w) endGame(w); });
    socket.on('game:over', (d) => { cells = d.state; renderBoard(); endGame(d.winner); });
    socket.on('joined', (d) => { roomId = d.roomId; setMessage('Joined room: ' + roomId); });
    socket.on('reward:credited', (d) => alert('Reward credited: ' + JSON.stringify(d)));
  }
  socket.emit('join-room', { roomId: rid, name: currentUser.name });
  el('onlineBox').style.display = 'block';
});

// When socket receives 'game:move' it updates board; to send moves we emit from onClickCell

// initial UI
renderBoard();
