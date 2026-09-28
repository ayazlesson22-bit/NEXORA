# NEXORA - Aesthetic & Modern Tech E-Commerce Platform

A production-grade, responsive, modern e-commerce storefront and admin dashboard for **NEXORA**, a premium tech hardware company.

Built with clean **HTML5, CSS3, and JavaScript**, integrated with **Supabase**, and styled in an aesthetic **light blue and white** theme.

---

## 🌟 Key Features

### 1. Clean & Empty Custom Catalog (All Products Removed)
All pre-set products have been completely removed. The store starts with a clean slate:
- Add your own authentic products anytime via the **Admin Dashboard** (`admin.html`).
- Manage hardware models, descriptions, technical specifications JSON, stock quantities, and dual pricing in PKR & USD.
- Fully synced with your Supabase `products` table in real time.

### 2. Dual International Currencies (PKR & USD)
- **Pakistani Rupee (PKR - ₨)** and **US Dollar (USD - $)** toggle located prominently in the navigation header.
- Instant, seamless recalculation across all product cards, specifications modal, cart drawer, wishlist drawer, and checkout summary.

### 3. Modern Light Theme (Blue & White Palette)
- Clean, crisp white surfaces (`#ffffff`, `#f8fafc`) accented with royal tech blues (`#1e3a8a`, `#2563eb`), sky blue highlights (`#0284c7`), subtle glassmorphism headers, and smooth micro-interactions.

### 4. Interactive Shopping System
- **Add to Cart Drawer**: Slide-out cart with live item count, quantity increment/decrement, real-time subtotal, free courier shipping progress tracker, and direct checkout trigger.
- **Wishlist Drawer**: Save favorite devices with 1-click heart toggles and move items directly into cart.
- **Instant Search & Category Filter**: Live keyword filtering (name, brand, category, specs) plus one-click category chips (Laptops, Smartphones, Audio, Tablets, Monitors, Accessories, Gaming, Drones).
- **Product Quick-View Specs Modal**: Displays full technical hardware specs, warranty badges, package contents, and quantity picker.

### 5. Multi-Option Checkout (Guest or Signed In)
- **Flexible Customer Mode**: Customers can order freely as a **Guest** without registration, or **Sign In / Register** via Supabase Auth.
- **4 Supported Payment Gateways**:
  1. 💵 **Cash on Delivery (COD)**: Doorstep verification upon parcel handover.
  2. 🟢 **Easypaisa**: Displays official Merchant Account Title (`NEXORA TECH PVT LTD`) and Till number (`0300-8492019`) with Transaction ID (TID) verification.
  3. 🏦 **Bank Transfer / Wire**: Displays Meezan Bank IBAN (`PK65MEZN0001928374650192`) and account details with sender reference input.
  4. 🌐 **Google Pay**: Interactive simulator with instant authorization token.

### 6. Admin Panel (`admin.html`)
- Live Supabase connection indicator (`mlhgxsdjigumwwiukxnu`).
- **Product Management**: Add your products directly into Supabase or edit/delete existing items.
- **1-Click Delete All Products**: Button to wipe all products from the Supabase database and local store with one click.
- **Real-Time KPIs**: Total Hardware Models, Total Customer Orders, Gross Sales in PKR, Gross Sales in USD.
- **Orders Dispatch Tracker**: View orders and update status (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`) with live Supabase synchronization.

---

## 📁 Folder Structure

```
NEXORA/
├── index.html              # Main customer storefront
├── checkout.html           # Multi-gateway checkout page
├── admin.html              # Admin panel for catalog & order management
├── supabase_setup.sql      # Supabase clean schema script (0 products)
├── README.md               # Documentation & setup guide
├── css/
│   ├── style.css           # Aesthetic light blue & white store stylesheet
│   └── admin.css           # Admin dashboard stylesheet
└── js/
    ├── supabase-config.js  # Supabase client setup with your API keys
    ├── products-data.js    # Clean product catalog (empty array)
    ├── store.js            # Main store engine (cart, wishlist, search, currency)
    ├── checkout.js         # Checkout engine (payments, validation, order dispatch)
    └── admin.js            # Admin dashboard logic & Supabase database sync
```

---

## 🚀 How to Run the Website

### Option 1: Direct File Opening
Double-click `index.html` in Windows Explorer to open the store directly in any web browser.

### Option 2: Local HTTP Server (Recommended)
Open PowerShell in the `NEXORA` folder and run:
```powershell
python -m http.server 8000
```
Then visit:
- **Storefront**: [http://localhost:8000/index.html](http://localhost:8000/index.html)
- **Checkout**: [http://localhost:8000/checkout.html](http://localhost:8000/checkout.html)
- **Admin Panel**: [http://localhost:8000/admin.html](http://localhost:8000/admin.html)

---

## ⚡ Setting Up Your Supabase Database

1. Open your Supabase Dashboard: [https://supabase.com/dashboard/project/mlhgxsdjigumwwiukxnu/sql](https://supabase.com/dashboard/project/mlhgxsdjigumwwiukxnu/sql)
2. Copy the entire contents of [supabase_setup.sql](file:///c:/Users/Admin/Desktop/NEXORA/supabase_setup.sql).
3. Paste into the SQL Editor and click **Run**.
4. The database is now ready and clean. Open [admin.html](file:///c:/Users/Admin/Desktop/NEXORA/admin.html) to start adding your real products!
