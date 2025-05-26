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

}); 