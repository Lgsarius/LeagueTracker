import { MantineProvider, ColorSchemeScript } from '@mantine/core';
import '@mantine/core/styles.css';
import { Poppins } from 'next/font/google';

const poppins = Poppins({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
        <title>LostGames Lol</title>
        <meta name="viewport" content="minimum-scale=1, initial-scale=1, width=device-width" />
      </head>
      <body className={poppins.className}>
        <MantineProvider
          defaultColorScheme="dark"
          theme={{
            primaryColor: 'cyan',
            fontFamily: poppins.style.fontFamily,
            components: {
              AppShell: {
                styles: {
                  main: { 
                    background: 'linear-gradient(180deg, var(--mantine-color-dark-9) 0%, var(--mantine-color-dark-8) 100%)'
                  }
                }
              }
            }
          }}
        >
          {children}
        </MantineProvider>
      </body>
    </html>
  );
} 