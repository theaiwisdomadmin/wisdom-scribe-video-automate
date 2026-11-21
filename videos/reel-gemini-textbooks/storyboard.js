// Storyboard for the "Gemini Notebook textbooks" reel (9:16, 62 s).
// Every line ties an element to a CUE — a phrase from script.txt — so it is drawn when that phrase is spoken.
// T(section, cue, text, cx, cy, size, opts)    I(section, cue, icon, x, y, size, opts)
// SV(section, cue, svgName, x, y, width, opts)  IMG / SHOT(section, cue, pictureName, x, y, width, opts)
// HL / TAP(section, cue, picture, X, Y, W, ...pixels in that picture)   HI(section, cue, x, y, w, h)
// Board is 2160 x 3840 for 9:16 (3840 x 2160 for 16:9). Sections count from 0 in script.txt.

/* ===== 0:00 HOOK — logo, real textbook, FREE ===== */
IMG(0, "Google's Gemini", 'gemini-icon', 780, 470, 600, { scene: true, enter: 'zoom', emph: 'beat', dur: 0.6 });
IMG(0, 'Notebook now', 'gemini-notebook', 330, 1170, 1500, { enter: 'wipe', dur: 0.7 });
I(0, 'study from a real', 'openbook', 260, 1520, 560, { color: C.PURPLE, enter: 'pop' });
T(0, 'a real textbook', 'a REAL\ntextbook', 1380, 1800, 190);
I(0, 'for free', 'gift', 260, 2230, 500, { color: C.GREEN, enter: 'drop', dur: 0.7 });
T(0, 'for free', '100% FREE!', 1250, 2480, 185, { color: C.GREEN, enter: 'pop', emph: 'wiggle', dur: 0.5 });
/* ===== 0:05 PROMISE — 60 seconds: chapter → quiz → back to the page ===== */
I(0, 'In the next', 'clock', 780, 470, 600, { scene: true, sceneTrans: 'zoom', color: C.ORANGE, enter: 'pop', emph: 'beat' });
T(0, 'sixty seconds', '60 seconds', 1080, 1260, 210, { enter: 'pop', dur: 0.5 });
I(0, "tonight's chapter", 'openbook', 260, 1520, 520, { color: C.PURPLE, enter: 'pop' });
T(0, "tonight's chapter", "Tonight's\nchapter", 520, 2170, 110);
I(0, 'into a quiz', 'arrowright', 860, 1600, 380, { color: C.RED });
I(0, 'a quiz that', 'clipboard', 1360, 1520, 520, { color: C.BLUE, enter: 'pop' });
T(0, 'a quiz that', 'Quiz', 1620, 2170, 110);
I(0, 'points back', 'arrowloop', 860, 2240, 440, { color: C.RED, emph: 'beat' });
T(0, 'back to the page', '...that points back\nto the page!', 1080, 2800, 130, { color: C.PURPLE });

/* ===== 0:14 WHAT IT IS ===== */
IMG(1, 'Gemini Notebook is', 'gemini-icon', 780, 620, 600, { scene: true, sceneTrans: 'push', enter: 'zoom', emph: 'pulse', dur: 0.7 });
T(1, "Google's study app", "Google's\nstudy app", 1080, 1700, 200);
I(1, "Google's study app", 'sparkle', 260, 600, 320, { color: C.BLUE, enter: 'pop', emph: 'float', dur: 0.4 });
I(1, 'It now has', 'sparkle', 1560, 1220, 320, { color: C.PURPLE, enter: 'pop', emph: 'float', dur: 0.4 });
/* ===== 0:18 HUNDREDS OF FREE TEXTBOOKS + S CHAND ===== */
SHOT(1, 'hundreds of free', 'books', 130, 560, 1900, { scene: true, sceneTrans: 'slideUp', enter: 'zoom', dur: 0.7 });
T(1, 'free textbooks', 'Hundreds of\nFREE textbooks', 1080, 1950, 170);
HI(1, 'free textbooks', 520, 1965, 420, 165);
T(1, 'including books', "incl. books from India's", 1080, 2420, 105);
SHOT(1, "India's S Chand", 'schand', 760, 2540, 640, { enter: 'zoom', frame: null, dur: 0.6, emph: 'pulse' });
/* ===== 0:23 THE BEST PART — every answer links to the page ===== */
T(1, 'And the best part', 'The BEST part', 1080, 560, 200, { scene: true, sceneTrans: 'zoom', color: C.PURPLE, emph: 'pulse' });
I(1, 'every answer', 'chats', 260, 880, 480, { color: C.BLUE, enter: 'pop' });
T(1, 'every answer', 'Every answer...', 1300, 1120, 125);
I(1, 'from the book itself', 'openbook', 260, 1480, 480, { color: C.PURPLE, enter: 'pop' });
T(1, 'from the book itself', '...comes from\nthe book', 1300, 1720, 125);
I(1, 'with a link', 'link', 260, 2080, 480, { color: C.RED, enter: 'pop', emph: 'beat' });
T(1, 'the part it came from', '+ a link to the\nexact part!', 1300, 2320, 125, { color: C.RED });

/* ===== 0:30 HOW TO — 5 steps ===== */
T(2, "here's how you can use it", "Here's how", 1080, 1300, 260, { scene: true, sceneTrans: 'wipe', color: C.PURPLE });
T(2, 'you can use it', '5 quick steps', 1080, 1850, 150, { color: C.GREEN, enter: 'pop', emph: 'pulse' });
I(2, 'you can use it', 'pointer', 1500, 2150, 360, { color: C.ORANGE, enter: 'pop', emph: 'float', dur: 0.4 });
// STEP 1
T(2, 'Let your child read', 'STEP 1', 1080, 560, 150, { scene: true, sceneTrans: 'push', color: C.ORANGE, enter: 'pop', dur: 0.4 });
SV(2, 'read the chapter first', 'kid-studied', 230, 780, 1700, { dur: 1.4 });
T(2, 'chapter first', 'Read the\nchapter first', 1080, 2450, 160);
// STEP 2 — Sources panel (942x1894)
T(2, 'Then open Gemini', 'STEP 2', 1080, 560, 150, { scene: true, sceneTrans: 'push', color: C.ORANGE, enter: 'pop', dur: 0.4 });
SHOT(2, 'open Gemini Notebook', 'addsrc', 605, 700, 950);
HL(2, 'tap Add sources', 'addsrc', 605, 700, 950, 45, 432, 435, 503, { cam: { cx: 900, cy: 1280, w: 1300 } });
TAP(2, 'tap Add sources', 'addsrc', 605, 700, 950, 405, 488, 300, { color: C.NAVY });
T(2, 'add sources, choose', 'Tap "Add sources"', 1080, 1760, 105, { color: C.BLUE });
// STEP 3 — Add sources dialog (1550x1148), then Select textbooks (2186x1452) slides in on top
T(2, 'choose Textbooks', 'STEP 3', 1080, 560, 150, { scene: true, sceneTrans: 'push', color: C.ORANGE, enter: 'pop', dur: 0.4 });
SHOT(2, 'choose Textbooks', 'textbooks', 200, 700, 1720);
HL(2, 'and add a book', 'textbooks', 200, 700, 1720, 500, 573, 755, 650, { cam: { cx: 1000, cy: 1300, w: 1400 } });
TAP(2, 'and add a book', 'textbooks', 200, 700, 1720, 640, 625, 360);
SHOT(2, 'for that subject', 'select', 200, 1300, 1720, { enter: 'fly', fromDir: 'bottom', dur: 0.6 });
HL(2, 'Type:', 'select', 200, 1300, 1720, 83, 190, 1040, 260, { color: C.ORANGE });
T(2, 'Type:', 'Textbooks → add the book', 1080, 2700, 110, { color: C.BLUE, camera: 'board' });
// STEP 4 — typing (1492x376), then the quiz it makes (1306x1776)
T(2, 'quiz me on', 'STEP 4', 1080, 560, 150, { scene: true, sceneTrans: 'push', color: C.ORANGE, enter: 'pop', dur: 0.4 });
SHOT(2, 'quiz me on photosynthesis', 'typing', 130, 720, 1900, { enter: 'wipe', dur: 0.6 });
HL(2, 'photosynthesis', 'typing', 130, 720, 1900, 215, 210, 640, 280, { color: C.GREEN });
I(2, 'photosynthesis', 'leaf', 1700, 470, 300, { color: C.GREEN, enter: 'pop', emph: 'float', dur: 0.4 });
SHOT(2, 'or whatever the chapter', 'quizq', 420, 1340, 1180, { enter: 'fly', fromDir: 'bottom', dur: 0.6 });
// STEP 5
T(2, 'Your child answers', 'STEP 5', 1080, 560, 150, { scene: true, sceneTrans: 'push', color: C.ORANGE, enter: 'pop', dur: 0.4 });
SV(2, 'answers on paper', 'student-notes', 180, 900, 1800, { dur: 1.0 });
T(2, 'on paper', 'Answer on paper', 1080, 2350, 160);
// WRONG → CITATION → RE-READ
I(2, 'For every wrong', 'cross', 230, 470, 380, { scene: true, sceneTrans: 'slideUp', color: C.RED, enter: 'pop', emph: 'wiggle', sw: 2.4 });
T(2, 'wrong answer', 'Wrong answer?', 1220, 670, 150, { color: C.RED });
SHOT(2, 'tap the citation', 'sources', 160, 900, 1800);
HL(2, 'tap the citation', 'sources', 160, 900, 1800, 75, 858, 608, 920, { cam: { cx: 900, cy: 1800, w: 1650 } });
TAP(2, 'and re-read', 'sources', 160, 900, 1800, 420, 905, 340);
SHOT(2, 're-read that part', 'bookpage', 700, 1240, 900, { enter: 'fly', fromDir: 'right', dur: 0.6 });
T(2, 'part of the book', 'Re-read the page!', 1150, 2530, 110, { color: C.GREEN, enter: 'pop', dur: 0.4 });

/* ===== 0:54 CTA — save + send ===== */
I(3, 'Save this', 'bookmark', 780, 520, 600, { scene: true, sceneTrans: 'zoom', color: C.PURPLE, enter: 'drop', emph: 'beat', dur: 0.6 });
T(3, 'Save this', 'SAVE this', 1080, 1450, 240, { enter: 'pop', dur: 0.5 });
T(3, 'next unit test', 'for the next\nunit test', 1080, 1980, 140);
I(3, 'next unit test', 'clipboard', 1540, 2280, 320, { color: C.BLUE, enter: 'pop', dur: 0.4 });
I(3, 'And send it', 'send', 230, 470, 420, { scene: true, sceneTrans: 'push', color: C.BLUE, enter: 'fly', from: { dx: -900, dy: 400, rot: -20 }, dur: 0.6 });
T(3, 'one parent', 'Send it to\none parent', 1260, 680, 140);
SV(3, 'one parent', 'share', 180, 1000, 1000, { dur: 1.0 });
SV(3, 'who worries', 'worried-parent', 1180, 1420, 680, { dur: 0.9 });
T(3, 'where AI answers', 'who worries where\nAI answers come from', 1080, 2640, 115, { color: C.PURPLE });

