const BASE_URL = 'http://localhost:8080';

const getToken = () => localStorage.getItem('token');

const headers = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
});

const API = {

    // Auth
    login: (username, password) =>
        fetch(`${BASE_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        }).then(r => r.json()),

    // Menu
    getMenu: () =>
        fetch(`${BASE_URL}/api/menu`)
        .then(r => r.json()),

    addMenuItem: (item) =>
        fetch(`${BASE_URL}/api/menu`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(item)
        }).then(r => r.json()),

    deleteMenuItem: (id) =>
        fetch(`${BASE_URL}/api/menu/${id}`, {
            method: 'DELETE',
            headers: headers()
        }).then(r => r.json()),

    updateMenuItem: (id, data) =>
        fetch(`${BASE_URL}/api/menu/${id}`, {
            method: 'PATCH',
            headers: headers(),
            body: JSON.stringify(data)
        }).then(r => r.json()),

    // Orders
    placeOrder: (order) =>
        fetch(`${BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        }).then(r => r.json()),

    updateOrderStatus: (id, status) =>
        fetch(`${BASE_URL}/api/orders/${id}/status`, {
            method: 'PATCH',
            headers: headers(),
            body: JSON.stringify({ status })
        }).then(r => r.json()),

    getOrders: (params = '') =>
        fetch(`${BASE_URL}/api/orders${params}`, {
            headers: headers()
        }).then(r => r.json()),

    // Payment
    confirmPayment: (orderId, payMethod) =>
        fetch(`${BASE_URL}/api/sales`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({ order_id: orderId, pay_method: payMethod })
        }).then(r => r.json()),

    // Revenue
    getRevenue: () =>
        fetch(`${BASE_URL}/api/revenue`, {
            headers: headers()
        }).then(r => r.json()),

    // Employees
    getEmployees: () =>
        fetch(`${BASE_URL}/api/employees`, {
            headers: headers()
        }).then(r => r.json()),

    addEmployee: (emp) =>
        fetch(`${BASE_URL}/api/employees`, {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify(emp)
        }).then(r => r.json()),

    updateEmployee: (id, data) =>
        fetch(`${BASE_URL}/api/employees/${id}`, {
            method: 'PATCH',
            headers: headers(),
            body: JSON.stringify(data)
        }).then(r => r.json()),

    deleteEmployee: (id) =>
        fetch(`${BASE_URL}/api/employees/${id}`, {
            method: 'DELETE',
            headers: headers()
        }).then(r => r.json()),

    // Attendance
    checkIn: () =>
        fetch(`${BASE_URL}/api/attendance/checkin`, {
            method: 'POST',
            headers: headers()
        }).then(r => r.json()),

    checkOut: () =>
        fetch(`${BASE_URL}/api/attendance/checkout`, {
            method: 'POST',
            headers: headers()
        }).then(r => r.json()),

    getAttendance: () =>
        fetch(`${BASE_URL}/api/attendance`, {
            headers: headers()
        }).then(r => r.json()),

    // Salary
    getSalary: () =>
        fetch(`${BASE_URL}/api/salary`, {
            headers: headers()
        }).then(r => r.json()),

    // Schedule
    getSchedule: () =>
        fetch(`${BASE_URL}/api/schedule`, {
            headers: headers()
        }).then(r => r.json()),
};

window.API = API;
