document.addEventListener("DOMContentLoaded", function () {
  const klaraName = document.querySelector(".hover-name");
  const p5Trigger = document.getElementById("p5-trigger");
  const overlay = document.getElementById("p5-overlay");
  const mailTrigger = document.querySelector(".hover-mail");
  let myP5Instance = null;
  let isSketchActive = false;
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints;

  // --- Hover image effect (Desktop) / Tap-to-toggle (Mobile) ---
  const img = document.createElement("img");
  img.src = "media/DSC08885.webp";
  img.alt = "Klara Kapprell";
  img.loading = "lazy";
  img.style.position = "absolute";
  img.style.width = "30%";
  img.style.borderRadius = "20px";
  img.style.display = "none";
  img.style.pointerEvents = "none";
  document.body.appendChild(img);

  if (!isTouchDevice) {
      klaraName.addEventListener("mouseover", () => {
          img.style.display = "block";
      });

      klaraName.addEventListener("mousemove", (event) => {
          img.style.left = event.pageX + 15 + "px";
          img.style.top = event.pageY + 15 + "px";
      });

      klaraName.addEventListener("mouseout", () => {
          img.style.display = "none";
      });
  } else {
      img.style.position = "fixed";
      img.style.width = "70%";
      img.style.maxWidth = "400px";
      img.style.top = "50%";
      img.style.left = "50%";
      img.style.transform = "translate(-50%, -50%)";
      img.style.zIndex = "1000";

      klaraName.addEventListener("click", () => {
          img.style.display = img.style.display === "block" ? "none" : "block";
      });

      document.addEventListener("click", function closeImage(e) {
          if (!klaraName.contains(e.target) && !img.contains(e.target)) {
              img.style.display = "none";
              document.removeEventListener("click", closeImage);
          }
      });
  }

  // --- Open mail client ---
  mailTrigger.addEventListener("click", function () {
      window.location.href = "mailto:hallo@klarakapprell.de";
  });

  // --- Toggle p5.js overlay (also on mobile) ---
  p5Trigger.addEventListener("click", function (event) {
      event.stopPropagation();

      if (isSketchActive) {
        closeSketch();
        p5Trigger.classList.remove("hover-p5-active");
      } else {
          openSketch();
          p5Trigger.classList.add("hover-p5-active");
      }
  });

  function openSketch() {
    overlay.classList.remove("hidden");
    isSketchActive = true;

    if (!myP5Instance) {
        myP5Instance = new p5(waveSketch, "p5-container");
    }

    if (isTouchDevice) {
        document.addEventListener("click", closeSketchOutside);
    }
}

function closeSketch() {
    overlay.classList.add("hidden");
    isSketchActive = false;

    if (myP5Instance) {
        myP5Instance.remove();
        myP5Instance = null;
    }

    if (isTouchDevice) {
        document.removeEventListener("click", closeSketchOutside);
    }
}

function closeSketchOutside(event) {
    if (!p5Trigger.contains(event.target) && !overlay.contains(event.target)) {
        closeSketch();
        p5Trigger.classList.remove("hover-p5-active");
    }
}

});
