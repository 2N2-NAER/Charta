import type { ReactNode } from 'react'
import styles from './BaselinePanel.module.css'

interface BaselinePanelProps {
  content?: string
  filename?: string
  lastApprovedAt?: string
  isLoading?: boolean
  /** 可选子节点覆盖默认渲染 */
  children?: ReactNode
}

export function BaselinePanel({
  content,
  filename,
  lastApprovedAt,
  isLoading,
  children,
}: BaselinePanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.title}>
          {filename || '基线版本'}
          <span className={styles.badge}>上次确认</span>
        </div>
        {lastApprovedAt && (
          <span className={styles.timestamp}>{lastApprovedAt}</span>
        )}
      </div>
      <div className={styles.body}>
        {isLoading ? (
          <div className={styles.empty}>加载中...</div>
        ) : children ? (
          children
        ) : content ? (
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
            {content}
          </pre>
        ) : (
          <div className={styles.empty}>选择资产卡片查看内容</div>
        )}
      </div>
    </div>
  )
}
