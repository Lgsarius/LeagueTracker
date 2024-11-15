/* eslint-disable */
import { Container, Title, Text, Button, Group, Box, Stack } from '@mantine/core';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { IconArrowLeft } from '@tabler/icons-react';

// You also need to define these variants that are used in the code
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const floatingAnimation = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export default function NotFound() {
  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at center, #1a1b1e 0%, #141517 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background elements */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          zIndex: 0,
        }}
      >
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: Math.random() * 3 + 1,
              height: Math.random() * 3 + 1,
              background: 'rgba(52, 152, 219, 0.2)',
              borderRadius: '50%',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
            }}
            animate={{
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </Box>

      <Container 
        size="md" 
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Stack align="center" gap={40}>
            <motion.div
              variants={floatingAnimation}
              animate="animate"
              style={{
                filter: 'drop-shadow(0 0 30px rgba(52, 152, 219, 0.3))',
              }}
            >
              <Box
                style={{
                  position: 'relative',
                  width: 280,
                  height: 280,
                }}
              >
                <Image
                  src="/amumu-sad.png"
                  alt="Sad Champion"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </Box>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Title
                order={1}
                size={100}
                fw={900}
                style={{
                  background: 'linear-gradient(135deg, #ff4b4b 0%, #ff9f9f 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textShadow: '0 0 40px rgba(255, 75, 75, 0.3)',
                  textAlign: 'center',
                }}
              >
                404
              </Title>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Title
                order={2}
                style={{
                  fontSize: '2.5rem',
                  background: 'linear-gradient(135deg, #3498db 0%, #2ecc71 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  textAlign: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                Minions haben diese Seite zerstört!
              </Title>

              <Text 
                size="xl" 
                c="dimmed"
                ta="center"
                maw={600}
                mx="auto"
                style={{ lineHeight: 1.6 }}
              >
                Sieht aus, als wärst du in den Fog of War gelaufen. 
                Diese Seite wurde von Baron Nashor verschlungen.
              </Text>
            </motion.div>

            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                component={Link}
                href="/"
                size="xl"
                variant="gradient"
                gradient={{ 
                  from: 'rgba(52, 152, 219, 1)', 
                  to: 'rgba(46, 204, 113, 1)',
                  deg: 135,
                }}
                leftSection={<IconArrowLeft size={20} />}
                styles={{
                  root: {
                    padding: '0 2rem',
                    height: '3.5rem',
                    fontSize: '1.1rem',
                    boxShadow: '0 0 30px rgba(52, 152, 219, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    '&:hover': {
                      boxShadow: '0 0 40px rgba(52, 152, 219, 0.4)',
                    },
                  },
                }}
              >
                Zurück zur Base
              </Button>
            </motion.div>
          </Stack>
        </motion.div>
      </Container>
    </Box>
  );
} 