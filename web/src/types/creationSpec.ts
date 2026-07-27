import type { ProductKind } from './product'

export type CreationSpec =
  | {
      productKind: 'screenplay'
      lengthMinutes: number
    }
  | {
      productKind: 'novel'
      wordCountWan: number
    }
  | {
      productKind: 'long_drama'
      episodeCount: number
      minutesPerEpisode: number
    }
  | {
      productKind: 'short_drama'
      episodeCount: number
      minutesPerEpisode: number
    }

export interface StructureQuota {
  productKind: ProductKind
  label: string
  acts: number
  sequences: number
  scenes: number
  beatsPerScene: [number, number]
  chapters?: number
  episodes?: number
  minutesTotal?: number
  wordsTotal?: number
}

export const DEFAULT_CREATION_SPEC: Record<ProductKind, CreationSpec> = {
  screenplay: { productKind: 'screenplay', lengthMinutes: 100 },
  novel: { productKind: 'novel', wordCountWan: 15 },
  long_drama: { productKind: 'long_drama', episodeCount: 24, minutesPerEpisode: 45 },
  short_drama: { productKind: 'short_drama', episodeCount: 24, minutesPerEpisode: 3 },
}

export function getDefaultCreationSpec(kind: ProductKind): CreationSpec {
  return { ...DEFAULT_CREATION_SPEC[kind] } as CreationSpec
}

export function formatCreationSpecLabel(spec: CreationSpec): string {
  if (spec.productKind === 'screenplay') return `电影 · ${spec.lengthMinutes}分钟`
  if (spec.productKind === 'novel') return `小说 · ${spec.wordCountWan}万字`
  if (spec.productKind === 'long_drama') {
    return `长剧 · ${spec.episodeCount}集 × ${spec.minutesPerEpisode}分钟`
  }
  return `短剧 · ${spec.episodeCount}集 × ${spec.minutesPerEpisode}分钟`
}

export function isCreationSpec(value: unknown): value is CreationSpec {
  if (!value || typeof value !== 'object') return false
  const spec = value as Partial<Record<string, unknown>>
  if (
    spec.productKind !== 'screenplay' &&
    spec.productKind !== 'novel' &&
    spec.productKind !== 'long_drama' &&
    spec.productKind !== 'short_drama'
  ) {
    return false
  }
  if (spec.productKind === 'screenplay') return typeof spec.lengthMinutes === 'number'
  if (spec.productKind === 'novel') return typeof spec.wordCountWan === 'number'
  return typeof spec.episodeCount === 'number' && typeof spec.minutesPerEpisode === 'number'
}
