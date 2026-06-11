import { useState } from 'react';
import { Profile } from '../data/profiles';

interface Props {
  profiles: Profile[];
  onProfileClick: (p: Profile) => void;
}

interface Moment {
  id: string;
  title: string;
  location: string;
  distance: string;
  goingCount: number;
  category: 'Social' | 'Casual' | 'Professional';
  timeLabel: string;
  isJoined: boolean;
}

// Moments — real-world meetups anyone can create or join, anytime
const initialMoments: Moment[] = [
  {
    id: 's1',
    title: 'Coffee & catch-up ☕',
    location: "Darwin's Coffee",
    distance: '0.2 mi',
    goingCount: 3,
    category: 'Social',
    timeLabel: 'Happening now',
    isJoined: false,
  },
  {
    id: 's3',
    title: 'Networking lunch 🍱',
    location: 'Harvard i-lab',
    distance: '0.5 mi',
    goingCount: 8,
    category: 'Professional',
    timeLabel: 'Today, 12:30 PM',
    isJoined: false,
  },
  {
    id: 's4',
    title: 'Startup pitch practice 🎤',
    location: 'HBS Spangler Hall',
    distance: '0.3 mi',
    goingCount: 5,
    category: 'Professional',
    timeLabel: 'Today, 4 PM',
    isJoined: true,
  },
  {
    id: 's2',
    title: 'Sunset run along the Charles 🏃',
    location: 'Weeks Footbridge',
    distance: '0.4 mi',
    goingCount: 6,
    category: 'Casual',
    timeLabel: 'Today, 6 PM',
    isJoined: false,
  },
];

const categoryColors: Record<Moment['category'], string> = {
  Social: '#00ADED',
  Casual: '#00B894',
  Professional: '#6C5CE7',
};

const statusSuggestions = ['☕ coffee', '🍱 lunch', '🏃 a run', '📚 studying together', '💼 networking'];

const trendingTopics = ['Harvard Startup Pitch 🚀', 'CS50 Study Group', 'Kennedy School Policy Forum', 'HBS Case Competition', 'MIT × Harvard Mixer'];

export default function ExploreTab({ profiles, onProfileClick }: Props) {
  const [search, setSearch] = useState('');
  const [moments, setMoments] = useState(initialMoments);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMoment, setNewMoment] = useState({ title: '', location: '' });
  const [myStatus, setMyStatus] = useState<string | null>(null);
  const [statusInput, setStatusInput] = useState('');

  const toggleJoin = (id: string) => {
    setMoments(prev => prev.map(m => m.id === id
      ? { ...m, isJoined: !m.isJoined, goingCount: m.isJoined ? m.goingCount - 1 : m.goingCount + 1 }
      : m
    ));
  };

  const createMoment = () => {
    if (!newMoment.title || !newMoment.location) return;
    setMoments(prev => [{
      id: `s${Date.now()}`,
      title: newMoment.title,
      location: newMoment.location,
      distance: 'Here',
      goingCount: 1,
      category: 'Social',
      timeLabel: 'Happening now',
      isJoined: true,
    }, ...prev]);
    setShowCreateForm(false);
    setNewMoment({ title: '', location: '' });
  };

  const openProfiles = profiles.filter(p => p.status);

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
        {search ? (
          /* ── Search results ─────────────────────────── */
          filtered.length > 0 ? (
            <div className="px-4 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">People</p>
              <div className="space-y-1">
                {filtered.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onProfileClick(p)}
                    className="w-full flex items-center gap-3 hover:bg-gray-50 rounded-xl p-2 transition-colors"
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
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm">
              No results for "{search}"
            </div>
          )
        ) : (
          <div className="px-4 pt-4 space-y-6 pb-6">
            {/* ── Your "Up For..." status ──────────────── */}
            <div className="rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #00ADED, #6C5CE7)' }}>
              <p className="font-bold text-base mb-0.5">👋 What are you up for?</p>
              <p className="text-white/75 text-xs mb-3">
                Set an optional status so people nearby know you're open to it. You're always on the map either way.
              </p>
              {myStatus ? (
                <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2.5">
                  <p className="flex-1 text-sm font-medium">Up for {myStatus}</p>
                  <button onClick={() => setMyStatus(null)} className="text-white/70 text-xs font-semibold">Clear</button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <input
                      value={statusInput}
                      onChange={e => setStatusInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && statusInput && (setMyStatus(statusInput), setStatusInput(''))}
                      placeholder="coffee, a run, a study session..."
                      className="flex-1 text-sm bg-white/15 rounded-xl px-3 py-2 placeholder-white/50 text-white"
                    />
                    <button
                      onClick={() => { if (statusInput) { setMyStatus(statusInput); setStatusInput(''); } }}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-white"
                      style={{ color: '#00ADED' }}
                    >
                      Set
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {statusSuggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => setMyStatus(s)}
                        className="text-[11px] font-medium bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ── Up For It nearby ─────────────────────── */}
            {openProfiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800">👋 Up For It Nearby</p>
                  <span className="text-xs text-gray-400">{openProfiles.length} people</span>
                </div>
                <div className="space-y-2">
                  {openProfiles.map(p => (
                    <button
                      key={p.id}
                      onClick={() => onProfileClick(p)}
                      className="w-full flex items-center gap-3 bg-gray-50 rounded-2xl p-3 text-left hover:bg-gray-100 transition-colors"
                    >
                      <div className="relative">
                        <img src={p.avatar} alt={p.name} className="w-11 h-11 rounded-full" />
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                          <span className="text-[7px]">👋</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-500 truncate">{p.status}</p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="text-xs font-medium" style={{ color: '#00ADED' }}>{p.distance}</span>
                        <span className="text-[10px] text-gray-400">{p.statusSetAt}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Moments ──────────────────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800">📍 Moments Near You</p>
                <button
                  onClick={() => setShowCreateForm(v => !v)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full text-white"
                  style={{ background: '#00ADED' }}
                >
                  + Create
                </button>
              </div>

              {showCreateForm && (
                <div className="rounded-2xl bg-gray-50 p-4 space-y-2.5 mb-3">
                  <input
                    value={newMoment.title}
                    onChange={e => setNewMoment(p => ({ ...p, title: e.target.value }))}
                    placeholder="What's happening? (e.g. Coffee + chat ☕)"
                    className="w-full text-sm bg-white rounded-xl px-3 py-2.5 border border-gray-200 placeholder-gray-400"
                  />
                  <input
                    value={newMoment.location}
                    onChange={e => setNewMoment(p => ({ ...p, location: e.target.value }))}
                    placeholder="Where? (e.g. Lamont Library)"
                    className="w-full text-sm bg-white rounded-xl px-3 py-2.5 border border-gray-200 placeholder-gray-400"
                  />
                  <button
                    onClick={createMoment}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: '#00ADED' }}
                  >
                    Post Moment
                  </button>
                </div>
              )}

              <div className="space-y-2.5">
                {moments.map(m => (
                  <div key={m.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                            style={{ background: categoryColors[m.category] }}>
                            {m.category.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-gray-400">{m.timeLabel}</span>
                        </div>
                        <p className="font-semibold text-sm text-gray-900">{m.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">📍 {m.location} · {m.distance}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {m.goingCount} {m.goingCount === 1 ? 'person' : 'people'} going
                        </p>
                      </div>
                      <button
                        onClick={() => toggleJoin(m.id)}
                        className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                          m.isJoined ? 'text-white' : 'border text-primary border-primary'
                        }`}
                        style={m.isJoined ? { background: '#00ADED' } : {}}
                      >
                        {m.isJoined ? '✓ Going' : 'Join'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── People nearby grid ───────────────────── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-800">People Nearby</p>
                <span className="text-xs font-medium" style={{ color: '#00ADED' }}>{profiles.length} within 1 mi</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {profiles.slice(0, 6).map(p => (
                  <button
                    key={p.id}
                    onClick={() => onProfileClick(p)}
                    className="flex flex-col items-center gap-2 bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="relative">
                      <img src={p.avatar} alt={p.name} className="w-14 h-14 rounded-full" />
                      {p.status && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                          <span className="text-[7px]">👋</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-xs text-gray-900">{p.name.split(' ')[0]}</p>
                      <p className="text-[10px] text-gray-500">{p.distance} away</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* ── Trending ─────────────────────────────── */}
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

            <p className="text-xs text-gray-400 italic text-center pb-2">
              "The best connections happen face to face." 👋
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
