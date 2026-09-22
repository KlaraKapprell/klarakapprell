// --- Wordmark ---

(() => {
  const hero     = document.getElementById("hero");
  const wordmark = document.getElementById("wordmark");
  if (!hero || !wordmark) return;

  const SIZE_DESKTOP = 160;
  const FILL_MOBILE  = 0.9;

  const mobile = window.matchMedia("(max-width: 768px)");

  let letters = [];

  // --- Build letters ---

  const buildLetters = () => {
    letters = [];
    wordmark.querySelectorAll(".wordmark__line").forEach((line) => {
      const word = line.dataset.word || "";
      const alt  = (line.dataset.alt || "").split(",");
      line.textContent = "";
      [...word].forEach((char, i) => {
        const span = document.createElement("span");
        span.className = "wordmark__letter";
        if (alt.includes(String(i))) {
          const inner = document.createElement("span");
          inner.className = "wordmark__alt";
          inner.textContent = char;
          span.appendChild(inner);
        } else {
          span.textContent = char;
        }
        line.appendChild(span);
        letters.push({ el: span, w: 0 });
      });
    });
  };

  // --- Widths and size ---

  const lockLetterWidths = () => {
    const size = parseFloat(getComputedStyle(wordmark).fontSize);
    letters.forEach((l) => { l.el.style.width = "auto"; });
    letters.forEach((l) => { l.w = l.el.getBoundingClientRect().width / size; });
    letters.forEach((l) => { l.el.style.width = l.w + "em"; });
  };

  const fitWordmark = () => {
    if (!mobile.matches) {
      wordmark.style.fontSize = SIZE_DESKTOP + "px";
      return;
    }

    const lines  = [...wordmark.querySelectorAll(".wordmark__line")];
    const indent = parseFloat(getComputedStyle(wordmark).getPropertyValue("--indent")) || 0;
    let widest   = 0;
    lines.forEach((line, i) => {
      let sum = i ? indent : 0;
      line.querySelectorAll(".wordmark__letter").forEach((el) => {
        sum += parseFloat(el.style.width) || 0;
      });
      widest = Math.max(widest, sum);
    });
    if (!widest) return;

    const byWidth  = (hero.clientWidth * FILL_MOBILE) / widest;
    const byHeight = (hero.clientHeight * 0.72) / (lines.length * 0.82);
    wordmark.style.fontSize = Math.max(24, Math.min(byWidth, byHeight)) + "px";
  };

  // --- Start ---

  window.addEventListener("resize", () => {
    lockLetterWidths();
    fitWordmark();
  });

  const start = () => {
    buildLetters();
    lockLetterWidths();
    fitWordmark();
  };

  const begin = () => {
    const fonts = document.fonts;
    if (!fonts) return start();
    Promise.all([
      fonts.load("500 1em UncutSans"),
      fonts.load("400 1em Basteleur"),
    ]).then(start, start);
  };

  if (document.readyState === "complete") begin();
  else window.addEventListener("load", begin);
})();

// --- Pixel field ---

document.addEventListener('DOMContentLoaded', () => {

  const fieldBack  = document.getElementById('pixel-field-back');
  const fieldFront = document.getElementById('pixel-field-front');
  if (!fieldBack || !fieldFront) return;
  const field = fieldBack;

  // --- Settings ---
  const CELL_SIZE    = 5;
  const WAKE_RADIUS  = 8;
  const TOUCH_OFFSET = 46;

  const VINE_STEP_MIN = 50;
  const VINE_STEP_MAX = 100;

  const SEED_DENSITY  = 120000;
  const SEED_INTERVAL = 2600;
  const MAX_DORMANT   = 9;

  const SEED_BAND_TOP = 0.9;

  const SEED_GAP = 1;

  let seedFloor = 0;

  const CELL_LIFE  = 45000;
  const CELL_SHARE = 0.22;

  const MAX_VINES    = 16;
  const VINE_RESERVE = 4;
  const VINE_LENGTH  = 320;
  const VINE_WANDER  = 0.55;
  const VINE_UPRIGHT = 0.06;
  const VINE_BRANCH  = 0.03;
  const BLOOM        = 0.012;

  const WAND       = '\u{1FA84}';
  let glyphSize    = 32;
  const WAND_TIP_X = 0.59;
  const WAND_TIP_Y = 0.22;

  const TRAIL_LIFE   = 420;
  const TRAIL_SPREAD = 1;
  const TRAIL_CELLS  = 1;

  const SPARK_RATE     = 140;
  const SPARK_SPREAD   = 2;
  const SPARK_CELLS    = 1;
  const SPARK_OFFSET_X = 2;
  const SPARK_OFFSET_Y = -2;

  // --- Colors and zones ---
  const COLORS = [
    'rgb(254, 118, 254)',
    'rgb(255, 80, 0)',
    'rgb(214, 243, 0)',
    'rgb(0, 223, 115)',
    'rgb(49, 75, 245)',
  ];

  const PINK      = 0;
  const GREEN     = 3;
  const ZONE_SIZE = 450;
  const SPECKLE   = 0.07;

  let zones = [];

  const makeZones = () => {
    const count = Math.max(3, Math.round(cols * rows / ZONE_SIZE));
    zones = [];
    for (let i = 0; i < count; i++) {
      zones.push({
        x: Math.random() * cols,
        y: Math.random() * rows,
        color: Math.floor(Math.random() * COLORS.length),
      });
    }
  };

  const zoneAt = (x, y) => {
    if (!zones.length) return GREEN;
    let best = zones[0], shortest = Infinity;
    for (const z of zones) {
      const d = (z.x - x) * (z.x - x) + (z.y - y) * (z.y - y);
      if (d < shortest) { shortest = d; best = z; }
    }
    return best.color;
  };

  const vineColor = (x, y) => {
    if (Math.random() >= SPECKLE) return GREEN;
    const z = zoneAt(x, y);
    if (z !== GREEN) return z;
    let other = Math.floor(Math.random() * (COLORS.length - 1));
    return other >= GREEN ? other + 1 : other;
  };

  // --- Sprites ---
  const SPRITES = [
    ['-o-',
     'oxo',
     '-o-'],
    ['-x-',
     'xox',
     'xox',
     '-x-'],
    ['oxo',
     '-o-',
     '---'],
    ['-xo',
     'xo-',
     '-xo'],
     ['-x-',
     'xox',
     'o-o'],
     ['-xx',
     'o-x',
     '-o-'],
  ];

  // --- Canvases ---
  const makeCanvas = (parent, id) => {
    const c = document.createElement('canvas');
    c.id = id;
    c.className = 'pixel-canvas';
    parent.appendChild(c);
    return c;
  };

  const canvasBack  = makeCanvas(fieldBack, 'pixel-canvas-back');
  const canvasFront = makeCanvas(fieldFront, 'pixel-canvas-front');
  const ctxBack     = canvasBack.getContext('2d');
  const ctxFront    = canvasFront.getContext('2d');

  const bufferBack  = document.createElement('canvas');
  const bufferFront = document.createElement('canvas');
  const bufCtxBack  = bufferBack.getContext('2d');
  const bufCtxFront = bufferFront.getContext('2d');
  const bufferFor   = (front) => (front ? bufCtxFront : bufCtxBack);

  let dpr  = 1, cellPx = 5;
  let cols = 0, rows = 0;

  // --- State ---
  const grid  = new Map();
  const order = [];
  let oldest  = 0;
  const trail = new Map();
  let vines   = [];
  let seeds   = [];
  const key   = (x, y) => x + ',' + y;

  const paintCell = (c, x, y, color) => {
    c.fillStyle = COLORS[color];
    c.fillRect(x * cellPx, y * cellPx, cellPx, cellPx);
  };

  // --- Noise ---
  const NOISE_STEP = 14;

  let noise = new Float32Array(0), noiseWidth = 0;

  const makeNoise = () => {
    noiseWidth  = Math.ceil(cols / NOISE_STEP) + 2;
    const height   = Math.ceil(rows  / NOISE_STEP) + 2;
    noise = new Float32Array(noiseWidth * height);
    for (let i = 0; i < noise.length; i++) noise[i] = Math.random();
  };

  const smoothstep = (t) => t * t * (3 - 2 * t);

  const densityAt = (x, y) => {
    const gx = x / NOISE_STEP, gy = y / NOISE_STEP;
    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const tx = smoothstep(gx - x0), ty = smoothstep(gy - y0);
    const o  = y0 * noiseWidth + x0;
    const a  = noise[o], b = noise[o + 1];
    const c  = noise[o + noiseWidth], d = noise[o + noiseWidth + 1];
    return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
  };

  // --- Cells ---
  const setCell = (x, y, front) => {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return;
    const k = key(x, y);
    if (grid.has(k)) return;
    const color = vineColor(x, y);
    grid.set(k, { color, front, born: performance.now() });
    order.push(k);
    paintCell(bufferFor(front), x, y, color);
  };

  const expire = (t) => {
    const limit = Math.round(cols * rows * CELL_SHARE);
    let removed = false;
    while (oldest < order.length) {
      const k    = order[oldest];
      const cell = grid.get(k);
      if (cell && t - cell.born < CELL_LIFE && grid.size <= limit) break;
      oldest++;
      if (!cell) continue;
      grid.delete(k);
      const i = k.indexOf(',');
      (cell.front ? bufCtxFront : bufCtxBack).clearRect(+k.slice(0, i) * cellPx, +k.slice(i + 1) * cellPx, cellPx, cellPx);
      removed = true;
    }
    if (oldest > 2000) { order.splice(0, oldest); oldest = 0; }
    return removed;
  };

  // --- Blooms ---
  const placeSprite = (mx, my, front) => {
    const sprite = SPRITES[Math.floor(Math.random() * SPRITES.length)];
    const ox     = mx - (sprite[0].length >> 1);
    const oy     = my - (sprite.length    >> 1);
    for (let y = 0; y < sprite.length; y++) {
      for (let x = 0; x < sprite[y].length; x++) {
        if (sprite[y][x] !== '-') setCell(ox + x, oy + y, front);
      }
    }
  };

  // --- Vines ---
  const addVine = (x, y, angle, urgent, front) => {
    if (vines.length >= MAX_VINES) {
      if (!urgent) return false;
      let longest = 0;
      for (let i = 1; i < vines.length; i++) {
        if (vines[i].steps > vines[longest].steps) longest = i;
      }
      vines.splice(longest, 1);
    }
    vines.push({
      x: x === undefined ? Math.random() * cols : x,
      y: y === undefined ? rows - 1 : y,
      angle: angle === undefined ? -Math.PI / 2 + (Math.random() - 0.5) * 0.7 : angle,
      steps: 0,
      ceiling: 0,
      rate: VINE_STEP_MIN + Math.random() * (VINE_STEP_MAX - VINE_STEP_MIN),
      last: 0,
      front: front === undefined ? Math.random() < 0.5 : front,
    });
    return true;
  };

  const stepVine = (vine) => {
    if (++vine.steps > VINE_LENGTH) return false;

    const target = vine.ceiling === 0 ? -Math.PI / 2 : (vine.ceiling > 0 ? 0 : -Math.PI);

    vine.angle += (Math.random() - 0.5) * VINE_WANDER;
    vine.angle += (target - vine.angle) * VINE_UPRIGHT;

    vine.x += Math.cos(vine.angle);
    vine.y += Math.sin(vine.angle);

    if (vine.y < 1) {
      vine.y = 1;
      if (vine.ceiling === 0) vine.ceiling = Math.cos(vine.angle) >= 0 ? 1 : -1;
    } else if (vine.y > rows - 2) {
      vine.y = rows - 2;
    }
    if (vine.x < 1) {
      vine.x = 1;
      vine.angle = Math.PI - vine.angle;
      if (vine.ceiling !== 0) vine.ceiling = 1;
    } else if (vine.x > cols - 2) {
      vine.x = cols - 2;
      vine.angle = Math.PI - vine.angle;
      if (vine.ceiling !== 0) vine.ceiling = -1;
    }

    const x = Math.round(vine.x), y = Math.round(vine.y);
    setCell(x, y, vine.front);

    if (Math.random() < densityAt(x, y)) {
      const across = vine.angle + Math.PI / 2;
      setCell(Math.round(vine.x + Math.cos(across)), Math.round(vine.y + Math.sin(across)), vine.front);
    }

    if (vines.length < MAX_VINES - VINE_RESERVE && Math.random() < VINE_BRANCH) {
      addVine(vine.x, vine.y, vine.angle + (Math.random() < 0.5 ? 0.75 : -0.75), false, vine.front);
    }
    if (Math.random() < BLOOM) placeSprite(x, y, vine.front);

    return true;
  };

  // --- Seeds ---
  const addSeed = () => {
    const sprite = SPRITES[Math.floor(Math.random() * SPRITES.length)];
    const front  = Math.random() < 0.5;
    const sw     = sprite[0].length, sh = sprite.length;

    for (let attempt = 0; attempt < 40; attempt++) {
      const ox      = 1 + Math.floor(Math.random() * (cols - sw - 2));
      const yLowest = Math.max(0, seedFloor - sh - SEED_GAP);
      const yFrom   = Math.max(0, yLowest - Math.round(rows * (1 - SEED_BAND_TOP)));
      const ySpan   = yLowest - yFrom + 1;
      const oy      = yFrom + Math.floor(Math.random() * ySpan);

      let free = true;
      for (let y = -1; y <= sh && free; y++) {
        for (let x = -1; x <= sw; x++) {
          if (grid.has(key(ox + x, oy + y))) { free = false; break; }
        }
      }
      if (!free) continue;

      const cells = [];
      for (let y = 0; y < sh; y++) {
        for (let x = 0; x < sprite[y].length; x++) {
          if (sprite[y][x] === '-') continue;
          setCell(ox + x, oy + y, front);
          cells.push([ox + x, oy + y]);
        }
      }
      seeds.push({ cells, front, born: performance.now() });
      return true;
    }
    return false;
  };

  // --- Populate ---
  const populate = () => {
    grid.clear();
    order.length = 0;
    oldest = 0;
    vines = [];
    seeds = [];
    makeNoise();
    makeZones();
    const count = Math.max(4, Math.round(cols * cellPx * rows * cellPx / (SEED_DENSITY * dpr * dpr)));
    for (let i = 0; i < count; i++) addSeed();
  };

  // --- Measure ---
  const measure = () => {
    const rect = field.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    cellPx = Math.max(2, Math.round(CELL_SIZE  * dpr));
    const width  = Math.round(rect.width  * dpr);
    const height = Math.round(rect.height * dpr);
    for (const c of [canvasBack, canvasFront, bufferBack, bufferFront]) {
      c.width = width; c.height = height;
      if (c.style) { c.style.width = rect.width + 'px'; c.style.height = rect.height + 'px'; }
    }
    for (const c of [ctxBack, ctxFront, bufCtxBack, bufCtxFront]) c.setTransform(1, 0, 0, 1, 0, 0);
    cols = Math.floor(canvasFront.width  / cellPx);
    rows = Math.floor(canvasFront.height / cellPx);
    glyphSize = parseFloat(getComputedStyle(canvasFront).fontSize) || 32;

    seedFloor = rows;
    const footerEl = document.querySelector('footer');
    if (footerEl) {
      const footerBox = footerEl.getBoundingClientRect();
      if (footerBox.height) {
        seedFloor = Math.min(seedFloor, Math.floor((footerBox.top - rect.top) * dpr / cellPx));
      }
    }

    placeWand();
    populate();
  };

  // --- Draw ---
  const drawBuffers = () => {
    bufCtxBack.clearRect(0, 0, bufferBack.width, bufferBack.height);
    bufCtxFront.clearRect(0, 0, bufferFront.width, bufferFront.height);

    const buckets = [COLORS.map(() => []), COLORS.map(() => [])];
    grid.forEach((cell, k) => { buckets[cell.front ? 1 : 0][cell.color].push(k); });

    buckets.forEach((layerBuckets, layer) => {
      const c = layer ? bufCtxFront : bufCtxBack;
      layerBuckets.forEach((bucket, color) => {
        if (!bucket.length) return;
        c.fillStyle = COLORS[color];
        for (const k of bucket) {
          const i = k.indexOf(',');
          c.fillRect(+k.slice(0, i) * cellPx, +k.slice(i + 1) * cellPx, cellPx, cellPx);
        }
      });
    });
  };

  const render = () => {
    ctxBack.clearRect(0, 0, canvasBack.width, canvasBack.height);
    ctxBack.drawImage(bufferBack, 0, 0);
    ctxFront.clearRect(0, 0, canvasFront.width, canvasFront.height);
    ctxFront.drawImage(bufferFront, 0, 0);
    trail.forEach((mark, k) => {
      const i = k.indexOf(',');
      paintCell(ctxFront, +k.slice(0, i), +k.slice(i + 1), mark.color);
    });

    if (pointerOn) {
      const g = glyphSize * dpr;
      ctxFront.font = g + 'px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
      ctxFront.textAlign = 'left';
      ctxFront.textBaseline = 'top';
      ctxFront.fillText(WAND, pointerX - g * WAND_TIP_X, pointerY - g * WAND_TIP_Y);
    }
  };

  // --- Trail ---
  const scatterTrail = (cx, cy, spread, count, now) => {
    for (let i = 0; i < count; i++) {
      const sx = cx + Math.round((Math.random() * 2 - 1) * spread);
      const sy = cy + Math.round((Math.random() * 2 - 1) * spread);
      if (sx < 0 || sy < 0 || sx >= cols || sy >= rows) continue;
      const k        = key(sx, sy);
      const existing = trail.get(k);
      if (existing) existing.born = now;
      else trail.set(k, { color: PINK, born: now });
    }
  };

  // --- Pointer ---
  let pointerX     = 0, pointerY = 0;
  let pointerOn    = true;
  let needsDraw    = false;
  let pointerMoved = false;

  const WAND_START_X = 0.15 + Math.random() * 0.7;
  const WAND_START_Y = 0.15 + Math.random() * 0.7;
  const placeWand = () => {
    if (pointerMoved) return;
    pointerX = canvasFront.width  * WAND_START_X;
    pointerY = canvasFront.height * WAND_START_Y;
    needsDraw = true;
  };

  const onPointer = (e) => {
    const rect = canvasFront.getBoundingClientRect();
    pointerX = (e.clientX - rect.left) * dpr;
    pointerY = (e.clientY - rect.top)  * dpr;
    if (e.pointerType !== 'mouse') pointerY -= TOUCH_OFFSET * dpr;
    pointerOn = true;
    pointerMoved = true;
    needsDraw = true;

    const cx = Math.floor(pointerX / cellPx), cy = Math.floor(pointerY / cellPx);

    for (let i = seeds.length - 1; i >= 0; i--) {
      const seed = seeds[i];
      if (!seed.cells.some(([x, y]) =>
            Math.abs(x - cx) <= WAKE_RADIUS && Math.abs(y - cy) <= WAKE_RADIUS)) continue;
      let topCell = seed.cells[0];
      for (const z of seed.cells) if (z[1] < topCell[1]) topCell = z;
      addVine(topCell[0], topCell[1], undefined, true, seed.front);
      seeds.splice(i, 1);
      needsDraw = true;
    }

    scatterTrail(cx, cy, TRAIL_SPREAD, TRAIL_CELLS, performance.now());
  };

  window.addEventListener('pointermove', onPointer);
  window.addEventListener('pointerdown', onPointer);

  document.addEventListener('pointerleave', (e) => {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    pointerOn = false;
    needsDraw = true;
  });

  // --- Loop ---
  let lastSeed  = 0;
  let lastSpark = 0;
  const loop = (t) => {
    let changed = false;

    for (let i = vines.length - 1; i >= 0; i--) {
      const vine = vines[i];
      if (t - vine.last < vine.rate) continue;
      vine.last = t;
      if (stepVine(vine)) changed = true;
      else vines.splice(i, 1);
    }

    if (pointerOn && t - lastSpark >= SPARK_RATE) {
      lastSpark = t;
      scatterTrail(Math.floor(pointerX / cellPx) + SPARK_OFFSET_X,
                   Math.floor(pointerY / cellPx) + SPARK_OFFSET_Y,
                   SPARK_SPREAD, SPARK_CELLS, t);
    }

    if (t - lastSeed >= SEED_INTERVAL) {
      lastSeed = t;
      if (seeds.length < MAX_DORMANT && addSeed()) changed = true;
    }

    let gone = expire(t);

    for (let i = seeds.length - 1; i >= 0; i--) {
      if (t - seeds[i].born >= CELL_LIFE) seeds.splice(i, 1);
    }

    trail.forEach((mark, k) => {
      if (t - mark.born >= TRAIL_LIFE) { trail.delete(k); gone = true; }
    });

    if (changed || gone || trail.size || needsDraw) { render(); needsDraw = false; }
    requestAnimationFrame(loop);
  };

  window.addEventListener('resize', () => { measure(); drawBuffers(); render(); });
  measure();
  drawBuffers();
  render();
  requestAnimationFrame(loop);
});
