import type { ToolSpec } from '../types'

/**
 * v4 版上下文组装器
 *
 * 从 ToolSpec.reads 读取文件列表，自动组装为 XML 标签格式的上下文。
 * 标签名从文件名推导（worldbuilding.md → worldbuilding）。
 */

/**
 * 组装 Tool 上下文
 *
 * @param tool - ToolSpec
 * @param files - 文件内容映射 { path: content }
 * @returns XML 标签格式的上下文
 */
export function assembleContext(
  tool: ToolSpec,
  files: Record<string, string>,
): string {
  const parts: string[] = []

  for (const filePath of tool.reads) {
    const tagName = filePath.replace(/\.md$/, '')
    const content = files[filePath]

    if (content !== undefined && content.length > 0) {
      parts.push(`<${tagName}>\n${content}\n</${tagName}>`)
    } else {
      parts.push(`<${tagName}></${tagName}>`)
    }
  }

  return parts.join('\n\n')
}

/**
 * 构建最终的 Tool Prompt
 *
 * @param context - 已组装的上下文
 * @param instruction - 用户修改指令
 * @returns 发送给 LLM 的 user content
 */
export function buildAgentPrompt(
  context: string,
  instruction: string,
): string {
  return `${context}\n\n<user_revision_instruction>\n${instruction}\n</user_revision_instruction>`
}
