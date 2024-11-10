'use client';
/* eslint-disable */

import { useEffect, useState, useMemo } from 'react';
import { 
  AppShell,
  Container, 
  Paper, 
  Title, 
  Text, 
  Group, 
  Avatar, 
  Badge, 
  Button,
  Tooltip,
} from '@mantine/core';
import { 
  IconRefresh, 
  IconChevronUp, 
  IconChevronDown,
  IconClock,
  IconArrowLeft,
} from '@tabler/icons-react';
import { PlayerData } from '@/types/player';
import { CARD_STYLES } from '@/components/PlayerList';
import clsx from 'clsx';
import Link from 'next/link';



// Column header with sort icons
const SortHeader = ({ 
  label, 
  field, 
  sortField, 
  sortDirection, 
  onSort,
  style 
}: { 
  label: string;
  field: string;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  style?: React.CSSProperties;
}) => (
  <th 
    className={clsx(
      "p-4 text-sm font-semibold cursor-pointer transition-colors",
      "hover:bg-gray-800/50"
    )}
    onClick={() => onSort(field)}
    style={style}
  >
    <Group gap={4} justify="space-between" wrap="nowrap">
      {label}
      <div className="flex flex-col -space-y-2">
        <IconChevronUp 
          size={16}
          className={clsx(
            "transition-colors",
            sortField === field && sortDirection === 'asc' 
              ? 'text-blue-400' 
              : 'text-gray-600/50'
          )}
        />
        <IconChevronDown 
          size={16}
          className={clsx(
            "transition-colors",
            sortField === field && sortDirection === 'desc' 
              ? 'text-blue-400' 
              : 'text-gray-600/50'
          )}
        />
      </div>
    </Group>
  </th>
);



// Add sorting helper functions
const getRankValue = (queue: any) => {
  if (!queue) return -1;
  
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

  return (tierValues[queue.tier] * 10000) + 
         (rankValues[queue.rank] * 100) + 
         (queue.leaguePoints || 0);
};

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    setSortDirection(sortField === field && sortDirection === 'asc' ? 'desc' : 'asc');
    setSortField(field);
  };

  const fetchPlayers = async () => {
    try {
      // First try to load from local data
      const response = await fetch('/api/players');
      if (!response.ok) throw new Error('Failed to fetch players');
      const data = await response.json();
      
      // Transform the data to match PlayerData structure
      const transformedPlayers = Object.values(data.players).map((player: any) => ({
        puuid: player.puuid,
        summoner: {
          id: player.id,
          accountId: player.accountId,
          puuid: player.puuid,
          name: `${player.gameName}#${player.tagLine}`,
          profileIconId: player.profileIconId,
          summonerLevel: player.summonerLevel,
        },
        rankedInfo: player.rankedInfo || [],
        recentMatches: player.recentMatches || [],
      }));

      setPlayers(transformedPlayers);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError(err instanceof Error ? err.message : 'Failed to load players');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    
    return [...players].sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'name':
          return multiplier * a.summoner.name.localeCompare(b.summoner.name);
        
        case 'level':
          return multiplier * (b.summoner.summonerLevel - a.summoner.summonerLevel);
        
        case 'rank': {
          const rankA = getRankValue(a.rankedInfo?.find(q => q.queueType === 'Solo/Duo'));
          const rankB = getRankValue(b.rankedInfo?.find(q => q.queueType === 'Solo/Duo'));
          return multiplier * (rankB - rankA);
        }
        
        case 'winRate': {
          const getWinRate = (player: PlayerData) => {
            const soloQueue = player.rankedInfo?.find(q => q.queueType === 'Solo/Duo');
            if (!soloQueue) return 0;
            return (soloQueue.wins / (soloQueue.wins + soloQueue.losses)) * 100;
          };
          return multiplier * (getWinRate(b) - getWinRate(a));
        }
        
        default:
          return 0;
      }
    });
  }, [players, sortField, sortDirection]);

  return (
    <AppShell bg="dark.8" style={{ minHeight: '100vh', width: '100%' }}>
      <Container 
        size="100%" 
        py="xl" 
        px={0}
        style={{ width: '100%', maxWidth: 'none' }}
      >
        {/* Add Back Button */}
        <Link href="/">
          <Button
            variant="subtle"
            color="gray"
            leftSection={<IconArrowLeft size={16} />}
            className="mb-4 ml-4"
          >
            Back to Dashboard
          </Button>
        </Link>

        {/* Hero Section */}
        <Paper
          radius={0}
          p={{ base: 'md', sm: 'xl' }}
          mb={50}
          style={{
            ...CARD_STYLES,
            width: '100%'
          }}
        >
          <Group justify="space-between" align="flex-start">
            <div>
              <Title 
                order={1}
                size={48}
                fw={900}
              >
                LostGames Rankings
              </Title>
              <Text c="dimmed" mt="md" size="xl" maw={600}>
                Lost League Rankings
              </Text>
              <Text c="dimmed.4" mt="sm" size="md">
                Aktuelle Anzahl an Accounts: {players.length}
              </Text>
            </div>
            <Button
              variant="gradient"
              gradient={{ from: 'indigo', to: 'cyan' }}
              leftSection={<IconRefresh size={16} />}
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </Group>
        </Paper>

        {/* Status Messages */}
        {error && (
          <Paper p="md" radius="md" mb={20} bg="red.9">
            <Text c="white">{error}</Text>
          </Paper>
        )}

        {/* Loading State */}
        {isLoading ? (
          <Paper p="xl" radius={0} style={CARD_STYLES} ta="center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto" />
          </Paper>
        ) : (
          <Paper 
            style={{ 
              ...CARD_STYLES,
              width: '100%'
            }} 
            radius={0} 
            p="xl"
          >
            <div className="w-full overflow-x-auto">
              <table className="w-full border-separate border-spacing-0" style={{ minWidth: '100%' }}>
                <thead>
                  <tr>
                    <SortHeader 
                      label="Player" 
                      field="name" 
                      sortField={sortField}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                      style={{ width: '40%', whiteSpace: 'nowrap' }}
                    />
                    <SortHeader 
                      label="Level"
                      field="level" 
                      sortField={sortField} 
                      sortDirection={sortDirection} 
                      onSort={handleSort}
                      style={{ width: '15%', whiteSpace: 'nowrap' }}
                    />
                    <SortHeader 
                      label="Rank" 
                      field="rank" 
                      sortField={sortField} 
                      sortDirection={sortDirection} 
                      onSort={handleSort}
                      style={{ width: '25%', whiteSpace: 'nowrap' }}
                    />
                    <SortHeader 
                      label="Win Rate" 
                      field="winRate" 
                      sortField={sortField} 
                      sortDirection={sortDirection} 
                      onSort={handleSort}
                      style={{ width: '20%', whiteSpace: 'nowrap' }}
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player, index) => {
                    const soloQueue = player.rankedInfo?.find(q => q.queueType === 'Solo/Duo');
                    const winRate = soloQueue 
                      ? ((soloQueue.wins / (soloQueue.wins + soloQueue.losses)) * 100).toFixed(1)
                      : 'N/A';

                    return (
                      <tr 
                        key={player.summoner.puuid}
                        className={clsx(
                          "transition-all duration-200",
                          "hover:bg-gray-800/70",
                          index % 2 === 0 ? 'bg-gray-900/40' : 'bg-gray-900/20'
                        )}
                      >
                        <td className="p-4">
                          <Group gap="md" wrap="nowrap">
                            <Avatar
                              src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${player.summoner.profileIconId}.png`}
                              size={48}
                              radius="xl"
                              className="border-2 border-gray-700"
                            />
                            <div>
                              <Text size="lg" fw={600} className="text-white/90">
                                {player.summoner.name.split('#')[0]}
                              </Text>
                              <Text size="sm" className="text-gray-400">
                                #{player.summoner.name.split('#')[1]}
                              </Text>
                            </div>
                          </Group>
                        </td>
                        <td className="p-4">
                          <Badge 
                            size="lg" 
                            variant="gradient"
                            gradient={{ from: 'blue.8', to: 'cyan.6' }}
                          >
                            {player.summoner.summonerLevel}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {soloQueue ? (
                            <Badge
                              size="lg"
                              variant="gradient"
                              gradient={getRankGradient(soloQueue.tier)}
                              className="font-semibold px-4 py-2"
                              style={{
                                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                              }}
                            >
                              {soloQueue.tier} {soloQueue.rank} • {soloQueue.leaguePoints}LP
                            </Badge>
                          ) : (
                            <Badge size="lg" color="gray" variant="dot">Unranked</Badge>
                          )}
                        </td>
                        <td className="p-4">
                          <Group gap="sm" wrap="nowrap">
                            <Badge
                              size="lg"
                              variant="gradient"
                              gradient={{ 
                                from: parseFloat(winRate) >= 55 ? 'teal' : 
                                      parseFloat(winRate) >= 50 ? 'blue' : 'red', 
                                to: parseFloat(winRate) >= 55 ? 'green' : 
                                    parseFloat(winRate) >= 50 ? 'cyan' : 'pink'
                              }}
                              className="min-w-[80px] text-center"
                            >
                              {winRate}%
                            </Badge>
                            {soloQueue && (
                              <Tooltip label="Wins / Losses">
                                <Text size="sm" className="text-gray-400 tabular-nums">
                                  {soloQueue.wins}W {soloQueue.losses}L
                                </Text>
                              </Tooltip>
                            )}
                          </Group>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Paper>
        )}
      </Container>
    </AppShell>
  );
}

function getRankGradient(tier: string) {
  switch (tier) {
    case 'IRON': return { from: 'gray', to: 'dark' };
    case 'BRONZE': return { from: '#cd7f32', to: '#8B4513' };
    case 'SILVER': return { from: '#C0C0C0', to: '#808080' };
    case 'GOLD': return { from: '#FFD700', to: '#DAA520' };
    case 'PLATINUM': return { from: '#00ff9f', to: '#008B8B' };
    case 'DIAMOND': return { from: '#b9f2ff', to: '#4169E1' };
    case 'MASTER': return { from: '#9370db', to: '#800080' };
    case 'GRANDMASTER': return { from: '#ff4e50', to: '#8B0000' };
    case 'CHALLENGER': return { from: '#00ccff', to: '#0000CD' };
    default: return { from: 'gray', to: 'dark' };
  }
}
