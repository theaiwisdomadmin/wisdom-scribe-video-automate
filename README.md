# Wisdom Scribe — automatic whiteboard videos

Give it a script and it gives you an MP4. It uses the same Wisdom Scribe app you edit in the browser, running without a screen.

```
videos/
  my-new-video/
    script.txt        the script, one line per section:  0:14 Gemini Notebook is Google's study app ...
    storyboard.js     what to draw and on which phrase (Claude writes this from your script)
    video.json        {"title": "...", "aspect": "9:16", "progressBar": true, "end": 62}
    assets/           SVGs, logos, screenshots  (file name = the name used in storyboard.js)
    voiceover.mp3     optional — mixed in automatically
    music.mp3         optional — looped quietly underneath (musicVolume in video.json, default 0.15)
```

## Option A — fully online (GitHub, free)
1. Create a GitHub repository and upload everything in this folder (keep the `.github` folder).
2. Add a new folder under `videos/` (or let Claude push it for you) and commit.
3. Open the repository's **Actions** tab → *Render videos*. In 3–5 minutes the run shows a **videos** download with the MP4, a preview sheet and a timing report.
   To re-render without changes: Actions → Render videos → **Run workflow** → type the folder name.

Free accounts get 2,000 minutes a month on private repositories (unlimited on public ones). A 1-minute reel uses about 2 minutes, a 5-minute video about 6.

## Option B — on your own computer
Needs Python 3 and Google Chrome (ffmpeg only if you add audio).
```
pip install playwright pillow
python scribe.py make videos/my-new-video        # → out/my-new-video.mp4
```
Other commands: `build` (project + preview only, no video) and `render` (video from an existing project.scribe.json, e.g. after you tweaked it in the app and saved it back into the folder).

## Checking and tweaking
- `preview.png` shows every scene; for 9:16 the red bands mark where Instagram's buttons and caption sit.
- `report.txt` lists every element with its cue time and actual start time. `drift` above 2 s means the screen is busy at that point.
- `project.scribe.json` opens in the Wisdom Scribe app (Open). Fix anything by hand, save it back into the folder and run `render`.
- Placeholders made with `NEED(...)` show as orange dashed boxes and are listed at the top of the report.

## Storyboard helpers
| helper | draws |
|---|---|
| `T(section, cue, text, cx, cy, size, {color, bold})` | handwritten text centred on cx,cy |
| `I(section, cue, icon, x, y, size)` | built-in icon (book, school, bell, arrow, swoosh…) |
| `SV(section, cue, name, x, y, width)` | SVG from assets/, traced by the hand |
| `IMG(section, cue, name, x, y, width)` | logo / photo from assets/ |
| `SHOT(section, cue, name, x, y, width)` | screenshot on a card — never cropped or stretched |
| `HL(section, cue, shot, X, Y, W, x1, y1, x2, y2)` | red circle around a box in the screenshot's own pixels |
| `TAP(section, cue, shot, X, Y, W, px, py, size)` | finger tapping a point in the screenshot |
| `HI(section, cue, x, y, w, h)` | highlighter swipe |
| `NEED(section, cue, label, x, y, w, h)` | placeholder for missing artwork |
| `GUIDE(section, cue, note)` | blank scene for a recorded clip (note shows only in the editor) |

Options on any helper: `scene: true` (new scene), `sceneTrans: 'fade'|'push'|'slideUp'|'zoom'|'wipe'`, `enter: 'draw'|'slide'|'fly'|'fade'|'pop'|'zoom'|'wipe'|'drop'`, `emph: 'pulse'|'wiggle'|'float'|'beat'`, `cam: {cx, cy, w}` (camera close-up), `dur`.
Board size: 3840×2160 for 16:9, 2160×3840 for 9:16. Sections count from 0.
