import type { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DiffViewer } from '../DiffViewer'
import { usePhaseStore } from '../../store/phaseStore'
import styles from './CurrentPanel.module.css'

interface CurrentPanelProps {
  content?: string
  baselineContent?: string
  filename?: string
  isModified?: boolean
  isLoading?: boolean
  /** v6.4：当前选中的资产路径，用于判断只读状态 */
  selectedPath?: string
  children?: ReactNode
}

export function CurrentPanel({
  content,
  baselineContent,
  filename,
  isModified,
  isLoading,
  selectedPath,
  children,
}: CurrentPanelProps) {
  const showDiff = !isLoading && content && baselineContent && !children
  const isLocked = selectedPath ? usePhaseStore.getState().isLockedPath(selectedPath) : false

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.title}>
          {filename || '当前版本'}
          <span className={styles.badge}>当前</span>
        </div>
        {isModified !== undefined && (
          <span
            className={`${styles.statusIndicator} ${
              isModified ? styles.statusModified : styles.statusUnmodified
            }`}
          >
            {isModified ? '⚡ 已修改' : '✓ 未修改'}
          </span>
        )}
      </div>
      <div className={styles.body}>
        {/* v6.4：写作期设计资产只读提示 */}
        {isLocked && (
          <div className={styles.readonlyBanner}>
            🔒 当前为设计期资产的锁定快照。如需修改，请点 HeaderBar 解锁回设计期。
          </div>
        )}
        {isLoading ? (
          <div className={styles.empty}>加载中...</div>
        ) : children ? (
          children
        ) : showDiff ? (
          <DiffViewer
            baselineText={baselineContent}
            currentText={content}
          />
        ) : content ? (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        ) : (
          <div className={styles.empty}>选择资产卡片查看内容</div>
        )}
      </div>
    </div>
  )
}
