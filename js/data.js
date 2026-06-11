/* ============================================================
   WhatsUp — demo data (v3)
   All people, photos, and conversations are fictional.

   Visibility model:
   - Strangers are visible ONLY within 100 yds of you.
   - Friends beyond 100 yds are visible only with mutual
     location sharing (their `sharesLocation` + your toggle).
   - Beacons are deliberate, opt-in broadcasts of where you are.
   ============================================================ */

// Softened palette — calmer than v2, still distinct per person
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
};

const PROMPT_QUESTIONS = [
  "Why I'm here",
  "Best way to say whats up",
  "My simple pleasure",
  "You'll find me",
  "Ask me about",
  "Together we could",
  "Green flag I look for",
  "Talk to me about",
  "A perfect first meet",
  "I'm looking for",
];

const ME = {
  id: "me",
  name: "You",
  initials: "Y",
  palette: "sky",
  headline: "",
  school: "",
  work: "",
  hometown: "",
  relationship: "",
  openTo: ["Friends"],
  x: 50, y: 52, // demo-map position (%)
  stats: { connections: 0, irlMeets: 0, beacons: 0 },
  photos: [],
  prompts: [],
  socials: [],
};

/*
  Person fields:
  - distanceYds: how far away right now (null = unknown/private)
  - bearingDeg: direction from you, used to place real-map pins
  - friend: you're connected
  - sharesLocation: friend shares their live location with you
  - place: where they are, shown only if you can see them
  - x, y: demo-map position (%)
*/
const PEOPLE = [
  {
    id: "maya",
    name: "Maya Chen",
    initials: "MC",
    palette: "rose",
    friend: false,
    online: true,
    distanceYds: 40,
    bearingDeg: 325,
    place: "Sever Hall",
    headline: "Harvard '27 · Gov & Econ · Coffee enthusiast",
    school: "Harvard College, Class of 2027",
    work: "Research Assistant, Harvard Kennedy School",
    hometown: "Seattle, WA",
    relationship: "Single",
    openTo: ["Friends", "Dating", "Study buddies"],
    sharedContext: "In your Ec 1010b lecture, two rows over",
    x: 47, y: 47,
    photos: [
      { palette: "rose", caption: "Golden hour in the Yard" },
      { palette: "violet", caption: "Pottery class attempt #3" },
      { palette: "teal", caption: "Home for the holidays" },
    ],
    prompts: [
      { q: "You'll find me", a: "Third row of Ec 1010b, iced latte in hand." },
      { q: "Green flag I look for", a: "Says hi to people in person, not just online." },
      { q: "Together we could", a: "Find the best pastry in Harvard Square. It's research." },
    ],
    socials: ["Instagram", "LinkedIn"],
    posts: [],
  },
  {
    id: "noah",
    name: "Noah Kim",
    initials: "NK",
    palette: "gold",
    friend: false,
    online: true,
    distanceYds: 85,
    bearingDeg: 230,
    place: "Blue Bottle Coffee",
    headline: "Product Designer @ Figma · GSD '25",
    school: "Harvard GSD, MDes 2025",
    work: "Product Designer, Figma",
    hometown: "Los Angeles, CA",
    relationship: "Single",
    openTo: ["Networking", "Friends", "Dating"],
    sharedContext: "At the café across the street right now",
    x: 46, y: 56,
    photos: [
      { palette: "gold", caption: "Sketchbook > screens, sometimes" },
      { palette: "plum", caption: "Gallery night in SoWa" },
    ],
    prompts: [
      { q: "A perfect first meet", a: "Coffee walk along the Charles. 30 minutes, no agenda." },
      { q: "Talk to me about", a: "Why the best apps are the ones you close." },
    ],
    socials: ["Instagram", "LinkedIn"],
    posts: [],
  },
  {
    id: "priya",
    name: "Priya Patel",
    initials: "PP",
    palette: "teal",
    friend: true,
    irl: false,
    sharesLocation: true,
    online: true,
    distanceYds: 60,
    bearingDeg: 160,
    place: "Harvard Yard",
    headline: "Harvard '27 · Neuro pre-med · Tea > coffee",
    school: "Harvard College, Class of 2027",
    work: "Research Assistant, MGH Neurology",
    hometown: "Jersey City, NJ",
    relationship: "Single",
    openTo: ["Friends", "Study buddies"],
    sharedContext: "Connected last week · You haven't met IRL yet",
    x: 53, y: 57,
    photos: [
      { palette: "teal", caption: "Lab day (the pipette won)" },
      { palette: "gold", caption: "Diwali at the SAC" },
    ],
    prompts: [
      { q: "My simple pleasure", a: "Chai from Tatte + people-watching in the Square." },
      { q: "Together we could", a: "Pretend to study at Lamont but mostly chat." },
    ],
    posts: [
      {
        type: "prompt",
        time: "3h",
        promptQ: "My simple pleasure",
        text: "Chai from Tatte + people-watching in the Square.",
        likes: 31,
      },
    ],
    socials: ["Instagram"],
  },
  {
    id: "james",
    name: "James Okafor",
    initials: "JO",
    palette: "violet",
    friend: true,
    irl: true,
    sharesLocation: true,
    online: true,
    distanceYds: 700,
    bearingDeg: 115,
    place: "MAC Courts",
    headline: "Harvard '26 · CS · SWE intern @ Stripe this summer",
    school: "Harvard College, Class of 2026",
    work: "Incoming SWE Intern, Stripe",
    hometown: "Houston, TX",
    relationship: "In a relationship",
    openTo: ["Networking", "Friends"],
    sharedContext: "Met IRL at HackHarvard · 14 mutual connections",
    x: 58, y: 67,
    photos: [
      { palette: "violet", caption: "Demo day. We survived." },
      { palette: "sky", caption: "MAC pickup runs" },
    ],
    prompts: [
      { q: "Ask me about", a: "Shipping a hackathon project at 4am." },
      { q: "You'll find me", a: "The MAC courts, Tuesdays at 6." },
    ],
    socials: ["LinkedIn", "GitHub"],
    posts: [
      {
        type: "work",
        time: "2h",
        text: "Excited to share I'll be joining Stripe this summer as a SWE intern on the payments team. Huge thanks to everyone who did mock interviews with me — especially the ones I met through a WhatsUp beacon.",
        likes: 47,
      },
      {
        type: "photo",
        time: "1d",
        text: "Pickup at the MAC tonight, 6pm. Drop by — first intro is on me.",
        photo: { palette: "sky", caption: "MAC courts, Tuesday nights" },
        likes: 23,
      },
    ],
  },
  {
    id: "emma",
    name: "Emma Rossi",
    initials: "ER",
    palette: "plum",
    friend: true,
    irl: true,
    sharesLocation: true,
    online: true,
    distanceYds: 1200,
    bearingDeg: 300,
    place: "Harvard Art Museums",
    headline: "Harvard '26 · History of Art · Museum kid",
    school: "Harvard College, Class of 2026",
    work: "Curatorial Intern, Harvard Art Museums",
    hometown: "Providence, RI",
    relationship: "Single",
    openTo: ["Friends", "Dating"],
    sharedContext: "Met IRL via her beacon at Blue Bottle · 9 mutuals",
    x: 38, y: 40,
    photos: [
      { palette: "plum", caption: "Behind the scenes at the Fogg" },
      { palette: "rose", caption: "Sunday market haul" },
    ],
    prompts: [
      { q: "You'll find me", a: "Wherever the good light is." },
      { q: "Together we could", a: "Do a museum speed-run: 45 min, 3 favorites, then gelato." },
    ],
    posts: [
      {
        type: "photo",
        time: "6h",
        text: "New exhibition opens Friday — I helped hang it. Come through, I'll drop a beacon at the museum 5–7pm.",
        photo: { palette: "plum", caption: "Opening night prep at the Fogg" },
        likes: 56,
      },
    ],
    socials: ["Instagram", "LinkedIn"],
  },
  {
    id: "sofia",
    name: "Sofia Martinez",
    initials: "SM",
    palette: "coral",
    friend: true,
    irl: true,
    sharesLocation: false, // friend, but keeps her location private
    online: false,
    distanceYds: null,
    place: null,
    headline: "HBS MBA '27 · ex-Goldman · Climate tech",
    school: "Harvard Business School, MBA 2027",
    work: "Ex-Analyst, Goldman Sachs · Exploring climate tech",
    hometown: "Miami, FL",
    relationship: "Prefer not to say",
    openTo: ["Networking", "Co-founder search"],
    sharedContext: "Met IRL at the HBS Climate Summit · 6 mutuals",
    x: null, y: null,
    photos: [
      { palette: "coral", caption: "Panel day at the Climate Summit" },
      { palette: "mint", caption: "Weekend in Vermont" },
    ],
    prompts: [
      { q: "I'm looking for", a: "A technical co-founder who cares about grid storage." },
      { q: "Talk to me about", a: "Skip the cold email. Find me at an event, say whats up." },
    ],
    socials: ["LinkedIn"],
    posts: [
      {
        type: "work",
        time: "5h",
        text: "Recap from the Climate Tech Summit: 200+ people, 30 of them found each other through WhatsUp's event beacons. If you're working on storage or carbon markets, my DMs are open this week.",
        likes: 89,
      },
    ],
  },
  {
    id: "liam",
    name: "Liam Goldberg",
    initials: "LG",
    palette: "slate",
    friend: false,
    online: true,
    distanceYds: 900, // too far — never on your map, only via his beacon
    place: null,
    headline: "HBS MBA '26 · ex-McKinsey · Angel scout",
    school: "Harvard Business School, MBA 2026",
    work: "Ex-Associate, McKinsey & Co · Scout, Sequoia",
    hometown: "New York, NY",
    relationship: "Prefer not to say",
    openTo: ["Networking", "Investing"],
    sharedContext: "Running an open beacon at Spangler today",
    x: null, y: null,
    photos: [{ palette: "slate", caption: "Speaking at FinTech Club" }],
    prompts: [
      { q: "Talk to me about", a: "Consumer social, marketplaces, and why most pitches bore me." },
      { q: "Best way to say whats up", a: "In person, 60 seconds, no deck." },
    ],
    socials: ["LinkedIn"],
    posts: [],
  },
  {
    id: "david",
    name: "David Park",
    initials: "DP",
    palette: "mint",
    friend: false,
    online: true,
    distanceYds: 880, // searchable, but his location stays private
    place: null,
    headline: "University Recruiter @ Anthropic · Here for the career fair",
    school: "UC Berkeley '18",
    work: "University Recruiter, Anthropic",
    hometown: "San Francisco, CA",
    relationship: "Prefer not to say",
    openTo: ["Networking", "Hiring"],
    sharedContext: "Hiring for 2027 internships this week",
    x: null, y: null,
    photos: [{ palette: "mint", caption: "Career fair circuit, stop 4 of 9" }],
    prompts: [
      { q: "Best way to say whats up", a: "Find me at a career event — no application portal can tell you what we actually look for." },
    ],
    socials: ["LinkedIn"],
    posts: [],
  },
];

// Stylized landmarks for the fallback demo map (positions in %)
const PLACES = [
  { id: "yard", label: "Harvard Yard", x: 50, y: 41, type: "green" },
  { id: "sever", label: "Sever Hall", x: 47, y: 45.5, type: "label" },
  { id: "widener", label: "Widener Library", x: 52, y: 47, type: "label" },
  { id: "square", label: "Harvard Square", x: 43, y: 62, type: "label" },
  { id: "charles", label: "Charles River", x: 58, y: 93, type: "water" },
  { id: "hbs", label: "Harvard Business School", x: 73, y: 84, type: "label" },
  { id: "lamont", label: "Lamont Library", x: 57, y: 50, type: "label" },
  { id: "mac", label: "Malkin Athletic Center", x: 56, y: 67, type: "label" },
];

// Busy places near you — counts only, never individual locations
const HOTSPOTS = [
  {
    id: "spangler",
    name: "HBS Networking Night",
    place: "Spangler Center",
    icon: "🤝",
    count: 38,
    x: 73, y: 80,
    bearingDeg: 130, distanceYds: 950,
    sub: "Career mixer · 6–9pm",
  },
  {
    id: "bluebottle",
    name: "Blue Bottle Coffee",
    place: "Harvard Square",
    icon: "☕",
    count: 11,
    x: 39, y: 64,
    bearingDeg: 235, distanceYds: 180,
    sub: "Busy right now",
  },
  {
    id: "lamont-hs",
    name: "Lamont Library",
    place: "Study floors",
    icon: "📚",
    count: 19,
    x: 57, y: 50,
    bearingDeg: 75, distanceYds: 220,
    sub: "Quiet grind",
  },
  {
    id: "mac-hs",
    name: "Pickup Basketball",
    place: "MAC Courts",
    icon: "🏀",
    count: 8,
    x: 56, y: 69,
    bearingDeg: 115, distanceYds: 700,
    sub: "Game running",
  },
];

const BEACONS = [
  {
    id: "b1",
    personId: "emma",
    text: "Sketching at the museum café til 4 — come say whats up, I'll buy round two.",
    place: "Harvard Art Museums",
    expires: "1h 12m left",
    joined: 3,
  },
  {
    id: "b2",
    personId: "james",
    text: "Pickup basketball at the MAC, 6pm. Need 2 more, all levels.",
    place: "MAC Courts",
    expires: "Starts in 40m",
    joined: 6,
  },
  {
    id: "b3",
    personId: "liam",
    text: "At Spangler café talking consumer social + startups. Pitch me in person.",
    place: "Spangler Center, HBS",
    expires: "2h 30m left",
    joined: 9,
  },
];

const CHATS = [
  {
    personId: "emma",
    unread: true,
    time: "2:14 PM",
    messages: [
      { from: "them", text: "ok the beacon experiment worked WAY too well" },
      { from: "them", text: "three people I'd never met came up and said whats up at Blue Bottle 😂" },
      { from: "me", text: "haha that's literally the whole point!! who were they" },
      { from: "them", text: "a GSD designer, someone from my Gen Ed, and a guy who just wanted my table" },
      { from: "them", text: "2 out of 3 is a win. You coming to the exhibition Friday?" },
      { type: "meet", title: "Emma suggested meeting IRL", sub: "Fogg Museum · Friday 5:00 PM" },
    ],
  },
  {
    personId: "james",
    unread: true,
    time: "1:48 PM",
    messages: [
      { from: "me", text: "yo congrats on Stripe!! saw the post" },
      { from: "them", text: "appreciate you 🙏 the beacon mock interviews honestly carried me" },
      { from: "them", text: "you pulling up to the MAC tonight? need bodies" },
    ],
  },
  {
    personId: "sofia",
    unread: false,
    time: "11:02 AM",
    messages: [
      { from: "them", text: "Hey! Saw we were both at the climate summit — your founder talk question was sharp" },
      { from: "me", text: "thanks for saying that! I was nervous to ask haha" },
      { from: "them", text: "Never be. That's the whole game. Coffee this week? I'll drop a beacon when I'm free" },
      { from: "me", text: "deal — I'll keep an eye out for it" },
    ],
  },
  {
    personId: "priya",
    unread: false,
    time: "Yesterday",
    messages: [
      { from: "them", text: "we've been connected a week and still haven't met irl, this is against the spirit of the app 😤" },
      { from: "me", text: "you're right. tatte chai, tomorrow after lecture?" },
      { from: "them", text: "deal. I'll find you on the map 🫖" },
    ],
  },
];
