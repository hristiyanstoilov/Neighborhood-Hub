import Image from 'next/image'

interface LogoProps {
  variant?: 'light' | 'dark' | 'icon-round' | 'icon-dark'
  height?: number
  className?: string
}

export default function Logo({ variant = 'light', height = 36, className = '' }: LogoProps) {
  const configs = {
    'light':      { src: '/logo-light.png',  width: Math.round(height * 3.2), alt: 'Neighborhood Hub' },
    'dark':       { src: '/splash-dark.png', width: Math.round(height * 0.56), alt: 'Neighborhood Hub' },
    'icon-round': { src: '/icon-round.png',  width: height, alt: 'Neighborhood Hub icon' },
    'icon-dark':  { src: '/icon-dark.png',   width: height, alt: 'Neighborhood Hub icon' },
  }

  const { src, width, alt } = configs[variant]

  return (
    <Image
      src={src}
      width={width}
      height={height}
      alt={alt}
      className={className}
      priority
    />
  )
}
