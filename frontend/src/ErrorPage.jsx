import { Component, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Glitch } from './Glitch.jsx'

// General error screen; the code glitches on hover (see Glitch.jsx).
export function ErrorPage({ code = '404', title = 'Page not found', message = "That page doesn't exist or has moved." }) {
  useEffect(() => { document.title = `${code} | Eubank Technologies` }, [code])
  return (
    <section className="error-page">
      <Glitch as="h1" className="error-code">{code}</Glitch>
      <h2>{title}</h2>
      <p>{message}</p>
      <p><Link to="/">Back to home</Link></p>
    </section>
  )
}

// Catches render errors anywhere below it; remount with a new `key` (the pathname) to reset.
export class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.error(error) }
  render() {
    return this.state.failed
      ? <ErrorPage code="500" title="Something went wrong" message="An unexpected error occurred. Please try again." />
      : this.props.children
  }
}
