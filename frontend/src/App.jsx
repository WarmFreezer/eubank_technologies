import { useEffect, useState } from 'react'
import Logo from './Logo.jsx'
import Topo from './Topo.jsx'
import { Glitch, GlitchDefs } from './Glitch.jsx'
import { ErrorBoundary, ErrorPage } from './ErrorPage.jsx'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'

const icon = (d) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: d }} />
)

const LINKS = [
  ['/', 'Home', '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>'],
  ['/contact', 'Contact', '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'],
]

const PROJECTS = [
  {
    name: 'Stat_Line',
    tagline: 'Baseball analytics for college programs',
    text: 'Upload a TrackMan export and get branded, coach-ready reports: pitch heat maps, movement profiles, hitter spray charts, plate-discipline tables and print-ready PDFs, scoped to each school.',
    stack: 'Flask, PostgreSQL, ReportLab, Matplotlib, Stripe',
    links: [['Live site', 'https://stat-line.app'], ['GitHub', 'https://github.com/WarmFreezer/pitcher_reports']],
  },
  {
    name: 'Scaffold',
    tagline: 'Tailored resumes from one master portfolio',
    text: 'A local-first desktop app. Keep your whole career history in one portfolio on your machine, then give it a job posting and Claude scores each entry for relevance and assembles a resume from the best fits. In development.',
    stack: 'Tauri 2, Rust, React, TypeScript, Claude API',
    links: [['GitHub', 'https://github.com/WarmFreezer/scaffold']],
  },
]

function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => document.documentElement.classList.contains('collapsed'))
  const toggle = () => {
    const next = !collapsed
    document.documentElement.classList.toggle('collapsed', next)
    setCollapsed(next)
    try { localStorage.sidebar = next ? 'collapsed' : 'open' } catch (e) {}
  }
  const [light, setLight] = useState(() => document.documentElement.classList.contains('light'))
  const toggleTheme = () => {
    const next = !light
    const root = document.documentElement
    root.classList.add('theme-anim') // transitions only while switching, so hovers and the page load are unaffected
    root.classList.toggle('light', next)
    setTimeout(() => root.classList.remove('theme-anim'), 400)
    setLight(next)
    try { localStorage.theme = next ? 'light' : 'dark' } catch (e) {}
  }
  return (
    <aside>
      <NavLink className="logo" to="/"><Logo /></NavLink>
      <nav>
        {LINKS.map(([to, label, d]) => (
          <NavLink key={to} to={to} title={label}>{icon(d)}<span>{label}</span></NavLink>
        ))}
      </nav>
      <button type="button" className="theme" title="Toggle theme" aria-pressed={light} onClick={toggleTheme}>
        {icon(light
          ? '<path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>'
          : '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>')}
        <span>{light ? 'Dark mode' : 'Light mode'}</span>
      </button>
      <button type="button" aria-label="Toggle sidebar" aria-expanded={!collapsed} onClick={toggle}>
        {icon('<path d="M15 6l-6 6 6 6"/>')}<span>Collapse</span>
      </button>
    </aside>
  )
}

const Page = ({ title, heading = title, children }) => {
  useEffect(() => { document.title = `${title} | Eubank Technologies` }, [title])
  return <>{typeof heading === 'string' ? <h1>{heading}</h1> : heading}{children}</>
}

const Card = ({ name, tagline, text, stack, links }) => (
  <article className="card">
    <h3>{name}</h3>
    <p className="tagline">{tagline}</p>
    <p>{text}</p>
    <p className="stack">{stack}</p>
    <p className="links">{links.map(([t, u]) => <a key={t} href={u}>{t}</a>)}</p>
  </article>
)

const Home = () => (
  <Page title="Eubank Technologies" heading={<Glitch as="h1" className="hero-title">Eubank Technologies</Glitch>}>
    <p className="statement">
      Eubank Technologies is committed to building high quality software in a wide range of fields. From low level
      optimizations to sleek websites, we can make the solution to your problem. We emphasize doing
      things the right way - not the easy way.
    </p>
    <h2>Projects</h2>
    <div className="cards">{PROJECTS.map((p) => <Card key={p.name} {...p} />)}</div>
  </Page>
)

const Contact = () => (
  <Page title="Contact">
    <p>For inquiries, contact:</p>
    <p><strong>Thomas Eubank</strong><br />Owner / Founder</p>
    <p>
      Email: <a href="mailto:thomas@stat-line.app">thomas@stat-line.app</a><br />
      Phone: <a href="tel:+16063034052">606-303-4052</a><br />
      Portfolio: <a href="https://warmfreezer.github.io/about_me">warmfreezer.github.io/about_me</a>
    </p>
  </Page>
)

const Privacy = () => (
  <Page title="Privacy">
    <div className="prose">
      <p><em>Last updated: October 31, 2026</em></p>
      <p>
        This policy covers this website, Eubank Technologies. Our products, such as Stat_Line, are separate services
        and have their own terms and policies.
      </p>
      <h2>What we collect</h2>
      <p>
        We do not run accounts, forms, analytics or advertising on this site, and we do not use cookies. We do not ask
        you for any personal information to browse it.
      </p>
      <h2>What your browser stores</h2>
      <p>
        The site saves two preferences (whether the sidebar is collapsed, and light or dark mode) in your browser's local storage. It stays on
        your device, is never sent to us, and you can clear it at any time.
      </p>
      <h2>Third-party services</h2>
      <p>To display the site, your browser requests resources from these providers, who can see your IP address and browser details:</p>
      <ul>
        <li>Google Fonts (fonts.googleapis.com) for the site's typeface.</li>
        <li>Amazon Web Services (the public Terrain Tiles dataset on S3) for the topographic background.</li>
        <li>Our hosting provider, which may keep standard server logs such as IP address, time and page requested.</li>
      </ul>
      <p>These providers have their own privacy policies, and we do not control how they handle that data.</p>
      <h2>If you contact us</h2>
      <p>
        If you email or call us, we use the details you share only to respond to you, and we do not sell or share them.
        Ask us at any time to delete a conversation.
      </p>
      <h2>Changes and questions</h2>
      <p>
        We will update this page and its date if our practices change, for example if we add analytics or cookies.
        Questions: <a href="mailto:thomas@stat-line.app">thomas@stat-line.app</a>.
      </p>
    </div>
  </Page>
)

export default function App() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return (
    <div className="layout">
      <GlitchDefs />
      <Sidebar />
      <div className="content">
        <Topo />
        <main>
          <ErrorBoundary key={pathname}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<Navigate to="/" replace />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<ErrorPage />} />
          </Routes>
          </ErrorBoundary>
        </main>
        <footer>
          &copy; {new Date().getFullYear()} Eubank Technologies. All rights reserved.
          <span><NavLink to="/privacy">Privacy</NavLink> <NavLink to="/contact">Contact</NavLink></span>
        </footer>
      </div>
    </div>
  )
}
