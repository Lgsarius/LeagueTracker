'use client';
/* eslint-disable */
import { Container, AppShell, Title, Text, Box, Group, Paper, Button, Badge, Stack } from '@mantine/core';
import { PlayerList } from '@/components/PlayerList';
import { useState, useEffect } from 'react';
import { PlayerData } from '@/types/player';
import summonerTags from '@/data/summoner-tags.json';
import Link from 'next/link';
import Image from 'next/image';
import { LoadingScreen } from '@/components/LoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { IconBrandGithub } from '@tabler/icons-react';

// First, define the player interface
interface Player {
  puuid: string;
  id: string;
  accountId: string;
  name: string;
  profileIconId: number;
  revisionDate: number;
  summonerLevel: number;
  gameName: string;
  tagLine: string;
  matches?: any[]; // Add proper match type if needed
}

interface PlayersData {
  players: {
    [key: string]: Player;
  };
}
export default function HomePage() {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  // Add a new useEffect to initialize players if files don't exist
  useEffect(() => {
    const initializeMissingPlayers = async () => {
      setIsLoading(true);
      try {
        const playerNames = Object.keys(summonerTags);
        
        // Try to initialize each missing player
        await Promise.allSettled(
          playerNames.map(async (name) => {
            try {
              // First check if file exists
              const response = await fetch(`/data/players/${name}.json`);
              if (response.ok) {
                console.log(`✅ Player ${name} already initialized`);
                return;
              }

              console.log(`🔄 Initializing ${name}...`);
              const tagLine = (summonerTags as Record<string, string>)[name]?.split('#')[1];
              
              if (!tagLine) {
                throw new Error(`No tag found for ${name}`);
              }

              const playerInfo = {
                gameName: name,
                tagLine: tagLine,
              };

              // Initialize player through API
              const initResponse = await fetch(`/api/player/update/${encodeURIComponent(name)}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(playerInfo),
              });

              if (!initResponse.ok) {
                throw new Error(`Failed to initialize ${name}`);
              }

              console.log(`✅ Successfully initialized ${name}`);
            } catch (error) {
              console.error(`❌ Error initializing ${name}:`, error);
            }
          })
        );

        // After initialization, load all players
        await loadPlayerFiles();
      } catch (error) {
        console.error('Failed to initialize players:', error);
        setError('Failed to initialize players');
      } finally {
        setIsLoading(false);
        setShowLoadingScreen(false);
      }
    };

    initializeMissingPlayers();
  }, []); // Run once on mount

  // Modify loadPlayerFiles to be callable from other functions
  const loadPlayerFiles = async () => {
    try {
      const playerNames = Object.keys(summonerTags);
      const loadedPlayers: PlayerData[] = [];

      for (const name of playerNames) {
        try {
          const response = await fetch(`/data/players/${name}.json`);
          if (response.ok) {
            const playerData = await response.json();
            loadedPlayers.push({
              puuid: playerData.puuid,
              summoner: {
                id: playerData.id,
                accountId: playerData.accountId,
                puuid: playerData.puuid,
                name: `${playerData.gameName}#${playerData.tagLine}`,
                profileIconId: playerData.profileIconId,
                summonerLevel: playerData.summonerLevel,
              },
              rankedInfo: playerData.rankedInfo || [],
              recentMatches: playerData.recentMatches || [],
            });
          }
        } catch (error) {
          console.warn(`Failed to load data for ${name}`, error);
        }
      }

      setPlayers(loadedPlayers);
    } catch (error) {
      console.error('Error loading player files:', error);
    }
  };

  // Refresh individual player
  const handleReloadPlayer = async (name: string) => {
    try {
      const baseName = name.split('#')[0];
      const tagLine = (summonerTags as Record<string, string>)[baseName]?.split('#')[1];
      
      if (!tagLine) {
        throw new Error(`No tag found for ${baseName}`);
      }

      const playerInfo = {
        gameName: baseName,
        tagLine: tagLine,
      };

      const response = await fetch(`/api/player/update/${encodeURIComponent(baseName)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playerInfo),
      });

      if (!response.ok) throw new Error(`Failed to update ${baseName}`);
      
      const playerData = await response.json();
      
      // Calculate totals from recent matches
      const totals = playerData.recentMatches?.reduce((acc: any, match: any) => {
        const participant = match.info.participants.find(
          (p: any) => p.puuid === playerData.puuid
        );
        if (participant) {
          acc.kills += participant.kills || 0;
          acc.deaths += participant.deaths || 0;
          acc.assists += participant.assists || 0;
        }
        return acc;
      }, { kills: 0, deaths: 0, assists: 0 }) || { kills: 0, deaths: 0, assists: 0 };

      const updatedPlayer = {
        ...playerData,
        kills: totals.kills,
        deaths: totals.deaths,
        assists: totals.assists
      };

      setPlayers(prev => prev.map(p => 
        p.summoner.name.split('#')[0] === baseName ? updatedPlayer : p
      ));
    } catch (error) {
      console.error(`Error updating ${name}:`, error);
    }
  };

  const handleRemovePlayer = (name: string) => {
    setPlayers(prev => prev.filter(p => p.summoner.name !== name));
  };

  const initializeNewPlayers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const playerNames = Object.keys(summonerTags);
      console.log('🔍 Checking for new players in:', playerNames);
      
      const currentPlayerNames = players.map(p => p.summoner.name.split('#')[0]);
      const newPlayers = playerNames.filter(name => !currentPlayerNames.includes(name));
      
      if (newPlayers.length === 0) {
        console.log('✨ No new players to initialize');
        return;
      }

      console.log('🆕 Found new players:', newPlayers);
      
      const updatedPlayers = await Promise.allSettled(
        newPlayers.map(async (name) => {
          try {
            console.log(`📡 Initializing ${name}...`);
            const tagLine = (summonerTags as Record<string, string>)[name]?.split('#')[1];
            
            if (!tagLine) {
              throw new Error(`No tag found for ${name}`);
            }

            const playerInfo = {
              gameName: name,
              tagLine: tagLine,
            };

            const response = await fetch(`/api/player/update/${encodeURIComponent(name)}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(playerInfo),
            });

            if (!response.ok) {
              throw new Error(`Failed to initialize ${name}`);
            }
            
            const data = await response.json();
            console.log(`✅ Successfully initialized ${name}`);
            return data;
          } catch (error) {
            console.error(`❌ Error initializing ${name}:`, error);
            return null;
          }
        })
      );

      const successfulInits = updatedPlayers
        .filter((result): result is PromiseFulfilledResult<any> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      console.log(`🏁 Initialization complete. Added ${successfulInits.length}/${newPlayers.length} players`);
      
      // Update the players list with both existing and new players
      setPlayers(prev => [...prev, ...successfulInits]);
    } catch (error) {
      console.error(' Global initialization failed:', error);
      setError('Failed to initialize new players');
    } finally {
      setIsLoading(false);
    }
  };

  // Add the loadAllPlayers function
  const loadAllPlayers = async () => {
    setIsLoading(true);
    try {
      const playerNames = Object.keys(summonerTags);
      
      const updatedPlayers = await Promise.allSettled(
        playerNames.map(async (name) => {
          try {
            const tagLine = (summonerTags as Record<string, string>)[name]?.split('#')[1];
            
            if (!tagLine) {
              throw new Error(`No tag found for ${name}`);
            }

            const playerInfo = {
              gameName: name,
              tagLine: tagLine,
            };

            const response = await fetch(`/api/player/update/${encodeURIComponent(name)}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(playerInfo),
            });

            if (!response.ok) {
              throw new Error(`Failed to update ${name}`);
            }
            
            const data = await response.json();
            return data;
          } catch (error) {
            console.error(`Error updating ${name}:`, error);
            return null;
          }
        })
      );

      const successfulUpdates = updatedPlayers
        .filter((result): result is PromiseFulfilledResult<any> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      setPlayers(successfulUpdates);
    } catch (error) {
      console.error('Failed to reload all players:', error);
      setError('Failed to reload all players');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {showLoadingScreen && <LoadingScreen />}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showLoadingScreen ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        <AppShell
          bg="dark.8"
          style={{ minHeight: '100vh' }}
          footer={{ height: 60 }}
        >
          {/* Main Content Container */}
          <Container 
            size="100%"
            py="xl"
            px={{ base: 'md', sm: 40 }}
            style={{ minHeight: 'calc(100vh - 60px)' }}
          >
            {/* Hero Section */}
            <Paper
              radius="lg"
              p={{ base: 'md', sm: 'xl' }}
              mb={50}
              style={{
                background: 'linear-gradient(to right, rgba(26,27,30,0.95), rgba(26,27,30,0.8))',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Main Content */}
              <Stack gap="xl">
                {/* Header Group */}
                <Group 
                  justify="space-between" 
                  align="center" 
              
                >
                  {/* Logo and Title */}
                  <Group gap="md" wrap="nowrap">
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
                      
                        fw={900}
                        variant="gradient"
                       
                      >
                        LostGames League Tracker
                      </Title>
                      <Group align="center" gap="xl" mt="md">
                        <Text c="dimmed" size="lg">
                          Alle LostGames LoL Spieler
                        </Text>
                        <Badge 
                          size="lg" 
                          variant="gradient" 
                          gradient={{ from: 'blue', to: 'cyan' }}
                        >
                          16 Accounts
                        </Badge>
                      </Group>
                    </Box>
                  </Group>

               
                </Group>
              </Stack>
            </Paper>

            {/* Status Messages */}
            {error && (
              <Paper p="md" radius="md" mb={20} bg="red.9">
                <Text c="white">{error}</Text>
              </Paper>
            )}

            {/* Players Grid */}
            {isLoading && !players.length ? (
              <Paper p="xl" radius="md" ta="center">
                <Text size="lg">Loading players...</Text>
              </Paper>
            ) : (
              <PlayerList 
                players={players} 
                onRemovePlayer={handleRemovePlayer} 
                onReload={loadAllPlayers}
                onReloadPlayer={handleReloadPlayer}
                isLoading={isLoading}
                onInitNewPlayers={initializeNewPlayers}
              />
            )}

           
          </Container>

          {/* Custom Footer in German */}
          <Box 
            component="footer" 
            h={60} 
            p="md"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(26,27,30,0.95)',
            }}
          >
            <Container size="100%">
              <Group justify="space-between" align="center">
                <Text size="sm" c="dimmed">
                  © 2024 LostGames Community Hub. Mit ♥ erstellt für unsere Community
                </Text>
                <Group gap="xs" justify="flex-end">
                  <Button 
                    variant="subtle" 
                    size="xs"
                    component={Link}
                    href="https://github.com/Lgsarius/LeagueTracker"
                    target="_blank"
                    leftSection={<IconBrandGithub size={16} />}
                  >
                    GitHub
                  </Button>
                  <Button 
                    variant="subtle" 
                    size="xs"
                    component={Link}
                    href="/about"
                  >
                    Über uns
                  </Button>
                </Group>
              </Group>
            </Container>
          </Box>
        </AppShell>
      </motion.div>
    </>
  );
}
