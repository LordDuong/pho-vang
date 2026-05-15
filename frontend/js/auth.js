import {
  BUILTIN_ACCTS,
  bootstrapData,
  clearAuthSession,
  connectFirebase,
  hashPassword,
  enterApp,
  getPageName,
  goToLoginPage,
  loadAuthSession,
  redirectByRole,
  registerActions,
  saveAuthSession,
  setCurrentUser,
  setRole,
  setSelectedRole,
  showLogin,
  state,
  useLocal,
} from "./app.js";

export const selRole = (role) => {
  setSelectedRole(role);
  document.querySelectorAll(".role-tab").forEach((tab) => tab.classList.remove("active"));
  document.getElementById(`tab-${role}`)?.classList.add("active");

  const isCustomer = role === "customer";
  const loginFields = document.getElementById("login-fields");
  const guestButton = document.getElementById("btn-guest");
  if (loginFields) loginFields.style.display = isCustomer ? "none" : "block";
  if (guestButton) guestButton.style.display = isCustomer ? "block" : "none";
};

export const guestLogin = () => {
  setRole("customer");
  setCurrentUser({ name: "Khách vãng lai", role: "customer" });
  saveAuthSession();

  if (getPageName() === "index") {
    redirectByRole(state.role);
    return;
  }

  enterApp();
};

const toSessionUser = (employee) => {
  const { pass, passHash, ...safeEmployee } = employee;
  return safeEmployee;
};

export const doLogin = async () => {
  const username = document.getElementById("u")?.value.trim() || "";
  const password = document.getElementById("p")?.value.trim() || "";
  const err = document.getElementById("lerr");

  const builtin = BUILTIN_ACCTS[username];
  if (builtin && password === builtin.pass) {
    setRole(builtin.role);
    setCurrentUser({ name: builtin.name, role: builtin.role, user: username });
    if (err) err.style.display = "none";
    saveAuthSession();
    redirectByRole(state.role);
    return;
  }

  const passwordHash = await hashPassword(password);
  const employee = state.employees.find(
    (item) =>
      item.user === username &&
      (item.pass === password || item.passHash === passwordHash),
  );
  if (employee && employee.role === state.selectedRole) {
    setRole(employee.role);
    setCurrentUser(toSessionUser(employee));
    if (err) err.style.display = "none";
    saveAuthSession();
    redirectByRole(state.role);
    return;
  }

  if (err) err.style.display = "block";
};

export const doLogout = () => {
  clearAuthSession();
  if (getPageName() !== "index") {
    goToLoginPage();
    return;
  }

  document.getElementById("login-screen")?.classList.add("show");
  document.getElementById("app")?.classList.remove("active");
  const username = document.getElementById("u");
  const password = document.getElementById("p");
  const loginError = document.getElementById("lerr");
  if (username) username.value = "";
  if (password) password.value = "";
  if (loginError) loginError.style.display = "none";
  state.cart = [];
  setCurrentUser(null);
  setRole("customer");
  selRole("customer");
};

const findUserFromSession = (session) => {
  if (session.role === "customer") {
    return { name: "Khách vãng lai", role: "customer" };
  }

  const builtin = BUILTIN_ACCTS[session.userKey];
  if (builtin && builtin.role === session.role) {
    return { name: builtin.name, role: builtin.role, user: session.userKey };
  }

  const employee = state.employees.find(
    (item) => item.user === session.userKey || item.id === session.userKey,
  );
  return employee ? toSessionUser(employee) : null;
};

export const restoreDashboardSession = () => {
  const session = loadAuthSession();
  if (!session?.role || !session?.userKey || session.role === "customer") {
    goToLoginPage();
    return false;
  }
  const user = findUserFromSession(session);
  if (!user) {
    goToLoginPage();
    return false;
  }
  setRole(session.role);
  setCurrentUser(user);
  enterApp();
  return true;
};

const bootIndexPage = async () => {
  await bootstrapData();
  if (state.FB) showLogin(true);
  selRole("customer");
};

registerActions({
  connectFirebase,
  doLogin,
  doLogout,
  guestLogin,
  restoreDashboardSession,
  selRole,
  useLocal,
});

if (getPageName() === "index") {
  bootIndexPage();
}
