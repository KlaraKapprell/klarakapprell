/* ============================================
   NAV – Hamburger-Menü
   Gilt für alle Seiten
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  
  // --- 1. Hamburger-Menü Logik ---
  const navToggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("nav");
  const closeBtn = document.getElementById("close");
  const navLogo = document.getElementById("nav-logo"); 
  const langBtn = document.getElementById("lang-toggle");

  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.classList.toggle("open");
    nav.classList.toggle("active", isOpen);
    console.log('clicked');
    navLogo.classList.toggle("invisible", isOpen);
    if (langBtn) langBtn.classList.toggle("is-hidden", isOpen);
  });

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      navToggle.classList.remove("open");
      nav.classList.remove("active");
      navLogo.classList.remove("invisible"); 
      if (langBtn) langBtn.classList.remove("is-hidden");
    });
  }
  
});