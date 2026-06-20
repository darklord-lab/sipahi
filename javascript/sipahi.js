/* ============================================================
   SIPAHI SPORTS — Main JavaScript (v2 — fully fixed)
   ============================================================ */

'use strict';

/* ── CART ─────────────────────────────────────────────────── */
const Cart = {
  KEY: 'sipahi_cart',
  getItems()  {
    try {
      const items = JSON.parse(localStorage.getItem(this.KEY)) || [];
      return Array.isArray(items) ? items.filter(i => i && i.id) : [];
    } catch {
      return [];
    }
  },
  saveItems(items) { localStorage.setItem(this.KEY, JSON.stringify(items)); this.updateBadge(); },
  getTotalCount() { return this.getItems().reduce((s, i) => s + (i.qty || 1), 0); },

  add(product) {
    const items = this.getItems();
    const key   = `${product.id}-${product.variant || ''}`;
    const found = items.find(i => i.key === key);
    if (found) { found.qty = (found.qty || 1) + 1; }
    else        { items.push({ ...product, key, qty: 1 }); }
    this.saveItems(items);
    Toast.show(`✓ "${product.name}" added to cart!`, 'success');
  },

  remove(key) { this.saveItems(this.getItems().filter(i => i.key !== key)); },

  updateQty(key, qty) {
    const items = this.getItems();
    const item  = items.find(i => i.key === key);
    if (!item) return;
    if (qty < 1) { this.remove(key); return; }
    item.qty = qty;
    this.saveItems(items);
  },

  getSubtotal() { return this.getItems().reduce((s, i) => s + (i.price * (i.qty || 1)), 0); },
  clear()        { localStorage.removeItem(this.KEY); this.updateBadge(); },

  updateBadge() {
    const count = this.getTotalCount();
    document.querySelectorAll('.cart-badge, #cart-count, .cart-badge-flip').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }
};

/* ── WISHLIST ─────────────────────────────────────────────── */
const Wishlist = {
  KEY: 'sipahi_wishlist',
  getItems()  {
    try {
      const items = JSON.parse(localStorage.getItem(this.KEY)) || [];
      return Array.isArray(items) ? items.filter(i => i && i.id) : [];
    } catch {
      return [];
    }
  },
  saveItems(items) { localStorage.setItem(this.KEY, JSON.stringify(items)); this.updateBadge(); },

  isInWishlist(id) { return !!this.getItems().find(i => i.id === id); },

  toggle(product) {
    const items = this.getItems();
    const idx   = items.findIndex(i => i.id === product.id);
    if (idx >= 0) {
      items.splice(idx, 1);
      this.saveItems(items);
      Toast.show('💔 Removed from Wishlist', 'error');
      return false;
    } else {
      items.push(product);
      this.saveItems(items);
      Toast.show('❤️ Added to Wishlist!', 'success');
      return true;
    }
  },

  updateBadge() {
    const count = this.getItems().length;
    document.querySelectorAll('.wishlist-badge, .wishlist-badge-flip').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  },

  clear() {
    localStorage.removeItem(this.KEY);
    this.updateBadge();
  },

  renderPage() {
    const container = document.getElementById('wishlist-items');
    if (!container) return;
    const items = this.getItems();

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🤍</div>
          <h3>Your wishlist is empty</h3>
          <p>Click the ❤️ icon on products to save them to your wishlist!</p>
          <a href="shop-list.html" class="btn btn-primary btn-lg">🏏 Browse Products</a>
        </div>`;
      return;
    }

    let html = '<div class="products-grid">';
    items.forEach(item => {
      html += `
        <div class="product-card" data-product="${item.id}">
          <a href="shop-detail.html?id=${item.id}" class="product-link" aria-label="View ${item.name}"></a>
          <div class="product-img-wrap">
            <button class="product-wishlist active"
              data-product-id="${item.id}"
              data-product-name="${item.name}"
              data-product-price="${item.price}"
              data-product-img="${item.img || ''}"
              aria-label="Remove from wishlist">❤️</button>
            <img src="${item.img || 'images/product/cricket-bat.png'}" alt="${item.name}" loading="lazy">
          </div>
          <div class="product-body">
            <p class="product-brand">SIPAHI</p>
            <h3 class="product-name">${item.name}</h3>
            <div class="product-price">
              <span class="price-now">₹${item.price.toLocaleString('en-IN')}</span>
              ${item.mrp ? `<span class="price-mrp">₹${item.mrp.toLocaleString('en-IN')}</span>` : ''}
            </div>
          </div>
          <div class="product-footer">
            <button class="btn-add-cart"
              data-product-id="${item.id}"
              data-product-name="${item.name}"
              data-product-price="${item.price}"
              data-product-mrp="${item.mrp || item.price}"
              data-product-img="${item.img || ''}">
              🛒 Add to Cart
            </button>
          </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;

    // Re-init buttons
    initAddToCart();
    initWishlist();
  }
};

/* ── TOAST ─────────────────────────────────────────────────── */
const Toast = {
  container: null,
  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'success') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${message}</span>`;
    this.container.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(() => el.remove(), 300);
    }, 2700);
  }
};

/* ── ADD TO CART ─────────────────────────────────────────────── */
function initAddToCart() {
  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    // Remove old listeners by cloning
    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);

    fresh.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();

      const id    = fresh.dataset.productId   || 'p' + Date.now();
      const name  = fresh.dataset.productName  || fresh.closest('[data-product]')?.querySelector('.product-name')?.textContent?.trim() || 'Cricket Product';
      const price = parseInt(fresh.dataset.productPrice  || fresh.closest('[data-product]')?.querySelector('.price-now')?.textContent?.replace(/[^0-9]/g,'') || 0);
      const mrp   = parseInt(fresh.dataset.productMrp    || price);
      const img   = fresh.dataset.productImg   || fresh.closest('[data-product]')?.querySelector('img')?.src || '';

      Cart.add({ id, name, price, mrp, img });

      const orig = fresh.innerHTML;
      fresh.innerHTML = '✓ Added!';
      fresh.style.cssText = 'background:var(--success)!important;color:#fff!important;border-color:var(--success)!important';
      setTimeout(() => { fresh.innerHTML = orig; fresh.style.cssText = ''; }, 1500);
    });
  });
}

/* ── WISHLIST BUTTONS ─────────────────────────────────────── */
function initWishlist() {
  const saved = Wishlist.getItems().map(i => i.id);

  document.querySelectorAll('.product-wishlist').forEach(btn => {
    // Set initial state
    const id = btn.dataset.productId;
    if (id && saved.includes(id)) {
      btn.innerHTML = '❤️';
      btn.classList.add('active');
    } else {
      btn.innerHTML = '🤍';
      btn.classList.remove('active');
    }

    const fresh = btn.cloneNode(true);
    btn.parentNode.replaceChild(fresh, btn);

    // Restore state on fresh
    if (id && saved.includes(id)) {
      fresh.innerHTML = '❤️';
      fresh.classList.add('active');
    } else {
      fresh.innerHTML = '🤍';
      fresh.classList.remove('active');
    }

    fresh.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();
      const id    = fresh.dataset.productId   || 'w' + Date.now();
      const name  = fresh.dataset.productName  || fresh.closest('[data-product]')?.querySelector('.product-name')?.textContent?.trim() || 'Product';
      const price = parseInt(fresh.dataset.productPrice  || 0);
      const mrp   = parseInt(fresh.dataset.productMrp    || price);
      const img   = fresh.dataset.productImg   || fresh.closest('[data-product]')?.querySelector('img')?.src || '';

      const added = Wishlist.toggle({ id, name, price, mrp, img });
      
      // Update all wishlist buttons for this product on the page to stay in sync
      document.querySelectorAll('.product-wishlist').forEach(b => {
        if (b.dataset.productId === id) {
          b.innerHTML = added ? '❤️' : '🤍';
          b.classList.toggle('active', added);
        }
      });

      // If on the wishlist page, re-render the grid reactively
      if (document.getElementById('wishlist-items')) {
        Wishlist.renderPage();
      }
    });
  });

  Wishlist.updateBadge();
}

/* ── HERO CAROUSEL ─────────────────────────────────────────── */
function initCarousel(sel) {
  const container = document.querySelector(sel);
  if (!container) return;
  const track  = container.querySelector('.hero-track');
  const slides = container.querySelectorAll('.hero-slide');
  const prev   = container.querySelector('.carousel-prev');
  const next   = container.querySelector('.carousel-next');
  const dots   = container.querySelector('.carousel-dots');
  if (!track || !slides.length) return;

  let cur = 0, timer;

  if (dots) slides.forEach((_, i) => {
    const d = document.createElement('div');
    d.className = `carousel-dot${i === 0 ? ' active' : ''}`;
    d.addEventListener('click', () => go(i));
    dots.appendChild(d);
  });

  function go(idx) {
    cur = (idx + slides.length) % slides.length;
    track.style.transform = `translateX(-${cur * 100}%)`;
    dots && dots.querySelectorAll('.carousel-dot').forEach((d, i) => d.classList.toggle('active', i === cur));
    clearInterval(timer);
    timer = setInterval(() => go(cur + 1), 4500);
  }

  prev && prev.addEventListener('click', () => go(cur - 1));
  next && next.addEventListener('click', () => go(cur + 1));

  let ts = 0;
  track.addEventListener('touchstart', e => { ts = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend',   e => {
    const diff = ts - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) go(cur + (diff > 0 ? 1 : -1));
  });

  go(0);
}

/* ── STICKY HEADER + SCROLL TOP ─────────────────────────────── */
function initHeader() {
  const hdr   = document.getElementById('site-header');
  const stBtn = document.getElementById('scroll-top');
  if (!hdr) return;
  window.addEventListener('scroll', () => {
    hdr.classList.toggle('scrolled', window.scrollY > 60);
    stBtn && stBtn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  stBtn && stBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── MOBILE NAV ─────────────────────────────────────────────── */
function initMobileNav() {
  const toggle  = document.getElementById('mobile-toggle');
  const nav     = document.getElementById('mobile-nav');
  const overlay = nav?.querySelector('.mobile-nav-overlay');
  const close   = nav?.querySelector('#mobile-nav-close');

  const open  = () => { nav?.classList.add('open'); toggle?.classList.add('open'); document.body.style.overflow = 'hidden'; };
  const close2= () => { nav?.classList.remove('open'); toggle?.classList.remove('open'); document.body.style.overflow = ''; };

  toggle  && toggle.addEventListener('click',  open);
  overlay && overlay.addEventListener('click', close2);
  close   && close.addEventListener('click',   close2);
}

/* ── PRODUCT GALLERY ─────────────────────────────────────────── */
function initGallery() {
  const main   = document.getElementById('gallery-main-img');
  const thumbs = document.querySelectorAll('.gallery-thumb');
  if (!main || !thumbs.length) return;
  main.style.transition = 'opacity 0.15s ease';

  thumbs.forEach(t => {
    t.addEventListener('click', () => {
      const src = t.dataset.src || t.querySelector('img')?.src;
      if (!src) return;
      main.style.opacity = '0';
      setTimeout(() => { main.src = src; main.style.opacity = '1'; }, 150);
      thumbs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
    });
  });
}

/* ── QTY PICKER ─────────────────────────────────────────────── */
function initQtyPicker() {
  document.querySelectorAll('[data-qty-picker]').forEach(p => {
    const inp   = p.querySelector('[data-qty-val]');
    const minus = p.querySelector('[data-qty-minus]');
    const plus  = p.querySelector('[data-qty-plus]');
    if (!inp) return;
    const upd = v => { inp.value = Math.max(1, Math.min(99, v)); };
    minus && minus.addEventListener('click', () => upd(+inp.value - 1));
    plus  && plus.addEventListener('click',  () => upd(+inp.value + 1));
    inp.addEventListener('change', () => upd(+inp.value || 1));
  });
}

/* ── TABS ────────────────────────────────────────────────────── */
function initTabs() {
  document.querySelectorAll('[data-tab-group]').forEach(grp => {
    const btns   = grp.querySelectorAll('[data-tab-btn]');
    const panels = document.querySelectorAll(`[data-tab-panel="${grp.dataset.tabGroup}"]`);
    btns.forEach(btn => btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`[data-tab-panel="${grp.dataset.tabGroup}"][data-tab="${btn.dataset.tabBtn}"]`)?.classList.add('active');
    }));
  });
}

/* ── FILTER SIDEBAR ──────────────────────────────────────────── */
function initFilters() {
  document.querySelectorAll('.filter-group-header').forEach(h => {
    h.addEventListener('click', () => h.closest('.filter-group')?.classList.toggle('open'));
  });
  const chip = document.getElementById('filter-chip');
  const sb   = document.getElementById('filter-sidebar');
  chip && chip.addEventListener('click', () => {
    sb?.classList.toggle('mobile-open');
    chip.classList.toggle('active');
  });
}

/* ── CATEGORY FILTER (URL param) ─────────────────────────────── */
/* ── CATEGORY FILTER (URL param) ─────────────────────────────── */
function applyFilters() {
  const params = new URLSearchParams(window.location.search);
  const cat    = (params.get('cat') || '').toLowerCase();
  const q      = (params.get('q')   || '').toLowerCase();

  // 1. Show/Hide category-specific filter groups in sidebar
  const filterBatType = document.getElementById('filter-bat-type');
  const filterBallType = document.getElementById('filter-ball-type');
  const filterProtectionType = document.getElementById('filter-protection-type');

  if (filterBatType) filterBatType.style.display = (cat === 'bats') ? 'block' : 'none';
  if (filterBallType) filterBallType.style.display = (cat === 'balls') ? 'block' : 'none';
  if (filterProtectionType) {
    filterProtectionType.style.display = (cat === 'protective' || cat === 'pads' || cat === 'gloves' || cat === 'helmets') ? 'block' : 'none';
  }

  // 2. Gather all checked filters
  const selectedBats = Array.from(document.querySelectorAll('[data-filter-bat]:checked')).map(el => el.getAttribute('data-filter-bat'));
  const selectedBalls = Array.from(document.querySelectorAll('[data-filter-ball]:checked')).map(el => el.getAttribute('data-filter-ball'));
  const selectedProts = Array.from(document.querySelectorAll('[data-filter-prot]:checked')).map(el => el.getAttribute('data-filter-prot'));
  const selectedDiscounts = Array.from(document.querySelectorAll('[data-filter-discount]:checked')).map(el => parseFloat(el.getAttribute('data-filter-discount')));
  const selectedRatings = Array.from(document.querySelectorAll('[data-filter-rating]:checked')).map(el => parseFloat(el.getAttribute('data-filter-rating')));

  // Price range values
  const priceMinInput = document.getElementById('price-min');
  const priceMaxInput = document.getElementById('price-max');
  const minPrice = priceMinInput ? (parseFloat(priceMinInput.value) || 0) : 0;
  const maxPrice = priceMaxInput ? (parseFloat(priceMaxInput.value) || 10000) : 10000;

  // 3. Filter cards
  const cards = document.querySelectorAll('.product-card[data-category]');
  if (!cards.length) return;

  let visible = 0;

  cards.forEach(card => {
    const pId = card.getAttribute('data-product');
    const prod = PRODUCTS[pId];
    if (!prod) return;

    let show = true;

    // A. Filter by URL Category
    const cardCat = prod.category.toLowerCase();
    if (cat && cat !== 'all') {
      if (cat === 'protective') {
        show = cardCat.includes('protective') || cardCat.includes('helmet') || cardCat.includes('glove') || cardCat.includes('pad') || cardCat.includes('thigh') || cardCat.includes('elbow');
      } else {
        show = cardCat.includes(cat);
      }
    }

    // B. Filter by URL search query
    if (q) {
      const cardName = prod.name.toLowerCase();
      show = show && cardName.includes(q);
    }

    // C. Filter by Bat Type (only if category is bats and any bat checkbox is checked)
    if (show && cat === 'bats' && selectedBats.length > 0) {
      let batMatch = false;
      const nameLower = prod.name.toLowerCase();
      const specWillow = (prod.specs && prod.specs['Willow Type'] || '').toLowerCase();
      
      selectedBats.forEach(type => {
        if (type === 'english' && (specWillow.includes('english') || nameLower.includes('english'))) batMatch = true;
        if (type === 'kashmir' && (specWillow.includes('kashmir') || nameLower.includes('kashmir'))) batMatch = true;
        if (type === 'tennis' && nameLower.includes('tennis')) batMatch = true;
        if (type === 'kids' && (nameLower.includes('kids') || nameLower.includes('junior'))) batMatch = true;
      });
      show = show && batMatch;
    }

    // D. Filter by Ball Type (only if category is balls and any ball checkbox is checked)
    if (show && cat === 'balls' && selectedBalls.length > 0) {
      let ballMatch = false;
      const nameLower = prod.name.toLowerCase();
      
      selectedBalls.forEach(type => {
        if (type === 'leather' && nameLower.includes('leather')) ballMatch = true;
        if (type === 'tennis' && nameLower.includes('tennis')) ballMatch = true;
      });
      show = show && ballMatch;
    }

    // E. Filter by Protection Type (only if category is protective or subcategories and any protection checkbox is checked)
    if (show && (cat === 'protective' || cat === 'pads' || cat === 'gloves' || cat === 'helmets') && selectedProts.length > 0) {
      let protMatch = false;
      
      selectedProts.forEach(type => {
        if (type === 'helmet' && cardCat.includes('helmet')) protMatch = true;
        if (type === 'pads' && cardCat.includes('pad')) protMatch = true;
        if (type === 'gloves' && cardCat.includes('glove')) protMatch = true;
        if (type === 'guards' && (cardCat.includes('thigh') || cardCat.includes('elbow') || cardCat.includes('guard'))) protMatch = true;
      });
      show = show && protMatch;
    }

    // F. Filter by Price Range
    if (show) {
      const price = prod.price;
      show = price >= minPrice && price <= maxPrice;
    }

    // G. Filter by Discount
    if (show && selectedDiscounts.length > 0) {
      const discount = Math.round(((prod.mrp - prod.price) / prod.mrp) * 100);
      let discMatch = false;
      selectedDiscounts.forEach(minDisc => {
        if (discount >= minDisc) discMatch = true;
      });
      show = show && discMatch;
    }

    // H. Filter by Rating
    if (show && selectedRatings.length > 0) {
      const ratingVal = parseFloat(prod.rating);
      let ratingMatch = false;
      selectedRatings.forEach(minRating => {
        if (ratingVal >= minRating) ratingMatch = true;
      });
      show = show && ratingMatch;
    }

    card.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  // Update count
  const countEl = document.querySelector('.listing-count strong');
  if (countEl) countEl.textContent = visible;

  // Show/hide empty state
  const grid = document.querySelector('.products-grid');
  const emptyEl = document.getElementById('filter-empty-state');
  if (visible === 0) {
    if (!emptyEl && grid) {
      const emptyDiv = document.createElement('div');
      emptyDiv.id = 'filter-empty-state';
      emptyDiv.className = 'empty-state';
      emptyDiv.style.gridColumn = '1/-1';
      emptyDiv.innerHTML = `
        <div class="empty-state-icon">🏏</div>
        <h3>No products found</h3>
        <p>No products match your active filters.</p>
        <button class="btn btn-primary" onclick="clearFilters()">Reset Filters</button>
      `;
      grid.appendChild(emptyDiv);
    }
  } else {
    if (emptyEl) emptyEl.remove();
  }
}

window.clearFilters = function() {
  document.querySelectorAll('.filter-sidebar input[type="checkbox"]').forEach(cb => cb.checked = false);
  const priceRange = document.getElementById('price-range');
  const priceMin = document.getElementById('price-min');
  const priceMax = document.getElementById('price-max');
  if (priceRange) priceRange.value = 10000;
  if (priceMin) priceMin.value = 0;
  if (priceMax) priceMax.value = 10000;
  applyFilters();
};

function initCategoryFilter() {
  const params = new URLSearchParams(window.location.search);
  const cat    = (params.get('cat') || '').toLowerCase();

  // Setup UI elements (Title, highlights, etc.)
  const titleEl = document.querySelector('.listing-title');
  if (titleEl && cat) {
    const labels = {
      bats: '🏏 Cricket Bats', balls: '⚾ Cricket Balls',
      pads: '🦺 Batting Pads', gloves: '🧤 Batting Gloves',
      helmets: '⛑️ Cricket Helmets', bags: '🎒 Cricket Bags',
      accessories: '🔧 Accessories', kids: '👦 Kids Cricket',
      protective: '🛡️ Protective Gear'
    };
    titleEl.textContent = labels[cat] || 'All Cricket Products';
  }

  // Highlight filter chips
  document.querySelectorAll('[data-cat]').forEach(el => {
    el.classList.toggle('active', el.dataset.cat === cat);
  });

  // Highlight sub-nav
  const path = window.location.pathname;
  const isHome = path.endsWith('index.html') || path.endsWith('/');
  document.querySelectorAll('.sub-nav-list-flip a, .sub-nav-list a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (cat) {
      a.classList.toggle('active', href.includes(`cat=${cat}`));
    } else {
      if (isHome) {
        a.classList.toggle('active', href === 'index.html');
      } else {
        a.classList.toggle('active', path.includes(href) && href !== 'index.html');
      }
    }
  });

  // Setup Event Listeners for Filters
  const sidebar = document.querySelector('.filter-sidebar');
  if (sidebar) {
    // Checkboxes change
    sidebar.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', applyFilters);
    });

    // Price range sync & change
    const priceRange = document.getElementById('price-range');
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');

    if (priceRange && priceMax) {
      priceRange.addEventListener('input', () => {
        priceMax.value = priceRange.value;
        applyFilters();
      });
      priceMax.addEventListener('input', () => {
        priceRange.value = priceMax.value;
        applyFilters();
      });
    }
    if (priceMin) {
      priceMin.addEventListener('input', applyFilters);
    }
  }

  // Run initial filtering
  applyFilters();
}

/* ── VARIANT BUTTONS ─────────────────────────────────────────── */
function initVariants() {
  document.querySelectorAll('.variant-options').forEach(grp => {
    grp.querySelectorAll('.variant-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        grp.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  });
}

/* ── CART PAGE ───────────────────────────────────────────────── */
function initCartPage() {
  const container = document.getElementById('cart-items');
  const summaryEl = document.getElementById('cart-summary');
  if (!container) return;

  function renderCart() {
    const items = Cart.getItems();
    if (!items.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🛒</div>
          <h3>Your cart is empty</h3>
          <p>You haven't added anything yet. Start shopping!</p>
          <a href="shop-list.html" class="btn btn-primary btn-lg">🏏 Browse Cricket Products</a>
        </div>`;
      if (summaryEl) summaryEl.style.display = 'none';
      return;
    }
    if (summaryEl) summaryEl.style.display = '';

    let html = `<table class="cart-table">
      <thead><tr>
        <th colspan="2">Product</th>
        <th class="hide-mobile">Price</th>
        <th>Qty</th>
        <th>Total</th>
        <th></th>
      </tr></thead><tbody>`;

    items.forEach(item => {
      const line = item.price * (item.qty || 1);
      html += `<tr data-key="${item.key}">
        <td style="width:80px"><img class="cart-item-img" src="${item.img || 'images/product/cricket-bat.png'}" alt="${item.name}"></td>
        <td>
          <div class="cart-item-name">${item.name}</div>
          ${item.variant ? `<div class="cart-item-variant">${item.variant}</div>` : ''}
        </td>
        <td class="hide-mobile">₹${item.price.toLocaleString('en-IN')}</td>
        <td>
          <div class="cart-qty-picker">
            <button class="qty-btn" data-action="minus">−</button>
            <input type="number" value="${item.qty||1}" min="1" max="99" data-key="${item.key}">
            <button class="qty-btn" data-action="plus">+</button>
          </div>
        </td>
        <td><strong>₹${line.toLocaleString('en-IN')}</strong></td>
        <td><button class="cart-remove" data-remove="${item.key}" title="Remove">✕</button></td>
      </tr>`;
    });
    html += `</tbody></table>`;
    container.innerHTML = html;

    container.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => { Cart.remove(btn.dataset.remove); renderCart(); updateSummary(); });
    });
    container.querySelectorAll('.cart-qty-picker').forEach(picker => {
      const inp = picker.querySelector('input');
      picker.querySelector('[data-action="minus"]').addEventListener('click', () => { Cart.updateQty(inp.dataset.key, +inp.value - 1); renderCart(); updateSummary(); });
      picker.querySelector('[data-action="plus"]').addEventListener('click',  () => { Cart.updateQty(inp.dataset.key, +inp.value + 1); renderCart(); updateSummary(); });
      inp.addEventListener('change', () => { Cart.updateQty(inp.dataset.key, +inp.value || 1); renderCart(); updateSummary(); });
    });

    updateSummary();
  }

  function updateSummary() {
    const sub     = Cart.getSubtotal();
    const ship    = sub >= 999 ? 0 : 99;
    const total   = sub + ship;
    const savings = Cart.getItems().reduce((s, i) => s + ((i.mrp||i.price) - i.price) * (i.qty||1), 0);

    const $ = id => document.getElementById(id);
    if ($('sum-subtotal')) $('sum-subtotal').textContent = `₹${sub.toLocaleString('en-IN')}`;
    if ($('sum-shipping')) $('sum-shipping').textContent = ship === 0 ? 'FREE 🎉' : `₹${ship}`;
    if ($('sum-total'))    $('sum-total').textContent    = `₹${total.toLocaleString('en-IN')}`;
    if ($('sum-savings') && savings > 0) {
      $('sum-savings').textContent = `🎉 Aap ₹${savings.toLocaleString('en-IN')} bacha rahe hain!`;
      $('sum-savings').style.display = '';
    }
  }

  renderCart();
}

/* ── CHECKOUT PAGE ───────────────────────────────────────────── */
function initCheckoutPage() {
  // Populate order summary
  const items = Cart.getItems();
  const box   = document.getElementById('checkout-items');
  if (box && items.length) {
    let html = '';
    items.forEach(i => {
      html += `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border-light)">
        <img src="${i.img||'images/product/cricket-bat.png'}" style="width:48px;height:48px;object-fit:contain;background:var(--bg);border-radius:4px;padding:2px">
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${i.name}</div>
          <div style="font-size:11px;color:var(--text-muted)">Qty: ${i.qty||1}</div>
        </div>
        <div style="font-size:13px;font-weight:700">₹${(i.price*(i.qty||1)).toLocaleString('en-IN')}</div>
      </div>`;
    });
    box.innerHTML = html;
    const sub  = Cart.getSubtotal();
    const ship = sub >= 999 ? 0 : 99;
    const $    = id => document.getElementById(id);
    if ($('co-subtotal')) $('co-subtotal').textContent = `₹${sub.toLocaleString('en-IN')}`;
    if ($('co-shipping')) $('co-shipping').textContent = ship === 0 ? 'FREE 🎉' : `₹${ship}`;
    if ($('co-total'))    $('co-total').textContent    = `₹${(sub+ship).toLocaleString('en-IN')}`;
  }
}

/* ── CHECKOUT FORM ───────────────────────────────────────────── */
function initCheckoutForm() {
  const form = document.getElementById('checkout-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    Toast.show('🎉 Order placed successfully! Your cricket equipment will arrive soon!', 'success');
    Cart.clear();
    setTimeout(() => { window.location.href = 'index.html'; }, 2800);
  });
}

/* ── CONTACT FORM ────────────────────────────────────────────── */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', e => {
    e.preventDefault();
    Toast.show('✓ Message sent successfully! We will get back to you within 24 hours.', 'success');
    form.reset();
  });
}

/* ── SEARCH ──────────────────────────────────────────────────── */
function initSearch() {
  document.querySelectorAll('#header-search, #mobile-search').forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const q = inp.value.trim();
        if (q) window.location.href = `shop-list.html?q=${encodeURIComponent(q)}`;
      }
    });
  });
  document.querySelectorAll('.header-search-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const inp = btn.closest('.header-search')?.querySelector('input');
      const q   = inp?.value.trim();
      if (q) window.location.href = `shop-list.html?q=${encodeURIComponent(q)}`;
    });
  });
  document.querySelectorAll('.header-search-icon').forEach(icon => {
    icon.style.cursor = 'pointer';
    icon.addEventListener('click', () => {
      const inp = icon.closest('.header-search-wrapper')?.querySelector('input');
      const q   = inp?.value.trim();
      if (q) window.location.href = `shop-list.html?q=${encodeURIComponent(q)}`;
    });
  });
}

/* ── LOCATION SELECTOR ───────────────────────────────────────── */
function initLocationSelector() {
  const locBtn = document.getElementById('select-loc-btn');
  const locText = document.getElementById('header-loc-text');
  if (locBtn && locText) {
    locBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const pincode = prompt("Enter your Delivery Pincode:");
      if (pincode && pincode.trim().length === 6 && !isNaN(pincode)) {
        locText.textContent = `Deliver to: ${pincode.trim()}`;
        locBtn.textContent = "Change location";
        localStorage.setItem('sipahi_pincode', pincode.trim());
        if (window.Toast) {
          Toast.show(`Location updated to ${pincode.trim()}`, 'success');
        }
      } else if (pincode) {
        alert("Please enter a valid 6-digit Pincode.");
      }
    });

    const savedPin = localStorage.getItem('sipahi_pincode');
    if (savedPin) {
      locText.textContent = `Deliver to: ${savedPin}`;
      locBtn.textContent = "Change location";
    }
  }
}

/* ── PAYMENT OPTION SELECT ───────────────────────────────────── */
function initPayment() {
  document.querySelectorAll('.payment-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      const r = opt.querySelector('input[type=radio]');
      if (r) r.checked = true;
    });
  });
}

/* ── FILTER CHIP TABS (shop-list) ────────────────────────────── */
function initFilterChips() {
  document.querySelectorAll('[data-cat]').forEach(chip => {
    chip.addEventListener('click', () => {
      const cat = chip.dataset.cat;
      // Navigate with param
      window.location.href = `shop-list.html${cat === 'all' ? '' : `?cat=${cat}`}`;
    });
  });
}

/* ── PRODUCT DATABASE ───────────────────────────────────────── */
const PRODUCTS = {
  p1: {
    id: "p1",
    name: "Sipahi Premium English Willow Cricket Bat — Grade A",
    price: 3499,
    mrp: 4999,
    img: "images/product/cricket-bat.png",
    category: "bats",
    rating: "4.9",
    reviews: "340 reviews",
    ratings_count: "2,100 ratings",
    description: "The Sipahi Premium English Willow Cricket Bat (Grade A) is crafted from hand-picked Grade A English willow. Perfect for serious cricketers seeking excellent stroke play, power, and long-lasting durability. Featuring thick edges and a high spine, its modern profile is suitable for all formats.",
    features: [
      "Grade A English Willow — 6+ grains, superior performance",
      "Factory fitted with toe guard & anti-scuff sheet",
      "Thick edges (38-40mm) and deep middle profile",
      "Pre-treated with linseed oil, ready to play"
    ],
    specs: {
      "Brand": "Sipahi Sports",
      "Willow Type": "Grade A English Willow",
      "Size": "Full Size (Short Handle)",
      "Weight": "1.15 - 1.2 kg",
      "Handle Type": "9-piece Singapore Cane",
      "Warranty": "1 Year Manufacturer Warranty"
    }
  },
  p2: {
    id: "p2",
    name: "Sipahi Tournament Leather Cricket Ball — Red",
    price: 649,
    mrp: 899,
    img: "images/product/cricket-ball.png",
    category: "balls",
    rating: "4.7",
    reviews: "220 reviews",
    ratings_count: "1,400 ratings",
    description: "Premium quality alum-tanned leather ball designed for club and tournament matches. Features a hand-stitched seam and high-quality cork center for consistent swing and shape retention over long innings.",
    features: [
      "Alum-tanned premium leather cover",
      "Hand-stitched (80-82 stitches) for perfect shape retention",
      "4-piece construction with premium cork core",
      "Waterproof coating for damp conditions"
    ],
    specs: {
      "Brand": "Sipahi Sports",
      "Material": "Premium Leather",
      "Weight": "156 - 160g (Standard)",
      "Type": "4-piece construction",
      "Color": "Red",
      "Usage": "Professional Club Matches"
    }
  },
  p3: {
    id: "p3",
    name: "Sipahi ABS Cricket Helmet with Steel Grill — ISI Certified",
    price: 1799,
    mrp: 2499,
    img: "images/product/cricket-helmet.png",
    category: "protective helmets",
    rating: "4.4",
    reviews: "110 reviews",
    ratings_count: "652 ratings",
    description: "The Sipahi ABS Cricket Helmet provides ultimate protection and comfort during matches. Its high-impact resistant ABS shell and steel grill ensure professional-level safety against fast bowling.",
    features: [
      "High-impact ABS outer shell with EPS liner",
      "Adjustable steel grill for clear vision and safety",
      "Rear dial adjustment system for a secure fit",
      "Sweat-absorbent padding inside"
    ],
    specs: {
      "Brand": "Sipahi Sports",
      "Shell Material": "ABS Shell",
      "Grill Material": "Stainless Steel",
      "Certification": "ISI Certified",
      "Size": "Adjustable (Medium/Large)",
      "Ventilation": "12 Air Vents"
    }
  },
  p4: {
    id: "p4",
    name: "Sipahi Premium Leather Batting Gloves — Men's",
    price: 649,
    mrp: 999,
    img: "images/product/cricket-gloves.png",
    category: "protective gloves",
    rating: "4.5",
    reviews: "190 reviews",
    ratings_count: "820 ratings",
    description: "Premium leather batting gloves featuring a genuine sheep leather palm for maximum grip and flexibility. High-density foam padding provides elite shock absorption and finger protection.",
    features: [
      "Premium sheep leather palm for maximum grip",
      "High-density foam protection in fingers",
      "Airflow mesh inserts for ventilation",
      "Double-sided sweatband for comfort"
    ],
    specs: {
      "Brand": "Sipahi Sports",
      "Palm Material": "Genuine Sheep Leather",
      "Padding": "High Density EVA Foam",
      "Size": "Adult (Men's)",
      "Side": "Right Hand / Left Hand options",
      "Weight": "280g (Pair)"
    }
  },
  p5: {
    id: "p5",
    name: "Sipahi Pro Batting Pads — EVA Foam, White, Size M/L",
    price: 999,
    mrp: 1399,
    img: "images/product/cricket-pads.png",
    category: "protective pads",
    rating: "4.3",
    reviews: "95 reviews",
    ratings_count: "544 ratings",
    description: "Sipahi Pro Batting Pads feature lightweight EVA foam padding and cane ribs. Designed for optimal shock absorption and comfort against spin and pace alike, without restricting movement.",
    features: [
      "Ultra-lightweight EVA foam padding",
      "Three-piece knee roll for natural wrap and movement",
      "Durable PVC face for easy cleaning",
      "Comfortable mesh straps with secure velcro"
    ],
    specs: {
      "Brand": "Sipahi Sports",
      "Facing Material": "Premium PVC",
      "Inner Core": "EVA Foam & Cane Ribs",
      "Size": "Men's Standard (Size M/L)",
      "Weight": "1.3 kg (Pair)",
      "Straps": "3 Adjustable Velcro Straps"
    }
  },
  p6: {
    id: "p6",
    name: "Sipahi Pro Cricket Kit Bag — Wheels + Shoulder Strap",
    price: 1499,
    mrp: 1999,
    img: "images/product/cricket-bag.png",
    category: "bags",
    rating: "4.6",
    reviews: "150 reviews",
    ratings_count: "780 ratings",
    description: "A spacious cricket kit bag designed to fit your entire gear set (bat, pads, helmet, gloves, shoes). Equipped with heavy-duty tractor wheels and padded shoulder straps for easy transport.",
    features: [
      "Premium 1680D nylon heavy-duty construction",
      "2 large tractor wheels for easy transport",
      "Dedicated external pocket for cricket bats",
      "Padded shoulder straps for dual-mode carrying"
    ],
    specs: {
      "Brand": "Sipahi Sports",
      "Material": "1680D Heavy Duty Polyester",
      "Dimensions": "90 x 35 x 35 cm",
      "Compartments": "1 Main + 2 Side Pockets",
      "Wheels": "Dual Heavy-Duty Wheels",
      "Volume": "110 Liters"
    }
  },
  p7: {
    id: "p7",
    name: "Sipahi T20 White Leather Cricket Ball — Hand-Stitched",
    price: 499,
    mrp: 699,
    img: "images/product/cricket-ball-white.png",
    category: "balls",
    rating: "4.6",
    reviews: "310 reviews",
    ratings_count: "2,400 ratings",
    description: "Tournament-grade white leather cricket ball designed for T20 and limited-overs matches. Features premium tanned leather and hand-stitched seam for superior visibility and consistent flight under lights.",
    features: [
      "Premium white tanned leather for day-night matches",
      "Hand-stitched using high-quality linen thread",
      "Compressed cork and rubber core for perfect bounce",
      "Optimal hardness for fast bowling pace"
    ],
    specs: {
      "Brand": "Sipahi Sports",
      "Color": "White",
      "Material": "Alum-Tanned Leather",
      "Weight": "156g",
      "Core": "5-layer cork and rubber core",
      "Stitches": "82 Hand Stitches"
    }
  },
  p8: {
    id: "p8",
    name: "Sipahi Kashmir Willow Cricket Bat — Full Size, Affordable",
    price: 1299,
    mrp: 1899,
    img: "images/product/cricket-bat-kw.png",
    category: "bats",
    rating: "4.5",
    reviews: "180 reviews",
    ratings_count: "1,200 ratings",
    description: "Sipahi Kashmir Willow Cricket Bat is a full-size, lightweight bat designed for club and practice sessions. Offers a robust sweet spot and great value for developing players.",
    features: [
      "Select Kashmir willow wood",
      "Full size with round short cane handle",
      "Pre-knocked and ready for tennis/leather balls",
      "Excellent shock absorption grip fitted"
    ],
    specs: {
      "Brand": "Sipahi Sports",
      "Willow Type": "Kashmir Willow",
      "Size": "Full Size (Men's)",
      "Weight": "1.2 - 1.25 kg",
      "Handle Type": "Cane Handle",
      "Sweet Spot": "Mid-to-low profile"
    }
  },
  p9: {
    id: "p9",
    name: "Sipahi Cricket Thigh Guard — Foam Padded, Right Hand",
    price: 399,
    mrp: 599,
    img: "images/product/cricket-thigh.png",
    category: "protective accessories",
    rating: "4.3",
    reviews: "75 reviews",
    ratings_count: "390 ratings",
    description: "Sipahi Cricket Thigh Guard offers dual protection for both inner and outer thigh against high-velocity deliveries. Its contoured, lightweight design ensures complete freedom of movement while running.",
    features: [
      "Dual density foam sheet for solid protection",
      "Comfort towel backing on inside",
      "Wide elastic straps with soft touch velcro",
      "Pre-curved shape for body hugging fit"
    ],
    specs: {
      "Brand": "Sipahi Sports",
      "Type": "Dual Thigh Guard Combo",
      "Material": "EVA Foam & Lycra Cover",
      "Orientation": "Right-Handed Batsman",
      "Size": "Adult Standard",
      "Thickness": "15mm"
    }
  },
  p10: {
    id: "p10",
    name: "Sipahi Wooden Cricket Stumps Set — 3 Stumps + 2 Bails",
    price: 549,
    mrp: 799,
    img: "images/product/cricket-stumps.png",
    category: "accessories",
    rating: "4.4",
    reviews: "92 reviews",
    ratings_count: "670 ratings",
    description: "Varnished hard-wood cricket stumps set. Weather-resistant, durable, and perfect for school matches, club tournaments, and outdoor training sessions.",
    features: [
      "Made of seasoned hardwood for strength",
      "Polished shiny finish for premium look",
      "Traditional dimensions as per ICC guidelines",
      "Comes with 3 stumps and 2 matching bails"
    ],
    specs: {
      "Brand": "Sipahi Sports",
      "Material": "Eucalyptus Hardwood",
      "Height": "28 inches (standard)",
      "Contents": "3 Stumps, 2 Bails",
      "Finish": "Clear Varnish Coat",
      "Weight": "1.5 kg (Total)"
    }
  },
  p11: {
    id: "p11",
    name: "Sipahi Wicketkeeper Gloves — Pro Series, Leather Palm",
    price: 899,
    mrp: 1299,
    img: "images/product/cricket-keeper.png",
    category: "protective gloves",
    rating: "4.6",
    reviews: "82 reviews",
    ratings_count: "510 ratings",
    description: "Professional wicket-keeping gloves featuring heavy-duty grip rubber and padded cuffs. Designed to provide maximum protection and secure catching support behind the stumps.",
    features: [
      "Real leather palm with rubber pimple grip sheet",
      "Padded cuff protection with web between thumb & finger",
      "High density foam in back hand for impact safety",
      "Perfect ventilation holes for sweat-free games"
    ],
    specs: {
      "Brand": "Sipahi Sports",
      "Type": "Wicketkeeper Gloves",
      "Palm": "Genuine Leather + Pimpled Rubber",
      "Cuff": "Padded Leather",
      "Size": "Men's Standard",
      "Color": "Navy Blue & Gold"
    }
  },
  p12: {
    id: "p12",
    name: "Sipahi Cricket Batting Shoes — White Spikes, Professional",
    price: 1799,
    mrp: 2499,
    img: "images/product/cricket-shoes.png",
    category: "accessories",
    rating: "4.8",
    reviews: "210 reviews",
    ratings_count: "1,020 ratings",
    description: "Premium spikes batting shoes designed for superior traction on both turf and pitch surfaces. Featuring cushioned midsoles and breathable mesh for maximum comfort during long innings.",
    features: [
      "Breathable mesh upper with synthetic leather overlays",
      "Cushioned EVA midsole for shock absorption",
      "Removable metal/rubber spikes sole",
      "Reinforced toe area for protection while running"
    ],
    specs: {
      "Brand": "Sipahi Sports",
      "Upper": "PU Leather & Breathable Mesh",
      "Sole": "TPU Sole with metal spikes",
      "Size": "UK 6 - UK 11 available",
      "Weight": "680g (Pair, Size 8)",
      "Closure": "Lace-up"
    }
  },
  p13: {
    id: "p13",
    name: "Sipahi Cricket Elbow Guard — Hard Shell + Foam Inner",
    price: 299,
    mrp: 449,
    img: "images/product/cricket-elbow.png",
    category: "protective accessories",
    rating: "4.2",
    reviews: "45 reviews",
    ratings_count: "290 ratings",
    description: "Sipahi Contoured Elbow Guard protects the batsman's forearm from injuries against short-pitched bouncing deliveries. Its adjustable straps ensure a secure, customized fit.",
    features: [
      "Contoured hard shell outer layer",
      "Soft padded foam lining for impact damping",
      "Dual elastic straps with adjustable velcro hook",
      "Extremely light weight, does not restrict hand movement"
    ],
    specs: {
      "Brand": "Sipahi Sports",
      "Material": "ABS Plastic + EVA Foam",
      "Type": "Elbow Guard",
      "Size": "Standard Adult Size",
      "Color": "White",
      "Straps": "2 Elastic Velcro Straps"
    }
  },
  p14: {
    id: "p14",
    name: "Sipahi Kids Cricket Bat — Poplar Wood, Size 4, Age 8–12",
    price: 499,
    mrp: 699,
    img: "images/product/cricket-bat-kw.png",
    category: "bats kids",
    rating: "4.2",
    reviews: "56 reviews",
    ratings_count: "390 ratings",
    description: "Junior cricket bat made from lightweight poplar wood, perfect for kids and beginners learning the game. Light handle weight allows easy stroke play and control.",
    features: [
      "Poplar wood construction - super light weight",
      "Rubber sleeve handle for good grip",
      "Ideal for soft tennis ball and wind balls",
      "Fitted with cool Sipahi stickers"
    ],
    specs: {
      "Brand": "Sipahi Sports",
      "Wood": "Poplar Wood",
      "Size": "Size 4 (ideal for height 4'6\" - 4'9\")",
      "Age Group": "8-12 Years",
      "Weight": "750 - 800g",
      "Handle": "Short Cane Handle"
    }
  },
  p15: {
    id: "p15",
    name: "Sipahi Cricket Tennis Ball — Pack of 12, Heavy Weight",
    price: 349,
    mrp: 499,
    img: "images/product/cricket-ball.png",
    category: "balls",
    rating: "4.5",
    reviews: "60 reviews",
    ratings_count: "340 ratings",
    description: "Heavyweight tennis cricket balls designed for outdoor tournament play. Made from high-quality felt for standard bounce and durable performance.",
    features: [
      "Premium heavy weight wool felt covering",
      "Perfect bounce and consistent flight trajectory",
      "Bright color for day-night visibility",
      "Contains 12 balls in a net pack"
    ],
    specs: {
      "Brand": "Sipahi Sports",
      "Type": "Heavy Tennis Ball (Cricket)",
      "Pack": "12 Balls Pack",
      "Color": "Fluorescent Yellow/Green",
      "Weight": "110g per ball",
      "Bounce": "Consistent 130-140cm"
    }
  },
  p16: {
    id: "p16",
    name: "Sipahi Cricket Bat Grip — Octopus, Pack of 3",
    price: 149,
    mrp: 249,
    img: "images/product/cricket-bat.png",
    category: "accessories",
    rating: "4.7",
    reviews: "320 reviews",
    ratings_count: "1,800 ratings",
    description: "Premium octopus-pattern rubber cricket bat grips for superior handle feel and shock absorption. Pack of 3 grips in assorted colors.",
    features: [
      "High quality vulcanized rubber compound",
      "Octopus bubble design for non-slip batting control",
      "Standard length suitable for all full-size handles",
      "Pack of 3 grips in vibrant colors"
    ],
    specs: {
      "Brand": "Sipahi Sports",
      "Material": "Rubber",
      "Pattern": "Octopus Pimpled",
      "Contents": "Pack of 3 Grips",
      "Durability": "Long-lasting under sweat",
      "Installation": "Compatible with cup applicator"
    }
  }
};

/* ── PRODUCT CUSTOMIZATION ───────────────────────────────────── */
function initProductCustomization() {
  const btnCustomize = document.getElementById('btn-customize-bat');
  const modal = document.getElementById('customize-modal');
  const closeBtn = document.getElementById('close-customize-modal');
  const form = document.getElementById('customize-form');

  if (!btnCustomize || !modal || !form) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || 'p1';
  const prod = PRODUCTS[id];

  // Only show the customization button for bats
  if (prod && prod.category.toLowerCase().includes('bats')) {
    btnCustomize.style.display = 'flex';
    const parentContainer = btnCustomize.parentElement;
    if (parentContainer) parentContainer.style.display = 'block';
  } else {
    btnCustomize.style.display = 'none';
    const parentContainer = btnCustomize.parentElement;
    if (parentContainer) parentContainer.style.display = 'none';
    return;
  }

  const baseProductPrice = prod ? prod.price : 3499;

  // Open Modal
  btnCustomize.addEventListener('click', (e) => {
    e.preventDefault();
    modal.classList.add('open');
  });

  // Close Modal
  const closeModal = () => modal.classList.remove('open');
  closeBtn && closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Submit customization form
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const customText = document.getElementById('custom-text')?.value?.trim() || '';

    // If customization text is empty, reset customization display and button attributes
    if (!customText) {
      // Reset display price
      const priceNowEl = document.querySelector('.detail-price-now');
      if (priceNowEl) {
        priceNowEl.textContent = `₹${baseProductPrice.toLocaleString('en-IN')}`;
      }

      // Hide Customization Summary
      const summaryBox = document.getElementById('customization-summary');
      if (summaryBox) {
        summaryBox.style.display = 'none';
      }

      // Reset Add to Cart Button dataset attributes
      const addCartBtn = document.getElementById('detail-add-cart');
      if (addCartBtn) {
        addCartBtn.dataset.productPrice = baseProductPrice;
        addCartBtn.dataset.productName = prod ? prod.name : "Sipahi Premium English Willow Cricket Bat Grade A";
      }

      closeModal();
      return;
    }

    const finalPrice = baseProductPrice;

    // Update display price on details page
    const priceNowEl = document.querySelector('.detail-price-now');
    if (priceNowEl) {
      priceNowEl.textContent = `₹${finalPrice.toLocaleString('en-IN')}`;
    }

    // Show Customization Summary
    const summaryBox = document.getElementById('customization-summary');
    const summaryText = document.getElementById('custom-details-text');
    if (summaryBox && summaryText) {
      summaryText.textContent = customText;
      summaryBox.style.display = 'block';
    }

    // Update Add to Cart Button dataset attributes
    const addCartBtn = document.getElementById('detail-add-cart');
    if (addCartBtn) {
      addCartBtn.dataset.productPrice = finalPrice;
      
      let baseName = prod ? prod.name : "Sipahi Premium English Willow Cricket Bat Grade A";
      let customSuffix = ` (${customText})`;
      addCartBtn.dataset.productName = baseName + customSuffix;
    }

    // Close Modal and show toast feedback
    closeModal();
    if (window.Toast) {
      Toast.show("✓ Customization settings applied!", "success");
    }
  });
}

/* ── DETAIL PAGE ADD TO CART ─────────────────────────────────── */
function initDetailCart() {
  const btn = document.getElementById('detail-add-cart');
  if (!btn) return;
  btn.addEventListener('click', e => {
    e.preventDefault();
    const qty   = +(document.querySelector('[data-qty-val]')?.value || 1);
    const id    = btn.dataset.productId   || 'detail-1';
    const name  = btn.dataset.productName  || document.querySelector('.detail-name')?.textContent?.trim() || 'Cricket Product';
    const price = parseInt(btn.dataset.productPrice  || document.querySelector('.detail-price-now')?.textContent?.replace(/[^0-9]/g,'') || 0);
    const mrp   = parseInt(btn.dataset.productMrp    || document.querySelector('.detail-price-mrp')?.textContent?.replace(/[^0-9]/g,'') || price);
    const img   = btn.dataset.productImg   || document.getElementById('gallery-main-img')?.src || '';

    for (let i = 0; i < qty; i++) Cart.add({ id, name, price, mrp, img });

    btn.innerHTML = '✓ Added to Cart!';
    btn.style.cssText = 'background:var(--success)!important;border-color:var(--success)!important';
    setTimeout(() => { btn.innerHTML = '🛒 Add to Cart'; btn.style.cssText = ''; }, 2000);
  });
}

/* ── DETAIL PAGE DYNAMIC LOADER ───────────────────────────────── */
function initProductDetailPage() {
  if (!window.location.pathname.includes('shop-detail.html')) return;
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || 'p1';
  const prod = PRODUCTS[id];
  if (!prod) return;

  // Update product container id for consistency
  const container = document.querySelector('.detail-info');
  if (container) container.dataset.product = prod.id;

  // 1. Update Title and Breadcrumb
  document.title = `${prod.name} — Sipahi Sports`;
  const nameEl = document.querySelector('.detail-name');
  if (nameEl) nameEl.textContent = prod.name;
  
  const breadcrumbCurrent = document.querySelector('.breadcrumb .current');
  if (breadcrumbCurrent) breadcrumbCurrent.textContent = prod.name;

  // 2. Update Brand
  const brandEl = document.querySelector('.detail-brand');
  if (brandEl) brandEl.textContent = "SIPAHI";

  // 3. Update Main Image & Gallery
  const mainImg = document.getElementById('gallery-main-img');
  if (mainImg) {
    mainImg.src = prod.img;
    mainImg.alt = prod.name;
  }
  const thumbsContainer = document.querySelector('.gallery-thumbs');
  if (thumbsContainer) {
    let html = `
      <div class="gallery-thumb active" data-src="${prod.img}">
        <img src="${prod.img}" alt="Main View">
      </div>
    `;
    for(let i = 2; i <= 3; i++) {
      html += `
        <div class="gallery-thumb" data-src="${prod.img}">
          <img src="${prod.img}" alt="View ${i}">
        </div>
      `;
    }
    thumbsContainer.innerHTML = html;
    initGallery(); // Re-initialize click listeners for thumbs
  }

  // 4. Update Rating
  const ratingScore = document.querySelector('.detail-rating span[style*="font-size:14px"]');
  if (ratingScore) ratingScore.textContent = prod.rating;
  
  const ratingDetails = document.querySelector('.detail-rating span[style*="color:var(--text-muted)"]');
  if (ratingDetails) ratingDetails.textContent = `${prod.ratings_count} · ${prod.reviews}`;

  // 5. Update Price
  const priceNow = document.querySelector('.detail-price-now');
  if (priceNow) priceNow.textContent = `₹${prod.price.toLocaleString('en-IN')}`;
  
  const priceMrp = document.querySelector('.detail-price-mrp');
  if (priceMrp) priceMrp.textContent = `MRP ₹${prod.mrp.toLocaleString('en-IN')}`;
  
  const priceOff = document.querySelector('.detail-price-off');
  if (priceOff) {
    const offPct = Math.round(((prod.mrp - prod.price) / prod.mrp) * 100);
    priceOff.textContent = `${offPct}% OFF`;
  }

  // 6. Update Add to Cart Button dataset attributes
  const btn = document.getElementById('detail-add-cart');
  if (btn) {
    btn.dataset.productId = prod.id;
    btn.dataset.productName = prod.name;
    btn.dataset.productPrice = prod.price;
    btn.dataset.productMrp = prod.mrp;
    btn.dataset.productImg = prod.img;
  }

  // 7. Update Features
  const featuresContainer = document.querySelector('.detail-features');
  if (featuresContainer && prod.features) {
    featuresContainer.innerHTML = prod.features.map(f => `
      <div class="detail-feature">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${f}</span>
      </div>
    `).join('');
  }

  // 8. Update Description Tab
  const descPanel = document.querySelector('[data-tab-panel="product-tabs"][data-tab="description"]');
  if (descPanel) {
    descPanel.innerHTML = `
      <div style="max-width:720px">
        <h3 style="font-size:17px;font-weight:800;margin-bottom:14px">About this Product</h3>
        <p style="font-size:14px;color:var(--text-muted);line-height:1.8;margin-bottom:16px">${prod.description}</p>
        <ul style="font-size:14px;color:var(--text-muted);line-height:2;padding-left:20px;list-style:disc">
          ${prod.features.map(f => `<li>${f}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  // 9. Update Specifications Tab
  const specsPanel = document.querySelector('[data-tab-panel="product-tabs"][data-tab="specs"]');
  if (specsPanel && prod.specs) {
    let rows = Object.entries(prod.specs).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
    specsPanel.innerHTML = `
      <table class="specs-table" style="max-width:640px">
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  }

  // 10. Related Products Section
  const relatedGrid = document.querySelector('.scroll-products');
  if (relatedGrid) {
    const related = Object.values(PRODUCTS).filter(p => p.id !== prod.id && p.category.split(' ')[0] === prod.category.split(' ')[0]).slice(0, 4);
    if (related.length < 4) {
      const extra = Object.values(PRODUCTS).filter(p => p.id !== prod.id && !related.includes(p)).slice(0, 4 - related.length);
      related.push(...extra);
    }
    relatedGrid.innerHTML = related.map(p => {
      const offPct = Math.round(((p.mrp - p.price) / p.mrp) * 100);
      return `
        <div class="product-card" data-product="${p.id}" data-category="${p.category}">
          <a href="shop-detail.html?id=${p.id}" class="product-link" aria-label="${p.name}"></a>
          <div class="product-img-wrap">
            <button class="product-wishlist" data-product-id="${p.id}" data-product-name="${p.name}" data-product-price="${p.price}" data-product-mrp="${p.mrp}" data-product-img="${p.img}">🤍</button>
            <img src="${p.img}" alt="${p.name}" loading="lazy">
          </div>
          <div class="product-body">
            <p class="product-brand">SIPAHI</p>
            <h3 class="product-name">${p.name}</h3>
            <div class="product-rating"><div class="stars">${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}</div><span class="rating-count">${p.rating} (${p.reviews.split(' ')[0]})</span></div>
            <div class="product-price"><span class="price-now">₹${p.price.toLocaleString('en-IN')}</span><span class="price-mrp">₹${p.mrp.toLocaleString('en-IN')}</span><span class="price-off">${offPct}% off</span></div>
          </div>
          <div class="product-footer">
            <button class="btn-add-cart" data-product-id="${p.id}" data-product-name="${p.name}" data-product-price="${p.price}" data-product-mrp="${p.mrp}" data-product-img="${p.img}">🛒 Add to Cart</button>
          </div>
        </div>
      `;
    }).join('');
    
    initAddToCart();
    initWishlist();
  }
}

/* ── PRODUCT SORTING ─────────────────────────────────────────── */
function initSorting() {
  const select = document.getElementById('sort-select');
  if (!select) return;

  select.addEventListener('change', () => {
    const grid = document.querySelector('.products-grid');
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll('.product-card'));
    if (!cards.length) return;

    const val = select.value.toLowerCase();

    cards.sort((a, b) => {
      const pIdA = a.getAttribute('data-product');
      const pIdB = b.getAttribute('data-product');
      const prodA = PRODUCTS[pIdA];
      const prodB = PRODUCTS[pIdB];

      if (!prodA || !prodB) return 0;

      if (val.includes('low to high')) {
        return prodA.price - prodB.price;
      } else if (val.includes('high to low')) {
        return prodB.price - prodA.price;
      } else if (val.includes('top rated')) {
        return parseFloat(prodB.rating) - parseFloat(prodA.rating);
      } else if (val.includes('newest')) {
        const numA = parseInt(pIdA.replace('p', '')) || 0;
        const numB = parseInt(pIdB.replace('p', '')) || 0;
        return numB - numA;
      } else {
        // Popularity / Default (Reviews count descending)
        const revA = parseInt((prodA.reviews || '0').replace(/[^0-9]/g, '')) || 0;
        const revB = parseInt((prodB.reviews || '0').replace(/[^0-9]/g, '')) || 0;
        return revB - revA;
      }
    });

    // Re-append sorted cards in order
    cards.forEach(card => grid.appendChild(card));
  });
}

/* ── MAIN INIT ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  Cart.updateBadge();
  Wishlist.updateBadge();
  initHeader();
  initMobileNav();
  initCarousel('.hero-carousel');
  initAddToCart();
  initWishlist();
  initGallery();
  initQtyPicker();
  initTabs();
  initFilters();
  initFilterChips();
  initVariants();
  initCategoryFilter();
  initSorting();
  initCartPage();
  initCheckoutPage();
  initCheckoutForm();
  initContactForm();
  initSearch();
  initPayment();
  initProductDetailPage();
  initDetailCart();
  initLocationSelector();
  initProductCustomization();

  // Wishlist page
  Wishlist.renderPage();

  // Scroll top
  const stBtn = document.getElementById('scroll-top');
  stBtn && stBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
});
