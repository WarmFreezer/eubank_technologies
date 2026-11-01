import { useState } from 'react'
import { AsciiReveal, AsciiSkeleton } from 'ascii-reveal'

// Use instead of <img>: ASCII skeleton until the image loads, then it decodes into place.
export default function Img({ className = '', alt = '', ...props }) {
  const [loaded, setLoaded] = useState(false)
  return (
    <AsciiReveal as="span" loading={!loaded} revealOnMount={false} className={`img-wrap ${loaded ? 'loaded' : ''} ${className}`}>
      {!loaded && <AsciiSkeleton rows={8} width="100%" height="14rem" />}
      <img
        alt={alt}
        loading="lazy"
        {...props}
        ref={(el) => el?.complete && el.naturalWidth && setLoaded(true)}
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
      />
    </AsciiReveal>
  )
}
