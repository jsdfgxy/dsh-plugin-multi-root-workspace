# 侧栏底部只剩一个卡片（`sidebar.footer.action` 是共享槽位）

## 症状

装了本插件和另一个同样注册 `sidebar.footer.action` 的插件（例如 `dsh-context` 的
context overview 卡片）之后：

- 侧栏底部只看到一张卡片，另一个插件的卡片被压成**只剩一个图标**，没有标签；
- 严重时两张卡片互相压住，图标并排挤在同一行里；
- 本插件自己的标签是完整的——因为被挤掉的是**邻居**。

宿主把 `sidebar.footer.action` 声明为 `kind: 'list'`，容器 `SidebarRoot` 的
`footerActions` 是 `display: flex` 的**一行**，槽位的 anchor 是 `display:contents`，
所以每个注册者的根元素都是同一行的 flex item。这类问题只有一个成因：某个注册者的
样式不允许自己收缩。

## 根本原因

修复前本插件的行样式是：

```css
.mrfw-triggerRow {
  flex: none;                    /* = flex: 0 0 auto，拒绝收缩 */
  width: calc(100% + 4px);       /* 索要整行还要多 4px */
  margin: 4px -2px;              /* 两侧各外溢 2px，压到邻居身上 */
}
```

`flex: none` 让本行占满整行，`flex-shrink: 0` 意味着溢出全部由邻居承担。邻居
（`dsh-context` 的 `.lc-ov-entry` 是 `width: calc(100% + 4px)` 且 `overflow: hidden`，
因此 `min-width: auto` 归零、默认 `flex-shrink: 1`）被压到只剩 padding + 图标；
`margin: 4px -2px` 再让本行左移 2px，于是两者视觉上重叠。

那句 2px 外溢是**为"本插件是唯一注册者"这个前提写的**：它把本行的图标对齐到下方
Settings 齿轮的 18px 墨线。槽位是共享的，这个前提不成立，外溢就变成了碰撞。

## 诊断

1. DevTools 选中底部区域，找到类名里含 `footerActions` 的容器（宿主 CSS Module 的
   哈希前缀会变，所以按**子串**找）：
   - `getComputedStyle(el).flexDirection` 是 `row` 还是 `column`；
   - 逐个 `getBoundingClientRect().width`——被压到几十像素的那个就是受害者。
2. 装了 `dsh-sidebar-footer-stack` 时还有一条现成路径：在页面 console 执行
   `localStorage['dsh-sidebar-footer-stack.debug']='1'` 再刷新，它会把每个条目的
   `display` / `border` / `size` 快照 POST 到宿主，落在
   `~/.dsh/sidebar-footer-stack-probe.ndjson`。
3. 判断责任方：谁的 `flex` 收缩因子是 0、谁的 `width` 超过自己的份额，谁就是成因。

## 已验证的解决方案

把本行做成**守规矩的 list 槽位成员**（`src/client/styles.ts`）：

```css
.mrfw-triggerRow {
  box-sizing: border-box;
  flex: 0 1 auto;   /* 可以收缩，不抢整行 */
  min-width: 0;     /* 允许缩到内容宽度以下 */
  width: 100%;      /* 只在自己的份额里占满 */
  margin: 4px 0;    /* 不再外溢 */
}

.mrfw-triggerLabel {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;   /* 变窄时省略号，而不是切掉半个字 */
}
```

折叠（rail）形态仍是固定尺寸，需要 `flex: none` 就必须显式写：

```css
.mrfw-triggerRow.mrfw-railRow { flex: none; width: 36px; }
```

`tests/client-styles.spec.ts` 把这几条钉成契约：行必须可收缩（`flex: 0 1 auto` +
`min-width: 0`）、不得有负的横向 margin、不得有正的纵向 margin、宽度不得用 `calc(…%)`
超出份额、必须恰好一个控件高（`margin: 0` + `height: 42px`）、标签必须省略号，而 rail
形态必须固定尺寸。**用旧的 `flex: none` + `calc(100% + 4px)` + 负 margin 跑这个测试会
失败**，失败信息直接点名这套组合。

### 为什么纵向 margin 也必须为 0

那条 `margin: 4px 0` 是从宿主自己的 settings 行（`ui-settings-general` 的
`.triggerRow`）抄来的，而宿主的 settings 行是它那个槽位的**唯一**子节点，可以随便外扩。
在共享槽位里它有两个后果：

- 本条目变成 42 + 8 = **50px** 高，旁边的 `dsh-context` 是 42px，两张卡因此上下错开
  4px（"不对齐"）；
- 纵向堆叠时它会在布局插件设的 `gap` 之外再加 4px，卡片间距不均。

**外侧间距归容器管**：独占时下方宿主 settings 行自带 `margin: 4px -2px`，所以去掉我们
这 4px 也不会贴在一起。

### 2px 墨线对齐收在自己的份额里

原来的 2px 侧向外溢是为了让本行图标落在下方齿轮的 18px 墨线上（宿主的 `.triggerRow`
是 `width: calc(100% + 4px)` + `margin: … -2px`）。共享槽位里不能再外溢，于是改成把
按钮左内边距从宿主的 `8px` 调成 **`6px`**：图标左缘落在容器内容边 +6px，与宿主的
`−2 + 8 = +6px` 完全一致，但完全收在自己的盒子里。

## 想要"上下各一行"（纵向堆叠）

这是**容器级**决定，不是条目级：宿主把 `sidebar.footer.action` 声明成
`kind: 'list'`，并自己把容器渲染成 `display:flex` 的一行，`slot` 系统不允许注册者改变
容器的 `kind` 或布局。没有 `flex-wrap` 时，单个条目**无法**把自己换到第二行——
`flex-basis: 100%` 只会撑破一行，不会换行。

所以正确做法是装一个负责该槽位布局的插件，而不是让本插件去改宿主的共享容器（那正是
本条目开头描述的越界）：

```sh
dsh plugin --profile <你的 profile> add dsh-sidebar-footer-stack
```

`dsh-sidebar-footer-stack` 就是为此存在的：把该槽位改成纵向堆叠、给所有条目统一卡片
外观、并支持拖动换序。它**没有任何 `peerDependencies`**，所以 `0.1.7-rc.1` 起那套安装期
peer 门禁拦不住它；它的选择器 `[class*="footerActions"]` 在 `0.1.7-rc.2` 与 `0.2.0-rc.2`
上都能匹配（两者都把容器渲染成 `display:flex`，类名是 `<hash>_footerActions`）。

不要在本插件里加 `[class*="footerActions"]{flex-direction:column}`：那会替宿主和别的
插件决定布局，而且会和 `dsh-sidebar-footer-stack` 的 `!important` 规则叠加。

## 相关

- [client bundle 不进 web 启动图](./client-bundle-not-in-boot-graph.md) —— 同样表现为"底部动作消失"，但成因是启动图里没有那一行，不是布局。
- [ADR-0006：客户端 UI 使用宿主设计 token](../decisions/ADR-0006-client-ui-host-tokens.md)。
