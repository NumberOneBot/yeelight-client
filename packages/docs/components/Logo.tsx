export default function Logo({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-70 -80 540 520"
      style={style}
      aria-hidden="true"
      className="yeelight-logo"
    >
      <style>{`.yeelight-logo { color: #111 } .dark .yeelight-logo { color: #F0EAD6 }`}</style>
      {/* Floating dots above the bulb */}
      <circle cx="32" cy="48" r="16" fill="#F48FB1" opacity="0.5" />
      <circle cx="95" cy="-9" r="15" fill="#FFA726" opacity="0.85" />
      <circle cx="188" cy="-38" r="18" fill="#FFCA28" opacity="0.85" />
      <circle cx="261" cy="-45" r="17" fill="#EF5350" opacity="0.85" />
      <circle cx="325" cy="8" r="16" fill="#AB47BC" opacity="0.85" />
      <circle cx="362" cy="78" r="14" fill="#29B6F6" opacity="0.85" />

      {/* Coloured circles inside the bulb */}
      <g>
        <circle cx="172" cy="154" r="80" fill="#EF5350" opacity="0.75" />
        <circle cx="228" cy="154" r="80" fill="#FF7043" opacity="0.7" />
        <circle cx="200" cy="114" r="75" fill="#FFCA28" opacity="0.7" />
        <circle cx="153" cy="198" r="70" fill="#66BB6A" opacity="0.7" />
        <circle cx="247" cy="198" r="70" fill="#29B6F6" opacity="0.7" />
        <circle cx="200" cy="230" r="65" fill="#AB47BC" opacity="0.45" />
        <circle cx="200" cy="167" r="45" fill="#FFEB3B" opacity="0.65" />
      </g>

      {/* Bulb outline — uses currentColor → white in dark mode */}
      <path
        d="M133,325 C133,310 125,295 110,280 C85,255 60,220 60,170 C60,90 120,30 200,30 C280,30 340,90 340,170 C340,220 315,255 290,280 C275,295 267,310 267,325"
        fill="none"
        stroke="currentColor"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Thread bands */}
      <rect
        x="137"
        y="342"
        width="127"
        height="18"
        rx="9"
        fill="currentColor"
      />
      <rect
        x="137"
        y="368"
        width="127"
        height="18"
        rx="9"
        fill="currentColor"
      />
      <rect
        x="137"
        y="394"
        width="127"
        height="18"
        rx="9"
        fill="currentColor"
      />

      {/* Bottom cap */}
      <rect x="160" y="420" width="80" height="18" rx="9" fill="currentColor" />
    </svg>
  )
}
