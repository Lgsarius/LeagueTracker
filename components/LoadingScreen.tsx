import { Center, Title, Stack } from '@mantine/core';
import { motion } from 'framer-motion';
import Image from 'next/image';

export function LoadingScreen() {
  return (
    <Center 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(to bottom, #1a1b1e, #141517)',
        zIndex: 9999 
      }}
    >
      <Stack align="center" gap="xl">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            ease: "easeOut"
          }}
        >
          <Image
            src="/LOGO.png"
            alt="LostGames Logo"
            width={120}
            height={120}
            style={{
              borderRadius: '50%',
              boxShadow: '0 0 30px rgba(0,0,0,0.3)',
            }}
          />
        </motion.div>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.3,
            duration: 0.5,
            ease: "easeOut"
          }}
        >
          <Title
            order={1}
            size={36}
            fw={900}
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan' }}
          >
            LostGames LoL Tracker
          </Title>
        </motion.div>
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.5,
            duration: 0.5,
            ease: "easeOut"
          }}
        >
          <div style={{ position: 'relative', width: '50px', height: '50px' }}>
            <motion.div
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                border: '3px solid rgba(255,255,255,0.1)',
                borderTopColor: 'var(--mantine-color-blue-5)',
                borderRadius: '50%',
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            />
          </div>
        </motion.div>
      </Stack>
    </Center>
  );
} 