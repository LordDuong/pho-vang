import "./auth.js";
import {
  bootstrapData,
  closeMod,
  enterApp,
  fmt,
  getMenuImage,
  MENU_IMG_FALLBACK,
  loadAuthSession,
  registerActions,
  persistLocalData,
  registerRoleHandler,
  saveAuthSession,
  setCurrentUser,
  setRole,
  state,
  toast,
} from "./app.js";
import { push, ref, set } from "./firebase-config.js";

const renderMenu = (category) => {
  const grid = document.getElementById("menu-grid");
  if (!grid) return;

  const items =
    category === "all"
      ? state.menuItems
      : state.menuItems.filter((item) => item.cat === category);

  if (!items.length) {
    grid.innerHTML =
      '<div style="color:var(--mid);padding:24px;grid-column:1/-1">Không có món trong danh mục này</div>';
    return;
  }

  grid.innerHTML = items
    .map(
      (item) => `
    <div class="menu-card${item.avail ? "" : " unavail"}" onclick="${item.avail ? `W.addToCart('${item.id}')` : ""}">
      <div class="mc-img"><img class="mc-photo" src="${getMenuImage(item)}" alt="${item.name}" loading="lazy" onerror="this.onerror=null;this.src='${MENU_IMG_FALLBACK}'" /></div>
      <div class="mc-body">
        <div class="mc-name">${item.name}</div>
        <div class="mc-desc">${item.desc}</div>
        <div class="mc-foot">
          <div class="mc-price">${fmt(item.price)}</div>
          ${item.avail ? `<button class="btn-add" onclick="event.stopPropagation();W.addToCart('${item.id}')">+</button>` : '<span style="font-size:9px;color:var(--mid)">Hết</span>'}
        </div>
      </div>
    </div>`,
    )
    .join("");
};

const renderCart = () => {
  const container = document.getElementById("cart-items");
  const count = document.getElementById("cart-cnt");
  const total = document.getElementById("cart-tot");
  const orderButton = document.getElementById("btn-order");
  if (!container || !count || !total || !orderButton) return;

  const cartTotal = state.cart.reduce((sum, item) => sum + item.item.price * item.qty, 0);
  const itemCount = state.cart.reduce((sum, item) => sum + item.qty, 0);

  count.textContent = itemCount;
  total.textContent = fmt(cartTotal);
  orderButton.disabled = state.cart.length === 0;

  container.innerHTML =
    state.cart.length === 0
      ? '<div class="cart-empty"><div class="ce-icon">🍽️</div><div>Chưa có món</div></div>'
      : state.cart
          .map(
            (item) => `<div class="cart-item">
      <div class="ci-e">${item.item.emoji}</div>
      <div class="ci-info"><div class="ci-name">${item.item.name}</div><div class="ci-price">${fmt(item.item.price)}</div></div>
      <div class="ci-qty">
        <button class="qbtn" onclick="W.chgQty('${item.item.id}',-1)">−</button>
        <span class="qnum">${item.qty}</span>
        <button class="qbtn" onclick="W.chgQty('${item.item.id}',1)">+</button>
      </div>
    </div>`,
          )
          .join("");
};

const filterCat = (category, button) => {
  state.currentCategory = category;
  document.querySelectorAll(".cat-btn").forEach((item) => item.classList.remove("active"));
  button?.classList.add("active");
  renderMenu(category);
};

const addToCart = (id) => {
  const item = state.menuItems.find((menuItem) => menuItem.id === id);
  if (!item || !item.avail) return;

  const existing = state.cart.find((cartItem) => cartItem.item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ item: { ...item }, qty: 1 });
  }

  renderCart();
  toast(`✅ ${item.emoji} ${item.name}`, "s");
};

const chgQty = (id, delta) => {
  const index = state.cart.findIndex((cartItem) => cartItem.item.id === id);
  if (index < 0) return;
  state.cart[index].qty += delta;
  if (state.cart[index].qty <= 0) state.cart.splice(index, 1);
  renderCart();
};

const placeOrder = () => {
  const table = document.getElementById("tbl-sel")?.value;
  if (!table) {
    toast("⚠️ Chọn số bàn!", "e");
    return;
  }

  const total = state.cart.reduce((sum, item) => sum + item.item.price * item.qty, 0);
  const paySummary = document.getElementById("pay-sum");
  if (!paySummary) return;

  paySummary.innerHTML = `
    <div style="margin-bottom:10px"><strong>📍 ${table}</strong></div>
    ${state.cart
      .map(
        (item) => `<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0">
      <span>${item.item.emoji} ${item.item.name} ×${item.qty}</span><span style="color:var(--gold)">${fmt(item.item.price * item.qty)}</span>
    </div>`,
      )
      .join("")}
    <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;border-top:1px solid rgba(201,168,76,.2);margin-top:10px;padding-top:10px">
      <span>Tổng</span><span style="color:var(--green)">${fmt(total)}</span>
    </div>`;

  document.getElementById("pay-modal")?.classList.add("active");
};

const confirmOrder = async () => {
  const table = document.getElementById("tbl-sel")?.value;
  if (!table) return;

  const total = state.cart.reduce((sum, item) => sum + item.item.price * item.qty, 0);
  const order = {
    table,
    total,
    status: "pending",
    ts: Date.now(),
    time: new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    items: state.cart.map((item) => ({
      id: item.item.id,
      name: item.item.name,
      emoji: item.item.emoji,
      price: item.item.price,
      qty: item.qty,
    })),
  };

  if (state.FB) {
    const orderRef = push(ref(state.DB, "orders"));
    await set(orderRef, { ...order, fbKey: orderRef.key });
  } else {
    const key = `o${Date.now()}`;
    state.activeOrders[key] = { ...order, fbKey: key };
    persistLocalData();
  }

  closeMod("pay-modal");
  state.cart = [];
  renderCart();
  const tableSelect = document.getElementById("tbl-sel");
  if (tableSelect) tableSelect.value = "";
  toast("🎉 Đặt món thành công!", "s");
};

const ensureCustomerSession = () => {
  const session = loadAuthSession();
  if (session?.role && session?.currentUser) {
    if (session.role !== "customer") {
      window.location.href = "dashboard.html";
      return false;
    }
    setRole(session.role);
    setCurrentUser(session.currentUser);
    return true;
  }

  setRole("customer");
  setCurrentUser({ name: "Khách vãng lai", role: "customer" });
  saveAuthSession();
  return true;
};

const bootMenuPage = async () => {
  await bootstrapData({ fallbackToLocal: true });
  if (!ensureCustomerSession()) return;
  enterApp();
};

registerRoleHandler("customer", {
  show() {
    renderMenu(state.currentCategory);
    renderCart();
  },
  refresh() {
    renderMenu(state.currentCategory);
    renderCart();
  },
});

registerActions({ addToCart, chgQty, confirmOrder, filterCat, placeOrder });

bootMenuPage();
