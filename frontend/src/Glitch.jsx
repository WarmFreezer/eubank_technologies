// Hover glitch for any text: <Glitch as="h1">404</Glitch>. `children` must be a plain string
// (it is mirrored into the coral/teal layers). Render <GlitchDefs /> once per page for the warp filter.
export function Glitch({ as: Tag = 'span', className = '', children }) {
  return <Tag className={`glitch ${className}`} data-text={children}>{children}</Tag>
}

export function GlitchDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <filter id="warp" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.03" numOctaves="2" seed="3" result="n">
          <animate attributeName="baseFrequency" values="0.008 0.03;0.012 0.04;0.008 0.03" dur="5s" repeatCount="indefinite" />
        </feTurbulence>
        <feDisplacementMap in="SourceGraphic" in2="n" scale="6" />
      </filter>
      <filter id="warp-soft" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.03" numOctaves="2" seed="3" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="2" />
      </filter>
    </svg>
  )
}
