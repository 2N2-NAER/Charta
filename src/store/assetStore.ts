import { create } from 'zustand'
import type { AssetCardData, AssetStatus } from '../types'
import type { FileManager } from '../orchestrator/fileManager'
import { TOOL_REGISTRY } from '../orchestrator/toolRegistry'

// ===== 文件→分组 查找表（从 ToolRegistry 构建） =====

function buildAssetMeta(): Record<string, { group: string }> {
  const meta: Record<string, { group: string }> = {}
  for (const tool of TOOL_REGISTRY) {
    for (const file of tool.writes) {
      if (!meta[file]) {
        meta[file] = { group: tool.group }
      }
    }
  }
  return meta
}

const ASSET_META = buildAssetMeta()

// ===== 内部状态 =====

interface AssetState {
  content: string
  status: AssetStatus
  /** 变化前的内容（用于 diff 对照的左视窗） */
  previousContent?: string
}

// ===== Store 类型 =====

interface AssetStore {
  assets: Record<string, AssetState>
  fileManager: FileManager | null

  init: (fm: FileManager) => Promise<void>
  selectCard: (path: string) => Promise<void>
  refreshFile: (path: string) => Promise<void>
  refreshAllFiles: () => Promise<void>
  getAssetList: () => AssetCardData[]
  clearAll: () => void
}

// ===== 初始状态 =====

const INITIAL_ASSET_STATE: AssetState = {
  content: '',
  status: 'pending',
}

// ===== Store =====

export const useAssetStore = create<AssetStore>((set, get) => ({
  assets: {},
  fileManager: null,

  init: async (fm: FileManager) => {
    set({ fileManager: fm })
    const fileInfos = await fm.listAssetFiles()
    const assets: Record<string, AssetState> = {}

    for (const info of fileInfos) {
      assets[info.path] = { ...INITIAL_ASSET_STATE }
      if (info.exists) {
        try {
          const content = await fm.readFile(info.path)
          assets[info.path] = { ...assets[info.path], content, status: 'generated' }
        } catch {
          // 读取失败，保持 pending
        }
      }
    }

    set({ assets })
  },

  selectCard: async (path: string) => {
    const fm = get().fileManager
    if (!fm) return
    const current = get().assets[path]
    if (!current) return

    try {
      const content = await fm.readFile(path)
      set((state) => ({
        assets: { ...state.assets, [path]: { ...current, content } },
      }))
    } catch {
      // 文件不存在，保持原状态
    }
  },

  refreshFile: async (path: string) => {
    const fm = get().fileManager
    if (!fm) return

    try {
      const content = await fm.readFile(path)
      set((state) => {
        const prev = state.assets[path]
        const isChanged = prev && prev.content !== content && prev.content !== ''
        const newStatus: AssetStatus =
          isChanged
            ? 'modified'
            : content
              ? 'generated'
              : 'pending'
        return {
          assets: {
            ...state.assets,
            [path]: {
              content,
              previousContent: isChanged ? prev.content : prev?.previousContent,
              status: newStatus,
            },
          },
        }
      })
    } catch {
      set((state) => ({
        assets: {
          ...state.assets,
          [path]: { ...INITIAL_ASSET_STATE, status: 'pending' },
        },
      }))
    }
  },

  refreshAllFiles: async () => {
    const fm = get().fileManager
    if (!fm) return

    const fileInfos = await fm.listAssetFiles()
    const assets: Record<string, AssetState> = {}

    for (const info of fileInfos) {
      if (info.exists) {
        try {
          const content = await fm.readFile(info.path)
          assets[info.path] = { content, status: 'generated' }
        } catch {
          assets[info.path] = { ...INITIAL_ASSET_STATE }
        }
      } else {
        assets[info.path] = { ...INITIAL_ASSET_STATE }
      }
    }

    // 更新 modified 状态：对比旧内容，保存 previousContent
    const prevAssets = get().assets
    for (const [path, state] of Object.entries(assets)) {
      if (state.status === 'generated') {
        const prev = prevAssets[path]
        if (prev && prev.content !== state.content && prev.content !== '') {
          assets[path] = { ...state, previousContent: prev.content, status: 'modified' }
        }
      } else if (state.status === 'modified') {
        // 保持 modified 文件的 previousContent（从旧状态继承）
        const prev = prevAssets[path]
        if (prev?.previousContent) {
          assets[path] = { ...state, previousContent: prev.previousContent }
        }
      }
    }

    set({ assets })
  },

  getAssetList: () => {
    const { assets } = get()
    return Object.entries(assets)
      .filter(([path]) => !path.startsWith('_'))
      .map(([path, state]) => {
      const meta = ASSET_META[path]
      return {
        path,
        filename: path.replace(/\.md$/, ''),
        group: meta?.group ?? '',
        status: state.status,
      }
    })
  },

  clearAll: () => {
    set({ assets: {}, fileManager: null })
  },
}))
