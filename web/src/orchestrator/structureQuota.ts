import type { CreationSpec, StructureQuota } from '../types/creationSpec'
import { formatCreationSpecLabel } from '../types/creationSpec'

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)))
}

function interpolate(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin
  const t = Math.min(1, Math.max(0, (value - inMin) / (inMax - inMin)))
  return outMin + (outMax - outMin) * t
}

function filmQuota(lengthMinutes: number): StructureQuota {
  const minutes = clamp(lengthMinutes, 10, 200)
  const label = formatCreationSpecLabel({ productKind: 'screenplay', lengthMinutes: minutes })
  if (minutes === 100) {
    return {
      productKind: 'screenplay',
      label,
      acts: 3,
      sequences: 8,
      scenes: 45,
      beatsPerScene: [4, 10],
      minutesTotal: minutes,
    }
  }
  if (minutes <= 30) {
    return {
      productKind: 'screenplay',
      label,
      acts: minutes <= 18 ? 1 : 2,
      sequences: clamp(interpolate(minutes, 10, 30, 2, 4), 2, 4),
      scenes: clamp(interpolate(minutes, 10, 30, 4, 12), 4, 12),
      beatsPerScene: [4, 8],
      minutesTotal: minutes,
    }
  }
  if (minutes <= 70) {
    return {
      productKind: 'screenplay',
      label,
      acts: 3,
      sequences: clamp(interpolate(minutes, 30, 70, 5, 8), 5, 8),
      scenes: clamp(interpolate(minutes, 30, 70, 15, 35), 15, 35),
      beatsPerScene: [4, 9],
      minutesTotal: minutes,
    }
  }
  if (minutes <= 120) {
    return {
      productKind: 'screenplay',
      label,
      acts: 3,
      sequences: clamp(interpolate(minutes, 70, 120, 8, 12), 8, 12),
      scenes: clamp(interpolate(minutes, 70, 120, 35, 70), 35, 70),
      beatsPerScene: [4, 10],
      minutesTotal: minutes,
    }
  }
  return {
    productKind: 'screenplay',
    label,
    acts: minutes >= 160 ? 5 : 4,
    sequences: clamp(interpolate(minutes, 120, 200, 12, 20), 12, 20),
    scenes: clamp(interpolate(minutes, 120, 200, 70, 120), 70, 120),
    beatsPerScene: [4, 10],
    minutesTotal: minutes,
  }
}

function novelQuota(wordCountWan: number): StructureQuota {
  const wan = clamp(wordCountWan, 1, 50)
  const wordsTotal = wan * 10_000
  const label = formatCreationSpecLabel({ productKind: 'novel', wordCountWan: wan })
  if (wan === 15) {
    return {
      productKind: 'novel',
      label,
      acts: 4,
      sequences: 40,
      scenes: 120,
      beatsPerScene: [4, 10],
      chapters: 40,
      wordsTotal,
    }
  }
  if (wan <= 3) {
    return {
      productKind: 'novel',
      label,
      acts: 1,
      sequences: clamp(interpolate(wan, 1, 3, 3, 8), 3, 8),
      scenes: clamp(interpolate(wan, 1, 3, 6, 20), 6, 20),
      beatsPerScene: [4, 8],
      chapters: clamp(interpolate(wan, 1, 3, 3, 8), 3, 8),
      wordsTotal,
    }
  }
  if (wan <= 10) {
    return {
      productKind: 'novel',
      label,
      acts: 3,
      sequences: clamp(interpolate(wan, 3, 10, 8, 25), 8, 25),
      scenes: clamp(interpolate(wan, 3, 10, 25, 80), 25, 80),
      beatsPerScene: [4, 10],
      chapters: clamp(interpolate(wan, 3, 10, 8, 25), 8, 25),
      wordsTotal,
    }
  }
  if (wan <= 30) {
    return {
      productKind: 'novel',
      label,
      acts: wan >= 22 ? 5 : 4,
      sequences: clamp(interpolate(wan, 10, 30, 25, 80), 25, 80),
      scenes: clamp(interpolate(wan, 10, 30, 80, 250), 80, 250),
      beatsPerScene: [4, 10],
      chapters: clamp(interpolate(wan, 10, 30, 25, 80), 25, 80),
      wordsTotal,
    }
  }
  return {
    productKind: 'novel',
    label,
    acts: 6,
    sequences: clamp(interpolate(wan, 30, 50, 80, 120), 80, 120),
    scenes: clamp(interpolate(wan, 30, 50, 250, 360), 250, 360),
    beatsPerScene: [4, 10],
    chapters: clamp(interpolate(wan, 30, 50, 80, 120), 80, 120),
    wordsTotal,
  }
}

function dramaQuota(spec: Extract<CreationSpec, { productKind: 'long_drama' | 'short_drama' }>): StructureQuota {
  const episodeCount = clamp(spec.episodeCount, spec.productKind === 'long_drama' ? 4 : 6, spec.productKind === 'long_drama' ? 60 : 100)
  const minutesPerEpisode = clamp(spec.minutesPerEpisode, spec.productKind === 'long_drama' ? 20 : 1, spec.productKind === 'long_drama' ? 60 : 15)

  if (spec.productKind === 'long_drama') {
    const scenesPerEpisode = minutesPerEpisode <= 30 ? 4 : minutesPerEpisode <= 45 ? 6 : 8
    const label = formatCreationSpecLabel({
      productKind: 'long_drama',
      episodeCount,
      minutesPerEpisode,
    })
    return {
      productKind: 'long_drama',
      label,
      acts: episodeCount <= 8 ? 3 : episodeCount <= 16 ? 4 : episodeCount <= 40 ? 6 : 8,
      sequences: episodeCount,
      scenes: episodeCount * scenesPerEpisode,
      beatsPerScene: [6, 10],
      episodes: episodeCount,
      minutesTotal: episodeCount * minutesPerEpisode,
    }
  }

  const scenesPerEpisode = minutesPerEpisode <= 3 ? 1 : minutesPerEpisode <= 8 ? 2 : 4
  const label = formatCreationSpecLabel({
    productKind: 'short_drama',
    episodeCount,
    minutesPerEpisode,
  })
  return {
    productKind: 'short_drama',
    label,
    acts: episodeCount <= 12 ? 3 : episodeCount <= 60 ? 4 : 5,
    sequences: episodeCount <= 12 ? 3 : 4,
    scenes: episodeCount * scenesPerEpisode,
    beatsPerScene: [4, 6],
    episodes: episodeCount,
    minutesTotal: episodeCount * minutesPerEpisode,
  }
}

export function buildStructureQuota(spec: CreationSpec): StructureQuota {
  if (spec.productKind === 'screenplay') return filmQuota(spec.lengthMinutes)
  if (spec.productKind === 'novel') return novelQuota(spec.wordCountWan)
  return dramaQuota(spec)
}

export function renderStructureQuotaXml(quota: StructureQuota): string {
  return [`<structure_quota product="${quota.productKind}" label="${quota.label}">`, renderStructureQuotaBody(quota), `</structure_quota>`].join('\n')
}

export function renderStructureQuotaBody(quota: StructureQuota): string {
  return [
    `  <acts>${quota.acts}</acts>`,
    `  <sequences>${quota.sequences}</sequences>`,
    `  <scenes>${quota.scenes}</scenes>`,
    `  <beats_per_scene>${quota.beatsPerScene[0]}-${quota.beatsPerScene[1]}</beats_per_scene>`,
    quota.episodes ? `  <episodes>${quota.episodes}</episodes>` : '',
    quota.chapters ? `  <chapters>${quota.chapters}</chapters>` : '',
    quota.minutesTotal ? `  <minutes_total>${quota.minutesTotal}</minutes_total>` : '',
    quota.wordsTotal ? `  <words_total>${quota.wordsTotal}</words_total>` : '',
    `  <note>这是系统换算出的稳定规划额度，只用于约束整体规模；不要把用户侧控件扩展为新的调参分支。</note>`,
  ].filter(Boolean).join('\n')
}
