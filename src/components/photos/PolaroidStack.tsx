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

const MODAL_UNMOUNT_DELAY = 260

const PolaroidStack: React.FC<Props> = ({
  photos,
  title,
  description,
  className,
}) => {
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
    const listener = (e: MediaQueryListEvent) =>
      setEnableHoverEffects(e.matches)
    mediaQuery.addEventListener('change', listener)

    return () => {
      clearTimeout(timer)
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
      }
      mediaQuery.removeEventListener('change', listener)
    }
  }, [])

  React.useEffect(() => {
    const timelineItem = ref.current?.closest(
      '.timeline-item',
    ) as HTMLElement | null

    if (!timelineItem) return

    if (shouldRenderModal) {
      timelineItem.dataset.galleryOpen = 'true'
    } else {
      delete timelineItem.dataset.galleryOpen
    }

    return () => {
      delete timelineItem.dataset.galleryOpen
    }
  }, [shouldRenderModal])

  const photoRotations = React.useMemo(
    () => generateRotations(photos.length),
    [photos.length],
  )
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
        className={cn(
          'perspective-1000 flex flex-wrap items-start pt-2 sm:pt-3',
          className,
        )}
        style={{ contain: 'layout' }}
      >
        {photos.map((photo, index) => (
          <div
            key={`${photo.src}-${index}`}
            onClick={() => handlePhotoClick(index)}
          >
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
