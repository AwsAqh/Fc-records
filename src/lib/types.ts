export interface Player {
  id: string;
  name: string;
  info: string;
  createdAt: string;
}

export interface CardEvent {
  id: string;
  playerId: string;
  type: 'yellow' | 'red';
  date: string;
}

export interface Match {
  id: string;
  date: string;
  team1: [string, string];
  team2: [string, string];
  winnerTeam: 1 | 2;
  score1?: number;
  score2?: number;
  notes?: string;
  fromDraw?: boolean;
  drawId?: string;
  competitionId?: string;
  competitionMatchId?: string;
  journeyId?: string;
}

export interface Trophy {
  id: string;
  date: string;
  winnerIds: [string, string];
  competitionName: string;
  runnerUpIds?: [string, string];
  competitionId?: string;
}

export interface DrawSession {
  id: string;
  date: string;
  numPlayers: number;
  maxPerTeam: number;
  teams: string[][];
  jokers: string[];
  accepted: boolean;
  status: 'draft' | 'in-progress' | 'completed';
  playerIds: string[];
  fixtures?: Array<{ team1Index: number; team2Index: number }>;
  jokerTeamAssignments?: Record<string, number>;
  jokerTeamIndex?: number;
}

export interface CompetitionMatch {
  id: string;
  round: number;
  roundName: string;
  team1: string[];
  team2: string[];
  winnerTeam?: 1 | 2;
  completed: boolean;
}

export interface Competition {
  id: string;
  date: string;
  name: string;
  playerIds: string[];
  teams: string[][];
  jokers: string[];
  jokerTeam?: string[];
  numPlayers?: number;
  matches: CompetitionMatch[];
  status: 'active' | 'completed';
  trophyId?: string;
  byeTeam?: string[];
  winnerTeamIds?: string[];
}

export interface FriendlyJourney {
  id: string;
  date: string;
  mode: 6 | 7;
  maxPerTeam: 2 | 3;
  playerIds: string[];
  teams: string[][];
  playingIndices?: [number, number];
  waitingIndex?: number;
  rotation?: number;
  fielded?: string[][];
  joker?: string | null;
  jokerTeam?: number | null;
  jokerGames?: number;
  consecutiveWins?: Record<string, number>;
  matchNo: number;
  currentMatch: { team1: string[]; team2: string[]; matchNo: number };
  status: 'active' | 'completed';
}

export interface AppData {
  players: Player[];
  matches: Match[];
  trophies: Trophy[];
  drawSessions: DrawSession[];
  competitions: Competition[];
  journeys: FriendlyJourney[];
  cards: CardEvent[];
  schemaVersion?: number;
}

export interface PlayerStats {
  playerId: string;
  wins: number;
  losses: number;
  winRate: number;
  rate: number;
  trophies: number;
  recentForm: ('W' | 'L')[];
  bestPartner: { playerId: string; name: string; winRate: number; games: number } | null;
  worstPartner: { playerId: string; name: string; winRate: number; games: number } | null;
}

export interface PartnershipStats {
  player1Id: string;
  player2Id: string;
  player1Name: string;
  player2Name: string;
  wins: number;
  losses: number;
  games: number;
  winRate: number;
}

export interface LeagueTableRow {
  playerId: string;
  playerName: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  winRate: number;
  trophies: number;
  yellowCards: number;
  redCards: number;
  semiFinalWins: number;
  semiFinalLosses: number;
  finalWins: number;
  finalLosses: number;
}
