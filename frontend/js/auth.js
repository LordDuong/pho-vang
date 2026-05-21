// Biến lưu trữ vai trò đang chọn (Mặc định ban đầu cấu hình là manager để khớp tài khoản quản lý)
let currentRole = 'manager';

// ═══ 1. BỔ SUNG HÀM CHỌN VAI TRÒ (Sửa lỗi không click được các nút vai trò) ═══
window.selRole = (role) => {
    currentRole = role;
    
    // Gỡ bỏ trạng thái active cũ trên tất cả các nút tab vai trò
    document.querySelectorAll('.role-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Thêm trạng thái active làm sáng nút vừa được click
    const activeTab = document.getElementById(`tab-${role}`);
    if (activeTab) {
        activeTab.classList.add('active');
    }

    // Xử lý ẩn/hiện trường nhập liệu chuyên biệt cho Khách (Customer)
    const btnGuest = document.getElementById('btn-guest');
    const loginFields = document.getElementById('login-fields');
    
    if (role === 'customer') {
        if (btnGuest) btnGuest.style.display = 'block';
        if (loginFields) loginFields.style.display = 'none';
    } else {
        if (btnGuest) btnGuest.style.display = 'none';
        if (loginFields) loginFields.style.display = 'block';
    }
};

// ═══ 2. HÀM XỬ LÝ ĐĂNG NHẬP (Giữ nguyên logic gốc của bạn + bọc bẫy lỗi kết nối) ═══
window.doLogin = async () => {
    const u = document.getElementById('u').value.trim();
    const p = document.getElementById('p').value.trim();
    const err = document.getElementById('lerr');

    if (err) err.style.display = 'none';

    if (!u || !p) {
        alert("Vui lòng nhập tài khoản và mật khẩu!");
        return;
    }

    // Kiểm tra xem file api.js đã được tải thành công chưa
    if (!window.API) {
        console.error("Lỗi: Biến API chưa được khởi tạo. Hãy kiểm tra lại thứ tự nhúng file script.");
        alert("Hệ thống đang gặp lỗi nạp thư viện kết nối API!");
        return;
    }

    try {
        // Gọi hàm login từ file api.js gốc của bạn
        const res = await window.API.login(u, p);

        if (!res || !res.success) {
            if (err) err.style.display = 'block';
            return;
        }

        // Lưu trữ Token và User vào bộ nhớ trình duyệt giống code gốc
        localStorage.setItem('token', res.data.token);
        sessionStorage.setItem('user', JSON.stringify(res.data.user));

        // Điều hướng trang tự động theo quyền đọc từ MySQL DB
        const role = res.data.user.role;
        if (role === 'customer') {
            window.location.href = 'menu.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    } catch (e) {
        console.error("Lỗi kết nối Server Go:", e);
        alert("Không thể kết nối đến Server Backend Go! Bạn hãy chắc chắn đã chạy lệnh 'go run main.go' ở port 8080.");
    }
};

// ═══ 3. CÁC HÀM HỆ THỐNG KHÁC (Giữ nguyên hoàn toàn bản gốc của bạn) ═══
window.doLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = 'index.html';
};

window.guestLogin = () => {
    window.location.href = 'menu.html';
};

window.getCurrentUser = () => {
    try {
        return JSON.parse(sessionStorage.getItem('user'));
    } catch {
        return null;
    }
};

window.requireAuth = () => {
    const user = window.getCurrentUser();
    if (!user) window.location.href = 'index.html';
    return user;
};

// Tự động kích hoạt tab vai trò Quản lý làm mặc định ngay khi vừa mở trang
document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.selRole === 'function') {
        window.selRole('manager');
    }
});