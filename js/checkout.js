/**
 * NEXORA Tech E-Commerce - Checkout Engine
 * Handles Cart Summary, PKR/USD Currency Switching, 4 Payment Methods (Cash, Easypaisa, Bank, Google Pay),
 * Guest & Supabase Authenticated Checkout, and Supabase Orders Database Storage.
 */

let checkoutState = {
    cart: JSON.parse(localStorage.getItem('nexora_cart')) || [],
    currency: localStorage.getItem('nexora_currency') || 'PKR',
    selectedPaymentMethod: 'cash',
    currentUser: null,
    gpayAuthorized: false
};

document.addEventListener('DOMContentLoaded', async () => {
    initCheckoutCurrency();
    await checkAuthStatus();
    loadCheckoutCart();
});

/* ================= CURRENCY HANDLING ================= */
function initCheckoutCurrency() {
    updateCurrencyButtons();
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const newCur = btn.dataset.currency;
            if (newCur !== checkoutState.currency) {
                checkoutState.currency = newCur;
                localStorage.setItem('nexora_currency', newCur);
                updateCurrencyButtons();
                loadCheckoutCart();
            }
        });
    });
}

function updateCurrencyButtons() {
    document.querySelectorAll('.currency-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.currency === checkoutState.currency);
    });
}

function formatCheckoutPrice(priceUsd, pricePkr) {
    if (checkoutState.currency === 'PKR') {
        const val = pricePkr !== undefined && pricePkr !== null ? pricePkr : (priceUsd * 280);
        return `PKR ${Number(val).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
    } else {
        const val = priceUsd !== undefined && priceUsd !== null ? priceUsd : (pricePkr / 280);
        return `$${Number(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

/* ================= CART LOADING ================= */
function loadCheckoutCart() {
    const listEl = document.getElementById('checkout-items-list');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const grandTotalEl = document.getElementById('checkout-grand-total');

    // If cart is empty, show empty message
    if (checkoutState.cart.length === 0) {
        listEl.innerHTML = `
            <div style="text-align: center; padding: 2rem 1rem; color: #64748b;">
                <p style="font-weight: 700; margin-bottom: 0.5rem; color: #0f172a;">Your cart is empty</p>
                <p style="font-size: 0.85rem; margin-bottom: 1rem;">No items have been added to your cart yet.</p>
                <a href="index.html" class="btn-primary" style="padding: 0.5rem 1rem; font-size: 0.85rem; display: inline-flex;">Go to Storefront</a>
            </div>
        `;
        if (subtotalEl) subtotalEl.innerText = formatCheckoutPrice(0, 0);
        if (grandTotalEl) grandTotalEl.innerText = formatCheckoutPrice(0, 0);
        const submitBtn = document.getElementById('btn-submit-order');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
            submitBtn.style.cursor = 'not-allowed';
        }
        return;
    }

    const submitBtn = document.getElementById('btn-submit-order');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
    }

    let subtotalUSD = 0;
    let subtotalPKR = 0;

    listEl.innerHTML = checkoutState.cart.map(item => {
        const p = item.product;
        const q = item.quantity;
        subtotalUSD += (p.price_usd || 0) * q;
        subtotalPKR += (p.price_pkr || 0) * q;

        const formattedItemTotal = formatCheckoutPrice((p.price_usd || 0) * q, (p.price_pkr || 0) * q);

        return `
            <div class="summary-item-row">
                <div class="summary-item-img">
                    <img src="${p.image_url}" alt="${p.name}">
                </div>
                <div class="summary-item-info">
                    <div class="summary-item-name">${p.name}</div>
                    <div class="summary-item-qty">Qty: ${q} &bull; ${p.brand}</div>
                </div>
                <div class="summary-item-price">${formattedItemTotal}</div>
            </div>
        `;
    }).join('');

    const formattedTotal = formatCheckoutPrice(subtotalUSD, subtotalPKR);
    if (subtotalEl) subtotalEl.innerText = formattedTotal;
    if (grandTotalEl) grandTotalEl.innerText = formattedTotal;
}

/* ================= AUTHENTICATION CHECK ================= */
async function checkAuthStatus() {
    const banner = document.getElementById('auth-status-text');
    const nameInput = document.getElementById('cust-name');
    const emailInput = document.getElementById('cust-email');

    if (window.supabaseClient) {
        try {
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            if (session && session.user) {
                checkoutState.currentUser = session.user;
                if (banner) {
                    banner.innerHTML = `✅ Signed in as <strong>${session.user.email}</strong> (Supabase Profile Linked)`;
                }
                if (emailInput && !emailInput.value) emailInput.value = session.user.email;
                if (nameInput && !nameInput.value) nameInput.value = session.user.user_metadata?.full_name || session.user.email.split('@')[0];
                return;
            }
        } catch (e) {
            console.warn('Auth check skipped:', e);
        }
    }

    if (banner) {
        banner.innerHTML = `⚡ <strong>Guest Checkout Mode:</strong> No account required! Instant checkout.`;
    }
}

/* ================= PAYMENT METHOD TOGGLER ================= */
function selectPaymentMethod(method) {
    checkoutState.selectedPaymentMethod = method;

    // Update active card styling
    document.querySelectorAll('.payment-choice-card').forEach(card => {
        card.classList.toggle('active', card.dataset.method === method);
    });

    // Update detail panels
    document.querySelectorAll('.payment-details-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    const activePanel = document.getElementById(`panel-${method}`);
    if (activePanel) activePanel.classList.add('active');
}

/* ================= GOOGLE PAY SIMULATOR ================= */
function simulateGooglePay() {
    const btn = document.getElementById('gpay-btn-label');
    const tokenInput = document.getElementById('gpay-auth-token');

    btn.innerText = 'Authorizing via Google Pay...';
    setTimeout(() => {
        const dummyToken = 'GPAY-AUTH-' + Math.random().toString(36).substring(2, 10).toUpperCase();
        tokenInput.value = dummyToken;
        checkoutState.gpayAuthorized = true;
        btn.innerHTML = `✅ Authorized (GPay Token: ${dummyToken})`;
        btn.parentElement.style.background = '#15803d';
    }, 1200);
}

/* ================= PLACE ORDER ================= */
async function handlePlaceOrder(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('btn-submit-order');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
        <span class="spinner-blue" style="width: 20px; height: 20px; border: 2px solid #ffffff; border-top-color: transparent; border-radius: 50%; display: inline-block; animation: spin 0.8s linear infinite; margin-right: 0.5rem;"></span>
        <span>Processing Verified Order...</span>
    `;

    const custName = document.getElementById('cust-name').value.trim();
    const custEmail = document.getElementById('cust-email').value.trim();
    const custPhone = document.getElementById('cust-phone').value.trim();
    const custAddress = document.getElementById('cust-address').value.trim();
    const custCity = document.getElementById('cust-city').value.trim();
    const custCountry = document.getElementById('cust-country').value;
    const custNotes = document.getElementById('cust-notes').value.trim();

    // Payment Reference check
    let paymentRef = 'None';
    if (checkoutState.selectedPaymentMethod === 'easypaisa') {
        const trx = document.getElementById('easypaisa-trx').value.trim();
        if (!trx) {
            alert('Please enter your Easypaisa Transaction ID (TID) to proceed.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Place Verified Order</span>`;
            return;
        }
        paymentRef = `Easypaisa TID: ${trx}`;
    } else if (checkoutState.selectedPaymentMethod === 'bank') {
        const bankRef = document.getElementById('bank-ref').value.trim();
        if (!bankRef) {
            alert('Please enter your Bank Transfer Reference Number to proceed.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = `<span>Place Verified Order</span>`;
            return;
        }
        paymentRef = `Bank Ref: ${bankRef}`;
    } else if (checkoutState.selectedPaymentMethod === 'google_pay') {
        const gToken = document.getElementById('gpay-auth-token').value;
        paymentRef = gToken ? `Google Pay: ${gToken}` : 'Google Pay (Authorized)';
    } else {
        paymentRef = 'Cash on Delivery (Pending Courier Handover)';
    }

    // Calculate total
    let totalUsd = 0;
    let totalPkr = 0;
    checkoutState.cart.forEach(item => {
        totalUsd += (item.product.price_usd || 0) * item.quantity;
        totalPkr += (item.product.price_pkr || 0) * item.quantity;
    });

    const finalAmount = checkoutState.currency === 'PKR' ? totalPkr : totalUsd;
    const orderNumber = 'NEX-' + Math.floor(100000 + Math.random() * 900000);

    const orderData = {
        order_number: orderNumber,
        customer_name: custName,
        customer_email: custEmail,
        customer_phone: custPhone,
        shipping_address: `${custAddress}, ${custNotes ? 'Notes: ' + custNotes : ''}`,
        city: custCity,
        country: custCountry,
        currency: checkoutState.currency,
        total_amount: finalAmount,
        payment_method: checkoutState.selectedPaymentMethod,
        payment_reference: paymentRef,
        order_status: 'Pending',
        items_summary: checkoutState.cart.map(i => ({
            id: i.product.id,
            name: i.product.name,
            brand: i.product.brand,
            quantity: i.quantity,
            price_usd: i.product.price_usd,
            price_pkr: i.product.price_pkr
        })),
        user_id: checkoutState.currentUser ? checkoutState.currentUser.id : null,
        created_at: new Date().toISOString()
    };

    let savedToSupabase = false;

    // Send to Supabase
    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('orders')
                .insert([orderData]);

            if (!error) {
                savedToSupabase = true;
                console.log('⚡ NEXORA: Order saved to Supabase successfully!', orderNumber);
            } else {
                console.warn('Supabase order insert warning:', error.message);
            }
        } catch (err) {
            console.warn('Supabase order insert failed:', err);
        }
    }

    // LocalStorage Fallback so Admin can always see orders
    const localOrders = JSON.parse(localStorage.getItem('nexora_orders')) || [];
    localOrders.unshift(orderData);
    localStorage.setItem('nexora_orders', JSON.stringify(localOrders));

    // Clear user cart
    localStorage.removeItem('nexora_cart');
    checkoutState.cart = [];

    // Show Confirmation Screen
    displayOrderConfirmation(orderData, savedToSupabase);
}

function displayOrderConfirmation(order, savedToSupabase) {
    document.getElementById('checkout-main-container').style.display = 'none';
    const successContainer = document.getElementById('order-success-container');
    successContainer.style.display = 'block';

    document.getElementById('success-order-num').innerText = order.order_number;
    document.getElementById('success-cust-name').innerText = order.customer_name;
    document.getElementById('success-payment-method').innerText = `${order.payment_method.replace('_', ' ')} (${order.payment_reference})`;
    document.getElementById('success-total').innerText = `${order.currency} ${Number(order.total_amount).toLocaleString()}`;
    document.getElementById('success-address').innerText = `${order.shipping_address}, ${order.city}, ${order.country}`;

    window.scrollTo({ top: 0, behavior: 'smooth' });
}
