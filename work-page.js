document.addEventListener("DOMContentLoaded", () => {
    const videos = document.querySelectorAll(".project-video");
  
    const options = {
        root: null, // Observes in relation to the viewport
        rootMargin: "0px", // No extra margin around the viewport
        threshold: 0.5 // Video must be at least 50% visible to trigger
    };
  
    const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            if (entry.isIntersecting) {
                video.muted = true; // Ensure autoplay works
                video.setAttribute("playsinline", ""); // Fix for iOS Safari
                video.play().catch(error => console.warn("Autoplay blocked:", error));
            } else {
                video.pause();
            }
        });
    }, options);
  
    videos.forEach(video => {
        video.muted = true; // Ensure all videos start muted
        video.setAttribute("playsinline", ""); // Ensures iOS compatibility
        videoObserver.observe(video);
    });
  });
  