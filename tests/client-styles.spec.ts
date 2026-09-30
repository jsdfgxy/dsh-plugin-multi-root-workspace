/**
 * The one stylesheet rule that is a CONTRACT with other plugins, not a taste.
 *
 * `sidebar.footer.action` is a `kind: 'list'` slot rendered inside the shell's
 * `.footerActions` flex ROW, with the slot's `display: contents` anchor between
 * them — so every registrant's root element is a sibling flex item. Our row
 * therefore has to remain a well-behaved item: shrinkable, full width only
 * within its own share, and without a negative horizontal margin.
 *
 * This was a real collision, not a hypothetical: `flex: none` plus
 * `width: calc(100% + 4px)` plus `margin: … -2px` made this entry claim the
 * whole row and squeeze `dsh-context`'s overview card down to its bare icon.
 * The assertions below are the ones that would have caught it.
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

  it('never overhangs its neighbours', () => {
    const row = declarationsOf('.mrfw-triggerRow')
    const margin = row.get('margin') ?? ''
    // The 2px side overhang existed to align this icon with the Settings gear
    // while this was the only footer entry; it is what makes two cards overlap.
    for (const side of margin.split(/\s+/u)) {
      if (side.startsWith('-')) throw new Error(`a negative margin (${side}) makes this row overlap the next plugin's card`)
    }
    const width = row.get('width') ?? ''
    expect(width, 'a width wider than the share overflows onto the neighbour').not.toMatch(/calc\([^)]*\d+%/u)
    expect(row.get('box-sizing')).toBe('border-box')
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
