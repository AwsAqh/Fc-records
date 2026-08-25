import React from 'react';
import { AppData } from '../lib/types';
import { Trophy, Award, Crown, Swords, Calendar } from 'lucide-react';

interface TrophiesProps {
  data: AppData;
}

export const Trophies: React.FC<TrophiesProps> = ({ data }) => {
  const getPlayerName = (id: string) => data.players.find((p) => p.id === id)?.name ?? id;

  const trophiesList = [...data.trophies].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="glass-panel p-6">
        <h2 className="text-2xl font-black text-white flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          Trophy Roll of Honor & Competitions
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Complete hall of fame for all FIFA cup winners, runners-up, and knockout tournament brackets.
        </p>
      </div>

      {/* Trophy Cards Roll of Honor */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-400" />
          Trophy Winners Hall of Fame ({trophiesList.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trophiesList.map((t) => {
            const formattedDate = new Date(t.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={t.id}
                className="glass-panel p-5 border-amber-500/30 hover:border-amber-400/60 transition-all relative overflow-hidden group"
              >
                <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" /> {t.competitionName}
                  </span>
                  <span className="text-xs text-slate-400">{formattedDate}</span>
                </div>

                {/* Champions Pair */}
                <div className="mt-4 space-y-1">
                  <div className="text-xs uppercase font-black tracking-wider text-amber-400/80">
                    CHAMPIONS
                  </div>
                  <div className="text-lg font-black text-white flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    {getPlayerName(t.winnerIds[0])} & {getPlayerName(t.winnerIds[1])}
                  </div>
                </div>

                {/* Runner up pair */}
                {t.runnerUpIds && (
                  <div className="mt-3 pt-2 border-t border-white/5 space-y-0.5">
                    <div className="text-xs uppercase font-bold text-slate-500">RUNNERS-UP</div>
                    <div className="text-sm font-semibold text-slate-300">
                      {getPlayerName(t.runnerUpIds[0])} & {getPlayerName(t.runnerUpIds[1])}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Competitions Brackets */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Swords className="w-5 h-5 text-cyan-400" />
          Knockout Tournaments ({data.competitions.length})
        </h3>

        <div className="space-y-6">
          {data.competitions.map((comp) => {
            const formattedDate = new Date(comp.date).toLocaleDateString();

            return (
              <div key={comp.id} className="glass-panel p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h4 className="text-lg font-extrabold text-white">{comp.name}</h4>
                    <p className="text-xs text-slate-400">Date: {formattedDate}</p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      comp.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {comp.status}
                  </span>
                </div>

                {/* Matches Bracket */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {comp.matches.map((m) => {
                    const t1Won = m.winnerTeam === 1;

                    return (
                      <div
                        key={m.id}
                        className="bg-slate-900/70 p-4 rounded-xl border border-white/5 space-y-2 text-xs"
                      >
                        <div className="text-xs font-black uppercase text-amber-400">
                          {m.roundName}
                        </div>

                        <div className="space-y-1.5">
                          <div className={`flex justify-between ${t1Won ? 'font-bold text-emerald-400' : 'text-slate-300'}`}>
                            <span>{m.team1.map(getPlayerName).join(' & ')}</span>
                            {t1Won && <span>✓ WIN</span>}
                          </div>
                          <div className="border-t border-white/5 pt-1.5 flex justify-between">
                            <span className={!t1Won && m.completed ? 'font-bold text-emerald-400' : 'text-slate-300'}>
                              {m.team2.map(getPlayerName).join(' & ')}
                            </span>
                            {!t1Won && m.completed && <span className="text-emerald-400 font-bold">✓ WIN</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
