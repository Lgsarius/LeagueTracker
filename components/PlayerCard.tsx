import React from 'react';
import { Paper, Badge, Group } from '@mantine/core';

// Inside PlayerCard component
function PlayerCard({ player }: { player: PlayerData }) {
  // Add this calculation near the top of the component
  const totalStats = player.recentMatches?.reduce((acc, match) => {
    const playerStats = match.info.participants.find(
      p => p.puuid === player.summoner.puuid
    );
    if (playerStats) {
      acc.kills += playerStats.kills;
      acc.deaths += playerStats.deaths;
    }
    return acc;
  }, { kills: 0, deaths: 0 });

  return (
    <Paper p="md" radius="md" style={CARD_STYLES}>
      {/* ... existing card content ... */}
      
      {/* Add this after the player name or wherever you prefer */}
      <Group spacing="xs" mt="xs">
        <Badge color="green" variant="light">
          {totalStats?.kills || 0} Kills
        </Badge>
        <Badge color="red" variant="light">
          {totalStats?.deaths || 0} Deaths
        </Badge>
        <Badge color={totalStats && totalStats.deaths > 0 ? 
          (totalStats.kills / totalStats.deaths >= 2 ? 'blue' : 'yellow') : 'gray'} 
          variant="light">
          KD: {totalStats && totalStats.deaths > 0 ? 
            (totalStats.kills / totalStats.deaths).toFixed(1) : 
            'N/A'}
        </Badge>
      </Group>
      
      {/* ... rest of the card content ... */}
    </Paper>
  );
} 