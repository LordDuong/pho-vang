const user = requireAuth(); // redirect to Login if not to sign up
connectWS(user.role);

//show view recording to role
showView(user.role);

async function showView(role) {
    const viewMap = {
        waiter:  loadWaiterView,
        kitchen: loadKitchenView,
        cashier: loadCashierView,
        manager: loadManagerView,
        owner:   loadOwnerView,
    };
    await viewMap[role]?.();
}

// Waiter
async function loadWaiterView() {
    const res = await API.getOrders();
    renderOrders(res.data);
}

// Kitchen
async function loadKitchenView() {
    const res = await API.getOrders('?status=confirmed&status=cooking');
    renderKitchen(res.data);
}

// Cashier
async function loadCashierView() {
    const res = await API.getOrders('?status=waiting_pay');
    renderCashier(res.data);
}

// Manager-Caculate salary
async function loadManagerView() {
    const [emps, salary, attendance] = await Promise.all([
        API.getEmployees(),
        API.getSalary(),
        API.getAttendance(),
    ]);
    renderEmployees(emps.data);
    renderSalary(salary.data);      // FE không tính, chỉ render
    renderAttendance(attendance.data);
}

// Owner-Caculate revenue
async function loadOwnerView() {
    const [revenue, menu] = await Promise.all([
        API.getRevenue(),
        API.getMenu(),
    ]);
    renderRevenue(revenue.data);  
    renderOwnerMenu(menu.data);
}

// WebSocket events
window.onNewOrder     = (data) => addOrderCard(data);
window.onOrderUpdated = (data) => updateOrderCard(data);
window.onMenuUpdated  = (data) => loadMenu();
window.onOrderPaid    = (data) => updateRevenue(data);
window.onAttendUpdated= (data) => updateAttendance(data);
