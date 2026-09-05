/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { ArrowLeft, LayoutDashboard, LogOut, Mail, Plus, Save, Settings, Trash2, UserRoundCog } from 'lucide-react'

const emptyExperience = { year: '', role: '', company: '', text: '' }
const emptyGalleryItem = { id: '', title: '', category: '', image: '', albumId: '' }

function AdminEditor({ content, setContent, apiOnline, authToken, authUser, onLogout }) {
  const [status, setStatus] = useState('')
  const [newTool, setNewTool] = useState('')
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumDescription, setNewAlbumDescription] = useState('')
  const [activeAlbumId, setActiveAlbumId] = useState('')
  const [adminData, setAdminData] = useState({ visitors: { count: 0 }, messages: [] })
  const [activePanel, setActivePanel] = useState('dashboard')
  const [users, setUsers] = useState([])
  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'staff' })
  const updateSite = (field, value) => setContent((current) => ({ ...current, site: { ...current.site, [field]: value } }))
  const updateExperience = (index, field, value) => setContent((current) => ({ ...current, experience: current.experience.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }))
  const addExperience = () => setContent((current) => ({ ...current, experience: [...current.experience, { ...emptyExperience, year: 'NEW ROLE' }] }))
  const removeExperience = (index) => setContent((current) => ({ ...current, experience: current.experience.filter((_, itemIndex) => itemIndex !== index) }))
  const addTool = () => { const value = newTool.trim(); if (value) setContent((current) => ({ ...current, tools: [...current.tools, value] })); setNewTool('') }
  const removeTool = (tool) => setContent((current) => ({ ...current, tools: current.tools.filter((item) => item !== tool) }))
  const updateGallery = (index, field, value) => setContent((current) => ({ ...current, gallery: (current.gallery || []).map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item) }))
  const saveGalleryPhoto = async (item) => {
    const response = await fetch('/api/gallery/photo', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }, body: JSON.stringify({ id: item.id, title: item.title, category: item.category, image: item.image, albumId: item.albumId }) })
    const result = await response.json()
    if (response.ok) { setContent(result); setStatus('Photo saved.') } else setStatus(result.error)
  }
  const moveGalleryPhoto = async (item, albumId) => {
    const nextItem = { ...item, albumId: albumId === '__ungrouped__' ? '' : albumId }
    setContent((current) => ({ ...current, gallery: (current.gallery || []).map((photo) => photo.id === item.id ? nextItem : photo) }))
    await saveGalleryPhoto(nextItem)
  }
  const saveAlbumDetails = async (album) => {
    const response = await fetch('/api/gallery/album', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }, body: JSON.stringify({ id: album.id, title: album.title, description: album.description || '' }) })
    const result = await response.json()
    if (response.ok) { setContent(result); setStatus('Album saved.') } else setStatus(result.error)
  }
  const addAlbum = () => {
    const title = newAlbumName.trim()
    if (!title) return
    const id = `album-${Date.now()}`
    setContent((current) => ({ ...current, galleryAlbums: [...(current.galleryAlbums || []), { id, title, description: newAlbumDescription.trim() }] }))
    setActiveAlbumId(id)
    setNewAlbumName('')
    setNewAlbumDescription('')
  }
  const ungroupedPhotoCount = (content.gallery || []).filter((item) => item.image && !item.albumId).length
  const uploadImage = async (file, onUploaded, folder, albumId) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      const response = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }, body: JSON.stringify({ filename: file.name, data: reader.result, ...(folder && { folder }), ...(albumId && { albumId }) }) })
      const result = await response.json()
      if (response.ok) onUploaded(result.url)
      setStatus(response.ok ? 'Image uploaded. Save changes to publish it.' : result.error)
    }
    reader.readAsDataURL(file)
  }
  const uploadGalleryFiles = (files) => {
    if (!activeAlbumId) { setStatus('Create and select an album before uploading photos.'); return }
    Array.from(files).forEach((file) => uploadImage(file, (url) => setContent((current) => ({ ...current, gallery: [...(current.gallery || []), { ...emptyGalleryItem, id: `gallery-${Date.now()}-${file.name}`, category: 'Gallery', image: url, albumId: activeAlbumId }] })), 'gallery', activeAlbumId))
  }
  const deleteGalleryPhoto = async (id) => {
    if (!window.confirm('Delete this photo permanently?')) return
    const response = await fetch('/api/gallery/photo', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }, body: JSON.stringify({ id }) })
    const result = await response.json()
    if (response.ok) { setContent(result); setStatus('Photo deleted.') } else setStatus(result.error)
  }
  const deleteAlbum = async (id) => {
    if (!window.confirm('Delete this album and every photo in it permanently?')) return
    const response = await fetch('/api/gallery/album', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }, body: JSON.stringify({ id }) })
    const result = await response.json()
    if (response.ok) { setContent(result); setActiveAlbumId(''); setStatus('Album and its photos deleted.') } else setStatus(result.error)
  }
  useEffect(() => { fetch('/api/admin-data', { headers: { Authorization: `Bearer ${authToken}` } }).then((response) => { if (response.status === 401) { onLogout(); return Promise.reject() }; return response.ok ? response.json() : Promise.reject() }).then(setAdminData).catch(() => {}) }, [authToken, onLogout])
  useEffect(() => { if (authUser?.role === 'superadmin') fetch('/api/users', { headers: { Authorization: `Bearer ${authToken}` } }).then((response) => response.ok ? response.json() : Promise.reject()).then(setUsers).catch(() => {}) }, [authToken, authUser])
  const logout = async () => { await fetch('/api/logout', { method: 'POST', headers: { Authorization: `Bearer ${authToken}` } }).catch(() => {}); onLogout() }
  const createUser = async (event) => { event.preventDefault(); const response = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }, body: JSON.stringify(newUser) }); if (response.ok) { setUsers([...users, await response.json()]); setNewUser({ name: '', username: '', password: '', role: 'staff' }) } }
  const resetPassword = async (user) => { const password = window.prompt(`New password for ${user.username}`); if (!password) return; const response = await fetch('/api/users/reset', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }, body: JSON.stringify({ id: user.id, password }) }); if (response.ok) setStatus(`Password reset for ${user.username}`) }
  const save = async () => {
    setStatus('Saving...')
    try {
      const response = await fetch('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` }, body: JSON.stringify(content) })
      if (response.status === 401) { onLogout(); return }
      if (!response.ok) throw new Error('Save failed')
      setStatus('Saved successfully')
    } catch { setStatus('Could not save. Start the backend with npm run backend.') }
  }

  return <main className="admin-shell" data-admin-view={activePanel}><header className="admin-header"><div><p className="eyebrow">CONTENT CONTROL ROOM</p><h1>{activePanel === 'dashboard' ? <>Portfolio <i>dashboard.</i></> : activePanel === 'messages' ? <>Message <i>inbox.</i></> : activePanel === 'users' ? <>User <i>management.</i></> : <>Page <i>settings.</i></>}</h1><p className="admin-status"><span className={apiOnline ? 'online' : ''} />{apiOnline ? 'Backend connected' : 'Backend offline — edits are local until saved'} · {authUser?.name} ({authUser?.role})</p></div><div className="admin-actions"><a href="/" className="admin-back"><ArrowLeft size={16} /> View page</a>{authUser?.role !== 'staff' && <button className="admin-save settings-save" onClick={save}><Save size={16} /> Save changes</button>}<button className="admin-back" onClick={logout}><LogOut size={16} /> Logout</button></div></header>
    <nav className="admin-nav" aria-label="Admin pages"><button className={`admin-icon-button ${activePanel === 'dashboard' ? 'active' : ''}`} onClick={() => setActivePanel('dashboard')} aria-label="Dashboard" title="Dashboard"><LayoutDashboard size={20} /></button><button className={`admin-icon-button ${activePanel === 'messages' ? 'active' : ''}`} onClick={() => setActivePanel('messages')} aria-label="Messages" title="Messages"><Mail size={20} />{adminData.messages.length > 0 && <strong>{adminData.messages.length}</strong>}</button>{authUser?.role !== 'staff' && <button className={`admin-icon-button ${activePanel === 'settings' ? 'active' : ''}`} onClick={() => setActivePanel('settings')} aria-label="Page settings" title="Page settings"><Settings size={20} /></button>}{authUser?.role === 'superadmin' && <button className={`admin-icon-button ${activePanel === 'users' ? 'active' : ''}`} onClick={() => setActivePanel('users')} aria-label="User management" title="User management"><UserRoundCog size={20} /></button>}</nav>
    <section className="admin-metrics"><div><strong>{adminData.visitors.count}</strong><span>Total visitors</span></div><div><strong>{adminData.messages.length}</strong><span>Contact submissions</span></div></section>
    <div className="admin-grid"><section className="admin-card"><p className="eyebrow">PROFILE & HERO</p><div className="admin-fields"><label>Name<input value={content.site.name} onChange={(event) => updateSite('name', event.target.value)} /></label><label>Role<input value={content.site.role} onChange={(event) => updateSite('role', event.target.value)} /></label><label>Hero eyebrow<input value={content.site.eyebrow} onChange={(event) => updateSite('eyebrow', event.target.value)} /></label><label>Hero title<input value={content.site.heroTitle} onChange={(event) => updateSite('heroTitle', event.target.value)} /></label><label>Email<input value={content.site.email} onChange={(event) => updateSite('email', event.target.value)} /></label><label>Location<input value={content.site.location} onChange={(event) => updateSite('location', event.target.value)} /></label><label className="wide">Address / availability<input value={content.site.address || ''} onChange={(event) => updateSite('address', event.target.value)} placeholder="City, country · Available worldwide" /></label><label className="wide">Map URL<input value={content.site.mapUrl || ''} onChange={(event) => updateSite('mapUrl', event.target.value)} placeholder="https://maps.google.com/..." /></label><label className="wide">Bio<textarea value={content.site.bio} onChange={(event) => updateSite('bio', event.target.value)} /></label><label className="wide">Hero description<textarea value={content.site.heroDescription} onChange={(event) => updateSite('heroDescription', event.target.value)} /></label><label className="wide">Profile image URL<input value={content.site.image} onChange={(event) => updateSite('image', event.target.value)} /></label><label className="wide image-upload">Upload profile image<input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files[0], (url) => updateSite('image', url))} /></label></div></section>
      <section className="admin-card office-settings-card"><p className="eyebrow">OFFICE DETAILS</p><h2>Office contact</h2><div className="admin-fields"><label className="wide">Office name<input value={content.site.officeName || ''} onChange={(event) => updateSite('officeName', event.target.value)} placeholder="Your office or company name" /></label><label className="wide">Website URL<input value={content.site.websiteUrl || ''} onChange={(event) => updateSite('websiteUrl', event.target.value)} placeholder="https://your-office-website.com" /></label></div></section>
      <section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">CAREER TIMELINE</p><h2>Add work experience</h2></div><button className="admin-add" onClick={addExperience}><Plus size={16} /> Add role</button></div>{content.experience.map((item, index) => <div className="experience-form" key={`${index}-${item.year}`}><div className="experience-form-top"><span>ROLE {String(index + 1).padStart(2, '0')}</span><button onClick={() => removeExperience(index)} aria-label="Remove role"><Trash2 size={15} /></button></div><div className="admin-fields"><label>Period<input value={item.year} onChange={(event) => updateExperience(index, 'year', event.target.value)} /></label><label>Job title<input value={item.role} onChange={(event) => updateExperience(index, 'role', event.target.value)} /></label><label>Company<input value={item.company} onChange={(event) => updateExperience(index, 'company', event.target.value)} /></label><label className="wide">Description<textarea value={item.text} onChange={(event) => updateExperience(index, 'text', event.target.value)} /></label></div></div>)}</section>
      <section className="admin-card"><p className="eyebrow">SKILLS & SOFTWARE</p><h2>Toolkit</h2><div className="tool-editor">{content.tools.map((tool) => <span key={tool}>{tool}<button onClick={() => removeTool(tool)} aria-label={`Remove ${tool}`}>×</button></span>)}</div><div className="add-tool"><input value={newTool} placeholder="e.g. Selenium testing" onChange={(event) => setNewTool(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addTool()} /><button onClick={addTool}><Plus size={16} /> Add skill</button></div></section>
      <section className="admin-card"><div className="admin-card-heading"><div><p className="eyebrow">VISUAL STORY</p><h2>Gallery albums</h2></div></div><div className="album-create"><input value={newAlbumName} placeholder="Album name, e.g. Team events" onChange={(event) => setNewAlbumName(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && addAlbum()} /><button className="admin-add" onClick={addAlbum}><Plus size={16} /> Create album</button></div><label className="album-description">Album description<textarea value={newAlbumDescription} placeholder="A short description for this album" onChange={(event) => setNewAlbumDescription(event.target.value)} /></label><div className="album-list">{(content.galleryAlbums || []).map((album) => <span key={album.id}><button className={activeAlbumId === album.id ? 'active' : ''} onClick={() => setActiveAlbumId(album.id)}>{album.title}</button><button className="album-delete" onClick={() => deleteAlbum(album.id)} aria-label={`Delete ${album.title}`}><Trash2 size={14} /></button></span>)}{ungroupedPhotoCount > 0 && <button className={activeAlbumId === '__ungrouped__' ? 'active' : ''} onClick={() => setActiveAlbumId('__ungrouped__')}>Ungrouped photos ({ungroupedPhotoCount})</button>}</div>{activeAlbumId === '__ungrouped__' ? <p className="album-help">These photos are not in any album and still show on your page. Edit or delete them here, or use the album dropdown on each photo to move one into an album.</p> : activeAlbumId ? <div><div className="admin-fields"><label>Album title<input value={(content.galleryAlbums || []).find((album) => album.id === activeAlbumId)?.title || ''} onChange={(event) => setContent((current) => ({ ...current, galleryAlbums: (current.galleryAlbums || []).map((album) => album.id === activeAlbumId ? { ...album, title: event.target.value } : album) }))} /></label><label className="wide">Album description<input value={(content.galleryAlbums || []).find((album) => album.id === activeAlbumId)?.description || ''} onChange={(event) => setContent((current) => ({ ...current, galleryAlbums: (current.galleryAlbums || []).map((album) => album.id === activeAlbumId ? { ...album, description: event.target.value } : album) }))} placeholder="Shown under the album title on your page" /></label><button className="admin-add upload-gallery-button" onClick={() => saveAlbumDetails((content.galleryAlbums || []).find((album) => album.id === activeAlbumId))}><Save size={16} /> Save album</button><label className="admin-add upload-gallery-button"><Plus size={16} /> Upload photos to selected album<input type="file" accept="image/*" multiple onChange={(event) => uploadGalleryFiles(event.target.files)} /></label></div></div> : <p className="album-help">Create an album, then select it to upload photos.</p>}<div className="gallery-editor">{(content.gallery || []).filter((item) => item.image && (activeAlbumId === '__ungrouped__' ? !item.albumId : item.albumId === activeAlbumId)).map((item, index) => <div className="gallery-edit-item" key={item.id}><div className="experience-form-top"><span>PHOTO {String(index + 1).padStart(2, '0')}</span><button onClick={() => deleteGalleryPhoto(item.id)} aria-label="Delete gallery photo"><Trash2 size={15} /></button></div><div className="admin-fields"><label>Photo caption (optional)<input value={item.title} onChange={(event) => updateGallery((content.gallery || []).indexOf(item), 'title', event.target.value)} placeholder="Optional caption" /></label><label>Category<input value={item.category} onChange={(event) => updateGallery((content.gallery || []).indexOf(item), 'category', event.target.value)} placeholder="Category" /></label><label>Album<select value={item.albumId || activeAlbumId} onChange={(event) => moveGalleryPhoto(item, event.target.value)}>{activeAlbumId === '__ungrouped__' && <option value="__ungrouped__">No album (shows as "Gallery")</option>}{(content.galleryAlbums || []).map((album) => <option key={album.id} value={album.id}>{album.title}</option>)}</select></label><label className="wide image-upload">Replace photo<input type="file" accept="image/*" onChange={(event) => uploadImage(event.target.files[0], (url) => updateGallery((content.gallery || []).indexOf(item), 'image', url), item.albumId ? 'gallery' : undefined, item.albumId || activeAlbumId)} /></label><button className="admin-add upload-gallery-button" onClick={() => saveGalleryPhoto(item)}><Save size={16} /> Save photo</button></div></div>)}</div></section>
      <section className="admin-card"><p className="eyebrow">CONTACT FORM INBOX</p><h2>Contact submissions</h2>{adminData.messages.length === 0 ? <p className="empty-inbox">No contact submissions yet.</p> : adminData.messages.map((item) => <article className="message-item" key={item.id}><div><strong>{item.name}</strong><a href={`mailto:${item.email}`}>{item.email}</a></div><p>{item.message}</p><small>{new Date(item.createdAt).toLocaleString()}</small></article>)}</section>
      {authUser?.role === 'superadmin' && <section className="admin-card"><p className="eyebrow">TEAM ACCESS</p><h2>Manage users</h2><form className="user-create-form" onSubmit={createUser}><input aria-label="Staff name" placeholder="Full name" value={newUser.name} onChange={(event) => setNewUser({ ...newUser, name: event.target.value })} required /><input aria-label="Username" placeholder="Username" value={newUser.username} onChange={(event) => setNewUser({ ...newUser, username: event.target.value })} required /><input aria-label="Temporary password" placeholder="Temporary password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} required /><select aria-label="User role" value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}><option value="staff">Staff</option><option value="admin">Admin</option></select><button className="admin-save" type="submit"><Plus size={16} /> Create account</button></form><div className="user-list">{users.map((user) => <div className="user-row" key={user.id}><span><strong>{user.name}</strong><small>{user.username} · {user.role}</small></span><button className="admin-back" onClick={() => resetPassword(user)}>Reset password</button></div>)}</div></section>}
    </div>{status && <p className="save-status">{status}</p>}</main>
}

export default AdminEditor
