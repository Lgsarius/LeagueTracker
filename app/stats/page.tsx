'use client';
/* eslint-disable */


import { Container, AppShell, Title, Text, Box, Group, Paper, SimpleGrid, Progress } from '@mantine/core';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import playersData from '@/data/players.json';
import summonerTags from '@/data/summoner-tags.json';
import { CARD_STYLES } from '@/components/PlayerList';
import { IconTrophy, IconClock, IconSword, IconSkull, IconHandStop } from '@tabler/icons-react';

interface PlayerMatchStats {
  playerName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
  averageGameTime: number;
  mostPlayedChampion: {
    name: string;
    games: number;
    winRate: number;
  };
  aramGames: number;
  totalPings: number;
  winStreak: number;
  loseStreak: number;
}

interface GlobalStats {
  totalGames: number;
  averageGameTime: number;
  mostActivePlayer: {
    name: string;
    games: number;
  };
  highestWinrate: {
    name: string;
    winrate: number;
    games: number;
  };
  mostPings: {
    name: string;
    pings: number;
  };
  bestKDA: {
    name: string;
    kda: number;
  };
  longestWinStreak: {
    name: string;
    streak: number;
  };
  longestLoseStreak: {
    name: string;
    streak: number;
  };
  playerStats: PlayerMatchStats[];
  championStats: {
    name: string;
    games: number;
    wins: number;
    kills: number;
    deaths: number;
    assists: number;
  }[];
}

// Helper function for win rate colors (using Mantine color strings)
const getWinRateColor = (winRate: number): string => {
  if (winRate >= 65) return 'yellow';    // Exceptional
  if (winRate >= 55) return 'teal';      // Very Good
  if (winRate >= 50) return 'blue';      // Good
  if (winRate >= 45) return 'orange';    // Fair
  return 'red';                          // Poor
};

// Add these constants at the top of your file
const DDRAGON_VERSION = '14.22.1'; // Update this to the latest version
const DEFAULT_ICON = '/LOGO.png'; // Your default logo as fallback

// Alternative URL for champion icons
const getChampionIconUrl = (championName: string) => {
  // Try Community Dragon if Data Dragon fails
  return `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/${championName.toLowerCase()}.png`;
};

export default function StatsPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);

  useEffect(() => {
    calculateStats();
  }, []);

  const calculateStats = () => {
    const playerStats: PlayerMatchStats[] = [];
    let totalGamesAll = 0;
    let totalGameTime = 0;
    const championData: { [key: string]: { name: string; games: number; wins: number; kills: number; deaths: number; assists: number; } } = {};
    // Process each player's data
    //ignore the _ key
    Object.entries(playersData.players).forEach(([_, playerData]) => {
      if (!playerData.recentMatches) return;

      const matches = playerData.recentMatches;
      const playerName = `${playerData.gameName}#${playerData.tagLine}`;
      
      let wins = 0;
      let kills = 0;
      let deaths = 0;
      let assists = 0;
      let aramGames = 0;
      let totalPings = 0;
      let maxWinStreak = 0;
      let maxLoseStreak = 0;
      let currentWinStreak = 0;
      let currentLoseStreak = 0;
      let gameTime = 0;

      // Track champion stats for this player
      const champStats: { [key: string]: { games: number; wins: number; } } = {};

      matches.forEach((match) => {
        const participant = match.info.participants.find(
          p => p.puuid === playerData.puuid
        );
        if (!participant) return;

        gameTime += match.info.gameDuration;

        // Update champion stats
        if (!champStats[participant.championName]) {
          champStats[participant.championName] = {
            games: 0,
            wins: 0,
          };
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
        } else {
          currentLoseStreak++;
          currentWinStreak = 0;
          maxLoseStreak = Math.max(maxLoseStreak, currentLoseStreak);
        }

        if (match.info.gameMode === 'ARAM') aramGames++;
        if (participant.win) wins++;
        kills += participant.kills;
        deaths += participant.deaths;
        assists += participant.assists;

        // Sum all ping types
        if (participant.pings) {
          totalPings += Object.values(participant.pings).reduce((sum, count) => sum + count, 0);
        }
      });

      // Find most played champion
      const mostPlayed = Object.entries(champStats)
        .sort(([, a], [, b]) => b.games - a.games)[0];

      playerStats.push({
        playerName,
        gamesPlayed: matches.length,
        wins,
        losses: matches.length - wins,
        kills,
        deaths,
        assists,
        averageGameTime: gameTime / matches.length,
        mostPlayedChampion: {
          name: mostPlayed[0],
          games: mostPlayed[1].games,
          winRate: (mostPlayed[1].wins / mostPlayed[1].games) * 100,
        },
        aramGames,
        totalPings,
        winStreak: maxWinStreak,
        loseStreak: maxLoseStreak,
      });

      totalGamesAll += matches.length;
      totalGameTime += gameTime;
    });

    // Sort champion data
    const sortedChampions = Object.values(championData)
      .sort((a, b) => b.games - a.games)
      .slice(0, 10);

    // Find global stats
    const mostActive = playerStats.reduce((prev, current) => 
      prev.gamesPlayed > current.gamesPlayed ? prev : current
    );

    const highestWinrate = playerStats.reduce((prev, current) => 
      (current.gamesPlayed >= 10 && (current.wins / current.gamesPlayed) > (prev.wins / prev.gamesPlayed)) 
        ? current 
        : prev
    );

    const bestKDA = playerStats.reduce((prev, current) => {
      const prevKDA = (prev.kills + prev.assists) / Math.max(prev.deaths, 1);
      const currentKDA = (current.kills + current.assists) / Math.max(current.deaths, 1);
      return currentKDA > prevKDA ? current : prev;
    });

    setStats({
      totalGames: totalGamesAll,
      averageGameTime: totalGameTime / totalGamesAll,
      mostActivePlayer: {
        name: mostActive.playerName,
        games: mostActive.gamesPlayed,
      },
      highestWinrate: {
        name: highestWinrate.playerName,
        winrate: (highestWinrate.wins / highestWinrate.gamesPlayed) * 100,
        games: highestWinrate.gamesPlayed,
      },
      mostPings: {
        name: playerStats.reduce((prev, current) => 
          current.totalPings > prev.totalPings ? current : prev
        ).playerName,
        pings: Math.max(...playerStats.map(p => p.totalPings)),
      },
      bestKDA: {
        name: bestKDA.playerName,
        kda: (bestKDA.kills + bestKDA.assists) / Math.max(bestKDA.deaths, 1),
      },
      longestWinStreak: {
        name: playerStats.reduce((prev, current) => 
          current.winStreak > prev.winStreak ? current : prev
        ).playerName,
        streak: Math.max(...playerStats.map(p => p.winStreak)),
      },
      longestLoseStreak: {
        name: playerStats.reduce((prev, current) => 
          current.loseStreak > prev.loseStreak ? current : prev
        ).playerName,
        streak: Math.max(...playerStats.map(p => p.loseStreak)),
      },
      playerStats,
      championStats: sortedChampions,
    });
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon 
  }: { 
    title: string; 
    value: string | number; 
    description?: string;
    icon?: React.ReactNode;
  }) => (
    <Paper p="md" radius="md" style={CARD_STYLES}>
      <Group align="center" mb={8}>
        {icon}
        <Text size="lg" fw={700}>{title}</Text>
      </Group>
      <Text size="xl" fw={900} variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
        {value}
      </Text>
      {description && (
        <Text size="sm" c="dimmed" mt={4}>{description}</Text>
      )}
    </Paper>
  );

  const PlayerStatCard = ({ player }: { player: PlayerMatchStats }) => (
    <Paper p="md" radius="md" style={CARD_STYLES}>
      <Group align="center" mb="md">
        <Image
          src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${
            playersData.players[player.playerName.split('#')[0] as keyof typeof playersData.players]?.profileIconId || '1'
          }.png`}
          alt={player.playerName}
          width={48}
          height={48}
          style={{ borderRadius: '50%' }}
          onError={(e) => {
            // Fallback to default icon
            (e.target as HTMLImageElement).src = DEFAULT_ICON;
          }}
        />
        <Box>
          <Text size="lg" fw={700}>{player.playerName.split('#')[0]}</Text>
          <Group gap={6}>
            <Text size="sm" c="dimmed">Games: {player.gamesPlayed}</Text>
            <Text size="sm" c={`${getWinRateColor(player.wins / player.gamesPlayed * 100)}.6`}>
              {((player.wins / player.gamesPlayed) * 100).toFixed(1)}% WR
            </Text>
          </Group>
        </Box>
      </Group>
      <Progress.Root size="xl" mb="md">
        <Progress.Section 
          value={(player.wins / player.gamesPlayed) * 100}
          color="teal"
        >
          <Progress.Label>Wins: {player.wins}</Progress.Label>
        </Progress.Section>
        <Progress.Section
          value={(player.losses / player.gamesPlayed) * 100}
          color="red"
        >
          <Progress.Label>Losses: {player.losses}</Progress.Label>
        </Progress.Section>
      </Progress.Root>
      <Group grow>
        <Box>
          <Text size="sm" c="dimmed">KDA</Text>
          <Group gap={4}>
            <Group gap={2} wrap="nowrap">
              <IconSword size={14} style={{ color: '#2dd4bf' }} />
              <Text size="sm" fw={500} c="teal.4">{player.kills}</Text>
            </Group>
            <Group gap={2} wrap="nowrap">
              <IconSkull size={14} style={{ color: '#f87171' }} />
              <Text size="sm" fw={500} c="red.4">{player.deaths}</Text>
            </Group>
            <Group gap={2} wrap="nowrap">
              <IconHandStop size={14} style={{ color: '#60a5fa' }} />
              <Text size="sm" fw={500} c="blue.4">{player.assists}</Text>
            </Group>
          </Group>
        </Box>
        <Box>
          <Text size="sm" c="dimmed">Most Played</Text>
          <Group gap={4}>
            <Image
              src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${player.mostPlayedChampion.name}.png`}
              alt={player.mostPlayedChampion.name}
              width={24}
              height={24}
              style={{ borderRadius: '4px' }}
              onError={(e) => {
                // Fallback to default icon
                (e.target as HTMLImageElement).src = DEFAULT_ICON;
              }}
            />
            <Text size="sm" fw={500}>
              {player.mostPlayedChampion.name}
            </Text>
          </Group>
        </Box>
      </Group>
    </Paper>
  );

  const ChampionStatCard = ({ champion }: { champion: GlobalStats['championStats'][0] }) => (
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
          <Text size="sm" c="dimmed">{champion.games} games played</Text>
        </Box>
      </Group>
      <SimpleGrid cols={2} spacing="xs">
        <Paper p="xs" radius="sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
          <Text size="sm" c="dimmed">Win Rate</Text>
          <Text size="lg" fw={500} c={`${getWinRateColor(champion.wins / champion.games * 100)}.6`}>
            {((champion.wins / champion.games) * 100).toFixed(1)}%
          </Text>
        </Paper>
        <Paper p="xs" radius="sm" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
          <Text size="sm" c="dimmed">KDA</Text>
          <Group gap={4}>
            <Group gap={2} wrap="nowrap">
              <IconSword size={14} style={{ color: '#2dd4bf' }} />
              <Text size="sm" fw={500} c="teal.4">{(champion.kills / champion.games).toFixed(1)}</Text>
            </Group>
            <Text fw={500}>/</Text>
            <Group gap={2} wrap="nowrap">
              <IconSkull size={14} style={{ color: '#f87171' }} />
              <Text size="sm" fw={500} c="red.4">{(champion.deaths / champion.games).toFixed(1)}</Text>
            </Group>
            <Text fw={500}>/</Text>
            <Group gap={2} wrap="nowrap">
              <IconHandStop size={14} style={{ color: '#60a5fa' }} />
              <Text size="sm" fw={500} c="blue.4">{(champion.assists / champion.games).toFixed(1)}</Text>
            </Group>
          </Group>
        </Paper>
      </SimpleGrid>
    </Paper>
  );

  const AchievementCard = ({ 
    title, 
    value, 
    playerName, 
    icon,
    description 
  }: { 
    title: string;
    value: string | number;
    playerName: string;
    icon: React.ReactNode;
    description?: string;
  }) => (
    <Paper p="md" radius="md" style={CARD_STYLES}>
      <Group align="center" mb={8}>
        {icon}
        <Text size="lg" fw={700}>{title}</Text>
      </Group>
      <Group align="center" mb={8}>
        <Image
          src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${
            playersData.players[playerName.split('#')[0] as keyof typeof playersData.players]?.profileIconId || '1'
          }.png`}
          alt={playerName}
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
            {value}
          </Text>
          <Text size="sm" c="dimmed">{playerName.split('#')[0]}</Text>
        </Box>
      </Group>
      {description && (
        <Text size="sm" c="dimmed" mt={4}>{description}</Text>
      )}
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
                    size={48}
                    fw={900}
                    variant="gradient"
                  >
                    LostGames Statistics
                  </Title>
                  <Text c="dimmed" mt="md" size="xl" maw={600}>
                    Detailed statistics for all LostGames players
                  </Text>
                </Box>
              </Group>
            </Group>
          </Paper>

          {stats && (
            <>
              {/* Global Stats */}
              <Title order={2} size="h3" mb="md" c="dimmed">Global Statistics</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg" mb="xl">
                <StatCard
                  title="Total Games"
                  value={stats.totalGames}
                  description="Across all players"
                  icon={<IconTrophy size={24} color="var(--mantine-color-yellow-6)" />}
                />
                <StatCard
                  title="Average Game Time"
                  value={formatTime(stats.averageGameTime)}
                  description="Per match"
                  icon={<IconClock size={24} color="var(--mantine-color-blue-6)" />}
                />
                <StatCard
                  title="Most Active Player"
                  value={stats.mostActivePlayer.name.split('#')[0]}
                  description={`${stats.mostActivePlayer.games} games played`}
                  icon={<IconSword size={24} color="var(--mantine-color-green-6)" />}
                />
                <StatCard
                  title="Highest Winrate"
                  value={`${stats.highestWinrate.winrate.toFixed(1)}%`}
                  description={`${stats.highestWinrate.name.split('#')[0]} (${stats.highestWinrate.games} games)`}
                  icon={<IconTrophy size={24} color="var(--mantine-color-yellow-6)" />}
                />
              </SimpleGrid>

              {/* Achievement Cards */}
              <Title order={2} size="h3" mb="md" c="dimmed">Achievements</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg" mb="xl">
                <AchievementCard
                  title="Best KDA"
                  value={stats.bestKDA.kda.toFixed(2)}
                  playerName={stats.bestKDA.name}
                  icon={<IconSword size={24} color="var(--mantine-color-teal-6)" />}
                />
                <AchievementCard
                  title="Longest Win Streak"
                  value={stats.longestWinStreak.streak}
                  playerName={stats.longestWinStreak.name}
                  icon={<IconTrophy size={24} color="var(--mantine-color-green-6)" />}
                />
                <AchievementCard
                  title="Most Pings"
                  value={stats.mostPings.pings.toLocaleString()}
                  playerName={stats.mostPings.name}
                  icon={<IconHandStop size={24} color="var(--mantine-color-blue-6)" />}
                />
              </SimpleGrid>

              {/* Player Stats */}
              <Title order={2} size="h3" mb="md" c="dimmed">Player Statistics</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg" mb="xl">
                {stats.playerStats.map((player) => (
                  <PlayerStatCard key={player.playerName} player={player} />
                ))}
              </SimpleGrid>

              {/* Champion Stats */}
              <Title order={2} size="h3" mb="md" c="dimmed">Most Played Champions</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="lg">
                {stats.championStats.map((champion) => (
                  <ChampionStatCard key={champion.name} champion={champion} />
                ))}
              </SimpleGrid>
            </>
          )}
        </Container>
      </AppShell>
    </motion.div>
  );
} 