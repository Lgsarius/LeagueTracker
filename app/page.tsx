'use client';
/* eslint-disable */
import { Container, AppShell, Title, Text, Box, Group, Paper, Button, Badge, Stack } from '@mantine/core';
import { PlayerList } from '@/components/PlayerList';
import { useState, useEffect } from 'react';
import { PlayerData } from '@/types/player';
import playerData from '@/data/players.json';
import summonerTags from '@/data/summoner-tags.json';
import Link from 'next/link';
import Image from 'next/image';
import { LoadingScreen } from '@/components/LoadingScreen';
import { motion, AnimatePresence } from 'framer-motion';
import { DigitalClock } from '@/components/DigitalClock';

export default function HomePage() {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

  // Modify the initial load effect
  useEffect(() => {
    const initializeData = async () => {
      try {
        // Load immediately from local data
        if (playerData && playerData.players) {
          const initialPlayers = Object.entries(playerData.players).map(([_, player]) => ({
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
          })).map(player => ({
            ...player,
            kills: 0,
            deaths: 0,
            assists: 0,
          }));
          
          setPlayers(initialPlayers);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Failed to load initial player data');
      } finally {
        setIsLoading(false);
        // Add a minimum display time for the loading screen
        setTimeout(() => {
          setShowLoadingScreen(false);
        }, 1500); // Show loading screen for at least 1.5 seconds
      }
    };

    initializeData();
  }, []);

  // Separate effect for loading fresh data after initial render
  useEffect(() => {
    if (isInitialized) {
      loadAllPlayers();
    }
  }, [isInitialized]);

  const loadAllPlayers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const playerNames = Object.keys(summonerTags);
      console.log('🔄 Starting refresh for all players:', playerNames);
      
      const updatedPlayers = await Promise.allSettled(
        playerNames.map(async (name) => {
          try {
            console.log(`📡 Fetching data for ${name}...`);
            const playerInfo = {
              gameName: name,
              tagLine: summonerTags[name as keyof typeof summonerTags].split('#')[1],
            };

            const response = await fetch(`/api/player/update/${encodeURIComponent(name)}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(playerInfo),
            });

            if (!response.ok) {
              const errorData = await response.json();
              console.error(`Failed to update ${name}:`, errorData);
              throw new Error(`Failed to update ${name}: ${response.status}`);
            }

            const data = await response.json();
            console.log(`✅ Successfully updated ${name}`);
            return data;
          } catch (error) {
            console.error(`❌ Error updating ${name}:`, error);
            // Return existing player data if available
            const existingPlayer = players.find(p => p.summoner.name.split('#')[0] === name);
            return existingPlayer || null;
          }
        })
      );

      const successfulUpdates = updatedPlayers
      /* eslint-disable @typescript-eslint/no-explicit-any */
        .filter((result): result is PromiseFulfilledResult<any> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      if (successfulUpdates.length > 0) {
        setPlayers(successfulUpdates);
      }
    } catch (error) {
      console.error('❌ Global update failed:', error);
      setError('Failed to update player data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePlayer = (name: string) => {
    setPlayers(prev => prev.filter(p => p.summoner.name !== name));
  };

  const handleReloadPlayer = async (name: string) => {
    try {
      console.log(`🔄 Starting refresh for ${name}...`);
      
      // Get the player's base name (without the tag)
      const baseName = name.split('#')[0];
      const playerInfo = {
        gameName: baseName,
        tagLine: summonerTags[baseName as keyof typeof summonerTags].split('#')[1],
      };

      console.log(`📡 Fetching updated data for ${baseName}...`);
      const response = await fetch(`/api/player/update/${encodeURIComponent(baseName)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playerInfo),
      });

      if (!response.ok) {
        throw new Error(`Failed to update ${baseName}: ${response.status}`);
      }
      
      const updatedPlayer = await response.json();
      console.log(`✅ Successfully updated ${baseName}`);
      
      setPlayers(prev => prev.map(p => 
        p.summoner.name.split('#')[0] === baseName ? updatedPlayer : p
      ));
    } catch (error) {
      console.error(`❌ Error updating player ${name}:`, error);
      setError(`Failed to update ${name}`);
    }
  };

  const initializeNewPlayers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get all player names from the summoner-tags.json
      const playerNames = Object.keys(summonerTags);
      console.log('🔍 Checking for new players in:', playerNames);
      
      // Filter for players that aren't already in the current state
      const currentPlayerNames = players.map(p => p.summoner.name.split('#')[0]);
      const newPlayers = playerNames.filter(name => !currentPlayerNames.includes(name));
      
      if (newPlayers.length === 0) {
        console.log('✨ No new players to initialize');
        return;
      }

      console.log('🆕 Found new players:', newPlayers);
      
      // Initialize each new player
      const updatedPlayers = await Promise.allSettled(
        newPlayers.map(async (name) => {
          try {
            console.log(`📡 Initializing ${name}...`);
            const playerInfo = {
              gameName: name,
              tagLine: summonerTags[name as keyof typeof summonerTags].split('#')[1],
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

      // Filter out failed updates
      const successfulInits = updatedPlayers
      /* eslint-disable @typescript-eslint/no-explicit-any */
        .filter((result): result is PromiseFulfilledResult<any> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      console.log(`🏁 Initialization complete. Added ${successfulInits.length}/${newPlayers.length} players`);
      
      // Update the players list with both existing and new players
      setPlayers(prev => [...prev, ...successfulInits]);
    } catch (error) {
      console.error('❌ Global initialization failed:', error);
      setError('Failed to initialize new players');
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

                  {/* Digital Clock - Hidden on Mobile */}
                  <Paper
                    p="xl"
                    radius="md"
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(8px)',
                      minWidth: '300px',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                      },
                    }}
                    hiddenFrom="sm"
                    visibleFrom="sm"
                  >
                    <DigitalClock />
                  </Paper>
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
        </AppShell>
      </motion.div>
    </>
  );
}
