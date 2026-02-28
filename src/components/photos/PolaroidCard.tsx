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
  isClicked?: boolean
  isThumbnail?: boolean
}

const polaroidVariants: Record<PolaroidVariant, string> = {
  // Keep variant for future metadata support, but don't lock height.
  // Preview cards should adapt to the real photo aspect ratio.
  '1x1': 'w-20 aspect-square',
  '4x5': 'w-20 aspect-[4/5]',
  '4x3': 'w-20 aspect-[4/3]',
  '9x16': 'w-20 aspect-[9/16]',
}

const PolaroidCard: React.FC<Props> = ({
  photo,
  index,
  totalPhotos,
  rotation,
  variant,
  isVisible,
  isClicked = false,
  isThumbnail = false,
}) => {
  const baseZIndex = totalPhotos - index
  const moveDistance = index === 0 ? 0 : 25

  const imgSrc = photo.src

  return (
    <motion.div
      className={cn(
        'relative inline-block max-w-[70vw] cursor-pointer',
        isThumbnail
          ? 'border border-gray-200 bg-white p-1 sm:p-1.5'
          : 'border border-gray-200 bg-white p-1 shadow-lg transition-shadow duration-300 hover:shadow-xl sm:p-1.5',
        polaroidVariants[variant],
        // Larger cards look better with less overlap (for main stack only).
        !isThumbnail && '-ml-4 -mt-2 sm:-ml-5 sm:-mt-3',
      )}
      style={{
        zIndex: isClicked ? -1 : baseZIndex,
        willChange: 'transform,opacity',
      }}
      initial="hidden"
      animate={isClicked ? 'clicked' : isVisible ? 'show' : 'hidden'}
      variants={{
        hidden: { scale: 0, rotate: 0, x: -60, zIndex: totalPhotos - index },
        show: { scale: 1, rotate: rotation, x: 0 },
        clicked: {
          scale: 1,
          rotate: rotation,
          x: 0,
          transition: { duration: 0.1 },
        },
      }}
      viewport={{ once: true }}
      transition={{
        type: 'spring',
        stiffness: 360,
        damping: 20,
        delay: index * 0.05,
        duration: 0.8,
      }}
      whileHover={
        isClicked
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
      <div className="w-full overflow-hidden bg-gray-100">
        <img
          src={imgSrc}
          className="block h-auto w-full object-contain"
          loading="lazy"
          decoding="async"
          alt={photo.alt}
        />
      </div>
    </motion.div>
  )
}

export default PolaroidCard

