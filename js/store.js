/**
 * NEXORA Tech E-Commerce - Main Store Engine
 * State Management: Currency (PKR / USD), Cart, Wishlist, Search, Catalog Rendering, Modals
 */

const StoreState = {
    products: [],
    currency: localStorage.getItem('nexora_currency') || 'PKR', // 'PKR' or 'USD'
    usdToPkrRate: 280,
    cart: JSON.parse(localStorage.getItem('nexora_cart')) || [],
    wishlist: JSON.parse(localStorage.getItem('nexora_wishlist')) || [],
    currentCategory: 'All',
    searchQuery: '',
    sortBy: 'featured',
    currentUser: null
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
    initCurrencyButtons();
    initSearchAndFilters();
    initDrawersAndModals();
    await checkAuthUser();
    await loadProductsCatalog();
    renderCart();
    renderWishlist();
    updateHeaderCounts();
});

/* ========================================================
   CURRENCY MANAGEMENT (PKR & USD)
   ======================================================== */
function setCurrency(currency) {
    if (currency !== 'PKR' && currency !== 'USD') return;
    StoreState.currency = currency;
    localStorage.setItem('nexora_currency', currency);
    updateCurrencyUI();
    renderProducts();
    renderCart();
    renderWishlist();
    showToast(`Currency switched to ${currency === 'PKR' ? 'Pakistani Rupee (PKR)' : 'US Dollar (USD)'}`, 'info');
}

function updateCurrencyUI() {
    document.querySelectorAll('.currency-btn').forEach(btn => {
        if (btn.dataset.currency === StoreState.currency) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function initCurrencyButtons() {
    updateCurrencyUI();
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            setCurrency(btn.dataset.currency);
        });
    });
}

function formatPrice(priceUsd, pricePkr) {
    if (StoreState.currency === 'PKR') {
        const pkrVal = pricePkr !== undefined && pricePkr !== null ? pricePkr : (priceUsd * StoreState.usdToPkrRate);
        return `PKR ${Number(pkrVal).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
    } else {
        const usdVal = priceUsd !== undefined && priceUsd !== null ? priceUsd : (pricePkr / StoreState.usdToPkrRate);
        return `$${Number(usdVal).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

function getNumericPrice(product) {
    if (StoreState.currency === 'PKR') {
        return product.price_pkr || (product.price_usd * StoreState.usdToPkrRate);
    }
    return product.price_usd || (product.price_pkr / StoreState.usdToPkrRate);
}

/* ========================================================
   PRODUCT CATALOG LOADING & RENDERING
   ======================================================== */
async function loadProductsCatalog() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
            <div class="spinner-blue" style="margin: 0 auto 1rem auto; width: 44px; height: 44px; border: 3px solid #e2e8f0; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
            <p style="color: #64748b; font-weight: 600;">Loading verified tech hardware catalog...</p>
        </div>
    `;

    let loaded = false;

    // Try fetching from Supabase first
    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
                StoreState.products = data;
                loaded = true;
                console.log(`⚡ NEXORA: Loaded ${data.length} products from Supabase Database.`);
            }
        } catch (err) {
            console.warn('Supabase fetch failed, falling back to local catalog:', err);
        }
    }

    // Fallback to verified REAL_TECH_PRODUCTS
    if (!loaded) {
        StoreState.products = [...REAL_TECH_PRODUCTS];
        console.log(`📦 NEXORA: Loaded ${REAL_TECH_PRODUCTS.length} verified real tech products from local catalog.`);
    }

    renderProducts();
}

function renderProducts() {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    let filtered = StoreState.products.filter(product => {
        const matchesCategory = StoreState.currentCategory === 'All' || product.category === StoreState.currentCategory;
        const q = StoreState.searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
            product.name.toLowerCase().includes(q) || 
            product.brand.toLowerCase().includes(q) ||
            product.category.toLowerCase().includes(q) ||
            (product.description && product.description.toLowerCase().includes(q));

        return matchesCategory && matchesSearch;
    });

    // Sorting
    if (StoreState.sortBy === 'price-low') {
        filtered.sort((a, b) => getNumericPrice(a) - getNumericPrice(b));
    } else if (StoreState.sortBy === 'price-high') {
        filtered.sort((a, b) => getNumericPrice(b) - getNumericPrice(a));
    } else if (StoreState.sortBy === 'rating') {
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
        // Featured
        filtered.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
    }

    // Update count in UI
    const countEl = document.getElementById('catalog-count');
    if (countEl) countEl.innerText = filtered.length;

    if (filtered.length === 0) {
        if (StoreState.products.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1.5rem; background: #f8fafc; border-radius: 16px; border: 1.5px dashed #cbd5e1;">
                    <div style="width: 56px; height: 56px; border-radius: 50%; background: #eff6ff; color: #2563eb; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem auto;">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                    </div>
                    <h3 style="font-family: 'Space Grotesk', sans-serif; font-size: 1.35rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem;">Catalog is Empty</h3>
                    <p style="color: #64748b; font-size: 0.95rem; max-width: 480px; margin: 0 auto 1.5rem auto; line-height: 1.6;">
                        All products have been removed. You can now add your own products with custom prices in PKR/USD, specs, and images via the Admin Dashboard.
                    </p>
                    <a href="admin.html" class="btn-primary" style="padding: 0.75rem 1.5rem; font-size: 0.9rem; display: inline-flex;">
                        <span>Go to Admin Panel</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </a>
                </div>
            `;
        } else {
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: #f8fafc; border-radius: 16px; border: 1px dashed #cbd5e1;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5" style="margin: 0 auto 1rem auto; display: block;">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <h4 style="font-size: 1.15rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">No matching tech products</h4>
                    <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 1.25rem;">Try adjusting your search query or switching categories.</p>
                    <button onclick="resetFilters()" class="btn-primary" style="padding: 0.6rem 1.25rem; font-size: 0.85rem;">Clear All Filters</button>
                </div>
            `;
        }
        return;
    }

    grid.innerHTML = filtered.map(product => {
        const isWishlisted = StoreState.wishlist.includes(String(product.id));
        const formattedPrice = formatPrice(product.price_usd, product.price_pkr);
        const formattedOriginal = (product.original_price_usd || product.original_price_pkr) ? 
            formatPrice(product.original_price_usd, product.original_price_pkr) : '';

        return `
            <article class="product-card" data-id="${product.id}">
                <div class="card-top-bar">
                    <span class="product-badge">${product.badge || product.brand}</span>
                    <button class="btn-wishlist ${isWishlisted ? 'active' : ''}" onclick="toggleWishlist('${product.id}')" title="${isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}" aria-label="Wishlist">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                    </button>
                </div>

                <div class="card-image-wrap" onclick="openProductModal('${product.id}')">
                    <img src="${product.image_url}" alt="${product.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80'">
                </div>

                <div class="card-category">${product.category} &bull; ${product.brand}</div>
                <h3 class="card-title" onclick="openProductModal('${product.id}')" title="${product.name}">${product.name}</h3>

                <div class="card-rating-row">
                    <div class="stars">
                        ${getStarsHtml(product.rating || 5.0)}
                    </div>
                    <span class="rating-val">${product.rating || '4.9'}</span>
                    <span class="rating-count">(${product.reviews_count || 120})</span>
                </div>

                <p class="card-short-desc">${product.short_desc || product.description.substring(0, 85) + '...'}</p>

                <div class="card-footer">
                    <div class="price-box">
                        <span class="current-price">${formattedPrice}</span>
                        ${formattedOriginal ? `<span class="original-price">${formattedOriginal}</span>` : ''}
                    </div>
                    <button class="btn-add-cart" onclick="addToCart('${product.id}')" title="Add to Cart" aria-label="Add to cart">
                        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                    </button>
                </div>
            </article>
        `;
    }).join('');
}

function getStarsHtml(rating) {
    const full = Math.floor(rating);
    let html = '';
    for (let i = 0; i < full; i++) {
        html += `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
    }
    return html;
}

/* ========================================================
   SEARCH & FILTERS
   ======================================================== */
function initSearchAndFilters() {
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear-btn');
    const sortSelect = document.getElementById('sort-select');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            StoreState.searchQuery = e.target.value;
            if (searchClear) {
                searchClear.style.display = e.target.value ? 'block' : 'none';
            }
            renderProducts();
        });
    }

    if (searchClear) {
        searchClear.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            StoreState.searchQuery = '';
            searchClear.style.display = 'none';
            renderProducts();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            StoreState.sortBy = e.target.value;
            renderProducts();
        });
    }

    // Category Buttons
    document.querySelectorAll('.cat-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            StoreState.currentCategory = btn.dataset.category || 'All';
            renderProducts();
        });
    });
}

function resetFilters() {
    StoreState.currentCategory = 'All';
    StoreState.searchQuery = '';
    StoreState.sortBy = 'featured';

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    const searchClear = document.getElementById('search-clear-btn');
    if (searchClear) searchClear.style.display = 'none';

    document.querySelectorAll('.cat-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.category === 'All');
    });

    renderProducts();
}

/* ========================================================
   CART SYSTEM
   ======================================================== */
function addToCart(productId, quantity = 1) {
    const product = StoreState.products.find(p => String(p.id) === String(productId));
    if (!product) return;

    const existingIndex = StoreState.cart.findIndex(item => String(item.product.id) === String(productId));

    if (existingIndex > -1) {
        StoreState.cart[existingIndex].quantity += quantity;
    } else {
        StoreState.cart.push({
            product: {
                id: product.id,
                name: product.name,
                brand: product.brand,
                category: product.category,
                price_usd: product.price_usd,
                price_pkr: product.price_pkr,
                image_url: product.image_url
            },
            quantity: quantity
        });
    }

    saveCart();
    renderCart();
    updateHeaderCounts();
    openCartDrawer();
    showToast(`Added "${product.name}" to cart!`, 'success');
}

function updateCartQty(productId, delta) {
    const itemIndex = StoreState.cart.findIndex(item => String(item.product.id) === String(productId));
    if (itemIndex > -1) {
        StoreState.cart[itemIndex].quantity += delta;
        if (StoreState.cart[itemIndex].quantity <= 0) {
            StoreState.cart.splice(itemIndex, 1);
        }
        saveCart();
        renderCart();
        updateHeaderCounts();
    }
}

function removeFromCart(productId) {
    StoreState.cart = StoreState.cart.filter(item => String(item.product.id) !== String(productId));
    saveCart();
    renderCart();
    updateHeaderCounts();
    showToast('Item removed from cart', 'info');
}

function saveCart() {
    localStorage.setItem('nexora_cart', JSON.stringify(StoreState.cart));
}

function calculateCartTotals() {
    let subtotalUSD = 0;
    let subtotalPKR = 0;

    StoreState.cart.forEach(item => {
        const p = item.product;
        const q = item.quantity;
        subtotalUSD += (p.price_usd || 0) * q;
        subtotalPKR += (p.price_pkr || 0) * q;
    });

    return { subtotalUSD, subtotalPKR };
}

function renderCart() {
    const drawerBody = document.getElementById('cart-drawer-items');
    const drawerFooter = document.getElementById('cart-drawer-footer');
    if (!drawerBody) return;

    if (StoreState.cart.length === 0) {
        drawerBody.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" style="margin: 0 auto 1rem auto; display: block;">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <h4 style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">Your Cart is Empty</h4>
                <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 1.5rem;">Explore our cutting-edge tech gadgets and hardware.</p>
                <button onclick="closeCartDrawer()" class="btn-primary" style="width: 100%; justify-content: center;">Start Shopping</button>
            </div>
        `;
        if (drawerFooter) drawerFooter.style.display = 'none';
        return;
    }

    if (drawerFooter) drawerFooter.style.display = 'block';

    drawerBody.innerHTML = StoreState.cart.map(item => {
        const itemPrice = formatPrice(item.product.price_usd, item.product.price_pkr);
        return `
            <div class="cart-item">
                <div class="cart-item-img">
                    <img src="${item.product.image_url}" alt="${item.product.name}" onerror="this.src='https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=300&q=80'">
                </div>
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${item.product.name}</h4>
                    <span class="cart-item-price">${itemPrice}</span>
                    <div class="cart-item-controls">
                        <div class="quantity-control">
                            <button class="qty-btn" onclick="updateCartQty('${item.product.id}', -1)" aria-label="Decrease">&minus;</button>
                            <span class="qty-val">${item.quantity}</span>
                            <button class="qty-btn" onclick="updateCartQty('${item.product.id}', 1)" aria-label="Increase">&plus;</button>
                        </div>
                        <button class="btn-remove-item" onclick="removeFromCart('${item.product.id}')">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const { subtotalUSD, subtotalPKR } = calculateCartTotals();
    const formattedSubtotal = formatPrice(subtotalUSD, subtotalPKR);

    const subtotalEl = document.getElementById('cart-subtotal-price');
    const totalEl = document.getElementById('cart-total-price');
    if (subtotalEl) subtotalEl.innerText = formattedSubtotal;
    if (totalEl) totalEl.innerText = formattedSubtotal;
}

/* ========================================================
   WISHLIST SYSTEM
   ======================================================== */
function toggleWishlist(productId) {
    const idStr = String(productId);
    const index = StoreState.wishlist.indexOf(idStr);

    if (index > -1) {
        StoreState.wishlist.splice(index, 1);
        showToast('Removed from Wishlist', 'info');
    } else {
        StoreState.wishlist.push(idStr);
        showToast('Saved to Wishlist ❤️', 'success');
    }

    localStorage.setItem('nexora_wishlist', JSON.stringify(StoreState.wishlist));
    renderProducts();
    renderWishlist();
    updateHeaderCounts();
}

function renderWishlist() {
    const listBody = document.getElementById('wishlist-drawer-items');
    if (!listBody) return;

    const wishlistedProducts = StoreState.products.filter(p => StoreState.wishlist.includes(String(p.id)));

    if (wishlistedProducts.length === 0) {
        listBody.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" style="margin: 0 auto 1rem auto; display: block;">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <h4 style="font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.35rem;">Your Wishlist is Empty</h4>
                <p style="color: #64748b; font-size: 0.85rem; margin-bottom: 1.5rem;">Save your favorite hardware and devices for later.</p>
                <button onclick="closeWishlistDrawer()" class="btn-primary" style="width: 100%; justify-content: center;">Browse Store</button>
            </div>
        `;
        return;
    }

    listBody.innerHTML = wishlistedProducts.map(p => {
        const price = formatPrice(p.price_usd, p.price_pkr);
        return `
            <div class="cart-item">
                <div class="cart-item-img">
                    <img src="${p.image_url}" alt="${p.name}">
                </div>
                <div class="cart-item-info">
                    <h4 class="cart-item-title">${p.name}</h4>
                    <span class="cart-item-price">${price}</span>
                    <div class="cart-item-controls">
                        <button class="btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.75rem;" onclick="addToCart('${p.id}')">Move to Cart</button>
                        <button class="btn-remove-item" onclick="toggleWishlist('${p.id}')">Remove</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateHeaderCounts() {
    const cartCountEl = document.getElementById('header-cart-count');
    const wishlistCountEl = document.getElementById('header-wishlist-count');

    const totalCartItems = StoreState.cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cartCountEl) {
        cartCountEl.innerText = totalCartItems;
        cartCountEl.style.display = totalCartItems > 0 ? 'flex' : 'none';
    }

    if (wishlistCountEl) {
        wishlistCountEl.innerText = StoreState.wishlist.length;
        wishlistCountEl.style.display = StoreState.wishlist.length > 0 ? 'flex' : 'none';
    }
}

/* ========================================================
   PRODUCT DETAIL MODAL
   ======================================================== */
function openProductModal(productId) {
    const product = StoreState.products.find(p => String(p.id) === String(productId));
    if (!product) return;

    const modal = document.getElementById('product-modal');
    if (!modal) return;

    document.getElementById('modal-img').src = product.image_url;
    document.getElementById('modal-brand').innerText = `${product.brand} • ${product.category}`;
    document.getElementById('modal-title').innerText = product.name;
    document.getElementById('modal-price').innerText = formatPrice(product.price_usd, product.price_pkr);

    const origPriceEl = document.getElementById('modal-orig-price');
    if (origPriceEl) {
        if (product.original_price_usd || product.original_price_pkr) {
            origPriceEl.innerText = formatPrice(product.original_price_usd, product.original_price_pkr);
            origPriceEl.style.display = 'inline';
        } else {
            origPriceEl.style.display = 'none';
        }
    }

    document.getElementById('modal-desc').innerText = product.description;

    // Render specs table
    const specsContainer = document.getElementById('modal-specs-table');
    if (specsContainer) {
        let specsObj = product.specs;
        if (typeof specsObj === 'string') {
            try { specsObj = JSON.parse(specsObj); } catch(e) { specsObj = {}; }
        }

        if (specsObj && Object.keys(specsObj).length > 0) {
            specsContainer.innerHTML = Object.entries(specsObj).map(([key, value]) => `
                <tr>
                    <td>${key}</td>
                    <td>${value}</td>
                </tr>
            `).join('');
        } else {
            specsContainer.innerHTML = `
                <tr>
                    <td>Official Warranty</td>
                    <td>1 Year NEXORA Official Tech Warranty Included</td>
                </tr>
                <tr>
                    <td>Authenticity</td>
                    <td>100% Guaranteed Genuine Brand Sealed Unit</td>
                </tr>
            `;
        }
    }

    // Modal Add To Cart button
    const modalAddBtn = document.getElementById('modal-add-cart-btn');
    if (modalAddBtn) {
        modalAddBtn.onclick = () => {
            const qtyInput = document.getElementById('modal-qty-input');
            const qty = qtyInput ? parseInt(qtyInput.value) || 1 : 1;
            addToCart(product.id, qty);
            closeProductModal();
        };
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/* ========================================================
   DRAWER CONTROLS
   ======================================================== */
function openCartDrawer() {
    closeWishlistDrawer();
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (drawer) drawer.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (drawer) drawer.classList.remove('active');
    if (backdrop && !document.getElementById('wishlist-drawer')?.classList.contains('active')) {
        backdrop.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function openWishlistDrawer() {
    closeCartDrawer();
    const drawer = document.getElementById('wishlist-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (drawer) drawer.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeWishlistDrawer() {
    const drawer = document.getElementById('wishlist-drawer');
    const backdrop = document.getElementById('drawer-backdrop');
    if (drawer) drawer.classList.remove('active');
    if (backdrop && !document.getElementById('cart-drawer')?.classList.contains('active')) {
        backdrop.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function initDrawersAndModals() {
    const backdrop = document.getElementById('drawer-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            closeCartDrawer();
            closeWishlistDrawer();
        });
    }

    const modalBackdrop = document.getElementById('product-modal');
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', (e) => {
            if (e.target === modalBackdrop) closeProductModal();
        });
    }

    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.addEventListener('click', (e) => {
            if (e.target === authModal) closeAuthModal();
        });
    }
}

/* ========================================================
   AUTHENTICATION (SUPABASE & GUEST MODE)
   ======================================================== */
async function checkAuthUser() {
    const userBtn = document.getElementById('header-user-btn');
    const userNameSpan = document.getElementById('header-user-name');

    if (window.supabaseClient) {
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session && session.user) {
                StoreState.currentUser = session.user;
                if (userNameSpan) {
                    userNameSpan.innerText = session.user.email.split('@')[0];
                }
                return;
            }
        } catch (e) {
            console.warn('Auth check skipped:', e);
        }
    }

    // Guest Mode
    if (userNameSpan) {
        userNameSpan.innerText = 'Account';
    }
}

function openAuthModal() {
    if (StoreState.currentUser) {
        // Option to logout or show user info
        if (confirm(`Logged in as ${StoreState.currentUser.email}. Do you want to sign out?`)) {
            signOutUser();
        }
        return;
    }
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

async function handleSignIn(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error-msg');
    if (errorEl) errorEl.style.display = 'none';

    if (!window.supabaseClient) {
        showToast('Supabase client not loaded. Continuing in Guest mode.', 'info');
        closeAuthModal();
        return;
    }

    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            if (errorEl) {
                errorEl.innerText = error.message;
                errorEl.style.display = 'block';
            }
            return;
        }

        StoreState.currentUser = data.user;
        showToast(`Welcome back, ${data.user.email}!`, 'success');
        closeAuthModal();
        checkAuthUser();
    } catch (err) {
        if (errorEl) {
            errorEl.innerText = err.message;
            errorEl.style.display = 'block';
        }
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorEl = document.getElementById('auth-error-msg');
    if (errorEl) errorEl.style.display = 'none';

    if (!window.supabaseClient) {
        showToast('Supabase client not loaded. Continuing in Guest mode.', 'info');
        closeAuthModal();
        return;
    }

    try {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email,
            password
        });

        if (error) {
            if (errorEl) {
                errorEl.innerText = error.message;
                errorEl.style.display = 'block';
            }
            return;
        }

        showToast('Registration successful! Please check your email to verify.', 'success');
        closeAuthModal();
    } catch (err) {
        if (errorEl) {
            errorEl.innerText = err.message;
            errorEl.style.display = 'block';
        }
    }
}

async function signOutUser() {
    if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
    }
    StoreState.currentUser = null;
    showToast('Signed out successfully', 'info');
    checkAuthUser();
}

/* ========================================================
   TOAST NOTIFICATIONS
   ======================================================== */
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'error') {
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    } else {
        iconSvg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
        ${iconSvg}
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
