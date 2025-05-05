document.addEventListener("DOMContentLoaded", () => {
    // Slideshow Functionality
    let slideIndex = 1
    const slides = document.getElementsByClassName("slide")
  
    // Set first slide as active
    showSlides(slideIndex)
  
    // Previous/Next controls
    document.querySelector(".prev").addEventListener("click", () => {
      showSlides((slideIndex -= 1))
    })
  
    document.querySelector(".next").addEventListener("click", () => {
      showSlides((slideIndex += 1))
    })
  
    function showSlides(n) {
      if (n > slides.length) {
        slideIndex = 1
      }
      if (n < 1) {
        slideIndex = slides.length
      }
  
      // Hide all slides
      for (let i = 0; i < slides.length; i++) {
        slides[i].style.display = "none"
      }
  
      // Show current slide
      slides[slideIndex - 1].style.display = "block"
    }
  
    // Auto advance slides every 5 seconds
    setInterval(() => {
      showSlides((slideIndex += 1))
    }, 5000)
  
    // Mobile Menu Functionality
    const mobileMenuBtn = document.getElementById("mobile-menu-btn")
    const mobileMenu = document.getElementById("mobile-menu")
  
    mobileMenuBtn.addEventListener("click", () => {
      mobileMenu.classList.toggle("active")
      // Change menu icon
      const icon = mobileMenuBtn.querySelector("i")
      if (mobileMenu.classList.contains("active")) {
        icon.classList.remove("fa-bars")
        icon.classList.add("fa-times")
      } else {
        icon.classList.remove("fa-times")
        icon.classList.add("fa-bars")
      }
    })
  
    // Close mobile menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        mobileMenu.classList.remove("active")
        const icon = mobileMenuBtn.querySelector("i")
        icon.classList.remove("fa-times")
        icon.classList.add("fa-bars")
      }
    })
  
    // Close mobile menu when window is resized above mobile breakpoint
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        mobileMenu.classList.remove("active")
        const icon = mobileMenuBtn.querySelector("i")
        icon.classList.remove("fa-times")
        icon.classList.add("fa-bars")
      }
    })
  })
  
  