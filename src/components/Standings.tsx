import React, { useState } from 'react';
import { AppData, Player, LeagueTableRow } from '../lib/types';
import {
  getAllMatchesLeagueTable,
  getTrophyLeagueTable,
  getFriendlyLeagueTable,
  getPlayerMatches,
  calculatePlayerRate,
} from '../lib/stats';
import { Award, Trophy, ShieldAlert, Filter, ArrowUpDown } from 'lucide-react';

interface StandingsProps {
  data: AppData;
  onSelectPlayer: (player: Player) => void;
}

type TableFilter = 'all' | 'trophies' | 'friendlies';

export const Standings: React.FC<StandingsProps> = ({ data, onSelectPlayer }) => {
  const [filter, setFilter] = useState<TableFilter>('all');
  const [sortField, setSortField] = useState<'points' | 'winRate' | 'played' | 'wins' | 'trophies' | 'cards'>('winRate');
  const [sortDesc, setSortDesc] = useState(true);

  // Players with fewer than MIN_COMPETITIVE_GAMES TOTAL matches are excluded from the
  // main ranking so a 1- or 2-game 100% win rate can't top the table. They still appear
  // at the bottom, listed above zero-match players, sorted only among themselves.
  const MIN_COMPETITIVE_GAMES = 12;

  // Qualification is based on TOTAL matches (friendlies + trophies combined), even though
  // each table only shows its own data — e.g. the Trophy table shows trophy stats only.
  const totalPlayedMap = new Map<string, number>();
  data.players.forEach((p) =>
    totalPlayedMap.set(p.id, getPlayerMatches(p.id, data.matches).length)
  );
  const totalPlayed = (id: string) => totalPlayedMap.get(id) ?? 0;

  const getTableRows = () => {
    switch (filter) {
      case 'trophies':
        return getTrophyLeagueTable(data);
      case 'friendlies':
        return getFriendlyLeagueTable(data);
      case 'all':
      default:
        return getAllMatchesLeagueTable(data, true);
    }
  };

  const rawRows = getTableRows();

  const compareRows = (a: LeagueTableRow, b: LeagueTableRow): number => {
    let diff = 0;
    if (sortField === 'points') diff = b.points - a.points || b.winRate - a.winRate;
    else if (sortField === 'winRate') diff = b.winRate - a.winRate || b.played - a.played;
    else if (sortField === 'played') diff = b.played - a.played;
    else if (sortField === 'wins') diff = b.wins - a.wins;
    else if (sortField === 'trophies') diff = b.trophies - a.trophies;
    else if (sortField === 'cards') diff = (b.yellowCards + b.redCards * 3) - (a.yellowCards + a.redCards * 3);
    return sortDesc ? diff : -diff;
  };

  // Split the table: qualifying players (>= threshold TOTAL matches) compete in the main
  // ranking, while under-threshold players are pushed to the bottom and only sorted among
  // themselves so they never displace anyone who actually played enough to earn a rank.
  const qualifiedRows = rawRows.filter((r) => totalPlayed(r.playerId) >= MIN_COMPETITIVE_GAMES).sort(compareRows);
  const limitedRows = rawRows.filter((r) => totalPlayed(r.playerId) > 0 && totalPlayed(r.playerId) < MIN_COMPETITIVE_GAMES).sort(compareRows);
  const unplayedRows = rawRows.filter((r) => totalPlayed(r.playerId) === 0).sort(compareRows);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  const getPlayer = (id: string) => data.players.find((p) => p.id === id);

  const sortLabels: Record<typeof sortField, string> = {
    points: 'Points',
    winRate: 'Win %',
    played: 'Matches Played',
    wins: 'Wins',
    trophies: 'Trophies',
    cards: 'Cards',
  };

  const sortArrow = (field: typeof sortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-500" />;
    return sortDesc ? (
      <span className="text-emerald-400">▼</span>
    ) : (
      <span className="text-emerald-400">▲</span>
    );
  };

  const sortableTh = (field: typeof sortField, label: string) => (
    <th
      onClick={() => toggleSort(field)}
      className={`py-4 px-4 text-center cursor-pointer hover:text-white ${
        sortField === field ? 'text-emerald-400' : ''
      }`}
    >
      <div className="flex items-center justify-center gap-1">
        {label} {sortArrow(field)}
      </div>
    </th>
  );

  const renderDivider = (label: string) => (
    <tr className="bg-slate-900/70">
      <td
        colSpan={filter === 'trophies' ? 12 : 10}
        className="py-2 px-4 text-[11px] font-bold uppercase tracking-wider text-slate-500"
      >
        {label}
      </td>
    </tr>
  );

  const renderTableRow = (row: LeagueTableRow, index: number) => {
    const player = getPlayer(row.playerId);
    const rate = calculatePlayerRate(row.playerId, data);

    return (
      <tr
        key={row.playerId}
        onClick={() => player && onSelectPlayer(player)}
        className="hover:bg-white/5 cursor-pointer transition-colors group"
      >
        <td className="py-4 px-4 text-center font-extrabold text-slate-400">
          {index + 1 <= 3 ? (
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black ${
                index === 0
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                  : index === 1
                  ? 'bg-slate-300 text-slate-950'
                  : 'bg-amber-700 text-white'
              }`}
            >
              {index + 1}
            </span>
          ) : (
            index + 1
          )}
        </td>
        <td className="py-4 px-4 font-bold text-white group-hover:text-emerald-400 transition-colors">
          {row.playerName}
        </td>
        <td className="py-4 px-4 text-center">
          <span className="inline-block px-2.5 py-0.5 rounded font-black text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30">
            {rate}
          </span>
        </td>
        <td className="py-4 px-4 text-center text-slate-300 font-medium">{row.played}</td>
        <td className="py-4 px-4 text-center font-semibold text-emerald-400">{row.wins}</td>
        <td className="py-4 px-4 text-center font-semibold text-rose-400">{row.losses}</td>
        <td className="py-4 px-4 text-center font-black text-white text-base">{row.points}</td>
        <td className="py-4 px-4 text-center font-extrabold text-cyan-400">{row.winRate}%</td>
        <td className="py-4 px-4 text-center font-extrabold text-amber-400">
          {row.trophies > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> {row.trophies}
            </span>
          ) : (
            <span className="text-slate-600">-</span>
          )}
        </td>
        {filter === 'trophies' && (
          <>
            <td className="py-4 px-4 text-center text-xs">
              <span className="text-emerald-400 font-semibold">{row.semiFinalWins}</span> /{' '}
              <span className="text-rose-400 font-semibold">{row.semiFinalLosses}</span>
            </td>
            <td className="py-4 px-4 text-center text-xs">
              <span className="text-emerald-400 font-semibold">{row.finalWins}</span> /{' '}
              <span className="text-rose-400 font-semibold">{row.finalLosses}</span>
            </td>
          </>
        )}
        <td className="py-4 px-4 text-center">
          <div className="flex items-center justify-center space-x-1.5">
            {row.yellowCards > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-amber-400 text-slate-950">
                {row.yellowCards}Y
              </span>
            )}
            {row.redCards > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-rose-600 text-white">
                {row.redCards}R
              </span>
            )}
            {row.yellowCards === 0 && row.redCards === 0 && (
              <span className="text-slate-600 text-xs">-</span>
            )}
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Award className="w-6 h-6 text-emerald-400" />
            League Table & Standings
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time standings computed from match results, win percentages, cup tournaments, and card penalties.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-xl border border-white/10 self-start md:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Matches
          </button>
          <button
            onClick={() => setFilter('trophies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'trophies'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Trophy Matches
          </button>
          <button
            onClick={() => setFilter('friendlies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              filter === 'friendlies'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Friendlies
          </button>
        </div>
      </div>

      {/* Table Panel */}
      <div className="glass-panel overflow-hidden">
        <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2 bg-slate-900/40">
          <ArrowUpDown className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-400">
            Sorting: <span className="text-emerald-400 font-black">{sortLabels[sortField]}</span>
            <span className="text-slate-500"> ({sortDesc ? 'highest → lowest' : 'lowest → highest'})</span>
          </span>
          <span className="ml-auto hidden sm:block text-[11px] text-slate-500">
            Click any column header (▼/▲) to change the sort · Players with fewer than {MIN_COMPETITIVE_GAMES} total matches are shown below the main ranking
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-xs font-bold uppercase text-slate-400 bg-slate-900/60">
                <th className="py-4 px-4 w-12 text-center">Pos</th>
                <th className="py-4 px-4">Player Name</th>
                <th className="py-4 px-4 text-center">Rating</th>
                {sortableTh('played', 'MP')}
                {sortableTh('wins', 'W')}
                <th className="py-4 px-4 text-center">L</th>
                {sortableTh('points', 'PTS')}
                {sortableTh('winRate', 'WIN %')}
                {sortableTh('trophies', 'Trophies')}
                {filter === 'trophies' && (
                  <>
                    <th className="py-4 px-4 text-center">Semi W/L</th>
                    <th className="py-4 px-4 text-center">Final W/L</th>
                  </>
                )}
                {sortableTh('cards', 'Cards')}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {qualifiedRows.map((row, index) => renderTableRow(row, index))}
              {limitedRows.length > 0 && (
                <>
                  {renderDivider(
                    `Below threshold · fewer than ${MIN_COMPETITIVE_GAMES} total matches — not in the main ranking`
                  )}
                  {limitedRows.map((row, index) =>
                    renderTableRow(row, qualifiedRows.length + index)
                  )}
                </>
              )}
              {unplayedRows.length > 0 && (
                <>
                  {renderDivider('No matches played')}
                  {unplayedRows.map((row, index) =>
                    renderTableRow(row, qualifiedRows.length + limitedRows.length + index)
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
