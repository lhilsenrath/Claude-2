import { useState } from 'react';
import { Profile } from '../data/profiles';

interface Props {
  profile: Profile;
  onClose: () => void;
  onConnect: () => void;
}

export default function ProfileModal({ profile, onClose, onConnect }: Props) {
  const [activeTab, setActiveTab] = useState<'about' | 'experience' | 'posts'>('about');
  const [messageSent, setMessageSent] = useState(false);

  return (
    <div className="absolute inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <button className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Sheet */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl slide-up max-h-[90%] flex flex-col shadow-2xl">
        {/* Cover */}
        <div className="relative h-28 rounded-t-3xl overflow-hidden flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${profile.isConnected ? '#00ADED44' : '#A29BFE44'}, #6C5CE744)` }}>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#374151" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {/* Avatar */}
          <div className="absolute -bottom-9 left-4">
            <div className={`p-0.5 rounded-full ${profile.isConnected ? '' : 'bg-white'}`}
              style={profile.isConnected ? { background: 'linear-gradient(135deg, #00ADED, #6C5CE7)' } : {}}>
              <img src={profile.avatar} alt={profile.name}
                className="w-16 h-16 rounded-full border-3 border-white object-cover" style={{ borderWidth: 3 }} />
            </div>
          </div>

          {/* Distance badge */}
          <div className="absolute top-3 left-4 bg-gray-900/70 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400"/>
            {profile.distance} away
          </div>
        </div>

        {/* Header */}
        <div className="px-4 pt-11 pb-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{profile.name}, {profile.age}</h2>
              <p className="text-sm text-gray-500">{profile.role}{profile.company ? ` · ${profile.company}` : ''}</p>
              <p className="text-xs text-gray-400 mt-0.5">{profile.school}</p>
              {profile.mutualConnections > 0 && (
                <p className="text-xs mt-1 font-medium" style={{ color: '#00ADED' }}>
                  {profile.mutualConnections} mutual connections
                </p>
              )}
            </div>
            {profile.isSparked && (
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-full">
                  <span className="text-xs">⚡</span>
                  <span className="text-xs font-semibold text-primary">Sparked</span>
                </div>
                <span className="text-[10px] text-gray-400">{profile.sparkExpiry} left</span>
              </div>
            )}
          </div>

          {profile.isSparked && profile.sparkStatus && (
            <div className="mt-2 bg-blue-50 rounded-xl px-3 py-2">
              <p className="text-xs text-gray-600">{profile.sparkStatus}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={onConnect}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                profile.isConnected ? 'bg-gray-100 text-gray-700' : 'text-white'
              }`}
              style={!profile.isConnected ? { background: '#00ADED' } : {}}
            >
              {profile.isConnected ? '✓ Connected' : '+ Connect'}
            </button>
            <button
              onClick={() => setMessageSent(true)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                messageSent ? 'bg-gray-50 text-gray-400 border-gray-100' : 'border-primary text-primary'
              }`}
            >
              {messageSent ? 'Sent ✓' : 'Message'}
            </button>
          </div>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-gray-100 px-4 flex-shrink-0">
          {(['about', 'experience', 'posts'] as const).map(s => (
            <button
              key={s}
              onClick={() => setActiveTab(s)}
              className={`flex-1 py-2.5 text-xs font-semibold capitalize border-b-2 transition-colors ${
                activeTab === s ? 'border-primary text-primary' : 'border-transparent text-gray-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto scrollable px-4 py-4">
          {activeTab === 'about' && (
            <div className="space-y-4">
              {/* Bio */}
              <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>

              {/* Details */}
              <div className="space-y-2">
                {[
                  { icon: '🎓', label: profile.degree },
                  { icon: '📍', label: profile.location },
                  { icon: '💞', label: profile.relationshipStatus },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span>{item.icon}</span>
                    <p className="text-sm text-gray-600">{item.label}</p>
                  </div>
                ))}
              </div>

              {/* Photo strip */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Photos</p>
                <div className="flex gap-2 overflow-x-auto scrollable pb-1">
                  {profile.photos.map((photo, i) => (
                    <img
                      key={i}
                      src={photo}
                      alt=""
                      className="w-24 h-24 rounded-xl object-cover flex-shrink-0"
                    />
                  ))}
                </div>
              </div>

              {/* Prompts */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Prompts</p>
                <div className="space-y-2">
                  {profile.prompts.map((prompt, i) => (
                    <div key={i} className="bg-gray-50 rounded-2xl p-4">
                      <p className="text-xs text-gray-400 font-medium mb-1">{prompt.question}</p>
                      <p className="text-sm text-gray-800 font-medium">{prompt.answer}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Socials */}
              {profile.socials.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Links</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.socials.map(s => (
                      <div key={s.platform} className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                        <span className="text-xs font-medium text-gray-600">{s.platform}</span>
                        <span className="text-xs text-gray-400">{s.handle}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'experience' && (
            <div className="space-y-4">
              {profile.experience.map((exp, i) => (
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
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-4">
              {profile.posts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No posts yet</p>
              ) : (
                profile.posts.map(post => (
                  <div key={post.id} className="border border-gray-100 rounded-2xl overflow-hidden">
                    {post.type === 'work_update' && (
                      <div className="px-4 pt-3 pb-1">
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-full">
                          💼 Work Update
                        </span>
                      </div>
                    )}
                    <div className="px-4 pt-2 pb-3">
                      <p className="text-sm text-gray-800 leading-relaxed">{post.content}</p>
                    </div>
                    {post.image && (
                      <img src={post.image} alt="" className="w-full" style={{ maxHeight: 200 }} />
                    )}
                    <div className="px-4 py-2 border-t border-gray-50 flex items-center gap-4">
                      <span className="text-xs text-gray-400">❤️ {post.likes}</span>
                      <span className="text-xs text-gray-400">💬 {post.comments}</span>
                      <span className="text-xs text-gray-400 ml-auto">{post.timestamp}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
