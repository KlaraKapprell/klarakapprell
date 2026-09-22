// --- Carousel to start ---

(() => {
  const rail = document.querySelector(".project-images--desktop");
  if (!rail) return;

  const toStart = () => {
    const behaviour = rail.style.scrollBehavior;
    rail.style.scrollBehavior = "auto";
    rail.scrollLeft = 0;
    rail.style.scrollBehavior = behaviour;
  };

  toStart();

  window.addEventListener("load", () => {
    toStart();
    requestAnimationFrame(toStart);
  });
})();
