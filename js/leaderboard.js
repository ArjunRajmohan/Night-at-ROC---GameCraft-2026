const LB_KEY="roc_top10", PB_KEY="roc_pb";
function getLeaderboard(){ try{ return JSON.parse(localStorage.getItem(LB_KEY)||"[]"); }catch(e){ return []; } }
function saveScore(name,score){
  const list=getLeaderboard();
  list.push({name:(name||"Operator").slice(0,18), score:score|0, date:new Date().toLocaleString()});
  list.sort((a,b)=>b.score-a.score);
  const top=list.slice(0,10);
  try{ localStorage.setItem(LB_KEY,JSON.stringify(top)); }catch(e){}
  return top;
}
function getPersonalBest(){ return Number(localStorage.getItem(PB_KEY)||0); }
function savePersonalBest(score){ if(score>getPersonalBest()){ try{ localStorage.setItem(PB_KEY,String(score|0)); }catch(e){} } }
function clearLeaderboard(){ try{ localStorage.removeItem(LB_KEY); localStorage.removeItem(PB_KEY); }catch(e){} }
function renderLeaderboardInto(elId){
  const list=getLeaderboard(), host=$(elId); if(!host)return;
  if(!list.length){ host.innerHTML='<div class="lb-empty">No scores yet.<br>Finish a shift to make the board.</div>'; return; }
  host.innerHTML=list.map((r,i)=>{
    const cls=i===0?'top1':i===1?'top2':i===2?'top3':'';
    const medal=i===0?'\u{1F947}':i===1?'\u{1F948}':i===2?'\u{1F949}':('#'+(i+1));
    return `<div class="lb-row ${cls}"><div class="lb-rank">${medal}</div><div><div class="lb-name">${escapeHtml(r.name)}</div><div class="lb-date">${escapeHtml(r.date||'')}</div></div><div class="lb-score">${r.score}</div></div>`;
  }).join('');
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }