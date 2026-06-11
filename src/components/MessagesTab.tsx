import { useState } from 'react';
import { Profile, Message, messages as initialMessages, currentUser } from '../data/profiles';

interface Props {
  profiles: Profile[];
  onProfileClick: (p: Profile) => void;
}

function getProfile(profiles: Profile[], id: string): Profile | undefined {
  return profiles.find(p => p.id === id);
}

function ChatView({
  conversation,
  profile,
  onBack,
}: {
  conversation: Message;
  profile: Profile;
  onBack: () => void;
}) {
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState(conversation.messages);

  const send = () => {
    if (!input.trim()) return;
    setMsgs(prev => [...prev, {
      id: `c${Date.now()}`,
      senderId: 'you',
      text: input.trim(),
      timestamp: 'Now',
    }]);
    setInput('');
  };

  return (
    <div className="h-full flex flex-col fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-3 bg-white border-b border-gray-100">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 5l-7 7 7 7" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <img src={profile.avatar} alt={profile.name} className="w-9 h-9 rounded-full" />
        <div>
          <p className="font-semibold text-sm text-gray-900">{profile.name}</p>
          <p className="text-xs text-gray-400">{profile.distance === 'Now' ? '🟢 Active now' : `Last seen ${profile.lastSeen}`}</p>
        </div>
        <button className="ml-auto text-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="5" r="1.5" fill="#00ADED"/>
            <circle cx="12" cy="12" r="1.5" fill="#00ADED"/>
            <circle cx="12" cy="19" r="1.5" fill="#00ADED"/>
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollable px-4 py-4 space-y-3">
        {msgs.map(msg => {
          const isMe = msg.senderId === 'you';
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <img src={profile.avatar} alt="" className="w-7 h-7 rounded-full mr-2 mt-auto flex-shrink-0" />
              )}
              <div>
                <div
                  className={`px-4 py-2.5 rounded-2xl max-w-[240px] text-sm leading-relaxed ${
                    isMe ? 'rounded-br-sm text-white' : 'rounded-bl-sm bg-gray-100 text-gray-900'
                  }`}
                  style={isMe ? { background: '#00ADED' } : {}}
                >
                  {msg.text}
                </div>
                <p className={`text-[10px] text-gray-400 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>{msg.timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 rounded-full px-4 py-2.5">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Message..."
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400"
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors disabled:opacity-30"
            style={{ background: '#00ADED' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesTab({ profiles, onProfileClick }: Props) {
  const [openConvo, setOpenConvo] = useState<Message | null>(null);
  const [search, setSearch] = useState('');

  if (openConvo) {
    const profile = getProfile(profiles, openConvo.profileId);
    if (!profile) return null;
    return <ChatView conversation={openConvo} profile={profile} onBack={() => setOpenConvo(null)} />;
  }

  const connectedProfiles = profiles.filter(p => p.isConnected);

  return (
    <div className="h-full flex flex-col fade-in">
      {/* Header */}
      <div className="px-4 pt-12 pb-3 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-3" style={{ letterSpacing: '-0.5px' }}>Messages</h1>
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="#9CA3AF" strokeWidth="2"/>
            <path d="M21 21l-4.35-4.35" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="bg-transparent text-sm text-gray-800 placeholder-gray-400 flex-1"
          />
        </div>
      </div>

      <div className="flex-1 scrollable">
        {/* Existing convos */}
        {initialMessages.length > 0 && (
          <div>
            {initialMessages.map(convo => {
              const profile = getProfile(profiles, convo.profileId);
              if (!profile) return null;
              if (search && !profile.name.toLowerCase().includes(search.toLowerCase())) return null;
              return (
                <button
                  key={convo.id}
                  onClick={() => setOpenConvo(convo)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <div className="relative flex-shrink-0">
                    <img src={profile.avatar} alt={profile.name} className="w-12 h-12 rounded-full" />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-green-400 border-2 border-white"/>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-gray-900">{profile.name}</p>
                      <span className="text-xs text-gray-400">{convo.timestamp}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{convo.lastMessage}</p>
                  </div>
                  {convo.unread > 0 && (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0" style={{ background: '#00ADED' }}>
                      {convo.unread}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Suggested — connected but no convo yet */}
        {connectedProfiles.filter(p => !initialMessages.find(m => m.profileId === p.id)).length > 0 && (
          <div>
            <p className="px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Connections</p>
            {connectedProfiles
              .filter(p => !initialMessages.find(m => m.profileId === p.id))
              .map(profile => (
                <button
                  key={profile.id}
                  onClick={() => onProfileClick(profile)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <img src={profile.avatar} alt={profile.name} className="w-11 h-11 rounded-full" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-semibold text-sm text-gray-900">{profile.name}</p>
                    <p className="text-xs text-gray-400">{profile.role}</p>
                  </div>
                  <div className="px-3 py-1.5 rounded-full text-xs font-semibold text-primary border border-primary">
                    Message
                  </div>
                </button>
              ))}
          </div>
        )}

        {/* Empty state */}
        {initialMessages.length === 0 && connectedProfiles.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
                  stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">No messages yet</p>
            <p className="text-gray-400 text-xs mt-1">Find someone nearby on the map and say WhatsUp!</p>
          </div>
        )}
      </div>
    </div>
  );
}
