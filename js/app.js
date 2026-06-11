/* ============================================================
   WhatsUp — v3 app logic

   Visibility model (the core idea):
   - You can ONLY see strangers within 100 yards. Nobody can
     browse where you are from across town.
   - Friends beyond 100 yds appear only with MUTUAL sharing:
     they share with you AND you share with them.
   - Beacons are deliberate broadcasts: where YOU are, what
     you're doing, who's coming.
   ============================================================ */

const screen = document.getElementById("screen");
const tabbar = document.getElementById("tabbar");

const NEARBY_YDS = 100;

const state = {
  tab: "map",
  view: null,            // null | {type:'profile'|'chat'|'edit'|'beacon', id?}
  mapFilter: "all",
  ghost: false,
  liked: new Set(),
  requested: new Set(),
  joinedBeacons: new Set(),
  settings: { precise: true, classScan: true, quietHours: false },
  pan: { x: 0, y: 0 },
  geo: null,             // {lat, lng} once real location is granted
  shareWith: new Set(),  // friend ids YOU share your location with
  myBeacon: null,        // {text, place, until}
};

/* ---------- storage helpers ---------- */

function loadJSON(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; }
  catch { return fallback; }
}
function saveJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full */ }
}
const shareKey = () => `whatsup_share_${ME.email}`;
const beaconKey = () => `whatsup_beacon_${ME.email}`;

/* ---------- people helpers ---------- */

const byId = (id) => PEOPLE.find((p) => p.id === id) || (id === "me" ? ME : null);
const friends = () => PEOPLE.filter((p) => p.friend);

function distLabel(p) {
  if (p.distanceYds == null) return null;
  return p.distanceYds <= 300 ? `${p.distanceYds} yds` : `${(p.distanceYds / 1760).toFixed(1)} mi`;
}

function isNearby(p) {
  return p.distanceYds != null && p.distanceYds <= NEARBY_YDS;
}

// Mutual sharing: they share with you AND you share with them
function isSharingFriend(p) {
  return p.friend && p.sharesLocation && state.shareWith.has(p.id);
}

// The only two ways someone appears on your map
function canSeeOnMap(p) {
  return isNearby(p) || isSharingFriend(p);
}

function whereLabel(p) {
  if (isNearby(p)) return `${distLabel(p)} away${p.place ? ` · ${p.place}` : ""}`;
  if (isSharingFriend(p)) return `${distLabel(p)} · ${p.place || "Sharing location"}`;
  return "Location private";
}

/* ---------- ui helpers ---------- */

function grad(palette) {
  const [a, b] = PALETTES[palette] || PALETTES.sky;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function avatarHTML(person, size, extraClass = "") {
  const bg = person.photoData
    ? `background-image:url(${person.photoData})`
    : `background-image:${grad(person.palette)}`;
  const label = person.photoData ? "" : person.initials;
  return `<span class="avatar ${extraClass}" style="width:${size}px;height:${size}px;${bg};font-size:${Math.round(size * 0.36)}px">${label}</span>`;
}

function photoBG(photo) {
  if (photo.data) return `background-image:url(${photo.data})`;
  return `background-image:${grad(photo.palette)}`;
}

function irlTag(person) {
  return person.irl ? `<span class="irl-badge">IRL ✓</span>` : "";
}

let toastTimer = null;
function toast(msg) {
  document.querySelectorAll(".toast").forEach((t) => t.remove());
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  document.getElementById("app").appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2600);
}

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

function setTab(tab) {
  state.tab = tab;
  state.view = null;
  render();
}

function openProfile(id) {
  state.view = { type: "profile", id };
  render();
}

function openChat(id) {
  const chat = CHATS.find((c) => c.personId === id);
  if (!chat) CHATS.unshift({ personId: id, unread: false, time: "Now", messages: [] });
  else chat.unread = false;
  state.view = { type: "chat", id };
  render();
}

function closeView() {
  state.view = null;
  render();
}

/* ============================================================
   ACCOUNT — session, profile data, live location
   ============================================================ */

function applyAccount(u) {
  ME.name = u.name;
  ME.initials = u.initials;
  ME.palette = u.palette;
  ME.headline = u.headline || "";
  ME.openTo = u.openTo || ["Friends"];
  ME.email = u.email;
  ME.photoData = u.photoData || null;
  ME.school = u.school || "";
  ME.work = u.work || "";
  ME.hometown = u.hometown || "";
  ME.relationship = u.relationship || "";
  ME.socials = u.socials?.length ? u.socials : ["Instagram", "LinkedIn"];
  ME.prompts = u.prompts?.length
    ? u.prompts
    : [
        { q: "Why I'm here", a: "To meet people in real life, not just online." },
        { q: "Best way to say whats up", a: "Just walk up — I'm new here, say hi!" },
      ];
  ME.photos = (u.photos || []).map((d) => (d ? { data: d } : null)).filter(Boolean);
  ME.stats = {
    connections: friends().length,
    irlMeets: friends().filter((p) => p.irl).length,
    beacons: u.beaconsDropped || 0,
  };

  state.shareWith = new Set(loadJSON(shareKey(), friends().map((p) => p.id)));
  state.myBeacon = loadJSON(beaconKey(), null);
  if (state.myBeacon && state.myBeacon.until < Date.now()) {
    state.myBeacon = null;
    saveJSON(beaconKey(), null);
  }
}

function requestGeo() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const first = !state.geo;
      state.geo = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (first && state.tab === "map" && !state.view) render();
      if (first) toast("Live location on — the map is your real surroundings");
    },
    () => {
      if (state.tab === "map" && !state.view) toast("Location not shared — showing the demo map");
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
  );
}

function enterApp(user, opts = {}) {
  applyAccount(user);
  document.body.classList.add("live");
  tabbar.style.display = "";
  state.tab = "map";
  state.view = null;
  requestGeo();
  render();
  if (!opts.silent) toast(`Welcome, ${user.name.split(" ")[0]} — you're live`);
}

function leaveApp() {
  Auth.signOut();
  document.body.classList.remove("live");
  state.geo = null;
  state.view = null;
  destroyGeoMap();
  showAuth("landing");
}

function showAuth(mode) {
  tabbar.style.display = "none";
  renderAuth(mode);
}

function renderAuth(mode) {
  if (mode === "landing") {
    screen.innerHTML = `
      <div class="auth">
        <div class="auth-inner">
          <img class="logo-mark" src="img/logo.svg" alt="WhatsUp" />
          <div class="auth-logo">whats<span>up</span></div>
          <div class="auth-tag">See who's within 100 yards. Walk up. Say whats up.<br/>Nobody can see you from further away.</div>
          <button class="btn btn-primary" data-auth="signup">Create account</button>
          <button class="btn btn-ghost" data-auth="signin">Sign in</button>
          <div class="auth-note">Prototype: accounts are saved in this browser.<br/>Profiles shown are demo people while we test.</div>
        </div>
      </div>`;
    return;
  }

  if (mode === "signup") {
    screen.innerHTML = `
      <div class="auth">
        <div class="auth-inner">
          <div class="auth-logo">whats<span>up</span></div>
          <h2>Create your account</h2>
          <div class="sub">Your name and vibe go on your map pin. Everything else can wait.</div>
          <form id="auth-form">
            <div class="field"><label>Full name</label><input id="f-name" type="text" placeholder="Jane Harvard" autocomplete="name" /></div>
            <div class="field"><label>Email</label><input id="f-email" type="email" placeholder="you@college.edu" autocomplete="email" /></div>
            <div class="field"><label>Password</label><input id="f-pw" type="password" placeholder="6+ characters" autocomplete="new-password" /></div>
            <div class="field"><label>One-liner (optional)</label><input id="f-headline" type="text" placeholder="Harvard '27 · Econ · Chronic coffee walker" /></div>
            <div class="field">
              <label>I'm open to…</label>
              <div class="chip-select" id="f-open">
                <span class="chip on" data-open="Friends">Friends</span>
                <span class="chip" data-open="Networking">Networking</span>
                <span class="chip" data-open="Dating">Dating</span>
              </div>
            </div>
            <div class="auth-error" id="auth-error"></div>
            <button class="btn btn-primary" type="submit">Create account</button>
          </form>
          <div class="auth-switch">Already have an account? <button data-auth="signin">Sign in</button></div>
        </div>
      </div>`;

    document.getElementById("f-open").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (chip) chip.classList.toggle("on");
    });

    document.getElementById("auth-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const openTo = [...document.querySelectorAll("#f-open .chip.on")].map((c) => c.dataset.open);
      const res = Auth.signUp({
        name: document.getElementById("f-name").value,
        email: document.getElementById("f-email").value,
        password: document.getElementById("f-pw").value,
        headline: document.getElementById("f-headline").value,
        openTo,
      });
      if (res.error) {
        const err = document.getElementById("auth-error");
        err.textContent = res.error;
        err.classList.add("show");
        return;
      }
      enterApp(res.user);
    });
    return;
  }

  screen.innerHTML = `
    <div class="auth">
      <div class="auth-inner">
        <div class="auth-logo">whats<span>up</span></div>
        <h2>Welcome back</h2>
        <div class="sub">The map missed you.</div>
        <form id="auth-form">
          <div class="field"><label>Email</label><input id="f-email" type="email" placeholder="you@college.edu" autocomplete="email" /></div>
          <div class="field"><label>Password</label><input id="f-pw" type="password" placeholder="Your password" autocomplete="current-password" /></div>
          <div class="auth-error" id="auth-error"></div>
          <button class="btn btn-primary" type="submit">Sign in</button>
        </form>
        <div class="auth-switch">New here? <button data-auth="signup">Create an account</button></div>
      </div>
    </div>`;

  document.getElementById("auth-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const res = Auth.signIn(document.getElementById("f-email").value, document.getElementById("f-pw").value);
    if (res.error) {
      const err = document.getElementById("auth-error");
      err.textContent = res.error;
      err.classList.add("show");
      return;
    }
    enterApp(res.user);
  });
}

/* ============================================================
   render root
   ============================================================ */

function render() {
  tabbar.querySelectorAll(".tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === state.tab && !state.view);
  });
  const unread = CHATS.filter((c) => c.unread).length;
  const badge = document.getElementById("msg-badge");
  badge.style.display = unread ? "" : "none";
  badge.textContent = unread;

  if (state.tab !== "map" || state.view) destroyGeoMap();

  screen.classList.remove("fade-in");
  void screen.offsetWidth;

  const v = state.view;
  if (v?.type === "profile") renderProfile(v.id);
  else if (v?.type === "chat") renderChat(v.id);
  else if (v?.type === "edit") renderEditProfile();
  else if (v?.type === "beacon") renderBeaconComposer();
  else if (state.tab === "home") renderHome();
  else if (state.tab === "messages") renderMessages();
  else if (state.tab === "map") renderMap();
  else if (state.tab === "explore") renderExplore();
  else if (state.tab === "me") renderMe();

  screen.classList.add("fade-in");
  if (v?.type !== "chat") screen.scrollTop = 0;
}

tabbar.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (btn) setTab(btn.dataset.tab);
});

/* ============================================================
   HOME — updates from your people
   ============================================================ */

function renderHome() {
  const nearbyStrangers = PEOPLE.filter((p) => !p.friend && isNearby(p));

  const stories = [
    ...friends().map(
      (p) => `
      <button class="story" data-profile="${p.id}">
        ${avatarHTML(p, 56)}
        <span>${p.name.split(" ")[0]}</span>
      </button>`
    ),
    ...nearbyStrangers.map(
      (p) => `
      <button class="story nearby" data-profile="${p.id}">
        ${avatarHTML(p, 56)}
        <span>${p.name.split(" ")[0]}</span>
        <span class="dist">${distLabel(p)}</span>
      </button>`
    ),
  ].join("");

  const posts = [];
  for (const p of friends()) for (const post of p.posts || []) posts.push({ person: p, post });

  const typeLabel = { work: "WORK", prompt: "PROMPT", photo: "MOMENT" };

  const postCards = posts
    .map(({ person, post }, i) => {
      const key = `${person.id}-${i}`;
      const liked = state.liked.has(key);
      return `
      <article class="post">
        <div class="post-head">
          <button data-profile="${person.id}" style="display:flex">${avatarHTML(person, 40)}</button>
          <button class="who" data-profile="${person.id}" style="text-align:left">
            <div class="name">${person.name} ${irlTag(person)}</div>
            <div class="meta">${person.headline.split("·")[0].trim()} · ${post.time} ago</div>
          </button>
          <span class="post-type ${post.type}">${typeLabel[post.type]}</span>
        </div>
        ${post.promptQ ? `<div class="post-body"><div class="prompt-q">${post.promptQ}</div>“${post.text}”</div>` : `<div class="post-body">${post.text}</div>`}
        ${post.photo ? `<div class="post-photo" style="${photoBG(post.photo)}">${post.photo.caption}</div>` : ""}
        <div class="post-actions">
          <button class="${liked ? "liked" : ""}" data-like="${key}">
            <svg viewBox="0 0 24 24"><path d="M12 20s-7-4.6-9-9c-1.2-2.7.6-6 3.8-6 2 0 3.4 1.1 4.2 2.6h2C13.8 6.1 15.2 5 17.2 5 20.4 5 22.2 8.3 21 11c-2 4.4-9 9-9 9Z"/></svg>
            ${(post.likes || 0) + (liked ? 1 : 0)}
          </button>
          <button data-chat="${person.id}">
            <svg viewBox="0 0 24 24"><path d="M4 5h16v11H9l-5 4V5Z"/></svg> Reply
          </button>
        </div>
      </article>`;
    })
    .join("");

  const maya = byId("maya");
  const nudge = maya
    ? `<div class="nudge">
        <h3>Maya is ${distLabel(maya)} away</h3>
        <p>She's in your Ec 1010b lecture and open to meeting people. You'll only ever see people this close — go say whats up.</p>
        <button class="btn" data-tab-jump="map">See who's nearby</button>
      </div>`
    : "";

  screen.innerHTML = `
    <div class="page-col">
      <header class="topbar">
        <div class="wordmark"><img class="wordmark-logo" src="img/logo.svg" alt=""/>whats<span>up</span></div>
        <button class="icon-btn" data-tab-jump="explore" title="Search">
          <svg viewBox="0 0 24 24"><path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm8.7 13.3-3.4-3.4 1.4-1.4 3.4 3.4a1 1 0 0 1-1.4 1.4Z"/></svg>
        </button>
      </header>

      <div class="story-row">${stories}</div>

      <div class="feed">
        ${postCards}
        ${nudge}
        <p class="empty-note">That's everything from your people today.<br/>Now go say whats up to one of them.</p>
      </div>
    </div>
  `;

  const feed = screen.querySelector(".feed");
  const firstPost = feed.querySelector(".post");
  const nudgeEl = feed.querySelector(".nudge");
  if (firstPost && nudgeEl) firstPost.after(nudgeEl);
}

/* ============================================================
   MESSAGES
   ============================================================ */

function renderMessages() {
  const nearbyFriends = friends().filter((p) => isNearby(p));

  const rows = CHATS.map((chat) => {
    const p = byId(chat.personId);
    const last = chat.messages[chat.messages.length - 1];
    const preview = last
      ? last.type === "meet"
        ? `📍 ${last.title}`
        : `${last.from === "me" ? "You: " : ""}${last.text}`
      : "Say whats up";
    return `
      <button class="chat-row ${chat.unread ? "unread" : ""}" data-chat="${p.id}">
        <span class="avatar" style="width:52px;height:52px;background-image:${grad(p.palette)};font-size:17px;position:relative">
          ${p.initials}${p.online ? '<span class="online-dot"></span>' : ""}
        </span>
        <span class="chat-mid">
          <span class="chat-name">${p.name} ${irlTag(p)}</span>
          <span class="chat-preview">${preview}</span>
        </span>
        <span class="chat-side">
          <span class="chat-time">${chat.time}</span>
          ${chat.unread ? '<span class="unread-dot"></span>' : ""}
        </span>
      </button>`;
  }).join("");

  screen.innerHTML = `
    <div class="page-col">
      <header class="topbar">
        <h1>Chats</h1>
        <button class="icon-btn" data-tab-jump="explore" title="New chat">
          <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>
        </button>
      </header>

      ${nearbyFriends.length ? `
      <div class="nearby-strip">
        <span class="stack">${nearbyFriends.map((p) => avatarHTML(p, 30)).join("")}</span>
        <span>${nearbyFriends.length === 1 ? `${nearbyFriends[0].name.split(" ")[0]} is` : `${nearbyFriends.length} friends are`} within 100 yds — a chat is good, in person is better.</span>
      </div>` : ""}

      ${rows}
      <p class="empty-note">Chats here are meant to end with a meetup.<br/>Suggest one with the 📍 button inside any conversation.</p>
    </div>
  `;
}

function renderChat(id) {
  const p = byId(id);
  const chat = CHATS.find((c) => c.personId === id);

  const bubbles = chat.messages
    .map((m) => {
      if (m.type === "meet")
        return `
        <div class="meet-card">
          <div class="mc-title">📍 ${m.title}</div>
          <div class="mc-sub">${m.sub}</div>
          <button class="btn btn-primary" data-accept-meet="${p.id}">I'll be there</button>
        </div>`;
      return `<div class="bubble ${m.from}">${m.text}</div>`;
    })
    .join("");

  const status = p.online
    ? canSeeOnMap(p) ? `Active now · ${distLabel(p)} away` : "Active now"
    : "Away";

  screen.innerHTML = `
    <div class="page-col">
      <div class="convo">
        <div class="convo-head">
          <button class="back-btn" data-back>
            <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>
          </button>
          <button data-profile="${p.id}" style="display:flex">${avatarHTML(p, 38)}</button>
          <button class="who" data-profile="${p.id}" style="text-align:left">
            <div class="name">${p.name}</div>
            <div class="status">${status}</div>
          </button>
          <button class="icon-btn" data-suggest-meet="${p.id}" title="Suggest meeting IRL">📍</button>
        </div>
        <div class="bubbles">
          <div class="bubble-meta">Today</div>
          ${bubbles}
        </div>
        <div class="composer">
          <div class="composer-inner">
            <input id="composer-input" type="text" placeholder="Message ${p.name.split(" ")[0]}…" autocomplete="off" />
            <button class="send" id="composer-send" title="Send">
              <svg viewBox="0 0 24 24"><path d="M3 11.5 21 3l-7 18-2.8-7.2L3 11.5Z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  const input = document.getElementById("composer-input");
  const send = () => {
    const text = input.value.trim();
    if (!text) return;
    chat.messages.push({ from: "me", text });
    chat.time = "Now";
    input.value = "";
    renderChat(id);
    setTimeout(() => {
      if (state.view?.type === "chat" && state.view.id === id) {
        chat.messages.push({ from: "them", text: "sounds good — see you out there 👋" });
        renderChat(id);
      }
    }, 1400);
  };
  document.getElementById("composer-send").addEventListener("click", send);
  input.addEventListener("keydown", (e) => e.key === "Enter" && send());

  screen.scrollTop = screen.scrollHeight;
}

/* ============================================================
   MAP — only people within 100 yds, plus sharing friends
   ============================================================ */

const MAP_FILTERS = [
  { id: "all", label: "Everyone near you" },
  { id: "friends", label: "Friends" },
];

function mapVisiblePeople() {
  return PEOPLE.filter((p) => {
    if (!canSeeOnMap(p)) return false;
    if (state.mapFilter === "friends") return p.friend;
    return true;
  });
}

function mapOverlaysHTML(people, isLive) {
  const nearby = people.filter(isNearby).length;
  const sharing = people.filter((p) => !isNearby(p)).length;
  return `
    ${state.ghost ? `
      <div class="ghost-banner">
        <div class="big">👻</div>
        <h3>Ghost Mode is on</h3>
        <p>You're invisible, and the map is paused for you.<br/>Nobody can see your location until you come back.</p>
        <button class="btn btn-primary" data-ghost-off>Reappear</button>
      </div>` : ""}

    <div class="map-top">
      <button class="map-search" data-tab-jump="explore">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16.5 16.5 4 4"/></svg>
        Search people, places…
      </button>
      <div class="map-filters">
        ${MAP_FILTERS.map(
          (f) => `<button class="map-filter ${state.mapFilter === f.id ? "on" : ""}" data-filter="${f.id}">${f.label}</button>`
        ).join("")}
        <span class="map-filter static">Strangers visible only within 100 yds</span>
      </div>
    </div>

    <button class="recenter-btn" data-recenter title="Recenter on you">
      <svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0-6a1 1 0 0 1 1 1v2.06A7 7 0 0 1 18.94 11H21a1 1 0 1 1 0 2h-2.06A7 7 0 0 1 13 18.94V21a1 1 0 1 1-2 0v-2.06A7 7 0 0 1 5.06 13H3a1 1 0 1 1 0-2h2.06A7 7 0 0 1 11 5.06V3a1 1 0 0 1 1-1Z"/></svg>
    </button>
    <button class="ghost-toggle ${state.ghost ? "on" : ""}" data-ghost title="Ghost mode">👻</button>

    <div class="map-bottom">
      <div class="map-count-pill live-pill">${isLive ? '<span class="dot"></span>&nbsp;' : ""}<b>${nearby} within 100 yds</b>${sharing ? `&nbsp;· ${sharing} friend${sharing === 1 ? "" : "s"} sharing` : ""}</div>
    </div>`;
}

function renderMap() {
  const people = mapVisiblePeople();
  if (state.geo && window.L) renderGeoMap(people);
  else renderDemoMap(people);
}

/* ----- Real map: your actual location + OpenStreetMap ----- */

let geoMap = null;

function destroyGeoMap() {
  if (geoMap) {
    geoMap.remove();
    geoMap = null;
  }
}

// Place demo people around YOUR real position using their
// distance + bearing. Their location is fictional; yours is real.
function geoLatLng(distanceYds, bearingDeg) {
  const d = distanceYds * 0.9144; // meters
  const rad = (bearingDeg * Math.PI) / 180;
  const dNorth = Math.cos(rad) * d;
  const dEast = Math.sin(rad) * d;
  const lat = state.geo.lat + dNorth / 111320;
  const lng = state.geo.lng + dEast / (111320 * Math.cos((state.geo.lat * Math.PI) / 180));
  return [lat, lng];
}

function renderGeoMap(people) {
  destroyGeoMap();
  screen.innerHTML = `
    <div class="map-screen">
      <div id="leaflet-map"></div>
      ${mapOverlaysHTML(people, true)}
    </div>`;

  // Stay zoomed to your 100-yd world by default; zoom out to
  // find friends who share their location from farther away.
  const me = [state.geo.lat, state.geo.lng];
  geoMap = L.map("leaflet-map", { zoomControl: false, zoomSnap: 0.5 }).setView(me, 17.5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(geoMap);

  L.circle(me, {
    radius: 91.44,
    color: "#00adef",
    weight: 1.5,
    fillColor: "#00adef",
    fillOpacity: 0.08,
  }).addTo(geoMap);

  const points = [me];

  const addPin = (person, latlng, cls) => {
    const html = `
      <div class="geo-pin ${cls}">
        ${avatarHTML(person, 48)}
        <span class="pin-name">${person.id === "me" ? "You" : person.name.split(" ")[0]}</span>
      </div>`;
    const icon = L.divIcon({ className: "", html, iconSize: [60, 72], iconAnchor: [30, 36] });
    L.marker(latlng, { icon }).addTo(geoMap).on("click", () => openProfile(person.id));
  };

  for (const h of HOTSPOTS) {
    const html = `
      <div class="geo-hotspot">
        <span class="flame">${h.icon}</span>
        <span class="count">${h.count} here</span>
      </div>`;
    const icon = L.divIcon({ className: "", html, iconSize: [44, 56], iconAnchor: [22, 28] });
    L.marker(geoLatLng(h.distanceYds, h.bearingDeg), { icon })
      .addTo(geoMap)
      .on("click", () => toast(`${h.name} — ${h.count} people there now`));
  }

  for (const p of people) {
    const ll = geoLatLng(p.distanceYds, p.bearingDeg);
    points.push(ll);
    addPin(p, ll, p.friend ? "friend" : "");
  }
  addPin({ ...ME, id: "me" }, me, "me");
}

/* ----- Demo map: stylized Harvard Square fallback ----- */

function renderDemoMap(people) {
  const pins = people
    .filter((p) => p.x != null)
    .map(
      (p) => `
      <button class="map-pin ${p.friend ? "friend" : ""}" data-profile="${p.id}" style="left:${p.x}%;top:${p.y}%">
        ${avatarHTML(p, 48)}
        <span class="pin-name">${p.name.split(" ")[0]}</span>
      </button>`
    )
    .join("");

  const hotspots = HOTSPOTS.map(
    (h) => `
    <button class="hotspot-pin" data-hotspot="${h.id}" style="left:${h.x}%;top:${h.y}%">
      <span class="flame">${h.icon}</span>
      <span class="count">${h.count} here</span>
    </button>`
  ).join("");

  const labels = PLACES.filter((pl) => pl.type !== "green")
    .map((pl) => `<span class="map-label ${pl.type === "water" ? "water" : ""}" style="left:${pl.x}%;top:${pl.y}%">${pl.label}</span>`)
    .join("");

  screen.innerHTML = `
    <div class="map-screen">
      <div class="map-canvas" id="map-canvas" style="transform:translate(${state.pan.x}px, ${state.pan.y}px)">
        ${mapArtSVG()}
        ${labels}
        ${hotspots}
        <span class="me-pulse" style="left:${ME.x}%;top:${ME.y}%"></span>
        <span class="radius-tag" style="left:${ME.x}%;top:calc(${ME.y}% + 88px)">100 yds</span>
        ${pins}
        <button class="map-pin me" data-profile="me" style="left:${ME.x}%;top:${ME.y}%">
          ${avatarHTML(ME, 48)}
          <span class="pin-name">You</span>
        </button>
      </div>
      ${mapOverlaysHTML(people, false)}
    </div>
  `;

  initMapPan();
}

function mapArtSVG() {
  return `
  <svg class="map-art" viewBox="0 0 1000 900" preserveAspectRatio="none">
    <rect width="1000" height="900" fill="#f1f3ef"/>
    <g fill="#e7eae4">
      <rect x="60" y="60" width="240" height="180" rx="10"/>
      <rect x="60" y="300" width="200" height="220" rx="10"/>
      <rect x="700" y="80" width="240" height="240" rx="10"/>
      <rect x="720" y="380" width="220" height="180" rx="10"/>
      <rect x="120" y="600" width="200" height="160" rx="10"/>
      <rect x="620" y="600" width="150" height="120" rx="10"/>
    </g>
    <rect x="380" y="290" width="280" height="200" rx="16" fill="#d7e8d2"/>
    <rect x="430" y="335" width="60" height="40" rx="5" fill="#c3d9bc"/>
    <rect x="540" y="390" width="80" height="46" rx="5" fill="#c3d9bc"/>
    <rect x="300" y="80" width="160" height="120" rx="14" fill="#dcebd7"/>
    <circle cx="380" cy="140" r="26" fill="#cfe2c8"/>
    <g stroke="#ffffff" fill="none" stroke-linecap="round">
      <path d="M0 270 H1000" stroke-width="22"/>
      <path d="M0 540 H1000" stroke-width="26"/>
      <path d="M330 0 V820" stroke-width="22"/>
      <path d="M690 0 V760" stroke-width="22"/>
      <path d="M0 700 Q300 660 520 700 T1000 660" stroke-width="20"/>
      <path d="M330 540 Q420 600 430 720" stroke-width="14"/>
      <path d="M690 540 Q740 640 820 700" stroke-width="14"/>
    </g>
    <g stroke="#dfe3dc" fill="none" stroke-linecap="round">
      <path d="M0 270 H1000" stroke-width="2" stroke-dasharray="14 16"/>
      <path d="M0 540 H1000" stroke-width="2" stroke-dasharray="14 16"/>
      <path d="M330 0 V820" stroke-width="2" stroke-dasharray="14 16"/>
      <path d="M690 0 V760" stroke-width="2" stroke-dasharray="14 16"/>
    </g>
    <path d="M0 830 Q250 780 500 825 T1000 800 L1000 900 L0 900 Z" fill="#cfe5f2"/>
    <path d="M0 845 Q250 798 500 840 T1000 815" stroke="#bcd9ea" stroke-width="3" fill="none"/>
    <rect x="585" y="770" width="26" height="110" rx="6" fill="#e9ece7" transform="rotate(8 598 825)"/>
  </svg>`;
}

function initMapPan() {
  const canvas = document.getElementById("map-canvas");
  if (!canvas) return;
  let dragging = false, moved = false, sx = 0, sy = 0, ox = 0, oy = 0;

  const clamp = (v, lim) => Math.max(-lim, Math.min(lim, v));

  const down = (e) => {
    dragging = true; moved = false;
    const t = e.touches ? e.touches[0] : e;
    sx = t.clientX; sy = t.clientY;
    ox = state.pan.x; oy = state.pan.y;
  };
  const move = (e) => {
    if (!dragging) return;
    const t = e.touches ? e.touches[0] : e;
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
    state.pan.x = clamp(ox + dx, screen.clientWidth * 0.45);
    state.pan.y = clamp(oy + dy, screen.clientHeight * 0.38);
    canvas.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px)`;
    if (e.cancelable) e.preventDefault();
  };
  const up = () => { dragging = false; };

  canvas.addEventListener("mousedown", down);
  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
  canvas.addEventListener("touchstart", down, { passive: true });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", up);

  canvas.addEventListener("click", (e) => {
    if (moved) { e.stopPropagation(); moved = false; }
  }, true);
}

/* ============================================================
   EXPLORE — search, beacons, who's nearby
   ============================================================ */

function beaconTimeLeft() {
  const ms = state.myBeacon.until - Date.now();
  const h = Math.floor(ms / 3600000);
  const m = Math.round((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`;
}

function renderExplore(query = "") {
  const q = query.trim().toLowerCase();
  const matches = q
    ? PEOPLE.filter((p) =>
        [p.name, p.headline, p.school, p.work, p.sharedContext].join(" ").toLowerCase().includes(q)
      )
    : [];

  const personRow = (p) => `
    <button class="person-row" data-profile="${p.id}">
      ${avatarHTML(p, 46)}
      <span class="p-mid">
        <span class="p-name">${p.name} ${irlTag(p)}</span>
        <span class="p-sub">${p.sharedContext || p.headline}</span>
      </span>
      <span class="dist-tag ${canSeeOnMap(p) ? "" : "private"}">${canSeeOnMap(p) ? distLabel(p) : "Private"}</span>
    </button>`;

  const myBeaconCard = state.myBeacon
    ? `
    <div class="beacon-card mine">
      ${avatarHTML(ME, 44)}
      <div class="b-mid">
        <div class="b-name">Your beacon <span class="live-dot">● live</span></div>
        <div class="b-text">${esc(state.myBeacon.text)}</div>
        <div class="b-meta"><span>📍 ${esc(state.myBeacon.place)}</span><span>${beaconTimeLeft()}</span><span>Friends can see this</span></div>
      </div>
      <button class="btn btn-ghost" data-end-beacon>End</button>
    </div>`
    : `
    <button class="drop-beacon" data-drop-beacon>
      <span class="db-icon"><img src="img/logo.svg" alt="" style="width:26px;height:26px;border-radius:7px"/></span>
      <span>
        <span class="db-title">Drop a Beacon</span>
        <span class="db-sub">Tell people where you are and what you're doing</span>
      </span>
    </button>`;

  const beaconCards = BEACONS.map((b) => {
    const p = byId(b.personId);
    const joined = state.joinedBeacons.has(b.id);
    return `
      <div class="beacon-card">
        <button data-profile="${p.id}" style="display:flex">${avatarHTML(p, 44)}</button>
        <div class="b-mid">
          <div class="b-name">${p.name}</div>
          <div class="b-text">${b.text}</div>
          <div class="b-meta"><span class="live">● ${b.expires}</span><span>📍 ${b.place}</span><span>${b.joined + (joined ? 1 : 0)} going</span></div>
        </div>
        <button class="btn ${joined ? "btn-ghost" : "btn-primary"}" data-join-beacon="${b.id}">${joined ? "Going ✓" : "I'm in"}</button>
      </div>`;
  }).join("");

  const nearby = PEOPLE.filter(isNearby);
  const hotspotRows = HOTSPOTS.slice(0, 3).map(
    (h) => `
    <button class="hotspot-row" data-hotspot="${h.id}">
      <span class="h-icon">${h.icon}</span>
      <span class="h-mid">
        <span class="h-name">${h.name}</span>
        <span class="h-sub">${h.sub} · ${h.place}</span>
      </span>
      <span class="h-count">${h.count}</span>
    </button>`
  ).join("");

  screen.innerHTML = `
    <div class="page-col">
      <header class="topbar">
        <h1>Explore</h1>
        <span class="chip accent">${state.geo ? "Near you" : "Harvard Square"}</span>
      </header>

      <div class="search-wrap">
        <div class="search-bar">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16.5 16.5 4 4"/></svg>
          <input id="explore-search" type="text" placeholder="Search people, places…" value="${esc(query)}" autocomplete="off"/>
        </div>
      </div>

      ${q ? `
        <div class="section-title"><h2>${matches.length} result${matches.length === 1 ? "" : "s"}</h2></div>
        ${matches.length ? matches.map(personRow).join("") : '<p class="empty-note">No one found — try a name, school, or company.<br/>Profiles are searchable; locations stay private.</p>'}
      ` : `
        ${myBeaconCard}

        <div class="section-title"><h2>Live beacons</h2><span class="see-all">${BEACONS.length + (state.myBeacon ? 1 : 0)} active</span></div>
        ${beaconCards}

        <div class="section-title"><h2>Nearby now</h2><span class="see-all">within 100 yds</span></div>
        ${nearby.length ? nearby.map(personRow).join("") : '<p class="empty-note">Nobody within 100 yds right now.</p>'}

        <div class="section-title"><h2>Busy spots</h2><button class="see-all" data-tab-jump="map">View on map</button></div>
        ${hotspotRows}
        <p class="empty-note">Beacons expire on their own. Locations beyond 100 yds are<br/>never shown — only place names people chose to share.</p>
      `}
    </div>
  `;

  const input = document.getElementById("explore-search");
  input.addEventListener("input", () => {
    const pos = input.selectionStart;
    renderExplore(input.value);
    const ni = document.getElementById("explore-search");
    ni.focus();
    ni.setSelectionRange(pos, pos);
  });
}

/* ----- Beacon composer ----- */

function renderBeaconComposer() {
  screen.innerHTML = `
    <div class="page-col">
      <div class="sheet-back">
        <button class="back-btn" data-back>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <span class="chip">Beacon</span>
      </div>

      <div class="edit-wrap">
        <h2 class="edit-title">Drop a Beacon</h2>
        <p class="edit-sub">A beacon tells people where you are, what you're doing, and that a hello is welcome. It expires on its own.</p>

        <div class="field"><label>What are you up to?</label><input id="b-text" type="text" maxlength="120" placeholder="Studying at Lamont til 5 — come say whats up" /></div>
        <div class="field"><label>Where?</label><input id="b-place" type="text" maxlength="60" placeholder="Lamont Library, 2nd floor" /></div>
        <div class="field">
          <label>For how long?</label>
          <div class="chip-select" id="b-dur">
            <span class="chip" data-h="1">1 hour</span>
            <span class="chip on" data-h="2">2 hours</span>
            <span class="chip" data-h="4">4 hours</span>
          </div>
        </div>
        <div class="field">
          <label>Who can see it?</label>
          <div class="chip-select" id="b-aud">
            <span class="chip on" data-aud="friends">Friends</span>
            <span class="chip" data-aud="nearby">Friends + people within 100 yds</span>
          </div>
        </div>
        <div class="auth-error" id="b-error"></div>
        <button class="btn btn-primary btn-wide" data-start-beacon>Go live</button>
      </div>
    </div>
  `;

  for (const id of ["b-dur", "b-aud"]) {
    document.getElementById(id).addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      [...e.currentTarget.children].forEach((c) => c.classList.remove("on"));
      chip.classList.add("on");
    });
  }
}

/* ============================================================
   PROFILES
   ============================================================ */

function profileBody(p) {
  const facts = [
    ["🎓", "School", p.school],
    ["💼", "Work", p.work],
    ["🏠", "Hometown", p.hometown],
    ["💙", "Status", p.relationship],
  ].filter(([, , v]) => v);

  const photos = (p.photos || []).length
    ? `<div class="photo-strip">
        ${p.photos.map((ph) => `<div class="ph" style="${photoBG(ph)}"><span>${ph.caption || ""}</span></div>`).join("")}
      </div>`
    : "";

  return `
    ${photos}

    ${(p.prompts || []).map((pr) => `
      <div class="prompt-card">
        <div class="pq">${pr.q}</div>
        <div class="pa">${esc(pr.a)}</div>
      </div>`).join("")}

    ${facts.length ? `
    <div class="section-title"><h2>Details</h2></div>
    <div class="fact-list">
      ${facts.map(([icon, label, value]) => `
        <div class="fact"><span class="f-icon">${icon}</span><span class="f-label">${label}</span><span class="f-value">${esc(value)}</span></div>`).join("")}
    </div>` : ""}

    ${(p.posts || []).length ? `
      <div class="section-title"><h2>Updates</h2></div>
      ${p.posts.map((post) => `
        <div class="prompt-card">
          ${post.promptQ ? `<div class="pq">${post.promptQ}</div>` : `<div class="pq">${post.time} ago</div>`}
          <div class="pa" style="font-size:14px;font-weight:500">${post.text}</div>
        </div>`).join("")}
    ` : ""}

    ${(p.socials || []).length ? `
    <div class="section-title"><h2>Elsewhere</h2></div>
    <div class="social-row">
      ${p.socials.map((s) => `<span class="social-pill">↗ ${esc(s)}</span>`).join("")}
    </div>` : ""}
  `;
}

function renderProfile(id) {
  if (id === "me") { state.view = null; state.tab = "me"; render(); return; }
  const p = byId(id);
  const requested = state.requested.has(p.id);
  const where = canSeeOnMap(p)
    ? `● ${whereLabel(p)}`
    : p.online ? "● Active now · location private" : "Location private";

  screen.innerHTML = `
    <div class="page-col">
      <div class="sheet-back">
        <button class="back-btn" data-back>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <span class="chip ${canSeeOnMap(p) ? "accent" : ""}">${where}</span>
      </div>

      <div class="profile-hero" style="padding-top:4px">
        ${avatarHTML(p, 96)}
        <h2>${p.name} ${irlTag(p)}</h2>
        <div class="headline">${p.headline}</div>
        <div class="open-to">
          ${p.openTo.map((o) => `<span class="chip">${o}</span>`).join("")}
        </div>
        ${p.sharedContext ? `<div class="open-to"><span class="chip accent">${p.sharedContext}</span></div>` : ""}
      </div>

      <div class="profile-cta">
        ${p.friend
          ? `<button class="btn btn-ghost" disabled>Connected ✓</button>
             <button class="btn btn-primary" data-chat="${p.id}">Message</button>`
          : `<button class="btn ${requested ? "btn-ghost" : "btn-primary"}" data-connect="${p.id}">${requested ? "Requested ✓" : "Connect"}</button>
             <button class="btn btn-outline" data-wave="${p.id}">Wave 👋</button>`}
        ${canSeeOnMap(p) ? `<button class="btn btn-ghost" data-findonmap="${p.id}" title="Find on map">📍</button>` : ""}
      </div>

      ${profileBody(p)}
      <div style="height:24px"></div>
    </div>
  `;
}

/* ============================================================
   ME — your profile, sharing controls, settings
   ============================================================ */

function renderMe() {
  const s = state.settings;

  const shareRows = friends().map((p) => {
    const youShare = state.shareWith.has(p.id);
    const theirSide = p.sharesLocation
      ? youShare ? `Sharing with you · ${distLabel(p) || ""}` : "Will share once you do"
      : "Keeps their location private";
    return `
      <button class="setting-row" data-share-toggle="${p.id}">
        ${avatarHTML(p, 34)}
        <span class="s-label">${p.name}<span class="s-sub">${theirSide}</span></span>
        <span class="switch ${youShare ? "on" : ""}"></span>
      </button>`;
  }).join("");

  screen.innerHTML = `
    <div class="page-col">
      <header class="topbar">
        <h1>You</h1>
        <button class="icon-btn" data-edit-profile title="Edit profile">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="M13.5 6.5l3 3"/></svg>
        </button>
      </header>

      <div class="profile-hero" style="padding-top:14px">
        ${avatarHTML(ME, 96)}
        <h2>${esc(ME.name)}</h2>
        <div class="headline">${esc(ME.headline) || "Add a one-liner — tap Edit profile"}</div>
        <div class="open-to">${ME.openTo.map((o) => `<span class="chip">${o}</span>`).join("")}</div>
      </div>

      ${state.myBeacon ? `
      <div class="beacon-card mine" style="margin-top:14px">
        ${avatarHTML(ME, 44)}
        <div class="b-mid">
          <div class="b-name">Your beacon <span class="live-dot">● live</span></div>
          <div class="b-text">${esc(state.myBeacon.text)}</div>
          <div class="b-meta"><span>📍 ${esc(state.myBeacon.place)}</span><span>${beaconTimeLeft()}</span></div>
        </div>
        <button class="btn btn-ghost" data-end-beacon>End</button>
      </div>` : ""}

      <div class="profile-stats">
        <div class="stat"><b>${ME.stats.connections}</b><span>Connections</span></div>
        <div class="stat irl"><b>${ME.stats.irlMeets}</b><span>IRL meets</span></div>
        <div class="stat"><b>${ME.stats.beacons}</b><span>Beacons</span></div>
      </div>

      <div class="profile-cta">
        <button class="btn btn-primary" data-edit-profile>Edit profile</button>
        <button class="btn btn-ghost" data-drop-beacon>${state.myBeacon ? "Beacon live ●" : "Drop a beacon"}</button>
      </div>

      ${profileBody(ME)}

      <div class="section-title"><h2>Friends who can see you</h2></div>
      <p class="section-hint">Location sharing is mutual — a friend only sees you beyond 100 yds if you both turn it on.</p>
      <div class="settings-list">
        ${shareRows}
      </div>

      <div class="section-title"><h2>Privacy</h2></div>
      <div class="settings-list">
        <button class="setting-row" data-ghost>
          <span class="s-icon">👻</span>
          <span class="s-label">Ghost Mode<span class="s-sub">Disappear from the map instantly</span></span>
          <span class="switch ${state.ghost ? "on" : ""}"></span>
        </button>
        <button class="setting-row" data-setting="precise">
          <span class="s-icon">🎯</span>
          <span class="s-label">Precise location<span class="s-sub">Off = people see approximate distance only</span></span>
          <span class="switch ${s.precise ? "on" : ""}"></span>
        </button>
        <button class="setting-row" data-setting="classScan">
          <span class="s-icon">🏫</span>
          <span class="s-label">Visible in class &amp; event scans<span class="s-sub">Let classmates and attendees find you</span></span>
          <span class="switch ${s.classScan ? "on" : ""}"></span>
        </button>
        <button class="setting-row" data-setting="quietHours">
          <span class="s-icon">🌙</span>
          <span class="s-label">Quiet hours (10pm–8am)<span class="s-sub">Auto-ghost while you sleep</span></span>
          <span class="switch ${s.quietHours ? "on" : ""}"></span>
        </button>
        <button class="setting-row" data-soon="Blocked & hidden">
          <span class="s-icon">🚫</span>
          <span class="s-label">Blocked &amp; hidden people</span>
          <span class="s-chev">›</span>
        </button>
        <button class="setting-row" data-signout>
          <span class="s-icon">🚪</span>
          <span class="s-label">Sign out<span class="s-sub">${ME.email || ""}</span></span>
          <span class="s-chev">›</span>
        </button>
      </div>

      <p class="empty-note" style="padding-top:0">whatsup v3 — start online, meet in person.</p>
    </div>
  `;
}

/* ----- Profile editor ----- */

const REL_OPTIONS = ["", "Single", "In a relationship", "It's complicated", "Prefer not to say"];

function downscaleImage(file, maxPx) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function renderEditProfile() {
  const u = Auth.currentUser() || {};
  const prompts = [0, 1, 2].map((i) => ME.prompts[i] || { q: PROMPT_QUESTIONS[i], a: "" });
  const photos = [0, 1, 2].map((i) => (u.photos || [])[i] || null);

  screen.innerHTML = `
    <div class="page-col">
      <div class="sheet-back">
        <button class="back-btn" data-back>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <button class="btn btn-primary" data-save-profile style="padding:8px 18px">Save</button>
      </div>

      <div class="edit-wrap">
        <h2 class="edit-title">Edit profile</h2>

        <div class="edit-avatar-row">
          <label class="edit-avatar" title="Change profile photo">
            ${avatarHTML(ME, 84)}
            <input type="file" accept="image/*" id="e-avatar" hidden />
            <span class="edit-avatar-badge">＋</span>
          </label>
          <div class="edit-avatar-hint">Profile photo<br/><span>Tap to upload</span></div>
        </div>

        <div class="field"><label>Name</label><input id="e-name" type="text" value="${esc(ME.name)}" /></div>
        <div class="field"><label>One-liner</label><input id="e-headline" type="text" maxlength="80" value="${esc(ME.headline)}" placeholder="Harvard '27 · Econ · Chronic coffee walker" /></div>
        <div class="field"><label>School</label><input id="e-school" type="text" value="${esc(ME.school)}" placeholder="Harvard College, Class of 2027" /></div>
        <div class="field"><label>Work</label><input id="e-work" type="text" value="${esc(ME.work)}" placeholder="Intern @ …" /></div>
        <div class="field"><label>Hometown</label><input id="e-hometown" type="text" value="${esc(ME.hometown)}" placeholder="Austin, TX" /></div>
        <div class="field">
          <label>Relationship status</label>
          <select id="e-rel" class="edit-select">
            ${REL_OPTIONS.map((o) => `<option value="${o}" ${ME.relationship === o ? "selected" : ""}>${o || "—"}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>I'm open to…</label>
          <div class="chip-select" id="e-open">
            ${["Friends", "Networking", "Dating", "Study buddies"].map(
              (o) => `<span class="chip ${ME.openTo.includes(o) ? "on" : ""}" data-open="${o}">${o}</span>`
            ).join("")}
          </div>
        </div>

        <div class="field"><label>Photos</label>
          <div class="photo-edit-row">
            ${photos.map((d, i) => `
              <label class="photo-slot" style="${d ? `background-image:url(${d})` : ""}">
                <input type="file" accept="image/*" data-photo-slot="${i}" hidden />
                ${d ? "" : '<span class="photo-slot-plus">＋</span>'}
              </label>`).join("")}
          </div>
        </div>

        ${prompts.map((pr, i) => `
        <div class="field">
          <label>Prompt ${i + 1}</label>
          <select class="edit-select" id="e-pq-${i}">
            ${PROMPT_QUESTIONS.map((q) => `<option ${q === pr.q ? "selected" : ""}>${q}</option>`).join("")}
          </select>
          <input id="e-pa-${i}" type="text" maxlength="120" value="${esc(pr.a)}" placeholder="Your answer…" style="margin-top:8px" />
        </div>`).join("")}

        <div class="field"><label>Socials (handles, optional)</label>
          <input id="e-ig" type="text" value="${esc(u.ig || "")}" placeholder="Instagram @handle" />
          <input id="e-li" type="text" value="${esc(u.li || "")}" placeholder="LinkedIn /in/handle" style="margin-top:8px" />
        </div>

        <button class="btn btn-primary btn-wide" data-save-profile>Save profile</button>
        <div style="height:30px"></div>
      </div>
    </div>
  `;

  // staged uploads live here until Save
  const staged = { avatar: undefined, photos: [...photos] };
  screen._staged = staged;

  document.getElementById("e-avatar").addEventListener("change", async (e) => {
    if (!e.target.files[0]) return;
    staged.avatar = await downscaleImage(e.target.files[0], 400);
    document.querySelector(".edit-avatar .avatar").style.backgroundImage = `url(${staged.avatar})`;
    document.querySelector(".edit-avatar .avatar").textContent = "";
  });

  document.querySelectorAll("[data-photo-slot]").forEach((input) => {
    input.addEventListener("change", async (e) => {
      if (!e.target.files[0]) return;
      const i = +input.dataset.photoSlot;
      staged.photos[i] = await downscaleImage(e.target.files[0], 900);
      const slot = input.closest(".photo-slot");
      slot.style.backgroundImage = `url(${staged.photos[i]})`;
      slot.querySelector(".photo-slot-plus")?.remove();
    });
  });

  document.getElementById("e-open").addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (chip) chip.classList.toggle("on");
  });
}

function saveProfile() {
  const staged = screen._staged || { photos: [] };
  const name = document.getElementById("e-name").value.trim();
  if (!name) return toast("Your name can't be empty");

  const prompts = [0, 1, 2]
    .map((i) => ({
      q: document.getElementById(`e-pq-${i}`).value,
      a: document.getElementById(`e-pa-${i}`).value.trim(),
    }))
    .filter((p) => p.a);

  const socials = [];
  const ig = document.getElementById("e-ig").value.trim();
  const li = document.getElementById("e-li").value.trim();
  if (ig) socials.push("Instagram");
  if (li) socials.push("LinkedIn");

  const patch = {
    name,
    initials: name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
    headline: document.getElementById("e-headline").value.trim(),
    school: document.getElementById("e-school").value.trim(),
    work: document.getElementById("e-work").value.trim(),
    hometown: document.getElementById("e-hometown").value.trim(),
    relationship: document.getElementById("e-rel").value,
    openTo: [...document.querySelectorAll("#e-open .chip.on")].map((c) => c.dataset.open),
    prompts,
    socials: socials.length ? socials : undefined,
    photos: staged.photos,
    ig, li,
  };
  if (staged.avatar !== undefined) patch.photoData = staged.avatar;

  Auth.updateProfile(patch);
  applyAccount(Auth.currentUser());
  state.view = null;
  state.tab = "me";
  render();
  toast("Profile saved");
}

/* ============================================================
   Global click delegation
   ============================================================ */

screen.addEventListener("click", (e) => {
  const t = (sel) => e.target.closest(sel);
  let el;

  if ((el = t("[data-auth]"))) return showAuth(el.dataset.auth);
  if ((el = t("[data-back]"))) return closeView();
  if ((el = t("[data-save-profile]"))) return saveProfile();
  if ((el = t("[data-edit-profile]"))) { state.view = { type: "edit" }; return render(); }

  if ((el = t("[data-drop-beacon]"))) {
    if (state.myBeacon) { state.view = null; state.tab = "explore"; return render(); }
    state.view = { type: "beacon" };
    return render();
  }
  if ((el = t("[data-start-beacon]"))) {
    const text = document.getElementById("b-text").value.trim();
    const place = document.getElementById("b-place").value.trim();
    if (!text || !place) {
      const err = document.getElementById("b-error");
      err.textContent = "Add what you're doing and where — that's the whole beacon.";
      err.classList.add("show");
      return;
    }
    const hours = +document.querySelector("#b-dur .chip.on").dataset.h;
    state.myBeacon = { text, place, until: Date.now() + hours * 3600000 };
    saveJSON(beaconKey(), state.myBeacon);
    Auth.updateProfile({ beaconsDropped: (ME.stats.beacons || 0) + 1 });
    ME.stats.beacons += 1;
    state.view = null;
    state.tab = "explore";
    render();
    return toast("Beacon is live — your friends can see where you are");
  }
  if ((el = t("[data-end-beacon]"))) {
    state.myBeacon = null;
    saveJSON(beaconKey(), null);
    render();
    return toast("Beacon ended");
  }

  if ((el = t("[data-share-toggle]"))) {
    const id = el.dataset.shareToggle;
    const p = byId(id);
    if (state.shareWith.has(id)) {
      state.shareWith.delete(id);
      toast(`${p.name.split(" ")[0]} can no longer see your location`);
    } else {
      state.shareWith.add(id);
      toast(`You and ${p.name.split(" ")[0]} now share locations`);
    }
    saveJSON(shareKey(), [...state.shareWith]);
    return renderMe();
  }

  if ((el = t("[data-profile]"))) return openProfile(el.dataset.profile);
  if ((el = t("[data-chat]"))) return openChat(el.dataset.chat);
  if ((el = t("[data-tab-jump]"))) return setTab(el.dataset.tabJump);

  if ((el = t("[data-like]"))) {
    const key = el.dataset.like;
    state.liked.has(key) ? state.liked.delete(key) : state.liked.add(key);
    return renderHome();
  }

  if ((el = t("[data-findonmap]"))) {
    const p = byId(el.dataset.findonmap);
    if (!canSeeOnMap(p)) return toast(`${p.name.split(" ")[0]}'s location is private`);
    state.pan = { x: 0, y: 0 };
    setTab("map");
    return toast(`${p.name.split(" ")[0]} is ${distLabel(p)} away`);
  }

  if ((el = t("[data-filter]"))) {
    if (el.classList.contains("static")) return;
    state.mapFilter = el.dataset.filter;
    return renderMap();
  }

  if ((el = t("[data-recenter]"))) {
    if (geoMap && state.geo) {
      geoMap.setView([state.geo.lat, state.geo.lng], 17.5, { animate: true });
      return;
    }
    state.pan = { x: 0, y: 0 };
    const canvas = document.getElementById("map-canvas");
    if (canvas) {
      canvas.style.transition = "transform 0.25s ease";
      canvas.style.transform = "translate(0px, 0px)";
      setTimeout(() => (canvas.style.transition = ""), 260);
    }
    return;
  }

  if ((el = t("[data-ghost]"))) {
    state.ghost = !state.ghost;
    toast(state.ghost ? "Ghost Mode on — you're invisible" : "You're back on the map");
    return state.tab === "map" ? renderMap() : renderMe();
  }
  if ((el = t("[data-ghost-off]"))) {
    state.ghost = false;
    toast("You're back on the map");
    return renderMap();
  }

  if ((el = t("[data-setting]"))) {
    state.settings[el.dataset.setting] = !state.settings[el.dataset.setting];
    return renderMe();
  }

  if ((el = t("[data-signout]"))) {
    toast("Signed out — see you out there");
    return leaveApp();
  }

  if ((el = t("[data-connect]"))) {
    const p = byId(el.dataset.connect);
    state.requested.add(p.id);
    toast(`Connection request sent to ${p.name.split(" ")[0]}`);
    return renderProfile(p.id);
  }

  if ((el = t("[data-wave]"))) {
    const p = byId(el.dataset.wave);
    return toast(`You waved at ${p.name.split(" ")[0]} — now go say whats up`);
  }

  if ((el = t("[data-join-beacon]"))) {
    const b = BEACONS.find((x) => x.id === el.dataset.joinBeacon);
    const p = byId(b.personId);
    if (state.joinedBeacons.has(b.id)) {
      state.joinedBeacons.delete(b.id);
      toast("You backed out — no worries");
    } else {
      state.joinedBeacons.add(b.id);
      toast(`You're in — ${p.name.split(" ")[0]} can see you're coming`);
    }
    return renderExplore(document.getElementById("explore-search")?.value || "");
  }

  if ((el = t("[data-hotspot]"))) {
    const h = HOTSPOTS.find((x) => x.id === el.dataset.hotspot);
    state.pan = { x: 0, y: 0 };
    setTab("map");
    return toast(`${h.name} — ${h.count} people there now`);
  }

  if ((el = t("[data-suggest-meet]"))) {
    const p = byId(el.dataset.suggestMeet);
    return toast(`Meetup suggestion sent to ${p.name.split(" ")[0]}`);
  }

  if ((el = t("[data-accept-meet]"))) {
    return toast("You're in — added to both your calendars for Friday");
  }

  if ((el = t("[data-soon]"))) return toast(`${el.dataset.soon} — coming soon`);
});

/* ---------- boot ---------- */

const sessionUser = Auth.currentUser();
if (sessionUser) {
  enterApp(sessionUser, { silent: true });
} else {
  showAuth("landing");
}
