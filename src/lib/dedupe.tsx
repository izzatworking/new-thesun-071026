import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Page-level de-duplication.
//
// Sections fetch independently (and stay indepdently cached), but on a single
// page no article should appear twice. A section "claims" the IDs it renders
// with a numeric priority (lower = higher priority). `useDedupe` returns only
// the posts this section is allowed to show: candidates not already claimed by
// a *higher-priority* section. If a higher-priority section loads later it takes
// the story over, and the lower section re-renders without it — so the final
// state always resolves to a unique set, regardless of load order.
const DedupeContext = createContext(null)

export function DedupeProvider({ children }) {
  const claimsRef = useRef(new Map()) // id -> { owner, priority }
  const [version, setVersion] = useState(0)

  const claim = useCallback((owner, priority, ids) => {
    let changed = false
    const claims = claimsRef.current
    for (const id of ids) {
      const cur = claims.get(id)
      if (!cur || cur.priority > priority) {
        claims.set(id, { owner, priority })
        changed = true
      }
    }
    if (changed) setVersion((v) => v + 1)
  }, [])

  const value = useMemo(() => ({ claims: claimsRef.current, claim, version }), [claim, version])
  return <DedupeContext.Provider value={value}>{children}</DedupeContext.Provider>
}

// Returns at most `count` posts from `posts`, skipping anything already claimed
// by a higher-priority section. Safe to call with no provider (returns a plain
// slice) so components work unchanged on pages without de-dup.
export function useDedupe(owner, priority, posts, count) {
  const ctx = useContext(DedupeContext)
  const claimsVersion = ctx ? ctx.version : 0

  const shown = useMemo(() => {
    const list = Array.isArray(posts) ? posts : []
    if (!ctx) return list.slice(0, count)
    const out = []
    for (const p of list) {
      const c = ctx.claims.get(p.id)
      if (c && c.priority < priority) continue
      out.push(p)
      if (out.length >= count) break
    }
    // Never leave a block blank: if every candidate was claimed by a
    // higher-priority section, fall back to its top candidates.
    if (out.length === 0 && list.length > 0) return list.slice(0, count)
    return out
    // claims read via version counter (Map identity is stable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts, priority, count, claimsVersion])

  useEffect(() => {
    if (ctx && shown.length) ctx.claim(owner, priority, shown.map((p) => p.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown, owner, priority])

  return shown
}
