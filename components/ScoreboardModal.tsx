import React from 'react';
import { Modal, Paper, Text, Group, Stack, Avatar, Tooltip } from '@mantine/core';
import { IconSword, IconSkull, IconHandStop, IconX, IconQuestionMark } from '@tabler/icons-react';
import playersData from '@/data/players.json';
import { useMediaQuery } from '@mantine/hooks';

interface Player {
  puuid: string;
  gameName: string;
  tagLine: string;
  profileIconId: number;
}

interface PlayersData {
  players: {
    [key: string]: Player;
  };
}

const typedPlayersData = playersData as PlayersData;

interface ScoreboardModalProps {
  opened: boolean;
  onClose: () => void;
  match: {
    info: {
      gameDuration: number;
      gameMode: string;
      queueId?: number;
      participants: Array<{
        puuid: string;
        championName: string;
        kills: number;
        deaths: number;
        assists: number;
        win: boolean;
        pings?: {
          missing?: number;
          danger?: number;
          command?: number;
          getBack?: number;
          onMyWay?: number;
        };
      }>;
    };
  } | null;
}

const getPlayerNameByPuuid = (puuid: string) => {
  const player = Object.values(typedPlayersData.players).find(p => p.puuid === puuid);
  if (player) {
    return `${player.gameName}#${player.tagLine}`;
  }
  return 'Unknown Player';
};

const getTotalPings = (pings: { [key: string]: number } | undefined) => {
  if (!pings) return 0;
  return Object.values(pings).reduce((sum: number, count: number) => sum + count, 0);
};

const ScoreboardModal: React.FC<ScoreboardModalProps> = ({ opened, onClose, match }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!match || !match.info) {
    return (
      <Modal opened={opened} onClose={onClose} size="xl">
        <Text>No match data available</Text>
      </Modal>
    );
  }

  console.log('Match participants:', match.info.participants);

  const team1 = match.info.participants.slice(0, 5);
  const team2 = match.info.participants.slice(5, 10);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getReadableGameMode = (mode: string, queueId?: number) => {
    // Queue IDs from Riot API
    // 420 = Solo/Duo Ranked
    // 440 = Flex Ranked
    // 400 = Normal Draft
    // 430 = Normal Blind
    // 450 = ARAM
    switch (mode) {
      case 'CLASSIC':
        switch (queueId) {
          case 420: return 'Ranked Solo/Duo';
          case 440: return 'Ranked Flex';
          case 400: return 'Normal Draft';
          case 430: return 'Normal Blind';
          default: return 'Normal';
        }
      case 'ARAM': return 'ARAM';
      default: return mode;
    }
  };

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      size={isMobile ? '100%' : 'xl'}
      radius="md"
      centered
      fullScreen={isMobile}
      withCloseButton={false}
      transitionProps={{ transition: 'fade', duration: 200 }}
      styles={{
        content: {
          border: '1px solid #ffffff10',
          backdropFilter: 'blur(8px)',
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          width: isMobile ? '100%' : undefined,
          position: 'relative',
        },
        body: { 
          padding: isMobile ? 8 : 12,
          width: '100%',
        },
      }}
    >
      <Group 
        style={{ 
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1000,
        }}
      >
        <IconX
          size={20}
          style={{ 
            cursor: 'pointer',
            color: '#666',
            transition: 'color 0.2s',
          }}
          onClick={onClose}
        />
      </Group>

      <Stack style={{ width: '100%' }}>
        {/* Game Info */}
        <Group align="apart" px={4}>
          <Text size="sm" c="dimmed">
            {getReadableGameMode(match.info.gameMode, match.info.queueId)}
          </Text>
          <Text size="sm" c="dimmed">
            {formatDuration(match.info.gameDuration)}
          </Text>
        </Group>
        {/* Teams Container */}
        <Group 
          grow 
          align="flex-start"
          style={{
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '8px' : undefined,
            width: '100%',
          }}
        >
          {/* Team 1 */}
          <Paper
            p={8}
            radius="md"
            style={{
              border: '1px solid #ffffff10',
              backgroundColor: 'rgba(0, 100, 255, 0.05)',
              width: isMobile ? '100%' : undefined,
              minWidth: isMobile ? '100%' : undefined,
            }}
          >
            <Text size="sm" fw={600} c="blue.4" mb={6}>
              Blue Team {team1[0]?.win ? '(Victory)' : '(Defeat)'}
            </Text>
            <Stack gap={4}>
              {team1.map((player) => (
                <Group
                  key={player.puuid}
                  wrap="nowrap"
                  justify="space-between"
                  p={isMobile ? 4 : 6}
                  style={{
                    borderRadius: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <Group wrap="nowrap" gap={isMobile ? 6 : 'xs'}>
                    <Avatar
                      src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/${player.championName}.png`}
                      size={isMobile ? 20 : 24}
                      radius="sm"
                      alt={player.championName}
                    />
                    <Stack gap={isMobile ? 0 : 'xs'}>
                      <Text size={isMobile ? 'xs' : 'sm'} c="dimmed">
                        {player.championName}
                      </Text>
                      <Text size="xs" c="dimmed.4">
                        {getPlayerNameByPuuid(player.puuid)}
                      </Text>
                    </Stack>
                    {player.pings && getTotalPings(player.pings) > 0 && (
                      <Tooltip 
                        label={
                          <div style={{ padding: isMobile ? 8 : 4 }}>
                            {player.pings?.missing && (
                              <Text size={isMobile ? 'sm' : 'xs'} mb={2}>Missing: {player.pings.missing}</Text>
                            )}
                            {player.pings?.danger && (
                              <Text size={isMobile ? 'sm' : 'xs'} mb={2}>Danger: {player.pings.danger}</Text>
                            )}
                            {player.pings?.command && (
                              <Text size={isMobile ? 'sm' : 'xs'} mb={2}>Command: {player.pings.command}</Text>
                            )}
                            {player.pings?.getBack && (
                              <Text size={isMobile ? 'sm' : 'xs'} mb={2}>Get Back: {player.pings.getBack}</Text>
                            )}
                            {player.pings?.onMyWay && (
                              <Text size={isMobile ? 'sm' : 'xs'}>On My Way: {player.pings.onMyWay}</Text>
                            )}
                          </div>
                        }
                        position={isMobile ? 'bottom' : 'right'}
                        withArrow
                        multiline
                      >
                        <Group gap={4} style={{ minWidth: isMobile ? 40 : 'auto' }}>
                          <IconQuestionMark size={isMobile ? 16 : 14} />
                          <Text size={isMobile ? 'sm' : 'xs'} c="dimmed">
                            {getTotalPings(player.pings)}
                          </Text>
                        </Group>
                      </Tooltip>
                    )}
                  </Group>
                  <Group gap={8} wrap="nowrap">
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
                </Group>
              ))}
            </Stack>
          </Paper>

          {/* Team 2 */}
          <Paper
            p={8}
            radius="md"
            style={{
              border: '1px solid #ffffff10',
              backgroundColor: 'rgba(255, 0, 0, 0.05)',
              width: isMobile ? '100%' : undefined,
              minWidth: isMobile ? '100%' : undefined,
            }}
          >
            <Text size="sm" fw={600} c="red.4" mb={6}>
              Red Team {team2[0]?.win ? '(Victory)' : '(Defeat)'}
            </Text>
            <Stack gap={4}>
              {team2.map((player) => (
                <Group
                  key={player.puuid}
                  wrap="nowrap"
                  justify="space-between"
                  p={isMobile ? 4 : 6}
                  style={{
                    borderRadius: 4,
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <Group wrap="nowrap" gap={isMobile ? 6 : 'xs'}>
                    <Avatar
                      src={`https://ddragon.leagueoflegends.com/cdn/13.24.1/img/champion/${player.championName}.png`}
                      size={isMobile ? 20 : 24}
                      radius="sm"
                      alt={player.championName}
                    />
                    <Stack gap={isMobile ? 0 : 'xs'}>
                      <Text size={isMobile ? 'xs' : 'sm'} c="dimmed">
                        {player.championName}
                      </Text>
                      <Text size="xs" c="dimmed.4">
                        {getPlayerNameByPuuid(player.puuid)}
                      </Text>
                    </Stack>
                    {player.pings && getTotalPings(player.pings) > 0 && (
                      <Tooltip 
                        label={
                          <div style={{ padding: isMobile ? 8 : 4 }}>
                            {player.pings?.missing && (
                              <Text size={isMobile ? 'sm' : 'xs'} mb={2}>Missing: {player.pings.missing}</Text>
                            )}
                            {player.pings?.danger && (
                              <Text size={isMobile ? 'sm' : 'xs'} mb={2}>Danger: {player.pings.danger}</Text>
                            )}
                            {player.pings?.command && (
                              <Text size={isMobile ? 'sm' : 'xs'} mb={2}>Command: {player.pings.command}</Text>
                            )}
                            {player.pings?.getBack && (
                              <Text size={isMobile ? 'sm' : 'xs'} mb={2}>Get Back: {player.pings.getBack}</Text>
                            )}
                            {player.pings?.onMyWay && (
                              <Text size={isMobile ? 'sm' : 'xs'}>On My Way: {player.pings.onMyWay}</Text>
                            )}
                          </div>
                        }
                        position={isMobile ? 'bottom' : 'right'}
                        withArrow
                        multiline
                      >
                        <Group gap={4} style={{ minWidth: isMobile ? 40 : 'auto' }}>
                          <IconQuestionMark size={isMobile ? 16 : 14} />
                          <Text size={isMobile ? 'sm' : 'xs'} c="dimmed">
                            {getTotalPings(player.pings)}
                          </Text>
                        </Group>
                      </Tooltip>
                    )}
                  </Group>
                  <Group gap={8} wrap="nowrap">
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
                </Group>
              ))}
            </Stack>
          </Paper>
        </Group>
      </Stack>
    </Modal>
  );
};

export default ScoreboardModal;
