/** Fiddle the Fox — the Violingo mascot, drawn as inline SVG. */
export function Mascot({ size = 72 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Fiddle the Fox"
    >
      {/* ears */}
      <polygon points="22,44 40,8 54,38" fill="#d96c2c" />
      <polygon points="98,44 80,8 66,38" fill="#d96c2c" />
      <polygon points="30,40 40,18 48,36" fill="#8f4218" />
      <polygon points="90,40 80,18 72,36" fill="#8f4218" />
      {/* head */}
      <path d="M18 44 Q60 24 102 44 Q104 76 60 106 Q16 76 18 44 Z" fill="#e0702f" />
      {/* muzzle */}
      <path d="M34 70 Q60 58 86 70 Q84 92 60 102 Q36 92 34 70 Z" fill="#fff7ed" />
      {/* blush */}
      <circle cx="30" cy="64" r="6" fill="#ff8b6b" opacity="0.55" />
      <circle cx="90" cy="64" r="6" fill="#ff8b6b" opacity="0.55" />
      {/* eyes */}
      <circle cx="44" cy="56" r="4.5" fill="#362053" />
      <circle cx="76" cy="56" r="4.5" fill="#362053" />
      <circle cx="45.5" cy="54.5" r="1.5" fill="#fff7ed" />
      <circle cx="77.5" cy="54.5" r="1.5" fill="#fff7ed" />
      {/* nose */}
      <circle cx="60" cy="76" r="5" fill="#362053" />
      {/* smile */}
      <path d="M52 86 Q60 92 68 86" stroke="#362053" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* tiny violin, resting at the lower right */}
      <g transform="translate(92 88) rotate(32)">
        <rect x="-1.6" y="-28" width="3.2" height="18" rx="1.6" fill="#4a3320" />
        <circle cx="0" cy="-29" r="3" fill="#4a3320" />
        <path
          d="M-8 -6 Q-10 -12 -5 -12 Q0 -12 0 -8 Q0 -12 5 -12 Q10 -12 8 -6 Q6 -1 8 4 Q10 12 0 12 Q-10 12 -8 4 Q-6 -1 -8 -6 Z"
          fill="#8a5a33"
        />
        <line x1="0" y1="-12" x2="0" y2="10" stroke="#e8d8b0" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
