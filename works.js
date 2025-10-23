document.addEventListener("DOMContentLoaded", () => {
    const projectFrames = document.querySelectorAll(".project-frame");
    const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints;

    if (!isTouchDevice) {
        // **Desktop: Original Hover Behavior**
        projectFrames.forEach(frame => {
            const image = frame.querySelector(".project-image");
            const video = frame.querySelector(".project-video");

            frame.addEventListener("mouseenter", () => {
                image.style.display = "none"; // Hide image
                video.style.display = "block"; // Show video
                video.play(); // Start playing video
            });

            frame.addEventListener("mouseleave", () => {
                video.style.display = "none"; // Hide video
                image.style.display = "block"; // Show image again
                video.pause(); // Pause video
                video.currentTime = 0; // Reset video to the beginning
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
