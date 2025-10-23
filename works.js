// einmaliger „Unlock“ beim ersten Touch (hilft, wenn Autoplay geblockt ist)
let unlocked = false;
const unlock = async () => {
  if (unlocked) return;
  unlocked = true;
  document.querySelectorAll('.project-video').forEach(async v => {
    v.muted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    try { await v.play(); v.pause(); v.currentTime = 0; } catch(_) {}
  });
};
window.addEventListener('touchstart', unlock, { once:true });

// Hilfsfunktion: sicher abspielen
async function safePlay(video){
  try{
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline','');
    video.setAttribute('webkit-playsinline','');
    if (video.readyState < 2) video.load();
    await new Promise(r => setTimeout(r, 50)); // Reflow
    await video.play();
    return true;
  }catch(e){ return false; }
}

document.addEventListener("DOMContentLoaded", () => {
    const projectFrames = document.querySelectorAll(".project-frame");
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints;

    if (isTouchDevice){
    // Beobachter etwas toleranter als 100%
    const observer = new IntersectionObserver(async (entries) => {
      for (const entry of entries){
        const frame = entry.target;
        const image = frame.querySelector(".project-image");
        const video = frame.querySelector(".project-video");

        // Poster = Bild, verhindert schwarzes Frame + Overlay
        if (!video.getAttribute('poster')) {
          video.setAttribute('poster', image.currentSrc || image.src);
        }

        // Sichtbarkeit nur über opacity steuern
        if (entry.isIntersecting){
          frame.classList.add("active");

          // Erst einblenden, wenn es WIRKLICH spielt
          const onPlaying = () => {
            video.style.opacity = "1";
            image.style.opacity = "0";
            video.removeEventListener('playing', onPlaying);
          };
          video.addEventListener('playing', onPlaying);

          const ok = await safePlay(video);
          if (!ok){
            // Fallback: beim ersten Tap auf den Frame starten
            const onTap = async () => {
              await safePlay(video);
              frame.removeEventListener('touchstart', onTap);
            };
            frame.addEventListener('touchstart', onTap, { once:true });
          }
        } else {
          frame.classList.remove("active");
          video.pause();
          video.currentTime = 0;
          video.style.opacity = "0";
          image.style.opacity = "1";
        }
      }
    }, { threshold: 0.6 });

    projectFrames.forEach(f => observer.observe(f));
  }

    const projectImages = document.querySelectorAll(".project-image");

    projectImages.forEach(img => {
        img.onload = () => {
            if (img.naturalHeight > img.naturalWidth) {
                img.classList.add("portrait");
            }
        };
    });
});
