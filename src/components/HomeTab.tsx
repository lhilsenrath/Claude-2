import { useState } from 'react';
import { Profile, Post, currentUser } from '../data/profiles';

interface Props {
  profiles: Profile[];
  onProfileClick: (p: Profile) => void;
}

function PostCard({ post, author, onProfileClick }: { post: Post; author: Profile; onProfileClick: (p: Profile) => void }) {
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(post.likes);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(c => liked ? c - 1 : c + 1);
  };

  return (
    <div className="bg-white border-b border-gray-100">
      {/* Author row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <button onClick={() => onProfileClick(author)}>
          <img src={author.avatar} alt={author.name} className="w-10 h-10 rounded-full object-cover" />
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={() => onProfileClick(author)}>
            <p className="font-semibold text-gray-900 text-sm">{author.name}</p>
          </button>
          <p className="text-gray-400 text-xs truncate">{author.role}{author.company ? ` · ${author.company}` : ` · ${author.school}`}</p>
        </div>
        <span className="text-gray-400 text-xs">{post.timestamp}</span>
      </div>

      {/* Work update badge */}
      {post.type === 'work_update' && (
        <div className="mx-4 mb-2 inline-flex items-center gap-1.5 bg-blue-50 text-primary text-xs font-medium px-2.5 py-1 rounded-full">
          <span>💼</span> Work Update
        </div>
      )}

      {/* Content */}
      <p className="px-4 text-gray-800 text-sm leading-relaxed">{post.content}</p>

      {/* Photo */}
      {post.image && (
        <div className="mt-3 mx-0">
          <img src={post.image} alt="post" className="w-full object-cover" style={{ maxHeight: 280 }} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-5 px-4 py-3 mt-1">
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 text-sm font-medium transition-colors"
          style={{ color: liked ? '#00ADED' : '#9CA3AF' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#00ADED' : 'none'}>
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
              stroke={liked ? '#00ADED' : '#9CA3AF'} strokeWidth="2"/>
          </svg>
          <span style={{ color: liked ? '#00ADED' : '#9CA3AF' }}>{likeCount}</span>
        </button>
        <button className="flex items-center gap-1.5 text-sm font-medium text-gray-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
              stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {post.comments}
        </button>
        <button className="flex items-center gap-1.5 text-sm font-medium text-gray-400 ml-auto">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"
              stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function HomeTab({ profiles, onProfileClick }: Props) {
  const connectedProfiles = profiles.filter(p => p.isConnected);

  // Gather all posts sorted by recency
  const allPosts: { post: Post; author: Profile }[] = [];
  profiles.forEach(p => {
    p.posts.forEach(post => allPosts.push({ post, author: p }));
  });

  return (
    <div className="h-full flex flex-col fade-in">
      {/* Header */}
      <div className="px-4 pt-12 pb-3 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900" style={{ letterSpacing: '-0.5px' }}>
            WhatsUp<span style={{ color: '#00ADED' }}>.</span>
          </h1>
          <button className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"
                stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Stories row (connected profiles) */}
      <div className="bg-white border-b border-gray-100">
        <div className="flex gap-4 px-4 py-3 overflow-x-auto scrollable">
          {/* Your story */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <div className="relative">
              <img src={currentUser.avatar} alt="You" className="w-14 h-14 rounded-full border-2 border-white" />
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">+</span>
              </div>
            </div>
            <span className="text-[10px] text-gray-500 font-medium">Your story</span>
          </div>

          {profiles.map(p => (
            <button key={p.id} onClick={() => onProfileClick(p)} className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className="relative">
                <div className="p-0.5 rounded-full" style={{ background: 'linear-gradient(135deg, #00ADED, #6C5CE7)' }}>
                  <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full border-2 border-white" />
                </div>
                {p.status && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary border-2 border-white flex items-center justify-center">
                    <span className="text-[7px]">👋</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-500 font-medium max-w-[52px] truncate">{p.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 scrollable">
        {allPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-8 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="#D1D5DB" strokeWidth="2"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="#D1D5DB" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-gray-500 text-sm font-medium">No connections yet</p>
            <p className="text-gray-400 text-xs mt-1">Connect with people nearby to see their updates here</p>
          </div>
        ) : (
          allPosts.map(({ post, author }) => (
            <PostCard key={post.id} post={post} author={author} onProfileClick={onProfileClick} />
          ))
        )}
      </div>
    </div>
  );
}
