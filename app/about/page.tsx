'use client';

import { Container, Title, Text, Paper, Group, Button, Stack, Timeline, ThemeIcon, List } from '@mantine/core';
import { IconBrandGithub, IconBrandDiscord, IconHeartFilled, IconCode, IconUsers, IconChartBar, IconDeviceGamepad, IconMessages } from '@tabler/icons-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Container size="lg" py="xl">
        {/* Hero Section */}
        <Paper
          radius="lg"
          p="xl"
          mb={50}
          style={{
            background: 'linear-gradient(to right, rgba(26,27,30,0.95), rgba(26,27,30,0.8))',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Group align="center" justify="space-between" wrap="nowrap">
            <Stack>
              <Title
                order={1}
                size="h1"
                fw={900}
                c="blue"
              >
                LostGames League Tracker
              </Title>
              <Text size="lg" c="dimmed">
                Ein von der Community entwickelter Tracker für deine Gruppe
              </Text>
            </Stack>
            <Image
              src="/LOGO.png"
              alt="LostGames Logo"
              width={120}
              height={120}
              style={{
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          </Group>
        </Paper>

        {/* Features */}
        <Paper
          radius="lg"
          p="xl"
          mb={50}
          style={{
            background: 'rgba(26,27,30,0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Title order={2} mb="xl">Features</Title>
          <Timeline active={-1} bulletSize={24} lineWidth={2}>
            <Timeline.Item
              bullet={<ThemeIcon size={24} variant="filled" color="blue"><IconUsers size={12} /></ThemeIcon>}
              title="Spieler-Tracking"
            >
              <Text size="sm" mt={4}>
                Verfolge die Statistiken von all deinen Freunden
              </Text>
            </Timeline.Item>

            <Timeline.Item
              bullet={<ThemeIcon size={24} variant="filled" color="cyan"><IconChartBar size={12} /></ThemeIcon>}
              title="Statistiken"
            >
              <Text size="sm" mt={4}>
                Detaillierte Match-Historie und Performance-Analysen für jeden Spieler
              </Text>
            </Timeline.Item>

            <Timeline.Item
              bullet={<ThemeIcon size={24} variant="filled" color="blue"><IconCode size={12} /></ThemeIcon>}
              title="Automatische Updates"
            >
              <Text size="sm" mt={4}>
                Automatische Aktualisierung der Daten über die Riot Games API
              </Text>
            </Timeline.Item>
          </Timeline>
        </Paper>

        {/* Tech Stack */}
        <Paper
          radius="lg"
          p="xl"
          mb={50}
          style={{
            background: 'rgba(26,27,30,0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Title order={2} mb="xl">Technologie</Title>
          <List spacing="sm">
            <List.Item>Next.js 13+ mit App Router</List.Item>
            <List.Item>TypeScript für Typsicherheit</List.Item>
            <List.Item>Mantine UI für moderne Komponenten</List.Item>
            <List.Item>Riot Games API Integration</List.Item>
            <List.Item>Framer Motion für Animationen</List.Item>
          </List>
        </Paper>

        {/* Project Info */}
        <Paper
          radius="lg"
          p="xl"
          style={{
            background: 'rgba(26,27,30,0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Stack align="center" gap="md">
            <Title order={2}>Open Source Projekt</Title>
            <Text ta="center" size="lg" maw={600}>
              Dieses Projekt wurde von der LostGames Community entwickelt und ist Open Source. 
              Verbesserungsvorschläge sind immer willkommen!
            </Text>
            <Group mt="md">
              <Button
                component="a"
                href="https://github.com/Lgsarius/LeagueTracker"
                target="_blank"
                leftSection={<IconBrandGithub size={18} />}
                variant="gradient"
                gradient={{ from: 'gray', to: 'dark' }}
                size="lg"
              >
                GitHub Repository
              </Button>
            </Group>
          </Stack>
        </Paper>

        {/* Back to Home Button */}
        <Group justify="center" mt={50}>
          <Button
            component={Link}
            href="/"
            variant="subtle"
            size="lg"
            leftSection={<IconHeartFilled size={18} />}
          >
            Zurück zum Tracker
          </Button>
        </Group>
      </Container>
    </motion.div>
  );
} 