import React, { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence, useMotionValue, animate } from 'motion/react'
import type { PanInfo } from 'motion/react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Photo } from '@/lib/photos'

interface Props {
  photos: Photo[]
  title: string
  description?: string
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
}

// 常量配置
const CONSTANTS = {
  GAP: 16,
  MIN_ZOOM: 1,
  MAX_ZOOM: 4,
  DOUBLE_TAP_ZOOM: 2,
  DOUBLE_TAP_TIME: 300, // ms
  DOUBLE_TAP_DISTANCE: 50, // px
  DRAG_THRESHOLD: 10, // px
  WHEEL_THROTTLE: 16, // ms
  WHEEL_MIN_DELTA: 5,
  WHEEL_ZOOM_FACTOR: 0.0015,
  DRAG_THRESHOLD_RATIO: 0.07,
  OFFSET_MARGIN: 40, // px
  IMAGE_MAX_HEIGHT_RATIO: 0.8,
  MODAL_SAFE_MARGIN: 48, // px
  MODAL_MIN_HEIGHT: 200, // px
  CLICK_DEBOUNCE: 200, // ms
  ANIMATION_DELAY: 30, // ms
  TOUCH_CLEANUP_DELAY: 350, // ms
} as const

const PhotoGalleryModal: React.FC<Props> = ({ photos, title, description, isOpen, onClose, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const imageRefs = useRef<(HTMLDivElement | null)[]>([])
  const modalRef = useRef<HTMLDivElement | null>(null)
  const wheelContainerRef = useRef<HTMLDivElement | null>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [currentHeight, setCurrentHeight] = useState<number>(100)
  const [modalScale, setModalScale] = useState(1)
  const [zoom, setZoom] = useState<number>(CONSTANTS.MIN_ZOOM)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{ x: number; y: number } | null>(null)
  const isPointerDraggingRef = useRef(false)
  const lastPointerReleaseRef = useRef(0)
  const scrollTopRef = useRef(0)
  const prevBodyOverflowRef = useRef<string>('')
  const prevBodyPaddingRightRef = useRef<string>('')
  const x = useMotionValue(0)
  const [canAnimate, setCanAnimate] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false) // 追踪切换动画状态
  const [isExiting, setIsExiting] = useState(false) // 追踪退出动画状态
  const lastWheelTimeRef = useRef<number>(0)
  // 触摸相关状态
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  const lastTapTimeRef = useRef<number>(0)
  const isTouchPanningRef = useRef(false)
  const touchCleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 计算偏移边界限制
  const getOffsetBounds = useCallback(
    (currentZoom: number) => {
      const maxOffsetX = (containerWidth * (currentZoom - 1)) / 2 + CONSTANTS.OFFSET_MARGIN
      const maxOffsetY = (window.innerHeight * CONSTANTS.IMAGE_MAX_HEIGHT_RATIO * (currentZoom - 1)) / 2 + CONSTANTS.OFFSET_MARGIN
      return { maxOffsetX, maxOffsetY }
    },
    [containerWidth],
  )

  // 切换缩放（1x <-> 2x）
  const toggleZoom = useCallback(() => {
    setZoom((prev) => {
      const next = prev === CONSTANTS.MIN_ZOOM ? CONSTANTS.DOUBLE_TAP_ZOOM : CONSTANTS.MIN_ZOOM
      if (next === CONSTANTS.MIN_ZOOM) {
        setOffset({ x: 0, y: 0 })
      }
      return next
    })
  }, [])

  // 重置所有缩放和拖拽状态
  const resetZoom = useCallback(() => {
    setZoom(CONSTANTS.MIN_ZOOM)
    setOffset({ x: 0, y: 0 })
    setIsPanning(false)
    panStartRef.current = null
    // 重置触摸相关状态
    touchStartRef.current = null
    isTouchPanningRef.current = false
    lastTapTimeRef.current = 0
    // 清理触摸清理定时器
    if (touchCleanupTimeoutRef.current) {
      clearTimeout(touchCleanupTimeoutRef.current)
      touchCleanupTimeoutRef.current = null
    }
  }, [])

  const measureCurrentSlideHeight = useCallback(() => {
    const el = imageRefs.current[currentIndex]
    if (el && el.offsetHeight > 0) {
      setCurrentHeight(el.offsetHeight)
    }
  }, [currentIndex])

  // 精准监听可视容器宽度变化（包括窗口尺寸变化、侧栏开合、布局调整等）
  useEffect(() => {
    if (!isOpen) return

    const node = containerRef.current
    if (!node) return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const width = entry.contentRect.width
      if (width > 0) {
        setContainerWidth((prev) => (Math.abs(prev - width) < 1 ? prev : width))
      }
    })

    observer.observe(node)

    // 初始同步一次，防止 observer 回调稍晚
    const initialWidth = node.offsetWidth
    if (initialWidth > 0) {
      setContainerWidth(initialWidth)
    }

    return () => {
      observer.disconnect()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const targetX = -currentIndex * (containerWidth + CONSTANTS.GAP)
    if (canAnimate) {
      setIsAnimating(true)
      // 清除之前的动画定时器
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      animate(x, targetX, { type: 'tween', duration: 0.5, ease: 'easeOut' })
      // 动画完成后标记为非动画状态
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false)
        animationTimeoutRef.current = null
      }, 500) // 与动画时长保持一致
    } else {
      x.set(targetX)
      setIsAnimating(false)
    }
  }, [currentIndex, containerWidth, x, isOpen, canAnimate])

  // 只在弹窗打开或初始索引变化时初始化，不依赖 containerWidth
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      resetZoom()
      setCanAnimate(false)
      setIsAnimating(false)
      setTimeout(() => setCanAnimate(true), CONSTANTS.ANIMATION_DELAY)
    } else {
      // 关闭时重置动画状态
      setIsAnimating(false)
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
        animationTimeoutRef.current = null
      }
    }
  }, [isOpen, initialIndex, resetZoom])

  useEffect(() => {
    if (!isOpen) return

    // 初次进入或尺寸变化时，基于当前图片实际高度刷新外层容器高度
    const frame = requestAnimationFrame(measureCurrentSlideHeight)

    return () => cancelAnimationFrame(frame)
  }, [isOpen, containerWidth, measureCurrentSlideHeight])

  // 窗口高度变化时，重新测量当前照片高度，让外层容器高度与实际显示同步
  useEffect(() => {
    if (!isOpen) return

    const handleResize = () => {
      measureCurrentSlideHeight()
    }

    window.addEventListener('resize', handleResize)
    // 初始也同步一次，避免刚打开时窗口尺寸已经变化
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen, measureCurrentSlideHeight])

  // 根据窗口高度动态缩放整个弹窗，直接测量真实高度，保证视觉上完全落在视口内
  useEffect(() => {
    if (!isOpen) {
      setModalScale(1)
      return
    }

    let frame: number | null = null
    let resizeObserver: ResizeObserver | null = null

    const computeScale = () => {
      if (!modalRef.current) return

      const viewportHeight = window.innerHeight
      const safeHeight = Math.max(CONSTANTS.MODAL_MIN_HEIGHT, viewportHeight - CONSTANTS.MODAL_SAFE_MARGIN)

      // transform: scale 不会改变 offsetHeight，这里拿到的是“自然高度”
      const naturalHeight = modalRef.current.offsetHeight

      const rawScale = naturalHeight > 0 ? Math.min(1, safeHeight / naturalHeight) : 1
      const nextScale = Number.isFinite(rawScale) && rawScale > 0 ? rawScale : 1

      setModalScale((prev) => {
        // 避免因为极小的高度变化导致频繁重渲染
        if (Math.abs(prev - nextScale) < 0.01) return prev
        return nextScale
      })
    }

    const scheduleCompute = () => {
      if (frame != null) cancelAnimationFrame(frame)
      frame = requestAnimationFrame(computeScale)
    }

    scheduleCompute()
    window.addEventListener('resize', scheduleCompute)

    // 监听弹窗自身高度变化（图片加载、文字换行、动画结束等），自动重新计算缩放
    if (typeof ResizeObserver !== 'undefined' && modalRef.current) {
      resizeObserver = new ResizeObserver(() => {
        scheduleCompute()
      })
      resizeObserver.observe(modalRef.current)
    }

    return () => {
      if (frame != null) cancelAnimationFrame(frame)
      window.removeEventListener('resize', scheduleCompute)
      if (resizeObserver && modalRef.current) {
        resizeObserver.unobserve(modalRef.current)
      }
    }
  }, [isOpen])

  // 全局监听鼠标抬起，用于区分“拖拽结束后触发的点击”与真正的点击
  useEffect(() => {
    if (!isOpen) return

    const handleMouseUp = () => {
      if (isPointerDraggingRef.current) {
        isPointerDraggingRef.current = false
        lastPointerReleaseRef.current = Date.now()
      }
    }

    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isOpen])

  // 组件卸载时清理所有资源
  useEffect(() => {
    return () => {
      if (touchCleanupTimeoutRef.current) {
        clearTimeout(touchCleanupTimeoutRef.current)
        touchCleanupTimeoutRef.current = null
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
        animationTimeoutRef.current = null
      }
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current)
        exitTimeoutRef.current = null
      }
      // 组件卸载时确保恢复 body 样式
      if (prevBodyOverflowRef.current !== undefined) {
        document.body.style.overflow = prevBodyOverflowRef.current || ''
        document.body.style.paddingRight = prevBodyPaddingRightRef.current || ''
      }
    }
  }, [])

  // 安全网：如果 isExiting 状态持续太久，强制清理
  useEffect(() => {
    if (isExiting) {
      const safetyTimeout = setTimeout(() => {
        console.warn('Modal exit animation timeout - forcing cleanup')
        setIsExiting(false)
        // 确保 body 样式已恢复
        const savedOverflow = prevBodyOverflowRef.current || ''
        const savedPaddingRight = prevBodyPaddingRightRef.current || ''
        document.body.style.overflow = savedOverflow
        document.body.style.paddingRight = savedPaddingRight
        if (!savedOverflow) {
          document.body.style.removeProperty('overflow')
        }
        if (!savedPaddingRight) {
          document.body.style.removeProperty('padding-right')
        }
      }, 500) // 如果 500ms 后还没有清理，强制清理

      return () => clearTimeout(safetyTimeout)
    }
  }, [isExiting])

  // 锁定 / 还原页面滚动 - 优化版
  useEffect(() => {
    if (!isOpen) {
      // 弹窗关闭时，标记退出状态并延迟恢复 body 样式
      setIsExiting(true)
      
      // 立即重置所有交互状态
      resetZoom()
      setIsPanning(false)
      panStartRef.current = null
      isPointerDraggingRef.current = false
      lastPointerReleaseRef.current = 0
      
      // 清除之前的退出定时器
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current)
      }
      
      // 等待退出动画完成后再恢复 body 样式（动画时长 200ms，加 50ms 缓冲）
      exitTimeoutRef.current = setTimeout(() => {
        const savedOverflow = prevBodyOverflowRef.current || ''
        const savedPaddingRight = prevBodyPaddingRightRef.current || ''
        const savedScrollTop = scrollTopRef.current
        
        // 恢复 body 样式
        document.body.style.overflow = savedOverflow
        document.body.style.paddingRight = savedPaddingRight
        
        // 清理样式属性
        if (!savedOverflow) {
          document.body.style.removeProperty('overflow')
        }
        if (!savedPaddingRight) {
          document.body.style.removeProperty('padding-right')
        }
        
        // 恢复滚动位置
        window.scrollTo(0, savedScrollTop)
        
        setIsExiting(false)
        exitTimeoutRef.current = null
      }, 250) // 200ms 动画 + 50ms 缓冲
      
      return
    }

    // 弹窗打开时，锁定页面滚动
    scrollTopRef.current = window.scrollY || window.pageYOffset || 0
    prevBodyOverflowRef.current = document.body.style.overflow || ''
    prevBodyPaddingRightRef.current = document.body.style.paddingRight || ''

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    
    setIsExiting(false)
  }, [isOpen, resetZoom])

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      if (zoom !== CONSTANTS.MIN_ZOOM) return

      const dragOffset = info.offset.x
      const threshold = (containerWidth + CONSTANTS.GAP) * CONSTANTS.DRAG_THRESHOLD_RATIO
      let newIdx = currentIndex
      if (dragOffset > threshold && currentIndex > 0) {
        newIdx = currentIndex - 1
      } else if (dragOffset < -threshold && currentIndex < photos.length - 1) {
        newIdx = currentIndex + 1
      }
      
      // 如果索引变化，标记动画开始
      if (newIdx !== currentIndex) {
        setIsAnimating(true)
        // 清除之前的动画定时器
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current)
        }
        setCurrentIndex(newIdx)
        animate(x, -newIdx * (containerWidth + CONSTANTS.GAP), { type: 'tween', duration: 0.5, ease: 'easeOut' })
        // 动画完成后标记为非动画状态
        animationTimeoutRef.current = setTimeout(() => {
          setIsAnimating(false)
          animationTimeoutRef.current = null
        }, 500)
      } else {
        // 如果没有切换，立即回弹到当前位置
        animate(x, -currentIndex * (containerWidth + CONSTANTS.GAP), { type: 'tween', duration: 0.3, ease: 'easeOut' })
      }
    },
    [containerWidth, photos.length, x, currentIndex, zoom],
  )

  const goPrev = useCallback(() => {
    if (currentIndex > 0 && !isAnimating) {
      setIsAnimating(true)
      setCurrentIndex((i) => i - 1)
      resetZoom()
      // 清除之前的动画定时器
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      // 动画完成后标记为非动画状态
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false)
        animationTimeoutRef.current = null
      }, 500)
    }
  }, [currentIndex, resetZoom, isAnimating])

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1 && !isAnimating) {
      setIsAnimating(true)
      setCurrentIndex((i) => i + 1)
      resetZoom()
      // 清除之前的动画定时器
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current)
      }
      // 动画完成后标记为非动画状态
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false)
        animationTimeoutRef.current = null
      }, 500)
    }
  }, [currentIndex, photos.length, resetZoom, isAnimating])

  // 滚轮事件处理 - 使用原生事件以支持 preventDefault
  const handleWheel = useCallback((e: WheelEvent) => {
    // 在动画进行时，禁用滚轮缩放以防止冲突
    if (isAnimating) return

    // 在图片区域内使用滚轮进行缩放，而不是切换图片
    e.preventDefault()
    e.stopPropagation()

    // 只处理垂直滚动，忽略很小的抖动
    if (Math.abs(e.deltaY) < CONSTANTS.WHEEL_MIN_DELTA) return

    const now = Date.now()
    // 简单节流，防止缩放过快
    if (now - lastWheelTimeRef.current < CONSTANTS.WHEEL_THROTTLE) return
    lastWheelTimeRef.current = now

    const zoomStep = -e.deltaY * CONSTANTS.WHEEL_ZOOM_FACTOR

    setZoom((prev) => {
      let next = prev + zoomStep
      if (next < CONSTANTS.MIN_ZOOM) next = CONSTANTS.MIN_ZOOM
      if (next > CONSTANTS.MAX_ZOOM) next = CONSTANTS.MAX_ZOOM

      if (next === CONSTANTS.MIN_ZOOM && prev !== CONSTANTS.MIN_ZOOM) {
        // 缩回原始比例时顺带复位偏移
        setOffset({ x: 0, y: 0 })
      }

      return next
    })
  }, [isAnimating])

  const handleImageDoubleClick = useCallback(() => {
    // 在动画进行时，禁用双击缩放以防止冲突
    if (isAnimating) return
    toggleZoom()
  }, [toggleZoom, isAnimating])

  const handleImageMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // 无论是否放大，按下开始拖拽时都视为一次"拖拽操作"，后续鼠标滑出弹窗不应触发关闭
      isPointerDraggingRef.current = true

      if (zoom === CONSTANTS.MIN_ZOOM) return

      e.preventDefault()
      e.stopPropagation()
      setIsPanning(true)
      panStartRef.current = { x: e.clientX, y: e.clientY }
    },
    [zoom],
  )

  const handleImageMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isPanning || !panStartRef.current || zoom === CONSTANTS.MIN_ZOOM) return

      e.preventDefault()
      e.stopPropagation()

      const dx = e.clientX - panStartRef.current.x
      const dy = e.clientY - panStartRef.current.y
      panStartRef.current = { x: e.clientX, y: e.clientY }

      setOffset((prev) => {
        const { maxOffsetX, maxOffsetY } = getOffsetBounds(zoom)
        const nextX = Math.max(-maxOffsetX, Math.min(maxOffsetX, prev.x + dx))
        const nextY = Math.max(-maxOffsetY, Math.min(maxOffsetY, prev.y + dy))
        return { x: nextX, y: nextY }
      })
    },
    [isPanning, zoom, getOffsetBounds],
  )

  const handleImageMouseUpOrLeave = useCallback(() => {
    setIsPanning(false)
    panStartRef.current = null
  }, [])

  // 从触摸事件中获取图片索引（辅助函数）
  const getImageIndexFromEvent = useCallback((e: TouchEvent): number | null => {
    const target = e.target
    if (!(target instanceof HTMLElement)) return null

    const container = target.closest<HTMLElement>('[data-image-index]')
    if (!container) return null

    const indexAttr = container.getAttribute('data-image-index')
    if (!indexAttr) return null

    const index = Number.parseInt(indexAttr, 10)
    return Number.isNaN(index) || index < 0 ? null : index
  }, [])

  // 触摸事件处理 - 双击放大（使用原生 TouchEvent）
  const handleImageTouchStart = useCallback(
    (e: TouchEvent) => {
      // 在动画进行时，禁用所有交互以防止冲突
      if (isAnimating) {
        return
      }

      const index = getImageIndexFromEvent(e)
      // 只处理当前激活的图片
      if (index === null || index !== currentIndex) return

      const touch = e.touches[0]
      if (!touch) return

      const now = Date.now()
      const timeSinceLastTap = now - lastTapTimeRef.current

      // 检测双击（两次点击间隔小于阈值，且位置相近）
      if (timeSinceLastTap < CONSTANTS.DOUBLE_TAP_TIME && touchStartRef.current) {
        const distance = Math.sqrt(
          Math.pow(touch.clientX - touchStartRef.current.x, 2) + Math.pow(touch.clientY - touchStartRef.current.y, 2),
        )

        // 如果两次点击位置相近，视为双击
        if (distance < CONSTANTS.DOUBLE_TAP_DISTANCE) {
          // 只在需要时才阻止默认行为
          e.preventDefault()
          e.stopPropagation()

          toggleZoom()

          // 重置触摸状态，防止误判为三次点击
          touchStartRef.current = null
          lastTapTimeRef.current = 0
          if (touchCleanupTimeoutRef.current) {
            clearTimeout(touchCleanupTimeoutRef.current)
            touchCleanupTimeoutRef.current = null
          }
          return
        }
      }

      // 记录触摸开始位置和时间
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: now }
      isTouchPanningRef.current = false
      isPointerDraggingRef.current = true

      // 如果已放大，准备拖拽 - 只在这种情况下阻止默认行为
      if (zoom > CONSTANTS.MIN_ZOOM) {
        e.preventDefault()
        e.stopPropagation()
        setIsPanning(true)
        panStartRef.current = { x: touch.clientX, y: touch.clientY }
      }
      // 未放大时，不阻止默认行为，让浏览器进行优化的触摸处理
    },
    [currentIndex, zoom, toggleZoom, getImageIndexFromEvent, isAnimating],
  )

  // 触摸移动 - 拖拽查看（使用原生 TouchEvent）
  const handleImageTouchMove = useCallback(
    (e: TouchEvent) => {
      // 在动画进行时，禁用触摸移动交互
      if (isAnimating) {
        return
      }

      const index = getImageIndexFromEvent(e)
      // 只处理当前激活的图片
      if (index === null || index !== currentIndex) return

      const touch = e.touches[0]
      if (!touch || !touchStartRef.current) return

      const dx = Math.abs(touch.clientX - touchStartRef.current.x)
      const dy = Math.abs(touch.clientY - touchStartRef.current.y)
      const distance = Math.sqrt(dx * dx + dy * dy)

      // 如果移动距离超过阈值，视为拖拽而不是点击
      if (distance > CONSTANTS.DRAG_THRESHOLD) {
        isTouchPanningRef.current = true
      }

      // 只在已放大且正在拖拽时才阻止默认行为
      if (zoom > CONSTANTS.MIN_ZOOM && isPanning && panStartRef.current) {
        e.preventDefault()
        e.stopPropagation()

        const moveX = touch.clientX - panStartRef.current.x
        const moveY = touch.clientY - panStartRef.current.y
        panStartRef.current = { x: touch.clientX, y: touch.clientY }

        setOffset((prev) => {
          const { maxOffsetX, maxOffsetY } = getOffsetBounds(zoom)
          const nextX = Math.max(-maxOffsetX, Math.min(maxOffsetX, prev.x + moveX))
          const nextY = Math.max(-maxOffsetY, Math.min(maxOffsetY, prev.y + moveY))
          return { x: nextX, y: nextY }
        })
      }
      // 未放大时，让 Framer Motion 处理拖拽，不干预
    },
    [currentIndex, zoom, isPanning, getOffsetBounds, getImageIndexFromEvent, isAnimating],
  )

  // 触摸结束（使用原生 TouchEvent）
  const handleImageTouchEnd = useCallback(
    (e: TouchEvent) => {
      const index = getImageIndexFromEvent(e)
      // 只处理当前激活的图片
      if (index === null || index !== currentIndex) return

      const now = Date.now()

      // 如果不是拖拽，记录点击时间用于双击检测
      if (!isTouchPanningRef.current && touchStartRef.current) {
        lastTapTimeRef.current = now
        // 保留 touchStartRef 的位置信息用于双击检测，但会在下次触摸开始时更新
      } else {
        // 如果是拖拽，清除触摸开始信息，防止误判为双击
        touchStartRef.current = null
        lastTapTimeRef.current = 0
      }

      // 重置拖拽状态
      setIsPanning(false)
      panStartRef.current = null
      isTouchPanningRef.current = false
      isPointerDraggingRef.current = false
      lastPointerReleaseRef.current = now

      // 清理之前的定时器
      if (touchCleanupTimeoutRef.current) {
        clearTimeout(touchCleanupTimeoutRef.current)
      }

      // 延迟清除 touchStartRef（如果超过阈值没有第二次点击）
      touchCleanupTimeoutRef.current = setTimeout(() => {
        if (touchStartRef.current && Date.now() - touchStartRef.current.time > CONSTANTS.DOUBLE_TAP_TIME) {
          touchStartRef.current = null
        }
        touchCleanupTimeoutRef.current = null
      }, CONSTANTS.TOUCH_CLEANUP_DELAY)
    },
    [currentIndex, getImageIndexFromEvent],
  )

  // 键盘事件处理
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, goPrev, goNext])

  // 使用原生事件监听器处理滚轮事件，支持 preventDefault
  useEffect(() => {
    const element = wheelContainerRef.current
    if (!element || !isOpen) return

    // 使用 { passive: false } 以允许 preventDefault
    element.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      element.removeEventListener('wheel', handleWheel)
    }
  }, [isOpen, handleWheel])

  // 使用原生事件监听器处理触摸事件，支持 preventDefault
  // 只在图片容器上监听，不影响其他区域
  useEffect(() => {
    if (!isOpen) return

    const wheelElement = wheelContainerRef.current
    if (!wheelElement) return

    // touchstart 需要支持双击检测（可能调用 preventDefault），所以使用 passive: false
    // touchmove 在放大时需要 preventDefault，未放大时让 Framer Motion 处理
    // touchend 不需要 preventDefault，使用 passive: true 优化性能
    const touchMovePassive = zoom === CONSTANTS.MIN_ZOOM ? { passive: true } : { passive: false }

    wheelElement.addEventListener('touchstart', handleImageTouchStart, { passive: false })
    wheelElement.addEventListener('touchmove', handleImageTouchMove, touchMovePassive)
    wheelElement.addEventListener('touchend', handleImageTouchEnd, { passive: true })

    return () => {
      wheelElement.removeEventListener('touchstart', handleImageTouchStart)
      wheelElement.removeEventListener('touchmove', handleImageTouchMove)
      wheelElement.removeEventListener('touchend', handleImageTouchEnd)
    }
  }, [isOpen, zoom, handleImageTouchStart, handleImageTouchMove, handleImageTouchEnd])

  if (photos.length === 0) return null

  // 退出动画完成回调
  const handleExitComplete = useCallback(() => {
    // 重置高度状态
    setCurrentHeight(100)
    // 确保所有状态都已清理
    setIsExiting(false)
    // 清理退出定时器
    if (exitTimeoutRef.current) {
      clearTimeout(exitTimeoutRef.current)
      exitTimeoutRef.current = null
    }
  }, [])

  const modalContent = (
    <AnimatePresence mode="wait" onExitComplete={handleExitComplete}>
      {isOpen && (
        <>
          {/* 背景遮罩层 - 独立的顶层元素 */}
          <motion.div
            key="modal-backdrop-overlay"
            className="fixed inset-0 z-[99999] bg-black/50"
            onClick={(e) => {
              // 如果刚刚发生过拖拽，则忽略本次点击，防止误关闭
              const now = Date.now()
              if (isPointerDraggingRef.current || now - lastPointerReleaseRef.current < CONSTANTS.CLICK_DEBOUNCE) {
                e.stopPropagation()
                return
              }
              onClose()
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          />

          {/* Modal 容器层 - 居中布局 */}
          <motion.div
            key="modal-container"
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <motion.div
              key="modal-content"
              className="bg-background relative mx-4 w-full max-w-lg p-4 shadow-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
              ref={modalRef}
              initial={{ opacity: 0, y: 60, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: modalScale }}
              exit={{ opacity: 0, y: -60, scale: 0.9 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
            <div className="border-gray-100 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-foreground text-lg font-semibold">{title}</h3>
                </div>
                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                  onClick={onClose}
                  aria-label="关闭"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="bg-background relative" ref={containerRef}>
              <motion.div
                ref={wheelContainerRef}
                className="relative overflow-hidden"
                style={{ width: containerWidth }}
                initial={{ height: 100 }}
                animate={{ height: currentHeight }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <motion.div
                  className="flex items-start gap-4"
                  style={{ x, width: photos.length * (containerWidth + CONSTANTS.GAP) - CONSTANTS.GAP }}
                  drag={zoom === CONSTANTS.MIN_ZOOM && !isAnimating ? 'x' : false}
                  dragConstraints={{ left: -(photos.length - 1) * (containerWidth + CONSTANTS.GAP), right: 0 }}
                  dragElastic={0.1}
                  onDragStart={() => {
                    // 在动画期间不允许开始拖拽
                    if (isAnimating) return
                    isPointerDraggingRef.current = true
                  }}
                  onDragEnd={(event, info) => {
                    handleDragEnd(event, info)
                    // 标记一次拖拽结束，用于后面遮罩点击的防抖判断
                    isPointerDraggingRef.current = false
                    lastPointerReleaseRef.current = Date.now()
                  }}
                  transition={{ type: 'tween', duration: 0.5, ease: 'easeOut' }}
                >
                  {photos.map((photo, index) => {
                    const imgSrc = photo.src
                    const isActive = index === currentIndex

                    return (
                      <div
                        key={`${imgSrc}-${index}`}
                        ref={(el) => {
                          imageRefs.current[index] = el
                        }}
                        className="flex shrink-0 items-center justify-center overflow-hidden"
                        style={{ width: containerWidth }}
                      >
                        <div
                          data-image-index={index}
                          className="flex items-center justify-center"
                          onDoubleClick={isActive ? handleImageDoubleClick : undefined}
                          onMouseDown={isActive ? handleImageMouseDown : undefined}
                          onMouseMove={isActive ? handleImageMouseMove : undefined}
                          onMouseUp={isActive ? handleImageMouseUpOrLeave : undefined}
                          onMouseLeave={isActive ? handleImageMouseUpOrLeave : undefined}
                          style={{
                            cursor:
                              isActive && zoom > CONSTANTS.MIN_ZOOM
                                ? isPanning
                                  ? 'grabbing'
                                  : 'grab'
                                : 'default',
                            touchAction: isActive && zoom > CONSTANTS.MIN_ZOOM ? 'none' : 'pan-x',
                          }}
                        >
                          <img
                            draggable={false}
                            src={imgSrc}
                            alt={photo.alt}
                            className="block max-h-[80vh] max-w-full select-none object-contain"
                            style={{
                              transform:
                                isActive && zoom > CONSTANTS.MIN_ZOOM
                                  ? `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`
                                  : `translate3d(0px, 0px, 0) scale(${CONSTANTS.MIN_ZOOM})`,
                              transition: isPanning ? 'none' : 'transform 0.18s ease-out',
                            }}
                            onLoad={() => {
                              if (index === currentIndex) {
                                measureCurrentSlideHeight()
                              }
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </motion.div>
              </motion.div>

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={currentIndex === 0}
                    className={`absolute -left-10 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center shadow-lg transition-all ${
                      currentIndex === 0
                        ? 'cursor-not-allowed bg-muted text-muted-foreground'
                        : 'cursor-pointer bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    aria-label="上一张"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={currentIndex === photos.length - 1}
                    className={`absolute -right-10 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center shadow-lg transition-all ${
                      currentIndex === photos.length - 1
                        ? 'cursor-not-allowed bg-muted text-muted-foreground'
                        : 'cursor-pointer bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                    aria-label="下一张"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>

            <div className="text-muted-foreground mt-3 text-center text-sm font-medium">
              {currentIndex + 1} / {photos.length}
            </div>
          </motion.div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  // 只在客户端且弹窗打开或正在退出动画时才渲染 Portal
  return typeof document !== 'undefined' && (isOpen || isExiting) ? createPortal(modalContent, document.body) : null
}

export default PhotoGalleryModal

