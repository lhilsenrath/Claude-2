import { useState } from 'react';
import { Profile, currentUser } from '../data/profiles';

interface Props {
  profiles: Profile[];
  onProfileClick: (p: Profile) => void;
}

const landmarks = [
  { name: 'Widener Library', x: 48, y: 40, icon: '📚' },
  { name: 'Harvard Yard', x: 53, y: 50, icon: '🌳' },
  { name: 'Science Center', x: 38, y: 30, icon: '🔬' },
  { name: 'Harvard Square', x: 42, y: 70, icon: '☕' },
  { name: 'Kennedy School', x: 25, y: 58, icon: '🏛️' },
  { name: 'i-lab', x: 70, y: 62, icon: '🚀' },
];

const profilePositions: Record<string, { x: number; y: number }> = {
  emma:   { x: 52, y: 36 },
  james:  { x: 42, y: 60 },
  sofia:  { x: 64, y: 76 },
  marcus: { x: 58, y: 28 },
  priya:  { x: 28, y: 52 },
  liam:   { x: 35, y: 42 },
  olivia: { x: 70, y: 56 },
};

export default function MapTab({ profiles, onProfileClick }: Props) {
  const [filter, setFilter] = useState<'all' | 'connections' | 'open'>('all');
  const [ghostMode, setGhostMode] = useState(false);
  const [peekedId, setPeekedId] = useState<string | null>(null);

  const filteredProfiles = profiles.filter(p => {
    if (filter === 'connections') return p.isConnected;
    if (filter === 'open') return !!p.status;
    return true;
  });

  const peeked = profiles.find(p => p.id === peekedId);

  return (
    <div className="h-full relative fade-in bg-[#EEF2F7] overflow-hidden">
      {/* ── Map base ─────────────────────────────────── */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <rect width="100" height="100" fill="#EEF2F7"/>

        {/* Green spaces */}
        <ellipse cx="50" cy="48" rx="20" ry="15" fill="#D7EAC4" opacity="0.8"/>
        <ellipse cx="33" cy="33" rx="10" ry="8" fill="#D7EAC4" opacity="0.55"/>
        <ellipse cx="68" cy="68" rx="9" ry="7" fill="#D7EAC4" opacity="0.55"/>

        {/* Streets */}
        <line x1="0" y1="55" x2="100" y2="55" stroke="#CDD5E0" strokeWidth="1.6"/>
        <line x1="0" y1="37" x2="100" y2="37" stroke="#CDD5E0" strokeWidth="1.2"/>
        <line x1="0" y1="73" x2="100" y2="73" stroke="#CDD5E0" strokeWidth="1.6"/>
        <line x1="40" y1="0" x2="40" y2="100" stroke="#CDD5E0" strokeWidth="1.6"/>
        <line x1="60" y1="0" x2="60" y2="100" stroke="#CDD5E0" strokeWidth="1.2"/>
        <line x1="22" y1="0" x2="22" y2="100" stroke="#CDD5E0" strokeWidth="1"/>
        <line x1="78" y1="0" x2="78" y2="100" stroke="#CDD5E0" strokeWidth="1"/>

        {/* Buildings */}
        <rect x="43" y="34" width="14" height="11" rx="1" fill="#DEE5F0" stroke="#C9D3E3" strokeWidth="0.4"/>
        <rect x="29" y="44" width="8" height="7" rx="1" fill="#DEE5F0" stroke="#C9D3E3" strokeWidth="0.4"/>
        <rect x="62" y="58" width="11" height="8" rx="1" fill="#DEE5F0" stroke="#C9D3E3" strokeWidth="0.4"/>
        <rect x="44" y="59" width="12" height="9" rx="1" fill="#DEE5F0" stroke="#C9D3E3" strokeWidth="0.4"/>
        <rect x="31" y="26" width="7" height="7" rx="1" fill="#DEE5F0" stroke="#C9D3E3" strokeWidth="0.4"/>
        <rect x="63" y="28" width="9" height="7" rx="1" fill="#DEE5F0" stroke="#C9D3E3" strokeWidth="0.4"/>

        {/* Water */}
        <path d="M70 8 Q85 14 96 10 L100 0 L65 0 Z" fill="#C5DDEF" opacity="0.7"/>
        <text x="83" y="9" textAnchor="middle" fontSize="2.4" fill="#7BAECF" fontFamily="sans-serif">Charles River</text>
      </svg>

      {/* Landmark labels */}
      {landmarks.map(l => (
        <div key={l.name} className="absolute pointer-events-none"
          style={{ left: `${l.x}%`, top: `${l.y}%`, transform: 'translate(-50%,-50%)' }}>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-base drop-shadow-sm">{l.icon}</span>
            <span className="text-[8px] text-gray-500 font-medium whitespace-nowrap bg-white/70 px-1 rounded">
              {l.name}
            </span>
          </div>
        </div>
      ))}

      {/* ── You ──────────────────────────────────────── */}
      <div className="absolute z-10" style={{ left: '50%', top: '48%', transform: 'translate(-50%,-50%)' }}>
        <div className="relative">
          {!ghostMode && (
            <div className="absolute rounded-full bg-primary pulse-ring"
              style={{ width: 40, height: 40, left: -8, top: -8 }}/>
          )}
          <div className={`w-6 h-6 rounded-full border-2 border-white shadow-md overflow-hidden transition-opacity ${ghostMode ? 'opacity-40' : ''}`}>
            <img src={currentUser.avatar} alt="You" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow"
            style={{ background: ghostMode ? '#9CA3AF' : '#00ADED' }}>
            {ghostMode ? '👻 Hidden' : 'You'}
          </div>
        </div>
      </div>

      {/* ── People ───────────────────────────────────── */}
      {filteredProfiles.map(profile => {
        const pos = profilePositions[profile.id];
        if (!pos) return null;
        const isPeeked = peekedId === profile.id;
        return (
          <button
            key={profile.id}
            onClick={() => setPeekedId(isPeeked ? null : profile.id)}
            className="absolute map-dot"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)', zIndex: isPeeked ? 20 : 5 }}
          >
            <div className="relative">
              {/* Status halo — has an "Up For" status */}
              {profile.status && (
                <div className="absolute rounded-full border-2 pulse-ring"
                  style={{ borderColor: '#00ADED', width: 46, height: 46, left: -5, top: -5 }}/>
              )}
              <div className={`p-0.5 rounded-full shadow-md ${profile.isConnected ? '' : 'bg-white'}`}
                style={profile.isConnected ? { background: 'linear-gradient(135deg, #00ADED, #6C5CE7)' } : {}}>
                <img src={profile.avatar} alt={profile.name}
                  className="w-9 h-9 rounded-full border-2 border-white object-cover"/>
              </div>
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[7px] font-medium px-1 py-0.5 rounded-full whitespace-nowrap shadow">
                {profile.distance}
              </div>
              {profile.status && (
                <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-primary border border-white flex items-center justify-center">
                  <span className="text-[6px]">👋</span>
                </div>
              )}
            </div>
          </button>
        );
      })}

      {/* ── Peek card (tap dot → quick preview) ──────── */}
      {peeked && (
        <div className="absolute bottom-24 left-4 right-4 z-30 slide-up">
          <div className="bg-white rounded-2xl shadow-xl p-4">
            <div className="flex items-center gap-3">
              <img src={peeked.avatar} alt={peeked.name} className="w-12 h-12 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900">{peeked.name}, {peeked.age}</p>
                <p className="text-xs text-gray-500 truncate">{peeked.role} · {peeked.school}</p>
                {peeked.status && (
                  <p className="text-xs font-medium mt-0.5" style={{ color: '#00ADED' }}>{peeked.status}</p>
                )}
              </div>
              <button onClick={() => setPeekedId(null)} className="text-gray-300 text-lg leading-none px-1">✕</button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => { onProfileClick(peeked); setPeekedId(null); }}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white"
                style={{ background: '#00ADED' }}
              >
                View Profile
              </button>
              <button className="flex-1 py-2 rounded-xl text-xs font-semibold border border-gray-200 text-gray-700">
                👋 Wave
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Search bar overlay ───────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-12 px-4 pointer-events-none">
        <div className="pointer-events-auto bg-white/90 backdrop-blur rounded-2xl shadow-sm px-4 py-2.5 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-gray-400 text-sm flex-1">Search people, places...</span>
          {/* Ghost mode toggle */}
          <button
            onClick={() => setGhostMode(g => !g)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-colors"
            style={{ background: ghostMode ? '#374151' : '#00ADED1A' }}
            title="Ghost mode — hide your location"
          >
            <span className="text-xs">{ghostMode ? '👻' : '📍'}</span>
            <span className="text-[10px] font-semibold" style={{ color: ghostMode ? 'white' : '#00ADED' }}>
              {ghostMode ? 'Hidden' : 'Visible'}
            </span>
          </button>
        </div>

        {/* Filter pills */}
        <div className="pointer-events-auto flex justify-center gap-2 mt-3">
          {([
            { key: 'all', label: 'Everyone' },
            { key: 'connections', label: 'Friends' },
            { key: 'open', label: '👋 Up For It' },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all ${
                filter === f.key ? 'text-white shadow-md' : 'bg-white/90 text-gray-600'
              }`}
              style={filter === f.key ? { background: '#00ADED' } : {}}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Ghost mode banner */}
      {ghostMode && (
        <div className="absolute top-32 left-0 right-0 flex justify-center z-10 pointer-events-none">
          <div className="bg-gray-800/90 text-white text-[10px] font-medium px-3 py-1.5 rounded-full mt-2">
            👻 Ghost Mode on — others can't see you, and you appear offline
          </div>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-6 right-4 flex flex-col gap-1 z-10">
        <button className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-gray-700 font-semibold text-lg">+</button>
        <button className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-gray-700 font-semibold text-lg">−</button>
      </div>

      {/* Nearby count */}
      <div className="absolute bottom-6 left-4 bg-white rounded-full px-3 py-1.5 shadow-md flex items-center gap-2 z-10">
        <div className="w-2 h-2 rounded-full bg-green-400"/>
        <span className="text-xs font-semibold text-gray-800">{filteredProfiles.length} nearby</span>
        <span className="text-[10px] text-gray-400">· {profiles.filter(p => p.status).length} up for it</span>
      </div>
    </div>
  );
}
