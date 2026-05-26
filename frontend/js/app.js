// ══════════════════════════════════════════════════════════════════════════════
// APP STATE & CONFIGURATION
// ══════════════════════════════════════════════════════════════════════════════

export const state = {
  user: null,
  role: null,
  menuItems: [],
  cart: [],
  currentCategory: "all",
  activeOrders: {},
  FB: false,
  DB: null,
};

const ROLE_HANDLERS = {};
const ACTIONS = {};

// ══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ══════════════════════════════════════════════════════════════════════════════

export const escapeHtml = (str) => {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
};

export const fmt = (num) => {
  if (!num) return "0đ";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export const getMenuImage = (item) => {
  return item.image || "https://via.placeholder.com/200x200?text=No+Image";
};

export const MENU_IMG_FALLBACK = "https://via.placeholder.com/200x200?text=No+Image";

export const toast = (message, type = "info") => {
  const container = document.getElementById("tc");
  if (!container) return;

  const toastEl = document.createElement("div");
  toastEl.className = `toast toast-${type}`;
  toastEl.textContent = message;
  // use CSS variables for toast colors so theme controls the look
  const bg = type === "s" ? "var(--green)" : type === "e" ? "var(--accent)" : "var(--gold)";
  toastEl.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: ${bg};
    color: white;
    padding: 12px 20px;
    border-radius: 4px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;

  container.appendChild(toastEl);
  setTimeout(() => toastEl.remove(), 3000);
};

// ══════════════════════════════════════════════════════════════════════════════
// AUTHENTICATION
// ══════════════════════════════════════════════════════════════════════════════

export const saveAuthSession = () => {
  const session = {
    user: state.user,
    role: state.role,
    timestamp: Date.now(),
  };
  localStorage.setItem("authSession", JSON.stringify(session));
};

export const loadAuthSession = () => {
  try {
    const session = localStorage.getItem("authSession");
    return session ? JSON.parse(session) : null;
  } catch (e) {
    console.error("Error loading auth session:", e);
    return null;
  }
};

export const setRole = (role) => {
  state.role = role;
};

export const setCurrentUser = (user) => {
  state.user = user;
  const nameEl = document.getElementById("tb-name");
  const roleEl = document.getElementById("tb-role");
  if (nameEl) nameEl.textContent = user.name || "—";
  if (roleEl) roleEl.textContent = user.role || "—";
};

// ══════════════════════════════════════════════════════════════════════════════
// DATA BOOTSTRAP
// ══════════════════════════════════════════════════════════════════════════════

export const bootstrapData = async (opts = {}) => {
  try {
    const res = await fetch("http://localhost:8080/api/menu");
    if (res.ok) {
      const data = await res.json();
      state.menuItems = data.data || [];
    } else {
      throw new Error("Failed to fetch menu");
    }
  } catch (error) {
    console.warn("Failed to fetch menu from API, using fallback:", error);
    if (opts.fallbackToLocal) {
      state.menuItems = getLocalMenuItems();
    }
  }
};

const getLocalMenuItems = () => {
  // Fallback menu data
  return [
    {
      id: "pho1",
      name: "Phở Bò",
      emoji: "🍜",
      cat: "Phở",
      price: 45000,
      desc: "Phở bò truyền thống",
      avail: true,
    },
    {
      id: "pho2",
      name: "Phở Gà",
      emoji: "🍜",
      cat: "Phở",
      price: 40000,
      desc: "Phở gà thanh ngọt",
      avail: true,
    },
    {
      id: "com1",
      name: "Cơm Gà",
      emoji: "🍚",
      cat: "Cơm",
      price: 35000,
      desc: "Cơm gà nước sương",
      avail: true,
    },
    {
      id: "com2",
      name: "Cơm Tấm",
      emoji: "🍚",
      cat: "Cơm",
      price: 30000,
      desc: "Cơm tấm sườn nướng",
      avail: true,
    },
    {
      id: "drink1",
      name: "Nước Cam",
      emoji: "🥤",
      cat: "Đồ uống",
      price: 15000,
      desc: "Nước cam tươi",
      avail: true,
    },
    {
      id: "drink2",
      name: "Cà Phê",
      emoji: "☕",
      cat: "Đồ uống",
      price: 20000,
      desc: "Cà phê đen đá",
      avail: true,
    },
    {
      id: "side1",
      name: "Gỏi Cuốn",
      emoji: "🥗",
      cat: "Món phụ",
      price: 25000,
      desc: "Gỏi cuốn tôm thịt",
      avail: true,
    },
    {
      id: "side2",
      name: "Nem Rán",
      emoji: "🥗",
      cat: "Món phụ",
      price: 20000,
      desc: "Nem rán giòn",
      avail: true,
    },
  ];
};

// ══════════════════════════════════════════════════════════════════════════════
// UI MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

export const closeMod = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("active");
};

export const enterApp = () => {
  const screen = document.getElementById("login-screen");
  if (screen) screen.classList.remove("show");

  const app = document.getElementById("app");
  if (app) {
    app.style.display = "flex";
    app.classList.add("active");
  }

  if (state.role && ROLE_HANDLERS[state.role]?.show) {
    ROLE_HANDLERS[state.role].show();
  }
};

export const persistLocalData = () => {
  localStorage.setItem("activeOrders", JSON.stringify(state.activeOrders));
  localStorage.setItem("cart", JSON.stringify(state.cart));
};

// ══════════════════════════════════════════════════════════════════════════════
// HANDLER & ACTION REGISTRATION
// ══════════════════════════════════════════════════════════════════════════════

export const registerRoleHandler = (role, handler) => {
  ROLE_HANDLERS[role] = handler;
};

export const registerActions = (actions) => {
  Object.assign(ACTIONS, actions);
  window.W = ACTIONS;
};
