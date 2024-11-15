'use client';
/* eslint-disable */
import { useState, useEffect } from 'react';
import { PlayerData } from '@/types/player';
import summonerTags from '@/data/summoner-tags.json';
import { Container, AppShell, Title, Text, Box, Group, Paper, SimpleGrid, Progress, Button, Badge, Alert, Collapse, ActionIcon, Modal, Stack, Divider } from '@mantine/core';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { CARD_STYLES } from '@/components/PlayerList';
import { IconTrophy, IconClock, IconSword, IconSkull, IconHandStop, IconArrowLeft, IconChevronDown, IconChevronUp, IconTarget, IconEye, IconAlertTriangle, IconHelp, IconArrowBack, IconFlag, IconRadar, IconAlertCircle, IconMapPin, IconArrowForward, IconChevronRight } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { LoadingOverlay } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';

interface SpielerMatchStatistiken {
  spielerName: string;
  gespielteSpielen: number;
  siege: number;
  niederlagen: number;
  kills: number;
  tode: number;
  assists: number;
  durchschnittlicheSpielzeit: number;
  meistGespielterChampion: {
    name: string;
    spiele: number;
    siegesRate: number;
  };
  aramSpiele: number;
  gesamtPings: number;
  siegesSerie: number;
  niederlagenSerie: number;
  pingStats: {
    allInPings: number;
    assistMePings: number;
    baitPings: number;
    basicPings: number;
    commandPings: number;
    dangerPings: number;
    enemyMissingPings: number;
    enemyVisionPings: number;
    getBackPings: number;
    holdPings: number;
    needVisionPings: number;
    onMyWayPings: number;
    pushPings: number;
    visionClearedPings: number;
  };
  averageKDA: number;
  averageKillParticipation: number;
  averageVisionScore: number;
  timeStats: TimeBasedStats;
  championPerformance: ChampionPerformance;
}

interface GlobaleStatistiken {
  gesamtSpiele: number;
  durchschnittlicheSpielzeit: number;
  aktivsterSpieler: {
    name: string;
    spiele: number;
  };
  höchsteSiegRate: {
    name: string;
    siegRate: number;
    spiele: number;
  };
  meistePings: {
    name: string;
    pings: number;
  };
  besteKDA: {
    name: string;
    kda: number;
  };
  längsteSiegesserie: {
    name: string;
    serie: number;
  };
  längsteNiederlagenserie: {
    name: string;
    serie: number;
  };
  spielerStatistiken: SpielerMatchStatistiken[];
  championStatistiken: {
    name: string;
    spiele: number;
    siege: number;
    kills: number;
    tode: number;
    assists: number;
  }[];
}

interface TimeBasedStats {
  averageGameLength: number;
  longestGame: {
    duration: number;
    champion: string;
  };
  shortestGame: {
    duration: number;
    champion: string;
  };
  mostActiveHours: {
    hour: number;
    games: number;
  }[];
}

interface ChampionPerformance {
  bestChampions: {
    name: string;
    games: number;
    winRate: number;
    kda: number;
    averageKills: number;
    averageDeaths: number;
    averageAssists: number;
  }[];
  worstChampions: {
    name: string;
    games: number;
    winRate: number;
    kda: number;
    averageKills: number;
    averageDeaths: number;
    averageAssists: number;
  }[];
}

// Hilfsfunktion für Siegesraten-Farben
const getSiegRateColor = (siegRate: number): string => {
  if (siegRate >= 65) return 'yellow';    // Außergewöhnlich
  if (siegRate >= 55) return 'teal';      // Sehr Gut
  if (siegRate >= 50) return 'blue';      // Gut
  if (siegRate >= 45) return 'orange';    // Mittelmäßig
  return 'red';                           // Schlecht
};

// Add these constants at the top of your file
const DDRAGON_VERSION = '14.22.1'; // Update this to the latest version
const DEFAULT_ICON = '/LOGO.png'; // Your default logo as fallback

// Alternative URL for champion icons
const getChampionIconUrl = (championName: string) => {
  // Try Community Dragon if Data Dragon fails
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championName.toLowerCase()}.png`;
};

// Add these interfaces near the top of the file, after the existing interfaces
interface Match {
  info: {
    gameDuration: number;
    gameMode: string;
    participants: {
      puuid: string;
      championName: string;
      win: boolean;
      kills: number;
      deaths: number;
      assists: number;
      pings?: { [key: string]: number };
    }[];
  };
}

interface Player {
  puuid: string;
  gameName: string;
  tagLine: string;
  profileIconId: number;
  recentMatches?: Match[];
}

interface PlayersData {
  players: {
    [key: string]: Player;
  };
}

// Style constants
const PLAYER_CARD_STYLES = {
  backgroundColor: 'var(--mantine-color-dark-7)',
  border: '1px solid var(--mantine-color-dark-4)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  }
};

const MODAL_DETAIL_CARD_STYLE = {
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  }
};

const MODAL_PING_STYLE = {
  borderRadius: '8px',
  transition: 'background-color 0.2s ease',
  ':hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  }
};

const MODAL_STYLES = {
  modal: {
    backgroundColor: 'var(--mantine-color-dark-7)',
  },
  header: {
    backgroundColor: 'var(--mantine-color-dark-7)',
  },
  title: {
    color: 'var(--mantine-color-white)',
  }
};

// Add this function before the PlayerDetailsModal component
const getPingStatsWithIcons = (pingStats: Record<string, number>) => [
  { 
    type: 'Alert', 
    count: pingStats.dangerPings, 
    icon: <IconAlertTriangle size={16} color="var(--mantine-color-red-6)" /> 
  },
  { 
    type: 'Assist', 
    count: pingStats.assistMePings, 
    icon: <IconHelp size={16} color="var(--mantine-color-blue-6)" /> 
  },
  { 
    type: 'Back', 
    count: pingStats.getBackPings, 
    icon: <IconArrowBack size={16} color="var(--mantine-color-yellow-6)" /> 
  },
  { 
    type: 'Vision', 
    count: pingStats.needVisionPings, 
    icon: <IconEye size={16} color="var(--mantine-color-violet-6)" /> 
  },
  { 
    type: 'Enemy', 
    count: pingStats.enemyMissingPings, 
    icon: <IconFlag size={16} color="var(--mantine-color-red-6)" /> 
  },
  { 
    type: 'Hold', 
    count: pingStats.holdPings, 
    icon: <IconHandStop size={16} color="var(--mantine-color-orange-6)" /> 
  },
  { 
    type: 'Basic', 
    count: pingStats.basicPings, 
    icon: <IconMapPin size={16} color="var(--mantine-color-blue-6)" /> 
  },
  { 
    type: 'Coming', 
    count: pingStats.onMyWayPings, 
    icon: <IconArrowForward size={16} color="var(--mantine-color-green-6)" /> 
  },
  { 
    type: 'All-in', 
    count: pingStats.allInPings, 
    icon: <IconSword size={16} color="var(--mantine-color-red-6)" /> 
  },
  { 
    type: 'Command', 
    count: pingStats.commandPings, 
    icon: <IconRadar size={16} color="var(--mantine-color-blue-6)" /> 
  },
  { 
    type: 'Enemy Vision', 
    count: pingStats.enemyVisionPings, 
    icon: <IconAlertCircle size={16} color="var(--mantine-color-yellow-6)" /> 
  },
  { 
    type: 'Vision Cleared', 
    count: pingStats.visionClearedPings, 
    icon: <IconEye size={16} color="var(--mantine-color-green-6)" /> 
  },
].filter(ping => ping.count > 0) // Only show pings that were actually used
  .sort((a, b) => b.count - a.count); // Sort by most used first

// PlayerDetailsModal component with updated styles
const PlayerDetailsModal = ({ 
  spieler, 
  opened, 
  close,
  playersData 
}: { 
  spieler: SpielerMatchStatistiken;
  opened: boolean;
  close: () => void;
  playersData: any;
}) => (
  <Modal
    opened={opened}
    onClose={close}
    size="xl"
    title={
      <Group>
        <Image
          src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${
            playersData.players[spieler.spielerName.split('#')[0]]?.profileIconId || '1'
          }.png`}
          alt={spieler.spielerName}
          width={48}
          height={48}
          style={{ borderRadius: '50%' }}
        />
        <Title order={3}>{spieler.spielerName.split('#')[0]}'s Details</Title>
      </Group>
    }
    styles={MODAL_STYLES}
  >
    {/* Stats Grid with Icons */}
    <SimpleGrid cols={{ base: 2, sm: 2 }} spacing="sm" mb="md">
      <Paper p="xs" radius="sm" style={MODAL_DETAIL_CARD_STYLE}>
        <Group gap={4} mb={2}>
          <IconSword size={16} color="var(--mantine-color-teal-6)" />
          <Text size="sm" c="dimmed">KDA</Text>
        </Group>
        <Text size="lg" fw={500}>{spieler.averageKDA.toFixed(2)}</Text>
      </Paper>
      <Paper p="xs" radius="sm" style={MODAL_DETAIL_CARD_STYLE}>
        <Group gap={4} mb={2}>
          <IconTarget size={16} color="var(--mantine-color-red-6)" />
          <Text size="sm" c="dimmed">Kill Participation</Text>
        </Group>
        <Text size="lg" fw={500}>{(spieler.averageKillParticipation * 100).toFixed(1)}%</Text>
      </Paper>
      <Paper p="xs" radius="sm" style={MODAL_DETAIL_CARD_STYLE}>
        <Group gap={4} mb={2}>
          <IconEye size={16} color="var(--mantine-color-violet-6)" />
          <Text size="sm" c="dimmed">Vision Score</Text>
        </Group>
        <Text size="lg" fw={500}>{spieler.averageVisionScore.toFixed(1)}</Text>
      </Paper>
      <Paper p="xs" radius="sm" style={MODAL_DETAIL_CARD_STYLE}>
        <Group gap={4} mb={2}>
          <IconTrophy size={16} color="var(--mantine-color-yellow-6)" />
          <Text size="sm" c="dimmed">Win Streak</Text>
        </Group>
        <Text size="lg" fw={500}>{spieler.siegesSerie}</Text>
      </Paper>
    </SimpleGrid>

    {/* Ping Stats with Icons */}
    <Paper p="md" radius="sm" style={MODAL_DETAIL_CARD_STYLE}>
      <Text fw={500} mb="md" size="lg">Communication Stats</Text>
      <SimpleGrid cols={{ base: 2, sm: 2 }} spacing="xs">
        {getPingStatsWithIcons(spieler.pingStats).map(({ type, count, icon }) => (
          <Group key={type} justify="space-between" p="xs" style={MODAL_PING_STYLE}>
            <Group gap={6}>
              {icon}
              <Text size="sm">{type}</Text>
            </Group>
            <Badge size="lg" variant="light">{count}</Badge>
          </Group>
        ))}
      </SimpleGrid>
    </Paper>

    {/* Performance Cards */}
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg" mt="lg">
      <TimeStatsCard timeStats={spieler.timeStats} />
      <ChampionPerformanceCard performance={spieler.championPerformance} />
    </SimpleGrid>
  </Modal>
);

// Add these components before PlayerDetailsModal
const TimeStatsCard = ({ timeStats }: { timeStats: TimeBasedStats }) => {
  if (!timeStats) {
    return (
      <Paper p="md" radius="sm" style={MODAL_DETAIL_CARD_STYLE}>
        <Text fw={500} mb="md" size="lg">Time Statistics</Text>
        <Text c="dimmed">No time statistics available</Text>
      </Paper>
    );
  }

  return (
    <Paper p="md" radius="sm" style={MODAL_DETAIL_CARD_STYLE}>
      <Text fw={500} mb="md" size="lg">Time Statistics</Text>
      <Stack gap="xs">
        <Group justify="space-between">
          <Group gap={4}>
            <IconClock size={16} color="var(--mantine-color-blue-6)" />
            <Text size="sm">Average Game Length</Text>
          </Group>
          <Text size="sm" fw={500}>
            {Math.floor((timeStats.averageGameLength || 0) / 60)}:
            {String(Math.floor((timeStats.averageGameLength || 0) % 60)).padStart(2, '0')}
          </Text>
        </Group>
        {timeStats.shortestGame && (
          <Group justify="space-between">
            <Group gap={4}>
              <IconClock size={16} color="var(--mantine-color-green-6)" />
              <Text size="sm">Shortest Game</Text>
            </Group>
            <Text size="sm" fw={500}>
              {Math.floor(timeStats.shortestGame.duration / 60)}:
              {String(Math.floor(timeStats.shortestGame.duration % 60)).padStart(2, '0')}
              <Text span size="xs" ml={4} c="dimmed">
                ({timeStats.shortestGame.champion})
              </Text>
            </Text>
          </Group>
        )}
        {timeStats.longestGame && (
          <Group justify="space-between">
            <Group gap={4}>
              <IconClock size={16} color="var(--mantine-color-red-6)" />
              <Text size="sm">Longest Game</Text>
            </Group>
            <Text size="sm" fw={500}>
              {Math.floor(timeStats.longestGame.duration / 60)}:
              {String(Math.floor(timeStats.longestGame.duration % 60)).padStart(2, '0')}
              <Text span size="xs" ml={4} c="dimmed">
                ({timeStats.longestGame.champion})
              </Text>
            </Text>
          </Group>
        )}

        {timeStats.mostActiveHours && timeStats.mostActiveHours.length > 0 && (
          <>
            <Divider my="xs" />
            <Text size="sm" fw={500} mb="xs">Most Active Hours</Text>
            {timeStats.mostActiveHours.map((hour) => (
              <Group key={hour.hour} justify="space-between">
                <Text size="sm">{hour.hour}:00 - {hour.hour + 1}:00</Text>
                <Badge size="sm">{hour.games} games</Badge>
              </Group>
            ))}
          </>
        )}
      </Stack>
    </Paper>
  );
};

const ChampionPerformanceCard = ({ performance }: { performance: ChampionPerformance }) => {
  if (!performance) {
    return (
      <Paper p="md" radius="sm" style={MODAL_DETAIL_CARD_STYLE}>
        <Text fw={500} mb="md" size="lg">Champion Performance</Text>
        <Text c="dimmed">No champion statistics available</Text>
      </Paper>
    );
  }

  return (
    <Paper p="md" radius="sm" style={MODAL_DETAIL_CARD_STYLE}>
      <Text fw={500} mb="md" size="lg">Champion Performance</Text>
      
      <Text size="sm" fw={500} mb="xs" c="teal">Best Champions</Text>
      {performance.bestChampions.map((champ) => (
        <Paper key={champ.name} p="xs" mb="xs" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
          <Group justify="space-between">
            <Group gap="sm">
              <Image
                src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champ.name.toLowerCase()}.png`}
                alt={champ.name}
                width={24}
                height={24}
                style={{ borderRadius: '50%' }}
              />
              <Text size="sm">{champ.name}</Text>
            </Group>
            <Group gap="xs">
              <Badge size="sm" color="blue">{champ.games} games</Badge>
              <Badge size="sm" color={champ.winRate >= 50 ? 'green' : 'red'}>
                {champ.winRate.toFixed(1)}% WR
              </Badge>
              <Badge size="sm" color="yellow">{champ.kda.toFixed(2)} KDA</Badge>
            </Group>
          </Group>
        </Paper>
      ))}

      <Text size="sm" fw={500} mb="xs" mt="md" c="red">Worst Champions</Text>
      {performance.worstChampions.map((champ) => (
        <Paper key={champ.name} p="xs" mb="xs" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
          <Group justify="space-between">
            <Group gap="sm">
              <Image
                src={`https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${champ.name.toLowerCase()}.png`}
                alt={champ.name}
                width={24}
                height={24}
                style={{ borderRadius: '50%' }}
              />
              <Text size="sm">{champ.name}</Text>
            </Group>
            <Group gap="xs">
              <Badge size="sm" color="blue">{champ.games} games</Badge>
              <Badge size="sm" color={champ.winRate >= 50 ? 'green' : 'red'}>
                {champ.winRate.toFixed(1)}% WR
              </Badge>
              <Badge size="sm" color="yellow">{champ.kda.toFixed(2)} KDA</Badge>
            </Group>
          </Group>
        </Paper>
      ))}
    </Paper>
  );
};

// Update the PlayerStatsGrid component
const PlayerStatsGrid = ({ statistiken, playersData }: { statistiken: any; playersData: any }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [opened, { open, close }] = useDisclosure(false);

  const handlePlayerClick = (spielerName: string) => {
    setSelectedPlayer(spielerName);
    open();
  };

  return (
    <>
      <SimpleGrid 
        cols={{ base: 1, sm: 2, lg: 4 }} 
        spacing={{ base: 'sm', sm: 'lg' }}
        mb="xl"
      >
        {statistiken.spielerStatistiken.map((spieler: any) => (
          <Paper 
            key={spieler.spielerName}
            p={{ base: 'sm', sm: 'md' }}
            radius="md"
            style={{
              ...PLAYER_CARD_STYLES,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onClick={() => handlePlayerClick(spieler.spielerName)}
          >
            <Group>
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                <Box style={{ width: 48, height: 48 }}>
                  <Image
                    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${
                      playersData.players[spieler.spielerName.split('#')[0]]?.profileIconId || '1'
                    }.png`}
                    alt={spieler.spielerName}
                    width={48}
                    height={48}
                    style={{ 
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--mantine-color-blue-6)',
                    }}
                  />
                </Box>
              </motion.div>
              <Box>
                <Text size="md" fw={700}>
                  {spieler.spielerName.split('#')[0]}
                </Text>
                <Group gap={6}>
                  <Text size="xs" c="dimmed">
                    Spiele: {spieler.gespielteSpielen}
                  </Text>
                  <Text 
                    size="xs"
                    c={`${getSiegRateColor(spieler.siege / spieler.gespielteSpielen * 100)}.6`}
                  >
                    {((spieler.siege / spieler.gespielteSpielen) * 100).toFixed(1)}% WR
                  </Text>
                </Group>
              </Box>
            </Group>
            <Button 
              variant="subtle" 
              fullWidth 
              mt="sm"
              rightSection={<IconChevronRight size={16} />}
            >
              View Details
            </Button>
          </Paper>
        ))}
      </SimpleGrid>

      {selectedPlayer && (
        <PlayerDetailsModal
          spieler={statistiken.spielerStatistiken.find(
            (s: { spielerName: string }) => s.spielerName === selectedPlayer
          )!}
          opened={opened}
          close={() => {
            close();
            setSelectedPlayer(null);
          }}
          playersData={playersData}
        />
      )}
    </>
  );
};

export default function StatistikSeite() {
  const router = useRouter();
  const [statistiken, setStatistiken] = useState<GlobaleStatistiken | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typedPlayersData, setTypedPlayersData] = useState<PlayersData>({ players: {} });

  useEffect(() => {
    const loadAndCalculateStats = async () => {
      try {
        const playerNames = Object.keys(summonerTags);
        const playersData: Record<string, any> = {};

        console.log('Loading data for players:', playerNames);

        // Load all player JSON files
        for (const name of playerNames) {
          try {
            const response = await fetch(`/data/players/${name}.json`);
            if (!response.ok) {
              console.error(`Failed to load data for ${name}:`, response.status);
              continue;
            }
            const playerData = await response.json();
            playersData[name] = playerData;
          } catch (error) {
            console.error(`Error loading data for ${name}:`, error);
          }
        }

        if (Object.keys(playersData).length === 0) {
          throw new Error('No player data could be loaded');
        }

        setTypedPlayersData({ players: playersData });
        calculateStats({ players: playersData });

      } catch (error) {
        console.error('Error in loadAndCalculateStats:', error);
        setError(error instanceof Error ? error.message : 'Failed to load statistics');
      } finally {
        setIsLoading(false);
      }
    };

    loadAndCalculateStats();
  }, []);

  const calculateStats = (typedPlayersData: { players: Record<string, any> }) => {
    try {
      const playerStats: SpielerMatchStatistiken[] = [];
      let totalGamesAll = 0;
      let totalGameTime = 0;
      
      // Add these variables
      const championData: Record<string, {
        name: string;
        games: number;
        wins: number;
        kills: number;
        deaths: number;
        assists: number;
      }> = {};

      // Also add these variables
      let mostActivePlayer = { name: '', spiele: 0 };
      let bestWinRate = { name: '', siegRate: 0, spiele: 0 };
      let mostPings = { name: '', pings: 0, pingDetails: {} };
      let bestKDA = { name: '', kda: 0 };
      let longestWinStreak = { name: '', serie: 0 };
      let longestLoseStreak = { name: '', serie: 0 };

      // Add console log to check input data
      console.log('Processing players data:', typedPlayersData);

      Object.entries(typedPlayersData.players).forEach(([playerName, playerData]) => {
        if (!playerData.recentMatches) {
          console.warn(`No recent matches for player ${playerName}`);
          return;
        }

        let wins = 0;
        let kills = 0;
        let deaths = 0;
        let assists = 0;
        let gameTime = 0;
        let aramGames = 0;
        let totalVisionScore = 0;
        let totalPings = {
          allInPings: 0,
          assistMePings: 0,
          baitPings: 0,
          basicPings: 0,
          commandPings: 0,
          dangerPings: 0,
          enemyMissingPings: 0,
          enemyVisionPings: 0,
          getBackPings: 0,
          holdPings: 0,
          needVisionPings: 0,
          onMyWayPings: 0,
          pushPings: 0,
          visionClearedPings: 0,
        };
        let currentWinStreak = 0;
        let maxWinStreak = 0;
        let currentLoseStreak = 0;
        let maxLoseStreak = 0;
        const champStats: Record<string, { games: number; wins: number }> = {};
        let totalKillParticipation = 0;

        // Time-based tracking
        let gameTimings: { hour: number; duration: number; champion: string }[] = [];
        let championStats: Record<string, {
          games: number;
          wins: number;
          kills: number;
          deaths: number;
          assists: number;
          roles: Record<string, number>;
        }> = {};
        
        playerData.recentMatches.forEach((match: any) => {
          const participant = match.info.participants.find(
            (p: any) => p.puuid === playerData.puuid
          );
          if (!participant) return;

          gameTime += match.info.gameDuration;
          totalGamesAll++;
          totalGameTime += match.info.gameDuration;

          // Update champion stats
          if (!champStats[participant.championName]) {
            champStats[participant.championName] = { games: 0, wins: 0 };
          }
          champStats[participant.championName].games++;
          if (participant.win) champStats[participant.championName].wins++;

          // Global champion stats
          if (!championData[participant.championName]) {
            championData[participant.championName] = {
              name: participant.championName,
              games: 0,
              wins: 0,
              kills: 0,
              deaths: 0,
              assists: 0,
            };
          }
          championData[participant.championName].games++;
          championData[participant.championName].kills += participant.kills;
          championData[participant.championName].deaths += participant.deaths;
          championData[participant.championName].assists += participant.assists;
          if (participant.win) championData[participant.championName].wins++;

          // Update streaks
          if (participant.win) {
            currentWinStreak++;
            currentLoseStreak = 0;
            maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
            wins++;
          } else {
            currentLoseStreak++;
            currentWinStreak = 0;
            maxLoseStreak = Math.max(maxLoseStreak, currentLoseStreak);
          }

          if (match.info.gameMode === 'ARAM') aramGames++;
          kills += participant.kills;
          deaths += participant.deaths;
          assists += participant.assists;

          // Update ping stats
          if (participant.allInPings) totalPings.allInPings += participant.allInPings;
          if (participant.assistMePings) totalPings.assistMePings += participant.assistMePings;
          if (participant.baitPings) totalPings.baitPings += participant.baitPings;
          if (participant.basicPings) totalPings.basicPings += participant.basicPings;
          if (participant.commandPings) totalPings.commandPings += participant.commandPings;
          if (participant.dangerPings) totalPings.dangerPings += participant.dangerPings;
          if (participant.enemyMissingPings) totalPings.enemyMissingPings += participant.enemyMissingPings;
          if (participant.enemyVisionPings) totalPings.enemyVisionPings += participant.enemyVisionPings;
          if (participant.getBackPings) totalPings.getBackPings += participant.getBackPings;
          if (participant.holdPings) totalPings.holdPings += participant.holdPings;
          if (participant.needVisionPings) totalPings.needVisionPings += participant.needVisionPings;
          if (participant.onMyWayPings) totalPings.onMyWayPings += participant.onMyWayPings;
          if (participant.pushPings) totalPings.pushPings += participant.pushPings;
          if (participant.visionClearedPings) totalPings.visionClearedPings += participant.visionClearedPings;

          // Add vision score tracking
          if (participant.visionScore) {
            totalVisionScore += participant.visionScore;
          }

          // Calculate team's total kills
          const teamId = participant.teamId;
          const teamKills = match.info.participants
            .filter((p: any) => p.teamId === teamId)
            .reduce((sum: number, p: any) => sum + p.kills, 0);

          // Calculate kill participation for this match
          const playerKP = teamKills > 0 
            ? ((participant.kills + participant.assists) / teamKills)
            : 0;
          
          totalKillParticipation += playerKP;

          // Track game timing
          const gameHour = new Date(match.info.gameStartTimestamp).getHours();
          gameTimings.push({
            hour: gameHour,
            duration: match.info.gameDuration,
            champion: participant.championName
          });

          // Track champion stats
          if (!championStats[participant.championName]) {
            championStats[participant.championName] = {
              games: 0,
              wins: 0,
              kills: 0,
              deaths: 0,
              assists: 0,
              roles: {}
            };
          }
          
          const champStat = championStats[participant.championName];
          champStat.games++;
          if (participant.win) champStat.wins++;
          champStat.kills += participant.kills;
          champStat.deaths += participant.deaths;
          champStat.assists += participant.assists;
          if (participant.teamPosition) {
            champStat.roles[participant.teamPosition] = 
              (champStat.roles[participant.teamPosition] || 0) + 1;
          }
        });

        const totalPingsCount = Object.values(totalPings).reduce((sum, count) => sum + count, 0);

        // Calculate player's most played champion
        const mostPlayedChamp = Object.entries(champStats).reduce<{
          name: string;
          stats: { games: number; wins: number } | null;
        }>(
          (max, [champName, stats]) =>
            stats.games > (max.stats?.games ?? 0)
              ? { name: champName, stats }
              : max,
          { name: '', stats: null }
        );

        // Calculate time-based stats
        const timeStats: TimeBasedStats = {
          averageGameLength: gameTimings.reduce((sum, g) => sum + g.duration, 0) / gameTimings.length,
          longestGame: gameTimings.reduce((longest, game) => 
            game.duration > (longest?.duration || 0) ? game : longest
          , gameTimings[0]),
          shortestGame: gameTimings.reduce((shortest, game) => 
            game.duration < (shortest?.duration || Infinity) ? game : shortest
          , gameTimings[0]),
          mostActiveHours: Object.entries(
            gameTimings.reduce((hours: Record<number, number>, game) => {
              hours[game.hour] = (hours[game.hour] || 0) + 1;
              return hours;
            }, {})
          )
            .map(([hour, games]) => ({ hour: Number(hour), games }))
            .sort((a, b) => b.games - a.games)
            .slice(0, 3)
        };

        // Calculate champion performance
        const champPerformance = Object.entries(championStats)
          .map(([name, stats]) => ({
            name,
            games: stats.games,
            winRate: (stats.wins / stats.games) * 100,
            kda: stats.deaths === 0 ? stats.kills + stats.assists : (stats.kills + stats.assists) / stats.deaths,
            averageKills: stats.kills / stats.games,
            averageDeaths: stats.deaths / stats.games,
            averageAssists: stats.assists / stats.games
          }))
          .filter(champ => champ.games >= 3) // Minimum 3 games played
          .sort((a, b) => b.winRate - a.winRate);

        // Add player stats
        const totalGames = playerData.recentMatches.length;
        const winRate = (wins / totalGames) * 100;
        const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;

        playerStats.push({
          spielerName: playerName,
          gespielteSpielen: totalGames,
          siege: wins,
          niederlagen: totalGames - wins,
          kills,
          tode: deaths,
          assists,
          durchschnittlicheSpielzeit: gameTime / totalGames,
          meistGespielterChampion: {
            name: mostPlayedChamp.name,
            spiele: mostPlayedChamp.stats?.games || 0,
            siegesRate: mostPlayedChamp.stats
              ? (mostPlayedChamp.stats.wins / mostPlayedChamp.stats.games) * 100
              : 0,
          },
          aramSpiele: aramGames,
          gesamtPings: totalPingsCount,
          siegesSerie: maxWinStreak,
          niederlagenSerie: maxLoseStreak,
          pingStats: totalPings,
          averageKDA: deaths === 0 ? kills + assists : (kills + assists) / deaths,
          averageKillParticipation: totalKillParticipation / totalGames,
          averageVisionScore: totalVisionScore / totalGames,
          timeStats: timeStats,
          championPerformance: {
            bestChampions: champPerformance.slice(0, 3),
            worstChampions: champPerformance.slice(-3).reverse()
          }
        });

        // Update best performers
        if (totalGames > mostActivePlayer.spiele) {
          mostActivePlayer = { name: playerName, spiele: totalGames };
        }
        if (totalGames >= 5 && winRate > bestWinRate.siegRate) {
          bestWinRate = { name: playerName, siegRate: winRate, spiele: totalGames };
        }
        if (totalPingsCount > mostPings.pings) {
          mostPings = { 
            name: playerName, 
            pings: totalPingsCount,
            pingDetails: totalPings 
          };
        }
        if (kda > bestKDA.kda) {
          bestKDA = { name: playerName, kda };
        }
        if (maxWinStreak > longestWinStreak.serie) {
          longestWinStreak = { name: playerName, serie: maxWinStreak };
        }
        if (maxLoseStreak > longestLoseStreak.serie) {
          longestLoseStreak = { name: playerName, serie: maxLoseStreak };
        }
      });

      setStatistiken({
        gesamtSpiele: totalGamesAll,
        durchschnittlicheSpielzeit: totalGameTime / totalGamesAll,
        aktivsterSpieler: mostActivePlayer,
        höchsteSiegRate: bestWinRate,
        meistePings: mostPings,
        besteKDA: bestKDA,
        längsteSiegesserie: longestWinStreak,
        längsteNiederlagenserie: longestLoseStreak,
        spielerStatistiken: playerStats,
        championStatistiken: Object.values(championData)
          .map(champ => ({
            name: champ.name,
            spiele: champ.games,
            siege: champ.wins,
            kills: champ.kills,
            tode: champ.deaths,
            assists: champ.assists
          }))
          .sort((a, b) => b.spiele - a.spiele)
          .slice(0, 20), // Only show top 20 champions
      });
    } catch (error) {
      console.error('Error in calculateStats:', error);
      throw error;
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const StatistikKarte = ({ 
    titel, 
    wert, 
    beschreibung, 
    icon 
  }: { 
    titel: string; 
    wert: string | number; 
    beschreibung?: string;
    icon?: React.ReactNode;
  }) => (
    <Paper 
      p={{ base: 'sm', sm: 'md' }} 
      radius="md" 
      style={CARD_STYLES}
    >
      <Group align="center" mb={8}>
        {icon}
        <Text size="md" fw={700}>{titel}</Text>
      </Group>
      <Text 
        size="lg"
        fw={900} 
        variant="gradient" 
        gradient={{ from: 'blue', to: 'cyan' }}
      >
        {wert}
      </Text>
      {beschreibung && (
        <Text size="xs" c="dimmed" mt={4}>{beschreibung}</Text>
      )}
    </Paper>
  );

  const SpielerStatistikKarte = ({ spieler }: { spieler: SpielerMatchStatistiken }) => (
    <Paper 
      p={{ base: 'sm', sm: 'md' }} 
      radius="md" 
      style={CARD_STYLES}
    >
      <Group align="center" mb="md">
        <Box style={{ width: 48, height: 48 }}>
          <Image
            src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${
              typedPlayersData.players[spieler.spielerName.split('#')[0]]?.profileIconId || '1'
            }.png`}
            alt={spieler.spielerName}
            width={48}
            height={48}
            style={{ 
              borderRadius: '50%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              // Fallback to default icon
              (e.target as HTMLImageElement).src = DEFAULT_ICON;
            }}
          />
        </Box>
        <Box>
          <Text size="lg" fw={700}>
            {spieler.spielerName.split('#')[0]}
          </Text>
          <Group gap={6}>
            <Text size="sm" c="dimmed">
              Spiele: {spieler.gespielteSpielen}
            </Text>
            <Text 
              size="sm"
              c={`${getSiegRateColor(spieler.siege / spieler.gespielteSpielen * 100)}.6`}
            >
              {((spieler.siege / spieler.gespielteSpielen) * 100).toFixed(1)}% WR
            </Text>
          </Group>
        </Box>
      </Group>
      <Progress.Root size="xl" mb="md">
        <Progress.Section 
          value={(spieler.siege / spieler.gespielteSpielen) * 100}
          color="teal"
        >
          <Progress.Label>Siege: {spieler.siege}</Progress.Label>
        </Progress.Section>
        <Progress.Section
          value={(spieler.niederlagen / spieler.gespielteSpielen) * 100}
          color="red"
        >
          <Progress.Label>Niederlagen: {spieler.niederlagen}</Progress.Label>
        </Progress.Section>
      </Progress.Root>
      <Group grow>
        <Box>
          <Text size="sm" c="dimmed">KDA</Text>
          <Group gap={4}>
            <Group gap={2} wrap="nowrap">
              <IconSword size={14} style={{ color: '#2dd4bf' }} />
              <Text size="sm" fw={500} c="teal.4">{spieler.kills}</Text>
            </Group>
            <Group gap={2} wrap="nowrap">
              <IconSkull size={14} style={{ color: '#f87171' }} />
              <Text size="sm" fw={500} c="red.4">{spieler.tode}</Text>
            </Group>
            <Group gap={2} wrap="nowrap">
              <IconHandStop size={14} style={{ color: '#60a5fa' }} />
              <Text size="sm" fw={500} c="blue.4">{spieler.assists}</Text>
            </Group>
          </Group>
        </Box>
        <Box>
          <Text size="sm" c="dimmed">Meist gespielt</Text>
          <Group gap={4}>
            <Image
              src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${spieler.meistGespielterChampion.name}.png`}
              alt={spieler.meistGespielterChampion.name}
              width={24}
              height={24}
              style={{ borderRadius: '4px' }}
              onError={(e) => {
                // Fallback to default icon
                (e.target as HTMLImageElement).src = DEFAULT_ICON;
              }}
            />
            <Text size="sm" fw={500}>
              {spieler.meistGespielterChampion.name}
            </Text>
          </Group>
        </Box>
      </Group>
      <SimpleGrid cols={2} spacing="xs" mt="md">
        <Box>
          <Text size="sm" c="dimmed">Average KDA</Text>
          <Text size="lg" fw={500}>{spieler.averageKDA.toFixed(2)}</Text>
        </Box>
        <Box>
          <Text size="sm" c="dimmed">Kill Participation</Text>
          <Text size="lg" fw={500}>{(spieler.averageKillParticipation * 100).toFixed(1)}%</Text>
        </Box>
        <Box>
          <Text size="sm" c="dimmed">Vision Score</Text>
          <Text size="lg" fw={500}>{spieler.averageVisionScore.toFixed(1)}</Text>
        </Box>
        <Box>
          <Text size="sm" c="dimmed">Total Pings</Text>
          <Text size="lg" fw={500}>{Object.values(spieler.pingStats).reduce((a, b) => a + b, 0)}</Text>
        </Box>
      </SimpleGrid>
      <SimpleGrid 
        cols={{ base: 1, md: 2 }} 
        spacing="lg"
      >
        <TimeStatsCard timeStats={spieler.timeStats} />
        <ChampionPerformanceCard performance={spieler.championPerformance} />
      </SimpleGrid>
    </Paper>
  );

  const ChampionStatistikKarte = ({ champion }: { champion: GlobaleStatistiken['championStatistiken'][0] }) => (
    <Paper p="md" radius="md" style={CARD_STYLES}>
      <Group align="center" mb="md">
        <Image
          src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${champion.name}.png`}
          alt={champion.name}
          width={48}
          height={48}
          style={{ borderRadius: '8px' }}
          onError={(e) => {
            // Try Community Dragon as fallback
            (e.target as HTMLImageElement).src = getChampionIconUrl(champion.name);
          }}
        />
        <Box>
          <Text size="lg" fw={700}>{champion.name}</Text>
          <Text size="sm" c="dimmed">{champion.spiele} Spiele gespielt</Text>
        </Box>
      </Group>
      <SimpleGrid cols={2} spacing="xs">
        <Paper p="xs" radius="sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
          <Text size="sm" c="dimmed">Siegrate</Text>
          <Text size="lg" fw={500} c={`${getSiegRateColor(champion.siege / champion.spiele * 100)}.6`}>
            {((champion.siege / champion.spiele) * 100).toFixed(1)}%
          </Text>
        </Paper>
        <Paper p="xs" radius="sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
          <Text size="sm" c="dimmed">KDA</Text>
          <Group gap={4}>
            <Group gap={2} wrap="nowrap">
              <IconSword size={14} style={{ color: '#2dd4bf' }} />
              <Text size="sm" fw={500} c="teal.4">{(champion.kills / champion.spiele).toFixed(1)}</Text>
            </Group>
            <Text fw={500}>/</Text>
            <Group gap={2} wrap="nowrap">
              <IconSkull size={14} style={{ color: '#f87171' }} />
              <Text size="sm" fw={500} c="red.4">{(champion.tode / champion.spiele).toFixed(1)}</Text>
            </Group>
            <Text fw={500}>/</Text>
            <Group gap={2} wrap="nowrap">
              <IconHandStop size={14} style={{ color: '#60a5fa' }} />
              <Text size="sm" fw={500} c="blue.4">{(champion.assists / champion.spiele).toFixed(1)}</Text>
            </Group>
          </Group>
        </Paper>
      </SimpleGrid>
    </Paper>
  );

  const ErrungenschaftKarte = ({ 
    titel, 
    wert, 
    spielerName, 
    icon,
    beschreibung 
  }: { 
    titel: string;
    wert: string | number;
    spielerName: string;
    icon: React.ReactNode;
    beschreibung?: string;
  }) => (
    <Paper p="md" radius="md" style={CARD_STYLES}>
      <Group align="center" mb={8}>
        {icon}
        <Text size="lg" fw={700}>{titel}</Text>
      </Group>
      <Group align="center" mb={8}>
        <Image
          src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${
            typedPlayersData.players[spielerName.split('#')[0] as keyof typeof typedPlayersData.players]?.profileIconId || '1'
          }.png`}
          alt={spielerName}
          width={32}
          height={32}
          style={{ borderRadius: '50%' }}
          onError={(e) => {
            // Fallback to default icon
            (e.target as HTMLImageElement).src = DEFAULT_ICON;
          }}
        />
        <Box>
          <Text size="xl" fw={900} variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            {wert}
          </Text>
          <Text size="sm" c="dimmed">{spielerName.split('#')[0]}</Text>
        </Box>
      </Group>
      {beschreibung && (
        <Text size="sm" c="dimmed" mt={4}>{beschreibung}</Text>
      )}
    </Paper>
  );

  const PingStatsCard = ({ pingStats }: { pingStats: SpielerMatchStatistiken['pingStats'] }) => (
    <Paper p="md" radius="md" style={CARD_STYLES}>
      <Text size="lg" fw={700} mb="md">Ping Breakdown</Text>
      <SimpleGrid cols={2} spacing="xs">
        {Object.entries(pingStats).map(([type, count]) => (
          <Group key={type} justify="space-between">
            <Text size="sm">{type.replace(/([A-Z])/g, ' $1').trim()}</Text>
            <Text size="sm" fw={500}>{count}</Text>
          </Group>
        ))}
      </SimpleGrid>
  
    </Paper>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AppShell
        bg="dark.8"
        style={{ minHeight: '100vh' }}
      >
        <Container 
          size="100%" 
          py="xl"
          px={{ base: 'md', sm: 40 }}
        >
          <Button
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
            leftSection={<IconArrowLeft size={16} />}
            mb="xl"
            onClick={() => router.push('/')}
          >
            Zurück zur Übersicht
          </Button>

          {/* Hero Section */}
          <Paper
            radius="lg"
            p={{ base: 'md', sm: 'xl' }}
            mb={50}
            style={CARD_STYLES}
          >
            <Group justify="space-between" align="flex-start">
              <Group align="center" gap="md">
                <Image 
                  src="/LOGO.png"
                  alt="LostGames Logo"
                  width={80}
                  height={80}
                  style={{
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
                <Box>
                  <Title 
                    order={1}
                    size="h1"
                    fw={900}
                    variant="gradient"
                  >
                    LostGames Statistics
                  </Title>
                  <Text c="dimmed" mt="md" size="md" maw={600}>
                    Detailed statistics for all LostGames players
                  </Text>
                </Box>
              </Group>
            </Group>
          </Paper>

          {isLoading ? (
            <LoadingOverlay visible={true} />
          ) : error ? (
            <Alert color="red" title="Error" mb="xl">
              {error}
            </Alert>
          ) : statistiken ? (
            <>
              {/* Global Stats */}
              <Title order={2} size="h3" mb="md" c="dimmed">Globale Statistiken</Title>
              <SimpleGrid 
                cols={{ base: 1, sm: 2, md: 3, lg: 4 }} 
                spacing={{ base: 'sm', sm: 'lg' }}
                mb="xl"
              >
                <StatistikKarte
                  titel="Gesamt Spiele"
                  wert={statistiken.gesamtSpiele}
                  beschreibung="Über alle Spieler"
                  icon={<IconTrophy size={24} color="var(--mantine-color-yellow-6)" />}
                />
                <StatistikKarte
                  titel="Durchschnittliche Spielzeit"
                  wert={formatTime(statistiken.durchschnittlicheSpielzeit)}
                  beschreibung="Pro Match"
                  icon={<IconClock size={24} color="var(--mantine-color-blue-6)" />}
                />
                <StatistikKarte
                  titel="Aktivster Spieler"
                  wert={statistiken.aktivsterSpieler.name.split('#')[0]}
                  beschreibung={`${statistiken.aktivsterSpieler.spiele} Spiele gespielt`}
                  icon={<IconSword size={24} color="var(--mantine-color-green-6)" />}
                />
                <StatistikKarte
                  titel="Höchste Siegrate"
                  wert={`${statistiken.höchsteSiegRate.siegRate.toFixed(1)}%`}
                  beschreibung={`${statistiken.höchsteSiegRate.name.split('#')[0]} (${statistiken.höchsteSiegRate.spiele} Spiele)`}
                  icon={<IconTrophy size={24} color="var(--mantine-color-yellow-6)" />}
                />
              </SimpleGrid>

              {/* Achievement Cards */}
              <Title order={2} size="h3" mb="md" c="dimmed">Errungenschaften</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" mb="xl">
                <ErrungenschaftKarte
                  titel="Beste KDA"
                  wert={statistiken.besteKDA.kda.toFixed(2)}
                  spielerName={statistiken.besteKDA.name}
                  icon={<IconSword size={24} color="var(--mantine-color-teal-6)" />}
                />
                <ErrungenschaftKarte
                  titel="Längste Siegesserie"
                  wert={statistiken.längsteSiegesserie.serie}
                  spielerName={statistiken.längsteSiegesserie.name}
                  icon={<IconTrophy size={24} color="var(--mantine-color-green-6)" />}
                />
                <ErrungenschaftKarte
                  titel="Meiste Pings"
                  wert={statistiken.meistePings.pings.toLocaleString()}
                  spielerName={statistiken.meistePings.name}
                  icon={<IconHandStop size={24} color="var(--mantine-color-blue-6)" />}
                />
              </SimpleGrid>

              {/* Player Stats */}
              <Title order={2} size="h3" mb="md" c="dimmed">Spieler Statistiken</Title>
              <PlayerStatsGrid 
                statistiken={statistiken} 
                playersData={typedPlayersData} 
              />

              {/* Champion Stats */}
              <Title order={2} size="h3" mb="md" c="dimmed">Meist gespielte Champions</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="lg">
                {statistiken.championStatistiken.map((champion) => (
                  <ChampionStatistikKarte key={champion.name} champion={champion} />
                ))}
              </SimpleGrid>

            
            </>
          ) : null}
        </Container>
      </AppShell>
    </motion.div>
  );
} 