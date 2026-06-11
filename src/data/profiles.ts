export interface Profile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  coverPhoto: string;
  role: string;
  company: string;
  school: string;
  degree: string;
  location: string;
  lat: number;
  lng: number;
  distance: string;
  relationshipStatus: string;
  bio: string;
  isConnected: boolean;
  isSparked?: boolean;
  sparkStatus?: string;
  sparkExpiry?: string;
  followers: number;
  connections: number;
  photos: string[];
  prompts: { question: string; answer: string }[];
  experience: { role: string; company: string; duration: string; logo: string }[];
  socials: { platform: string; handle: string }[];
  posts: Post[];
  mutualConnections: number;
  lastSeen: string;
}

export interface Post {
  id: string;
  authorId: string;
  type: 'photo' | 'text' | 'work_update';
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  liked: boolean;
}

export interface Message {
  id: string;
  profileId: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
}

// Avatars using abstract gradient-based SVG data URIs — no external deps
const avatarColors: Record<string, [string, string]> = {
  emma:    ['#FF6B9D', '#C44569'],
  james:   ['#00ADED', '#0067A5'],
  sofia:   ['#A29BFE', '#6C5CE7'],
  marcus:  ['#55EFC4', '#00B894'],
  priya:   ['#FDCB6E', '#E17055'],
  liam:    ['#74B9FF', '#0984E3'],
  olivia:  ['#FD79A8', '#E84393'],
  noah:    ['#81ECEC', '#00CEC9'],
  you:     ['#00ADED', '#0067A5'],
};

function makeAvatar(initials: string, key: string): string {
  const [c1, c2] = avatarColors[key] ?? ['#999', '#555'];
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'>
    <defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='${c1}'/>
      <stop offset='100%' stop-color='${c2}'/>
    </linearGradient></defs>
    <rect width='100' height='100' rx='50' fill='url(#g)'/>
    <text x='50' y='50' font-family='Inter,sans-serif' font-size='36' font-weight='600'
      fill='white' text-anchor='middle' dominant-baseline='central'>${initials}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function makeCover(color: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='150'>
    <defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='${color}22'/>
      <stop offset='100%' stop-color='${color}55'/>
    </linearGradient></defs>
    <rect width='400' height='150' fill='url(#g)'/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

function makePhoto(color1: string, color2: string, label: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
    <defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'>
      <stop offset='0%' stop-color='${color1}'/>
      <stop offset='100%' stop-color='${color2}'/>
    </linearGradient></defs>
    <rect width='300' height='300' fill='url(#g)'/>
    <text x='150' y='150' font-family='Inter,sans-serif' font-size='14' font-weight='500'
      fill='white' text-anchor='middle' dominant-baseline='central' opacity='0.7'>${label}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export const profiles: Profile[] = [
  {
    id: 'emma',
    name: 'Emma Chen',
    age: 22,
    avatar: makeAvatar('EC', 'emma'),
    coverPhoto: makeCover('#FF6B9D'),
    role: 'CS + Psychology',
    company: '',
    school: 'Harvard University',
    degree: "B.A. Computer Science & Psychology, '25",
    location: 'Cambridge, MA',
    lat: 42.3744,
    lng: -71.1169,
    distance: '48 ft',
    relationshipStatus: 'Single',
    bio: 'Building things that help people connect. Coffee shop devotee. Ask me about my thesis on human-computer interaction.',
    isConnected: false,
    isSparked: true,
    sparkStatus: 'Studying at Lamont Library ☕',
    sparkExpiry: '45 min',
    followers: 847,
    connections: 312,
    photos: [
      makePhoto('#FF6B9D', '#C44569', '📸 Photo 1'),
      makePhoto('#C44569', '#FF6B9D', '📸 Photo 2'),
      makePhoto('#FF8FAB', '#FF4081', '📸 Photo 3'),
    ],
    prompts: [
      { question: "I'm the type of person who...", answer: "befriends the barista within two visits." },
      { question: "Ideal Sunday morning", answer: "Farmers market → NYT crossword → spontaneous drive to the Cape." },
      { question: "Most spontaneous thing I've done", answer: "Booked a one-way to Tokyo. Figured out the return later." },
      { question: "Change my mind:", answer: "Remote work is overrated. The best ideas happen in hallways." },
    ],
    experience: [
      { role: 'Product Design Intern', company: 'Figma', duration: 'Summer 2024', logo: '🎨' },
      { role: 'Research Assistant', company: 'MIT Media Lab', duration: '2023–Present', logo: '🔬' },
    ],
    socials: [
      { platform: 'Instagram', handle: '@emmachen' },
      { platform: 'LinkedIn', handle: 'emma-chen-hbs' },
    ],
    posts: [
      {
        id: 'p1',
        authorId: 'emma',
        type: 'text',
        content: "Just defended my thesis proposal on embodied cognition in social apps 🎓 The future of connection is physical, not digital. More soon.",
        timestamp: '2h ago',
        likes: 94,
        comments: 12,
        liked: false,
      },
      {
        id: 'p2',
        authorId: 'emma',
        type: 'photo',
        content: 'Cambridge in the fall hits different 🍂',
        image: makePhoto('#FF6B9D', '#FDCB6E', '🍂 Campus Fall'),
        timestamp: '3d ago',
        likes: 231,
        comments: 18,
        liked: false,
      },
    ],
    mutualConnections: 7,
    lastSeen: 'Now',
  },
  {
    id: 'james',
    name: 'James Okafor',
    age: 24,
    avatar: makeAvatar('JO', 'james'),
    coverPhoto: makeCover('#00ADED'),
    role: 'Associate @ Goldman Sachs',
    company: 'Goldman Sachs',
    school: 'Harvard Business School',
    degree: 'MBA, Class of 2025',
    location: 'Cambridge, MA',
    lat: 42.3673,
    lng: -71.1183,
    distance: '0.2 mi',
    relationshipStatus: 'Single',
    bio: 'VC-track after HBS. From Lagos to Cambridge. Into emerging markets, fintech, and finding the best jollof rice in Boston.',
    isConnected: true,
    isSparked: false,
    followers: 1204,
    connections: 890,
    photos: [
      makePhoto('#00ADED', '#0067A5', '📸 Photo 1'),
      makePhoto('#0084B4', '#00ADED', '📸 Photo 2'),
      makePhoto('#33BDEF', '#0067A5', '📸 Photo 3'),
    ],
    prompts: [
      { question: "A fact people are surprised to learn about me", answer: "I was a national chess champion at 15." },
      { question: "I geek out on", answer: "Macroeconomics of Sub-Saharan Africa. Seriously, ask me." },
      { question: "My most irrational belief", answer: "The perfect playlist can fix any problem." },
    ],
    experience: [
      { role: 'Investment Banking Associate', company: 'Goldman Sachs', duration: '2023–2024', logo: '💼' },
      { role: 'VP of Finance', company: 'HBS Africa Business Club', duration: '2024–Present', logo: '🌍' },
    ],
    socials: [
      { platform: 'LinkedIn', handle: 'james-okafor-hbs' },
      { platform: 'Twitter/X', handle: '@jamesokafor' },
    ],
    posts: [
      {
        id: 'p3',
        authorId: 'james',
        type: 'work_update',
        content: "Excited to announce I'll be joining Andreessen Horowitz as an investor post-graduation, focusing on African tech ecosystems 🌍🚀",
        timestamp: '1d ago',
        likes: 412,
        comments: 67,
        liked: true,
      },
    ],
    mutualConnections: 14,
    lastSeen: '5m ago',
  },
  {
    id: 'sofia',
    name: 'Sofia Marchetti',
    age: 23,
    avatar: makeAvatar('SM', 'sofia'),
    coverPhoto: makeCover('#A29BFE'),
    role: 'Medical Student',
    company: '',
    school: 'Harvard Medical School',
    degree: 'M.D. Candidate, Class of 2028',
    location: 'Boston, MA',
    lat: 42.3361,
    lng: -71.1047,
    distance: '0.6 mi',
    relationshipStatus: 'In a relationship',
    bio: 'Future neurosurgeon. Italian-American. Will argue passionately that carbonara has no cream. Part-time marathon runner.',
    isConnected: false,
    isSparked: true,
    sparkStatus: 'At HMS Quad, open to chat 🩺',
    sparkExpiry: '1h',
    followers: 562,
    connections: 445,
    photos: [
      makePhoto('#A29BFE', '#6C5CE7', '📸 Photo 1'),
      makePhoto('#6C5CE7', '#A29BFE', '📸 Photo 2'),
      makePhoto('#DDA0DD', '#9B59B6', '📸 Photo 3'),
    ],
    prompts: [
      { question: "You'll win me over with", answer: "A good book recommendation and strong opinions about it." },
      { question: "Unpopular opinion:", answer: "Board games are more fun than bars. Every time." },
      { question: "My love language is", answer: "Quality time — phones down, actually present." },
    ],
    experience: [
      { role: 'Clinical Research Intern', company: 'MGH Neurology', duration: 'Summer 2024', logo: '🏥' },
      { role: 'Undergraduate Researcher', company: 'MIT Brain + Cog Sci', duration: '2021–2023', logo: '🧠' },
    ],
    socials: [
      { platform: 'Instagram', handle: '@sofiamarchetti' },
    ],
    posts: [
      {
        id: 'p4',
        authorId: 'sofia',
        type: 'photo',
        content: 'Boston Marathon training hits different when you start at 5am before rounds 🏃‍♀️',
        image: makePhoto('#A29BFE', '#FD79A8', '🏃 Running'),
        timestamp: '6h ago',
        likes: 178,
        comments: 24,
        liked: false,
      },
    ],
    mutualConnections: 3,
    lastSeen: '12m ago',
  },
  {
    id: 'marcus',
    name: 'Marcus Reid',
    age: 25,
    avatar: makeAvatar('MR', 'marcus'),
    coverPhoto: makeCover('#55EFC4'),
    role: 'Software Engineer @ Stripe',
    company: 'Stripe',
    school: 'Harvard University',
    degree: 'B.S. Computer Science, 2023',
    location: 'Cambridge, MA',
    lat: 42.3776,
    lng: -71.1157,
    distance: '0.1 mi',
    relationshipStatus: 'Single',
    bio: "Ex-HarvardCode, now building payments infrastructure at Stripe. Weekend: building side projects no one asked for but everyone needs.",
    isConnected: true,
    isSparked: false,
    followers: 2341,
    connections: 1204,
    photos: [
      makePhoto('#55EFC4', '#00B894', '📸 Photo 1'),
      makePhoto('#00B894', '#55EFC4', '📸 Photo 2'),
      makePhoto('#00CEC9', '#81ECEC', '📸 Photo 3'),
    ],
    prompts: [
      { question: "Two truths and a lie:", answer: "I've shipped code from a tent. I once beat Magnus Carlsen in blitz. I speak three languages." },
      { question: "Currently reading", answer: "SICP, Thinking Fast and Slow, and way too many Hacker News threads." },
    ],
    experience: [
      { role: 'Software Engineer', company: 'Stripe', duration: '2023–Present', logo: '💳' },
      { role: 'SWE Intern', company: 'Meta', duration: 'Summer 2022', logo: '📘' },
    ],
    socials: [
      { platform: 'GitHub', handle: 'marcusreid' },
      { platform: 'Twitter/X', handle: '@marcusbuilds' },
      { platform: 'LinkedIn', handle: 'marcus-reid-dev' },
    ],
    posts: [
      {
        id: 'p5',
        authorId: 'marcus',
        type: 'text',
        content: "Hot take: the best way to learn system design is to build something real and have it break in production. Shipping > studying.",
        timestamp: '4h ago',
        likes: 563,
        comments: 89,
        liked: false,
      },
    ],
    mutualConnections: 22,
    lastSeen: '1h ago',
  },
  {
    id: 'priya',
    name: 'Priya Nair',
    age: 22,
    avatar: makeAvatar('PN', 'priya'),
    coverPhoto: makeCover('#FDCB6E'),
    role: 'Kennedy School, MPP',
    company: '',
    school: 'Harvard Kennedy School',
    degree: 'Master of Public Policy, 2026',
    location: 'Cambridge, MA',
    lat: 42.3709,
    lng: -71.1213,
    distance: '0.3 mi',
    relationshipStatus: 'Single',
    bio: "Policy nerd turned reluctant startup person. Focused on climate + emerging markets. Grew up in Chennai, studying the world.",
    isConnected: false,
    isSparked: false,
    followers: 731,
    connections: 620,
    photos: [
      makePhoto('#FDCB6E', '#E17055', '📸 Photo 1'),
      makePhoto('#E17055', '#FDCB6E', '📸 Photo 2'),
      makePhoto('#FAB1A0', '#E17055', '📸 Photo 3'),
    ],
    prompts: [
      { question: "I want someone who", answer: "argues with me about ideas, then grabs dinner anyway." },
      { question: "Most passionate about", answer: "Making clean energy financing accessible in the Global South." },
      { question: "Biggest green flag", answer: "Has read at least one book this year. Any book." },
    ],
    experience: [
      { role: 'Policy Research Fellow', company: 'World Bank', duration: 'Summer 2024', logo: '🌐' },
      { role: 'Climate Policy Analyst', company: 'RMI', duration: '2023–2024', logo: '🌱' },
    ],
    socials: [
      { platform: 'LinkedIn', handle: 'priya-nair-hks' },
      { platform: 'Substack', handle: '@priyanair' },
    ],
    posts: [
      {
        id: 'p6',
        authorId: 'priya',
        type: 'work_update',
        content: "Published my first piece on carbon market reform in developing economies. Link in bio. Would love feedback from anyone working in this space 🌍",
        timestamp: '1d ago',
        likes: 287,
        comments: 41,
        liked: false,
      },
    ],
    mutualConnections: 5,
    lastSeen: '30m ago',
  },
];

export const currentUser: Profile = {
  id: 'you',
  name: 'Alex Torres',
  age: 22,
  avatar: makeAvatar('AT', 'you'),
  coverPhoto: makeCover('#00ADED'),
  role: 'CS + Economics',
  company: '',
  school: 'Harvard University',
  degree: 'B.S. Computer Science & Economics, \'26',
  location: 'Cambridge, MA',
  lat: 42.3750,
  lng: -71.1190,
  distance: 'You',
  relationshipStatus: 'Single',
  bio: 'Building WhatsUp. Into markets, startups, and meeting people IRL. Always down for a coffee chat.',
  isConnected: false,
  isSparked: false,
  followers: 413,
  connections: 287,
  photos: [
    makePhoto('#00ADED', '#0067A5', '📸 Photo 1'),
    makePhoto('#33BDEF', '#00ADED', '📸 Photo 2'),
    makePhoto('#00ADED', '#74B9FF', '📸 Photo 3'),
  ],
  prompts: [
    { question: "You'll find me on weekends", answer: "Hackathons, Charles River runs, or convinced I'm about to learn guitar." },
    { question: "Ideal first hangout", answer: "Walk around campus + grab coffee. No agenda, just talk." },
    { question: "I'm looking for", answer: "Genuine people with big ideas and low egos." },
  ],
  experience: [
    { role: 'Founder', company: 'WhatsUp', duration: '2024–Present', logo: '🚀' },
    { role: 'SWE Intern', company: 'Palantir', duration: 'Summer 2024', logo: '💡' },
  ],
  socials: [
    { platform: 'LinkedIn', handle: 'alex-torres-harvard' },
    { platform: 'GitHub', handle: 'alextorres' },
  ],
  posts: [],
  mutualConnections: 0,
  lastSeen: 'Now',
};

export const messages: Message[] = [
  {
    id: 'm1',
    profileId: 'james',
    lastMessage: 'Would love to grab coffee and hear more about WhatsUp!',
    timestamp: '10m',
    unread: 2,
    messages: [
      { id: 'c1', senderId: 'james', text: 'Hey! Met you briefly at the CS mixer last week.', timestamp: '2:30 PM' },
      { id: 'c2', senderId: 'you', text: 'Yeah! Great to meet you. You\'re doing the HBS MBA right?', timestamp: '2:32 PM' },
      { id: 'c3', senderId: 'james', text: 'Exactly. Heard you\'re building something cool in the networking space.', timestamp: '2:33 PM' },
      { id: 'c4', senderId: 'james', text: 'Would love to grab coffee and hear more about WhatsUp!', timestamp: '2:35 PM' },
    ],
  },
  {
    id: 'm2',
    profileId: 'marcus',
    lastMessage: "Let's do it — Monday at Darwin's?",
    timestamp: '1h',
    unread: 0,
    messages: [
      { id: 'c5', senderId: 'you', text: 'Marcus! We should sync up about the Stripe API for WhatsUp payments.', timestamp: '11:00 AM' },
      { id: 'c6', senderId: 'marcus', text: 'Absolutely. I have some ideas. When are you free?', timestamp: '11:15 AM' },
      { id: 'c7', senderId: 'you', text: 'Monday morning?', timestamp: '11:20 AM' },
      { id: 'c8', senderId: 'marcus', text: "Let's do it — Monday at Darwin's?", timestamp: '11:21 AM' },
    ],
  },
];
