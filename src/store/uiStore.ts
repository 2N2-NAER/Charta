import { create } from 'zustand'

// ===== 类型 =====

interface UIStore {
  /** 当前选中的资产卡片路径 */
  selectedCard: string | null
  /** 左侧栏基线 Tab */
  baselineTab: 'approved' | 'pre-edit'

  setSelectedCard: (path: string | null) => void
  setBaselineTab: (tab: 'approved' | 'pre-edit') => void
  reset: () => void
}

// ===== 初始状态 =====

const INITIAL_STATE: Pick<UIStore, 'selectedCard' | 'baselineTab'> = {
  selectedCard: null,
  baselineTab: 'approved',
}

// ===== Store =====

export const useUIStore = create<UIStore>((set) => ({
  ...INITIAL_STATE,

  setSelectedCard: (path: string | null) => {
    set({ selectedCard: path })
  },

  setBaselineTab: (tab: 'approved' | 'pre-edit') => {
    set({ baselineTab: tab })
  },

  reset: () => {
    set({ ...INITIAL_STATE })
  },
}))
