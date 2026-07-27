document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initGamesList();
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
  const revealElements = document.querySelectorAll('.reveal:not(.active)');

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

  // Pre-fill fields from URL query params (luxury user-experience mapping)
  const urlParams = new URLSearchParams(window.location.search);
  const serviceParam = urlParams.get('service');
  const gameParam = urlParams.get('game');

  const eventTypeSelect = document.getElementById('event-type');
  const messageTextarea = document.getElementById('message');

  if (eventTypeSelect) {
    if (serviceParam) {
      const serviceMap = {
        'wedding': 'wedding',
        'birthday': 'birthday',
        'babyshower': 'babyshower',
        'haldi-mehendi': 'haldi-mehendi',
        'corporate': 'corporate',
        'haldi': 'haldi-mehendi',
        'mehendi': 'haldi-mehendi'
      };
      if (serviceMap[serviceParam.toLowerCase()]) {
        eventTypeSelect.value = serviceMap[serviceParam.toLowerCase()];
      }
    } else if (gameParam) {
      eventTypeSelect.value = 'other';
    }
  }

  if (messageTextarea) {
    if (gameParam) {
      const gameName = gameParam.charAt(0).toUpperCase() + gameParam.slice(1);
      messageTextarea.value = `Hello Creation Events, I would like to book/inquire about the game stall: "${gameName}". Please share details and pricing.`;
    } else if (serviceParam) {
      const serviceName = serviceParam.charAt(0).toUpperCase() + serviceParam.slice(1);
      messageTextarea.value = `Hello Creation Events, I am interested in inquiring about your "${serviceName}" services. Please share packages and pricing details.`;
    }
  }

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
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

    // Front-end simulation submission
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

/* --- DYNAMIC GAMES & ACTIVITIES LIST --- */
function initGamesList() {
  const gamesGridContainer = document.getElementById('games-grid-container');
  if (!gamesGridContainer) return;

  const data = {
    games: [
      { name: "Catch the Sticks", icon: "fas fa-hand-paper" },
      { name: "Barrel Storm", icon: "fas fa-wind" },
      { name: "Balloon Shooting", icon: "fas fa-bullseye" },
      { name: "Buzz Wire", icon: "fas fa-bolt" },
      { name: "Jenga", icon: "fas fa-cubes" },
      { name: "Mini Golf", icon: "fas fa-golf-ball" },
      { name: "Bowling Alley", icon: "fas fa-bowling-ball" },
      { name: "Archery", icon: "fas fa-location-arrow" },
      { name: "Wheel of Fortune", icon: "fas fa-dharmachakra" },
      { name: "Hit the Cans", icon: "fas fa-beer" },
      { name: "Feed the Clown", icon: "fas fa-smile-beam" },
      { name: "Ring Toss", icon: "fas fa-circle-notch" },
      { name: "Snake & Ladder / Ludo", icon: "fas fa-dice" },
      { name: "Magnetic Dart Game", icon: "fas fa-star" },
      { name: "Balloon Dart", icon: "fas fa-th-large" },
      { name: "Maze Game", icon: "fas fa-route" },
      { name: "Hook the Bottle", icon: "fas fa-wine-bottle" },
      { name: "Frisbee", icon: "fas fa-compact-disc" },
      { name: "Car Parking Challenge", icon: "fas fa-car" },
      { name: "Twister", icon: "fas fa-shapes" },
      { name: "Make 21", icon: "fas fa-hand-holding-usd" },
      { name: "7up 7down", icon: "fas fa-sort-amount-up" },
      { name: "Paper Plane Toss", icon: "fas fa-paper-plane" },
      { name: "Basketball", icon: "fas fa-basketball-ball" },
      { name: "Beer Pong", icon: "fas fa-glass-martini-alt" },
      { name: "Ball & Pipe", icon: "fas fa-circle" },
      { name: "Shoot the Duck", icon: "fas fa-crosshairs" },
      { name: "Fishing", icon: "fas fa-fish" },
      { name: "Hammer the Ball", icon: "fas fa-gavel" },
      { name: "Tic Tac Toe", icon: "fas fa-times" },
      { name: "Roll the Ball", icon: "fas fa-circle-notch" },
      { name: "Zig Zag Zoom", icon: "fas fa-running" },
      { name: "Snake Pit", icon: "fas fa-skull" },
      { name: "Football", icon: "fas fa-football-ball" },
      { name: "Sand Bag Toss", icon: "fas fa-shopping-bag" },
      { name: "Golden Bar", icon: "fas fa-align-justify" },
      { name: "Sling Hockey", icon: "fas fa-hockey-puck" },
      { name: "Ping Pong Ball", icon: "fas fa-table-tennis" },
      { name: "Dart Inflator", icon: "fas fa-compress-arrows-alt" },
      { name: "Limbo", icon: "fas fa-arrows-alt-v" },
      { name: "Angry Birds", icon: "fas fa-kiwi-bird" },
      { name: "Zorb Ball", icon: "fas fa-globe" },
      { name: "Big Size Foosball", icon: "fas fa-users" }
    ],
    activities: [
      { name: "Tattoo / Glitter Tattoo / Mehandi", icon: "fas fa-pen-nib" },
      { name: "Nail Art / Press-on Nails", icon: "fas fa-hand-sparkles" },
      { name: "Hair Braiding / Flower Braiding / Neon Braiding", icon: "fas fa-cut" },
      { name: "Dream Catcher (Customized)", icon: "fas fa-feather-alt" },
      { name: "Bath Bomb Making", icon: "fas fa-bath" },
      { name: "Fridge Magnet / Name Magnet", icon: "fas fa-magnet" },
      { name: "Name Plate Making", icon: "fas fa-file-signature" },
      { name: "Crayon Melting", icon: "fas fa-palette" },
      { name: "Fluid Art", icon: "fas fa-tint" },
      { name: "Magic Wand", icon: "fas fa-magic" },
      { name: "Superhero Cape & Mask", icon: "fas fa-mask" },
      { name: "Lantern Decoration", icon: "fas fa-lightbulb" },
      { name: "Balloon Art", icon: "fas fa-gift" },
      { name: "MDF / Pebble / Pot / Bottle / Mug / Cap Painting", icon: "fas fa-paint-brush" },
      { name: "Tie & Dye", icon: "fas fa-tshirt" },
      { name: "Paper Quilling", icon: "fas fa-scroll" },
      { name: "Face Glitter / Glitter Eye", icon: "fas fa-face-laugh-beam" },
      { name: "Canvas Painting / Dot Mandala / Doodle Art", icon: "fas fa-palette" },
      { name: "Tote Bag Printing", icon: "fas fa-shopping-bag" },
      { name: "Soap Making", icon: "fas fa-soap" },
      { name: "Slime Making", icon: "fas fa-vial" },
      { name: "Pen Stand / Keychain Making", icon: "fas fa-pen" },
      { name: "Spin Art", icon: "fas fa-sync" },
      { name: "Tiara / Crown Decoration", icon: "fas fa-crown" },
      { name: "Art & Craft / Origami", icon: "fas fa-shapes" },
      { name: "Pot Planting", icon: "fas fa-seedling" },
      { name: "Money Bank Decoration", icon: "fas fa-piggy-bank" },
      { name: "Wax Sachet", icon: "fas fa-burn" },
      { name: "Perfume Making / Perfume Bar", icon: "fas fa-spray-can" },
      { name: "Paper Bag / Jute Bag Decor", icon: "fas fa-shopping-bag" },
      { name: "Bracelet / Charms Bracelet / Necklace", icon: "fas fa-gem" },
      { name: "Makeup & Hair Styling", icon: "fas fa-user-astronaut" },
      { name: "Spa Corner", icon: "fas fa-spa" },
      { name: "Name on Rice", icon: "fas fa-microscope" },
      { name: "Clay Modeling", icon: "fas fa-hammer" },
      { name: "Hat / Sunglasses Decoration", icon: "fas fa-hat-wizard" },
      { name: "Rangoli / Paper Rangoli", icon: "fas fa-brush" },
      { name: "Diya Painting / Kandil Making", icon: "fas fa-fire-alt" },
      { name: "Mosaic Art", icon: "fas fa-puzzle-piece" },
      { name: "Snow Globe Making", icon: "fas fa-globe-asia" },
      { name: "Terrarium", icon: "fas fa-leaf" },
      { name: "Shell Painting & Keychain", icon: "fas fa-fish" },
      { name: "Live Printing on Cap / T-shirt", icon: "fas fa-print" },
      { name: "Live Photo Print", icon: "fas fa-camera" },
      { name: "Pokémon Cards / Adopt a Pup", icon: "fas fa-paw" },
      { name: "Festival Special Activities", icon: "fas fa-calendar-alt" }
    ],
    foods: [
      { name: "Popcorn", icon: "fas fa-cookie" },
      { name: "Candy Floss", icon: "fas fa-cookie-bite" },
      { name: "Chocolate Fountain", icon: "fas fa-birthday-cake" },
      { name: "Gola", icon: "fas fa-ice-cream" },
      { name: "DIY Subway Sandwich", icon: "fas fa-hamburger" },
      { name: "DIY Cupcake Decoration", icon: "fas fa-birthday-cake" },
      { name: "Bachpan Ki Yaadein (Imli Counter)", icon: "fas fa-lemon" },
      { name: "Chaat Counter", icon: "fas fa-utensils" },
      { name: "Sugarcane Juice", icon: "fas fa-glass-whiskey" },
      { name: "Soda Pub", icon: "fas fa-beer" },
      { name: "Maggi Counter", icon: "fas fa-hotdog" },
      { name: "90's Toffee", icon: "fas fa-candy-cane" },
      { name: "Waffle Counter", icon: "fas fa-stroopwafel" },
      { name: "Potato Twisties", icon: "fas fa-pepper-hot" },
      { name: "Tea Counter", icon: "fas fa-coffee" }
    ],
    addons: [
      { name: "Bluetooth Speaker with Microphone", icon: "fas fa-microphone-alt" },
      { name: "360° Camera", icon: "fas fa-video" },
      { name: "Professional Videographer (Camera & Drone)", icon: "fas fa-photo-video" },
      { name: "Professional Photographer", icon: "fas fa-camera-retro" }
    ]
  };

  const categories = [
    { id: "games", title: "Game Stalls", subtitle: "Interactive & Competitive Play", gridId: "games-grid", headerId: "games-header" },
    { id: "activities", title: "Activity Stalls", subtitle: "Creative Crafts & Artistry", gridId: "activities-grid", headerId: "activities-header" },
    { id: "foods", title: "Food Stalls", subtitle: "Gourmet Live Counters", gridId: "foods-grid", headerId: "foods-header" },
    { id: "addons", title: "Add-Ons (Rental)", subtitle: "Capture the Moments", gridId: "addons-grid", headerId: "addons-header" }
  ];

  // Render Category grids and setup filtering
  const renderStalls = (searchTerm = "", activeCategory = "all") => {
    let totalVisible = 0;

    categories.forEach(cat => {
      const section = document.getElementById(cat.headerId);
      const grid = document.getElementById(cat.gridId);
      if (!section || !grid) return;

      const items = data[cat.id];
      const filtered = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = activeCategory === "all" || activeCategory === cat.id;
        return matchesSearch && matchesCategory;
      });

      if (filtered.length > 0) {
        section.classList.remove('hidden');
        totalVisible += filtered.length;

        grid.innerHTML = filtered.map((item, index) => {
          // Dynamic delay styling for grid entry animations
          const delayClass = (index % 4) === 0 ? '' : (index % 4) === 1 ? 'delay-100' : (index % 4) === 2 ? 'delay-200' : 'delay-300';
          return `
            <div class="stall-card reveal ${delayClass}">
              <div class="stall-card-header">
                <span class="stall-card-index">${String(index + 1).padStart(2, '0')}</span>
                <div class="stall-card-icon"><i class="${item.icon}"></i></div>
              </div>
              <h3>${item.name}</h3>
            </div>
          `;
        }).join('');
      } else {
        section.classList.add('hidden');
        grid.innerHTML = '';
      }
    });

    const noResults = document.getElementById('no-results');
    if (noResults) {
      if (totalVisible === 0) {
        noResults.classList.add('visible');
      } else {
        noResults.classList.remove('visible');
      }
    }

    // Re-run animations for newly populated elements
    if (typeof initScrollAnimations === 'function') {
      initScrollAnimations();
    }
  };

  // Initial render
  renderStalls();

  // Search input event listener
  const searchInput = document.getElementById('search-input');
  const tabs = document.querySelectorAll('.category-tab');
  let currentSearch = "";
  let currentCategory = "all";

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearch = e.target.value.trim();
      renderStalls(currentSearch, currentCategory);
    });
  }

  // Category tabs click listener
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.getAttribute('data-category');
      renderStalls(currentSearch, currentCategory);
    });
  });
}
