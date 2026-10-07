import { useEffect, useRef, useState } from 'react'
import { useAds } from '@/lib/adsStore'

// Drop-in wrapper for any ad spot:
//
//   <AdSlot id="home-sidebar-ad" height={160} maxWidth={480}>
//     ...current default banner markup...
//   </AdSlot>
//
// Saved ad code renders in a sandboxed iframe (scripts allowed, but NO
// allow-same-origin — it can't touch the page/storage). The iframe gets a small
// responsive reset (images scale to the slot width) and reports its own content
// height back so nothing is clipped, regardless of the code an editor pastes.
export default function AdSlot({
  id,
  height = 250,
  maxWidth = null,
  className = '',
  children,
}: {
  id: string
  height?: number
  maxWidth?: number | null
  className?: string
  children?: React.ReactNode
}) {
  const { ads } = useAds()
  const code = ads?.[id]
  const [boxHeight, setBoxHeight] = useState(height)
  const marker = useRef(`ad-${id}-${Math.random().toString(36).slice(2)}`)

  useEffect(() => {
    function onMessage(e) {
      const d = e.data
      if (!d || d.__adHeight == null || d.marker !== marker.current) return
      const next = Math.max(20, Math.min(1500, Math.round(Number(d.__adHeight))))
      if (next) setBoxHeight(next)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Reset to the slot's base height whenever the code changes.
  useEffect(() => { setBoxHeight(height) }, [height, code])

  if (!code) return children ?? null

  const srcdoc = `<!doctype html><html><head><meta charset="utf-8"><base target="_blank">
<style>
  html,body{margin:0;padding:0;background:transparent;overflow:hidden}
  *,*::before,*::after{box-sizing:border-box}
  img,video,iframe,object,svg,canvas{max-width:100%;height:auto;display:block;border:0}
  a{display:inline-block}
</style></head><body>
${code}
<script>(function(){var m=${JSON.stringify(marker.current)};
function r(){try{var de=document.documentElement,b=document.body;var h=Math.max(de.scrollHeight,de.offsetHeight,b?b.scrollHeight:0,b?b.offsetHeight:0);parent.postMessage({__adHeight:h,marker:m},'*')}catch(e){}}
window.addEventListener('load',r);window.addEventListener('resize',r);
if(window.ResizeObserver){try{new ResizeObserver(r).observe(document.documentElement)}catch(e){}}
setTimeout(r,200);setTimeout(r,800);setTimeout(r,2000);})();</script>
</body></html>`

  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      style={{ maxWidth: maxWidth || undefined, margin: maxWidth ? '0 auto' : undefined }}
      aria-label="Advertisement"
    >
      <iframe
        title={`ad-${id}`}
        srcDoc={srcdoc}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
        style={{ width: '100%', height: boxHeight || height, border: 0, display: 'block' }}
        scrolling="no"
      />
    </div>
  )
}
