'use client';
/* eslint-disable */
import { Container, Title, Text, Stack, Paper } from '@mantine/core';

export default function ImpressumPage() {
  return (
    <Container size="lg" py="xl">
      <Paper p="xl" radius="lg">
        <Stack>
          <Title>Impressum</Title>
          
          <Title order={2}>Angaben gemäß § 5 TMG</Title>
          <Text>
            [Dein Name/Organisation]
            [Adresse]
            [Kontakt]
          </Text>

          <Title order={2}>Kontakt</Title>
          <Text>
            E-Mail: [deine-email]
            Discord: [discord-name]
          </Text>
        </Stack>
      </Paper>
    </Container>
  );
} 