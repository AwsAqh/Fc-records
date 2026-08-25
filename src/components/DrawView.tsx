import React from 'react';
import { AppData } from '../lib/types';
import { Dices, Users, Calendar } from 'lucide-react';

interface DrawViewProps {
  data: AppData;
}

export const DrawView: React.FC<DrawViewProps> = ({ data }) => {
  const getPlayerName = (id: string) => data.players.find((p) => p.id === id)?.name ?? id;

  const drawList = [...data.drawSessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Dices className="w-6 h-6 text-cyan-400" />
          Draw Sessions & Team Generator History
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Historical record of randomized team draw sessions, jokers, and player assignments.
        </p>
      </div>

      <div className="space-y-4">
        {drawList.map((draw) => {
          const formattedDate = new Date(draw.date).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <div key={draw.id} className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold text-xs">
                    {draw.numPlayers} Players ({draw.maxPerTeam} per team)
                  </span>
                  <span className="text-xs text-slate-400">{formattedDate}</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                    draw.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {draw.status}
                </span>
              </div>

              {/* Teams Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {draw.teams.map((team, index) => (
                  <div
                    key={index}
                    className="bg-slate-900/70 p-3.5 rounded-xl border border-white/5 space-y-1"
                  >
                    <div className="text-xs font-black uppercase text-slate-400">
                      Team #{index + 1}
                    </div>
                    <div className="text-sm font-bold text-white">
                      {team.map(getPlayerName).join(' & ')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Jokers */}
              {draw.jokers && draw.jokers.length > 0 && (
                <div className="pt-2 border-t border-white/5 text-xs text-amber-400 font-semibold">
                  Jokers: {draw.jokers.map(getPlayerName).join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
