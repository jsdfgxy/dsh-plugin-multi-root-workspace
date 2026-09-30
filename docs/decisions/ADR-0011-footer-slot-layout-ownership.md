# ADR-0011: 侧栏底部槽位的布局归属（纵向堆叠）

## Status

Accepted

## Date

2026-09-30

## Context

`sidebar.footer.action` 是宿主声明为 `kind: 'list'` 的槽位，宿主自己把容器 `.footerActions` 渲染成 `display:flex` 的**一行**（`SidebarRoot`），槽位 anchor 是 `display:contents`，因此每个注册者的根元素都是同一行的兄弟 flex item。

`v0.1.6` 与 `v0.1.7` 依次修掉了这条支路上的两个真缺陷（见[故障排查](../troubleshooting/sidebar-footer-slot-collision.md)）：

- `flex: none` + 超份额宽度让本插件占满整行，把同槽位的 `dsh-context` 卡片压成一个图标；
- 行上残留的 `margin: 4px 0` 让本条目比 42px 的邻居高 4px，两张卡上下错位。

修完之后剩下的现象是：两个条目并排各占一半。文字不再被压没，但这既不是用户想要的形态，也不符合宿主自己的信息层级——宿主的设置行是全宽一行。生态中的做法是安装 `dsh-sidebar-footer-stack`：它用 `[class*="footerActions"]{flex-direction:column !important; …}` 把该槽位整体改成纵向堆叠，并附带统一卡面与拖动换序。

`v0.1.7` 的不变量 10 当时写的是"纵向堆叠是容器级决定，不得在本插件里做"。现在决定由本插件自己做，理由与边界记录如下。

三条约束决定了这件事**只能**这么做：

- `slot` 系统**不允许注册者改变容器的 kind 或布局**：容器由声明 `children` 的宿主行渲染，注册者只能往里放条目；
- 容器是 `display:flex` 且**没有** `flex-wrap`，所以单个条目**无法**把自己换到第二行——`flex-basis:100%` 只会撑破一行，不会换行；
- 因此"上下各一行"只能由改容器的一方实现，没有第三条路。

## Decision

本插件的 client 半部**自己把 `sidebar.footer.action` 的容器改成纵向堆叠**，并且只做几何，不做外观：

```css
[class*="footerActions"] {
  flex-direction: column !important;
  align-items: stretch;
  gap: 6px;
}

[class*="collapsed"] [class*="footerActions"] {
  align-items: center;
}
```

四条边界：

1. **选择器用类名子串**（`[class*="footerActions"]`）。宿主是 CSS Module，哈希前缀在 app 与 CLI 构建之间不同（`hHd-Xa_` / `n_2Q3W_`），写全名会静默匹配不到。这是本样式表**唯一**针对宿主类名（而非 `mrfw-` 前缀类）的规则，并且只针对这一个容器。
2. **只写几何，绝不写卡面**。不设 `border` / `background` / `padding` / `box-shadow`。给别的插件的条目画边框是布局插件的功能，重复实现会让卡片被套上第二层框。
3. **`!important` 只加在方向与 gap 上**，用于对宿主和别的布局插件取得确定结果；`align-items` 不加重写权，折叠态交给宿主的规则组合。
4. **与 `dsh-sidebar-footer-stack` 幂等共存**：两者表达同一个结果（column + 6px gap），所以同时安装时无论谁的 `!important` 胜出，计算值都是 column；它的卡面规则只作用于条目，与本决定不重叠。

对**单条目**的影响为零：一行里的单个 `width:100%` 条目与一列里的同一个条目视觉一致（折叠态同理）。这条规则只在"一个以上注册者"时改变形态，而那正是宿主单行布局已经不成立的场景。

## Alternatives Considered

1. **不做，让用户装 `dsh-sidebar-footer-stack`**（`v0.1.7` 的做法）。可行，但把"本插件参与的那个槽位是否可用"推给了用户，用户明确要求集成；而且多一个依赖、多一套卡面风格。
2. **可选开关（配置项 / 环境变量）**。本插件其它行有 config，但 client 行目前没有配置通道；为一个纯几何选择引入新的配置面与文档成本，收益不抵。单条目下本规则没有视觉差异，因此"默认关"几乎没有保护作用。
3. **在条目里用 `flex-basis:100%` 自我换行**。技术上不可能：容器没有 `flex-wrap`，只会撑破一行。
4. **让本插件注册到别的槽位以避开共享**。宿主只有 `sidebar.footer.action`（list）与 `sidebar.settings`（single，已被设置行占用）；换槽位要么顶掉宿主的设置行，要么离开底部区域，代价更大。

## Consequences

- 本插件在**任何**装有它的 profile 里都会把底部槽位改成纵向堆叠，包括别的插件的条目。这是有意的：宿主的一行布局在两个以上注册者时不可用（会把卡片压成图标或互相重叠）。
- 与 `dsh-sidebar-footer-stack` 并存时结果是同一个 column，但会保留对方的卡面与拖动换序；想要统一卡面仍应装它。
- 宿主若在未来版本改了容器的类名（`footerActions` 子串）、把方向改成 `column`，或加了 `flex-wrap`，本条规则需要重新评估。`tests/client-styles.spec.ts` 钉住规则本身，但**匹配不到宿主类名只会静默失效**——这是子串选择器的固有风险，与生态里的做法一致。
- 不变量 10 的表述随之改写：条目侧规则（可收缩、零外侧 margin、恰好一个控件高、墨线在 padding 里）不变；"本插件不得改容器布局"改为"本插件只以最小几何规则改这一个容器的方向，且绝不画卡面"。

## Related Documents

- [故障排查：侧栏底部只剩一个卡片](../troubleshooting/sidebar-footer-slot-collision.md)
- [ADR-0005：出树 client 半部](./ADR-0005-out-of-tree-client-transport.md)
- [ADR-0006：客户端 UI 使用宿主设计 token](./ADR-0006-client-ui-host-tokens.md)
