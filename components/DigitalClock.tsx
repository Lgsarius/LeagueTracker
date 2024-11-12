'use client';

import { Paper, Text, Stack, Tooltip, Group } from '@mantine/core';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { IconCalendarEvent } from '@tabler/icons-react';

const CARD_STYLES = {
  border: '1px solid #ffffff10',
  backdropFilter: 'blur(8px)',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
};

const TIME_TEXT_STYLES = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
  letterSpacing: '-2px',
};

export function DigitalClock() {
  const [time, setTime] = useState(new Date());
  const [blinkColon, setBlinkColon] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    const blinkTimer = setInterval(() => {
      setBlinkColon(prev => !prev);
    }, 500);

    return () => {
      clearInterval(timer);
      clearInterval(blinkTimer);
    };
  }, []);

  const formatTimeUnit = (unit: number) => unit.toString().padStart(2, '0');
  const hours = formatTimeUnit(time.getHours());
  const minutes = formatTimeUnit(time.getMinutes());
  const seconds = formatTimeUnit(time.getSeconds());

  // Get date information in German
  const dayName = time.toLocaleDateString('de-DE', { weekday: 'long' });
  const monthDay = time.getDate();
  const month = time.toLocaleDateString('de-DE', { month: 'long' });

  return (
    <Stack align="center" gap={4} w="100%">
      {/* Date Display */}
      <Group gap={8} style={{ flexWrap: 'nowrap' }}>
        <IconCalendarEvent size={16} style={{ color: '#5c5f66' }} />
        <Text 
          size="sm" 
          c="dimmed" 
          fw={500}
          style={{ whiteSpace: 'nowrap' }}
        >
          {dayName}, {monthDay}. {month}
        </Text>
      </Group>

      {/* Time Display */}
      <Group gap={0} style={{ userSelect: 'none' }} justify="center" w="100%">
        {/* Hours */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Text 
            size="xl" 
            fw={700} 
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
            style={TIME_TEXT_STYLES}
          >
            {hours}
          </Text>
        </motion.div>

        {/* Blinking Colon */}
        <Text 
          size="xl"
          fw={700}
          style={{ 
            opacity: blinkColon ? 1 : 0.3,
            transition: 'opacity 0.2s',
            margin: '0 4px',
            fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
            color: '#5c5f66'
          }}
        >
          :
        </Text>

        {/* Minutes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Text 
            size="xl" 
            fw={700}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
            style={TIME_TEXT_STYLES}
          >
            {minutes}
          </Text>
        </motion.div>

        {/* Seconds */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ marginLeft: '8px', marginTop: '8px' }}
        >
          <Text 
            size="lg"
            c="dimmed"
            fw={500}
            style={{ 
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 'clamp(0.8rem, 3vw, 1.2rem)',
            }}
          >
            {seconds}
          </Text>
        </motion.div>
      </Group>

      {/* Week Information */}
      <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
        Woche {getWeekNumber(time)} • Tag {getDayOfYear(time)}
      </Text>
    </Stack>
  );
}

// Helper functions
function getWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
} 