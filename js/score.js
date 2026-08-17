const SCORE = {
  KILL: 10, ENEMY_REACH: -5,
  SORT_COMBO_UNIT: 5, SORT_COMBO_CAP: 5, SORT_WRONG: -5,
  WORD: 15, BOSS: 50, WRONG_KEY: -3,
  SURVIVE_MULT: 0.5
};

const GameState = {
  score: 0, phaseStartScore: 0, health: 100, mode: 'purge', combo: 0, frozen: false,
  stats: { kills: 0, enemyReach: 0, sortCorrect: 0, sortWrong: 0, wordsCompleted: 0, bossKills: 0 },
  addScore(pts) { if (this.frozen) return; this.score = Math.max(0, this.score + pts); UI.update(); },
  damage(amt) { this.health = Math.max(0, this.health - amt); UI.update(); UI.flash(); },
  reset() { this.score = 0; this.phaseStartScore = 0; this.health = 100; this.mode = 'purge'; this.combo = 0; this.frozen = false; this.stats = { kills: 0, enemyReach: 0, sortCorrect: 0, sortWrong: 0, wordsCompleted: 0, bossKills: 0 }; UI.update(); },
  sortAccuracy() { const tot = this.stats.sortCorrect + this.stats.sortWrong; return tot ? Math.round(this.stats.sortCorrect / tot * 100) : 0; }
};