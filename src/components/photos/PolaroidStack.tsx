import React from 'react'
import { motion, useInView } from 'motion/react'
import type { Photo } from '@/lib/photos'
import { cn } from '@/lib/utils'
import PolaroidCard from './PolaroidCard'
import PhotoGalleryModal from './PhotoGalleryModal'

interface Props {
  photos: Photo[]
  title: string
  description?: string
  className?: string
}

const generateRotations = (count: number) =>
  Array.from({ length: count }, () => Math.random() * 20 - 10)

const PREVIEW_PHOTO_LIMIT = 12
const MODAL_UNMOUNT_DELAY = 260

const PolaroidStack: React.FC<Props> = ({ photos, title, description, className }) => {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const isInView = useInView(ref, { once: true, amount: 0.4 })
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [shouldRenderModal, setShouldRenderModal] = React.useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = React.useState(0)
  const [enableHoverEffects, setEnableHoverEffects] = React.useState(false)
  const [isReady, setIsReady] = React.useState(false)
  const closeTimerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    // 延迟入场动画，避开 View Transitions 和同时水合的高峰期
    const timer = setTimeout(() => setIsReady(true), 350)
    
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)')
    setEnableHoverEffects(mediaQuery.matches)
    const listener = (e: MediaQueryListEvent) => setEnableHoverEffects(e.matches)
    mediaQuery.addEventListener('change', listener)
    
    return () => {
      clearTimeout(timer)
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
      }
      mediaQuery.removeEventListener('change', listener)
    }
  }, [])

  const photoRotations = React.useMemo(() => generateRotations(photos.length), [photos.length])
  const previewPhotos = React.useMemo(() => photos.slice(0, PREVIEW_PHOTO_LIMIT), [photos])
  const hiddenPhotoCount = photos.length - previewPhotos.length

  const handlePhotoClick = (index: number) => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }

    setSelectedPhotoIndex(index)
    setShouldRenderModal(true)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    closeTimerRef.current = window.setTimeout(() => {
      setShouldRenderModal(false)
      closeTimerRef.current = null
    }, MODAL_UNMOUNT_DELAY)
  }

  return (
    <>
      <motion.div
        ref={ref}
        className={cn('perspective-1000 flex flex-wrap items-start pt-2 sm:pt-3', className)}
        style={{ contain: 'layout' }}
      >
        {previewPhotos.map((photo, index) => (
          <div key={`${photo.src}-${index}`} onClick={() => handlePhotoClick(index)}>
            <PolaroidCard
              photo={photo}
              index={index}
              totalPhotos={photos.length}
              rotation={photoRotations[index]}
              variant={photo.variant}
              isVisible={isInView && isReady}
              enableHoverEffects={enableHoverEffects}
            />
          </div>
        ))}

        {hiddenPhotoCount > 0 && (
          <motion.button
            type="button"
            className={cn(
              'relative -ml-4 -mt-2 inline-flex h-24 w-20 max-w-[70vw] cursor-pointer items-center justify-center border border-dashed border-gray-300 bg-white p-1 text-sm font-semibold text-muted-foreground shadow-lg transition-colors hover:text-foreground sm:-ml-5 sm:-mt-3 sm:h-[7.5rem] sm:w-25 sm:p-1.5',
              enableHoverEffects && 'hover:bg-accent',
            )}
            style={{
              zIndex: 0,
              contain: 'layout',
            }}
            initial="hidden"
            animate={isInView && isReady ? 'show' : 'hidden'}
            variants={{
              hidden: { opacity: 0, scale: 0.8, rotate: 0, x: -20 },
              show: { opacity: 1, scale: 1, rotate: 4, x: 0 },
            }}
            transition={{
              type: 'tween',
              ease: 'easeOut',
              delay: Math.min(previewPhotos.length * 0.03, 0.8),
              duration: 0.4,
            }}
            onClick={() => handlePhotoClick(previewPhotos.length)}
            aria-label={`Open ${hiddenPhotoCount} more photos`}
          >
            +{hiddenPhotoCount}
          </motion.button>
        )}
      </motion.div>

      {shouldRenderModal && (
        <PhotoGalleryModal
          photos={photos}
          title={title}
          description={description}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          initialIndex={selectedPhotoIndex}
        />
      )}
    </>
  )
}

export default PolaroidStack

