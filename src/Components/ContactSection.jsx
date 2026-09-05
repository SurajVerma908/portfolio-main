/* eslint-disable react/prop-types */
import { ArrowUpRight, Mail, MapPin, Phone } from 'lucide-react'

function ContactSection({ site, contact, setContact, contactStatus, setContactStatus }) {
  const submit = async (event) => {
    event.preventDefault()
    setContactStatus('Sending...')
    const response = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contact),
    })
    setContactStatus(response.ok ? 'Message received. Thank you.' : 'Please check your details.')
    if (response.ok) setContact({ name: '', email: '', phone: '', subject: '', message: '' })
  }

  const mapLocation = site.address || site.location || 'Dhoen'

  return <section className="contact-reference-card" id="contact-card">
    <div className="contact-reference-form">
      <p className="eyebrow">GET IN TOUCH</p>
      <h2>Let&apos;s talk.</h2>
      <p className="contact-reference-copy">Have a question, partnership idea, or project in mind? Send a message directly.</p>
      <form onSubmit={submit}>
        <div className="contact-field-row"><label>Full name<input placeholder="Example: John Doe" value={contact.name} onChange={(event) => setContact({ ...contact, name: event.target.value })} required /></label><label>Email address<input type="email" placeholder="john@example.com" value={contact.email} onChange={(event) => setContact({ ...contact, email: event.target.value })} required /></label></div>
        <label>Mobile no.<input placeholder="98********" value={contact.phone} onChange={(event) => setContact({ ...contact, phone: event.target.value })} /></label>
        <label>Subject<input placeholder="What is this regarding?" value={contact.subject} onChange={(event) => setContact({ ...contact, subject: event.target.value })} /></label>
        <label>Your message<textarea placeholder="Write your message here..." value={contact.message} onChange={(event) => setContact({ ...contact, message: event.target.value })} required /></label>
        <button className="contact-submit" type="submit">Send message <ArrowUpRight size={17} /></button>
        {contactStatus && <small>{contactStatus}</small>}
      </form>
    </div>
    <aside className="contact-reference-info">
      <div className="map-frame"><iframe title={`${mapLocation} location map`} src={`https://www.google.com/maps?q=${encodeURIComponent(mapLocation)}&output=embed`} loading="lazy" /></div>
      <a className="map-button" href={site.mapUrl} target="_blank" rel="noreferrer">Open in Maps <ArrowUpRight size={16} /></a>
      <div className="contact-detail"><span><MapPin size={19} /></span><div><strong>Office</strong><p>{site.officeName || site.location}</p><p>{site.address}</p></div></div>
      <div className="contact-detail"><span><Phone size={19} /></span><div><strong>Contact</strong><p>{site.email}</p></div></div>
      <div className="contact-detail"><span><Mail size={19} /></span><div><strong>Website</strong><a href={site.websiteUrl} target="_blank" rel="noreferrer">Official contact page</a></div></div>
    </aside>
  </section>
}

export default ContactSection
