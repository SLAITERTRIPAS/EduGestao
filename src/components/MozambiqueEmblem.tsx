import React from 'react';

interface MozambiqueEmblemProps {
  className?: string;
  size?: number | string;
}

export const MozambiqueEmblem: React.FC<MozambiqueEmblemProps> = ({ 
  className = "w-16 h-16 shrink-0", 
  size 
}) => {
  const style = size ? { width: typeof size === 'number' ? `${size}px` : size, height: typeof size === 'number' ? `${size}px` : size } : undefined;

  return (
    <svg 
      viewBox="0 0 200 200" 
      className={className} 
      style={style}
      aria-label="Emblema da República de Moçambique"
      role="img"
    >
      <defs>
        {/* Sunburst Gradient */}
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
        
        {/* Sky Gradient */}
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>

        {/* Ribbon Gradient */}
        <linearGradient id="redRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ef4444" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#b91c1c" />
        </linearGradient>

        {/* Gold Border */}
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>

      {/* 1. OUTER COGWHEEL (Engrenagem Industrial) */}
      <g id="cogwheel">
        {/* Cog teeth */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i * 360) / 24;
          return (
            <rect
              key={i}
              x="96"
              y="12"
              width="8"
              height="10"
              rx="1"
              fill="url(#goldGrad)"
              transform={`rotate(${angle} 100 100)`}
            />
          );
        })}
        {/* Inner Cog Ring */}
        <circle cx="100" cy="100" r="82" fill="none" stroke="url(#goldGrad)" strokeWidth="8" />
      </g>

      {/* 2. MAIZE & SUGARCANE WREATH (Ramos de Milho e Cana de Açúcar) */}
      <g id="wreath">
        {/* Left Sugarcane stalk */}
        <path d="M 32,120 C 25,80 40,40 68,25 C 62,38 52,70 42,110 Z" fill="#22c55e" />
        <path d="M 22,100 C 18,75 30,50 50,35 C 42,50 36,75 30,105 Z" fill="#15803d" />
        {/* Right Maize stalk */}
        <path d="M 168,120 C 175,80 160,40 132,25 C 138,38 148,70 158,110 Z" fill="#22c55e" />
        <path d="M 178,100 C 182,75 170,50 150,35 C 158,50 164,75 170,105 Z" fill="#15803d" />
        {/* Corn cobs */}
        <ellipse cx="152" cy="75" rx="5" ry="12" fill="#facc15" transform="rotate(25 152 75)" />
        <ellipse cx="48" cy="75" rx="5" ry="12" fill="#facc15" transform="rotate(-25 48 75)" />
      </g>

      {/* 3. CENTRAL DISC FIELD */}
      <circle cx="100" cy="100" r="72" fill="url(#skyGrad)" />

      {/* 4. RISING SUN & RAYS */}
      <g id="sun">
        {/* Sunburst Rays */}
        {Array.from({ length: 16 }).map((_, i) => {
          const angle = (i * 360) / 16;
          return (
            <path
              key={i}
              d="M 100,100 L 96,32 L 104,32 Z"
              fill="#fde047"
              opacity="0.85"
              transform={`rotate(${angle} 100 100)`}
            />
          );
        })}
        {/* Rising Sun Disk */}
        <circle cx="100" cy="108" r="32" fill="url(#sunGlow)" />
      </g>

      {/* 5. GREEN MOUNTAIN / OCEAN TERRAIN */}
      <path d="M 28,100 Q 60,135 100,118 Q 140,102 172,100 L 172,168 L 28,168 Z" fill="#16a34a" />
      <path d="M 28,118 Q 70,142 100,132 Q 130,122 172,118 L 172,168 L 28,168 Z" fill="#15803d" />

      {/* 6. OPEN BOOK (Livro Aberto - Educação) */}
      <g id="openBook" transform="translate(100, 126)">
        {/* Left Page */}
        <path d="M 0,-4 Q -16,-18 -36,-14 L -36,10 Q -18,6 0,16 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
        {/* Right Page */}
        <path d="M 0,-4 Q 16,-18 36,-14 L 36,10 Q 18,6 0,16 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        {/* Book spine line */}
        <line x1="0" y1="-4" x2="0" y2="16" stroke="#94a3b8" strokeWidth="2" />
        {/* Text lines simulating knowledge */}
        <line x1="-28" y1="-4" x2="-8" y2="-1" stroke="#94a3b8" strokeWidth="1" />
        <line x1="-28" y1="2" x2="-8" y2="5" stroke="#94a3b8" strokeWidth="1" />
        <line x1="8" y1="-1" x2="28" y2="-4" stroke="#94a3b8" strokeWidth="1" />
        <line x1="8" y1="5" x2="28" y2="2" stroke="#94a3b8" strokeWidth="1" />
      </g>

      {/* 7. CROSSED AK-47 RIFLE & HOE (Enxada e Arma Cruzadas) */}
      <g id="crossedTools">
        {/* Hoe (Enxada) */}
        <path d="M 60,146 L 138,82" stroke="#475569" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M 132,76 L 148,70 L 142,88 Z" fill="#334155" stroke="#0f172a" strokeWidth="1" />
        
        {/* AK-47 Rifle */}
        <path d="M 140,146 L 62,82" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
        {/* Rifle Stock & Magazine */}
        <path d="M 134,142 L 146,152 L 138,156 Z" fill="#78350f" />
        <path d="M 96,110 Q 90,122 82,126" stroke="#0f172a" strokeWidth="3" fill="none" />
        {/* Bayonet Star / Sight */}
        <circle cx="62" cy="82" r="2.5" fill="#eab308" />
      </g>

      {/* 8. RED FIVE-POINTED STAR AT TOP (Estrela Vermelha) */}
      <g id="star" transform="translate(100, 26)">
        <polygon
          points="0,-16 4.8,-4.8 16,-4.8 7.2,2.4 10.4,13.6 0,7.2 -10.4,13.6 -7.2,2.4 -16,-4.8 -4.8,-4.8"
          fill="#ef4444"
          stroke="url(#goldGrad)"
          strokeWidth="1.5"
        />
      </g>

      {/* 9. RED BANNER WITH GOLD TEXT (Faixa 'REPÚBLICA DE MOÇAMBIQUE') */}
      <g id="banner">
        {/* Red Ribbon Arc */}
        <path
          d="M 20,154 C 50,188 150,188 180,154 L 168,142 C 140,172 60,172 32,142 Z"
          fill="url(#redRibbon)"
          stroke="#991b1b"
          strokeWidth="1"
        />
        {/* Left/Right Ribbon Fold Tails */}
        <path d="M 20,154 L 10,145 L 22,136 L 32,142 Z" fill="#991b1b" />
        <path d="M 180,154 L 190,145 L 178,136 L 168,142 Z" fill="#991b1b" />

        {/* Text Arc */}
        <path id="textArc" d="M 28,156 C 58,186 142,186 172,156" fill="none" />
        <text fill="#fef08a" fontSize="8.5" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.8">
          <textPath href="#textArc" startOffset="50%" textAnchor="middle">
            REPÚBLICA DE MOÇAMBIQUE
          </textPath>
        </text>
      </g>
    </svg>
  );
};

/**
 * High-resolution SVG Data URL string for the Mozambique Emblem,
 * ensuring 100% offline rendering without any white background.
 */
export const MOZAMBIQUE_EMBLEM_SVG_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="60%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#d97706" />
    </radialGradient>
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="100%" stop-color="#0284c7" />
    </linearGradient>
    <linearGradient id="redRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ef4444" />
      <stop offset="50%" stop-color="#dc2626" />
      <stop offset="100%" stop-color="#b91c1c" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#eab308" />
      <stop offset="100%" stop-color="#ca8a04" />
    </linearGradient>
  </defs>

  <g id="cogwheel">
    <circle cx="100" cy="100" r="82" fill="none" stroke="url(#goldGrad)" stroke-width="8" />
  </g>

  <g id="wreath">
    <path d="M 32,120 C 25,80 40,40 68,25 C 62,38 52,70 42,110 Z" fill="#22c55e" />
    <path d="M 22,100 C 18,75 30,50 50,35 C 42,50 36,75 30,105 Z" fill="#15803d" />
    <path d="M 168,120 C 175,80 160,40 132,25 C 138,38 148,70 158,110 Z" fill="#22c55e" />
    <path d="M 178,100 C 182,75 170,50 150,35 C 158,50 164,75 170,105 Z" fill="#15803d" />
    <ellipse cx="152" cy="75" rx="5" ry="12" fill="#facc15" transform="rotate(25 152 75)" />
    <ellipse cx="48" cy="75" rx="5" ry="12" fill="#facc15" transform="rotate(-25 48 75)" />
  </g>

  <circle cx="100" cy="100" r="72" fill="url(#skyGrad)" />

  <g id="sun">
    <circle cx="100" cy="108" r="32" fill="url(#sunGlow)" />
  </g>

  <path d="M 28,100 Q 60,135 100,118 Q 140,102 172,100 L 172,168 L 28,168 Z" fill="#16a34a" />

  <g id="openBook" transform="translate(100, 126)">
    <path d="M 0,-4 Q -16,-18 -36,-14 L -36,10 Q -18,6 0,16 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
    <path d="M 0,-4 Q 16,-18 36,-14 L 36,10 Q 18,6 0,16 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" />
    <line x1="0" y1="-4" x2="0" y2="16" stroke="#94a3b8" stroke-width="2" />
  </g>

  <g id="crossedTools">
    <path d="M 60,146 L 138,82" stroke="#475569" stroke-width="4.5" stroke-linecap="round" />
    <path d="M 132,76 L 148,70 L 142,88 Z" fill="#334155" stroke="#0f172a" stroke-width="1" />
    <path d="M 140,146 L 62,82" stroke="#1e293b" stroke-width="4" stroke-linecap="round" />
  </g>

  <g id="star" transform="translate(100, 26)">
    <polygon points="0,-16 4.8,-4.8 16,-4.8 7.2,2.4 10.4,13.6 0,7.2 -10.4,13.6 -7.2,2.4 -16,-4.8 -4.8,-4.8" fill="#ef4444" stroke="url(#goldGrad)" stroke-width="1.5" />
  </g>

  <g id="banner">
    <path d="M 20,154 C 50,188 150,188 180,154 L 168,142 C 140,172 60,172 32,142 Z" fill="url(#redRibbon)" stroke="#991b1b" stroke-width="1" />
    <path id="textArc" d="M 28,156 C 58,186 142,186 172,156" fill="none" />
    <text fill="#fef08a" font-size="8.5" font-weight="900" font-family="sans-serif">
      <textPath href="#textArc" start-offset="50%" text-anchor="middle">
        REPÚBLICA DE MOÇAMBIQUE
      </textPath>
    </text>
  </g>
</svg>
`)}`;
