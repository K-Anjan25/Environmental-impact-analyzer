export function SurrealScene() {
  return (
    <svg
      className="surreal-scene"
      viewBox="0 0 600 420"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="planet-light" cx="32%" cy="25%" r="78%">
          <stop offset="0%" stopColor="#6784f1" />
          <stop offset="68%" stopColor="#405fd1" />
          <stop offset="100%" stopColor="#293f95" />
        </radialGradient>
        <linearGradient id="shirt-cloth" x1="24" y1="9" x2="91" y2="112" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff9eb" />
          <stop offset="100%" stopColor="#e8ddff" />
        </linearGradient>
        <linearGradient id="island-cloth" x1="80" y1="284" x2="222" y2="333" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f8d2bd" />
          <stop offset="100%" stopColor="#f39b82" />
        </linearGradient>
        <pattern id="fabric-weave" width="8" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 2H8M2 0V8" stroke="#8c7cc8" strokeOpacity=".15" strokeWidth=".7" />
        </pattern>
        <clipPath id="planet-clip">
          <circle cx="365" cy="229" r="99" />
        </clipPath>
        <clipPath id="shirt-clip">
          <path d="M166 139c9-14 22-22 38-25l18 17 18-17c17 4 29 12 38 25l-19 22-13-10v76h-66v-76l-13 10-19-22Z" />
        </clipPath>
        <filter id="soft-shadow" x="-30%" y="-30%" width="170%" height="180%">
          <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#203a39" floodOpacity=".16" />
        </filter>
      </defs>

      <path
        d="M73 72C101 27 186 18 246 40c59 22 108-15 172-3 72 13 135 56 132 124-3 56 43 96 14 155-29 60-111 75-173 61-63-14-106 21-178 1-61-17-87-60-141-71-58-12-92-54-79-113 10-47 49-80 80-122Z"
        fill="#e9e5f5"
      />
      <path d="M86 307c56-37 115-28 156-5 39 22 50 55 14 71-42 19-137 16-179-4-30-14-27-42 9-62Z" fill="url(#island-cloth)" />
      <path d="M82 325c49 18 111 21 169 3" stroke="#25423d" strokeOpacity=".55" strokeWidth="1.5" fill="none" />
      <path d="M100 337c34 9 76 10 115 2" stroke="#fff5e6" strokeOpacity=".8" strokeWidth="1.5" strokeDasharray="3 6" fill="none" />

      <circle cx="454" cy="83" r="43" fill="#f27b60" />
      <circle cx="454" cy="83" r="57" fill="none" stroke="#f27b60" strokeOpacity=".24" strokeWidth="1.5" />
      <path d="M454 13v12m0 116v12m70-70h-12M396 83h-12m119-49-9 9m-80 80-9 9m99 0-9-9m-80-80-9-9" stroke="#f27b60" strokeWidth="2" strokeLinecap="round" />
      <circle cx="454" cy="83" r="10" fill="#ffd99b" />

      <ellipse cx="356" cy="236" rx="154" ry="88" transform="rotate(-21 356 236)" stroke="#284640" strokeOpacity=".58" strokeWidth="1.5" strokeDasharray="2 8" fill="none" />
      <ellipse cx="365" cy="229" rx="99" ry="99" fill="url(#planet-light)" filter="url(#soft-shadow)" />
      <g clipPath="url(#planet-clip)">
        <path d="M257 199c22-21 45-27 66-17 13 6 19 22 35 22 22 0 30-25 58-19 23 5 36 22 54 19 12-2 21-10 31-18v35c-20 17-39 23-59 16-19-7-29-22-48-19-25 4-37 27-64 26-21-1-31-17-51-13-10 2-18 8-26 15l4-47Z" fill="#cfe66b" />
        <path d="M273 264c17-12 32-13 43-3 10 10 15 27 31 29 19 3 35-15 52-11 17 3 21 20 37 21 13 1 24-6 34-14v45H266l7-67Z" fill="#5cb5a1" />
        <path d="M263 239c31 1 41 18 61 16 17-2 24-16 42-16 24 0 34 23 58 21 13-1 22-7 33-16" stroke="#f4f1dc" strokeOpacity=".72" strokeWidth="1.2" fill="none" />
        <circle cx="331" cy="202" r="4" fill="#fff8e6" fillOpacity=".85" />
        <circle cx="391" cy="183" r="2.5" fill="#fff8e6" fillOpacity=".8" />
      </g>
      <path d="M306 174c25-29 60-41 94-35" stroke="#fff7e6" strokeOpacity=".52" strokeWidth="2" strokeLinecap="round" fill="none" />

      <g filter="url(#soft-shadow)">
        <path
          d="M166 139c9-14 22-22 38-25l18 17 18-17c17 4 29 12 38 25l-19 22-13-10v76h-66v-76l-13 10-19-22 18-17Z"
          fill="url(#shirt-cloth)"
          stroke="#203f3b"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path d="M204 115c1 15 8 22 18 22s18-7 18-22" fill="#c7c8ed" stroke="#203f3b" strokeWidth="2" />
        <path d="M230 137v88" stroke="#8a7dbe" strokeOpacity=".7" strokeWidth="1.4" strokeDasharray="3 5" />
        <path d="M238 174h23v24h-23z" fill="#f48c72" stroke="#203f3b" strokeWidth="1.6" />
        <path d="M241 178h17" stroke="#fff1dc" strokeWidth="1.2" strokeDasharray="2 3" />
      </g>
      <path d="M163 160c-8 30-8 48-1 60" stroke="#fff8e9" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 5" fill="none" />
      <path d="M287 158c9 17 12 33 9 49" stroke="#fff8e9" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 5" fill="none" />
      <path d="M170 140c-8 5-14 12-18 20m144-20c8 5 14 12 18 20" stroke="#203f3b" strokeOpacity=".42" strokeWidth="1.2" fill="none" />
      <path d="M167 151c7 8 12 10 18 10m118-10c-7 8-12 10-18 10" stroke="#fff8e9" strokeWidth="1.3" strokeDasharray="2 4" fill="none" />
      <path d="M199 113c-2-8-7-12-15-14" stroke="#203f3b" strokeOpacity=".55" strokeWidth="1.2" fill="none" />

      <path d="M367 132c-10-24-3-48 17-67m-8 41c15-17 33-19 48-14m-50 1c-17-16-35-17-51-8" stroke="#24463e" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <path d="M379 97c10-18 25-26 42-21-8 16-22 23-42 21Zm-7-9c-13-16-28-21-44-14 9 15 24 20 44 14Z" fill="#bddd67" stroke="#24463e" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M375 75c-8-5-13-12-12-20 2-9 11-14 20-11 7-11 22-10 27 0 11-2 18 5 17 14-1 10-12 18-26 17l-14 10-12-10Z" fill="#fffaf0" stroke="#24463e" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="378" cy="53" r="3" fill="#f4c75e" />
      <circle cx="395" cy="48" r="2.5" fill="#f4c75e" />
      <path d="M389 66c3 4 7 6 12 5" stroke="#d7a89a" strokeWidth="1.2" strokeLinecap="round" />

      <path d="M95 267c23-16 45-18 65-6m-43-7c-2-14 4-25 17-31m-9 24c12-11 25-13 38-7" stroke="#254740" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M117 249c0-8 4-14 12-18 7 4 10 10 9 18-7 5-14 5-21 0Zm20-7c6-8 14-11 24-9-2 10-9 16-21 19" fill="#bfdc66" stroke="#254740" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M485 271c20-24 45-35 73-33" stroke="#f7f2e8" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 6" fill="none" />
      <path d="M489 260c-4-9-4-17 2-22 7-2 12 1 16 9-4 8-10 12-18 13Z" fill="#cfe66b" stroke="#24463e" strokeWidth="1.3" />
      <path d="M134 73l4 10 11 1-8 7 2 11-9-6-9 6 3-11-9-7 11-1 4-10Zm365 136 3 7 8 1-6 5 1 8-6-4-7 4 2-8-6-5 8-1 3-7Z" fill="#f4bf52" stroke="#24463e" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="89" cy="179" r="3" fill="#f27b60" />
      <circle cx="111" cy="204" r="2" fill="#5169d9" />
      <circle cx="515" cy="125" r="3" fill="#bfdc66" />
      <circle cx="76" cy="245" r="2.5" fill="#8e82c9" />

      <path d="M128 283c58-20 122 5 155 34 30 26 83 30 131 2 42-25 76-59 116-71" stroke="#203f3b" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M478 240l32-46" stroke="#203f3b" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="512" cy="191" rx="5.2" ry="9" transform="rotate(34 512 191)" fill="none" stroke="#203f3b" strokeWidth="2" />
      <path d="M509 195c-16 18-12 43 6 57" stroke="#203f3b" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function OrbitGlyph() {
  return (
    <svg
      className="orbit-glyph"
      viewBox="0 0 180 150"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="90" cy="75" rx="72" ry="32" transform="rotate(-18 90 75)" fill="none" stroke="#294640" strokeOpacity=".72" strokeWidth="1.5" strokeDasharray="2 6" />
      <circle cx="94" cy="73" r="40" fill="#4d67d2" />
      <path d="M55 73c15-16 26-12 38-4 9 7 15 6 25 1 7-4 13-4 18-1v17c-11 7-20 5-30 2-13-4-20 8-34 5-9-1-13-7-20-6l3-14Z" fill="#cfe66b" />
      <path d="M66 100c13-9 23-9 31 0 7 8 16 11 25 5 5-3 9-3 14-1l-5 10H71l-5-14Z" fill="#62b6a2" />
      <path d="M36 108c16-8 30-8 42 0 10 7 26 8 42 0 16-8 28-16 45-16" fill="none" stroke="#f27b60" strokeWidth="3" strokeLinecap="round" />
      <path d="M138 37l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1 4-8Z" fill="#f4bf52" stroke="#294640" strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="46" cy="50" r="3" fill="#f27b60" />
      <circle cx="130" cy="119" r="2" fill="#8e82c9" />
    </svg>
  );
}
