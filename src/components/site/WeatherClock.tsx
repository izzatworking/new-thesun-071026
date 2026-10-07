import { useEffect, useState } from 'react'
import { Sun, Cloud, CloudRain, CloudDrizzle, CloudLightning, CloudSnow, CloudFog } from 'lucide-react'

// The Sun Malaysia is a Malaysian publication — weather is pinned to Kuala Lumpur.
const LOCATION = { name: 'Kuala Lumpur', latitude: 3.139, longitude: 101.6869 }
const TIMEZONE = 'Asia/Kuala_Lumpur'

// Map WMO weather codes (Open-Meteo) to an icon + short label.
function describeCode(code) {
  if (code === 0) return { label: 'Clear', Icon: Sun }
  if ([1, 2, 3].includes(code)) return { label: 'Cloudy', Icon: Cloud }
  if ([45, 48].includes(code)) return { label: 'Hazy', Icon: CloudFog }
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Drizzle', Icon: CloudDrizzle }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: 'Rain', Icon: CloudRain }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snow', Icon: CloudSnow }
  if ([95, 96, 99].includes(code)) return { label: 'Storm', Icon: CloudLightning }
  return { label: 'Clear', Icon: Sun }
}

export default function WeatherClock({ variant = 'full', className = '' }) {
  const [now, setNow] = useState(new Date())
  const [weather, setWeather] = useState(null)

  // Tick the clock every 30s — plenty for a display that only shows hh:mm.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  // Fetch current weather once, then refresh every 15 minutes.
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${LOCATION.latitude}&longitude=${LOCATION.longitude}&current_weather=true&timezone=${encodeURIComponent(TIMEZONE)}`
        const res = await fetch(url)
        if (!res.ok) throw new Error('weather request failed')
        const data = await res.json()
        if (!cancelled) setWeather(data?.current_weather || null)
      } catch (e) {
        /* silently keep last-known / empty state */
      }
    }
    load()
    const t = setInterval(load, 15 * 60_000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  const dateStr = now.toLocaleDateString('en-MY', { timeZone: TIMEZONE, weekday: 'short', day: '2-digit', month: 'short' })
  const timeStr = now.toLocaleTimeString('en-MY', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' })
  const { label, Icon } = describeCode(weather?.weathercode ?? 0)
  const temp = weather ? Math.round(weather.temperature) : null

  if (variant === 'compact') {
    return (
      <div
        className={`flex items-center gap-1.5 shrink-0 rounded border border-border px-2 py-1.5 text-[10px] font-semibold text-foreground/70 whitespace-nowrap ${className}`}
        aria-label={`Weather in ${LOCATION.name}: ${temp !== null ? temp + '°C' : '—'}, ${timeStr}`}
      >
        <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
        {temp !== null && <span>{temp}°C</span>}
        <span className="w-px h-3 bg-border" />
        <span>{timeStr}</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 shrink-0 rounded-lg border border-border bg-muted/40 px-4 py-2 ${className}`}>
      <div className="flex items-center gap-2.5">
        <Icon className="h-7 w-7 text-primary shrink-0" />
        <div className="leading-tight">
          <div className="text-lg font-bold font-serif-headline leading-none">
            {temp !== null ? `${temp}°C` : '--'}
          </div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
            {label} · {LOCATION.name}
          </div>
        </div>
      </div>
      <span className="w-px h-9 bg-border" />
      <div className="text-right leading-tight">
        <div className="text-sm font-semibold">{timeStr}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">{dateStr}</div>
      </div>
    </div>
  )
}