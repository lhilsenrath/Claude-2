import { Tab } from '../App';

interface Props {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const PRIMARY = '#00ADED';

export default function BottomNav({ activeTab, onTabChange }: Props) {
  const tabs: { id: Tab; label: string; icon: (active: boolean) => JSX.Element }[] = [
    {
      id: 'home',
      label: 'Feed',
      icon: (active) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
            stroke={active ? PRIMARY : '#9CA3AF'} strokeWidth="2"
            fill={active ? `${PRIMARY}15` : 'none'} strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M9 21V12h6v9" stroke={active ? PRIMARY : '#9CA3AF'} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: 'messages',
      label: 'Chats',
      icon: (active) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
            stroke={active ? PRIMARY : '#9CA3AF'} strokeWidth="2"
            fill={active ? `${PRIMARY}15` : 'none'} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: 'map',
      label: 'Nearby',
      icon: (active) => (
        <div className="relative">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg -mt-4`}
            style={{ background: active ? PRIMARY : '#1F2937' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="3" fill="white"/>
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      ),
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: (active) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="8" stroke={active ? PRIMARY : '#9CA3AF'} strokeWidth="2"
            fill={active ? `${PRIMARY}15` : 'none'}/>
          <path d="M21 21l-4.35-4.35" stroke={active ? PRIMARY : '#9CA3AF'} strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (active) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke={active ? PRIMARY : '#9CA3AF'} strokeWidth="2"
            fill={active ? `${PRIMARY}15` : 'none'}/>
          <path d="M4 20c0-4 3.58-7 8-7s8 3 8 7" stroke={active ? PRIMARY : '#9CA3AF'}
            strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  return (
    <nav className="bg-white border-t border-gray-100 pb-safe">
      <div className="flex items-end h-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center justify-end pb-2 gap-0.5 tab-icon
              ${tab.id === 'map' ? 'pb-1' : ''}`}
          >
            {tab.icon(activeTab === tab.id)}
            {tab.id !== 'map' && (
              <span className={`text-[10px] font-medium ${activeTab === tab.id ? 'text-primary' : 'text-gray-400'}`}>
                {tab.label}
              </span>
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
