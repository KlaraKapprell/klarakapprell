// --- Carousel to start ---

(() => {
  const rail = document.querySelector(".project-images--desktop");
  if (!rail) return;

  const HOLD = 2000;

  let holding = true;

  const toStart = () => {
    if (!holding || !rail.scrollLeft) return;
    const behaviour = rail.style.scrollBehavior;
    rail.style.scrollBehavior = "auto";
    rail.scrollLeft = 0;
    rail.style.scrollBehavior = behaviour;
  };

  // --- Release on the first swipe ---

  const release = () => { holding = false; };

  ["pointerdown", "touchstart", "wheel", "keydown"].forEach((name) => {
    rail.addEventListener(name, release, { passive: true, once: true });
  });

  // --- Hold the start until the images have settled ---

  toStart();
  window.addEventListener("load", toStart);
  window.addEventListener("pageshow", toStart);

  rail.querySelectorAll("img").forEach((img) => {
    if (!img.complete) img.addEventListener("load", toStart, { once: true });
  });

  const until = performance.now() + HOLD;
  const keep = () => {
    toStart();
    if (holding && performance.now() < until) requestAnimationFrame(keep);
  };
  requestAnimationFrame(keep);
})();
