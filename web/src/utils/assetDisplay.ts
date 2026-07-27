import type { AssetCardData } from '../types'

const FILE_LABELS: Record<string, string> = {
  'worldbuilding.md': '世界设定',
  'characters.md': '人物小传',
  'act_map.md': '幕结构',
  'sequence_list.md': '剧情单元清单',
  'foreshadowing.md': '伏笔清单',
  'subplots.md': '支线清单',
  'user_requirements.md': '需求清单',
}

const PRIMARY_WRITING_DIRS = [
  'novel_chapters/',
  'short_drama_scripts/',
  'long_drama_scripts/',
  'film_scripts/',
  'chapters/',
]

function startsWithAny(path: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => path.startsWith(prefix))
}

export function isPrimaryWritingAsset(path: string): boolean {
  return startsWithAny(path, PRIMARY_WRITING_DIRS)
}

export function isWritingAsset(path: string): boolean {
  return isPrimaryWritingAsset(path) || path.startsWith('video_scripts/')
}

export function getAssetDisplayName(path: string): string {
  if (FILE_LABELS[path]) return FILE_LABELS[path]
  const seqMatch = path.match(/^sequences\/(.+)\.md$/)
  if (seqMatch) return `剧情单元 ${seqMatch[1]}`
  const sceneMatch = path.match(/^scenes\/(.+)\.md$/)
  if (sceneMatch) return `场景 ${sceneMatch[1]}`
  const beatMatch = path.match(/^beats\/(.+)\.md$/)
  if (beatMatch) return `节拍 ${beatMatch[1]}`
  const outlineMatch = path.match(/^sequence_outlines\/(.+)\.md$/)
  if (outlineMatch) return `剧情单元细纲 ${outlineMatch[1]}`
  const novelMatch = path.match(/^novel_chapters\/(.+)\.md$/)
  if (novelMatch) return `小说正文 ${formatWritingAssetId(novelMatch[1])}`
  const shortDramaMatch = path.match(/^short_drama_scripts\/(.+)\.md$/)
  if (shortDramaMatch) return `短剧正文 ${formatWritingAssetId(shortDramaMatch[1])}`
  const longDramaMatch = path.match(/^long_drama_scripts\/(.+)\.md$/)
  if (longDramaMatch) return `长剧正文 ${formatWritingAssetId(longDramaMatch[1])}`
  const filmMatch = path.match(/^film_scripts\/(.+)\.md$/)
  if (filmMatch) return `电影正文 ${formatWritingAssetId(filmMatch[1])}`
  const videoMatch = path.match(/^video_scripts\/([^/]+)\/(.+)\.md$/)
  if (videoMatch) {
    const productLabel =
      videoMatch[1] === 'short_drama'
        ? '短剧'
        : videoMatch[1] === 'long_drama'
          ? '长剧'
          : '电影'
    return `${productLabel}视频脚本 ${formatWritingAssetId(videoMatch[2])}`
  }
  const chMatch = path.match(/^chapters\/(.+)\.md$/)
  if (chMatch) return `旧正文 ${formatWritingAssetId(chMatch[1])}`
  return path.replace(/\.md$/, '')
}

export function getAssetDisplayGroup(path: string, fallbackGroup = ''): string {
  if (path === 'user_requirements.md') return '项目总览'
  if (path === 'worldbuilding.md') return '世界与规则'
  if (path === 'characters.md') return '人物与关系'
  if (path === 'act_map.md' || path === 'sequence_list.md' || path === 'foreshadowing.md' || path === 'subplots.md') {
    return '剧情结构'
  }
  if (path.startsWith('sequences/') || path.startsWith('scenes/') || path.startsWith('beats/')) return '细纲'
  if (path.startsWith('sequence_outlines/')) return '剧情单元细纲'
  if (isWritingAsset(path)) return '正文'
  return fallbackGroup
}

export function getAssetMetaInfo(path: string): string | undefined {
  if (!isWritingAsset(path)) return undefined
  return path.replace(/^[^/]+\//, '').replace(/\.md$/, '')
}

export function applyAssetDisplay(
  card: Pick<AssetCardData, 'path'>,
  fallbackGroup = '',
): Pick<AssetCardData, 'filename' | 'group' | 'metaInfo'> {
  return {
    filename: getAssetDisplayName(card.path),
    group: getAssetDisplayGroup(card.path, fallbackGroup),
    metaInfo: getAssetMetaInfo(card.path),
  }
}

function formatWritingAssetId(name: string): string {
  const range = name.match(/^E(\d+)-E(\d+)$/)
  if (range) return `第${Number(range[1])}-${Number(range[2])}集`
  const single = name.match(/^E(\d+)$/)
  if (single) return `第${Number(single[1])}集`
  return name
}
