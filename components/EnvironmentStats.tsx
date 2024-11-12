'use client';
/* eslint-disable */

import { Group, Paper, Text, Tooltip, Badge, Stack, RingProgress, Center, Modal, Grid, ThemeIcon, SimpleGrid, Button } from '@mantine/core';
import { IconWind, IconSun, IconCloud, IconCloudFog, IconMask, IconAlertTriangle, IconCloudStorm, IconTemperature, IconDroplet, IconSunHigh, IconMoonStars, IconArrowUpRight, IconArrowDownRight, IconEye, IconGauge } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Add your API key as an environment variable in .env.local
const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

type AirQualityData = {
  city: string;
  aqi: number;
  status: string;
  color: string;
  icon: any;
};

type SolarData = {
  currentProduction: number;
  dailyTotal: number;
};

interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
  isNight: boolean;
  details: {
    feels_like: number;
    humidity: number;
    wind_speed: number;
    wind_direction: number;
    pressure: number;
    visibility: number;
    air_quality: {
      index: number;
      components: {
        pm2_5: number;
        pm10: number;
        no2: number;
      };
    };
    sunrise: Date;
    sunset: Date;
    daily: Array<{
      date: Date;
      temp_max: number;
      temp_min: number;
      icon: string;
      description: string;
      precipitation: number;
    }>;
  };
}

// City coordinates
const CITIES = {
  Kassel: { lat: 51.3127, lon: 9.4797 },
  Wien: { lat: 48.2082, lon: 16.3719 },
  Würzburg: { lat: 49.7913, lon: 9.9534 },
  München: { lat: 48.1351, lon: 11.5820 },
  Passau: { lat: 48.5667, lon: 13.4667 }
};

const getAqiColorScheme = (aqi: number) => {
  if (aqi <= 50) return {
    color: 'green',
    gradient: ['#98FB98', '#32CD32'],
    label: 'Sehr gut',
    icon: IconWind
  };
  if (aqi <= 100) return {
    color: 'yellow',
    gradient: ['#FFEB3B', '#FFC107'],
    label: 'Gut',
    icon: IconCloud
  };
  if (aqi <= 150) return {
    color: 'orange',
    gradient: ['#FFB74D', '#FF9800'],
    label: 'Mäßig',
    icon: IconCloudFog
  };
  if (aqi <= 200) return {
    color: 'red',
    gradient: ['#FF7043', '#FF5722'],
    label: 'Schlecht',
    icon: IconMask
  };
  return {
    color: 'grape',
    gradient: ['#B388FF', '#7C4DFF'],
    label: 'Sehr schlecht',
    icon: IconCloudStorm
  };
};

const SolarIndicator = ({ data }: { data: SolarData }) => {
  const maxCapacity = 100000; // Example max capacity in MW
  const currentPercentage = (data.currentProduction / maxCapacity) * 100;

  return (
    <Tooltip
      label={
        <Stack gap={4}>
          <Text size="sm" fw={500}>Solarenergie Deutschland</Text>
          <Text size="xs">Aktuelle Produktion: {(data.currentProduction / 1000).toFixed(1)} GW</Text>
          <Text size="xs">Heute gesamt: {(data.dailyTotal / 1000).toFixed(1)} GWh</Text>
        </Stack>
      }
    >
      <Paper
        p="xs"
        style={{
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          cursor: 'help',
        }}
      >
        <Stack gap={4} align="center">
          <RingProgress
            size={46}
            thickness={4}
            roundCaps
            sections={[{ 
              value: currentPercentage, 
              color: 'yellow'
            }]}
            label={
              <Center>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  <IconSun size={20} style={{ color: '#FFD700' }} />
                </motion.div>
              </Center>
            }
          />
          <Text size="xs" fw={500} c="yellow">
            {(data.currentProduction / 1000).toFixed(1)} GW
          </Text>
        </Stack>
      </Paper>
    </Tooltip>
  );
};

// Helper function to determine if it's currently night time
const isNightTime = () => {
  const now = new Date();
  const hour = now.getHours();
  return hour >= 20 || hour < 6; // Night time between 8 PM and 6 AM
};

const MoonIcon = () => (
  <div style={{ 
    position: 'relative',
    width: 80,
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    {/* Stars */}
    <motion.div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
      }}
      animate={{
        opacity: [0.4, 0.8, 0.4],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            width: 2,
            height: 2,
            background: '#fff',
            borderRadius: '50%',
            top: `${20 + (i * 15)}%`,
            left: `${15 + (i * 20)}%`,
            boxShadow: '0 0 4px #fff',
          }}
          animate={{
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 1.5,
            delay: i * 0.3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </motion.div>

    {/* Moon */}
    <motion.div
      animate={{
        rotate: [-2, 2, -2],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <svg
        width="80"
        height="80"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: `
            drop-shadow(0 0 5px rgba(255, 215, 0, 0.3))
            drop-shadow(0 0 10px rgba(255, 215, 0, 0.2))
          `
        }}
      >
        <path
          d="M12 3C8.26015 3 5.0387 4.94932 3.23969 7.82C2.835 8.47667 3.50375 9.23583 4.25239 8.97432C4.87402 8.75744 5.52659 8.62517 6.20137 8.58851C9.88516 8.35902 13.0731 11.1667 13.3026 14.8505C13.4038 16.4779 12.8922 18.0053 11.9801 19.2403C11.4096 20.0159 11.9379 21.1194 12.8849 21.0124C18.9847 20.3427 23.2706 14.9662 22.6009 8.86646C22.0156 3.5874 17.2792 -0.148512 12 3.05176e-05V3Z"
          fill="url(#moon-gradient)"
        />
        <defs>
          <linearGradient
            id="moon-gradient"
            x1="3"
            y1="3"
            x2="19"
            y2="21"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFE082" />
            <stop offset="100%" stopColor="#FFB300" />
          </linearGradient>
        </defs>
      </svg>
    </motion.div>
  </div>
);

// Update the getWeatherIcon function
const getWeatherIcon = (data: WeatherData, isNight: boolean) => {
  if (isNight && data.condition.includes('clear')) {
    return <MoonIcon />;
  }
  
  return (
    <img 
      src={`https://openweathermap.org/img/wn/${data.icon}@2x.png`}
      alt={data.condition}
      style={{ 
        width: 80,
        height: 80,
        filter: 'brightness(1.2)',
      }}
    />
  );
};

// Helper functions
const getAirQualityDescription = (aqi: number) => {
  switch (aqi) {
    case 1:
      return { text: 'Sehr gut', color: 'teal' };
    case 2:
      return { text: 'Gut', color: 'green' };
    case 3:
      return { text: 'Mäßig', color: 'yellow' };
    case 4:
      return { text: 'Schlecht', color: 'orange' };
    case 5:
      return { text: 'Sehr schlecht', color: 'red' };
    default:
      return { text: 'Keine Daten', color: 'gray' };
  }
};

const getWindDirection = (degrees: number) => {
  const directions = ['N', 'NO', 'O', 'SO', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

// Weather Modal Component
const WeatherModal = ({ opened, onClose, city, data }: { 
  opened: boolean;
  onClose: () => void;
  city: string;
  data: WeatherData;
}) => {
  if (!data?.details) return null;
  
  const isNight = isNightTime();
  const airQuality = data.details.air_quality ? 
    getAirQualityDescription(data.details.air_quality.index) : 
    { text: 'Keine Daten', color: 'gray' };

  // Helper function to safely format numbers
  const formatNumber = (value: number | undefined | null, decimals = 1) => {
    if (value == null) return 'N/A';
    return value.toFixed(decimals);
  };

  // Dynamic background patterns
  const getNightBackground = () => ({
    background: `
      linear-gradient(to bottom, 
        #0d1b3e,
        #000428
      )
    `,
    backgroundImage: `
      radial-gradient(1px 1px at 20% 30%, #ffffff55 0%, transparent 0%),
      radial-gradient(1px 1px at 40% 70%, #ffffff44 0%, transparent 0%),
      radial-gradient(1px 1px at 60% 20%, #ffffff44 0%, transparent 0%),
      radial-gradient(1px 1px at 80% 40%, #ffffff33 0%, transparent 0%),
      radial-gradient(2px 2px at 15% 65%, #ffffff33 0%, transparent 0%),
      radial-gradient(2px 2px at 35% 25%, #ffffff22 0%, transparent 0%),
      radial-gradient(2px 2px at 55% 45%, #ffffff22 0%, transparent 0%),
      radial-gradient(2px 2px at 75% 85%, #ffffff22 0%, transparent 0%),
      linear-gradient(to bottom, 
        #0d1b3e,
        #000428
      )
    `,
  });

  const getDayBackground = () => ({
    background: data.condition.includes('cloud') || data.condition.includes('rain')
      ? `
        linear-gradient(to bottom, 
          #546e7a,
          #37474f
        )
      `
      : `
        linear-gradient(to bottom, 
          #64b5f6,
          #1976d2
        )
      `,
    backgroundImage: data.condition.includes('cloud') || data.condition.includes('rain')
      ? `
        linear-gradient(to bottom, 
          #546e7a,
          #37474f
        )
      `
      : `
        radial-gradient(circle at 50% -20%, #ffeb3b99 0%, transparent 35%),
        linear-gradient(to bottom, 
          #64b5f6,
          #1976d2
        )
      `,
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      padding={0}
      radius="md"
      centered
      overlayProps={{
        blur: 3,
        opacity: 0.55,
      }}
      styles={{
        content: {
          background: 'transparent',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        header: {
          display: 'none',
        },
        body: {
          padding: 0,
        }
      }}
    >
      <div style={{ 
        ...(isNight ? getNightBackground() : getDayBackground()),
        borderRadius: 'inherit',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Close button */}
        <Button
          variant="subtle"
          color="gray"
          radius="xl"
          size="sm"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(4px)',
            padding: '4px 12px',
            height: '32px',
            minHeight: 'unset',
          }}
        >
          ✕
        </Button>

        {/* Header Section */}
        <div style={{ padding: '24px' }}>
          <Group justify="space-between" style={{ paddingRight: '40px' }}>
            <Stack gap={0}>
              <Text size="xl" fw={700} c="white">
                {city}
              </Text>
              <Text size="sm" c="gray.3">
                {new Date().toLocaleDateString('de-DE', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </Stack>
            <Text size="48px" fw={700} c="white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
              {data.temp?.toFixed(0) ?? 'N/A'}°
            </Text>
          </Group>

          <Group mt="xl" justify="space-between">
            <Stack gap={4}>
              <Text size="lg" tt="capitalize" c="white">
                {data.condition}
              </Text>
             
            </Stack>
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotate: isNight ? [0, 5, 0] : [0, 360, 0],
              }}
              transition={{
                duration: isNight ? 4 : 20,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {getWeatherIcon(data, isNight)}
            </motion.div>
          </Group>
        </div>

      

   

        {/* Forecast Section */}
        {data.details.daily && data.details.daily.length > 0 && (
          <Paper p="md" radius={0}>
            <Text size="sm" fw={500} c="dimmed" mb="md">5-Tage Vorhersage</Text>
            <SimpleGrid cols={5}>
              {data.details.daily.map((day, index) => (
                <Paper
                  key={index}
                  p="xs"
                  radius="md"
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Stack gap={4} align="center">
                    <Text size="xs" c="dimmed">
                      {day.date?.toLocaleDateString('de-DE', { weekday: 'short' }) ?? 'N/A'}
                    </Text>
                    <img 
                      src={`https://openweathermap.org/img/wn/${day.icon}.png`}
                      alt={day.description}
                      style={{ width: 40, height: 40 }}
                    />
                    <Group gap={4} justify="center">
                      <Text size="sm" fw={500} c="white">
                        {day.temp_max?.toFixed(0) ?? 'N/A'}°
                      </Text>
                      <Text size="xs" c="dimmed">
                        {day.temp_min?.toFixed(0) ?? 'N/A'}°
                      </Text>
                    </Group>
                    {day.precipitation > 0 && (
                      <Text size="xs" c="blue.4">
                        {(day.precipitation * 100)?.toFixed(0)}%
                      </Text>
                    )}
                  </Stack>
                </Paper>
              ))}
            </SimpleGrid>
          </Paper>
        )}
      </div>
    </Modal>
  );
};

// Update WeatherStat to handle undefined values
const WeatherStat = ({ 
  icon: Icon, 
  label, 
  value = 'N/A', 
  detail = '',
  color = 'gray' 
}: { 
  icon: any; 
  label: string; 
  value?: string;
  detail?: string;
  color?: string;
}) => (
  <Tooltip label={detail}>
    <Stack gap={4} align="center">
      <ThemeIcon 
        size={40} 
        radius="md"
        variant="light"
        color={color}
        style={{ background: 'rgba(255, 255, 255, 0.1)' }}
      >
        <Icon size={20} />
      </ThemeIcon>
      <Text size="xs" c="dimmed">{label}</Text>
      <Text size="sm" fw={500} c="white">{value}</Text>
    </Stack>
  </Tooltip>
);

async function fetchSolarData(): Promise<SolarData> {
  try {
    // Get current timestamp and format it for SMARD API
    const now = new Date();
    const timestamp = Math.floor(now.getTime() / 1000);
    
    // SMARD API requires specific filter parameters
    const response = await fetch(
      `https://www.smard.de/app/chart_data/1223/DE/${timestamp}/1223_DE_quarter_hour.json`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Get the most recent data point
    const latestData = data.series[data.series.length - 1];
    
    // Calculate daily total (sum of last 96 quarter-hour values = 24 hours)
    const last24Hours = data.series.slice(-96);
    const dailyTotal = last24Hours.reduce((sum: number, point: any) => sum + (point[1] || 0), 0) / 4; // Divide by 4 to convert quarter-hour values to hourly

    return {
      currentProduction: latestData[1] || 0,
      dailyTotal: dailyTotal
    };
  } catch (error) {
    console.error('Error fetching solar data:', error);
    return {
      currentProduction: 0,
      dailyTotal: 0
    };
  }
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  if (!OPENWEATHER_API_KEY) {
    throw new Error('OpenWeather API key is missing');
  }

  try {
    const [currentResponse, forecastResponse, airQualityResponse] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`
      )
    ]);
    
    if (!currentResponse.ok || !forecastResponse.ok || !airQualityResponse.ok) {
      throw new Error(`HTTP error!`);
    }
    
    const [currentData, forecastData, airQualityData] = await Promise.all([
      currentResponse.json(),
      forecastResponse.json(),
      airQualityResponse.json()
    ]);

    const now = new Date();
    const sunrise = new Date(currentData.sys.sunrise * 1000);
    const sunset = new Date(currentData.sys.sunset * 1000);

    return {
      temp: currentData.main.temp,
      condition: currentData.weather[0].description,
      icon: currentData.weather[0].icon,
      isNight: now < sunrise || now > sunset,
      details: {
        feels_like: currentData.main.feels_like,
        humidity: currentData.main.humidity,
        wind_speed: Math.round(currentData.wind.speed * 3.6), // Convert to km/h
        wind_direction: currentData.wind.deg,
        pressure: currentData.main.pressure,
        visibility: Math.round(currentData.visibility / 1000), // Convert to km
        air_quality: airQualityData.list[0] && {
          index: Number(airQualityData.list[0].main.aqi),
          components: {
            pm2_5: Number(airQualityData.list[0].components.pm2_5),
            pm10: Number(airQualityData.list[0].components.pm10),
            no2: Number(airQualityData.list[0].components.no2)
          }
        },
        sunrise,
        sunset,
        daily: forecastData.list
          .filter((item: any) => {
            const date = new Date(item.dt * 1000);
            return date.getHours() === 12; // Get only noon forecasts
          })
          .slice(0, 7)
          .map((day: any) => ({
            date: new Date(day.dt * 1000),
            temp_max: day.main.temp_max,
            temp_min: day.main.temp_min,
            icon: day.weather[0].icon,
            description: day.weather[0].description,
            precipitation: day.pop || 0
          }))
      }
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw error;
  }
}

// WeatherIndicator Component
const WeatherIndicator = ({ city, data }: { city: string; data: WeatherData }) => {
  const [showModal, setShowModal] = useState(false);
  const isNight = isNightTime();

  const SmallMoonIcon = () => (
    <div style={{ 
      position: 'relative',
      width: 46,
      height: 46,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Small stars */}
      <motion.div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
        }}
        animate={{
          opacity: [0.4, 0.8, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: 1,
              height: 1,
              background: '#fff',
              borderRadius: '50%',
              top: `${30 + (i * 20)}%`,
              left: `${20 + (i * 30)}%`,
              boxShadow: '0 0 2px #fff',
            }}
            animate={{
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 1.5,
              delay: i * 0.3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.div>

      {/* Small moon */}
      <motion.div
        animate={{
          rotate: [-2, 2, -2],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <svg
          width="46"
          height="46"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: `
              drop-shadow(0 0 3px rgba(255, 215, 0, 0.3))
              drop-shadow(0 0 6px rgba(255, 215, 0, 0.2))
            `
          }}
        >
          <path
            d="M12 3C8.26015 3 5.0387 4.94932 3.23969 7.82C2.835 8.47667 3.50375 9.23583 4.25239 8.97432C4.87402 8.75744 5.52659 8.62517 6.20137 8.58851C9.88516 8.35902 13.0731 11.1667 13.3026 14.8505C13.4038 16.4779 12.8922 18.0053 11.9801 19.2403C11.4096 20.0159 11.9379 21.1194 12.8849 21.0124C18.9847 20.3427 23.2706 14.9662 22.6009 8.86646C22.0156 3.5874 17.2792 -0.148512 12 3.05176e-05V3Z"
            fill="url(#moon-gradient-small)"
          />
          <defs>
            <linearGradient
              id="moon-gradient-small"
              x1="3"
              y1="3"
              x2="19"
              y2="21"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FFE082" />
              <stop offset="100%" stopColor="#FFB300" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>
    </div>
  );

  return (
    <>
      <Paper
        p="xs"
        style={{
          background: isNight ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.2)',
          borderRadius: '8px',
          cursor: 'pointer',
        }}
        onClick={() => setShowModal(true)}
      >
        <Stack gap={4} align="center">
          {isNight && data.condition.includes('clear') ? (
            <SmallMoonIcon />
          ) : (
            <img 
              src={`https://openweathermap.org/img/wn/${data.icon}@2x.png`}
              alt={data.condition}
              style={{ 
                width: 46,
                height: 46,
                filter: 'brightness(1.2)',
              }}
            />
          )}
          <Text size="xs" fw={500} style={{ color: `var(--mantine-color-gray-4)` }}>
            {city}
          </Text>
          <Text size="xs" fw={500} c="dimmed">
            {data.temp?.toFixed(0) ?? 'N/A'}°
          </Text>
        </Stack>
      </Paper>

      <WeatherModal
        opened={showModal}
        onClose={() => setShowModal(false)}
        city={city}
        data={data}
      />
    </>
  );
};

// Main EnvironmentStats Component
export function EnvironmentStats() {
  const [weatherData, setWeatherData] = useState<{ [city: string]: WeatherData }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!OPENWEATHER_API_KEY) {
        console.error('OpenWeather API key is missing');
        setError('API-Schlüssel fehlt');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const weatherPromises = Object.entries(CITIES).map(async ([city, coords]) => {
          try {
            const [currentResponse, forecastResponse] = await Promise.all([
              fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&lang=de&appid=${OPENWEATHER_API_KEY}`),
              fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&lang=de&appid=${OPENWEATHER_API_KEY}`)
            ]);

            if (!currentResponse.ok || !forecastResponse.ok) {
              throw new Error(`HTTP error! status: ${currentResponse.status}`);
            }

            const currentData = await currentResponse.json();
            const forecastData = await forecastResponse.json();

            return {
              city,
              data: {
                temp: currentData.main.temp,
                feels_like: currentData.main.feels_like,
                humidity: currentData.main.humidity,
                wind_speed: (currentData.wind.speed * 3.6).toFixed(1),
                condition: currentData.weather[0].description,
                icon: currentData.weather[0].icon,
                isNight: false, // We'll calculate this
                details: {
                  daily: forecastData.list
                    .filter((item: any, index: number) => index % 8 === 0)
                    .slice(0, 7)
                    .map((day: any) => ({
                      date: new Date(day.dt * 1000),
                      temp_max: day.main.temp_max,
                      temp_min: day.main.temp_min,
                      icon: day.weather[0].icon,
                      description: day.weather[0].description,
                      precipitation: day.pop || 0
                    }))
                }
              }
            };
          } catch (error) {
            console.error(`Error fetching weather for ${city}:`, error);
            return { city, error: true };
          }
        });

        const results = await Promise.all(weatherPromises);
        const weatherMap = results.reduce<{ [city: string]: WeatherData }>((acc, result) => {
          if ('error' in result) return acc;
          acc[result.city] = {
            ...result.data,
            details: {
              feels_like: result.data.feels_like,
              humidity: result.data.humidity, 
              wind_speed: parseFloat(result.data.wind_speed),
              wind_direction: 0, // Default value since not provided in API response
              pressure: 0, // Default value since not provided in API response
              visibility: 0, // Default value since not provided in API response
              air_quality: {
                index: 0,
                components: {
                  pm2_5: 0,
                  pm10: 0,
                  no2: 0
                }
              },
              sunrise: new Date(), // Default value since not provided in API response
              sunset: new Date(), // Default value since not provided in API response
              daily: result.data.details.daily
            }
          };
          return acc;
        }, {});

        setWeatherData(weatherMap);
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setError('Fehler beim Laden der Wetterdaten');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 300000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Paper p="xs" style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
        <Text size="sm" c="dimmed">Lade Wetterdaten...</Text>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper p="xs" style={{ background: 'rgba(0, 0, 0, 0.2)', borderRadius: '8px' }}>
        <Tooltip label={error}>
          <Text size="sm" c="red">Wetterdaten nicht verfügbar</Text>
        </Tooltip>
      </Paper>
    );
  }

  return (
    <Group gap="xs">
      {Object.entries(CITIES).map(([city]) => (
        weatherData[city] && (
          <WeatherIndicator
            key={city}
            city={city}
            data={weatherData[city]}
          />
        )
      ))}
    </Group>
  );
} 