const roles = [
  { id: "customer", label: "Khach" },
  { id: "waiter", label: "Phuc vu" },
  { id: "cashier", label: "Thu ngan" },
  { id: "kitchen", label: "Dau bep" },
  { id: "manager", label: "Quan ly" },
  { id: "owner", label: "Chu quan" },
];

const statusFlow = ["pending", "confirmed", "cooking", "ready", "serving", "waiting_pay", "paid"];
const statusLabels = {
  pending: "Moi tao",
  confirmed: "Da nhan",
  cooking: "Dang nau",
  ready: "Da xong",
  serving: "Dang phuc vu",
  waiting_pay: "Cho thanh toan",
  paid: "Da thanh toan",
};

const payMethods = [
  { value: "Ti\u1ec1n m\u1eb7t", label: "Tien mat" },
  { value: "Chuy\u1ec3n kho\u1ea3n", label: "Chuyen khoan" },
  { value: "Momo", label: "Momo" },
  { value: "VNPay", label: "VNPay" },
];

function normalizeRole(role) {
  if (role === "staff") return "waiter";
  if (role === "admin") return "owner";
  return role;
}

const savedUser = JSON.parse(localStorage.getItem("user") || "null");
const defaultTables = ["Ban 1", "Ban 2", "Ban 3", "Ban 4", "Ban 5", "Ban 6", "Ban 7", "Ban 8"];
const fixedShifts = [
  { value: "Ca 1", label: "Ca 1", time: "8:00 - 16:00" },
  { value: "Ca 2", label: "Ca 2", time: "16:00 - 24:00" },
];

// Get API base from URL parameter, localStorage, or default
function getApiBase() {
  const params = new URLSearchParams(window.location.search);
  if (params.has("api")) return params.get("api");
  return localStorage.getItem("apiBase") || window.location.origin.replace(/:5500.*/, ":8080");
}

const state = {
  apiBase: getApiBase(),
  token: localStorage.getItem("token") || "",
  user: savedUser ? { ...savedUser, role: normalizeRole(savedUser.role) } : null,
  role: localStorage.getItem("token") ? normalizeRole(localStorage.getItem("activeRole") || savedUser?.role || "customer") : "customer",
  menu: [],
  orders: [],
  cart: JSON.parse(localStorage.getItem("cart") || "[]"),
  tables: JSON.parse(localStorage.getItem("tables") || JSON.stringify(defaultTables)),
  selectedTable: localStorage.getItem("selectedTable") || defaultTables[0],
  employees: [],
  schedule: null,
  attendanceByDate: {},
  chatMessages: JSON.parse(localStorage.getItem("chatMessages") || "[]"),
  ws: null,
  events: [],
};

const $ = (selector) => document.querySelector(selector);
const money = (value) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));
const userId = (user) => user.id ?? user.ID;
const usernameOf = (user) => user.username ?? user.Username ?? "";
const nameOf = (user) => user.name ?? user.Name ?? "";
const roleOf = (user) => normalizeRole(user.role ?? user.Role ?? "");
const wageOf = (user) => user.wage ?? user.Wage ?? 0;
const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("vi-VN");
};
const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("vi-VN");
};

function saveSession() {
  localStorage.setItem("apiBase", state.apiBase);
  localStorage.setItem("activeRole", state.role);
  localStorage.setItem("cart", JSON.stringify(state.cart));
  localStorage.setItem("tables", JSON.stringify(state.tables));
  localStorage.setItem("selectedTable", state.selectedTable);
  localStorage.setItem("chatMessages", JSON.stringify(state.chatMessages.slice(-20)));
  if (state.token) localStorage.setItem("token", state.token);
  if (state.user) localStorage.setItem("user", JSON.stringify(state.user));
}

function toast(message, isError = false) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.toggle("danger", isError);
  el.classList.remove("hidden");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => el.classList.add("hidden"), 3200);
}

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const res = await fetch(`${state.apiBase}${path}`, { ...options, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) throw new Error(body.error || body.message || "Request failed");
  return body.data ?? body;
}

function setRole(role) {
  if (!state.token && role !== "customer") return openLogin();
  state.role = role;
  saveSession();
  render();
  connectWS();
  refreshRoleData();
}

function renderShell() {
  $("#apiBase").value = state.apiBase;
  $("#currentUser").textContent = state.user ? `${state.user.name || state.user.username} (${state.user.role})` : "Khach vang lai";
  $("#openLoginBtn").classList.toggle("hidden", Boolean(state.token));
  $("#logoutBtn").classList.toggle("hidden", !state.token);

  const employeeRole = state.user?.role || "customer";
  const visibleRoles = state.token
    ? roles.filter((role) => role.id === "customer" || role.id === employeeRole)
    : roles.filter((role) => role.id === "customer");
  $("#roleNav").innerHTML = visibleRoles
    .map((role) => `<button type="button" data-role="${role.id}" class="${role.id === state.role ? "active" : ""}">${role.label}</button>`)
    .join("");
  $("#roleNav").querySelectorAll("button").forEach((btn) => btn.addEventListener("click", () => setRole(btn.dataset.role)));

  const active = roles.find((role) => role.id === state.role);
  $("#pageTitle").textContent = state.role === "customer" ? "Menu goi mon" : active ? active.label : "Dashboard";
  roles.forEach((role) => $(`#${role.id}View`).classList.toggle("hidden", role.id !== state.role));
}

function render() {
  renderShell();
  renderCustomer();
  renderWaiter();
  renderKitchen();
  renderCashier();
  renderManager();
  renderOwner();
}

function menuCard(item, actions = true) {
  return `
    <article class="menu-item ${item.avail === false ? "unavailable" : ""}">
      <div class="menu-top">
        <div>
          <strong>${item.name}</strong>
          <div class="muted">${item.cat || "Khac"}</div>
        </div>
        <span class="emoji">${item.emoji || "PV"}</span>
      </div>
      <div class="muted">${item.desc || item.des || "Mon trong thuc don"}</div>
      <div class="menu-top">
        <span class="price">${money(item.price)}</span>
        ${actions ? `<button type="button" data-add="${item.id}" ${item.avail === false ? "disabled" : ""}>Them</button>` : ""}
      </div>
    </article>
  `;
}

function renderCustomer() {
  $("#customerView").innerHTML = `
    <div class="grid two">
      <section class="panel">
        <div class="toolbar">
          <input id="menuSearch" placeholder="Tim mon" />
          <select id="catFilter"><option value="">Tat ca nhom</option>${[...new Set(state.menu.map((x) => x.cat).filter(Boolean))]
            .map((cat) => `<option value="${cat}">${cat}</option>`)
            .join("")}</select>
          <button id="reloadMenuBtn" type="button" class="secondary">Tai menu</button>
        </div>
        <div id="menuGrid" class="menu-grid"></div>
      </section>
      <aside class="panel">
        <h2>Gio mon</h2>
        <div class="field">
          <span>Chon ban</span>
          <div id="tablePicker" class="table-picker">
            ${state.tables
              .map((table) => `<button class="table-option ${table === state.selectedTable ? "active" : ""}" data-table="${table}" type="button">${table}</button>`)
              .join("")}
          </div>
        </div>
        <ul id="cartList" class="cart-list"></ul>
        <div class="order-foot">
          <strong id="cartTotal"></strong>
          <button id="createOrderBtn" type="button">Gui don</button>
        </div>
        ${chatbotMarkup()}
      </aside>
    </div>
  `;

  const drawMenu = () => {
    const query = ($("#menuSearch").value || "").toLowerCase();
    const cat = $("#catFilter").value;
    const items = state.menu.filter((item) => (!cat || item.cat === cat) && item.name.toLowerCase().includes(query));
    $("#menuGrid").innerHTML = items.map((item) => menuCard(item)).join("") || `<p class="muted">Chua co mon.</p>`;
    $("#menuGrid").querySelectorAll("[data-add]").forEach((btn) => btn.addEventListener("click", () => addToCart(Number(btn.dataset.add))));
  };

  const drawCart = () => {
    $("#cartList").innerHTML =
      state.cart
        .map(
          (item) => `
          <li>
            <span>${item.emoji || ""} ${item.name}<br><span class="muted">${money(item.price)}</span></span>
            <span class="cart-row-actions">
              <button class="icon-btn" data-dec="${item.menu_item_id}" type="button">-</button>
              <strong>${item.quantity}</strong>
              <button class="icon-btn" data-inc="${item.menu_item_id}" type="button">+</button>
            </span>
          </li>`,
        )
        .join("") || `<li><span class="muted">Chua chon mon</span></li>`;
    $("#cartTotal").textContent = money(state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
    $("#cartList").querySelectorAll("[data-inc]").forEach((btn) => btn.addEventListener("click", () => changeCart(Number(btn.dataset.inc), 1)));
    $("#cartList").querySelectorAll("[data-dec]").forEach((btn) => btn.addEventListener("click", () => changeCart(Number(btn.dataset.dec), -1)));
  };

  $("#menuSearch").addEventListener("input", drawMenu);
  $("#catFilter").addEventListener("change", drawMenu);
  $("#reloadMenuBtn").addEventListener("click", loadMenu);
  $("#createOrderBtn").addEventListener("click", createOrder);
  $("#tablePicker").querySelectorAll("[data-table]").forEach((btn) => btn.addEventListener("click", () => selectTable(btn.dataset.table)));
  bindChatbot();
  drawMenu();
  drawCart();
}

function chatbotMarkup() {
  const messages =
    state.chatMessages.length > 0
      ? state.chatMessages
      : [{ from: "bot", text: "Xin chao, minh co the goi y mon, tim mon theo ten, hoac xem tong tien gio hang cho ban." }];
  return `
    <section class="chatbox">
      <div class="chat-head">
        <strong>Tro ly menu</strong>
        <button id="clearChatBtn" class="ghost small-btn" type="button">Xoa</button>
      </div>
      <div id="chatMessages" class="chat-messages">
        ${messages.map((msg) => `<div class="chat-msg ${msg.from}">${msg.text}</div>`).join("")}
      </div>
      <form id="chatForm" class="chat-form">
        <input id="chatInput" placeholder="Hoi ve mon an..." />
        <button type="submit">Gui</button>
      </form>
    </section>`;
}

function bindChatbot() {
  const form = $("#chatForm");
  if (!form) return;
  const messages = $("#chatMessages");
  messages.scrollTop = messages.scrollHeight;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = $("#chatInput");
    const text = input.value.trim();
    if (!text) return;
    state.chatMessages.push({ from: "user", text });
    state.chatMessages.push({ from: "bot", text: botReply(text) });
    input.value = "";
    saveSession();
    renderCustomer();
  });
  $("#clearChatBtn").addEventListener("click", () => {
    state.chatMessages = [];
    saveSession();
    renderCustomer();
  });
}

function botReply(rawText) {
  const text = rawText.toLowerCase();
  const availableMenu = state.menu.filter((item) => item.avail !== false);
  if (!availableMenu.length) return "Menu chua tai du lieu. Ban bam Tai menu roi hoi lai nhe.";

  if (text.includes("gio") || text.includes("tong") || text.includes("bao nhieu")) {
    const total = state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return state.cart.length ? `Gio hang hien co ${state.cart.length} mon, tong tam tinh ${money(total)}.` : "Gio hang dang trong. Ban chon mon trong menu truoc nhe.";
  }

  if (text.includes("re") || text.includes("gia thap") || text.includes("tiet kiem")) {
    const items = [...availableMenu].sort((a, b) => Number(a.price) - Number(b.price)).slice(0, 3);
    return `Mon gia tot: ${items.map((item) => `${item.name} (${money(item.price)})`).join(", ")}.`;
  }

  if (text.includes("goi y") || text.includes("nen an") || text.includes("recommend")) {
    const items = [...availableMenu].sort((a, b) => Number(b.sold_count || 0) - Number(a.sold_count || 0)).slice(0, 3);
    return `Minh goi y: ${items.map((item) => `${item.name} (${money(item.price)})`).join(", ")}.`;
  }

  const found = availableMenu.find((item) => text.includes(String(item.name).toLowerCase()));
  if (found) return `${found.name}: ${money(found.price)}. ${found.desc || found.des || "Mon nay dang co san trong menu."}`;

  const matchedByCategory = availableMenu.filter((item) => item.cat && text.includes(String(item.cat).toLowerCase())).slice(0, 4);
  if (matchedByCategory.length) return `Nhom nay co: ${matchedByCategory.map((item) => `${item.name} (${money(item.price)})`).join(", ")}.`;

  return "Minh co the giup tim mon, goi y mon, xem mon gia tot, hoac tinh tong gio hang. Vi du: 'goi y mon', 'mon re', 'pho bo gia bao nhieu'.";
}

function selectTable(tableName) {
  state.selectedTable = tableName;
  saveSession();
  renderCustomer();
}

function addToCart(id) {
  const item = state.menu.find((x) => Number(x.id) === id);
  if (!item) return;
  const existing = state.cart.find((x) => Number(x.menu_item_id) === id);
  if (existing) existing.quantity += 1;
  else state.cart.push({ menu_item_id: item.id, name: item.name, emoji: item.emoji, price: item.price, quantity: 1 });
  saveSession();
  renderCustomer();
}

function changeCart(id, delta) {
  const item = state.cart.find((x) => Number(x.menu_item_id) === id);
  if (!item) return;
  item.quantity += delta;
  state.cart = state.cart.filter((x) => x.quantity > 0);
  saveSession();
  renderCustomer();
}

async function createOrder() {
  const tableName = state.selectedTable;
  if (!tableName || state.cart.length === 0) return toast("Can chon ban va mon", true);
  try {
    await api("/api/orders", { method: "POST", body: JSON.stringify({ table_name: tableName, items: state.cart }) });
    state.cart = [];
    saveSession();
    toast("Da gui don");
    if (state.token) await loadOrders();
    render();
  } catch (err) {
    toast(err.message, true);
  }
}

function renderOrders(containerId, filterStatuses, mode) {
  const orders = state.orders.filter((order) => !filterStatuses || filterStatuses.includes(order.status));
  const container = $(`#${containerId}`);
  container.innerHTML = orders.map((order) => orderCard(order, mode)).join("") || `<p class="muted">Chua co don phu hop.</p>`;
  container.querySelectorAll("[data-status]").forEach((btn) => {
    btn.addEventListener("click", () => updateStatus(Number(btn.dataset.order), btn.dataset.status));
  });
  container.querySelectorAll("[data-pay]").forEach((btn) => {
    btn.addEventListener("click", () => createSale(Number(btn.dataset.pay), btn.dataset.method));
  });
}

function orderCard(order, mode) {
  const currentIndex = statusFlow.indexOf(order.status);
  const nextStatus = statusFlow[currentIndex + 1];
  const canMove =
    (mode === "waiter" && ["pending", "ready", "serving"].includes(order.status)) ||
    (mode === "kitchen" && ["confirmed", "cooking"].includes(order.status)) ||
    mode === "manager";
  const items = (order.items || []).map((item) => `<li><span>${item.emoji || ""} ${item.name} x${item.quantity}</span><span>${money(item.price * item.quantity)}</span></li>`).join("");
  const statusButton = nextStatus && canMove ? `<button data-order="${order.id}" data-status="${nextStatus}" type="button">Sang ${statusLabels[nextStatus]}</button>` : "";
  const payButtons =
    mode === "cashier" && order.status === "waiting_pay"
      ? payMethods.map((method) => `<button data-pay="${order.id}" data-method="${method.value}" type="button">${method.label}</button>`).join("")
      : "";
  return `
    <article class="order-card">
      <div class="order-head">
        <div><strong>#${order.id}</strong><div class="muted">${order.table_name}</div></div>
        <span class="status-pill">${statusLabels[order.status] || order.status}</span>
      </div>
      <ul class="order-items">${items}</ul>
      <div class="order-foot">
        <strong>${money(order.total)}</strong>
        <div class="order-actions">${statusButton}${payButtons}</div>
      </div>
    </article>`;
}

function renderWaiter() {
  $("#waiterView").innerHTML = `
    <section class="panel">
      <div class="toolbar">
        <button id="waiterCheckin" type="button" class="secondary">Vao ca</button>
        <button id="waiterCheckout" type="button" class="warning">Ra ca</button>
        <button id="waiterReload" type="button">Tai don</button>
      </div>
      <div id="waiterOrders" class="orders-grid"></div>
    </section>`;
  $("#waiterCheckin").addEventListener("click", () => attendance("checkin"));
  $("#waiterCheckout").addEventListener("click", () => attendance("checkout"));
  $("#waiterReload").addEventListener("click", loadOrders);
  renderOrders("waiterOrders", ["pending", "ready", "serving", "waiting_pay"], "waiter");
}

function renderKitchen() {
  $("#kitchenView").innerHTML = `
    <section class="panel">
      <div class="toolbar">
        <button id="kitchenCheckin" type="button" class="secondary">Vao ca</button>
        <button id="kitchenCheckout" type="button" class="warning">Ra ca</button>
        <button id="kitchenReload" type="button">Tai hang doi bep</button>
      </div>
      <div id="kitchenOrders" class="orders-grid"></div>
    </section>`;
  $("#kitchenCheckin").addEventListener("click", () => attendance("checkin"));
  $("#kitchenCheckout").addEventListener("click", () => attendance("checkout"));
  $("#kitchenReload").addEventListener("click", loadOrders);
  renderOrders("kitchenOrders", ["confirmed", "cooking"], "kitchen");
}

function renderCashier() {
  $("#cashierView").innerHTML = `
    <section class="panel">
      <div class="toolbar">
        <button id="cashierCheckin" type="button" class="secondary">Vao ca</button>
        <button id="cashierCheckout" type="button" class="warning">Ra ca</button>
        <button id="cashierReload" type="button">Tai don can thanh toan</button>
      </div>
      <div id="cashierOrders" class="orders-grid"></div>
    </section>`;
  $("#cashierCheckin").addEventListener("click", () => attendance("checkin"));
  $("#cashierCheckout").addEventListener("click", () => attendance("checkout"));
  $("#cashierReload").addEventListener("click", loadOrders);
  renderOrders("cashierOrders", ["waiting_pay", "paid"], "cashier");
}

function renderManager() {
  $("#managerView").innerHTML = `
    <div class="grid two">
      <section class="panel">
        <h2>Quan ly thuc don</h2>
        <form id="menuForm" class="form-grid">
          <input name="name" placeholder="Ten mon" required />
          <input name="cat" placeholder="Nhom mon" required />
          <input name="price" type="number" placeholder="Gia" required />
          <input name="emoji" placeholder="Emoji" />
          <textarea class="full" name="desc" placeholder="Mo ta"></textarea>
          <button type="submit">Them mon</button>
        </form>
        <div class="menu-grid">${state.menu.map((item) => managerMenuCard(item)).join("")}</div>
      </section>
      <section class="panel">
        <h2>Nhan vien va lich</h2>
        <form id="employeeForm" class="form-grid">
          <input name="username" placeholder="Username" required />
          <input name="password" placeholder="Password" required />
          <input name="name" placeholder="Ho ten" required />
          <select name="role"><option value="waiter">waiter</option><option value="cashier">cashier</option><option value="kitchen">kitchen</option><option value="manager">manager</option></select>
          <input name="wage" type="number" placeholder="Luong/ca" />
          <button type="submit">Them nhan vien</button>
        </form>
        ${tableManagerMarkup()}
        <div class="toolbar">
          <input id="scheduleWeek" placeholder="Tuan, vd 2026-W22" />
          <button id="loadScheduleBtn" type="button" class="secondary">Xep ca</button>
          <button id="loadAttendanceBtn" type="button">Diem danh</button>
        </div>
        <div id="managerData" class="table-wrap"></div>
      </section>
    </div>
    <section class="panel">
      <div class="toolbar"><button id="managerOrdersReload" type="button">Tai toan bo don</button></div>
      <div id="managerOrders" class="orders-grid"></div>
    </section>`;

  $("#menuForm").addEventListener("submit", createMenuItem);
  $("#employeeForm").addEventListener("submit", createEmployee);
  bindTableManager("#managerView");
  $("#loadScheduleBtn").addEventListener("click", loadSchedule);
  $("#loadAttendanceBtn").addEventListener("click", loadAttendance);
  $("#managerOrdersReload").addEventListener("click", loadOrders);
  $("#managerView").querySelectorAll("[data-toggle-menu]").forEach((btn) => btn.addEventListener("click", () => toggleMenu(Number(btn.dataset.toggleMenu), btn.dataset.avail !== "true")));
  $("#managerView").querySelectorAll("[data-delete-menu]").forEach((btn) => btn.addEventListener("click", () => deleteMenu(Number(btn.dataset.deleteMenu))));
  renderOrders("managerOrders", null, "manager");
}

function managerMenuCard(item) {
  return `
    <article class="menu-item ${item.avail === false ? "unavailable" : ""}">
      <div class="menu-top"><strong>${item.emoji || "PV"} ${item.name}</strong><span class="price">${money(item.price)}</span></div>
      <div class="muted">${item.cat} - ${item.avail === false ? "Het mon" : "Con mon"}</div>
      <div class="toolbar">
        <button data-toggle-menu="${item.id}" data-avail="${item.avail}" type="button" class="secondary">${item.avail === false ? "Bat mon" : "Tat mon"}</button>
        <button data-delete-menu="${item.id}" type="button" class="danger">Xoa</button>
      </div>
    </article>`;
}

function tableManagerMarkup() {
  return `
    <div class="table-manager">
      <h3>Quan ly ban</h3>
      <form class="table-form">
        <input name="table_name" placeholder="VD: Ban 9" />
        <button type="submit">Them ban</button>
      </form>
      <div class="table-list">
        ${state.tables
          .map(
            (table) => `
              <span>
                ${table}
                <button class="table-delete" data-delete-table="${table}" type="button" aria-label="Xoa ${table}">x</button>
              </span>`,
          )
          .join("")}
      </div>
    </div>`;
}

function bindTableManager(scope) {
  const root = $(scope);
  const form = root.querySelector(".table-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = form.elements.table_name;
    const tableName = input.value.trim();
    if (!tableName) return toast("Nhap ten ban", true);
    if (state.tables.includes(tableName)) return toast("Ban da ton tai", true);
    state.tables.push(tableName);
    state.selectedTable = tableName;
    saveSession();
    toast("Da them ban");
    render();
  });
  root.querySelectorAll("[data-delete-table]").forEach((btn) => {
    btn.addEventListener("click", () => deleteTable(btn.dataset.deleteTable));
  });
}

function deleteTable(tableName) {
  if (state.tables.length <= 1) return toast("Can giu lai it nhat 1 ban", true);
  state.tables = state.tables.filter((table) => table !== tableName);
  if (state.selectedTable === tableName) state.selectedTable = state.tables[0];
  saveSession();
  toast("Da xoa ban");
  render();
}

function renderOwner() {
  $("#ownerView").innerHTML = `
    <div class="grid two">
      <section class="panel">
        <div class="toolbar">
          <button id="loadRevenueBtn" type="button">Xem doanh thu</button>
          <button id="loadEmployeesBtn" type="button" class="secondary">Nhan vien</button>
        </div>
        <div id="ownerStats"></div>
      </section>
      <section class="panel soft">
        ${tableManagerMarkup()}
        <h2>Log he thong</h2>
        <ul class="event-list">${state.events.map((event) => `<li><span>${event.event}</span><span class="muted">${event.time}</span></li>`).join("") || "<li><span class='muted'>Chua co event</span></li>"}</ul>
      </section>
    </div>`;
  $("#loadRevenueBtn").addEventListener("click", loadRevenue);
  $("#loadEmployeesBtn").addEventListener("click", loadEmployees);
  bindTableManager("#ownerView");
}

async function loadMenu() {
  try {
    state.menu = await api("/api/menu");
    render();
  } catch (err) {
    toast(err.message, true);
  }
}

async function loadOrders() {
  try {
    state.orders = await api("/api/orders");
    render();
  } catch (err) {
    toast(err.message, true);
  }
}

async function updateStatus(orderId, status) {
  try {
    await api(`/api/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify({ status }) });
    toast("Da cap nhat don");
    await loadOrders();
  } catch (err) {
    toast(err.message, true);
  }
}

async function createSale(orderId, payMethod) {
  try {
    await api("/api/sales", { method: "POST", body: JSON.stringify({ order_id: orderId, pay_method: payMethod }) });
    toast("Da thanh toan");
    await loadOrders();
  } catch (err) {
    toast(err.message, true);
  }
}

async function attendance(action) {
  try {
    await api(`/api/attendance/${action}`, { method: "POST", body: "{}" });
    toast(action === "checkin" ? "Da vao ca" : "Da ra ca");
  } catch (err) {
    toast(err.message, true);
  }
}

async function createMenuItem(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  data.price = Number(data.price);
  data.avail = true;
  try {
    await api("/api/menu", { method: "POST", body: JSON.stringify(data) });
    event.target.reset();
    toast("Da them mon");
    await loadMenu();
  } catch (err) {
    toast(err.message, true);
  }
}

async function toggleMenu(id, avail) {
  try {
    await api(`/api/menu/${id}`, { method: "PATCH", body: JSON.stringify({ avail }) });
    toast("Da cap nhat mon");
    await loadMenu();
  } catch (err) {
    toast(err.message, true);
  }
}

async function deleteMenu(id) {
  try {
    await api(`/api/menu/${id}`, { method: "DELETE" });
    toast("Da xoa mon");
    await loadMenu();
  } catch (err) {
    toast(err.message, true);
  }
}

async function createEmployee(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target));
  data.wage = Number(data.wage || 0);
  try {
    await api("/api/employees", { method: "POST", body: JSON.stringify(data) });
    event.target.reset();
    toast("Da them nhan vien");
  } catch (err) {
    toast(err.message, true);
  }
}

async function loadRevenue() {
  try {
    const data = await api("/api/revenue");
    $("#ownerStats").innerHTML = `
      <div class="stats">
        <div class="stat"><span>Doanh thu</span><strong>${money(data.total_revenue)}</strong></div>
        <div class="stat"><span>So don</span><strong>${data.total_orders || 0}</strong></div>
        <div class="stat"><span>Trung binh</span><strong>${money(data.average_order)}</strong></div>
      </div>
      <h3>Don gan day</h3>
      <ul class="simple-list">${(data.recent_sales || []).map((sale) => `<li><span>#${sale.order_id} ${sale.table_name}</span><strong>${money(sale.total)}</strong></li>`).join("")}</ul>`;
  } catch (err) {
    toast(err.message, true);
  }
}

async function loadEmployees() {
  try {
    const users = await api("/api/employees");
    state.employees = users;
    $("#ownerStats").innerHTML = employeeTable(users);
    $("#ownerStats").querySelectorAll("[data-delete-employee]").forEach((btn) => {
      btn.addEventListener("click", () => deleteEmployee(Number(btn.dataset.deleteEmployee)));
    });
  } catch (err) {
    toast(err.message, true);
  }
}

async function loadEmployeeOptions() {
  if (state.employees.length) return state.employees;
  state.employees = await api("/api/employees");
  return state.employees;
}

async function deleteEmployee(id) {
  if (!id) return toast("Khong tim thay ID nhan vien", true);
  if (id === userId(state.user || {})) return toast("Khong the xoa tai khoan dang dang nhap", true);
  try {
    await api(`/api/employees/${id}`, { method: "DELETE" });
    toast("Da xoa nhan vien");
    await loadEmployees();
  } catch (err) {
    toast(err.message, true);
  }
}

async function loadSchedule() {
  try {
    const week = $("#scheduleWeek").value.trim();
    const data = await api(`/api/schedule${week ? `?week=${encodeURIComponent(week)}` : ""}`);
    state.schedule = normalizeSchedule(data);
    $("#scheduleWeek").value = state.schedule.week;
    await loadEmployeeOptions();
    await loadWeekAttendance(state.schedule);
    renderScheduleEditor();
  } catch (err) {
    toast(err.message, true);
  }
}

async function loadAttendance() {
  try {
    const data = await api("/api/attendance");
    $("#managerData").innerHTML = attendanceTable(data);
  } catch (err) {
    toast(err.message, true);
  }
}

function employeeTable(users) {
  const rows = users.map((user) => {
    const id = userId(user);
    return `
      <tr>
        <td>${id ?? ""}</td>
        <td>${nameOf(user)}</td>
        <td>${usernameOf(user)}</td>
        <td>${roleOf(user)}</td>
        <td>${money(wageOf(user))}</td>
        <td><button class="danger small-btn" data-delete-employee="${id}" type="button">Xoa</button></td>
      </tr>`;
  });
  return `
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Ten</th><th>Username</th><th>Role</th><th>Wage</th><th></th></tr></thead>
        <tbody>${rows.join("") || `<tr><td colspan="6">Chua co nhan vien</td></tr>`}</tbody>
      </table>
    </div>`;
}

function normalizeSchedule(data) {
  return {
    week: data.week || data.Week || "",
    days: (data.days || data.Days || []).map((day) => ({
      day: day.day ?? day.Day,
      day_name: day.day_name || day.DayName || "",
      date: day.date || day.Date || "",
      shifts: (day.shifts || day.Shifts || []).map((shift) => ({
        employee_id: Number(shift.employee_id ?? shift.EmployeeID),
        employee_name: shift.employee_name || shift.EmployeeName || "",
        shift: shift.shift || shift.Shift || "",
      })),
    })),
  };
}

async function loadWeekAttendance(schedule) {
  const entries = await Promise.all(
    schedule.days.map(async (day) => {
      try {
        const records = await api(`/api/attendance?date=${encodeURIComponent(day.date)}`);
        return [day.date, records || []];
      } catch {
        return [day.date, []];
      }
    }),
  );
  state.attendanceByDate = Object.fromEntries(entries);
}

function renderScheduleEditor() {
  if (!state.schedule) return;
  $("#managerData").innerHTML = scheduleEditorMarkup(state.schedule);
  $("#managerData").querySelectorAll("[data-add-shift]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const select = $(`#${btn.dataset.select}`);
      addScheduleEmployee(Number(btn.dataset.day), btn.dataset.shift, Number(select.value));
    });
  });
  $("#managerData").querySelectorAll("[data-remove-shift]").forEach((btn) => {
    btn.addEventListener("click", () => removeScheduleEmployee(Number(btn.dataset.day), btn.dataset.shift, Number(btn.dataset.employee)));
  });
}

function scheduleEditorMarkup(schedule) {
  return `
    <div class="schedule-head">
      <h3>Bang xep ca ${schedule.week}</h3>
      <span class="muted">Ca 1: 8:00 - 16:00, Ca 2: 16:00 - 24:00</span>
    </div>
    <div class="schedule-grid">
      ${schedule.days.map((day) => scheduleDayCell(day)).join("")}
    </div>`;
}

function scheduleDayCell(day) {
  return `
    <article class="schedule-day">
      <div class="schedule-day-head">
        <strong>${day.day_name}</strong>
        <span>${day.date}</span>
      </div>
      ${fixedShifts.map((shift) => shiftBlock(day, shift)).join("")}
    </article>`;
}

function shiftBlock(day, shift) {
  const assigned = day.shifts.filter((item) => item.shift === shift.value);
  const selectId = `shift-${day.day}-${shift.value.replace(/\s+/g, "-")}`;
  const employees = state.employees.filter((employee) => !["owner", "customer"].includes(roleOf(employee)));
  return `
    <div class="shift-block">
      <div class="shift-title">
        <strong>${shift.label}</strong>
        <span>${shift.time}</span>
      </div>
      <div class="shift-add">
        <select id="${selectId}">
          ${employees.map((employee) => `<option value="${userId(employee)}">${nameOf(employee)} (${roleOf(employee)})</option>`).join("")}
        </select>
        <button data-add-shift="1" data-day="${day.day}" data-shift="${shift.value}" data-select="${selectId}" type="button">Them</button>
      </div>
      <ul class="shift-employees">
        ${
          assigned
            .map(
              (item) => `
                <li>
                  <span>${employeeDisplay(item)} ${lateBadge(day.date, item.employee_id)}</span>
                  <button class="table-delete" data-remove-shift="1" data-day="${day.day}" data-shift="${shift.value}" data-employee="${item.employee_id}" type="button">x</button>
                </li>`,
            )
            .join("") || `<li><span class="muted">Chua co nhan vien</span></li>`
        }
      </ul>
    </div>`;
}

function employeeDisplay(item) {
  const employee = state.employees.find((user) => Number(userId(user)) === Number(item.employee_id));
  return employee ? nameOf(employee) : item.employee_name || `Nhan vien #${item.employee_id}`;
}

function lateBadge(date, employeeID) {
  const records = state.attendanceByDate[date] || [];
  const record = records.find((item) => Number(item.user_id ?? item.UserID) === Number(employeeID));
  if (!record) return "";
  const late = record.late ?? record.Late;
  return late ? `<span class="late-badge">Muon</span>` : `<span class="ok-badge">Dung gio</span>`;
}

async function addScheduleEmployee(dayNumber, shiftName, employeeID) {
  if (!employeeID) return toast("Chon nhan vien", true);
  const day = state.schedule.days.find((item) => Number(item.day) === dayNumber);
  if (!day) return;
  const exists = day.shifts.some((item) => item.shift === shiftName && Number(item.employee_id) === employeeID);
  if (exists) return toast("Nhan vien da co trong ca nay", true);
  const employee = state.employees.find((item) => Number(userId(item)) === employeeID);
  day.shifts.push({ employee_id: employeeID, employee_name: nameOf(employee || {}), shift: shiftName });
  await saveSchedule();
}

async function removeScheduleEmployee(dayNumber, shiftName, employeeID) {
  const day = state.schedule.days.find((item) => Number(item.day) === dayNumber);
  if (!day) return;
  day.shifts = day.shifts.filter((item) => !(item.shift === shiftName && Number(item.employee_id) === employeeID));
  await saveSchedule();
}

async function saveSchedule() {
  try {
    await api("/api/schedule", {
      method: "PUT",
      body: JSON.stringify({
        week: state.schedule.week,
        days: state.schedule.days.map((day) => ({
          day: day.day,
          shifts: day.shifts.map((shift) => ({ employee_id: shift.employee_id, shift: shift.shift })),
        })),
      }),
    });
    toast("Da cap nhat bang ca");
    await loadWeekAttendance(state.schedule);
    renderScheduleEditor();
  } catch (err) {
    toast(err.message, true);
  }
}

function scheduleTable(data) {
  const days = data.days || data.Days || [];
  const rows = days
    .map((day) => {
      const shifts = day.shifts || day.Shifts || [];
      return `
        <tr>
          <td>${day.day_name || day.DayName || ""}</td>
          <td>${day.date || day.Date || ""}</td>
          <td>${shifts.length ? shifts.map((shift) => `${shift.employee_name || shift.EmployeeName || ""}: ${shift.shift || shift.Shift || ""}`).join("<br>") : "Chua xep ca"}</td>
        </tr>`;
    })
    .join("");
  return `
    <h3>Lich lam viec ${data.week || data.Week || ""}</h3>
    <table>
      <thead><tr><th>Ngay</th><th>Ngay thang</th><th>Ca lam</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="3">Chua co lich</td></tr>`}</tbody>
    </table>`;
}

function attendanceTable(records) {
  const rows = (records || [])
    .map((record) => {
      const user = record.user || record.User || {};
      return `
        <tr>
          <td>${nameOf(user)}</td>
          <td>${usernameOf(user)}</td>
          <td>${formatDate(record.date || record.Date)}</td>
          <td>${formatDateTime(record.checked_in || record.CheckedIn)}</td>
          <td>${formatDateTime(record.checked_out || record.CheckedOut)}</td>
          <td>${Number(record.total_hours ?? record.TotalHours ?? 0).toFixed(2)}</td>
          <td>${record.status || record.Status || ""}</td>
        </tr>`;
    })
    .join("");
  return `
    <h3>Bang diem danh</h3>
    <table>
      <thead><tr><th>Ten</th><th>Username</th><th>Ngay</th><th>Vao ca</th><th>Ra ca</th><th>Gio</th><th>Trang thai</th></tr></thead>
      <tbody>${rows || `<tr><td colspan="7">Chua co du lieu diem danh</td></tr>`}</tbody>
    </table>`;
}

function table(headers, rows) {
  return `<table><thead><tr>${headers.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell ?? ""}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

function connectWS() {
  if (state.ws) state.ws.close();
  const url = state.apiBase.replace(/^http/, "ws");
  const dot = $("#wsDot");
  const label = $("#wsStatus");
  try {
    state.ws = new WebSocket(`${url}/ws?role=${state.role}`);
    state.ws.onopen = () => {
      dot.classList.add("online");
      label.textContent = `WebSocket: ${state.role}`;
    };
    state.ws.onclose = () => {
      dot.classList.remove("online");
      label.textContent = "WebSocket da ngat";
    };
    state.ws.onmessage = async (message) => {
      const payload = JSON.parse(message.data);
      state.events.unshift({ event: payload.event || "event", time: new Date().toLocaleTimeString("vi-VN") });
      state.events = state.events.slice(0, 12);
      if (["new_order", "order_updated", "order_paid"].includes(payload.event)) await loadOrders();
      if (payload.event === "menu_updated") await loadMenu();
      render();
    };
  } catch {
    dot.classList.remove("online");
    label.textContent = "WebSocket loi";
  }
}

function openLogin() {
  $("#loginModal").classList.remove("hidden");
  $("#username").focus();
}

function closeLogin() {
  $("#loginModal").classList.add("hidden");
}

async function refreshRoleData() {
  if (state.role === "customer") await loadMenu();
  if (["waiter", "kitchen", "cashier", "manager", "owner"].includes(state.role) && state.token) await loadOrders();
}

async function login() {
  state.apiBase = $("#apiBase").value.trim().replace(/\/$/, "");
  const username = $("#username").value.trim();
  const password = $("#password").value;
  try {
    const data = await api("/api/login", { method: "POST", body: JSON.stringify({ username, password }) });
    state.token = data.token;
    state.user = { ...data.user, role: normalizeRole(data.user.role) };
    state.role = state.user.role;
    saveSession();
    toast("Dang nhap thanh cong");
    closeLogin();
    render();
    connectWS();
    refreshRoleData();
  } catch (err) {
    toast(err.message, true);
  }
}

function logout() {
  state.token = "";
  state.user = null;
  state.role = "customer";
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.setItem("activeRole", "customer");
  render();
  connectWS();
}

function bindGlobalEvents() {
  $("#apiBase").addEventListener("change", () => {
    state.apiBase = $("#apiBase").value.trim().replace(/\/$/, "");
    saveSession();
    connectWS();
  });
  $("#openLoginBtn").addEventListener("click", openLogin);
  $("#closeLoginBtn").addEventListener("click", closeLogin);
  $("#loginModal").addEventListener("click", (event) => {
    if (event.target.id === "loginModal") closeLogin();
  });
  $("#password").addEventListener("keydown", (event) => {
    if (event.key === "Enter") login();
  });
  $("#loginBtn").addEventListener("click", login);
  $("#logoutBtn").addEventListener("click", logout);
}

bindGlobalEvents();
render();
connectWS();
loadMenu();
if (state.token) refreshRoleData();
