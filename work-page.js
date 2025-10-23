// NEW: robustes Autoplay + Lazy-Source + Fallback
document.addEventListener("DOMContentLoaded", () => {
  const videos = document.querySelectorAll(".project-video");

  // NEW: Quelle erst setzen, wenn wirklich gebraucht
  function attachSource(video) {
    if (video.dataset.srcAttached) return;
    const srcEl = video.querySelector("source");
    if (srcEl && srcEl.dataset.src) {
      srcEl.src = srcEl.dataset.src;      // CHANGED: von data-src auf src
      video.load();                       // NEW: Browser lädt Metadaten/Daten
      video.dataset.srcAttached = "1";
    }
  }

  // NEW: Autoplay versuchen, sonst Controls einblenden
  function tryPlay(video) {
    // Sicherheitshalber: Attribut + Property setzen
    video.muted = true;                              // NEW
    video.setAttribute("muted", "");                 // NEW
    video.setAttribute("playsinline", "");           // NEW

    return video.play().catch(() => {
      video.setAttribute("controls", "");            // NEW: Fallback
    });
  }

  // NEW: Beobachter für Sichtbarkeit
  const threshold = 0.5; // mind. 50% sichtbar
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio >= threshold) {
          attachSource(video);
          tryPlay(video);
        } else {
          video.pause();
        }
      });
    }, { root: null, rootMargin: "0px", threshold });

    videos.forEach((v) => {
      io.observe(v);
    });
  } else {
    // NEW: Fallback ohne IO (sehr alte Browser)
    videos.forEach((v) => {
      attachSource(v);
      v.setAttribute("controls", "");
    });
  }
});
