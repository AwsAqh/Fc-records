import React, { useState } from 'react';
import { AppData } from '../lib/types';
import { Swords, Search, Filter } from 'lucide-react';

interface MatchesProps {
  data: AppData;
}

type MatchTypeFilter = 'all' | 'competition' | 'friendly';

export const Matches: React.FC<MatchesProps> = ({ data }) => {
  const [filter, setFilter] = useState<MatchTypeFilter>('all');
  const [playerFilter, setPlayerFilter] = useState('');

  const getPlayerName = (id: string) => data.players.find((p) => p.id === id)?.name ?? id;

  // Build a lookup of competitionMatchId -> { roundName, competitionName }
  const roundLookup = new Map<string, { roundName: string; compName: string }>();
  data.competitions.forEach((comp) => {
    comp.matches.forEach((cm) => {
      roundLookup.set(cm.id, { roundName: cm.roundName, compName: comp.name });
    });
  });

  const matchesList = [...data.matches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const filteredMatches = matchesList.filter((m) => {
    if (filter === 'competition' && !m.competitionId) return false;
    if (filter === 'friendly' && m.competitionId) return false;

    if (playerFilter) {
      const pLower = playerFilter.toLowerCase();
      const allPlayerNames = [
        getPlayerName(m.team1[0]),
        getPlayerName(m.team1[1]),
        getPlayerName(m.team2[0]),
        getPlayerName(m.team2[1]),
      ].map((n) => n.toLowerCase());

      if (!allPlayerNames.some((name) => name.includes(pLower))) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Swords className="w-6 h-6 text-emerald-400" />
            Complete Match Logs
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse all historical FIFA matches, filter by competition or friendly, and search by player.
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Ordered by: newest date → oldest
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Player Search Input */}
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={playerFilter}
              onChange={(e) => setPlayerFilter(e.target.value)}
              placeholder="Filter by player name..."
              className="w-full bg-slate-900/80 text-sm text-white pl-9 pr-4 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-white/10 w-full sm:w-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Matches ({data.matches.length})
            </button>
            <button
              onClick={() => setFilter('competition')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'competition'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cups ({data.matches.filter((m) => m.competitionId).length})
            </button>
            <button
              onClick={() => setFilter('friendly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filter === 'friendly'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Friendlies ({data.matches.filter((m) => !m.competitionId).length})
            </button>
          </div>
        </div>
      </div>

      {/* Match History List */}
      <div className="space-y-3">
        {filteredMatches.map((m) => {
          const team1Won = m.winnerTeam === 1;
          const formattedDate = new Date(m.date).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          const comp = m.competitionId ? data.competitions.find((c) => c.id === m.competitionId) : null;

          const round = m.competitionMatchId ? roundLookup.get(m.competitionMatchId) : null;

          return (
            <div
              key={m.id}
              className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-500/30 transition-all"
            >
              {/* Left Badge & Date */}
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-lg text-xs font-black uppercase ${
                    m.competitionId
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      : 'bg-slate-800 text-slate-400 border border-white/5'
                  }`}
                >
                  {comp ? comp.name : 'Friendly'}
                </span>
                <span className="text-xs text-slate-400">{formattedDate}</span>
                {round && (
                  <span className="px-2 py-0.5 rounded-md text-xs font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/30">
                    {round.roundName}
                  </span>
                )}
              </div>

              {/* Center Scoreboard */}
              <div className="flex items-center justify-center space-x-4 flex-1 my-2 md:my-0">
                {/* Team 1 */}
                <div
                  className={`text-right flex-1 ${
                    team1Won ? 'font-extrabold text-emerald-400 text-base' : 'text-slate-300 font-medium text-sm'
                  }`}
                >
                  {getPlayerName(m.team1[0])} & {getPlayerName(m.team1[1])}
                </div>

                <div className="px-3 py-1 rounded-lg bg-slate-900/90 text-xs font-black text-slate-400 border border-white/10">
                  VS
                </div>

                {/* Team 2 */}
                <div
                  className={`text-left flex-1 ${
                    !team1Won ? 'font-extrabold text-emerald-400 text-base' : 'text-slate-300 font-medium text-sm'
                  }`}
                >
                  {getPlayerName(m.team2[0])} & {getPlayerName(m.team2[1])}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
