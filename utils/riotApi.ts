export const RIOT_REGIONS = {
  BR1: { platform: 'br1', region: 'americas' },
  EUN1: { platform: 'eun1', region: 'europe' },
  EUW1: { platform: 'euw1', region: 'europe' },
  JP1: { platform: 'jp1', region: 'asia' },
  KR: { platform: 'kr', region: 'asia' },
  LA1: { platform: 'la1', region: 'americas' },
  LA2: { platform: 'la2', region: 'americas' },
  NA1: { platform: 'na1', region: 'americas' },
  OC1: { platform: 'oc1', region: 'sea' },
  TR1: { platform: 'tr1', region: 'europe' },
  RU: { platform: 'ru', region: 'europe' }
} as const;

export type RegionKey = keyof typeof RIOT_REGIONS;

export function getRiotApiUrl(region: RegionKey, endpoint: string) {
  const { platform } = RIOT_REGIONS[region];
  return `https://${platform}.api.riotgames.com${endpoint}`;
} 