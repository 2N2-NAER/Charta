import { useEffect, useMemo, useState } from 'react'
import { useChatStore } from '../../store/chatStore'
import { PRODUCT_PROFILES, type ProductKind } from '../../types/product'
import type { CreationSpec } from '../../types/creationSpec'
import { formatCreationSpecLabel, getDefaultCreationSpec } from '../../types/creationSpec'
import { buildStructureQuota } from '../../orchestrator/structureQuota'
import styles from './CreationSpecBar.module.css'

const PRODUCT_ORDER: ProductKind[] = ['screenplay', 'novel', 'long_drama', 'short_drama']

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)))
}

function updateSpecNumber(spec: CreationSpec, key: string, value: number): CreationSpec {
  if (spec.productKind === 'screenplay') {
    return { ...spec, lengthMinutes: clamp(value, 10, 200) }
  }
  if (spec.productKind === 'novel') {
    return { ...spec, wordCountWan: clamp(value, 1, 50) }
  }
  if (key === 'episodeCount') {
    return {
      ...spec,
      episodeCount: clamp(value, spec.productKind === 'long_drama' ? 4 : 6, spec.productKind === 'long_drama' ? 60 : 100),
    }
  }
  return {
    ...spec,
    minutesPerEpisode: clamp(value, spec.productKind === 'long_drama' ? 20 : 1, spec.productKind === 'long_drama' ? 60 : 15),
  }
}

function SpecSlider({
  label,
  value,
  min,
  max,
  suffix,
  disabled,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  suffix: string
  disabled?: boolean
  onChange: (value: number) => void
}) {
  return (
    <label className={styles.sliderRow}>
      <span className={styles.sliderLabel}>{label}</span>
      <input
        className={styles.slider}
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className={styles.sliderValue}>{value}{suffix}</span>
    </label>
  )
}

export function CreationSpecBar() {
  const product = useChatStore((s) => s.product)
  const creationSpec = useChatStore((s) => s.creationSpec)
  const setCreationSpec = useChatStore((s) => s.setCreationSpec)
  const isProcessing = useChatStore((s) => s.isProcessing)
  const [open, setOpen] = useState(false)
  const [draftSpec, setDraftSpec] = useState<CreationSpec>(() =>
    creationSpec ?? getDefaultCreationSpec('screenplay'),
  )

  const locked = product !== null
  const effectiveSpec = creationSpec ?? draftSpec
  const quota = useMemo(() => buildStructureQuota(effectiveSpec), [effectiveSpec])
  const quotaSummary = `${quota.acts}幕 / ${quota.sequences}单元 / ${quota.scenes}场`

  useEffect(() => {
    if (creationSpec) {
      setDraftSpec(creationSpec)
    } else if (!product) {
      setDraftSpec(getDefaultCreationSpec('screenplay'))
    }
  }, [creationSpec, product])

  const handleProductChange = (kind: ProductKind) => {
    if (locked || isProcessing) return
    setDraftSpec(getDefaultCreationSpec(kind))
  }

  const handleApply = () => {
    if (locked || isProcessing) return
    setCreationSpec(draftSpec)
    setOpen(false)
  }

  return (
    <div className={`${styles.specBar} ${locked ? styles.locked : ''}`}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={locked ? '查看已锁定的创作规格' : '设置创作规格'}
      >
        <span className={styles.ticket}>
          <span className={styles.triggerLabel}>{locked ? '已锁定' : '规格'}</span>
          <span className={styles.triggerValue}>{formatCreationSpecLabel(effectiveSpec)}</span>
          <span className={styles.triggerMeta}>{quotaSummary}</span>
        </span>
        <span className={styles.chevron} aria-hidden="true" data-open={open ? 'true' : 'false'} />
      </button>

      {open && (
        <div className={styles.sheet}>
          <div className={styles.productGrid} role="radiogroup" aria-label="产品类型">
            {PRODUCT_ORDER.map((kind) => {
              const active = effectiveSpec.productKind === kind
              return (
                <button
                  key={kind}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`${styles.productBtn} ${active ? styles.active : ''}`}
                  disabled={locked || isProcessing}
                  onClick={() => handleProductChange(kind)}
                >
                  {PRODUCT_PROFILES[kind].displayName}
                </button>
              )
            })}
          </div>

          <div className={styles.controls}>
            {effectiveSpec.productKind === 'screenplay' && (
              <SpecSlider
                label="片长"
                value={effectiveSpec.lengthMinutes}
                min={10}
                max={200}
                suffix="分钟"
                disabled={locked || isProcessing}
                onChange={(value) => setDraftSpec(updateSpecNumber(effectiveSpec, 'lengthMinutes', value))}
              />
            )}
            {effectiveSpec.productKind === 'novel' && (
              <SpecSlider
                label="字数"
                value={effectiveSpec.wordCountWan}
                min={1}
                max={50}
                suffix="万字"
                disabled={locked || isProcessing}
                onChange={(value) => setDraftSpec(updateSpecNumber(effectiveSpec, 'wordCountWan', value))}
              />
            )}
            {(effectiveSpec.productKind === 'long_drama' || effectiveSpec.productKind === 'short_drama') && (
              <>
                <SpecSlider
                  label="集数"
                  value={effectiveSpec.episodeCount}
                  min={effectiveSpec.productKind === 'long_drama' ? 4 : 6}
                  max={effectiveSpec.productKind === 'long_drama' ? 60 : 100}
                  suffix="集"
                  disabled={locked || isProcessing}
                  onChange={(value) => setDraftSpec(updateSpecNumber(effectiveSpec, 'episodeCount', value))}
                />
                <SpecSlider
                  label="单集"
                  value={effectiveSpec.minutesPerEpisode}
                  min={effectiveSpec.productKind === 'long_drama' ? 20 : 1}
                  max={effectiveSpec.productKind === 'long_drama' ? 60 : 15}
                  suffix="分钟"
                  disabled={locked || isProcessing}
                  onChange={(value) => setDraftSpec(updateSpecNumber(effectiveSpec, 'minutesPerEpisode', value))}
                />
              </>
            )}
          </div>

          <div className={styles.preview}>
            <span>预计结构</span>
            <strong>
              {quota.acts}幕 · {quota.sequences}个剧情单元 · 约{quota.scenes}场
            </strong>
          </div>

          {!locked && (
            <button
              type="button"
              className={styles.applyBtn}
              onClick={handleApply}
              disabled={isProcessing}
            >
              确认规格
            </button>
          )}
        </div>
      )}
    </div>
  )
}
