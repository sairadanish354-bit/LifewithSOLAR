(() => {
  // ============================================================
  // 1. CONSTANTS & DATA
  // ============================================================
  const FRAME_COUNT = 80;

  const SOLAR_PRODUCTS = [
    {
      id: 'sp-ultra',
      name: 'Solar Change Life Ultra-Cell 460W',
      category: 'Residential',
      efficiency: '22.8% Module Efficiency',
      warranty: '25-Year Comprehensive Warranty',
      description: 'Bifacial N-Type monocrystalline cells delivering ultra-high density power generation even in low-light and high-heat conditions.',
      priceEstimate: 'From $189 / panel',
      features: ['Anti-reflective tempered glass', 'Zero light-induced degradation (LID)', 'Wind load resistance up to 5400 Pa']
    },
    {
      id: 'sp-powervault',
      name: 'Solar Change Life PowerVault 14kWh',
      category: 'Storage',
      efficiency: '97.5% Round-trip Efficiency',
      warranty: '15-Year Performance Guarantee',
      description: 'Safe Lithium Iron Phosphate (LiFePO4) home storage system with seamless grid-outage cutover in under 10 milliseconds.',
      priceEstimate: 'From $6,499 installed',
      features: ['Built-in smart energy gateway', 'Liquid thermal regulation', 'App-controlled peak shaving & TOU arbitrage']
    },
    {
      id: 'sp-inverter-max',
      name: 'Solar Change Life Inverter Hybrid-X',
      category: 'Inverters',
      efficiency: '99.0% Peak Inversion Efficiency',
      warranty: '12-Year Standard Warranty',
      description: 'Next-gen dual MPPT hybrid solar inverter with AI-optimized tracking for unpredictable overcast and fluctuating weather.',
      priceEstimate: 'From $1,250',
      features: ['Built-in Wi-Fi & 4G cloud telemetry', 'Silent fanless passive cooling', 'Rapid shutdown fire safety compliance']
    },
    {
      id: 'sp-commercial',
      name: 'Solar Change Life Commercial Array 600W',
      category: 'Commercial',
      efficiency: '23.4% Industrial Grade',
      warranty: '30-Year Linear Power Guarantee',
      description: 'Engineered for logistics warehouses, manufacturing plants, and agricultural microgrids demanding maximum kilowatt-hour yield.',
      priceEstimate: 'Custom enterprise quotes',
      features: ['High bifaciality factor (up to 85%)', 'Optimized for flat roof ballasted systems', 'Hail impact resistance class 4']
    }
  ];

  // ============================================================
  // 2. 240-FRAME CANVAS ENGINE (SMOOTH 60FPS LERP)
  // ============================================================
  const canvas = document.getElementById('animation-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });

  const images = [];
  const loadedFlags = new Array(FRAME_COUNT).fill(false);
  let loadedCount = 0;

  let currentProgress = 0;
  let targetProgress = 0;
  let lastRenderedIndex = -1;
  let animationFrameId = null;

  function getFrameUrl(index) {
    const padded = String(index + 1).padStart(6, '0');
    return `frames/frame_${padded}.jpg`;
  }

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    lastRenderedIndex = -1;
    render();
  }

  function drawCover(img) {
    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;

    if (!iw || !ih) return;

    const canvasRatio = cw / ch;
    const imgRatio = iw / ih;

    let sx = 0;
    let sy = 0;
    let sWidth = iw;
    let sHeight = ih;

    if (canvasRatio > imgRatio) {
      sHeight = iw / canvasRatio;
      sy = (ih - sHeight) / 2;
    } else {
      sWidth = ih * canvasRatio;
      sx = (iw - sWidth) / 2;
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, cw, ch);
  }

  function findNearestLoadedFrame(targetIdx) {
    if (loadedFlags[targetIdx]) return targetIdx;

    for (let offset = 1; offset < FRAME_COUNT; offset++) {
      const prev = targetIdx - offset;
      if (prev >= 0 && loadedFlags[prev]) return prev;
      const next = targetIdx + offset;
      if (next < FRAME_COUNT && loadedFlags[next]) return next;
    }
    return -1;
  }

  function render() {
    const frameIndex = Math.min(
      FRAME_COUNT - 1,
      Math.max(0, Math.round(currentProgress * (FRAME_COUNT - 1)))
    );

    const actualIndex = findNearestLoadedFrame(frameIndex);
    if (actualIndex !== -1 && actualIndex !== lastRenderedIndex) {
      drawCover(images[actualIndex]);
      lastRenderedIndex = actualIndex;
    }

    updateStoryBeats(frameIndex);
  }

  function updateStoryBeats(currentFrame) {
    const beatCards = document.querySelectorAll('.story-beat-card');
    beatCards.forEach((card) => {
      const rangeStr = card.getAttribute('data-frame-range');
      if (rangeStr) {
        const [min, max] = rangeStr.split('-').map(Number);
        if (currentFrame >= min && currentFrame <= max) {
          card.classList.add('active-beat');
        } else {
          card.classList.remove('active-beat');
        }
      }
    });
  }

  function updateTargetProgress() {
    const scrollEl = document.documentElement;
    const maxScroll = scrollEl.scrollHeight - window.innerHeight;
    if (maxScroll <= 0) {
      targetProgress = 0;
    } else {
      const scrollY = window.pageYOffset || scrollEl.scrollTop || 0;
      targetProgress = Math.max(0, Math.min(1, scrollY / maxScroll));
    }

    // Update navbar scrolled glass state
    const navBar = document.getElementById('top-nav-bar');
    if (navBar) {
      if (window.scrollY > 50) {
        navBar.classList.add('scrolled');
      } else {
        navBar.classList.remove('scrolled');
      }
    }

    // Highlight active nav item
    highlightCurrentNavSection();
  }

  function highlightCurrentNavSection() {
    const sections = ['hero', 'technology', 'products-section', 'services-section', 'about-section', 'blog-section'];
    const scrollPos = window.scrollY + 200;

    for (let i = sections.length - 1; i >= 0; i--) {
      const secEl = document.getElementById(sections[i]);
      if (secEl && secEl.offsetTop <= scrollPos) {
        document.querySelectorAll('.nav-link').forEach(link => {
          if (link.getAttribute('data-target') === sections[i]) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
        break;
      }
    }
  }

  function animate() {
    const diff = targetProgress - currentProgress;
    if (Math.abs(diff) > 0.0001) {
      currentProgress += diff * 0.16;
      render();
    } else if (currentProgress !== targetProgress) {
      currentProgress = targetProgress;
      render();
    }
    animationFrameId = requestAnimationFrame(animate);
  }

  function preloadImages() {
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src = getFrameUrl(i);
      img.onload = () => {
        loadedFlags[i] = true;
        loadedCount++;
        if (i === 0 && lastRenderedIndex === -1) {
          render();
        } else if (Math.round(currentProgress * (FRAME_COUNT - 1)) === i) {
          lastRenderedIndex = -1;
          render();
        }
      };
      images[i] = img;
    }
  }

  // ============================================================
  // 3. PRODUCTS CATALOG RENDERING & FILTERING
  // ============================================================
  let activeProductCategory = 'All';

  function renderProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;

    const filtered = activeProductCategory === 'All'
      ? SOLAR_PRODUCTS
      : SOLAR_PRODUCTS.filter(p => p.category === activeProductCategory);

    container.innerHTML = filtered.map(product => `
      <div class="product-card glass-panel" id="card-${product.id}">
        <div>
          <div class="prod-top-meta">
            <span class="prod-cat-badge">${product.category}</span>
            <span class="prod-price">${product.priceEstimate}</span>
          </div>

          <h3 class="prod-title">${product.name}</h3>
          <p class="prod-desc">${product.description}</p>

          <div class="prod-specs-box-mini">
            <div class="spec-line">
              <svg class="spec-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <span>${product.efficiency}</span>
            </div>
            <div class="spec-line">
              <svg class="spec-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              <span>${product.warranty}</span>
            </div>
          </div>

          <ul class="prod-features-list">
            ${product.features.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>

        <button class="btn-prod-quote" data-product-id="${product.id}">
          <span>Request Custom Quote</span>
          <span>↗</span>
        </button>
      </div>
    `).join('');

    // Attach click handlers to open product detail modal
    container.querySelectorAll('.btn-prod-quote').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const prodId = btn.getAttribute('data-product-id');
        const prod = SOLAR_PRODUCTS.find(p => p.id === prodId);
        if (prod) {
          openProductDetailModal(prod);
        }
      });
    });
  }

  function setupCategoryTabs() {
    const tabs = document.querySelectorAll('.cat-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeProductCategory = tab.getAttribute('data-category') || 'All';
        renderProducts();
      });
    });
  }

  // ============================================================
  // 4. INTERACTIVE MODALS & ROI CALCULATOR
  // ============================================================
  window.openGetStartedModal = function() {
    closeAllModals();
    const modal = document.getElementById('modal-get-started');
    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      // Reset form view
      document.getElementById('modal-form-view').style.display = 'block';
      document.getElementById('modal-success-view').style.display = 'none';
    }
  };

  window.openMetricDetailsModal = function(type) {
    closeAllModals();
    const modal = document.getElementById('modal-metric-details');
    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';

      const carbonContent = document.getElementById('metric-content-carbon');
      const billsContent = document.getElementById('metric-content-bills');

      if (type === 'carbon') {
        carbonContent.style.display = 'block';
        billsContent.style.display = 'none';
      } else {
        carbonContent.style.display = 'none';
        billsContent.style.display = 'block';
      }
    }
  };

  window.openReviewsModal = function() {
    closeAllModals();
    const modal = document.getElementById('modal-reviews');
    if (modal) {
      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  };

  window.openProductDetailModal = function(product) {
    closeAllModals();
    const modal = document.getElementById('modal-product-detail');
    if (modal && product) {
      document.getElementById('modal-prod-cat').textContent = product.category;
      document.getElementById('modal-prod-name').textContent = product.name;
      document.getElementById('modal-prod-price').textContent = product.priceEstimate;
      document.getElementById('modal-prod-desc').textContent = product.description;
      document.getElementById('modal-prod-eff').textContent = product.efficiency;
      document.getElementById('modal-prod-warranty').textContent = product.warranty;

      const ul = document.getElementById('modal-prod-features');
      ul.innerHTML = product.features.map(f => `<li>${f}</li>`).join('');

      modal.classList.add('open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  };

  window.closeAllModals = function() {
    document.querySelectorAll('.modal-overlay').forEach(modal => {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    });
    document.body.style.overflow = '';
  };

  function setupModals() {
    // Close button triggers
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', closeAllModals);
    });

    // Close on clicking backdrop
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeAllModals();
      });
    });

    // Close on ESC key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeAllModals();
    });

    // Modal Triggers on Page Elements
    const getStartedNav = document.getElementById('btn-nav-get-started');
    if (getStartedNav) getStartedNav.addEventListener('click', openGetStartedModal);

    const mobileGetStarted = document.getElementById('btn-mobile-get-started');
    if (mobileGetStarted) mobileGetStarted.addEventListener('click', openGetStartedModal);

    const heroCalcBtn = document.getElementById('btn-hero-calc');
    if (heroCalcBtn) heroCalcBtn.addEventListener('click', openGetStartedModal);

    const bannerCalcBtn = document.getElementById('btn-banner-calc');
    if (bannerCalcBtn) bannerCalcBtn.addEventListener('click', openGetStartedModal);

    const serviceScheduleBtn = document.getElementById('btn-service-schedule');
    if (serviceScheduleBtn) serviceScheduleBtn.addEventListener('click', openGetStartedModal);

    // Hero Metric Cards click
    const carbonCard = document.getElementById('card-metric-carbon');
    if (carbonCard) carbonCard.addEventListener('click', () => openMetricDetailsModal('carbon'));

    const billsCard = document.getElementById('card-metric-bills');
    if (billsCard) billsCard.addEventListener('click', () => openMetricDetailsModal('bills'));

    // Social proof reviews pill click
    const socialProofPill = document.getElementById('card-social-proof');
    if (socialProofPill) socialProofPill.addEventListener('click', openReviewsModal);

    // ROI Calculator Slider in Modal
    const billSlider = document.getElementById('calc-bill-slider');
    const billValDisplay = document.getElementById('bill-val-display');
    const monthlySavingsEl = document.getElementById('calc-monthly-savings');
    const savings25yrEl = document.getElementById('calc-25yr-savings');
    const systemSizeEl = document.getElementById('calc-system-size');
    const carbonTonsEl = document.getElementById('calc-carbon-tons');

    if (billSlider) {
      billSlider.addEventListener('input', (e) => {
        const bill = Number(e.target.value);
        billValDisplay.textContent = `$${bill} / mo`;

        const monthlyCut = Math.round(bill * 0.20);
        const annualSavings = Math.round(bill * 12 * 0.72);
        const total25yr = annualSavings * 25;
        const systemKw = (bill / 26).toFixed(1);
        const carbonOffset = (bill * 0.042).toFixed(1);

        monthlySavingsEl.textContent = `$${monthlyCut} / mo`;
        savings25yrEl.textContent = `$${total25yr.toLocaleString()}`;
        systemSizeEl.textContent = `${systemKw} kW DC`;
        carbonTonsEl.textContent = `${carbonOffset} Tons`;
      });
    }

    // Lead Form Submission
    const leadForm = document.getElementById('solar-proposal-form');
    if (leadForm) {
      leadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('form-name').value || 'Customer';
        const city = document.getElementById('form-city').value || 'your area';

        document.getElementById('modal-form-view').style.display = 'none';
        const successView = document.getElementById('modal-success-view');
        successView.style.display = 'block';

        const successMsg = document.getElementById('success-message');
        if (successMsg) {
          successMsg.textContent = `Thank you, ${name}! Our certified solar engineer is processing your satellite LiDAR audit for ${city}. We will reach out via WhatsApp/email within 2 hours with your complete proposal.`;
        }
      });
    }
  }

  // ============================================================
  // 5. MOBILE MENU & NAVIGATION SMOOTH SCROLLING
  // ============================================================
  function setupNavigation() {
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileToggle && mobileMenu) {
      mobileToggle.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
      });
    }

    // Nav Link smooth scroll
    document.querySelectorAll('.nav-link, .mobile-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (mobileMenu) mobileMenu.classList.remove('open');
        const targetId = link.getAttribute('data-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          const navHeight = document.getElementById('top-nav-bar')?.offsetHeight || 70;
          const targetPos = targetEl.offsetTop - navHeight;
          window.scrollTo({
            top: targetPos,
            behavior: 'smooth'
          });
        }
      });
    });
  }

  // ============================================================
  // 6. INITIALIZATION
  // ============================================================
  window.addEventListener('scroll', updateTargetProgress, { passive: true });
  window.addEventListener('resize', resizeCanvas);

  resizeCanvas();
  updateTargetProgress();
  currentProgress = targetProgress;

  preloadImages();
  animate();

  renderProducts();
  setupCategoryTabs();
  setupModals();
  setupNavigation();
})();
