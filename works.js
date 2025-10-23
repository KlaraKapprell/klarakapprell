// works.js
document.addEventListener("DOMContentLoaded", () => {
  const projectFrames = document.querySelectorAll(".project-frame");
  const projectImages = document.querySelectorAll(".project-image");
  const isTouchDevice =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0;

  // --- Utilities -------------------------------------------------------------

  function setVideoAttrs(video) {
    // Laufzeit-Properties + kompatible Attribute (wichtig für iOS)
    video.muted = true;
    video.playsInline = true; // JS-Property
    video.autoplay = true;

    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("autoplay", "");
    // preload bleibt wie im HTML (auto empfohlen)
  }

  function setPosterFromImage(video, imageEl) {
    // Nutze das bestehende Grid-Image als Poster (verhindert schwarzes Frame/Overlay)
    if (!video.getAttribute("poster") && imageEl) {
      const src = imageEl.currentSrc || imageEl.src;
      if (src) video.setAttribute("poster", src);
    }
  }

  // Sicheres Abspielen mit kleinem Reflow-Delay und Fehlerbehandlung
  async function safePlay(video) {
    try {
      setVideoAttrs(video);

      // Falls noch nicht ausreichend geladen, initialisieren
      if (video.readyState < 2) {
        // metadata/first frame
        video.load();
      }

      // Reflow/Frame abwarten, damit Sichtbarkeit (opacity) "greift"
      await new Promise((r) => setTimeout(r, 50));

      const playResult = video.play();
      // play() kann ein Promise zurückgeben – abwarten
      if (playResult && typeof playResult.then === "function") {
        await playResult;
      }
      return true;
    } catch (err) {
      // z.B. NotAllowedError bei geblocktem Autoplay
      // console.warn("Video play() blockiert:", err && err.name, err && err.message);
      return false;
    }
  }

  function showVideo(frame, image, video) {
    // Sichtbarkeit ausschließlich über opacity steuern (nicht display)
    image.style.opacity = "0";
    video.style.opacity = "1";
    frame.classList.add("active");
  }

  function hideVideo(frame, image, video) {
    frame.classList.remove("active");
    video.pause();
    video.currentTime = 0;
    video.style.opacity = "0";
    image.style.opacity = "1";
  }

  // Einmaliger "Unlock" nach erstem User-Touch: primt Autoplay in strengen Modi
  let unlocked = false;
  const unlock = async () => {
    if (unlocked) return;
    unlocked = true;
    const videos = document.querySelectorAll(".project-video");
    for (const v of videos) {
      try {
        setVideoAttrs(v);
        // Mini-Prime: kurz play/pause, um Policy zu "entsperren"
        await v.play();
        v.pause();
        v.currentTime = 0;
      } catch (_) {
        // ignorieren – einige Browser erlauben das Prime ohne User-Geste nicht
      }
    }
  };
  if (isTouchDevice) {
    window.addEventListener("touchstart", unlock, { once: true, passive: true });
  }

  // --- Desktop: Hover-Verhalten ---------------------------------------------

  if (!isTouchDevice) {
    projectFrames.forEach((frame) => {
      const image = frame.querySelector(".project-image");
      const video = frame.querySelector(".project-video");
      if (!video || !image) return;

      setVideoAttrs(video);
      setPosterFromImage(video, image);

      frame.addEventListener("mouseenter", async () => {
        // Erst einblenden, wenn playing-Event kommt → verhindert Overlay
        const onPlaying = () => {
          showVideo(frame, image, video);
          video.removeEventListener("playing", onPlaying);
        };
        video.addEventListener("playing", onPlaying);

        const ok = await safePlay(video);
        if (!ok) {
          // Fallback: trotzdem einblenden – evtl. bleibt Poster sichtbar
          showVideo(frame, image, video);
        }
      });

      frame.addEventListener("mouseleave", () => {
        hideVideo(frame, image, video);
      });
    });

    // Portrait-Erkennung wie bisher
    projectImages.forEach((img) => {
      img.onload = () => {
        if (img.naturalHeight > img.naturalWidth) {
          img.classList.add("portrait");
        }
      };
    });

    return; // Desktop fertig
  }

  // --- Mobile: Scroll-basierte Aktivierung (IntersectionObserver) -----------

  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.6, // toleranter als 1.0, damit verlässlich triggert
  };

  const observer = new IntersectionObserver(async (entries) => {
    for (const entry of entries) {
      const frame = entry.target;
      const image = frame.querySelector(".project-image");
      const video = frame.querySelector(".project-video");
      if (!video || !image) continue;

      setVideoAttrs(video);
      setPosterFromImage(video, image);

      if (entry.isIntersecting) {
        // Erst NACH "playing" einblenden → kein Play-Overlay sichtbar
        const onPlaying = () => {
          showVideo(frame, image, video);
          video.removeEventListener("playing", onPlaying);
        };
        video.addEventListener("playing", onPlaying);

        const ok = await safePlay(video);

        if (!ok) {
          // Fallback: Beim Tap auf den Frame erneut versuchen
          const onTap = async () => {
            const played = await safePlay(video);
            if (played) {
              // Bei Erfolg sofort zeigen, falls playing schon gefeuert hat
              showVideo(frame, image, video);
            }
            frame.removeEventListener("touchstart", onTap);
          };
          frame.addEventListener("touchstart", onTap, { once: true, passive: true });
        }
      } else {
        hideVideo(frame, image, video);
      }
    }
  }, observerOptions);

  projectFrames.forEach((frame) => observer.observe(frame));

  // Portrait-Erkennung wie bisher
  projectImages.forEach((img) => {
    img.onload = () => {
      if (img.naturalHeight > img.naturalWidth) {
        img.classList.add("portrait");
      }
    };
  });
});
