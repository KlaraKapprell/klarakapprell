/* ============================================
   WORKS – Grid-Slider & Filter-System
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const slider = document.getElementById('grid-slider');
  const grid   = document.getElementById('project-grid');
  
  // Filter Elemente
  const filterTrigger = document.getElementById('filter-trigger');
  const filterMenu    = document.getElementById('filter-menu');
  const filterBtns    = document.querySelectorAll('.filter-btn');
  const projectCards  = document.querySelectorAll('.project-card');

  if (slider && grid) {

    const isMobile = () => window.innerWidth <= 768;

    const updateGrid = (value) => {
      grid.setAttribute('data-step', value);
    };

    const setupSliderLimits = () => {
      const currentValue = parseInt(slider.value, 10);
      
      if (isMobile()) {
        slider.max = "2";
        if (currentValue > 2) {
          slider.value = "1";
        }
      } else {
        slider.max = "4";
      }
      updateGrid(slider.value);
    };

    // Initiales Setup Slider
    setupSliderLimits();
    
    const saved = localStorage.getItem('grid-step');
    if (saved) {
      if (isMobile() && parseInt(saved, 10) > 2) {
        slider.value = "1";
      } else {
        slider.value = saved;
      }
      updateGrid(slider.value);
    }

    slider.addEventListener('input', () => {
      updateGrid(slider.value);
      localStorage.setItem('grid-step', slider.value);
    });

    window.addEventListener('resize', setupSliderLimits);
  }

  // ============================================
  // FILTER LOGIK
  // ============================================
  if (filterTrigger && filterMenu) {
    
    // Drop-Up Menü öffnen / schließen
    filterTrigger.addEventListener('click', (e) => {
      e.stopPropagation(); // Verhindert sofortiges Schließen durch den Document-Click
      filterMenu.classList.toggle('is-open');
      filterTrigger.textContent = filterMenu.classList.contains('is-open') ? 'Filter ↓' : 'Filter ↑';
    });

    // Menü schließen, wenn man irgendwo anders hinklickt
    document.addEventListener('click', () => {
      filterMenu.classList.remove('is-open');
      filterTrigger.textContent = 'Filter ↑';
    });

    // Filter-Logik für die Buttons
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation(); // Menü offen halten beim Klicken der Optionen
        
        // Aktiven Zustand der Buttons wechseln
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filterValue = btn.getAttribute('data-filter');

        // Text des Hauptbuttons anpassen (zeigt gewählten Filter an)
        filterTrigger.textContent = filterValue === 'all' ? 'Filter ↑' : `${btn.textContent} ↑`;
        filterMenu.classList.remove('is-open'); // Nach Auswahl schließen

        // Karten filtern
        projectCards.forEach(card => {
          if (filterValue === 'all') {
            card.classList.remove('is-hidden');
          } else {
            // 1. Holt den String (z.B. "editorial, text")
            const rawTags = card.getAttribute('data-tags') || '';
            
            // 2. Teilt am Komma UND entfernt automatisch alle überflüssigen Leerzeichen (trim)
            const cardTags = rawTags.split(',').map(tag => tag.trim());
            
            // 3. Prüft, ob das gesuchte Tag im Array existiert
            if (cardTags.includes(filterValue)) {
              card.classList.remove('is-hidden');
            } else {
              card.classList.add('is-hidden');
            }
          }
        });
      });
    });
  }
});