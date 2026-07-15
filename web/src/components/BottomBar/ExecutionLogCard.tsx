import type { ExecutionEvent } from '../../types'
import { useExecutionSteps } from './useExecutionSteps'
import styles from './ExecutionLogCard.module.css'

interface ExecutionLogCardProps {
  executionLog: ExecutionEvent[]
  isProcessing: boolean
  isExpanded: boolean
  onToggle: () => void
}

/** v7.2：执行日志时间线卡片，替代原呼吸灯+3秒提示的极简态展示 */
export function ExecutionLogCard({ executionLog, isProcessing, isExpanded, onToggle }: ExecutionLogCardProps) {
  const steps = useExecutionSteps(executionLog)

  if (steps.length === 0) return null

  const doneCount = steps.filter((s) => s.status === 'done').length
  const errorCount = steps.filter((s) => s.status === 'error').length
  const lastEvent = executionLog[executionLog.length - 1]
  const isFinalizing = lastEvent?.type === 'engine_finalizing'
  const firstTimestamp = executionLog[0]?.timestamp
  const lastTimestamp = lastEvent?.timestamp
  const elapsedSeconds = firstTimestamp && lastTimestamp
    ? Math.max(0, Math.round((lastTimestamp - firstTimestamp) / 1000))
    : 0
  const terminalSummary = errorCount > 0
    ? `${doneCount} 完成 / ${errorCount} 失败 · ${elapsedSeconds} 秒`
    : `已完成 ${doneCount}/${steps.length} 个步骤 · ${elapsedSeconds} 秒`
  const summary = isFinalizing
    ? '正在整理本轮结果…'
    : isProcessing
      ? `处理中 · ${doneCount}/${steps.length}`
      : terminalSummary

  return (
    <div className={styles.card}>
      <button type="button" className={styles.header} onClick={onToggle} aria-expanded={isExpanded}>
        <span className={styles.headerTitle}>执行日志</span>
        <span className={styles.headerRight}>
          <span className={styles.summary}>{summary}</span>
          <span className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`} aria-hidden="true" />
        </span>
      </button>

      {isExpanded && (
        <div className={styles.body}>
          {steps.map((step, i) => (
            <div key={step.key} className={`${styles.row} ${styles[step.status]}`}>
              {i < steps.length - 1 && <span className={styles.connector} aria-hidden="true" />}
              <span className={styles.glyph} aria-hidden="true">{step.glyph}</span>
              <div className={styles.rowContent}>
                <div className={styles.rowTitle}>{step.title}</div>
                <div className={styles.rowReason}>{step.reason}</div>
                <div className={styles.rowSubtitle}>{step.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
