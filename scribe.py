#!/usr/bin/env python3
"""Wisdom Scribe automation: turn a video folder (script + storyboard + assets) into an MP4.

    python scribe.py build  videos/my-video            # -> project.scribe.json, preview.png, report.txt
    python scribe.py render videos/my-video            # -> out/my-video.mp4 (uses project.scribe.json)
    python scribe.py make   videos/my-video            # build + render in one go
    python scribe.py make   --changed                  # every video folder changed in the last git commit (CI)

A video folder contains:
    script.txt        lines like "0:14 Gemini Notebook is Google's study app ..."
    storyboard.js     calls T(), I(), SV(), IMG(), SHOT(), HL(), TAP(), HI(), NEED(), GUIDE()
    video.json        {"title": "...", "aspect": "9:16", "progressBar": true, "res": 1080, "fps": 30}
    assets/           *.svg illustrations, *.png/*.jpg/*.webp pictures and screenshots (file name = key)
    voiceover.*       optional, mixed into the MP4
    music.*           optional, looped quietly under the voiceover
"""
import argparse, base64, io, json, os, re, shutil, subprocess, sys, tempfile, time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
APP = ROOT / 'app' / 'wisdom-scribe.html'
ENGINE = ROOT / 'engine' / 'storyboard.js'
AUDIO_EXT = ('.mp3', '.m4a', '.wav', '.aac', '.ogg')


def log(*a):
    print('[scribe]', *a, flush=True)


# ----------------------------------------------------------------------------- assets
def data_url(path: Path) -> str:
    mime = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif'}[path.suffix.lower()]
    return f'data:{mime};base64,' + base64.b64encode(path.read_bytes()).decode()


def svg_aspect(text: str) -> float:
    m = re.search(r'viewBox\s*=\s*"([^"]+)"', text)
    if m:
        p = [float(v) for v in re.split(r'[\s,]+', m.group(1).strip())]
        if len(p) == 4 and p[3] > 0:
            return p[2] / p[3]
    w = re.search(r'\swidth\s*=\s*"([\d.]+)', text); h = re.search(r'\sheight\s*=\s*"([\d.]+)', text)
    return float(w.group(1)) / float(h.group(1)) if w and h else 1.0


def load_assets(folder: Path) -> dict:
    from PIL import Image
    out = {'svg': {}, 'images': {}}
    adir = folder / 'assets'
    if not adir.exists():
        return out
    for f in sorted(adir.iterdir()):
        key, ext = f.stem, f.suffix.lower()
        if ext == '.svg':
            t = f.read_text(encoding='utf-8', errors='ignore')
            out['svg'][key] = {'data': t, 'aspect': svg_aspect(t)}
        elif ext in ('.png', '.jpg', '.jpeg', '.webp', '.gif'):
            with Image.open(f) as im:
                w, h = im.size
                big = max(w, h) > 2000 or f.stat().st_size > 1_500_000 or ext == '.webp'
                if big:  # keep projects light: resize huge pictures (same shape, never cropped)
                    k = min(1.0, 2000 / max(w, h)); im2 = im.convert('RGBA' if im.mode in ('RGBA', 'LA', 'P') else 'RGB')
                    im2 = im2.resize((round(w * k), round(h * k)), Image.LANCZOS) if k < 1 else im2
                    buf = io.BytesIO(); fmt = 'PNG' if im2.mode == 'RGBA' else 'JPEG'
                    im2.save(buf, fmt, **({'quality': 92} if fmt == 'JPEG' else {'optimize': True}))
                    url = f'data:image/{fmt.lower()};base64,' + base64.b64encode(buf.getvalue()).decode()
                else:
                    url = data_url(f)
            out['images'][key] = {'w': w, 'h': h, 'name': f.name, 'data': url}
    return out


# ----------------------------------------------------------------------------- browser
def open_app(p):
    """Launch Chrome headless with the app loaded. Prefers Google Chrome (has the H.264 encoder)."""
    args = ['--no-sandbox', '--autoplay-policy=no-user-gesture-required']
    browser = None
    exe = os.environ.get('CHROME_PATH')
    tries = [dict(executable_path=exe)] if exe else []
    tries += [dict(channel='chrome'), dict(executable_path='/usr/bin/google-chrome'), dict()]
    for kw in tries:
        try:
            browser = p.chromium.launch(args=args, **kw); break
        except Exception:
            continue
    if not browser:
        sys.exit('Could not start Chrome. Install Google Chrome, or run: python -m playwright install chromium')
    page = browser.new_page(viewport={'width': 1500, 'height': 900})
    errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto(APP.as_uri())
    page.wait_for_function('typeof renderFrame === "function"')
    # load the handwriting fonts (needs internet; falls back to a system font offline)
    ok = page.evaluate("""async () => { const fams = ['Patrick Hand', 'Caveat', 'Kalam', 'Poppins'];
        const t = new Promise(r => setTimeout(() => r(false), 10000));
        const l = Promise.all(fams.map(f => document.fonts.load(`40px "${f}"`, 'Ab'))).then(r => r.every(x => x.length > 0));
        return Promise.race([l, t]); }""")
    if not ok:
        log('WARNING: handwriting fonts did not load (no internet?) — a fallback font is used.')
    return browser, page, errors


# ----------------------------------------------------------------------------- build
def build(folder: Path) -> Path:
    from playwright.sync_api import sync_playwright
    script = (folder / 'script.txt').read_text(encoding='utf-8')
    story = (folder / 'storyboard.js').read_text(encoding='utf-8')
    cfg = json.loads((folder / 'video.json').read_text()) if (folder / 'video.json').exists() else {}
    assets = load_assets(folder)
    log(f'building {folder.name}: {len(assets["svg"])} svg, {len(assets["images"])} pictures')
    with sync_playwright() as p:
        browser, page, errors = open_app(p)
        page.add_script_tag(content=ENGINE.read_text())
        res = page.evaluate("""([script, assets, cfg, story]) => {
              const fn = new Function('api', 'with (api) {\\n' + story + '\\n}');
              const r = ScribeStoryboard(script, assets, cfg, fn);
              r.project = JSON.stringify(P, (k, v) => k === '_info' ? undefined : v);
              return r; }""", [script, assets, cfg, story])
        out = folder / 'project.scribe.json'
        out.write_text(res.pop('project'))
        # preview sheet: every scene at the moment it is fully drawn
        page.set_input_files('#fileOpen', str(out)); page.wait_for_timeout(800)
        page.evaluate('preloadAll()'); page.wait_for_timeout(800)
        vertical = cfg.get('aspect') == '9:16'
        shots = page.evaluate("""(v) => { const W = v ? 360 : 640, H = v ? 640 : 360; const c = document.createElement('canvas'); c.width = W; c.height = H;
              const x = c.getContext('2d'); const s = schedule(); const out = [];
              for (let sc = 0; sc < s.scenes; sc++) { const its = s.items.filter(i => i.scene === sc); renderFrame(x, {x: 0, y: 0, w: W, h: H}, its[its.length - 1].end - 0.15, s); out.push(c.toDataURL('image/png')); }
              return out; }""", vertical)
        browser.close()
    make_sheet(shots, folder / 'preview.png', vertical)
    lines = [f"{folder.name}: {res['elements']} elements, {res['scenes']} scenes, {res['total']:.1f}s (script ends {res['end']:.1f}s)"]
    if res['missing']:
        lines.append('STILL NEEDED: ' + '; '.join(res['missing']))
    lines += ['WARNING: ' + w for w in res['warnings']]
    if errors:
        lines += ['PAGE ERROR: ' + e for e in errors]
    lines.append('\n  cue    start  drift  element')
    lines += [f"{r['cue']:6.1f} {r['start']:6.1f} {r['drift']:+6.1f}  {r['label']}" for r in res['report']]
    (folder / 'report.txt').write_text('\n'.join(lines) + '\n')
    print('\n'.join(lines[:3 + len(res['warnings'])]))
    big = [r for r in res['report'] if r['drift'] > 2]
    if big:
        log(f'{len(big)} element(s) start more than 2s after their cue — see report.txt')
    log(f'wrote {out.relative_to(Path.cwd()) if out.is_relative_to(Path.cwd()) else out}, preview.png, report.txt')
    return out


def make_sheet(urls, path: Path, vertical: bool):
    from PIL import Image, ImageDraw
    ims = [Image.open(io.BytesIO(base64.b64decode(u.split(',')[1]))).convert('RGB') for u in urls]
    if not ims:
        return
    w, h = ims[0].size; cols = 7 if vertical else 4; pad = 6
    sheet = Image.new('RGB', (cols * (w + pad), ((len(ims) + cols - 1) // cols) * (h + pad)), '#333')
    for i, im in enumerate(ims):
        d = ImageDraw.Draw(im, 'RGBA')
        if vertical:  # shade where Instagram/Shorts UI sits
            d.rectangle([0, 0, w, h * 0.11], fill=(239, 68, 68, 45)); d.rectangle([0, h * 0.78, w, h], fill=(239, 68, 68, 45)); d.rectangle([w * 0.86, h * 0.45, w, h * 0.78], fill=(239, 68, 68, 45))
        d.text((6, 4), str(i + 1), fill=(220, 38, 38))
        sheet.paste(im, ((i % cols) * (w + pad), (i // cols) * (h + pad)))
    sheet.save(path)


# ----------------------------------------------------------------------------- render
def render(folder: Path, project: Path, out: Path, res: int, fps: int):
    from playwright.sync_api import sync_playwright
    out.parent.mkdir(parents=True, exist_ok=True)
    silent = out.with_suffix('.silent.mp4')
    with sync_playwright() as p:
        browser, page, errors = open_app(p)
        page.set_input_files('#fileOpen', str(project)); page.wait_for_timeout(800)
        page.evaluate('preloadAll()'); page.wait_for_timeout(800)
        info = page.evaluate("""async ([res, fps]) => { const [aw, ah] = ASPECTS[P.aspect]; const k = res / Math.min(aw, ah);
              const W = Math.round(aw * k / 2) * 2, H = Math.round(ah * k / 2) * 2;
              const ok = !!(window.VideoEncoder && await pickAvc(W, H, fps, 8e6));
              return { W, H, ok, total: schedule().total }; }""", [res, fps])
        log(f"rendering {info['W']}x{info['H']} @ {fps}fps, {info['total']:.1f}s, engine: {'WebCodecs H.264' if info['ok'] else 'frames → ffmpeg'}")
        t0 = time.time()
        if info['ok']:
            b64 = page.evaluate("""async ([W, H, fps, res]) => { const blob = await exportFramePerfect(W, H, fps, res);
                  const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; const CH = 0x8000;
                  for (let i = 0; i < buf.length; i += CH) s += String.fromCharCode.apply(null, buf.subarray(i, i + CH));
                  return btoa(s); }""", [info['W'], info['H'], fps, res])
            silent.write_bytes(base64.b64decode(b64))
        else:
            render_frames_ffmpeg(page, info, fps, silent)
        browser.close()
    log(f'video rendered in {time.time() - t0:.0f}s')
    mix_audio(folder, silent, out, info['total'])
    log(f'done: {out}')


def render_frames_ffmpeg(page, info, fps, dest: Path):
    """Fallback when the browser has no H.264 encoder: stream JPEG frames into ffmpeg."""
    n = int(info['total'] * fps) + fps // 2
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(fps), '-i', '-',
                           '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', str(dest)], stdin=subprocess.PIPE)
    page.evaluate("""([W, H]) => { window.__cv = document.createElement('canvas'); __cv.width = W; __cv.height = H; window.__cx = __cv.getContext('2d', {alpha: false}); window.__sch = schedule(); }""", [info['W'], info['H']])
    for i in range(0, n, 15):
        frames = page.evaluate("""([a, b, fps]) => { const out = []; for (let i = a; i < b; i++) { renderFrame(__cx, {x: 0, y: 0, w: __cv.width, h: __cv.height}, Math.min(i / fps, __sch.total), __sch); out.push(__cv.toDataURL('image/jpeg', 0.92).split(',')[1]); } return out; }""", [i, min(n, i + 15), fps])
        for f in frames:
            ff.stdin.write(base64.b64decode(f))
        if i % (fps * 10) == 0:
            log(f'  frame {i}/{n}')
    ff.stdin.close(); ff.wait()


def find_audio(folder: Path, stem: str):
    for ext in AUDIO_EXT:
        f = folder / (stem + ext)
        if f.exists():
            return f
    return None


def mix_audio(folder: Path, silent: Path, out: Path, total: float):
    cfg = json.loads((folder / 'video.json').read_text()) if (folder / 'video.json').exists() else {}
    voice, music = find_audio(folder, 'voiceover'), find_audio(folder, 'music')
    if not voice and not music:
        shutil.move(silent, out); return
    if not shutil.which('ffmpeg'):
        log('WARNING: ffmpeg not found — saving the video without audio'); shutil.move(silent, out); return
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-i', str(silent)]
    filters, labels, idx = [], [], 1
    if voice:
        cmd += ['-i', str(voice)]; filters.append(f"[{idx}:a]volume={cfg.get('voiceVolume', 1.0)}[v]"); labels.append('[v]'); idx += 1
    if music:
        cmd += ['-stream_loop', '-1', '-i', str(music)]
        filters.append(f"[{idx}:a]volume={cfg.get('musicVolume', 0.15)},afade=t=out:st={max(0, total - 2):.2f}:d=2[m]"); labels.append('[m]')
    mix = f"{''.join(labels)}amix=inputs={len(labels)}:duration=longest:normalize=0[a]" if len(labels) > 1 else f"{labels[0]}anull[a]"
    cmd += ['-filter_complex', ';'.join(filters + [mix]), '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
            '-t', f'{total + 0.5:.2f}', '-movflags', '+faststart', str(out)]
    subprocess.run(cmd, check=True)
    silent.unlink(missing_ok=True)
    log('mixed in ' + ' + '.join(x.name for x in (voice, music) if x))


# ----------------------------------------------------------------------------- cli
def changed_folders():
    try:
        base = os.environ.get('BASE_SHA', '')
        if not base or set(base) == {'0'} or subprocess.run(['git', 'cat-file', '-e', base + '^{commit}'], capture_output=True).returncode:
            base = 'HEAD~1'   # first push of a branch, or base not available
        names = subprocess.run(['git', 'diff', '--name-only', base, 'HEAD'], capture_output=True, text=True, check=True).stdout.split()
    except Exception:
        return []
    found = []
    for n in names:
        parts = Path(n).parts
        if len(parts) >= 2 and parts[0] == 'videos' and (ROOT / 'videos' / parts[1] / 'storyboard.js').exists() and parts[1] not in found:
            found.append(parts[1])
    return [ROOT / 'videos' / f for f in found]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('command', choices=['build', 'render', 'make'])
    ap.add_argument('folder', nargs='?', help='video folder, e.g. videos/my-video')
    ap.add_argument('--changed', action='store_true', help='process video folders changed since BASE_SHA (default: the last commit)')
    ap.add_argument('--res', type=int, help='1080 (default), 720 or 1440')
    ap.add_argument('--fps', type=int, help='30 (default)')
    ap.add_argument('--out', help='output MP4 path (default out/<folder>.mp4)')
    a = ap.parse_args()
    folders = changed_folders() if a.changed else ([Path(a.folder).resolve()] if a.folder else [])
    if not folders:
        print('No video folders to process.'); return
    for folder in folders:
        cfg = json.loads((folder / 'video.json').read_text()) if (folder / 'video.json').exists() else {}
        res, fps = a.res or cfg.get('res', 1080), a.fps or cfg.get('fps', 30)
        out = Path(a.out).resolve() if a.out else ROOT / 'out' / (folder.name + '.mp4')
        project = folder / 'project.scribe.json'
        if a.command in ('build', 'make') and (folder / 'storyboard.js').exists():
            project = build(folder)
        if a.command in ('render', 'make'):
            if not project.exists():
                sys.exit(f'{project} not found — run build first')
            render(folder, project, out, res, fps)


if __name__ == '__main__':
    main()
