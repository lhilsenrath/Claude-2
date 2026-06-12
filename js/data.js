/* ============================================================
   WhatsUp — Prototype v2 mock data
   All people, venues, photos, and conversations are fictional.

   The model:
   - Nobody is visible by default; visibility is a session.
   - Three modes (everyday / party / conference), each with its
     own venue context in this demo so every state is reachable.
   - Dot states: grey = visible stranger, pulsing blue = mutual
     tap in your radius, gold = someone you've met.
   ============================================================ */

const PALETTES = {
  sky: ["#4db8e3", "#1d8fc0"],
  coral: ["#e09a85", "#c4685e"],
  violet: ["#9b8ed8", "#7a64b8"],
  mint: ["#6fc79e", "#46997a"],
  gold: ["#dcbd7d", "#bd9352"],
  rose: ["#dfa4bc", "#bd6f8e"],
  slate: ["#92a4b5", "#5f7689"],
  teal: ["#62bdb4", "#3a9189"],
  plum: ["#b394d8", "#8a62b8"],
  moss: ["#9dbb7a", "#6e8f4e"],
};

/* ---------- you ---------- */

const ME = {
  id: "me",
  name: "You",
  initials: "Y",
  palette: "sky",
  profiles: {
    everyday: {
      line: "Econ '27 · chronic third-floor studier",
      ask: "the best coffee within 100 yards",
    },
    party: {
      line: "Will fight you for the aux",
      vibe: "Golden-hour energy",
      prompt: "Two truths & a lie: I've met Dolly Parton, I hate fireworks, I can juggle.",
    },
    conference: {
      firm: "University of Tennessee",
      role: "Econ '27 · aspiring PM",
      ask: "breaking into product",
    },
  },
};

/* ---------- venues (map beacons) ----------
   count = aggregate "open" headcount the beacon shows.
   Beacons show HOW MANY, never WHO. */

const VENUES = {
  hodges: {
    id: "hodges", name: "Hodges Library", icon: "📚",
    count: 14, x: 46, y: 36, kind: "study",
    sub: "Quiet grind · 3rd floor is the social one",
  },
  sigmachi: {
    id: "sigmachi", name: "Sigma Chi", icon: "🎉",
    count: 23, x: 27, y: 60, kind: "party",
    sub: "Live now · backyard + basement",
    posts: [
      { by: "Emma R.", palette: "plum", caption: "basement set just started 🔊", time: "12m" },
      { by: "Tyler B.", palette: "gold", caption: "backyard bonfire is elite", time: "34m" },
      { by: "Mia K.", palette: "rose", caption: "we found a dog at this party??", time: "1h" },
    ],
  },
  careerfair: {
    id: "careerfair", name: "Career Fair · Thompson-Boling", icon: "🤝",
    count: 140, x: 66, y: 76, kind: "conference",
    sub: "Engineering & business day · til 5pm",
  },
  prespub: {
    id: "prespub", name: "Pres Pub Trivia", icon: "🍺",
    count: 9, x: 57, y: 52, kind: "social",
    sub: "Round 2 of 5 · teams of 4",
  },
  trecs: {
    id: "trecs", name: "TRECS", icon: "🏋️",
    count: 6, x: 74, y: 38, kind: "gym",
    sub: "Open gym · courts busy",
  },
  goldenroast: {
    id: "goldenroast", name: "Golden Roast", icon: "☕",
    count: 4, x: 36, y: 46, kind: "cafe",
    sub: "A few seats left",
  },
};

// Which simulated venue you're at when you go visible in a mode
const MODE_VENUE = { everyday: "hodges", party: "sigmachi", conference: "careerfair" };

const MODE_META = {
  everyday: {
    label: "Everyday", icon: "☀️",
    blurb: "Class, gym, coffee. Taps are double-blind — invisible unless mutual.",
    cap: 10, capLabel: "10 active taps",
    tapRule: "Your tap is invisible unless they tap you too.",
  },
  party: {
    label: "Party", icon: "🪩",
    blurb: "Nights out. Taps are visible, capped at 3, gone by morning.",
    cap: 3, capLabel: "3 taps per night",
    tapRule: "They'll see your tap. You'll never know if they saw it.",
  },
  conference: {
    label: "Conference", icon: "💼",
    blurb: "Professional events. Visible taps; a tap-back unlocks chat.",
    cap: 20, capLabel: "20 taps per event day",
    tapRule: "They'll see you want to connect. A tap-back opens chat.",
  },
};

/* ---------- people ----------
   venue: where they are right now (null = not visible anywhere)
   mode:  the mode context they're seeded in (drives their card)
   dist:  yards from you when you're at their venue (sort only —
          the UI never shows precise pre-meet distance)
   tappedByMe / tappedMe: tap state. met: you've met (gold).
   demoTapBack: scripted — taps you back shortly after you tap.
   fx, fy: exact floor-map position (conference only). */

const PEOPLE = [
  /* ===== Hodges Library — everyday crowd ===== */
  {
    id: "maya", name: "Maya Chen", initials: "MC", palette: "rose",
    venue: "hodges", mode: "everyday", dist: 15,
    line: "Gov & Econ '27 · iced latte loyalist",
    ask: "the window seats nobody knows about",
    extra: "Also in your ECON 201 lecture",
    icebreaker: "You both marked 'open to study buddies' — ask her about the third-floor window seats.",
    demoTapBack: true,
  },
  {
    id: "jake", name: "Jake Whitfield", initials: "JW", palette: "slate",
    venue: "hodges", mode: "everyday", dist: 30,
    line: "Mech-E '26 · builds guitars on weekends",
    ask: "why your chair squeaks (I can fix it)",
    tappedByMe: true, tappedMe: true, tapMode: "everyday",
    tapContext: "You tapped him at ECON 101 in September",
    icebreaker: "Mutual from September — ask him about the guitar build.",
  },
  {
    id: "priya", name: "Priya Patel", initials: "PP", palette: "teal",
    venue: "hodges", mode: "everyday", dist: 22,
    line: "Neuro pre-med '27 · tea > coffee",
    ask: "chai spots that aren't a chain",
    met: true,
  },
  {
    id: "theo", name: "Theo Lindqvist", initials: "TL", palette: "moss",
    venue: "hodges", mode: "everyday", dist: 55,
    line: "Architecture '26 · sketches strangers (politely)",
    ask: "the ugliest building on campus",
    met: true,
  },
  {
    id: "noah", name: "Noah Kim", initials: "NK", palette: "gold",
    venue: "hodges", mode: "everyday", dist: 40,
    line: "Design '25 · sketchbook over screens",
    ask: "why the best apps are the ones you close",
    tappedByMe: true, tapMode: "everyday", tapAt: "Hodges Library · 3 days ago",
  },
  {
    id: "nina", name: "Nina Alvarez", initials: "NA", palette: "coral",
    venue: "hodges", mode: "everyday", dist: 18,
    line: "Journalism '28 · will interview you mid-coffee",
    ask: "the story behind your worst haircut",
  },
  {
    id: "omar", name: "Omar Haddad", initials: "OH", palette: "violet",
    venue: "hodges", mode: "everyday", dist: 26,
    line: "CS '27 · rock climber, code golfer",
    ask: "bouldering with zero upper-body strength",
  },
  {
    id: "lucy", name: "Lucy Tran", initials: "LT", palette: "mint",
    venue: "hodges", mode: "everyday", dist: 34,
    line: "Bio '28 · plant mom of 23",
    ask: "which plant is impossible to kill (lies)",
  },
  {
    id: "devon", name: "Devon Brooks", initials: "DB", palette: "plum",
    venue: "hodges", mode: "everyday", dist: 47,
    line: "Music '26 · jazz trombone at Pres Pub Thursdays",
    ask: "why trombone is the funniest instrument",
  },
  {
    id: "sasha", name: "Sasha Petrov", initials: "SP", palette: "sky",
    venue: "hodges", mode: "everyday", dist: 52,
    line: "Math '27 · chess hustler on the quad",
    ask: "a chess opening named after a vegetable",
  },
  {
    id: "ben", name: "Ben Carter", initials: "BC", palette: "slate",
    venue: "hodges", mode: "everyday", dist: 61,
    line: "History '26 · walking-tour guide voice",
    ask: "the tunnel system under campus (real)",
  },
  {
    id: "ivy", name: "Ivy Nakamura", initials: "IN", palette: "rose",
    venue: "hodges", mode: "everyday", dist: 70,
    line: "Psych '28 · people-watching professionally",
    ask: "what your study spot says about you",
  },
  {
    id: "marco", name: "Marco Rossi", initials: "MR", palette: "gold",
    venue: "hodges", mode: "everyday", dist: 78,
    line: "Culinary club president · feeds strangers",
    ask: "the best $4 meal within a mile",
  },
  {
    id: "zoe", name: "Zoe Bennett", initials: "ZB", palette: "teal",
    venue: "hodges", mode: "everyday", dist: 85,
    line: "Film '27 · letterboxd top reviewer (self-claimed)",
    ask: "the worst movie I've seen this month",
  },

  /* ===== Sigma Chi — party crowd ===== */
  {
    id: "emma", name: "Emma Rossi", initials: "ER", palette: "plum",
    venue: "sigmachi", mode: "party", dist: 20,
    line: "Art history '26 · museum kid gone loud",
    vibe: "Basement DJ defender",
    prompt: "Hot take: party playlists peaked in 2019.",
    met: true,
  },
  {
    id: "riley", name: "Riley Morgan", initials: "RM", palette: "coral",
    venue: "sigmachi", mode: "party", dist: 12,
    line: "Comms '27 · knows everyone here somehow",
    vibe: "Backyard bonfire core",
    prompt: "Two truths & a lie: I've crowd-surfed, I own a snake, I hate cake.",
  },
  {
    id: "tyler", name: "Tyler Brooks", initials: "TB", palette: "gold",
    venue: "sigmachi", mode: "party", dist: 25,
    line: "Sports mgmt '26 · intramural legend",
    vibe: "Will start a dance circle",
    prompt: "Hot take: cornhole is a contact sport.",
  },
  {
    id: "mia", name: "Mia Kowalski", initials: "MK", palette: "rose",
    venue: "sigmachi", mode: "party", dist: 30,
    line: "Nursing '27 · the designated mom friend",
    vibe: "Found the party dog",
    prompt: "Two truths & a lie: triplet, skydiver, allergic to glitter.",
  },
  {
    id: "cole", name: "Cole Dawson", initials: "CD", palette: "slate",
    venue: "sigmachi", mode: "party", dist: 38,
    line: "Finance '26 · off-duty tonight, promise",
    vibe: "Aux thief",
    prompt: "Hot take: ranch on pizza is correct.",
  },
  {
    id: "ava", name: "Ava Sinclair", initials: "AS", palette: "violet",
    venue: "sigmachi", mode: "party", dist: 44,
    line: "Theater '28 · will absolutely do the bit",
    vibe: "Main-character lighting",
    prompt: "Two truths & a lie: I've been on TV, I can yodel, I fear ducks.",
  },
  {
    id: "leo", name: "Leo Martinez", initials: "LM", palette: "mint",
    venue: "sigmachi", mode: "party", dist: 51,
    line: "Engineering '27 · built the speaker stack",
    vibe: "Volume technician",
    prompt: "Hot take: the bass is never too loud.",
  },
  {
    id: "june", name: "June Park", initials: "JP", palette: "teal",
    venue: "sigmachi", mode: "party", dist: 58,
    line: "Photo '27 · disposable camera in pocket",
    vibe: "Documenting the chaos",
    prompt: "Two truths & a lie: 35mm only, met a president, hates flash.",
  },

  /* ===== Career Fair — conference crowd ===== */
  {
    id: "chris", name: "Chris Okafor", initials: "CO", palette: "violet",
    venue: "careerfair", mode: "conference", dist: 28,
    firm: "Stripe", role: "SWE · University recruiting",
    ask: "what we actually screen for",
    met: true, fx: 30, fy: 38,
  },
  {
    id: "aisha", name: "Aisha Mahmoud", initials: "AM", palette: "rose",
    venue: "careerfair", mode: "conference", dist: 16,
    firm: "Anthropic", role: "University Recruiter",
    ask: "2027 internships — hiring this week",
    fx: 52, fy: 30, demoTapBack: true,
  },
  {
    id: "helen", name: "Helen Zhao", initials: "HZ", palette: "teal",
    venue: "careerfair", mode: "conference", dist: 22,
    firm: "Deloitte", role: "Consulting Analyst '24",
    ask: "case-interview prep that isn't miserable",
    fx: 68, fy: 44, tappedMe: true, tapMode: "conference",
  },
  {
    id: "raj", name: "Raj Iyer", initials: "RI", palette: "gold",
    venue: "careerfair", mode: "conference", dist: 35,
    firm: "Oak Ridge National Lab", role: "Research Engineer",
    ask: "energy-grid simulation (genuinely cool)",
    fx: 40, fy: 58, tappedMe: true, tapMode: "conference",
  },
  {
    id: "grace", name: "Grace Liu", initials: "GL", palette: "plum",
    venue: "careerfair", mode: "conference", dist: 41,
    firm: "Sequoia Scout", role: "MBA '26 · angel checks",
    ask: "consumer social (pitch me in 60 seconds)",
    fx: 74, fy: 62, tappedMe: true, tapMode: "conference",
  },
  {
    id: "sam", name: "Sam Whitaker", initials: "SW", palette: "slate",
    venue: "careerfair", mode: "conference", dist: 48,
    firm: "Pilot Flying J", role: "Product Manager",
    ask: "logistics tech in East Tennessee",
    fx: 26, fy: 66,
  },
  {
    id: "wei", name: "Wei Chen", initials: "WC", palette: "mint",
    venue: "careerfair", mode: "conference", dist: 55,
    firm: "Eastman", role: "Materials Scientist",
    ask: "why plastics research is misunderstood",
    fx: 58, fy: 70,
  },
  {
    id: "dana2", name: "Dana Whitmore", initials: "DW", palette: "coral",
    venue: "careerfair", mode: "conference", dist: 60,
    firm: "Regal", role: "Brand Strategy",
    ask: "why movie theaters aren't dead",
    fx: 46, fy: 46,
  },

  /* ===== Off-screen people (pending taps, flags, ledger) ===== */
  {
    id: "lena", name: "Lena Fischer", initials: "LF", palette: "mint",
    venue: null, mode: "everyday", dist: null,
    line: "Linguistics '27", ask: "untranslatable words",
    tappedByMe: true, tapMode: "everyday", tapAt: "Golden Roast · 2 weeks ago",
  },
  {
    id: "kai", name: "Kai Nakos", initials: "KN", palette: "sky",
    venue: null, mode: "everyday", dist: null,
    line: "Kinesiology '26", ask: "fixing your deadlift",
    tappedByMe: true, tapMode: "everyday", tapAt: "TRECS · a month ago",
  },
  {
    id: "sarah", name: "Sarah Dempsey", initials: "SD", palette: "rose",
    venue: null, mode: "party", dist: null,
    line: "Marketing '27", vibe: "Theta formal survivor",
    nextTime: "waiting", // you opted in; waiting on her
  },
  {
    id: "jordan", name: "Jordan Ellis", initials: "JE", palette: "violet",
    venue: null, mode: "party", dist: null,
    line: "Poli sci '26", vibe: "Debate-team energy at parties",
  },
  {
    id: "dana", name: "Dana Okoye", initials: "DO", palette: "moss",
    venue: null, mode: "everyday", dist: null,
    line: "Public health '25 · runs at dawn, sorry",
    ask: "the greenway nobody runs",
    met: true,
  },
];

/* ---------- meet ledger (newest first) ---------- */

const LEDGER = [
  { personId: "emma", where: "Theta Chi", date: "Mar 14", how: "Party · she tapped first", crossed: 4 },
  { personId: "priya", where: "Hodges Library", date: "Feb 3", how: "Everyday · double-blind mutual", crossed: 6 },
  { personId: "theo", where: "TRECS", date: "Jan 21", how: "Everyday · double-blind mutual", crossed: 9 },
  { personId: "dana", where: "Golden Roast", date: "Nov 2", how: "Everyday · double-blind mutual", crossed: 3 },
  { personId: "chris", where: "Career Fair", date: "Sep 12", how: "Conference · you tapped first", crossed: 2 },
];

/* ---------- chats (only unlocked threads exist) ---------- */

const CHATS = [
  {
    personId: "emma", unread: true, time: "2:14 PM",
    messages: [
      { from: "them", text: "ok the exhibition opening is FRIDAY and you're coming" },
      { from: "them", text: "I helped hang half of it. there will be free cheese" },
      { from: "me", text: "free cheese is binding, I'm in" },
      { from: "them", text: "🧀 5pm. don't be late or I'm narrating the whole gallery at you" },
    ],
  },
  {
    personId: "priya", unread: true, time: "12:40 PM",
    messages: [
      { from: "them", text: "I'm at Hodges third floor and the window seat is OPEN" },
      { from: "them", text: "this never happens. get here" },
      { from: "me", text: "omw — guard it with your life" },
      { from: "them", text: "I've deployed my backpack. hurry 🫡" },
    ],
  },
  {
    personId: "chris", unread: false, time: "Tue",
    messages: [
      { from: "me", text: "hey! saw Stripe's at the fair again this week" },
      { from: "them", text: "yep, booth 12. swing by — I'll intro you to my manager this time" },
      { from: "me", text: "deal. I owe you a coffee for last time" },
    ],
  },
  {
    personId: "dana", unread: false, time: "Sun",
    messages: [
      { from: "them", text: "6am greenway run tomorrow. yes I'm serious. no you can't say no" },
      { from: "me", text: "you are a menace and I'll be there" },
    ],
  },
];

/* ---------- seeded notification feed (newest first) ---------- */

const NOTIFS = [
  {
    id: "n-jordan", icon: "🌅", unread: true, time: "8:02 AM",
    title: "Did you meet Jordan last night?",
    body: "You tapped each other at Sigma Chi and were close for a while. Both confirm and it counts.",
    action: "confirm-meet", personId: "jordan",
  },
  {
    id: "n-sarah", icon: "🔁", unread: true, time: "8:00 AM",
    title: "Next time, then.",
    body: "You and Sarah both tapped at Theta but never found each other. You opted in to a nearby ping — waiting on her.",
  },
  {
    id: "n-purge", icon: "🧹", unread: false, time: "6:00 AM",
    title: "Last night, cleaned up.",
    body: "Party taps and posts from Sigma Chi expired. Meets you registered are kept forever.",
  },
];

/* ---------- icebreakers for fresh mutuals ---------- */

const ICEBREAKERS = [
  "You're both pretending to study. Compare notes.",
  "Ask what they'd do with a free afternoon and no phone.",
  "You're 30 yards apart. That's a 20-second walk. Go.",
];
