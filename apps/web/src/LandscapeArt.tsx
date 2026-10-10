export function LandscapeScene() {
  return (
    <svg
      className="landscape-scene"
      viewBox="0 0 600 380"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id="landscape-art-mask">
          <rect width="600" height="380" rx="28" />
        </clipPath>
      </defs>
      <g clipPath="url(#landscape-art-mask)">
        <rect width="600" height="380" fill="#c9e3d9" />
        <circle cx="467" cy="103" r="66" fill="#f2b45c" />
        <path d="M32 92c7-15 27-19 40-8 3-16 26-25 42-11 10-12 33-11 42 4 17-1 29 8 31 22H32Z" fill="#fff1d1" />
        <path d="M417 61c7-10 21-11 29-3 5-13 24-15 31-2 10-7 24-2 26 10h20v8H414c-2-5-1-9 3-13Z" fill="#fff5df" />

        <path d="m0 254 75-91 46 48 108-128 96 116 91-81 112 106 72-59v133H0Z" fill="#72aaa4" />
        <path d="m0 276 105-88 58 59 70-102 63 77 92-91 61 69 71-59 80 65v103H0Z" fill="#438b8c" />
        <path d="m202 145 27-62 27 35-20-9-12 16-10-9-12 29Zm157-22 24-29 23 28-17-9-9 12-8-8-13 6Z" fill="#f2edd9" />
        <path d="m0 276 94-42 68 26 85-50 62 39 80-45 89 43 68-21 54 24v73H0Z" fill="#286c70" />

        <path d="M0 253c67 9 106 5 157 17 53 12 104 8 151-1 62-12 108 1 156-9 47-10 89-8 136 1v72H0Z" fill="#a7d7bd" />
        <path d="M0 281c70-13 126-3 177 10 49 13 97 7 146-2 52-9 101-7 143 5 45 13 86 11 134 1v85H0Z" fill="#79b77b" />
        <path d="M326 250c-33 15-66 25-65 38 2 15 63 14 74 27 13 16-39 23-76 33-26 7-39 18-31 32h372v-118c-76 13-135 7-187-4-33-7-61-13-87-8Z" fill="#69bdb2" />
        <path d="M300 265c-23 11-39 20-38 28 1 9 39 12 55 18 9 3 15 6 17 10-29-7-77-9-90-22-15-15 19-27 56-34Z" fill="#d5eadb" />

        <path d="M0 314c54-11 98-4 145 9 57 16 94 10 145-2 63-14 111-7 159 8 50 15 101 7 151-3v54H0Z" fill="#397f5c" />
        <path d="M0 345c61-12 115 0 159 14 50 17 92 12 139 0 57-15 102-11 152 4 51 15 96 8 150-4v21H0Z" fill="#194f46" />

        <g fill="#174e49">
          <path d="m39 298 22-50 22 50H68v29H54v-29H39Zm44 14 15-34 15 34h-11v20H94v-20H83Zm444-4 20-46 20 46h-14v27h-13v-27h-13Zm-38 12 14-32 14 32h-10v19h-9v-19h-9Z" />
        </g>
        <g fill="#23634e">
          <path d="m145 311 17-39 17 39h-12v22h-10v-22h-12Zm335-4 15-35 15 35h-11v22h-9v-22h-10Z" />
        </g>
        <path d="M15 343c36-7 63-3 91 7m393-1c32 8 62 8 91 0" fill="none" stroke="#d9e7bb" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function LandscapeGlyph() {
  return (
    <svg
      className="landscape-glyph"
      viewBox="0 0 180 150"
      aria-hidden="true"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="180" height="150" rx="22" fill="#d6ece1" />
      <circle cx="132" cy="39" r="21" fill="#efb35e" />
      <path d="m0 94 34-40 21 24 31-45 36 43 20-22 38 39v39H0Z" fill="#68a7a0" />
      <path d="m49 65 17-23 17 23-11-6-7 8-6-6-10 4Z" fill="#f5efdc" />
      <path d="m0 101 42-24 28 19 32-20 35 20 24-14 19 14v30H0Z" fill="#387d6b" />
      <path d="M0 111c28-7 50-1 70 4 22 6 39 2 58-2 20-4 36 0 52 4v33H0Z" fill="#82bd79" />
      <path d="M94 99c-15 8-23 13-18 18 6 5 28 4 32 9 3 4-8 10-25 15h97v-43c-29 5-52 1-69-2-7-1-12-1-17 3Z" fill="#67bdb3" />
      <path d="M0 130c20-4 35 0 51 5 18 6 31 5 48 0 21-6 39-2 55 2 9 3 18 3 26 0v13H0Z" fill="#1f5d4c" />
    </svg>
  );
}
