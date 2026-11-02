---
name: learning-docs-site
display_name: 学习文档站生成器
display_name_en: Learning Docs Site Builder
description: 生成「项目代码 × 官方文档」结合的 VitePress 中文学习站。仅当用户明确要求搭建/生成学习文档站、技术笔记站、文档站点，或要求把官方文档与项目源码对照成学习材料时使用。不用于生成 API 参考手册，也不修改业务代码。
description_zh: 为任意技术栈/框架/语言/中间件生成「项目代码 × 官方文档」结合的 VitePress 中文学习站：Mermaid 心智模型图、分组可折叠侧栏、项目核心代码块（标注出处与结论）、工程实践、自测题与官方链接，附一键启动脚本。
description_en: Generate a local VitePress study site that pairs a project's source code with official documentation — Mermaid mental-model diagrams, grouped sidebar, annotated core code snippets, engineering practices, self-tests, official links, and a one-click launcher.
version: 1.0.0
author: gelijie
license: MIT
examples_zh:
  - "按 learning-docs-site 给 Spring Security 建一个学习文档站"
  - "把项目里的 RabbitMQ 用法和官方文档对照，生成学习文档站"
  - "给 Redis 建学习文档站，要 Mermaid 图和自测题"
examples_en:
  - "Build a Spring Security study docs site with learning-docs-site"
  - "Generate a study docs site comparing the RabbitMQ usage in this project with the official docs"
  - "Create a Redis study docs site with Mermaid diagrams and self-tests"
---

# Learning Docs Site（学习站点生成）

把「官方概念 + 项目/源码真实用法」整合成一个可本地阅读的 **VitePress** 学习站。

**成果形态**：一个站点可并列多个主题，共用同一套导航模板与章节写法；单主题则只保留一组。

## 适用场景

| 类型 | 示例 | 采集重点 |
|------|------|----------|
| 中间件 / 基础设施 | ES、RabbitMQ、Redis、Kafka | 连接配置、生产/消费入口、可靠性兜底 |
| 框架 / 运行时 | Spring、MyBatis、Netty、Vue、React | 启动链路、核心注解/钩子、扩展点 |
| 语言 / 平台特性 | Java 并发、JVM、TypeScript、Go module | 项目里真实出现的 API 用法与边界 |
| 架构 / 工程模式 | 分布式事务、缓存、鉴权、DDD 分层 | 横切模块、一次完整请求/事务的代码路径 |

**原则**：本站目标是**心智模型 + 可验证的自测 + 五层深挖**，不是 API 字段手册。官方文档负责查细节；本站负责「是什么、为什么、机制、与替代方案对比、在项目里如何落地及边界」。每个知识点须写满 **L1～L5**（见 references/five-layer-depth.md），禁止只描述「项目干了什么」。

## 生成流程

```
Task Progress:
- [ ] 1. 检测环境（Node 18+）
- [ ] 2. 选址建骨架（templates 复制）
- [ ] 3. 采集项目/源码中的该技术用法
- [ ] 4. 按章节模板写 docs/
- [ ] 5. npm run docs:build 验证 + 人工浏览检查
- [ ] 6. 交付启动方式
```

### 1. 检测环境

```bash
node --version    # 需要 18+；缺失则提示安装 https://nodejs.org
npm --version
```

本 skill 用 VitePress，不依赖 Python。**不要改装 MkDocs**——原因见文末「为什么不是 MkDocs」。

### 2. 选址建骨架

- **单主题**：站点目录与目标项目仓库**同级**（如 `<projects>/<主题>-learning-docs`），**不要建在 agent 的工作区目录里**。部分客户端会为工作区建立文件索引，目录越大轮询负载越高，媒体文件是主要放大因子（详见「为什么不是 MkDocs」）。
- **多主题合并**：一个站点，`docs/<主题slug>/` 各一组，`sidebar` 顶层按主题分组。

从本 skill 的 `templates/` 复制骨架（占位符不替换会导致构建失败）：

| 模板 | 落到站点 | 说明 |
|------|----------|------|
| `templates/package.json` | `package.json` | 替换 `{{站点slug}}` |
| `templates/docs/.vitepress/config.mts` | `docs/.vitepress/config.mts` | 替换 `{{站点名}}`、`{{站点描述}}`、`{{主题组1}}`、`{{主题组1slug}}`，补 sidebar |
| `templates/docs/.vitepress/theme/` | `docs/.vitepress/theme/` | 主题入口 + `Card`/`CardGrid` 组件 + `custom.css`，**不要改动内容** |
| `templates/start-reading.bat` | 同名 bat | Windows 双击启动；**必须 ASCII-only**，规则见下 |
| `templates/scripts/pick-port.ps1` | `scripts/pick-port.ps1` | 端口探测（5173–5192），bat 内勿内联长 PowerShell |
| `templates/scripts/wait-and-open.ps1` | `scripts/wait-and-open.ps1` | 等服务 HTTP 就绪后再开浏览器，避免 dev 白屏误判 |
| `templates/.gitignore` | 同名 | 隐藏文件，复制时确认没被跳过 |

**`start-reading.bat` 硬约束（双击踩坑回写）**：`cmd.exe` 对 UTF-8/GBK 混用极敏感。bat 全文（含 `rem`）保持 **ASCII**；`if (...)` 块内禁止中文；用户可见中文放在 docs 首页说明，不要写进 bat。内联 `for /f` + 长 `-Command` 字符串易因编码断行，导致 `'do' is not recognized`、`!PORT!` 未展开、浏览器打开 `http://127.0.0.1:!PORT!/`。端口逻辑一律走 `scripts/pick-port.ps1`。复制 `theme/` 时目标必须是**目录**（先 `mkdir theme` 再复制子文件），勿把 `theme` 复制成单文件。完整现象与对照见 references/chapter-template.md「Windows 启动脚本」。

非 Windows 不复制 bat，阅读用：`npm install && npm run docs:read`（等价 build + preview）；改文档再用 `npm run docs:dev`。

#### 阅读 vs 写作：三种 npm 命令（勿混用）

| 命令 | 角色 | 说明 |
|------|------|------|
| `docs:build` | 构建 | 产出 `docs/.vitepress/dist/`；skill 流程第 5 步必跑；**不**起长期服务 |
| `docs:preview` | 阅读 | 托管已构建的静态 dist；`start-reading.bat` 在 build 成功后调用；比 dev 省 CPU、无文件监听 |
| `docs:dev` | 写作 | 改 `docs/**/*.md` 时用；Vite HMR；**不要**作为「通读笔记」默认方式 |

**默认阅读路径**：`start-reading.bat` = `npm install`（如需）→ `docs:build` → `docs:preview` → 浏览器。首次约 15–40s 构建属正常；改 md 后重新双击 bat 或手动 `docs:build` 再 preview。

### 3. 采集项目/源码

在目标仓库（或用户指定的开源对照仓库）里检索**与该技术相关的真实用法**：

- **配置与声明**：依赖、配置文件、Bean/路由/中间件声明。
- **主路径代码**：一次完整流程的入口（HTTP 入口 → 服务 → 存储/消息/渲染）。
- **工程兜底**：重试、超时、锁、幂等、降级、事务边界等（有则写，无则注明「本项目未覆盖」）。
- **取舍**：只贴「机制主线」片段（通常 10~40 行）；DTO、getter、纯日志、重复 CRUD 不贴。
- **无项目时**：用官方 minimal example + 用户指定的 demo 仓库；`refs/` 标明「对照来源」。

检索策略（按技术类型选词，不必局限中间件名）：

- 包名/模块名、框架注解、配置文件键、常见类名（如 `*Config`、`*Client`、`*Interceptor`）。
- 用户口述的业务场景（「下单」「搜索」「登录」）反查调用链。

### 4. 按章节模板写 docs/

每章在 references/chapter-template.md 骨架上，**每个知识点**按 references/five-layer-depth.md 写满五层：

| 层 | 标题 |
|----|------|
| L1 | 定义与边界 |
| L2 | 动机与失效模式 |
| L3 | 机制与不变式（含 Mermaid + 官方释义意译） |
| L4 | 方案对比（≥2 种替代 + 对比表） |
| L5 | 工程落点与例外（项目代码块 + 本项目未覆盖） |

章级结构：

1. **本章要点**：3~4 条能力陈述（能独立做架构判断）。
2. **知识点 A/B/…**：各知识点 L1～L5；一章 2～4 个知识点。
3. **自测**：题目跨层（如 L2+L4）；答案在 `::: details 参考答案 N`。
4. **Official links**。

代码块规范见下文；无项目时在 L5 用官方 minimal 并说明差异。

必备页面：

- 各主题：`index.md`、`how-to-learn.md`（本站 vs 官方文档分工）、`00-map.md`（全局 Mermaid 总览）。
- `refs/项目对照.md`（或 `refs/源码路径.md`）：模块/文件路径索引，方便回 IDE 跳转。

#### VitePress 语法速查（与 MkDocs 写法不同）

| 用途 | 写法 |
|------|------|
| 提示块 | `::: tip 标题` … `:::`（可用 `info` / `warning` / `danger`） |
| 折叠块（自测答案） | `::: details 参考答案 1` … `:::` |
| 卡片网格 | `<CardGrid>` 包 `<Card title="…" badge="…">` … `</Card>`，组件已全局注册 |
| 页内链接 | 写 `.md` 相对路径即可，构建时自动转成干净 URL |

**提示块内容不要缩进**（MkDocs 的 4 空格缩进在这里会被当成代码块）。

#### 文字风格：专业严谨体

正文一律按 references/writing-style.md 执行。核心约束：

| # | 约束 | 反例 → 正例 |
|---|------|------------|
| 1 | 结论先行，首句给判断 | 「写 Skill 的人常犯三个错」→「失效原因有三类」 |
| 2 | 量化替代形容 | 「明显变大」→「从 1.2 MB 增至 9 MB，约 7.5 倍」 |
| 3 | 不用设问、反问、感叹 | 「为什么不叫 assets？」→「目录名由加载方式决定」 |
| 4 | 禁口语比喻 | 「技能就是废的」→「该技能无法被正确触发」 |
| 5 | 加粗只用于术语与硬约束 | 整段加粗 → 单句关键词加粗 |
| 6 | 第一人称用「本文」「本次实测」 | 「我实测过」→「本次实测」 |
| 7 | 标题名词化 | 「别让技能白写」→「内容质量校验」 |
| 8 | 段落 3~5 句，单句 ≤60 字 | 长句套从句 → 一句一个判断 |
| 9 | 删除元评论 | 「本章会讲三个问题」→ 直接陈述 |
| 10 | 术语保留原文 | 「渐进式披露」→ progressive disclosure |

章节句式统一为：**本章要点**（3 条能力陈述）→ 正文 → **自测** → **Official links**。不用「学习目标」「学习要点」「一句话总结」这类标题，段落末尾写「结论：」而非「记忆点：」。

### 5. 验证

```bash
npm run docs:build      # 产物在 docs/.vitepress/dist
```

构建必须零报错。人工浏览检查三点：侧栏分组是否正确、Mermaid 是否真的渲染出图（不是空白框）、上一章/下一章能否跳转。

若在 agent 会话内第二次构建，可能被客户端的安全删除机制拦截（Vite 构建前会清空 `dist/`，单次删除超过 50 个文件需确认）。处理：删除 `dist/` 后重跑，详见 references/chapter-template.md「在 agent 会话内构建的限制」。用户双击 bat 不受此限制。

需要更严格时用无头浏览器抽查：

```bash
msedge --headless=new --dump-dom http://127.0.0.1:5173/<页面路径> | grep -c "<svg"
```

### 6. 交付

告知：双击 `start-reading.bat` 会先 **build** 再 **preview**（静态阅读，非 dev）；地址 `http://127.0.0.1:<port>/`（5173 起由 `pick-port.ps1` 选端口，`wait-and-open.ps1` 就绪后开浏览器）。改 md 时用 `npm run docs:dev`。产物目录 `docs/.vitepress/dist/`。**不要硬编码端口**。bat 乱码见 references/chapter-template.md「Windows 启动脚本」。

## Mermaid 规范（心智模型优先）

- **一张图只讲一件事**；不用 `subgraph` 把两个主题并排列在一张图里，拆成两个 mermaid 代码块上下排列。
- 选型：
  - 请求/消息/数据流转 → `sequenceDiagram`
  - 模块/对象/层级 → `flowchart`
  - 状态/生命周期 → `stateDiagram-v2`
  - 类/组件关系（必要时）→ `classDiagram`
- 图的目标是**建立心智模型**（例：「索引 = N 个 Lucene 实例」「Filter 链在 DispatcherServlet 之前」「虚拟 DOM diff 的输入输出」），不是把官方教程的 API 调用逐步抄进图里。
- 图下用一句话给出**结论**，说明该图要建立的判断。
- 节点标签里用 `<br/>` 换行是安全的；不要用 `()` 或 `[]` 包裹正文，会被当成形状语法。
- 图表配色由 mermaid 生成的 `<style>` 决定，**不受站点 CSS 控制**。深/浅色切换必须重新初始化并重渲染（模板 `mermaid-init.ts` 已实现，勿删 `watch(isDark)` 与 `data-mermaid-src`）。

## 代码块规范（项目对照）

````markdown
### 项目代码：<一句话说明这段代码解决什么>

```java
// 只保留机制主线，删减到 10~40 行
```

出处：`模块/.../类.java`（或 `官方示例：URL`）
结论：<该片段的机制要点，一句陈述>
````

- 语言标实际后缀（`java` / `typescript` / `yaml` / `go` 等），开启代码高亮与复制按钮。
- 出处写相对仓库的模块路径，或官方文档示例链接；**不写本机绝对路径**。

## 为什么不是 MkDocs（不要改回去）

1.x 用的是 MkDocs Material。弃用原因是**它在默认用法下会造成客户端性能问题**：装 `mkdocs-material` 会在工作区里留下 14,000+ 个 svg 图标，被会话产物监听器逐个登记，实测索引 7,331 条 / 5.8 MB，UI 每 1.3 秒回传 9 MB，后台进程持续 2.5 个核、渲染进程 2.7 GB，且写入失败后自持重试、不重启不恢复。

VitePress 没有这个问题，但原因要说清楚，避免误判为「Vue 更安全」：

- `node_modules` 在监听器的排除名单内（实测同目录放 300 个 svg 也登记 0 条）；MkDocs 的 `.venv` 不在排除名单。
- VitePress 依赖里几乎没有图片（14,012 个文件 / 0 svg / 3 png），构建产物同样 0 svg。
- 真正的放大因子是**图片数量**，不是文件数量：19,432 个 js 零影响，14,348 张 svg 直接趴窝。

所以无论用什么栈，都**不要把大量图片目录放进工作区**：图标库、素材、数据集一律外置。阈值实测在 4,000~6,000 张图片。

## 迭代本 Skill

- **改站点行为/外观**：改 `templates/docs/.vitepress/`（config、theme、css）与 `start-reading.bat`。新站点立刻生效；已生成站点需手动同步。
- **改内容形态**：改 SKILL.md 的章节模板 / Mermaid 规范 / 代码块规范。
- **真实站点反哺**：在真实站点里踩过的坑修好后**回写 templates/**，不要只修当前站点——这是本 skill 的主要演进方式。
- **触发方式**：触发范围完全由 `description` 控制，不存在独立开关。当前已收窄为「明确要求建学习文档站」；若希望它在「帮我写个文档」这类泛请求上也触发，放宽 `description` 触发词即可。
- **结构膨胀**：SKILL.md 超 500 行时，把示例移到 `references/`、模板移到 `templates/`。
- **验证**：每次改动后用新主题快速生成一章，`npm run docs:build` 通过 + 人工浏览检查导航/折叠/图表/代码高亮。

## 附加资源

- 章节模板完整示例与常见坑：references/chapter-template.md
- 知识点五层深挖：references/five-layer-depth.md
- 文字风格规范（专业严谨体，10 条硬规则）：references/writing-style.md
- 站点骨架：`templates/`
