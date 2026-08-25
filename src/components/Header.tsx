import React, { useState } from 'react';
import { Trophy, Users, Swords, Award, Flame, RefreshCw, Layers, Globe } from 'lucide-react';
import { AppData } from '../lib/types';

export type TabType = 'dashboard' | 'standings' | 'players' | 'matches' | 'trophies' | 'journeys';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  data: AppData;
  dataSource: 'supabase' | 'initial';
  loading: boolean;
  onRefresh: () => void;
}

const translations: Record<string, { en: string; ar: string }> = {
  dashboard: { en: 'Dashboard', ar: 'لوحة التحكم' },
  standings: { en: 'Standings', ar: 'الترتيب' },
  players: { en: 'Players', ar: 'اللاعيين' },
  matches: { en: 'Matches', ar: 'المباريات' },
  trophies: { en: 'Trophies', ar: 'الألقاب' },
  journeys: { en: 'Journeys', ar: 'الرحلات' },
  'Supabase Live': { en: 'Supabase Live', ar: 'سابابيس لايف' },
  'Seed Data': { en: 'Seed Data', ar: 'بيانات البذرة' },
  'Refresh Data': { en: 'Refresh Data', ar: 'تحديث البيانات' },
};

export function translateKey(key: string, lang: 'en' | 'ar'): string {
  return translations[key]?.[lang] ?? key;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  data,
  dataSource,
  loading,
  onRefresh,
}) => {
  const [lang, setLang] = useState<'en' | 'ar'>('en');
  const totalMatches = data.matches.length;
  const totalPlayers = data.players.length;
  const totalTrophies = data.trophies.length;

          const navItems: { id: TabType; labelKey: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', labelKey: 'dashboard', icon: <Flame className="w-4 h-4" /> },
    { id: 'standings', labelKey: 'standings', icon: <Award className="w-4 h-4" /> },
    { id: 'players', labelKey: 'players', icon: <Users className="w-4 h-4" /> },
    { id: 'matches', labelKey: 'matches', icon: <Swords className="w-4 h-4" /> },
    { id: 'trophies', labelKey: 'trophies', icon: <Trophy className="w-4 h-4" /> },
    { id: 'journeys', labelKey: 'journeys', icon: <Layers className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#090d16]/90 backdrop-blur-md border-b border-white/10">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-black text-slate-950 text-xl tracking-tighter">
            FC
          </div>
          <div>
                                  <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            Fifa المملكة <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">READ-ONLY</span>
          </h1>
            <p className="text-xs text-slate-400">FIFA Players Record & Competition Stats</p>
          </div>
        </div>

        {/* Live Status & Quick Stats */}
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-6 text-xs text-slate-300 mr-2">
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-white/5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
                            <span><strong className="text-white">{totalPlayers}</strong> {translateKey('Players', lang)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-white/5">
              <Swords className="w-3.5 h-3.5 text-emerald-400" />
                            <span><strong className="text-white">{totalMatches}</strong> {translateKey('Matches', lang)}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-white/5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
                            <span><strong className="text-white">{totalTrophies}</strong> {translateKey('Trophies', lang)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                dataSource === 'supabase'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
              title={dataSource === 'supabase' ? 'Connected to Supabase live database' : 'Loaded from offline seed data'}
            >
              <span className={`w-2 h-2 rounded-full ${dataSource === 'supabase' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                            {dataSource === 'supabase' ? translateKey('Supabase Live', lang) : translateKey('Seed Data', lang)}
            </span>

            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg border border-white/10 transition-colors"
                            title={translateKey('Refresh Data', lang)}
            >
                                                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
                        <button
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors border border-cyan-500/30 flex items-center gap-1"
              title="اكبس هون يا بريشر عشان الترجمة"
            >
              <Globe className="w-3 h-3" />
              {lang === 'en' ? 'العربية' : 'English'}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex space-x-1 overflow-x-auto no-scrollbar border-t border-white/5 pt-1 pb-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
                            {item.icon}
              {translateKey(item.labelKey, lang)}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
