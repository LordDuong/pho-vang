const { initializeApp, getDatabase, ref, set, push, onValue, update, remove, get } = window.FirebaseRTDB || {};
// ════════════════════════════════════════════
      // STATE
      // ════════════════════════════════════════════
      let DB = null,
        FB = false;
      let role = "customer",
        selRole_ = "customer",
        currentUser = null;
      let cart = [],
        menuItems = [],
        activeOrders = {},
        salesHistory = [],
        employees = [],
        attendanceLog = {},
        schedule = {};
      let curCat = "all",
        cashoutOrderKey = null;

      const ROLE_NAMES = {
        customer: "Khách hàng",
        waiter: "Phục vụ",
        cashier: "Thu ngân",
        kitchen: "Đầu bếp",
        manager: "Quản lý",
        owner: "Chủ quán",
      };
      const ROLE_COLORS = {
        waiter: "var(--teal)",
        cashier: "var(--purple)",
        kitchen: "var(--orange)",
        manager: "var(--blue)",
        owner: "var(--gold)",
      };

      // Built-in accounts (employees loaded from DB too)
      const BUILTIN_ACCTS = {
        phucvu: { pass: "1234", role: "waiter", name: "Trần Phục Vụ" },
        thungan: { pass: "1234", role: "cashier", name: "Lê Thu Ngân" },
        daubep: { pass: "1234", role: "kitchen", name: "Phạm Đầu Bếp" },
        quanly: { pass: "1234", role: "manager", name: "Hoàng Quản Lý" },
        chuquan: { pass: "1234", role: "owner", name: "Nguyễn Chủ Quán" },
      };

      const DEF_MENU = [
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

      const DEF_EMPLOYEES = [
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

      const DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
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
      const MENU_IMG_FALLBACK =
        "https://placehold.co/600x400/2c2118/c9a84c?text=Pho+Vang";
      const getMenuImage = (item) =>
        item.img || MENU_IMG_BY_ID[item.id] || MENU_IMG_FALLBACK;
      const DEF_SCHEDULE = {
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

      // ════════════════════════════════════════════
      // FIREBASE
      // ════════════════════════════════════════════
      window.connectFirebase = async () => {
        const cfgInput = document.getElementById("fb-cfg");
        const raw = cfgInput
          ? cfgInput.value.trim()
          : localStorage.getItem("fb_cfg") || "";
        const errEl = document.getElementById("setup-err");
        if (errEl) errEl.style.display = "none";
        let cfg;
        try {
          cfg = JSON.parse(raw);
        } catch {
          try {
            const m = raw.match(/\{[\s\S]*\}/);
            if (!m) throw new Error();
            let s = m[0]
              .replace(/\/\/[^\n]*/g, "")
              .replace(/,\s*([}\]])/g, "$1")
              .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":')
              .replace(/:\s*'([^']*)'/g, ': "$1"');
            cfg = JSON.parse(s);
          } catch {
            if (errEl) {
              errEl.textContent =
                "❌ JSON không hợp lệ. Copy đúng firebaseConfig object.";
              errEl.style.display = "block";
            }
            return;
          }
        }
        if (!cfg.databaseURL) {
          if (errEl) {
            errEl.textContent =
              '❌ Thiếu "databaseURL". Hãy tạo Realtime Database trước.';
            errEl.style.display = "block";
          }
          return;
        }
        document.getElementById("setup-screen")?.classList.remove("show");
        document.getElementById("connecting")?.classList.add("show");
        try {
          const app = initializeApp(cfg);
          DB = getDatabase(app);
          FB = true;
          const snap = await get(ref(DB, "menu"));
          if (!snap.exists()) {
            const o = {};
            DEF_MENU.forEach((m) => {
              o[m.id] = m;
            });
            await set(ref(DB, "menu"), o);
          }
          const esnap = await get(ref(DB, "employees"));
          if (!esnap.exists()) {
            const o = {};
            DEF_EMPLOYEES.forEach((e) => {
              o[e.id] = e;
            });
            await set(ref(DB, "employees"), o);
          }
          const ssnap = await get(ref(DB, "schedule"));
          if (!ssnap.exists()) await set(ref(DB, "schedule"), DEF_SCHEDULE);
          localStorage.setItem("fb_cfg", JSON.stringify(cfg));
          document.getElementById("connecting")?.classList.remove("show");
          subscribeAll();
          showLogin(true);
          toast("🔥 Firebase kết nối! Sync real-time bật.", "s");
        } catch (e) {
          document.getElementById("connecting")?.classList.remove("show");
          document.getElementById("setup-screen")?.classList.add("show");
          if (errEl) {
            errEl.textContent = "❌ " + e.message;
            errEl.style.display = "block";
          }
        }
      };

      window.useLocal = () => {
        FB = false;
        menuItems = DEF_MENU.map((m) => ({ ...m }));
        employees = DEF_EMPLOYEES.map((e) => ({ ...e }));
        schedule = { ...DEF_SCHEDULE };
        document.getElementById("setup-screen")?.classList.remove("show");
        const fbDot = document.getElementById("fb-dot");
        const fbTxt = document.getElementById("fb-txt");
        if (fbDot) fbDot.className = "fb-dot off";
        if (fbTxt) fbTxt.textContent = "Chế độ local — không sync";
        showLogin(false);
        toast("⚠️ Chế độ local — không sync giữa các máy", "e");
      };

      function subscribeAll() {
        if (!FB) return;
        onValue(ref(DB, "menu"), (snap) => {
          menuItems = snap.exists() ? Object.values(snap.val()) : [];
          if (role === "customer") renderMenu(curCat);
          if (role === "owner") renderOwnerMenu();
        });
        onValue(ref(DB, "orders"), (snap) => {
          activeOrders = snap.exists() ? snap.val() : {};
          refreshCurrentView();
        });
        onValue(ref(DB, "sales"), (snap) => {
          salesHistory = snap.exists()
            ? Object.values(snap.val()).sort((a, b) => b.ts - a.ts)
            : [];
          if (role === "owner") renderOwnerDash();
          if (role === "cashier") renderCashierPaid();
        });
        onValue(ref(DB, "employees"), (snap) => {
          employees = snap.exists() ? Object.values(snap.val()) : [];
        });
        onValue(ref(DB, "attendance"), (snap) => {
          attendanceLog = snap.exists() ? snap.val() : {};
          refreshAttendanceUI();
        });
        onValue(ref(DB, "schedule"), (snap) => {
          schedule = snap.exists() ? snap.val() : {};
          if (role === "manager") renderSchedule();
        });
      }

   // TỰ ĐỘNG VÀO THẲNG MENU
// TỰ ĐỘNG KẾT NỐI
        const saved = localStorage.getItem("fb_cfg");
        if (saved) {
          const cfgInput = document.getElementById("fb-cfg");
          if (cfgInput) cfgInput.value = saved;
          window.connectFirebase();
        }
      // ════════════════════════════════════════════
      // AUTH
      // ════════════════════════════════════════════
      function showLogin(firebase) {
        document.getElementById("login-screen")?.classList.add("show");
        if (!firebase) {
          const fbDot = document.getElementById("fb-dot");
          const fbTxt = document.getElementById("fb-txt");
          if (fbDot) fbDot.className = "fb-dot off";
          if (fbTxt) fbTxt.textContent = "Chế độ local — không sync";
        }
      }

      const getPageName = () => document.body?.dataset?.page || "";
      const AUTH_SESSION_KEY = "pv_auth_session";
      const goToLoginPage = () => {
        window.location.href = "index.html";
      };
      function saveAuthSession() {
        sessionStorage.setItem(
          AUTH_SESSION_KEY,
          JSON.stringify({ role, currentUser }),
        );
      }
      function loadAuthSession() {
        try {
          const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      }
      function clearAuthSession() {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
      }
      window.restoreDashboardSession = () => {
        if (getPageName() !== "dashboard") return;
        const session = loadAuthSession();
        if (!session?.role || !session?.currentUser) {
          goToLoginPage();
          return;
        }
        role = session.role;
        currentUser = session.currentUser;
        enterApp();
      };
      function redirectFromIndexByRole(targetRole) {
        if (getPageName() !== "index") return false;
        window.location.href =
          targetRole === "customer" ? "menu.html" : "dashboard.html";
        return true;
      }

      window.selRole = (r) => {
        selRole_ = r;
        document
          .querySelectorAll(".role-tab")
          .forEach((t) => t.classList.remove("active"));
        document.getElementById("tab-" + r)?.classList.add("active");
        const isCustomer = r === "customer";
        document.getElementById("login-fields").style.display = isCustomer
          ? "none"
          : "block";
        document.getElementById("btn-guest").style.display = isCustomer
          ? "block"
          : "none";
      };

      window.guestLogin = () => {
        role = "customer";
        currentUser = { name: "Khách vãng lai", role: "customer" };
        saveAuthSession();
        if (redirectFromIndexByRole(role)) return;
        enterApp();
      };

      window.doLogin = () => {
        const u = document.getElementById("u").value.trim();
        const p = document.getElementById("p").value.trim();
        const err = document.getElementById("lerr");
        // Check built-in
        const builtin = BUILTIN_ACCTS[u];
        if (builtin && p === builtin.pass) {
          role = builtin.role;
          currentUser = { name: builtin.name, role: builtin.role, user: u };
          err.style.display = "none";
          saveAuthSession();
          if (redirectFromIndexByRole(role)) return;
          enterApp();
          return;
        }
        // Check dynamic employees
        const emp = employees.find((e) => e.user === u && e.pass === p);
        if (emp && emp.role === selRole_) {
          role = emp.role;
          currentUser = { ...emp };
          err.style.display = "none";
          saveAuthSession();
          if (redirectFromIndexByRole(role)) return;
          enterApp();
          return;
        }
        err.style.display = "block";
      };

function enterApp() {
        document.getElementById("setup-screen")?.classList.remove("show");
        document.getElementById("login-screen")?.classList.remove("show");
        const appEl = document.getElementById("app");
        if (!appEl) return;
        appEl.classList.add("active");
        
        const tbName = document.getElementById("tb-name");
        const tbRole = document.getElementById("tb-role");
        if (tbName) tbName.textContent = currentUser.name;
        if (tbRole) tbRole.textContent = ROLE_NAMES[role] || "";

        // Đổi nút góc phải tùy theo role
        const btnAuth = document.getElementById("btn-auth");
        if (!btnAuth) {
          showView(role);
          return;
        }
        if(role === 'customer') {
            btnAuth.textContent = 'Đăng nhập';
          btnAuth.onclick = () => {
            if (getPageName() === "index") {
              document.getElementById("login-screen")?.classList.add("show");
              return;
            }
            goToLoginPage();
          };
            btnAuth.style.background = 'var(--gold)';
            btnAuth.style.color = 'var(--dark)';
        } else {
            btnAuth.textContent = 'Đăng xuất';
            btnAuth.onclick = doLogout;
            btnAuth.style.background = 'rgba(192, 57, 43, 0.2)';
            btnAuth.style.color = '#e74c3c';
        }

        if (!FB) {
          const c = document.getElementById("sync-chip");
          if (c) {
            c.className = "live-chip local";
            c.innerHTML = "⚠️ Local";
          }
        }
        showView(role);
      }

      window.doLogout = () => {
        clearAuthSession();
        if (getPageName() !== "index") {
          goToLoginPage();
          return;
        }
        document.getElementById("login-screen")?.classList.add("show");
        document.getElementById("app")?.classList.remove("active");
        const u = document.getElementById("u");
        const p = document.getElementById("p");
        const lerr = document.getElementById("lerr");
        if (u) u.value = "";
        if (p) p.value = "";
        if (lerr) lerr.style.display = "none";
        cart = [];
        renderCart();
        currentUser = null;
        // reset role selector
        document
          .querySelectorAll(".role-tab")
          .forEach((t) => t.classList.remove("active"));
        const loginFields = document.getElementById("login-fields");
        const btnGuest = document.getElementById("btn-guest");
        if (loginFields) loginFields.style.display = "block";
        if (btnGuest) btnGuest.style.display = "none";
        selRole_ = "customer";
      };

      // ════════════════════════════════════════════
      // VIEWS
      // ════════════════════════════════════════════
      function showView(r) {
        document
          .querySelectorAll(".view")
          .forEach((v) => v.classList.remove("active"));
        const viewMap = {
          customer: "view-customer",
          waiter: "view-waiter",
          kitchen: "view-kitchen",
          cashier: "view-cashier",
          manager: "view-manager",
          owner: "view-owner",
        };
        document.getElementById(viewMap[r])?.classList.add("active");
        if (r === "customer") {
          renderMenu("all");
          renderCart();
        }
        if (r === "waiter") {
          renderAttendBar("waiter");
          renderWaiterOrders();
        }
        if (r === "kitchen") {
          renderAttendBar("kitchen");
          renderKitchen();
        }
        if (r === "cashier") {
          renderAttendBar("cashier");
          renderCashier();
          renderCashierPaid();
        }
        if (r === "manager") {
          renderAttendBar("manager");
          renderEmpTable();
          renderSchedule();
          renderAttendList();
          calcSalary();
        }
        if (r === "owner") {
          renderOwnerDash();
          renderOwnerMenu();
          renderOwnerStaff();
        }
      }

      function refreshCurrentView() {
        if (role === "waiter") renderWaiterOrders();
        if (role === "kitchen") renderKitchen();
        if (role === "cashier") renderCashier();
        if (role === "manager") renderManagerOrders();
        if (role === "owner") renderOwnerDash();
      }

      window.switchTab = (view, pane, btn) => {
        document
          .querySelectorAll(`#view-${view} .vtab`)
          .forEach((t) => t.classList.remove("active"));
        btn.classList.add("active");
        document
          .querySelectorAll(`#view-${view} .tab-pane`)
          .forEach((p) => p.classList.remove("active"));
        document.getElementById(`${view}-${pane}`)?.classList.add("active");
        if (view === "manager" && pane === "orders") renderManagerOrders();
        if (view === "owner" && pane === "staff") renderOwnerStaff();
      };

      // ════════════════════════════════════════════
      // ATTENDANCE
      // ════════════════════════════════════════════
      const todayKey = () => new Date().toISOString().slice(0, 10);

      function getMyAttend() {
        const td = todayKey();
        const uid = currentUser?.user || currentUser?.id;
        return attendanceLog?.[td]?.[uid] || null;
      }

      function renderAttendBar(barRole) {
        const bar = document.getElementById(`${barRole}-attend-bar`);
        if (!bar) return;
        const att = getMyAttend();
        const checkedIn = att && att.in && !att.out;
        bar.innerHTML = `
    <div class="shift-info">Ca hôm nay: <strong>${currentUser?.name || ""}</strong>
    ${att?.in ? ` | Vào: <strong style="color:var(--green)">${att.in}</strong>` : ""}
    ${att?.out ? ` | Ra: <strong style="color:#E74C3C">${att.out}</strong>` : ""}
    </div>
    ${!att?.in ? `<button class="btn-checkin" onclick="W.checkIn()">✅ Vào ca</button>` : ""}
    ${checkedIn ? `<button class="btn-checkout" onclick="W.checkOut()">🚪 Ra ca</button>` : ""}
    <span class="attend-status ${att?.in ? "as-in" : "as-out"}">${att?.in ? (att.out ? "Đã về" : "Đang làm") : "Chưa vào ca"}</span>`;
      }

      function refreshAttendanceUI() {
        if (role === "waiter") renderAttendBar("waiter");
        if (role === "kitchen") renderAttendBar("kitchen");
        if (role === "cashier") renderAttendBar("cashier");
        if (role === "manager") {
          renderAttendBar("manager");
          renderAttendList();
        }
      }

      window.checkIn = async () => {
        const td = todayKey();
        const uid = currentUser?.user || currentUser?.id;
        const att = attendanceLog?.[td]?.[uid];
        if (att?.in) {
          toast("Đã vào ca rồi!", "e");
          return;
        }
        const now = new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        const data = { in: now, name: currentUser.name, role: role };
        if (FB) await set(ref(DB, `attendance/${td}/${uid}`), data);
        else {
          if (!attendanceLog[td]) attendanceLog[td] = {};
          attendanceLog[td][uid] = data;
          refreshAttendanceUI();
        }
        toast(`✅ Vào ca lúc ${now}!`, "s");
      };

      window.checkOut = async () => {
        const td = todayKey();
        const uid = currentUser?.user || currentUser?.id;
        const att = attendanceLog?.[td]?.[uid];
        if (!att?.in) {
          toast("Chưa vào ca!", "e");
          return;
        }
        if (att.out) {
          toast("Đã ra ca rồi!", "e");
          return;
        }
        const now = new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        });
        if (FB) await update(ref(DB, `attendance/${td}/${uid}`), { out: now });
        else {
          attendanceLog[td][uid].out = now;
          refreshAttendanceUI();
        }
        toast(`🚪 Ra ca lúc ${now}!`, "s");
      };

      // ════════════════════════════════════════════
      // MENU (Customer)
      // ════════════════════════════════════════════
      window.filterCat = (cat, btn) => {
        curCat = cat;
        document
          .querySelectorAll(".cat-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderMenu(cat);
      };

      function renderMenu(cat) {
        const g = document.getElementById("menu-grid");
        if (!g) return;
        const items =
          cat === "all" ? menuItems : menuItems.filter((i) => i.cat === cat);
        if (!items.length) {
          g.innerHTML = `<div style="color:var(--mid);padding:24px;grid-column:1/-1">Không có món trong danh mục này</div>`;
          return;
        }
        g.innerHTML = items
          .map(
            (i) => `
    <div class="menu-card${i.avail ? "" : " unavail"}" onclick="${i.avail ? `W.addToCart('${i.id}')` : ""}" >
      <div class="mc-img"><img class="mc-photo" src="${getMenuImage(i)}" alt="${i.name}" loading="lazy" onerror="this.onerror=null;this.src='${MENU_IMG_FALLBACK}'" /></div>
      <div class="mc-body">
        <div class="mc-name">${i.name}</div>
        <div class="mc-desc">${i.desc}</div>
        <div class="mc-foot">
          <div class="mc-price">${fmt(i.price)}</div>
          ${i.avail ? `<button class="btn-add" onclick="event.stopPropagation();W.addToCart('${i.id}')">+</button>` : '<span style="font-size:9px;color:var(--mid)">Hết</span>'}
        </div>
      </div>
    </div>`,
          )
          .join("");
      }

      // ════════════════════════════════════════════
      // CART
      // ════════════════════════════════════════════
      window.addToCart = (id) => {
        const item = menuItems.find((i) => i.id == id);
        if (!item || !item.avail) return;
        const ex = cart.find((c) => c.item.id == id);
        ex ? ex.qty++ : cart.push({ item: { ...item }, qty: 1 });
        renderCart();
        toast(`✅ ${item.emoji} ${item.name}`, "s");
      };

      window.chgQty = (id, d) => {
        const x = cart.findIndex((c) => c.item.id == id);
        if (x < 0) return;
        cart[x].qty += d;
        if (cart[x].qty <= 0) cart.splice(x, 1);
        renderCart();
      };

      function renderCart() {
        const con = document.getElementById("cart-items");
        if (!con) return;
        const total = cart.reduce((s, c) => s + c.item.price * c.qty, 0);
        const cnt = cart.reduce((s, c) => s + c.qty, 0);
        document.getElementById("cart-cnt").textContent = cnt;
        document.getElementById("cart-tot").textContent = fmt(total);
        document.getElementById("btn-order").disabled = cart.length === 0;
        con.innerHTML =
          cart.length === 0
            ? `<div class="cart-empty"><div class="ce-icon">🍽️</div><div>Chưa có món</div></div>`
            : cart
                .map(
                  (c) => `<div class="cart-item">
      <div class="ci-e">${c.item.emoji}</div>
      <div class="ci-info"><div class="ci-name">${c.item.name}</div><div class="ci-price">${fmt(c.item.price)}</div></div>
      <div class="ci-qty">
        <button class="qbtn" onclick="W.chgQty('${c.item.id}',-1)">−</button>
        <span class="qnum">${c.qty}</span>
        <button class="qbtn" onclick="W.chgQty('${c.item.id}',1)">+</button>
      </div>
    </div>`,
                )
                .join("");
      }

      window.placeOrder = () => {
        const tbl = document.getElementById("tbl-sel").value;
        if (!tbl) {
          toast("⚠️ Chọn số bàn!", "e");
          return;
        }
        const total = cart.reduce((s, c) => s + c.item.price * c.qty, 0);
        document.getElementById("pay-sum").innerHTML = `
    <div style="margin-bottom:10px"><strong>📍 ${tbl}</strong></div>
    ${cart
      .map(
        (
          c,
        ) => `<div style="display:flex;justify-content:space-between;font-size:12px;padding:3px 0">
      <span>${c.item.emoji} ${c.item.name} ×${c.qty}</span><span style="color:var(--gold)">${fmt(c.item.price * c.qty)}</span>
    </div>`,
      )
      .join("")}
    <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;border-top:1px solid rgba(201,168,76,.2);margin-top:10px;padding-top:10px">
      <span>Tổng</span><span style="color:var(--green)">${fmt(total)}</span>
    </div>`;
        document.getElementById("pay-modal").classList.add("active");
      };

      window.confirmOrder = async () => {
        const tbl = document.getElementById("tbl-sel").value;
        const total = cart.reduce((s, c) => s + c.item.price * c.qty, 0);
        const order = {
          table: tbl,
          total,
          status: "pending",
          ts: Date.now(),
          time: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          items: cart.map((c) => ({
            id: c.item.id,
            name: c.item.name,
            emoji: c.item.emoji,
            price: c.item.price,
            qty: c.qty,
          })),
        };
        if (FB) {
          const r = push(ref(DB, "orders"));
          await set(r, { ...order, fbKey: r.key });
        } else {
          const k = "o" + Date.now();
          activeOrders[k] = { ...order, fbKey: k };
          refreshCurrentView();
        }
        closeMod("pay-modal");
        cart = [];
        renderCart();
        document.getElementById("tbl-sel").value = "";
        toast("🎉 Đặt món thành công!", "s");
      };

      // ════════════════════════════════════════════
      // WAITER VIEW
      // ════════════════════════════════════════════
      function renderWaiterOrders() {
        const g = document.getElementById("waiter-grid");
        if (!g) return;
        const orders = Object.values(activeOrders).sort((a, b) => a.ts - b.ts);
        if (!orders.length) {
          g.innerHTML = `<div class="no-content"><div class="ico">✅</div><div>Không có đơn mới</div></div>`;
          return;
        }
        g.innerHTML = orders.map((o) => orderCardHTML(o, "waiter")).join("");
      }

      function orderCardHTML(o, view) {
        const stMap = {
          pending: "⏳ Chờ",
          cooking: "🍳 Đang nấu",
          ready: "✅ Xong bếp",
          serving: "🚀 Đang mang",
        };
        const stClass = {
          pending: "s-pending",
          cooking: "s-cooking",
          ready: "s-ready",
          serving: "s-serving",
        };
        let btns = "";
        if (view === "waiter") {
          if (o.status === "pending")
            btns += `<button class="btn-s blue" onclick="W.updateStatus('${o.fbKey}','confirmed')">✓ Xác nhận</button>`;
          if (o.status === "ready")
            btns += `<button class="btn-s blue" onclick="W.updateStatus('${o.fbKey}','serving')">🚀 Mang ra</button>`;
          if (o.status === "serving")
            btns += `<button class="btn-s green" onclick="W.requestPay('${o.fbKey}')">💳 Gọi thu ngân</button>`;
        }
        if (view === "kitchen") {
          if (o.status === "confirmed")
            btns += `<button class="btn-s purple" onclick="W.updateStatus('${o.fbKey}','cooking')">🍳 Bắt đầu nấu</button>`;
          if (o.status === "cooking")
            btns += `<button class="btn-s green" onclick="W.updateStatus('${o.fbKey}','ready')">✅ Xong</button>`;
        }
        if (view === "manager")
          btns = `<span style="font-size:11px;color:var(--mid)">${fmt(o.total)}</span>`;
        return `<div class="order-card">
    <div class="oc-hdr">
      <div><div class="oc-tbl">📍 ${o.table}</div><div class="oc-time">⏱ ${o.time} #${(o.fbKey || "").slice(-4)}</div></div>
      <span class="oc-status ${stClass[o.status] || "s-pending"}">${stMap[o.status] || o.status}</span>
    </div>
    <div class="oc-items">
      ${o.items.map((it) => `<div class="oi-row"><span>${it.emoji} ${it.name} <span class="qbadge">×${it.qty}</span></span><span style="color:var(--gold)">${fmt(it.price * it.qty)}</span></div>`).join("")}
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:11px;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.04)">
        <span>Tổng</span><span style="color:var(--green)">${fmt(o.total)}</span>
      </div>
    </div>
    ${btns ? `<div class="oc-foot">${btns}</div>` : ""}
  </div>`;
      }

      window.updateStatus = async (key, status) => {
        if (FB) await update(ref(DB, `orders/${key}`), { status });
        else {
          if (activeOrders[key]) activeOrders[key].status = status;
          refreshCurrentView();
        }
        const msgs = {
          confirmed: "✅ Đã xác nhận đơn",
          cooking: "🍳 Bắt đầu nấu!",
          ready: "✅ Món đã xong bếp!",
          serving: "🚀 Đang mang ra bàn!",
        };
        toast(msgs[status] || "Cập nhật thành công", "s");
      };

      window.requestPay = async (key) => {
        if (FB)
          await update(ref(DB, `orders/${key}`), { status: "waiting_pay" });
        else {
          if (activeOrders[key]) activeOrders[key].status = "waiting_pay";
          refreshCurrentView();
        }
        toast("💳 Đã thông báo thu ngân!", "s");
      };

      // Waiter history
      window.renderWaiterHistory = () => {
        const list = document.getElementById("waiter-hist-list");
        if (!list) return;
        const today = todayKey();
        const att = attendanceLog?.[today] || {};
        const myKey = currentUser?.user || currentUser?.id;
        const myAtt = att[myKey];
        list.innerHTML = `<div class="salary-card">
    <div class="salary-name">Ca hôm nay — ${new Date().toLocaleDateString("vi-VN")}</div>
    <div class="salary-row"><span>Giờ vào ca</span><span>${myAtt?.in || "—"}</span></div>
    <div class="salary-row"><span>Giờ ra ca</span><span>${myAtt?.out || "Chưa ra"}</span></div>
    <div class="salary-row"><span>Trạng thái</span><span class="badge ${myAtt?.in ? (myAtt.out ? "badge-green" : "badge-orange") : "badge-red"}">${myAtt?.in ? (myAtt.out ? "Hoàn thành" : "Đang làm") : "Chưa vào ca"}</span></div>
  </div>`;
      };

      // ════════════════════════════════════════════
      // KITCHEN VIEW
      // ════════════════════════════════════════════
      function renderKitchen() {
        const g = document.getElementById("kitchen-grid");
        if (!g) return;
        const orders = Object.values(activeOrders)
          .filter((o) => ["pending", "confirmed", "cooking"].includes(o.status))
          .sort((a, b) => a.ts - b.ts);
        if (!orders.length) {
          g.innerHTML = `<div class="no-content"><div class="ico">🍳</div><div>Không có món cần nấu</div></div>`;
          return;
        }
        g.innerHTML = orders
          .map((o) => {
            const cooking = o.status === "cooking";
            return `<div class="kitchen-card ${cooking ? "cooking" : ""}">
      <div class="kc-hdr ${cooking ? "cooking-bg" : ""}">
        <div class="kc-tbl ${cooking ? "cooking-text" : ""}">📍 ${o.table}</div>
        <span class="oc-status ${cooking ? "s-cooking" : "s-pending"}">${cooking ? "🍳 Đang nấu" : "⏳ Chờ nấu"}</span>
      </div>
      <div class="oc-items">
        ${o.items.map((it) => `<div class="oi-row"><span>${it.emoji} ${it.name} <span class="qbadge">×${it.qty}</span></span></div>`).join("")}
      </div>
      <div class="oc-foot">
        ${o.status === "confirmed" ? `<button class="btn-s purple" onclick="W.updateStatus('${o.fbKey}','cooking')">🍳 Bắt đầu nấu</button>` : ""}
        ${o.status === "cooking" ? `<button class="btn-s green"  onclick="W.updateStatus('${o.fbKey}','ready')">✅ Xong — Ra đĩa</button>` : ""}
      </div>
    </div>`;
          })
          .join("");
      }

      // ════════════════════════════════════════════
      // CASHIER VIEW
      // ════════════════════════════════════════════
      function renderCashier() {
        const g = document.getElementById("cashier-grid");
        if (!g) return;
        const orders = Object.values(activeOrders)
          .filter((o) => o.status === "waiting_pay")
          .sort((a, b) => a.ts - b.ts);
        if (!orders.length) {
          g.innerHTML = `<div class="no-content"><div class="ico">✅</div><div>Không có đơn chờ thanh toán</div></div>`;
          return;
        }
        g.innerHTML = orders
          .map(
            (o) => `<div class="pay-card">
    <div class="pc-hdr">
      <div class="pc-tbl">📍 ${o.table}</div>
      <div class="pc-total">${fmt(o.total)}</div>
    </div>
    <div class="pc-items">
      ${o.items.map((it) => `<div class="oi-row"><span>${it.emoji} ${it.name} ×${it.qty}</span><span style="color:var(--gold)">${fmt(it.price * it.qty)}</span></div>`).join("")}
    </div>
    <div class="pc-foot"><button class="btn-pay" onclick="W.openCashout('${o.fbKey}')">💳 Thu tiền</button></div>
  </div>`,
          )
          .join("");
      }

      function renderCashierPaid() {
        const list = document.getElementById("cashier-paid-list");
        if (!list) return;
        const rev = salesHistory.reduce((s, o) => s + o.total, 0);
        const revEl = document.getElementById("cashier-rev");
        if (revEl) revEl.textContent = fmt(rev);
        list.innerHTML =
          salesHistory
            .slice(0, 20)
            .map(
              (o) => `
    <div class="recent-row" style="margin-bottom:5px">
      <span class="r-tbl">📍 ${o.table}</span>
      <span style="color:var(--mid);font-size:10px">${o.payMethod || "Tiền mặt"}</span>
      <span class="r-amt">${fmt(o.total)}</span>
      <span class="r-time">${o.completedAt || o.time}</span>
    </div>`,
            )
            .join("") ||
          '<div style="color:var(--mid);font-size:12px">Chưa có giao dịch</div>';
      }

      window.openCashout = (key) => {
        cashoutOrderKey = key;
        const o = activeOrders[key];
        if (!o) return;
        document.getElementById("cashout-sum").innerHTML = `
    <div style="font-weight:700;margin-bottom:8px">📍 ${o.table}</div>
    ${o.items.map((it) => `<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0"><span>${it.emoji} ${it.name} ×${it.qty}</span><span style="color:var(--gold)">${fmt(it.price * it.qty)}</span></div>`).join("")}
    <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;border-top:1px solid rgba(201,168,76,.2);margin-top:10px;padding-top:10px">
      <span>Tổng cộng</span><span style="color:var(--green)">${fmt(o.total)}</span>
    </div>`;
        document.getElementById("cashout-modal").classList.add("active");
      };

      window.confirmPay = async () => {
        const key = cashoutOrderKey;
        if (!key) return;
        const o = activeOrders[key];
        if (!o) return;
        const method = document.getElementById("pay-method").value;
        const saleObj = {
          ...o,
          completedAt: new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          ts: Date.now(),
          payMethod: method,
        };
        if (FB) {
          const sk = push(ref(DB, "sales")).key;
          await set(ref(DB, `sales/${sk}`), saleObj);
          const upd = {};
          for (const it of o.items) {
            const s = await get(ref(DB, `menu/${it.id}`));
            if (s.exists())
              upd[`menu/${it.id}/soldCount`] =
                (s.val().soldCount || 0) + it.qty;
          }
          if (Object.keys(upd).length) await update(ref(DB), upd);
          await remove(ref(DB, `orders/${key}`));
        } else {
          o.items.forEach((it) => {
            const m = menuItems.find((m) => m.id == it.id);
            if (m) m.soldCount = (m.soldCount || 0) + it.qty;
          });
          salesHistory.unshift(saleObj);
          delete activeOrders[key];
          refreshCurrentView();
          renderCashierPaid();
        }
        closeMod("cashout-modal");
        cashoutOrderKey = null;
        toast(`✅ Đã thu tiền ${fmt(o.total)} — ${method}`, "s");
      };

      // ════════════════════════════════════════════
      // MANAGER VIEW
      // ════════════════════════════════════════════
      function renderEmpTable() {
        const wrap = document.getElementById("emp-table-wrap");
        if (!wrap) return;
        const allEmp = [...employees];
        if (!allEmp.length) {
          wrap.innerHTML =
            '<div style="color:var(--mid);font-size:12px">Chưa có nhân viên</div>';
          return;
        }
        wrap.innerHTML = `<table class="emp-table">
    <thead><tr><th>Họ tên</th><th>Vị trí</th><th>Tài khoản</th><th>Lương/giờ</th><th>Thao tác</th></tr></thead>
    <tbody>
      ${allEmp
        .map(
          (e) => `<tr>
        <td>${e.name}</td>
        <td><span class="badge badge-blue">${ROLE_NAMES[e.role] || e.role}</span></td>
        <td style="color:var(--mid)">${e.user || "—"}</td>
        <td style="color:var(--gold)">${fmt(e.wage || 0)}/h</td>
        <td><button class="btn-sm edit" onclick="W.editEmp('${e.id}')">Sửa</button> <button class="btn-sm del" onclick="W.delEmp('${e.id}')">Xóa</button></td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;
      }

      function renderSchedule() {
        const g = document.getElementById("schedule-grid");
        if (!g) return;
        g.innerHTML = DAYS.map(
          (day, i) => `
    <div class="sched-day">
      <div class="sched-day-name">${day}</div>
      ${(schedule[i] || [])
        .map((s) => {
          const emp = employees.find((e) => e.id === s.emp) || { name: s.emp };
          const isMorning =
            s.shift.includes("Sáng") ||
            s.shift.includes("7") ||
            s.shift.includes("8");
          return `<div class="sched-shift ${isMorning ? "ss-morning" : "ss-evening"}" title="${emp.name}">${emp.name.split(" ").pop()}<br><span style="font-size:9px">${s.shift}</span></div>`;
        })
        .join("")}
    </div>`,
        ).join("");
      }

      function renderAttendList() {
        const list = document.getElementById("attend-list");
        if (!list) return;
        const td = todayKey();
        const att = attendanceLog?.[td] || {};
        const allEmp = [...employees];
        if (!allEmp.length) {
          list.innerHTML =
            '<div style="color:var(--mid);font-size:12px">Chưa có nhân viên</div>';
          return;
        }
        list.innerHTML = allEmp
          .map((e) => {
            const uid = e.user || e.id;
            const a = att[uid];
            let statusBadge,
              late = "";
            if (!a?.in) {
              statusBadge =
                '<span class="badge badge-red">Vắng / Chưa vào</span>';
            } else if (a.in) {
              const inH = parseInt(a.in.split(":")[0]),
                inM = parseInt(a.in.split(":")[1] || 0);
              const totalMin = inH * 60 + inM;
              if (totalMin > 8 * 60 + 15)
                late = `<span class="badge badge-orange" style="margin-left:4px">Muộn ${inH}:${String(inM).padStart(2, "0")}</span>`;
              statusBadge = `<span class="badge badge-green">${a.out ? "Đã về" : "Đang làm"}</span>${late}`;
            }
            return `<div class="att-row">
      <div class="att-name">${e.name} <span class="badge badge-blue" style="font-size:9px">${ROLE_NAMES[e.role]}</span></div>
      <div class="att-times">${a?.in ? `Vào: ${a.in}` : ""} ${a?.out ? `| Ra: ${a.out}` : ""}</div>
      ${statusBadge}
    </div>`;
          })
          .join("");
      }

      window.calcSalary = () => {
        const list = document.getElementById("salary-list");
        if (!list) return;
        const allEmp = [...employees];
        if (!allEmp.length) {
          list.innerHTML =
            '<div style="color:var(--mid);font-size:12px">Chưa có nhân viên</div>';
          return;
        }
        const td = todayKey();
        const allAtt = attendanceLog || {};
        list.innerHTML = allEmp
          .map((e) => {
            let totalHours = 0,
              totalDays = 0,
              absences = 0;
            Object.entries(allAtt).forEach(([date, dayAtt]) => {
              const uid = e.user || e.id;
              const a = dayAtt[uid];
              if (a?.in && a?.out) {
                const [ih, im] = a.in.split(":").map(Number);
                const [oh, om] = a.out.split(":").map(Number);
                const hours = (oh * 60 + om - ih * 60 - im) / 60;
                totalHours += Math.max(0, hours);
                totalDays++;
              } else if (a?.in && !a?.out) {
                totalHours += 8;
                totalDays++;
              } else absences++;
            });
            const salary = Math.round(totalHours * (e.wage || 30000));
            return `<div class="salary-card">
      <div class="salary-name">${e.name} <span class="badge badge-blue" style="font-size:9px">${ROLE_NAMES[e.role]}</span></div>
      <div class="salary-row"><span>Số ngày làm</span><span>${totalDays} ngày</span></div>
      <div class="salary-row"><span>Tổng giờ làm</span><span>${totalHours.toFixed(1)} giờ</span></div>
      <div class="salary-row"><span>Lương/giờ</span><span>${fmt(e.wage || 0)}</span></div>
      ${absences > 0 ? `<div class="salary-row"><span>Số ngày vắng</span><span class="badge badge-red">${absences} ngày</span></div>` : ""}
      <div class="salary-total"><span>Lương tháng (ước tính)</span><span>${fmt(salary)}</span></div>
    </div>`;
          })
          .join("");
      };

      function renderManagerOrders() {
        const g = document.getElementById("manager-orders-grid");
        if (!g) return;
        const orders = Object.values(activeOrders).sort((a, b) => a.ts - b.ts);
        if (!orders.length) {
          g.innerHTML = `<div class="no-content"><div class="ico">📋</div><div>Không có đơn nào</div></div>`;
          return;
        }
        g.innerHTML = orders.map((o) => orderCardHTML(o, "manager")).join("");
      }

      window.openAddEmp = () =>
        document.getElementById("add-emp-modal").classList.add("active");

      window.addEmployee = async () => {
        const name = document.getElementById("e-name").value.trim();
        const erole = document.getElementById("e-role").value;
        const user = document.getElementById("e-user").value.trim();
        const pass = document.getElementById("e-pass").value.trim() || "1234";
        const wage = parseInt(document.getElementById("e-wage").value) || 30000;
        if (!name || !user) {
          toast("⚠️ Điền đầy đủ thông tin!", "e");
          return;
        }
        const emp = { name, role: erole, user, pass, wage };
        if (FB) {
          const r = push(ref(DB, "employees"));
          await set(r, { ...emp, id: r.key });
        } else {
          emp.id = "e" + Date.now();
          employees.push(emp);
          renderEmpTable();
        }
        closeMod("add-emp-modal");
        ["e-name", "e-user", "e-pass", "e-wage"].forEach(
          (x) => (document.getElementById(x).value = ""),
        );
        toast(`✅ Đã thêm "${name}"!`, "s");
      };

      window.editEmp = (id) => {
        const emp = employees.find((e) => e.id == id);
        if (!emp) return;
        document.getElementById("edit-emp-id").value = id;
        document.getElementById("edit-e-name").value = emp.name;
        document.getElementById("edit-e-role").value = emp.role;
        document.getElementById("edit-e-wage").value = emp.wage || 30000;
        document.getElementById("edit-emp-modal").classList.add("active");
      };

      window.saveEmployee = async () => {
        const id = document.getElementById("edit-emp-id").value;
        const upd = {
          name: document.getElementById("edit-e-name").value.trim(),
          role: document.getElementById("edit-e-role").value,
          wage: parseInt(document.getElementById("edit-e-wage").value) || 30000,
        };
        if (FB) await update(ref(DB, `employees/${id}`), upd);
        else {
          const emp = employees.find((e) => e.id == id);
          if (emp) Object.assign(emp, upd);
          renderEmpTable();
        }
        closeMod("edit-emp-modal");
        toast("✅ Đã cập nhật nhân viên!", "s");
      };

      window.delEmp = async (id) => {
        const emp = employees.find((e) => e.id == id);
        if (!emp) return;
        if (FB) await remove(ref(DB, `employees/${id}`));
        else {
          employees = employees.filter((e) => e.id != id);
          renderEmpTable();
        }
        toast(`🗑️ Đã xóa "${emp.name}"!`, "s");
      };

      window.openEditSchedule = () =>
        toast(
          "Tính năng chỉnh sửa ca: click vào ca trong bảng để thay đổi",
          "s",
        );

      // ════════════════════════════════════════════
      // OWNER VIEW
      // ════════════════════════════════════════════
      function renderOwnerDash() {
        const rev = salesHistory.reduce((s, o) => s + o.total, 0);
        const g = document.getElementById("stats-grid");
        if (!g) return;
        g.innerHTML = `
    <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-val">${fmt(rev)}</div><div class="stat-lbl">Doanh thu hôm nay</div></div>
    <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-val">${salesHistory.length}</div><div class="stat-lbl">Đơn hoàn thành</div></div>
    <div class="stat-card"><div class="stat-icon">🔥</div><div class="stat-val">${Object.values(activeOrders).length}</div><div class="stat-lbl">Đơn đang xử lý</div></div>
    <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-val">${employees.length}</div><div class="stat-lbl">Nhân viên</div></div>`;
        const sorted = [...menuItems]
          .filter((i) => i.soldCount > 0)
          .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
          .slice(0, 5);
        const mx = sorted[0]?.soldCount || 1;
        document.getElementById("top-list").innerHTML =
          sorted.length === 0
            ? '<div style="color:var(--mid);font-size:12px">Chưa có dữ liệu</div>'
            : sorted
                .map(
                  (i) =>
                    `<div class="top-row"><div class="top-e">${i.emoji}</div><div class="top-info"><div class="top-name">${i.name}</div><div class="bar-wrap"><div class="bar-fill" style="width:${(i.soldCount / mx) * 100}%"></div></div></div><div class="top-cnt">${i.soldCount}</div></div>`,
                )
                .join("");
        document.getElementById("recent-list").innerHTML =
          salesHistory.length === 0
            ? '<div style="color:var(--mid);font-size:12px">Chưa có đơn</div>'
            : salesHistory
                .slice(0, 8)
                .map(
                  (o) =>
                    `<div class="recent-row"><span class="r-tbl">📍 ${o.table}</span><span class="r-amt">${fmt(o.total)}</span><span class="r-time">${o.completedAt || o.time}</span></div>`,
                )
                .join("");
      }

      function renderOwnerMenu() {
        const g = document.getElementById("mm-grid");
        if (!g) return;
        g.innerHTML = menuItems
          .map(
            (i) => `<div class="mm-card">
    <div class="mm-e"><img class="mm-photo" src="${getMenuImage(i)}" alt="${i.name}" loading="lazy" onerror="this.onerror=null;this.src='${MENU_IMG_FALLBACK}'" /></div>
    <div class="mm-info"><div class="mm-name">${i.name}</div><div class="mm-sub">${i.cat} · ${fmt(i.price)}</div><div class="mm-sold">Bán: ${i.soldCount || 0}</div></div>
    <div class="mm-acts">
      <button class="btn-av ${i.avail ? "on" : "off"}" onclick="W.togAvail('${i.id}')">${i.avail ? "✓ Còn" : "✗ Hết"}</button>
      <button class="btn-del" onclick="W.delItem('${i.id}')">Xóa</button>
    </div>
  </div>`,
          )
          .join("");
      }

      function renderOwnerStaff() {
        const wrap = document.getElementById("owner-emp-wrap");
        if (!wrap) return;
        wrap.innerHTML = `<table class="emp-table">
    <thead><tr><th>Họ tên</th><th>Vị trí</th><th>Lương/giờ</th></tr></thead>
    <tbody>${employees.map((e) => `<tr><td>${e.name}</td><td><span class="badge badge-blue">${ROLE_NAMES[e.role] || e.role}</span></td><td style="color:var(--gold)">${fmt(e.wage || 0)}/h</td></tr>`).join("")}</tbody>
  </table>`;
        const sl = document.getElementById("owner-salary-list");
        if (!sl) return;
        sl.innerHTML =
          employees
            .map((e) => {
              const salary = e.wage * 8 * 26;
              return `<div class="recent-row"><span class="r-tbl">${e.name}</span><span style="color:var(--blue);font-size:10px">${ROLE_NAMES[e.role]}</span><span class="r-amt">${fmt(salary)}/tháng</span></div>`;
            })
            .join("") ||
          '<div style="color:var(--mid);font-size:12px">Chưa có nhân viên</div>';
      }

      window.openAddItem = () =>
        document.getElementById("add-item-modal").classList.add("active");

      window.addMenuItem = async () => {
        const name = document.getElementById("n-name").value.trim();
        const cat = document.getElementById("n-cat").value;
        const price = parseInt(document.getElementById("n-price").value);
        const desc =
          document.getElementById("n-desc").value.trim() || "Món ngon";
        const img = document.getElementById("n-img").value.trim();
        if (!name || !price || price <= 0) {
          toast("⚠️ Điền đầy đủ!", "e");
          return;
        }
        const item = {
          name,
          cat,
          price,
          emoji: "🍽️",
          img,
          desc,
          avail: true,
          soldCount: 0,
        };
        if (FB) {
          const r = push(ref(DB, "menu"));
          await set(r, { ...item, id: r.key });
        } else {
          item.id = "m" + Date.now();
          menuItems.push(item);
          renderOwnerMenu();
        }
        closeMod("add-item-modal");
        ["n-name", "n-price", "n-desc", "n-img"].forEach(
          (x) => (document.getElementById(x).value = ""),
        );
        toast(`✅ Đã thêm "${name}"!`, "s");
      };

      window.togAvail = async (id) => {
        const item = menuItems.find((i) => i.id == id);
        if (!item) return;
        const nv = !item.avail;
        if (FB) await update(ref(DB, `menu/${id}`), { avail: nv });
        else {
          item.avail = nv;
          renderOwnerMenu();
        }
        toast(
          `${nv ? "✅" : "🚫"} ${item.name} ${nv ? "đã mở" : "đã tắt"}`,
          "s",
        );
      };

      window.delItem = async (id) => {
        const item = menuItems.find((i) => i.id == id);
        if (!item) return;
        if (FB) await remove(ref(DB, `menu/${id}`));
        else {
          menuItems = menuItems.filter((i) => i.id != id);
          renderOwnerMenu();
        }
        toast(`🗑️ Đã xóa "${item.name}"`, "s");
      };

      // ════════════════════════════════════════════
      // HELPERS
      // ════════════════════════════════════════════
      const fmt = (n) => Number(n).toLocaleString("vi-VN") + "đ";
      window.closeMod = (id) =>
        document.getElementById(id).classList.remove("active");
      function toast(msg, type = "") {
        const c = document.getElementById("tc");
        const t = document.createElement("div");
        t.className = `toast ${type}`;
        t.textContent = msg;
        c.appendChild(t);
        setTimeout(() => t.remove(), 3000);
      }
      document.querySelectorAll(".modal-ov").forEach((o) =>
        o.addEventListener("click", function (e) {
          if (e.target === this) this.classList.remove("active");
        }),
      );

      const W = {
        addToCart: window.addToCart,
        chgQty: window.chgQty,
        updateStatus: window.updateStatus,
        requestPay: window.requestPay,
        openCashout: window.openCashout,
        confirmPay: window.confirmPay,
        checkIn: window.checkIn,
        checkOut: window.checkOut,
        togAvail: window.togAvail,
        delItem: window.delItem,
        editEmp: window.editEmp,
        delEmp: window.delEmp,
        renderWaiterHistory: window.renderWaiterHistory,
      };
      window.W = W;
    