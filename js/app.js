/* ============================================================
   WhatsUp — Prototype v2 app logic

   One rule: no chat without consent.
   Two dials: tap visibility (blind vs visible) and chat
   trigger (meet vs tap-back). Everything else follows.
   ============================================================ */

const screen = document.getElementById("screen");
const tabbar = document.getElementById("tabbar");
const appEl = document.getElementById("app");

const state = {
  tab: "here",
  view: null,          // {type:'person'|'chat'|'govisible'|'notifs'|'beacon'|'camera'|'edit'|'preview', ...}
  session: null,       // {mode, endsAt|null, startedAt}
  partyTapsUsed: 0,    // active party taps tonight (cap 3)
  confTapsUsed: 1,     // conference taps today (cap 20) — 1 seeded
  blocked: new Set(),
  settings: { defaultDur: "2h", notifMutual: true, notifNearby: true, quietHours: false },
  staged: [],          // pending setTimeout ids for scripted notifs
};

/* ============================================================
   helpers
   ============================================================ */

const byId = (id) => PEOPLE.find((p) => p.id === id);
const venueOf = (p) => VENUES[p.venue];
const mode = () => state.session?.mode || null;
const myVenue = () => (state.session ? VENUES[MODE_VENUE[state.session.mode]] : null);
const inMyRadius = (p) => !!state.session && p.venue === MODE_VENUE[state.session.mode];
const isMutual = (p) => p.tappedByMe && p.tappedMe && !p.met;
const chatUnlocked = (p) => !!p.met || !!p.chatUnlocked;

function dotState(p) {
  if (p.met) return "gold";
  if (isMutual(p) && inMyRadius(p)) return "pulse";
  return "grey";
}

function grad(palette) {
  const [a, b] = PALETTES[palette] || PALETTES.sky;
  return `linear-gradient(135deg, ${a}, ${b})`;
}

function avatarHTML(person, size, extra = "") {
  return `<span class="avatar ${extra}" style="width:${size}px;height:${size}px;background-image:${grad(person.palette)};font-size:${Math.round(size * 0.36)}px">${person.initials}</span>`;
}

function esc(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
}

let toastTimer = null;
function toast(msg) {
  document.querySelectorAll(".toast").forEach((t) => t.remove());
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  appEl.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2600);
}

function firstName(p) { return p.name.split(" ")[0]; }

/* Coarse location copy — never precise pre-meet */
function whereLine(p) {
  if (!inMyRadius(p)) return venueOf(p) ? `At ${venueOf(p).name}` : "Not visible right now";
  if (mode() === "party" || mode() === "conference") return `Somewhere at ${myVenue().name}`;
  return p.dist <= 30 ? "In this room" : "In this building";
}

/* ============================================================
   notifications — banner + bell feed
   ============================================================ */

function unreadNotifs() { return NOTIFS.filter((n) => n.unread).length; }

function notify(n) {
  n.id = n.id || `n-${Date.now()}`;
  n.time = "Now";
  n.unread = true;
  NOTIFS.unshift(n);
  showBanner(n);
  render();
}

function showBanner(n) {
  document.querySelectorAll(".banner").forEach((b) => b.remove());
  const el = document.createElement("div");
  el.className = "banner";
  el.innerHTML = `
    <span class="b-icon">${n.icon}</span>
    <span class="b-body"><b>${esc(n.title)}</b><span>${esc(n.body)}</span></span>`;
  el.addEventListener("click", () => {
    el.remove();
    state.view = { type: "notifs" };
    render();
  });
  appEl.appendChild(el);
  setTimeout(() => { el.classList.add("out"); setTimeout(() => el.remove(), 400); }, 4200);
}

function bellHTML() {
  const n = unreadNotifs();
  return `
    <button class="icon-btn bell" data-notifs title="Notifications">
      <svg viewBox="0 0 24 24"><path d="M12 3a6 6 0 0 1 6 6v3.3l1.6 2.9a.8.8 0 0 1-.7 1.2H5.1a.8.8 0 0 1-.7-1.2L6 12.3V9a6 6 0 0 1 6-6Zm-2 15h4a2 2 0 0 1-4 0Z"/></svg>
      ${n ? `<em class="bell-badge">${n}</em>` : ""}
    </button>`;
}

/* staged (scripted) notifications per session */
function stage(ms, fn) { state.staged.push(setTimeout(fn, ms)); }
function clearStaged() { state.staged.forEach(clearTimeout); state.staged = []; }

function stageSessionNotifs(m) {
  clearStaged();
  if (m === "everyday") {
    stage(3500, () => notify({
      icon: "⭐", title: "Theo is at Hodges",
      body: "You met at TRECS in January — he's a floor away.",
    }));
    stage(11000, () => notify({
      icon: "💙", title: "Mutual with Jake",
      body: "You tapped him at ECON 101 in September. He's in this room — go say hi.",
    }));
  }
  if (m === "party") {
    stage(4000, () => {
      const riley = byId("riley");
      riley.tappedMe = true;
      notify({ icon: "👀", title: "Riley tapped you", body: "No pressure. Tap back, walk over, or let it expire — they'll never know." });
    });
    stage(14000, () => notify({
      icon: "🔁", title: "Sarah from Theta is nearby",
      body: "You both opted in after last time. She's at Pres Pub.",
    }));
    stage(26000, () => notify({
      icon: "⏳", title: "Tonight's taps expire at 6am",
      body: "Anything that didn't become a meet disappears. As designed.",
    }));
  }
  if (m === "conference") {
    stage(3000, () => {
      const n = PEOPLE.filter((p) => p.tappedMe && p.tapMode === "conference" && !p.met).length;
      notify({ icon: "💼", title: `${n} people want to connect with you`, body: "Tap back to unlock chat, or just walk over." });
    });
  }
}

/* ============================================================
   visibility sessions
   ============================================================ */

const DURATIONS = [
  { id: "1h", label: "1 hour", ms: 3600e3 },
  { id: "2h", label: "2 hours", ms: 7200e3 },
  { id: "4h", label: "4 hours", ms: 14400e3 },
  { id: "tonight", label: "Until tonight", ms: null }, // computed
  { id: "inf", label: "Indefinite", ms: Infinity },
];

function goVisible(m, durId) {
  const d = DURATIONS.find((x) => x.id === durId);
  let endsAt;
  if (d.id === "inf") endsAt = null;
  else if (d.id === "tonight") { const t = new Date(); t.setHours(23, 59, 0, 0); endsAt = t.getTime(); }
  else endsAt = Date.now() + d.ms;

  state.session = { mode: m, endsAt, startedAt: Date.now() };
  state.view = null;
  state.tab = "here";
  stageSessionNotifs(m);
  render();
  toast(`You're visible · ${MODE_META[m].label} mode`);
}

function endSession() {
  state.session = null;
  clearStaged();
  render();
  toast("You're invisible again");
}

function timeLeftLabel() {
  const s = state.session;
  if (!s) return "";
  if (s.endsAt === null) return "∞ · no timer";
  const ms = s.endsAt - Date.now();
  if (ms <= 0) { endSession(); return ""; }
  const h = Math.floor(ms / 3600e3);
  const m = Math.floor((ms % 3600e3) / 60e3);
  return h > 0 ? `${h}:${String(m).padStart(2, "0")} left` : `${m}m left`;
}

setInterval(() => {
  const el = document.getElementById("session-timer");
  if (el && state.session) el.textContent = timeLeftLabel();
}, 1000);

/* ============================================================
   taps — mode rules and caps
   ============================================================ */

function everydayTapsOut() {
  return PEOPLE.filter((p) => p.tappedByMe && p.tapMode === "everyday" && !isMutual(p) && !p.met).length;
}

function capLine() {
  const m = mode();
  if (m === "everyday") return `${everydayTapsOut()} of 10 taps out`;
  if (m === "party") return `${state.partyTapsUsed} of 3 taps used tonight`;
  if (m === "conference") return `${state.confTapsUsed} of 20 taps today`;
  return "";
}

function tapPerson(p) {
  const m = mode();
  if (!m) return toast("Go visible first — taps work both ways");

  if (p.tappedByMe) return untapPerson(p);

  // caps
  if (m === "everyday" && everydayTapsOut() >= 10)
    return toast("10 taps out — untap someone to free a slot");
  if (m === "party" && state.partyTapsUsed >= 3)
    return toast("3 taps a night. That's the whole point.");
  if (m === "conference" && state.confTapsUsed >= 20)
    return toast("20 taps today — that's the cap");

  p.tappedByMe = true;
  p.tapMode = m;
  p.tapAt = `${myVenue().name} · just now`;
  if (m === "party") state.partyTapsUsed++;
  if (m === "conference") state.confTapsUsed++;

  // conference: if they already tapped you, your tap IS the tap-back → chat unlocks
  if (m === "conference" && p.tappedMe && !chatUnlocked(p)) {
    unlockChat(p, "tapback");
    render();
    return toast(`Chat with ${firstName(p)} unlocked — you both consented`);
  }

  if (p.tappedMe && !p.met) {
    notify({ icon: "💙", title: `You and ${firstName(p)} both tapped`, body: p.icebreaker || "Go say hi." });
  } else if (m === "everyday") {
    toast(`Tapped. ${firstName(p)} won't know unless they tap you too.`);
  } else if (m === "party") {
    toast(`Tapped — ${firstName(p)} will see it. You'll never know if they did.`);
  } else {
    toast(`${firstName(p)} will see you want to connect.`);
  }

  // scripted demo tap-backs
  if (p.demoTapBack && !p.tappedMe) {
    const id = p.id;
    stage(m === "everyday" ? 4500 : 5000, () => {
      const q = byId(id);
      if (!q.tappedByMe) return; // untapped meanwhile
      q.tappedMe = true;
      if (mode() === "conference") {
        unlockChat(q, "tapback");
        notify({ icon: "💬", title: `${firstName(q)} tapped back`, body: "Chat unlocked — that's the consent. Say where you are." });
      } else {
        notify({ icon: "💙", title: `You and ${firstName(q)} both tapped`, body: `${q.icebreaker || "She's in this room — go say hi."}` });
      }
      render();
    });
  }
  render();
}

function untapPerson(p) {
  p.tappedByMe = false;
  if (p.tapMode === "party") state.partyTapsUsed = Math.max(0, state.partyTapsUsed - 1);
  p.tapMode = null;
  render();
  toast(`Untapped. ${firstName(p)} never knew.`);
}

/* ============================================================
   the meet — bump, gold, ledger
   ============================================================ */

function unlockChat(p, via) {
  p.chatUnlocked = true;
  if (!CHATS.find((c) => c.personId === p.id)) {
    CHATS.unshift({
      personId: p.id, unread: false, time: "Now", via,
      messages: [],
    });
  }
}

function registerMeet(p, where) {
  p.met = true;
  p.tappedByMe = false;
  p.tappedMe = false;
  const m = mode();
  const how = m === "party" ? "Party · mutual tap" : m === "conference" ? "Conference · bump" : "Everyday · double-blind mutual";
  LEDGER.unshift({ personId: p.id, where, date: "Just now", how, crossed: 1 });
  unlockChat(p, "meet");
}

function showBump(p) {
  const overlay = document.createElement("div");
  overlay.className = "bump-overlay";
  overlay.innerHTML = `
    <div class="bump-rings"><i></i><i></i><i></i></div>
    <div class="bump-phones">🤜🤛</div>`;
  appEl.appendChild(overlay);

  setTimeout(() => {
    registerMeet(p, myVenue() ? myVenue().name : "Right here");
    overlay.innerHTML = `
      <div class="bump-card">
        <div class="bump-burst">✦</div>
        ${avatarHTML(p, 84, "gold-ring")}
        <h2>You met ${firstName(p)}.</h2>
        <p>Chat is open. ${firstName(p)} is gold everywhere now — and this moment is in both your ledgers.</p>
        <button class="btn btn-gold" data-bump-chat="${p.id}">Open chat</button>
        <button class="btn btn-ghost" data-bump-done>Done — back to the room</button>
      </div>`;
  }, 1500);

  overlay.addEventListener("click", (e) => {
    const c = e.target.closest("[data-bump-chat]");
    const d = e.target.closest("[data-bump-done]");
    if (c) { overlay.remove(); openChat(c.dataset.bumpChat); }
    else if (d) { overlay.remove(); render(); }
  });
}

/* morning-after confirm */
function confirmMeet(personId, yes) {
  const n = NOTIFS.find((x) => x.action === "confirm-meet" && x.personId === personId);
  if (n) { n.action = null; n.unread = false; }
  if (!yes) { render(); return toast("Okay — nothing saved, nothing shared."); }
  const p = byId(personId);
  p.met = true;
  LEDGER.unshift({ personId: p.id, where: "Sigma Chi", date: "Last night", how: "Party · both confirmed the meet", crossed: 1 });
  unlockChat(p, "meet");
  render();
  toast(`It counts — ${firstName(p)} is gold now`);
}

/* ============================================================
   navigation / render root
   ============================================================ */

function setTab(tab) { state.tab = tab; state.view = null; render(); }
function openPerson(id) { state.view = { type: "person", id }; render(); }
function openChat(id) {
  const chat = CHATS.find((c) => c.personId === id);
  if (chat) chat.unread = false;
  state.view = { type: "chat", id };
  render();
}
function closeView() { state.view = null; render(); }

function render() {
  tabbar.querySelectorAll(".tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === state.tab && !state.view);
  });
  const unread = CHATS.filter((c) => c.unread).length;
  const badge = document.getElementById("msg-badge");
  badge.style.display = unread ? "" : "none";
  badge.textContent = unread;

  screen.classList.remove("fade-in");
  void screen.offsetWidth;

  const v = state.view;
  if (v?.type === "person") renderPerson(v.id);
  else if (v?.type === "chat") renderChat(v.id);
  else if (v?.type === "govisible") renderGoVisible();
  else if (v?.type === "notifs") renderNotifs();
  else if (v?.type === "beacon") renderBeacon(v.id);
  else if (v?.type === "dropbeacon") renderDropBeacon();
  else if (v?.type === "camera") renderCamera();
  else if (v?.type === "edit") renderEdit(v.mode);
  else if (v?.type === "preview") renderPreview(v.mode);
  else if (state.tab === "here") renderHere();
  else if (state.tab === "map") renderMap();
  else if (state.tab === "chats") renderChats();
  else if (state.tab === "you") renderYou();

  screen.classList.add("fade-in");
  if (v?.type !== "chat") screen.scrollTop = 0;
}

tabbar.addEventListener("click", (e) => {
  const btn = e.target.closest(".tab");
  if (btn) setTab(btn.dataset.tab);
});

/* ============================================================
   HERE — the room grid
   ============================================================ */

function heroHTML() {
  if (!state.session) {
    return `
      <div class="vis-hero off">
        <div class="vh-state">You're invisible</div>
        <div class="vh-sub">Nobody can see you. You can't see anyone.<br/>That's the deal — visibility is mutual.</div>
        <button class="vis-switch" data-go-visible><span class="knob"></span></button>
        <div class="vh-cta">Flip on to see who's here</div>
      </div>`;
  }
  const m = MODE_META[state.session.mode];
  return `
    <div class="vis-hero on ${state.session.endsAt === null ? "inf" : ""}">
      <div class="vh-row">
        <span class="vh-live"><i></i>Visible</span>
        <span class="vh-mode">${m.icon} ${m.label}</span>
        <span class="vh-timer" id="session-timer">${timeLeftLabel()}</span>
      </div>
      <div class="vh-sub on-sub">${capLine()}${state.session.endsAt === null ? " · indefinite session — you chose this" : ""}</div>
      <button class="vh-end" data-end-session>End session</button>
    </div>`;
}

function gridCard(p) {
  const d = dotState(p);
  const m = p.mode;
  const line = m === "party" ? p.vibe : m === "conference" ? `${p.firm} · ${p.role}` : (p.line || "");
  return `
    <button class="grid-card ${d}" data-person="${p.id}">
      <span class="dot-tag ${d}">${d === "gold" ? "Met" : d === "pulse" ? "Mutual — go say hi" : ""}</span>
      ${avatarHTML(p, 62, d === "gold" ? "gold-ring" : d === "pulse" ? "pulse-ring" : "")}
      <span class="g-name">${firstName(p)}${p.tappedMe && (m === "party" || m === "conference") && !p.met ? " 👀" : ""}</span>
      <span class="g-line">${esc(line)}</span>
      ${p.tappedByMe && !p.met && !isMutual(p) ? '<span class="g-tapped">Tapped</span>' : ""}
    </button>`;
}

function renderHere() {
  const venue = myVenue();
  let body;

  if (!state.session) {
    body = `
      <div class="invisible-note">
        <div class="big">🫥</div>
        <p>The room is full of people you can't see —<br/>because they can't see you either.</p>
      </div>`;
  } else {
    const people = PEOPLE
      .filter((p) => inMyRadius(p) && !state.blocked.has(p.id))
      .sort((a, b) => {
        const w = (x) => (dotState(x) === "pulse" ? -1000 : 0) + x.dist;
        return w(a) - w(b);
      });
    const m = state.session.mode;
    body = `
      <div class="room-head">
        <h2>${venue.count} people open at ${venue.name}</h2>
        <span>Showing the ${people.length} closest · ${MODE_META[m].tapRule}</span>
      </div>
      <div class="room-grid">${people.map(gridCard).join("")}</div>
      ${m === "everyday" && byId("maya") && !byId("maya").tappedByMe && !byId("maya").met
        ? `<p class="demo-hint">Demo: tap <b>Maya</b> — she'll tap you back, then bump phones to register the meet.</p>` : ""}
      ${m === "party" ? `
        <button class="camera-fab" data-camera title="The night camera">📸</button>
        <p class="empty-note">Tonight's taps and posts vanish at 6am.<br/>Only meets are forever.</p>` : ""}
      ${m === "conference" ? `<p class="empty-note">Tap-backs unlock chat here — it's for logistics.<br/>"Near the coffee station, navy blazer."</p>` : ""}
    `;
  }

  screen.innerHTML = `
    <div class="page-col">
      <header class="topbar">
        <div class="wordmark"><img class="wordmark-logo" src="img/logo.svg" alt=""/>whats<span>up</span></div>
        ${bellHTML()}
      </header>
      ${heroHTML()}
      ${body}
    </div>`;
}

/* ============================================================
   go visible flow — mode → duration
   ============================================================ */

function renderGoVisible() {
  screen.innerHTML = `
    <div class="page-col">
      <div class="sheet-back">
        <button class="back-btn" data-back><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
        <span class="chip">Go visible</span>
      </div>
      <div class="edit-wrap">
        <h2 class="edit-title">Where are you?</h2>
        <p class="edit-sub">Pick a mode — it decides how taps work and which profile people see. One mode at a time.</p>

        <div class="mode-cards" id="gv-modes">
          ${Object.entries(MODE_META).map(([id, m], i) => `
            <button class="mode-card ${i === 0 ? "on" : ""}" data-mode="${id}">
              <span class="mc-icon">${m.icon}</span>
              <span class="mc-body">
                <span class="mc-name">${m.label}</span>
                <span class="mc-blurb">${m.blurb}</span>
                <span class="mc-cap">${m.capLabel}</span>
              </span>
            </button>`).join("")}
        </div>

        <h3 class="gv-h">For how long?</h3>
        <div class="chip-select" id="gv-dur">
          ${DURATIONS.map((d) => `<span class="chip ${d.id === "2h" ? "on" : ""}" data-dur="${d.id}">${d.label}</span>`).join("")}
        </div>
        <p class="gv-note" id="gv-note">Two hours, then you fade out automatically.</p>

        <button class="btn btn-primary btn-wide" data-confirm-visible>Go visible</button>
        <p class="empty-note" style="padding:18px 0 0">Visibility is mutual — flipping this on is what lets you see the room.<br/>End it anytime with one tap.</p>
      </div>
    </div>`;

  document.getElementById("gv-modes").addEventListener("click", (e) => {
    const c = e.target.closest(".mode-card");
    if (!c) return;
    document.querySelectorAll("#gv-modes .mode-card").forEach((x) => x.classList.remove("on"));
    c.classList.add("on");
  });
  document.getElementById("gv-dur").addEventListener("click", (e) => {
    const c = e.target.closest(".chip");
    if (!c) return;
    document.querySelectorAll("#gv-dur .chip").forEach((x) => x.classList.remove("on"));
    c.classList.add("on");
    const notes = {
      "1h": "One hour, then you fade out automatically.",
      "2h": "Two hours, then you fade out automatically.",
      "4h": "Four hours, then you fade out automatically.",
      tonight: "You'll fade out at midnight.",
      inf: "No timer. A subtle indicator stays on so it's never an accident.",
    };
    document.getElementById("gv-note").textContent = notes[c.dataset.dur];
  });
}

/* ============================================================
   person sheet
   ============================================================ */

function personStatusStrip(p) {
  if (p.met) {
    const l = LEDGER.find((x) => x.personId === p.id);
    return `<div class="strip gold-strip">★ Met at ${esc(l?.where || "—")} · ${esc(l?.date || "")} · crossed paths ${l?.crossed || 1}× since</div>`;
  }
  if (isMutual(p)) {
    return `
      <div class="strip pulse-strip">💙 You both tapped — ${inMyRadius(p) ? "and you're in the same room right now" : "you'll pulse when you're in the same radius"}.</div>
      ${p.icebreaker ? `<div class="icebreaker"><span>Icebreaker</span>${esc(p.icebreaker)}</div>` : ""}`;
  }
  if (p.tappedMe && (mode() === "party" || mode() === "conference")) {
    return `<div class="strip pulse-strip">👀 ${firstName(p)} tapped you. Tap back, walk over, or let it quietly expire — they'll never know which.</div>`;
  }
  if (p.tappedByMe) {
    const rule = p.tapMode === "everyday"
      ? "They don't know. They never will, unless they tap you too."
      : "They can see it. Whether they've seen it — you'll never know.";
    return `<div class="strip grey-strip">Tapped ${p.tapAt ? `· ${esc(p.tapAt)}` : ""} — ${rule}</div>`;
  }
  return "";
}

function personCardFields(p) {
  if (p.mode === "conference") {
    return `
      <div class="fact-list">
        <div class="fact"><span class="f-icon">🏢</span><span class="f-label">Firm</span><span class="f-value">${esc(p.firm)}</span></div>
        <div class="fact"><span class="f-icon">💼</span><span class="f-label">Role</span><span class="f-value">${esc(p.role)}</span></div>
      </div>
      <div class="prompt-card"><div class="pq">Ask me about</div><div class="pa">${esc(p.ask)}</div></div>`;
  }
  if (p.mode === "party") {
    return `
      <div class="prompt-card"><div class="pq">Tonight's vibe</div><div class="pa">${esc(p.vibe)}</div></div>
      <div class="prompt-card"><div class="pq">${p.prompt?.startsWith("Hot take") ? "Hot take" : "Two truths & a lie"}</div><div class="pa">${esc((p.prompt || "").replace(/^(Hot take: |Two truths & a lie: )/, ""))}</div></div>`;
  }
  return `
    <div class="prompt-card"><div class="pq">Ask me about</div><div class="pa">${esc(p.ask)}</div></div>
    ${p.extra ? `<div class="prompt-card"><div class="pq">Context</div><div class="pa">${esc(p.extra)}</div></div>` : ""}`;
}

function renderPerson(id) {
  const p = byId(id);
  if (!p) return closeView();
  const d = dotState(p);
  const m = mode();
  const here = inMyRadius(p);

  let ctas = "";
  if (chatUnlocked(p)) {
    ctas = `<button class="btn btn-gold" data-open-chat="${p.id}">Message</button>`;
    if (here && !p.met) ctas += `<button class="btn btn-primary" data-bump="${p.id}">🤜🤛 Bump</button>`;
  } else if (here && m) {
    const tapLabel = p.tappedByMe
      ? "Untap"
      : p.tappedMe && m === "conference" ? "Tap back — unlocks chat"
      : p.tappedMe && m === "party" ? "Tap back"
      : "Tap";
    ctas = `
      <button class="btn ${p.tappedByMe ? "btn-ghost" : "btn-primary"}" data-tap="${p.id}">${tapLabel}</button>
      <button class="btn btn-outline" data-bump="${p.id}">🤜🤛 Bump</button>`;
  } else if (!m) {
    ctas = `<button class="btn btn-ghost" data-go-visible>Go visible to interact</button>`;
  }

  const lockNote = chatUnlocked(p) ? "" : m === "conference"
    ? `<p class="lock-note">🔒 Chat unlocks when ${firstName(p)} taps back. That's the consent.</p>`
    : `<p class="lock-note">🔒 Chat unlocks when you meet in person. You're ${here ? "in the same room — go" : "not nearby"}.</p>`;

  screen.innerHTML = `
    <div class="page-col">
      <div class="sheet-back">
        <button class="back-btn" data-back><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
        <span class="chip ${d === "gold" ? "gold" : d === "pulse" ? "accent" : ""}">${esc(whereLine(p))}</span>
      </div>

      <div class="profile-hero" style="padding-top:4px">
        ${avatarHTML(p, 96, d === "gold" ? "gold-ring" : d === "pulse" ? "pulse-ring" : "")}
        <h2>${esc(p.name)}</h2>
        <div class="headline">${esc(p.mode === "conference" ? `${p.firm} · ${p.role}` : p.line)}</div>
      </div>

      ${personStatusStrip(p)}
      <div class="profile-cta">${ctas}</div>
      ${m && here && !chatUnlocked(p) ? `<p class="cap-line">${capLine()}</p>` : ""}
      ${lockNote}
      ${personCardFields(p)}

      <div class="block-zone">
        <button class="block-btn" data-block="${p.id}">${state._blockArm === p.id ? "Tap again to confirm — permanent" : `Block ${firstName(p)}`}</button>
        <p>One strike. They never see you again, anywhere. No notice is sent.</p>
      </div>
      <div style="height:24px"></div>
    </div>`;
}

/* ============================================================
   MAP — beacons only. Events, headcounts, and (for venues)
   which of your met people are there. Never anyone's position.
   ============================================================ */

function friendsAt(venueId) {
  if (!state.session) return [];
  return PEOPLE.filter((p) => p.met && p.venue === venueId && !state.blocked.has(p.id));
}

function renderMap() {
  const visible = !!state.session;
  const beacons = Object.values(VENUES).map((v) => {
    const isHere = visible && MODE_VENUE[state.session.mode] === v.id;
    const friends = friendsAt(v.id).length;
    const mutualHere = visible && PEOPLE.some((p) => isMutual(p) && p.venue === v.id);
    return `
      <button class="beacon ${v.kind === "party" ? "party" : ""} ${isHere ? "here" : ""} ${v.mine ? "mine" : ""}" data-beacon="${v.id}" style="left:${v.x}%;top:${v.y}%">
        <span class="bcn-glow"></span>
        <span class="bcn-icon">${v.icon}</span>
        <span class="bcn-name">${esc(v.name)}</span>
        <span class="bcn-count">${v.count} open${friends ? ` · <i class="bf">★ ${friends}</i>` : ""}</span>
        ${mutualHere ? '<span class="bcn-pulse"></span>' : ""}
        ${v.mine ? '<span class="bcn-you">Your beacon</span>' : isHere ? '<span class="bcn-you">You</span>' : ""}
      </button>`;
  }).join("");

  screen.innerHTML = `
    <div class="map-screen">
      ${campusSVG()}
      ${beacons}
      <div class="map-top">
        <div class="map-title">
          <h1>Beacons</h1>
          ${bellHTML()}
        </div>
      </div>
      <button class="beacon-fab" data-drop-beacon title="Drop a live beacon">＋</button>
      <div class="map-bottom">
        ${visible
          ? `<div class="map-count-pill">Beacons show the event, a headcount, and <b>★ your people</b> there.<br/>Never anyone's exact location.</div>`
          : `<div class="map-count-pill dim">You're invisible — counts only. <b data-go-visible style="cursor:pointer">Go visible</b> to see which beacons have your people.</div>`}
      </div>
    </div>`;
}

function campusSVG() {
  return `
  <svg class="map-art" viewBox="0 0 1000 900" preserveAspectRatio="xMidYMid slice">
    <rect width="1000" height="900" fill="#f1f3ef"/>
    <g fill="#e7eae4">
      <rect x="70" y="70" width="230" height="170" rx="10"/>
      <rect x="80" y="320" width="190" height="200" rx="10"/>
      <rect x="700" y="90" width="230" height="220" rx="10"/>
      <rect x="730" y="420" width="200" height="170" rx="10"/>
      <rect x="140" y="620" width="190" height="150" rx="10"/>
      <rect x="600" y="620" width="160" height="120" rx="10"/>
    </g>
    <rect x="380" y="270" width="270" height="190" rx="16" fill="#d7e8d2"/>
    <rect x="300" y="90" width="150" height="110" rx="14" fill="#dcebd7"/>
    <circle cx="380" cy="150" r="24" fill="#cfe2c8"/>
    <g stroke="#ffffff" fill="none" stroke-linecap="round">
      <path d="M0 260 H1000" stroke-width="22"/>
      <path d="M0 530 H1000" stroke-width="26"/>
      <path d="M330 0 V820" stroke-width="22"/>
      <path d="M680 0 V760" stroke-width="22"/>
      <path d="M0 690 Q300 650 520 690 T1000 650" stroke-width="20"/>
    </g>
    <path d="M0 830 Q250 780 500 825 T1000 800 L1000 900 L0 900 Z" fill="#cfe5f2"/>
    <text x="500" y="868" text-anchor="middle" font-size="22" font-style="italic" fill="#6fa7c9" font-family="inherit">Tennessee River</text>
  </svg>`;
}

/* ----- beacon sheet ----- */

function renderBeacon(id) {
  const v = VENUES[id];
  if (!v) return closeView();
  const golds = friendsAt(id);
  const posts = (v.posts || []).map((po) => `
    <div class="night-post" style="background-image:${grad(po.palette)}">
      <span class="np-cap">${esc(po.caption)}</span>
      <span class="np-by">${esc(po.by)} · ${esc(po.time)} ago · gone by 6am</span>
    </div>`).join("");

  screen.innerHTML = `
    <div class="page-col">
      <div class="sheet-back">
        <button class="back-btn" data-back><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
        <span class="chip ${v.mine ? "gold" : "accent"}">${v.mine ? `● Your beacon · live${v.ends ? ` · ends ${v.ends}` : ""}` : "Live beacon"}</span>
      </div>
      <div class="beacon-hero">
        <div class="bh-icon">${v.icon}</div>
        <h2>${esc(v.name)}</h2>
        <div class="bh-count">${v.count} ${v.count === 1 ? "person" : "people"} open right now</div>
        <div class="bh-sub">${esc(v.sub)}</div>
        ${v.mine ? `<button class="btn btn-ghost" style="margin-top:14px" data-end-beacon="${v.id}">End beacon</button>` : ""}
      </div>

      ${golds.length ? `
        <div class="section-title"><h2>Your people there</h2><span class="see-all">★ ${golds.length}</span></div>
        ${golds.map((p) => `
          <button class="person-row" data-person="${p.id}">
            ${avatarHTML(p, 46, "gold-ring")}
            <span class="p-mid"><span class="p-name">${esc(p.name)}</span><span class="p-sub">★ Met · ${esc(LEDGER.find((l) => l.personId === p.id)?.where || "")}</span></span>
          </button>`).join("")}` : ""}
      ${!state.session && !v.mine ? `<p class="empty-note" style="padding-bottom:0"><b data-go-visible style="cursor:pointer;color:var(--accent-deep)">Go visible</b> to see which of your people are here.</p>` : ""}

      ${posts ? `
        <div class="section-title"><h2>Tonight at ${esc(v.name)}</h2><span class="see-all">expires 6am</span></div>
        <div class="night-feed">${posts}</div>` : ""}

      <p class="empty-note">Beacons show the event, the headcount, and people you've already met.<br/>Everyone else? You'll see them when you're in the room.</p>
    </div>`;
}

/* ----- drop a live beacon ----- */

const BEACON_ICONS = ["🎉", "📚", "☕", "🏀", "🎶", "🤝"];

function renderDropBeacon() {
  screen.innerHTML = `
    <div class="page-col">
      <div class="sheet-back">
        <button class="back-btn" data-back><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
        <span class="chip accent">New beacon</span>
      </div>
      <div class="edit-wrap">
        <h2 class="edit-title">Drop a live beacon</h2>
        <p class="edit-sub">Tell campus what's happening where you are. People see the event and a headcount — never a pin on you.</p>

        <div class="field"><label>What's the event?</label><input id="bk-name" type="text" maxlength="40" placeholder="Rooftop study jam" /></div>
        <div class="field"><label>What's happening?</label><input id="bk-sub" type="text" maxlength="80" placeholder="Snacks, lo-fi, room for 10 more" /></div>

        <h3 class="gv-h">Vibe</h3>
        <div class="chip-select" id="bk-icon">
          ${BEACON_ICONS.map((ic, i) => `<span class="chip ${i === 0 ? "on" : ""}" data-ic="${ic}">${ic}</span>`).join("")}
        </div>

        <h3 class="gv-h">For how long?</h3>
        <div class="chip-select" id="bk-dur">
          <span class="chip" data-d="in 1h">1 hour</span>
          <span class="chip on" data-d="in 2h">2 hours</span>
          <span class="chip" data-d="in 4h">4 hours</span>
          <span class="chip" data-d="tonight">Until tonight</span>
        </div>

        <button class="btn btn-primary btn-wide" data-post-beacon>Light it up</button>
        <p class="empty-note" style="padding:18px 0 0">Your beacon shows a count and the event — your exact location is never on the map.<br/>End it anytime.</p>
      </div>
    </div>`;

  for (const id of ["bk-icon", "bk-dur"]) {
    document.getElementById(id).addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      [...e.currentTarget.children].forEach((c) => c.classList.remove("on"));
      chip.classList.add("on");
    });
  }
}

/* ----- party night camera ----- */

function renderCamera() {
  screen.innerHTML = `
    <div class="camera">
      <div class="viewfinder">
        <span class="vf-grain"></span>
        <span class="vf-hint">It's a demo — pretend this is the basement set 🔊</span>
      </div>
      <div class="cam-bar">
        <button class="back-btn cam-back" data-back><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
        <input id="cam-caption" type="text" maxlength="60" placeholder="Caption tonight…" />
        <button class="shutter" data-shutter></button>
      </div>
      <p class="cam-note">Posts attach to ${esc(myVenue()?.name || "the venue")}'s beacon and your party profile.<br/>Everything from tonight is gone by 6am — unless a meet saves it.</p>
    </div>`;
}

/* ============================================================
   CHATS
   ============================================================ */

function meetContext(personId) {
  const l = LEDGER.find((x) => x.personId === personId);
  if (l) return `Met at ${l.where} · ${l.date} · crossed paths ${l.crossed}× since`;
  const c = CHATS.find((x) => x.personId === personId);
  if (c?.via === "tapback") return "Connected at Career Fair · tap-back";
  return "";
}

function renderChats() {
  const rows = CHATS.filter((c) => !state.blocked.has(c.personId)).map((chat) => {
    const p = byId(chat.personId);
    const last = chat.messages[chat.messages.length - 1];
    const preview = last ? `${last.from === "me" ? "You: " : ""}${last.text}` : "Say hey — you've earned this thread";
    return `
      <button class="chat-row ${chat.unread ? "unread" : ""}" data-open-chat="${p.id}">
        ${avatarHTML(p, 52, p.met ? "gold-ring" : "")}
        <span class="chat-mid">
          <span class="chat-name">${esc(p.name)}</span>
          <span class="chat-context">★ ${esc(meetContext(p.id))}</span>
          <span class="chat-preview">${esc(preview)}</span>
        </span>
        <span class="chat-side">
          <span class="chat-time">${esc(chat.time)}</span>
          ${chat.unread ? '<span class="unread-dot"></span>' : ""}
        </span>
      </button>`;
  }).join("");

  screen.innerHTML = `
    <div class="page-col">
      <header class="topbar">
        <h1>Chats</h1>
        ${bellHTML()}
      </header>
      <p class="section-hint" style="padding-top:10px">Every thread here is someone you actually met — or who tapped back.<br/>That's why there's no inbox full of strangers.</p>
      ${rows}
      <p class="empty-note">Nothing else to check. Go talk to someone.</p>
    </div>`;
}

function renderChat(id) {
  const p = byId(id);
  const chat = CHATS.find((c) => c.personId === id);
  if (!p || !chat) return closeView();

  const bubbles = chat.messages.map((m) => `<div class="bubble ${m.from}">${esc(m.text)}</div>`).join("");

  screen.innerHTML = `
    <div class="page-col">
      <div class="convo">
        <div class="convo-head">
          <button class="back-btn" data-back><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
          <button data-person="${p.id}" style="display:flex">${avatarHTML(p, 38, p.met ? "gold-ring" : "")}</button>
          <button class="who" data-person="${p.id}" style="text-align:left">
            <div class="name">${esc(p.name)}</div>
            <div class="status gold-text">★ ${esc(meetContext(p.id))}</div>
          </button>
        </div>
        <div class="bubbles">
          ${chat.messages.length ? bubbles : `<div class="bubble-meta">Chat just opened — ${chat.via === "tapback" ? "they tapped back" : "you met in person"}. No small talk required, you already did the hard part.</div>`}
        </div>
        <div class="composer">
          <div class="composer-inner">
            <input id="composer-input" type="text" placeholder="Message ${esc(firstName(p))}…" autocomplete="off" />
            <button class="send" id="composer-send" title="Send"><svg viewBox="0 0 24 24"><path d="M3 11.5 21 3l-7 18-2.8-7.2L3 11.5Z"/></svg></button>
          </div>
        </div>
      </div>
    </div>`;

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
   notifications feed
   ============================================================ */

function renderNotifs() {
  NOTIFS.forEach((n) => { if (!n.action) n.unread = false; });
  const rows = NOTIFS.map((n) => `
    <div class="notif-row ${n.unread ? "unread" : ""}">
      <span class="n-icon">${n.icon}</span>
      <span class="n-mid">
        <span class="n-title">${esc(n.title)}</span>
        <span class="n-body">${esc(n.body)}</span>
        ${n.action === "confirm-meet" ? `
          <span class="n-actions">
            <button class="btn btn-gold" data-meet-yes="${n.personId}">Yes — we met</button>
            <button class="btn btn-ghost" data-meet-no="${n.personId}">No</button>
          </span>` : ""}
      </span>
      <span class="n-time">${esc(n.time)}</span>
    </div>`).join("");

  screen.innerHTML = `
    <div class="page-col">
      <div class="sheet-back">
        <button class="back-btn" data-back><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
        <span class="chip">Notifications</span>
      </div>
      <p class="section-hint" style="padding-top:8px">This is the whole product when your phone's in your pocket.</p>
      ${rows}
      <p class="empty-note">That's everything. Notice what's missing:<br/>no likes, no streaks, no feed.</p>
    </div>`;
}

/* ============================================================
   YOU — profiles, ledger, pending, settings
   ============================================================ */

function renderYou() {
  const myEverydayTaps = PEOPLE.filter((p) => p.tappedByMe && p.tapMode === "everyday" && !isMutual(p) && !p.met && !state.blocked.has(p.id));
  const flags = PEOPLE.filter((p) => p.nextTime === "waiting");

  const ledgerRows = LEDGER.map((l) => {
    const p = byId(l.personId);
    if (!p || state.blocked.has(p.id)) return "";
    return `
      <button class="ledger-row" data-person="${p.id}">
        ${avatarHTML(p, 44, "gold-ring")}
        <span class="l-mid">
          <span class="l-name">${esc(p.name)}</span>
          <span class="l-sub">${esc(l.where)} · ${esc(l.date)} · ${esc(l.how)}</span>
        </span>
        <span class="l-crossed">${l.crossed}×<i>crossed</i></span>
      </button>`;
  }).join("");

  const profCards = Object.entries(MODE_META).map(([id, m]) => {
    const pr = ME.profiles[id];
    const line = id === "conference" ? `${pr.firm} · ${pr.role}` : pr.line;
    return `
      <div class="prof-card">
        <span class="pc-icon">${m.icon}</span>
        <span class="pc-mid">
          <span class="pc-name">${m.label} profile</span>
          <span class="pc-line">${esc(line)}</span>
        </span>
        <button class="btn btn-ghost pc-btn" data-preview="${id}">Preview</button>
        <button class="btn btn-ghost pc-btn" data-edit="${id}">Edit</button>
      </div>`;
  }).join("");

  screen.innerHTML = `
    <div class="page-col">
      <header class="topbar">
        <h1>You</h1>
        ${bellHTML()}
      </header>

      <div class="profile-hero" style="padding-top:14px">
        ${avatarHTML(ME, 88)}
        <h2>${esc(ME.name)}</h2>
        <div class="headline">${LEDGER.length} verified meets · ${myEverydayTaps.length} taps out</div>
      </div>

      <div class="section-title"><h2>Your three profiles</h2></div>
      <p class="section-hint">One per mode. Switching modes swaps which one people see.</p>
      ${profCards}

      <div class="section-title"><h2>Meet ledger</h2><span class="see-all">${LEDGER.length} meets</span></div>
      <p class="section-hint">The only history this app keeps rich: people you actually met.</p>
      ${ledgerRows}

      <div class="section-title"><h2>Pending</h2></div>
      <div class="pending-box">
        <div class="pending-head">Everyday taps · ${myEverydayTaps.length} of 10 out</div>
        ${myEverydayTaps.map((p) => `
          <div class="pending-row">
            ${avatarHTML(p, 36)}
            <span class="pr-mid"><b>${esc(firstName(p))}</b><span>${esc(p.tapAt || "")} · they don't know</span></span>
            <button class="btn btn-ghost pr-untap" data-untap="${p.id}">Untap</button>
          </div>`).join("") || '<p class="pending-empty">No taps out. The room awaits.</p>'}
        <div class="pending-head">Party · ${state.partyTapsUsed} of 3 used tonight</div>
        <div class="pending-head">Next-time flags</div>
        ${flags.map((p) => `
          <div class="pending-row">
            ${avatarHTML(p, 36)}
            <span class="pr-mid"><b>${esc(firstName(p))}</b><span>You opted in · waiting on her</span></span>
          </div>`).join("") || ""}
      </div>

      <div class="section-title"><h2>Safety & settings</h2></div>
      <div class="settings-list">
        <button class="setting-row" data-soon="Blocked people">
          <span class="s-icon">🚫</span>
          <span class="s-label">Blocked<span class="s-sub">${state.blocked.size ? `${state.blocked.size} blocked — they can never see you` : "One strike, permanent, no notice sent"}</span></span>
          <span class="s-chev">›</span>
        </button>
        <button class="setting-row" data-toggle="notifMutual">
          <span class="s-icon">💙</span>
          <span class="s-label">Mutual tap alerts<span class="s-sub">The one notification that matters</span></span>
          <span class="switch ${state.settings.notifMutual ? "on" : ""}"></span>
        </button>
        <button class="setting-row" data-toggle="notifNearby">
          <span class="s-icon">⭐</span>
          <span class="s-label">Met-people-nearby pings<span class="s-sub">Only people in your ledger</span></span>
          <span class="switch ${state.settings.notifNearby ? "on" : ""}"></span>
        </button>
        <button class="setting-row" data-toggle="quietHours">
          <span class="s-icon">🌙</span>
          <span class="s-label">Quiet hours (12am–8am)<span class="s-sub">Auto-invisible while you sleep</span></span>
          <span class="switch ${state.settings.quietHours ? "on" : ""}"></span>
        </button>
      </div>

      <p class="empty-note">whatsup v2 — start online, meet in person.<br/>Rich history only after you meet. Coarse before. Always.</p>
    </div>`;
}

/* ----- edit + preview a mode profile ----- */

function renderEdit(m) {
  const pr = ME.profiles[m];
  const meta = MODE_META[m];
  const fields = m === "conference"
    ? `
      <div class="field"><label>Firm / school</label><input id="e-firm" value="${esc(pr.firm)}" /></div>
      <div class="field"><label>Role</label><input id="e-role" value="${esc(pr.role)}" /></div>
      <div class="field"><label>Ask me about…</label><input id="e-ask" value="${esc(pr.ask)}" /></div>`
    : m === "party"
    ? `
      <div class="field"><label>One-liner</label><input id="e-line" value="${esc(pr.line)}" /></div>
      <div class="field"><label>Tonight's vibe</label><input id="e-vibe" value="${esc(pr.vibe)}" /></div>
      <div class="field"><label>Fun prompt (two truths & a lie, hot take…)</label><input id="e-prompt" value="${esc(pr.prompt)}" /></div>`
    : `
      <div class="field"><label>One-liner</label><input id="e-line" value="${esc(pr.line)}" /></div>
      <div class="field"><label>Ask me about…</label><input id="e-ask" value="${esc(pr.ask)}" /></div>`;

  screen.innerHTML = `
    <div class="page-col">
      <div class="sheet-back">
        <button class="back-btn" data-back-you><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
        <span class="chip">${meta.icon} ${meta.label} profile</span>
      </div>
      <div class="edit-wrap">
        <h2 class="edit-title">Edit ${meta.label.toLowerCase()} profile</h2>
        <p class="edit-sub">${meta.blurb}</p>
        ${fields}
        <button class="btn btn-primary btn-wide" data-save-profile="${m}">Save</button>
      </div>
    </div>`;
}

function saveProfile(m) {
  const pr = ME.profiles[m];
  const g = (id) => document.getElementById(id)?.value.trim();
  if (m === "conference") { pr.firm = g("e-firm") || pr.firm; pr.role = g("e-role") || pr.role; pr.ask = g("e-ask") || pr.ask; }
  else if (m === "party") { pr.line = g("e-line") || pr.line; pr.vibe = g("e-vibe") || pr.vibe; pr.prompt = g("e-prompt") || pr.prompt; }
  else { pr.line = g("e-line") || pr.line; pr.ask = g("e-ask") || pr.ask; }
  state.view = null; state.tab = "you";
  render();
  toast(`${MODE_META[m].label} profile saved`);
}

function renderPreview(m) {
  const pr = ME.profiles[m];
  const meta = MODE_META[m];
  const fauxPerson = {
    name: "You", initials: ME.initials, palette: ME.palette, mode: m,
    line: pr.line, ask: pr.ask, vibe: pr.vibe, prompt: pr.prompt, firm: pr.firm, role: pr.role,
  };
  screen.innerHTML = `
    <div class="page-col">
      <div class="sheet-back">
        <button class="back-btn" data-back-you><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button>
        <span class="chip accent">What others see · ${meta.label}</span>
      </div>
      <div class="profile-hero" style="padding-top:4px">
        ${avatarHTML(fauxPerson, 96)}
        <h2>${esc(ME.name)}</h2>
        <div class="headline">${esc(m === "conference" ? `${pr.firm} · ${pr.role}` : pr.line)}</div>
      </div>
      ${personCardFields(fauxPerson)}
      <p class="empty-note">This is your ${meta.label.toLowerCase()} card, exactly as it appears<br/>to people in the same room.</p>
    </div>`;
}

/* ============================================================
   global click delegation
   ============================================================ */

screen.addEventListener("click", (e) => {
  const t = (sel) => e.target.closest(sel);
  let el;

  if ((el = t("[data-back]"))) return closeView();
  if ((el = t("[data-back-you]"))) { state.view = null; state.tab = "you"; return render(); }
  if ((el = t("[data-notifs]"))) { state.view = { type: "notifs" }; return render(); }

  if ((el = t("[data-go-visible]"))) { state.view = { type: "govisible" }; return render(); }
  if ((el = t("[data-confirm-visible]"))) {
    const m = document.querySelector("#gv-modes .mode-card.on")?.dataset.mode || "everyday";
    const d = document.querySelector("#gv-dur .chip.on")?.dataset.dur || "2h";
    return goVisible(m, d);
  }
  if ((el = t("[data-end-session]"))) return endSession();

  if ((el = t("[data-tap]"))) return tapPerson(byId(el.dataset.tap));
  if ((el = t("[data-untap]"))) return untapPerson(byId(el.dataset.untap));
  if ((el = t("[data-bump]"))) return showBump(byId(el.dataset.bump));
  if ((el = t("[data-open-chat]"))) return openChat(el.dataset.openChat);

  if ((el = t("[data-meet-yes]"))) return confirmMeet(el.dataset.meetYes, true);
  if ((el = t("[data-meet-no]"))) return confirmMeet(el.dataset.meetNo, false);

  if ((el = t("[data-block]"))) {
    const id = el.dataset.block;
    if (state._blockArm === id) {
      state._blockArm = null;
      state.blocked.add(id);
      state.view = null;
      render();
      return toast(`Blocked. They can never see you again.`);
    }
    state._blockArm = id;
    return render();
  }

  if ((el = t("[data-beacon]"))) { state.view = { type: "beacon", id: el.dataset.beacon }; return render(); }
  if ((el = t("[data-drop-beacon]"))) {
    if (VENUES.mine) { state.view = { type: "beacon", id: "mine" }; return render(); }
    state.view = { type: "dropbeacon" };
    return render();
  }
  if ((el = t("[data-post-beacon]"))) {
    const name = document.getElementById("bk-name").value.trim();
    if (!name) return toast("Give the event a name — that's the beacon");
    const sub = document.getElementById("bk-sub").value.trim() || "Live now";
    const icon = document.querySelector("#bk-icon .chip.on")?.dataset.ic || "🎉";
    const ends = document.querySelector("#bk-dur .chip.on")?.dataset.d || "in 2h";
    VENUES.mine = { id: "mine", name, icon, sub, ends, count: 1, x: 50, y: 22, kind: "user", mine: true, posts: [] };
    state.view = null;
    state.tab = "map";
    render();
    return toast("Your beacon is live — a count, never a pin on you");
  }
  if ((el = t("[data-end-beacon]"))) {
    delete VENUES.mine;
    state.view = null;
    state.tab = "map";
    render();
    return toast("Beacon ended");
  }
  if ((el = t("[data-camera]"))) { state.view = { type: "camera" }; return render(); }
  if ((el = t("[data-shutter]"))) {
    const cap = document.getElementById("cam-caption")?.value.trim() || "tonight 🌙";
    const v = myVenue();
    if (v) (v.posts = v.posts || []).unshift({ by: "You", palette: ME.palette, caption: cap, time: "now" });
    state.view = null;
    render();
    return toast(`Posted to ${v ? v.name : "the venue"}'s beacon — gone by 6am`);
  }

  if ((el = t("[data-edit]"))) { state.view = { type: "edit", mode: el.dataset.edit }; return render(); }
  if ((el = t("[data-preview]"))) { state.view = { type: "preview", mode: el.dataset.preview }; return render(); }
  if ((el = t("[data-save-profile]"))) return saveProfile(el.dataset.saveProfile);

  if ((el = t("[data-toggle]"))) {
    state.settings[el.dataset.toggle] = !state.settings[el.dataset.toggle];
    return renderYou();
  }
  if ((el = t("[data-soon]"))) return toast(`${el.dataset.soon} — full list coming soon`);

  if ((el = t("[data-person]"))) {
    state._blockArm = null;
    return openPerson(el.dataset.person);
  }
});

/* ---------- boot ---------- */
render();
