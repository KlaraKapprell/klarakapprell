document.addEventListener("DOMContentLoaded", function () {
  const cvTrigger = document.getElementById("cv-trigger");

  // --- DOWNLOAD CV PDF ---
  cvTrigger.addEventListener("click", function () {
    const cvUrl = "media/KlaraKapprell_Portfolio.pdf";
    const link = document.createElement("a");
    link.href = cvUrl;
    link.download = "Klara-Kapprell_Portfolio.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // --- HOVER LOGIK mit zufälliger Zeit ---
  let spawnActive = false;

  function spawnImage() {
    if (!spawnActive) return;

    const img = document.createElement("img");
    img.src = "media/favicon.png";
    img.style.position = "fixed";
    img.style.width = "clamp(150px, 10vw, 200px)";
    img.style.height = "clamp(150px, 10vw, 200px)";
    img.style.pointerEvents = "none";
    img.style.zIndex = "1000";

    const x = Math.random() * (window.innerWidth - 50);
    const y = Math.random() * (window.innerHeight - 50);
    img.style.left = `${x}px`;
    img.style.top = `${y}px`;

    document.body.appendChild(img);

    const randomDelay = 100 + Math.random() * 400; // 100–500 ms
    setTimeout(spawnImage, randomDelay);
  }

  cvTrigger.addEventListener("mouseenter", function () {
    spawnActive = true;
    spawnImage();
  });

  cvTrigger.addEventListener("mouseleave", function () {
    spawnActive = false;

    const images = document.querySelectorAll('img[src="media/favicon.png"]');
    images.forEach(img => img.remove());
  });
});
