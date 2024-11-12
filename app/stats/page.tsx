'use client';
/* eslint-disable */


import { Container, AppShell, Title, Text, Box, Group, Paper, SimpleGrid, Progress, Button } from '@mantine/core';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import playersData from '@/data/players.json';
import summonerTags from '@/data/summoner-tags.json';
import { CARD_STYLES } from '@/components/PlayerList';
import { IconTrophy, IconClock, IconSword, IconSkull, IconHandStop, IconArrowLeft } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

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

export default function StatistikSeite() {
  const router = useRouter();
  const [statistiken, setStatistiken] = useState<GlobaleStatistiken | null>(null);

  useEffect(() => {
    calculateStats();
  }, []);

  const calculateStats = () => {
    const playerStats: SpielerMatchStatistiken[] = [];
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
        spielerName: playerName,
        gespielteSpielen: matches.length,
        siege: wins,
        niederlagen: matches.length - wins,
        kills,
        tode: deaths,
        assists,
        durchschnittlicheSpielzeit: gameTime / matches.length,
        meistGespielterChampion: {
          name: mostPlayed[0],
          spiele: mostPlayed[1].games,
          siegesRate: (mostPlayed[1].wins / mostPlayed[1].games) * 100,
        },
        aramSpiele: aramGames,
        gesamtPings: totalPings,
        siegesSerie: maxWinStreak,
        niederlagenSerie: maxLoseStreak,
      });

      totalGamesAll += matches.length;
      totalGameTime += gameTime;
    });

    // Sort champion data
    const sortedChampions = Object.values(championData)
      .sort((a, b) => b.games - a.games)
      .slice(0, 10)
      .map(champ => ({
        name: champ.name,
        spiele: champ.games,
        siege: champ.wins,
        kills: champ.kills,
        tode: champ.deaths,
        assists: champ.assists
      }));

    // Find global stats
    const mostActive = playerStats.reduce((prev, current) => 
      prev.gespielteSpielen > current.gespielteSpielen ? prev : current
    );

    const highestWinrate = playerStats.reduce((prev, current) => 
      (current.gespielteSpielen >= 10 && (current.siege / current.gespielteSpielen) > (prev.siege / prev.gespielteSpielen)) 
        ? current 
        : prev
    );

    const bestKDA = playerStats.reduce((prev, current) => {
      const prevKDA = (prev.kills + prev.assists) / Math.max(prev.tode, 1);
      const currentKDA = (current.kills + current.assists) / Math.max(current.tode, 1);
      return currentKDA > prevKDA ? current : prev;
    });

    setStatistiken({
      gesamtSpiele: totalGamesAll,
      durchschnittlicheSpielzeit: totalGameTime / totalGamesAll,
      aktivsterSpieler: {
        name: mostActive.spielerName,
        spiele: mostActive.gespielteSpielen,
      },
      höchsteSiegRate: {
        name: highestWinrate.spielerName,
        siegRate: (highestWinrate.siege / highestWinrate.gespielteSpielen) * 100,
        spiele: highestWinrate.gespielteSpielen,
      },
      meistePings: {
        name: playerStats.reduce((prev, current) => 
          current.gesamtPings > prev.gesamtPings ? current : prev
        ).spielerName,
        pings: Math.max(...playerStats.map(p => p.gesamtPings)),
      },
      besteKDA: {
        name: bestKDA.spielerName,
        kda: (bestKDA.kills + bestKDA.assists) / Math.max(bestKDA.tode, 1),
      },
      längsteSiegesserie: {
        name: playerStats.reduce((prev, current) => 
          current.siegesSerie > prev.siegesSerie ? current : prev
        ).spielerName,
        serie: Math.max(...playerStats.map(p => p.siegesSerie)),
      },
      längsteNiederlagenserie: {
        name: playerStats.reduce((prev, current) => 
          current.niederlagenSerie > prev.niederlagenSerie ? current : prev
        ).spielerName,
        serie: Math.max(...playerStats.map(p => p.niederlagenSerie)),
      },
      spielerStatistiken: playerStats,
      championStatistiken: sortedChampions,
    });
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
    <Paper p="md" radius="md" style={CARD_STYLES}>
      <Group align="center" mb={8}>
        {icon}
        <Text size="lg" fw={700}>{titel}</Text>
      </Group>
      <Text size="xl" fw={900} variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
        {wert}
      </Text>
      {beschreibung && (
        <Text size="sm" c="dimmed" mt={4}>{beschreibung}</Text>
      )}
    </Paper>
  );

  const SpielerStatistikKarte = ({ spieler }: { spieler: SpielerMatchStatistiken }) => (
    <Paper p="md" radius="md" style={CARD_STYLES}>
      <Group align="center" mb="md">
        <Image
          src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${
            playersData.players[spieler.spielerName.split('#')[0] as keyof typeof playersData.players]?.profileIconId || '1'
          }.png`}
          alt={spieler.spielerName}
          width={48}
          height={48}
          style={{ borderRadius: '50%' }}
          onError={(e) => {
            // Fallback to default icon
            (e.target as HTMLImageElement).src = DEFAULT_ICON;
          }}
        />
        <Box>
          <Text size="lg" fw={700}>{spieler.spielerName.split('#')[0]}</Text>
          <Group gap={6}>
            <Text size="sm" c="dimmed">Spiele: {spieler.gespielteSpielen}</Text>
            <Text size="sm" c={`${getSiegRateColor(spieler.siege / spieler.gespielteSpielen * 100)}.6`}>
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
            playersData.players[spielerName.split('#')[0] as keyof typeof playersData.players]?.profileIconId || '1'
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

          {statistiken && (
            <>
              {/* Global Stats */}
              <Title order={2} size="h3" mb="md" c="dimmed">Globale Statistiken</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg" mb="xl">
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
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg" mb="xl">
                {statistiken.spielerStatistiken.map((spieler) => (
                  <SpielerStatistikKarte key={spieler.spielerName} spieler={spieler} />
                ))}
              </SimpleGrid>

              {/* Champion Stats */}
              <Title order={2} size="h3" mb="md" c="dimmed">Meist gespielte Champions</Title>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 5 }} spacing="lg">
                {statistiken.championStatistiken.map((champion) => (
                  <ChampionStatistikKarte key={champion.name} champion={champion} />
                ))}
              </SimpleGrid>
            </>
          )}
        </Container>
      </AppShell>
    </motion.div>
  );
} 