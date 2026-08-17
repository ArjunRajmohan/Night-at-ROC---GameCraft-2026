let playerName="Operator";
let isMultiplayer=false;
let currentPlayer=1;
let player2Name="Player 2";
let multiData={p1:null,p2:null};

function refreshProfile(){
  if($('profileName')) $('profileName').textContent=playerName;
  if($('avatar')) $('avatar').textContent=(playerName[0]||'?').toUpperCase();
}