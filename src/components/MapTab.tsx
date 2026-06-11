import { useState, useRef } from 'react';
import { Profile, currentUser } from '../data/profiles';

interface Props {
  profiles: Profile[];
  onProfileClick: (p: Profile) => void;
}

// Landmark positions on our fake campus map (as % of container)
const landmarks = [
  { name: 'Widener Library', x: 48, y: 42, icon: '📚' },
  { name: "Harvard Yard", x: 50, y: 50, icon: '🌳' },
  { name: "Science Center", x: 38, y: 32, icon: '🔬' },
  { name: "Harvard Square", x: 44, y: 68, icon: '☕' },
  { name: "Kennedy School", x: 28, y: 55, icon: '🏛️' },
];

// Map positions for profiles (% of map area)
const profilePositions: Record<string, { x: number; y: number }> = {
  emma:   { x: 52, y: 38 },
  james:  { x: 44, y: 58 },
  sofia:  { x: 65, y: 72 },
  marcus: { x: 55, y: 30 },
  priya:  { x: 30, y: 50 },
};

// Simple SVG-based campus map
function CampusMap({ profiles, onProfileClick }: Props) {
  const [filter, setFilter] = useState<'all' | 'connections' | 'nearby'>('all');

  const filteredProfiles = profiles.filter(p => {
    if (filter === 'connections') return p.isConnected;
    if (filter === 'nearby') return parseInt(p.distance) < 500 || p.distance.includes('ft') || p.distance === 'Now';
    return true;
  });

  return (
    <div className="relative w-full h-full bg-[#EEF2F7] overflow-hidden">
      {/* Map base — simple SVG streets */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        {/* Background */}
        <rect width="100" height="100" fill="#EEF2F7"/>

        {/* Green spaces */}
        <ellipse cx="50" cy="50" rx="18" ry="14" fill="#D4E8C2" opacity="0.7"/>
        <ellipse cx="35" cy="35" rx="10" ry="8" fill="#D4E8C2" opacity="0.5"/>
        <ellipse cx="65" cy="65" rx="8" ry="6" fill="#D4E8C2" opacity="0.5"/>

        {/* Streets */}
        <line x1="0" y1="55" x2="100" y2="55" stroke="#CDD5E0" strokeWidth="1.5"/>
        <line x1="0" y1="38" x2="100" y2="38" stroke="#CDD5E0" strokeWidth="1.2"/>
        <line x1="0" y1="72" x2="100" y2="72" stroke="#CDD5E0" strokeWidth="1.5"/>
        <line x1="40" y1="0" x2="40" y2="100" stroke="#CDD5E0" strokeWidth="1.5"/>
        <line x1="58" y1="0" x2="58" y2="100" stroke="#CDD5E0" strokeWidth="1.2"/>
        <line x1="25" y1="0" x2="25" y2="100" stroke="#CDD5E0" strokeWidth="1"/>
        <line x1="75" y1="0" x2="75" y2="100" stroke="#CDD5E0" strokeWidth="1"/>

        {/* Building footprints */}
        <rect x="42" y="36" width="16" height="12" rx="1" fill="#DDE4EF" stroke="#C9D3E3" strokeWidth="0.4"/>
        <rect x="30" y="43" width="8" height="7" rx="1" fill="#DDE4EF" stroke="#C9D3E3" strokeWidth="0.4"/>
        <rect x="60" y="58" width="10" height="8" rx="1" fill="#DDE4EF" stroke="#C9D3E3" strokeWidth="0.4"/>
        <rect x="44" y="58" width="12" height="9" rx="1" fill="#DDE4EF" stroke="#C9D3E3" strokeWidth="0.4"/>
        <rect x="32" y="28" width="7" height="7" rx="1" fill="#DDE4EF" stroke="#C9D3E3" strokeWidth="0.4"/>
        <rect x="62" y="30" width="9" height="7" rx="1" fill="#DDE4EF" stroke="#C9D3E3" strokeWidth="0.4"/>

        {/* Water */}
        <ellipse cx="80" cy="25" rx="12" ry="6" fill="#C5DDEF" opacity="0.6"/>
        <text x="80" y="26" textAnchor="middle" fontSize="2.5" fill="#7BAECF" fontFamily="sans-serif">Charles River</text>
      </svg>

      {/* Landmark labels */}
      {landmarks.map(l => (
        <div
          key={l.name}
          className="absolute pointer-events-none"
          style={{ left: `${l.x}%`, top: `${l.y}%`, transform: 'translate(-50%,-50%)' }}
        >
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-base">{l.icon}</span>
            <span className="text-[8px] text-gray-500 font-medium whitespace-nowrap bg-white/70 px-1 rounded">
              {l.name}
            </span>
          </div>
        </div>
      ))}

      {/* Current user dot */}
      <div className="absolute" style={{ left: '50%', top: '48%', transform: 'translate(-50%,-50%)' }}>
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-primary pulse-ring" style={{ width: 40, height: 40, margin: -8 }}/>
          <div className="w-6 h-6 rounded-full border-2 border-white shadow-md overflow-hidden" style={{ background: '#00ADED' }}>
            <img src={currentUser.avatar} alt="You" className="w-full h-full object-cover" />
          </div>
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-white text-[8px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap shadow">
            You
          </div>
        </div>
      </div>

      {/* Profile dots */}
      {filteredProfiles.map(profile => {
        const pos = profilePositions[profile.id];
        if (!pos) return null;
        return (
          <button
            key={profile.id}
            onClick={() => onProfileClick(profile)}
            className="absolute map-dot"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%,-50%)' }}
          >
            <div className="relative">
              {/* Spark ring */}
              {profile.isSparked && (
                <div className="absolute inset-0 rounded-full border-2 pulse-ring"
                  style={{ borderColor: '#00ADED', width: 44, height: 44, margin: -6 }}/>
              )}
              {/* Connection ring */}
              <div className={`p-0.5 rounded-full shadow-md ${profile.isConnected ? '' : 'bg-white'}`}
                style={profile.isConnected ? { background: 'linear-gradient(135deg, #00ADED, #6C5CE7)' } : {}}>
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                />
              </div>
              {/* Distance badge */}
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[7px] font-medium px-1 py-0.5 rounded-full whitespace-nowrap shadow">
                {profile.distance}
              </div>
              {/* Spark indicator */}
              {profile.isSparked && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary border border-white flex items-center justify-center">
                  <span className="text-[6px]">⚡</span>
                </div>
              )}
            </div>
          </button>
        );
      })}

      {/* Filter pills */}
      <div className="absolute top-4 left-0 right-0 flex justify-center gap-2 px-4">
        {(['all', 'connections', 'nearby'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm transition-all ${
              filter === f ? 'text-white shadow-md' : 'bg-white/90 text-gray-600'
            }`}
            style={filter === f ? { background: '#00ADED' } : {}}
          >
            {f === 'all' ? 'Everyone' : f === 'connections' ? 'Friends' : 'Nearby'}
          </button>
        ))}
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-6 right-4 flex flex-col gap-1">
        <button className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-gray-700 font-semibold text-lg">+</button>
        <button className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center text-gray-700 font-semibold text-lg">−</button>
      </div>

      {/* Nearby count pill */}
      <div className="absolute bottom-6 left-4 bg-white rounded-full px-3 py-1.5 shadow-md flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400"/>
        <span className="text-xs font-semibold text-gray-800">{profiles.length} nearby</span>
      </div>
    </div>
  );
}

export default function MapTab({ profiles, onProfileClick }: Props) {
  return (
    <div className="h-full flex flex-col fade-in">
      {/* Slim header overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 pt-12 px-4 pb-2 pointer-events-none">
        <div className="pointer-events-auto bg-white/90 backdrop-blur rounded-2xl shadow-sm px-4 py-2.5 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <span className="text-gray-400 text-sm">Search people, places...</span>
          <div className="ml-auto w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#00ADED1A' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M3 6h18M6 12h12M9 18h6" stroke="#00ADED" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
        </div>
      </div>

      <CampusMap profiles={profiles} onProfileClick={onProfileClick} />
    </div>
  );
}
