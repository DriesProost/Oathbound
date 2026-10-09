import { useId } from "react";
import { knightAppearance } from "./appearance";
import type { Attribute } from "./config";
export default function KnightArt({ renown = 0, xp = {} }: { renown?: number; xp?: Partial<Record<Attribute, number>> }) {
  const look = knightAppearance(renown, xp);
  const id = useId().replace(/:/g, "");
  const steel = `${id}-steel`, cloak = `${id}-cloak`;
  const plain = look.stage === 0;

  return (
    <svg
      viewBox="0 0 320 350"
      role="img"
      aria-label={`${look.rank}: ${look.description}`}
    >
      <defs>
        <linearGradient id={steel} x1="0" x2="1">
          <stop stopColor="#687974" />
          <stop offset=".5" stopColor="#d0d6ca" />
          <stop offset="1" stopColor="#596b66" />
        </linearGradient>
        <linearGradient id={cloak} x2=".7" y2="1">
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
        fill={plain ? "#796e55" : `url(#${cloak})`}
      />
      <path
        d="M137 250L130 322H153L166 254 176 322H201L191 248Z"
        fill={plain ? "#79634c" : `url(#${steel})`}
      />
      <path
        d="M122 119L151 107 187 111 207 137 196 226 172 256 131 234 115 165Z"
        fill={plain ? "#79634c" : `url(#${steel})`}
      />
      <path
        d="M158 124L159 219M128 198L194 202M128 216L193 219"
        stroke="#465851"
        strokeWidth="3"
      />
      {look.stage >= 2 ? <>
      <path
        d="M141 52L168 41 194 54 200 92 184 113 153 110 134 87Z"
        fill={plain ? "#79634c" : `url(#${steel})`}
      />
      <path d="M139 72L197 72 190 83 143 83Z" fill="#1a3029" />
      <path d="M170 46L170 107" stroke="#dae0d3" strokeWidth="4" />
      </> : <>
        <path d="M143 61Q145 43 169 43Q194 45 194 65L190 95Q171 116 150 96Z" fill="#ba9d7b" />
        <path d="M142 67Q137 39 169 37Q199 41 196 68L184 54 150 58Z" fill={look.stage === 1 ? `url(#${steel})` : "#544737"} />
        <path d="M156 76h5m17 0h5M164 94q7 4 14 0" fill="none" stroke="#5d4938" strokeWidth="2" />
      </>}
      {look.stage === 1 && <g stroke="#465851" strokeWidth="1" opacity=".5">{Array.from({length: 9}, (_, i) => <path key={i} d={`M132 ${135+i*10}h60`} strokeDasharray="2 4" />)}</g>}
      {look.stage >= 2 && <path d="M142 119L190 119 191 220 168 243 140 224Z" fill="#294c3d" stroke="#b2ab87" strokeWidth="2" />}

      <path
        d="M122 121L97 124 85 146 105 160 125 146M199 121L221 126 234 148 213 160 196 142"
        fill={plain ? "#79634c" : `url(#${steel})`}
      />
      <path
        d="M94 153L83 205 96 218 114 160M219 154L235 211 219 227 202 161"
        fill={plain ? "#79634c" : `url(#${steel})`}
      />
      <path
        d="M78 168L129 179 127 237 101 267 72 230Z"
        fill="#294c3d"
        stroke="#b2ab87"
        strokeWidth={look.stage >= 3 ? 5 : 2}
      />
      {look.stage >= 2 && <path
        d="M98 187L108 187 108 208 120 208 120 217 108 217 108 239 98 239 98 217 85 217 85 208 98 208Z"
        fill="#c5b27c"
      />}
      {plain && <path d="M78 204L125 214M76 220L119 230" stroke="#6f6247" strokeWidth="2" opacity=".6" />}
      {look.stage >= 4 && <g><path d="M242 35V172" stroke="#8c7958" strokeWidth="4" /><path d="M244 37H284L276 56 284 77H244Z" fill="#294c3d" stroke="#b2ab87" strokeWidth="2" /><path d="M259 47v20m-7-10h14" stroke="#c5b27c" strokeWidth="3" /></g>}
      {look.scholar && <g><path d="M190 137L148 240" stroke="#6c543b" strokeWidth="5" /><rect x="137" y="232" width="31" height="28" rx="3" fill="#87694b" stroke="#514733" strokeWidth="2" /><path d="M140 240h25" stroke="#c5b27c" strokeWidth="2" /></g>}
      {look.traveller && <g><rect x="197" y="263" width="42" height="16" rx="8" fill="#6f7b62" stroke="#384f3d" strokeWidth="2" /><path d="M207 263v16m20-16v16" stroke="#b5a67f" strokeWidth="2" /></g>}
      <path d="M233 166L229 292" stroke={plain ? "#927a53" : "#bbc5b8"} strokeWidth="6" />
      <path d="M214 209L248 212" stroke="#b6a16b" strokeWidth="6" />
      {!plain && <path d="M230 295L224 283 235 283Z" fill="#d1d5ca" />}
      <ellipse cx="160" cy="331" rx="80" ry="9" fill="#0c211b" opacity=".35" />
    </svg>
  );
}
