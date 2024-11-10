export interface Summoner {
  id: string;
  accountId: string;
  puuid: string;
  name: string;
  profileIconId: number;
  summonerLevel: number;
}

export interface RankedInfo {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface PlayerData {
  puuid: string;
  summoner: Summoner;
  rankedInfo: RankedInfo[];
  recentMatches?: {
    info: {
      gameCreation: number;
      participants: {
        puuid: string;
        win: boolean;
        kills: number;
        deaths: number;
        assists: number;
      }[];
    };
  }[];
} 