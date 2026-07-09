import { useState, useCallback } from 'react'
import { usePhaseStore } from '../../store/phaseStore'
import { useAssetStore } from '../../store/assetStore'
import styles from './HeaderBar.module.css'

interface HeaderBarProps {
  title?: string
}

export function HeaderBar({ title = 'StoryCrafter' }: HeaderBarProps) {
  const phase = usePhaseStore((s) => s.phase)
  const lock = usePhaseStore((s) => s.lock)
  const phaseLock = useCallback(
    () => {
      const fm = useAssetStore.getState().fileManager
      if (fm) lock(fm)
    },
    [lock],
  )
  const [progressOpen, setProgressOpen] = useState(false)

  // v6.4：写作进度概览——统计章数/序列数
  const cards = useAssetStore((s) => s.getAssetList())
  const chapterCards = cards.filter((c) => c.path.startsWith('chapters/'))
  const sequenceCards = cards.filter((c) => c.path.startsWith('sequences/'))
  const totalChapters = sequenceCards.length
  const writtenCount = chapterCards.length
  const sequenceChapters = sequenceCards.map((seq) => {
    const seqId = seq.path.replace(/^sequences\//, '').replace(/\.md$/, '')
    const chapter = chapterCards.find((c) => c.metaInfo === seqId)
    return {
      seq: seqId,
      chapterPath: chapter?.path,
      wordCount: chapter?.wordCount,
    }
  })

  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.mark}>
          <span />
          <span />
          <span />
          <span />
        </span>
        <span className={styles.logo}>
          {title}
          <span className={styles.version}>v6.4</span>
        </span>
      </div>

      {/* v6.4：Phase Gate 锁/解锁 CTA + 进度概览 */}
      <div className={styles.actions}>
        {/* 进度概览 */}
        {phase === 'writing' && (
          <div
            className={styles.progressBadge}
            onClick={() => setProgressOpen((v) => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); setProgressOpen((v) => !v) } }}
          >
            已写 {writtenCount} 章 / 共 {totalChapters} 序列
            <span className={styles.progressArrow}>{progressOpen ? '▴' : '▾'}</span>
            {progressOpen && (
              <div className={styles.progressPanel}>
                {sequenceChapters.map(({ seq, chapterPath, wordCount }) => (
                  <div key={seq} className={styles.progressRow}>
                    <span className={styles.progressSeq}>{seq}</span>
                    <span className={styles.progressStatus}>
                      {chapterPath ? `✅ ${wordCount && wordCount > 0 ? `${wordCount}字` : '--'}` : '⬜ 未开始'}
                    </span>
                  </div>
                ))}
                {sequenceChapters.length === 0 && (
                  <div className={styles.progressEmpty}>暂无序列，先去设计期生成大纲</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 锁/解锁按钮 */}
        <button
          className={`${styles.phaseBtn} ${phase === 'writing' ? styles.phaseBtnLocked : styles.phaseBtnUnlocked}`}
          onClick={phaseLock}
          title={phase === 'writing' ? '解锁回设计期' : '锁定大纲→进入写作期'}
        >
          {phase === 'writing' ? '🔒 写作期' : '🔓 设计期'}
        </button>
      </div>
    </header>
  )
}
