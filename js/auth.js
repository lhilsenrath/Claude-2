/* ============================================================
   WhatsUp — accounts & sessions (prototype)

   Accounts persist in this browser's localStorage. That means
   the app "remembers" you across visits on the same device.
   True multi-device / multi-user accounts need a backend
   (planned for the next milestone).
   ============================================================ */

const Auth = {
  USERS_KEY: "whatsup_users",
  SESSION_KEY: "whatsup_session",

  loadUsers() {
    try { return JSON.parse(localStorage.getItem(this.USERS_KEY)) || []; }
    catch { return []; }
  },

  saveUsers(users) {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  },

  // Demo-grade only — NOT real password security. A real launch
  // moves auth to a backend (bcrypt + sessions) entirely.
  hash(pw) {
    let h = 0;
    const salted = "whatsup:" + pw;
    for (let i = 0; i < salted.length; i++) {
      h = (Math.imul(31, h) + salted.charCodeAt(i)) | 0;
    }
    return "h" + (h >>> 0).toString(36);
  },

  currentUser() {
    const email = localStorage.getItem(this.SESSION_KEY);
    if (!email) return null;
    return this.loadUsers().find((u) => u.email === email) || null;
  },

  signUp({ name, email, password, headline, openTo }) {
    const users = this.loadUsers();
    email = email.trim().toLowerCase();
    name = name.trim();
    if (!name) return { error: "Tell us your name — it goes on your pin." };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "That email doesn't look right." };
    if (password.length < 6) return { error: "Password needs at least 6 characters." };
    if (users.some((u) => u.email === email)) return { error: "An account with that email already exists — try signing in." };

    const paletteNames = Object.keys(PALETTES);
    const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    const user = {
      name,
      email,
      pw: this.hash(password),
      initials,
      palette: paletteNames[Math.abs([...email].reduce((a, c) => a + c.charCodeAt(0), 0)) % paletteNames.length],
      headline: (headline || "").trim() || "New on WhatsUp 👋",
      openTo: openTo.length ? openTo : ["Friends"],
      createdAt: Date.now(),
    };
    users.push(user);
    this.saveUsers(users);
    localStorage.setItem(this.SESSION_KEY, email);
    return { user };
  },

  signIn(email, password) {
    email = email.trim().toLowerCase();
    const user = this.loadUsers().find((u) => u.email === email);
    if (!user || user.pw !== this.hash(password)) return { error: "Wrong email or password." };
    localStorage.setItem(this.SESSION_KEY, email);
    return { user };
  },

  signOut() {
    localStorage.removeItem(this.SESSION_KEY);
  },

  updateProfile(patch) {
    const email = localStorage.getItem(this.SESSION_KEY);
    const users = this.loadUsers();
    const u = users.find((x) => x.email === email);
    if (!u) return;
    Object.assign(u, patch);
    this.saveUsers(users);
  },
};
