import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ArtifyAI - AI Image Generation Platform',
  description: 'Transform your imagination into reality with AI-powered image generation',
  keywords: ['AI', 'Image Generation', 'Stable Diffusion', 'Art', 'Creative'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
