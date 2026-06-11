/* ============================================================
   WhatsUp — prototype app logic
   Plain JS, no dependencies. State lives in memory.
   ============================================================ */

const screen = document.getElementById("screen");
const tabbar = document.getElementById("tabbar");

const state = {
  tab: "map",
  view: null,            // null | {type:'profile', id} | {type:'chat', id}
  mapFilter: "all",
  ghost: false,
  liked: new Set(),
  requested: new Set(),  // pending connection requests sent
  joinedBeacons: new Set(),
  settings: { precise: true, classScan: true, quietHours: false },
  pan: { x: 0, y: 0 },
};

/* ---------- helpers ---------- */

const byId = (id) => PEOPLE.find((p) => p.id === id) || (id === "me" ? ME : null);

function grad(palette) {
  const [a, b] = PALETTES[palette] || PALETTES.sky;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function avatarHTML(person, size, extraClass = "") {
  return `<span class="avatar ${extraClass}" style="width:${size}px;height:${size}px;background-image:${grad(
    person.palette
  )};font-size:${Math.round(size * 0.36)}px">${person.initials}</span>`;
}

function photoBG(photo) {
  return `background-image:
    radial-gradient(120px 90px at 75% 20%, rgba(255,255,255,0.35), transparent),
    ${grad(photo.palette)}`;
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
  if (!chat) {
    CHATS.unshift({ personId: id, unread: false, time: "Now", messages: [] });
  } else {
    chat.unread = false;
  }
  state.view = { type: "chat", id };
  render();
}

function closeView() {
  state.view = null;
  render();
}

/* ---------- render root ---------- */

function render() {
  // Tab highlighting + unread badge
  tabbar.querySelectorAll(".tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === state.tab && !state.view);
  });
  const unread = CHATS.filter((c) => c.unread).length;
  const badge = document.getElementById("msg-badge");
  badge.style.display = unread ? "" : "none";
  badge.textContent = unread;

  screen.classList.remove("fade-in");
  void screen.offsetWidth; // restart animation

  if (state.view?.type === "profile") renderProfile(state.view.id);
  else if (state.view?.type === "chat") renderChat(state.view.id);
  else if (state.tab === "home") renderHome();
  else if (state.tab === "messages") renderMessages();
  else if (state.tab === "map") renderMap();
  else if (state.tab === "explore") renderExplore();
  else if (state.tab === "me") renderMe();

  screen.classList.add("fade-in");
  if (state.view?.type !== "chat") screen.scrollTop = 0;
}

tabbar.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (btn) setTab(btn.dataset.tab);
});

/* ============================================================
   HOME — feed of your friends' updates
   ============================================================ */

function renderHome() {
  const friends = PEOPLE.filter((p) => p.friend);
  const nearby = PEOPLE.filter((p) => !p.friend && p.online).slice(0, 2);

  const stories = [
    ...friends.map(
      (p) => `
      <button class="story" data-profile="${p.id}">
        ${avatarHTML(p, 56)}
        <span>${p.name.split(" ")[0]}</span>
      </button>`
    ),
    ...nearby.map(
      (p) => `
      <button class="story nearby" data-profile="${p.id}">
        ${avatarHTML(p, 56)}
        <span>${p.name.split(" ")[0]}</span>
        <span class="dist">${p.distance}</span>
      </button>`
    ),
  ].join("");

  // Collect friends' posts
  const posts = [];
  for (const p of friends) for (const post of p.posts || []) posts.push({ person: p, post });

  const typeLabel = { work: "WORK UPDATE", prompt: "NEW PROMPT", photo: "MOMENT" };

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
          <button data-findonmap="${person.id}">
            <svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="9.5" r="2.4"/></svg>
            Find on map
          </button>
        </div>
      </article>`;
    })
    .join("");

  const nudge = FEED_EXTRA[0];

  screen.innerHTML = `
    <header class="topbar">
      <div class="wordmark">whats<span>up</span></div>
      <button class="icon-btn" data-tab-jump="explore" title="Search">
        <svg viewBox="0 0 24 24"><path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm8.7 13.3-3.4-3.4 1.4-1.4 3.4 3.4a1 1 0 0 1-1.4 1.4Z"/></svg>
      </button>
    </header>

    <div class="story-row">${stories}</div>

    <div class="feed">
      ${postCards.slice(0, postCards.length)}
      <div class="nudge">
        <h3>${nudge.title}</h3>
        <p>${nudge.text}</p>
        <button class="btn" data-tab-jump="map">${nudge.cta}</button>
      </div>
      <p class="empty-note">That's everything from your people today.<br/>Now go say whats up to one of them. 👋</p>
    </div>
  `;

  // Re-insert nudge after the first post for rhythm
  const feed = screen.querySelector(".feed");
  const firstPost = feed.querySelector(".post");
  const nudgeEl = feed.querySelector(".nudge");
  if (firstPost && nudgeEl) firstPost.after(nudgeEl);
}

/* ============================================================
   MESSAGES
   ============================================================ */

function renderMessages() {
  const nearbyFriends = PEOPLE.filter((p) => p.friend && p.online);

  const rows = CHATS.map((chat) => {
    const p = byId(chat.personId);
    const last = chat.messages[chat.messages.length - 1];
    const preview = last
      ? last.type === "meet"
        ? `📍 ${last.title}`
        : `${last.from === "me" ? "You: " : ""}${last.text}`
      : "Say whats up 👋";
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
    <header class="topbar">
      <h1>Chats</h1>
      <button class="icon-btn" data-tab-jump="explore" title="New chat">
        <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/></svg>
      </button>
    </header>

    <div class="nearby-strip">
      <span class="stack">${nearbyFriends.map((p) => avatarHTML(p, 30)).join("")}</span>
      <span>${nearbyFriends.length} of your people are nearby right now — a chat is good, in person is better.</span>
    </div>

    ${rows}
    <p class="empty-note">Chats here are meant to end with a meetup.<br/>Suggest one with the 📍 button inside any conversation.</p>
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

  screen.innerHTML = `
    <div class="convo">
      <div class="convo-head">
        <button class="back-btn" data-back>
          <svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>
        </button>
        <button data-profile="${p.id}" style="display:flex">${avatarHTML(p, 38)}</button>
        <button class="who" data-profile="${p.id}" style="text-align:left">
          <div class="name">${p.name}</div>
          <div class="status">${p.online ? `Active now · ${p.distance} away` : "Away"}</div>
        </button>
        <button class="icon-btn" data-suggest-meet="${p.id}" title="Suggest meeting IRL">📍</button>
      </div>
      <div class="bubbles">
        <div class="bubble-meta">Today</div>
        ${bubbles}
      </div>
      <div class="composer">
        <input id="composer-input" type="text" placeholder="Message ${p.name.split(" ")[0]}…" autocomplete="off" />
        <button class="send" id="composer-send" title="Send">
          <svg viewBox="0 0 24 24"><path d="M3 11.5 21 3l-7 18-2.8-7.2L3 11.5Z"/></svg>
        </button>
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
   MAP — the center of the app
   ============================================================ */

const MAP_FILTERS = [
  { id: "all", label: "Everyone" },
  { id: "friends", label: "Friends" },
  { id: "near", label: "Within 100 yds" },
  { id: "network", label: "Open to network" },
  { id: "date", label: "Open to date" },
];

function mapVisiblePeople() {
  return PEOPLE.filter((p) => {
    if (state.mapFilter === "friends") return p.friend;
    if (state.mapFilter === "near") return /yds/.test(p.distance);
    if (state.mapFilter === "network") return p.openTo.some((o) => /network|hiring|invest|founder/i.test(o));
    if (state.mapFilter === "date") return p.openTo.includes("Dating");
    return true;
  });
}

function renderMap() {
  const people = mapVisiblePeople();

  const pins = people
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

      ${state.ghost ? `
        <div class="ghost-banner">
          <div class="big">👻</div>
          <h3>Ghost Mode is on</h3>
          <p>You're invisible on the map, and the map is paused for you.<br/>Nobody can see your location until you come back.</p>
          <button class="btn btn-primary" data-ghost-off>Reappear</button>
        </div>` : ""}

      <div class="map-top">
        <button class="map-search" data-tab-jump="explore">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16.5 16.5 4 4"/></svg>
          Search people, classes, places…
        </button>
        <div class="map-filters">
          ${MAP_FILTERS.map(
            (f) => `<button class="map-filter ${state.mapFilter === f.id ? "on" : ""}" data-filter="${f.id}">${f.label}</button>`
          ).join("")}
        </div>
      </div>

      <button class="recenter-btn" data-recenter title="Recenter on you">
        <svg viewBox="0 0 24 24"><path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0-6a1 1 0 0 1 1 1v2.06A7 7 0 0 1 18.94 11H21a1 1 0 1 1 0 2h-2.06A7 7 0 0 1 13 18.94V21a1 1 0 1 1-2 0v-2.06A7 7 0 0 1 5.06 13H3a1 1 0 1 1 0-2h2.06A7 7 0 0 1 11 5.06V3a1 1 0 0 1 1-1Z"/></svg>
      </button>
      <button class="ghost-toggle ${state.ghost ? "on" : ""}" data-ghost title="Ghost mode">👻</button>

      <div class="map-bottom">
        <div class="map-count-pill"><b>${people.length} people</b> &amp; ${HOTSPOTS.length} hotspots around you</div>
      </div>
    </div>
  `;

  initMapPan();
}

function mapArtSVG() {
  // Stylized Harvard Square: paths, green spaces, the Charles
  return `
  <svg class="map-art" viewBox="0 0 1000 900" preserveAspectRatio="none">
    <rect width="1000" height="900" fill="#f1f3ef"/>
    <!-- city blocks -->
    <g fill="#e7eae4">
      <rect x="60" y="60" width="240" height="180" rx="10"/>
      <rect x="60" y="300" width="200" height="220" rx="10"/>
      <rect x="700" y="80" width="240" height="240" rx="10"/>
      <rect x="720" y="380" width="220" height="180" rx="10"/>
      <rect x="120" y="600" width="200" height="160" rx="10"/>
      <rect x="620" y="600" width="150" height="120" rx="10"/>
    </g>
    <!-- Harvard Yard -->
    <rect x="380" y="290" width="280" height="200" rx="16" fill="#d7e8d2"/>
    <rect x="430" y="335" width="60" height="40" rx="5" fill="#c3d9bc"/>
    <rect x="540" y="390" width="80" height="46" rx="5" fill="#c3d9bc"/>
    <!-- JFK / Cambridge common green -->
    <rect x="300" y="80" width="160" height="120" rx="14" fill="#dcebd7"/>
    <circle cx="380" cy="140" r="26" fill="#cfe2c8"/>
    <!-- streets -->
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
    <!-- the Charles -->
    <path d="M0 830 Q250 780 500 825 T1000 800 L1000 900 L0 900 Z" fill="#cfe5f2"/>
    <path d="M0 845 Q250 798 500 840 T1000 815" stroke="#bcd9ea" stroke-width="3" fill="none"/>
    <!-- bridge -->
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

  // Swallow pin clicks that were actually drags
  canvas.addEventListener("click", (e) => {
    if (moved) { e.stopPropagation(); moved = false; }
  }, true);
}

/* ============================================================
   EXPLORE — search + Beacons + Hotspots (the differentiator)
   ============================================================ */

function renderExplore(query = "") {
  const q = query.trim().toLowerCase();
  const matches = q
    ? PEOPLE.filter((p) =>
        [p.name, p.headline, p.school, p.work, p.sharedContext].join(" ").toLowerCase().includes(q)
      )
    : [];

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

  const hotspotRows = HOTSPOTS.map(
    (h) => `
    <button class="hotspot-row" data-hotspot="${h.id}">
      <span class="h-icon">${h.icon}</span>
      <span class="h-mid">
        <span class="h-name">${h.name}</span>
        <span class="h-sub">${h.sub}</span>
      </span>
      <span class="h-count">🔥 ${h.count}</span>
    </button>`
  ).join("");

  const suggested = PEOPLE.filter((p) => !p.friend);
  const personRow = (p) => `
    <button class="person-row" data-profile="${p.id}">
      ${avatarHTML(p, 46)}
      <span class="p-mid">
        <span class="p-name">${p.name} ${irlTag(p)}</span>
        <span class="p-sub">${p.sharedContext || p.headline}</span>
      </span>
      <span class="dist-tag">${p.distance}</span>
    </button>`;

  screen.innerHTML = `
    <header class="topbar">
      <h1>Explore</h1>
      <span class="chip accent">📍 Harvard Square</span>
    </header>

    <div class="search-wrap">
      <div class="search-bar">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16.5 16.5 4 4"/></svg>
        <input id="explore-search" type="text" placeholder="Search people, classes, companies, places…" value="${query.replace(/"/g, "&quot;")}" autocomplete="off"/>
      </div>
    </div>

    ${q ? `
      <div class="section-title"><h2>${matches.length} result${matches.length === 1 ? "" : "s"}</h2></div>
      ${matches.length ? matches.map(personRow).join("") : '<p class="empty-note">No one found — try a name, class, or company.</p>'}
    ` : `
      <button class="drop-beacon" data-drop-beacon>
        <span class="db-icon">🔆</span>
        <span>
          <span class="db-title">Drop a Beacon</span>
          <span class="db-sub">Tell people where you'll be — let them come say whats up</span>
        </span>
      </button>

      <div class="section-title"><h2>🔆 Live Beacons near you</h2><span class="see-all">${BEACONS.length} active</span></div>
      ${beaconCards}

      <div class="section-title"><h2>🔥 Hotspots right now</h2><button class="see-all" data-tab-jump="map">View on map</button></div>
      ${hotspotRows}

      <div class="section-title"><h2>You keep crossing paths with</h2></div>
      ${suggested.map(personRow).join("")}
      <p class="empty-note">Beacons expire after a few hours.<br/>This tab is a launchpad, not a feed — find your moment, then go.</p>
    `}
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

/* ============================================================
   PROFILES
   ============================================================ */

function profileBody(p, isMe) {
  const facts = [
    ["🎓", "School", p.school],
    ["💼", "Work", p.work],
    ["🏠", "Hometown", p.hometown],
    ["💙", "Status", p.relationship],
  ];

  return `
    <div class="photo-strip">
      ${p.photos.map((ph) => `<div class="ph" style="${photoBG(ph)}"><span>${ph.emoji} ${ph.caption}</span></div>`).join("")}
    </div>

    ${p.prompts.map((pr) => `
      <div class="prompt-card">
        <div class="pq">${pr.q}</div>
        <div class="pa">${pr.a}</div>
      </div>`).join("")}

    <div class="section-title"><h2>Details</h2></div>
    <div class="fact-list">
      ${facts.map(([icon, label, value]) => `
        <div class="fact"><span class="f-icon">${icon}</span><span class="f-label">${label}</span><span class="f-value">${value}</span></div>`).join("")}
    </div>

    ${(p.posts || []).length ? `
      <div class="section-title"><h2>Updates</h2></div>
      ${p.posts.map((post) => `
        <div class="prompt-card">
          ${post.promptQ ? `<div class="pq">${post.promptQ}</div>` : `<div class="pq">${post.time} ago</div>`}
          <div class="pa" style="font-size:14px;font-weight:500">${post.text}</div>
        </div>`).join("")}
    ` : ""}

    <div class="section-title"><h2>Elsewhere</h2></div>
    <div class="social-row">
      ${p.socials.map((s) => `<span class="social-pill">↗ ${s}</span>`).join("")}
    </div>
  `;
}

function renderProfile(id) {
  if (id === "me") { state.view = null; state.tab = "me"; renderMe(); return; }
  const p = byId(id);
  const requested = state.requested.has(p.id);

  screen.innerHTML = `
    <div class="sheet-back">
      <button class="back-btn" data-back>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>
      </button>
      <span class="chip">${p.online ? `🟢 ${p.distance} away` : "⚪ Away"}</span>
    </div>

    <div class="profile-hero" style="padding-top:4px">
      ${avatarHTML(p, 96)}
      <h2>${p.name} ${irlTag(p)}</h2>
      <div class="headline">${p.headline}</div>
      <div class="open-to">
        ${p.openTo.map((o) => `<span class="chip accent">${o}</span>`).join("")}
      </div>
      ${p.sharedContext ? `<div class="open-to"><span class="chip">✨ ${p.sharedContext}</span></div>` : ""}
    </div>

    <div class="profile-cta">
      ${p.friend
        ? `<button class="btn btn-ghost" disabled>Connected ✓</button>
           <button class="btn btn-primary" data-chat="${p.id}">Message</button>`
        : `<button class="btn ${requested ? "btn-ghost" : "btn-primary"}" data-connect="${p.id}">${requested ? "Requested ✓" : "Connect"}</button>
           <button class="btn btn-outline" data-wave="${p.id}">Wave 👋</button>`}
      <button class="btn btn-ghost" data-findonmap="${p.id}" title="Find on map">📍</button>
    </div>

    ${profileBody(p, false)}
    <div style="height:24px"></div>
  `;
}

/* ============================================================
   ME tab
   ============================================================ */

function renderMe() {
  const s = state.settings;
  screen.innerHTML = `
    <header class="topbar">
      <h1>Your profile</h1>
      <button class="icon-btn" data-edit-profile title="Edit">
        <svg viewBox="0 0 24 24"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3ZM13.5 6.5l3 3"/></svg>
      </button>
    </header>

    <div class="profile-hero" style="padding-top:14px">
      ${avatarHTML(ME, 96)}
      <h2>${ME.name}</h2>
      <div class="headline">${ME.headline}</div>
      <div class="open-to">${ME.openTo.map((o) => `<span class="chip accent">${o}</span>`).join("")}</div>
    </div>

    <div class="profile-stats">
      <div class="stat"><b>${ME.stats.connections}</b><span>Connections</span></div>
      <div class="stat irl"><b>${ME.stats.irlMeets}</b><span>IRL meets ✓</span></div>
      <div class="stat"><b>${ME.stats.beacons}</b><span>Beacons dropped</span></div>
    </div>

    <div class="profile-cta">
      <button class="btn btn-primary" data-new-post>+ New post</button>
      <button class="btn btn-ghost" data-edit-profile>Edit profile</button>
    </div>

    ${profileBody(ME, true)}

    <div class="section-title"><h2>Privacy &amp; visibility</h2></div>
    <div class="settings-list">
      <button class="setting-row" data-ghost>
        <span class="s-icon">👻</span>
        <span class="s-label">Ghost Mode<span class="s-sub">Disappear from the map instantly</span></span>
        <span class="switch ${state.ghost ? "on" : ""}"></span>
      </button>
      <button class="setting-row" data-setting="precise">
        <span class="s-icon">🎯</span>
        <span class="s-label">Precise location<span class="s-sub">Off = friends see neighborhood only</span></span>
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
      <button class="setting-row" data-soon="Who can see me">
        <span class="s-icon">👁️</span>
        <span class="s-label">Who can see me<span class="s-sub">Everyone · Connections · Nobody</span></span>
        <span class="s-chev">›</span>
      </button>
      <button class="setting-row" data-soon="Blocked & hidden">
        <span class="s-icon">🚫</span>
        <span class="s-label">Blocked &amp; hidden people</span>
        <span class="s-chev">›</span>
      </button>
      <button class="setting-row" data-soon="Account settings">
        <span class="s-icon">⚙️</span>
        <span class="s-label">Account settings</span>
        <span class="s-chev">›</span>
      </button>
    </div>

    <p class="empty-note" style="padding-top:0">whatsup v0.1 — start online, meet in person. 💙</p>
  `;
}

/* ============================================================
   Global click delegation
   ============================================================ */

screen.addEventListener("click", (e) => {
  const t = (sel) => e.target.closest(sel);
  let el;

  if ((el = t("[data-back]"))) return closeView();
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
    state.pan = { x: 0, y: 0 };
    setTab("map");
    return toast(`📍 ${p.name.split(" ")[0]} is ${p.distance} away`);
  }

  if ((el = t("[data-filter]"))) {
    state.mapFilter = el.dataset.filter;
    return renderMap();
  }

  if ((el = t("[data-recenter]"))) {
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
    toast(state.ghost ? "👻 Ghost Mode on — you're invisible" : "You're back on the map");
    return state.tab === "map" ? renderMap() : renderMe();
  }
  if ((el = t("[data-ghost-off]"))) {
    state.ghost = false;
    toast("You're back on the map");
    return renderMap();
  }

  if ((el = t("[data-setting]"))) {
    const key = el.dataset.setting;
    state.settings[key] = !state.settings[key];
    return renderMe();
  }

  if ((el = t("[data-connect]"))) {
    const p = byId(el.dataset.connect);
    state.requested.add(p.id);
    toast(`Connection request sent to ${p.name.split(" ")[0]}`);
    return renderProfile(p.id);
  }

  if ((el = t("[data-wave]"))) {
    const p = byId(el.dataset.wave);
    return toast(`👋 You waved at ${p.name.split(" ")[0]} — now go say whats up!`);
  }

  if ((el = t("[data-join-beacon]"))) {
    const b = BEACONS.find((x) => x.id === el.dataset.joinBeacon);
    const p = byId(b.personId);
    if (state.joinedBeacons.has(b.id)) {
      state.joinedBeacons.delete(b.id);
      toast("You backed out 😶 — no worries");
    } else {
      state.joinedBeacons.add(b.id);
      toast(`🔆 You're in! ${p.name.split(" ")[0]} can see you're coming`);
    }
    return renderExplore(document.getElementById("explore-search")?.value || "");
  }

  if ((el = t("[data-hotspot]"))) {
    const h = HOTSPOTS.find((x) => x.id === el.dataset.hotspot);
    state.pan = { x: 0, y: 0 };
    setTab("map");
    return toast(`🔥 ${h.name} — ${h.count} people there now`);
  }

  if ((el = t("[data-drop-beacon]"))) {
    return toast("🔆 Beacon composer coming in v0.2 — pick a spot, a vibe, a window");
  }

  if ((el = t("[data-suggest-meet]"))) {
    const p = byId(el.dataset.suggestMeet);
    return toast(`📍 Meetup suggestion sent to ${p.name.split(" ")[0]}`);
  }

  if ((el = t("[data-accept-meet]"))) {
    return toast("📍 You're in! Added to both your maps for Friday");
  }

  if ((el = t("[data-new-post]"))) return toast("📝 Post composer coming in v0.2");
  if ((el = t("[data-edit-profile]"))) return toast("✏️ Profile editor coming in v0.2");
  if ((el = t("[data-soon]"))) return toast(`${el.dataset.soon} — coming in v0.2`);
});

/* ---------- boot ---------- */
render();
