const API_ROOT = https://tic-tac-rewards-2.onrender.com
// app.js - TicTacPlay (client-side only)
// Features: music, sound fx as WebAudio, AI (minimax), local 2-player, scoreboard, localStorage

// ---------- Utilities & state ----------
const $ = id => document.getElementById(id);
const boardEl = document.getElementById('board');
const messageEl = document.getElementById('message');
const modeSelect = document.getElementById('modeSelect');
const firstSelect = document.getElementById('firstSelect');
const newRoundBtn = document.getElementById('newRoundBtn');
const resetScoreBtn = document.getElementById('resetScoreBtn');
const musicToggle = document.getElementById('musicToggle');
const soundToggle = document.getElementById('soundToggle');
const undoBtn = document.getElementById('undoBtn');
const hintBtn = document.getElementById('hintBtn');

let cells = Array(9).fill(null);
let history = [];
let current = 'X';
let playing = false;
let myMode = 'pvc';
let scores = { X:0, O:0, D:0 };
const LS_KEY = 'tictacplay_scores_v1';

// ---------- Audio: WebAudio simple music & sfx ----------
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let bgOsc = null;
let bgGain = null;

function ensureAudio(){
  if(!audioCtx){
    audioCtx = new AudioCtx();
  }
}
function startMusic(){
  if(!musicToggle.checked) return;
  ensureAudio();
  if(bgOsc) return;
  bgOsc = audioCtx.createOscillator();
  bgGain = audioCtx.createGain();
  bgOsc.type = 'sine';
  bgOsc.frequency.value = 220;
  bgGain.gain.value = 0.02;
  bgOsc.connect(bgGain);
  bgGain.connect(audioCtx.destination);
  bgOsc.start();
}
function stopMusic(){
  if(bgOsc){
    try{ bgOsc.stop(); }catch(e){}
    bgOsc.disconnect();
    bgGain.disconnect();
    bgOsc = null;
    bgGain = null;
  }
}
musicToggle.addEventListener('change', ()=> {
  if(musicToggle.checked) startMusic(); else stopMusic();
});

// sound fx: short beeps
function playTone(freq=440, length=0.08, type='sine', vol=0.08){
  if(!soundToggle.checked) return;
  ensureAudio();
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + length);
  setTimeout(()=>{ try{ o.stop(); } catch(e){} }, length*1000+20);
}

// ---------- Rendering ----------
function renderBoard(){
  boardEl.innerHTML = '';
  for(let i=0;i<9;i++){
    const d = document.createElement('div');
    d.className = 'cell' + (cells[i] ? (' '+cells[i].toLowerCase()) : '');
    d.dataset.i = i;
    d.textContent = cells[i] || '';
    d.addEventListener('click', onClickCell);
    boardEl.appendChild(d);
  }
}

function setMessage(t){
  messageEl.textContent = t;
}

// ---------- Game logic ----------
const lines = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

function checkWinner(b){
  for(const [a,b1,c] of lines){
    if(b[a] && b[a] === b[b1] && b[a] === b[c]) return b[a];
  }
  return null;
}
function isFull(b){ return b.every(Boolean); }

function makeMove(i, symbol){
  if(cells[i]) return false;
  history.push(cells.slice());
  cells[i] = symbol;
  renderBoard();
  playTone(600,0.06,'sine',0.06);
  return true;
}

function undo(){
  if(history.length === 0) return;
  cells = history.pop();
  renderBoard();
  setMessage('Undid last move');
}

function endRound(winner){
  playing = false;
  if(winner){
    setMessage(`${winner} wins!`);
    scores[winner]++;
    animateWin(winner);
    playTone(winner === 'X' ? 880 : 520, 0.18, 'sawtooth', 0.16);
  } else {
    setMessage('Draw');
    scores.D++;
    playTone(320,0.16,'triangle',0.12);
  }
  saveScores();
  updateScoresUI();
}

// simple flash animation on win pieces
function animateWin(winner){
  const winners = [];
  for(const [a,b1,c] of lines){
    if(cells[a] === winner && cells[b1] === winner && cells[c] === winner){
      winners.push([a,b1,c]);
    }
  }
  if(winners.length){
    winners[0].forEach(i=> {
      const el = boardEl.querySelector(`.cell[data-i="${i}"]`);
      if(!el) return;
      el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 600 });
    });
  }
}

// ---------- AI: minimax ----------
function getAvailable(b){
  return b.map((v,i)=> v ? null : i).filter(x=>x!==null);
}
function minimax(b, player, aiPlayer, human){
  const winner = checkWinner(b);
  if(winner === aiPlayer) return {score: 10};
  if(winner === human) return {score: -10};
  if(isFull(b)) return {score: 0};

  const moves = [];
  for(const i of getAvailable(b)){
    b[i] = player;
    const result = minimax(b, player === aiPlayer ? human : aiPlayer, aiPlayer, human);
    moves.push({ index: i, score: result.score });
    b[i] = null;
  }

  let bestMove;
  if(player === aiPlayer){
    let bestScore = -Infinity;
    for(const m of moves) if(m.score > bestScore) { bestScore = m.score; bestMove = m; }
  } else {
    let bestScore = Infinity;
    for(const m of moves) if(m.score < bestScore) { bestScore = m.score; bestMove = m; }
  }
  return bestMove;
}
function bestMoveForAI(b, aiPlayer){
  const human = aiPlayer === 'X' ? 'O' : 'X';
  const bm = minimax(b.slice(), aiPlayer, aiPlayer, human);
  return bm?.index ?? null;
}

// hint: show best move on UI briefly
function hint(){
  if(myMode !== 'pvc') { setMessage('Hint only available vs AI'); return; }
  const aiAs = current === 'X' ? 'X' : 'O';
  const suggest = bestMoveForAI(cells.slice(), current === aiAs ? current : (current === 'X' ? 'O' : 'X'));
  if(suggest===null){ setMessage('No hint'); return; }
  const el = boardEl.querySelector(`.cell[data-i="${suggest}"]`);
  if(el){
    el.animate([{ boxShadow: '0 0 0px rgba(0,0,0,0)' }, { boxShadow: '0 0 18px rgba(0,212,255,0.28)' }], { duration: 700 });
    setMessage('Suggested move highlighted');
  }
}

// ---------- User actions ----------
function onClickCell(e){
  if(!playing) return;
  const i = Number(e.currentTarget.dataset.i);
  if(cells[i]) return;
  if(myMode === 'pvp-local'){
    const ok = makeMove(i, current);
    if(!ok) return;
    const w = checkWinner(cells);
    if(w || isFull(cells)) return endRound(w);
    current = current === 'X' ? 'O' : 'X';
    setMessage(`Turn: ${current}`);
    return;
  } else {
    // pvc: player always X (unless firstSelect set ai first)
    if(modeSelect.value === 'pvc'){
      // If AI is set to start and current === AI, ignore player clicks
      const first = firstSelect.value;
      const aiStarts = first === 'ai' || (first === 'random' && Math.random() < 0.5);
      // treat logic simpler: allow player move if current is X or current assigned
      if(!makeMove(i, current)) return;
      const w = checkWinner(cells);
      if(w || isFull(cells)) return endRound(w);
      current = current === 'X' ? 'O' : 'X';
      setMessage('AI thinking...');
      // AI move a bit later
      setTimeout(()=> {
        const ai = bestMoveForAI(cells.slice(), current);
        if(ai !== null) makeMove(ai, current);
        const w2 = checkWinner(cells);
        if(w2 || isFull(cells)) return endRound(w2);
        current = current === 'X' ? 'O' : 'X';
        setMessage(`Turn: ${current}`);
      }, 400);
    }
  }
}

// start a new round: clear board, set starter
function newRound(){
  cells = Array(9).fill(null);
  history = [];
  renderBoard();
  playing = true;
  myMode = modeSelect.value;
  current = (firstSelect.value === 'player' ? 'X' : (firstSelect.value === 'ai' ? 'X' : (Math.random() < 0.5 ? 'X':'O')));
  // If first==ai and mode pvc and current is AI then let AI move
  setMessage(`Mode: ${myMode === 'pvc' ? 'vs AI' : '2 Player'} — Turn: ${current}`);
  if(myMode === 'pvc' && firstSelect.value === 'ai' && current === 'X'){
    // AI goes first as X
    setTimeout(()=> {
      const aiIndex = bestMoveForAI(cells.slice(), 'X');
      if(aiIndex !== null) makeMove(aiIndex, 'X');
      current = 'O';
      setMessage('Your turn (O)');
    }, 450);
  }
  updateScoresUI();
}

// ---------- Scores storage ----------
function loadScores(){
  try{
    const s = localStorage.getItem(LS_KEY);
    if(s) scores = JSON.parse(s);
  }catch(e){}
  updateScoresUI();
}
function saveScores(){
  localStorage.setItem(LS_KEY, JSON.stringify(scores));
}
function updateScoresUI(){
  document.getElementById('scoreX').textContent = scores.X;
  document.getElementById('scoreO').textContent = scores.O;
  document.getElementById('scoreDraw').textContent = scores.D;
}

// ---------- Buttons ----------
newRoundBtn.addEventListener('click', ()=> {
  newRound();
  playTone(700,0.06,'sine',0.06);
});
resetScoreBtn.addEventListener('click', ()=> {
  scores = {X:0,O:0,D:0};
  saveScores();
  updateScoresUI();
  setMessage('Scores reset');
  playTone(300,0.08,'triangle',0.08);
});
undoBtn.addEventListener('click', ()=> undo());
hintBtn.addEventListener('click', ()=> hint());

modeSelect.addEventListener('change', ()=> {
  myMode = modeSelect.value;
  setMessage('Mode changed — click New Round to start');
});

// ---------- init ----------
renderBoard();
loadScores();
setMessage('Ready — choose mode and press New Round');

// Autoplay music requires a user gesture in some browsers. resume on first touch.
document.addEventListener('touchstart', function initAudio(){
  document.removeEventListener('touchstart', initAudio);
  if(musicToggle.checked) startMusic();
});

// Accessibility: keyboard navigation
document.addEventListener('keydown', (e)=> {
  if(e.key === 'r') newRound();
  if(e.key === 'u') undo();
});
