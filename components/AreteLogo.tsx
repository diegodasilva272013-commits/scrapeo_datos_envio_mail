// AreteLogo — SVG inline React
// Colores sólidos: Navy #0A1C35 | Azul #3D72E0
// Sin JPEG, sin PNG, sin artefactos. Infinitamente nítido.

interface AreteLogoProps {
  size?: number
  variant?: 'icon' | 'full'
  className?: string
  theme?: 'dark' | 'light'
}

export function AreteLogo({ size = 40, variant = 'icon', className = '', theme = 'dark' }: AreteLogoProps) {
  const textColor = theme === 'dark' ? '#FFFFFF' : '#0A1C35'
  const subtitleColor = theme === 'dark' ? 'rgba(255,255,255,0.55)' : '#4A6080'

  if (variant === 'icon') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <Symbol />
      </svg>
    )
  }

  return (
    <svg width={size * 1.1} height={size * 1.6} viewBox="0 0 110 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <g transform="translate(5,0)">
        <Symbol />
      </g>
      <text x="55" y="120" fontFamily="'Helvetica Neue','Arial Black',Arial,sans-serif" fontSize="22" fontWeight="800" fill={textColor} textAnchor="middle" letterSpacing="-0.5">Areté</text>
      <text x="55" y="138" fontFamily="'Helvetica Neue',Arial,sans-serif" fontSize="10" fontWeight="600" fill={subtitleColor} textAnchor="middle" letterSpacing="3">SOLUCIONES</text>
    </svg>
  )
}

function Symbol() {
  const NAVY = '#0A1C35'
  const BLUE = '#3D72E0'
  const sn = 13   // stroke navy
  const sb = 9    // stroke azul

  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* ── NAVY: forma completa de la A ── */}
      {/* Pata izquierda: pico → abajo-izq */}
      <path d="M50 10 C45 10,36 14,30 23 L10 62 C5 72,5 80,12 88 C17 94,26 97,34 94 C40 91,44 86,47 79 L50 72" stroke={NAVY} strokeWidth={sn}/>
      {/* Ranura interior de la A */}
      <path d="M50 72 L44 62 C40 56,40 48,45 42 L50 35 L55 42 C60 48,60 56,56 62 L50 72" stroke={NAVY} strokeWidth={sn}/>
      {/* Pata derecha: pico → abajo-der */}
      <path d="M50 72 L53 79 C56 86,60 91,66 94 C74 97,83 94,88 88 C95 80,95 72,90 62 L70 23 C64 14,55 10,50 10" stroke={NAVY} strokeWidth={sn}/>
      {/* Bucle izquierdo en la base */}
      <path d="M34 94 C24 96,14 90,10 80 C6 70,12 60,20 56 L32 52 C38 50,44 54,47 60 L50 72" stroke={NAVY} strokeWidth={sn}/>
      {/* Bucle derecho en la base */}
      <path d="M66 94 C76 96,86 90,90 80 C94 70,88 60,80 56 L68 52 C62 50,56 54,53 60 L50 72" stroke={NAVY} strokeWidth={sn}/>

      {/* ── AZUL: cara frontal/interna (encima del navy) ── */}
      {/* Interior de la pata derecha */}
      <path d="M50 10 C54 10,62 14,67 22 L87 60 C92 70,92 78,85 86 C80 92,72 95,65 92 C59 89,55 84,52 77 L50 72" stroke={BLUE} strokeWidth={sb}/>
      {/* Interior del bucle derecho */}
      <path d="M65 92 C73 95,82 90,86 80 C90 70,84 61,77 57 L67 53 C61 51,56 55,53 61 L50 72" stroke={BLUE} strokeWidth={sb}/>
      {/* Acento azul en el cruce central */}
      <path d="M47 60 C48 64,49 68,50 72 C51 75,52 78,53 80" stroke={BLUE} strokeWidth={sb}/>
    </g>
  )
}
