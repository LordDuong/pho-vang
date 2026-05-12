import {
  getApp,
  getApps,
  getDatabase,
  get,
  initializeApp,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
} from "./firebase-config.js";

export const state = {
  DB: null,
  FB: false,
  role: "customer",
  selectedRole: "customer",
  currentUser: null,
  cart: [],
  menuItems: [],
  activeOrders: {},
  salesHistory: [],
  employees: [],
  attendanceLog: {},
  schedule: {},
  currentCategory: "all",
  cashoutOrderKey: null,
};

export const ROLE_NAMES = {
  customer: "Khách hàng",
  waiter: "Phục vụ",
  cashier: "Thu ngân",
  kitchen: "Đầu bếp",
  manager: "Quản lý",
  owner: "Chủ quán",
};

export const BUILTIN_ACCTS = {
  phucvu: { pass: "1234", role: "waiter", name: "Trần Phục Vụ" },
  thungan: { pass: "1234", role: "cashier", name: "Lê Thu Ngân" },
  daubep: { pass: "1234", role: "kitchen", name: "Phạm Đầu Bếp" },
  quanly: { pass: "1234", role: "manager", name: "Hoàng Quản Lý" },
  chuquan: { pass: "1234", role: "owner", name: "Nguyễn Chủ Quán" },
};

export const DEF_MENU = [
  {
    id: "m1",
    name: "Phở bò tái",
    cat: "Phở",
    price: 65000,
    emoji: "🍜",
    desc: "Nước dùng thanh ngọt, thịt tái hồng",
    avail: true,
    soldCount: 0,
  },
  {
    id: "m2",
    name: "Phở bò chín",
    cat: "Phở",
    price: 60000,
    emoji: "🍲",
    desc: "Thịt chín mềm, nước trong",
    avail: true,
    soldCount: 0,
  },
  {
    id: "m3",
    name: "Phở gà",
    cat: "Phở",
    price: 55000,
    emoji: "🍗",
    desc: "Gà ta thả vườn, thơm ngậy",
    avail: true,
    soldCount: 0,
  },
  {
    id: "m4",
    name: "Phở đặc biệt",
    cat: "Phở",
    price: 85000,
    emoji: "⭐",
    desc: "Đầy đủ topping",
    avail: true,
    soldCount: 0,
  },
  {
    id: "m5",
    name: "Cơm tấm sườn",
    cat: "Cơm",
    price: 55000,
    emoji: "🍛",
    desc: "Sườn nướng thơm",
    avail: true,
    soldCount: 0,
  },
  {
    id: "m6",
    name: "Cơm gà hội an",
    cat: "Cơm",
    price: 60000,
    emoji: "🐔",
    desc: "Gà xé, cơm dầu hành",
    avail: true,
    soldCount: 0,
  },
  {
    id: "m7",
    name: "Trà đá",
    cat: "Đồ uống",
    price: 10000,
    emoji: "🧋",
    desc: "Mát lạnh giải khát",
    avail: true,
    soldCount: 0,
  },
  {
    id: "m8",
    name: "Nước cam ép",
    cat: "Đồ uống",
    price: 25000,
    emoji: "🍊",
    desc: "100% cam tươi",
    avail: true,
    soldCount: 0,
  },
  {
    id: "m9",
    name: "Cà phê sữa đá",
    cat: "Đồ uống",
    price: 30000,
    emoji: "☕",
    desc: "Cà phê Robusta đậm đà",
    avail: true,
    soldCount: 0,
  },
  {
    id: "m10",
    name: "Chả giò",
    cat: "Món phụ",
    price: 35000,
    emoji: "🥢",
    desc: "Giòn tan, nhân thịt heo",
    avail: true,
    soldCount: 0,
  },
  {
    id: "m11",
    name: "Gỏi cuốn",
    cat: "Món phụ",
    price: 30000,
    emoji: "🌯",
    desc: "Tươi mát, chấm tương hoisin",
    avail: true,
    soldCount: 0,
  },
];

export const DEF_EMPLOYEES = [
  {
    id: "e1",
    name: "Trần Phục Vụ",
    role: "waiter",
    user: "phucvu",
    pass: "1234",
    wage: 30000,
  },
  {
    id: "e2",
    name: "Lê Thu Ngân",
    role: "cashier",
    user: "thungan",
    pass: "1234",
    wage: 32000,
  },
  {
    id: "e3",
    name: "Phạm Đầu Bếp",
    role: "kitchen",
    user: "daubep",
    pass: "1234",
    wage: 35000,
  },
  {
    id: "e4",
    name: "Hoàng Quản Lý",
    role: "manager",
    user: "quanly",
    pass: "1234",
    wage: 50000,
  },
];

export const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

const MENU_IMG_BY_ID = {
  m1: "",
  m2: "",
  m3: "",
  m4: "",
  m5: "",
  m6: "",
  m7: "",
  m8: "",
  m9: "",
  m10: "",
  m11: "",
};

export const MENU_IMG_FALLBACK =
  "https://placehold.co/600x400/2c2118/c9a84c?text=Pho+Vang";

export const DEF_SCHEDULE = {
  0: [
    { emp: "e1", shift: "Sáng 7-14" },
    { emp: "e2", shift: "Sáng 8-14" },
  ],
  1: [
    { emp: "e1", shift: "Sáng 7-14" },
    { emp: "e3", shift: "Sáng 7-14" },
  ],
  2: [
    { emp: "e4", shift: "Sáng 8-17" },
    { emp: "e2", shift: "Chiều 14-21" },
  ],
  3: [
    { emp: "e1", shift: "Sáng 7-14" },
    { emp: "e3", shift: "Sáng 7-14" },
  ],
  4: [
    { emp: "e2", shift: "Sáng 8-14" },
    { emp: "e4", shift: "Sáng 8-17" },
  ],
  5: [
    { emp: "e1", shift: "Chiều 14-21" },
    { emp: "e3", shift: "Sáng 7-14" },
  ],
  6: [
    { emp: "e2", shift: "Sáng 8-14" },
    { emp: "e1", shift: "Chiều 14-21" },
  ],
};

const AUTH_SESSION_KEY = "pv_auth_session";
const LOCAL_DATA_KEY = "pv_local_data";
const roleHandlers = new Map();
const tabHandlers = new Map();

window.W = window.W || {};

const cloneSchedule = () =>
  Object.fromEntries(
    Object.entries(DEF_SCHEDULE).map(([day, shifts]) => [
      day,
      shifts.map((shift) => ({ ...shift })),
    ]),
  );

const buildMenuSeed = () => {
  const menu = {};
  DEF_MENU.forEach((item) => {
    menu[item.id] = { ...item };
  });
  return menu;
};

export const hashPassword = async (value) => {
  const encoded = new TextEncoder().encode(String(value ?? ""));
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

const normalizeEmployeeRecord = async (employee) => {
  const { pass, ...rest } = employee;
  const passHash = employee.passHash || (pass ? await hashPassword(pass) : undefined);
  return passHash ? { ...rest, passHash } : { ...rest };
};

const buildEmployeeSeed = async () => {
  const employees = {};
  for (const employee of DEF_EMPLOYEES) {
    employees[employee.id] = await normalizeEmployeeRecord(employee);
  }
  return employees;
};

const loadLocalData = () => {
  try {
    const raw = localStorage.getItem(LOCAL_DATA_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const persistLocalData = () => {
  if (state.FB) return;
  localStorage.setItem(
    LOCAL_DATA_KEY,
    JSON.stringify({
      menuItems: state.menuItems,
      activeOrders: state.activeOrders,
      salesHistory: state.salesHistory,
      employees: state.employees.map(({ pass, ...employee }) => employee),
      attendanceLog: state.attendanceLog,
      schedule: state.schedule,
    }),
  );
};

const updateSyncChip = () => {
  const chip = document.getElementById("sync-chip");
  if (!chip) return;
  if (state.FB) {
    chip.className = "live-chip";
    chip.innerHTML = '<div class="ld"></div>Live';
    return;
  }
  chip.className = "live-chip local";
  chip.innerHTML = "⚠️ Local";
};

const bindModalOverlays = () => {
  document.querySelectorAll(".modal-ov").forEach((overlay) => {
    if (overlay.dataset.bound === "true") return;
    overlay.addEventListener("click", function handleOverlayClick(event) {
      if (event.target === this) this.classList.remove("active");
    });
    overlay.dataset.bound = "true";
  });
};

export const getPageName = () => document.body?.dataset?.page || "";
export const fmt = (value) => Number(value).toLocaleString("vi-VN") + "đ";
export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
export const todayKey = () => new Date().toISOString().slice(0, 10);
export const getMenuImage = (item) =>
  item.img || MENU_IMG_BY_ID[item.id] || MENU_IMG_FALLBACK;

export const setRole = (role) => {
  state.role = role;
};

export const setSelectedRole = (role) => {
  state.selectedRole = role;
};

export const setCurrentUser = (user) => {
  state.currentUser = user;
};

export const saveAuthSession = () => {
  sessionStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({ role: state.role, currentUser: state.currentUser }),
  );
};

export const loadAuthSession = () => {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearAuthSession = () => {
  sessionStorage.removeItem(AUTH_SESSION_KEY);
};

export const goToLoginPage = () => {
  window.location.href = "index.html";
};

export const redirectByRole = (role) => {
  window.location.href = role === "customer" ? "menu.html" : "dashboard.html";
};

export const closeMod = (id) => {
  document.getElementById(id)?.classList.remove("active");
};

export const toast = (message, type = "") => {
  const container = document.getElementById("tc");
  if (!container) return;
  const toastNode = document.createElement("div");
  toastNode.className = `toast ${type}`.trim();
  toastNode.textContent = message;
  container.appendChild(toastNode);
  setTimeout(() => toastNode.remove(), 3000);
};

export const registerRoleHandler = (role, handlers) => {
  roleHandlers.set(role, handlers);
};

export const registerTabHandler = (view, pane, handler) => {
  tabHandlers.set(`${view}:${pane}`, handler);
};

export const registerActions = (actions) => {
  Object.assign(window.W, actions);
  Object.assign(window, actions);
};

export const showLogin = (firebaseEnabled) => {
  document.getElementById("login-screen")?.classList.add("show");
  if (firebaseEnabled) return;
  const fbDot = document.getElementById("fb-dot");
  const fbTxt = document.getElementById("fb-txt");
  if (fbDot) fbDot.className = "fb-dot off";
  if (fbTxt) fbTxt.textContent = "Chế độ local — không sync";
};

window.switchTab = (view, pane, button) => {
  document
    .querySelectorAll(`#view-${view} .vtab`)
    .forEach((tab) => tab.classList.remove("active"));
  button.classList.add("active");
  document
    .querySelectorAll(`#view-${view} .tab-pane`)
    .forEach((tabPane) => tabPane.classList.remove("active"));
  document.getElementById(`${view}-${pane}`)?.classList.add("active");
  tabHandlers.get(`${view}:${pane}`)?.();
};

export const refreshCurrentView = () => {
  if (!state.currentUser) return;
  const handler = roleHandlers.get(state.role);
  if (!handler) return;
  if (typeof handler.refresh === "function") {
    handler.refresh();
    return;
  }
  handler.show?.();
};

export const showView = (role) => {
  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  const viewMap = {
    customer: "view-customer",
    waiter: "view-waiter",
    kitchen: "view-kitchen",
    cashier: "view-cashier",
    manager: "view-manager",
    owner: "view-owner",
  };
  document.getElementById(viewMap[role])?.classList.add("active");
  roleHandlers.get(role)?.show?.();
};

export const enterApp = () => {
  document.getElementById("setup-screen")?.classList.remove("show");
  document.getElementById("login-screen")?.classList.remove("show");
  const app = document.getElementById("app");
  if (!app) return;
  app.classList.add("active");

  const tbName = document.getElementById("tb-name");
  const tbRole = document.getElementById("tb-role");
  if (tbName) tbName.textContent = state.currentUser?.name || "—";
  if (tbRole) tbRole.textContent = ROLE_NAMES[state.role] || "";

  const authButton = document.getElementById("btn-auth");
  if (authButton) {
    if (state.role === "customer") {
      authButton.textContent = "Đăng nhập";
      authButton.onclick = () => {
        if (getPageName() === "index") {
          document.getElementById("login-screen")?.classList.add("show");
          return;
        }
        goToLoginPage();
      };
      authButton.style.background = "var(--gold)";
      authButton.style.color = "var(--dark)";
    } else {
      authButton.textContent = "Đăng xuất";
      authButton.onclick = window.doLogout;
      authButton.style.background = "rgba(192, 57, 43, 0.2)";
      authButton.style.color = "#e74c3c";
    }
  }

  updateSyncChip();
  showView(state.role);
};

const subscribeAll = () => {
  if (!state.FB || !state.DB) return;

  onValue(ref(state.DB, "menu"), (snapshot) => {
    state.menuItems = snapshot.exists() ? Object.values(snapshot.val()) : [];
    refreshCurrentView();
  });

  onValue(ref(state.DB, "orders"), (snapshot) => {
    state.activeOrders = snapshot.exists() ? snapshot.val() : {};
    refreshCurrentView();
  });

  onValue(ref(state.DB, "sales"), (snapshot) => {
    state.salesHistory = snapshot.exists()
      ? Object.values(snapshot.val()).sort((a, b) => b.ts - a.ts)
      : [];
    refreshCurrentView();
  });

  onValue(ref(state.DB, "employees"), (snapshot) => {
    state.employees = snapshot.exists() ? Object.values(snapshot.val()) : [];
    refreshCurrentView();
  });

  onValue(ref(state.DB, "attendance"), (snapshot) => {
    state.attendanceLog = snapshot.exists() ? snapshot.val() : {};
    refreshCurrentView();
  });

  onValue(ref(state.DB, "schedule"), (snapshot) => {
    state.schedule = snapshot.exists() ? snapshot.val() : {};
    refreshCurrentView();
  });
};

const parseFirebaseConfig = (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("❌ JSON không hợp lệ. Copy đúng firebaseConfig object.");
    const sanitized = match[0]
      .replace(/\/\/[^\n]*/g, "")
      .replace(/,\s*([}\]])/g, "$1")
      .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')
      .replace(/:\s*'([^']*)'/g, ': "$1"');
    return JSON.parse(sanitized);
  }
};

export const connectFirebase = async (rawOverride) => {
  const cfgInput = document.getElementById("fb-cfg");
  const raw = rawOverride ?? cfgInput?.value.trim() ?? localStorage.getItem("fb_cfg") ?? "";
  const errEl = document.getElementById("setup-err");
  if (errEl) errEl.style.display = "none";

  let config;
  try {
    config = parseFirebaseConfig(raw);
  } catch (error) {
    if (errEl) {
      errEl.textContent = error.message;
      errEl.style.display = "block";
    }
    return false;
  }

  if (!config.databaseURL) {
    if (errEl) {
      errEl.textContent = '❌ Thiếu "databaseURL". Hãy tạo Realtime Database trước.';
      errEl.style.display = "block";
    }
    return false;
  }

  document.getElementById("setup-screen")?.classList.remove("show");
  document.getElementById("connecting")?.classList.add("show");

  try {
    const app = getApps().length ? getApp() : initializeApp(config);
    state.DB = getDatabase(app);
    state.FB = true;

    const menuSnapshot = await get(ref(state.DB, "menu"));
    if (!menuSnapshot.exists()) {
      await set(ref(state.DB, "menu"), buildMenuSeed());
    }

    const employeeSnapshot = await get(ref(state.DB, "employees"));
    if (!employeeSnapshot.exists()) {
      await set(ref(state.DB, "employees"), await buildEmployeeSeed());
    }

    const scheduleSnapshot = await get(ref(state.DB, "schedule"));
    if (!scheduleSnapshot.exists()) {
      await set(ref(state.DB, "schedule"), cloneSchedule());
    }

    localStorage.setItem("fb_cfg", JSON.stringify(config));
    document.getElementById("connecting")?.classList.remove("show");
    subscribeAll();

    if (getPageName() === "index") {
      showLogin(true);
    }

    updateSyncChip();
    toast("🔥 Firebase kết nối! Sync real-time bật.", "s");
    return true;
  } catch (error) {
    state.DB = null;
    state.FB = false;
    document.getElementById("connecting")?.classList.remove("show");
    document.getElementById("setup-screen")?.classList.add("show");
    if (errEl) {
      errEl.textContent = `❌ ${error.message}`;
      errEl.style.display = "block";
    }
    return false;
  }
};

export const useLocal = async () => {
  state.DB = null;
  state.FB = false;

  const savedLocalData = loadLocalData();
  state.menuItems = savedLocalData?.menuItems || DEF_MENU.map((item) => ({ ...item }));
  state.employees = savedLocalData?.employees
    ? await Promise.all(savedLocalData.employees.map((employee) => normalizeEmployeeRecord(employee)))
    : await Promise.all(DEF_EMPLOYEES.map((employee) => normalizeEmployeeRecord(employee)));
  state.schedule = savedLocalData?.schedule || cloneSchedule();
  state.activeOrders = savedLocalData?.activeOrders || {};
  state.salesHistory = savedLocalData?.salesHistory || [];
  state.attendanceLog = savedLocalData?.attendanceLog || {};
  document.getElementById("setup-screen")?.classList.remove("show");
  if (getPageName() === "index") {
    showLogin(false);
  }
  persistLocalData();
  updateSyncChip();
  toast("⚠️ Chế độ local — không sync giữa các máy", "e");
  return true;
};

export const bootstrapData = async ({ fallbackToLocal = false } = {}) => {
  bindModalOverlays();
  const savedConfig = localStorage.getItem("fb_cfg");
  if (savedConfig) {
    const cfgInput = document.getElementById("fb-cfg");
    if (cfgInput) cfgInput.value = savedConfig;
    const connected = await connectFirebase(savedConfig);
    if (connected) return true;
  }

  if (fallbackToLocal) {
    await useLocal();
  }

  return false;
};

bindModalOverlays();
window.closeMod = closeMod;
