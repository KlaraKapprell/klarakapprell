/* ============================================
   LANG – Sprachumschalter DE / EN
   Deutsch steht im HTML, die englische Übersetzung
   in data-en (Inhalt) bzw. data-en-aria-label.
   Gilt für alle Seiten
   ============================================ */

(() => {
  const btn = document.getElementById("lang-toggle");
  if (!btn) return;

  const STORAGE_KEY = "lang";

  const getSaved = () => {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  };

  const save = (lang) => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* Storage blockiert */ }
  };

  // Deutschen Originaltext merken, bevor er ersetzt wird
  document.querySelectorAll("[data-en]").forEach((el) => {
    el.dataset.de = el.innerHTML;
  });
  document.querySelectorAll("[data-en-aria-label]").forEach((el) => {
    el.dataset.deAriaLabel = el.getAttribute("aria-label");
  });

  const apply = (lang) => {
    const en = lang === "en";

    document.querySelectorAll("[data-en]").forEach((el) => {
      el.innerHTML = en ? el.dataset.en : el.dataset.de;
    });
    document.querySelectorAll("[data-en-aria-label]").forEach((el) => {
      el.setAttribute("aria-label", en ? el.dataset.enAriaLabel : el.dataset.deAriaLabel);
    });

    document.documentElement.lang = en ? "en" : "de";
    btn.textContent = en ? "DE" : "EN";
    btn.dataset.target = en ? "de" : "en";
    btn.setAttribute("aria-label", en ? "Auf Deutsch wechseln" : "Switch to English");
  };

  let current = getSaved() === "en" ? "en" : "de";
  apply(current);

  btn.addEventListener("click", () => {
    current = current === "en" ? "de" : "en";
    save(current);
    apply(current);
  });
})();
