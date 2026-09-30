/**
 * The one stylesheet rule that is a CONTRACT with other plugins, not a taste.
 *
 * `sidebar.footer.action` is a `kind: 'list'` slot rendered by the shell as a
 * flex ROW with the slot's `display: contents` anchor between them — so every
 * registrant's root element is a sibling flex item, and this sheet also owns
 * the container's direction (ADR-0011).
 *
 * Both halves were real defects, not hypotheticals: `flex: none` plus
 * `width: calc(100% + 4px)` plus `margin: … -2px` made this entry claim the
 * whole row and squeeze `dsh-context`'s overview card down to its bare icon,
 * and the leftover `margin: 4px 0` then left the two cards 4px out of line.
 * The assertions below are the ones that would have caught both.
 */

import { describe, expect, it } from 'vitest'
import { STYLES } from '../src/client/styles.ts'

/**
 * The sheet with its comments removed.
 *
 * Comments have to go before any selector is looked up: several of them name
 * the very classes under test, so a selector could otherwise be "found" inside
 * prose and the rule it belongs to never checked.
 */
const SHEET = STYLES.replace(/\/\*[\s\S]*?\*\//gu, '')

/** One parsed top-level rule. */
interface ParsedRule {
  /** The selector text, trimmed. */
  readonly selector: string
  /** Its declarations, keyed by property. */
  readonly declarations: ReadonlyMap<string, string>
}

/**
 * Read every top-level rule whose selector mentions a fragment.
 *
 * `[^{}]+` between the previous rule's `}` and the next `{` is enough here
 * because this sheet is flat — no at-rules, no nesting.
 * @param fragment - the selector text to look for.
 * @returns the matching rules, in sheet order.
 */
function rulesMentioning(fragment: string): ParsedRule[] {
  const rules: ParsedRule[] = []
  for (const match of SHEET.matchAll(/([^{}]+)\{([^}]*)\}/gu)) {
    const selector = (match[1] as string).trim()
    if (!selector.includes(fragment)) continue
    const declarations = new Map<string, string>()
    for (const declaration of (match[2] as string).split(';')) {
      const separator = declaration.indexOf(':')
      if (separator < 0) continue
      declarations.set(declaration.slice(0, separator).trim(), declaration.slice(separator + 1).trim())
    }
    rules.push({ selector, declarations })
  }
  return rules
}

/**
 * Read the declarations of one top-level rule out of the stylesheet.
 * @param selector - the exact selector, for example `.mrfw-triggerRow`.
 * @returns its declarations, keyed by property; later duplicates win, as in CSS.
 */
function declarationsOf(selector: string): Map<string, string> {
  const declarations = new Map<string, string>()
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Anchored at a rule boundary so `.mrfw-triggerRow` never matches
  // `.mrfw-triggerRow.mrfw-railRow`, and non-greedy up to the rule's `}`.
  const rule = new RegExp(String.raw`(?:^|\})\s*${escaped}\s*\{([^}]*)\}`, 'u').exec(SHEET)
  if (rule === null) throw new Error(`no rule for ${selector} in src/client/styles.ts`)
  for (const declaration of (rule[1] as string).split(';')) {
    const separator = declaration.indexOf(':')
    if (separator < 0) continue
    declarations.set(declaration.slice(0, separator).trim(), declaration.slice(separator + 1).trim())
  }
  return declarations
}

describe('the sidebar footer row as a shared list-slot item', () => {
  it('shrinks instead of claiming the whole host row', () => {
    const row = declarationsOf('.mrfw-triggerRow')
    // `flex: none` is `flex: 0 0 auto`: it refuses to shrink, so this entry
    // would keep its full basis and squeeze every sibling to nothing.
    expect(row.get('flex'), 'a bare `flex: none` here re-introduces the dsh-context collision').not.toBe('none')
    const [grow, shrink] = (row.get('flex') ?? '').split(/\s+/u)
    expect(grow).toBe('0')
    expect(shrink, 'the item must be allowed to shrink').toBe('1')
    expect(row.get('min-width'), 'without min-width: 0 the item never shrinks below its content').toBe('0')
  })

  it('never overhangs its neighbours and adds no spacing of its own', () => {
    const row = declarationsOf('.mrfw-triggerRow')
    // A negative side margin is the 2px overhang that made two cards overlap;
    // a non-zero VERTICAL margin makes this item taller than a 42px neighbour
    // (the two cards then sit out of line) and pads any gap a stacking layout
    // sets. Outer spacing belongs to the container: the host's settings row
    // below already carries its own top margin.
    const [top, right, bottom, left] = (row.get('margin') ?? '').split(/\s+/u)
    for (const side of [top, right, bottom, left]) {
      if (side !== undefined && side !== '0') {
        throw new Error(`margin ${side} on the shared footer row: negative margins overlap the neighbour, and positive ones misalign a 42px sibling`)
      }
    }
    const width = row.get('width') ?? ''
    expect(width, 'a width wider than the share overflows onto the neighbour').not.toMatch(/calc\([^)]*\d+%/u)
    expect(row.get('box-sizing')).toBe('border-box')
  })

  it('is exactly one control tall, so it lines up with a sibling card', () => {
    const row = declarationsOf('.mrfw-triggerRow')
    expect(row.get('margin')).toBe('0')
    // The host's own footer controls are 42px; matching that height is what
    // keeps the icons of two side-by-side entries on one line.
    expect(declarationsOf('.mrfw-trigger').get('height')).toBe('42px')
  })

  it('ellipsizes its label rather than clipping it mid-glyph', () => {
    const label = declarationsOf('.mrfw-triggerLabel')
    expect(label.get('text-overflow')).toBe('ellipsis')
    expect(label.get('min-width')).toBe('0')
    expect(label.get('white-space')).toBe('nowrap')
  })

  it('keeps the collapsed rail entry fixed-size', () => {
    const rail = declarationsOf('.mrfw-triggerRow.mrfw-railRow')
    // The rail form is a 36px circular button centred by the shell; it must not
    // inherit the shrinkable row behaviour above.
    expect(rail.get('flex')).toBe('none')
    expect(rail.get('width')).toBe('36px')
  })
})

describe('the shared footer container takeover (ADR-0011)', () => {
  it('stacks the entries, because the host row cannot let one entry wrap', () => {
    const [container] = rulesMentioning('footerActions')
    expect(container?.selector).toBe('[class*="footerActions"]')
    // Without `!important` a later host or plugin rule silently wins and the
    // cards go back to sharing one squeezed line.
    expect(container?.declarations.get('flex-direction')).toBe('column !important')
    expect(container?.declarations.get('gap'), 'a gap is what keeps stacked cards from touching').toBe('6px')
  })

  it('matches on a class-name substring, never a hashed full name', () => {
    const rules = rulesMentioning('footerActions')
    expect(rules.length, 'the takeover must be present at all').toBeGreaterThanOrEqual(2)
    for (const { selector } of rules) {
      // The host's CSS-module hash differs per build; a full class name
      // (`hHd-Xa_footerActions`) matches nothing in the other build.
      expect(selector, `"${selector}" must use an attribute substring selector`).toContain('[class*=')
    }
  })

  it('centres the collapsed rail instead of stretching it', () => {
    const collapsed = rulesMentioning('footerActions').find(rule => rule.selector.includes('collapsed'))
    expect(collapsed?.declarations.get('align-items')).toBe('center')
  })

  it('declares geometry only, never chrome on another plugin\'s entry', () => {
    // Drawing a frame here would double-frame every card the community layout
    // plugin already boxes; its own rule set is where chrome belongs.
    const chrome = ['border', 'border-top', 'border-radius', 'background', 'box-shadow', 'padding', 'margin']
    for (const { selector, declarations } of rulesMentioning('footerActions')) {
      for (const property of chrome) {
        expect(
          declarations.has(property),
          `${selector} declares ${property}: the shared container is geometry-only (ADR-0011)`,
        ).toBe(false)
      }
    }
  })
})
