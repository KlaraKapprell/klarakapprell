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

  // --- HOVER LOGIK: PNGs zufällig platzieren ---
  let spawnInterval;
  
  cvTrigger.addEventListener("mouseenter", function () {
    spawnInterval = setInterval(() => {
      const img = document.createElement("img");
      img.src = "media/favicon.png";
      img.style.position = "fixed";
      img.style.width = "32px";
      img.style.height = "32px";
      img.style.pointerEvents = "none"; // Damit sie nicht stören
      img.style.zIndex = "1000";
      
      // Zufällige Position im Viewport
      const x = Math.random() * (window.innerWidth - 32);
      const y = Math.random() * (window.innerHeight - 32);
      img.style.left = `${x}px`;
      img.style.top = `${y}px`;
      
      document.body.appendChild(img);
    }, 300); // alle 300ms ein neues PNG
  });

  cvTrigger.addEventListener("mouseleave", function () {
    clearInterval(spawnInterval);
    
    // Alle hinzugefügten PNGs entfernen
    const images = document.querySelectorAll('img[src="media/favicon.png"]');
    images.forEach(img => img.remove());
  });
});
