import {
  AppData,
  CardEvent,
  Competition,
  LeagueTableRow,
  Match,
  PartnershipStats,
  Player,
  PlayerStats,
  Trophy,
} from './types';

function getPartnerKey(id1: string, id2: string): string {
  return [id1, id2].sort().join('-');
}

export function getPlayerMatches(playerId: string, matches: Match[]): Match[] {
  return matches.filter(
    (m) =>
      m.team1.includes(playerId) ||
      m.team2.includes(playerId)
  );
}

export function getPlayerWinsLosses(
  playerId: string,
  matches: Match[]
): { wins: number; losses: number } {
  let wins = 0;
  let losses = 0;

  matches.forEach((m) => {
    const inTeam1 = m.team1.includes(playerId);
    const inTeam2 = m.team2.includes(playerId);
    if (!inTeam1 && !inTeam2) return;

    const won =
      (inTeam1 && m.winnerTeam === 1) || (inTeam2 && m.winnerTeam === 2);
    if (won) wins++;
    else losses++;
  });

  return { wins, losses };
}

export function getRecentForm(
  playerId: string,
  matches: Match[],
  count = 5
): ('W' | 'L')[] {
  const sorted = [...matches].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return sorted.slice(0, count).map((m) => {
    const inTeam1 = m.team1.includes(playerId);
    const won =
      (inTeam1 && m.winnerTeam === 1) ||
      (m.team2.includes(playerId) && m.winnerTeam === 2);
    return won ? 'W' : 'L';
  });
}

function isValidMatch(m: Match): boolean {
  return (
    m.team1?.length === 2 &&
    m.team2?.length === 2 &&
    m.team1[0] !== m.team1[1] &&
    m.team2[0] !== m.team2[1] &&
    !m.team1.some((id) => m.team2.includes(id)) &&
    (m.winnerTeam === 1 || m.winnerTeam === 2)
  );
}

export function getPartnershipStats(data: AppData): PartnershipStats[] {
  const partnerships = new Map<
    string,
    { ids: [string, string]; wins: number; losses: number }
  >();

  data.matches.filter(isValidMatch).forEach((m) => {
    const processTeam = (team: [string, string], won: boolean) => {
      const key = getPartnerKey(team[0], team[1]);
      const existing = partnerships.get(key) ?? {
        ids: [team[0], team[1]].sort() as [string, string],
        wins: 0,
        losses: 0,
      };
      if (won) existing.wins++;
      else existing.losses++;
      partnerships.set(key, existing);
    };

    processTeam(m.team1, m.winnerTeam === 1);
    processTeam(m.team2, m.winnerTeam === 2);
  });

  return Array.from(partnerships.values())
    .map((p) => {
      const p1 = data.players.find((pl) => pl.id === p.ids[0]);
      const p2 = data.players.find((pl) => pl.id === p.ids[1]);
      const games = p.wins + p.losses;
      return {
        player1Id: p.ids[0],
        player2Id: p.ids[1],
        player1Name: p1?.name ?? 'Unknown',
        player2Name: p2?.name ?? 'Unknown',
        wins: p.wins,
        losses: p.losses,
        games,
        winRate: games > 0 ? Math.round((p.wins / games) * 100) : 0,
      };
    })
    .sort((a, b) => b.winRate - a.winRate || b.games - a.games);
}

export function getPlayerPartnerStats(
  playerId: string,
  data: AppData
): { partnerId: string; wins: number; losses: number; games: number; winRate: number }[] {
  const partnerships = getPartnershipStats(data);
  return partnerships
    .filter((p) => p.player1Id === playerId || p.player2Id === playerId)
    .map((p) => ({
      partnerId: p.player1Id === playerId ? p.player2Id : p.player1Id,
      wins: p.wins,
      losses: p.losses,
      games: p.games,
      winRate: p.winRate,
    }))
    .sort((a, b) => b.winRate - a.winRate || b.games - a.games);
}

const BASE_RATE = 65;
const MIN_RATE = 45;
const MAX_RATE = 99;
const FORM_WINDOW = 5;

/** FIFA-style rating driven by recent form, overall record, and trophies. */
export function calculatePlayerRate(
  playerId: string,
  data: AppData
): number {
  const matches = getPlayerMatches(playerId, data.matches);
  const { wins, losses } = getPlayerWinsLosses(playerId, data.matches);
  const total = wins + losses;
  const recentForm = getRecentForm(playerId, matches, FORM_WINDOW);
  const trophies = data.trophies.filter((t) => t.winnerIds.includes(playerId)).length;

  let rate = BASE_RATE;

  // Recent form is the main driver (+3 per win, -3 per loss in last 5)
  recentForm.forEach((result) => {
    rate += result === 'W' ? 3 : -3;
  });

  // Overall record nudges rating when enough games played
  if (total >= 3) {
    const winRate = (wins / total) * 100;
    rate += (winRate - 50) * 0.2;
  }

  // Trophy bonus
  rate += trophies * 2;

  // Card penalties (-1 per yellow, -3 per red)
  const cards = data.cards ?? [];
  const yellowCards = cards.filter((c) => c.playerId === playerId && c.type === 'yellow').length;
  const redCards = cards.filter((c) => c.playerId === playerId && c.type === 'red').length;
  rate -= yellowCards * 1;
  rate -= redCards * 3;

  return Math.round(Math.min(MAX_RATE, Math.max(MIN_RATE, rate)));
}

export function computePlayerStats(player: Player, data: AppData): PlayerStats {
  const matches = getPlayerMatches(player.id, data.matches);
  const { wins, losses } = getPlayerWinsLosses(player.id, data.matches);
  const total = wins + losses;
  const partnerStats = getPlayerPartnerStats(player.id, data);

  const trophies = data.trophies.filter(
    (t) => t.winnerIds.includes(player.id)
  ).length;

  const bestPartner =
    partnerStats.length > 0 && partnerStats[0].games >= 2
      ? {
        playerId: partnerStats[0].partnerId,
        name: data.players.find((p) => p.id === partnerStats[0].partnerId)?.name ?? '',
        winRate: partnerStats[0].winRate,
        games: partnerStats[0].games,
      }
    : null;

  const worstPartner =
    partnerStats.length > 1
      ? {
          playerId: partnerStats[partnerStats.length - 1].partnerId,
          name:
            data.players.find(
              (p) => p.id === partnerStats[partnerStats.length - 1].partnerId
            )?.name ?? '',
          winRate: partnerStats[partnerStats.length - 1].winRate,
          games: partnerStats[partnerStats.length - 1].games,
        }
      : null;

  return {
    playerId: player.id,
    wins,
    losses,
    winRate: total > 0 ? Math.round((wins / total) * 100) : 0,
    rate: calculatePlayerRate(player.id, data),
    trophies,
    recentForm: getRecentForm(player.id, matches),
    bestPartner,
    worstPartner,
  };
}

export function getLeaderboard(data: AppData): PlayerStats[] {
  return data.players
    .map((p) => computePlayerStats(p, data))
    .filter((s) => s.wins + s.losses > 0)
    .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);
}

export function getTopFormPlayers(data: AppData, count = 3): PlayerStats[] {
  return data.players
    .map((p) => computePlayerStats(p, data))
    .filter((s) => s.recentForm.length > 0)
    .sort((a, b) => {
      // Form is newest-first, so count leading wins = current win streak.
      const streak = (form: ('W' | 'L')[]) => {
        let n = 0;
        for (const r of form) {
          if (r !== 'W') break;
          n++;
        }
        return n;
      };
      const aWins = a.recentForm.filter((f) => f === 'W').length;
      const bWins = b.recentForm.filter((f) => f === 'W').length;
      const aStreak = streak(a.recentForm);
      const bStreak = streak(b.recentForm);
      return (
        bWins - aWins ||
        bStreak - aStreak ||
        (b.wins + b.losses) - (a.wins + a.losses)
      );
    })
    .slice(0, count);
}

export function getBestPartnerships(
  data: AppData,
  count = 5
): PartnershipStats[] {
  return getPartnershipStats(data)
    .filter((p) => p.games >= 2)
    .slice(0, count);
}

/** Get competition matches only (matches with competitionId) */
export function getCompetitionMatches(data: AppData): Match[] {
  return data.matches.filter((m) => m.competitionId);
}

/** Get friendly matches only (matches without competitionId) */
export function getFriendlyMatches(data: AppData): Match[] {
  return data.matches.filter((m) => !m.competitionId);
}

/** Compute round-specific wins/losses for a player from competition matches */
function computeRoundStats(
  playerId: string,
  matches: Match[],
  competitions: Competition[]
): { semiFinalWins: number; semiFinalLosses: number; finalWins: number; finalLosses: number } {
  let semiFinalWins = 0;
  let semiFinalLosses = 0;
  let finalWins = 0;
  let finalLosses = 0;

  // Build a map of competitionMatchId -> roundName from competitions
  const matchRoundMap = new Map<string, string>();
  competitions.forEach((comp) => {
    comp.matches.forEach((m) => {
      if (m.completed && m.winnerTeam) {
        matchRoundMap.set(m.id, m.roundName);
      }
    });
  });

  matches.forEach((match) => {
    const inTeam1 = match.team1.includes(playerId);
    const inTeam2 = match.team2.includes(playerId);
    if (!inTeam1 && !inTeam2) return;

    const won = (inTeam1 && match.winnerTeam === 1) || (inTeam2 && match.winnerTeam === 2);
    const roundName = matchRoundMap.get(match.competitionMatchId ?? '');

    if (roundName === 'Semi-Final' || roundName === 'Semi Final') {
      if (won) semiFinalWins++;
      else semiFinalLosses++;
    } else if (roundName === 'Final') {
      if (won) finalWins++;
      else finalLosses++;
    }
  });

  return { semiFinalWins, semiFinalLosses, finalWins, finalLosses };
}

/** Compute league table for a given set of matches */
export function computeLeagueTable(
  players: Player[],
  matches: Match[],
  trophies: Trophy[] = [],
  competitions: Competition[] = [],
  includeUnplayed = false,
  cards: CardEvent[] = []
): LeagueTableRow[] {
  return players
    .map((player) => {
      const playerMatches = getPlayerMatches(player.id, matches);
      const { wins, losses } = getPlayerWinsLosses(player.id, playerMatches);
      const played = wins + losses;
      const draws = 0; // No draws in current system
      const points = wins * 3 + draws; // 3 points for win, 1 for draw
      const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;
      const playerTrophies = trophies.filter((t) => t.winnerIds.includes(player.id)).length;

      // Calculate round-specific stats only for trophy table (when competitions provided)
      const roundStats = competitions.length > 0
        ? computeRoundStats(player.id, playerMatches, competitions)
        : { semiFinalWins: 0, semiFinalLosses: 0, finalWins: 0, finalLosses: 0 };

      // Card counts
      const allCards = (cards ?? []) as CardEvent[];
      const yellowCards = allCards.filter((c) => c.playerId === player.id && c.type === 'yellow').length;
      const redCards = allCards.filter((c) => c.playerId === player.id && c.type === 'red').length;

      return {
        playerId: player.id,
        playerName: player.name,
        played,
        wins,
        losses,
        draws,
        points,
        winRate,
        trophies: playerTrophies,
        yellowCards,
        redCards,
        semiFinalWins: roundStats.semiFinalWins,
        semiFinalLosses: roundStats.semiFinalLosses,
        finalWins: roundStats.finalWins,
        finalLosses: roundStats.finalLosses,
      };
    })
    .filter((row) => includeUnplayed || row.played > 0)
    .sort((a, b) => b.points - a.points || b.winRate - a.winRate || b.wins - a.wins);
}

/** Get league table for trophy/competition matches only */
export function getTrophyLeagueTable(data: AppData): LeagueTableRow[] {
  const competitionMatches = getCompetitionMatches(data);
  return computeLeagueTable(data.players, competitionMatches, data.trophies, data.competitions, false, data.cards ?? []);
}

/** Get league table for all matches (friendlies + trophies) */
export function getAllMatchesLeagueTable(data: AppData, includeUnplayed = true): LeagueTableRow[] {
  return computeLeagueTable(data.players, data.matches, data.trophies, [], includeUnplayed, data.cards ?? []);
}

/** Get league table for friendlies only */
export function getFriendlyLeagueTable(data: AppData): LeagueTableRow[] {
  const friendlyMatches = getFriendlyMatches(data);
  return computeLeagueTable(data.players, friendlyMatches, [], [], false, data.cards ?? []);
}
