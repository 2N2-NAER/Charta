import type { AssetCardData } from '../types'
import styles from './AssetCard.module.css'

interface AssetCardProps {
  data: AssetCardData
  isSelected: boolean
  onSelect: () => void
}

/** 状态 → 标签文本 */
function getStatusLabel(status: AssetCardData['status']): string {
  switch (status) {
    case 'pending': return '待生成'
    case 'generated': return '已生成'
    case 'modified': return '已修改'
  }
}

/** 状态 → CSS 圆点颜色 */
function getStatusDotClass(status: AssetCardData['status']): string {
  switch (status) {
    case 'pending': return styles.dotPending
    case 'generated': return styles.dotGenerated
    case 'modified': return styles.dotModified
  }
}

export function AssetCard({ data, isSelected, onSelect }: AssetCardProps) {
  const dotClass = getStatusDotClass(data.status)

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.cardSelected : ''}`}
      onClick={onSelect}
    >
      <span className={styles.icon}>📄</span>
      <div className={styles.info}>
        <div className={styles.name}>{data.filename}</div>
        <div className={styles.statusRow}>
          <span className={`${styles.dot} ${dotClass}`} />
          {getStatusLabel(data.status)}
        </div>
      </div>
    </div>
  )
}
