import styles from './HeaderBar.module.css'

interface HeaderBarProps {
  title?: string
}

export function HeaderBar({ title = 'StoryCraft v4' }: HeaderBarProps) {
  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <span className={styles.logoAccent}>◆</span>
        {title}
        <span className={styles.version}>v4</span>
      </div>
      <button className={styles.settingsBtn} title="设置（未来扩展）">
        ⚙
      </button>
    </header>
  )
}
