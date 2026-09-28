/**
 * NEXORA Tech E-Commerce - Admin Dashboard Engine
 * Product Catalog CRUD, Supabase Sync & Seeder, Order Management & KPI Metrics
 */

let adminState = {
    products: [],
    orders: [],
    currentTab: 'products'
};

document.addEventListener('DOMContentLoaded', async () => {
    await verifySupabaseConnection();
    await loadAdminData();
});

/* ================= VERIFY SUPABASE ================= */
async function verifySupabaseConnection() {
    const pill = document.getElementById('supabase-pill');
    const label = document.getElementById('supabase-status-label');

    if (!window.supabaseClient) {
        if (pill) {
            pill.className = 'supabase-status-pill offline';
            label.innerText = 'Supabase: Offline / Connecting...';
        }
        return false;
    }

    try {
        const { data, error } = await window.supabaseClient
            .from('products')
            .select('id')
            .limit(1);

        if (error) {
            if (pill) {
                pill.className = 'supabase-status-pill offline';
                label.innerText = `Supabase Error: ${error.message}`;
            }
            return false;
        }

        if (pill) {
            pill.className = 'supabase-status-pill online';
            label.innerText = 'Supabase Connected: mlhgxsdjigumwwiukxnu';
        }
        return true;
    } catch (err) {
        if (pill) {
            pill.className = 'supabase-status-pill offline';
            label.innerText = 'Supabase: Table setup needed';
        }
        return false;
    }
}

/* ================= LOAD ADMIN DATA ================= */
async function loadAdminData() {
    await loadAdminProducts();
    await loadAdminOrders();
    updateKpiStats();
}

async function loadAdminProducts() {
    let loaded = false;

    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('products')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
                adminState.products = data;
                loaded = true;
            }
        } catch (e) {
            console.warn('Admin load products from Supabase failed:', e);
        }
    }

    if (!loaded) {
        adminState.products = [];
    }

    renderAdminProductsTable();
}

async function loadAdminOrders() {
    let ordersList = [];

    // Check Supabase orders
    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                ordersList = data;
            }
        } catch (e) {
            console.warn('Admin load orders from Supabase failed:', e);
        }
    }

    // Merge with any local orders not in Supabase
    const localOrders = JSON.parse(localStorage.getItem('nexora_orders')) || [];
    localOrders.forEach(localOrd => {
        if (!ordersList.some(o => o.order_number === localOrd.order_number)) {
            ordersList.push(localOrd);
        }
    });

    adminState.orders = ordersList;
    renderAdminOrdersTable();
}

/* ================= RENDER TABLES ================= */
function renderAdminProductsTable() {
    const tbody = document.getElementById('admin-products-tbody');
    if (!tbody) return;

    if (adminState.products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem; color: #94a3b8;">
                    No tech products in catalog. Click "Seed Real Catalog to Supabase" above to initialize.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = adminState.products.map(p => {
        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.85rem;">
                        <img src="${p.image_url}" alt="${p.name}" class="table-thumb" onerror="this.src='https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=150&q=80'">
                        <div>
                            <strong style="color: #0f172a; font-size: 0.9rem; display: block;">${p.name}</strong>
                            <span style="font-size: 0.75rem; color: #94a3b8;">${p.badge || 'Verified Flagship'}</span>
                        </div>
                    </div>
                </td>
                <td><span style="font-weight: 700; color: #1e40af;">${p.brand}</span></td>
                <td><span style="background: #f1f5f9; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">${p.category}</span></td>
                <td style="font-weight: 700; color: #0f172a;">PKR ${Number(p.price_pkr || 0).toLocaleString()}</td>
                <td style="font-weight: 700; color: #2563eb;">$${Number(p.price_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td>
                    <span style="font-weight: 700; color: ${(p.stock_quantity || 20) < 5 ? '#ef4444' : '#10b981'};">
                        ${p.stock_quantity || 20} units
                    </span>
                </td>
                <td>
                    <span class="status-badge ${p.in_stock !== false ? 'status-Delivered' : 'status-Cancelled'}">
                        ${p.in_stock !== false ? 'In Stock' : 'Out of Stock'}
                    </span>
                </td>
                <td>
                    <button class="action-icon-btn" onclick="editProduct('${p.id}')" title="Edit Product">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                    </button>
                    <button class="action-icon-btn delete" onclick="deleteProduct('${p.id}')" title="Delete Product">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderAdminOrdersTable() {
    const tbody = document.getElementById('admin-orders-tbody');
    if (!tbody) return;

    if (adminState.orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 3rem; color: #94a3b8;">
                    No customer orders received yet. Place a test order via Checkout to view live dispatches here.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = adminState.orders.map(o => {
        const items = Array.isArray(o.items_summary) ? o.items_summary : [];
        const itemsText = items.map(i => `${i.quantity}x ${i.name}`).join(', ') || '1x Flagship Hardware';
        const dateStr = o.created_at ? new Date(o.created_at).toLocaleDateString() : 'Just now';

        return `
            <tr>
                <td><strong style="color: #2563eb; font-family: monospace;">${o.order_number}</strong></td>
                <td>
                    <div style="font-weight: 700; color: #0f172a;">${o.customer_name}</div>
                    <div style="font-size: 0.75rem; color: #64748b;">${o.customer_email} &bull; ${o.customer_phone || ''}</div>
                </td>
                <td style="max-width: 250px;">
                    <div style="font-size: 0.825rem; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${itemsText}">
                        ${itemsText}
                    </div>
                    <div style="font-size: 0.75rem; color: #94a3b8;">${o.city || 'Pakistan'}, ${o.country || ''}</div>
                </td>
                <td>
                    <strong style="font-size: 0.95rem; color: #0f172a;">${o.currency || 'PKR'} ${Number(o.total_amount).toLocaleString()}</strong>
                </td>
                <td>
                    <span style="font-weight: 700; text-transform: capitalize; color: #1e40af;">
                        ${(o.payment_method || 'cash').replace('_', ' ')}
                    </span>
                </td>
                <td>
                    <span style="font-size: 0.75rem; font-family: monospace; background: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 4px;">
                        ${o.payment_reference || 'COD'}
                    </span>
                </td>
                <td>
                    <select onchange="updateOrderStatus('${o.order_number}', this.value)" style="padding: 0.3rem 0.6rem; border-radius: 6px; font-weight: 700; font-size: 0.8rem; border: 1px solid #cbd5e1; background: #ffffff;">
                        <option value="Pending" ${o.order_status === 'Pending' ? 'selected' : ''}>Pending</option>
                        <option value="Processing" ${o.order_status === 'Processing' ? 'selected' : ''}>Processing</option>
                        <option value="Shipped" ${o.order_status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="Delivered" ${o.order_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                        <option value="Cancelled" ${o.order_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </td>
                <td style="font-size: 0.8rem; color: #64748b;">${dateStr}</td>
            </tr>
        `;
    }).join('');
}

/* ================= KPI METRICS ================= */
function updateKpiStats() {
    const prodCountEl = document.getElementById('stat-products-count');
    const ordersCountEl = document.getElementById('stat-orders-count');
    const salesPkrEl = document.getElementById('stat-sales-pkr');
    const salesUsdEl = document.getElementById('stat-sales-usd');

    if (prodCountEl) prodCountEl.innerText = adminState.products.length;
    if (ordersCountEl) ordersCountEl.innerText = adminState.orders.length;

    let totalPkr = 0;
    let totalUsd = 0;

    adminState.orders.forEach(o => {
        if (o.order_status !== 'Cancelled') {
            if (o.currency === 'USD') {
                totalUsd += Number(o.total_amount || 0);
            } else {
                totalPkr += Number(o.total_amount || 0);
            }
        }
    });

    if (salesPkrEl) salesPkrEl.innerText = `PKR ${totalPkr.toLocaleString()}`;
    if (salesUsdEl) salesUsdEl.innerText = `$${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

/* ================= TAB CONTROLS ================= */
function switchAdminTab(tab) {
    adminState.currentTab = tab;
    document.getElementById('tab-btn-products').classList.toggle('active', tab === 'products');
    document.getElementById('tab-btn-orders').classList.toggle('active', tab === 'orders');

    document.getElementById('panel-products-section').style.display = tab === 'products' ? 'block' : 'none';
    document.getElementById('panel-orders-section').style.display = tab === 'orders' ? 'block' : 'none';
}

function refreshAdminData() {
    loadAdminData();
    alert('Dashboard refreshed!');
}

/* ================= REMOVE ALL PRODUCTS FROM SUPABASE ================= */
async function clearAllProductsFromSupabase() {
    if (!confirm('Are you sure you want to permanently DELETE ALL PRODUCTS from Supabase and the store? This will leave your catalog completely empty.')) {
        return;
    }

    const btn = document.getElementById('btn-clear-supabase');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span>Removing All Products...</span>`;
    }

    if (window.supabaseClient) {
        try {
            // Delete all products where id is not null
            const { error } = await window.supabaseClient
                .from('products')
                .delete()
                .neq('name', '___NON_EXISTENT___');

            if (error) {
                console.error('Supabase delete all error:', error);
                alert(`Error deleting from Supabase: ${error.message}`);
            } else {
                alert('✅ All products have been successfully deleted from your Supabase database!');
            }
        } catch (err) {
            console.warn('Delete error:', err);
        }
    }

    adminState.products = [];
    renderAdminProductsTable();
    updateKpiStats();

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            <span>Delete All Products</span>
        `;
    }
}

/* ================= PRODUCT CRUD MODAL ================= */
function openAddProductModal() {
    document.getElementById('edit-prod-id').value = '';
    document.getElementById('form-modal-title').innerText = 'Add Real Tech Product';
    document.getElementById('product-admin-form').reset();
    document.getElementById('product-form-modal').classList.add('active');
}

function closeProductFormModal() {
    document.getElementById('product-form-modal').classList.remove('active');
}

function editProduct(productId) {
    const product = adminState.products.find(p => String(p.id) === String(productId));
    if (!product) return;

    document.getElementById('edit-prod-id').value = product.id;
    document.getElementById('form-modal-title').innerText = `Edit: ${product.name}`;
    document.getElementById('prod-name').value = product.name;
    document.getElementById('prod-brand').value = product.brand;
    document.getElementById('prod-category').value = product.category;
    document.getElementById('prod-price-pkr').value = product.price_pkr;
    document.getElementById('prod-price-usd').value = product.price_usd;
    document.getElementById('prod-stock').value = product.stock_quantity || 20;
    document.getElementById('prod-badge').value = product.badge || '';
    document.getElementById('prod-image').value = product.image_url;
    document.getElementById('prod-desc').value = product.description;
    document.getElementById('prod-specs').value = JSON.stringify(product.specs || {}, null, 2);

    document.getElementById('product-form-modal').classList.add('active');
}

async function handleSaveProduct(e) {
    e.preventDefault();

    const editId = document.getElementById('edit-prod-id').value;
    const name = document.getElementById('prod-name').value.trim();
    const brand = document.getElementById('prod-brand').value.trim();
    const category = document.getElementById('prod-category').value;
    const pricePkr = parseFloat(document.getElementById('prod-price-pkr').value);
    const priceUsd = parseFloat(document.getElementById('prod-price-usd').value);
    const stock = parseInt(document.getElementById('prod-stock').value);
    const badge = document.getElementById('prod-badge').value.trim();
    const imageUrl = document.getElementById('prod-image').value.trim();
    const desc = document.getElementById('prod-desc').value.trim();
    
    let specs = {};
    try {
        specs = JSON.parse(document.getElementById('prod-specs').value);
    } catch(err) {
        specs = { "Info": document.getElementById('prod-specs').value };
    }

    const productPayload = {
        name,
        brand,
        category,
        price_pkr: pricePkr,
        price_usd: priceUsd,
        stock_quantity: stock,
        in_stock: stock > 0,
        badge,
        image_url: imageUrl,
        description: desc,
        specs
    };

    // If Supabase is available, sync
    if (window.supabaseClient) {
        try {
            if (editId) {
                await window.supabaseClient.from('products').update(productPayload).eq('id', editId);
            } else {
                await window.supabaseClient.from('products').insert([productPayload]);
            }
        } catch(err) {
            console.warn('Supabase product sync warning:', err);
        }
    }

    // Local state update
    if (editId) {
        const idx = adminState.products.findIndex(p => String(p.id) === String(editId));
        if (idx > -1) {
            adminState.products[idx] = { ...adminState.products[idx], ...productPayload };
        }
    } else {
        adminState.products.unshift({
            id: 'nexora-' + Date.now(),
            ...productPayload
        });
    }

    closeProductFormModal();
    renderAdminProductsTable();
    updateKpiStats();
    alert('Hardware product saved successfully!');
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to remove this tech product?')) return;

    if (window.supabaseClient) {
        try {
            await window.supabaseClient.from('products').delete().eq('id', productId);
        } catch (e) {
            console.warn('Supabase delete error:', e);
        }
    }

    adminState.products = adminState.products.filter(p => String(p.id) !== String(productId));
    renderAdminProductsTable();
    updateKpiStats();
}

/* ================= UPDATE ORDER STATUS ================= */
async function updateOrderStatus(orderNumber, newStatus) {
    if (window.supabaseClient) {
        try {
            await window.supabaseClient
                .from('orders')
                .update({ order_status: newStatus })
                .eq('order_number', orderNumber);
        } catch (e) {
            console.warn('Supabase order status update error:', e);
        }
    }

    // Update local orders
    const localOrders = JSON.parse(localStorage.getItem('nexora_orders')) || [];
    const idx = localOrders.findIndex(o => o.order_number === orderNumber);
    if (idx > -1) {
        localOrders[idx].order_status = newStatus;
        localStorage.setItem('nexora_orders', JSON.stringify(localOrders));
    }

    const stateIdx = adminState.orders.findIndex(o => o.order_number === orderNumber);
    if (stateIdx > -1) {
        adminState.orders[stateIdx].order_status = newStatus;
    }

    updateKpiStats();
    console.log(`Order ${orderNumber} status updated to: ${newStatus}`);
}
