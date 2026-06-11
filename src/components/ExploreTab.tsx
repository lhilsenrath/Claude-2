import { useState } from 'react';
import { Profile } from '../data/profiles';

interface Props {
  profiles: Profile[];
  onProfileClick: (p: Profile) => void;
}

type ExploreView = 'main' | 'spark';

interface SparkEvent {
  id: string;
  title: string;
  location: string;
  distance: string;
  hostCount: number;
  category: string;
  expiresIn: string;
  hosts: { avatar: string; name: string }[];
  isJoined: boolean;
}

// Spark events — time-limited open-to-meet moments
const initialSparks: SparkEvent[] = [
  {
    id: 's1',
    title: 'Coffee & catch-up ☕',
    location: "Darwin's Coffee",
    distance: '0.2 mi',
    hostCount: 2,
    category: 'Social',
    expiresIn: '45 min',
    hosts: [],
    isJoined: false,
  },
  {
    id: 's2',
    title: 'Study break walk 🚶',
    location: 'Outside Widener',
    distance: '48 ft',
    hostCount: 1,
    category: 'Casual',
    expiresIn: '30 min',
    hosts: [],
    isJoined: false,
  },
  {
    id: 's3',
    title: 'Networking lunch 🍱',
    location: 'Harvard i-lab',
    distance: '0.5 mi',
    hostCount: 6,
    category: 'Professional',
    expiresIn: '1h 15m',
    hosts: [],
    isJoined: false,
  },
  {
    id: 's4',
    title: 'Startup pitch practice 🎤',
    location: 'HBS Spangler Hall',
    distance: '0.3 mi',
    hostCount: 4,
    category: 'Professional',
    expiresIn: '2h',
    hosts: [],
    isJoined: true,
  },
];

const categoryColors: Record<string, string> = {
  Social: '#00ADED',
  Casual: '#55EFC4',
  Professional: '#A29BFE',
};

function SparkView({ profiles, onProfileClick }: Props) {
  const [sparks, setSparks] = useState(initialSparks);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSpark, setNewSpark] = useState({ title: '', location: '', duration: '30 min' });
  const [mySparkActive, setMySparkActive] = useState(false);
  const [mySparkStatus, setMySparkStatus] = useState('');
  const [sparkStatusInput, setSparkStatusInput] = useState('');

  const toggleJoin = (id: string) => {
    setSparks(prev => prev.map(s => s.id === id
      ? { ...s, isJoined: !s.isJoined, hostCount: s.isJoined ? s.hostCount - 1 : s.hostCount + 1 }
      : s
    ));
  };

  const createSpark = () => {
    if (!newSpark.title || !newSpark.location) return;
    setSparks(prev => [{
      id: `s${Date.now()}`,
      title: newSpark.title,
      location: newSpark.location,
      distance: 'Here',
      hostCount: 1,
      category: 'Social',
      expiresIn: newSpark.duration,
      hosts: [],
      isJoined: true,
    }, ...prev]);
    setShowCreateForm(false);
    setNewSpark({ title: '', location: '', duration: '30 min' });
    setMySparkActive(true);
  };

  const sparkedProfiles = profiles.filter(p => p.isSparked);

  return (
    <div className="h-full flex flex-col fade-in">
      <div className="px-4 pt-12 pb-3 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.5px' }}>
              ⚡ Spark
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">Signal you're open to meet. Get offline.</p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-white shadow"
            style={{ background: '#00ADED' }}
          >
            + Create
          </button>
        </div>
      </div>

      <div className="flex-1 scrollable px-4 py-4 space-y-5">
        {/* My Spark status */}
        <div className="rounded-2xl border-2 p-4" style={{ borderColor: mySparkActive ? '#00ADED' : '#E5E7EB' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-2 h-2 rounded-full ${mySparkActive ? 'bg-green-400' : 'bg-gray-300'}`}/>
            <p className="text-sm font-semibold text-gray-800">Your Spark Status</p>
            {mySparkActive && (
              <span className="ml-auto text-[10px] font-semibold text-primary bg-blue-50 px-2 py-0.5 rounded-full">
                LIVE
              </span>
            )}
          </div>
          {mySparkActive ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 text-sm text-gray-700 bg-gray-50 rounded-xl px-3 py-2">
                {mySparkStatus || "I'm open to meet! 👋"}
              </div>
              <button
                onClick={() => setMySparkActive(false)}
                className="text-xs text-gray-400 font-medium"
              >
                Turn off
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={sparkStatusInput}
                onChange={e => setSparkStatusInput(e.target.value)}
                placeholder="What are you up to? (e.g. studying, grabbing coffee...)"
                className="flex-1 text-sm bg-gray-50 rounded-xl px-3 py-2 placeholder-gray-400"
              />
              <button
                onClick={() => { setMySparkActive(true); setMySparkStatus(sparkStatusInput || "I'm open to meet! 👋"); }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: '#00ADED' }}
              >
                ⚡ Spark
              </button>
            </div>
          )}
          <p className="text-[10px] text-gray-400 mt-2">
            When active, nearby people on WhatsUp can see you're open to connect in person.
          </p>
        </div>

        {/* Sparked nearby */}
        {sparkedProfiles.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              Sparked Nearby — {sparkedProfiles.length} people open to meet
            </p>
            <div className="space-y-2">
              {sparkedProfiles.map(p => (
                <button
                  key={p.id}
                  onClick={() => onProfileClick(p)}
                  className="w-full flex items-center gap-3 bg-gray-50 rounded-2xl p-3 text-left hover:bg-gray-100 transition-colors"
                >
                  <div className="relative">
                    <img src={p.avatar} alt={p.name} className="w-11 h-11 rounded-full" />
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                      <span className="text-[7px]">⚡</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500 truncate">{p.sparkStatus}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs font-medium text-primary">{p.distance}</span>
                    <span className="text-[10px] text-gray-400">{p.sparkExpiry}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Create form */}
        {showCreateForm && (
          <div className="rounded-2xl bg-gray-50 p-4 space-y-3">
            <p className="font-semibold text-sm text-gray-800">Create a Spark moment</p>
            <input
              value={newSpark.title}
              onChange={e => setNewSpark(p => ({ ...p, title: e.target.value }))}
              placeholder="What's happening? (e.g. Coffee + chat ☕)"
              className="w-full text-sm bg-white rounded-xl px-3 py-2.5 border border-gray-200 placeholder-gray-400"
            />
            <input
              value={newSpark.location}
              onChange={e => setNewSpark(p => ({ ...p, location: e.target.value }))}
              placeholder="Where? (e.g. Lamont Library)"
              className="w-full text-sm bg-white rounded-xl px-3 py-2.5 border border-gray-200 placeholder-gray-400"
            />
            <div className="flex gap-2">
              {['30 min', '1 hr', '2 hr'].map(d => (
                <button
                  key={d}
                  onClick={() => setNewSpark(p => ({ ...p, duration: d }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    newSpark.duration === d ? 'text-white' : 'bg-white text-gray-600 border border-gray-200'
                  }`}
                  style={newSpark.duration === d ? { background: '#00ADED' } : {}}
                >
                  {d}
                </button>
              ))}
            </div>
            <button
              onClick={createSpark}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#00ADED' }}
            >
              ⚡ Start Spark
            </button>
          </div>
        )}

        {/* Active sparks */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Spark Moments Nearby
          </p>
          <div className="space-y-3">
            {sparks.map(spark => (
              <div
                key={spark.id}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: categoryColors[spark.category] ?? '#9CA3AF' }}
                      >
                        {spark.category.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-gray-400">⏱ {spark.expiresIn} left</span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900">{spark.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">📍 {spark.location} · {spark.distance}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {spark.hostCount} {spark.hostCount === 1 ? 'person' : 'people'} going
                    </p>
                  </div>
                  <button
                    onClick={() => toggleJoin(spark.id)}
                    className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      spark.isJoined
                        ? 'bg-primary text-white'
                        : 'border border-primary text-primary'
                    }`}
                  >
                    {spark.isJoined ? '✓ Going' : 'Join'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pb-4 text-center">
          <p className="text-xs text-gray-400 italic">
            "The best connections happen face to face." 👋
          </p>
        </div>
      </div>
    </div>
  );
}

const trendingTopics = ['Harvard Startup Pitch 🚀', 'CS50 Study Group', 'Kennedy School Policy Forum', 'HBS Case Competition', 'MIT × Harvard Mixer'];

export default function ExploreTab({ profiles, onProfileClick }: Props) {
  const [view, setView] = useState<ExploreView>('main');
  const [search, setSearch] = useState('');

  if (view === 'spark') {
    return (
      <div className="h-full flex flex-col">
        <SparkView profiles={profiles} onProfileClick={onProfileClick} />
        <div className="absolute top-14 left-4">
          <button onClick={() => setView('main')} className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 5l-7 7 7 7" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  const filtered = search
    ? profiles.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.role.toLowerCase().includes(search.toLowerCase()) ||
        p.school.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div className="h-full flex flex-col fade-in">
      {/* Header */}
      <div className="px-4 pt-12 pb-3 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{ letterSpacing: '-0.5px' }}>Explore</h1>
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search people, schools, roles..."
            className="bg-transparent text-sm text-gray-800 placeholder-gray-400 flex-1"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 text-sm">✕</button>
          )}
        </div>
      </div>

      <div className="flex-1 scrollable">
        {/* Search results */}
        {filtered.length > 0 ? (
          <div className="px-4 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">People</p>
            <div className="space-y-3">
              {filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => onProfileClick(p)}
                  className="w-full flex items-center gap-3 hover:bg-gray-50 rounded-xl p-2 -mx-2 transition-colors"
                >
                  <img src={p.avatar} alt={p.name} className="w-11 h-11 rounded-full" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-500 truncate">{p.role} · {p.school}</p>
                  </div>
                  <span className="text-xs text-gray-400">{p.distance}</span>
                </button>
              ))}
            </div>
          </div>
        ) : search ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm">
            No results for "{search}"
          </div>
        ) : (
          <div className="px-4 pt-4 space-y-6">
            {/* ⚡ Spark CTA */}
            <button
              onClick={() => setView('spark')}
              className="w-full rounded-2xl p-4 text-left overflow-hidden relative"
              style={{ background: 'linear-gradient(135deg, #00ADED, #6C5CE7)' }}
            >
              <p className="text-white font-bold text-lg mb-0.5">⚡ Spark Mode</p>
              <p className="text-white/80 text-sm">Signal you're open to meet. See who's nearby and ready to connect IRL.</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  {profiles.filter(p => p.isSparked).length} people sparked nearby →
                </span>
              </div>
            </button>

            {/* Nearby people */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800">People Nearby</p>
                <span className="text-xs text-primary font-medium">{profiles.length} within 1 mi</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {profiles.slice(0, 4).map(p => (
                  <button
                    key={p.id}
                    onClick={() => onProfileClick(p)}
                    className="flex flex-col items-center gap-2 bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="relative">
                      <img src={p.avatar} alt={p.name} className="w-14 h-14 rounded-full" />
                      {p.isSparked && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                          <span className="text-[7px]">⚡</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-xs text-gray-900">{p.name.split(' ')[0]}</p>
                      <p className="text-[10px] text-gray-500 truncate max-w-[80px]">{p.distance} away</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trending nearby */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-3">Trending on Campus</p>
              <div className="space-y-2">
                {trendingTopics.map((topic, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50">
                    <span className="text-xs font-bold text-gray-300 w-5">{i + 1}</span>
                    <p className="text-sm text-gray-700 font-medium flex-1">{topic}</p>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18l6-6-6-6" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
