import type { AssetCardData } from '../../types'
import { AssetCard } from '../AssetCard'
import styles from './AssetCardPanel.module.css'

interface AssetCardPanelProps {
  cards: AssetCardData[]
  selectedPath: string | null
  onSelect: (path: string) => void
}

/** 分组后的卡片列表 */
interface GroupedCards {
  group: string
  cards: AssetCardData[]
}

/** 按 group 对卡片进行分组 */
function groupBySection(cards: AssetCardData[]): GroupedCards[] {
  const groups = new Map<string, AssetCardData[]>()
  for (const card of cards) {
    const g = groups.get(card.group) || []
    g.push(card)
    groups.set(card.group, g)
  }
  return Array.from(groups.entries()).map(([group, groupCards]) => ({
    group,
    cards: groupCards,
  }))
}

export function AssetCardPanel({
  cards,
  selectedPath,
  onSelect,
}: AssetCardPanelProps) {
  const sections = groupBySection(cards)

  if (cards.length === 0) {
    return (
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.title}>资产卡片</div>
        </div>
        <div className={styles.body}>
          <div className={styles.empty}>暂无资产卡片</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.title}>资产卡片</div>
      </div>
      <div className={styles.body}>
        {sections.map(({ group, cards: sectionCards }) => (
          <div key={group} className={styles.section}>
            <div className={styles.sectionLabel}>{group}</div>
            {sectionCards.map((card) => (
              <AssetCard
                key={card.path}
                data={card}
                isSelected={card.path === selectedPath}
                onSelect={() => onSelect(card.path)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
