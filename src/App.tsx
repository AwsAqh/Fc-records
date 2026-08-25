import React, { useEffect, useState, useCallback } from 'react';
import { AppData, Player } from './lib/types';
import { fetchAppData } from './lib/dataFetcher';
import { initialData } from './lib/initialData';
import { Header, TabType } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Standings } from './components/Standings';
import { Players } from './components/Players';
import { Matches } from './components/Matches';
import { Trophies } from './components/Trophies';
import { JourneysView } from './components/JourneysView';
import { PlayerModal } from './components/PlayerModal';

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [data, setData] = useState<AppData>(initialData);
  const [dataSource, setDataSource] = useState<'supabase' | 'initial'>('initial');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const loadLatestData = useCallback(async () => {
    setLoading(true);
    const { data: freshest, source } = await fetchAppData();
    setData(freshest);
    setDataSource(source);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadLatestData();
  }, [loadLatestData]);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        data={data}
        dataSource={dataSource}
        loading={loading}
        onRefresh={loadLatestData}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard
            data={data}
            onSelectPlayer={(p) => setSelectedPlayer(p)}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'standings' && (
          <Standings
            data={data}
            onSelectPlayer={(p) => setSelectedPlayer(p)}
          />
        )}
        {activeTab === 'players' && (
          <Players
            data={data}
            onSelectPlayer={(p) => setSelectedPlayer(p)}
          />
        )}
        {activeTab === 'matches' && <Matches data={data} />}
                {activeTab === 'trophies' && <Trophies data={data} />}
        {activeTab === 'journeys' && <JourneysView data={data} />}
      </main>

      {/* Player Detail Modal */}
      <PlayerModal
        player={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        data={data}
        onSelectOtherPlayer={(p) => setSelectedPlayer(p)}
      />

      {/* Footer */}
            <footer className="border-t border-white/5 py-6 bg-[#070a11] text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex justify-center">
          <span className="text-emerald-500/80 font-mono">
            {dataSource === 'supabase' ? 'Read-Only Supabase Connected' : 'Seed Data'}
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
