/* ============================================
   STARTSEITE
   1. Die Formen treiben langsam umher, lassen sich
      greifen, ziehen und werfen.
   2. Der Name reagiert auf die Formen: wo eine Form
      ihn berührt, wird die Schrift leichter.
   ============================================ */

(() => {
  const stage = document.getElementById("start-stage");
  const name  = document.getElementById("typo-name");
  if (!stage || !name) return;

  // --- Schrift ---
  const WEIGHT_REST = 500;    // Ruhezustand
  const WEIGHT_NEAR = 300;    // wo eine Form den Namen berührt
  const LIFT        = 0.025;  // Anhebung in em
  const HALO        = 0.4;    // wie weit die Wirkung einer Form reicht,
                              // Vielfaches der Schriftgröße
  // Breite wird im breiteren der beiden Schnitte festgeschrieben
  const WEIGHT_WIDEST = Math.max(WEIGHT_REST, WEIGHT_NEAR);

  // --- Formen ---
  const FRICTION   = 0.94;  // Abbremsen nach dem Wurf
  const BOUNCE     = 0.6;   // Rückprall an den Rändern
  const DRIFT_BACK = 0.02;  // wie schnell ein Wurf ins Treiben zurückfindet
  const DRAG_LIMIT = 6;     // ab hier gilt es als Ziehen

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let letters = [];
  let pointer = { x: null, y: null };
  let stageAt = { x: 0, y: 0 };
  let held = null;
  let top = 1;

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  // ============================================
  // SCHRIFT
  // ============================================

  const build = () => {
    letters = [];
    name.querySelectorAll(".typo-line").forEach((line) => {
      const word = line.dataset.word || "";
      line.textContent = "";
      [...word].forEach((char) => {
        const span = document.createElement("span");
        span.className = "typo-letter";
        span.textContent = char;
        line.appendChild(span);
        letters.push({ el: span, w: 0, cx: 0, cy: 0 });
      });
    });
  };

  // Breite im fettesten Schnitt messen und in em festschreiben
  const lockWidths = () => {
    const size = parseFloat(getComputedStyle(name).fontSize);
    letters.forEach((l) => {
      l.el.style.width = "auto";
      l.el.style.fontWeight = WEIGHT_WIDEST;
    });
    letters.forEach((l) => { l.w = l.el.getBoundingClientRect().width / size; });
    letters.forEach((l) => {
      l.el.style.width = l.w + "em";
      l.el.style.fontWeight = WEIGHT_REST;
    });
  };

  // Schriftgröße so setzen, dass die längste Zeile genau passt
  const fitName = () => {
    const lines = [...name.querySelectorAll(".typo-line")];
    let widest = 0;
    lines.forEach((line) => {
      let sum = 0;
      line.querySelectorAll(".typo-letter").forEach((el) => {
        sum += parseFloat(el.style.width) || 0;
      });
      widest = Math.max(widest, sum);
    });
    if (!widest) return;

    const byWidth  = stage.clientWidth / widest;
    const byHeight = (stage.clientHeight * 0.72) / (lines.length * 0.82);
    name.style.fontSize = Math.max(24, Math.min(byWidth, byHeight)) + "px";
    measureStage();
    measureLetters();
  };

  const measureStage = () => {
    const r = stage.getBoundingClientRect();
    stageAt.x = r.left;
    stageAt.y = r.top;
  };

  // Mittelpunkte merken – spart das Messen in jedem Frame
  const measureLetters = () => {
    letters.forEach((l) => {
      const r = l.el.getBoundingClientRect();
      l.cx = r.left + r.width / 2;
      l.cy = r.top + r.height / 2;
    });
  };

  // Die Schrift reagiert nicht auf den Zeiger, sondern auf die Formen:
  // Wo eine Form den Namen berührt, wird die Schrift leichter.
  const drawLetters = () => {
    const size = parseFloat(getComputedStyle(name).fontSize);
    const halo = size * HALO;

    letters.forEach((l) => {
      let strength = 0;

      for (const it of items) {
        if (!it.w) continue;   // auf dem Handy ausgeblendet
        // Abstand vom Buchstabenmittelpunkt zum Rechteck der Form:
        // 0, solange er darin liegt, danach in Pixeln nach außen
        const dx = Math.max(0, Math.abs(l.cx - (stageAt.x + it.x + it.w / 2)) - it.w / 2);
        const dy = Math.max(0, Math.abs(l.cy - (stageAt.y + it.y + it.h / 2)) - it.h / 2);
        const d  = Math.sqrt(dx * dx + dy * dy);
        const s  = 1 - d / halo;
        if (s > strength) strength = s;
        if (strength >= 1) break;
      }

      strength = Math.max(0, Math.min(1, strength));
      l.el.style.fontWeight = Math.round(WEIGHT_REST + (WEIGHT_NEAR - WEIGHT_REST) * strength);
      l.el.style.transform = "translateY(" + (-LIFT * strength).toFixed(3) + "em)";
    });
  };

  // ============================================
  // FORMEN
  // ============================================

  const items = [...stage.querySelectorAll(".shape")].map((el) => {
    if (el.dataset.size) el.style.setProperty("--s", el.dataset.size);
    const drift = reduced ? 0 : parseFloat(el.dataset.float || 0);
    const angle = Math.random() * Math.PI * 2;
    return {
      el, x: 0, y: 0, rot: 0,
      vx: 0, vy: 0, vr: 0,
      dx: Math.cos(angle) * drift,
      dy: Math.sin(angle) * drift,
      drift,
      w: 0, h: 0, dragged: false
    };
  });

  const eyes = [...stage.querySelectorAll(".shape--eyes .eye i")];

  // offsetWidth statt getBoundingClientRect: die Formen sind gedreht,
  // das Rechteck drumherum wäre dadurch größer als die Form selbst.
  const measureShapes = () => {
    items.forEach((it) => {
      it.w = it.el.offsetWidth;
      it.h = it.el.offsetHeight;
    });
  };

  // Nach vorn holen, aber unter dem Namen bleiben (z-index 50).
  // Wird der Stapel zu hoch, einmal neu durchnummerieren.
  const bringToFront = (it) => {
    if (top >= 40) {
      [...items]
        .sort((a, b) => (parseInt(a.el.style.zIndex, 10) || 0) - (parseInt(b.el.style.zIndex, 10) || 0))
        .forEach((s, i) => { s.el.style.zIndex = i + 1; });
      top = items.length;
    }
    it.el.style.zIndex = ++top;
  };

  const drawShape = (it) => {
    it.el.style.transform =
      "translate(" + it.x.toFixed(1) + "px," + it.y.toFixed(1) + "px) rotate(" + it.rot.toFixed(1) + "deg)" +
      (it === held ? " scale(1.08)" : "");
  };

  // Verstreuen über ein Raster: jede Form bekommt ihre eigene Zelle und
  // darin etwas Zufall. So verteilen sie sich gleichmäßig über die Bühne,
  // statt sich an einer Stelle zu sammeln.
  const scatter = () => {
    measureShapes();
    const W = stage.clientWidth;
    const H = stage.clientHeight;
    // Ausgeblendete Formen bekommen keine Zelle
    const live = items.filter((it) => it.w > 0 && it.h > 0);
    const n = live.length;
    if (!n) return;

    // Rasterform aus dem Seitenverhältnis der Bühne ableiten
    const rows  = Math.max(1, Math.min(n, Math.round(Math.sqrt(n * H / Math.max(W, 1)))));
    const cols  = Math.ceil(n / rows);
    const cells = rows * cols;
    const cw = W / cols;
    const ch = H / rows;

    // Zuordnung mischen, damit große und kleine Formen sich abwechseln
    const order = live.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    order.forEach((idx, k) => {
      const it = live[idx];
      // Bei mehr Zellen als Formen die Lücken gleichmäßig verteilen
      const cell = Math.floor(k * cells / n);
      const col = cell % cols;
      const row = Math.floor(cell / cols);

      const jx = (Math.random() - 0.5) * Math.max(0, cw - it.w);
      const jy = (Math.random() - 0.5) * Math.max(0, ch - it.h);

      it.x = clamp(col * cw + (cw - it.w) / 2 + jx, 0, Math.max(0, W - it.w));
      it.y = clamp(row * ch + (ch - it.h) / 2 + jy, 0, Math.max(0, H - it.h));
      it.rot = (Math.random() - 0.5) * 24;
      bringToFront(it);
      drawShape(it);
    });
  };

  const moveShapes = () => {
    const W = stage.clientWidth;
    const H = stage.clientHeight;

    items.forEach((it) => {
      if (it === held || !it.w) return;

      if (it.drift) {
        // Geworfene Formen finden sanft ins Treiben zurück
        it.vx += (it.dx - it.vx) * DRIFT_BACK;
        it.vy += (it.dy - it.vy) * DRIFT_BACK;
        it.vr *= 0.97;
      } else {
        if (Math.abs(it.vx) < 0.04 && Math.abs(it.vy) < 0.04 && Math.abs(it.vr) < 0.04) return;
        it.vx *= FRICTION;
        it.vy *= FRICTION;
        it.vr *= FRICTION;
      }

      it.x += it.vx;
      it.y += it.vy;
      it.rot += it.vr;

      if (it.x < 0)        { it.x = 0;        it.vx = Math.abs(it.vx) * BOUNCE; it.dx = Math.abs(it.dx); }
      if (it.x > W - it.w) { it.x = W - it.w; it.vx = -Math.abs(it.vx) * BOUNCE; it.dx = -Math.abs(it.dx); }
      if (it.y < 0)        { it.y = 0;        it.vy = Math.abs(it.vy) * BOUNCE; it.dy = Math.abs(it.dy); }
      if (it.y > H - it.h) { it.y = H - it.h; it.vy = -Math.abs(it.vy) * BOUNCE; it.dy = -Math.abs(it.dy); }

      drawShape(it);
    });

    // Pupillen schauen zum Zeiger
    if (pointer.x !== null) {
      eyes.forEach((pupil) => {
        const r = pupil.parentElement.getBoundingClientRect();
        const dx = pointer.x - (r.left + r.width / 2);
        const dy = pointer.y - (r.top + r.height / 2);
        const d  = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const reach = r.width * 0.16;
        const k = Math.min(1, d / 220);
        pupil.style.transform = "translate(" + (dx / d * reach * k).toFixed(1) + "px," +
                                               (dy / d * reach * k).toFixed(1) + "px)";
      });
    }
  };

  items.forEach((it) => {
    let grabX = 0, grabY = 0, moved = 0, lastX = 0, lastY = 0;

    it.el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      held = it;
      moved = 0;
      grabX = e.clientX - it.x;
      grabY = e.clientY - it.y;
      lastX = e.clientX;
      lastY = e.clientY;
      it.vx = it.vy = it.vr = 0;
      it.el.setPointerCapture(e.pointerId);
      it.el.classList.add("is-held");
      bringToFront(it);
      drawShape(it);
    });

    it.el.addEventListener("pointermove", (e) => {
      if (held !== it) return;
      it.x = clamp(e.clientX - grabX, 0, Math.max(0, stage.clientWidth - it.w));
      it.y = clamp(e.clientY - grabY, 0, Math.max(0, stage.clientHeight - it.h));
      moved += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
      it.vx = e.clientX - lastX;
      it.vy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      drawShape(it);
    });

    const release = () => {
      if (held !== it) return;
      held = null;
      it.el.classList.remove("is-held");
      if (reduced) it.vx = it.vy = 0;
      it.vr = clamp(it.vx * 0.12, -6, 6);   // Wurf gibt etwas Drall
      it.dragged = moved > DRAG_LIMIT;
      drawShape(it);
    };

    it.el.addEventListener("pointerup", release);
    it.el.addEventListener("pointercancel", release);
    it.el.addEventListener("dragstart", (e) => e.preventDefault());
  });

  // ============================================
  // GEMEINSAM
  // ============================================

  const frame = () => {
    drawLetters();
    moveShapes();
    requestAnimationFrame(frame);
  };

  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
  });

  window.addEventListener("pointerleave", () => { pointer.x = null; });

  window.addEventListener("resize", () => {
    lockWidths();
    fitName();   /* misst Bühne und Buchstaben gleich mit */
    measureShapes();
    items.forEach((it) => {
      it.x = clamp(it.x, 0, Math.max(0, stage.clientWidth - it.w));
      it.y = clamp(it.y, 0, Math.max(0, stage.clientHeight - it.h));
      drawShape(it);
    });
  });

  const start = () => {
    build();
    lockWidths();
    fitName();
    scatter();
    requestAnimationFrame(frame);
  };

  const begin = () => {
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
    else start();
  };

  if (document.readyState === "complete") begin();
  else window.addEventListener("load", begin);
})();
