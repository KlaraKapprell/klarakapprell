document.addEventListener("contextmenu", function(event) {
  event.preventDefault();
});

// Verhindert das Ziehen von Bildern
document.addEventListener("dragstart", function(event) {
  event.preventDefault();
});