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

const PolaroidStack: React.FC<Props> = ({ photos, title, description, className }) => {
  const ref = React.useRef<HTMLDivElement | null>(null)
  const isInView = useInView(ref, { once: true, amount: 0.4 })
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedPhotoIndex, setSelectedPhotoIndex] = React.useState(0)
  const [clickedPhotoIndex, setClickedPhotoIndex] = React.useState<number | null>(null)

  const photoRotations = React.useMemo(() => generateRotations(photos.length), [photos.length])

  const handlePhotoClick = (index: number) => {
    setClickedPhotoIndex(index)
    setSelectedPhotoIndex(index)
    setTimeout(() => {
      setIsModalOpen(true)
    }, 50)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setTimeout(() => {
      setClickedPhotoIndex(null)
    }, 200)
  }

  return (
    <>
      <motion.div
        ref={ref}
        className={cn('perspective-1000 flex flex-wrap items-start pt-2 sm:pt-3', className)}
        style={{ contain: 'layout' }}
      >
        {photos.map((photo, index) => (
          <div key={`${photo.src}-${index}`} onClick={() => handlePhotoClick(index)}>
            <PolaroidCard
              photo={photo}
              index={index}
              totalPhotos={photos.length}
              rotation={photoRotations[index]}
              variant={photo.variant}
              isVisible={isInView}
              isClicked={clickedPhotoIndex === index}
            />
          </div>
        ))}
      </motion.div>

      <PhotoGalleryModal
        photos={photos}
        title={title}
        description={description}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        initialIndex={selectedPhotoIndex}
      />
    </>
  )
}

export default PolaroidStack

