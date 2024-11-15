'use client';
/* eslint-disable */
import { Container, Title, Text, Stack, Paper } from '@mantine/core';

export default function DatenschutzPage() {
  return (
    <Container size="lg" py="xl">
      <Paper p="xl" radius="lg">
        <Stack>
          <Title>Datenschutzerklärung</Title>
          <Text>Stand: {new Date().toLocaleDateString()}</Text>
          
          <Title order={2}>1. Datenschutz auf einen Blick</Title>
          <Text>
            Diese Datenschutzerklärung klärt Sie über die Art, den Umfang und 
            Zweck der Verarbeitung von personenbezogenen Daten innerhalb unseres 
            League Trackers auf.
          </Text>

          {/* Add more sections as needed */}
        </Stack>
      </Paper>
    </Container>
  );
} 