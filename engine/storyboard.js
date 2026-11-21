/*  Wisdom Scribe — storyboard engine
    Runs inside the Wisdom Scribe app page (scribe.py loads it there).
    A video's storyboard.js calls the helpers below; every element is tied to a CUE:
    a phrase from the script, so it is drawn at the moment that phrase is spoken.

    Script format (script.txt): one line per section, starting with its start time:
        0:00 Google's Gemini Notebook now lets your child study ...
        0:14 Gemini Notebook is Google's study app ...
    [emotion tags] in square brackets are ignored.
*/
window.ScribeStoryboard = function (SCRIPT, ASSETS, CONFIG, STORY) {
  CONFIG = Object.assign({ title: 'Untitled', aspect: '16:9', progressBar: false, hand: 'woman', font: 'Patrick Hand', end: null }, CONFIG || {});
  const segs = SCRIPT.split('\n').map(l => l.trim()).filter(l => /^\d+:\d\d\s/.test(l)).map(l => {
    const m = l.match(/^(\d+):(\d\d)\s+(.*)$/); return { start: +m[1] * 60 + +m[2], text: m[3].replace(/\[[^\]]*\]\s*/g, '').trim() };
  });
  if (!segs.length) throw new Error('script.txt needs lines that start with a time, like "0:14 Gemini Notebook is..."');
  segs.forEach((s, i) => s.end = i < segs.length - 1 ? segs[i + 1].start : (CONFIG.end || s.start + Math.max(4, s.text.split(/\s+/).length / 2.5)));
  const cueTime = (seg, phrase) => {
    if (typeof phrase === 'number') return phrase;
    const s = segs[seg]; if (!s) throw new Error(`section ${seg} does not exist (script has ${segs.length})`);
    const i = s.text.toLowerCase().indexOf(String(phrase).toLowerCase());
    if (i < 0) throw new Error(`cue not found in section ${seg}: "${phrase}"`);
    return s.start + (i / s.text.length) * (s.end - s.start);
  };

  const C = { NAVY: '#1f2937', BLUE: '#2563eb', PURPLE: '#7c3aed', ORANGE: '#ea8a00', RED: '#e11d48', GREEN: '#059669', TEAL: '#0f766e', YELLOW: '#fde047' };
  const FONT = CONFIG.font;
  P = blankProject();
  P.title = CONFIG.title; P.aspect = CONFIG.aspect; const [ow, oh] = ASPECTS[CONFIG.aspect]; P.board.w = ow * 2; P.board.h = oh * 2;
  P.progressBar = !!CONFIG.progressBar; P.defaults.font = FONT; P.defaults.color = C.NAVY; P.hand.style = CONFIG.hand;
  if (CONFIG.paper) { P.board.paper = CONFIG.paper; if (PAPERS[CONFIG.paper]) P.board.bg = PAPERS[CONFIG.paper]; }
  const W = P.board.w, H = P.board.h;

  const E = [], missing = [];
  const anim = (o, d) => Object.assign({ scene: !!o.scene, camera: o.camera || (o.scene ? 'board' : 'hold'), zoom: o.zoom || 1.6 }, d,
    o.enter ? { enter: o.enter } : {}, o.from ? { from: o.from } : {}, o.fromDir ? { fromDir: o.fromDir } : {}, o.emph ? { emph: o.emph } : {},
    o.sceneTrans ? { sceneTrans: o.sceneTrans } : {}, o.dur ? { dur: o.dur, autoDur: false } : {}, o.cam ? { camera: 'custom', cam: o.cam } : {});
  const push = (seg, cue, o, make) => E.push({ seg, cue, o: o || {}, make });
  const box = (title, sub, w, h) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect x="8" y="8" width="${w - 16}" height="${h - 16}" rx="30" fill="#fff7ed" stroke="#fb923c" stroke-width="10" stroke-dasharray="44 26"/><text x="${w / 2}" y="${h / 2 - h * 0.03}" font-family="Arial, sans-serif" font-size="${Math.round(Math.min(h * 0.085, w * 0.06))}" font-weight="700" fill="#c2410c" text-anchor="middle">${title}</text><text x="${w / 2}" y="${h / 2 + h * 0.09}" font-family="Arial, sans-serif" font-size="${Math.round(Math.min(h * 0.055, w * 0.04))}" fill="#64748b" text-anchor="middle">${sub}</text></svg>`;
  const img = key => { const A = ASSETS.images[key]; if (!A) throw new Error(`image "${key}" not found in assets/ (have: ${Object.keys(ASSETS.images).join(', ') || 'none'})`); return A; };
  const svg = key => { const A = ASSETS.svg[key]; if (!A) throw new Error(`svg "${key}" not found in assets/ (have: ${Object.keys(ASSETS.svg).join(', ') || 'none'})`); return A; };
  const lineIcon = icon => /^(arrow|underline|swoosh|circle|sync|nosign|cross|highlight)/.test(icon);

  /* ---------------- helpers available in storyboard.js ---------------- */
  // Handwritten text centred on (cx, cy).
  const T = (seg, cue, text, cx, cy, size, o = {}) => push(seg, cue, o, () => makeText({ text, cx, cy, size, font: o.font || FONT, color: o.color || C.NAVY, bold: !!o.bold, align: o.align || 'center',
    anim: anim(o, { dur: +clamp(text.replace(/\s/g, '').length * 0.06, 0.5, 2.6).toFixed(2), autoDur: false }) }));
  // Built-in icon (badge style by default; arrows/doodles are plain lines).
  const I = (seg, cue, icon, x, y, s, o = {}) => push(seg, cue, o, () => makeIcon(icon, { x, y, w: s, h: o.h || s, rot: o.rot || 0, color: o.color || C.NAVY,
    iconStyle: o.style || (lineIcon(icon) ? 'line' : 'badge'), strokeWidth: o.sw || (lineIcon(icon) ? 2.2 : 1.9), stretch: !!o.h,
    anim: anim(o, { autoDur: false, dur: 0.85 }) }));
  // SVG illustration from assets/ (traced line by line). Height follows the SVG's shape.
  const SV = (seg, cue, key, x, y, w, o = {}) => push(seg, cue, o, () => { const A = svg(key); P.assets['svg_' + key] = { kind: 'svg', name: key + '.svg', data: cleanSvg(A.data) };
    const el = { id: uid(), type: 'svg', assetId: 'svg_' + key, x, y, w, h: Math.round(w / A.aspect), rot: 0, opacity: 1 }; el.anim = defAnim(anim(o, { enter: 'draw', dur: 2.0, autoDur: false })); return el; });
  // Picture from assets/ (logo, photo). Pass a width, or width = null and { h } for a height; the other side follows the picture's own shape.
  const placeImg = (key, x, y, w, o, defaults) => { const A = img(key); P.assets['img_' + key] = { kind: 'image', name: A.name, data: A.data };
    if (w == null) w = Math.round(o.h * A.w / A.h); const el = { id: uid(), type: 'image', assetId: 'img_' + key, x, y, w, h: Math.round(w * A.h / A.w), rot: 0, opacity: 1, frame: o.frame === undefined ? defaults.frame : o.frame };
    el.anim = defAnim(anim(o, { enter: defaults.enter, dur: defaults.dur, autoDur: false })); return el; };
  const IMG = (seg, cue, key, x, y, w, o = {}) => push(seg, cue, o, () => placeImg(key, x, y, w, o, { frame: null, enter: 'draw', dur: 1.2 }));
  // App screenshot: same as IMG but on a rounded card with a shadow, and it slides in. Never cropped or stretched.
  const SHOT = (seg, cue, key, x, y, w, o = {}) => push(seg, cue, o, () => placeImg(key, x, y, w, o, { frame: 'card', enter: 'slide', dur: 0.8 }));
  // Hand-drawn circle around a box in a picture's OWN pixel coordinates (picture placed at X,Y with width W).
  const HL = (seg, cue, key, X, Y, Wd, ix1, iy1, ix2, iy2, o = {}) => push(seg, cue, o, () => { const k = Wd / img(key).w; const rx = X + ix1 * k, ry = Y + iy1 * k, rw = (ix2 - ix1) * k, rh = (iy2 - iy1) * k;
    const w = rw / 0.85 * 1.12, h = rh / 0.67 * 1.18; return makeIcon('circle', { x: Math.round(rx + rw / 2 - w / 2), y: Math.round(ry + rh / 2 - h / 2), w: Math.round(w), h: Math.round(h), color: o.color || C.RED, iconStyle: 'line', stretch: true,
      strokeWidth: +(15 / Math.sqrt((w / 24) * (h / 24))).toFixed(3), anim: anim(o, { autoDur: false, dur: 0.5 }) }); });
  // Tapping finger whose fingertip lands on a point in the picture's own pixels.
  const TAP = (seg, cue, key, X, Y, Wd, ix, iy, s, o = {}) => push(seg, cue, o, () => { const k = Wd / img(key).w; const tx = X + ix * k, ty = Y + iy * k;
    return makeIcon('pointer', { x: Math.round(tx - s * 10.5 / 24), y: Math.round(ty - s * 4.2 / 24), w: s, h: s, color: o.color || C.NAVY, iconStyle: 'duotone', tint: '#fde68a', strokeWidth: 1.7,
      anim: anim(o, { autoDur: false, dur: 0.4, enter: 'pop', emph: 'beat' }) }); });
  // Yellow highlighter swipe over text.
  const HI = (seg, cue, x, y, w, h, o = {}) => push(seg, cue, o, () => { const el = makeIcon('highlight', { x, y, w, h, color: o.color || C.YELLOW, iconStyle: 'line', stretch: true, useFill: true, fill: o.color || C.YELLOW, strokeWidth: 0.01,
    anim: anim(o, { autoDur: false, dur: 0.5, enter: 'wipe' }) }); el.blend = 'multiply'; return el; });
  // Placeholder box for artwork that has not arrived yet (orange dashed box; listed in the report).
  const NEED = (seg, cue, label, x, y, w, h, o = {}) => { missing.push(label); push(seg, cue, o, () => { const id = 'need_' + missing.length; P.assets[id] = { kind: 'svg', name: 'NEEDED — ' + label, data: box('NEEDED', label, w, h) };
    const el = { id: uid(), type: 'svg', assetId: id, x, y, w, h, rot: 0, opacity: 1 }; el.anim = defAnim(anim(o, { enter: 'draw', dur: 1.2, autoDur: false })); return el; }); };
  // Editor-only note that keeps the board empty (e.g. where a recorded clip will go). Hidden in the export.
  const GUIDE = (seg, cue, text, o = {}) => push(seg, cue, Object.assign({ scene: true }, o), () => { const el = makeText({ text, font: 'Poppins', size: 110, color: '#64748b', cx: W / 2, cy: H / 2, anim: anim(Object.assign({ scene: true }, o), { enter: 'instant' }) }); el.guide = true; return el; });

  STORY({ T, I, SV, IMG, SHOT, HL, TAP, HI, NEED, GUIDE, C, W, H, FONT, segs });

  /* ---------------- timing: draw each element when its cue phrase is spoken ---------------- */
  const END = segs[segs.length - 1].end;
  const items = E.map(e => ({ el: e.make(), target: cueTime(e.seg, e.cue) }));
  items.sort((a, b) => a.target - b.target);
  for (let i = 1; i < items.length; i++) if (items[i].target < items[i - 1].target + 0.4) items[i].target = items[i - 1].target + 0.4;
  let prevDe = 0; const report = [];
  items.forEach((it, i) => {
    const a = it.el.anim;
    if (i === 0) { a.trans = 0; it.ds = 0; }
    else {
      const prev = items[i - 1]; let tr = a.scene ? 1.0 : (a.camera === 'hold' ? 0 : 0.8);
      const minGap = a.scene ? 1.0 : 0.05;            // a scene change always leaves a second to read
      let gap = it.target - tr - prevDe;
      if (gap < minGap) { tr = Math.max(a.scene ? 0.6 : 0, it.target - prevDe - minGap); gap = it.target - tr - prevDe; }
      if (gap < minGap) { const need = minGap - gap; const pa = prev.el.anim; const nd = Math.max(0.35, pa.dur - need); prevDe -= (pa.dur - nd); pa.dur = +nd.toFixed(2); gap = it.target - tr - prevDe; }
      if (gap < minGap) gap = minGap;                  // drift a little past the cue rather than cut reading time
      prev.el.anim.pause = +gap.toFixed(2); a.trans = +tr.toFixed(2); it.ds = prevDe + gap + tr;
    }
    prevDe = it.ds + (a.enter === 'instant' ? 0 : a.dur);
    const label = it.el.type === 'text' ? it.el.text.split('\n')[0] : it.el.type === 'icon' ? '[' + it.el.icon + ']' : '[' + P.assets[it.el.assetId].name + ']';
    report.push({ cue: +it.target.toFixed(2), start: +it.ds.toFixed(2), drift: +(it.ds - it.target).toFixed(2), label });
  });
  items[items.length - 1].el.anim.pause = +Math.max(2, END - prevDe + 1.5).toFixed(2);
  P.elements = items.map(i => i.el);
  const sch = schedule();

  /* ---------------- checks ---------------- */
  const warnings = [];
  if (P.aspect === '9:16') sch.items.forEach(it => { const e = it.el, a = e.anim; if (e.guide || a.camera === 'custom') return; const cam = sch.cams[it.i];
    if (Math.abs(cam.w - Math.max(W, H * aspectRatio())) > 1) return;   // only checks full-board shots
    const lbl = (e.text || e.icon || (P.assets[e.assetId] || {}).name || '').split('\n')[0];
    if (e.y < H * 0.11) warnings.push(`under the top bar: ${lbl}`);
    if (e.y + e.h > H * 0.78 && e.type === 'text') warnings.push(`under the caption area: ${lbl}`);
    if (e.x + e.w > W * 0.86 && e.y + e.h > H * 0.45 && e.y < H * 0.78 && e.type === 'text') warnings.push(`under the like/share buttons: ${lbl}`); });
  sch.items.forEach((it, i) => { if (it.el.anim.scene && i > 0 && sch.items[i - 1].el.anim.pause < 0.9) warnings.push('short reading time before scene at ' + fmtT(it.t0)); });
  return { total: sch.total, scenes: sch.scenes, elements: P.elements.length, end: END, report, warnings, missing };
};
