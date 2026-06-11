import { useState } from 'react';
import BottomNav from './components/BottomNav';
import HomeTab from './components/HomeTab';
import MessagesTab from './components/MessagesTab';
import MapTab from './components/MapTab';
import ExploreTab from './components/ExploreTab';
import ProfileTab from './components/ProfileTab';
import ProfileModal from './components/ProfileModal';
import { Profile, profiles as initialProfiles } from './data/profiles';

export type Tab = 'home' | 'messages' | 'map' | 'explore' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('map');
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState(initialProfiles);

  const handleConnect = (profileId: string) => {
    setProfiles(prev =>
      prev.map(p => p.id === profileId ? { ...p, isConnected: !p.isConnected } : p)
    );
    if (selectedProfile?.id === profileId) {
      setSelectedProfile(prev => prev ? { ...prev, isConnected: !prev.isConnected } : null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Status bar spacer */}
      <div className="h-safe-top bg-white" />

      {/* Main content */}
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'home'     && <HomeTab profiles={profiles} onProfileClick={setSelectedProfile} />}
        {activeTab === 'messages' && <MessagesTab profiles={profiles} onProfileClick={setSelectedProfile} />}
        {activeTab === 'map'      && <MapTab profiles={profiles} onProfileClick={setSelectedProfile} />}
        {activeTab === 'explore'  && <ExploreTab profiles={profiles} onProfileClick={setSelectedProfile} />}
        {activeTab === 'profile'  && <ProfileTab />}
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {selectedProfile && (
        <ProfileModal
          profile={selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onConnect={() => handleConnect(selectedProfile.id)}
        />
      )}
    </div>
  );
}
