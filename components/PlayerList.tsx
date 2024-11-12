'use client';

/* eslint-disable */

import { SimpleGrid, Paper, Text, Group, Avatar, Badge, Button, Tooltip, Stack, Select} from '@mantine/core';
import { IconChevronRight, IconSkull, IconClock, IconRefresh, IconUserPlus, IconChevronDown, IconChevronUp, IconHistory, IconNotes, IconMedal } from '@tabler/icons-react';
import { PlayerData } from '@/types/player';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useMemo } from 'react';
import { CompareModal } from './CompareModal';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { differenceInHours } from 'date-fns';
import ScoreboardModal from './ScoreboardModal'; // Import the new modal component
import { useRouter } from 'next/navigation';
import { EnvironmentStats } from './EnvironmentStats';
import { DigitalClock } from './DigitalClock';

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
const MATCH_PREVIEW_COUNT = 10;

// Update the constants
const ANALYSIS_MATCH_COUNT = 5; // New constant for analysis

// Add time constants
const MOOD_RESET_HOURS = 12; // Reset mood after 12 hours of inactivity
const LONG_BREAK_HOURS = 24; // Show "Taking a Break" after 24 hours

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
  
  const recentMatches = player.recentMatches.slice(0, ANALYSIS_MATCH_COUNT);
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
  
  const recentMatches = player.recentMatches.slice(0, ANALYSIS_MATCH_COUNT);
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
  { value: 'rank', label: 'Rang (Solo/Duo)' },
  { value: 'winrate', label: '7-Tage Siegesrate' },
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

const MatchHistoryPreview = ({ 
  matches, 
  puuid, 
  getFormattedDuration 
}: { 
  matches: any[], 
  puuid: string, 
  getFormattedDuration: (match: any) => string 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  const openModal = (match: any) => {
    if (match) {
      setSelectedMatch(match);
      setModalOpen(true);
    }
  };

  console.log('Number of matches:', matches?.length);
  console.log('Match data:', matches);

  return (
    <>
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

                const formattedDuration = getFormattedDuration(match);

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
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                        backgroundColor: participant.win 
                          ? 'rgba(76, 175, 80, 0.2)' 
                          : 'rgba(244, 67, 54, 0.2)',
                      }
                    }}
                    onClick={() => openModal(match)}
                  >
                    <Group justify="space-between">
                      <Group gap={8}>
                        <Avatar
                          size={32}
                          src={`https://ddragon.leagueoflegends.com/cdn/14.22.1/img/champion/${participant.championName}.png`}
                          radius="sm"
                        />
                        <Stack gap={0}>
                          <Text size="sm">{participant.championName}</Text>
                          <Stack gap={0}>
                            <Text size="xs" c="dimmed" style={{ fontSize: '11px' }}>
                              {formatDistanceToNow(new Date(match.info.gameCreation))} ago
                            </Text>
                            <Text size="xs" c="dimmed" style={{ fontSize: '11px' }}>
                              {getReadableGameMode(match.info.gameMode, match.info.queueId)}
                            </Text>
                            <Text size="xs" c="dimmed" style={{ fontSize: '11px' }}>
                              Duration: {formattedDuration}
                            </Text>
                          </Stack>
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

      <ScoreboardModal 
        opened={isModalOpen} 
        onClose={() => setModalOpen(false)} 
        match={selectedMatch} 
      />
    </>
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

// Update the StatusIndicator component
const StatusIndicator = ({ lastGameTime, lastGameDuration }: { 
  lastGameTime: Date | null,
  lastGameDuration?: string 
}) => {
  const getStatusInfo = (lastGameTime: Date | null) => {
    if (!lastGameTime) return {
      color: 'gray',
      label: 'Keine kürzlichen Spiele',
      dotAnimation: false
    };

    const hoursSince = differenceInHours(new Date(), lastGameTime);
    
    if (hoursSince < 1) return {
      color: 'green',
      label: 'Kürzlich aktiv',
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
      <Group justify="space-between" align="center">
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
        </Group>
        {lastGameDuration && (
          <Text size="xs" c="dimmed">
            Spieldauer: {lastGameDuration}
          </Text>
        )}
      </Group>
    </Paper>
  );
};

// Enhanced RainEffect with lightning and better droplets
const RainEffect = () => (
  <>
    {/* Rain droplets */}
    <motion.div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.1)',
      }}
    >
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={`rain-${i}`}
          style={{
            position: 'absolute',
            background: 'linear-gradient(180deg, rgba(176, 224, 230, 0.8), rgba(176, 224, 230, 0.4))',
            width: '2px',
            height: `${10 + Math.random() * 20}px`,
            filter: 'blur(1px)',
            boxShadow: '0 0 4px rgba(176, 224, 230, 0.5)',
          }}
          initial={{
            left: `${Math.random() * 100}%`,
            top: -20,
            opacity: 0.8,
          }}
          animate={{
            y: ['0%', '800%'],
            opacity: [0.8, 0.3],
          }}
          transition={{
            duration: 0.8 + Math.random() * 0.5,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'linear',
          }}
        />
      ))}
    </motion.div>

    {/* Lightning effect */}
    <motion.div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 11,
        background: 'rgba(255, 255, 255, 0)',
      }}
      animate={{
        background: [
          'rgba(255, 255, 255, 0)',
          'rgba(255, 255, 255, 0.1)',
          'rgba(255, 255, 255, 0)',
        ],
      }}
      transition={{
        duration: 0.2,
        repeat: Infinity,
        repeatDelay: Math.random() * 5 + 3,
        ease: 'easeInOut',
      }}
    />
  </>
);

// Enhanced BurningBorder with more realistic flames
const BurningBorder = () => (
  <motion.div
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      border: '2px solid transparent',
      borderRadius: 'inherit',
      background: 'linear-gradient(45deg, rgba(255, 77, 0, 0.4), rgba(255, 215, 0, 0.4)) border-box',
      WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
      WebkitMaskComposite: 'destination-out',
      maskComposite: 'exclude',
      boxShadow: 'inset 0 0 10px rgba(255, 77, 0, 0.3)',
      zIndex: 1,
    }}
    animate={{
      opacity: [0.6, 1, 0.6],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  />
);

// Add this helper function
const hasWinStreak = (player: PlayerData) => {
  if (!player.recentMatches || player.recentMatches.length < 3) return false;
  
  const recentMatches = player.recentMatches.slice(0, 3);
  return recentMatches.every(match => {
    const participant = match.info.participants.find(p => p.puuid === player.summoner.puuid);
    return participant?.win;
  });
};

const StatusLabel = ({ type }: { type: 'fire' | 'tilt' }) => (
  <motion.div
    style={{
      position: 'absolute',
      top: -12,
      right: 20,
      background: type === 'fire' 
        ? 'linear-gradient(45deg, #ff4d00, #ffd700)'
        : 'linear-gradient(45deg, #2c3e50, #3498db)',
      padding: '4px 12px',
      borderRadius: '12px',
      boxShadow: `0 2px 10px ${type === 'fire' ? 'rgba(255, 77, 0, 0.3)' : 'rgba(44, 62, 80, 0.3)'}`,
      zIndex: 20,
    }}
    animate={{
      y: [0, -2, 0],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    }}
  >
    <Text 
      size="xs" 
      fw={700}
      c="white" 
      style={{ 
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        letterSpacing: '0.5px'
      }}
    >
      {type === 'fire' ? '🔥 ON FIRE' : '💧 BRUCH'}
    </Text>
  </motion.div>
);

// Update this helper function
const getReadableGameMode = (gameMode: string, queueId: number): string => {
  if (gameMode === 'CLASSIC') {
    switch (queueId) {
      case 420:
        return 'Ranked Solo/Duo';
      case 440:
        return 'Ranked Flex';
      case 400:
        return 'Normal Draft';
      case 430:
        return 'Normal Blind';
      default:
        return 'Normal';
    }
  }
  
  switch (gameMode) {
    case 'ARAM':
      return 'ARAM';
    case 'URF':
      return 'URF';
    case 'PRACTICETOOL':
      return 'Practice';
    case 'TUTORIAL':
      return 'Tutorial';
    default:
      return gameMode;
  }
};

// Add these new types
type TrendData = {
  wins: number;
  losses: number;
  streak: number;
  isWinStreak: boolean;
  kdaTrend: number[];
  averageKDA: number;
};

// Enhanced TrendIndicator component
const TrendIndicator = ({ matches, puuid }: { matches: any[], puuid: string }) => {
  const trendData = useMemo((): TrendData => {
    if (!matches || matches.length === 0) {
      return {
        wins: 0,
        losses: 0,
        streak: 0,
        isWinStreak: false,
        kdaTrend: [],
        averageKDA: 0
      };
    }

    const recentMatches = matches.slice(0, ANALYSIS_MATCH_COUNT);
    let currentStreak = 0;
    let isWinStreak = false;
    const kdaTrend: number[] = [];
    let totalKDA = 0;
    const data = recentMatches.reduce((acc, match, index) => {
      const participant = match.info.participants.find((p: { puuid: string }) => p.puuid === puuid);
      if (!participant) return acc;

      // Calculate KDA
      const kda = ((participant.kills + participant.assists) / Math.max(1, participant.deaths));
      kdaTrend.push(Number(kda.toFixed(2)));
      totalKDA += kda;

      // Track wins/losses
      if (participant.win) {
        acc.wins++;
        if (index === 0 || isWinStreak) {
          currentStreak++;
          isWinStreak = true;
        }
      } else {
        acc.losses++;
        if (index === 0 || !isWinStreak) {
          currentStreak++;
          isWinStreak = false;
        }
      }

      return acc;
    }, { wins: 0, losses: 0 });

    return {
      ...data,
      streak: currentStreak,
      isWinStreak,
      kdaTrend,
      averageKDA: totalKDA / recentMatches.length
    };
  }, [matches, puuid]);

  if (!matches || matches.length === 0) return null;

  return (
    <Paper mt="xs" p="xs" radius="md" style={CARD_STYLES}>
      <Stack>
        <Group>
          <Text size="xs" fw={500}>Aktuelle Leistung</Text>
          <Badge 
            variant="light" 
            color={trendData.wins > trendData.losses ? 'teal' : 'red'}
          >
            {trendData.wins}S {trendData.losses}N
          </Badge>
        </Group>

        {/* Streak Indicator */}
        {trendData.streak > 1 && (
          <Group>
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Badge 
                variant="filled" 
                color={trendData.isWinStreak ? 'teal' : 'red'}
                leftSection={trendData.isWinStreak ? '🔥' : '❄️'}
              >
                {trendData.streak} {trendData.isWinStreak ? 'Siege' : 'Niederlagen'} in Folge
              </Badge>
            </motion.div>
          </Group>
        )}
        {/* KDA Trend */}
        <Group>
          <Text size="xs" c="dimmed">KDA Verlauf:</Text>
          {trendData.kdaTrend.map((kda, index) => (
            <Tooltip 
              key={index} 
              label={`Spiel ${index + 1}: ${kda.toFixed(2)} KDA`}
            >
              <Text 
                size="xs" 
                fw={500}
                c={kda >= 3 ? 'teal' : kda >= 2 ? 'yellow' : 'red'}
              >
                {kda.toFixed(1)}
              </Text>
            </Tooltip>
          ))}
          <Tooltip label="Durchschnittliche KDA">
            <Badge variant="dot" color={trendData.averageKDA >= 3 ? 'teal' : 'gray'}>
              {trendData.averageKDA.toFixed(2)}
            </Badge>
          </Tooltip>
        </Group>

        {/* Optional: Add performance summary */}
        <Text size="xs" c="dimmed" style={{ fontStyle: 'italic' }}>
          {trendData.averageKDA >= 3 
            ? 'Hervorragende Leistung' 
            : trendData.averageKDA >= 2 
            ? 'Solide Leistung' 
            : 'Verbesserungspotenzial'}
        </Text>
      </Stack>
    </Paper>
  );
};

const TiltMeter = ({ matches, puuid }: { matches: any[], puuid: string }) => {
  const tiltLevel = useMemo(() => {
    let tiltScore = 0;
    matches?.slice(0, ANALYSIS_MATCH_COUNT).forEach((match, index) => {
      const participant = match.info.participants.find((p: { puuid: string }) => p.puuid === puuid);
      if (!participant) return;

      // Factors that increase tilt
      if (!participant.win) tiltScore += 2;
      if (participant.deaths > 8) tiltScore += 1;
      if (participant.deaths > participant.kills * 2) tiltScore += 1;
    });

    return {
      level: tiltScore,
      icon: tiltScore < 3 ? '😊' : tiltScore < 6 ? '😐' : tiltScore < 9 ? '😤' : '🤬',
      label: tiltScore < 3 ? 'Entspannt' : tiltScore < 6 ? 'Normal' : tiltScore < 9 ? 'Leicht getiltet' : 'Hochgetiltet'
    };
  }, [matches, puuid]);

  return (
    <Tooltip label={tiltLevel.label}>
      <Badge 
        size="sm" 
        variant="light"
        color={tiltLevel.level < 6 ? 'green' : tiltLevel.level < 9 ? 'yellow' : 'red'}
      >
        {tiltLevel.icon} {tiltLevel.level}/12
      </Badge>
    </Tooltip>
  );
};

const AramGamerBadge = ({ matches }: { matches: any[] }) => {
  const stats = useMemo(() => {
    if (!matches?.length) return null;

    // Count games by mode
    const gameModes = matches.reduce((acc, match) => {
      const mode = match.info.gameMode;
      acc[mode] = (acc[mode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate ARAM percentage
    const aramGames = gameModes['ARAM'] || 0;
    const totalGames = matches.length;
    const aramPercentage = (aramGames / totalGames) * 100;

    // Define badge properties based on ARAM percentage
    if (aramPercentage >= 50) {
      return {
        isAramGamer: true,
        percentage: aramPercentage,
        level: aramPercentage >= 80 ? 'ARAM Lord' : 
               aramPercentage >= 65 ? 'ARAM Enthusiast' : 
               'ARAM Fan',
        icon: aramPercentage >= 80 ? '👑' : 
              aramPercentage >= 65 ? '⭐' : 
              '🌟',
        color: aramPercentage >= 80 ? 'gradient' : 'light',
        gradient: { from: 'gold', to: 'yellow' }
      };
    }

    return null;
  }, [matches]);

  if (!stats?.isAramGamer) return null;

  return (
    <Tooltip 
      label={`${stats.percentage.toFixed(0)}% ARAM Spiele`}
      position="top"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20
        }}
      >
        <Badge 
          variant={stats.color}
          gradient={stats.color === 'gradient' ? stats.gradient : undefined}
          size="sm"
          style={{
            cursor: 'help',
            ...(stats.color === 'gradient' && {
              border: '1px solid rgba(255,215,0,0.3)',
              boxShadow: '0 0 10px rgba(255,215,0,0.2)'
            })
          }}
        >
          {stats.icon} {stats.level}
        </Badge>
      </motion.div>
    </Tooltip>
  );
};

export function PlayerList({ players, onReload, onInitNewPlayers, onReloadPlayer, isLoading }: PlayerListProps) {
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('rank');

  const [lastUpdated] = useState<Date>(new Date());

  const [refreshingPlayers, setRefreshingPlayers] = useState<Set<string>>(new Set());

  const handlePlayerRefresh = async (name: string) => {
    setRefreshingPlayers(prev => new Set(prev).add(name));
    await onReloadPlayer(name);
    setRefreshingPlayers(prev => {
      const next = new Set(prev);
      next.delete(name);
      return next;
    });
  };

  // Calculate player stats
  const playerStats = useMemo(() => {
    const stats: { [key: string]: { kills: number; deaths: number; assists: number } } = {};
    
    players?.forEach(player => {
      if (!player.recentMatches) return;
      
      const playerMatches = player.recentMatches.slice(0, 20); // Last 20 matches
      const totalStats = playerMatches.reduce((acc, match) => {
        const participant = match.info.participants.find(
          p => p.puuid === player.summoner.puuid
        );
        if (!participant) return acc;
        
        return {
          kills: acc.kills + (participant.kills || 0),
          deaths: acc.deaths + (participant.deaths || 0),
          assists: acc.assists + (participant.assists || 0)
        };
      }, { kills: 0, deaths: 0, assists: 0 });

      stats[player.summoner.puuid] = totalStats;
    });

    return stats;
  }, [players]);

  // Sort players based on selected option
  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    
    return [...players].sort((a, b) => {
      switch (sortBy) {
        case 'rank':
          return getSoloQueueRank(b) - getSoloQueueRank(a);
        
        case 'winrate':
          return getRecentWinrate(b) - getRecentWinrate(a);
        
        case 'level':
          return (b.summoner?.summonerLevel || 0) - (a.summoner?.summonerLevel || 0);
        
        default:
          return 0;
      }
    });
  }, [players, sortBy]);

  // Calculate and format the match duration
  const getFormattedDuration = (match: any) => {
    if (!match?.info?.gameDuration) return '0:00';
    const matchDuration = match.info.gameDuration; // Duration in seconds
    return `${Math.floor(matchDuration / 60)}:${(matchDuration % 60).toString().padStart(2, '0')}`; // Format as MM:SS
  };

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

  const router = useRouter();

  return (
    <>
      <Group mb="xl" justify="space-between">
        <Group>
          <Button
            variant="light"
            leftSection={<IconNotes size={20} />}
            onClick={() => router.push('/stats')}
          >
            League Stats
          </Button>
          <Button
            variant="light"
            leftSection={<IconMedal size={20} />}
            onClick={() => router.push('/list')}
          >
            Bestenliste
          </Button>
          <DigitalClock />
          <EnvironmentStats />
        </Group>

        <Group>
          <Button
            variant="light"
            leftSection={<IconRefresh size={20} />}
            onClick={onInitNewPlayers}
            loading={isLoading}
          >
            Spieler laden
          </Button>
          <Button
            variant="filled"
            leftSection={<IconRefresh size={20} />}
            onClick={onReload}
            loading={isLoading}
          >
            Alle aktualisieren
          </Button>
        </Group>
      </Group>
      <Paper p="md" radius="md" mb="lg" style={CARD_STYLES}>
        <Group justify="space-between">
          <Group>
            <Text size="lg" fw={600} c="dimmed">Geladene Spieler</Text>
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
              Zuletzt aktualisiert: {formatLastUpdated(lastUpdated)}
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
        {sortedPlayers.filter(player => player && player.summoner).map((player, index) => {
          const showRain = shouldShowAlert(player) || checkBadKDA(player);
          const showFire = hasWinStreak(player);
          
          return (
            <Paper
              key={`player-${player.summoner.name}-${index}`}
              radius="md"
              p="md"
              style={{
                ...INTERACTIVE_CARD_STYLES,
                position: 'relative',
                overflow: 'visible',
                boxShadow: showFire 
                  ? '0 0 25px rgba(255, 77, 0, 0.3), inset 0 0 25px rgba(255, 215, 0, 0.15)'
                  : showRain
                  ? '0 0 20px rgba(176, 224, 230, 0.3), inset 0 0 20px rgba(176, 224, 230, 0.15)'
                  : undefined,
                transition: 'box-shadow 0.3s ease',
              }}
            >
              {showFire && <StatusLabel type="fire" />}
              {showRain && <StatusLabel type="tilt" />}
              {showRain && <RainEffect />}
              {showFire && <BurningBorder />}
              <Group wrap="nowrap" mb="xs">
                <Avatar
                  size={48}
                  src={`https://ddragon.leagueoflegends.com/cdn/14.22.1/img/profileicon/${player.summoner.profileIconId}.png`}
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
                              ? 'linear-gradient(to right, #95604c, #6e4b3c)'
                              : queue.tier === 'SILVER'
                              ? 'linear-gradient(to right, #a1b5c7, #7b8792)'
                              : queue.tier === 'GOLD'
                              ? 'linear-gradient(to right, #f1c859, #c89b3c)'
                              : queue.tier === 'PLATINUM'
                              ? 'linear-gradient(to right, #00a0b0, #008891)'
                              : queue.tier === 'EMERALD'
                              ? 'linear-gradient(to right, #16a75c, #0d7740)'
                              : queue.tier === 'DIAMOND'
                              ? '#1f42b5' // Simplified to solid color for better iOS compatibility
                              : queue.tier === 'MASTER'
                              ? 'linear-gradient(to right, #9d48e0, #6925af)'
                              : queue.tier === 'GRANDMASTER'
                              ? 'linear-gradient(to right, #e0484e, #a91419)'
                              : queue.tier === 'CHALLENGER'
                              ? 'linear-gradient(to right, #39b7ff, #0d6fb8)'
                              : undefined,
                            border: queue.tier === 'IRON' ? '1px solid #724b28' : undefined,
                            color: '#fff',
                            textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                            padding: '4px 8px',
                            fontWeight: 600,
                            letterSpacing: '0.5px',
                            WebkitBackfaceVisibility: 'hidden', // Add this for better iOS rendering
                            WebkitTransform: 'translateZ(0)', // Add this for better iOS rendering
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
                  getFormattedDuration={getFormattedDuration}
                />
              )}

              <StatusIndicator 
                lastGameTime={getLastGameTime(player)} 
                lastGameDuration={player.recentMatches ? getFormattedDuration(player.recentMatches[0]) : undefined}
              />
              
              {/* Add a Group for stats */}
              <Group mt="xs" gap="xs">
                <TiltMeter 
                  matches={player.recentMatches || []} 
                  puuid={player.summoner.puuid}
                />
                <AramGamerBadge matches={player.recentMatches || []} />
              </Group>

              <TrendIndicator 
                matches={player.recentMatches || []} 
                puuid={player.summoner.puuid}
              />
            </Paper>
          );
        })}
      </SimpleGrid>

     
    </>
  );
}



function getWinRateColor(winRate: number): string {
  if (winRate >= 55) return '#4CAF50';
  if (winRate >= 50) return '#2196F3';
  return '#f44336';
} 