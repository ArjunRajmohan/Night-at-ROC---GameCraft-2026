const $ = id => document.getElementById(id);
let clock;
let glitchT = 0, vortexT = 0, returnT = 0;

const Timer = {
  now: () => performance.now()
};