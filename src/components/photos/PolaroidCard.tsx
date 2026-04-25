import React from 'react'
import { motion } from 'motion/react'
import type { Photo, PolaroidVariant } from '@/lib/photos'
import { cn } from '@/lib/utils'

interface Props {
  photo: Photo
  index: number
  totalPhotos: number
  rotation: number
  variant: PolaroidVariant
  isVisible: boolean
  isThumbnail?: boolean
  enableHoverEffects?: boolean
}

const polaroidVariants: Record<PolaroidVariant, string> = {
  // Keep variant field for metadata compatibility.
  // Card height should follow real image aspect ratio to avoid uneven white borders.
  '1x1': 'w-20 sm:w-25',
  '4x5': 'w-20 sm:w-25',
  '4x3': 'w-20 sm:w-25',
  '9x16': 'w-20 sm:w-25',
}

const PolaroidCard: React.FC<Props> = ({
  photo,
  index,
  totalPhotos,
  rotation,
  variant,
  isVisible,
  isThumbnail = false,
  enableHoverEffects = false,
}) => {
  const baseZIndex = totalPhotos - index
  const moveDistance = index === 0 ? 0 : 25
  const thumbnailFrameClass = isThumbnail ? 'aspect-square' : 'aspect-[4/5]'

  const imgSrc = photo.src

  return (
    <motion.div
      className={cn(
        'relative inline-block max-w-[70vw] cursor-pointer',
        isThumbnail
          ? 'border border-gray-200 bg-white p-1 sm:p-1.5'
          : cn(
              'border border-gray-200 bg-white p-1 shadow-lg transition-shadow duration-300 sm:p-1.5',
              enableHoverEffects && 'hover:shadow-xl',
            ),
        polaroidVariants[variant],
        // Larger cards look better with less overlap (for main stack only).
        !isThumbnail && '-ml-4 -mt-2 sm:-ml-5 sm:-mt-3',
      )}
      style={{
        zIndex: baseZIndex,
        contain: 'layout',
      }}
      initial="hidden"
      animate={isVisible ? 'show' : 'hidden'}
      variants={{
        hidden: { opacity: 0, scale: 0.8, rotate: 0, x: -20, zIndex: totalPhotos - index },
        show: { opacity: 1, scale: 1, rotate: rotation, x: 0 },
      }}
      viewport={{ once: true }}
      transition={{
        type: 'tween',
        ease: 'easeOut',
        delay: Math.min(index * 0.03, 0.8), // 更短的最大延迟上限
        duration: 0.4,
      }}
      whileHover={
        !enableHoverEffects
          ? {}
          : {
              x: moveDistance,
              scale: 1.2,
              rotate: 0,
              transition: {
                type: 'tween',
                stiffness: 1360,
                damping: 20,
                duration: 0.1,
              },
            }
      }
    >
      <div className={cn('w-full overflow-hidden bg-gray-100', thumbnailFrameClass)}>
        <img
          src={imgSrc}
          width={photo.width}
          height={photo.height}
          className="block h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          alt={photo.alt}
        />
      </div>
    </motion.div>
  )
}

export default PolaroidCard

