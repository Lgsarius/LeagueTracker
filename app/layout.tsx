import '@mantine/core/styles.css';
import { ColorSchemeScript, MantineProvider, AppShell } from '@mantine/core';
import { Footer } from '@/components/Footer';

const APP_URL = 'https://doppelbruch.baby/';
const APP_NAME = 'LostGames LoL Tracker';
const APP_DEFAULT_TITLE = 'LostGames LoL Tracker';
const APP_DESCRIPTION = 'Der LostGames LoL Tracker';

export const metadata = {
  metadataBase: new URL(APP_URL),
  applicationName: APP_NAME,
  title: APP_DEFAULT_TITLE,
  description: APP_DESCRIPTION,
  
  openGraph: {
    type: 'website',
    siteName: APP_NAME,
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
  },
  
  twitter: {
    card: 'summary',
    title: APP_DEFAULT_TITLE,
    description: APP_DESCRIPTION,
  },
  
  keywords: ['League of Legends', 'LoL Tracker', 'LostGames', 'Game Stats'],
  authors: [{ name: 'LostGames' }],
  creator: 'LostGames',
};

const theme = {
  primaryColor: 'blue',

  components: {
    Paper: {
      defaultProps: {
        radius: 'md',
        withBorder: true,
      },
    },
  },
  other: {
    transition: {
      default: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
        <link rel="icon" href="/LOGO.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body>
        <MantineProvider 
          theme={theme} 
          defaultColorScheme="dark"
          forceColorScheme="dark"
        >
          <AppShell
            bg="dark.8"
            style={{ minHeight: '100vh' }}
            footer={{ height: 60 }}
          >
            <main className="min-h-screen bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900">
              {children}
            </main>
            <Footer />
          </AppShell>
        </MantineProvider>
      </body>
    </html>
  );
}

// Optional: Add these styles to your global CSS
export const globalStyles = {
  'html, body': {
    margin: 0,
    padding: 0,
    minHeight: '100vh',
    scrollBehavior: 'smooth',
  },
  '*': {
    boxSizing: 'border-box',
  },
  'a': {
    color: 'inherit',
    textDecoration: 'none',
  },
  '.gradient-text': {
    background: 'linear-gradient(45deg, #3498db, #2ecc71)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  '.card-hover': {
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    },
  },
}; 