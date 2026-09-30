/**
 * The plugin's one stylesheet, injected into the document by the client entry.
 *
 * The host ships its design tokens as CSS custom properties on `body`
 * (`--dsw-alias-*` semantics, `--dsw-elevation-*` shadows, `--ds-*` motion and
 * code-font tokens), so this sheet names no color of its own: light and dark
 * theme follow the host automatically. The recipes mirror the native surfaces
 * this UI sits beside — the sidebar footer trigger, the Modal primitive, and
 * the capsule Button (ADR-0006 records the decision).
 *
 * Every class this sheet defines is `mrfw-`-prefixed to stay collision-free.
 * The ONE exception is the first section below: it targets the host's own
 * `footerActions` container, because `sidebar.footer.action` is a shared LIST
 * slot whose host rendering cannot be reached through the slot API. ADR-0011
 * records why that override exists, what it may and may not declare, and how
 * it coexists with the community layout plugin that does the same thing.
 *
 * @module @dsh-electron/dsh-plugin-multi-root-workspace/client/styles
 */

/** The stylesheet text; every class is prefixed `mrfw-` except ADR-0011's container rule. */
export const STYLES = /* css */ `
/* ---- the shared footer slot's LAYOUT (ADR-0011) --------------------------
 *
 * The only host-class rule in this sheet, and the only rule that is not about
 * this plugin's own markup. sidebar.footer.action is a LIST slot: the shell
 * renders its container as one flex ROW, the slot API lets a registrant add
 * entries but NOT change the container's kind or layout, and a container
 * without flex-wrap cannot let a single entry wrap itself onto a second line.
 * So with two or more registrants the host row gives each entry a share of one
 * line and the cards squeeze each other.
 *
 * This sheet therefore stacks the entries, the same way the community layout
 * plugin dsh-sidebar-footer-stack does, so the two are idempotent: both
 * express "column with a 6px gap". The selector matches on a class-name
 * SUBSTRING on purpose — the host is a CSS Module, and its hash prefix differs
 * between builds (hHd-Xa_footerActions, n_2Q3W_footerActions, …), so a full
 * class name would silently match nothing.
 *
 * Scope, deliberately: GEOMETRY ONLY. This sheet never draws chrome on another
 * plugin's entry — no border, background, padding or shadow — because that is
 * the layout plugin's feature and would double-frame its cards. */
[class*="footerActions"] {
  flex-direction: column !important;
  align-items: stretch;
  gap: 6px;
}

/* Collapsed rail: the shell centres a 36px button per entry, so the column has
 * to centre on the cross axis instead of stretching. Two selectors beat the
 * rule above, so the rail form holds whichever order the host loads in. */
[class*="collapsed"] [class*="footerActions"] {
  align-items: center;
}

/* Sidebar footer row. sidebar.footer.action is a LIST slot in a host-owned
 * flex row (SidebarRoot's .footerActions, with the slot's display:contents
 * anchor between them), so this element is a flex ITEM shared with every other
 * plugin that registers there — dsh-context's overview card, among others.
 *
 * It therefore has to be a well-behaved item: shrinkable, full width only
 * WITHIN its own share, no negative margin, and exactly ONE control tall.
 * The previous recipe (flex: none + width: calc(100% + 4px) + a negative side
 * margin) claimed the whole row and squeezed every sibling to its bare icon —
 * the collision reported against dsh-context. That recipe was copied from the
 * host's own settings row (ui-settings-general's .triggerRow), which can afford
 * it because it is the only child of its slot; a shared list slot cannot.
 *
 * The vertical margin is gone for the same reason: it made this item 50px tall
 * beside a 42px neighbour, so the two footer cards sat 4px out of line, and it
 * would add 4px on top of whatever gap a stacking layout sets. Outer spacing is
 * the container's job — the host's settings row below already carries its own
 * 4px top margin, so the solo case stays separated without ours. */
.mrfw-triggerRow {
  box-sizing: border-box;
  flex: 0 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin: 0;
}

.mrfw-triggerRow.mrfw-railRow {
  flex: none;
  width: 36px;
  /* The host's own rail row sets this exact margin; the rail is a lone 36px
   * button the shell centres, so it keeps that geometry. */
  margin: 8px 0 10px;
}

.mrfw-trigger {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  width: auto;
  height: 42px;
  margin: 0;
  /* 6px, not the host trigger's 8px: without the 2px side overhang this is what
   * puts the icon's ink line where the Settings gear's is. Padding keeps the
   * alignment INSIDE our own share instead of bleeding 2px onto a neighbour. */
  padding: 0 10px 0 6px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 14px;
  line-height: 22px;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  transition: background-color var(--ds-transition-duration-fast) var(--ds-ease-in-out);
}

.mrfw-trigger:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}

.mrfw-triggerIcon {
  flex: none;
  display: inline-flex;
}

/* The label gives way first: min-width: 0 lets the flex item shrink below its
 * content width at all, and the ellipsis keeps a narrow share readable rather
 * than mid-glyph clipped (see .mrfw-triggerRow). */
.mrfw-triggerLabel {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.mrfw-triggerRail {
  flex: none;
  width: 36px;
  height: 36px;
  margin: 0;
  padding: 0;
  gap: 0;
  border-radius: 50%;
  justify-content: center;
}

.mrfw-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.mrfw-mask {
  position: absolute;
  inset: 0;
  background: var(--dsw-alias-bg-mask-1);
  backdrop-filter: var(--dsw-mask-blur);
}

.mrfw-dialog {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  width: min(640px, 100%);
  max-height: 100%;
  overflow: hidden;
  border: none;
  border-radius: 24px;
  background: var(--dsw-alias-bg-layer-2);
  box-shadow: var(--dsw-elevation-prominent);
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  outline: none;
}

.mrfw-header {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 22px 14px 12px 24px;
}

.mrfw-title {
  margin: 0;
  font-size: 16px;
  line-height: 24px;
  font-weight: 500;
  color: var(--dsw-alias-label-primary);
}

.mrfw-close {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  color: var(--dsw-alias-label-secondary);
  transition: background-color var(--ds-transition-duration-fast) var(--ds-ease-in-out);
}

.mrfw-close:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}

.mrfw-body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  padding: 0 24px 24px;
}

.mrfw-description {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 22px;
  color: var(--dsw-alias-label-tertiary);
}

.mrfw-alert {
  margin: 0 0 8px;
  font-size: 14px;
  line-height: 22px;
  color: var(--dsw-alias-state-error-primary);
}

.mrfw-section {
  display: flex;
  flex-direction: column;
}

.mrfw-section + .mrfw-section {
  margin-top: 8px;
}

.mrfw-sectionTitleRow {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 8px 0 4px;
}

.mrfw-sectionTitle {
  font-size: 14px;
  line-height: 22px;
  font-weight: 500;
  color: var(--dsw-alias-label-primary);
}

.mrfw-sectionNote {
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary);
}

.mrfw-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2);
}

.mrfw-rowBare {
  border-bottom: none;
}

/* A root entry's two lines: the display name on top, the absolute path under
   it in the tertiary voice (the workspace rows recipe of the host sidebar). */
.mrfw-rootText {
  display: flex;
  flex: 1 1 240px;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.mrfw-rootName {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
  color: var(--dsw-alias-label-primary);
}

.mrfw-rootPath {
  font-family: var(--ds-font-family-code);
  font-size: 12px;
  line-height: 18px;
  word-break: break-all;
  color: var(--dsw-alias-label-tertiary);
}

.mrfw-note {
  margin: 0;
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-label-tertiary);
}

.mrfw-stateWarn {
  font-size: 12px;
  line-height: 18px;
  color: var(--dsw-alias-state-warn-primary);
}

.mrfw-btn {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 12px;
  line-height: 18px;
  cursor: pointer;
  transition: background-color var(--ds-transition-duration-fast) var(--ds-ease-in-out);
}

.mrfw-btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.mrfw-btnGhost:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
}

.mrfw-btnGhost:active:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-active);
}

.mrfw-btnDanger:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover-danger);
}

.mrfw-btnOutline {
  border: 0.5px solid var(--dsw-alias-border-l3);
  background: transparent;
}

.mrfw-btnOutline:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
}

.mrfw-btnPrimary {
  background: var(--dsw-alias-button-primary-fill);
  color: var(--dsw-alias-label-primary-foreground);
}

.mrfw-btnPrimary:hover:not(:disabled) {
  background: var(--dsw-alias-button-primary-hover);
}

/* One icon-only action: a square of the capsule family, meaning in title.
   Declared after the .mrfw-btn family so its padding wins the cascade tie:
   the capsule's 0 10px padding would otherwise squeeze the icon glyph. */
.mrfw-iconBtn {
  width: 28px;
  padding: 0;
  border-radius: 8px;
}

.mrfw-input {
  flex: 1 1 220px;
  min-width: 0;
  height: 32px;
  padding: 0 8px;
  border: 0.5px solid var(--dsw-alias-border-l4);
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font-family: inherit;
  font-size: 14px;
  line-height: 22px;
  outline: none;
  transition: border-color var(--ds-transition-duration-fast) var(--ds-ease-in-out);
}

.mrfw-input:focus {
  border-color: var(--dsw-alias-brand-primary);
}

.mrfw-input::placeholder {
  color: var(--dsw-alias-label-dimmed);
}

.mrfw-inputInline {
  flex: 1 1 auto;
}

.mrfw-aliasEditor {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-basis: 100%;
}

.mrfw-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 0.5px solid var(--dsw-alias-border-l2);
}

/* One control row, one height: the capsule buttons match the 32px input. */
.mrfw-actions .mrfw-btn {
  height: 32px;
  border-radius: 16px;
}

.mrfw-actions .mrfw-iconBtn {
  width: 32px;
}
`
