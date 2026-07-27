import { Router } from 'express'
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
  ProjectNotFound,
  type CreationSpec,
} from '../services/projectStore.js'

export const projectsRouter = Router()

// GET /api/projects — 项目列表
projectsRouter.get('/', (_req, res) => {
  res.json(listProjects())
})

// POST /api/projects — 新建项目
projectsRouter.post('/', (req, res) => {
  const { name } = req.body as { name?: string }
  res.json(createProject(name ?? '未命名项目'))
})

// GET /api/projects/:id — 项目 metadata
projectsRouter.get('/:id', (req, res) => {
  const meta = getProject(req.params.id)
  if (!meta) {
    res.status(404).json({ error: { kind: 'not_found', message: '项目不存在' } })
    return
  }
  res.json(meta)
})

// PATCH /api/projects/:id — 更新展示信息与可恢复的运行状态
projectsRouter.patch('/:id', (req, res) => {
  try {
    const patch = req.body as {
      name?: string
      description?: string
      productKind?: 'novel' | 'screenplay' | 'long_drama' | 'short_drama' | null
      creationSpec?: CreationSpec | null
      phase?: 'designing' | 'writing'
    }
    const productKinds = new Set(['novel', 'screenplay', 'long_drama', 'short_drama'])
    if (
      patch.productKind !== undefined &&
      patch.productKind !== null &&
      !productKinds.has(patch.productKind)
    ) {
      res.status(400).json({ error: { kind: 'bad_request', message: '无效的 productKind' } })
      return
    }
    if (patch.creationSpec !== undefined && patch.creationSpec !== null) {
      if (!isValidCreationSpec(patch.creationSpec)) {
        res.status(400).json({ error: { kind: 'bad_request', message: '无效的 creationSpec' } })
        return
      }
      if (patch.productKind !== undefined && patch.productKind !== null && patch.creationSpec.productKind !== patch.productKind) {
        res.status(400).json({ error: { kind: 'bad_request', message: 'creationSpec 与 productKind 不一致' } })
        return
      }
    }
    if (patch.phase !== undefined && patch.phase !== 'designing' && patch.phase !== 'writing') {
      res.status(400).json({ error: { kind: 'bad_request', message: '无效的 phase' } })
      return
    }
    res.json(updateProject(req.params.id, patch))
  } catch (e) {
    if (e instanceof ProjectNotFound) {
      res.status(404).json({ error: { kind: 'not_found', message: e.message } })
      return
    }
    res
      .status(500)
      .json({ error: { kind: 'internal', message: e instanceof Error ? e.message : String(e) } })
  }
})

// DELETE /api/projects/:id — 硬删
projectsRouter.delete('/:id', (req, res) => {
  deleteProject(req.params.id)
  res.json({ ok: true })
})

function isValidCreationSpec(spec: CreationSpec): boolean {
  if (!spec || typeof spec !== 'object') return false
  if (spec.productKind === 'screenplay') return isFinitePositive(spec.lengthMinutes)
  if (spec.productKind === 'novel') return isFinitePositive(spec.wordCountWan)
  if (spec.productKind === 'long_drama' || spec.productKind === 'short_drama') {
    return isFinitePositive(spec.episodeCount) && isFinitePositive(spec.minutesPerEpisode)
  }
  return false
}

function isFinitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0
}
