document.addEventListener("DOMContentLoaded", () => {

  // --- Hamburger-Menü ---
  const navToggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("nav");
  const navLogo = document.getElementById("nav-logo");
  const langBtn = document.getElementById("lang-toggle");
  const mobile  = window.matchMedia("(max-width: 768px)");

  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.classList.toggle("open");
    nav.classList.toggle("active", isOpen);
    navLogo.classList.toggle("invisible", isOpen);
    if (langBtn) langBtn.classList.toggle("is-hidden", isOpen && !mobile.matches);
  });

  mobile.addEventListener("change", () => {
    if (langBtn && mobile.matches) langBtn.classList.remove("is-hidden");
  });

});
