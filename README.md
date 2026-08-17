# Night at ROC

> *The night the system came alive.*

**Game title:** Night at ROC  
**Genre:** 3-in-1 cyber arcade thriller — 3D ROC Walk-in + FPS + Packet Triage + Typing Defense  
**Participant :** Arjun Rajmohan


---

## Brief description
A neon-cyber browser game set inside the UST **Remote Operations Center (ROC)**. After walking to your workstation and logging into your terminal, the alert wall glitches and pulls you *inside the system*. Across **exactly 60 seconds** of core defense, you play **three distinct phases**:

1. **PURGE (FPS) (60–40s)** — A first-person shooter built on a custom raycasting engine. Hunt and neutralize malware intrusions before they reach your position.
2. **FIREWALL (SORT) (40–20s)** — High-speed phishing and traffic triage. Inspect oncoming data packets and route them: **A / Left Arrow** to send threats to EXTERNAL, **D / Right Arrow** to allow safe internal traffic.
3. **DEFEND (TYPING) (20–0s)** — Typing-speed core defense. Type incoming malware payloads to discharge defense lasers and defeat the incoming system boss before it breaches the core.

When the shift ends, remaining Core Integrity is converted into a survival bonus, your score freezes instantly, and the system warps you back to the ROC console for the final debrief.

---

## Controls
| Phase / Screen | Controls |
|---|---|
| **Office Walk-in (Intro)** | **WASD / Arrow Keys** to walk · **Mouse** to look · **Left-Click** to lock pointer |
| **Phase 1: PURGE (FPS)** | **WASD / Arrow Keys** to move · **Mouse** to aim · **Left-Click** to shoot |
| **Phase 2: SORT (Firewall)** | **A / Left Arrow** or on-screen button = EXTERNAL (Trash) · **D / Right Arrow** or on-screen button = INTERNAL (Allow) |
| **Phase 3: DEFEND (Typing)** | **Keyboard (Letters)** to type displayed malware words and fire defense lasers |
| **Global / Any Phase** | **TAB** to pause/resume shift · **Esc** to release pointer lock |

---

## Scoring Rules (Deterministic & Action-Based)
| Action / Event | Score Impact |
|---|---|
| **Purge Kill** | **+10** |
| **Intruder reaches player** | **−5** (and Core Integrity damage) |
| **Correct Packet Route** | **+5 × combo multiplier** (grows with streaks: +5, +10, +15, +20, capped at +25) |
| **Wrong Packet Route / Missed Phish** | **−5**, combo reset to 0 (and −10/−15 Core Integrity) |
| **Malware Word Typed** | **+15** |
| **Boss Defeated** | **+50** |
| **Wrong Keystroke in Typing** | **−3** |
| **Core Survival Bonus** | **+ (Remaining Core Integrity × 0.5)** added at 0s mark |

*The final score freezes instantly when the timer reaches 0 seconds.*

---

## Phishing Awareness & Triage
The SORT phase tests real-world security awareness against look-alike domains and deceptive sender headers:
- `hr@ust.com` ✅ vs `hr-support@ust-global.co` ❌ *(suspicious TLD)*
- `helpdesk@ust.com` ✅ vs `it.helpdesk@ustt-global.com` ❌ *(typosquatted extra letter)*
- `admin@office365.com` ✅ vs `login@office365-verify.com` ❌ *(credential harvest trap)*
- `security@ust.com` ✅ vs `security@ust-globa1.com` ❌ *(numeral substitution)*

All generic payload datasets are structured in `js/content.js`.

---

## Technologies Used
- **HTML5 & CSS3**: Custom neon cyber UI, glitch typography, CRT scanlines, airlock animations, and responsive HUD overlays.
- **JavaScript (Vanilla Modular ES6)**: State management, audio synthesis, collision handling, and leaderboard logic.
- **Three.js (r128)**: 3D interactive ROC office walking sequence, workstation boot-up, and terminal warp transitions.
- **2D Canvas & Custom DDA Raycaster**: Custom software raycaster engine for the FPS phase and 2D canvas particle/laser systems.
- **Web Audio API**: Real-time synthesized sound effects (gunfire, lasers, alarms, airlock hiss, chair spin, and chord jingles) without external audio files.
- **Browser Local Storage**: Device-only Top-10 leaderboard and Personal Best tracking.

---

## How the FPS Raycasting Engine Works
Per screen column, a ray is projected through the grid map using **Digital Differential Analysis (DDA)** to locate wall boundaries. Perpendicular distance calculation eliminates fisheye distortion and scales wall heights and depth-based neon fog. A per-column **Z-buffer** ensures enemy sprite billboards are correctly occluded by walls, while distance pathfinding maps allow enemies to seek the player through corridors.

---

## AI Tool Disclosure
- **AI Tool Used:** Microsoft Copilot
- **Purpose:** Architecture brainstorming, raycasting math validation, Web Audio synthesizer curves, and modular refactoring.
- **Validation:** All generated logic was reviewed, customized, and validated. No confidential, client, or employee data was input into the AI tool. No external APIs or proprietary assets were used.

---

## Launch Instructions
1. Download or clone this repository.
2. Open **`index.html`** in Microsoft Edge or Google Chrome (double-click or right-click *Open With*).
3. Click **Enter the Floor**, walk to your workstation, log in, and defend the core.

---

## Project Structure
Night-at-ROC
├── css/
│   └── styles.css
├── js/
│   ├── content.js        # 3D room, screen canvas, audio, and phishing datasets
│   ├── game.js           # Core game engine: Raycaster FPS, Sort triage, Typing defense
│   ├── leaderboard.js    # Local storage Top-10 and Personal Best manager
│   ├── player.js         # Operator profile, multiplayer state & validation
│   ├── score.js          # Deterministic score, combo streaks & core health
│   └── timer.js          # Timing and clock helpers
├── vendor/
│   └── GET-THREE-JS.txt  # Three.js reference
├── .gitignore
├── index.html            # Main markup and HUD overlay structure
└── README.md             # Project documentation and briefing

## Compliance Checklist (GameCraft 2026)
- [x] Operator name captured and validated before gameplay (trimmed, non-empty, length-limited).
- [x] Full mission briefing and controls displayed prior to start.
- [x] Exact 60-second synchronized countdown visible throughout all three phases.
- [x] Live total score, phase score, combo counter, and Core Integrity bar visible during play.
- [x] Shift terminates cleanly at 0 seconds; score freezes with zero post-game inputs.
- [x] Epilogue and victory cards display final score, personal best, and breakdown stats.
- [x] Includes single-player shift replay
- [x] Pass-and-play local 2-player multiplayer.
- [x] Local Top-10 leaderboard stored on device with clear functionality.
- [x] No unauthorized code copies, external backend dependencies, or tracking scripts.