import { useCallback, useEffect, useRef, useState } from 'react'

// Rough average speaking rate for a browser TTS voice â€” used only to estimate
// a duration/progress bar, not to control actual playback speed.
const WORDS_PER_MINUTE = 165

// Voice selection: prefer a professional FEMALE news-broadcaster voice.
// Voices are supplied by the OS/browser, so this is best-effort by name.
// Accent priority: en-MY, then en-GB, then en-US, then any English. A voice is
// only accepted for a given accent if it's clearly female (per your choice);
// otherwise we fall through to the next accent so the "broadcaster" quality holds.
const FEMALE_BROADCASTER_NAMES = [
  // Microsoft Edge / Windows "Natural" (highest quality, news-like)
  'Microsoft Sonia Online (Natural) - English (United Kingdom)',
  'Microsoft Libby Online (Natural) - English (United Kingdom)',
  'Microsoft Aria Online (Natural) - English (United States)',
  'Microsoft Jenny Online (Natural) - English (United States)',
  'Microsoft Michelle Online (Natural) - English (United States)',
  'Microsoft Clara Online (Natural) - English (Canada)',
  'Microsoft Natasha Online (Natural) - English (Australia)',
  // Windows desktop
  'Microsoft Hazel Desktop - English (United Kingdom)',
  'Microsoft Susan Desktop - English (United Kingdom)',
  'Microsoft Zira Desktop - English (United States)',
  // Apple (macOS / iOS)
  'Samantha', 'Serena', 'Karen', 'Moira', 'Tessa', 'Allison', 'Ava', 'Nicky',
  // Google (Chrome / Android)
  'Google UK English Female', 'Google US English',
]
const FEMALE_BROADCASTER_KEYS = [
  'sonia', 'libby', 'hazel', 'susan', 'aria', 'jenny', 'michelle', 'clara', 'natasha', 'zira',
  'samantha', 'serena', 'karen', 'moira', 'tessa', 'allison', 'ava', 'nicky',
  'google uk english female', 'google us english',
]
const FEMALE_HINTS = [
  'female', 'woman',
  ...FEMALE_BROADCASTER_KEYS,
  'emma', 'olivia', 'amber', 'heera', 'joanna', 'salli', 'kendra', 'kimberly',
]
const ACCENT_ORDER = ['en-my', 'en-gb', 'en-us']

let cachedVoices = []
let voicesReadyPromise = null

function loadVoices() {
  if (!('speechSynthesis' in window)) return Promise.resolve([])
  if (voicesReadyPromise) return voicesReadyPromise

  voicesReadyPromise = new Promise((resolve) => {
    const existing = window.speechSynthesis.getVoices()
    if (existing.length) {
      cachedVoices = existing
      resolve(existing)
      return
    }
    const onVoicesChanged = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length) {
        cachedVoices = voices
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
        resolve(voices)
      }
    }
    window.speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)
    // Some browsers never fire voiceschanged if voices are already loaded
    // synchronously by the time we get here â€” fall back to a short timeout.
    setTimeout(() => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length) {
        cachedVoices = voices
        window.speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
        resolve(voices)
      }
    }, 300)
  })
  return voicesReadyPromise
}

function voiceLang(v) {
  return String(v.lang || '').toLowerCase().replace('_', '-')
}

function pickFemaleBroadcaster(group) {
  if (!group.length) return null
  for (const name of FEMALE_BROADCASTER_NAMES) {
    const hit = group.find((v) => v.name.toLowerCase() === name.toLowerCase())
    if (hit) return hit
  }
  for (const key of FEMALE_BROADCASTER_KEYS) {
    const hit = group.find((v) => v.name.toLowerCase().includes(key))
    if (hit) return hit
  }
  return group.find((v) => FEMALE_HINTS.some((k) => v.name.toLowerCase().includes(k))) || null
}

function getPreferredVoice() {
  const voices = cachedVoices.length ? cachedVoices : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : [])
  if (!voices.length) return null
  const en = voices.filter((v) => voiceLang(v).startsWith('en'))
  if (!en.length) return null

  const groups = []
  for (const accent of ACCENT_ORDER) {
    const g = en.filter((v) => voiceLang(v).startsWith(accent))
    if (g.length) groups.push(g)
  }
  const other = en.filter((v) => !ACCENT_ORDER.some((a) => voiceLang(v).startsWith(a)))
  if (other.length) groups.push(other)

  for (const g of groups) {
    const female = pickFemaleBroadcaster(g)
    if (female) return female
  }
  return groups[0]?.[0] || null
}

export function estimateSeconds(text = '') {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(5, Math.round((words / WORDS_PER_MINUTE) * 60))
}

export function formatDuration(sec = 0) {
  sec = Math.round(sec)
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m <= 0) return `${s} sec`
  return `${m} min ${String(s).padStart(2, '0')} sec`
}

export function formatClock(sec = 0) {
  sec = Math.max(0, Math.round(sec))
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Long single utterances are unreliable in Chrome (speech silently stops after
// ~15s), but every utterance boundary costs an audible gap while the voice
// re-initialises. So article text is packed into whole sentences up to a safe
// ~15s cap; only an over-long sentence is broken, at a clause/word boundary.
const SEGMENT_TARGET = 240
const SEGMENT_MIN = 80

function findSplitPoint(sentence, target, min) {
  const limit = Math.min(target, sentence.length)
  const window = sentence.slice(0, limit)
  // Prefer a clause boundary (comma, semicolon, colon, dash, closing bracket).
  const clauseRe = /[,;:—–)\]]["'”’]?\s/g
  let best = -1
  let mm
  while ((mm = clauseRe.exec(window)) !== null) best = mm.index + mm[0].length
  if (best >= min) return best
  // Otherwise a word boundary at/before the cap.
  let cut = sentence.lastIndexOf(' ', limit)
  if (cut < min) cut = sentence.indexOf(' ', limit)
  if (cut === -1) cut = limit
  return cut
}

// Pack text into sentence-aligned segments, preserving each segment's character
// offset within the original text (used for progress/resume).
export function buildSegments(text = '') {
  const t = String(text || '')
  const segs = []
  let buf = ''
  let bufStart = 0
  const flush = () => {
    const out = buf.trim()
    if (out) segs.push({ text: out, start: bufStart })
    buf = ''
  }
  const pack = (sentence, sentenceStart) => {
    if (!sentence.trim()) return
    if (buf && buf.length + sentence.length > SEGMENT_TARGET && buf.length >= SEGMENT_MIN) flush()
    if (!buf) bufStart = sentenceStart
    buf += sentence
    if (buf.length >= SEGMENT_TARGET) flush()
  }
  const re = /[^.!?…\n]+[.!?…]*\s*/g
  let m
  while ((m = re.exec(t)) !== null) {
    if (!m[0]) { re.lastIndex++; continue }
    let sentence = m[0]
    let sentenceStart = m.index
    // Only hard-split a sentence that is longer than one safe segment.
    while (sentence.length > SEGMENT_TARGET) {
      const cut = findSplitPoint(sentence, SEGMENT_TARGET, SEGMENT_MIN)
      const piece = sentence.slice(0, cut)
      if (buf && buf.length + piece.length > SEGMENT_TARGET && buf.length >= SEGMENT_MIN) flush()
      if (!buf) bufStart = sentenceStart
      buf += piece
      flush()
      sentence = sentence.slice(cut)
      sentenceStart += cut
    }
    pack(sentence, sentenceStart)
  }
  flush()
  return segs
}

export function segmentForOffset(segs, charOffset) {
  if (!segs.length) return 0
  for (let i = 0; i < segs.length; i++) {
    if (charOffset < segs[i].start + segs[i].text.length) return i
  }
  return segs.length - 1
}

/**
 * Drives browser text-to-speech (Web Speech API) over a queue of articles.
 * Each item is { id, slug, title, text }. Nothing is pre-recorded â€” every
 * headline's full text is synthesized live, on demand, which is what lets
 * this work for any article without a backend TTS service.
 */
export function useNewsReader(items) {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  useEffect(() => {
    if (supported) loadVoices()
  }, [supported])

  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [muted, setMuted] = useState(false)

  const itemsRef = useRef(items)
  itemsRef.current = items
  const mutedRef = useRef(muted)
  mutedRef.current = muted
  const elapsedRef = useRef(0)
  const startOffsetSecRef = useRef(0)
  const startTimeRef = useRef(0)
  const rafRef = useRef(null)
  // Incremented every time we start/stop/cancel speech so stale utterance
  // callbacks (onend/onerror) from an older utterance are ignored.
  const seqRef = useRef(0)
  const segmentsCacheRef = useRef(new Map())
  const startUtteranceRef = useRef(null)
  // Anti-stall watchdog: Chrome sometimes silently stops a long utterance
  // without firing onend. We watch boundary events and nudge it back to life.
  const watchdogRef = useRef(null)
  const lastProgressAtRef = useRef(0)
  const stallRetriesRef = useRef(0)
  const activeRef = useRef(null)

  const stopTicker = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }, [])

  const tick = useCallback(() => {
    const sinceStart = (Date.now() - startTimeRef.current) / 1000
    const value = startOffsetSecRef.current + sinceStart
    elapsedRef.current = value
    setElapsed(value)
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const getSegments = useCallback((item, idx) => {
    const key = String(item.id ?? idx)
    let segs = segmentsCacheRef.current.get(key)
    if (!segs) {
      segs = buildSegments(item.text || item.title)
      segmentsCacheRef.current.set(key, segs)
    }
    return segs
  }, [])

  const stopWatchdog = useCallback(() => {
    if (watchdogRef.current) clearInterval(watchdogRef.current)
    watchdogRef.current = null
  }, [])

  const startWatchdog = useCallback(() => {
    stopWatchdog()
    lastProgressAtRef.current = Date.now()
    stallRetriesRef.current = 0
    watchdogRef.current = setInterval(() => {
      if (!supported) return
      const synth = window.speechSynthesis
      if (!synth.speaking || synth.paused) { stallRetriesRef.current = 0; return }
      if (Date.now() - lastProgressAtRef.current < 4500) { stallRetriesRef.current = 0; return }
      // Stalled: try nudging Chrome first, then re-speak the current remainder.
      if (stallRetriesRef.current < 3) {
        stallRetriesRef.current++
        lastProgressAtRef.current = Date.now()
        try { synth.resume() } catch (e) { /* ignore */ }
        return
      }
      stallRetriesRef.current = 0
      lastProgressAtRef.current = Date.now()
      const a = activeRef.current
      if (!a) return
      try { synth.cancel() } catch (e) { /* ignore */ }
      setTimeout(() => startUtteranceRef.current(a.itemIdx, a.segIdx, a.lastCharIndex), 60)
    }, 2000)
  }, [supported, stopWatchdog])

  const startUtterance = useCallback((itemIdx, segIdx, innerOffset = 0, hardCancel = true) => {
    if (!supported) return
    const it = itemsRef.current[itemIdx]
    if (!it) { setPlaying(false); return }
    const fullText = it.text || it.title
    const segs = getSegments(it, itemIdx)
    if (!segs.length) { setPlaying(false); return }
    const seg = segs[segIdx] || segs[segs.length - 1]
    const text = seg.text.slice(innerOffset) || seg.text

    activeRef.current = { itemIdx, segIdx, base: innerOffset, lastCharIndex: innerOffset }
    lastProgressAtRef.current = Date.now()
    stallRetriesRef.current = 0

    // Don't cancel when advancing between segments (a cancel immediately before
    // speak can be silently dropped by Chrome); only when (re)starting playback.
    if (hardCancel) window.speechSynthesis.cancel()
    const mySeq = ++seqRef.current

    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 0.97
    utter.pitch = 1
    utter.volume = mutedRef.current ? 0 : 1
    const voice = getPreferredVoice()
    if (voice) {
      utter.voice = voice
      utter.lang = voice.lang
    }

    const doneChars = seg.start + innerOffset
    const dur = estimateSeconds(fullText)
    startOffsetSecRef.current = fullText.length ? (doneChars / fullText.length) * dur : 0
    elapsedRef.current = startOffsetSecRef.current
    startTimeRef.current = Date.now()

    utter.onboundary = (e) => {
      lastProgressAtRef.current = Date.now()
      stallRetriesRef.current = 0
      if (e && typeof e.charIndex === 'number') activeRef.current.lastCharIndex = innerOffset + e.charIndex
    }
    utter.onend = () => {
      if (mySeq !== seqRef.current) return
      if (segIdx + 1 < segs.length) {
        startUtteranceRef.current(itemIdx, segIdx + 1, 0, false)
        return
      }
      const nextIdx = itemIdx + 1
      if (itemsRef.current[nextIdx]) {
        setIndex(nextIdx)
        setElapsed(0)
        elapsedRef.current = 0
        startOffsetSecRef.current = 0
        startUtteranceRef.current(nextIdx, 0, 0, false)
      } else {
        stopWatchdog()
        stopTicker()
        setPlaying(false)
      }
    }
    utter.onerror = () => {
      if (mySeq !== seqRef.current) return
      // Skip only the failed segment, keep going if more remain.
      if (segIdx + 1 < segs.length) {
        startUtteranceRef.current(itemIdx, segIdx + 1, 0, false)
        return
      }
      stopWatchdog()
      stopTicker()
      setPlaying(false)
    }

    window.speechSynthesis.speak(utter)
    setPlaying(true)
    stopTicker()
    tick()
    startWatchdog()
  }, [supported, getSegments, stopTicker, tick, startWatchdog, stopWatchdog])
  startUtteranceRef.current = startUtterance

  const play = useCallback(() => {
    if (!supported) return
    const it = itemsRef.current[index]
    if (!it) return
    const fullText = it.text || it.title
    const dur = estimateSeconds(fullText)
    const segs = getSegments(it, index)
    let charOffset = 0
    // Resume from where we paused (approximate, by character offset) instead of
    // restarting — this is robust across browsers that don't reliably support
    // speechSynthesis.pause()/resume().
    if (dur > 0 && elapsedRef.current > 0.75 && elapsedRef.current < dur - 0.75) {
      charOffset = Math.floor((elapsedRef.current / dur) * fullText.length)
    } else if (dur > 0 && elapsedRef.current >= dur - 0.75) {
      const nextIdx = index + 1
      if (itemsRef.current[nextIdx]) {
        setIndex(nextIdx); setElapsed(0); elapsedRef.current = 0; startUtteranceRef.current(nextIdx, 0, 0); return
      }
      charOffset = 0
    }
    const segIdx = segmentForOffset(segs, charOffset)
    startUtteranceRef.current(index, segIdx, Math.max(0, charOffset - segs[segIdx].start))
  }, [supported, index, getSegments])

  const pause = useCallback(() => {
    if (!supported) return
    stopWatchdog()
    stopTicker()
    seqRef.current++            // ignore the canceled utterance's callbacks
    window.speechSynthesis.cancel()
    setPlaying(false)
  }, [supported, stopTicker, stopWatchdog])

  const toggle = useCallback(() => { playing ? pause() : play() }, [playing, pause, play])

  const selectIndex = useCallback((idx) => {
    setIndex(idx)
    setElapsed(0)
    elapsedRef.current = 0
    startUtteranceRef.current(idx, 0, 0)
  }, [])

  const next = useCallback(() => {
    if (itemsRef.current[index + 1]) selectIndex(index + 1)
  }, [index, selectIndex])

  const prev = useCallback(() => {
    if (itemsRef.current[index - 1]) selectIndex(index - 1)
  }, [index, selectIndex])

  const seekFraction = useCallback((frac) => {
    const it = itemsRef.current[index]
    if (!it) return
    const fullText = it.text || it.title
    const dur = estimateSeconds(fullText)
    const clamped = Math.max(0, Math.min(1, frac))
    const charOffset = Math.floor(clamped * fullText.length)
    const segs = getSegments(it, index)
    if (playing) {
      const segIdx = segmentForOffset(segs, charOffset)
      startUtteranceRef.current(index, segIdx, Math.max(0, charOffset - segs[segIdx].start))
    } else {
      // Move the playhead without starting audio; the next play resumes here.
      stopTicker()
      seqRef.current++
      if (supported) window.speechSynthesis.cancel()
      const sec = clamped * dur
      elapsedRef.current = sec
      startOffsetSecRef.current = sec
      startTimeRef.current = Date.now()
      setElapsed(sec)
    }
  }, [index, playing, getSegments, stopTicker, supported])

  const toggleMute = useCallback(() => {
    const nextMuted = !mutedRef.current
    mutedRef.current = nextMuted
    setMuted(nextMuted)
    // Utterance volume can't change mid-speech, so re-speak from the current
    // position with the new volume — imperceptible in practice.
    const it = itemsRef.current[index]
    if (playing && it) {
      const fullText = it.text || it.title
      const dur = estimateSeconds(fullText)
      const frac = dur > 0 ? Math.min(1, elapsedRef.current / dur) : 0
      const charOffset = Math.floor(frac * fullText.length)
      const segs = getSegments(it, index)
      const segIdx = segmentForOffset(segs, charOffset)
      startUtteranceRef.current(index, segIdx, Math.max(0, charOffset - segs[segIdx].start))
    }
  }, [playing, index, getSegments])

  const stop = useCallback(() => {
    stopWatchdog()
    stopTicker()
    seqRef.current++
    if (supported) window.speechSynthesis.cancel()
    setPlaying(false)
    setElapsed(0)
    elapsedRef.current = 0
  }, [supported, stopTicker, stopWatchdog])

  // Stop any speech and the ticker on unmount.
  useEffect(() => () => {
    stopWatchdog()
    stopTicker()
    seqRef.current++
    if (supported) window.speechSynthesis.cancel()
  }, [supported, stopTicker, stopWatchdog])

  const current = items[index] || null
  const duration = current ? estimateSeconds(current.text || current.title) : 0

  return {
    supported, items, index, current, playing, elapsed, duration, muted,
    play, pause, toggle, next, prev, selectIndex, seekFraction, toggleMute, stop,
    hasPrev: index > 0, hasNext: index < items.length - 1,
  }
}