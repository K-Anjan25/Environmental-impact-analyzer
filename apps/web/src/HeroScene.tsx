/**
 * Original hero illustration for the environmental impact analyzer.
 * Decorative only (aria-hidden); it does not encode any impact magnitude.
 * Palette: deep blue sky, teal water and forest, coral accent.
 */
export function HeroScene() {
  return (
    <svg
      className="hero-scene"
      viewBox="0 0 700 525"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1e2fb8" />
          <stop offset="0.6" stopColor="#3556e0" />
          <stop offset="1" stopColor="#6fa2f0" />
        </linearGradient>
        <linearGradient id="hero-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1ea7c8" />
          <stop offset="1" stopColor="#0a6fb8" />
        </linearGradient>
        <linearGradient id="hero-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e9f6f5" />
        </linearGradient>
        <clipPath id="hero-scene-mask">
          <rect width="700" height="525" rx="28" />
        </clipPath>
      </defs>

      <g clipPath="url(#hero-scene-mask)">
        {/* sky and sun */}
        <rect width="700" height="525" fill="url(#hero-sky)" />
        <circle cx="520" cy="150" r="58" fill="#ffd58a" opacity="0.9" />
        <circle cx="520" cy="150" r="88" fill="#ffd58a" opacity="0.12" />
        <path d="M0 110c40-20 80-18 120 0s80 18 120 0 80-18 120 0V0H0Z" fill="#ffffff" opacity="0.14" />
        <path d="M60 205c30-22 70-24 100-6 18-12 46-10 60 8H50Z" fill="#ffffff" opacity="0.35" />
        <path d="M400 215c26-18 62-18 82 2 14-10 38-8 48 6H392Z" fill="#ffffff" opacity="0.3" />

        {/* far mountains */}
        <path d="M0 290 90 215l60 40 90-75 95 85 70-50 100 70 85-40v55H0Z" fill="#5c7ef0" />
        <path d="M0 300 120 240l70 32 80-45 80 52 60-28 110 60 80-22v37H0Z" fill="#2f5fcf" />

        {/* sea */}
        <rect x="0" y="300" width="700" height="225" fill="url(#hero-sea)" />
        <path d="M0 340c60-10 110 6 170 0s110 8 170 0 110 8 170 0 80 6 120 0" fill="none" stroke="#9fe6f2" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
        <path d="M30 380c70-9 120 5 190 0s120 9 190 0 120 7 260 0" fill="none" stroke="#9fe6f2" strokeOpacity="0.4" strokeWidth="2" strokeLinecap="round" />
        <path d="M300 430c60-8 110 6 170 0s90 6 130 0" fill="none" stroke="#cdf4fa" strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />

        {/* teal headland with a lookout figure */}
        <path d="M0 360c40-30 100-40 150-20 40 16 60 60 40 100-20 40-60 70-100 80-30 6-60 0-90-10Z" fill="#1d6f7c" />
        <path d="M0 395c40-18 90-22 130-6 30 12 40 40 20 66-18 24-50 40-80 44H0Z" fill="#124f5c" />
        <path d="M120 332h8l3 14 4-2-1 16h-14v-16l-3-6Z" fill="#f2a23b" />
        <circle cx="124" cy="324" r="5" fill="#f2a23b" />

        {/* right-side cliffs */}
        <path d="M430 330c20-70 70-120 120-150 30 30 60 90 110 120l40 60v65H400c10-30 20-60 30-95Z" fill="#40569e" />
        <path d="M470 330c30-50 70-90 105-110 30 30 50 70 80 96l-20 40-80-10-70 6Z" fill="#7fa0e8" />
        <path d="M580 230c20-18 45-30 70-28v118h-60c-4-30-6-60-10-90Z" fill="#2b3f8f" opacity="0.7" />

        {/* sailboat (original shapes) */}
        <path d="M352 352h176l-22 36H372Z" fill="#e0475f" />
        <rect x="438" y="240" width="6" height="112" fill="#f4f7ff" />
        <path d="M442 248c-40 30-52 70-50 104h50Z" fill="#ffffff" />
        <path d="M450 262c28 30 40 60 42 92h-42Z" fill="#dfe9ff" />
        <path d="M380 290 332 352h40Z" fill="#ffffff" opacity="0.9" />

        {/* foreground pines */}
        <g fill="#0c5d58">
          <path d="M40 470 70 340 100 470Z" />
          <path d="M15 490 35 390 55 490Z" />
          <path d="M600 480 628 350 656 480Z" />
          <path d="M650 500 668 410 686 500Z" />
        </g>
        <g fill="#17a08a">
          <path d="M40 448 70 300 100 448Z" />
          <path d="M600 458 628 320 656 458Z" />
        </g>
        <path d="M0 480c120-22 230-10 330 6 110 18 220-6 370-22v61H0Z" fill="#0b4d52" />

        {/* wind turbines on the headland (abstract, no data) */}
        <g stroke="#f5f7ff" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M268 220v-66" />
          <path d="M268 154l-3-44M268 154l-38 22M268 154l38 22" />
        </g>
        <circle cx="268" cy="154" r="4" fill="#f5f7ff" />
        <g stroke="#f5f7ff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.85">
          <path d="M300 230v-52" />
          <path d="M300 178l-2-30M300 178l-26 15M300 178l26 15" />
        </g>
        <circle cx="300" cy="178" r="3" fill="#f5f7ff" />
      </g>

      {/* analysis card (decorative data-style motif, not real values) */}
      <g transform="translate(40 370)">
        <rect width="150" height="96" rx="14" fill="url(#hero-card)" opacity="0.96" />
        <rect x="14" y="16" width="56" height="6" rx="3" fill="#2c46d8" />
        <rect x="14" y="30" width="34" height="5" rx="2.5" fill="#9bb0d6" />
        <rect x="14" y="60" width="16" height="22" rx="3" fill="#1ea7a0" />
        <rect x="38" y="48" width="16" height="34" rx="3" fill="#1ea7a0" opacity="0.7" />
        <rect x="62" y="56" width="16" height="26" rx="3" fill="#1ea7a0" opacity="0.5" />
        <rect x="86" y="40" width="16" height="42" rx="3" fill="#e0475f" />
        <rect x="110" y="54" width="16" height="28" rx="3" fill="#1ea7a0" opacity="0.8" />
      </g>
    </svg>
  );
}
