window.doLogin = async () => {
    const u = document.getElementById('u').value.trim();
    const p = document.getElementById('p').value.trim();
    const err = document.getElementById('lerr');

    const res = await API.login(u, p);

    if (!res.success) {
        err.style.display = 'block';
        return;
    }

    // store token and user
    localStorage.setItem('token', res.data.token);
    sessionStorage.setItem('user', JSON.stringify(res.data.user));

    // switch page acording to role
    const role = res.data.user.role;
    if (role === 'customer') {
        window.location.href = 'menu.html';
    } else {
        window.location.href = 'dashboard.html';
    }
};

window.doLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('user');
    window.location.href = 'index.html';
};

window.guestLogin = () => {
    window.location.href = 'menu.html';
};

// get user
window.getCurrentUser = () => {
    try {
        return JSON.parse(sessionStorage.getItem('user'));
    } catch {
        return null;
    }
};

// check registration
window.requireAuth = () => {
    const user = getCurrentUser();
    if (!user) window.location.href = 'index.html';
    return user;
};
