import { useCallback } from 'react'
import styles from './BottomPanel.module.css'

import { ChatInput } from './ChatInput'
import { FileImporter } from './FileImporter'
import { ChatHistory } from './ChatHistory'

import { useChatStore } from '../../store/chatStore'
import { useImportStore } from '../../store/importStore'

export function BottomPanel() {
  // ===== Stores =====
  const messages = useChatStore((s) => s.messages)
  const chatProcessing = useChatStore((s) => s.isProcessing)
  const sendMessage = useChatStore((s) => s.sendMessage)

  const showImportPreview = useImportStore((s) => s.showPreview)

  // ===== Handlers =====

  /** 发送消息 */
  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content)
    },
    [sendMessage],
  )

  /** 文件导入 */
  const handleFileImport = useCallback(
    async (file: File) => {
      try {
        const text = await file.text()
        showImportPreview(text, file.name)
      } catch {
        useChatStore.getState().addMessage({
          id: `import_err_${Date.now()}`,
          role: 'system',
          content: `文件读取失败: ${file.name}`,
          timestamp: Date.now(),
        })
      }
    },
    [showImportPreview],
  )

  // ===== 渲染 =====

  return (
    <div className={styles.panel}>
      {/* 控制栏 */}
      <div className={styles.controlsRow}>
        <ChatInput
          onSend={handleSend}
          disabled={chatProcessing}
        />
      </div>

      {/* 文件导入 */}
      <FileImporter
        onFileImport={handleFileImport}
        disabled={chatProcessing}
      />

      {/* 对话历史 */}
      <ChatHistory messages={messages} />
    </div>
  )
}
