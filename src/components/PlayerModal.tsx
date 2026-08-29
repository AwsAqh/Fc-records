import React, { useState } from 'react';
import { AppData, Match, Player } from '../lib/types';
import { computePlayerStats, getCompetitionMatches, getPlayerMatches, getPlayerWinsLosses } from '../lib/stats';
import { X, Trophy, Swords, Users, ShieldAlert, Award, TrendingUp } from 'lucide-react';
import { getPlayerImage } from '../lib/images';

interface PlayerModalProps {
  player: Player | null;
  onClose: () => void;
  data: AppData;
  onSelectOtherPlayer: (player: Player) => void;
}

interface H2hItem {
  otherPlayer: Player;
  winsAgainst: number;
  lossesAgainst: number;
  totalAgainst: number;
  winRateAgainst: number;
  gamesTogether: number;
  drawnTogether: number;
  winsTogether: number;
  lossesTogether: number;
  totalTogether: number;
  winRateTogether: number;
}

export const PlayerModal: React.FC<PlayerModalProps> = ({
  player,
  onClose,
  data,
  onSelectOtherPlayer,
}) => {
  const [activeTab, setActiveTab] = useState<'h2h' | 'trophyH2h' | 'partners' | 'matches'>('h2h');

  if (!player) return null;

  const stats = computePlayerStats(player, data);
    const playerMatches = getPlayerMatches(player.id, data.matches).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getPlayerName = (id: string) => data.players.find((p) => p.id === id)?.name ?? id;

  // Count how many times the draw set this player together with another player
  // as partners. Each draw counts ONCE, no matter how many games were played
  // from it (e.g. semi-final + final = 1 time).
  //  - allDrawCounts: every draw — competition draws + friendly draw sessions
  //  - trophyDrawCounts: trophy/competition draws only
  const makeBumpPair = (counts: Map<string, number>) => (team: string[]) => {
    if (!team.includes(player.id)) return;
    team.forEach((id) => {
      if (id !== player.id) {
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
    });
  };
  const allDrawCounts = new Map<string, number>();
  const trophyDrawCounts = new Map<string, number>();
  const bumpAll = makeBumpPair(allDrawCounts);
  const bumpTrophy = makeBumpPair(trophyDrawCounts);
  // Competition (trophy) draws count for BOTH tabs
  data.competitions.forEach((c) =>
    (c.teams ?? []).forEach((team) => {
      bumpAll(team);
      bumpTrophy(team);
    })
  );
  // Friendly random draw sessions count for the All Matches tab only
  data.drawSessions.forEach((s) => {
    if (s.accepted) (s.teams ?? []).forEach(bumpAll);
  });

  // Compute Head-to-Head against all other players (works for any subset of matches)
  const computeH2hList = (matches: Match[], drawCounts: Map<string, number>): H2hItem[] =>
    data.players
      .filter((p) => p.id !== player.id)
      .map((otherPlayer) => {
        let winsAgainst = 0;
        let lossesAgainst = 0;
        let gamesTogether = 0;
        let winsTogether = 0;
        let lossesTogether = 0;

        matches.forEach((m) => {
          const inTeam1 = m.team1.includes(player.id);
          const inTeam2 = m.team2.includes(player.id);
          if (!inTeam1 && !inTeam2) return;

          const otherInTeam1 = m.team1.includes(otherPlayer.id);
          const otherInTeam2 = m.team2.includes(otherPlayer.id);

          // Played AGAINST each other
          if ((inTeam1 && otherInTeam2) || (inTeam2 && otherInTeam1)) {
            const won = (inTeam1 && m.winnerTeam === 1) || (inTeam2 && m.winnerTeam === 2);
            if (won) winsAgainst++;
            else lossesAgainst++;
          }

          // Played TOGETHER
          if ((inTeam1 && otherInTeam1) || (inTeam2 && otherInTeam2)) {
            gamesTogether++;
            const won = (inTeam1 && m.winnerTeam === 1) || (inTeam2 && m.winnerTeam === 2);
            if (won) winsTogether++;
            else lossesTogether++;
          }
        });

        const totalAgainst = winsAgainst + lossesAgainst;
        const winRateAgainst = totalAgainst > 0 ? Math.round((winsAgainst / totalAgainst) * 100) : 0;
        const totalTogether = winsTogether + lossesTogether;
        const winRateTogether = totalTogether > 0 ? Math.round((winsTogether / totalTogether) * 100) : 0;

        return {
          otherPlayer,
          winsAgainst,
          lossesAgainst,
          totalAgainst,
          winRateAgainst,
          gamesTogether,
          drawnTogether: drawCounts.get(otherPlayer.id) ?? 0,
          winsTogether,
          lossesTogether,
          totalTogether,
          winRateTogether,
        };
      })
      .filter((item) => item.totalAgainst > 0 || item.gamesTogether > 0)
      .sort((a, b) => b.totalAgainst - a.totalAgainst || b.winRateAgainst - a.winRateAgainst);

  // All-matches records (all draws) vs trophy records (trophy draws only)
  const h2hList = computeH2hList(data.matches, allDrawCounts);
  const trophyH2hList = computeH2hList(getCompetitionMatches(data), trophyDrawCounts);

  // Cards count
  const yellowCards = (data.cards ?? []).filter((c) => c.playerId === player.id && c.type === 'yellow').length;
  const redCards = (data.cards ?? []).filter((c) => c.playerId === player.id && c.type === 'red').length;

  const renderH2hTable = (list: H2hItem[], note: string, emptyText: string) => (
    <div className="space-y-3">
      <p className="text-[11px] text-slate-500 font-medium">{note}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-xs font-bold uppercase text-slate-400 bg-slate-900/40">
              <th className="py-3 px-3">vs / Partner Player</th>
              <th className="py-3 px-3 text-center">vs Opponent (W - L)</th>
              <th className="py-3 px-3 text-center">Win % vs Opponent</th>
              <th className="py-3 px-3 text-center">Games Together</th>
              <th className="py-3 px-3 text-center">Times Drawn Together</th>
              <th className="py-3 px-3 text-center">As Partner (W - L)</th>
              <th className="py-3 px-3 text-center">Win % as Partner</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-sm">
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-slate-500">
                  {emptyText}
                </td>
              </tr>
            )}
            {list.map((item) => (
              <tr
                key={item.otherPlayer.id}
                onClick={() => onSelectOtherPlayer(item.otherPlayer)}
                className="hover:bg-white/5 cursor-pointer transition-colors"
              >
                <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                  {item.otherPlayer.name}
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="text-emerald-400 font-bold">{item.winsAgainst}W</span> -{' '}
                  <span className="text-rose-400 font-bold">{item.lossesAgainst}L</span>
                </td>
                <td className="py-3 px-3 text-center font-extrabold text-cyan-400">
                  {item.totalAgainst > 0 ? `${item.winRateAgainst}%` : '-'}
                </td>
                <td className="py-3 px-3 text-center text-slate-300 font-medium">
                  {item.gamesTogether > 0 ? `${item.gamesTogether} games` : '-'}
                </td>
                <td className="py-3 px-3 text-center font-bold text-cyan-300">
                  {item.drawnTogether > 0 ? item.drawnTogether : '-'}
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="text-emerald-400 font-bold">{item.winsTogether}W</span> -{' '}
                  <span className="text-rose-400 font-bold">{item.lossesTogether}L</span>
                </td>
                <td className="py-3 px-3 text-center font-extrabold text-fuchsia-400">
                  {item.totalTogether > 0 ? `${item.winRateTogether}%` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-6 relative border-emerald-500/30"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Player Profile Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={getPlayerImage(player.name)}
                alt={player.name}
                className="w-20 h-20 object-contain drop-shadow-xl saturate-150 rounded-xl bg-slate-900 border border-white/5"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-xs shadow-xl shadow-amber-500/20 border border-[#090d16]">
                {stats.rate}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">{player.name}</h2>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span>Joined {new Date(player.createdAt).toLocaleDateString()}</span>
                {yellowCards > 0 && <span className="text-amber-400 font-bold">{yellowCards} Yellow Cards</span>}
                {redCards > 0 && <span className="text-rose-400 font-bold">{redCards} Red Cards</span>}
              </div>
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-white/10">
            <div className="text-center px-3">
              <div className="text-lg font-black text-emerald-400">{stats.winRate}%</div>
              <div className="text-xs font-bold uppercase text-slate-400">Win Rate</div>
            </div>
            <div className="text-center px-3 border-x border-white/10">
              <div className="text-lg font-black text-white">{stats.wins + stats.losses}</div>
              <div className="text-xs font-bold uppercase text-slate-400">Matches</div>
            </div>
            <div className="text-center px-3">
              <div className="text-lg font-black text-amber-400">{stats.trophies}</div>
              <div className="text-xs font-bold uppercase text-slate-400">Trophies</div>
            </div>
          </div>
        </div>

        {/* Recent Form & Partners Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-2">
            <div className="text-xs font-bold uppercase text-slate-400">Recent Form</div>
            <div className="flex items-center gap-1.5 pt-1">
              {stats.recentForm.map((res, i) => (
                <span key={i} className={`form-pill ${res === 'W' ? 'form-w' : 'form-l'}`}>
                  {res}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-1">
            <div className="text-xs font-bold uppercase text-slate-400">Best Duo Partner</div>
            <div className="text-sm font-bold text-emerald-400">
              {stats.bestPartner ? stats.bestPartner.name : 'N/A'}
            </div>
            {stats.bestPartner && (
              <div className="text-xs text-slate-400">
                {stats.bestPartner.winRate}% Win Rate ({stats.bestPartner.games} games)
              </div>
            )}
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-white/5 space-y-1">
            <div className="text-xs font-bold uppercase text-slate-400">Tough Duo Partner</div>
            <div className="text-sm font-bold text-rose-400">
              {stats.worstPartner ? stats.worstPartner.name : 'N/A'}
            </div>
            {stats.worstPartner && (
              <div className="text-xs text-slate-400">
                {stats.worstPartner.winRate}% Win Rate ({stats.worstPartner.games} games)
              </div>
            )}
          </div>
        </div>

        {/* Tabs switcher */}
        <div className="flex space-x-2 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('h2h')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'h2h'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Matches Records ({h2hList.length})
          </button>
          <button
            onClick={() => setActiveTab('trophyH2h')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'trophyH2h'
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Trophy Records ({trophyH2hList.length})
          </button>
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'matches'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Match History ({playerMatches.length})
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === 'h2h' &&
          renderH2hTable(
            h2hList,
            'All matches (friendlies + trophies) · draw counts include friendly draw sessions · Ordered by: total games vs opponent → win rate vs opponent',
            'No matches played yet.'
          )}

        {activeTab === 'trophyH2h' &&
          renderH2hTable(
            trophyH2hList,
            'Trophy / competition matches and draws only · Ordered by: total games vs opponent → win rate vs opponent',
            'No trophy (competition) matches played yet.'
          )}

        {activeTab === 'matches' && (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {playerMatches.map((m) => {
              const inTeam1 = m.team1.includes(player.id);
              const won = (inTeam1 && m.winnerTeam === 1) || (!inTeam1 && m.winnerTeam === 2);
              const formattedDate = new Date(m.date).toLocaleDateString();

              return (
                <div
                  key={m.id}
                  className="bg-slate-900/60 border border-white/5 rounded-xl p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-0.5 rounded font-black uppercase text-xs ${
                        won ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {won ? 'WIN' : 'LOSS'}
                    </span>
                    <span className="text-slate-400">{formattedDate}</span>
                  </div>

                  <div className="font-semibold text-slate-200">
                    {getPlayerName(m.team1[0])} & {getPlayerName(m.team1[1])}{' '}
                    <span className="text-slate-500 font-normal">vs</span> {getPlayerName(m.team2[0])} &{' '}
                    {getPlayerName(m.team2[1])}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
