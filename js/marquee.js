(() => {
  const SPEED = 70;

  document.querySelectorAll('.marquee').forEach((pill) => {
    const track  = pill.querySelector('.marquee__track');
    const source = track && track.querySelector('.marquee__text');
    if (!track || !source) return;

    // --- Build the track ---
    const build = () => {
      track.replaceChildren(source);
      const textWidth = source.getBoundingClientRect().width;
      if (!textWidth) return;

      const perHalf = Math.ceil(pill.clientWidth / textWidth) + 1;
      const missing = perHalf * 2 - 1;
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < missing; i++) {
        const clone = source.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        fragment.appendChild(clone);
      }
      track.appendChild(fragment);

      track.style.setProperty('--duration', (perHalf * textWidth) / SPEED + 's');
    };

    build();

    // --- Recompute ---
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);

    let timer;
    window.addEventListener('resize', () => {
      clearTimeout(timer);
      timer = setTimeout(build, 150);
    });
  });
})();
