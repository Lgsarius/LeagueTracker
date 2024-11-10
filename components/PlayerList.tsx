/* eslint-disable */
import { SimpleGrid, Paper, Text, Group, Avatar, Badge, Button, Tooltip, Stack, Select} from '@mantine/core';
import { IconChevronRight, IconSkull, IconClock, IconRefresh, IconUserPlus, IconChevronDown, IconChevronUp, IconHistory } from '@tabler/icons-react';
import { PlayerData } from '@/types/player';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { CompareModal } from './CompareModal';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { differenceInHours } from 'date-fns';

interface PlayerListProps {
  players: PlayerData[];
  onRemovePlayer: (name: string) => void;
  onReload: () => void;
  onInitNewPlayers: () => void;
  onReloadPlayer: (name: string) => Promise<void>;
  isLoading: boolean;
}

// Update the CARD_STYLES constant
export const CARD_STYLES = {
  border: '1px solid #ffffff10',
  backdropFilter: 'blur(8px)',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  position: 'relative' as const,
  overflow: 'hidden' as const,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
  },
};

// Add a new style for hover effects
const INTERACTIVE_CARD_STYLES = {
  ...CARD_STYLES,
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
};

// Add at the top with other constants
const ALERT_THRESHOLD_LOSSES = 3;
const ALERT_THRESHOLD_KDA = 1.0;
const GAMES_24H_THRESHOLD = 5;
const MATCH_PREVIEW_COUNT = 3;

// Add this new component for the animated alert
const AnimatedAlert = ({ type }: { type: 'tilt' | 'hobbylos' }) => {
  const getIcon = () => {
    switch (type) {
      case 'tilt':
        return <IconSkull size={28} color="#ff3333" />;
      case 'hobbylos':
        return <IconClock size={28} color="#ffd700" />;
      default:
        return null;
    }
  };

  const getTooltipText = () => {
    switch (type) {
      case 'tilt':
        return 'Brüchiger Spieler';
      case 'hobbylos':
        return 'Hobbylos';
      default:
        return '';
    }
  };

  return (
    <Tooltip label={getTooltipText()} position="top">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [-5, 5, -5, 5, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
        style={{ display: 'inline-flex' }}
      >
        {getIcon()}
      </motion.div>
    </Tooltip>
  );
};

// Fix the shouldShowAlert function
const shouldShowAlert = (player: PlayerData) => {
  if (!player.recentMatches || player.recentMatches.length < ALERT_THRESHOLD_LOSSES) return false;
  
  const recentMatches = player.recentMatches.slice(0, ALERT_THRESHOLD_LOSSES);
  let consecutiveLosses = 0;
  
  for (const match of recentMatches) {
    const participant = match.info.participants.find(
      p => p.puuid === player.summoner.puuid
    );
    if (!participant || participant.win) break;
    consecutiveLosses++;
  }
  
  return consecutiveLosses >= ALERT_THRESHOLD_LOSSES;
};

const checkBadKDA = (player: PlayerData) => {
  if (!player.recentMatches || player.recentMatches.length === 0) return false;
  
  const recentMatches = player.recentMatches.slice(0, 3);
  const averageKDA = recentMatches.reduce((acc, match) => {
    const participant = match.info.participants.find(
      p => p.puuid === player.summoner.puuid
    );
    if (!participant) return acc;
    const kda = ((participant.kills + participant.assists) / Math.max(1, participant.deaths));
    return acc + kda;
  }, 0) / recentMatches.length;
  
  return averageKDA < ALERT_THRESHOLD_KDA;
};

// Add this helper function
const checkGamesLast24Hours = (player: PlayerData) => {
  if (!player.recentMatches) return false;
  
  const last24Hours = Date.now() - (24 * 60 * 60 * 1000);
  const gamesLast24h = player.recentMatches.filter(match => 
    match.info.gameCreation > last24Hours
  ).length;
  
  return gamesLast24h >= GAMES_24H_THRESHOLD;
};

// Fix the recent winrate calculation
const getRecentWinrate = (player: PlayerData) => {
  if (!player.recentMatches || player.recentMatches.length === 0) return 0;
  
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  const recentMatches = player.recentMatches.filter(match => 
    match.info.gameCreation > sevenDaysAgo
  );

  if (recentMatches.length === 0) return 0;

  const wins = recentMatches.reduce((acc, match) => {
    const participant = match.info.participants.find(
      p => p.puuid === player.summoner.puuid
    );
    return acc + (participant?.win ? 1 : 0);
  }, 0);

  return (wins / recentMatches.length) * 100;
};

type SortOption = 'rank' | 'winrate' | 'level';

const SORT_OPTIONS = [
  { value: 'rank', label: 'Rank (Solo/Duo)' },
  { value: 'winrate', label: '7-Day Win Rate' },
  { value: 'level', label: 'Level' },
];

// Fix the rank calculation helper
const getSoloQueueRank = (player: PlayerData) => {
  const soloQueue = player.rankedInfo?.find(queue => queue.queueType === 'Solo/Duo');
  if (!soloQueue) return -1;
  
  const tierValues: { [key: string]: number } = {
    'CHALLENGER': 9,
    'GRANDMASTER': 8,
    'MASTER': 7,
    'DIAMOND': 6,
    'PLATINUM': 5,
    'GOLD': 4,
    'SILVER': 3,
    'BRONZE': 2,
    'IRON': 1,
    'UNRANKED': 0
  };

  const rankValues: { [key: string]: number } = {
    'I': 4,
    'II': 3,
    'III': 2,
    'IV': 1
  };

  const tierValue = tierValues[soloQueue.tier] || 0;
  const rankValue = rankValues[soloQueue.rank] || 0;
  const lpValue = soloQueue.leaguePoints || 0;

  return (tierValue * 10000) + (rankValue * 100) + lpValue;
};

const MatchHistoryPreview = ({ matches, puuid }: { matches: any[], puuid: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Paper mt="md" p="md" radius="md" style={CARD_STYLES}>
      <Group justify="space-between" mb={isExpanded ? "md" : 0}>
        <Group gap={8}>
          <IconHistory size={16} />
          <Text size="sm" fw={500}>Match History</Text>
        </Group>
        <Button 
          variant="subtle" 
          size="xs" 
          onClick={() => setIsExpanded(!isExpanded)}
          rightSection={isExpanded ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
        >
          {isExpanded ? 'Hide' : 'Show'}
        </Button>
      </Group>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {matches?.slice(0, MATCH_PREVIEW_COUNT).map((match, idx) => {
              const participant = match.info.participants.find((p: any) => p.puuid === puuid);
              if (!participant) return null;
              
              return (
                <Paper 
                  key={idx} 
                  p="sm" 
                  mb={8} 
                  radius="md"
                  style={{
                    ...CARD_STYLES,
                    backgroundColor: participant.win 
                      ? 'rgba(76, 175, 80, 0.1)' 
                      : 'rgba(244, 67, 54, 0.1)',
                  }}
                >
                  <Group justify="space-between">
                    <Group gap={8}>
                      <Avatar
                        size={32}
                        src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/${participant.championName}.png`}
                        radius="sm"
                      />
                      <Stack gap={0}>
                        <Text size="sm">{participant.championName}</Text>
                        <Text size="xs" c="dimmed">
                          {formatDistanceToNow(new Date(match.info.gameCreation))} ago
                        </Text>
                      </Stack>
                    </Group>
                    <Stack gap={2} justify="flex-end">
                      <Text size="sm" fw={600} c={participant.win ? 'teal' : 'red'}>
                        {participant.kills}/{participant.deaths}/{participant.assists}
                      </Text>
                      <Text size="xs" c={participant.win ? 'teal' : 'red'}>
                        {participant.win ? 'Victory' : 'Defeat'}
                      </Text>
                    </Stack>
                  </Group>
                </Paper>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </Paper>
  );
};

// Add this new component
const StatBox = ({ label, value, color }: { label: string; value: string | number; color?: string }) => (
  <Paper p={8} radius="md" style={CARD_STYLES}>
    <Stack align="center" gap={2}>
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="sm" fw={700} c={color}>
        {value}
      </Text>
    </Stack>
  </Paper>
);

// Add this new component
const StatusIndicator = ({ lastGameTime }: { lastGameTime: Date | null }) => {
  const getStatusInfo = (lastGameTime: Date | null) => {
    if (!lastGameTime) return {
      color: 'gray',
      label: 'No recent games',
      dotAnimation: false
    };

    const hoursSince = differenceInHours(new Date(), lastGameTime);
    
    if (hoursSince < 1) return {
      color: 'green',
      label: 'Recently active',
      dotAnimation: true
    };
    
    if (hoursSince < 3) return {
      color: 'yellow',
      label: formatDistanceToNow(lastGameTime, { addSuffix: true }),
      dotAnimation: true
    };
    
    if (hoursSince < 24) return {
      color: 'orange',
      label: formatDistanceToNow(lastGameTime, { addSuffix: true }),
      dotAnimation: false
    };
    
    return {
      color: 'red',
      label: formatDistanceToNow(lastGameTime, { addSuffix: true }),
      dotAnimation: false
    };
  };

  const status = getStatusInfo(lastGameTime);

  return (
    <Paper 
      mt="xs"
      p="xs" 
      radius="md" 
      style={{
        ...CARD_STYLES,
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
      }}
    >
      <Group gap={8} align="center">
        <motion.div
          animate={status.dotAnimation ? {
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: `var(--mantine-color-${status.color}-6)`,
            boxShadow: `0 0 8px var(--mantine-color-${status.color}-6)`
          }}
        />
        <Group gap={4} align="center">
          <Text 
            size="xs" 
            fw={500}
            style={{ 
              color: `var(--mantine-color-${status.color}-4)`,
              textShadow: '0 0 10px rgba(0,0,0,0.3)'
            }}
          >
            {status.label}
          </Text>
          {lastGameTime && (
            <Tooltip 
              label={new Date(lastGameTime).toLocaleString()} 
              position="right"
            >
              <Text size="xs" c="dimmed" style={{ cursor: 'help' }}>
                ({formatDistanceToNow(lastGameTime, { addSuffix: true })})
              </Text>
            </Tooltip>
          )}
        </Group>
      </Group>
    </Paper>
  );
};

export function PlayerList({ players, onReload, onInitNewPlayers, onReloadPlayer, isLoading }: PlayerListProps) {
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('rank');

  const [lastUpdated] = useState<Date>(new Date());

  const [refreshingPlayers, setRefreshingPlayers] = useState<Set<string>>(new Set());

  const handlePlayerRefresh = async (name: string) => {
    setRefreshingPlayers(prev => new Set(prev).add(name));
    try {
      await onReloadPlayer(name);
    } finally {
      setRefreshingPlayers(prev => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }
  };

  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    
    return [...players].sort((a, b) => {
      switch (sortBy) {
        case 'rank': {
          const rankA = getSoloQueueRank(a);
          const rankB = getSoloQueueRank(b);
          return rankB - rankA;
        }
        case 'winrate': {
          const wrA = getRecentWinrate(a);
          const wrB = getRecentWinrate(b);
          return wrB - wrA;
        }
        case 'level':
          return b.summoner.summonerLevel - a.summoner.summonerLevel;
        default:
          return 0;
      }
    });
  }, [players, sortBy]);

  const playerStats = useMemo(() => {
    if (!players) return {};
    
    return players.reduce((acc, player) => {
      const recentMatches = player.recentMatches?.slice(0, 5);
      const stats = recentMatches?.reduce((matchAcc, match) => {
        const playerStats = match.info.participants.find(
          p => p.puuid === player.summoner.puuid
        );
        if (playerStats) {
          matchAcc.kills += playerStats.kills;
          matchAcc.deaths += playerStats.deaths;
        }
        return matchAcc;
      }, { kills: 0, deaths: 0 });

      acc[player.summoner.puuid] = stats || { kills: 0, deaths: 0 };
      return acc;
    }, {} as Record<string, { kills: number; deaths: number }>);
  }, [players]);



  console.log('Players received:', players);

  if (!players) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        Loading players...
      </Text>
    );
  }

  players.forEach(player => {
    console.log('Player data:', {
      name: player?.summoner?.name,
      fullPlayer: player
    });
  });

  const handleOpenOpGG = (summonerName: string) => {
    console.log('Opening op.gg for:', summonerName);
    
    if (!summonerName) {
      console.error('No summoner name provided');
      return;
    }
    
    const cleanName = String(summonerName).replace('#', '-').trim();
    console.log('Cleaned name:', cleanName);
    
    const opggUrl = `https://www.op.gg/summoners/euw/${encodeURIComponent(cleanName)}`;
    console.log('Opening URL:', opggUrl);
    
    window.open(opggUrl, '_blank', 'noopener,noreferrer');
  };

  // Format the last updated time
  const formatLastUpdated = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  // Add near other helper functions
  const getLastGameTime = (player: PlayerData) => {
    if (!player.recentMatches?.[0]) return null;
    return new Date(player.recentMatches[0].info.gameCreation);
  };

  const getStatusColor = (lastGameTime: Date | null) => {
    if (!lastGameTime) return 'gray';
    const hoursSinceLastGame = (Date.now() - lastGameTime.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastGame < 1) return 'green';
    if (hoursSinceLastGame < 3) return 'yellow';
    return 'gray';
  };

  return (
    <>
      <Group mb="xl" justify="flex-end">
        <Button
          variant="light"
          leftSection={<IconUserPlus size={20} />}
          onClick={onInitNewPlayers}
          loading={isLoading}
        >
          Initialize New Players
        </Button>
        <Button
          variant="filled"
          leftSection={<IconRefresh size={20} />}
          onClick={onReload}
          loading={isLoading}
        >
          Refresh All Players
        </Button>
      </Group>
      <Paper p="md" radius="md" mb="lg" style={CARD_STYLES}>
        <Group justify="space-between">
          <Group>
            <Text size="lg" fw={600} c="dimmed">Active Players</Text>
            <Badge size="md" variant="filled" color="blue">{players.length}</Badge>
          </Group>
          <Group>
            <Select
              size="sm"
              value={sortBy}
              onChange={(value) => setSortBy(value as SortOption)}
              data={SORT_OPTIONS}
              style={{ width: 200 }}
            />
            <Button
              variant="subtle"
              onClick={() => setCompareModalOpen(true)}
              size="sm"
            >
              Compare Players
            </Button>
          
            <Text size="sm" c="dimmed">
              Last updated: {formatLastUpdated(lastUpdated)}
            </Text>
          </Group>
        </Group>
      </Paper>

      <CompareModal
        players={players}
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
      />

      <SimpleGrid 
        cols={{ base: 1, sm: 2, md: 3, lg: 4, xl: 5 }}
        spacing="sm"
        verticalSpacing="sm"
        mt="md"
      >
        {sortedPlayers.filter(player => player && player.summoner).map((player, index) => (
          <Paper
            key={`player-${player.summoner.name}-${index}`}
            radius="md"
            p="md"
            style={INTERACTIVE_CARD_STYLES}
          >
            <Group wrap="nowrap" mb="xs">
              <Avatar
                size={48}
                src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${player.summoner.profileIconId}.png`}
                radius="xl"
              />
              <div style={{ flex: 1 }}>
                <Text size="sm" fw={500} truncate>
                  {player.summoner.name.split('#')[0]}
                </Text>
                <Group gap={6}>
                  <Text size="xs" c="dimmed">Level {player.summoner.summonerLevel}</Text>
                  {sortBy === 'winrate' && (
                    <Text 
                      size="xs" 
                      c={getWinRateColor(getRecentWinrate(player))}
                    >
                      {getRecentWinrate(player).toFixed(1)}%
                    </Text>
                  )}
                  {shouldShowAlert(player) && <AnimatedAlert type="tilt" />}
                  {checkGamesLast24Hours(player) && <AnimatedAlert type="hobbylos" />}
                  {checkBadKDA(player) && <AnimatedAlert type="tilt" />}
                </Group>
              </div>
              <Group gap={4}>
                <Tooltip label="Refresh player">
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    px={8}
                    loading={refreshingPlayers.has(player.summoner.name)}
                    onClick={() => handlePlayerRefresh(player.summoner.name)}
                  >
                    <IconRefresh size={14} />
                  </Button>
                </Tooltip>
                <Button
                  variant="subtle"
                  color="blue"
                  size="xs"
                  px={8}
                  onClick={() => handleOpenOpGG(player.summoner.name)}
                  rightSection={<IconChevronRight size={14} />}
                >
                  op.gg
                </Button>
              </Group>
            </Group>

            {player.rankedInfo && player.rankedInfo.length > 0 ? (
              <Stack gap={6}>
                {player.rankedInfo.map((queue, qIndex) => (
                  <Paper
                    key={`ranked-${player.summoner.name}-${queue.queueType}-${qIndex}`}
                    p="xs"
                    radius="sm"
                    style={CARD_STYLES}
                  >
                    <Group justify="space-between" mb={4}>
                      <Text size="xs" c="dimmed">{queue.queueType}</Text>
                      <Text size="xs" fw={500}>{queue.leaguePoints} LP</Text>
                    </Group>
                    <Group justify="space-between" align="center">
                      <Badge
                        variant="filled"
                        style={{ 
                          background: queue.tier === 'IRON' 
                            ? `url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7mz3iLydD6sk14wva3SIld4dGKruvT7JBz5mWGabCHJ2C3_n8ta7KVWfebATQNlwwSpM&usqp=CAU') center/cover`
                            : queue.tier === 'BRONZE'
                            ? 'linear-gradient(45deg, #cd7f32, #8B4513)'
                            : queue.tier === 'SILVER'
                            ? 'linear-gradient(45deg, #C0C0C0, #808080)'
                            : queue.tier === 'GOLD'
                            ? 'linear-gradient(45deg, #FFD700, #DAA520)'
                            : queue.tier === 'PLATINUM'
                            ? 'linear-gradient(45deg, #00ff9f, #008B8B)'
                            : queue.tier === 'DIAMOND'
                            ? 'linear-gradient(45deg, #b9f2ff, #4169E1)'
                            : queue.tier === 'MASTER'
                            ? 'linear-gradient(45deg, #9370db, #800080)'
                            : queue.tier === 'GRANDMASTER'
                            ? 'linear-gradient(45deg, #ff4e50, #8B0000)'
                            : queue.tier === 'CHALLENGER'
                            ? 'linear-gradient(45deg, #00ccff, #0000CD)'
                            : undefined,
                          border: queue.tier === 'IRON' ? '1px solid #724b28' : undefined,
                          color: '#fff',
                          textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                          padding: '4px 8px',
                          fontWeight: 600,
                          letterSpacing: '0.5px',
                         
                        }}
                        size="sm"
                      >
                        {queue.tier} {queue.rank}
                      </Badge>
                      <Group gap={6}>
                        <Text size="xs" c="dimmed">
                          {queue.wins}W {queue.losses}L
                        </Text>
                        <Text size="xs" fw={500} c={getWinRateColor((queue.wins / (queue.wins + queue.losses)) * 100)}>
                          {Math.round((queue.wins / (queue.wins + queue.losses)) * 100)}%
                        </Text>
                      </Group>
                    </Group>
                  </Paper>
                ))}
              </Stack>
            ) : (
              <Text size="xs" c="dimmed" ta="center">Unranked</Text>
            )}

            {/* Enhanced K/D display with tooltip */}
            <Tooltip
              multiline
              position="bottom"
              label={
                <Stack gap="xs">
                  <Text size="xs" fw={500}>Last {player.recentMatches?.length || 0} Games:</Text>
                  <Group gap="xs">
                    <Stack gap={2}>
                      <Text size="xs" c="dimmed">Total Kills:</Text>
                      <Text size="xs" c="dimmed">Total Deaths:</Text>
                      <Text size="xs" c="dimmed">KD Ratio:</Text>
                    </Stack>
                    <Stack gap={2}>
                      <Text size="xs">{playerStats[player.summoner.puuid]?.kills || 0}</Text>
                      <Text size="xs">{playerStats[player.summoner.puuid]?.deaths || 0}</Text>
                      <Text size="xs">
                        {((playerStats[player.summoner.puuid]?.kills || 0) / 
                          Math.max(playerStats[player.summoner.puuid]?.deaths || 1, 1)).toFixed(2)}
                      </Text>
                    </Stack>
                  </Group>
                </Stack>
              }
            >
              <Paper
                mt="xs"
                p="xs"
                radius="sm"
                style={{
                  ...CARD_STYLES,
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  cursor: 'help'
                }}
              >
                <Group justify="center" gap="xs">
                  <Group gap={4}>
                    <Text size="xs" fw={600} c="teal.4">
                      {playerStats[player.summoner.puuid]?.kills || 0}
                    </Text>
                    <Text size="xs" c="dimmed">kills</Text>
                  </Group>
                  <Text size="xs" c="dimmed">/</Text>
                  <Group gap={4}>
                    <Text size="xs" fw={600} c="red.4">
                      {playerStats[player.summoner.puuid]?.deaths || 0}
                    </Text>
                    <Text size="xs" c="dimmed">deaths</Text>
                  </Group>
                </Group>
              </Paper>
            </Tooltip>

            {player.recentMatches && (
              <MatchHistoryPreview 
                matches={player.recentMatches} 
                puuid={player.summoner.puuid} 
              />
            )}

            <StatusIndicator lastGameTime={getLastGameTime(player)} />
          </Paper>
        ))}
      </SimpleGrid>

     
    </>
  );
}



function getWinRateColor(winRate: number): string {
  if (winRate >= 55) return '#4CAF50';
  if (winRate >= 50) return '#2196F3';
  return '#f44336';
} 