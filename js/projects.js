// --- Embedded app ---

(() => {
  const embed = document.getElementById("embed");
  if (!embed) return;

  const frame = document.getElementById("embed-frame");
  const close = document.getElementById("embed-close");

  const open = (src) => {
    frame.src = src;
    embed.hidden = false;
    document.body.style.overflow = "hidden";
  };

  // Focus the app so its keys work, and let Escape close it from inside
  frame.addEventListener("load", () => {
    if (!frame.getAttribute("src")) return;
    try {
      frame.contentWindow.focus();
      frame.contentDocument.addEventListener("keydown", (e) => {
        if (e.key === "Escape") shut();
      });
    } catch (e) {  }
  });

  const shut = () => {
    embed.hidden = true;
    frame.removeAttribute("src");
    document.body.style.overflow = "";
  };

  // Delegated, because lang.js replaces the link when switching language
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-embed]");
    if (!link) return;
    e.preventDefault();
    open(link.href);
  });

  close.addEventListener("click", shut);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !embed.hidden) shut();
  });
})();

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
