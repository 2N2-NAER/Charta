import { create } from 'zustand'
import { useChatStore } from './chatStore'

// ===== Store 类型 =====

interface ImportStore {
  /** 导入文件的解析后内容（预览用） */
  previewContent: string | null
  /** 导入文件原始名 */
  previewFilename: string | null
  /** 用户选择的导入方式 */
  pendingAction: 'reference' | 'asset' | null
  /** 是否正在导入中 */
  isImporting: boolean

  showPreview: (content: string, filename: string) => void
  dismissPreview: () => void
  setPendingAction: (action: 'reference' | 'asset' | null) => void
  confirmImportToAsset: (targetPath: string) => Promise<void>
  confirmImportAsReference: () => void
}

// ===== Store =====

export const useImportStore = create<ImportStore>((set, get) => ({
  previewContent: null,
  previewFilename: null,
  pendingAction: null,
  isImporting: false,

  showPreview: (content: string, filename: string) => {
    set({ previewContent: content, previewFilename: filename, pendingAction: null, isImporting: false })
  },

  dismissPreview: () => {
    set({ previewContent: null, previewFilename: null, pendingAction: null, isImporting: false })
  },

  setPendingAction: (action: 'reference' | 'asset' | null) => {
    set({ pendingAction: action })
  },

  confirmImportToAsset: async (targetPath: string) => {
    // v4 MVP 暂不实现覆盖资产导入，留作扩展
    set({ isImporting: true })
    try {
      const { previewFilename } = get()
      const msg: import('../types').ChatMessage = {
        id: `import_${Date.now()}`,
        role: 'system',
        content: `已将 [${previewFilename}] 导入到 ${targetPath}（覆盖资产卡片功能待实现）`,
        timestamp: Date.now(),
      }
      useChatStore.getState().addMessage(msg)
    } finally {
      set({ isImporting: false, previewContent: null, previewFilename: null, pendingAction: null })
    }
  },

  confirmImportAsReference: () => {
    const { previewContent, previewFilename } = get()
    if (!previewContent) return

    const truncated = previewContent.length > 200 ? previewContent.slice(0, 200) + '…' : previewContent
    const refMsg: import('../types').ChatMessage = {
      id: `ref_${Date.now()}`,
      role: 'system',
      content: `📎 参考素材 [${previewFilename}]\n\n${truncated}`,
      timestamp: Date.now(),
    }

    useChatStore.getState().addMessage(refMsg)
    set({ previewContent: null, previewFilename: null, pendingAction: null })
  },
}))
