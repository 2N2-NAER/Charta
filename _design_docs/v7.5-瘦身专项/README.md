# StoryCrafter v7.5 瘦身专项

## 1. 专项目标

v7.3 完成了“宽泛 Subagent + 三层细纲 + 资产完整度校准”的主架构重构，v7.4 又补齐了按项目恢复产品方向、创作阶段、对话与真实资产进度。当前仓库仍同时保留多代实现，造成不可达代码、过期提示词、重复入口和预留接口长期共存。

v7.5 的目标是：以当前真实用户链路为唯一基准，收敛执行路径、移除废弃功能、恢复工程质量门禁，并降低后续修改时误触旧逻辑的风险。

本专项遵守两项已确认决策：

1. **保留 DiffViewer。** 词级差异能力及其依赖不纳入删除范围；后续应重新接入明确的版本对比交互，而不是继续保持不可达状态。
2. **删除对话框内“请选择创作阶段”模块。** v7.3 已由资产栏的三层完整度校准和“进入写作模式”按钮接管设计期到写作期的切换，对话 StageCard 不再是有效入口。

## 2. 当前权威用户链路

1. 用户在当前项目选择小说、剧本、长剧或短剧，选择结果按项目持久化。
2. Orchestrator 调度设计区 Subagent，生成六项核心资产以及 `sequences/`、`scenes/`、`beats/` 三层细纲。
3. 资产栏按 `sequence_list.md` 中的序列 ID 校准三层文件完整度。
4. 全部序列的三层细纲完成后，用户点击“进入写作模式”。
5. 系统机械合并为 `sequence_outlines/<ID>.md`，锁定设计资产并进入写作期。
6. `prose_writer` 消费序列细纲，写入 `chapters/`。

因此，任何绕过第 3～5 步、直接从对话消息切换 phase 的入口都应删除。

## 3. 本轮已执行

### 3.1 删除对话 StageCard 链

- 删除 `StageCard.tsx` 与 `StageCard.module.css`。
- `ChatHistory` 只渲染普通对话消息，不再识别阶段提案消息。
- 删除 `ChatMessage` 的 `kind/stageState/resolvedStage` 字段。
- 删除 `DispatchResult.stageProposal` 和引擎的 `probeAllScenesReady()`。
- 删除 `chatStore.resolveStage()`、阶段卡生成逻辑和 pending 恢复逻辑。
- 删除前后端 `stageProposalPending` 项目 metadata 契约。
- 保留 v7.3 `DesignCompletenessBar → mergeAllSequenceOutlines → phase.lock()` 作为唯一写作模式入口。

### 3.2 明确保留 DiffViewer

以下文件与依赖保留，不在本专项删除清单中：

- `web/src/components/DiffViewer.tsx`
- `web/src/utils/diff.ts`
- `diff`、`@types/diff`
- `rehype-raw`、`rehype-sanitize`
- `.diff-add`、`.diff-remove` 样式和颜色变量

后续任务是为 DiffViewer 确定唯一、可测试的入口；在入口确定前不删除实现。

## 4. P0：先修复再瘦身

这些问题仍会影响当前行为，必须先收敛逻辑，再删除其旧实现。

### 4.1 修正 sequence_builder 目标协议

`skillLoader.ts` 的 target 白名单仍登记旧 `scene_beats`，未登记当前 `sequence_builder`。结果是模型即使请求单个序列，引擎也可能收到空 target 并批量执行全部序列。

处理方案：

- 把 `sequence_builder` 注册为 `target_sequence` 使用者。
- 删除 `scene_beats` target 描述。
- 增加“指定单序列只写一个序列、空 target 才批量”的调度测试。

### 4.2 统一 prose_writer 产品规则

四种产品都映射到 `prose_writer`，但当前只预装小说、短剧、视频脚本三份规则，没有独立的电影剧本和长剧规则；隔离执行路径也没有确定性注入当前 `ProductProfile`，可能根据 instruction 关键词选错文体。

处理方案：

- 为电影剧本、长剧补齐独立规则，或建立明确的产品到 Skill 映射。
- 在 isolated context 中注入锁定的 `product_profile`。
- Skill 选择首先以 `profile.kind` 决定，关键词只用于同产品内的细分能力。

### 4.3 修正完整度统计

当前完整度分子会统计所有 `sequences/`、`scenes/`、`beats/` 文件，包括已经不在 `sequence_list.md` 中的孤儿文件。多余旧文件可能导致分子大于分母，使按钮永久不可用。

处理方案：只统计当前序列清单中每个 ID 对应的三条精确路径，并单独报告孤儿文件，不让孤儿文件参与完成度。

### 4.4 收紧批量并发

当前 `BATCH_CONCURRENCY = 50`，而历史设计和提示词仍描述并发 3。50 路并发容易触发模型限流，也会放大部分失败和重试压力。

处理方案：将默认值收敛到 3～5，并把并发值提取为单一配置源；执行日志与提示词从该配置生成，不再手工重复。

### 4.5 明确写作期返回设计期的产品规则

删除 StageCard 后，当前 UI 是单向的“进入写作模式”。`phaseStore.unlock()` 仍存在，但没有正式入口，部分错误文案却继续提示用户去 HeaderBar 解锁。

需要产品决策：

- 若阶段只允许单向推进：删除 `unlock()` 及全部解锁文案。
- 若允许回退修改：在资产栏提供明确的“返回设计模式”入口，并定义已生成正文、基线与重新合并的处理规则。

在决策前不应恢复对话 StageCard。

## 5. P1：删除不可达旧执行链

### 5.1 旧 scene_beats Pipeline

当前注册表仍保留 `scene_beats`，并引用已经不存在的 `scene_designer`、`beat_writer`。以下内容属于旧管道：

- `PipeStepDef`、`PipeRegistryValue`、`PIPELINE_REGISTRY`
- `checkSceneTable`、`extractSceneIds`、`checkBeatBlocks`、`countBeatBlocks` 桩函数
- `assembleSequenceDoc`
- `runPipelineSoftValidation`、`runSingleStep`、`designExtras`
- `runSequencePipeline`、`runBatchPipeline`、`pipelineFail`、`sliceSceneRow`
- executeTool 中的 Pipeline Registry 分支

删除前需确认其中的通用读文件、并发池、重试辅助是否仍被当前 isolated path 使用；共享能力保留并改成中性命名。

### 5.2 旧 writer Pipeline

`prose_writer` 已先被 `ISOLATED_SUBAGENT_IDS` 分支捕获，后面的 `WRITER_IDS` 旧 writer 分支不可达。待 4.2 完成后删除：

- `SHORT_DRAMA_SHOT_SPEC`
- `behaviorTrack`、`foreshadowingState`、`batchProgress` 及配套读写方法
- `runSoftValidation`、`buildChapterSkeleton`
- `buildEpisodeRangeMap`、`resolveChapterPath`
- `runWriterStep`、`runWriterSequencePipeline`、`runWriterBatchPipeline`
- executeTool 中不可达的旧 writer 分支
- 仅服务旧 writer 的 `pad2`、`seqOrdinal`、分段续写与旧重试辅助

### 5.3 重构后的目标

- `orchestratorEngine.ts` 只保留一套 executeTool 分发路径。
- `sequence_builder`、`prose_writer`、`quality_checker` 统一走 isolated runner。
- 通用批量能力只有一个实现。
- 不再保留“为了让旧代码编译而返回 null/0/空集合”的桩函数。

## 6. P1：删除已退役功能残留

### 6.1 reset_all

产品能力已删除，但仓库仍有无调用方的残留：

- FileManager 的 `clearAll()`、`clearByPrefix()` 及两种实现
- `DELETE /api/projects/:id/assets` 根端点
- `projectStore.clearAssets()`
- `assetStore.clearAll()`
- `DISABLED_SUBAGENT_IDS` 中的 `reset_all`
- 执行日志图标/说明、outputValidator 和 phaseStore 中的 reset_all 注释
- 两份历史 `reset_all.md` 设计提示词

若没有对外 API 兼容要求，可整链删除；单文件 DELETE 和项目 DELETE 保留。

### 6.2 Relations 预留系统

当前前端没有调用方，后端固定返回 501，属于未实现预留：

- `web/src/api/relations.ts`
- `server/src/routes/relations.ts` 及 index 挂载
- `AssetRelation`、`AssetRelationType`、资产状态中的 relations 字段
- `ProjectMeta.relations`

建议从生产代码删除；未来确定关系模型后按真实需求重新设计。

### 6.3 旧资产路径

清理下列不再由当前 Skill 生成的默认路径与引用：

- `scene_beat_outline.md`
- `draft_history.md`

同步更新 `subplot_manager`、`user_requirements_analyzer` 等仍引用旧文件或旧 `story_checker` 名称的 Skill 文案。

### 6.4 零调用辅助与多余导出

- 删除未调用的 `listGeneratedAssets`。
- 删除未使用的 `DEFAULT_VALIDATION_SET`。
- `parseSequenceIds`、`SUBAGENT_REASON`、`SUBAGENT_GLYPH` 等仅内部使用的符号取消多余 export。
- 合并重复的序列 ID 解析实现，避免规则继续漂移。

## 7. P1：提示词和执行日志换代

`orchestrator_v5.md` 仍引用旧的 `scene_beats`、`story_checker`、四个旧 writer ID、HeaderBar 阶段按钮与“最多 10 轮”，而实际实现已经是 `sequence_builder`、`quality_checker`、`prose_writer` 和 100 轮安全阀。

处理方案：

- 按 v7.5 当前工具注册表重写 Orchestrator prompt。
- 删除固定工具名清单，能从运行时 tool specs 获取的信息不重复维护。
- 将三层构筑、完整度校准、合并细纲、写作期的边界写成当前唯一流程。
- 更新 `subagentGlyphs.ts`，移除 `scene_beats/story_checker/四旧 writer/reset_all`，补齐当前三个宽泛 Subagent。
- 更新需求整理 Skill 中“只能由 story_checker 更新”的旧规则，使之与引擎后处理一致。

## 8. P2：仓库与工程质量

### 8.1 历史设计文档

仓库中 `_design_docs` 有 115 个文件，虽然 `.gitignore` 已忽略该目录，但历史文件仍被 Git 跟踪。大量 v4～v7 文档与当前实现互相冲突。

处理方案：

- 主分支只保留本 v7.5 权威方案和后续实际需要维护的架构文档。
- 历史设计依赖 Git 历史查询，不继续堆在生产树中。
- 删除拼写错误的 `ptoduct_design_*` 目录。

### 8.2 构建与品牌残留

- 删除被跟踪的 `tsconfig.node.tsbuildinfo`。
- 替换 Vite 默认 favicon。
- 更新 `project_summary_8.0`：移除不存在的截图、旧前端 API Key 配置、旧 Diff/Checker/阶段描述；或将准确内容迁移成根 README 后删除该目录。

### 8.3 质量门禁

- ESLint 9 已安装但缺少 `eslint.config.*`，需要补 flat config 或调整依赖版本。
- 增加最小自动化测试：target 路由、三层完整度、合并与 phase lock、项目恢复、四产品 writer 选择。
- 生产构建当前约 622 KB，需要在删除旧链后重新测量，再决定是否按页面/Markdown 渲染器拆包。
- `openai` 当前只作为 TypeScript 类型来源，应移动到 devDependencies 或改为本地 DTO 类型。

## 9. 建议提交顺序

1. `refactor: remove conversational stage proposal flow`
2. `fix: converge target routing and writing-mode gate`
3. `fix: make prose rules deterministic by product profile`
4. `refactor: remove legacy scene and writer pipelines`
5. `refactor: remove retired reset and relation contracts`
6. `docs: replace legacy prompts and repository documents`
7. `chore: restore lint tests and repository hygiene`

每个提交都应通过前后端类型检查和生产构建；涉及调度的提交还必须补对应自动化测试，避免再次通过“保留旧分支兜底”积累技术债。

## 10. 完成标准

- 对话框不再出现“请选择创作阶段”。
- 进入写作模式只能由资产完整度校准按钮触发，并且先生成全部 `sequence_outlines`。
- 指定单序列不会误触全量批处理。
- 四种产品稳定选择各自正文规则。
- Orchestrator 只存在一套有效分发链，没有旧 pipeline 桩函数。
- reset_all 与 relations 预留链从生产代码中消失。
- DiffViewer 有明确入口并继续保留。
- 提示词、日志映射、Skill 名称与运行时注册表一致。
- `npm run lint`、类型检查、生产构建和关键链路测试全部通过。
