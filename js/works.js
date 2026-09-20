/* ============================================
   WORKS – Raster, Slider und Filter
   Am Rechner bekommt jede Karte ihren Platz ausgerechnet: mit Lücken
   daneben und Versatz nach unten, statt dicht gepackt.
   Die beiden Muster unten bestimmen den Rhythmus.
   Auf dem Handy gilt das nicht – dort laufen die Karten untereinander.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // Leere Spalten VOR einer Karte (0 = direkt anschließen)
  const LUECKE  = [0, 1, 0, 1, 1, 0, 1, 0];
  // Zusätzlicher Versatz nach unten, in Zellen
  const VERSATZ = [0, 1, 0, 0, 1, 0, 1, 1];

  const SPALTEN = { 1: 10, 2: 8, 3: 6, 4: 5 };

  const slider = document.getElementById('grid-slider');
  const grid   = document.getElementById('project-grid');
  const filterTrigger = document.getElementById('filter-trigger');
  const filterMenu    = document.getElementById('filter-menu');
  const filterBtns    = document.querySelectorAll('.filter-btn');
  const cards         = [...document.querySelectorAll('.project-card')];

  const isMobile = () => window.innerWidth <= 768;

  // --- Platzierung ---
  const verteilen = () => {
    if (!grid) return;

    // Mobil: kein Raster. Die Karten laufen untereinander und jede zweite
    // rueckt nach rechts – das Aussehen macht works.css.
    if (isMobile()) {
      let sichtbar = 0;
      cards.forEach((card) => {
        card.style.gridColumn = '';
        card.style.gridRow = '';
        if (card.classList.contains('is-hidden')) {
          card.classList.remove('is-right');
          return;
        }
        card.classList.toggle('is-right', sichtbar % 2 === 1);
        sichtbar++;
      });
      return;
    }

    cards.forEach((card) => card.classList.remove('is-right'));

    const stufe = grid.getAttribute('data-step') || '3';
    const spalten = SPALTEN[stufe] || 6;

    // Höhenprofil: wie weit ist jede Spalte schon belegt
    const profil = new Array(spalten).fill(0);
    let cursor = 0;
    let i = 0;

    cards.forEach((card) => {
      if (card.classList.contains('is-hidden')) {
        card.style.gridColumn = '';
        card.style.gridRow = '';
        return;
      }

      const hoch = card.classList.contains('is-portrait');
      const b = hoch ? 2 : 3;   // Breite in Spalten
      const h = hoch ? 3 : 2;   // Höhe in Zeilen

      // Startspalte: hinter der vorigen Karte, plus die Lücke aus dem Muster
      let start = cursor + LUECKE[i % LUECKE.length];
      if (start + b > spalten) start = LUECKE[i % LUECKE.length] ? 1 : 0;
      if (start + b > spalten) start = 0;

      // Oberkante: unter allem, was in diesen Spalten schon liegt
      let oben = 0;
      for (let c = start; c < start + b; c++) oben = Math.max(oben, profil[c]);
      oben += VERSATZ[i % VERSATZ.length];

      for (let c = start; c < start + b; c++) profil[c] = oben + h;

      card.style.gridColumn = (start + 1) + ' / span ' + b;
      card.style.gridRow    = (oben + 1) + ' / span ' + h;

      cursor = start + b;
      if (cursor + 2 > spalten) cursor = 0;   // kein Platz mehr, neu ansetzen
      i++;
    });
  };

  // --- Slider ---
  if (slider && grid) {
    const grenzenSetzen = () => {
      const wert = parseInt(slider.value, 10);
      if (isMobile()) {
        slider.max = '2';
        if (wert > 2) slider.value = '1';
      } else {
        slider.max = '4';
      }
      grid.setAttribute('data-step', slider.value);
      verteilen();
    };

    grenzenSetzen();

    const gespeichert = localStorage.getItem('grid-step');
    if (gespeichert) {
      slider.value = (isMobile() && parseInt(gespeichert, 10) > 2) ? '1' : gespeichert;
      grid.setAttribute('data-step', slider.value);
      verteilen();
    }

    slider.addEventListener('input', () => {
      grid.setAttribute('data-step', slider.value);
      localStorage.setItem('grid-step', slider.value);
      verteilen();
    });

    window.addEventListener('resize', grenzenSetzen);
  }

  // --- Filter ---
  if (filterTrigger && filterMenu) {
    filterTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      filterMenu.classList.toggle('is-open');
      filterTrigger.textContent = filterMenu.classList.contains('is-open') ? 'Filter ↓' : 'Filter ↑';
    });

    document.addEventListener('click', () => {
      filterMenu.classList.remove('is-open');
      filterTrigger.textContent = 'Filter ↑';
    });

    filterBtns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const wert = btn.getAttribute('data-filter');
        filterTrigger.textContent = wert === 'all' ? 'Filter ↑' : `${btn.textContent} ↑`;
        filterMenu.classList.remove('is-open');

        cards.forEach((card) => {
          const tags = (card.getAttribute('data-tags') || '').split(',').map((t) => t.trim());
          card.classList.toggle('is-hidden', wert !== 'all' && !tags.includes(wert));
        });

        verteilen();   // nach dem Filtern neu anordnen
      });
    });
  }
});
