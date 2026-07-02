import { useRef, type ChangeEvent } from 'react'
import styles from './FileImporter.module.css'

interface FileImporterProps {
  onFileImport: (file: File) => void
  disabled?: boolean
}

/**
 * 文件导入组件（Phase 1a Web 模式）
 *
 * 仅支持 .md 文件（浏览器 FileReader API）。
 * .docx / .xlsx 延至 Phase 1b（Electron）。
 */
export function FileImporter({ onFileImport, disabled = false }: FileImporterProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onFileImport(file)
    // 重置 input 以允许重复选择同一文件
    e.target.value = ''
  }

  const handleClick = () => {
    if (disabled) return
    inputRef.current?.click()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (disabled) return
    const file = e.dataTransfer.files?.[0]
    if (!file) return
    if (!file.name.endsWith('.md')) return
    onFileImport(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div
      className={`${styles.bar} ${disabled ? styles.disabled : ''}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <span className={styles.hint}>
        📎 拖拽 .md 文件到这里，或
      </span>
      <button
        className={styles.btn}
        onClick={handleClick}
        disabled={disabled}
      >
        选择文件
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".md"
        className={styles.fileInput}
        onChange={handleFileChange}
        hidden
      />
    </div>
  )
}
