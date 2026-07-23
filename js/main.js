document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initScrollAnimations();
  initStatsCounter();
  initTestimonialSlider();
  initFaqAccordion();
  initLightbox();
  initContactForm();
});

/* --- NAVBAR FUNCTIONALITY --- */
function initNavbar() {
  const header = document.querySelector('.header');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky header on scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile menu toggle
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      mobileToggle.classList.toggle('active');
      navMenu.classList.toggle('active');
      document.body.classList.toggle('no-scroll');
    });
  }

  // Close mobile menu when link is clicked
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navMenu.classList.contains('active')) {
        mobileToggle.classList.remove('active');
        navMenu.classList.remove('active');
        document.body.classList.remove('no-scroll');
      }
    });
  });

  // Highlight active link depending on current page URL
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach(link => {
    const linkHref = link.getAttribute('href');
    if (linkHref === currentPath) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/* --- SCROLL REVEAL ANIMATIONS --- */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal');
  
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target); // Animates once
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  } else {
    // Fallback if IntersectionObserver is not supported
    revealElements.forEach(el => el.classList.add('active'));
  }
}

/* --- STATS COUNTER --- */
function initStatsCounter() {
  const statsSection = document.querySelector('.stats-section');
  const statNumbers = document.querySelectorAll('.stat-number');
  
  if (!statsSection || statNumbers.length === 0) return;

  let animated = false;

  const animateCounters = () => {
    statNumbers.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-target'), 10);
      const suffix = stat.getAttribute('data-suffix') || '';
      let current = 0;
      const duration = 2000; // 2 seconds
      const increment = target / (duration / 16); // ~60fps
      
      const updateCount = () => {
        current += increment;
        if (current < target) {
          stat.textContent = Math.floor(current) + suffix;
          requestAnimationFrame(updateCount);
        } else {
          stat.textContent = target + suffix;
        }
      };
      
      updateCount();
    });
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !animated) {
          animateCounters();
          animated = true;
          observer.unobserve(statsSection);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(statsSection);
  } else {
    animateCounters();
  }
}

/* --- TESTIMONIALS SLIDER --- */
function initTestimonialSlider() {
  const slider = document.querySelector('.testimonial-slider');
  const slides = document.querySelectorAll('.testimonial-slide');
  const dotsContainer = document.querySelector('.testimonial-dots');
  
  if (!slider || slides.length === 0) return;

  let currentIndex = 0;
  let autoPlayTimer;

  // Create dot indicators
  slides.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.classList.add('dot');
    if (index === 0) dot.classList.add('active');
    dot.addEventListener('click', () => {
      goToSlide(index);
      resetAutoPlay();
    });
    dotsContainer.appendChild(dot);
  });

  const dots = document.querySelectorAll('.dot');

  function goToSlide(index) {
    currentIndex = index;
    slider.style.transform = `translateX(-${currentIndex * 100}%)`;
    
    dots.forEach((dot, idx) => {
      if (idx === currentIndex) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });
  }

  function startAutoPlay() {
    autoPlayTimer = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= slides.length) nextIndex = 0;
      goToSlide(nextIndex);
    }, 6000); // Change slide every 6 seconds
  }

  function resetAutoPlay() {
    clearInterval(autoPlayTimer);
    startAutoPlay();
  }

  startAutoPlay();
}

/* --- FAQ ACCORDION --- */
function initFaqAccordion() {
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const faqItem = question.parentElement;
      const faqAnswer = faqItem.querySelector('.faq-answer');
      const isActive = faqItem.classList.contains('active');

      // Close all other FAQs in the grid
      const parentGrid = faqItem.closest('.faq-grid');
      if (parentGrid) {
        const siblings = parentGrid.querySelectorAll('.faq-item');
        siblings.forEach(sibling => {
          sibling.classList.remove('active');
          const answer = sibling.querySelector('.faq-answer');
          if (answer) answer.style.maxHeight = null;
        });
      }

      if (!isActive) {
        faqItem.classList.add('active');
        // Set scrollHeight to animate expanding
        faqAnswer.style.maxHeight = faqAnswer.scrollHeight + 'px';
      } else {
        faqItem.classList.remove('active');
        faqAnswer.style.maxHeight = null;
      }
    });
  });
}

/* --- GALLERY FILTER & LIGHTBOX --- */
function initLightbox() {
  const galleryItems = document.querySelectorAll('.gallery-item');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const lightbox = document.querySelector('.lightbox');
  
  // Gallery category filtering (if elements exist)
  if (filterBtns.length > 0 && galleryItems.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Toggle active button
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filterValue = btn.getAttribute('data-filter');
        
        galleryItems.forEach(item => {
          const category = item.getAttribute('data-category');
          if (filterValue === 'all' || category === filterValue) {
            item.style.display = 'block';
            setTimeout(() => {
              item.style.opacity = '1';
              item.style.transform = 'scale(1)';
            }, 50);
          } else {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.8)';
            setTimeout(() => {
              item.style.display = 'none';
            }, 400); // matches transition time
          }
        });
      });
    });
  }

  // Lightbox functionality
  if (!lightbox) return;

  const lightboxImg = lightbox.querySelector('.lightbox-img');
  const lightboxCaption = lightbox.querySelector('.lightbox-caption');
  const lightboxClose = lightbox.querySelector('.lightbox-close');

  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      const captionText = item.querySelector('h4') ? item.querySelector('h4').textContent : '';
      const categoryText = item.querySelector('span') ? item.querySelector('span').textContent : '';
      
      if (img && lightboxImg) {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt;
        if (lightboxCaption) {
          lightboxCaption.textContent = captionText + (categoryText ? ` - ${categoryText}` : '');
        }
        lightbox.classList.add('active');
        document.body.classList.add('no-scroll');
      }
    });
  });

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.classList.remove('no-scroll');
    setTimeout(() => {
      if (lightboxImg) lightboxImg.src = '';
    }, 300);
  };

  if (lightboxClose) {
    lightboxClose.addEventListener('click', closeLightbox);
  }

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
}

/* --- CONTACT FORM --- */
function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const eventType = document.getElementById('event-type').value;
    const eventDate = document.getElementById('event-date').value;
    const message = document.getElementById('message').value.trim();

    if (!name || !email || !phone || !message) {
      showStatus('Please fill in all required fields.', 'error');
      return;
    }

    // Simple email validation regex
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      showStatus('Please enter a valid email address.', 'error');
      return;
    }

    // Simple phone validation regex
    const phonePattern = /^[0-9+\s-]{10,15}$/;
    if (!phonePattern.test(phone.replace(/\s/g, ''))) {
      showStatus('Please enter a valid phone number.', 'error');
      return;
    }

    // Simulate backend submission
    showStatus('Sending your request...', 'info');
    
    setTimeout(() => {
      showStatus('Thank you! Your message has been sent. Our team will contact you shortly.', 'success');
      contactForm.reset();
    }, 1500);
  });

  function showStatus(msg, type) {
    if (!formStatus) return;
    
    formStatus.textContent = msg;
    formStatus.className = 'form-status'; // reset
    
    if (type === 'success') {
      formStatus.classList.add('success');
    } else if (type === 'error') {
      formStatus.classList.add('error');
    } else {
      formStatus.style.display = 'block';
      formStatus.style.color = 'var(--gold-primary)';
    }
  }
}
