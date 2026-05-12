import "./auth.js";
import {
  DAYS,
  ROLE_NAMES,
  bootstrapData,
  closeMod,
  enterApp,
  fmt,
  getMenuImage,
  MENU_IMG_FALLBACK,
  loadAuthSession,
  persistLocalData,
  registerActions,
  registerRoleHandler,
  registerTabHandler,
  setCurrentUser,
  setRole,
  state,
  toast,
  todayKey,
} from "./app.js";
import { get, push, ref, remove, set, update } from "./firebase-config.js";

const getMyAttendance = () => {
  const uid = state.currentUser?.user || state.currentUser?.id;
  return state.attendanceLog?.[todayKey()]?.[uid] || null;
};

const renderAttendanceBar = (role) => {
  const bar = document.getElementById(`${role}-attend-bar`);
  if (!bar) return;
  const attendance = getMyAttendance();
  const checkedIn = attendance && attendance.in && !attendance.out;

  bar.innerHTML = `
    <div class="shift-info">Ca hôm nay: <strong>${state.currentUser?.name || ""}</strong>
    ${attendance?.in ? ` | Vào: <strong style="color:var(--green)">${attendance.in}</strong>` : ""}
    ${attendance?.out ? ` | Ra: <strong style="color:#E74C3C">${attendance.out}</strong>` : ""}
    </div>
    ${!attendance?.in ? '<button class="btn-checkin" onclick="W.checkIn()">✅ Vào ca</button>' : ""}
    ${checkedIn ? '<button class="btn-checkout" onclick="W.checkOut()">🚪 Ra ca</button>' : ""}
    <span class="attend-status ${attendance?.in ? "as-in" : "as-out"}">${attendance?.in ? (attendance.out ? "Đã về" : "Đang làm") : "Chưa vào ca"}</span>`;
};

const renderWaiterOrders = () => {
  const grid = document.getElementById("waiter-grid");
  if (!grid) return;
  const orders = Object.values(state.activeOrders).sort((a, b) => a.ts - b.ts);
  if (!orders.length) {
    grid.innerHTML = '<div class="no-content"><div class="ico">✅</div><div>Không có đơn mới</div></div>';
    return;
  }
  grid.innerHTML = orders.map((order) => orderCardHTML(order, "waiter")).join("");
};

const orderCardHTML = (order, view) => {
  const statusMap = {
    pending: "⏳ Chờ",
    cooking: "🍳 Đang nấu",
    ready: "✅ Xong bếp",
    serving: "🚀 Đang mang",
    waiting_pay: "💳 Chờ thanh toán",
    confirmed: "✅ Đã xác nhận",
  };
  const statusClass = {
    pending: "s-pending",
    confirmed: "s-ready",
    cooking: "s-cooking",
    ready: "s-ready",
    serving: "s-serving",
    waiting_pay: "s-ready",
  };

  let buttons = "";
  if (view === "waiter") {
    if (order.status === "pending") {
      buttons += `<button class="btn-s blue" onclick="W.updateStatus('${order.fbKey}','confirmed')">✓ Xác nhận</button>`;
    }
    if (order.status === "ready") {
      buttons += `<button class="btn-s blue" onclick="W.updateStatus('${order.fbKey}','serving')">🚀 Mang ra</button>`;
    }
    if (order.status === "serving") {
      buttons += `<button class="btn-s green" onclick="W.requestPay('${order.fbKey}')">💳 Gọi thu ngân</button>`;
    }
  }

  if (view === "manager") {
    buttons = `<span style="font-size:11px;color:var(--mid)">${fmt(order.total)}</span>`;
  }

  return `<div class="order-card">
    <div class="oc-hdr">
      <div><div class="oc-tbl">📍 ${order.table}</div><div class="oc-time">⏱ ${order.time} #${(order.fbKey || "").slice(-4)}</div></div>
      <span class="oc-status ${statusClass[order.status] || "s-pending"}">${statusMap[order.status] || order.status}</span>
    </div>
    <div class="oc-items">
      ${order.items.map((item) => `<div class="oi-row"><span>${item.emoji} ${item.name} <span class="qbadge">×${item.qty}</span></span><span style="color:var(--gold)">${fmt(item.price * item.qty)}</span></div>`).join("")}
      <div style="display:flex;justify-content:space-between;font-weight:700;font-size:11px;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.04)">
        <span>Tổng</span><span style="color:var(--green)">${fmt(order.total)}</span>
      </div>
    </div>
    ${buttons ? `<div class="oc-foot">${buttons}</div>` : ""}
  </div>`;
};

const renderWaiterHistory = () => {
  const list = document.getElementById("waiter-hist-list");
  if (!list) return;
  const todayAttendance = state.attendanceLog?.[todayKey()] || {};
  const key = state.currentUser?.user || state.currentUser?.id;
  const attendance = todayAttendance[key];

  list.innerHTML = `<div class="salary-card">
    <div class="salary-name">Ca hôm nay — ${new Date().toLocaleDateString("vi-VN")}</div>
    <div class="salary-row"><span>Giờ vào ca</span><span>${attendance?.in || "—"}</span></div>
    <div class="salary-row"><span>Giờ ra ca</span><span>${attendance?.out || "Chưa ra"}</span></div>
    <div class="salary-row"><span>Trạng thái</span><span class="badge ${attendance?.in ? (attendance.out ? "badge-green" : "badge-orange") : "badge-red"}">${attendance?.in ? (attendance.out ? "Hoàn thành" : "Đang làm") : "Chưa vào ca"}</span></div>
  </div>`;
};

const renderKitchen = () => {
  const grid = document.getElementById("kitchen-grid");
  if (!grid) return;
  const orders = Object.values(state.activeOrders)
    .filter((order) => ["pending", "confirmed", "cooking"].includes(order.status))
    .sort((a, b) => a.ts - b.ts);
  if (!orders.length) {
    grid.innerHTML = '<div class="no-content"><div class="ico">🍳</div><div>Không có món cần nấu</div></div>';
    return;
  }

  grid.innerHTML = orders
    .map((order) => {
      const cooking = order.status === "cooking";
      return `<div class="kitchen-card ${cooking ? "cooking" : ""}">
        <div class="kc-hdr ${cooking ? "cooking-bg" : ""}">
          <div class="kc-tbl ${cooking ? "cooking-text" : ""}">📍 ${order.table}</div>
          <span class="oc-status ${cooking ? "s-cooking" : "s-pending"}">${cooking ? "🍳 Đang nấu" : "⏳ Chờ nấu"}</span>
        </div>
        <div class="oc-items">
          ${order.items.map((item) => `<div class="oi-row"><span>${item.emoji} ${item.name} <span class="qbadge">×${item.qty}</span></span></div>`).join("")}
        </div>
        <div class="oc-foot">
          ${order.status === "confirmed" ? `<button class="btn-s purple" onclick="W.updateStatus('${order.fbKey}','cooking')">🍳 Bắt đầu nấu</button>` : ""}
          ${order.status === "cooking" ? `<button class="btn-s green" onclick="W.updateStatus('${order.fbKey}','ready')">✅ Xong — Ra đĩa</button>` : ""}
        </div>
      </div>`;
    })
    .join("");
};

const renderCashier = () => {
  const grid = document.getElementById("cashier-grid");
  if (!grid) return;
  const orders = Object.values(state.activeOrders)
    .filter((order) => order.status === "waiting_pay")
    .sort((a, b) => a.ts - b.ts);
  if (!orders.length) {
    grid.innerHTML = '<div class="no-content"><div class="ico">✅</div><div>Không có đơn chờ thanh toán</div></div>';
    return;
  }

  grid.innerHTML = orders
    .map(
      (order) => `<div class="pay-card">
    <div class="pc-hdr">
      <div class="pc-tbl">📍 ${order.table}</div>
      <div class="pc-total">${fmt(order.total)}</div>
    </div>
    <div class="pc-items">
      ${order.items.map((item) => `<div class="oi-row"><span>${item.emoji} ${item.name} ×${item.qty}</span><span style="color:var(--gold)">${fmt(item.price * item.qty)}</span></div>`).join("")}
    </div>
    <div class="pc-foot"><button class="btn-pay" onclick="W.openCashout('${order.fbKey}')">💳 Thu tiền</button></div>
  </div>`,
    )
    .join("");
};

const renderCashierPaid = () => {
  const list = document.getElementById("cashier-paid-list");
  const revenue = document.getElementById("cashier-rev");
  if (!list || !revenue) return;

  const totalRevenue = state.salesHistory.reduce((sum, order) => sum + order.total, 0);
  revenue.textContent = fmt(totalRevenue);
  list.innerHTML =
    state.salesHistory
      .slice(0, 20)
      .map(
        (order) => `<div class="recent-row" style="margin-bottom:5px">
      <span class="r-tbl">📍 ${order.table}</span>
      <span style="color:var(--mid);font-size:10px">${order.payMethod || "Tiền mặt"}</span>
      <span class="r-amt">${fmt(order.total)}</span>
      <span class="r-time">${order.completedAt || order.time}</span>
    </div>`,
      )
      .join("") || '<div style="color:var(--mid);font-size:12px">Chưa có giao dịch</div>';
};

const renderEmpTable = () => {
  const wrap = document.getElementById("emp-table-wrap");
  if (!wrap) return;
  if (!state.employees.length) {
    wrap.innerHTML = '<div style="color:var(--mid);font-size:12px">Chưa có nhân viên</div>';
    return;
  }

  wrap.innerHTML = `<table class="emp-table">
    <thead><tr><th>Họ tên</th><th>Vị trí</th><th>Tài khoản</th><th>Lương/giờ</th><th>Thao tác</th></tr></thead>
    <tbody>
      ${state.employees
        .map(
          (employee) => `<tr>
        <td>${employee.name}</td>
        <td><span class="badge badge-blue">${ROLE_NAMES[employee.role] || employee.role}</span></td>
        <td style="color:var(--mid)">${employee.user || "—"}</td>
        <td style="color:var(--gold)">${fmt(employee.wage || 0)}/h</td>
        <td><button class="btn-sm edit" onclick="W.editEmp('${employee.id}')">Sửa</button> <button class="btn-sm del" onclick="W.delEmp('${employee.id}')">Xóa</button></td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>`;
};

const renderSchedule = () => {
  const grid = document.getElementById("schedule-grid");
  if (!grid) return;
  grid.innerHTML = DAYS.map(
    (day, index) => `
    <div class="sched-day">
      <div class="sched-day-name">${day}</div>
      ${(state.schedule[index] || [])
        .map((shift) => {
          const employee = state.employees.find((item) => item.id === shift.emp) || { name: shift.emp };
          const isMorning =
            shift.shift.includes("Sáng") || shift.shift.includes("7") || shift.shift.includes("8");
          return `<div class="sched-shift ${isMorning ? "ss-morning" : "ss-evening"}" title="${employee.name}">${employee.name.split(" ").pop()}<br><span style="font-size:9px">${shift.shift}</span></div>`;
        })
        .join("")}
    </div>`,
  ).join("");
};

const renderAttendanceList = () => {
  const list = document.getElementById("attend-list");
  if (!list) return;
  if (!state.employees.length) {
    list.innerHTML = '<div style="color:var(--mid);font-size:12px">Chưa có nhân viên</div>';
    return;
  }

  const attendance = state.attendanceLog?.[todayKey()] || {};
  list.innerHTML = state.employees
    .map((employee) => {
      const uid = employee.user || employee.id;
      const item = attendance[uid];
      let statusBadge = '<span class="badge badge-red">Vắng / Chưa vào</span>';
      if (item?.in) {
        const [hours, minutes] = item.in.split(":").map(Number);
        const totalMinutes = hours * 60 + minutes;
        const late =
          totalMinutes > 8 * 60 + 15
            ? `<span class="badge badge-orange" style="margin-left:4px">Muộn ${hours}:${String(minutes).padStart(2, "0")}</span>`
            : "";
        statusBadge = `<span class="badge badge-green">${item.out ? "Đã về" : "Đang làm"}</span>${late}`;
      }

      return `<div class="att-row">
      <div class="att-name">${employee.name} <span class="badge badge-blue" style="font-size:9px">${ROLE_NAMES[employee.role]}</span></div>
      <div class="att-times">${item?.in ? `Vào: ${item.in}` : ""} ${item?.out ? `| Ra: ${item.out}` : ""}</div>
      ${statusBadge}
    </div>`;
    })
    .join("");
};

const calcSalary = () => {
  const list = document.getElementById("salary-list");
  if (!list) return;
  if (!state.employees.length) {
    list.innerHTML = '<div style="color:var(--mid);font-size:12px">Chưa có nhân viên</div>';
    return;
  }

  list.innerHTML = state.employees
    .map((employee) => {
      let totalHours = 0;
      let totalDays = 0;
      let absences = 0;

      Object.values(state.attendanceLog || {}).forEach((dayAttendance) => {
        const uid = employee.user || employee.id;
        const attendance = dayAttendance[uid];
        if (attendance?.in && attendance?.out) {
          const [inHours, inMinutes] = attendance.in.split(":").map(Number);
          const [outHours, outMinutes] = attendance.out.split(":").map(Number);
          totalHours += Math.max(0, (outHours * 60 + outMinutes - inHours * 60 - inMinutes) / 60);
          totalDays += 1;
        } else if (attendance?.in) {
          totalHours += 8;
          totalDays += 1;
        } else {
          absences += 1;
        }
      });

      const salary = Math.round(totalHours * (employee.wage || 30000));
      return `<div class="salary-card">
      <div class="salary-name">${employee.name} <span class="badge badge-blue" style="font-size:9px">${ROLE_NAMES[employee.role]}</span></div>
      <div class="salary-row"><span>Số ngày làm</span><span>${totalDays} ngày</span></div>
      <div class="salary-row"><span>Tổng giờ làm</span><span>${totalHours.toFixed(1)} giờ</span></div>
      <div class="salary-row"><span>Lương/giờ</span><span>${fmt(employee.wage || 0)}</span></div>
      ${absences > 0 ? `<div class="salary-row"><span>Số ngày vắng</span><span class="badge badge-red">${absences} ngày</span></div>` : ""}
      <div class="salary-total"><span>Lương tháng (ước tính)</span><span>${fmt(salary)}</span></div>
    </div>`;
    })
    .join("");
};

const renderManagerOrders = () => {
  const grid = document.getElementById("manager-orders-grid");
  if (!grid) return;
  const orders = Object.values(state.activeOrders).sort((a, b) => a.ts - b.ts);
  if (!orders.length) {
    grid.innerHTML = '<div class="no-content"><div class="ico">📋</div><div>Không có đơn nào</div></div>';
    return;
  }
  grid.innerHTML = orders.map((order) => orderCardHTML(order, "manager")).join("");
};

const renderOwnerDash = () => {
  const stats = document.getElementById("stats-grid");
  const topList = document.getElementById("top-list");
  const recentList = document.getElementById("recent-list");
  if (!stats || !topList || !recentList) return;

  const revenue = state.salesHistory.reduce((sum, order) => sum + order.total, 0);
  stats.innerHTML = `
    <div class="stat-card"><div class="stat-icon">💰</div><div class="stat-val">${fmt(revenue)}</div><div class="stat-lbl">Doanh thu hôm nay</div></div>
    <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-val">${state.salesHistory.length}</div><div class="stat-lbl">Đơn hoàn thành</div></div>
    <div class="stat-card"><div class="stat-icon">🔥</div><div class="stat-val">${Object.values(state.activeOrders).length}</div><div class="stat-lbl">Đơn đang xử lý</div></div>
    <div class="stat-card"><div class="stat-icon">👥</div><div class="stat-val">${state.employees.length}</div><div class="stat-lbl">Nhân viên</div></div>`;

  const topItems = [...state.menuItems]
    .filter((item) => item.soldCount > 0)
    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
    .slice(0, 5);
  const maxSold = topItems[0]?.soldCount || 1;

  topList.innerHTML =
    topItems.length === 0
      ? '<div style="color:var(--mid);font-size:12px">Chưa có dữ liệu</div>'
      : topItems
          .map(
            (item) => `<div class="top-row"><div class="top-e">${item.emoji}</div><div class="top-info"><div class="top-name">${item.name}</div><div class="bar-wrap"><div class="bar-fill" style="width:${(item.soldCount / maxSold) * 100}%"></div></div></div><div class="top-cnt">${item.soldCount}</div></div>`,
          )
          .join("");

  recentList.innerHTML =
    state.salesHistory.length === 0
      ? '<div style="color:var(--mid);font-size:12px">Chưa có đơn</div>'
      : state.salesHistory
          .slice(0, 8)
          .map(
            (order) => `<div class="recent-row"><span class="r-tbl">📍 ${order.table}</span><span class="r-amt">${fmt(order.total)}</span><span class="r-time">${order.completedAt || order.time}</span></div>`,
          )
          .join("");
};

const renderOwnerMenu = () => {
  const grid = document.getElementById("mm-grid");
  if (!grid) return;
  grid.innerHTML = state.menuItems
    .map(
      (item) => `<div class="mm-card">
    <div class="mm-e"><img class="mm-photo" src="${getMenuImage(item)}" alt="${item.name}" loading="lazy" onerror="this.onerror=null;this.src='${MENU_IMG_FALLBACK}'" /></div>
    <div class="mm-info"><div class="mm-name">${item.name}</div><div class="mm-sub">${item.cat} · ${fmt(item.price)}</div><div class="mm-sold">Bán: ${item.soldCount || 0}</div></div>
    <div class="mm-acts">
      <button class="btn-av ${item.avail ? "on" : "off"}" onclick="W.togAvail('${item.id}')">${item.avail ? "✓ Còn" : "✗ Hết"}</button>
      <button class="btn-del" onclick="W.delItem('${item.id}')">Xóa</button>
    </div>
  </div>`,
    )
    .join("");
};

const renderOwnerStaff = () => {
  const wrap = document.getElementById("owner-emp-wrap");
  const salaryList = document.getElementById("owner-salary-list");
  if (!wrap || !salaryList) return;

  wrap.innerHTML = `<table class="emp-table">
    <thead><tr><th>Họ tên</th><th>Vị trí</th><th>Lương/giờ</th></tr></thead>
    <tbody>${state.employees.map((employee) => `<tr><td>${employee.name}</td><td><span class="badge badge-blue">${ROLE_NAMES[employee.role] || employee.role}</span></td><td style="color:var(--gold)">${fmt(employee.wage || 0)}/h</td></tr>`).join("")}</tbody>
  </table>`;

  salaryList.innerHTML =
    state.employees
      .map((employee) => {
        const salary = employee.wage * 8 * 26;
        return `<div class="recent-row"><span class="r-tbl">${employee.name}</span><span style="color:var(--blue);font-size:10px">${ROLE_NAMES[employee.role]}</span><span class="r-amt">${fmt(salary)}/tháng</span></div>`;
      })
      .join("") || '<div style="color:var(--mid);font-size:12px">Chưa có nhân viên</div>';
};

const checkIn = async () => {
  const td = todayKey();
  const uid = state.currentUser?.user || state.currentUser?.id;
  const attendance = state.attendanceLog?.[td]?.[uid];
  if (attendance?.in) {
    toast("Đã vào ca rồi!", "e");
    return;
  }

  const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  const payload = { in: now, name: state.currentUser.name, role: state.role };
  if (state.FB) {
    await set(ref(state.DB, `attendance/${td}/${uid}`), payload);
  } else {
    if (!state.attendanceLog[td]) state.attendanceLog[td] = {};
    state.attendanceLog[td][uid] = payload;
    persistLocalData();
  }

  toast(`✅ Vào ca lúc ${now}!`, "s");
  refreshDashboardRole();
};

const checkOut = async () => {
  const td = todayKey();
  const uid = state.currentUser?.user || state.currentUser?.id;
  const attendance = state.attendanceLog?.[td]?.[uid];
  if (!attendance?.in) {
    toast("Chưa vào ca!", "e");
    return;
  }
  if (attendance.out) {
    toast("Đã ra ca rồi!", "e");
    return;
  }

  const now = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  if (state.FB) {
    await update(ref(state.DB, `attendance/${td}/${uid}`), { out: now });
  } else {
    state.attendanceLog[td][uid].out = now;
    persistLocalData();
  }

  toast(`🚪 Ra ca lúc ${now}!`, "s");
  refreshDashboardRole();
};

const updateStatus = async (key, status) => {
  if (state.FB) {
    await update(ref(state.DB, `orders/${key}`), { status });
  } else if (state.activeOrders[key]) {
    state.activeOrders[key].status = status;
    persistLocalData();
  }

  const messages = {
    confirmed: "✅ Đã xác nhận đơn",
    cooking: "🍳 Bắt đầu nấu!",
    ready: "✅ Món đã xong bếp!",
    serving: "🚀 Đang mang ra bàn!",
  };
  toast(messages[status] || "Cập nhật thành công", "s");
  refreshDashboardRole();
};

const requestPay = async (key) => {
  if (state.FB) {
    await update(ref(state.DB, `orders/${key}`), { status: "waiting_pay" });
  } else if (state.activeOrders[key]) {
    state.activeOrders[key].status = "waiting_pay";
    persistLocalData();
  }
  toast("💳 Đã thông báo thu ngân!", "s");
  refreshDashboardRole();
};

const openCashout = (key) => {
  state.cashoutOrderKey = key;
  const order = state.activeOrders[key];
  if (!order) return;

  const summary = document.getElementById("cashout-sum");
  if (!summary) return;
  summary.innerHTML = `
    <div style="font-weight:700;margin-bottom:8px">📍 ${order.table}</div>
    ${order.items.map((item) => `<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0"><span>${item.emoji} ${item.name} ×${item.qty}</span><span style="color:var(--gold)">${fmt(item.price * item.qty)}</span></div>`).join("")}
    <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:700;border-top:1px solid rgba(201,168,76,.2);margin-top:10px;padding-top:10px">
      <span>Tổng cộng</span><span style="color:var(--green)">${fmt(order.total)}</span>
    </div>`;
  document.getElementById("cashout-modal")?.classList.add("active");
};

const confirmPay = async () => {
  const key = state.cashoutOrderKey;
  if (!key) return;
  const order = state.activeOrders[key];
  if (!order) return;

  const method = document.getElementById("pay-method")?.value || "Tiền mặt";
  const sale = {
    ...order,
    completedAt: new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    ts: Date.now(),
    payMethod: method,
  };

  if (state.FB) {
    const saleKey = push(ref(state.DB, "sales")).key;
    await set(ref(state.DB, `sales/${saleKey}`), sale);

    const updates = {};
    for (const item of order.items) {
      const snapshot = await get(ref(state.DB, `menu/${item.id}`));
      if (snapshot.exists()) {
        updates[`menu/${item.id}/soldCount`] = (snapshot.val().soldCount || 0) + item.qty;
      }
    }
    if (Object.keys(updates).length) {
      await update(ref(state.DB), updates);
    }
    await remove(ref(state.DB, `orders/${key}`));
  } else {
    order.items.forEach((item) => {
      const menuItem = state.menuItems.find((entry) => entry.id === item.id);
      if (menuItem) menuItem.soldCount = (menuItem.soldCount || 0) + item.qty;
    });
    state.salesHistory.unshift(sale);
    delete state.activeOrders[key];
    persistLocalData();
  }

  closeMod("cashout-modal");
  state.cashoutOrderKey = null;
  toast(`✅ Đã thu tiền ${fmt(order.total)} — ${method}`, "s");
  refreshDashboardRole();
};

const openAddEmp = () => {
  document.getElementById("add-emp-modal")?.classList.add("active");
};

const addEmployee = async () => {
  const name = document.getElementById("e-name")?.value.trim();
  const role = document.getElementById("e-role")?.value;
  const user = document.getElementById("e-user")?.value.trim();
  const pass = document.getElementById("e-pass")?.value.trim() || "1234";
  const wage = parseInt(document.getElementById("e-wage")?.value || "30000", 10);

  if (!name || !user || !role) {
    toast("⚠️ Điền đầy đủ thông tin!", "e");
    return;
  }

  const employee = { name, role, user, pass, wage };
  if (state.FB) {
    const employeeRef = push(ref(state.DB, "employees"));
    await set(employeeRef, { ...employee, id: employeeRef.key });
  } else {
    employee.id = `e${Date.now()}`;
    state.employees.push(employee);
    persistLocalData();
  }

  closeMod("add-emp-modal");
  ["e-name", "e-user", "e-pass", "e-wage"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.value = "";
  });
  toast(`✅ Đã thêm "${name}"!`, "s");
  refreshDashboardRole();
};

const editEmp = (id) => {
  const employee = state.employees.find((item) => item.id === id);
  if (!employee) return;
  const editId = document.getElementById("edit-emp-id");
  const editName = document.getElementById("edit-e-name");
  const editRole = document.getElementById("edit-e-role");
  const editWage = document.getElementById("edit-e-wage");
  if (editId) editId.value = id;
  if (editName) editName.value = employee.name;
  if (editRole) editRole.value = employee.role;
  if (editWage) editWage.value = employee.wage || 30000;
  document.getElementById("edit-emp-modal")?.classList.add("active");
};

const saveEmployee = async () => {
  const id = document.getElementById("edit-emp-id")?.value;
  if (!id) return;

  const updates = {
    name: document.getElementById("edit-e-name")?.value.trim(),
    role: document.getElementById("edit-e-role")?.value,
    wage: parseInt(document.getElementById("edit-e-wage")?.value || "30000", 10),
  };

  if (state.FB) {
    await update(ref(state.DB, `employees/${id}`), updates);
  } else {
    const employee = state.employees.find((item) => item.id === id);
    if (employee) Object.assign(employee, updates);
    persistLocalData();
  }

  closeMod("edit-emp-modal");
  toast("✅ Đã cập nhật nhân viên!", "s");
  refreshDashboardRole();
};

const delEmp = async (id) => {
  const employee = state.employees.find((item) => item.id === id);
  if (!employee) return;

  if (state.FB) {
    await remove(ref(state.DB, `employees/${id}`));
  } else {
    state.employees = state.employees.filter((item) => item.id !== id);
    persistLocalData();
  }

  toast(`🗑️ Đã xóa "${employee.name}"!`, "s");
  refreshDashboardRole();
};

const openEditSchedule = () => {
  toast("Tính năng chỉnh sửa ca: click vào ca trong bảng để thay đổi", "s");
};

const openAddItem = () => {
  document.getElementById("add-item-modal")?.classList.add("active");
};

const addMenuItem = async () => {
  const name = document.getElementById("n-name")?.value.trim();
  const cat = document.getElementById("n-cat")?.value;
  const price = parseInt(document.getElementById("n-price")?.value || "0", 10);
  const desc = document.getElementById("n-desc")?.value.trim() || "Món ngon";
  const img = document.getElementById("n-img")?.value.trim() || "";

  if (!name || !price || price <= 0 || !cat) {
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

  if (state.FB) {
    const itemRef = push(ref(state.DB, "menu"));
    await set(itemRef, { ...item, id: itemRef.key });
  } else {
    item.id = `m${Date.now()}`;
    state.menuItems.push(item);
    persistLocalData();
  }

  closeMod("add-item-modal");
  ["n-name", "n-price", "n-desc", "n-img"].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.value = "";
  });
  toast(`✅ Đã thêm "${name}"!`, "s");
  refreshDashboardRole();
};

const togAvail = async (id) => {
  const item = state.menuItems.find((entry) => entry.id === id);
  if (!item) return;
  const nextValue = !item.avail;

  if (state.FB) {
    await update(ref(state.DB, `menu/${id}`), { avail: nextValue });
  } else {
    item.avail = nextValue;
    persistLocalData();
  }

  toast(`${nextValue ? "✅" : "🚫"} ${item.name} ${nextValue ? "đã mở" : "đã tắt"}`, "s");
  refreshDashboardRole();
};

const delItem = async (id) => {
  const item = state.menuItems.find((entry) => entry.id === id);
  if (!item) return;

  if (state.FB) {
    await remove(ref(state.DB, `menu/${id}`));
  } else {
    state.menuItems = state.menuItems.filter((entry) => entry.id !== id);
    persistLocalData();
  }

  toast(`🗑️ Đã xóa "${item.name}"`, "s");
  refreshDashboardRole();
};

const refreshDashboardRole = () => {
  if (state.role === "waiter") {
    renderAttendanceBar("waiter");
    renderWaiterOrders();
    renderWaiterHistory();
  }
  if (state.role === "kitchen") {
    renderAttendanceBar("kitchen");
    renderKitchen();
  }
  if (state.role === "cashier") {
    renderAttendanceBar("cashier");
    renderCashier();
    renderCashierPaid();
  }
  if (state.role === "manager") {
    renderAttendanceBar("manager");
    renderEmpTable();
    renderSchedule();
    renderAttendanceList();
    calcSalary();
    renderManagerOrders();
  }
  if (state.role === "owner") {
    renderOwnerDash();
    renderOwnerMenu();
    renderOwnerStaff();
  }
};

const bootDashboardPage = async () => {
  await bootstrapData({ fallbackToLocal: true });
  const session = loadAuthSession();
  if (!session?.role || !session?.currentUser || session.role === "customer") {
    window.location.href = "index.html";
    return;
  }
  setRole(session.role);
  setCurrentUser(session.currentUser);
  enterApp();
};

registerRoleHandler("waiter", { show: refreshDashboardRole, refresh: refreshDashboardRole });
registerRoleHandler("kitchen", { show: refreshDashboardRole, refresh: refreshDashboardRole });
registerRoleHandler("cashier", { show: refreshDashboardRole, refresh: refreshDashboardRole });
registerRoleHandler("manager", { show: refreshDashboardRole, refresh: refreshDashboardRole });
registerRoleHandler("owner", { show: refreshDashboardRole, refresh: refreshDashboardRole });

registerTabHandler("waiter", "history", renderWaiterHistory);
registerTabHandler("manager", "orders", renderManagerOrders);
registerTabHandler("owner", "staff", renderOwnerStaff);

registerActions({
  addEmployee,
  addMenuItem,
  calcSalary,
  checkIn,
  checkOut,
  confirmPay,
  delEmp,
  delItem,
  editEmp,
  openAddEmp,
  openAddItem,
  openCashout,
  openEditSchedule,
  renderWaiterHistory,
  requestPay,
  saveEmployee,
  togAvail,
  updateStatus,
});

bootDashboardPage();
