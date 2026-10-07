// Red diagonal-cut "The Sun Malaysia BREAKING" ribbon badge, used at the start of
// the breaking-news ticker (top bar + standalone BreakingTicker component).
export default function BreakingBadge({ className = '' }) {
  return (
    <div className={`relative flex items-stretch shrink-0 ${className}`}>
      {/* Red parallelogram containing the wordmark */}
      <div
        className="bg-primary flex items-center pl-3 pr-8 sm:pr-9"
        style={{ clipPath: 'polygon(0 0, 100% 0, 76% 100%, 0 100%)' }}
      >
        <span className="font-serif-headline leading-none whitespace-nowrap text-white text-sm sm:text-base">
          <span className="italic font-medium">the</span>
          <span className="font-extrabold">Sun</span>
        </span>
      </div>
      {/* BREAKING label, overlapping the slanted edge onto the dark background */}
      <span className="flex items-center -ml-5 sm:-ml-6 pl-5 sm:pl-6 pr-3 text-white font-black uppercase tracking-wider text-[11px] sm:text-xs whitespace-nowrap">
        Breaking
      </span>
    </div>
  )
}
