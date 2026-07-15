import type { ToolResult, TurnStopReason, TurnSummary, TurnToolSummary } from '../types'

export interface ExecutedToolResult {
  toolId: string
  toolName: string
  result: ToolResult
}

interface BuildTurnSummaryInput {
  executions: ExecutedToolResult[]
  stopReason: TurnStopReason
  assistantNote?: string
  extraWarnings?: string[]
  startedAt: number
  finishedAt: number
}

const INTERRUPTED_REASONS = new Set<TurnStopReason>([
  'timeout',
  'no_progress',
  'duplicate_call',
  'round_limit',
])

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))]
}

function toToolSummary(execution: ExecutedToolResult): TurnToolSummary {
  return {
    id: execution.toolId,
    name: execution.toolName,
    writes: unique(execution.result.writes ?? []),
    error: execution.result.error,
  }
}

export function buildTurnSummary(input: BuildTurnSummaryInput): TurnSummary {
  const completedTools = input.executions
    .filter((execution) => execution.result.success)
    .map(toToolSummary)
  const failedTools = input.executions
    .filter((execution) => !execution.result.success)
    .map(toToolSummary)
  const warnings = unique([
    ...input.executions.flatMap((execution) => execution.result.warnings ?? []),
    ...(input.extraWarnings ?? []),
  ])
  const writes = unique(completedTools.flatMap((tool) => tool.writes))

  let status: TurnSummary['status']
  if (completedTools.length > 0) {
    status = failedTools.length > 0 || warnings.length > 0 || input.stopReason !== 'normal'
      ? 'partial'
      : 'completed'
  } else if (INTERRUPTED_REASONS.has(input.stopReason)) {
    status = 'interrupted'
  } else if (failedTools.length > 0) {
    status = 'failed'
  } else if (input.stopReason === 'normal') {
    // 纯问答轮没有工具写入，但仍属于正常完成。
    status = 'completed'
  } else {
    status = 'failed'
  }

  return {
    status,
    stopReason: input.stopReason,
    completedTools,
    failedTools,
    writes,
    warnings,
    assistantNote: input.assistantNote?.trim() || undefined,
    startedAt: input.startedAt,
    finishedAt: input.finishedAt,
  }
}

const STATUS_TITLES: Record<TurnSummary['status'], string> = {
  completed: '本轮已完成',
  partial: '本轮部分完成',
  failed: '本轮未完成',
  interrupted: '本轮已中止',
}

const STOP_REASON_TEXT: Partial<Record<TurnStopReason, string>> = {
  length: '模型响应过长，已保留成功写入的内容',
  content_filter: '模型响应被内容过滤器中止',
  timeout: '达到本轮时间上限，已自动停止',
  no_progress: '连续两轮没有新增进展，已自动停止',
  duplicate_call: '检测到重复工具调用，已阻止重复执行',
  round_limit: '达到本轮调度上限，已自动停止',
  error: '执行过程中发生异常',
}

function compactInline(items: string[], limit = 12): string {
  const visible = items.slice(0, limit)
  const suffix = items.length > limit ? ` 等 ${items.length} 项` : ''
  return `${visible.join('、')}${suffix}`
}

function shouldAppendAssistantNote(note: string | undefined): note is string {
  if (!note) return false
  const normalized = note.replace(/[。！!\s]/g, '')
  return normalized !== '处理完成' && normalized !== '已完成'
}

/** 把确定性结果渲染成最终用户消息；LLM 文本只能作为补充说明。 */
export function renderTurnSummary(summary: TurnSummary): string {
  const lines = [`## ${STATUS_TITLES[summary.status]}`, '']

  if (summary.completedTools.length > 0) {
    lines.push(`- 完成：${compactInline(unique(summary.completedTools.map((tool) => tool.name)))}`)
  }
  if (summary.writes.length > 0) {
    lines.push(`- 写入：${compactInline(summary.writes.map((path) => `\`${path}\``))}`)
  }
  if (summary.failedTools.length > 0) {
    const failures = summary.failedTools.map((tool) =>
      tool.error ? `${tool.name}（${tool.error}）` : tool.name,
    )
    lines.push(`- 未完成：${compactInline(failures, 6)}`)
  }
  if (summary.warnings.length > 0) {
    lines.push(`- 提示：${compactInline(summary.warnings, 5)}`)
  }

  const stopReason = STOP_REASON_TEXT[summary.stopReason]
  if (stopReason) lines.push(`- 收口原因：${stopReason}`)

  if (shouldAppendAssistantNote(summary.assistantNote)) {
    lines.push('', summary.assistantNote)
  } else if (lines.length === 2) {
    lines.push('本轮没有需要修改的资产。')
  }

  return lines.join('\n')
}
