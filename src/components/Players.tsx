import React, { useState } from 'react';
import { AppData, Player } from '../lib/types';
import { computePlayerStats } from '../lib/stats';
import { Users, Search, Trophy, ArrowUpDown, Filter, Sparkles } from 'lucide-react';
import { getPlayerImage } from '../lib/images';

interface PlayersProps {
  data: AppData;
  onSelectPlayer: (player: Player) => void;
}

export const Players: React.FC<PlayersProps> = ({ data, onSelectPlayer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rate' | 'winRate' | 'matches' | 'trophies'>('rate');

  const playerStatsList = data.players.map((player) => ({
    player,
    stats: computePlayerStats(player, data),
    cards: (data.cards ?? []).filter((c) => c.playerId === player.id),
  }));

  const filteredPlayers = playerStatsList.filter(({ player }) =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (sortBy === 'rate') return b.stats.rate - a.stats.rate || b.stats.winRate - a.stats.winRate;
    if (sortBy === 'winRate') return b.stats.winRate - a.stats.winRate || b.stats.wins - a.stats.wins;
    if (sortBy === 'matches')
      return b.stats.wins + b.stats.losses - (a.stats.wins + a.stats.losses);
    if (sortBy === 'trophies') return b.stats.trophies - a.stats.trophies;
    return 0;
  });

  const sortByLabels: Record<typeof sortBy, string> = {
    rate: 'Rating (high → low)',
    winRate: 'Win Rate (high → low)',
    matches: 'Matches Played (high → low)',
    trophies: 'Trophies (most → least)',
  };

  return (
    <div className="space-y-6">
      {/* Search & Header Panel */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-cyan-400" />
            FIFA Player Roster
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Click any player card to view detailed head-to-head records, recent form timelines, and partnership statistics.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search player name..."
              className="w-full bg-slate-900/80 text-sm text-white pl-9 pr-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-white/10 w-full sm:w-auto">
            <button
              onClick={() => setSortBy('rate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === 'rate'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Rating
            </button>
            <button
              onClick={() => setSortBy('winRate')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === 'winRate'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Win %
            </button>
            <button
              onClick={() => setSortBy('trophies')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                sortBy === 'trophies'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Trophies
            </button>
          </div>
        </div>
      </div>

      {/* Sort Indicator Strip */}
      <div className="flex items-center gap-2 px-1">
        <ArrowUpDown className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-semibold text-slate-400">
          Sorting: <span className="text-emerald-400 font-black">{sortByLabels[sortBy]}</span>
        </span>
        <span className="ml-auto text-[11px] text-slate-500">
          Change order using the Rating / Win Rate / Matches / Trophies buttons
        </span>
      </div>

      {/* Player Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedPlayers.map(({ player, stats, cards }) => {
          const isGold = stats.rate >= 75;
          const yellowCards = cards.filter((c) => c.type === 'yellow').length;
          const redCards = cards.filter((c) => c.type === 'red').length;

          return (
            <div
              key={player.id}
              onClick={() => onSelectPlayer(player)}
              className={`fifa-card cursor-pointer group ${isGold ? 'fifa-card-gold' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div>
                    <div className="text-4xl font-black rating-badge">{stats.rate}</div>
                    <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mt-0.5">OVR RATING</div>
                  </div>
                  <img
                    src={getPlayerImage(player.name)}
                    alt={player.name}
                    className="w-16 h-16 object-contain drop-shadow-xl saturate-150"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>

                <div className="text-right">
                  <div className="text-sm font-extrabold text-amber-400 flex items-center justify-end gap-1">
                    <Trophy className="w-3.5 h-3.5" /> {stats.trophies}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    {stats.wins}W - {stats.losses}L ({stats.winRate}%)
                  </div>
                </div>
              </div>

              {/* Player Name */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-base font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                  {player.name}
                </span>

                <div className="flex items-center space-x-1">
                  {yellowCards > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-amber-400 text-slate-950">
                      {yellowCards}Y
                    </span>
                  )}
                  {redCards > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-rose-600 text-white">
                      {redCards}R
                    </span>
                  )}
                </div>
              </div>

              {/* Recent Form Footer */}
              <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-white/5">
                <span className="text-slate-400 font-medium">Recent Form</span>
                <div className="flex items-center gap-1">
                  {stats.recentForm.slice(0, 5).map((res, i) => (
                    <span key={i} className={`form-pill ${res === 'W' ? 'form-w' : 'form-l'}`}>
                      {res}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
