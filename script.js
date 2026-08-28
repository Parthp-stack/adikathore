"use strict";

/**
 * WellFit Creation - Tailoring Order Management & Measurement Studio
 * Sawargaon Mal, Maharashtra
 */

// ==========================================
// STORAGE & STATE
// ==========================================

const STORAGE_KEY = "wellfit_creation_orders_v1";

let orders = loadOrders();
let currentSearchQuery = "";
let currentDetailOrderId = null;

function loadOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load orders from localStorage:", err);
    return [];
  }
}

function saveOrders() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (err) {
    console.error("Failed to save orders to localStorage:", err);
    alert("Storage limit reached or browser storage unavailable. Please free up space.");
  }
}

// ==========================================
// DOM ELEMENTS
// ==========================================

const orderForm = document.getElementById("order-form");

const orderView = document.getElementById("order-view");
const ordersView = document.getElementById("orders-view");
const orderDetailView = document.getElementById("order-detail-view");

const viewOrdersButton = document.getElementById("view-orders");
const newOrderButton = document.getElementById("new-order");
const backToOrdersButton = document.getElementById("back-to-orders");
const printOrderButton = document.getElementById("print-order-btn");

const ordersList = document.getElementById("orders-list");
const orderDetail = document.getElementById("order-detail");

const orderStatus = document.getElementById("order-status");

const samplePhoto = document.getElementById("sample-photo");
const photoPreview = document.getElementById("photo-preview");
const removePhotoBtn = document.getElementById("remove-photo-btn");

const orderNumber = document.getElementById("order-number");
const navOrderCount = document.getElementById("nav-order-count");
const ordersFilterCount = document.getElementById("orders-filter-count");

const progressNew = document.getElementById("progress-new");
const progressOrders = document.getElementById("progress-orders");
const brandHome = document.getElementById("brand-home");

const ordersSearch = document.getElementById("orders-search");
const clearSearchBtn = document.getElementById("clear-search-btn");

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  updateNavCount();
  updateOrderNumber();
  renderOrders();
  setupPhotoPreview();
  setupEventListeners();
});

// ==========================================
// VIEW NAVIGATION
// ==========================================

function showView(view) {
  if (!orderView || !ordersView || !orderDetailView) return;

  orderView.classList.remove("active-view");
  ordersView.classList.remove("active-view");
  orderDetailView.classList.remove("active-view");

  if (progressNew) progressNew.classList.remove("active");
  if (progressOrders) progressOrders.classList.remove("active");

  if (view === "new") {
    orderView.classList.add("active-view");
    if (progressNew) progressNew.classList.add("active");
    updateOrderNumber();
  } else if (view === "orders") {
    ordersView.classList.add("active-view");
    if (progressOrders) progressOrders.classList.add("active");
    renderOrders();
  } else if (view === "detail") {
    orderDetailView.classList.add("active-view");
    if (progressOrders) progressOrders.classList.add("active");
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// ==========================================
// EVENT LISTENERS SETUP
// ==========================================

function setupEventListeners() {
  // Navigation buttons
  if (viewOrdersButton) {
    viewOrdersButton.addEventListener("click", () => showView("orders"));
  }

  if (newOrderButton) {
    newOrderButton.addEventListener("click", () => {
      resetNewOrderForm();
      showView("new");
    });
  }

  if (backToOrdersButton) {
    backToOrdersButton.addEventListener("click", () => showView("orders"));
  }

  if (brandHome) {
    brandHome.addEventListener("click", () => {
      resetNewOrderForm();
      showView("new");
    });
    brandHome.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        resetNewOrderForm();
        showView("new");
      }
    });
  }

  // Progress Bar navigation
  if (progressNew) {
    progressNew.addEventListener("click", () => {
      showView("new");
    });
  }

  if (progressOrders) {
    progressOrders.addEventListener("click", () => {
      showView("orders");
    });
  }

  // Print Order slip
  if (printOrderButton) {
    printOrderButton.addEventListener("click", () => {
      window.print();
    });
  }

  // Search input
  if (ordersSearch) {
    ordersSearch.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value.trim().toLowerCase();
      if (clearSearchBtn) {
        clearSearchBtn.style.display = currentSearchQuery ? "block" : "none";
      }
      renderOrders();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      if (ordersSearch) ordersSearch.value = "";
      currentSearchQuery = "";
      clearSearchBtn.style.display = "none";
      renderOrders();
      if (ordersSearch) ordersSearch.focus();
    });
  }

  // Event delegation on orders list
  if (ordersList) {
    ordersList.addEventListener("click", (e) => {
      const viewBtn = e.target.closest(".view-button");
      if (viewBtn) {
        const id = viewBtn.getAttribute("data-id");
        if (id) openOrder(id);
        return;
      }

      const delBtn = e.target.closest(".delete-button");
      if (delBtn) {
        const id = delBtn.getAttribute("data-id");
        if (id) deleteOrder(id);
        return;
      }
    });
  }
}

// ==========================================
// PHOTO PREVIEW & HANDLING
// ==========================================

function setupPhotoPreview() {
  if (!samplePhoto || !photoPreview) return;

  samplePhoto.addEventListener("change", () => {
    const file = samplePhoto.files && samplePhoto.files[0];

    if (!file) {
      clearPhotoPreview();
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file (PNG, JPG, WEBP, etc.).");
      samplePhoto.value = "";
      clearPhotoPreview();
      return;
    }

    // Limit large images if necessary
    const reader = new FileReader();
    reader.onload = (event) => {
      photoPreview.src = event.target.result;
      photoPreview.style.display = "block";
      if (removePhotoBtn) removePhotoBtn.style.display = "inline-block";
    };
    reader.readAsDataURL(file);
  });

  if (removePhotoBtn) {
    removePhotoBtn.addEventListener("click", () => {
      clearPhotoPreview();
    });
  }
}

function clearPhotoPreview() {
  if (samplePhoto) samplePhoto.value = "";
  if (photoPreview) {
    photoPreview.src = "";
    photoPreview.style.display = "none";
  }
  if (removePhotoBtn) removePhotoBtn.style.display = "none";
}

// ==========================================
// RESET FORM
// ==========================================

function resetNewOrderForm() {
  if (orderForm) orderForm.reset();
  clearPhotoPreview();
  if (orderStatus) {
    orderStatus.textContent = "";
    orderStatus.style.color = "var(--green)";
  }
  updateOrderNumber();
}

// ==========================================
// SAVE NEW ORDER
// ==========================================

if (orderForm) {
  orderForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const clientNameInput = document.getElementById("client-name");
    const phoneInput = document.getElementById("phone");

    const clientName = clientNameInput ? clientNameInput.value.trim() : "";
    const phone = phoneInput ? phoneInput.value.trim() : "";

    if (!clientName || !phone) {
      if (orderStatus) {
        orderStatus.textContent = "Please provide client name and phone number.";
        orderStatus.style.color = "var(--danger)";
      }
      return;
    }

    if (orderStatus) {
      orderStatus.textContent = "Saving order record...";
      orderStatus.style.color = "var(--ink)";
    }

    const formData = new FormData(orderForm);

    let photo = "";
    const photoFile = samplePhoto && samplePhoto.files ? samplePhoto.files[0] : null;

    if (photoFile && photoFile.type.startsWith("image/")) {
      try {
        photo = await convertFileToBase64(photoFile);
      } catch (err) {
        console.warn("Photo encoding failed:", err);
      }
    }

    const nextNumber = getNextOrderNumber();

    const newOrder = {
      id: generateId(),
      orderNumber: nextNumber,
      createdAt: new Date().toISOString(),

      client: {
        name: clientName,
        phone: phone,
        address: (formData.get("address") || "").toString().trim()
      },

      pant: {
        length: formatMeasurement(formData.get("pantLength")),
        waist: formatMeasurement(formData.get("waist")),
        crotch: formatMeasurement(formData.get("crotch")),
        hipCircumference: formatMeasurement(formData.get("hipCircumference")),
        thighCircumference: formatMeasurement(formData.get("thighCircumference")),
        kneeCircumference: formatMeasurement(formData.get("kneeCircumference")),
        ankleCircumference: formatMeasurement(formData.get("ankleCircumference")),
        type: (formData.get("pantType") || "").toString().trim(),
        pocketCount: (formData.get("pocketCount") || "").toString().trim()
      },

      shirt: {
        length: formatMeasurement(formData.get("shirtLength")),
        shoulderWidth: formatMeasurement(formData.get("shoulderWidth")),
        chest: formatMeasurement(formData.get("chest")),
        waist: formatMeasurement(formData.get("shirtWaist")),
        hipCircumference: formatMeasurement(formData.get("shirtHipCircumference")),
        armCircumference: formatMeasurement(formData.get("armCircumference")),
        bicep: formatMeasurement(formData.get("bicep")),
        sleeveLength: formatMeasurement(formData.get("sleeveLength")),
        neck: formatMeasurement(formData.get("neck")),
        collarType: (formData.get("collarType") || "").toString().trim(),
        shirtType: (formData.get("shirtType") || "").toString().trim()
      },

      photo: photo,
      notes: (formData.get("notes") || "").toString().trim()
    };

    orders.unshift(newOrder);
    saveOrders();
    updateNavCount();

    if (orderStatus) {
      orderStatus.textContent = `Order ${newOrder.orderNumber} for ${newOrder.client.name} saved successfully!`;
      orderStatus.style.color = "var(--green)";
    }

    setTimeout(() => {
      resetNewOrderForm();
      showView("orders");
    }, 750);
  });
}

function formatMeasurement(val) {
  if (val === null || val === undefined) return "";
  const s = String(val).trim();
  return s === "" ? "" : s;
}

// ==========================================
// FILE TO BASE64
// ==========================================

function convertFileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==========================================
// HELPERS: ID & ORDER NUMBERS
// ==========================================

function generateId() {
  return (
    Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 9)
  );
}

function getNextOrderNumber() {
  // Find highest number from existing orders
  let maxNum = 0;
  orders.forEach((o) => {
    if (o.orderNumber) {
      const match = o.orderNumber.match(/\d+/);
      if (match) {
        const n = parseInt(match[0], 10);
        if (n > maxNum) maxNum = n;
      }
    }
  });
  const nextNum = Math.max(orders.length + 1, maxNum + 1);
  return `WF-${String(nextNum).padStart(3, "0")}`;
}

function updateOrderNumber() {
  if (orderNumber) {
    orderNumber.textContent = `ORDER ${getNextOrderNumber()}`;
  }
}

function updateNavCount() {
  if (navOrderCount) {
    navOrderCount.textContent = String(orders.length);
  }
}

// ==========================================
// RENDER ORDERS DIRECTORY
// ==========================================

function renderOrders() {
  if (!ordersList) return;

  updateNavCount();

  const query = currentSearchQuery.toLowerCase();
  const filteredOrders = orders.filter((order) => {
    if (!query) return true;
    const name = (order.client?.name || "").toLowerCase();
    const phone = (order.client?.phone || "").toLowerCase();
    const num = (order.orderNumber || "").toLowerCase();
    const address = (order.client?.address || "").toLowerCase();
    const notes = (order.notes || "").toLowerCase();
    const pantType = (order.pant?.type || "").toLowerCase();
    const collarType = (order.shirt?.collarType || "").toLowerCase();

    return (
      name.includes(query) ||
      phone.includes(query) ||
      num.includes(query) ||
      address.includes(query) ||
      notes.includes(query) ||
      pantType.includes(query) ||
      collarType.includes(query)
    );
  });

  if (ordersFilterCount) {
    if (!orders.length) {
      ordersFilterCount.textContent = "0 orders recorded";
    } else if (query) {
      ordersFilterCount.textContent = `Showing ${filteredOrders.length} of ${orders.length} orders`;
    } else {
      ordersFilterCount.textContent = `Total ${orders.length} order${orders.length === 1 ? "" : "s"}`;
    }
  }

  if (!orders.length) {
    ordersList.innerHTML = `
      <div class="empty-orders">
        <h3>No orders saved yet</h3>
        <p>Start by recording measurements for your first client order.</p>
        <button
          class="primary-button compact-btn"
          type="button"
          onclick="window.showNewOrderTab()"
          style="margin-top: 18px; display: inline-flex;"
        >
          + Create First Order
        </button>
      </div>
    `;
    return;
  }

  if (!filteredOrders.length) {
    ordersList.innerHTML = `
      <div class="no-search-results">
        <h3>No matching orders found</h3>
        <p>No client records match the search term "<strong>${escapeHTML(currentSearchQuery)}</strong>".</p>
      </div>
    `;
    return;
  }

  ordersList.innerHTML = filteredOrders
    .map((order) => {
      const date = formatDate(order.createdAt);
      const garmentSummary = getGarmentSummary(order);

      return `
      <article class="order-card" data-order-id="${escapeHTML(order.id)}">
        <div class="order-number">
          ${escapeHTML(order.orderNumber || "WF-000")}
        </div>

        <div>
          <h3>${escapeHTML(order.client?.name || "Unnamed Client")}</h3>
          <div class="order-card-meta">
            <span>📞 ${escapeHTML(order.client?.phone || "-")}</span>
            <span>📅 ${escapeHTML(date)}</span>
            ${garmentSummary ? `<span>✂️ ${escapeHTML(garmentSummary)}</span>` : ""}
          </div>
        </div>

        <div class="order-card-actions">
          <button
            class="view-button"
            type="button"
            data-id="${escapeHTML(order.id)}"
            title="View full measurements"
          >
            View Details
          </button>

          <button
            class="delete-button"
            type="button"
            data-id="${escapeHTML(order.id)}"
            title="Delete order"
          >
            Delete
          </button>
        </div>
      </article>
    `;
    })
    .join("");
}

function getGarmentSummary(order) {
  const parts = [];
  if (hasPantMeasurements(order.pant)) {
    parts.push(order.pant.type || "Pant");
  }
  if (hasShirtMeasurements(order.shirt)) {
    parts.push(order.shirt.shirtType || order.shirt.collarType || "Shirt");
  }
  return parts.join(" & ");
}

function hasPantMeasurements(pant) {
  if (!pant) return false;
  return Boolean(
    pant.length ||
    pant.waist ||
    pant.crotch ||
    pant.hipCircumference ||
    pant.thighCircumference ||
    pant.kneeCircumference ||
    pant.ankleCircumference ||
    pant.type
  );
}

function hasShirtMeasurements(shirt) {
  if (!shirt) return false;
  return Boolean(
    shirt.length ||
    shirt.shoulderWidth ||
    shirt.chest ||
    shirt.waist ||
    shirt.hipCircumference ||
    shirt.armCircumference ||
    shirt.bicep ||
    shirt.sleeveLength ||
    shirt.neck ||
    shirt.collarType ||
    shirt.shirtType
  );
}

// ==========================================
// OPEN / VIEW ORDER DETAILS
// ==========================================

function openOrder(id) {
  const order = orders.find((item) => item.id === id);

  if (!order) {
    alert("Order record not found.");
    return;
  }

  currentDetailOrderId = id;

  const detailTitle = document.getElementById("detail-title");
  const detailOrderNumber = document.getElementById("detail-order-number");
  const detailCreatedDate = document.getElementById("detail-created-date");

  if (detailTitle) detailTitle.textContent = order.client?.name || "Client Order";
  if (detailOrderNumber) detailOrderNumber.textContent = `ORDER ${order.orderNumber || "DETAILS"}`;
  if (detailCreatedDate) {
    detailCreatedDate.textContent = `Created on ${formatDate(order.createdAt)} • Phone: ${order.client?.phone || "-"}`;
  }

  if (!orderDetail) return;

  orderDetail.innerHTML = `
    <!-- CLIENT DETAILS -->
    <div class="detail-section">
      <h3>Client Information</h3>
      <div class="detail-grid">
        ${detailItem("Order Number", order.orderNumber)}
        ${detailItem("Client Name", order.client?.name)}
        ${detailItem("Phone Number", order.client?.phone)}
        ${detailItem("Address / Village", order.client?.address)}
        ${detailItem("Date Created", formatDate(order.createdAt))}
      </div>
    </div>

    <!-- PANT MEASUREMENTS -->
    <div class="detail-section">
      <h3>Pant Measurements (Inches)</h3>
      <div class="detail-grid">
        ${detailItem("Pant Length", formatMeasurementUnit(order.pant?.length))}
        ${detailItem("Waist", formatMeasurementUnit(order.pant?.waist))}
        ${detailItem("Crotch / Seat", formatMeasurementUnit(order.pant?.crotch))}
        ${detailItem("Hip Circumference", formatMeasurementUnit(order.pant?.hipCircumference))}
        ${detailItem("Thigh Circumference", formatMeasurementUnit(order.pant?.thighCircumference))}
        ${detailItem("Knee Circumference", formatMeasurementUnit(order.pant?.kneeCircumference))}
        ${detailItem("Ankle Circumference", formatMeasurementUnit(order.pant?.ankleCircumference))}
        ${detailItem("Pant Style / Cut", order.pant?.type)}
        ${detailItem("Pockets Count", order.pant?.pocketCount)}
      </div>
    </div>

    <!-- SHIRT MEASUREMENTS -->
    <div class="detail-section">
      <h3>Shirt Measurements (Inches)</h3>
      <div class="detail-grid">
        ${detailItem("Shirt Length", formatMeasurementUnit(order.shirt?.length))}
        ${detailItem("Shoulder Width", formatMeasurementUnit(order.shirt?.shoulderWidth))}
        ${detailItem("Chest", formatMeasurementUnit(order.shirt?.chest))}
        ${detailItem("Waist", formatMeasurementUnit(order.shirt?.waist))}
        ${detailItem("Hip Circumference", formatMeasurementUnit(order.shirt?.hipCircumference))}
        ${detailItem("Arm Circumference", formatMeasurementUnit(order.shirt?.armCircumference))}
        ${detailItem("Bicep", formatMeasurementUnit(order.shirt?.bicep))}
        ${detailItem("Sleeve Length", formatMeasurementUnit(order.shirt?.sleeveLength))}
        ${detailItem("Neck", formatMeasurementUnit(order.shirt?.neck))}
        ${detailItem("Collar Type", order.shirt?.collarType)}
        ${detailItem("Garment Style", order.shirt?.shirtType)}
      </div>
    </div>

    <!-- PHOTO REFERENCE -->
    ${
      order.photo
        ? `
      <div class="detail-section">
        <h3>Sample Reference Photo</h3>
        <div class="detail-photo-wrap">
          <img
            class="detail-photo"
            src="${order.photo}"
            alt="Client reference photo"
          >
        </div>
      </div>
    `
        : ""
    }

    <!-- FIT NOTES -->
    ${
      order.notes
        ? `
      <div class="detail-section">
        <h3>Fit Notes & Instructions</h3>
        <p class="detail-notes">${escapeHTML(order.notes)}</p>
      </div>
    `
        : ""
    }

    <!-- QUICK ACTIONS INSIDE DETAIL -->
    <div class="detail-section" style="display: flex; gap: 15px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
      <button
        class="secondary-button"
        type="button"
        onclick="window.print()"
      >
        🖨️ Print Slip / Save PDF
      </button>

      <button
        class="delete-button"
        type="button"
        onclick="window.deleteOrder('${escapeHTML(order.id)}')"
      >
        🗑️ Delete this order
      </button>
    </div>
  `;

  showView("detail");
}

function formatMeasurementUnit(val) {
  if (!val || val === "-" || val === "null" || val === "undefined") return "-";
  return `${val}"`;
}

function detailItem(label, value) {
  const displayVal =
    value && String(value).trim() !== "" && String(value).trim() !== "null"
      ? String(value).trim()
      : "-";

  return `
    <div class="detail-item">
      <span>${escapeHTML(label)}</span>
      <strong>${escapeHTML(displayVal)}</strong>
    </div>
  `;
}

// ==========================================
// DELETE ORDER
// ==========================================

function deleteOrder(id) {
  const order = orders.find((item) => item.id === id);

  if (!order) {
    alert("Order not found.");
    return;
  }

  const confirmed = confirm(
    `Are you sure you want to delete order ${order.orderNumber} for ${order.client?.name || "this client"}?`
  );

  if (!confirmed) return;

  orders = orders.filter((item) => item.id !== id);
  saveOrders();
  updateNavCount();
  updateOrderNumber();

  // If currently in detail view of this deleted order, return to orders list
  if (currentDetailOrderId === id) {
    currentDetailOrderId = null;
    showView("orders");
  } else {
    renderOrders();
  }
}

// ==========================================
// UTILITIES: DATE & ESCAPING
// ==========================================

function formatDate(dateString) {
  if (!dateString) return "-";
  try {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date(dateString));
  } catch (err) {
    return dateString;
  }
}

function escapeHTML(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ==========================================
// GLOBAL EXPOSURE FOR SAFE INLINE & INTEROP
// ==========================================

window.openOrder = openOrder;
window.deleteOrder = deleteOrder;
window.showView = showView;
window.showNewOrderTab = () => {
  resetNewOrderForm();
  showView("new");
};

