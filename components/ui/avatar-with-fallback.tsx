'use client'

import { useState, useEffect } from 'react'

interface AvatarWithFallbackProps {
  polemicId?: number | null
  name: string
  className?: string
}

export function AvatarWithFallback({ polemicId, name, className }: AvatarWithFallbackProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const getTextSize = () => {
    if (className?.includes('h-8') || className?.includes('w-8')) {
      return 'text-xs'
    }
    if (className?.includes('h-16') || className?.includes('w-16') || className?.includes('h-20') || className?.includes('w-20')) {
      return 'text-lg'
    }
    return 'text-xl'
  }

  useEffect(() => {
    if (!polemicId) {
      setImageSrc(null)
      setImageLoaded(false)
      setImageError(false)
      return
    }

    // Сначала пытаемся PNG
    const primaryUrl = `https://polemicagame.com/images/avatar/real-photo/${polemicId}.png`
    console.log('Trying primary PNG avatar:', primaryUrl)

    setImageSrc(primaryUrl)
    setImageLoaded(false)
    setImageError(false)
  }, [polemicId])

  const handleImageLoad = () => {
    console.log('Avatar loaded successfully:', imageSrc)
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    console.log('Avatar failed to load:', imageSrc)

    if (imageSrc && imageSrc.includes('real-photo') && polemicId) {
      // Если PNG не загрузился, пробуем WEBP
      const fallbackUrl = `https://polemicagame.com/image/user-avatar?file_name=${polemicId}/avatar.webp`
      console.log('Trying fallback WEBP avatar:', fallbackUrl)
      setImageSrc(fallbackUrl)
      setImageError(false)
      setImageLoaded(false)
    } else {
      // Если и WEBP не загрузился, показываем fallback
      setImageError(true)
      setImageLoaded(false)
    }
  }

  if (!polemicId || (imageError && !imageSrc)) {
    return (
      <div className={`rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold ${className}`}>
        {name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {!imageLoaded && !imageError && imageSrc && (
        <div className="absolute inset-0 rounded-full bg-muted animate-pulse" />
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={name}
          className={`w-full h-full rounded-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  )
}
