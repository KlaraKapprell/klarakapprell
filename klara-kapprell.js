document.addEventListener("DOMContentLoaded", function () {
  const klaraName = document.querySelector(".hover-name");
  const p5Trigger = document.getElementById("p5-trigger");
  const overlay = document.getElementById("p5-overlay");
  const mailTrigger = document.querySelector(".hover-mail");
  const cvTrigger = document.getElementById("cv-trigger");
  let myP5Instance = null;
  let isSketchActive = false;
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints;

  // --- HOVER IMAGE EFFECT (DESKTOP) / TAP-TO-TOGGLE (MOBILE) ---
  const img = document.createElement("img");
  img.src = "media/DSC08885.webp"; // Dein Bildpfad
  img.alt = "Klara Kapprell";
  img.loading = "lazy";
  img.style.position = "absolute"; // Desktop: Absolute positioning for hover
  img.style.width = "30%"; // Desktop size
  img.style.borderRadius = "20px";
  img.style.display = "none"; // Initially hidden
  img.style.pointerEvents = "none"; // Prevents blocking hover
  document.body.appendChild(img);

  if (!isTouchDevice) {
      // **Desktop: Hover to show image**
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
      // **Mobile: Tap to Show/Hide**
      img.style.position = "fixed"; // Mobile: Fixed and centered
      img.style.width = "70%"; // Bigger on mobile
      img.style.maxWidth = "400px"; // Prevents oversized images
      img.style.top = "50%";
      img.style.left = "50%";
      img.style.transform = "translate(-50%, -50%)"; // Center it
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

  // --- OPEN MAIL CLIENT ---
  mailTrigger.addEventListener("click", function () {
      window.location.href = "mailto:hallo@klarakapprell.de";
  });

  // --- DOWNLOAD CV PDF ---
  cvTrigger.addEventListener("click", function () {
      const cvUrl = "media/KlaraKapprell_Lebenslauf.pdf";
      const link = document.createElement("a");
      link.href = cvUrl;
      link.download = "Klara-Kapprell_CV.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  });

  // --- TOGGLE P5.JS OVERLAY (NOW ALSO WORKS FOR MOBILE) ---
  p5Trigger.addEventListener("click", function (event) {
      event.stopPropagation(); // Prevents event bubbling on mobile

      if (isSketchActive) {
        closeSketch(); // If active, close it
        p5Trigger.classList.remove("hover-p5-active");
      } else {
          openSketch(); // If inactive, open it
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
