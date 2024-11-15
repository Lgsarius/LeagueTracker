'use client';

import { Group, Title, Text, Badge, Paper, Box, Button } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import Image from 'next/image';
import Link from 'next/link';

interface HeaderProps {
  onReload?: () => void;
  onInitNewPlayers?: () => void;
  isLoading?: boolean;
  playerCount?: number;
  showActions?: boolean;
}

export function Header({ 
  onReload, 
  isLoading, 
  playerCount = 16, 
  showActions = true 
}: HeaderProps) {
  return (
    <Paper
      radius="lg"
      p={{ base: 'md', sm: 'xl' }}
      mb={50}
      style={{
        background: 'rgba(26,27,30,0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="md" wrap="nowrap">
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Box
              style={{
                position: 'relative',
                width: 80,
                height: 80,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
              }}
            >
              <Image 
                src="/LOGO.png"
                alt="LostGames Logo"
                fill
                style={{ objectFit: 'cover' }}
                priority
              />
            </Box>
          </Link>
          <Box>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Title 
                order={1}
                fw={900}
                style={{
                  background: 'linear-gradient(45deg, #3498db, #2ecc71)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 2px 10px rgba(52, 152, 219, 0.3)',
                }}
              >
                LostGames League Tracker
              </Title>
            </Link>
            <Group align="center" gap="xl" mt="md">
              <Text c="dimmed" size="lg" style={{ letterSpacing: '0.5px' }}>
                Alle LostGames LoL Spieler
              </Text>
              {showActions && (
                <Badge 
                  size="lg" 
                  variant="gradient" 
                  gradient={{ from: 'blue', to: 'cyan' }}
                  style={{
                    boxShadow: '0 2px 10px rgba(52, 152, 219, 0.2)',
                  }}
                >
                  {playerCount} Accounts
                </Badge>
              )}
            </Group>
          </Box>
        </Group>
        
        {showActions && onReload && (
          <Group gap="xs">
            <Button
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
              size="sm"
              leftSection={<IconRefresh size={16} />}
              onClick={onReload}
              loading={isLoading}
              style={{
                boxShadow: '0 2px 10px rgba(52, 152, 219, 0.2)',
              }}
            >
              Aktualisieren
            </Button>
          </Group>
        )}
      </Group>
    </Paper>
  );
} 