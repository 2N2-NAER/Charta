import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import styles from './DiffLayout.module.css'
import { PanelResizer } from './PanelResizer'

interface DiffLayoutProps {
  /** 左侧栏（BaselinePanel） */
  left: ReactNode
  /** 中间栏（CurrentPanel） */
  center: ReactNode
  /** 右侧栏（AssetCardPanel） */
  right: ReactNode
  /** 默认宽度占比（百分比） */
  defaultRatios?: [number, number, number]
}

export function DiffLayout({
  left,
  center,
  right,
  defaultRatios = [35, 40, 25],
}: DiffLayoutProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ratios, setRatios] = useState(defaultRatios)

  // 锁定比例总和为 100
  useEffect(() => {
    const sum = ratios.reduce((a, b) => a + b, 0)
    if (Math.abs(sum - 100) > 0.1) {
      // 重新归一化
      setRatios(defaultRatios)
    }
  }, [ratios, defaultRatios])

  const handleResizeLeft = useCallback(
    (deltaX: number) => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth
      if (containerWidth <= 0) return

      const deltaPercent = (deltaX / containerWidth) * 100
      setRatios((prev) => {
        const newLeft = Math.max(20, Math.min(60, prev[0] + deltaPercent))
        const newCenter = Math.max(25, Math.min(60, prev[1] - deltaPercent))
        return [newLeft, newCenter, prev[2]]
      })
    },
    [],
  )

  const handleResizeRight = useCallback(
    (deltaX: number) => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.offsetWidth
      if (containerWidth <= 0) return

      const deltaPercent = (deltaX / containerWidth) * 100
      setRatios((prev) => {
        const newCenter = Math.max(25, Math.min(60, prev[1] + deltaPercent))
        const newRight = Math.max(15, Math.min(40, prev[2] - deltaPercent))
        return [prev[0], newCenter, newRight]
      })
    },
    [],
  )

  return (
    <div className={styles.layout} ref={containerRef}>
      <div className={styles.panel} style={{ width: `${ratios[0]}%` }}>
        {left}
      </div>

      <PanelResizer onResize={handleResizeLeft} />

      <div className={styles.panel} style={{ width: `${ratios[1]}%` }}>
        {center}
      </div>

      <PanelResizer onResize={handleResizeRight} />

      <div className={styles.panel} style={{ width: `${ratios[2]}%` }}>
        {right}
      </div>
    </div>
  )
}
