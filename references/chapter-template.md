# 章节模板示例与常见坑（VitePress 版）

本模板适用于**任意技术栈**：中间件、框架、语言特性、前端、数据库等。

**深度要求**：每个知识点须写满 L1～L5，定义见 references/five-layer-depth.md。下面示例 A 仅展示旧版短章；新稿请以示例 C 为准。

## 完整章节示例 C（五层深挖 — Redis「缓存穿透」节选）

````markdown
# 缓存三防

## 本章要点

- 能区分穿透、击穿、雪崩的**失效对象**（DB、Redis、应用线程）而非仅背定义。
- 能说明 Cache-Aside 下写路径删缓存与 MQ 最终一致如何配合。
- 能对比 EMPTY 标记、Bloom filter、接口限流在穿透场景的适用边界。

## 知识点：缓存穿透

### L1 定义与边界

穿透指：**查询的数据在权威源本就不存在**，缓存无法命中且每次请求仍打到 DB。Redis 只缓存「已查询过的 key」；不存在 id 的首次查询必然 miss。穿透不是 Redis 故障，是**恶意或爬虫型读模式**放大了 miss 成本。

### L2 动机与失效模式

若不做防护，攻击者用随机 id 打详情接口，缓存命中率≈0，DB QPS≈接口 QPS。连接池耗尽后正常用户也超时。EMPTY 标记把「不存在」变成 Redis 内短 TTL 命中，把 DB QPS 降为「每种恶意 id 首次 1 次 + 60s 内 0 次」。

### L3 机制与不变式

**官方释义（意译）** — [Caching patterns](https://redis.io/docs/latest/develop/use/patterns/)

```mermaid
sequenceDiagram
  participant App
  participant Redis
  participant DB
  App->>Redis: GET product:detail:999999
  alt 无 key
    App->>DB: SELECT
    DB-->>App: 0 rows
    App->>Redis: SET EMPTY EX 60
  else 已有 EMPTY
    App-->>App: 直接返回 null
  end
```

结论：穿透防护的本质是**缓存「不存在」这一查询结果**，且 TTL 不宜过长以免误挡新上架。

### L4 方案对比

| 方案 | 优点 | 缺点 | 本项目 |
|------|------|------|-----------|
| 空值缓存 EMPTY | 实现简单、无额外组件 | 恶意 id 种类极大时仍占内存 | product 详情采用 |
| Bloom filter | 内存省、可挡大量假 id | 有误杀、需重建与同步 | 未采用 |
| 接口限流 / WAF | 挡流量入口 | 不误杀合法扫页 | gateway 另有 Redis 限流 |

### L5 工程落点与例外

```java
if (value == null) {
    write(key, null, EMPTY_TTL); // 内部写 EMPTY 标记
}
```

出处：`product-service/.../ProductCacheService.java`  
结论：列表页未对「空列表」单独 EMPTY，因默认列表 key 固定；恶意扫 id 主要打详情。  
例外：Bloom、分库分表路由校验本项目未做。

## 自测

1. EMPTY TTL 从 60s 调到 24h，对新上架商品 id 曾攻击过的 key 有何影响？

::: details 参考答案 1

攻击者若曾扫过该 id，24h 内 EMPTY 仍命中，新商品对该 id 不可见直至过期；故不存在结果 TTL 宜短。

:::

## Official links

- …
````

下面给两类**短示例**（中间件 / 框架），仅供 Mermaid 与代码块格式参考；**新章勿再仅用短章浅写**。

## 完整章节示例 A（中间件 — ES「分析」章）

````markdown
# 分析与分词

## 本章要点

- 把 Analysis 拆成三步：character filters → tokenizer → token filters。
- 区分 index analyzer 与 search analyzer；理解「写入切细、查询切粗」。

## 1. 分析管道（官方结构，中文理解）

**官方释义（意译）** — [Text analysis](https://www.elastic.co/guide/en/elasticsearch/reference/current/analysis.html)

Analyzer 把字符串变成 token 流：Character filters → Tokenizer → Token filters。

```mermaid
flowchart LR
  In["输入: <p>华为 Mate 60</p>"]
  In --> CF[html_strip]
  CF --> Tok[ik_max_word]
  Tok --> Out["tokens: 华为, Mate, 60"]
```

倒排里存的是 token，不是原句；query 也必须过 search_analyzer 才能对齐倒排。

## 2. 工程实践：索引 max_word、查询 smart

索引侧多 token 提召回；查询侧贴近用户输入粒度，避免 query 过碎。

### 项目代码：自定义分析器的声明与引用

```java
.settings(s -> s.analysis(a -> a
        .analyzer(TEXT_ANALYZER, an -> an
                .custom(c -> c
                        .tokenizer(TOKENIZER_IK)      // ik_max_word
                        .charFilter("html_strip")))))
```

出处：`search-service/.../index/ProductIndexService.java`
结论：analyzer 管怎么写倒排，search_analyzer 管怎么切查询词。

## 3. 自测

1. 改 analyzer 后旧数据会怎样？

::: details 参考答案 1

旧 segment 仍是旧 token，必须 reindex。

:::

## Official links

- [Configure text analysis](https://www.elastic.co/guide/en/elasticsearch/reference/current/configure-text-analysis.html)
````

## 完整章节示例 B（框架 — Spring「请求进入 Controller 前」）

````markdown
# Filter 与 Interceptor

## 本章要点

- 说出 Servlet Filter、Spring Interceptor、ControllerAdvice 在调用链上的先后与职责边界。
- 能根据项目配置判断「鉴权/日志」落在哪一层。

## 1. 请求进入业务代码前（心智模型）

**官方释义（意译）** — [Filters](https://docs.spring.io/spring-framework/reference/web/webmvc/filters.html)

Filter 在 Servlet 容器层；Interceptor 在 DispatcherServlet 之内、Handler 之前。

```mermaid
sequenceDiagram
  participant C as Client
  participant F as Filter 链
  participant D as DispatcherServlet
  participant I as Interceptor
  participant H as Controller
  C->>F: HTTP
  F->>D: 放行
  D->>I: preHandle
  I->>H: 调用 Handler
```

Filter 拿不到 HandlerMethod；Interceptor 可以，适合按接口做细粒度控制。

## 2. 工程实践：鉴权放 Filter 还是 Interceptor

团队常把「无状态 JWT 校验」放 Filter，把「权限注解解析」放 Interceptor；混用时注意顺序与异常统一返回。

### 项目代码：注册 Filter 与 Interceptor

```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor).addPathPatterns("/api/**");
    }
}
```

出处：`xxx-web/.../WebMvcConfig.java`
结论：Filter 改 `web.xml` 或 `@Bean FilterRegistrationBean`；Interceptor 只认 Spring MVC 配置。

## 3. 自测

1. Filter 里抛异常，DispatcherServlet 还会执行吗？

::: details 参考答案 1

不会进入 DispatcherServlet；由容器或 Filter 链上的异常处理决定响应。

:::

## Official links

- [Spring MVC Interceptor](https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-config/interceptors.html)
````

## 首页卡片（Card 组件）

`docs/.vitepress/theme` 已全局注册 `CardGrid` / `Card`，直接写：

````markdown
<CardGrid>
<Card title="一句话定义" badge="01">

正文支持 **markdown**、`代码`、链接。

</Card>
<Card title="一句话机制" badge="02">

卡片之间用空行分隔，否则会被拼成一段。

</Card>
</CardGrid>
````

## Windows 启动脚本（`start-reading.bat`）

本次在 `learning-docs` 迁移 VitePress 后的实测结论：`cmd.exe` 双击执行 bat 时，**编码与括号块**是首要故障源，与 Node/VitePress 无关。

### 典型现象

| 控制台输出 | 含义 |
|------------|------|
| `'do' is not recognized` | `for /f ... do` 被上一行乱码截断，整段语法未进入 for |
| `'on' is not recognized` / `'all' is not recognized` | `npm install --no-audit` / `call` 行被拆成独立「命令」 |
| `'delims' is not recognized` | `for /f "delims=..."` 未与 for 同行解析 |
| `The system cannot find the file http://127.0.0.1:!PORT!/` | 延迟扩展失效，`!PORT!` 未替换，且被当成可执行文件名 |
| VitePress 日志 `--port !PORT!` | 同上，端口未传入 dev server |

### 根因

1. bat 存成 **UTF-8**（尤其带 BOM 或混用中文）时，`cmd` 按系统代码页读字节，**多字节字符会吞掉换行或括号**，`( )` 块内中文风险最高。
2. 在 bat 里写 `chcp 65001` **不能**可靠修复括号块解析；仍可能在 `if (...)` 内触发乱执行。
3. 内联 PowerShell `-Command "..."` 过长且与中文 `echo` 同文件时，断行/引号错误会连带破坏后续 `for` 行。

### 固定做法（模板已按此实现）

| 项 | 要求 |
|----|------|
| bat 字符集 | 全文 ASCII：`echo`/`rem`/括号块内均英文 |
| 中文说明 | 写在 `docs/index.md`（启动步骤、端口说明） |
| 端口探测 | `scripts/pick-port.ps1` 输出单个端口号；bat 仅 `for /f ... -File "%~dp0scripts\pick-port.ps1"` |
| 延迟扩展 | `setlocal EnableDelayedExpansion` + `!PORT!` 仅用于 echo / npm 参数 |
| 复制 theme | `Copy-Item ...\theme\*` 前确保目标为**文件夹**；若误复制成名为 `theme` 的单文件，构建报 `ENOENT ... theme/index` |

### 验证

在站点根目录执行 `cmd /c start-reading.bat`（勿只依赖 IDE 终端编码）。应出现 `Local URL: http://127.0.0.1:5173/`（或 5174+），且 VitePress 日志为 `--port 5173` 而非字面量 `!PORT!`。

### 在 agent 会话内构建的限制（实测）

第二次执行 `npm run docs:build` 可能中断：

```
[safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED]
{"count":106,"threshold":50,"targets":["...\\dist\\assets"]}
```

原因：Vite 构建前调用 `emptyDir(dist)` 清空旧产物，一次性删除 106 个文件，超过客户端安全删除阈值（50），被拦截后构建终止。

影响范围：仅在 agent 会话内执行时出现——该执行环境继承了安全删除机制。用户双击 bat 时不继承，可正常完成。

处理方式：

1. 删除 `dist/` 后重跑（首次构建无旧产物，不触发 `emptyDir`）。
2. 或对本次构建显式放开执行环境的删除限制。

验证记录：清空 `dist/` 后重跑 bat，`docs:build` 22.77s 成功，`docs:preview` 起于 5173，页面标题与 13 个 HTML 页面均正确。

## 常见坑

| 坑 | 处理 |
|----|------|
| 双击 bat 报 `'do' is not recognized` 等 | bat 改 ASCII-only；端口迁到 `scripts/pick-port.ps1`；见上文「Windows 启动脚本」 |
| 提示块内容被当成代码块 | VitePress 的 `:::` 容器内**不要缩进**；MkDocs 的 4 空格缩进写法会失效 |
| 构建报 `Error parsing JavaScript expression: Unexpected token` | 站点正文出现字面双花括号（模板占位符语法）会被 Vue 当插值解析，**代码块与行内代码同样逃不掉**。需要讲占位符时改用 `<占位符名>`，并在正文说明「模板中以双花括号包裹」。`<div v-pre>` 包不住 Markdown 代码块，且会阻断 markdown 解析 |
| Mermaid 空白/乱码/只显示源码 | SSR 会压扁 `div.mermaid` 换行 → 必须用 `data-mermaid-b64` 占位 + 客户端解码；渲染钩子用 **`onContentUpdated`**（仅 `onMounted` 太早） |
| Mermaid 插件 | **勿用** `vitepress-plugin-mermaid`（Windows dev 白屏）；用模板内 `mermaid-init.ts` |
| 双击 bat 后浏览器白屏 | ① 勿用 `vitepress-plugin-mermaid`；② bat 为 build+preview，等 `[BUILD]` 完成后再由 `wait-and-open.ps1` 开浏览器；③ 仍白则 F5 |
| 构建后 `curl` 看着图表是空的 | 图表客户端渲染，HTML 里 `<div class="mermaid">` 本来就是空壳，要用浏览器或无头浏览器验证 |
| 侧栏链接 404 | `sidebar` 的 `link` 写成 `/主题slug/文件名`，不带 `.md`、不带 `.html` |
| `Card` 里的 markdown 不生效 | 组件标签与内容之间要留空行，内容不要缩进 |
| 依赖装不上 | 先 `--registry https://registry.npmmirror.com`，失败再退回官方源 |
| `crypto.hash is not a function` | Node 版本过低，VitePress 1.x 需要 Node 18+ |
| 端口被占 | `pick-port.ps1` 从 5173 试到 5192；bat 禁止内联长 PowerShell |
| 工作区被拖慢 | 站点目录别放 agent 工作区；更不要把几千张图片（图标库/素材/数据集）放进去 |
| 构建 15–40 秒 | mermaid 打包体积大；**阅读**用 bat（build+preview），**改 md** 才用 `docs:dev` |
| 一直开着 dev 占资源 | dev 带监听与 HMR，只适合写作；通读应 build 后 preview 或只看 dist |

## 产物与部署

- 构建产物：`docs/.vitepress/dist/`，纯静态，12 页约 5 MB（大头是 mermaid）。
- 部署到子路径时改 `config.mts` 的 `base: '/repo-name/'`，否则资源 404。
- `cleanUrls: true` 要求静态托管支持「无扩展名映射到 .html」，GitHub Pages / Nginx 都能配。
