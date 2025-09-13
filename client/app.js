const API_ROOT = "https://your-backend.onrender.com"; // replace with Render backend

let currentUser = null;
let board = ["","","","","","","","",""];
let currentPlayer = "X";
let gameMode = null;
let aiLevel = "easy";

// 🎵 Audio
const bgMusic = document.getElementById("bg-music");
const clickSound = document.getElementById("click-sound");
const winSound = document.getElementById("win-sound");
const drawSound = document.getElementById("draw-sound");

// --- Auth ---
async function register(){
  const name = document.getElementById("reg-name").value;
  const email = document.getElementById("reg-email").value;
  const password = document.getElementById("reg-password").value;

  const res = await fetch(`${API_ROOT}/api/register`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ name, email, password })
  });
  const data = await res.json();
  alert(data.message || data.error);
}

async function login(){
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  const res = await fetch(`${API_ROOT}/api/login`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if(data.user){
    currentUser = data.user;
    document.getElementById("welcome").innerText = "Welcome " + currentUser.name;
    updateUserInfo();
    document.getElementById("auth-forms").style.display="none";
    document.getElementById("user-info").style.display="block";
    bgMusic.play();
  } else {
    alert(data.error);
  }
}

function logout(){
  currentUser = null;
  document.getElementById("auth-forms").style.display="block";
  document.getElementById("user-info").style.display="none";
  bgMusic.pause();
}

function updateUserInfo(){
  document.getElementById("balance").innerText = "Balance: ₦" + (currentUser.balance || 0);
}

// --- Game ---
function startGame(mode){
  gameMode = mode;
  board = ["","","","","","","","",""];
  currentPlayer = "X";
  document.getElementById("status").innerText = "Player X's turn";
  renderBoard();
  if(mode==="ai") document.getElementById("difficulty").style.display="block";
}

function setDifficulty(level){
  aiLevel = level;
  document.getElementById("difficulty").style.display="none";
}

function renderBoard(){
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML="";
  board.forEach((cell, idx)=>{
    const div = document.createElement("div");
    div.className="cell";
    div.innerText=cell;
    div.onclick=()=>makeMove(idx);
    boardDiv.appendChild(div);
  });
}

function makeMove(idx){
  if(board[idx]!=="" || checkWin("X") || checkWin("O")) return;

  board[idx] = currentPlayer;
  clickSound.play();
  renderBoard();

  if(checkWin(currentPlayer)){
    winSound.play();
    document.getElementById("status").innerText = currentPlayer + " wins!";
    if(currentUser) sendWin();
    return;
  }

  if(board.every(c=>c!=="")){
    drawSound.play();
    document.getElementById("status").innerText = "Draw!";
    return;
  }

  currentPlayer = currentPlayer==="X" ? "O" : "X";
  document.getElementById("status").innerText = "Player " + currentPlayer + "'s turn";

  if(gameMode==="ai" && currentPlayer==="O"){
    setTimeout(()=>{
      const move = aiMove(aiLevel);
      makeMove(move);
    }, 600);
  }
}

function checkWin(p){
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return wins.some(combo=> combo.every(i=>board[i]===p));
}

function aiMove(level){
  const empty = board.map((v,i)=> v===""?i:null).filter(v=>v!==null);

  if(level==="easy") return empty[Math.floor(Math.random()*empty.length)];
  if(level==="medium"){
    for(let i of empty){
      board[i]="O"; if(checkWin("O")){board[i]=""; return i;} board[i]="";
    }
    for(let i of empty){
      board[i]="X"; if(checkWin("X")){board[i]=""; return i;} board[i]="";
    }
    return empty[Math.floor(Math.random()*empty.length)];
  }
  if(level==="hard"){
    return minimax(board,"O").index;
  }
}

function minimax(newBoard, player){
  const availSpots = newBoard.map((v,i)=> v===""?i:null).filter(v=>v!==null);
  if(checkWin("X")) return {score:-10};
  if(checkWin("O")) return {score:10};
  if(availSpots.length===0) return {score:0};

  const moves=[];
  for(let i of availSpots){
    const move={index:i};
    newBoard[i]=player;
    if(player==="O") move.score = minimax(newBoard,"X").score;
    else move.score = minimax(newBoard,"O").score;
    newBoard[i]="";
    moves.push(move);
  }
  let bestMove;
  if(player==="O"){
    let bestScore=-1000;
    moves.forEach((m,idx)=>{ if(m.score>bestScore){bestScore=m.score; bestMove=idx;} });
  } else {
    let bestScore=1000;
    moves.forEach((m,idx)=>{ if(m.score<bestScore){bestScore=m.score; bestMove=idx;} });
  }
  return moves[bestMove];
}

// --- API: Win reward ---
async function sendWin(){
  const res = await fetch(`${API_ROOT}/api/win`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ email: currentUser.email })
  });
  const data = await res.json();
  currentUser.balance = data.balance;
  updateUserInfo();
}

// --- Withdraw ---
async function withdraw(){
  if(!currentUser) return;
  const account = prompt("Enter bank account number:");
  const name = prompt("Enter account holder's name:");
  if(!account || !name) return;

  const res = await fetch(`${API_ROOT}/api/withdraw`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ email: currentUser.email, account_number: account, account_name: name })
  });
  const data = await res.json();
  alert(data.message);
  if(data.status==="success"){
    currentUser.balance=0;
    updateUserInfo();
  }
}
