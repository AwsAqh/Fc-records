import React from 'react';
import { AppData, Player } from '../lib/types';
import { getTopFormPlayers, getLeaderboard, getBestPartnerships, computePlayerStats } from '../lib/stats';
import { Flame, Trophy, Swords, Users, TrendingUp, Sparkles, ChevronRight, Award } from 'lucide-react';
import { TabType } from './Header';
import { getPlayerImage } from '../lib/images';

interface DashboardProps {
  data: AppData;
  onSelectPlayer: (player: Player) => void;
  setActiveTab: (tab: TabType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onSelectPlayer, setActiveTab }) => {
  const topFormStats = getTopFormPlayers(data, 4);
  const leaderboard = getLeaderboard(data).slice(0, 5);
  const bestPartnerships = getBestPartnerships(data, 4);
  const recentMatches = [...data.matches]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getPlayerName = (id: string) => {
    return data.players.find((p) => p.id === id)?.name ?? id;
  };

  const getPlayer = (id: string) => {
    return data.players.find((p) => p.id === id);
  };

  return (
    <div className="space-[#121929] space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-cyan-950/80 border border-emerald-500/20 p-6 md:p-8">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> FIFA Players Hub
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              المنصة الاولى
            </h2>
                        <p className="text-sm text-slate-300">
              كلشي مسجل
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4 bg-slate-900/80 backdrop-blur-md p-4 rounded-xl border border-white/10">
            <div className="text-center px-2">
              <div className="text-2xl font-black text-emerald-400">{data.players.length}</div>
              <div className="text-xs font-semibold uppercase text-slate-400">Players</div>
            </div>
            <div className="text-center px-2 border-x border-white/10">
              <div className="text-2xl font-black text-cyan-400">{data.matches.length}</div>
              <div className="text-xs font-semibold uppercase text-slate-400">Matches</div>
            </div>
            <div className="text-center px-2">
              <div className="text-2xl font-black text-amber-400">{data.trophies.length}</div>
              <div className="text-xs font-semibold uppercase text-slate-400">Trophies</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Form Players Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400" />
            Top Form Players
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Ordered by: wins in last 5 → current streak → total games
          </span>
          <button
            onClick={() => setActiveTab('players')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
          >
            View All Players <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topFormStats.map((stats) => {
            const player = getPlayer(stats.playerId);
            if (!player) return null;
            const isGold = stats.rate >= 75;

            return (
              <div
                key={player.id}
                onClick={() => onSelectPlayer(player)}
                className={`fifa-card cursor-pointer group ${isGold ? 'fifa-card-gold' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div>
                      <div className="text-3xl font-black rating-badge">{stats.rate}</div>
                      <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mt-0.5">OVR RATING</div>
                    </div>
                    <img
                      src={getPlayerImage(player.name)}
                      alt={player.name}
                      className="w-14 h-14 object-contain drop-shadow-xl saturate-150"
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

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {player.name}
                  </span>
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

      {/* Main Grid: Standings Preview & Recent Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Standings (2 Columns) */}
        <div className="lg:col-span-2 glass-panel p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              Leaderboard Top 5
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Ordered by: win rate → wins
            </span>
            <button
              onClick={() => setActiveTab('standings')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              Full League Table <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-semibold uppercase text-slate-400">
                  <th className="py-3 px-3">#</th>
                  <th className="py-3 px-3">Player</th>
                  <th className="py-3 px-3 text-center">Rating</th>
                  <th className="py-3 px-3 text-center">Played</th>
                  <th className="py-3 px-3 text-center">W / L</th>
                  <th className="py-3 px-3 text-center">Win %</th>
                  <th className="py-3 px-3 text-center">Trophies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {leaderboard.map((stats, index) => {
                  const player = getPlayer(stats.playerId);
                  if (!player) return null;

                  return (
                    <tr
                      key={stats.playerId}
                      onClick={() => onSelectPlayer(player)}
                      className="hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-bold text-slate-400">#{index + 1}</td>
                      <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                        {player.name}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded font-black text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {stats.rate}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-300">{stats.wins + stats.losses}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-emerald-400 font-semibold">{stats.wins}</span> /{' '}
                        <span className="text-rose-400 font-semibold">{stats.losses}</span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-cyan-400">{stats.winRate}%</td>
                      <td className="py-3 px-3 text-center font-extrabold text-amber-400">
                        {stats.trophies > 0 ? `🏆 ${stats.trophies}` : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Partnerships Widget */}
        <div className="glass-panel p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
              <Users className="w-5 h-5 text-cyan-400" />
              Best Partnerships
            </h3>
            <span className="block text-[11px] text-slate-500 font-medium mb-4">
              Ordered by: partnership win rate → games played
            </span>

            <div className="space-y-3">
              {bestPartnerships.map((p, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/60 border border-white/5 rounded-xl p-3.5 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-bold text-white">
                      {p.player1Name} & {p.player2Name}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {p.wins} Wins - {p.losses} Losses ({p.games} games)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-cyan-400">{p.winRate}%</div>
                    <div className="text-xs uppercase font-semibold text-slate-500">Win Rate</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('players')}
            className="mt-4 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors border border-white/10"
          >
            Explore Player Analytics
          </button>
        </div>
      </div>

      {/* Recent Matches Feed */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-cyan-400" />
            Recent Match History
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Ordered by: newest date → oldest
          </span>
          <button
            onClick={() => setActiveTab('matches')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
          >
            View All Matches <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {recentMatches.map((m) => {
            const team1Won = m.winnerTeam === 1;
            const formattedDate = new Date(m.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={m.id}
                className="bg-slate-900/70 border border-white/5 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                      m.competitionId
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-white/5'
                    }`}
                  >
                    {m.competitionId ? 'Cup Match' : 'Friendly'}
                  </span>
                  <span className="text-xs text-slate-400">{formattedDate}</span>
                </div>

                <div className="flex items-center justify-center space-x-4 flex-1">
                  {/* Team 1 */}
                  <div className={`text-right ${team1Won ? 'font-bold text-emerald-400' : 'text-slate-300'}`}>
                    {getPlayerName(m.team1[0])} & {getPlayerName(m.team1[1])}
                    {team1Won && <span className="ml-1 text-xs">✓</span>}
                  </div>

                  <div className="px-3 py-1 rounded-lg bg-slate-800 text-xs font-black text-slate-400 border border-white/10">
                    VS
                  </div>

                  {/* Team 2 */}
                  <div className={`text-left ${!team1Won ? 'font-bold text-emerald-400' : 'text-slate-300'}`}>
                    {!team1Won && <span className="mr-1 text-xs">✓</span>}
                    {getPlayerName(m.team2[0])} & {getPlayerName(m.team2[1])}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
