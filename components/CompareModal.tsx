'use client';

import { Modal, MultiSelect, Table, Group, Avatar, Text, Badge } from '@mantine/core';
import { useState } from 'react';
import { PlayerData } from '@/types/player';

interface CompareModalProps {
  players: PlayerData[];
  isOpen: boolean;
  onClose: () => void;
}

export function CompareModal({ players, isOpen, onClose }: CompareModalProps) {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  const playerOptions = players.map(player => ({
    value: player.summoner.puuid,
    label: player.summoner.name
  }));

  const getSelectedPlayerData = () => {
    return players.filter(player => 
      selectedPlayers.includes(player.summoner.puuid)
    );
  };

  const calculateWinRate = (player: PlayerData) => {
    const soloQueue = player.rankedInfo?.find(queue => queue.queueType === 'Solo/Duo');
    if (!soloQueue) return 0;
    
    const totalGames = soloQueue.wins + soloQueue.losses;
    return totalGames > 0 ? (soloQueue.wins / totalGames) * 100 : 0;
  };

  return (
    <Modal 
      opened={isOpen} 
      onClose={onClose}
      title="Compare Players"
      size="xl"
    >
      <MultiSelect
        data={playerOptions}
        value={selectedPlayers}
        onChange={setSelectedPlayers}
        label="Select players to compare"
        placeholder="Choose players..."
        maxValues={4}
        mb="xl"
      />

      {selectedPlayers.length > 0 && (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Player</Table.Th>
              <Table.Th>Rank</Table.Th>
              <Table.Th>Win Rate</Table.Th>
              <Table.Th>Level</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {getSelectedPlayerData().map(player => {
              const soloQueue = player.rankedInfo?.find(queue => 
                queue.queueType === 'Solo/Duo'
              );

              return (
                <Table.Tr key={player.summoner.puuid}>
                  <Table.Td>
                    <Group gap="sm">
                      <Avatar
                        size={32}
                        src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/profileicon/${player.summoner.profileIconId}.png`}
                        radius="xl"
                      />
                      <Text size="sm">{player.summoner.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    {soloQueue ? (
                      <Badge variant="light">
                        {soloQueue.tier} {soloQueue.rank}
                      </Badge>
                    ) : (
                      <Text size="sm" c="dimmed">Unranked</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c={calculateWinRate(player) >= 50 ? 'teal' : 'red'}>
                      {calculateWinRate(player).toFixed(1)}%
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{player.summoner.summonerLevel}</Text>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      )}
    </Modal>
  );
}