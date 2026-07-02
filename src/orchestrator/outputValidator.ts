import type { ToolSpec, ValidationResult } from '../types'

/**
 * v4 版输出校验器
 *
 * 校验逻辑简化：每个 Tool 只输出一个 TAG 对，
 * 直接从 ToolSpec.outputTags 读取 [START, END] 进行校验。
 */

/**
 * 校验 Tool 输出
 *
 * @param output - Tool 返回的原始输出
 * @param tool - ToolSpec
 * @returns 校验结果
 */
export function validateOutput(output: string, tool: ToolSpec): ValidationResult {
  const [startTag, endTag] = tool.outputTags

  // 无 TAG 的工具（如 reset_all）跳过校验
  if (!startTag || !endTag) {
    return { valid: true, missingTags: [], extracted: {} }
  }

  const missingTags: string[] = []
  if (!output.includes(startTag)) missingTags.push(startTag)
  if (!output.includes(endTag)) missingTags.push(endTag)

  const extracted: Record<string, string> = {}
  if (missingTags.length === 0) {
    const content = extractBetween(output, startTag, endTag)
    if (content !== null && tool.writes.length > 0) {
      // 写入第一个 writes 文件（大多数 Tool 只写一个文件）
      extracted[tool.writes[0]] = content
    }
  }

  return {
    valid: missingTags.length === 0,
    missingTags,
    extracted,
  }
}

/**
 * 提取两个 TAG 之间的内容
 */
function extractBetween(text: string, startTag: string, endTag: string): string | null {
  const startIdx = text.indexOf(startTag)
  if (startIdx === -1) return null
  const contentStart = startIdx + startTag.length
  const endIdx = text.indexOf(endTag, contentStart)
  if (endIdx === -1) return null
  return text.slice(contentStart, endIdx).trim()
}
