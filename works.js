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
                    // Activate full frame effect
                    frame.classList.add("active");
                    image.style.display = "none";
                    video.style.display = "block";
                    video.play();
                } else {
                    // Deactivate effect
                    frame.classList.remove("active");
                    video.style.display = "none";
                    image.style.display = "block";
                    video.pause();
                    video.currentTime = 0;
                }
            });
        }, observerOptions);

        // Observe all project frames
        projectFrames.forEach(frame => observer.observe(frame));
    }
});
