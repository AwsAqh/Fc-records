import React from 'react';
import { AppData } from '../lib/types';
import { Layers, Users, Swords } from 'lucide-react';

interface JourneysViewProps {
  data: AppData;
}

export const JourneysView: React.FC<JourneysViewProps> = ({ data }) => {
  const getPlayerName = (id: string) => data.players.find((p) => p.id === id)?.name ?? id;

  const journeysList = [...data.journeys].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Layers className="w-6 h-6 text-emerald-400" />
          Friendly Journeys History
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Special 6-player and 7-player rotation friendly sessions (King of the Hill / Lineup Rotations).
        </p>
      </div>

      <div className="space-y-4">
        {journeysList.map((journey) => {
          const formattedDate = new Date(journey.date).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <div key={journey.id} className="glass-panel p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold text-xs">
                    {journey.mode}-Player Mode ({journey.maxPerTeam} per team)
                  </span>
                  <span className="text-xs text-slate-400">{formattedDate}</span>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                    journey.status === 'completed'
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-emerald-500/10 text-emerald-400'
                  }`}
                >
                  {journey.status}
                </span>
              </div>

              {/* Teams Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {journey.teams.map((team, index) => (
                  <div
                    key={index}
                    className="bg-slate-900/70 p-3.5 rounded-xl border border-white/5 space-y-1"
                  >
                    <div className="text-xs font-black uppercase text-slate-400">
                      Roster #{index + 1}
                    </div>
                    <div className="text-sm font-bold text-white">
                      {team.map(getPlayerName).join(' & ')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Current / Last Match Details */}
              {journey.currentMatch && (
                <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Match #{journey.matchNo}</span>
                  <span className="font-bold text-emerald-400">
                    {journey.currentMatch.team1.map(getPlayerName).join(' & ')} vs{' '}
                    {journey.currentMatch.team2.map(getPlayerName).join(' & ')}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
