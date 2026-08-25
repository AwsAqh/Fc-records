import { AppData, Match, Player } from './types';
import { initialData } from './initialData';
import { supabase } from './supabase';

function isValidMatchTeam(team: unknown): team is [string, string] {
  return (
    Array.isArray(team) &&
    team.length === 2 &&
    typeof team[0] === 'string' &&
    typeof team[1] === 'string' &&
    team[0] !== team[1]
  );
}

function normalizeMatch(match: Match): Match | null {
  if (!isValidMatchTeam(match.team1) || !isValidMatchTeam(match.team2)) {
    return null;
  }
  if (match.winnerTeam !== 1 && match.winnerTeam !== 2) {
    return null;
  }
  return match;
}

function normalizePlayers(raw: unknown): Player[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((p): p is Player => Boolean(p && typeof p === 'object' && 'id' in p && 'name' in p))
    .map((player) => ({
      id: String(player.id),
      name: String(player.name),
      info: String(player.info ?? ''),
      createdAt: String(player.createdAt ?? new Date().toISOString()),
    }));
}

export async function fetchAppData(): Promise<{ data: AppData; source: 'supabase' | 'initial' }> {
  // Anonymous read — requires the RLS policy "Public read access for app_data"
  // (create policy "Public read access for app_data" on public.app_data for select using (true);)
  try {
    const { data: row, error } = await supabase
      .from('app_data')
      .select('data')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && row?.data) {
      const parsed = row.data as Partial<AppData>;
      const matches = Array.isArray(parsed.matches)
        ? parsed.matches.map(normalizeMatch).filter((m): m is Match => m !== null)
        : [];
      const players = normalizePlayers(parsed.players);
      const trophies = Array.isArray(parsed.trophies) ? parsed.trophies : [];

      if (matches.length > 0 || trophies.length > 0 || players.length > 0) {
        return {
          data: {
            players: players.length > 0 ? players : [...initialData.players],
            matches,
            trophies,
            drawSessions: Array.isArray(parsed.drawSessions) ? parsed.drawSessions : [],
            competitions: Array.isArray(parsed.competitions) ? parsed.competitions : [],
            journeys: Array.isArray(parsed.journeys) ? parsed.journeys : [],
            cards: Array.isArray(parsed.cards) ? parsed.cards : [],
          },
          source: 'supabase',
        };
      }
    }
  } catch (err) {
    console.warn('Failed to load from Supabase, using initial data:', err);
  }

  return { data: initialData, source: 'initial' };
}
