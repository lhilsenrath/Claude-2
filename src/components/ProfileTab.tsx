import { useState } from 'react';
import { currentUser } from '../data/profiles';

export default function ProfileTab() {
  const [activeSection, setActiveSection] = useState<'posts' | 'about' | 'experience'>('posts');
  const user = currentUser;

  return (
    <div className="h-full flex flex-col fade-in">
      <div className="flex-1 scrollable">
        {/* Cover + Avatar */}
        <div className="relative">
          <div className="h-32 w-full" style={{ background: 'linear-gradient(135deg, #00ADED22, #6C5CE755)' }} />
          <div className="absolute top-0 right-0 p-3">
            <button className="w-8 h-8 bg-white/80 rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div className="absolute -bottom-12 left-4">
            <div className="relative">
              <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full border-4 border-white shadow" />
              <button className="absolute bottom-0 right-0 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold" style={{ background: '#00ADED' }}>+</button>
            </div>
          </div>
        </div>

        {/* Name + actions */}
        <div className="px-4 pt-14 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-sm text-gray-500">{user.role} · {user.school}</p>
              <p className="text-xs text-gray-400 mt-0.5">📍 {user.location}</p>
            </div>
            <button className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 mt-1">
              Edit Profile
            </button>
          </div>

          {/* Bio */}
          <p className="text-sm text-gray-700 mt-3 leading-relaxed">{user.bio}</p>

          {/* Stats */}
          <div className="flex gap-6 mt-4">
            <div className="text-center">
              <p className="font-bold text-gray-900">{user.connections.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Connections</p>
            </div>
            <div className="text-center">
              <p className="font-bold text-gray-900">{user.followers.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Followers</p>
            </div>
          </div>

          {/* Socials */}
          <div className="flex gap-2 mt-4">
            {user.socials.map(s => (
              <div key={s.platform} className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                <span className="text-xs font-medium text-gray-600">{s.platform}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-gray-100 px-4">
          {(['posts', 'about', 'experience'] as const).map(s => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`flex-1 py-3 text-xs font-semibold capitalize border-b-2 transition-colors ${
                activeSection === s ? 'border-primary text-primary' : 'border-transparent text-gray-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="px-4 py-4">
          {activeSection === 'posts' && (
            <div>
              {/* Photo grid */}
              <div className="grid grid-cols-3 gap-1 mb-4">
                {user.photos.map((photo, i) => (
                  <img key={i} src={photo} alt={`Photo ${i+1}`} className="w-full aspect-square object-cover rounded-lg" />
                ))}
                <button className="aspect-square rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <span className="text-2xl text-gray-300">+</span>
                </button>
              </div>

              {/* New post composer */}
              <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                <div className="flex items-center gap-3">
                  <img src={user.avatar} alt="" className="w-8 h-8 rounded-full" />
                  <button className="flex-1 text-left text-sm text-gray-400 bg-white rounded-xl px-4 py-2.5 border border-gray-100">
                    Share an update...
                  </button>
                </div>
                <div className="flex gap-3 mt-3 pl-11">
                  <button className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <span>📷</span> Photo
                  </button>
                  <button className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                    <span>💼</span> Work update
                  </button>
                </div>
              </div>

              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No posts yet</p>
                <p className="text-xs mt-1">Share your first update above</p>
              </div>
            </div>
          )}

          {activeSection === 'about' && (
            <div className="space-y-4">
              {/* Details */}
              <div className="space-y-3">
                {[
                  { icon: '🎓', label: user.degree },
                  { icon: '📍', label: user.location },
                  { icon: '💞', label: user.relationshipStatus },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <p className="text-sm text-gray-700">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Prompts */}
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Prompts</p>
                {user.prompts.map((prompt, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-4">
                    <p className="text-xs text-gray-400 font-medium mb-1">{prompt.question}</p>
                    <p className="text-sm text-gray-800 font-medium">{prompt.answer}</p>
                  </div>
                ))}
                <button className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-xs font-semibold text-gray-400">
                  + Add prompt
                </button>
              </div>
            </div>
          )}

          {activeSection === 'experience' && (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Work Experience</p>
              {user.experience.map((exp, i) => (
                <div key={i} className="flex items-start gap-3 py-3 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                    {exp.logo}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{exp.role}</p>
                    <p className="text-xs text-gray-600">{exp.company}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{exp.duration}</p>
                  </div>
                </div>
              ))}
              <button className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 text-xs font-semibold text-gray-400">
                + Add experience
              </button>

              {/* Settings links */}
              <div className="mt-6 space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Settings</p>
                {['Privacy & Location', 'Ghost Mode', 'Who Can See Me', 'Notifications', 'Account', 'Help & Feedback', 'Sign Out'].map(item => (
                  <button
                    key={item}
                    className="w-full flex items-center justify-between py-3 border-b border-gray-50 text-sm text-gray-700 font-medium"
                  >
                    {item}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 18l6-6-6-6" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
