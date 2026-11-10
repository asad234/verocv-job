'use client'

export interface RunStyle {
  bold?: boolean
  italic?: boolean
  color?: string // any valid CSS color, e.g. "#051650"
  fontFamily?: string // must match a PDF_FONTS value for PDF export to work later
  fontSize?: number // in pt
}

export interface RichRun extends RunStyle {
  id: string
  text: string
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

/* ─── Plain text ⇄ runs ─── */

export function plainTextToRuns(text: string): RichRun[] {
  return text ? [{ id: uid(), text }] : []
}

export function runsToPlainText(runs: RichRun[]): string {
  return runs.map((r) => r.text).join('')
}

export function isSectionFilled(runs: RichRun[]): boolean {
  return runs.some((r) => r.text.trim().length > 0)
}

/* ─── Runs ⇄ HTML (for loading into / reading out of a contentEditable) ─── */

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function runsToHtml(runs: RichRun[]): string {
  if (!runs.length) return ''
  return runs
    .map((r) => {
      const styles: string[] = []
      if (r.bold) styles.push('font-weight:700')
      if (r.italic) styles.push('font-style:italic')
      if (r.color) styles.push(`color:${r.color}`)
      if (r.fontFamily) styles.push(`font-family:'${r.fontFamily}'`)
      if (r.fontSize) styles.push(`font-size:${r.fontSize}pt`)
      const attr = styles.length ? ` style="${styles.join(';')}"` : ''
      const safe = escapeHtml(r.text).replace(/\n/g, '<br/>')
      return `<span${attr}>${safe}</span>`
    })
    .join('')
}

function styleKey(r: RunStyle) {
  return `${r.bold ?? ''}|${r.italic ?? ''}|${r.color ?? ''}|${r.fontFamily ?? ''}|${r.fontSize ?? ''}`
}

function mergeAdjacentRuns(runs: RichRun[]): RichRun[] {
  const out: RichRun[] = []
  for (const r of runs) {
    const last = out[out.length - 1]
    if (last && styleKey(last) === styleKey(r)) {
      last.text += r.text
    } else {
      out.push({ ...r })
    }
  }
  return out
}

// Walks a contentEditable's DOM tree after the user has typed/formatted,
// and flattens it back into an ordered list of styled runs. Each element's
// inline style contributes to the "inherited" style passed down to its
// children, so nested <span> wrapping (from applyStyleToSelection below)
// resolves correctly.
export function serializeToRuns(root: HTMLElement): RichRun[] {
  const runs: RichRun[] = []

  function walk(node: Node, inherited: RunStyle) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ''
      if (text) runs.push({ id: uid(), text, ...inherited })
      return
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      if (el.tagName === 'BR') {
        runs.push({ id: uid(), text: '\n', ...inherited })
        return
      }
      const next: RunStyle = { ...inherited }
      const fw = el.style.fontWeight
      if (fw === '700' || fw === 'bold') next.bold = true
      else if (fw === '400' || fw === 'normal') next.bold = false
      const fst = el.style.fontStyle
      if (fst === 'italic') next.italic = true
      else if (fst === 'normal') next.italic = false
      if (el.style.color) next.color = el.style.color
      if (el.style.fontFamily) next.fontFamily = el.style.fontFamily.replace(/^['"]|['"]$/g, '')
      if (el.style.fontSize) {
        const n = parseFloat(el.style.fontSize)
        if (!Number.isNaN(n)) next.fontSize = n
      }
      Array.from(el.childNodes).forEach((child) => walk(child, next))
    }
  }

  Array.from(root.childNodes).forEach((node) => walk(node, {}))
  return mergeAdjacentRuns(runs)
}

/* ─── Selection-based formatting ───
   These operate directly on the DOM selection inside a contentEditable.
   Approach: extract the selected fragment, strip any inline style props
   we're about to override from its descendants (so our new outer wrapper
   isn't shadowed by a more specific inner style), wrap in a <span> with
   the requested style, and reinsert. */

const CSS_PROP: Record<keyof RunStyle, string> = {
  bold: 'fontWeight',
  italic: 'fontStyle',
  color: 'color',
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
}

export function applyStyleToSelection(root: HTMLElement, updates: RunStyle): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (range.collapsed) return false
  if (!root.contains(range.commonAncestorContainer)) return false

  const frag = range.extractContents()
  const touchedProps = Object.keys(updates) as (keyof RunStyle)[]

  function strip(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      touchedProps.forEach((p) => {
        ;(el.style as any)[CSS_PROP[p]] = ''
      })
      Array.from(el.childNodes).forEach(strip)
    }
  }
  Array.from(frag.childNodes).forEach(strip)

  const span = document.createElement('span')
  if (updates.bold !== undefined) span.style.fontWeight = updates.bold ? '700' : '400'
  if (updates.italic !== undefined) span.style.fontStyle = updates.italic ? 'italic' : 'normal'
  if (updates.color !== undefined) span.style.color = updates.color
  if (updates.fontFamily !== undefined) span.style.fontFamily = `'${updates.fontFamily}'`
  if (updates.fontSize !== undefined) span.style.fontSize = `${updates.fontSize}pt`
  span.appendChild(frag)
  range.insertNode(span)

  const newRange = document.createRange()
  newRange.selectNodeContents(span)
  sel.removeAllRanges()
  sel.addRange(newRange)

  return true
}

export function clearFormattingInSelection(root: HTMLElement): boolean {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return false
  const range = sel.getRangeAt(0)
  if (range.collapsed || !root.contains(range.commonAncestorContainer)) return false

  const frag = range.extractContents()
  function strip(node: Node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement
      el.removeAttribute('style')
      Array.from(el.childNodes).forEach(strip)
    }
  }
  Array.from(frag.childNodes).forEach(strip)
  range.insertNode(frag)
  return true
}

/* ─── Effective style for rendering a run outside the editor (print/PDF) ─── */

export function effectiveRunStyle(
  run: RichRun,
  fallback: { fontFamily: string; color: string; fontSize: number },
) {
  return {
    fontFamily: `'${run.fontFamily ?? fallback.fontFamily}'`,
    color: run.color ?? fallback.color,
    fontSize: `${run.fontSize ?? fallback.fontSize}pt`,
    fontWeight: run.bold ? 700 : 400,
    fontStyle: run.italic ? ('italic' as const) : ('normal' as const),
  }
}
