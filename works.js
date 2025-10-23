// Hilfsfunktion: sicher abspielen + Fehler loggen
async function safePlay(video) {
  try {
    // Laufzeit-Properties setzen – wichtig für iOS
    video.muted = true;
    video.playsInline = true;                 // JS-Property
    video.setAttribute('playsinline', '');    // HTML-Attr
    video.setAttribute('webkit-playsinline', '');
    video.autoplay = true;

    // Falls nötig, decodieren anstoßen
    if (video.readyState < 2) video.load();

    // kurzer Reflow/Delay, damit Sichtbarkeit “greift”
    await new Promise(r => setTimeout(r, 50));

    await video.play();
    return true;
  } catch (err) {
    console.warn('Video play() blockiert:', err && err.name, err && err.message);
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
    const projectFrames = document.querySelectorAll(".project-frame");
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints;

    if (!isTouchDevice) {
        // **Desktop: Original Hover Behavior**
        projectFrames.forEach(frame => {
            const image = frame.querySelector(".project-image");
            const video = frame.querySelector(".project-video");

            frame.addEventListener("mouseenter", () => {
                image.style.opacity = "0"; // Hide image
                video.style.opacity = "1"; // Show video
                safePlay(video);
            });

            frame.addEventListener("mouseleave", () => {
                video.pause(); // Pause video
                video.currentTime = 0; // Reset video to the beginning
                video.style.opacity = "0"; // Hide video
                image.style.opacity = "1"; // Show image again
            });
        });
    } else {
        // **Mobile: Scroll-based Full-Frame Activation**
        const observerOptions = {
            root: null, // Viewport
            rootMargin: "0px",
            threshold: 1 // Activate when 100% is visible
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const frame = entry.target;
                const image = frame.querySelector(".project-image");
                const video = frame.querySelector(".project-video");

                if (entry.isIntersecting) {
                    // Aktivieren (Video sichtbar machen)
                    frame.classList.add("active");
                    image.style.opacity = "0";
                    video.style.opacity = "1";
                    video.load(); // sicherstellen, dass das Video bereit ist
                    setTimeout(() => video.play(), 50); // kleiner Delay für iOS
                } else {
                    // Deaktivieren (Video wieder ausblenden)
                    frame.classList.remove("active");
                    video.pause();
                    video.currentTime = 0;
                    video.style.opacity = "0";
                    image.style.opacity = "1";
                }

            });
        }, observerOptions);

        // Observe all project frames
        projectFrames.forEach(frame => observer.observe(frame));
    }

    const projectImages = document.querySelectorAll(".project-image");

    projectImages.forEach(img => {
        img.onload = () => {
            if (img.naturalHeight > img.naturalWidth) {
                img.classList.add("portrait");
            }
        };
    });
});
