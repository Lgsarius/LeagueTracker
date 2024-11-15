'use client';

import { Box, Container, Paper, Group, Text, Button } from '@mantine/core';
import { IconBrandGithub, IconBrandDiscord } from '@tabler/icons-react';
import Link from 'next/link';

const FOOTER_LINKS = [
  { text: 'Impressum', path: '/legal' },
  { text: 'Datenschutz', path: '/privacy' },
  { text: 'Über uns', path: '/about' },
];

const SOCIAL_LINKS = [
  {
    icon: IconBrandGithub,
    label: 'GitHub',
    path: 'https://github.com/Lgsarius/LeagueTracker',
    gradient: { from: 'gray', to: 'dark' }
  },
  {
    icon: IconBrandDiscord,
    label: 'Discord',
    path: 'https://discord.gg/yourinvite',
    gradient: { from: '#5865F2', to: '#4752C4' }
  },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      style={{
        background: 'rgba(26,27,30,0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        width: '100%',
        padding: '1rem 0',
      }}
    >
      <Container size="xl">
        <Paper 
          p="md" 
          radius="md" 
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
          <Group justify="space-between" align="center" wrap="nowrap">
            <Text 
              size="sm" 
              c="dimmed"
              style={{
                letterSpacing: '0.5px',
                textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              }}
            >
              © {currentYear} LostGames League Tracker. Mit ♥ erstellt
            </Text>

            <Group gap="xs" wrap="nowrap">
              {FOOTER_LINKS.map(({ text, path }) => (
                <Button
                  key={text}
                  component={Link}
                  href={path}
                  variant="subtle"
                  size="xs"
                  styles={{
                    root: {
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        background: 'rgba(255,255,255,0.1)',
                      },
                    },
                  }}
                >
                  {text}
                </Button>
              ))}
              
              {SOCIAL_LINKS.map(({ icon: Icon, label, path, gradient }) => (
                <Button
                  key={label}
                  component="a"
                  href={path}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="gradient"
                  gradient={gradient}
                  size="xs"
                  leftSection={<Icon size={16} />}
                  styles={{
                    root: {
                      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                      },
                    },
                  }}
                >
                  {label}
                </Button>
              ))}
            </Group>
          </Group>
        </Paper>
      </Container>
    </Box>
  );
} 