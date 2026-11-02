# learning-docs-site

学一个中间件时，跟 AI 的对话记录里会堆满零散结论：没有导航、无法复查，既对不上官方文档的表述，也对不上项目里的实际调用。

这个技能把这些零散结论重组成一个可本地运行的 VitePress 站点。官方文档与项目源码逐条对照，每个知识点按五层展开，站内可搜索、可跳转、可自测。

## 它做什么

知识点按五层展开，缺任一层即视为浅层笔记：

| 层 | 必须交代的内容 |
|----|--------------|
| L1 | 定义与边界：是什么、不是什么、职责上限 |
| L2 | 动机与失效模式：不这么做会出现什么故障 |
| L3 | 机制与不变式：Mermaid 图 + 官方释义意译 |
| L4 | 方案对比：至少两种替代方案，含对比表 |
| L5 | 工程落点与例外：项目代码片段、出处、结论 |

站级结构：本章要点 → 知识点 L1–L5 → 自测 → 官方链接。此外：

- 每章配 Mermaid 心智模型图，不是 API 调用清单
- 代码片段标注出处（模块路径或官方示例 URL）与机制结论
- 自测答案折叠，便于先自答后核对
- 一键启动脚本：装依赖、选端口、构建并预览

覆盖任意技术栈：中间件（Redis、Kafka）、框架（Spring、Vue）、语言特性（JVM、并发）、工程模式（分布式事务、鉴权）。

## 它不做什么

- 不生成 API 参考手册——字段查询交给官方文档
- 不修改被对照项目的业务代码
- 不依赖 Python；只用 Node.js 18+

## 安装

本技能是一个纯 Markdown 目录（`SKILL.md` + 资源文件），不含编译产物。安装动作只有一步：**把目录放到你所使用 agent 的技能目录下**。

获取目录有两种方式，任选其一。

**方式一：下载 zip（不需要命令行）**

到 [Releases](https://github.com/GrandK9/learning-docs-site/releases) 页下载最新的 `learning-docs-site-<版本>-flat.zip`，解压后得到 `learning-docs-site/` 目录，放入技能目录即可。flat 包的根目录直接是 `SKILL.md`，解压即用，不会多套一层。

**方式二：git clone（可随仓库更新）**

```bash
git clone https://github.com/GrandK9/learning-docs-site.git \
  ~/.workbuddy/skills/learning-docs-site
```

更新时执行：

```bash
git -C ~/.workbuddy/skills/learning-docs-site pull
```

> `git clone` 只在目标目录不存在或为空时可用。已装过旧版会报
> `destination path already exists and is not an empty directory`，需先移走旧目录。

技能目录的位置因平台而异，且随版本与账号变化，本文不逐一列举。请以你所使用平台的「Skills / Custom Skills / Agent Store」说明为准。通用的三步：

1. 在该平台的设置或文档中找到技能目录位置；
2. 把目录放入该路径下，目录名保持 `learning-docs-site/`；
3. 重启客户端或刷新技能列表。

### 示例：WorkBuddy

```bash
# 首次安装
git clone https://github.com/GrandK9/learning-docs-site.git \
  ~/.workbuddy/skills/learning-docs-site

# 更新
git -C ~/.workbuddy/skills/learning-docs-site pull
```

下载 zip 的用户直接把 `learning-docs-site` 文件夹放到 `%USERPROFILE%\.workbuddy\skills\` 下即可，效果相同。

### 其他平台

| 场景 | 做法 |
|------|------|
| 个人全局使用 | 通过平台内的技能导入功能安装；或手动放入该平台文档给出的技能目录 |
| 项目内共享 | 把目录放到项目级技能目录（如 `.cursor/skills/`、`.workbuddy/skills/`），随仓库提交给团队 |
| 其他客户端 | 任何识别 `SKILL.md` 约定（frontmatter 含 `name` / `description`）的客户端均可直接加载，无需改文件 |

> Cursor 的个人技能由 Agent Store 管理，技能扫描的是 Store 路径而非 `~/.cursor/skills/`。优先使用 Cursor 内的导入入口；如需手动放置，请先确认当前版本实际扫描的目录。

### 多客户端共存：单一可信源 + 目录联接（推荐）

同一技能装到 N 个客户端，默认得到 N 份独立副本：改一处要同步 N 次，且以哪份为准没有答案。可行做法是让所有客户端指向同一份实体文件。

**实体集中在一处，客户端目录建目录联接。** 实体建议放在空间充足的非系统盘（如 `D:\WorkBuddyData\MySkills\`），系统盘各客户端的技能目录只保留链接。

Windows（无需管理员权限）：

```powershell
$target = "D:\WorkBuddyData\MySkills\learning-docs-site"
git clone https://github.com/GrandK9/learning-docs-site.git $target

# 各客户端技能目录建链接
New-Item -ItemType Junction -Path "$env:USERPROFILE\.workbuddy\skills\learning-docs-site" -Target $target
```

macOS / Linux：

```bash
ln -s /path/to/learning-docs-site ~/.workbuddy/skills/learning-docs-site
```

验证：

```powershell
(Get-Item "C:\Users\<you>\.workbuddy\skills\learning-docs-site").LinkType   # 应为 Junction
```

此后更新只需在实体位置执行一次 `git pull`，所有客户端同时生效，不存在版本漂移。

**三点注意事项：**

1. **镜像同步工具会穿透链接，这是唯一的致命失效模式。** `robocopy /MIR`、`rsync --delete`
   把链接当作普通目录处理：实测用空目录镜像到链接路径后，链接本身保留，**目标内容被清空**
   （`/XJ` 无效，它排除的是源侧联接）。对含链接的目录做备份或同步前，先判断
   `(Get-Item $path).LinkType` 是否为 `Junction`，是则跳过。
   删除链接本身时，`Remove-Item` 在 PowerShell 5.1 下只删链接不动目标，但显式写法更稳妥：
   `[System.IO.Directory]::Delete($link, $false)`（PowerShell）或 `unlink`（POSIX）。
2. **`.git` 保留在实体侧。** 平台托管的技能目录（如 Cursor 的 Agent Store）带双向同步引擎。
   实测其同步索引只记录技能源文件，不会展开链接目标内的 `.git`；但仍不应把版本库直接复制进托管目录。
3. **Windows 目录联接不复制数据。** 两个路径读写同一份文件，链接本身不占空间，也不跨盘搬运。

### 冲突与共存

- 技能各占一个子目录，**不同技能不会互相覆盖**；唯一冲突是不同来源的同名技能。
- 同一技能装到多个客户端时，优先采用上一节的目录联接，避免多份独立副本。
- 若确实需要把仓库内容复制进被平台同步引擎托管的目录，**排除 `.git`**：版本库对象会被当作普通文件双向同步，既慢又易冲突。
- 已手动拷贝过旧版（目录存在但不是 git 仓库）：先备份删除再 clone；或原地
  `git init && git remote add origin <url> && git fetch --all && git reset --hard origin/main`。

## 使用

对 agent 说一句话即可触发：

```
按 learning-docs-site 给 Spring Security 建一个学习文档站
```

生成后的站点目录结构：

```
<主题>-learning-docs/
├── package.json
├── start-reading.bat          # Windows 双击启动
├── scripts/                   # 端口探测、就绪后再开浏览器
├── docs/
│   ├── .vitepress/            # 配置与主题组件
│   └── <主题slug>/            # 章节内容
```

启动（Windows）：双击 `start-reading.bat`。其他平台：

```bash
npm install
npm run docs:read      # 构建 + 预览（阅读用）
npm run docs:dev       # 热更新（写文档时用）
```

## 目录结构

```
learning-docs-site/
├── SKILL.md                       技能正文（生成流程与规范）
├── references/
│   ├── chapter-template.md        章节示例、VitePress 坑、Windows 启动脚本
│   └── writing-style.md           技术写作规范（专业严谨体）
├── templates/                     站点骨架（被复制，不被阅读）
│   ├── package.json
│   ├── start-reading.bat
│   ├── scripts/{pick-port,wait-and-open}.ps1
│   └── docs/.vitepress/{config.mts,theme/}
└── LICENSE
```

## 为什么用 VitePress

初版基于 MkDocs。弃用原因与实测数据见 `SKILL.md` 的「为什么不是 MkDocs」一节——简言之：Python 虚拟环境会在工作区内产生上万张图标文件，被部分客户端的文件索引机制放大成性能问题；VitePress 的依赖以代码为主，不含此类资源，且 `node_modules` 通常在索引排除名单内。

## 许可

MIT，见 [LICENSE](LICENSE)。
