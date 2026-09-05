import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, BriefcaseBusiness, Code2, FolderKanban, Github, Image, LogIn, Mail, Menu, Sparkles, Wrench, X } from 'lucide-react'
import { motion } from 'framer-motion'
import fallbackContent from '../../content.json'
import AdminEditor from './AdminEditor'
import AdminLogin from './AdminLogin'
import ContactSection from './ContactSection'

const navItems = [
  { id: 'home', label: 'Home', icon: Sparkles },
  { id: 'ventures', label: 'Ventures', icon: FolderKanban },
  { id: 'journey', label: 'Journey', icon: BriefcaseBusiness },
  { id: 'toolkit', label: 'Toolkit', icon: Wrench },
  { id: 'gallery', label: 'Gallery', icon: Image },
  { id: 'contact', label: 'Contact', icon: Mail },
]

function PortfolioCard() {
  const [content, setContent] = useState(fallbackContent)
  const [active, setActive] = useState('home')
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [apiOnline, setApiOnline] = useState(false)
  const [theme, setTheme] = useState('day')
  const [authToken, setAuthToken] = useState(() => sessionStorage.getItem('adminToken') || localStorage.getItem('adminToken'))
  const [authUser, setAuthUser] = useState(() => { try { return JSON.parse(sessionStorage.getItem('adminUser') || localStorage.getItem('adminUser') || 'null') } catch { return null } })
  const [rememberedLogin, setRememberedLogin] = useState(() => Boolean(localStorage.getItem('adminToken')))
  const [contact, setContact] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [contactStatus, setContactStatus] = useState('')
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useEffect(() => {
    setIsAdmin(new URLSearchParams(window.location.search).get('admin') === '1')
    fetch('/api/content')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('API unavailable')))
      .then((data) => { setContent(data); setApiOnline(true) })
      .catch(() => setApiOnline(false))
    if (!sessionStorage.getItem('visitorTracked')) {
      fetch('/api/visit', { method: 'POST' }).then(() => sessionStorage.setItem('visitorTracked', '1')).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (!isAdmin || !authToken) return undefined
    let timer
    const logout = () => {
      fetch('/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${authToken}` }, keepalive: true }).catch(() => {})
      sessionStorage.removeItem('adminToken')
      sessionStorage.removeItem('adminUser')
      localStorage.removeItem('adminToken')
      localStorage.removeItem('adminUser')
      window.location.href = '/?admin=1'
    }
    const resetTimer = () => { clearTimeout(timer); timer = setTimeout(logout, 30 * 60 * 1000) }
    const events = ['click', 'keydown', 'mousemove', 'scroll']
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }))
    if (rememberedLogin) return undefined
    window.addEventListener('beforeunload', logout)
    resetTimer()
    return () => { clearTimeout(timer); events.forEach((event) => window.removeEventListener(event, resetTimer)); window.removeEventListener('beforeunload', logout) }
  }, [isAdmin, authToken, rememberedLogin])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setActive(id)
    setMenuOpen(false)
  }

  if (isAdmin && (!authToken || !authUser)) return <AdminLogin onLogin={({ token, user }, remember) => { const storage = remember ? localStorage : sessionStorage; const otherStorage = remember ? sessionStorage : localStorage; otherStorage.removeItem('adminToken'); otherStorage.removeItem('adminUser'); storage.setItem('adminToken', token); storage.setItem('adminUser', JSON.stringify(user)); setAuthToken(token); setAuthUser(user); setRememberedLogin(remember) }} />
  if (isAdmin) return <AdminEditor content={content} setContent={setContent} apiOnline={apiOnline} authToken={authToken} authUser={authUser} onLogout={() => { sessionStorage.removeItem('adminToken'); sessionStorage.removeItem('adminUser'); localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser'); setAuthToken(null); setAuthUser(null); setRememberedLogin(false) }} />

  const { site, ventures, experience, tools, gallery = [], galleryAlbums = [] } = content
  const galleryPhotos = gallery.filter((item) => item.image)
  const hasGallery = galleryPhotos.length > 0
  const visibleNavItems = hasGallery ? navItems : navItems.filter((item) => item.id !== 'gallery')
  const albumsWithPhotos = galleryAlbums.map((album) => ({ ...album, photos: galleryPhotos.filter((item) => item.albumId === album.id) })).filter((album) => album.photos.length)
  const ungroupedGalleryPhotos = galleryPhotos.filter((item) => !item.albumId)
  return (
    <main className="portfolio-shell" data-theme={theme}>
      <div className="ambient ambient-orange" />
      <div className="ambient ambient-lime" />
      <header className="topbar">
        <button className="brand" onClick={() => scrollTo('home')}><span>SD</span><b>{site.shortName}</b></button>
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X /> : <Menu />}</button>
        <nav className={`nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          {visibleNavItems.map(({ id, label, icon: Icon }) => <button className={active === id ? 'active' : ''} key={id} onClick={() => scrollTo(id)}><Icon size={15} />{label}</button>)}
        </nav>
        <div className="header-actions">
          <label className="theme-select-label" htmlFor="theme-select">Mode</label>
          <select id="theme-select" className="theme-select" value={theme} onChange={(event) => setTheme(event.target.value)} aria-label="Choose color mode">
            <option value="day">Day</option>
            <option value="night">Night</option>
            <option value="crimson">Blood Red</option>
            <option value="gold">24K Gold</option>
          </select>
          <a className="login-link" href="/?admin=1" aria-label="Open admin login" title="Admin login"><LogIn size={17} /></a>
          <a className="contact-link" href="#contact-card"><Mail size={16} /> Contact</a>
        </div>
      </header>

      <div className="page-grid">
        <aside className="profile-panel">
          <div className="portrait-wrap"><img src={site.image} alt={site.name} /><span className="portrait-badge">{site.role}</span></div>
          <p className="eyebrow">BUILDING WHAT MATTERS <span /></p>
          <h2>{site.name.split(' ').slice(0, 2).join(' ')}<br /><em>{site.name.split(' ').slice(2).join(' ')}.</em></h2>
          <p className="profile-copy">{site.bio}</p>
          <div className="profile-footer"><span>Founder / Builder</span><span className="status-dot" /><span>{site.location}</span></div>
        </aside>

        <div className="content-column">
          <section className="hero-section" id="home">
            <p className="eyebrow reveal">{site.eyebrow}</p>
            <h1 className="hero-title reveal">{site.heroTitle.split(' ').slice(0, -1).join(' ')}<br /><span>{site.heroTitle.split(' ').at(-1)}</span></h1>
            <div className="hero-bottom reveal"><p>{site.heroDescription}</p><button className="circle-action" onClick={() => scrollTo('ventures')} aria-label="Explore ventures"><ArrowUpRight /></button></div>
            <div className="hero-line"><span>SCROLL TO EXPLORE</span><span className="line" /></div>
          </section>

          <section className="stats-row"><div><strong>{String(ventures.length).padStart(2, '0')}<span>+</span></strong><small>ACTIVE<br />VENTURES</small></div><div><strong>{String(experience.length).padStart(2, '0')}<span>+</span></strong><small>CAREER<br />CHAPTERS</small></div><div><strong>∞</strong><small>ROOM TO<br />GROW</small></div></section>

          <section className="section-block" id="ventures"><div className="section-heading"><p className="eyebrow">WHERE VISION BECOMES REAL</p><h2>Our <i>ventures.</i></h2></div><div className="venture-list">{ventures.map((venture) => <motion.article className={`venture-card ${venture.color}`} key={venture.number} whileHover={{ y: -7 }}><div className="venture-image"><img src={venture.image} alt={venture.title} /><span>{venture.number}</span></div><div className="venture-info"><p className="eyebrow">{venture.type}</p><h3>{venture.title}</h3><p>{venture.text}</p><button aria-label={`Explore ${venture.title}`}><ArrowUpRight size={18} /></button></div></motion.article>)}</div></section>

          <section className="section-block" id="journey"><div className="section-heading"><p className="eyebrow">THE ROAD SO FAR</p><h2>Work <i>experience.</i></h2></div><div className="journey-list">{experience.map((item) => <article className="journey-item" key={`${item.year}-${item.role}`}><span className="journey-year">{item.year}</span><div><h3>{item.role}</h3><p className="journey-company">{item.company}</p><p>{item.text}</p></div><ArrowUpRight size={19} /></article>)}</div></section>

          <section className="section-block" id="toolkit"><div className="section-heading"><p className="eyebrow">HOW WE BUILD</p><h2>The <i>toolkit.</i></h2></div><div className="tool-grid">{tools.map((tool, index) => <motion.div className="tool-item" key={tool} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * .05 }}><Code2 size={17} /><span>{tool}</span><small>CAPABILITY {String(index + 1).padStart(2, '0')}</small></motion.div>)}</div></section>

          {hasGallery && <section className="section-block gallery-section" id="gallery"><div className="section-heading"><p className="eyebrow">A VISUAL ARCHIVE</p><h2>Inside the <i>work.</i></h2></div>{albumsWithPhotos.map((album) => <div className="gallery-album" key={album.id}><h3>{album.title}</h3>{album.description && <p>{album.description}</p>}<div className="gallery-grid">{album.photos.map((item) => <motion.button className="gallery-card" key={item.id} whileHover={{ y: -6 }} onClick={() => setLightboxIndex(galleryPhotos.indexOf(item))}><img src={item.image} alt={item.title || album.title} /><span className="gallery-card-caption">{item.category && <small>{item.category}</small>}{item.title && <strong>{item.title}</strong>}</span></motion.button>)}</div></div>)}{ungroupedGalleryPhotos.length > 0 && <div className="gallery-album"><h3>{albumsWithPhotos.length ? 'More from the archive' : 'Gallery'}</h3><div className="gallery-grid">{ungroupedGalleryPhotos.map((item) => <motion.button className="gallery-card" key={item.id} whileHover={{ y: -6 }} onClick={() => setLightboxIndex(galleryPhotos.indexOf(item))}><img src={item.image} alt={item.title || 'Gallery photo'} /><span className="gallery-card-caption">{item.category && <small>{item.category}</small>}{item.title && <strong>{item.title}</strong>}</span></motion.button>)}</div></div>}</section>}

          <footer className="closing-block" id="contact"><p className="eyebrow">CONTACT / START A CONVERSATION</p><h2>Big ideas.<br /><i>Real impact.</i></h2><p className="contact-intro">Have a question, partnership idea, or project in mind? Send a message directly.</p><form className="contact-form" onSubmit={async (event) => { event.preventDefault(); setContactStatus('Sending...'); const response = await fetch('/api/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(contact) }); setContactStatus(response.ok ? 'Message received. Thank you.' : 'Please check your details.'); if (response.ok) setContact({ name: '', email: '', message: '' }) }}><input aria-label="Your name" placeholder="Your name" value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} required /><input aria-label="Your email" type="email" placeholder="Your email" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} required /><textarea aria-label="Your message" placeholder="Tell me what you are building..." value={contact.message} onChange={(event) => setContact({ ...contact, message: event.target.value })} required /><button className="primary-action" type="submit">Send message <ArrowUpRight size={18} /></button>{contactStatus && <small>{contactStatus}</small>}</form><div className="location-card"><div><p className="eyebrow">OFFICE / CURRENT BASE</p><h3>{site.officeName || site.location}</h3><p>{site.address}</p><a className="office-website" href={site.websiteUrl} target="_blank" rel="noreferrer">{site.websiteUrl}</a></div><div className="location-actions"><a href={site.mapUrl} target="_blank" rel="noreferrer" className="primary-action">Open map <ArrowUpRight size={18} /></a><a href={site.websiteUrl} target="_blank" rel="noreferrer" className="social-link">Office website <ArrowUpRight size={16} /></a></div></div><div className="footer-actions"><a className="social-link" href="https://github.com" target="_blank" rel="noreferrer"><Github size={17} /> Follow the work</a></div><p className="copyright">© 2024 {site.name} — Trikabi Academy & Info Tech Solution.</p></footer>
        </div>
        <ContactSection site={site} contact={contact} setContact={setContact} contactStatus={contactStatus} setContactStatus={setContactStatus} />
      </div>
      {lightboxIndex !== null && gallery.filter((item) => item.image).length > 0 && <div className="lightbox" role="dialog" aria-modal="true" onClick={() => setLightboxIndex(null)}><button className="lightbox-close" onClick={() => setLightboxIndex(null)} aria-label="Close gallery"><X /></button><button className="lightbox-arrow previous" onClick={(event) => { event.stopPropagation(); const count = gallery.filter((item) => item.image).length; setLightboxIndex((lightboxIndex - 1 + count) % count) }} aria-label="Previous image"><ArrowLeft /></button><div className="lightbox-content" onClick={(event) => event.stopPropagation()}><img src={gallery.filter((item) => item.image)[lightboxIndex].image} alt={gallery.filter((item) => item.image)[lightboxIndex].title} /><p>{gallery.filter((item) => item.image)[lightboxIndex].title}</p><small>{lightboxIndex + 1} / {gallery.filter((item) => item.image).length}</small></div><button className="lightbox-arrow next" onClick={(event) => { event.stopPropagation(); const count = gallery.filter((item) => item.image).length; setLightboxIndex((lightboxIndex + 1) % count) }} aria-label="Next image"><ArrowRight /></button></div>}
    </main>
  )
}

export default PortfolioCard
