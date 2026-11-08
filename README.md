 # chess-assist

chess.com companion tool — post-game analysis, accuracy stats, and board themes powered by Stockfish 18

---

## Features

### Engine Analysis
- **Stockfish 18 WASM** running locally in your browser — no server, no latency
- Adjustable search depth (1–24 ply)
- Best move arrows drawn directly on the board
- Hidden arrow mode — highlights squares instead of drawing arrows, for a subtler look
- Opponent's best move overlay — see what they should play next
- One-click "Analyze once" for quick position evaluation

### Accuracy & Statistics
- **Centipawn loss (CPL)** tracked per move
- **Best move rate** — percentage of engine-matching moves
- **Lichess accuracy formula** — same metric used on lichess.org
- **Suspicion scoring** — compares stats against expected values for a given ELO bracket
- Toggle between analyzing your moves or your opponent's
- Re-analyze and reset at any time

### Win Percentage Bar
- Live eval bar alongside the board
- Displays white/black win percentages based on centipawn evaluation
- Smooth transitions as the position shifts

### Auto-Play
- Engine plays moves automatically on your behalf
- Configurable delay range (min/max) to vary move timing
- Toggleable mid-game

### Custom Board Skins
- Replace any piece sprite (king, queen, rook, bishop, knight, pawn — both colors)
- Custom board background
- Separate light/dark tile overlays
- **Mask mode** — uses the original piece silhouette as a mask over your custom image
- Skins saved in localStorage and persist across sessions

### Keybinds
- Bind any feature toggle to a key or key combo
- Supports modifiers (Ctrl, Alt, Shift, Meta) and solo modifier taps
- Visual recording UI — press the key you want, it binds
- Conflict detection — rebinding a key auto-clears the old binding
- Hide/show the entire UI with a single keypress

### UI
- Floating lavender bubble — click to open, drag to reposition
- Sidebar navigation with four pages: Gameplay, Detection, Skins, Settings
- Draggable panel — grab the sidebar header to move the whole window
- Smooth open/close animations with glow effects
- Dark theme, purple/lavender accent palette
- Compact footprint — stays out of the way during games

---

## Installation

1. Open [chess.com](https://www.chess.com) in your browser
2. Open DevTools (`F12`) → Console
3. Paste the contents of `chess-assist.user.js` and press Enter
4. The lavender bubble appears in the top-right corner

---

## Usage

| Action | How |
|---|---|
| Open panel | Click the bubble |
| Move bubble | Drag the bubble |
| Move panel | Drag the sidebar header |
| Toggle feature | Flip the switch or press its keybind |
| Set a keybind | Click the key badge next to a toggle, then press your key |
| Apply a skin | Click a piece tile in the Skins tab, pick an image |
| Hide everything | Bind the "Hide" keybind and press it |

---

## Tech

- **Engine:** Stockfish 18 via [stockfish.js](https://www.npmjs.com/package/stockfish) WASM build, loaded from unpkg CDN
- **Protocol:** UCI over Web Worker
- **Board detection:** Reads piece positions from chess.com's DOM (`wc-chess-board` / `chess-board`)
- **FEN extraction:** Parses the board state into standard FEN notation each tick
- **Move execution:** Simulates clicks on source/target squares for auto-play
- **Skins:** CSS `background-image` injection with optional `mask-image` compositing
- **Storage:** `localStorage` for skins and preferences

---

## License

MIT

---

Built by [@snippetcarried](https://github.com/snippetcarried) · [meko.gg](https://meko.gg)
