import { Modal, MultiSelect, Table, Group, Avatar, Text, Badge, Paper } from '@mantine/core';
import { useState } from 'react';
import { PlayerData } from '@/types/player';

interface CompareModalProps {
  players: PlayerData[];
  isOpen: boolean;
  onClose: () => void;
}

interface PlayerStats {
  name: string;
  rank: string;
  tier: string;
  lp: number;

  winRate: string;
  level: number;
  iconId: number;
  totalGames: number;
}

export function CompareModal({ players, isOpen, onClose }: CompareModalProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const getPlayerStats = (player: PlayerData): PlayerStats => {
    // Specifically look for Solo/Duo queue
    const rankedQueue = player.rankedInfo?.find(q => q.queueType === 'Solo/Duo') 
      || player.rankedInfo?.[0];

    const wins = rankedQueue?.wins || 0;
    const losses = rankedQueue?.losses || 0;
    const totalGames = wins + losses;
    const winRate = totalGames > 0 
      ? ((wins / totalGames) * 100).toFixed(1) 
      : '0';

    return {
      name: player.summoner.name.split('#')[0],
      rank: rankedQueue ? `${rankedQueue.tier} ${rankedQueue.rank}` : 'Unranked',
      tier: rankedQueue?.tier || 'UNRANKED',
      lp: rankedQueue?.leaguePoints || 0,
      winRate,
      level: player.summoner.summonerLevel,
      iconId: player.summoner.profileIconId,
      totalGames,
    };
  };

  const compareData = selectedPlayers
    .map(name => players.find(p => p.summoner.name.split('#')[0] === name))
    .filter((player): player is PlayerData => player !== undefined)
    .map(getPlayerStats);

  const getComparisonColor = (stat1: number, stat2: number) => {
    if (stat1 > stat2) return 'green';
    if (stat1 < stat2) return 'red';
    return 'dimmed';
  };

  return (
    <Modal 
      opened={isOpen} 
      onClose={() => {
        setSelectedPlayers([]);
        onClose();
      }} 
      title="Compare Players" 
      size={compareData.length > 2 ? "xl" : "lg"}
      styles={{
        body: {
          minWidth: compareData.length > 2 ? '900px' : 'auto'
        }
      }}
    >
      <MultiSelect
        data={players.map(p => ({ 
          value: p.summoner.name.split('#')[0], 
          label: p.summoner.name.split('#')[0] 
        }))}
        value={selectedPlayers}
        onChange={setSelectedPlayers}
        label="Select players to compare"
        maxValues={5}
        searchable
        mb="md"
      />

      {compareData.length >= 2 && (
        <Paper p="md" radius="md" style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}>
          <Group mb="lg" gap="xl" wrap="wrap" justify="center">
            {compareData.map((player, index) => (
              <Group key={index} gap="sm">
                <Avatar
                  size={48}
                  src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${player.iconId}.png`}
                  radius="xl"
                />
                <div>
                  <Text size="lg" fw={500}>{player.name}</Text>
                  <Badge 
                    variant="gradient" 
                    gradient={{ 
                      from: getRankColor(player.tier), 
                      to: getRankColorSecondary(player.tier) 
                    }}
                  >
                    {player.rank} {player.lp}LP
                  </Badge>
                </div>
              </Group>
            ))}
          </Group>

          <Table>
            <Table.Tbody>
              {[
                { label: 'Level', key: 'level' },
                { label: 'Games Played', key: 'totalGames' },
            
                { label: 'Win Rate', key: 'winRate' }
              ].map(({ label, key }) => (
                <Table.Tr key={key}>
                  <Table.Td style={{ width: '20%' }}>{label}</Table.Td>
                  {compareData.map((player, index) => (
                    <Table.Td 
                      key={index}
                      style={{ 
                        width: `${80/compareData.length}%`,
                        color: key === 'winRate' ? 
                          getComparisonColor(
                            parseFloat(player[key]), 
                            parseFloat(player[key])
                          ) :
                          key === 'wins' || key === 'losses' ? 
                            getComparisonColor(
                              Number(player[key as keyof PlayerStats]), 
                              Math.max(...compareData.map(p => Number(p[key as keyof PlayerStats])))
                            ) : undefined
                      }}
                    >
                      {key === 'winRate' ? `${player[key]}%` : player[key as keyof PlayerStats]}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}
    </Modal>
  );
}

// Add these helper functions if you don't have them already
function getRankColor(tier: string): string {
  const colors: { [key: string]: string } = {
    'IRON': '#45484d',
    'BRONZE': '#cd7f32',
    'SILVER': '#C0C0C0',
    'GOLD': '#FFD700',
    'PLATINUM': '#00ff9f',
    'DIAMOND': '#b9f2ff',
    'MASTER': '#9370db',
    'GRANDMASTER': '#ff4e50',
    'CHALLENGER': '#00ccff',
    'UNRANKED': '#666666'
  };
  return colors[tier] || '#666666';
}

function getRankColorSecondary(tier: string): string {
  const colors: { [key: string]: string } = {
    'IRON': '#666666',
    'BRONZE': '#8B4513',
    'SILVER': '#808080',
    'GOLD': '#DAA520',
    'PLATINUM': '#008B8B',
    'DIAMOND': '#4169E1',
    'MASTER': '#800080',
    'GRANDMASTER': '#8B0000',
    'CHALLENGER': '#0000CD',
    'UNRANKED': '#888888'
  };
  return colors[tier] || '#888888';
}