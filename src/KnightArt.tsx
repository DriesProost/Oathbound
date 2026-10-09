export default function KnightArt() {
  return (
    <svg
      viewBox="0 0 320 350"
      role="img"
      aria-label="A steel-armoured knight bearing an oak-green shield"
    >
      <defs>
        <linearGradient id="steel" x1="0" x2="1">
          <stop stopColor="#687974" />
          <stop offset=".5" stopColor="#d0d6ca" />
          <stop offset="1" stopColor="#596b66" />
        </linearGradient>
        <linearGradient id="cloak" x2=".7" y2="1">
          <stop stopColor="#45665a" />
          <stop offset="1" stopColor="#182c26" />
        </linearGradient>
      </defs>
      <circle cx="165" cy="154" r="116" fill="#d5c9aa" opacity=".13" />
      <circle
        cx="165"
        cy="154"
        r="104"
        fill="none"
        stroke="#bdad80"
        opacity=".2"
      />
      <path
        d="M79 307L98 155 128 111 195 110 222 150 246 308Z"
        fill="url(#cloak)"
      />
      <path
        d="M137 250L130 322H153L166 254 176 322H201L191 248Z"
        fill="url(#steel)"
      />
      <path
        d="M122 119L151 107 187 111 207 137 196 226 172 256 131 234 115 165Z"
        fill="url(#steel)"
      />
      <path
        d="M158 124L159 219M128 198L194 202M128 216L193 219"
        stroke="#465851"
        strokeWidth="3"
      />
      <path
        d="M141 52L168 41 194 54 200 92 184 113 153 110 134 87Z"
        fill="url(#steel)"
      />
      <path d="M139 72L197 72 190 83 143 83Z" fill="#1a3029" />
      <path d="M170 46L170 107" stroke="#dae0d3" strokeWidth="4" />
      <path
        d="M122 121L97 124 85 146 105 160 125 146M199 121L221 126 234 148 213 160 196 142"
        fill="url(#steel)"
      />
      <path
        d="M94 153L83 205 96 218 114 160M219 154L235 211 219 227 202 161"
        fill="url(#steel)"
      />
      <path
        d="M78 168L129 179 127 237 101 267 72 230Z"
        fill="#294c3d"
        stroke="#b2ab87"
        strokeWidth="4"
      />
      <path
        d="M98 187L108 187 108 208 120 208 120 217 108 217 108 239 98 239 98 217 85 217 85 208 98 208Z"
        fill="#c5b27c"
      />
      <path d="M233 166L229 292" stroke="#bbc5b8" strokeWidth="6" />
      <path d="M214 209L248 212" stroke="#b6a16b" strokeWidth="6" />
      <path d="M230 295L224 283 235 283Z" fill="#d1d5ca" />
      <ellipse cx="160" cy="331" rx="80" ry="9" fill="#0c211b" opacity=".35" />
    </svg>
  );
}
