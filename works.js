// Hilfsfunktion: sicher abspielen + Fehler loggen
async function safePlay(video) {
  try {
    // Laufzeit-Properties setzen – wichtig für iOS
    video.muted = true;
    video.playsInline = true;                 // JS-Property
    video.setAttribute('playsinline', '');    // HTML-Attr
    video.setAttribute('webkit-playsinline', '');
    video.autoplay = true;

    // Falls nötig, decodieren anstoßen
    if (video.readyState < 2) video.load();

    // kurzer Reflow/Delay, damit Sichtbarkeit “greift”
    await new Promise(r => setTimeout(r, 50));

    await video.play();
    return true;
  } catch (err) {
    console.warn('Video play() blockiert:', err && err.name, err && err.message);
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const projectFrames = document.querySelectorAll(".project-frame");
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints;

  if (!isTouchDevice) {
    // Desktop unverändert …
    projectFrames.forEach(frame => {
      const image = frame.querySelector(".project-image");
      const video = frame.querySelector(".project-video");
      frame.addEventListener("mouseenter", () => {
        image.style.opacity = "0";
        video.style.opacity = "1";
        safePlay(video);
      });
      frame.addEventListener("mouseleave", () => {
        video.pause();
        video.currentTime = 0;
        video.style.opacity = "0";
        image.style.opacity = "1";
      });
    });
    return;
  }

  // —— Mobile: IntersectionObserver ——
  // etwas toleranter als 1.0 (100%), damit zuverlässig triggert
  const observerOptions = { root: null, rootMargin: "0px", threshold: 0.6 };

  // Einmaliges “Unlock” nach erstem User-Tap (hilft bei Low-Power/Data-Saver)
  let unlocked = false;
  const unlock = async () => {
    if (unlocked) return;
    unlocked = true;
    const videos = document.querySelectorAll(".project-video");
    for (const v of videos) {
      v.muted = true;
      v.playsInline = true;
      v.setAttribute('playsinline', '');
      v.setAttribute('webkit-playsinline', '');
      v.autoplay = true;
      try {
        // kurzes Play/Pause “primt” iOS
        await v.play();
        v.pause();
        v.currentTime = 0;
      } catch (_) {}
    }
  };
  window.addEventListener('touchstart', unlock, { once: true });

  const observer = new IntersectionObserver(async (entries) => {
    for (const entry of entries) {
      const frame = entry.target;
      const image = frame.querySelector(".project-image");
      const video = frame.querySelector(".project-video");

      if (entry.isIntersecting) {
        frame.classList.add("active");
        image.style.opacity = "0";
        video.style.opacity = "1";
        const ok = await safePlay(video);
        // Fallback: falls Autoplay dennoch blockiert, beim nächsten Tap versuchen
        if (!ok) {
          const onTouch = async () => {
            await safePlay(video);
            frame.removeEventListener('touchstart', onTouch);
          };
          frame.addEventListener('touchstart', onTouch, { once: true });
        }
      } else {
        frame.classList.remove("active");
        video.pause();
        video.currentTime = 0;
        video.style.opacity = "0";
        image.style.opacity = "1";
      }
    }
  }, observerOptions);

  projectFrames.forEach(frame => observer.observe(frame));
});
