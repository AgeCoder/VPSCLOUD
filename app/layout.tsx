import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import BackendCheckWrapper from '@/components/BackendCheckWrapper'

export const metadata: Metadata = {
  title: 'VPSCLOUD',
  description: 'VPSCLOUD',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange

        >
          <BackendCheckWrapper>
            {children}
          </BackendCheckWrapper>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
